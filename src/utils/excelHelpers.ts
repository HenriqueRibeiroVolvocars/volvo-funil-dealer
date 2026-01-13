import * as XLSX from 'xlsx';

export function getValue(row: any, possibleKeys: string[]): any {
  for (const key of possibleKeys) {
    if (row[key] !== undefined && row[key] !== null && row[key] !== '') {
      return row[key];
    }
  }
  return null;
}

export function normalizeDealerName(dealerName: string): string {
  if (!dealerName) return '';

  return dealerName
    .trim()
    .replace(/\([^)]*\)/g, '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function parseExcelDate(dateValue: any): Date | null {
  if (!dateValue) return null;

  const str = String(dateValue).trim();

  const isoMatch = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  }

  const ddmmyyyyMatch = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (ddmmyyyyMatch) {
    const [, day, month, year] = ddmmyyyyMatch;
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  }

  const n = Number(str);
  if (!isNaN(n) && n > 30000) {
    const date = new Date((n - 25569) * 86400 * 1000);
    return isNaN(date.getTime()) ? null : date;
  }

  const date = new Date(str);
  return isNaN(date.getTime()) ? null : date;
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString('pt-BR');
}

export function formatBrazilianNumber(value: number | null): string {
  if (value === null || value === undefined) return 'N/A';
  return Math.round(value).toLocaleString('pt-BR');
}

export function formatBrazilianPercent(value: number): string {
  return `${value.toFixed(1).replace('.', ',')}%`;
}

export function sheetToJsonSafe(sheet: XLSX.Sheet | undefined): any[] {
  if (!sheet) return [];
  return XLSX.utils.sheet_to_json(sheet, { raw: true });
}
