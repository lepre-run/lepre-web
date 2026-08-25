const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript-compiler");

const WARNING_TERM = /\b(todo|fixme|xxx|hack)\b/i;

function languageVariant(file) {
  return path.extname(file) === ".tsx" ? ts.LanguageVariant.JSX : ts.LanguageVariant.Standard;
}

function warningIssues(file) {
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

    const match = WARNING_TERM.exec(scanner.getTokenText());
    if (match === null) continue;
    const position = sourceFile.getLineAndCharacterOfPosition(scanner.getTokenPos() + match.index);
    issues.push({
      key: file,
      details: {
        file,
        line: position.line + 1,
        column: position.character + 1,
        message: `Resolve or remove the ${match[1].toUpperCase()} marker.`,
        source: "typescript:warning-comment",
      },
    });
  }

  return issues;
}

function findings(files) {
  const issues = files.flatMap(warningIssues);
  if (issues.length === 0) return [];
  return [{ smell: "warning-comment", details: {}, issues }];
}

process.stdout.write(JSON.stringify(findings(process.argv.slice(2))));
