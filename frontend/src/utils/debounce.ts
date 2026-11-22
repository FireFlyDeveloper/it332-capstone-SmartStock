export function scheduleDebouncedValue<T>(
  value: T,
  delayMs: number,
  onValue: (value: T) => void,
): () => void {
  const timer = setTimeout(() => onValue(value), delayMs);
  return () => clearTimeout(timer);
}
