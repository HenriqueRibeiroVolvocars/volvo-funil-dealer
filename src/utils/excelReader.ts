import * as XLSX from 'xlsx';
import { sheetToJsonSafe, parseExcelDate, formatDate } from './excelHelpers';
import { extractDealersFromSheets } from './dealerExtractor';
import { calculateMetrics } from './metricsCalculator';

export async function processExcelFile(file: File) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });

        const sheet1Data = sheetToJsonSafe(workbook.Sheets[workbook.SheetNames[0]]);
        const sheet2Data = sheetToJsonSafe(workbook.Sheets[workbook.SheetNames[1]]);
        const sheet3Data = sheetToJsonSafe(workbook.Sheets[workbook.SheetNames[2]]);
        const sheet4Data = sheetToJsonSafe(workbook.Sheets[workbook.SheetNames[3]]);
        const sheet5Data = sheetToJsonSafe(workbook.Sheets[workbook.SheetNames[4]]);

        const allDates: Date[] = [];
        sheet1Data.forEach((row) => {
          const parsed = parseExcelDate(row.dateSales || row.Date || row.data || row.Data);
          if (parsed) allDates.push(parsed);
        });

        let periodStart: Date | null = null;
        let periodEnd: Date | null = null;
        if (allDates.length > 0) {
          allDates.sort((a, b) => a.getTime() - b.getTime());
          periodStart = allDates[0];
          periodEnd = allDates[allDates.length - 1];
        }

        const dealers = extractDealersFromSheets(sheet1Data, sheet2Data, sheet3Data, sheet4Data);
        const metrics = calculateMetrics(sheet1Data, sheet2Data, sheet3Data, sheet4Data, sheet5Data, [], []);

        resolve({
          ...metrics,
          period: { start: periodStart, end: periodEnd },
          rawData: { sheet1Data, sheet2Data, sheet3Data, sheet4Data, sheet5Data, sheet6Data: [], sheet7Data: [] },
          dealers
        });
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Erro ao ler o arquivo'));
    reader.readAsArrayBuffer(file);
  });
}

export async function processSheet5File(file: File): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const arr = workbook.SheetNames.length > 0 ? XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]) : [];
        resolve(arr);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = err => reject(err);
    reader.readAsArrayBuffer(file);
  });
}

export async function processApiAndExcel(
  options?: { onStatusChange?: (status: 'parcial' | 'carregando' | 'completo') => void },
  file?: File
): Promise<any> {
  try {
    const apiCache: Record<string, any> = {};

    // Get URLs from environment variables (Vite requires VITE_ prefix)
    const sheet1Url = import.meta.env.VITE_SHEET1_URL;
    const sheet2Url = import.meta.env.VITE_SHEET2_URL;
    const sheet3Url = import.meta.env.VITE_SHEET3_URL;
    const sheet4Url = import.meta.env.VITE_SHEET4_URL;
    const sheet6Url = import.meta.env.VITE_SHEET6_URL;
    const sheet7Url = import.meta.env.VITE_SHEET7_URL;

    if (!sheet1Url || !sheet2Url || !sheet3Url || !sheet4Url || !sheet6Url || !sheet7Url) {
      throw new Error('Variáveis de ambiente das APIs não configuradas. Verifique VITE_SHEET1_URL, VITE_SHEET2_URL, VITE_SHEET3_URL, VITE_SHEET4_URL, VITE_SHEET6_URL, VITE_SHEET7_URL no arquivo .env');
    }

    const cachedFetch = async (key: string, url: string) => {
      if (apiCache[key]) return apiCache[key];
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!res.ok) {
        throw new Error(`Erro ao buscar ${key}: ${res.status} ${res.statusText}`);
      }
      const data = await res.json().catch(() => null);
      apiCache[key] = data;
      return data;
    };

    options?.onStatusChange?.('carregando');

    const [sheet1Raw, sheet2Raw, sheet3Raw, sheet4Raw, sheet6Raw, sheet7Raw] = await Promise.all([
      cachedFetch('sheet1', sheet1Url),
      cachedFetch('sheet2', sheet2Url),
      cachedFetch('sheet3', sheet3Url),
      cachedFetch('sheet4', sheet4Url),
      cachedFetch('sheet6', sheet6Url),
      cachedFetch('sheet7', sheet7Url)
    ]);

    const extractArray = (raw: any): any[] => {
      if (!raw) return [];
      if (Array.isArray(raw)) return raw;
      if (raw.ResultSets && raw.ResultSets.Table1) return raw.ResultSets.Table1;
      if (raw.data && Array.isArray(raw.data)) return raw.data;
      if (raw.Result && Array.isArray(raw.Result)) return raw.Result;
      return [];
    };

    const sheet1Data = extractArray(sheet1Raw);
    const sheet2Data = extractArray(sheet2Raw);
    const sheet3Data = extractArray(sheet3Raw);
    const sheet4Data = extractArray(sheet4Raw);
    const sheet6Data = extractArray(sheet6Raw);
    const sheet7Data = extractArray(sheet7Raw);

    let sheet5Data: any[] = [];
    if (file) {
      sheet5Data = await processSheet5File(file);
    }

    options?.onStatusChange?.('parcial');

    const dealers = extractDealersFromSheets(sheet1Data, sheet2Data, sheet3Data, sheet4Data);
    const metrics = calculateMetrics(sheet1Data, sheet2Data, sheet3Data, sheet4Data, sheet5Data, sheet6Data, sheet7Data);

    const result = {
      ...metrics,
      period: { start: null, end: null },
      rawData: { sheet1Data, sheet2Data, sheet3Data, sheet4Data, sheet5Data, sheet6Data, sheet7Data },
      dealers
    };

    options?.onStatusChange?.('completo');
    return result;
  } catch (err) {
    console.error('Erro em processApiAndExcel:', err);
    throw err;
  }
}
