/** Codes are authoritative; labels are a fallback for the older API response. */
const aliases: Record<string, string> = {
  'wi-fi': 'wifi',
  wifi: 'wifi',
  електрика: 'electricity',
  electricity: 'electricity',
  пандус: 'ramp',
  ramp: 'ramp',
  'можна з тваринами': 'pets',
  'pets allowed': 'pets',
  туалет: 'toilet',
  toilet: 'toilet',
  доступність: 'availability',
  availability: 'availability',
  цілодобово: 'open_24_7',
  'open 24/7': 'open_24_7',
  open_24_7: 'open_24_7',
};
export function readFacilityFlags(value: unknown): Map<string, boolean> {
  const flags = new Map<string, boolean>();
  if (!Array.isArray(value)) return flags;
  for (const item of value) {
    let code: string | undefined;
    let enabled = true;
    if (typeof item === 'string') code = item;
    else if (item && typeof item === 'object') {
      if ('value' in item) {
        if (typeof item.value !== 'boolean') continue;
        enabled = item.value;
      }
      code =
        typeof item.icon_name === 'string'
          ? item.icon_name
          : typeof item.code === 'string'
            ? item.code
            : undefined;
      if (!code) {
        const names =
          typeof item.name === 'string'
            ? [item.name]
            : item.name && typeof item.name === 'object'
              ? Object.values(item.name)
              : [];
        code = names.flatMap((name) =>
          typeof name === 'string' &&
          Object.hasOwn(aliases, name.trim().toLowerCase())
            ? [aliases[name.trim().toLowerCase()]]
            : [],
        )[0];
      }
    }
    if (code) {
      code = code.trim().toLowerCase();
      code = Object.hasOwn(aliases, code) ? aliases[code] : code;
      // A conflicting explicit negative must not become a positive assertion.
      flags.set(code, enabled && flags.get(code) !== false);
    }
  }
  return flags;
}
