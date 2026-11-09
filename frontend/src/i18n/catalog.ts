import en from './en.json';
import uk from './uk.json';
export type Locale = 'uk' | 'en';
export type TranslationKey = keyof typeof en;
export type TranslationParams = Record<string, string | number>;
export type Translator = (
  key: TranslationKey,
  params?: TranslationParams,
) => string;
export const defaultLocale: Locale = 'uk';
export const dictionaries = { en, uk };
export function normalizeLocale(value: unknown): Locale {
  return value === 'en' || value === 'uk' ? value : defaultLocale;
}
export function createTranslator(locale: Locale): Translator {
  return (key, params = {}) => {
    let chosen: TranslationKey = key;
    if (typeof params.count === 'number') {
      const plural = new Intl.PluralRules(locale).select(params.count);
      const candidate = `${key}.${plural}`;
      if (Object.hasOwn(dictionaries[locale], candidate))
        chosen = candidate as TranslationKey;
    }
    const template = dictionaries[locale][chosen] ?? en[chosen];
    return template.replace(/\{(\w+)\}/g, (token, name: string) => {
      const value = params[name];
      return value === undefined
        ? token
        : typeof value === 'number'
          ? new Intl.NumberFormat(locale).format(value)
          : value;
    });
  };
}
export function localizedText(value: unknown, locale: Locale): string {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    for (const key of [locale, 'uk', 'en'])
      if (typeof record[key] === 'string' && record[key])
        return record[key] as string;
  }
  return '';
}
