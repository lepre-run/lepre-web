const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript-compiler");

const MAX_PREVIEW_CHARACTERS = 50;
const MIN_SINGLE_LINE_CHARACTERS = 10;
const MIN_BLOCK_CHARACTERS = 15;

function languageVariant(file) {
  return path.extname(file) === ".tsx" ? ts.LanguageVariant.JSX : ts.LanguageVariant.Standard;
}

function isReportable(token, text) {
  if (text.includes("eslint-disable")) return false;
  if (token === ts.SyntaxKind.SingleLineCommentTrivia) {
    return text.length >= MIN_SINGLE_LINE_CHARACTERS;
  }
  return text.length >= MIN_BLOCK_CHARACTERS;
}

function preview(text) {
  const collapsed = text.replace(/\s+/g, " ").trim();
  return collapsed.length > MAX_PREVIEW_CHARACTERS
    ? `${collapsed.slice(0, MAX_PREVIEW_CHARACTERS)}...`
    : collapsed;
}

function commentKind(token, text) {
  if (token === ts.SyntaxKind.SingleLineCommentTrivia) return "single";
  return text.startsWith("/**") ? "JSDoc" : "block";
}

function commentIssues(file) {
  const source = fs.readFileSync(file, "utf8");
  const sourceFile = ts.createSourceFile(
    file,
    source,
    ts.ScriptTarget.Latest,
    true,
    path.extname(file) === ".tsx" ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
  const scanner = ts.createScanner(ts.ScriptTarget.Latest, false, languageVariant(file), source);
  const issues = [];

  for (let token = scanner.scan(); token !== ts.SyntaxKind.EndOfFileToken; token = scanner.scan()) {
    if (
      token !== ts.SyntaxKind.SingleLineCommentTrivia &&
      token !== ts.SyntaxKind.MultiLineCommentTrivia
    ) {
      continue;
    }

    const text = scanner.getTokenText();
    if (!isReportable(token, text)) continue;
    const position = sourceFile.getLineAndCharacterOfPosition(scanner.getTokenPos());
    const kind = commentKind(token, text);
    issues.push({
      key: file,
      details: {
        file,
        line: position.line + 1,
        column: position.character + 1,
        message: `${kind}-line comment: "${preview(text)}"`,
        source: "comment:non-essential",
      },
    });
  }

  return issues;
}

function findings(files) {
  const issues = files.flatMap(commentIssues);
  if (issues.length === 0) return [];
  return [{ smell: "non-essential-comment", details: {}, issues }];
}

process.stdout.write(JSON.stringify(findings(process.argv.slice(2))));
