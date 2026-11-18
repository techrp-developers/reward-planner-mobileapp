const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const { files } = require('./audit-localization.cjs');

const root = path.join(__dirname, '..', 'src', 'i18n', 'locales');
const languages = ['en', 'hi', 'mr'];
const namespaces = language =>
  fs.readdirSync(path.join(root, language))
    .filter(name => !name.startsWith('.') && name.endsWith('.json'));
const read = (language, file) => JSON.parse(fs.readFileSync(path.join(root, language, file), 'utf8'));
const placeholders = value => [...new Set(value.match(/\{\{[^{}]+\}\}/g))].sort().join(',');
const englishFiles = namespaces('en');
const resources = fs.readFileSync(path.join(root, '..', 'resources.ts'), 'utf8');
const english = new Map(englishFiles.map(file => [file.slice(0, -5), read('en', file)]));
const errors = [];
let keyCount = 0;

for (const language of languages) {
  const languageFiles = namespaces(language);
  for (const file of languageFiles) {
    if (!englishFiles.includes(file)) errors.push(`${language}/${file}: missing English namespace`);
  }
  for (const file of englishFiles) {
    if (!languageFiles.includes(file)) {
      errors.push(`${language}/${file}: missing namespace`);
      continue;
    }
    if (!resources.includes(`./locales/${language}/${file}`)) {
      errors.push(`${language}/${file}: namespace missing from resources.ts`);
    }
    const source = english.get(file.slice(0, -5));
    const translated = read(language, file);
    if (language === 'en') keyCount += Object.keys(source).length;
    for (const key of Object.keys(source)) {
      const a = source[key];
      const b = translated[key];
      if (typeof b !== 'string' || !b.trim()) errors.push(`${language}/${file}:${key}: missing or blank`);
      else if (typeof a === 'string' && placeholders(a) !== placeholders(b)) {
        errors.push(`${language}/${file}:${key}: interpolation differs from English`);
      }
    }
    for (const key of Object.keys(translated)) {
      if (!Object.hasOwn(source, key)) errors.push(`${language}/${file}:${key}: missing English key`);
    }
  }
}

// Validate explicit namespaced keys in JSX and translation calls. Dynamic keys
// come from typed registries and are checked by TypeScript.
for (const filename of files(path.join(__dirname, '..', 'src'))) {
  const content = fs.readFileSync(filename, 'utf8');
  if (!content.includes('i18n') && !content.includes('translateUi')) continue;
  const source = ts.createSourceFile(filename, content, ts.ScriptTarget.Latest, true);
  function check(node) {
    if (!node || !ts.isStringLiteralLike(node)) return;
    const match = /^([A-Za-z]+):([A-Za-z][A-Za-z\d_]*)$/.exec(node.text);
    if (!match) return;
    const [, ns, key] = match;
    const entries = english.get(ns);
    if (entries && (Object.hasOwn(entries, key) || Object.hasOwn(entries, `${key}_other`))) return;
    const { line } = source.getLineAndCharacterOfPosition(node.getStart(source));
    errors.push(`${path.relative(process.cwd(), filename)}:${line + 1}: missing English translation ${node.text}`);
  }
  function visit(node) {
    if (ts.isCallExpression(node) && /^(t|translateUi|authText|\w+\.t)$/.test(node.expression.getText(source))) {
      const key = node.arguments[0];
      if (key && ts.isConditionalExpression(key)) {
        check(key.whenTrue);
        check(key.whenFalse);
      } else {
        check(key);
      }
    }
    if (ts.isJsxAttribute(node) && node.name.getText(source) === 'i18nKey') check(node.initializer);
    ts.forEachChild(node, visit);
  }
  visit(source);
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exitCode = 1;
} else {
  console.log(`Validated ${keyCount} keys across ${englishFiles.length} namespaces and ${languages.length} languages.`);
}
