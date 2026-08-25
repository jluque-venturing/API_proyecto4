const ALIAS: Readonly<Record<string, string>> = {
  ' ': 'Space',
  Spacebar: 'Space',
  Esc: 'Escape',
  Del: 'Delete',
  Ins: 'Insert',
  Ctrl: 'Control',
  Cmd: 'Meta',
  Command: 'Meta',
  Win: 'Meta',
  OS: 'Meta',
};

export function canonicalKey(raw: string): string {
  const resolved = ALIAS[raw] ?? raw;
  return resolved.length === 1 ? resolved.toLowerCase() : resolved;
}

export function canonicalCombo(keys: string[]): string[] {
  return [...new Set(keys.map(canonicalKey))];
}

export function matchesCombo(pressed: string[], expected: string[]): boolean {
  const a = canonicalCombo(pressed);
  const b = canonicalCombo(expected);
  if (a.length !== b.length) return false;
  const esperadas = new Set(b);
  return a.every((key) => esperadas.has(key));
}
