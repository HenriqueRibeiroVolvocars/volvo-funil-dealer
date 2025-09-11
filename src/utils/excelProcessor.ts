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
}

export interface ProcessedData {
  avgLeadToTestDrive: number | null;
  avgTestDriveToFaturamento: number | null; 
  avgTotalJourney: number | null;
  avgLeadToFaturamento: number | null;
  leads: number;
  testDrives: number;
  faturados: number;
  decidedLeadsCount: number;
  decidedLeadsPercentage: number;
  leadsFaturadosCount: number;
  funnelMetrics: FunnelMetrics;
  period: {
    start: Date | null;
    end: Date | null;
  };
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

        // Processar as abas (3 ou 4)
        const sheet1Data: any[] = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
        const sheet2Data: any[] = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[1]]);
        const sheet3Data: any[] = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[2]]);
        const sheet4Data: any[] = workbook.SheetNames.length >= 4 
          ? XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[3]]) 
          : [];

        console.info('📝 Dados encontrados:');
        console.info(`  - Sheet1 (Leads): ${sheet1Data.length} linhas`);
        console.info(`  - Sheet2 (Test Drives): ${sheet2Data.length} linhas`);
        console.info(`  - Sheet3 (Jornada Completa): ${sheet3Data.length} linhas`);
        console.info(`  - Sheet4 (Faturamentos): ${sheet4Data.length} linhas`);

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

        // Processar métricas
        const metrics = calculateMetrics(sheet1Data, sheet2Data, sheet3Data, sheet4Data);
        
        // Criar resultado completo com período
        const result: ProcessedData = {
          ...metrics,
          period: {
            start: periodStart,
            end: periodEnd
          }
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

function calculateMetrics(sheet1Data: any[], sheet2Data: any[], sheet3Data: any[], sheet4Data: any[] = []): Omit<ProcessedData, 'period'> {
  
  // Contadores básicos
  const totalLeads = sheet1Data.length;
  const totalTestDrives = sheet2Data.length;
  const totalJornadaCompleta = sheet3Data.length;
  const totalFaturamentos = sheet4Data.length;
  console.info(`  - Sheet3 (Jornada Completa): ${totalJornadaCompleta}`);
  console.info(`  - Sheet4 (Faturamentos): ${totalFaturamentos}`);

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
  console.info(`  - Test drives faturados: ${testDrivesFaturados}`);
  console.info(`  - Leads diretos: ${leadsDiretos}`);
  console.info(`  - Total faturados: ${totalFaturados}`);

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
      testDrives: totalTestDrives, // Corrigido: usar total da sheet2
      vendas: testDrivesFaturados
    },
    jornadaCompleta: {
      leads: totalLeads,
      faturados: totalJornadaCompleta
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
    decidedLeadsCount,
    decidedLeadsPercentage,
    leadsFaturadosCount: totalLeadsFaturados,
    funnelMetrics
  };
}