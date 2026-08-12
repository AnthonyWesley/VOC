export function calculateAge(date: Date | string | null): number | null {
  if (!date) return null;

  const birth = new Date(date);
  if (isNaN(birth.getTime())) return null;

  const today = new Date();

  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  const dayDiff = today.getDate() - birth.getDate();

  // Se ainda não fez aniversário este ano, subtrai 1
  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    age--;
  }

  return age;
}
