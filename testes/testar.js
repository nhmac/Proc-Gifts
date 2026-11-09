// Testes da lógica do Proc-Gifts: node testes/testar.js (na raiz do repositório)
// Extrai o <script id="logica"> do web/gifts.html, corre-o e confere:
//   - os casos do anexo do CLAUDE.md (nome da pasta de produto -> processo)
//   - orderId
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

// ---------------------------------------------------------------- orderId
const ids = { "3477501_2057613": "2057613", "3479094_2061915": "2061915", "abc": "", "3479094_2061915_label.pdf": "" };
for (const [pasta, esperado] of Object.entries(ids)) {
  if (Logica.orderId(pasta) !== esperado) falhar(`orderId("${pasta}") deu "${Logica.orderId(pasta)}", esperado "${esperado}"`);
}
console.log("ok  orderId");

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
