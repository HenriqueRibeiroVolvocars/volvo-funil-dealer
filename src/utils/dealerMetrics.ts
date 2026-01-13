import { ProcessedData, FunnelMetrics } from './types';
import { FilterOptions, applyFilters } from './dataFilters';

const FLAG_TESTDRIVE_KEYS = ['Flag_TestDrive', 'flag_testdrive', 'flag_test_drive', 'FlagTestDrive', 'flagTestDrive'];
const FLAG_FATURADO_KEYS = ['Flag_Faturado', 'flag_faturado', 'faturado', 'Faturado', 'flagFaturado', 'FlagFaturado'];

export interface DealerMetrics {
  dealerName: string;
  leads: number;
  testDrives: number;
  sales: number;
  storeVisits: number;
  leadsToTestDriveRate: number;
  testDriveToSalesRate: number;
  totalConversionRate: number;
}

export interface DealerComparisonData {
  dealerMetrics: DealerMetrics[];
  brMetrics: DealerMetrics;
}

// Função auxiliar para buscar valores nas colunas
function getValue(row: any, possibleKeys: string[]): any {
  for (const key of possibleKeys) {
    if (row[key] !== undefined && row[key] !== null && row[key] !== '') {
      return row[key];
    }
  }
  return null;
}

// Função para normalizar nomes de dealers
function normalizeDealerName(dealerName: string): string {
  if (!dealerName) return '';
  
  return dealerName
    .trim()
    .replace(/\([^)]*\)/g, '') // Remove códigos entre parênteses como (462011)
    .toLowerCase()
    .normalize('NFD') // Decompõe caracteres acentuados
    .replace(/[\u0300-\u036f]/g, '') // Remove os diacríticos (acentos)
    .replace(/\s+/g, ' ') // Normaliza espaços múltiplos para um só
    .trim();
}

// Função para extrair dealer de uma linha, considerando diferentes sheets
function getDealerFromRow(row: any): string | null {
  if (!row) return null;

  // Aceitar várias chaves usadas em diferentes sheets/arquivos
  const dealer = getValue(row, ['Dealer', 'dealer', 'Concessionaria', 'concessionaria', 'Concessionária', 'concessionária', 'nome_concessionaria', 'nome_concessionária', 'Nome_Concessionaria', 'Nome_Concessionária', 'NomeDealer', 'nomeDealer']);
  return dealer ? String(dealer).trim() : null;
}

export function calculateDealerComparison(
  originalData: ProcessedData, 
  filters: FilterOptions
): DealerComparisonData {
  // Usar a mesma função de filtro que applyFilters usa para garantir consistência
  console.groupCollapsed('🧮 DealerComparison');
  console.log('Filtros recebidos (apenas período):', {
    start: filters.dateRange.start,
    end: filters.dateRange.end
  });
  console.log('Linhas originais por sheet:', {
    sheet1: originalData.rawData.sheet1Data.length,
    sheet2: originalData.rawData.sheet2Data.length,
    sheet3: originalData.rawData.sheet3Data.length,
    sheet4: originalData.rawData.sheet4Data.length
  });
  const filteredData = applyFilters(originalData, {
    dateRange: filters.dateRange,
    selectedDealers: [] // Não aplicar filtro de dealer para manter todos
  });
  console.log('Linhas após filtro de período:', {
    period: filteredData.period,
    sheet1: filteredData.rawData.sheet1Data.length,
    sheet2: filteredData.rawData.sheet2Data.length,
    sheet3: filteredData.rawData.sheet3Data.length,
    sheet4: filteredData.rawData.sheet4Data.length
  });
  console.groupEnd();
  const useSheet4 = filteredData.rawData.sheet4Data.length > 0;
  
  // Mapear dados por dealer usando nomes normalizados como chave
  const dealerDataMap = new Map<string, {
    originalName: string;
    leads: number;
    testDrives: number;
    sales: number;
    storeVisits: number;
    leadsWithTestDrive: number;
    testDrivesFaturados: number;
  }>();
  
  // Função helper para obter/criar entrada no mapa de dealers
  const getDealerData = (dealerName: string) => {
    const normalized = normalizeDealerName(dealerName);
    if (!dealerDataMap.has(normalized)) {
      dealerDataMap.set(normalized, {
        originalName: dealerName,
        leads: 0,
        testDrives: 0,
        sales: 0,
        storeVisits: 0,
        leadsWithTestDrive: 0,
        testDrivesFaturados: 0
      });
    }
    return dealerDataMap.get(normalized)!;
  };
  
  // Processar Sheet1 (Leads)
  filteredData.rawData.sheet1Data.forEach(row => {
    const dealer = getDealerFromRow(row);
    if (dealer) {
      const dealerData = getDealerData(dealer);
      dealerData.leads++;
      
      // Verificar se lead teve test drive
      const flagTestDrive = getValue(row, FLAG_TESTDRIVE_KEYS);
      if (flagTestDrive === 1 || flagTestDrive === '1' || flagTestDrive === true) {
        dealerData.leadsWithTestDrive++;
      }
      
      // Verificar se lead foi faturado (somar somente se não houver Sheet4)
      const flagFaturado = getValue(row, FLAG_FATURADO_KEYS);
      if (!useSheet4 && (flagFaturado === 1 || flagFaturado === '1' || flagFaturado === true)) {
        dealerData.sales++;
      }
    }
  });
  
  // Processar Sheet2 (Test Drives)
  filteredData.rawData.sheet2Data.forEach(row => {
    const dealer = getDealerFromRow(row);
    if (dealer) {
      const dealerData = getDealerData(dealer);
      dealerData.testDrives++;
      
      // Verificar se test drive foi faturado
      const flagFaturado = getValue(row, FLAG_FATURADO_KEYS);
      if (flagFaturado === 1 || flagFaturado === '1' || flagFaturado === true) {
        dealerData.testDrivesFaturados++;
      }
    }
  });
  
  // Processar Sheet4 (Vendas diretas)
  filteredData.rawData.sheet4Data.forEach(row => {
    const dealer = getDealerFromRow(row);
    if (dealer) {
      const dealerData = getDealerData(dealer);
      dealerData.sales++;
    }
  });

  // Processar Sheet5 (Visitas nas Lojas)
  filteredData.rawData.sheet5Data.forEach(row => {
    const dealer = getDealerFromRow(row);
    if (dealer) {
      const dealerData = getDealerData(dealer);
      // A coluna C deve conter o número de visitas
      const keys = Object.keys(row);
      const visitasValue = keys[2] ? row[keys[2]] : null; // Coluna C (índice 2)
      if (visitasValue && !isNaN(Number(visitasValue))) {
        dealerData.storeVisits += Number(visitasValue);
      }
    }
  });

  console.log('🗂️ dealerDataMap size after processing sheets:', dealerDataMap.size);
  // Logar até 5 entradas para debug
  let sample = 0;
  dealerDataMap.forEach((v, k) => {
    if (sample < 5) {
      console.log('  dealer sample:', k, v);
      sample++;
    }
  });
  
  if (!useSheet4) {
    dealerDataMap.forEach((data) => {
      data.sales += data.testDrivesFaturados;
    });
  }
  
  // Converter para array de métricas por dealer
  const dealerMetrics: DealerMetrics[] = Array.from(dealerDataMap.entries()).map(([normalizedName, data]) => {
    const leadsToTestDriveRate = data.leads > 0 ? (data.leadsWithTestDrive / data.leads) * 100 : 0;
    const testDriveToSalesRate = data.testDrives > 0 ? (data.testDrivesFaturados / data.testDrives) * 100 : 0;
    const totalConversionRate = data.leads > 0 ? (data.sales / data.leads) * 100 : 0;
    
    return {
      dealerName: data.originalName, // Usar nome original, não normalizado
      leads: data.leads,
      testDrives: data.testDrives,
      sales: data.sales,
      storeVisits: data.storeVisits,
      leadsToTestDriveRate,
      testDriveToSalesRate,
      totalConversionRate
    };
  });
  
  // Calcular métricas BR (média nacional)
  const totals = dealerMetrics.reduce((acc, dealer) => ({
    leads: acc.leads + dealer.leads,
    testDrives: acc.testDrives + dealer.testDrives,
    sales: acc.sales + dealer.sales,
    storeVisits: acc.storeVisits + dealer.storeVisits,
    leadsWithTestDrive: acc.leadsWithTestDrive + (dealer.leads * dealer.leadsToTestDriveRate / 100),
    testDrivesFaturados: acc.testDrivesFaturados + (dealer.testDrives * dealer.testDriveToSalesRate / 100)
  }), {
    leads: 0,
    testDrives: 0,
    sales: 0,
    storeVisits: 0,
    leadsWithTestDrive: 0,
    testDrivesFaturados: 0
  });
  
  const brMetrics: DealerMetrics = {
    dealerName: 'Média BR',
    leads: totals.leads,
    testDrives: totals.testDrives,
    sales: totals.sales,
    storeVisits: totals.storeVisits,
    leadsToTestDriveRate: totals.leads > 0 ? (totals.leadsWithTestDrive / totals.leads) * 100 : 0,
    testDriveToSalesRate: totals.testDrives > 0 ? (totals.testDrivesFaturados / totals.testDrives) * 100 : 0,
    totalConversionRate: totals.leads > 0 ? (totals.sales / totals.leads) * 100 : 0
  };
  
  // Ordenar dealers por total de leads (maior para menor)
  dealerMetrics.sort((a, b) => b.leads - a.leads);
  
  return {
    dealerMetrics,
    brMetrics
  };
}