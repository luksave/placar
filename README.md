# Placar Vôlei

Placar de vôlei de praia para tablet, com controle por toque e comandos de voz.

**Demo:** [https://luksave.github.io/placar/](https://luksave.github.io/placar/)

## Como funciona

1. Na tela inicial, toque em qualquer lugar para iniciar a partida.
2. O navegador pede permissão de microfone (necessário para os comandos de voz).
3. Dois times (**Time 1** e **Time 2**) são exibidos à esquerda e à direita da tela.
4. Toque na coluna de um time ou no botão **+1** para marcar ponto.
5. Quando um time vence o set, os pontos zeram automaticamente e o contador de sets avança.
6. A partida termina quando um time vence 2 sets (melhor de 3).
7. Durante a partida, o app mantém a tela ligada (Wake Lock).

O estado da partida fica em memória — fechar ou recarregar o app reseta o placar.

## Regras de pontuação

| Regra | Valor |
|---|---|
| Sets por partida | 3 (melhor de 3) |
| Sets para vencer | 2 |
| Pontos por set | 21 |
| Vantagem mínima | 2 pontos |

Exemplo: 21 x 19 encerra o set; 21 x 20 continua até alguém abrir 2 pontos de vantagem.

## Controles na tela

| Controle | Ação |
|---|---|
| Toque na coluna / **+1** | Marca 1 ponto para o time daquele lado |
| **Desfazer** | Desfaz o último ponto (com histórico) |
| **Novo Set** | Zera os pontos do set atual manualmente |
| **Inverter** | Troca Time 1 e Time 2 de lado na tela |
| **Pausar / Retomar mic** | Controla o reconhecimento de voz |
| **Encerrar** | Finaliza a partida antes do fim natural |
| **Nova partida** | Reinicia tudo (aparece ao encerrar a partida) |

## Comandos de voz

Fale em português após permitir o microfone. O app mostra na barra inferior o que foi ouvido.

| Comando | Efeito | Variações aceitas |
|---|---|---|
| **time 1** | +1 para o Time 1 | "time 1", "time um" |
| **time 2** | +1 para o Time 2 | "time 2", "time dois" |
| **desfazer** | Desfaz o último ponto | — |
| **novo set** | Inicia um set manualmente | "novo 7", "novo sete", "novo sect" |
| **inverter lados** | Troca os times na tela | — |
| **encerrar partida** | Finaliza a partida | — |

**Observações:**

- O reconhecimento de voz no Chrome **precisa de internet** (API do Google).
- Firefox **não suporta** Web Speech API — use Chrome ou Edge.

## Requisitos do navegador

| Navegador | Toque | Voz | Wake Lock | Instalar como app |
|---|---|---|---|---|
| Chrome (Android / desktop) | Sim | Sim | Sim | Sim |
| Edge | Sim | Sim | Sim | Sim |
| Safari (iPad) | Sim | Limitado | Parcial | Sim (Adicionar à Tela de Início) |
| Firefox | Sim | Não | Sim | Não |

HTTPS é obrigatório para microfone, Wake Lock e instalação como PWA.

## Desenvolvimento local

```bash
npm install
npm start          # http://localhost:4200
npm test
npm run build
```

## Deploy (GitHub Pages + PWA)

O deploy é automático via GitHub Actions a cada push na branch `main`.

**Configuração única no repositório:**

1. Vá em **Settings → Pages**
2. Em **Source**, selecione **GitHub Actions**

**Deploy manual (alternativa):**

```bash
npm run deploy:gh-pages
```

O build de produção usa `--base-href=/placar/` e publica o conteúdo de `dist/placar/browser`.

## Instalar no tablet (PWA)

1. Abra [https://luksave.github.io/placar/](https://luksave.github.io/placar/)
2. **Android (Chrome):** menu → "Instalar app" ou "Adicionar à tela inicial"
3. **iPad (Safari):** Compartilhar → "Adicionar à Tela de Início"

Após a primeira visita, a interface funciona offline. Os comandos de voz continuam precisando de internet.

## Stack

- Angular 19
- PrimeNG
- Web Speech API (reconhecimento de voz)
- Wake Lock API (manter tela ligada)
- Angular Service Worker (PWA)
