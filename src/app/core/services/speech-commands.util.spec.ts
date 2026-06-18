import { identificarComandos } from './speech-commands.util';

describe('identificarComandos', () => {
  it('should recognize a single point command', () => {
    expect(identificarComandos('ponto a')).toEqual(['ponto_a']);
    expect(identificarComandos('ponto b')).toEqual(['ponto_b']);
  });

  it('should recognize repeated same commands', () => {
    expect(identificarComandos('ponto a ponto a')).toEqual(['ponto_a', 'ponto_a']);
  });

  it('should recognize alternating point commands', () => {
    expect(identificarComandos('ponto a ponto b')).toEqual(['ponto_a', 'ponto_b']);
  });

  it('should recognize merged transcript with shorthand B', () => {
    expect(identificarComandos('ponto a .b')).toEqual(['ponto_a', 'ponto_b']);
  });

  it('should recognize conto variations', () => {
    expect(identificarComandos('conto a conto b')).toEqual(['ponto_a', 'ponto_b']);
  });

  it('should recognize pontuar misrecognitions as ponto a', () => {
    expect(identificarComandos('pontuar')).toEqual(['ponto_a']);
    expect(identificarComandos('pontua')).toEqual(['ponto_a']);
    expect(identificarComandos('pontuar a')).toEqual(['ponto_a']);
  });

  it('should recognize pontuar b as ponto b', () => {
    expect(identificarComandos('pontuar b')).toEqual(['ponto_b']);
    expect(identificarComandos('pontuar pontuar b')).toEqual(['ponto_a', 'ponto_b']);
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
