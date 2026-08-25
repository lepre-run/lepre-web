const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript-compiler");

function scriptKind(file) {
  return path.extname(file) === ".tsx" ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
}

function swallowedIssues(file) {
  const sourceFile = ts.createSourceFile(
    file,
    fs.readFileSync(file, "utf8"),
    ts.ScriptTarget.Latest,
    true,
    scriptKind(file),
  );
  const issues = [];

  function visit(node) {
    if (ts.isCatchClause(node) && node.block.statements.length === 0) {
      const position = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
      issues.push({
        key: file,
        details: {
          file,
          line: position.line + 1,
          column: position.character + 1,
          message: "Handle, report, or rethrow the caught exception.",
          source: "typescript:swallowed-exception",
        },
      });
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return issues;
}

function findings(files) {
  const issues = files.flatMap(swallowedIssues);
  if (issues.length === 0) return [];
  return [{ smell: "swallowed-exception", details: {}, issues }];
}

process.stdout.write(JSON.stringify(findings(process.argv.slice(2))));
