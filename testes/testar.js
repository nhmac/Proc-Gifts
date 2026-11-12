// Testes da lógica do Proc-Gifts: node testes/testar.js (na raiz do repositório)
// Extrai o <script id="logica"> do web/gifts.html, corre-o e confere:
//   - os casos do anexo do CLAUDE.md (nome da pasta de produto -> processo)
//   - pastas de encomenda (todos os formatos) e orderId
//   - regras B1-B9
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

console.log("Todos os testes passaram.");
