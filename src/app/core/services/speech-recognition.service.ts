import { Injectable, OnDestroy, inject, signal } from '@angular/core';
import { ComandoVoz } from '../models/placar.models';
import { PlacarService } from './placar.service';

interface SpeechRecognitionResultLike {
  isFinal: boolean;
  0: { transcript: string };
  length: number;
}

interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: SpeechRecognitionResultList & {
    [index: number]: SpeechRecognitionResultLike;
  };
}

interface SpeechRecognitionErrorEventLike {
  error: string;
  message?: string;
}

interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

declare global {
  interface Window {
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
    SpeechRecognition?: SpeechRecognitionConstructor;
  }
}

const COMANDOS: { frase: string; comando: ComandoVoz }[] = [
  { frase: 'encerrar partida', comando: 'encerrar_partida' },
  { frase: 'inverter lados', comando: 'inverter_lados' },
  { frase: 'desfazer', comando: 'desfazer' },
];

/** Variações comuns do reconhecimento de voz */
const NOVO_SET_PATTERN = /novo\s*(set|7|sete|sect|sept)\b/;
const PONTO_A_PATTERN = /(?:ponto|conto)\s*\.?\s*a\b|\.a\b/;
const PONTO_B_PATTERN = /(?:ponto|conto)\s*\.?\s*b\b|\.b\b/;

const DEBOUNCE_MS = 800;

@Injectable({ providedIn: 'root' })
export class SpeechRecognitionService implements OnDestroy {
  private readonly placarService = inject(PlacarService);

  private recognition: SpeechRecognitionLike | null = null;
  private pausado = true;
  private ultimoComando = '';
  private ultimoComandoEm = 0;
  private reiniciarTimeout: ReturnType<typeof setTimeout> | null = null;

  readonly suportado = signal(this.verificarSuporte());
  readonly ouvindo = signal(false);
  readonly permissaoConcedida = signal(false);
  readonly erro = signal<string | null>(null);
  readonly ultimoTexto = signal<string | null>(null);
  readonly status = signal<string | null>(null);

  ngOnDestroy(): void {
    this.parar();
  }

  /**
   * Solicita permissão de microfone explicitamente (mostra o diálogo do navegador).
   * Deve ser chamado a partir de um clique/toque do usuário.
   */
  async solicitarPermissaoMicrofone(): Promise<boolean> {
    if (!navigator.mediaDevices?.getUserMedia) {
      return true;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      this.permissaoConcedida.set(true);
      this.erro.set(null);
      return true;
    } catch {
      this.permissaoConcedida.set(false);
      this.erro.set('Permissão de microfone negada. Clique no cadeado na barra de endereço e permita o microfone.');
      return false;
    }
  }

  iniciar(): void {
    if (!this.suportado()) {
      this.erro.set('Reconhecimento de voz não suportado. Use Chrome ou Edge.');
      return;
    }

    this.pausado = false;
    this.erro.set(null);
    this.status.set('Iniciando...');
    this.configurarReconhecimento();
    this.iniciarReconhecimento();
  }

  parar(): void {
    this.pausado = true;
    this.ouvindo.set(false);
    this.status.set('Pausado');
    this.limparReinicio();

    if (this.recognition) {
      this.recognition.onend = null;
      try {
        this.recognition.abort();
      } catch {
        this.recognition.stop();
      }
      this.recognition = null;
    }
  }

  alternarPausa(): void {
    if (this.pausado) {
      this.iniciar();
    } else {
      this.parar();
    }
  }

  estaPausado(): boolean {
    return this.pausado;
  }

  private verificarSuporte(): boolean {
    return typeof window !== 'undefined' && !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  }

  private configurarReconhecimento(): void {
    const Construtor = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Construtor) {
      return;
    }

    this.recognition = new Construtor();
    this.recognition.lang = 'pt-BR';
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.maxAlternatives = 1;

    this.recognition.onstart = () => {
      this.ouvindo.set(true);
      this.status.set('Ouvindo... fale um comando');
      this.erro.set(null);
    };

    this.recognition.onresult = (event) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const resultado = event.results[i];
        const texto = resultado[0].transcript.toLowerCase().trim();

        if (!resultado.isFinal) {
          this.ultimoTexto.set(`${texto}…`);
          continue;
        }

        this.ultimoTexto.set(texto);
        this.processarTexto(texto);
      }
    };

    this.recognition.onerror = (event) => {
      switch (event.error) {
        case 'not-allowed':
          this.erro.set('Microfone bloqueado. Permita o acesso nas configurações do navegador.');
          this.permissaoConcedida.set(false);
          this.pausado = true;
          this.ouvindo.set(false);
          break;
        case 'no-speech':
          this.status.set('Nenhuma fala detectada — tente novamente');
          break;
        case 'network':
          this.erro.set('Erro de rede. O reconhecimento de voz precisa de internet (Chrome).');
          break;
        case 'aborted':
          break;
        default:
          this.erro.set(`Erro: ${event.error}`);
      }
    };

    this.recognition.onend = () => {
      this.ouvindo.set(false);
      if (!this.pausado) {
        this.status.set('Reconectando microfone...');
        this.agendarReinicio();
      }
    };
  }

  private iniciarReconhecimento(): void {
    if (!this.recognition) {
      return;
    }

    try {
      this.recognition.start();
    } catch (err) {
      const mensagem = err instanceof Error ? err.message : 'falha ao iniciar';
      if (mensagem.includes('already started')) {
        this.ouvindo.set(true);
        return;
      }
      this.agendarReinicio();
    }
  }

  private agendarReinicio(): void {
    this.limparReinicio();
    this.reiniciarTimeout = setTimeout(() => {
      if (!this.pausado) {
        this.configurarReconhecimento();
        this.iniciarReconhecimento();
      }
    }, 400);
  }

  private limparReinicio(): void {
    if (this.reiniciarTimeout) {
      clearTimeout(this.reiniciarTimeout);
      this.reiniciarTimeout = null;
    }
  }

  private processarTexto(texto: string): void {
    const comando = this.identificarComando(texto);
    if (!comando) {
      this.status.set(`Ouvido: "${texto}" — comando não reconhecido`);
      return;
    }

    const agora = Date.now();
    if (comando === this.ultimoComando && agora - this.ultimoComandoEm < DEBOUNCE_MS) {
      return;
    }

    this.ultimoComando = comando;
    this.ultimoComandoEm = agora;
    this.status.set(`Comando: ${comando.replace('_', ' ')}`);
    this.executarComando(comando);
  }

  private identificarComando(texto: string): ComandoVoz | null {
    const normalizado = texto
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    if (NOVO_SET_PATTERN.test(normalizado)) {
      return 'novo_set';
    }

    if (PONTO_A_PATTERN.test(normalizado)) {
      return 'ponto_a';
    }

    if (PONTO_B_PATTERN.test(normalizado)) {
      return 'ponto_b';
    }

    for (const item of COMANDOS) {
      if (normalizado.includes(item.frase)) {
        return item.comando;
      }
    }
    return null;
  }

  private executarComando(comando: ComandoVoz): void {
    switch (comando) {
      case 'ponto_a':
        this.placarService.pontoTimeA();
        break;
      case 'ponto_b':
        this.placarService.pontoTimeB();
        break;
      case 'desfazer':
        this.placarService.desfazer();
        break;
      case 'novo_set':
        this.placarService.novoSet();
        break;
      case 'inverter_lados':
        this.placarService.inverterLados();
        break;
      case 'encerrar_partida':
        this.placarService.encerrarPartida();
        break;
    }
  }
}
