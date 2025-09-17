import * as XLSX from 'xlsx';

export interface FunnelMetrics {
  leadsDiretos: {
    leads: number;
    faturados: number;
  };
  leadsComTestDrive: {
    leads: number;
    testDrives: number;
  };
  testDrivesVendidos: {
    testDrives: number;
    vendas: number;
  };
  jornadaCompleta: {
    leads: number;
    faturados: number;
  };
  visitasTestDrive: {
    visitas: number;
    testDrives: number;
  };
  visitasFaturamento: {
    visitas: number;
    faturados: number;
  };
}

export interface RawSheetData {
  sheet1Data: any[];
  sheet2Data: any[];
  sheet3Data: any[];
  sheet4Data: any[];
  sheet5Data: any[];
}

export interface ProcessedData {
  avgLeadToTestDrive: number | null;
  avgTestDriveToFaturamento: number | null; 
  avgTotalJourney: number | null;
  avgLeadToFaturamento: number | null;
  leads: number;
  testDrives: number;
  faturados: number;
  totalStoreVisits: number;
  decidedLeadsCount: number;
  decidedLeadsPercentage: number;
  leadsFaturadosCount: number;
  funnelMetrics: FunnelMetrics;
  period: {
    start: Date | null;
    end: Date | null;
  };
  rawData: RawSheetData;
  dealers: string[];
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

function parseExcelDate(dateValue: any): Date | null {
  if (!dateValue) return null;
  
  const str = String(dateValue).trim();
  
  // Formato YYYY-MM-DD (ISO)
  const isoMatch = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  }
  
  // Formato DD/MM/YYYY
  const ddmmyyyyMatch = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (ddmmyyyyMatch) {
    const [, day, month, year] = ddmmyyyyMatch;
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  }
  
  // Tentar parseamento direto
  const date = new Date(str);
  return isNaN(date.getTime()) ? null : date;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('pt-BR');
}

export function formatBrazilianNumber(value: number | null): string {
  if (value === null || value === undefined) return 'N/A';
  return Math.round(value).toLocaleString('pt-BR');
}

export function formatBrazilianPercent(value: number): string {
  return `${value.toFixed(1).replace('.', ',')}%`;
}

export async function processExcelFile(file: File): Promise<ProcessedData> {
  return new Promise((resolve, reject) => {
    console.info('🚀 Iniciando upload do arquivo:', file.name);
    
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        console.info('🔍 Iniciando processamento do arquivo:', file.name);
        
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        console.info('📊 Abas encontradas na planilha:', workbook.SheetNames);

        if (workbook.SheetNames.length < 3) {
          throw new Error(`Esperado pelo menos 3 abas na planilha, encontradas apenas ${workbook.SheetNames.length}`);
        }

        // Processar as abas (3, 4 ou 5)
        const sheet1Data: any[] = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
        const sheet2Data: any[] = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[1]]);
        const sheet3Data: any[] = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[2]]);
        const sheet4Data: any[] = workbook.SheetNames.length >= 4 
          ? XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[3]]) 
          : [];
        const sheet5Data: any[] = workbook.SheetNames.length >= 5 
          ? XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[4]]) 
          : [];

        console.info('📝 Dados encontrados:');
        console.info(`  - Sheet1 (Leads): ${sheet1Data.length} linhas`);
        console.info(`  - Sheet2 (Test Drives): ${sheet2Data.length} linhas`);
        console.info(`  - Sheet3 (Jornada Completa): ${sheet3Data.length} linhas`);
        console.info(`  - Sheet4 (Faturamentos): ${sheet4Data.length} linhas`);
        console.info(`  - Sheet5 (Visitas nas Lojas): ${sheet5Data.length} linhas`);

        if (sheet1Data.length === 0) {
          throw new Error('Nenhum dado encontrado na Sheet1');
        }

        // Extrair período de análise da coluna I (dateSales) da sheet1
        console.log('📊 Iniciando extração de datas...');
        const allDates: Date[] = [];
        
        sheet1Data.forEach((row, index) => {
          const dateValue = row.dateSales;
          
          if (index < 3) {
            console.log(`Linha ${index}: dateSales =`, dateValue, typeof dateValue);
          }
          
          if (dateValue) {
            let date: Date | null = null;
            
            if (typeof dateValue === 'string') {
              // Parse do formato YYYY-MM-DD
              date = new Date(dateValue);
            } else if (typeof dateValue === 'number') {
              // Se for número serial do Excel
              date = new Date((dateValue - 25569) * 86400 * 1000);
            }
            
            if (date && !isNaN(date.getTime())) {
              allDates.push(date);
            }
          }
        });

        console.log(`📅 Total de datas válidas: ${allDates.length}`);
        
        let periodStart: Date | null = null;
        let periodEnd: Date | null = null;

        if (allDates.length > 0) {
          allDates.sort((a, b) => a.getTime() - b.getTime());
          periodStart = allDates[0];
          periodEnd = allDates[allDates.length - 1];
          
          console.log(`📅 Período encontrado: ${periodStart.toLocaleDateString('pt-BR')} a ${periodEnd.toLocaleDateString('pt-BR')}`);
        } else {
          console.log('❌ Nenhuma data válida encontrada!');
        }

        // Extrair dealers únicos das abas
        const dealers = extractDealers(sheet1Data, sheet2Data, sheet3Data, sheet4Data);

        // Processar métricas
        const metrics = calculateMetrics(sheet1Data, sheet2Data, sheet3Data, sheet4Data, sheet5Data);
        
        // Criar resultado completo com período
        const result: ProcessedData = {
          ...metrics,
          period: {
            start: periodStart,
            end: periodEnd
          },
          rawData: {
            sheet1Data,
            sheet2Data,
            sheet3Data,
            sheet4Data,
            sheet5Data
          },
          dealers
        };
        
        console.log('📅 Período extraído:', {
          start: periodStart?.toLocaleDateString('pt-BR'),
          end: periodEnd?.toLocaleDateString('pt-BR')
        });
        
        console.info('✅ Processamento concluído com sucesso');
        
        resolve(result);
        
      } catch (error) {
        console.error('💥 Erro no processamento:', error);
        reject(error);
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Erro ao ler o arquivo'));
    };
    
    reader.readAsArrayBuffer(file);
  });
}

function extractDealers(sheet1Data: any[], sheet2Data: any[], sheet3Data: any[], sheet4Data: any[]): string[] {
  const dealerMap = new Map<string, string>(); // normalized -> original
  
  console.info('🏢 Extraindo dealers de cada sheet:');
  
  // Função para adicionar dealer ao mapa com normalização
  const addDealer = (dealerName: string) => {
    if (dealerName && typeof dealerName === 'string' && dealerName.trim()) {
      const original = dealerName.trim();
      const normalized = normalizeDealerName(original);
      if (normalized && !dealerMap.has(normalized)) {
        dealerMap.set(normalized, original);
      }
    }
  };
  
  // Extrair dealers da Sheet1
  let sheet1Dealers = 0;
  sheet1Data.forEach(row => {
    const dealer = getValue(row, ['Dealer', 'dealer', 'Concessionaria', 'concessionaria', 'Concessionária', 'concessionária']);
    if (dealer) {
      addDealer(dealer);
      sheet1Dealers++;
    }
  });
  console.info(`  - Sheet1: ${sheet1Dealers} linhas com dealer`);
  
  let sheet2Dealers = 0;
  sheet2Data.forEach(row => {
    let dealer: any = getValue(row, ['Dealer', 'dealer', 'Concessionaria', 'concessionaria', 'Concessionária', 'concessionária']);
    if (!dealer) {
      const keys = Object.keys(row);
      const fallbackKey = keys[3]; // Coluna D
      if (fallbackKey) dealer = row[fallbackKey];
    }
    if (dealer !== undefined && dealer !== null) {
      addDealer(String(dealer));
      sheet2Dealers++;
    }
  });
  console.info(`  - Sheet2: ${sheet2Dealers} linhas com dealer`);
  
  // Extrair dealers da Sheet3
  let sheet3Dealers = 0;
  sheet3Data.forEach(row => {
    const dealer = getValue(row, ['Dealer', 'dealer', 'Concessionaria', 'concessionaria', 'Concessionária', 'concessionária']);
    if (dealer) {
      addDealer(dealer);
      sheet3Dealers++;
    }
  });
  console.info(`  - Sheet3: ${sheet3Dealers} linhas com dealer`);
  
  // Extrair dealers da Sheet4
  let sheet4Dealers = 0;
  sheet4Data.forEach(row => {
    let dealer: any = getValue(row, ['Dealer', 'dealer', 'Concessionaria', 'concessionaria', 'Concessionária', 'concessionária']);
    if (!dealer) {
      const keys = Object.keys(row);
      const fallbackKey = keys[5]; // Coluna F
      if (fallbackKey) dealer = row[fallbackKey];
    }
    if (dealer !== undefined && dealer !== null) {
      addDealer(String(dealer));
      sheet4Dealers++;
    }
  });
  console.info(`  - Sheet4: ${sheet4Dealers} linhas com dealer`);
  
  const dealers = Array.from(dealerMap.values()).sort();
  console.info(`🏢 Total de dealers únicos encontrados: ${dealers.length}`);
  console.info(`🏢 Lista de dealers:`, dealers);
  
  return dealers;
}

function calculateMetrics(sheet1Data: any[], sheet2Data: any[], sheet3Data: any[], sheet4Data: any[] = [], sheet5Data: any[] = []): Omit<ProcessedData, 'period' | 'rawData' | 'dealers'> {
  // Contadores básicos
  const totalLeads = sheet1Data.length;
  const totalTestDrives = sheet2Data.length;
  const totalJornadaCompleta = sheet3Data.length;
  const totalFaturamentos = sheet4Data.length;
  
  // Calcular total de visitas nas lojas (soma da coluna C da Sheet5)
  let totalStoreVisits = 0;
  if (sheet5Data && sheet5Data.length > 0) {
    sheet5Data.forEach(row => {
      // A coluna C deve conter o número de visitas
      const keys = Object.keys(row);
      const visitasValue = keys[2] ? row[keys[2]] : null; // Coluna C (índice 2)
      if (visitasValue && !isNaN(Number(visitasValue))) {
        totalStoreVisits += Number(visitasValue);
      }
    });
  }
  
  console.info('📊 Métricas calculadas:');
  console.info(`  - Sheet1 (Leads): ${totalLeads} linhas`);
  console.info(`  - Sheet2 (Test Drives): ${totalTestDrives} linhas`);
  console.info(`  - Sheet3 (Jornada Completa): ${totalJornadaCompleta} linhas`);
  console.info(`  - Sheet4 (Faturamentos): ${totalFaturamentos} linhas`);
  console.info(`  - Sheet5 (Visitas nas Lojas): ${totalStoreVisits} visitas`);

  // Análise Sheet1 - Leads
  const leadsWithTestDrive = sheet1Data.filter(row => {
    const flagTestDrive = getValue(row, ['Flag_TestDrive']);
    return flagTestDrive === 1 || flagTestDrive === '1';
  }).length;

  const leadsFaturados = sheet1Data.filter(row => {
    const flagFaturado = getValue(row, ['Flag_Faturado']);
    return flagFaturado === 1 || flagFaturado === '1';
  }).length;

  // Análise Sheet2 - Test Drives
  const testDrivesFaturados = sheet2Data.filter(row => {
    const flagFaturado = getValue(row, ['Flag_Faturado']);
    return flagFaturado === 1 || flagFaturado === '1';
  }).length;

  // Leads diretos (faturados sem test drive)
  const leadsDiretos = sheet1Data.filter(row => {
    const flagFaturado = getValue(row, ['Flag_Faturado']);
    const flagTestDrive = getValue(row, ['Flag_TestDrive']);
    const isFaturado = flagFaturado === 1 || flagFaturado === '1';
    const hasTestDrive = flagTestDrive === 1 || flagTestDrive === '1';
    return isFaturado && !hasTestDrive;
  }).length;

  // Total de faturados - usar sheet4 se disponível, senão usar cálculo anterior
  const totalFaturados = totalFaturamentos > 0 ? totalFaturamentos : leadsFaturados + testDrivesFaturados;

  console.info('📊 Resultados:');
  console.info(`  - Leads com test drive: ${leadsWithTestDrive}`);
  console.info(`  - Leads faturados: ${leadsFaturados}`);
  console.info(`  - Test drives faturados (Sheet2 flag): ${testDrivesFaturados}`);
  console.info(`  - Leads diretos: ${leadsDiretos}`);
  console.info(`  - Total faturados: ${totalFaturados}`);
  console.info('📊 Funil Test Drive → Faturados (Sheet2):');
  console.info(`  - Test Drives: ${totalTestDrives}`);
  console.info(`  - Vendas (flag Sheet2): ${testDrivesFaturados}`);

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
      testDrives: totalTestDrives, // usar total da sheet2
      vendas: testDrivesFaturados
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
  const leadToFaturamentoValues: number[] = []; // Apenas sheet1
  const totalJourneyValues: number[] = []; // Apenas sheet3

  // Sheet1 - tempos de lead direto para faturamento
  sheet1Data.forEach(row => {
    const tempoLeadFaturamento = getValue(row, ['Dias_Lead_Faturamento']);
    if (tempoLeadFaturamento && !isNaN(Number(tempoLeadFaturamento))) {
      leadToFaturamentoValues.push(Number(tempoLeadFaturamento));
    }
  });

  // Sheet2 - tempos
  sheet2Data.forEach(row => {
    const tempoTestDriveFaturamento = getValue(row, ['Dias_TestDrive_Faturamento']);
    if (tempoTestDriveFaturamento && !isNaN(Number(tempoTestDriveFaturamento))) {
      testDriveToFaturamentoValues.push(Number(tempoTestDriveFaturamento));
    }
  });

  // Sheet3 - tempos completos (jornada completa)
  sheet3Data.forEach(row => {
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

  // Total de leads que faturaram (diretos + test drive)
  const totalLeadsFaturados = leadsFaturados + totalJornadaCompleta;

  // Leads decididos: dos leads que faturaram (direto + test drive), quantos decidiram em ≤10 dias
  let decidedLeadsCount = 0;
  [...sheet1Data, ...sheet3Data].forEach(row => {
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