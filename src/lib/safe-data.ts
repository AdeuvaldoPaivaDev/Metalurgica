export function safeText(value: unknown, fallback = ""): string {
  if (value === null || value === undefined) return fallback;
  return String(value);
}

export function safeSearchText(value: unknown): string {
  return safeText(value).toLowerCase();
}
