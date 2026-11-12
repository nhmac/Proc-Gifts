// Testes da lógica do Proc-Gifts: node testes/testar.js (na raiz do repositório)
// Extrai o <script id="logica"> do web/gifts.html, corre-o e confere:
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
const html = ler("web/gifts.html");
const m = html.match(/<script id="logica">([\s\S]*?)<\/script>/);
if (!m) falhar('não encontrei o <script id="logica"> no web/gifts.html');
const Logica = new Function(`${m[1]}\nreturn Logica;`)();

// ---------------------------------------------------------------- casos do anexo
const claude = ler("CLAUDE.md");
const anexo = claude.split(/^## Anexo/m)[1];
if (!anexo) falhar('não encontrei a secção "## Anexo" no CLAUDE.md');
const casos = anexo.split("\n")
  .map(l => l.match(/^\|\s*(.+?)\s*\|\s*([A-Z]+)\s*\|\s*$/))
  .filter(Boolean)
  .map(([, pasta, processo]) => ({ pasta, processo }));
if (casos.length < 100) falhar(`só encontrei ${casos.length} casos no anexo`);

for (const c of casos) {
  if (!(c.processo in Logica.PROCESSOS)) falhar(`processo desconhecido no anexo: ${c.processo} (${c.pasta})`);
  const r = Logica.classificar(c.pasta);
  if (r.processo !== c.processo) {
    falhar(`"${c.pasta}" deu ${r.processo}, esperado ${c.processo} (${r.regra})`);
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
console.log("ok  encomendas sem pasta de produto (etiqueta e imagem)");

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
for (const re of proibidos) if (re.test(html)) falhar(`o web/gifts.html usa ${re}: a app tem de ser só de leitura`);
if (!/showDirectoryPicker\(\{[^}]*mode: "read"/.test(html)) falhar('o showDirectoryPicker tem de ser chamado com mode: "read"');
console.log("ok  só leitura (nada de escrever, apagar, mover ou enviar)");

console.log("Todos os testes passaram.");
