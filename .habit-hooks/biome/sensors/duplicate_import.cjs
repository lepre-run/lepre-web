const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript-compiler");

function scriptKind(file) {
  return path.extname(file) === ".tsx" ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
}

function importDeclarations(sourceFile) {
  return sourceFile.statements.filter(
    (statement) =>
      ts.isImportDeclaration(statement) && ts.isStringLiteral(statement.moduleSpecifier),
  );
}

function duplicateIssues(file) {
  const sourceFile = ts.createSourceFile(
    file,
    fs.readFileSync(file, "utf8"),
    ts.ScriptTarget.Latest,
    true,
    scriptKind(file),
  );
  const seenModules = new Set();
  const issues = [];

  for (const declaration of importDeclarations(sourceFile)) {
    const moduleName = declaration.moduleSpecifier.text;
    if (!seenModules.has(moduleName)) {
      seenModules.add(moduleName);
      continue;
    }

    const position = sourceFile.getLineAndCharacterOfPosition(declaration.getStart(sourceFile));
    issues.push({
      key: file,
      details: {
        file,
        line: position.line + 1,
        column: position.character + 1,
        message: `Merge the repeated import from '${moduleName}'.`,
        module: moduleName,
        source: "typescript:duplicate-import",
      },
    });
  }

  return issues;
}

function findings(files) {
  const issues = files.flatMap(duplicateIssues);
  if (issues.length === 0) return [];
  return [{ smell: "duplicate-import", details: {}, issues }];
}

process.stdout.write(JSON.stringify(findings(process.argv.slice(2))));
