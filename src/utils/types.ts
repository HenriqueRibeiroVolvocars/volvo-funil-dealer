export interface FunnelMetrics {
  leadsDiretos: { leads: number; faturados: number };
  leadsComTestDrive: { leads: number; testDrives: number };
  testDrivesVendidos: { testDrives: number; vendas: number };
  jornadaCompleta: { leads: number; faturados: number };
  visitasTestDrive: { visitas: number; testDrives: number };
  visitasFaturamento: { visitas: number; faturados: number };
}

export interface ProcessedData {
  period: { start: Date | null; end: Date | null };
  rawData: {
    sheet1Data: any[];
    sheet2Data: any[];
    sheet3Data: any[];
    sheet4Data: any[];
    sheet5Data: any[];
  };
  dealers: string[];
  // Métricas calculadas (retornadas por processExcelFile / applyFilters)
  avgLeadToTestDrive?: number | null;
  avgTestDriveToFaturamento?: number | null;
  avgTotalJourney?: number | null;
  avgLeadToFaturamento?: number | null;
  leads?: number;
  testDrives?: number;
  faturados?: number;
  totalStoreVisits?: number;
  decidedLeadsCount?: number;
  decidedLeadsPercentage?: number;
  leadsFaturadosCount?: number;
  funnelMetrics?: FunnelMetrics;
}
