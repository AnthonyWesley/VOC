export function hasChanges<T>(original: T, current: T): boolean {
  return JSON.stringify(original) !== JSON.stringify(current);
}
