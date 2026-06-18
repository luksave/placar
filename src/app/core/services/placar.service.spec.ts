import { TestBed } from '@angular/core/testing';
import { SCORING_CONFIG } from '../config/scoring.config';
import { PlacarService } from './placar.service';

describe('PlacarService', () => {
  let service: PlacarService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PlacarService);
  });

  it('should start with zero scores', () => {
    const estado = service.estado();
    expect(estado.pontosA).toBe(0);
    expect(estado.pontosB).toBe(0);
    expect(estado.setsA).toBe(0);
    expect(estado.setsB).toBe(0);
    expect(estado.setAtual).toBe(1);
    expect(estado.ladoEsquerda).toBe('A');
  });

  it('should score left side based on ladoEsquerda', () => {
    service.pontoEsquerda();
    expect(service.estado().pontosA).toBe(1);

    service.inverterLados();
    service.pontoEsquerda();
    expect(service.estado().pontosB).toBe(1);
    expect(service.estado().pontosA).toBe(1);
  });

  it('should score right side opposite to left', () => {
    service.pontoDireita();
    expect(service.estado().pontosB).toBe(1);
  });

  it('should win set at 21 with 2 point lead', () => {
    for (let i = 0; i < 21; i++) {
      service.pontoEsquerda();
    }

    const estado = service.estado();
    expect(estado.setsA).toBe(1);
    expect(estado.pontosA).toBe(0);
    expect(estado.pontosB).toBe(0);
    expect(estado.setAtual).toBe(2);
  });

  it('should require win by 2 at 20-20', () => {
    for (let i = 0; i < 20; i++) {
      service.pontoEsquerda();
    }
    for (let i = 0; i < 20; i++) {
      service.pontoDireita();
    }

    expect(service.estado().setsA).toBe(0);
    expect(service.estado().pontosA).toBe(20);
    expect(service.estado().pontosB).toBe(20);

    service.pontoEsquerda();
    service.pontoEsquerda();
    expect(service.estado().setsA).toBe(1);
    expect(service.estado().pontosA).toBe(0);
  });

  it('should end match when team wins 2 sets', () => {
    for (let set = 0; set < SCORING_CONFIG.setsParaVencer; set++) {
      for (let i = 0; i < 21; i++) {
        service.pontoEsquerda();
      }
    }

    const estado = service.estado();
    expect(estado.setsA).toBe(2);
    expect(estado.status).toBe('encerrada');
    expect(service.vencedor()).toBe('A');
  });

  it('should undo last point', () => {
    service.pontoEsquerda();
    service.pontoDireita();
    service.desfazer();

    const estado = service.estado();
    expect(estado.pontosA).toBe(1);
    expect(estado.pontosB).toBe(0);
    expect(estado.historico.length).toBe(1);
  });

  it('should undo set-winning point and restore set state', () => {
    for (let i = 0; i < 21; i++) {
      service.pontoEsquerda();
    }
    expect(service.estado().setsA).toBe(1);

    service.desfazer();
    const estado = service.estado();
    expect(estado.setsA).toBe(0);
    expect(estado.pontosA).toBe(20);
    expect(estado.setAtual).toBe(1);
  });

  it('should reset rally score on novoSet without changing sets', () => {
    service.pontoEsquerda();
    service.pontoDireita();
    service.novoSet();

    const estado = service.estado();
    expect(estado.pontosA).toBe(0);
    expect(estado.pontosB).toBe(0);
    expect(estado.setsA).toBe(0);
    expect(estado.setsB).toBe(0);
  });

  it('should swap sides without changing scores', () => {
    service.pontoEsquerda();
    service.inverterLados();

    expect(service.estado().ladoEsquerda).toBe('B');
    expect(service.estado().pontosA).toBe(1);
  });

  it('should end match manually', () => {
    service.encerrarPartida();
    expect(service.estado().status).toBe('encerrada');
  });

  it('should not score when match is ended', () => {
    service.encerrarPartida();
    service.pontoEsquerda();
    expect(service.estado().pontosA).toBe(0);
  });

  it('should record history with timestamp', () => {
    service.pontoEsquerda();
    const historico = service.estado().historico;
    expect(historico.length).toBe(1);
    expect(historico[0].time).toBe('A');
    expect(historico[0].momento).toMatch(/\d{2}:\d{2}:\d{2}/);
  });

  it('should reset on novaPartida', () => {
    service.pontoEsquerda();
    service.novaPartida();
    const estado = service.estado();
    expect(estado.pontosA).toBe(0);
    expect(estado.historico.length).toBe(0);
    expect(estado.status).toBe('em_andamento');
  });
});
