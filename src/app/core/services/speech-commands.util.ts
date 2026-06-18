import { ComandoVoz } from '../models/placar.models';

const NOVO_SET_PATTERN = /novo\s*(set|7|sete|sect|sept)\b/g;
const RAIZ_PONTO = '(?:ponto|conto|pontu(?:a(?:r)?)?)';
const PONTO_B_PATTERN = new RegExp(`${RAIZ_PONTO}\\s*\\.?\\s*b\\b|(?<![a-z.])\\.b\\b`, 'g');
/** "pontuar" / "pontua" sem letra = confusão comum do motor de voz para "ponto a" */
const PONTO_A_PATTERN = new RegExp(
  `${RAIZ_PONTO}\\s*\\.?\\s*a\\b|(?<![a-z.])\\.a\\b|\\bpontua?r?\\b(?!\\s*\\.?\\s*[ab]\\b)`,
  'g',
);

interface MatchComando {
  index: number;
  length: number;
  comando: ComandoVoz;
}

export function normalizarTranscricao(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function coletarMatches(regex: RegExp, texto: string, comando: ComandoVoz): MatchComando[] {
  const matches: MatchComando[] = [];
  const re = new RegExp(regex.source, regex.flags.includes('g') ? regex.flags : `${regex.flags}g`);

  for (const match of texto.matchAll(re)) {
    if (match.index === undefined) {
      continue;
    }
    matches.push({ index: match.index, length: match[0].length, comando });
  }

  return matches;
}

/** Extrai todos os comandos reconhecidos em ordem, inclusive em frases mescladas pelo motor de voz. */
export function identificarComandos(texto: string): ComandoVoz[] {
  const normalizado = normalizarTranscricao(texto);
  const matches: MatchComando[] = [
    ...coletarMatches(/encerrar partida/g, normalizado, 'encerrar_partida'),
    ...coletarMatches(/inverter lados/g, normalizado, 'inverter_lados'),
    ...coletarMatches(NOVO_SET_PATTERN, normalizado, 'novo_set'),
    ...coletarMatches(PONTO_A_PATTERN, normalizado, 'ponto_a'),
    ...coletarMatches(PONTO_B_PATTERN, normalizado, 'ponto_b'),
    ...coletarMatches(/\bdesfazer\b/g, normalizado, 'desfazer'),
  ];

  matches.sort((a, b) => a.index - b.index || b.length - a.length);

  const filtrados: MatchComando[] = [];
  let ultimoFim = -1;

  for (const match of matches) {
    if (match.index >= ultimoFim) {
      filtrados.push(match);
      ultimoFim = match.index + match.length;
    }
  }

  return filtrados.map((match) => match.comando);
}
