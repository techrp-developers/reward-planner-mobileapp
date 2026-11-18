const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const textProps = new Set([
  'accessibilityHint', 'accessibilityLabel', 'buttonText', 'description',
  'emptyMessage', 'errorMessage', 'label', 'message', 'placeholder',
  'sub', 'subtitle', 'title',
]);
const normalize = value => value.replace(/\s+/g, ' ').trim();
const isCopy = value => /[A-Za-z]{2}/.test(value) && !/^(https?:|mailto:|tel:)/i.test(value);

function candidates(source) {
  const matches = [];
  const add = (node, value, kind) => {
    if (isCopy(value)) matches.push({ node, value, kind });
  };

  function visit(node) {
    if (ts.isJsxText(node)) {
      add(node, normalize(node.getFullText(source)), 'text');
    } else if (ts.isJsxAttribute(node) && textProps.has(node.name.getText(source))) {
      if (node.initializer && ts.isStringLiteral(node.initializer)) {
        add(node.initializer, node.initializer.text, 'attribute');
      } else if (node.initializer && ts.isJsxExpression(node.initializer)) {
        const expression = node.initializer.expression;
        if (expression && ts.isStringLiteralLike(expression)) add(expression, expression.text, 'literal');
      }
    } else if (ts.isJsxExpression(node) && node.expression && ts.isStringLiteralLike(node.expression)) {
      if (ts.isJsxElement(node.parent) || ts.isJsxFragment(node.parent)) {
        add(node.expression, node.expression.text, 'literal');
      }
    } else if (ts.isCallExpression(node) && node.expression.getText(source) === 'Alert.alert') {
      for (const arg of node.arguments.slice(0, 2)) {
        if (ts.isStringLiteralLike(arg)) add(arg, arg.text, 'literal');
      }
      const buttons = node.arguments[2];
      if (buttons && ts.isArrayLiteralExpression(buttons)) {
        for (const item of buttons.elements) {
          if (!ts.isObjectLiteralExpression(item)) continue;
          for (const prop of item.properties) {
            if (ts.isPropertyAssignment(prop) && prop.name.getText(source) === 'text' && ts.isStringLiteralLike(prop.initializer)) {
              add(prop.initializer, prop.initializer.text, 'literal');
            }
          }
        }
      }
    }
    ts.forEachChild(node, visit);
  }

  visit(source);
  return matches;
}

function* files(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const filename = path.join(directory, entry.name);
    if (entry.name.startsWith('.') || ['assets', 'node_modules', 'server', '__tests__'].includes(entry.name)) continue;
    if (entry.isDirectory()) yield* files(filename);
    else if (/\.tsx?$/.test(entry.name)) yield filename;
  }
}

function inspect(filename) {
  const content = fs.readFileSync(filename, 'utf8');
  const source = ts.createSourceFile(filename, content, ts.ScriptTarget.Latest, true);
  return { source, content, matches: candidates(source) };
}

if (require.main === module) {
  for (const filename of files('src')) {
    if (filename.startsWith(path.join('src', 'i18n') + path.sep)) continue;
    const { source, matches } = inspect(filename);
    if (process.argv.includes('--summary')) {
      if (matches.length) console.log(`${filename.replaceAll(path.sep, '/')} (${matches.length})`);
      continue;
    }
    for (const { node, value } of matches) {
      const { line } = source.getLineAndCharacterOfPosition(node.getStart(source));
      console.log(`${filename.replaceAll(path.sep, '/')}:${line + 1}\t${value}`);
    }
  }
}

module.exports = { files, inspect };
