
/**
 * Returns the last day of the specified month in the specified year.
 *
 * @param year - The year for which to get the last day of the month.
 * @param month - The month (0-based, where 0 = January, 11 = December) for which to get the last day.
 * @returns The last day of the specified month as a Date object.
 */
export const getLastDayOfMonth = (year: number, month: number): Date => {
  // El truco: el día 0 del mes siguiente es el último día del mes actual
  return new Date(year, month, 0);
}
