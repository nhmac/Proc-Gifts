// Testes da lógica do Proc-Triagem: node testes/testar.js (na raiz do repositório)
// Extrai o <script id="logica"> do web/triagem.html, corre-o e confere:
//   - os casos do anexo do CLAUDE.md (nome da pasta de produto -> processo)
//   - pastas de encomenda (todos os formatos) e orderId
//   - regras B1-B9
//   - subprocessos
//   - encomendas sem pasta de produto: produto pela etiqueta PDF ou pelo nome da imagem
//   - gruposPesquisa (tamanho, nº de ids, ordem, asteriscos)
// Pára ao primeiro caso errado, com código de saída 1.
// Também corre com o gjs (gjs -m não é preciso: gjs testes/testar.js), para PCs sem Node.

/* global require, process, __dirname, imports */
const emNode = typeof process !== "undefined" && process.versions && process.versions.node;
const raiz = emNode
  ? require("path").join(__dirname, "..")
  : imports.gi.GLib.path_get_dirname(imports.gi.GLib.path_get_dirname(
    imports.gi.GLib.canonicalize_filename(imports.system.programPath ?? imports.system.programInvocationName, null)));
const ler = rel => emNode
  ? require("fs").readFileSync(require("path").join(raiz, rel), "utf8")
  : new TextDecoder().decode(imports.gi.GLib.file_get_contents(`${raiz}/${rel}`)[1]);
const sair = codigo => (emNode ? process.exit(codigo) : imports.system.exit(codigo));

function falhar(msg) {
  console.log(`FALHOU: ${msg}`);
  sair(1);
}

// ---------------------------------------------------------------- carregar a lógica
const html = ler("web/triagem.html");
const m = html.match(/<script id="logica">([\s\S]*?)<\/script>/);
if (!m) falhar('não encontrei o <script id="logica"> no web/triagem.html');
const Logica = new Function(`${m[1]}\nreturn Logica;`)();

// ---------------------------------------------------------------- casos do anexo
const claude = ler("CLAUDE.md");
const anexo = claude.split(/^## Anexo/m)[1];
if (!anexo) falhar('não encontrei a secção "## Anexo" no CLAUDE.md');
const casos = anexo.split("\n")
  .map(l => l.match(/^\|\s*(.+?)\s*\|\s*([A-Z]+)\s*\|\s*$/))
  .filter(Boolean)
  .map(([, pasta, processo]) => {
    // "<nº>_<id> :: Categoria › Produto" para as regras que dependem da pasta da encomenda (1.7)
    const m = pasta.match(/^(\d+_\d+)\s*::\s*(.+)$/);
    return m ? { enc: m[1], pasta: m[2], processo } : { enc: null, pasta, processo };
  });
if (casos.length < 100) falhar(`só encontrei ${casos.length} casos no anexo`);

for (const c of casos) {
  if (!(c.processo in Logica.PROCESSOS)) falhar(`processo desconhecido no anexo: ${c.processo} (${c.pasta})`);
  const r = Logica.classificar(c.pasta, null, c.enc);
  if (r.processo !== c.processo) {
    falhar(`"${c.enc ? c.enc + " :: " : ""}${c.pasta}" deu ${r.processo}, esperado ${c.processo} (${r.regra})`);
  }
}
console.log(`ok  ${casos.length} casos do anexo`);

// Quantidade e nomes escapados
const q = Logica.classificar("(x23) - Azulejo › Azulejo Português (15x15cm)");
if (q.qtd !== 23 || q.categoria !== "Azulejo" || q.produto !== "Azulejo Português (15x15cm)") {
  falhar(`lerNomeProduto com quantidade: ${JSON.stringify(q)}`);
}
const z = Logica.lerNomeProduto("Canecas #U203a Caneca B#U00e1sica");
if (z.categoria !== "Canecas" || z.produto !== "Caneca Básica") falhar(`nome escapado: ${JSON.stringify(z)}`);
// "pin" não pode apanhar "pinguim"
if (Logica.classificar("Peluches › Pinguim").processo !== "GIFTS") falhar("pinguim caiu na regra do pin");
console.log("ok  quantidade, nomes escapados, pin");

// ---------------------------------------------------------------- pastas de encomenda e orderId
// Formatos vistos (1.1): do software, com "- URGENTE", com "- <produto>" e renomeadas no processo
const pastasOk = {
  "3477501_2057613": "2057613",
  "3479094_2061915": "2061915",
  "3480124_2064550 - URGENTE": "2064550",
  "6531391_1512223 - Caneca Simples Low Cost": "1512223",
  "10124485_10167488 › 1 Boneco": "10167488",
  "10124485_10167488 #U203a 1 Boneco": "10167488",
  "3431834_1942428 -› Almofada (40x40) - Sem Margem": "1942428",
  "3458598_2008032 › Manta Simples 70x105 - URGENTE": "2008032",
  "3478693_2060827 - URGENTE › Manta Polar 90x140": "2060827",
  "3478693_2060827 › 1 Manta Polar 90x140-URGENTE": "2060827",
};
for (const [pasta, esperado] of Object.entries(pastasOk)) {
  if (!Logica.ehPastaEncomenda(pasta)) falhar(`ehPastaEncomenda("${pasta}") deu falso`);
  if (Logica.pareceEncomenda(pasta)) falhar(`pareceEncomenda("${pasta}") deu verdadeiro`);
  if (Logica.orderId(pasta) !== esperado) falhar(`orderId("${pasta}") deu "${Logica.orderId(pasta)}", esperado "${esperado}"`);
}
// Recusadas: as duas primeiras não começam por <nº>_<nº>; as outras começam, e a página avisa
const recusadas = { "abc": false, "Arquivo 2026": false, "3480124-2064550": false,
  "3480124_2064550abc": true, "3479094_2061915_label.pdf": true };
for (const [pasta, avisa] of Object.entries(recusadas)) {
  if (Logica.ehPastaEncomenda(pasta)) falhar(`ehPastaEncomenda("${pasta}") devia ser falso`);
  if (Logica.orderId(pasta) !== "") falhar(`orderId("${pasta}") devia ser vazio`);
  if (Logica.pareceEncomenda(pasta) !== avisa) falhar(`pareceEncomenda("${pasta}") devia ser ${avisa}`);
}
console.log("ok  pastas de encomenda e orderId");

// ---------------------------------------------------------------- regras B1-B9 (almofadas, mantas, bonecos)
const regraB = (pasta, id) => {
  const r = Logica.classificar(pasta);
  if (!r.regra.startsWith(`Regra ${id}:`)) falhar(`"${pasta}" devia cair na ${id}, caiu em: ${r.regra}`);
};
regraB("Almofadas com Margem › Almofada 35x35 - Com Margem", "B1");
regraB("Almofadas Simples › Almofada 45x45 - Sem Margem - Impressão Frente e Verso", "B2");
regraB("Almofadas › Almofada (45x45) - S", "B3");
regraB("Almofadas Polares › Almofada 45x45 Polar", "B4");
regraB("Almofadas frente e verso › Almofada 45x45  - Impressão Frente e Verso", "B5");
regraB("Mantas Simples › Manta Simples 70x105", "B6");
regraB("Dibuñecos › Dibunecos", "B7");
regraB("Almofadas › Almofada 70x40", "B8");
regraB("Almofada Preta › Almofada Preta", "B9");
// "rena" e "sapo" só como palavras: "Serena" não é um peluche
if (Logica.classificar("Peluches › Rena Knut").processo !== "GIFTS") falhar("Rena Knut");
if (Logica.classificar("Canecas › Caneca Serena").regra.includes("peluche")) falhar("«serena» caiu nos peluches");
console.log("ok  regras B1-B9");

// ---------------------------------------------------------------- subprocessos (1.2)
const sub = pasta => Logica.classificar(pasta).sub;
if (sub("Cartões Visita › Cartões de Visita") !== "CARTOES") falhar("Cartões de Visita devia ser OFFSET › CARTOES");
if (sub("(x3) - Cartões Visita › Cartões de Visita") !== "CARTOES") falhar("Cartões de Visita com quantidade");
for (const pasta of ["Ímanes › Íman Quadrado", "Pin › Pin", "Canecas › Caneca Simples", "Dibuñecos › Dibunecos", "Coisa Nova › Sem Regra"]) {
  if (sub(pasta) !== null) falhar(`"${pasta}" não devia ter subprocesso`);
}
for (const [c, sp] of Object.entries(Logica.SUBPROCESSOS)) {
  if (!(sp.processo in Logica.PROCESSOS)) falhar(`subprocesso ${c} aponta para um processo desconhecido`);
}
for (const r of Logica.REGRAS) {
  if (r.sub && (!Logica.SUBPROCESSOS[r.sub] || Logica.SUBPROCESSOS[r.sub].processo !== r.processo)) falhar(`regra «${r.quando}»: subprocesso ${r.sub} inválido`);
}
console.log("ok  subprocessos");

// ---------------------------------------------------------------- encomendas sem pasta de produto (1.3)
// 3480186_2064704/  imagem + etiqueta na própria pasta (quantidade 1)
// 3480186_2064705/x3/  imagem numa pasta com a quantidade; a etiqueta fica na pasta da encomenda
if (Logica.qtdDaPasta("x3") !== 3 || Logica.qtdDaPasta("X 12") !== 12 || Logica.qtdDaPasta("Canecas › Caneca") !== 0) falhar("qtdDaPasta");
if (!Logica.semPastaDeProduto([]) || !Logica.semPastaDeProduto(["x3"]) || Logica.semPastaDeProduto(["Natal › Bola de Natal"])) falhar("semPastaDeProduto");
if (!Logica.ehEtiqueta("3480186_2064704_label.pdf") || !Logica.ehEtiqueta("3480222_2064810.pdf")
  || !Logica.ehEtiqueta("10253052_10356132_processed_label.pdf")
  || Logica.ehEtiqueta("3480186_2064704_bola_natal_cores_0000.jpg") || Logica.ehEtiqueta("outro.pdf")) falhar("ehEtiqueta");
const img = Logica.produtoDaImagem("3480186_2064704", "3480186_2064704_bola_natal_cores_0000.jpg");
if (img !== "bola natal cores") falhar(`produtoDaImagem deu "${img}"`);
if (Logica.produtoDaImagem("3480186_2064704", "3480186_2064704_label.pdf") !== null) falhar("produtoDaImagem aceitou a etiqueta");
if (Logica.produtoDaImagem("3480186_2064704", "COMPLETED") !== null) falhar("produtoDaImagem aceitou o COMPLETED");
if (Logica.produtoDaImagem("3480186_2064704", "9999999_1111111_caneca_0000.jpg") !== null) falhar("produtoDaImagem aceitou a imagem de outra encomenda");
// Texto da etiqueta, como o pdf.js o devolve (uma linha por linha do PDF)
const etiqueta = ["Encomenda 3480186_685081 - (4/4)", "Item Produto Acabamento Qtd", "2064705 Bola de Natal Brilhante 3",
  "› Cor Dourada", "Ficheiros de Natal › Bola de Natal Brilhante", "x3 3480186_2064705..."].join("\n");
const daEtq = Logica.produtosDaEtiqueta(etiqueta);
if (daEtq.join("|") !== "Natal › Bola de Natal Brilhante") falhar(`produtosDaEtiqueta deu ${JSON.stringify(daEtq)}`);
if (Logica.produtosDaEtiqueta("sem linha de ficheiros").length) falhar("produtosDaEtiqueta inventou um produto");
const pe = (...a) => JSON.stringify(Logica.produtosDaEncomenda(...a));
const fich = [{ ficheiro: "3480186_2064705_label.pdf", qtd: 1 }, { ficheiro: "3480186_2064705_bola_natal_cores_0000.jpg", qtd: 3 }];
if (pe("3480186_2064705", ["x3"], daEtq, fich) !== JSON.stringify([{ produto: "(x3) - Natal › Bola de Natal Brilhante", origem: "etiqueta" }])) falhar(`etiqueta: ${pe("3480186_2064705", ["x3"], daEtq, fich)}`);
if (pe("3480186_2064705", ["x3"], [], fich) !== JSON.stringify([{ produto: "(x3) - bola natal cores", origem: "imagem" }])) falhar(`imagem: ${pe("3480186_2064705", ["x3"], [], fich)}`);
if (pe("3480186_2064704", ["Natal › Bola de Natal"], daEtq, fich) !== JSON.stringify([{ produto: "Natal › Bola de Natal", origem: "pasta" }])) falhar("a pasta de produto devia mandar");
for (const n of ["(x3) - Natal › Bola de Natal Brilhante", "bola natal cores"]) {
  if (Logica.classificar(n).processo !== "OFFSET") falhar(`"${n}" devia ser OFFSET`);
}
// Com os dois PDFs, tenta-se primeiro o "_label.pdf"; o "<nº>_<id>.pdf" pode ter só o código de barras
const ord = Logica.ordemEtiquetas([{ ficheiro: "3480222_2064810.pdf" }, { ficheiro: "3480222_2064810_0000.jpg" },
  { ficheiro: "3480222_2064810_label.pdf" }]).map(f => f.ficheiro).join("|");
if (ord !== "3480222_2064810_label.pdf|3480222_2064810.pdf") falhar(`ordemEtiquetas deu ${ord}`);
// PDF só com o código de barras: sem a linha "Ficheiros de", não dá produto (e passa-se ao seguinte / à imagem)
if (Logica.produtosDaEtiqueta("*3480222*\n3480222\n").length) falhar("um PDF só com o código de barras deu um produto");
console.log("ok  encomendas sem pasta de produto (etiqueta e imagem)");

// ---------------------------------------------------------------- material da etiqueta (1.6)
// Ornamento de Natal: por norma OMEGA; em Bétula, OFFSET. O pdf.js devolve os rótulos e depois os valores.
const etqMat = mat => ["Item Produtos Acabamentos Qtd", "2943995 ...o - Christmas Gifts - Ornamento de Natal - Bola 10x10cm",
  "Tipo de Material:", "Correção de cor:", mat, "Não", "6", "Ficheiros de: 6537131_1524942 - Ornamento de Navidad - Bola 10x10cm"].join("\n");
if (Logica.materialDaEtiqueta(etqMat("Bétula")) !== "Bétula") falhar(`materialDaEtiqueta deu ${Logica.materialDaEtiqueta(etqMat("Bétula"))}`);
if (Logica.materialDaEtiqueta(etqMat("Pvc")) !== "Pvc") falhar("materialDaEtiqueta (Pvc)");
if (Logica.materialDaEtiqueta("Tipo de Material: Bétula   Não") === null) falhar("materialDaEtiqueta na mesma linha");
if (Logica.materialDaEtiqueta("Item Produtos\nCorreção de cor:\nNão") !== null) falhar("materialDaEtiqueta inventou um material");
const orn = "Christmas Gifts › Ornamento de Natal - Bola 10x10cm";
if (!Logica.precisaMaterial(orn) || !Logica.precisaMaterial("Natal › Ornamento de Natal - Coração")) falhar("precisaMaterial (ornamentos)");
if (Logica.precisaMaterial("Canecas › Caneca Simples") || Logica.precisaMaterial("Christmas Gifts › Bola de Natal")) falhar("precisaMaterial (outros)");
if (Logica.classificar(orn, "Bétula").processo !== "OFFSET") falhar("ornamento em Bétula devia ser OFFSET");
if (Logica.classificar(orn, "Betula").processo !== "OFFSET") falhar("ornamento em Betula (sem acento) devia ser OFFSET");
if (Logica.classificar(orn, "Pvc").processo !== "OMEGA") falhar("ornamento em Pvc devia ser OMEGA");
if (Logica.classificar(orn).processo !== "OMEGA") falhar("ornamento sem material devia ser OMEGA");
if (Logica.classificar("Canecas › Caneca Simples", "Bétula").processo !== "GIFTS") falhar("o material não pode mudar outros produtos");
console.log("ok  material da etiqueta (ornamento em Bétula → OFFSET)");

// ---------------------------------------------------------------- calendários e acabamento da etiqueta (1.10)
// Poster, Parede, Mesa e Bolso: True White ou Sirio Ice White -> OFFSET › CALENDÁRIOS; Gesso -> ESAG.
// Calendário de Madeira -> OMEGA; Christmas Calendar Holder (e a Recarga) -> OFFSET › CALENDÁRIOS.
const etqAc = ac => ["Item Produtos Acabamentos Qtd", "2933416 Produto - Poster - Calendário Poster 30x42",
  "Acabamento:", "Correção de cor:", ac, "Não", "1", "Ficheiros de: 6534871_1519619 - Póster Calendario 30x42"].join("\n");
for (const ac of ["True White", "Sirio Ice White", "Tintoretto Gesso", "Gesso"])
  if (Logica.acabamentoDaEtiqueta(etqAc(ac)) !== ac) falhar(`acabamentoDaEtiqueta (${ac}) deu ${Logica.acabamentoDaEtiqueta(etqAc(ac))}`);
if (Logica.acabamentoDaEtiqueta("Acabamento: Sirio Ice White") !== "Sirio Ice White") falhar("acabamentoDaEtiqueta na mesma linha");
if (Logica.acabamentoDaEtiqueta("Item Produtos Acabamentos Qtd\nCorreção de cor:\nNão") !== null) falhar("acabamentoDaEtiqueta inventou um acabamento (o cabeçalho «Acabamentos» não conta)");
const cal = (nome, ac) => { const r = Logica.classificar(nome, ac === undefined ? null : { acabamento: ac }); return `${r.processo}${r.sub ? "/" + r.sub : ""}`; };
const casosCal = [
  ["Poster › Calendário Poster 30x42", "True White", "OFFSET/CALENDARIOS"],
  ["Poster › Calendário Poster 30x42", "Sirio Ice White", "OFFSET/CALENDARIOS"],
  ["Poster › Calendário Poster 30x42", "Tintoretto Gesso", "ESAG"],
  ["Parede › Calendário Parede 30x42", "Sirio Ice White", "OFFSET/CALENDARIOS"],
  ["Parede › Calendário Parede 21x29", "Tintoretto Gesso", "ESAG"],
  ["Parede › Calendário Parede 21x29", "Gesso", "ESAG"],
  ["Mesa › Calendário Mesa 10x15", "True White", "OFFSET/CALENDARIOS"],
  ["Mesa › Calendário Mesa 10x15", "Tintoretto Gesso", "ESAG"],
  ["Mesa › Calendário Mesa 14x14", "Sirio Ice White", "OFFSET/CALENDARIOS"],
  ["(x2) - Mesa › Calendário Mesa 21x10", "True White", "OFFSET/CALENDARIOS"],
  ["Bolso › Calendário Bolso 5,5x8,5", "True White", "OFFSET/CALENDARIOS"],
  ["Calend#U00e1rio Poster 30x42", "True White", "OFFSET/CALENDARIOS"],
  ["Poster › Calendário Poster 30x42", "Lustre", "DESCONHECIDO"],       // acabamento sem regra: nunca adivinhar
  ["Poster › Calendário Poster 30x42", undefined, "DESCONHECIDO"],      // sem etiqueta
  ["Madeira › Calendário de Madeira 30x30", undefined, "OMEGA"],
  ["Madeira › Calendário de Madeira 30x45", "True White", "OMEGA"],     // o acabamento não muda a madeira
  ["Christmas Calendars › Christmas Calendar Holder - 10x15", undefined, "OFFSET/CALENDARIOS"],
  ["Christmas Calendars › Christmas Calendar Holder - 10x15 - Recarga", undefined, "OFFSET/CALENDARIOS"],
  ["Christmas Calendars › Christmas Calendar - 15x20", undefined, "OFFSET/CALENDARIOS"],
  ["Christmas Calendars › Christmas Calendar - 15x20", "Tintoretto Gesso", "OFFSET/CALENDARIOS"], // não depende do acabamento
  ["Calendários › Calendário A4", "True White", "DESCONHECIDO"],        // outro calendário: sem regra
  ["Posters › Poster A4 - Frente", "Gesso", "OFFSET"],                  // o acabamento não muda outros produtos
  // Card Shop nunca segue a regra do acabamento, mesmo em Tintoretto Gesso (decisão do utilizador, 2026-11-17)
  ["Card Shop - Convites › 15x20 (Vertical - Qtd. Min. 8)", "Tintoretto Gesso", "OFFSET/CARTOES"],
  ["Card Shop - Postais Especiais › 20x10 (Horizontal) (Qtd. Min. 6)", "Gesso", "OFFSET/CARTOES"],
  ["Card Shop - Calendários › Calendário Mesa 10x15", "Tintoretto Gesso", "OFFSET/CARTOES"],
  ["Card Shop › Calendário Poster 30x42", "Gesso", "OFFSET/CARTOES"],
];
for (const [nome, ac, esperado] of casosCal) if (cal(nome, ac) !== esperado) falhar(`"${nome}" em ${ac} devia ser ${esperado} (deu ${cal(nome, ac)})`);
if (Logica.campoDaEtiqueta("Poster › Calendário Poster 30x42") !== "acabamento" || Logica.campoDaEtiqueta(orn) !== "material"
  || Logica.campoDaEtiqueta("Canecas › Caneca Simples") !== null || Logica.campoDaEtiqueta("Madeira › Calendário de Madeira 30x30") !== null)
  falhar("campoDaEtiqueta");
if (!Logica.ORDEM.includes("ESAG") || !Logica.PROCESSOS.ESAG || Logica.SUBPROCESSOS.CALENDARIOS.processo !== "OFFSET") falhar("ESAG / CALENDÁRIOS");
// Os "complete.pdf" são os ficheiros de impressão: nunca são lidos como etiqueta
for (const f of ["6534871_1519619_complete.pdf", "complete.pdf", "6534871_1519619-complete.pdf", "6534871_1519619_Complete.pdf"])
  if (Logica.ehEtiqueta(f)) falhar(`ehEtiqueta aceitou ${f}`);
if (Logica.ordemEtiquetas([{ ficheiro: "6534871_1519619_complete.pdf" }, { ficheiro: "6534871_1519619_label.pdf" }]).length !== 1) falhar("ordemEtiquetas com complete.pdf");
if (Logica.produtosDaEncomenda("6534871_1519619", [], [], [{ ficheiro: "6534871_1519619_complete.pdf", qtd: 1 }]).length) falhar("complete.pdf deu um produto");
console.log("ok  calendários (acabamento → OFFSET › CALENDÁRIOS / ESAG; madeira → OMEGA; complete.pdf ignorado)");

// ---------------------------------------------------------------- prefixo da encomenda (1.7)
// Íman Quadrado: 1… e 3… -> OFFSET; 6… (outra loja) -> GIFTS (1.11.1; antes OMEGA); outro prefixo ou sem encomenda -> Por confirmar
const iq = "Ímanes › Íman Quadrado";
const porEnc = { "10250365_10351761": "OFFSET", "3480222_2064810": "OFFSET", "6537480_1525722 - Íman Quadrado": "GIFTS",
  "6536897_1524318": "GIFTS", "6539253_1530075 - Íman Quadrado": "GIFTS", "2480000_1000000": "DESCONHECIDO" };
for (const [enc, esperado] of Object.entries(porEnc)) {
  const r = Logica.classificar(iq, null, enc);
  if (r.processo !== esperado) falhar(`Íman Quadrado em ${enc} deu ${r.processo}, esperado ${esperado} (${r.regra})`);
}
if (Logica.classificar(iq).processo !== "DESCONHECIDO") falhar("Íman Quadrado sem encomenda devia ficar Por confirmar");
if (Logica.classificar("(x2) - " + iq, null, "6537480_1525722").processo !== "GIFTS") falhar("Íman Quadrado com quantidade");
for (const [n, e] of [["Ímanes › Ímanes Vintage", "OFFSET"], ["Ímanes › Pack de ímanes", "OMEGA"], ["Christmas Gifts › Imans Fotográficos - 6x8cm", "OFFSET"]]) {
  if (Logica.classificar(n, null, "6537480_1525722").processo !== e) falhar(`${n} numa encomenda 6… devia ser ${e}`);
}
console.log("ok  prefixo da encomenda (Íman Quadrado)");

// ---------------------------------------------------------------- produto pelo nome da pasta da encomenda (1.9)
const pn = Logica.produtoDoNomeDaEncomenda;
if (pn("6537695_1526206 - Capa Fotos Natalícia (x25)") !== "Capa Fotos Natalícia (x25)") falhar(`produtoDoNomeDaEncomenda deu ${pn("6537695_1526206 - Capa Fotos Natalícia (x25)")}`);
if (pn("3480124_2064550 - URGENTE") !== null || pn("3477501_2057613") !== null || pn("6537976_1526863 - 100x150") !== null) falhar("produtoDoNomeDaEncomenda inventou um produto");
const capa = Logica.produtosDaEncomenda("6537695_1526206 - Capa Fotos Natalícia (x25)", [], [], [{ ficheiro: "6537695_1526206_label.pdf", qtd: 1 }]);
if (JSON.stringify(capa) !== JSON.stringify([{ produto: "Capa Fotos Natalícia (x25)", origem: "encomenda" }])) falhar(`produtosDaEncomenda (nome da pasta): ${JSON.stringify(capa)}`);
if (Logica.classificar("Capa Fotos Natalícia (x25)").processo !== "OFFSET") falhar("Capa Fotos Natalícia devia ser OFFSET");
// A pasta de produto e a etiqueta continuam a mandar
if (Logica.produtosDaEncomenda("6537695_1526206 - Capa Fotos", ["Natal › Capa Fotos Natalícia Person. 15x20 (x25)"])[0].origem !== "pasta") falhar("a pasta de produto devia mandar");
if (Logica.produtosDaEncomenda("6537695_1526206 - Capa Fotos", [], ["Natal › Bola de Natal"])[0].origem !== "etiqueta") falhar("a etiqueta devia mandar");
// Subprocesso CARTÕES (pasta "OFFSET - SUB CATEGORIA CARTÕES") e o resto do OFFSET
for (const n of ["Card Shop - Convites › 15x20 (Vertical - Qtd. Min. 8)", "Card Shop - Trifold Especiais › 10x15 (Qtd. Min. 2)",
  "Christmas Cards › Christmas Cover Premium", "Convites › Postal 15x20 em True White Matte", "Postais › Postal 10x15 em True White Matte",
  "Cartões › Cartão 10 x 15 cm", "Cartões Visita › Cartões de Visita"]) {
  const r = Logica.classificar(n);
  if (r.processo !== "OFFSET" || r.sub !== "CARTOES") falhar(`"${n}" devia ser OFFSET › CARTÕES (deu ${r.processo} ${r.sub})`);
}
for (const n of ["Sticker › Sticker - Circulo 5x5", "Capas Para Fotografia › 22x32 (Photo 20x30)", "Natal › Christmas Pop Cover - 15x20", "Posters › Poster A4 - Frente"]) {
  const r = Logica.classificar(n);
  if (r.processo !== "OFFSET" || r.sub) falhar(`"${n}" devia ser OFFSET sem subprocesso (deu ${r.processo} ${r.sub})`);
}
if (Logica.classificar("Shapes › 30x30 - Círculo").processo !== "OMEGA" || Logica.classificar("Círculo › Círculo 50x50").processo !== "OMEGA") falhar("Círculo (Shapes) devia continuar OMEGA");
console.log("ok  1.9: nome da pasta da encomenda, CARTÕES e OFFSET novos");
// 1.11.6: Paper Folio Armonia -> OFFSET (sem subprocesso); Convites/Postais Niclas -> OFFSET › CARTÕES
{
  const pf = Logica.classificar("Comunhões › Paper Folio Armonia (Qtd. Min. 4)");
  if (pf.processo !== "OFFSET" || pf.sub) falhar(`Paper Folio Armonia devia ser OFFSET sem subprocesso (deu ${pf.processo} ${pf.sub})`);
  for (const n of ["Convites › 10x15 (Qtd. Min. 2) - Niclas", "Postais › 15x20 (Vertical) (Qtd. Min. 2) - Niclas", "(x2) - Convites › 10x15 (Qtd. Min. 2) - Niclas"]) {
    const r = Logica.classificar(n);
    if (r.processo !== "OFFSET" || r.sub !== "CARTOES") falhar(`"${n}" devia ser OFFSET › CARTÕES (deu ${r.processo} ${r.sub})`);
  }
  // Estreitas: sem "Niclas" / outro Paper Folio continuam por confirmar
  for (const n of ["Convites › 10x15 (Qtd. Min. 2)", "Postais › 15x20 (Vertical) (Qtd. Min. 2)", "Comunhões › Paper Folio Outro"]) {
    if (Logica.classificar(n).processo !== "DESCONHECIDO") falhar(`"${n}" devia ficar Por confirmar`);
  }
  console.log("ok  1.11.6: Paper Folio Armonia e Convites/Postais Niclas");
}

// ---------------------------------------------------------------- gruposPesquisa
for (const total of [0, 1, 2, 22, 23, 24, 50, 271, 1000]) {
  const lista = Array.from({ length: total }, (_, i) => String(2000000 + i * 37));
  const grupos = Logica.gruposPesquisa(lista);
  const juntos = [];
  for (const g of grupos) {
    if (g.texto.length > Logica.LIMITE_PESQUISA) falhar(`grupo com ${g.texto.length} caracteres (${total} ids)`);
    if (g.ids.length > Logica.MAX_IDS_GRUPO) falhar(`grupo com ${g.ids.length} ids (${total} ids)`);
    if (!g.ids.length) falhar(`grupo vazio (${total} ids)`);
    if (g.texto !== g.ids.map(id => `*${id}*`).join(" OR ")) falhar(`texto do grupo sem asteriscos: ${g.texto}`);
    juntos.push(...g.ids);
  }
  if (juntos.join(",") !== lista.join(",")) falhar(`gruposPesquisa mudou a ordem ou perdeu ids (${total} ids)`);
}
// O exemplo testado pelo utilizador no Explorador
const ex = Logica.gruposPesquisa(["2057529", "2057613"]);
if (ex.length !== 1 || ex[0].texto !== "*2057529* OR *2057613*") falhar(`exemplo: ${JSON.stringify(ex)}`);
// Ids compridos: o limite de caracteres manda antes dos 23
const longos = Logica.gruposPesquisa(Array.from({ length: 40 }, (_, i) => String(10 ** 14 + i)));
if (longos.some(g => g.texto.length > Logica.LIMITE_PESQUISA)) falhar("ids compridos passam dos 400 caracteres");
console.log("ok  gruposPesquisa");

// ---------------------------------------------------------------- só leitura (decisão do utilizador, 1.4)
// A app nunca pode alterar, mover, renomear ou apagar ficheiros ou pastas, nem enviar nada para fora.
const proibidos = [/createWritable/, /removeEntry/, /\.move\s*\(/, /readwrite/, /showSaveFilePicker/,
  /requestPermission/, /\bfetch\s*\(/, /XMLHttpRequest/, /sendBeacon/, /WebSocket/, /getFileHandle\([^)]*create/,
  /getDirectoryHandle\([^)]*create/];
for (const re of proibidos) if (re.test(html)) falhar(`o web/triagem.html usa ${re}: a app tem de ser só de leitura`);
if (!/showDirectoryPicker\(\{[^}]*mode: "read"/.test(html)) falhar('o showDirectoryPicker tem de ser chamado com mode: "read"');
console.log("ok  só leitura (nada de escrever, apagar, mover ou enviar)");

console.log("Todos os testes passaram.");
