# Plano: Versão 1.1 do Proc-Gifts (correções de 2026-11-12)

Plano para o Claude Code executar no repositório `nhmac/Proc-Gifts`. Começar pelo `git pull --ff-only`
(ver o `CLAUDE.md`). **Não publicar sem o utilizador pedir.**

Este plano substitui as versões anteriores com o mesmo nome. Todas as decisões abaixo foram tomadas pelo
utilizador a 2026-11-12, a partir de um lote só com encomendas BMJCP que ele preparou (354 encomendas).

| # | Problema | Efeito nos lotes de teste |
|---|---|---|
| 1 | A tabela BMJCP (tipo + tamanho) estava errada: mandava para BMJCP almofadas que são Gifts (`Almofadas Simples › Almofada 35x35 / 40x40 / 45x45`, `Almofadas com Margem › …`) | 87 encomendas no processo errado |
| 2 | Pastas de encomenda com alguma coisa depois do número não eram lidas: `- URGENTE`, `- <produto>` e as pastas renomeadas pelo utilizador no processo (`› 1 Boneco`) | 86 encomendas desaparecidas nos 3 lotes; no lote BMJCP, as 354 |
| 3 | Uma pasta que não encaixa no formato era ignorada **sem aviso** | foi o que escondeu o 2 |

---

## 1. Regra BMJCP nova (substitui a tabela BMJCP)

A tabela BMJCP antiga (tipo + tamanho) **deixa de existir**. Para almofadas, mantas e bonecos, aplicar
estas regras **por esta ordem** ao nome normalizado da subpasta de produto (`normalizar()` como está:
`#Uxxxx` descodificado, sem `(xN) - `, sem acentos, minúsculas, espaços seguidos reduzidos a um). Ganha
a primeira que bate:

| # | Bate quando… | Processo | Exemplos |
|---|---|---|---|
| B1 | contém `com margem` | **Gifts** | Almofadas com Margem › Almofada 35x35 - Com Margem |
| B2 | contém `sem margem` | **BMJCP** | Almofadas Simples › Almofada 45x45 - Sem Margem - Impressão Frente e Verso; Almofadas sem Margem › Almofada 35x35 - Sem Margem; Almofadas › Almofada (40x40) - Sem Margem |
| B3 | é uma almofada e o nome acaba em `- s` | **BMJCP** | Almofadas › Almofada (35x35) - S; Almofadas › Almofada (45x45) - S |
| B4 | contém `polar` | **BMJCP** | Almofadas Polares › Almofada 45x45 Polar; Almofadas › Almofada Polar 30x50; Mantas Polares › … |
| B5 | contém `frente e verso` | **BMJCP** | Almofadas frente e verso › Almofada 35x35 - Impressão Frente e Verso |
| B6 | contém `manta` | **BMJCP** | Mantas Simples › Manta Simples 70x105; Mantas › Manta Polar 105x180 |
| B7 | contém `dibu` ou `boneco` | **BMJCP** | Dibuñecos › Dibunecos |
| B8 | está na lista de exceções BMJCP | **BMJCP** | `Almofadas › Almofada 70x40` (a única, por agora) |
| B9 | qualquer outra almofada | **Gifts** | Almofadas Simples › Almofada 45x45; Almofada Preta › Almofada Preta |

Notas:

- **B1 vem antes de tudo**: "Com Margem é sempre Gifts", mesmo que o nome tenha outra palavra BMJCP.
- **B3:** o `- S` no fim é o software a cortar o nome ("Sem Margem - Impressão Frente e Verso"). As pastas
  de encomenda destes casos confirmam-no. Conta como Sem Margem.
- **B2, B4, B5 e B6 valem para qualquer tamanho** (decisão do utilizador: "sempre BMJCP").
- **B8:** a lista de exceções guarda nomes exatos que são BMJCP mas que nenhuma regra apanha. Chama-se
  `EXCECOES_BMJCP`, compara o nome normalizado completo e começa só com `Almofadas › Almofada 70x40`.
- Estas regras substituem as antigas regras 9 (Dibuñecos) e 10 (almofadas e mantas pela tabela). As
  outras regras (Canecas, Puzzles…) não mudam e continuam pela ordem em que estão. No separador
  Regras, a "Tabela BMJCP" passa a ser esta tabela B1-B9.

Verificação nos lotes de teste: as 354 encomendas do lote BMJCP dão todas BMJCP (Sem Margem 125,
Polar 111, Dibuñecos 75, Mantas 25, Frente e Verso 9, `- S` 5, exceção 70x40 4).

## 2. Pastas de encomenda

O nome começa sempre por `<nº>_<order id>`. A seguir pode vir nada, ou um separador (espaço, `-` ou
`›`) e qualquer texto. Formatos vistos:

| Pasta | Origem |
|---|---|
| `3477501_2057613` | software |
| `3480124_2064550 - URGENTE` | software |
| `6531391_1512223 - Caneca Simples Low Cost` | software (outra loja) |
| `10124485_10167488 › 1 Boneco` | renomeada pelo utilizador no processo BMJCP |
| `3431834_1942428 -› Almofada (40x40) - Sem Margem` | renomeada |
| `3458598_2008032 › Manta Simples 70x105 - URGENTE` | renomeada |
| `3478693_2060827 - URGENTE › Manta Polar 90x140` | renomeada |
| `… › 1 Manta Polar 90x140-URGENTE` | renomeada |

- **URGENTE não tem tratamento especial** (decisão do utilizador): a encomenda é lida como as outras e
  vai para o processo do seu produto. O problema era só ser ignorada.
- **O processo é decidido só pela subpasta de produto.** O texto depois do número (produto escrito à
  mão, quantidade, URGENTE) não entra na classificação.
- O order id é sempre o 2.º número. A pesquisa no Explorador não muda: `*10167488*` encontra
  `10124485_10167488 › 1 Boneco`.

## 3. Produtos novos confirmados (Gifts)

Apareceram nas pastas com sufixo e o utilizador confirmou que são todos **Gifts**:

- Canecas › Caneca Amor, Caneca Refresco, Caneca Simples Low Cost, Caneca Preta
- Aventais › Avental em Polyester (60x85)
- Peluches › Rena Knut, Sapo Paddy (acrescentar `rena` e `sapo` à regra dos peluches, para não
  dependerem só da categoria)
- Porta-Chaves › Porta-Chaves Metálico Matte
- Puzzles & Jogos › Puzzle (500pcs), Puzzle A3 (192pcs)

---

## Passos

1. **`git pull --ff-only`** e confirmar que o `node testes/testar.js` passa antes de mexer.

2. **Regra BMJCP.** No `<script id="logica">`:
   - apagar a `TABELA_BMJCP`, o `tipoBMJCP()`, o `tamanho()` (se mais nada o usar) e a decisão por
     tamanho no `classificar()`;
   - pôr as regras B1-B9 no lugar das antigas regras 9 e 10, como uma regra composta que devolve o
     processo e o texto da regra aplicada (ex.: "Regra B2: Sem Margem → sempre BMJCP");
   - criar a `EXCECOES_BMJCP` com `Almofadas › Almofada 70x40`;
   - acrescentar `rena` e `sapo` à regra dos peluches;
   - no separador Regras, gerar a tabela B1-B9 e a lista de exceções a partir dos mesmos dados.

3. **Pastas de encomenda.**
   - `PASTA_ENCOMENDA = /^(\d+)_(\d+)(?:[\s\-›>].*)?$/`: aceita todos os formatos da secção 2 e recusa
     `3480124-2064550`, `3480124_2064550abc`, `3480124_2064550_label.pdf` e `Arquivo 2026`;
   - `orderId()` usa a mesma expressão e devolve sempre o 2.º número;
   - na coluna Encomenda, mostrar o nome completo da pasta, tal como está no disco. O "Copiar nºs"
     copia o nome completo.

4. **Nunca ignorar sem avisar.** Ao percorrer as pastas (input `webkitdirectory` e arrastar):
   - contar as pastas cujo nome começa por `\d+_\d+` mas não encaixa no `PASTA_ENCOMENDA`, e as pastas
     de encomenda sem nenhuma subpasta de produto;
   - se houver alguma, mostrar um aviso (`.banner`, como os outros) com a contagem e os nomes (os
     primeiros 10 e "e mais n"): "n pastas não foram lidas: …". Nunca descartar em silêncio.

5. **Testes (`testes/testar.js` e anexo do `CLAUDE.md`):**
   - no anexo, passar a `GIFTS`: `Almofadas Simples › Almofada 35x35`, `… 40x40`, `… 45x45`,
     `Almofadas com Margem › Almofada 35x35 - Com Margem`, `… 40x40 - Com Margem` e
     `(x5) - Almofadas com Margem › Almofada 40x40 - Com Margem`;
   - acrescentar os exemplos de cada regra B1-B9 da tabela da secção 1 e os produtos da secção 3;
   - acrescentar casos de tamanhos novos: `Almofadas Simples › Almofada 50x50 - Sem Margem` → `BMJCP`;
     `Almofadas Polares › Almofada 60x60 Polar` → `BMJCP`; `Mantas Simples › Manta Simples 120x200` →
     `BMJCP`; `Almofadas › Almofada (40x40) - S` → `BMJCP`;
     `Almofadas com Margem › Almofada 45x45 - Com Margem` → `GIFTS`;
     `Almofadas Simples › Almofada 50x50` → `GIFTS`;
   - testes de `orderId` com todos os formatos da secção 2 e dos quatro nomes recusados.

6. **Documentação.** No `CLAUDE.md`:
   - em "O domínio", os formatos das pastas de encomenda (tabela da secção 2);
   - trocar a secção "Tabela BMJCP" pelas regras B1-B9 e pela lista de exceções;
   - em "Decisões já tomadas": Com Margem é sempre Gifts; Sem Margem, Polar, Frente e Verso e Mantas
     são sempre BMJCP; o que não é BMJCP é Gifts; URGENTE não tem tratamento especial; nunca ignorar
     uma pasta sem avisar.

   Registar a 1.1 no fim do ficheiro e, no `PROJETO.md`, mudar a "Versão atual".

7. **Subir para "Versão web 1.1"**, correr `py build_pages.py` e `node testes/testar.js`, e abrir o
   `_site/index.html`. Teste à mão: criar uma pasta de canal falsa com uma pasta de cada formato da
   secção 2, uma pasta sem subpasta de produto e uma pasta com nome estranho. Confirmar os processos,
   o aviso das pastas não lidas e a pesquisa OR.

8. **Mostrar ao utilizador** o resumo do que mudou e pedir confirmação. Só depois, e só se ele pedir,
   commit "Versão 1.1: regras BMJCP novas e pastas de encomenda renomeadas" e `git push`.

---

## Resultado esperado nos lotes de teste

Simulado com as regras deste plano:

| Lote | Encomendas | Gifts | Offset Digital | OMEGA | BMJCP | URGENTES |
|---|---|---|---|---|---|---|
| 1.º (AMADOR + FOTOPRIX) | 135 | 83 | 24 | 22 | 6 | — |
| 2.º | 493 | 289 | 93 | 64 | 43 | 4 |
| 3.º | 1.134 | 673 | 207 | 153 | 101 | — |
| BMJCP (renomeado) | 354 | — | — | — | **354** | — |

Nas pastas que a 1.0 já lia, as únicas mudanças de processo são estas 87, que passam de BMJCP a Gifts:
85 `Almofadas Simples › Almofada 35x35 / 40x40 / 45x45` e 2 `Almofadas com Margem`. Os restantes
aumentos de contagem vêm das pastas que antes não eram lidas.

Os lotes não estão no repositório (têm encomendas reais). Se o utilizador os trouxer, conferir com
esta tabela.

---

## Encontrado durante a execução (2026-11-12)

O "Escolher pasta…" usava o `<input webkitdirectory>`, que só lista **ficheiros**: uma subpasta de produto
vazia ficava invisível, e a encomenda aparecia como "sem pasta de produto". As encomendas `65…_…` (a outra
loja) vêm com a subpasta vazia: 84 no 3.º lote e 53 no lote BMJCP. Corrigido na 1.1: o botão usa o
`showDirectoryPicker()` do Chrome/Edge, com o mesmo percurso por pastas do arrastar. Com isto, os quatro
lotes dão exatamente os números da tabela acima.
