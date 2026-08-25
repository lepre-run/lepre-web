const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript-compiler");

const MAX_DEPTH = 4;

function scriptKind(file) {
  return path.extname(file) === ".tsx" ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
}

function isElseIf(node) {
  return (
    ts.isIfStatement(node) && ts.isIfStatement(node.parent) && node.parent.elseStatement === node
  );
}

function addsDepth(node) {
  return (
    (ts.isIfStatement(node) && !isElseIf(node)) ||
    ts.isSwitchStatement(node) ||
    ts.isTryStatement(node) ||
    ts.isDoStatement(node) ||
    ts.isWhileStatement(node) ||
    ts.isWithStatement(node) ||
    ts.isForStatement(node) ||
    ts.isForInStatement(node) ||
    ts.isForOfStatement(node)
  );
}

function depthIssues(file) {
  const sourceFile = ts.createSourceFile(
    file,
    fs.readFileSync(file, "utf8"),
    ts.ScriptTarget.Latest,
    true,
    scriptKind(file),
  );
  const issues = [];

  function visit(node, depth) {
    if (
      node !== sourceFile &&
      (ts.isFunctionLike(node) || ts.isClassStaticBlockDeclaration(node))
    ) {
      ts.forEachChild(node, (child) => visit(child, 0));
      return;
    }

    const nextDepth = addsDepth(node) ? depth + 1 : depth;
    if (nextDepth > MAX_DEPTH && addsDepth(node)) {
      const position = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
      issues.push({
        key: file,
        details: {
          file,
          line: position.line + 1,
          column: position.character + 1,
          message: `Blocks are nested too deeply (${nextDepth}). Maximum allowed is ${MAX_DEPTH}.`,
          depth: nextDepth,
          maxAllowed: MAX_DEPTH,
          source: "typescript:max-depth",
        },
      });
    }
    ts.forEachChild(node, (child) => visit(child, nextDepth));
  }

  visit(sourceFile, 0);
  return issues;
}

function findings(files) {
  const issues = files.flatMap(depthIssues);
  if (issues.length === 0) return [];
  return [{ smell: "deep-nesting", details: { maxAllowed: MAX_DEPTH }, issues }];
}

process.stdout.write(JSON.stringify(findings(process.argv.slice(2))));
