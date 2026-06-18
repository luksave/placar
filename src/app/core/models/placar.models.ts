export type Time = 'A' | 'B';
export type StatusPartida = 'em_andamento' | 'set_pausado' | 'encerrada';

export interface EstadoSnapshot {
  pontosA: number;
  pontosB: number;
  setsA: number;
  setsB: number;
  setAtual: number;
  status: StatusPartida;
}

export interface HistoricoPonto {
  time: Time;
  momento: string;
  anterior: EstadoSnapshot;
}

export interface EstadoPartida extends EstadoSnapshot {
  ladoEsquerda: Time;
  historico: HistoricoPonto[];
}

export type ComandoVoz =
  | 'ponto_a'
  | 'ponto_b'
  | 'desfazer'
  | 'novo_set'
  | 'inverter_lados'
  | 'encerrar_partida';
