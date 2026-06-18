import { Injectable, computed, signal } from '@angular/core';
import { SCORING_CONFIG } from '../config/scoring.config';
import {
  EstadoPartida,
  EstadoSnapshot,
  HistoricoPonto,
  StatusPartida,
  Time,
} from '../models/placar.models';

export interface EventoPlacar {
  tipo: 'ponto' | 'set_vencido' | 'partida_encerrada' | 'desfeito' | 'novo_set' | 'lados_invertidos';
  time?: Time;
  vencedor?: Time;
}

@Injectable({ providedIn: 'root' })
export class PlacarService {
  private readonly estadoSignal = signal<EstadoPartida>(this.criarEstadoInicial());

  readonly estado = this.estadoSignal.asReadonly();
  readonly partidaEncerrada = computed(() => this.estado().status === 'encerrada');
  readonly vencedor = computed<Time | null>(() => {
    const { setsA, setsB, status } = this.estado();
    if (status !== 'encerrada') {
      return null;
    }
    if (setsA > setsB) {
      return 'A';
    }
    if (setsB > setsA) {
      return 'B';
    }
    return null;
  });

  private ultimoEventoSignal = signal<EventoPlacar | null>(null);
  readonly ultimoEvento = this.ultimoEventoSignal.asReadonly();

  pontoTimeA(): void {
    this.registrarPonto('A');
  }

  pontoTimeB(): void {
    this.registrarPonto('B');
  }

  pontoEsquerda(): void {
    this.registrarPonto(this.estado().ladoEsquerda);
  }

  pontoDireita(): void {
    const lado = this.estado().ladoEsquerda === 'A' ? 'B' : 'A';
    this.registrarPonto(lado);
  }

  desfazer(): boolean {
    const estado = this.estado();
    if (estado.historico.length === 0 || estado.status === 'encerrada') {
      return false;
    }

    const historico = [...estado.historico];
    const ultimo = historico.pop()!;
    const { anterior } = ultimo;

    this.estadoSignal.set({
      ...estado,
      ...anterior,
      historico,
    });
    this.ultimoEventoSignal.set({ tipo: 'desfeito', time: ultimo.time });
    return true;
  }

  novoSet(): void {
    const estado = this.estado();
    if (estado.status === 'encerrada') {
      return;
    }

    this.estadoSignal.set({
      ...estado,
      pontosA: 0,
      pontosB: 0,
      status: 'em_andamento',
    });
    this.ultimoEventoSignal.set({ tipo: 'novo_set' });
  }

  inverterLados(): void {
    const estado = this.estado();
    if (estado.status === 'encerrada') {
      return;
    }

    this.estadoSignal.set({
      ...estado,
      ladoEsquerda: estado.ladoEsquerda === 'A' ? 'B' : 'A',
    });
    this.ultimoEventoSignal.set({ tipo: 'lados_invertidos' });
  }

  encerrarPartida(): void {
    const estado = this.estado();
    if (estado.status === 'encerrada') {
      return;
    }

    this.estadoSignal.set({ ...estado, status: 'encerrada' });
    this.ultimoEventoSignal.set({
      tipo: 'partida_encerrada',
      vencedor: this.calcularVencedorAtual(estado.setsA, estado.setsB),
    });
  }

  novaPartida(): void {
    this.estadoSignal.set(this.criarEstadoInicial());
    this.ultimoEventoSignal.set(null);
  }

  pontosDoTime(time: Time): number {
    const estado = this.estado();
    return time === 'A' ? estado.pontosA : estado.pontosB;
  }

  setsDoTime(time: Time): number {
    const estado = this.estado();
    return time === 'A' ? estado.setsA : estado.setsB;
  }

  private registrarPonto(time: Time): void {
    const estado = this.estado();
    if (estado.status === 'encerrada') {
      return;
    }

    const anterior = this.criarSnapshot(estado);
    const historico: HistoricoPonto[] = [
      ...estado.historico,
      { time, momento: this.formatarMomento(), anterior },
    ];

    let pontosA = estado.pontosA;
    let pontosB = estado.pontosB;
    let setsA = estado.setsA;
    let setsB = estado.setsB;
    let setAtual = estado.setAtual;
    let status: StatusPartida = 'em_andamento';

    if (time === 'A') {
      pontosA++;
    } else {
      pontosB++;
    }

    if (this.venceuSet(pontosA, pontosB)) {
      setsA++;
      pontosA = 0;
      pontosB = 0;
      setAtual = Math.min(setAtual + 1, SCORING_CONFIG.maxSets);
      this.ultimoEventoSignal.set({ tipo: 'set_vencido', time: 'A', vencedor: 'A' });

      if (setsA >= SCORING_CONFIG.setsParaVencer) {
        status = 'encerrada';
        this.ultimoEventoSignal.set({ tipo: 'partida_encerrada', vencedor: 'A' });
      }
    } else if (this.venceuSet(pontosB, pontosA)) {
      setsB++;
      pontosA = 0;
      pontosB = 0;
      setAtual = Math.min(setAtual + 1, SCORING_CONFIG.maxSets);
      this.ultimoEventoSignal.set({ tipo: 'set_vencido', time: 'B', vencedor: 'B' });

      if (setsB >= SCORING_CONFIG.setsParaVencer) {
        status = 'encerrada';
        this.ultimoEventoSignal.set({ tipo: 'partida_encerrada', vencedor: 'B' });
      }
    } else {
      this.ultimoEventoSignal.set({ tipo: 'ponto', time });
    }

    this.estadoSignal.set({
      ...estado,
      pontosA,
      pontosB,
      setsA,
      setsB,
      setAtual,
      status,
      historico,
    });
  }

  private venceuSet(pontos: number, pontosOponente: number): boolean {
    return (
      pontos >= SCORING_CONFIG.pontosPorSet &&
      pontos - pontosOponente >= SCORING_CONFIG.vantagemMinima
    );
  }

  private calcularVencedorAtual(setsA: number, setsB: number): Time | undefined {
    if (setsA > setsB) {
      return 'A';
    }
    if (setsB > setsA) {
      return 'B';
    }
    return undefined;
  }

  private criarSnapshot(estado: EstadoPartida): EstadoSnapshot {
    return {
      pontosA: estado.pontosA,
      pontosB: estado.pontosB,
      setsA: estado.setsA,
      setsB: estado.setsB,
      setAtual: estado.setAtual,
      status: estado.status,
    };
  }

  private criarEstadoInicial(): EstadoPartida {
    return {
      pontosA: 0,
      pontosB: 0,
      setsA: 0,
      setsB: 0,
      setAtual: 1,
      ladoEsquerda: 'A',
      status: 'em_andamento',
      historico: [],
    };
  }

  private formatarMomento(): string {
    return new Date().toLocaleTimeString('pt-BR', { hour12: false });
  }
}
