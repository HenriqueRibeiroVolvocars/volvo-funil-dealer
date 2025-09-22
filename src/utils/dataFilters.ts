import { ProcessedData, RawSheetData, FunnelMetrics } from './excelProcessor';

export interface FilterOptions {
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
  selectedDealers: string[];
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

// Parser robusto de datas (dd/MM/yyyy, MM/yyyy, nomes PT-BR, ISO e serial do Excel)
function parseFlexibleDate(input: any): Date | null {
  if (!input && input !== 0) return null;
  if (input instanceof Date) {
    return isNaN(input.getTime()) ? null : input;
  }
  if (typeof input === 'number') {
    // Serial do Excel (base 1899-12-30)
    const date = new Date((input - 25569) * 86400 * 1000);
    return isNaN(date.getTime()) ? null : date;
  }
  if (typeof input === 'string') {
    let s = input.trim();
    if (!s) return null;

    // Normaliza acentos e caixa para comparação
    const normalize = (str: string) => str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const sNorm = normalize(s);

    // Se houver hora, considerar apenas a parte da data
    const datePart = s.split(' ')[0];

    // Padrão dd/MM/yyyy ou d/M/yy
    let m = datePart.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
    if (m) {
      let [_, d, mo, y] = m;
      const day = parseInt(d, 10);
      const month = parseInt(mo, 10);
      let year = parseInt(y, 10);
      if (year < 100) year += 2000;
      const date = new Date(year, month - 1, day);
      return isNaN(date.getTime()) ? null : date;
    }

    // Padrão MM/yyyy
    m = datePart.match(/^(\d{1,2})[\/\-](\d{4})$/);
    if (m) {
      const month = parseInt(m[1], 10);
      const year = parseInt(m[2], 10);
      const date = new Date(year, month - 1, 1);
      return isNaN(date.getTime()) ? null : date;
    }

    // Meses PT-BR (abreviação e nome completo): "set/2024", "setembro 2024"
    const monthMap: Record<string, number> = {
      jan: 1, janeiro: 1,
      fev: 2, fevereiro: 2,
      mar: 3, marco: 3, março: 3,
      abr: 4, abril: 4,
      mai: 5, maio: 5,
      jun: 6, junho: 6,
      jul: 7, julho: 7,
      ago: 8, agosto: 8,
      set: 9, setembro: 9,
      out: 10, outubro: 10,
      nov: 11, novembro: 11,
      dez: 12, dezembro: 12
    };
    let m2 = sNorm.match(/^([a-zç]{3,10})[\/\-\s]+(\d{4})$/);
    if (m2) {
      const monthName = m2[1];
      const year = parseInt(m2[2], 10);
      const month = monthMap[monthName];
      if (month) {
        const date = new Date(year, month - 1, 1);
        return isNaN(date.getTime()) ? null : date;
      }
    }

    // ISO ou outros formatos reconhecíveis pelo JS
    const iso = new Date(s);
    return isNaN(iso.getTime()) ? null : iso;
  }
  return null;
}

// Função para enriquecer Sheet3 com dados de dealer da Sheet1 usando correlação por ID
function enrichSheet3WithDealerInfo(sheet3Data: any[], sheet1Data: any[]): any[] {
  // Criar mapa de ID -> dados completos da Sheet1
  const sheet1Map = new Map();
  sheet1Data.forEach(row => {
    const id = getValue(row, ['ID', 'id', 'Id']);
    if (id) {
      sheet1Map.set(String(id).trim(), row);
    }
  });

  // Enriquecer Sheet3 com informações de dealer da Sheet1
  return sheet3Data.map(row => {
    const id = getValue(row, ['ID', 'id', 'Id']);
    if (id) {
      const sheet1Row = sheet1Map.get(String(id).trim());
      if (sheet1Row) {
        const dealer = getValue(sheet1Row, ['Dealer', 'dealer', 'Concessionaria', 'concessionaria', 'Concessionária', 'concessionária']);
        const dateSales = getValue(sheet1Row, ['dateSales', 'DateSales', 'Data', 'data']);
        
        return {
          ...row,
          Dealer: dealer,
          dateSales: dateSales
        };
      }
    }
    return row;
  });
}

// Função para filtrar uma aba específica
function filterSheetData(data: any[], filters: FilterOptions, sheet1Data?: any[], sheetName: string = 'unknown'): any[] {
  console.log(`🔍 Filtrando ${sheetName}:`, {
    totalRows: data.length,
    hasFilters: filters.selectedDealers.length > 0 || filters.dateRange.start || filters.dateRange.end,
    selectedDealers: filters.selectedDealers,
    dateRange: filters.dateRange
  });
  
  const filteredData = data.filter(row => {
    let rowToCheck = row;
    
    // Se for Sheet2 ou Sheet3, pode precisar correlacionar com Sheet1 para pegar dealer e data
    const needsCorrelation = !getValue(row, ['Dealer', 'dealer', 'Concessionaria', 'concessionaria', 'Concessionária', 'concessionária']) 
                          || !getValue(row, ['dateSales', 'DateSales', 'Data', 'data']);
    
    if (sheet1Data && needsCorrelation) {
      const id = getValue(row, ['ID', 'id', 'Id']);
      if (id) {
        const matchingSheet1Row = sheet1Data.find(s1Row => {
          const s1Id = getValue(s1Row, ['ID', 'id', 'Id']);
          return s1Id && String(s1Id).trim() === String(id).trim();
        });
        
        if (matchingSheet1Row) {
          const correlatedDealer = getValue(matchingSheet1Row, ['Dealer', 'dealer', 'Concessionaria', 'concessionaria', 'Concessionária', 'concessionária']);
          const correlatedDate = getValue(matchingSheet1Row, ['dateSales', 'DateSales', 'Data', 'data']);
          
          rowToCheck = {
            ...row,
            Dealer: correlatedDealer,
            dateSales: correlatedDate
          };
          
          console.log(`🔗 Correlação ${sheetName} - ID: ${id}, Dealer: ${correlatedDealer}, Date: ${correlatedDate}`);
        } else {
          console.log(`❌ ${sheetName} - ID ${id} não encontrado na Sheet1`);
        }
      }
    }

    // Filtro de dealer
    if (filters.selectedDealers.length > 0) {
      let dealer: any = getValue(rowToCheck, ['Dealer', 'dealer', 'Concessionaria', 'concessionaria', 'Concessionária', 'concessionária']);
      if (!dealer) {
        const keys = Object.keys(rowToCheck);
        if (sheetName === 'Sheet2' && keys[3]) dealer = rowToCheck[keys[3]]; // Coluna D
        if (sheetName === 'Sheet4' && keys[5]) dealer = rowToCheck[keys[5]]; // Coluna F
        if (sheetName === 'Sheet5' && keys[0]) dealer = rowToCheck[keys[0]]; // Coluna A
      }
      
      const dealerStr = dealer !== undefined && dealer !== null ? String(dealer).trim() : '';
      if (!dealerStr) {
        console.log(`🚫 ${sheetName} - Linha rejeitada: nenhum dealer encontrado`);
        return false;
      }
      
      // Normalizar o dealer da linha e comparar com dealers selecionados normalizados
      const normalizedRowDealer = normalizeDealerName(dealerStr);
      const normalizedSelectedDealers = filters.selectedDealers.map(d => normalizeDealerName(d));
      
      if (!normalizedSelectedDealers.includes(normalizedRowDealer)) {
        console.log(`🚫 ${sheetName} - Linha rejeitada por dealer: "${dealerStr}" (normalizado: "${normalizedRowDealer}") não está em ${filters.selectedDealers.map(d => `"${d}" (normalizado: "${normalizeDealerName(d)}")`)}`);
        return false;
      }
    }

    // Filtro de data
    if (filters.dateRange.start || filters.dateRange.end) {
      // Prioriza chaves padrão
      let dateValue = getValue(rowToCheck, ['dateSales', 'DateSales', 'Data', 'data']);

      // Fallbacks por planilha
      if (!dateValue && sheetName === 'Sheet2') {
        const keys = Object.keys(rowToCheck);
        if (keys[4]) dateValue = rowToCheck[keys[4]]; // Coluna E
      }

      if (!dateValue && sheetName === 'Sheet4') {
        const keys = Object.keys(rowToCheck);
        if (keys[3]) dateValue = rowToCheck[keys[3]]; // Coluna D
      }

      if (!dateValue && sheetName === 'Sheet5') {
        const keys = Object.keys(rowToCheck);
        if (keys[1]) dateValue = rowToCheck[keys[1]]; // Coluna B (data)
      }

      const date = parseFlexibleDate(dateValue);

      if (!date) {
        console.log(`🚫 ${sheetName} - Linha rejeitada: data inválida ou ausente (${dateValue}) com filtro ativo`);
        return false;
      }

      if (filters.dateRange.start && date < filters.dateRange.start) {
        console.log(`🚫 ${sheetName} - Linha rejeitada por data inicial: ${date} < ${filters.dateRange.start}`);
        return false;
      }
      if (filters.dateRange.end && date > filters.dateRange.end) {
        console.log(`🚫 ${sheetName} - Linha rejeitada por data final: ${date} > ${filters.dateRange.end}`);
        return false;
      }
    }

    return true;
  });
  
  console.log(`✅ ${sheetName} filtrado: ${filteredData.length} de ${data.length} linhas mantidas`);
  return filteredData;
}

// Recalcular as métricas com base nos dados filtrados
function calculateFilteredMetrics(
  filteredSheet1: any[], 
  filteredSheet2: any[], 
  filteredSheet3: any[], 
  filteredSheet4: any[],
  filteredSheet5: any[],
  filters: FilterOptions
): Omit<ProcessedData, 'period' | 'rawData' | 'dealers'> {
  // Contadores básicos
  const totalLeads = filteredSheet1.length;
  const totalTestDrives = filteredSheet2.length;
  const totalJornadaCompleta = filteredSheet3.length;
  const totalFaturamentos = filteredSheet4.length;

  // Calcular total de visitas nas lojas filtradas (soma da coluna C da Sheet5)
  let totalStoreVisits = 0;
  if (filteredSheet5 && filteredSheet5.length > 0) {
    filteredSheet5.forEach(row => {
      // A coluna C deve conter o número de visitas
      const keys = Object.keys(row);
      const visitasValue = keys[2] ? row[keys[2]] : null; // Coluna C (índice 2)
      if (visitasValue && !isNaN(Number(visitasValue))) {
        totalStoreVisits += Number(visitasValue);
      }
    });
  }

  console.info('📊 Métricas filtradas calculadas:');
  console.info(`  - Sheet1 filtrada (Leads): ${totalLeads} linhas`);
  console.info(`  - Sheet2 filtrada (Test Drives): ${totalTestDrives} linhas`);
  console.info(`  - Sheet3 filtrada (Jornada Completa): ${totalJornadaCompleta} linhas`);
  console.info(`  - Sheet4 filtrada (Faturamentos): ${totalFaturamentos} linhas`);
  console.info(`  - Sheet5 filtrada (Visitas nas Lojas): ${totalStoreVisits} visitas`);

  // Análise Sheet1 - Leads
  const leadsWithTestDrive = filteredSheet1.filter(row => {
    const flagTestDrive = getValue(row, ['Flag_TestDrive']);
    return flagTestDrive === 1 || flagTestDrive === '1';
  }).length;

  const leadsFaturados = filteredSheet1.filter(row => {
    const flagFaturado = getValue(row, ['Flag_Faturado']);
    return flagFaturado === 1 || flagFaturado === '1';
  }).length;

  // Análise Sheet2 - Test Drives
  const testDrivesFaturados = filteredSheet2.filter(row => {
    const flagFaturado = getValue(row, ['Flag_Faturado']);
    return flagFaturado === 1 || flagFaturado === '1';
  }).length;

  // Leads diretos (faturados sem test drive)
  const leadsDiretos = filteredSheet1.filter(row => {
    const flagFaturado = getValue(row, ['Flag_Faturado']);
    const flagTestDrive = getValue(row, ['Flag_TestDrive']);
    const isFaturado = flagFaturado === 1 || flagFaturado === '1';
    const hasTestDrive = flagTestDrive === 1 || flagTestDrive === '1';
    return isFaturado && !hasTestDrive;
  }).length;

  // Total de faturados
  const totalFaturados = totalFaturamentos > 0 ? totalFaturamentos : leadsFaturados + testDrivesFaturados;

  // Vendas do funil Test Drive -> Faturados (sempre da Sheet2 com flag)
  const vendasTD = testDrivesFaturados;

  console.info('📊 Funil Test Drive → Faturados:');
  console.info(`  - Total Test Drives (Sheet2): ${totalTestDrives}`);
  console.info(`  - Test Drives Faturados (Sheet2 flag): ${testDrivesFaturados}`);

  // Métricas dos funis
  const funnelMetrics: FunnelMetrics = {
    leadsDiretos: {
      leads: totalLeads,
      faturados: leadsDiretos
    },
    leadsComTestDrive: {
      leads: totalLeads,
      testDrives: leadsWithTestDrive
    },
    testDrivesVendidos: {
      testDrives: totalTestDrives,
      vendas: vendasTD
    },
    jornadaCompleta: {
      leads: totalLeads,
      faturados: totalJornadaCompleta
    },
    visitasTestDrive: {
      visitas: totalStoreVisits,
      testDrives: totalTestDrives
    },
    visitasFaturamento: {
      visitas: totalStoreVisits,
      faturados: totalFaturados
    }
  };

  // Calcular médias de tempo
  const leadToTestDriveValues: number[] = [];
  const testDriveToFaturamentoValues: number[] = [];
  const leadToFaturamentoValues: number[] = [];
  const totalJourneyValues: number[] = [];

  // Sheet1 - tempos de lead direto para faturamento
  filteredSheet1.forEach(row => {
    const tempoLeadFaturamento = getValue(row, ['Dias_Lead_Faturamento']);
    if (tempoLeadFaturamento && !isNaN(Number(tempoLeadFaturamento))) {
      leadToFaturamentoValues.push(Number(tempoLeadFaturamento));
    }
  });

  // Sheet2 - tempos
  filteredSheet2.forEach(row => {
    const tempoTestDriveFaturamento = getValue(row, ['Dias_TestDrive_Faturamento']);
    if (tempoTestDriveFaturamento && !isNaN(Number(tempoTestDriveFaturamento))) {
      testDriveToFaturamentoValues.push(Number(tempoTestDriveFaturamento));
    }
  });

  // Sheet3 - tempos completos (jornada completa)
  filteredSheet3.forEach(row => {
    const tempoLeadTD = getValue(row, ['Dias_Lead_TestDrive']);
    const tempoTDFaturamento = getValue(row, ['Dias_TestDrive_Faturamento']);
    const tempoTotal = getValue(row, ['Dias_Lead_Faturamento']);

    if (tempoLeadTD && !isNaN(Number(tempoLeadTD))) {
      leadToTestDriveValues.push(Number(tempoLeadTD));
    }
    if (tempoTDFaturamento && !isNaN(Number(tempoTDFaturamento))) {
      testDriveToFaturamentoValues.push(Number(tempoTDFaturamento));
    }
    if (tempoTotal && !isNaN(Number(tempoTotal))) {
      totalJourneyValues.push(Number(tempoTotal));
    }
  });

  // Calcular médias
  const avgLeadToTestDrive = leadToTestDriveValues.length > 0 
    ? leadToTestDriveValues.reduce((sum, val) => sum + val, 0) / leadToTestDriveValues.length 
    : null;
  
  const avgTestDriveToFaturamento = testDriveToFaturamentoValues.length > 0 
    ? testDriveToFaturamentoValues.reduce((sum, val) => sum + val, 0) / testDriveToFaturamentoValues.length 
    : null;
  
  const avgLeadToFaturamento = leadToFaturamentoValues.length > 0 
    ? leadToFaturamentoValues.reduce((sum, val) => sum + val, 0) / leadToFaturamentoValues.length 
    : null;
    
  const avgTotalJourney = totalJourneyValues.length > 0 
    ? totalJourneyValues.reduce((sum, val) => sum + val, 0) / totalJourneyValues.length 
    : null;

  // Total de leads que faturaram
  const totalLeadsFaturados = leadsFaturados + totalJornadaCompleta;

  // Leads decididos
  let decidedLeadsCount = 0;
  [...filteredSheet1, ...filteredSheet3].forEach(row => {
    const tempoTotal = getValue(row, ['Dias_Lead_Faturamento']);
    if (tempoTotal && !isNaN(Number(tempoTotal)) && Number(tempoTotal) <= 10) {
      decidedLeadsCount++;
    }
  });

  const decidedLeadsPercentage = totalLeadsFaturados > 0 ? (decidedLeadsCount / totalLeadsFaturados) * 100 : 0;

  return {
    avgLeadToTestDrive,
    avgTestDriveToFaturamento,
    avgTotalJourney,
    avgLeadToFaturamento,
    leads: totalLeads,
    testDrives: totalTestDrives,
    faturados: totalFaturados,
    totalStoreVisits,
    decidedLeadsCount,
    decidedLeadsPercentage,
    leadsFaturadosCount: totalLeadsFaturados,
    funnelMetrics
  };
}

export function applyFilters(originalData: ProcessedData, filters: FilterOptions): ProcessedData {
  // Se não há filtros aplicados, retorna os dados originais
  if (filters.selectedDealers.length === 0 && !filters.dateRange.start && !filters.dateRange.end) {
    return originalData;
  }

  // Filtrar cada aba (Sheet2 e Sheet3 podem precisar de correlação com Sheet1)
  const filteredSheet1 = filterSheetData(originalData.rawData.sheet1Data, filters, undefined, 'Sheet1');
  const filteredSheet2 = filterSheetData(originalData.rawData.sheet2Data, filters, originalData.rawData.sheet1Data, 'Sheet2');
  const filteredSheet3 = filterSheetData(originalData.rawData.sheet3Data, filters, originalData.rawData.sheet1Data, 'Sheet3');
  const filteredSheet4 = filterSheetData(originalData.rawData.sheet4Data, filters, undefined, 'Sheet4');
  const filteredSheet5 = filterSheetData(originalData.rawData.sheet5Data || [], filters, undefined, 'Sheet5');

  // Recalcular métricas
  const newMetrics = calculateFilteredMetrics(filteredSheet1, filteredSheet2, filteredSheet3, filteredSheet4, filteredSheet5, filters);

  // Calcular novo período baseado nos dados filtrados
  const allFilteredDates: Date[] = [];
  
  [...filteredSheet1, ...filteredSheet2, ...filteredSheet3, ...filteredSheet4, ...filteredSheet5].forEach((row, index) => {
    let dateValue = getValue(row, ['dateSales', 'DateSales', 'Data', 'data']);

    // Fallbacks por planilha no array combinado
    if (!dateValue) {
      const keys = Object.keys(row);
      const s1Len = filteredSheet1.length;
      const s2Len = filteredSheet2.length;
      const s3Len = filteredSheet3.length;
      const s4Len = filteredSheet4.length;

      if (index >= s1Len && index < s1Len + s2Len) {
        if (keys[4]) dateValue = row[keys[4]]; // Sheet2 Coluna E
      } else if (index >= s1Len + s2Len && index < s1Len + s2Len + s3Len) {
        // Sheet3: sem fallback específico
      } else if (index >= s1Len + s2Len + s3Len && index < s1Len + s2Len + s3Len + s4Len) {
        if (keys[3]) dateValue = row[keys[3]]; // Sheet4 Coluna D
      } else {
        if (keys[1]) dateValue = row[keys[1]]; // Sheet5 Coluna B
      }
    }

    const date = parseFlexibleDate(dateValue);
    if (date) {
      allFilteredDates.push(date);
    }
  });

  let newPeriodStart = originalData.period.start;
  let newPeriodEnd = originalData.period.end;

  if (allFilteredDates.length > 0) {
    allFilteredDates.sort((a, b) => a.getTime() - b.getTime());
    newPeriodStart = allFilteredDates[0];
    newPeriodEnd = allFilteredDates[allFilteredDates.length - 1];
  }

  return {
    ...newMetrics,
    period: {
      start: newPeriodStart,
      end: newPeriodEnd
    },
    rawData: {
      sheet1Data: filteredSheet1,
      sheet2Data: filteredSheet2,
      sheet3Data: filteredSheet3,
      sheet4Data: filteredSheet4,
      sheet5Data: filteredSheet5
    },
    dealers: originalData.dealers // Manter lista original de dealers
  };
}