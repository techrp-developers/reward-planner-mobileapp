import i18n from './index';
import { resources, type TranslationNamespace } from './resources';

const sourceKeys = new Map<TranslationNamespace, Map<string, string>>();

function collectKeys(values: Record<string, unknown>, keys: Map<string, string>, prefix = '') {
  for (const [name, value] of Object.entries(values)) {
    const key = prefix ? `${prefix}.${name}` : name;
    if (typeof value === 'string') {
      if (!keys.has(value)) keys.set(value, key);
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      collectKeys(value as Record<string, unknown>, keys, key);
    }
  }
}

export function translateSourceText(namespace: TranslationNamespace, text?: string | null): string {
  if (!text) return '';
  let keys = sourceKeys.get(namespace);
  if (!keys) {
    keys = new Map();
    collectKeys(resources.en[namespace], keys);
    sourceKeys.set(namespace, keys);
  }
  const key = keys.get(text);
  return key ? i18n.t(`${namespace}:${key}`, { defaultValue: text }) : text;
}
