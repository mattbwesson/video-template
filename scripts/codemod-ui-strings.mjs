/**
 * Route every string a component renders through `ui()` (see src/customize/uiStrings.tsx).
 *
 * Edits are computed from the TypeScript AST with the type checker and applied as text
 * splices, so formatting is untouched. Three passes over each file:
 *   1. JSX text with letters in it            -> {ui("…")}   (HTML entities decoded)
 *   2. placeholder/title/alt/aria-label        -> {ui("…")}
 *   3. any JSX CHILD expression whose static type is string-ish -> {ui(expr)}
 *      — this is what reaches labels rendered from module-level arrays ({tab},
 *      {item.label}) and template strings (`${n} Members`), which no literal edit can.
 * Then `const ui = useT();` at the top of the enclosing COMPONENT — the outermost function
 * that is a top-level declaration — never a `.map` callback, which would break the rules
 * of hooks. A lowercase-named owner (a render helper, not a component) is reported.
 *
 *   node scripts/codemod-ui-strings.mjs            # dry run
 *   node scripts/codemod-ui-strings.mjs --write
 */
import ts from "typescript";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const WRITE = process.argv.includes("--write");
const ATTRS = new Set(["placeholder", "title", "alt", "aria-label"]);
const SKIP = new Set([
  "Root.tsx", "Japanese.tsx", "VirginAirline.tsx", "CustomizedWorkvivo.tsx", "WorkvivoCut.tsx",
  "WorkvivoCustomerLogos.tsx", "WorkvivoCustomerGrid.tsx", "WorkvivoHqFan.tsx",
  "WorkvivoIcons.tsx", "WorkvivoSpacesIcons.tsx", "ZoomCallIcons.tsx", "WorkvivoSeerManagerIcons.tsx",
  "WorkvivoFolderIcon.tsx", "match-cut.tsx", "DataMatrixField.tsx", "QuoteCard.tsx", "GlassRing.tsx",
]);
// nbsp MUST decode to U+00A0, not a space: a space collapses under white-space:normal and
// the original did not — a 40px band of the desktop byline moved before this was caught.
const ENT = { amp: "&", apos: "'", quot: '"', nbsp: "\u00a0", middot: "·", rsquo: "’", lsquo: "‘",
  rdquo: "”", ldquo: "“", mdash: "—", ndash: "–", deg: "°", hellip: "…", times: "×" };
const decode = (s) => s.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (m, e) =>
  e[0] === "#" ? String.fromCodePoint(parseInt(e[1] === "x" ? e.slice(2) : e.slice(1), e[1] === "x" ? 16 : 10)) : (ENT[e] ?? m));
const js = (s) => JSON.stringify(s);
const isText = (s) => /[A-Za-z]{2}/.test(s) && !/^[\d\s.,:%°–—·-]+$/.test(s);

const files = [
  ...fs.readdirSync(path.join(ROOT, "src/components/workvivo")).map((f) => `src/components/workvivo/${f}`),
  ...fs.readdirSync(path.join(ROOT, "src")).filter((f) => f.endsWith(".tsx")).map((f) => `src/${f}`),
].filter((f) => f.endsWith(".tsx") && !SKIP.has(path.basename(f))).map((f) => path.join(ROOT, f));

const cfg = ts.readConfigFile(path.join(ROOT, "tsconfig.json"), ts.sys.readFile);
const parsed = ts.parseJsonConfigFileContent(cfg.config, ts.sys, ROOT);
const program = ts.createProgram(files, { ...parsed.options, noEmit: true });
const checker = program.getTypeChecker();

const stringish = (type) => {
  const one = (t) => !!(t.flags & (ts.TypeFlags.String | ts.TypeFlags.StringLiteral | ts.TypeFlags.TemplateLiteral | ts.TypeFlags.StringMapping));
  if (one(type)) return true;
  if (type.isUnion()) return type.types.some(one) && type.types.every((t) => one(t) || (t.flags & (ts.TypeFlags.Undefined | ts.TypeFlags.Null | ts.TypeFlags.Number | ts.TypeFlags.NumberLiteral)));
  return false;
};

let totalEdits = 0, totalFiles = 0; const keys = new Set(); const orphans = [], helpers = [];
for (const file of files) {
  const rel = path.relative(ROOT, file);
  const sf = program.getSourceFile(file);
  const src = sf.getFullText();
  const edits = [], hookTargets = new Map();

  const ownerComponent = (node) => {
    let n = node, best = null;
    while (n) {
      if (ts.isArrowFunction(n) || ts.isFunctionExpression(n) || ts.isFunctionDeclaration(n)) {
        const p = n.parent;
        const topLevel = (ts.isFunctionDeclaration(n) && ts.isSourceFile(p)) ||
          (ts.isVariableDeclaration(p) && ts.isVariableDeclarationList(p.parent) && ts.isVariableStatement(p.parent.parent) && ts.isSourceFile(p.parent.parent.parent));
        if (topLevel) best = n;
      }
      n = n.parent;
    }
    return best;
  };
  const ownerName = (fn) => ts.isFunctionDeclaration(fn) ? fn.name?.getText() : fn.parent.name?.getText();
  const inStyleTag = (node) => {
    let n = node.parent;
    while (n && !ts.isJsxElement(n)) n = n.parent;
    return !!n && ["style", "script"].includes(n.openingElement.tagName.getText());
  };
  const add = (node, start, end, text, key) => {
    const owner = ownerComponent(node);
    if (!owner) { orphans.push(`${rel}: ${text}`); return; }
    // A lowercase-named top-level function is a render helper, not a component: a hook in
    // it breaks the rules of hooks, and what it renders is copy — already localised.
    const nm = ownerName(owner) ?? "?";
    if (/^[a-z]/.test(nm)) { helpers.push(`${rel}: ${nm} — skipped`); return; }
    edits.push({ start, end, text });
    hookTargets.set(owner, true);
    if (key) keys.add(key);
  };
  const isChild = (node) => ts.isJsxElement(node.parent) || ts.isJsxFragment(node.parent);

  const visit = (node) => {
    if (ts.isJsxText(node) && !node.containsOnlyTriviaWhiteSpaces && !inStyleTag(node)) {
      // getFullText, not getText: for JsxText, getStart() skips the leading whitespace as
      // trivia, and the whole point below is to decide what to do with that whitespace.
      const raw = node.getFullText();
      // JSX's own rule: leading/trailing whitespace is dropped only when it contains a
      // newline. A same-line space is part of the text node — and has to stay INSIDE the
      // call, or "</b> posted" becomes two text nodes and Chromium shapes the run boundary
      // a hair differently. That was a 79px hash mismatch before this line existed.
      let lead = raw.length - raw.trimStart().length, trail = raw.length - raw.trimEnd().length;
      if (!raw.slice(0, lead).includes("\n")) lead = 0;
      if (!raw.slice(raw.length - trail).includes("\n")) trail = 0;
      const core = raw.slice(lead, raw.length - trail);
      if (isText(core)) { const k = decode(core); add(node, node.getFullStart() + lead, node.getEnd() - trail, `{ui(${js(k)})}`, k.trim()); }
    } else if (ts.isJsxAttribute(node) && node.initializer && ts.isStringLiteral(node.initializer) && ATTRS.has(node.name.getText())) {
      const v = node.initializer.text;
      if (isText(v)) add(node, node.initializer.getStart(), node.initializer.getEnd(), `{ui(${js(v)})}`, v);
    } else if (ts.isJsxExpression(node) && node.expression && isChild(node)) {
      const e = node.expression;
      if (ts.isStringLiteral(e) || ts.isNoSubstitutionTemplateLiteral(e)) {
        if (isText(e.text)) add(node, node.getStart(), node.getEnd(), `{ui(${js(e.text)})}`, e.text);
      } else if (!(ts.isCallExpression(e) && e.expression.getText() === "ui") && stringish(checker.getTypeAtLocation(e))) {
        // Dynamic: label from an array, a template string, a prop. Key resolved at runtime.
        add(node, e.getStart(), e.getEnd(), `ui(${e.getText()})`, null);
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  if (!edits.length) continue;

  for (const fn of hookTargets.keys()) {
    const body = fn.body;
    if (ts.isBlock(body)) edits.push({ start: body.getStart() + 1, end: body.getStart() + 1, text: "\n  const ui = useT();" });
    else { edits.push({ start: body.getStart(), end: body.getStart(), text: "{\n  const ui = useT();\n  return " }); edits.push({ start: body.getEnd(), end: body.getEnd(), text: ";\n}" }); }
  }
  const relImport = path.relative(path.dirname(file), path.join(ROOT, "src/customize/uiStrings")).replace(/\\/g, "/");
  const imp = `import { useT } from "${relImport.startsWith(".") ? relImport : "./" + relImport}";\n`;
  const lastImport = [...sf.statements].reverse().find((s) => ts.isImportDeclaration(s));
  const at = lastImport ? lastImport.getEnd() + 1 : 0;
  edits.push({ start: at, end: at, text: imp });

  edits.sort((a, b) => b.start - a.start || b.end - a.end);
  let out = src;
  for (const e of edits) out = out.slice(0, e.start) + e.text + out.slice(e.end);
  totalEdits += edits.length; totalFiles++;
  console.log(`  ${rel.padEnd(58)} ${String(edits.length).padStart(3)} edits, ${hookTargets.size} component(s)`);
  if (WRITE) fs.writeFileSync(file, out);
}
console.log(`\n${WRITE ? "WROTE" : "DRY RUN"}: ${totalEdits} edits in ${totalFiles} files, ${keys.size} literal keys`);
if (helpers.length) { console.log(`\nrender helpers left untouched:`); helpers.forEach((h) => console.log("   " + h)); }
if (orphans.length) { console.log(`\n${orphans.length} strings with no owning component (left as-is):`); orphans.slice(0, 30).forEach((o) => console.log("   " + o)); }
fs.writeFileSync("/tmp/ui-keys.json", JSON.stringify([...keys].sort(), null, 1));
