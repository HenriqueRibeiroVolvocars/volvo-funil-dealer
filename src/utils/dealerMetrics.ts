import { ProcessedData, FunnelMetrics } from './excelProcessor';
import { FilterOptions } from './dataFilters';

export interface DealerMetrics {
  dealerName: string;
  leads: number;
  testDrives: number;
  sales: number;
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

// Função para extrair dealer de uma linha, considerando diferentes sheets
function getDealerFromRow(row: any, sheetName: string, sheet1Data?: any[]): string | null {
  // Primeiro, tentar extrair dealer diretamente da linha
  let dealer = getValue(row, ['Dealer', 'dealer', 'Concessionaria', 'concessionaria', 'Concessionária', 'concessionária']);
  
  if (!dealer) {
    const keys = Object.keys(row);
    // Para Sheet2, dealer pode estar na coluna D (índice 3)
    if (sheetName === 'Sheet2' && keys[3]) {
      dealer = row[keys[3]];
    }
    // Para Sheet4, dealer pode estar na coluna F (índice 5)
    if (sheetName === 'Sheet4' && keys[5]) {
      dealer = row[keys[5]];
    }
  }
  
  // Se não encontrou e tem dados da Sheet1 para correlação
  if (!dealer && sheet1Data) {
    const id = getValue(row, ['ID', 'id', 'Id']);
    if (id) {
      const matchingSheet1Row = sheet1Data.find(s1Row => {
        const s1Id = getValue(s1Row, ['ID', 'id', 'Id']);
        return s1Id && String(s1Id).trim() === String(id).trim();
      });
      
      if (matchingSheet1Row) {
        dealer = getValue(matchingSheet1Row, ['Dealer', 'dealer', 'Concessionaria', 'concessionaria', 'Concessionária', 'concessionária']);
      }
    }
  }
  
  return dealer ? String(dealer).trim() : null;
}

// Função para filtrar dados por período apenas (sem filtro de dealer)
function filterByDateOnly(data: any[], filters: FilterOptions, sheetName: string): any[] {
  if (!filters.dateRange.start && !filters.dateRange.end) {
    return data;
  }
  
  return data.filter(row => {
    let dateValue = getValue(row, ['dateSales', 'DateSales', 'Data', 'data']);
    
    // Para Sheet2, a data pode estar na coluna E (índice 4)
    if (!dateValue && sheetName === 'Sheet2') {
      const keys = Object.keys(row);
      if (keys[4]) dateValue = row[keys[4]]; // Coluna E
    }
    
    // Para Sheet4, a data pode estar na coluna D (índice 3)  
    if (!dateValue && sheetName === 'Sheet4') {
      const keys = Object.keys(row);
      if (keys[3]) dateValue = row[keys[3]]; // Coluna D
    }
    
    if (dateValue) {
      let date: Date | null = null;
      
      if (typeof dateValue === 'string') {
        date = new Date(dateValue);
      } else if (typeof dateValue === 'number') {
        // Se for número serial do Excel
        date = new Date((dateValue - 25569) * 86400 * 1000);
      }
      
      if (date && !isNaN(date.getTime())) {
        if (filters.dateRange.start && date < filters.dateRange.start) {
          return false;
        }
        if (filters.dateRange.end && date > filters.dateRange.end) {
          return false;
        }
      }
    }
    
    return true;
  });
}

export function calculateDealerComparison(
  originalData: ProcessedData, 
  filters: FilterOptions
): DealerComparisonData {
  // Filtrar dados apenas por período, mantendo todos os dealers
  const dateFilters: FilterOptions = {
    dateRange: filters.dateRange,
    selectedDealers: [] // Não aplicar filtro de dealer
  };
  
  const filteredSheet1 = filterByDateOnly(originalData.rawData.sheet1Data, dateFilters, 'Sheet1');
  const filteredSheet2 = filterByDateOnly(originalData.rawData.sheet2Data, dateFilters, 'Sheet2');
  const filteredSheet3 = filterByDateOnly(originalData.rawData.sheet3Data, dateFilters, 'Sheet3');
  const filteredSheet4 = filterByDateOnly(originalData.rawData.sheet4Data, dateFilters, 'Sheet4');
  
  // Mapear dados por dealer
  const dealerDataMap = new Map<string, {
    leads: number;
    testDrives: number;
    sales: number;
    leadsWithTestDrive: number;
    testDrivesFaturados: number;
  }>();
  
  // Processar Sheet1 (Leads)
  filteredSheet1.forEach(row => {
    const dealer = getDealerFromRow(row, 'Sheet1');
    if (dealer) {
      if (!dealerDataMap.has(dealer)) {
        dealerDataMap.set(dealer, {
          leads: 0,
          testDrives: 0,
          sales: 0,
          leadsWithTestDrive: 0,
          testDrivesFaturados: 0
        });
      }
      
      const dealerData = dealerDataMap.get(dealer)!;
      dealerData.leads++;
      
      // Verificar se lead teve test drive
      const flagTestDrive = getValue(row, ['Flag_TestDrive']);
      if (flagTestDrive === 1 || flagTestDrive === '1') {
        dealerData.leadsWithTestDrive++;
      }
      
      // Verificar se lead foi faturado
      const flagFaturado = getValue(row, ['Flag_Faturado']);
      if (flagFaturado === 1 || flagFaturado === '1') {
        dealerData.sales++;
      }
    }
  });
  
  // Processar Sheet2 (Test Drives)
  filteredSheet2.forEach(row => {
    const dealer = getDealerFromRow(row, 'Sheet2', filteredSheet1);
    if (dealer) {
      if (!dealerDataMap.has(dealer)) {
        dealerDataMap.set(dealer, {
          leads: 0,
          testDrives: 0,
          sales: 0,
          leadsWithTestDrive: 0,
          testDrivesFaturados: 0
        });
      }
      
      const dealerData = dealerDataMap.get(dealer)!;
      dealerData.testDrives++;
      
      // Verificar se test drive foi faturado
      const flagFaturado = getValue(row, ['Flag_Faturado']);
      if (flagFaturado === 1 || flagFaturado === '1') {
        dealerData.testDrivesFaturados++;
      }
    }
  });
  
  // Processar Sheet4 (Vendas diretas)
  filteredSheet4.forEach(row => {
    const dealer = getDealerFromRow(row, 'Sheet4');
    if (dealer) {
      if (!dealerDataMap.has(dealer)) {
        dealerDataMap.set(dealer, {
          leads: 0,
          testDrives: 0,
          sales: 0,
          leadsWithTestDrive: 0,
          testDrivesFaturados: 0
        });
      }
      
      const dealerData = dealerDataMap.get(dealer)!;
      dealerData.sales++;
    }
  });
  
  // Converter para array de métricas por dealer
  const dealerMetrics: DealerMetrics[] = Array.from(dealerDataMap.entries()).map(([dealerName, data]) => {
    const leadsToTestDriveRate = data.leads > 0 ? (data.leadsWithTestDrive / data.leads) * 100 : 0;
    const testDriveToSalesRate = data.testDrives > 0 ? (data.testDrivesFaturados / data.testDrives) * 100 : 0;
    const totalConversionRate = data.leads > 0 ? (data.sales / data.leads) * 100 : 0;
    
    return {
      dealerName,
      leads: data.leads,
      testDrives: data.testDrives,
      sales: data.sales,
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
    leadsWithTestDrive: acc.leadsWithTestDrive + (dealer.leads * dealer.leadsToTestDriveRate / 100),
    testDrivesFaturados: acc.testDrivesFaturados + (dealer.testDrives * dealer.testDriveToSalesRate / 100)
  }), {
    leads: 0,
    testDrives: 0,
    sales: 0,
    leadsWithTestDrive: 0,
    testDrivesFaturados: 0
  });
  
  const brMetrics: DealerMetrics = {
    dealerName: 'Média BR',
    leads: totals.leads,
    testDrives: totals.testDrives,
    sales: totals.sales,
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