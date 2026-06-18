import { identificarComandos, labelComando } from './speech-commands.util';

describe('identificarComandos', () => {
  it('should recognize time 1 and time 2', () => {
    expect(identificarComandos('time 1')).toEqual(['ponto_a']);
    expect(identificarComandos('time 2')).toEqual(['ponto_b']);
  });

  it('should recognize time um and time dois', () => {
    expect(identificarComandos('time um')).toEqual(['ponto_a']);
    expect(identificarComandos('time dois')).toEqual(['ponto_b']);
  });

  it('should recognize repeated and alternating commands', () => {
    expect(identificarComandos('time 1 time 1')).toEqual(['ponto_a', 'ponto_a']);
    expect(identificarComandos('time 1 time 2')).toEqual(['ponto_a', 'ponto_b']);
    expect(identificarComandos('time um time dois')).toEqual(['ponto_a', 'ponto_b']);
  });

  it('should not recognize legacy ponto commands', () => {
    expect(identificarComandos('ponto a')).toEqual([]);
    expect(identificarComandos('pontuar')).toEqual([]);
  });

  it('should recognize phrase commands', () => {
    expect(identificarComandos('inverter lados')).toEqual(['inverter_lados']);
    expect(identificarComandos('encerrar partida')).toEqual(['encerrar_partida']);
    expect(identificarComandos('desfazer')).toEqual(['desfazer']);
  });

  it('should recognize novo set variations', () => {
    expect(identificarComandos('novo set')).toEqual(['novo_set']);
    expect(identificarComandos('novo 7')).toEqual(['novo_set']);
  });

  it('should return empty for unrecognized text', () => {
    expect(identificarComandos('olá mundo')).toEqual([]);
  });
});

describe('labelComando', () => {
  it('should label point commands as time 1 and time 2', () => {
    expect(labelComando('ponto_a')).toBe('time 1');
    expect(labelComando('ponto_b')).toBe('time 2');
  });
});
