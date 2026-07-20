export function safeUpdate<T extends object>(
  target: T,
  patch: Partial<T>,
  allowed: (keyof T)[],
): boolean {
  let changed = false;

  for (const key of allowed) {
    if (patch[key] !== undefined) {
      // @ts-ignore
      target[key] = patch[key];
      changed = true;
    }
  }

  return changed;
}
