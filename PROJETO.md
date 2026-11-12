# Proc-Gifts

Diz a que processo de processamento pertence cada encomenda de Presentes Personalizados, pelo nome da
pasta de produto dentro da pasta da encomenda (`3479094_2061915/Natal › Ornamento de Natal - Coração/`),
e prepara a pesquisa no Explorador do Windows para ver só as encomendas de cada processo.

- **App:** https://nhmac.github.io/Proc-Gifts/ (Chrome ou Edge; pode ser instalada como app)
- **Repositório:** https://github.com/nhmac/Proc-Gifts (código-fonte no `main`; o site é gerado e publicado pelo GitHub Actions)
- **Versão atual:** web 1.4.2: "Square 21x21 (Aro 4.5cm)" passa a BOXS AMADOR. Na 1.4.1: "Moldura Vintage" passa a GIFTS; com mais do que um PDF na encomenda, tenta-se primeiro o `_label.pdf`. Na 1.4: "Fotos Vintage" e "Moldura Cubo" passam a OFFSET; a etiqueta também pode chamar-se `<nº>_<id>.pdf`; a app é só de leitura (testado). Na 1.3: encomendas sem pasta de produto (só ficheiros, ou uma pasta `x3`) passam a ser classificadas pela etiqueta PDF ou, sem ela, pelo nome da imagem. Na 1.2.1: picagem e destino das pastas escondidos no ecrã, por decisão do utilizador (para reativar quando ele disser). Na 1.2: subprocessos dentro de um processo (OFFSET › CARTÕES, os Cartões de Visita) e o processo URGENTES passa a chamar-se BOXS AMADOR. Antes, na 1.1: almofadas, mantas e bonecos pelas regras B1-B9, pastas de encomenda renomeadas ou com `- URGENTE` passam a ser lidas, aviso das pastas fora do formato e o "Escolher pasta…" passa a ver as subpastas de produto vazias

A app lê nomes de pastas e, nas encomendas sem pasta de produto, a etiqueta PDF (com o pdf.js, `web/vendor/pdfjs`), tudo no browser; nada é enviado para lado nenhum.

## Usar

1. **Escolher pasta…** (ou arrastar a pasta para a janela): a pasta do canal, por exemplo
   `PRESENTES_PERSONALIZADOS - AMADOR`, ou uma pasta com vários canais.
2. **Analisar**: um cartão por processo (Boxs Amador, Gifts, BMJCP, OMEGA, Offset Digital, Por confirmar),
   com a picagem, o destino e as encomendas.
3. Em cada cartão, **Copiar** um grupo de cada vez e colar na pesquisa da pasta no Explorador: aparecem
   só as encomendas desse processo. **Copiar nºs** copia os nomes completos das pastas, um por linha.

Os produtos sem regra ficam **Por confirmar**, a vermelho: confirmar com o responsável.
O separador **Pesquisar produto** diz o processo de um nome de pasta; o **Regras** mostra as regras.

## Atualizar a app

O GitHub é a única fonte: funciona igual em qualquer PC ou no Claude Code na web.

1. `git pull` (sempre antes de começar).
2. Alterar `web/gifts.html` e subir o "Versão web".
3. Testar: `node testes/testar.js` (sem Node: `gjs testes/testar.js`) e `py build_pages.py`, que gera
   o site em `_site/` (abrir o `_site/index.html`).
4. Publicar: commit e `git push`. O GitHub Actions ("Publicar site") gera e publica o site em
   1-2 minutos; os PCs recebem a versão nova ao abrir a app com internet.

Produto novo: acrescentar a regra no `REGRAS` do `web/gifts.html` (pela ordem certa) e um caso no anexo
do `CLAUDE.md`, e correr os testes.

## Pastas

| | |
|---|---|
| `web/` | Fonte do site: `gifts.html` e ícones PNG |
| `testes/testar.js` | Testes da lógica (casos do anexo do `CLAUDE.md`) |
| `.github/workflows/pages.yml` | Gera e publica o site a cada push ao `main` |
| `Inter/`, `icone.ico` | Fonte Inter (SIL OFL) e ícone |
| `referencia/prototipo.html` | Protótipo da 1.ª sessão (apagar depois da 1.0) |
