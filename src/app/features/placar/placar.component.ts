import { Component, OnDestroy, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Button } from 'primeng/button';
import { Tag } from 'primeng/tag';
import { Toast } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { SCORING_CONFIG } from '../../core/config/scoring.config';
import { Time } from '../../core/models/placar.models';
import { PlacarService } from '../../core/services/placar.service';
import { SpeechRecognitionService } from '../../core/services/speech-recognition.service';
import { WakeLockService } from '../../core/services/wake-lock.service';

@Component({
  selector: 'app-placar',
  imports: [CommonModule, Button, Tag, Toast],
  providers: [MessageService],
  templateUrl: './placar.component.html',
  styleUrl: './placar.component.scss',
})
export class PlacarComponent implements OnDestroy {
  private readonly placarService = inject(PlacarService);
  private readonly speechService = inject(SpeechRecognitionService);
  private readonly wakeLockService = inject(WakeLockService);
  private readonly messageService = inject(MessageService);

  readonly maxSets = SCORING_CONFIG.maxSets;
  readonly iniciado = signal(false);

  readonly estado = this.placarService.estado;
  readonly vencedor = this.placarService.vencedor;
  readonly partidaEncerrada = this.placarService.partidaEncerrada;

  readonly suportadoVoz = this.speechService.suportado;
  readonly ouvindo = this.speechService.ouvindo;
  readonly erroVoz = this.speechService.erro;
  readonly ultimoTexto = this.speechService.ultimoTexto;
  readonly statusVoz = this.speechService.status;
  readonly permissaoConcedida = this.speechService.permissaoConcedida;

  readonly iniciando = signal(false);

  constructor() {
    effect(() => {
      const evento = this.placarService.ultimoEvento();
      if (!evento || !this.iniciado()) {
        return;
      }

      switch (evento.tipo) {
        case 'set_vencido':
          this.messageService.add({
            severity: 'info',
            summary: 'Set encerrado',
            detail: `Time ${evento.vencedor} venceu o set!`,
            life: 2500,
          });
          break;
        case 'partida_encerrada':
          this.messageService.add({
            severity: 'success',
            summary: 'Partida encerrada',
            detail: evento.vencedor
              ? `Time ${evento.vencedor} venceu a partida!`
              : 'Partida finalizada.',
            life: 4000,
          });
          this.speechService.parar();
          break;
      }
    });
  }

  ngOnDestroy(): void {
    this.speechService.parar();
    void this.wakeLockService.liberar();
  }

  async iniciarPartida(): Promise<void> {
    if (this.iniciando()) {
      return;
    }

    this.iniciando.set(true);

    if (!this.suportadoVoz()) {
      this.iniciado.set(true);
      this.iniciando.set(false);
      return;
    }

    const permitido = await this.speechService.solicitarPermissaoMicrofone();
    this.iniciado.set(true);

    if (permitido) {
      this.speechService.iniciar();
    }

    void this.wakeLockService.solicitar();
    this.iniciando.set(false);
  }

  async novaPartida(): Promise<void> {
    this.placarService.novaPartida();

    if (this.suportadoVoz()) {
      const permitido = await this.speechService.solicitarPermissaoMicrofone();
      if (permitido) {
        this.speechService.iniciar();
      }
    }

    void this.wakeLockService.solicitar();
  }

  async alternarMicrofone(): Promise<void> {
    if (this.speechService.estaPausado()) {
      const permitido = await this.speechService.solicitarPermissaoMicrofone();
      if (permitido) {
        this.speechService.iniciar();
      }
    } else {
      this.speechService.parar();
    }
  }

  pontoEsquerda(): void {
    this.placarService.pontoEsquerda();
  }

  pontoEsquerdaBtn(event: Event): void {
    event.stopPropagation();
    this.pontoEsquerda();
  }

  pontoDireita(): void {
    this.placarService.pontoDireita();
  }

  pontoDireitaBtn(event: Event): void {
    event.stopPropagation();
    this.pontoDireita();
  }

  desfazer(): void {
    this.placarService.desfazer();
  }

  novoSet(): void {
    this.placarService.novoSet();
  }

  inverterLados(): void {
    this.placarService.inverterLados();
  }

  encerrarPartida(): void {
    this.placarService.encerrarPartida();
  }

  timeEsquerda(): Time {
    return this.estado().ladoEsquerda;
  }

  timeDireita(): Time {
    return this.estado().ladoEsquerda === 'A' ? 'B' : 'A';
  }

  pontosEsquerda(): number {
    return this.placarService.pontosDoTime(this.timeEsquerda());
  }

  pontosDireita(): number {
    return this.placarService.pontosDoTime(this.timeDireita());
  }

  setsEsquerda(): number {
    return this.placarService.setsDoTime(this.timeEsquerda());
  }

  setsDireita(): number {
    return this.placarService.setsDoTime(this.timeDireita());
  }

  labelTime(time: Time): string {
    return `Time ${time}`;
  }

  statusMicrofone(): { label: string; severity: 'success' | 'warn' | 'danger' | 'secondary' } {
    if (this.erroVoz()) {
      return { label: 'Microfone negado', severity: 'danger' };
    }
    if (!this.suportadoVoz()) {
      return { label: 'Use Chrome ou Edge', severity: 'secondary' };
    }
    if (this.ouvindo()) {
      return { label: 'Ouvindo...', severity: 'success' };
    }
    if (!this.permissaoConcedida()) {
      return { label: 'Aguardando permissão', severity: 'warn' };
    }
    return { label: 'Pausado', severity: 'warn' };
  }
}
