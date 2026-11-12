# Proc-Gifts

**Primeiro passo de cada sessão, antes de ler ou alterar código:** `git pull --ff-only`. O utilizador
trabalha em dois PCs e no Claude Code na web, e o GitHub é a única fonte. Se o pull falhar (alterações
locais por enviar, conflito, sem rede), parar e avisar o utilizador. Nunca forçar.

**No fim**, se houver alterações, commit e push (publicar só quando o utilizador pedir): não deixar
trabalho só neste PC.

Ferramenta de posto de trabalho da linha de apps "Processamento" (a mesma família do
[Proc-Separador](https://github.com/nhmac/Proc-Separador) e do [Proc-Scanner](https://github.com/nhmac/Proc-Scanner)).
Diz a que **processo de processamento de encomendas** pertence cada encomenda de **Presentes
Personalizados**, a partir do **nome da pasta de produto** que está dentro da pasta da encomenda.

- **App:** https://nhmac.github.io/Proc-Gifts/ (Chrome ou Edge; pode ser instalada como app)
- **Repositório:** https://github.com/nhmac/Proc-Gifts (código-fonte no `main`; o site é gerado e publicado pelo GitHub Actions)
- **Versão atual:** web 1.2.1

Tudo corre no browser: a app **só lê nomes de pastas**, nunca abre ficheiros e **nada é enviado para
lado nenhum**. Não introduzir pedidos de rede, CDNs nem bibliotecas.

---

## Primeira sessão: criar o projeto

Esta secção só serve para a primeira sessão. Depois de o site estar publicado e o utilizador confirmar
que funciona, apagar esta secção (e a pasta `referencia/`, se o utilizador concordar) e registar no
fim do ficheiro o commit da versão 1.0.

1. Ler este ficheiro todo e abrir o `referencia/prototipo.html`: é um protótipo funcional, feito
   numa conversa com o Claude, com a lógica e as regras já validadas pelo utilizador contra 1.676
   encomendas reais. **A lógica e as regras vêm do protótipo; o aspeto e a estrutura vêm da família**
   (ver "Aspeto"). Não copiar o CSS do protótipo.

2. Clonar o Proc-Scanner para uma pasta temporária, fora deste repositório
   (`git clone --depth 1 https://github.com/nhmac/Proc-Scanner.git /tmp/Proc-Scanner`) e usá-lo como
   molde: `build_pages.py`, `.github/workflows/pages.yml`, `.claude/settings.json`, `Inter/`,
   `icone.ico`, `web/icon-192.png`, `web/icon-512.png`, `.gitignore`, a estrutura do `PROJETO.md`
   e do `README.md`, as variáveis de CSS, a sidebar, os botões e o `criarProgresso()` do
   `web/scanner.html`.

3. Criar a estrutura (ver "Onde está o código"). No `build_pages.py`: `FONTE = web/gifts.html`,
   `NOME = "Proc-Gifts"`, a `DESCRICAO` da app, o cache do service worker `proc-gifts-…`, e o
   `COPIAR` **sem** o pdf-lib (esta app não lê PDFs). O resto do build fica igual ao do Scanner.

4. Escrever o `web/gifts.html` (ver "A página" e "A lógica"). A primeira linha tem de ser o
   `<title>Proc-Gifts</title>` (o build exige-o).

5. Testar: `python3 build_pages.py` (no Windows, `py build_pages.py`) e os testes da lógica
   (ver "Testar"). Abrir o `_site/index.html` num browser e confirmar que não há erros na consola.
   Testar sempre o `_site/index.html`, não o `web/gifts.html` sozinho (o build junta as fontes e
   o `[hidden]`).

6. Criar o repositório e publicar **só quando o utilizador pedir**:
   - `gh repo create nhmac/Proc-Gifts --public --source . --push` (público, como os outros: o GitHub
     Pages gratuito precisa disso);
   - ativar o Pages com origem no GitHub Actions:
     `gh api -X POST repos/nhmac/Proc-Gifts/pages -f build_type=workflow` (se já existir, `-X PUT`);
   - confirmar com `gh run list` e com `curl https://nhmac.github.io/Proc-Gifts/` (rodapé "Versão web 1.0").

   Se o `gh` não estiver autenticado ou o push for recusado, parar e dizer ao utilizador o que falta.
   O utilizador já publicou apps a partir do PC de casa porque o PC de trabalho não conseguia: se o
   push falhar por rede ou permissões neste PC, dizer-lho em vez de insistir.

---

## Fluxo de trabalho (GitHub é a única fonte)

1. `git pull --ff-only` (ver o primeiro passo, no topo).

2. Alterar só `web/gifts.html` (a fonte do site) e subir o "Versão web" do rodapé da sidebar.

3. Testar: `py build_pages.py` (ou `python3`) gera `_site/`. Correr os testes da lógica e abrir o
   `_site/index.html`.

4. Publicar (só quando o utilizador pedir): commit "Versão X: …" e `git push` para o `main`. O workflow
   "Publicar site" gera e publica em 1-2 minutos. Confirmar com `gh run list` e com `curl` ao site.

5. Push recusado: `git pull --rebase` e resolver. **Nunca forçar o push.**

O `README.md` da raiz é o do GitHub, comentado de propósito (`<!-- … -->`, como nos outros repositórios
da família): não mexer depois de criado.

As pastas de encomendas de teste **não vão para o git** (`.gitignore`): têm encomendas reais e só
existem nos PCs.

## Onde está o código

| Ficheiro | Papel |
|---|---|
| `web/gifts.html` | **Fonte do site.** Lógica no `<script id="logica">` (não mexe no DOM), `criarProgresso()` num `<script>` próprio, interface no `<script>` seguinte. |
| `build_pages.py` | Gera o site em `_site/` (ignorado no git). Só usa a biblioteca padrão. |
| `.github/workflows/pages.yml` | A cada push ao `main`, corre o `build_pages.py` e publica o `_site/` no GitHub Pages. |
| `.claude/settings.json` | Hook `SessionStart` com o `git pull --ff-only` (igual ao do Scanner). |
| `testes/testar.js` | Testes da lógica com o Node: extrai o `<script id="logica">` do `web/gifts.html` e confere os casos do anexo. |
| `PROJETO.md` | O que a app faz, pastas, como atualizar (o README do projeto). |
| `README.md` | O do GitHub, comentado de propósito. |
| `Inter/`, `icone.ico`, `web/icon-*.png` | Fonte Inter (SIL OFL) e ícones, iguais aos da família. |
| `referencia/prototipo.html` | Protótipo da 1.ª sessão. Apagar depois da 1.0, com o acordo do utilizador. |

## O domínio

O descarregamento de Presentes Personalizados chega numa pasta de canal (por exemplo
`PRESENTES_PERSONALIZADOS`, `PRESENTES_PERSONALIZADOS - AMADOR` ou `PRESENTES_PERSONALIZADOS - FOTOPRIX`).
Dentro dela:

```
PRESENTES_PERSONALIZADOS - AMADOR/
  3479094_2061915/                       ← pasta da encomenda: <nº>_<order id>
    3479094_2061915_label.pdf
    Natal › Ornamento de Natal - Coração/  ← pasta de produto: "Categoria › Produto"
      COMPLETED
```

- **Pasta da encomenda:** começa sempre por `<nº>_<order id>`; a seguir pode vir nada, ou um
  separador (espaço, `-` ou `›`) e qualquer texto: `^(\d+)_(\d+)(?:[\s\-›>].*)?$`. O **order id** é
  o **segundo número** (o da direita): `3477501_2057613` → `2057613`. Formatos vistos (desde a 1.1):

  | Pasta | Origem |
  |---|---|
  | `3477501_2057613` | software |
  | `3480124_2064550 - URGENTE` | software |
  | `6531391_1512223 - Caneca Simples Low Cost` | software (outra loja) |
  | `10124485_10167488 › 1 Boneco` | renomeada pelo utilizador no processo BMJCP |
  | `3431834_1942428 -› Almofada (40x40) - Sem Margem` | renomeada |
  | `3478693_2060827 - URGENTE › Manta Polar 90x140` | renomeada |

  O texto a seguir ao número (produto escrito à mão, quantidade, URGENTE) **não entra na
  classificação**: o processo vem só da subpasta de produto. Uma pasta que comece por `<nº>_<nº>` mas
  não encaixe no formato (ex.: `3480124_2064550abc`) não é lida, e a página **avisa sempre**.
- **Pasta de produto:** `Categoria › Produto` (o separador é `›`, U+203A). Pode ter um prefixo de
  quantidade, `(x2) - Natal › Bola de Natal`. Em todos os dados vistos há exatamente uma pasta de
  produto por encomenda, mas a app tem de aguentar mais do que uma (a encomenda aparece em cada
  processo correspondente, com aviso).
- Os nomes podem chegar com os caracteres escapados à moda do ZIP (`#U203a`, `#U00e1`): descodificar
  `#Uxxxx` antes de classificar.
- A pasta de canal pode vir sozinha ou dentro de outra pasta: procurar as pastas de encomenda até
  4-5 níveis abaixo da pasta escolhida.

### Os processos

Os dados de cada processo vêm da documentação do departamento (Notion).

> **Picagem e destino estão escondidos no ecrã desde a 1.2.1, por decisão do utilizador (2026-11-12).**
> Os dados ficam na `Logica.PROCESSOS` (e nesta tabela), mas a página não os mostra: nem no cartão de
> cada processo, nem na pesquisa de produto, nem no separador Regras. O interruptor é a constante
> `MOSTRAR_PICAGEM_DESTINO` (em `false`) no início da interface. **Só voltar a pô-la a `true` quando o
> utilizador o pedir.**

| Chave | Nome | Picagem | Destino das pastas |
|---|---|---|---|
| `GIFTS` | GIFTS | G1.3 Pré Impressão | `A:\PRE_IMPRESSAO\_#GIFTS` |
| `BMJCP` | BMJCP | Serviços Externos | `A:\ENTRADA_RAWS\BMJCP` |
| `OMEGA` | OMEGA | Pré Impressão | `A:\PRE_IMPRESSAO\_#OMEGA` (UV) · `_#BISCATES` (Lembranças) |
| `OFFSET` | OFFSET | Pré Impressão | `A:\PRE_IMPRESSAO\_#OFFSET_DIGITAL` |
| `BOXS` | BOXS AMADOR | *por confirmar* | *por confirmar* |
| `DESCONHECIDO` | Por confirmar | — | Produto sem regra: confirmar com o responsável |

O processo BOXS AMADOR substituiu o URGENTES na 1.2 (a pedido do utilizador), com os mesmos dois
produtos. A picagem e o destino do BOXS AMADOR ainda não foram dados pelo utilizador: mostrar "Ver documentação do
processo" até ele os dar. Não inventar. Também está por saber que produtos OMEGA vão para `_#OMEGA` e
quais para `_#BISCATES`, por isso mostram-se os dois.

### Subprocessos (desde a 1.2)

Alguns produtos, dentro de um processo, são tratados à parte (um subprocesso da documentação do
departamento). Ficam marcados na regra com `sub` e aparecem num **bloco próprio dentro do cartão do
processo**, com a sua pesquisa OR e o seu "Copiar nºs"; os restantes ficam em "Outros produtos <processo>".
O resumo mostra a contagem do subprocesso por baixo do processo, e a pesquisa de produto mostra
`OFFSET › CARTÕES`.

| Chave | Nome | Processo | Produtos |
|---|---|---|---|
| `CARTOES` | CARTÕES | OFFSET | Cartões Visita › Cartões de Visita (regra 24) |

Para acrescentar um: uma entrada em `SUBPROCESSOS` e `sub: "<CHAVE>"` na(s) regra(s). Só com indicação
do utilizador ("para já só tenho este", 2026-11-12).

### As regras (validadas pelo utilizador a 2026-11-09; almofadas, mantas e bonecos a 2026-11-12)

A classificação faz-se sobre o texto **normalizado** `Categoria › Produto`: descodificar `#Uxxxx`,
tirar o prefixo `(xN) - ` (guardar N como quantidade), tirar acentos (NFD), minúsculas e espaços
seguidos reduzidos a um. As regras aplicam-se **por esta ordem** e ganha a primeira que bate. A ordem
importa: `Puzzles & Jogos › Baralho Cartas` tem de cair no Baralho antes da regra dos puzzles, e o
Ornamento e a Bola de Natal são ambos da categoria Natal.

| # | Bate quando o texto normalizado… | Processo | Exemplos |
|---|---|---|---|
| 1 | contém `landscape 31x23` (com ou sem espaços à volta do x) | BOXS | Horizontais › Landscape 31x23 (Aro 4.5cm) |
| 2 | contém `classic 23x31` | BOXS | Verticais › Classic 23x31 (Aro 3cm / Aro 4.5cm) |
| 3 | contém `globo` | OFFSET | Foto Globos › Globo Personalizado |
| 4 | tem a palavra `pin` / `pins` (isolada: não pode apanhar "pinguim") | OFFSET | Pin › Pin |
| 5 | contém `moldura atlas` | OMEGA | Moldura Atlas 13x18, 15x20 |
| 6 | contém `moldura essence` | OMEGA | Moldura Essence 20x20, 20x30, 30x45, 40x60 |
| 7 | contém `moldura haramukh` | OMEGA | Moldura Haramukh 10x15, 15x20 |
| 8 | contém `mealheiro` | GIFTS | Oportunidades › Mealheiro |
| 9 | contém `almofada`, `manta`, `dibu` ou `boneco` | **regras B1-B9** (abaixo): BMJCP ou GIFTS | Almofadas, Mantas, Dibuñecos |
| 10 | contém `caneca` | GIFTS | Básica, Colorida, Love, Mágica, Preta Personalizada, Simples |
| 11 | contém `avental` / `aventais` | GIFTS | Aventais › Avental |
| 12 | contém `baralho` | OFFSET | Puzzles & Jogos / Baraja de cartas › Baralho Cartas (9x6cm) |
| 13 | contém `puzzle` | GIFTS | Puzzles Simples, Puzzle Coração, Puzzles Madeira |
| 14 | contém `tapete` | GIFTS | Tapete de Rato Têxtil, Tapete Rato Gaming |
| 15 | contém `porta chave` / `porta-chave` | GIFTS | Metálico, Coração, Quadrado |
| 16 | contém `iman` | OFFSET | Íman Quadrado, Ímanes Vintage, Ímanes Redondos |
| 17 | contém `ornamento` | OMEGA | Ornamento de Natal - Coração, Floco de Neve, Quadrado |
| 18 | contém `bola de natal` | OFFSET | Natal › Bola de Natal |
| 19 | contém `azulejo` | GIFTS | Azulejo Português (15x15cm) |
| 20 | contém `pvc` | OMEGA | Quadro PVC, todos os tamanhos |
| 21 | contém `mont blanc` | OMEGA | Moldura Mont Blanc 10X15 |
| 22 | contém `peluche`, `coelhinho`, `reninha`, `sapinho`, `ursinho` ou as palavras `rena`, `sapo` | GIFTS | Coelhinho Bunny, Reninha Knut, Rena Knut, Sapinho Paddy, Sapo Paddy, Ursinho Barney |
| 23 | contém `caderno` | OFFSET | Cadernos › Caderno A5 |
| 24 | contém `cartao de visita` / `cartoes visita` | OFFSET | Cartões Visita › Cartões de Visita |
| — | nenhuma regra bate | **Por confirmar** | |

### Almofadas, mantas e bonecos: regras B1-B9 (regra 9; decididas pelo utilizador a 2026-11-12)

A tabela BMJCP por tipo e tamanho da 1.0 **foi abandonada** a pedido do utilizador: estava errada (mandava
para BMJCP almofadas simples e Com Margem, que são GIFTS). As regras abaixo foram conferidas contra um lote
só com encomendas BMJCP (354 encomendas, todas dão BMJCP). Aplicam-se **por esta ordem** ao nome
normalizado; ganha a primeira que bate:

| # | Bate quando… | Processo | Exemplos |
|---|---|---|---|
| B1 | contém `com margem` | **GIFTS** | Almofadas com Margem › Almofada 35x35 - Com Margem |
| B2 | contém `sem margem` | **BMJCP** | Almofada 45x45 - Sem Margem - Impressão Frente e Verso; Almofadas › Almofada (40x40) - Sem Margem |
| B3 | é uma almofada e acaba em `- s` | **BMJCP** | Almofadas › Almofada (35x35) - S; Almofadas › Almofada (45x45) - S |
| B4 | contém `polar` | **BMJCP** | Almofada 45x45 Polar; Almofadas › Almofada Polar 30x50; Manta Polar |
| B5 | contém `frente e verso` | **BMJCP** | Almofadas frente e verso › Almofada 35x35 - Impressão Frente e Verso |
| B6 | contém `manta` | **BMJCP** | Manta Simples 70x105; Mantas › Manta Polar 105x180 |
| B7 | contém `dibu` ou `boneco` | **BMJCP** | Dibuñecos › Dibunecos |
| B8 | está na lista `EXCECOES_BMJCP` (nome exato) | **BMJCP** | `Almofadas › Almofada 70x40` (a única, por agora) |
| B9 | qualquer outra almofada | **GIFTS** | Almofadas Simples › Almofada 45x45; Almofada Preta › Almofada Preta |

- **B1 vem antes de tudo:** "Com Margem é sempre GIFTS".
- **B2, B4, B5 e B6 valem para qualquer tamanho** ("sempre BMJCP", nas palavras do utilizador).
- **B3:** o `- S` no fim é o software a cortar o nome ("Sem Margem - Impressão Frente e Verso"); as pastas de
  encomenda destes casos confirmam-no. Conta como Sem Margem.
- **B8:** nomes exatos que são BMJCP mas que nenhuma outra regra apanha. Por confirmar com o utilizador se
  a 70x40 é sempre BMJCP (noutras categorias); até lá, só esse nome.
- **"Se não é BMJCP, é GIFTS"** (decisão do utilizador): por isso a B9 apanha tudo o que sobra.

### Decisões já tomadas (não desfazer sem o utilizador pedir)

- **Nunca adivinhar.** Um produto sem regra fica "Por confirmar", a vermelho, com aviso no topo. Um
  produto encaminhado para o processo errado é pior do que um por confirmar.
- **As regras do BOXS AMADOR são estreitas de propósito** (só esses dois produtos). O utilizador ainda não
  disse se *tudo* o que está em Horizontais/Verticais vai para BOXS AMADOR. Um tamanho novo dessas pastas
  fica "Por confirmar".
- A regra é a mesma para todos os canais (AMADOR, FOTOPRIX, …).
- **Picagem e destino escondidos** (1.2.1, decisão do utilizador): `MOSTRAR_PICAGEM_DESTINO = false`. Não
  reativar sem o utilizador pedir.
- **Almofadas, mantas e bonecos** (desde a 1.1): Com Margem é sempre GIFTS; Sem Margem, Polar, Frente e
  Verso e mantas são sempre BMJCP; o que não é BMJCP é GIFTS. Não voltar à tabela por tamanho.
- **URGENTE não tem tratamento especial** (decisão do utilizador, 1.1): a encomenda é lida como as outras
  e vai para o processo do seu produto. O problema da 1.0 era só a pasta ser ignorada. (Até à 1.1 havia
  um processo chamado URGENTES, para o Landscape e o Classic, sem relação com isto: na 1.2 passou a
  chamar-se BOXS AMADOR.)
- **Nunca ignorar uma pasta sem avisar** (1.1): a 1.0 descartava em silêncio as pastas com texto depois
  do número, e 86 encomendas dos lotes de teste desapareceram sem ninguém dar por isso.
- Para acrescentar um produto novo: o utilizador diz o processo, acrescenta-se uma linha nas regras
  (pela ordem certa), um caso no anexo e corre-se os testes. Os produtos novos que caírem numa regra
  por semelhança (por exemplo um peluche novo) devem ser mostrados ao utilizador para confirmar.

## A página

Linguagem da família, igual ao Proc-Scanner: dark mode, Inter, sidebar à esquerda com o botão verde em
baixo, poucos pop-ups (só avisos e erros; não há pop-up de sucesso), português de Portugal, textos
curtos e passos no infinitivo.

- **Sidebar:** título "Proc-Gifts", subtítulo "Para encaminhar encomendas de Presentes Personalizados",
  **Escolher pasta…** (`showDirectoryPicker`; ver abaixo) ou arrastar a pasta, chip com o nome da
  pasta e o nº de encomendas, nota de privacidade ("Só são lidos os nomes das pastas; nada é enviado"),
  botão verde e "Versão web 1.0" no rodapé.
- **Ler as pastas (1.1):** o "Escolher pasta…" usa o `window.showDirectoryPicker()` (Chrome e Edge) e o
  arrastar usa o `webkitGetAsEntry()`. Os dois passam pelo mesmo `percorrer()`, que anda **só por pastas**
  (nunca abre ficheiros) e pára em cada pasta de encomenda.
  **Não voltar ao `<input webkitdirectory>` como caminho principal:** só lista ficheiros, por isso uma
  subpasta de produto **vazia** fica invisível. As encomendas `65…_…` (a outra loja) vêm com a subpasta
  de produto vazia: na 1.0 eram 84 no 3.º lote de teste e 53 no lote BMJCP, todas dadas como "sem pasta de
  produto". O input antigo fica só como recurso para browsers sem `showDirectoryPicker`.
- **Barra de progresso:** o `criarProgresso()` da família (igual ao do Scanner), com "A ler pastas · n
  encomendas".
- **Área principal, depois de analisar:**
  - resumo compacto: total de encomendas e uma contagem por processo, cada uma na cor do processo;
  - avisos: produtos "Por confirmar" (lista dos nomes em falta) e encomendas com mais do que uma pasta
    de produto;
  - um cartão por processo (pela ordem BOXS AMADOR, BMJCP, OMEGA, OFFSET, Por confirmar, GIFTS: o GIFTS é o maior volume
    e fica no fim, porque o operador trata-o como "o resto" depois de tirar os outros processos),
    com o nome (a picagem e o destino só com `MOSTRAR_PICAGEM_DESTINO`) no cabeçalho e uma tabela: encomenda, canal (só se houver mais
    de um), `Categoria › Produto` e quantidade. A regra aplicada aparece como dica (`title`);
  - em cada cartão, os botões de pesquisa (ver abaixo) e "Copiar nºs" (nomes completos das pastas, um
    por linha).
- **Pesquisar produto:** um campo onde se cola ou escreve um nome de pasta (ou parte dele) e se vê logo o
  processo e a regra aplicada (a picagem e o destino só com `MOSTRAR_PICAGEM_DESTINO`).
- **Regras:** as tabelas de processos, regras e BMJCP, geradas a partir dos mesmos dados que a lógica usa
  (nunca escritas à mão duas vezes).
- As cores dos processos devem ser distintas e legíveis no tema escuro (usar as variáveis da família como
  base; no protótipo: Gifts verde-azulado, BMJCP âmbar, OMEGA roxo, Offset azul, BOXS AMADOR laranja, Por
  confirmar vermelho).

### Pesquisa no Explorador do Windows (validado pelo utilizador a 2026-11-09)

O objetivo é colar na pesquisa da pasta e ver só as encomendas de um processo.

- Usa-se **só o order id** (o segundo número da pasta).
- Cada id vai **entre asteriscos**: `*2057529* OR *2057613*`. Sem asteriscos não encontra nada, porque o
  Explorador trata `3477501_2057613` como uma só palavra e só pesquisa pelo início das palavras. Este
  formato com dois ids foi testado pelo utilizador e encontrou as duas pastas.
- Um texto com 271 ids colado de uma vez **não encontra nada** (testado): a caixa de pesquisa do
  Explorador corta o texto colado aos 400 caracteres (medição feita no Proc-Scanner). Por isso o texto
  é **partido em grupos**, cada um com o seu botão Copiar, com a mesma regra do Proc-Scanner:
  reaproveitar o `gruposPesquisa()` do `web/scanner.html` (`LIMITE_PESQUISA = 400`,
  `MAX_IDS_GRUPO = 23`), contando já os asteriscos e o ` OR ` no tamanho.
- O protótipo usa blocos fixos (20 por omissão, com um seletor de 5 a 40): na app, usar o
  `gruposPesquisa()` da família em vez disso.
- O botão Copiar muda para "Copiado ✓" durante 1,5 s, e os grupos já copiados ficam marcados, para o
  operador saber em que grupo vai.

## A lógica

O `<script id="logica">` expõe um objeto `Logica` e não mexe no DOM, para se poder testar com o Node:

- `PROCESSOS` (chave → nome, picagem, destino), `SUBPROCESSOS`, `REGRAS` (lista ordenada; `sub` opcional), `REGRAS_BMJCP` (B1-B9),
  `EXCECOES_BMJCP`;
- `normalizar(texto)`, `lerNomeProduto(nome)` → `{nome, qtd, categoria, produto}`;
- `classificar(nomePasta)` → `{processo, sub, regra, qtd, categoria, produto, nome}` (`sub` é `null` sem subprocesso);
- `ehPastaEncomenda(nome)`, `pareceEncomenda(nome)` (começa por `<nº>_<nº>` mas está fora do formato) e
  `orderId(pastaEncomenda)` → o segundo número, em todos os formatos;
- `gruposPesquisa(ids)` → `[{ids, texto}]`, já com os asteriscos.

## Testar

`node testes/testar.js` extrai o `<script id="logica">` do `web/gifts.html`, corre-o e confere:

- todos os casos do anexo (nome da pasta → processo);
- `orderId` e `ehPastaEncomenda` em todos os formatos de pasta de encomenda (e os nomes que têm de ser
  recusados);
- `gruposPesquisa`: nenhum texto com mais de 400 caracteres nem mais de 23 ids, a ordem mantém-se,
  todos os ids aparecem uma só vez e cada um com asteriscos.

O teste falha (código de saída ≠ 0) ao primeiro caso errado e diz qual. Correr sempre antes de publicar.
Se este PC não tiver Node, correr `gjs testes/testar.js` (o PC pessoal tem o gjs, não o Node); sem
nenhum dos dois, avisar o utilizador e testar no Claude Code na web.

Teste à mão no browser: criar uma pasta de canal falsa com algumas pastas `<nº>_<id>/<Categoria › Produto>/`
(o `›` é o U+203A), escolhê-la e arrastá-la, e confirmar os grupos e a pesquisa.

---

## Versões

- **1.0** (2026-11-09, `6b5a43c`): primeira versão.
- **1.1** (2026-11-12): regras B1-B9 para almofadas, mantas e bonecos (substituem a tabela BMJCP); pastas
  de encomenda com texto depois do número (`- URGENTE`, `- <produto>`, renomeadas com `›`) passam a ser
  lidas; aviso das pastas fora do formato; `rena` e `sapo` na regra dos peluches; o "Escolher pasta…" passa
  ao `showDirectoryPicker` (o input antigo não via as subpastas de produto vazias). Plano em
  `plano-versao-1.1.md`. Conferida contra os 4 lotes de teste: 135 / 493 / 1.134 / 354 encomendas, com
  os números da tabela do plano.
- **1.2** (2026-11-12): subprocessos dentro de um processo (o primeiro: OFFSET › CARTÕES, com os Cartões de
  Visita); o processo URGENTES passa a chamar-se BOXS AMADOR (chave `BOXS`), com os mesmos dois produtos
  (Landscape 31x23 e Classic 23x31).
- **1.2.1** (2026-11-12): picagem e destino das pastas escondidos no ecrã, por decisão do utilizador
  (`MOSTRAR_PICAGEM_DESTINO = false`; os dados ficam guardados para reativar quando ele disser).

---

## Anexo: casos de teste

Todos os nomes de pasta de produto que apareceram nos três lotes reais analisados a 2026-11-09
(1.676 encomendas) e no lote BMJCP de 2026-11-12 (354), mais alguns casos inventados (prefixo de
quantidade, nome escapado do ZIP, tamanhos novos e produtos sem regra). O processo esperado foi
confirmado pelo utilizador; as almofadas foram corrigidas na 1.1.

| Pasta de produto | Processo |
|---|---|
| (x2) - Almofadas sem Margem › Almofada 35x35 - Sem Margem | BMJCP |
| (x5) - Almofadas com Margem › Almofada 40x40 - Com Margem | GIFTS |
| Almofadas com Margem › Almofada 35x35 - Com Margem | GIFTS |
| Almofadas frente e verso › Almofada 35x35 - Impressão Frente e Verso | BMJCP |
| Almofadas frente e verso › Almofada 40x40 - Impressão Frente e Verso | BMJCP |
| Almofadas frente e verso › Almofada 45x45  - Impressão Frente e Verso | BMJCP |
| Almofadas Polares › Almofada 30x50 Polar | BMJCP |
| Almofadas Polares › Almofada 45x45 Polar | BMJCP |
| Almofadas sem Margem › Almofada 35x35 - Sem Margem | BMJCP |
| Almofadas Simples › Almofada 35x35 | GIFTS |
| Almofadas Simples › Almofada 35x35 - Sem Margem - Impressão Frente e Verso | BMJCP |
| Almofadas Simples › Almofada 40x40 | GIFTS |
| Almofadas Simples › Almofada 40x40 - Sem Margem - Impressão Frente e Verso | BMJCP |
| Almofadas Simples › Almofada 45x45 | GIFTS |
| Almofadas Simples › Almofada 45x45 - Sem Margem - Impressão Frente e Verso | BMJCP |
| Dibuñecos › Dibunecos | BMJCP |
| Mantas Polares › Manta Polar 105x180 | BMJCP |
| Mantas Polares › Manta Polar 70x105 | BMJCP |
| Mantas Polares › Manta Polar 90x140 | BMJCP |
| Mantas Simples › Manta Simples 105x180 | BMJCP |
| Mantas Simples › Manta Simples 70x105 | BMJCP |
| Mantas Simples › Manta Simples 90x140 | BMJCP |
| Calendários › Calendário A4 | DESCONHECIDO |
| Horizontais › Panorama 60x20 | DESCONHECIDO |
| (x10) - Canecas › Caneca Colorida | GIFTS |
| (x11) - Canecas › Caneca Básica | GIFTS |
| (x2) - Azulejo › Azulejo Português (15x15cm) | GIFTS |
| (x2) - Canecas › Caneca Básica | GIFTS |
| (x2) - Canecas › Caneca Love | GIFTS |
| (x2) - Canecas › Caneca Magica | GIFTS |
| (x2) - Canecas › Caneca Simples | GIFTS |
| (x2) - Oportunidades › Mealheiro | GIFTS |
| (x2) - Porta-Chaves › Porta Chaves Metalico | GIFTS |
| (x2) - Porta-Chaves › Porta Chaves Quadrado | GIFTS |
| (x2) - Puzzles Simples › Puzzle A4 (96 peças) | GIFTS |
| (x2) - Tapetes de Rato › Tapete de Rato Têxtil | GIFTS |
| (x23) - Azulejo › Azulejo Português (15x15cm) | GIFTS |
| (x3) - Canecas › Caneca Preta Personalizada | GIFTS |
| (x3) - Canecas › Caneca Simples | GIFTS |
| (x3) - Porta-Chaves › Porta Chaves Quadrado | GIFTS |
| (x3) - Tapetes de Rato › Tapete de Rato Têxtil | GIFTS |
| (x4) - Almofada Preta › Almofada Preta | GIFTS |
| (x4) - Canecas › Caneca Simples | GIFTS |
| (x4) - Tapetes de Rato › Tapete de Rato Têxtil | GIFTS |
| (x5) - Aventais › Avental | GIFTS |
| (x5) - Azulejo › Azulejo Português (15x15cm) | GIFTS |
| (x5) - Canecas › Caneca Básica | GIFTS |
| (x5) - Porta-Chaves › Porta Chaves Quadrado | GIFTS |
| (x7) - Canecas › Caneca Básica | GIFTS |
| (x7) - Puzzles Simples › Puzzle A4 (96 peças) | GIFTS |
| (x9) - Peluches › Sapinho Paddy | GIFTS |
| Almofada Preta › Almofada Preta | GIFTS |
| Almofadas Simples › Almofada 50x50 | GIFTS |
| Aventais › Avental | GIFTS |
| Azulejo › Azulejo Português (15x15cm) | GIFTS |
| Canecas › Caneca Básica | GIFTS |
| Canecas › Caneca Colorida | GIFTS |
| Canecas › Caneca Love | GIFTS |
| Canecas › Caneca Magica | GIFTS |
| Canecas › Caneca Preta Personalizada | GIFTS |
| Canecas › Caneca Simples | GIFTS |
| Canecas #U203a Caneca B#U00e1sica | GIFTS |
| Mantas Simples › Manta Simples 120x200 | BMJCP |
| Peluches › Coelhinho Bunny | GIFTS |
| Peluches › Reninha Knut | GIFTS |
| Peluches › Sapinho Paddy | GIFTS |
| Peluches › Ursinho Barney | GIFTS |
| Porta-Chaves › Porta Chaves Coração | GIFTS |
| Porta-Chaves › Porta Chaves Metalico | GIFTS |
| Porta-Chaves › Porta Chaves Quadrado | GIFTS |
| Puzzle Coração › Puzzle Coração (114 peças) | GIFTS |
| Puzzles Madeira › Puzzle de Madeira (30 peças) | GIFTS |
| Puzzles Simples › Puzzle (500pcs) | GIFTS |
| Puzzles Simples › Puzzle A3 (192 peças) | GIFTS |
| Puzzles Simples › Puzzle A4 (96 peças) | GIFTS |
| Puzzles Simples › Puzzle Fotográfico 500 peças | GIFTS |
| Puzzles Simples › Puzzle Fotográfico A3 · 192 peças | GIFTS |
| Puzzles Simples › Puzzle Fotográfico A4 · 96 peças | GIFTS |
| Tapetes de Rato › Tapete de Rato Têxtil | GIFTS |
| Tapetes de Rato › Tapete Rato Gaming | GIFTS |
| (x10) - Pin › Pin | OFFSET |
| (x15) - Pin › Pin | OFFSET |
| (x2) - Baraja de cartas › Baralho Cartas ( 9x6cm ) | OFFSET |
| (x2) - Cadernos › Caderno A5 | OFFSET |
| (x2) - Cartões Visita › Cartões de Visita | OFFSET |
| (x2) - Ímanes › Íman Quadrado | OFFSET |
| (x2) - Ímanes › Ímanes Vintage | OFFSET |
| (x25) - Foto Globos › Globo Personalizado | OFFSET |
| (x3) - Foto Globos › Globo Personalizado | OFFSET |
| (x3) - Ímanes › Ímanes Vintage | OFFSET |
| (x3) - Pin › Pin | OFFSET |
| (x5) - Cartões Visita › Cartões de Visita | OFFSET |
| Baraja de cartas › Baralho Cartas ( 9x6cm ) | OFFSET |
| Cadernos › Caderno A5 | OFFSET |
| Cartões Visita › Cartões de Visita | OFFSET |
| Foto Globos › Globo Personalizado | OFFSET |
| Ímanes › Íman Quadrado | OFFSET |
| Ímanes › Ímanes Redondos | OFFSET |
| Ímanes › Ímanes Vintage | OFFSET |
| Natal › Bola de Natal | OFFSET |
| Pin › Pin | OFFSET |
| Puzzles & Jogos › Baralho Cartas ( 9x6cm ) | OFFSET |
| (x2) - Mont Blanc › Moldura Mont Blanc 10X15 | OMEGA |
| (x2) - Natal › Ornamento de Natal - Coração | OMEGA |
| (x2) - Quadro PVC › Quadro Pvc 30x30 | OMEGA |
| (x2) - Quadro PVC › Quadro Pvc 30x45 | OMEGA |
| (x5) - Moldura Essence › Moldura Essence 20 x 30 cm | OMEGA |
| Moldura Atlas › Moldura Atlas 13x18 | OMEGA |
| Moldura Atlas › Moldura Atlas 15x20 | OMEGA |
| Moldura Essence › Moldura Essence 20 x 20 cm | OMEGA |
| Moldura Essence › Moldura Essence 30 x 45 cm | OMEGA |
| Moldura Essence › Moldura Essence 40 x 60 cm | OMEGA |
| Moldura Haramukh › Moldura Haramukh 10 x 15 cm | OMEGA |
| Moldura Haramukh › Moldura Haramukh 15 x 20 cm | OMEGA |
| Mont Blanc › Moldura Mont Blanc 10X15 | OMEGA |
| Natal › Ornamento de Natal - Coração | OMEGA |
| Natal › Ornamento de Natal - Floco de Neve | OMEGA |
| Natal › Ornamento de Natal - Quadrado | OMEGA |
| Quadro PVC › Quadro Pvc 10x15 | OMEGA |
| Quadro PVC › Quadro Pvc 15x20 | OMEGA |
| Quadro PVC › Quadro Pvc 20x20 | OMEGA |
| Quadro PVC › Quadro Pvc 20x30 | OMEGA |
| Quadro PVC › Quadro Pvc 30x30 | OMEGA |
| Quadro PVC › Quadro Pvc 30x45 | OMEGA |
| Quadro PVC › Quadro Pvc 30x60 | OMEGA |
| Quadro PVC › Quadro Pvc 40x40 | OMEGA |
| Quadro PVC › Quadro Pvc 40x50 | OMEGA |
| Quadro PVC › Quadro Pvc 40x60 | OMEGA |
| Quadro PVC › Quadro Pvc 40x80 | OMEGA |
| Quadro PVC › Quadro Pvc 50x100 | OMEGA |
| Quadro PVC › Quadro Pvc 50x50 | OMEGA |
| Quadro PVC › Quadro Pvc 50x75 | OMEGA |
| Quadro PVC › Quadro Pvc 60x90 | OMEGA |
| Horizontais › Landscape 31x23 (Aro 4.5cm) | BOXS |
| Verticais › Classic 23x31 (Aro 3cm) | BOXS |
| Verticais › Classic 23x31 (Aro 4.5cm) | BOXS |
| Almofadas Polares › Almofada 70x40 Polar | BMJCP |
| (x2) - Almofadas Simples › Almofada 40x40 - Sem Margem - Impressão Frente e Verso | BMJCP |
| (x2) - Mantas Simples › Manta Simples 105x180 | BMJCP |
| (x2) - Almofadas Polares › Almofada 45x45 Polar | BMJCP |
| (x2) - Almofadas Simples › Almofada 45x45 - Sem Margem - Impressão Frente e Verso | BMJCP |
| Almofadas Simples › Almofada 35x35 - Sem Margem | BMJCP |
| Almofadas Simples › Almofada 45x45 - Sem Margem | BMJCP |
| Almofadas Simples › Almofada 40x40 - Sem Margem | BMJCP |
| (x2) - Almofadas Simples › Almofada 35x35 - Sem Margem | BMJCP |
| Almofadas sem Margem › Almofada 45x45 - Sem Margem | BMJCP |
| Almofadas sem Margem › Almofada 40x40 - Sem Margem | BMJCP |
| Almofadas › Almofada (40x40) - Sem Margem | BMJCP |
| Almofadas › Almofada Polar 30x50 | BMJCP |
| Almofadas › Almofada (35x35) - Sem Margem | BMJCP |
| Almofadas › Almofada (35x35) - S | BMJCP |
| Mantas › Manta Simples 70x105 | BMJCP |
| Almofadas › Almofada (45x45) - Sem Margem | BMJCP |
| Almofadas › Almofada 70x40 | BMJCP |
| Almofadas › Almofada (35x35) - Sem Margem - Impressão Frente e Verso | BMJCP |
| Almofadas › Almofada (45x45) - S | BMJCP |
| Mantas › Manta Polar 90x140 | BMJCP |
| Mantas › Manta Simples 105x180 | BMJCP |
| Mantas › Manta Polar 105x180 | BMJCP |
| Almofadas › Almofada Polar 45x45 | BMJCP |
| Mantas › Manta Simples 90x140 | BMJCP |
| Canecas › Caneca Simples Low Cost | GIFTS |
| Aventais › Avental em Polyester (60x85) | GIFTS |
| Puzzles & Jogos › Puzzle A3 (192pcs) | GIFTS |
| Puzzles & Jogos › Puzzle (500pcs) | GIFTS |
| Porta-Chaves › Porta-Chaves Coração | GIFTS |
| Porta-Chaves › Porta-Chaves Quadrado | GIFTS |
| Porta-Chaves › Porta-Chaves Metálico Matte | GIFTS |
| Canecas › Caneca Preta | GIFTS |
| Canecas › Caneca Amor | GIFTS |
| Canecas › Caneca Refresco | GIFTS |
| Canecas › Caneca Mágica | GIFTS |
| Peluches › Sapo Paddy | GIFTS |
| Peluches › Rena Knut | GIFTS |
| Almofadas › Almofada (40x40) - Com Margem | GIFTS |
| Almofadas Simples › Almofada 50x50 - Sem Margem | BMJCP |
| Almofadas Polares › Almofada 60x60 Polar | BMJCP |
| Almofadas › Almofada (40x40) - S | BMJCP |
| Almofadas com Margem › Almofada 45x45 - Com Margem | GIFTS |
| Almofadas Simples › Almofada 70x40 | GIFTS |
| Peluches › Pinguim | GIFTS |
