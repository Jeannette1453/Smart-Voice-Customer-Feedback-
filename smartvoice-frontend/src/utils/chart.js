export function mapToChartData(obj) {
  if (!obj) return [];
  return Object.entries(obj).map(([name, value]) => ({ name, value }));
}
