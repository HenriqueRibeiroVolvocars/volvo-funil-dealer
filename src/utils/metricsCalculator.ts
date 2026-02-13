import { getValue } from './excelHelpers';
import { FunnelMetrics } from './types';

export function calculateMetrics(
  sheet1Data: any[],
  sheet2Data: any[],
  sheet3Data: any[],
  sheet4Data: any[] = [],
  sheet5Data: any[] = [],
  sheet6Data: any[] = [],
  sheet7Data: any[] = []
): any {
  const totalLeads = sheet1Data.length;
  const totalTestDrives = sheet2Data.length;
  const totalJornadaCompleta = sheet3Data.length;
  const totalFaturamentos = sheet4Data.length;

  let totalStoreVisits = 0;
  if (sheet5Data && sheet5Data.length > 0) {
    sheet5Data.forEach(row => {
      const keys = Object.keys(row);
      const visitasValue = keys[2] ? row[keys[2]] : null;
      if (visitasValue !== null && visitasValue !== undefined && !isNaN(Number(visitasValue))) {
        totalStoreVisits += Number(visitasValue);
      }
    });
  }

  const leadsWithTestDrive = sheet1Data.filter(row => {
    const flagTestDrive = getValue(row, ['Flag_TestDrive', 'flag_testdrive', 'flag_test_drive', 'FlagTestDrive']);
    return flagTestDrive === 1 || flagTestDrive === '1' || flagTestDrive === true;
  }).length;

  const leadsFaturados = sheet1Data.filter(row => {
    const flagFaturado = getValue(row, ['Flag_Faturado', 'flag_faturado', 'faturado', 'Faturado']);
    return flagFaturado === 1 || flagFaturado === '1' || flagFaturado === true;
  }).length;

  const testDrivesFaturados = sheet2Data.filter(row => {
    const flagFaturado = getValue(row, ['Flag_Faturado', 'flag_faturado', 'faturado', 'Faturado']);
    return flagFaturado === 1 || flagFaturado === '1' || flagFaturado === true;
  }).length;

  const leadsDiretos = sheet1Data.filter(row => {
    const flagFaturado = getValue(row, ['Flag_Faturado', 'flag_faturado', 'faturado', 'Faturado']);
    const flagTestDrive = getValue(row, ['Flag_TestDrive', 'flag_testdrive', 'flag_test_drive', 'FlagTestDrive']);
    const isFaturado = flagFaturado === 1 || flagFaturado === '1' || flagFaturado === true;
    const hasTestDrive = flagTestDrive === 1 || flagTestDrive === '1' || flagTestDrive === true;
    return isFaturado && !hasTestDrive;
  }).length;

  const totalFaturados = totalFaturamentos > 0 ? totalFaturamentos : leadsFaturados + testDrivesFaturados;

  const funnelMetrics: FunnelMetrics = {
    leadsDiretos: { leads: totalLeads, faturados: leadsDiretos },
    leadsComTestDrive: { leads: totalLeads, testDrives: leadsWithTestDrive },
    testDrivesVendidos: { testDrives: totalTestDrives, vendas: testDrivesFaturados },
    jornadaCompleta: { leads: totalLeads, faturados: totalJornadaCompleta },
    visitasTestDrive: { visitas: totalStoreVisits, testDrives: totalTestDrives },
    visitasFaturamento: { visitas: totalStoreVisits, faturados: totalFaturados }
  };

  const leadToTestDriveValues: number[] = [];
  const testDriveToFaturamentoValues: number[] = [];
  const leadToFaturamentoValues: number[] = [];
  const totalJourneyValues: number[] = [];

  sheet1Data.forEach(row => {
    const tempoLeadFaturamento = getValue(row, ['Dias_Lead_Faturamento', 'dias_lead_faturamento', 'DiasLeadFaturamento']);
    if (tempoLeadFaturamento !== null && tempoLeadFaturamento !== undefined && !isNaN(Number(tempoLeadFaturamento))) {
      leadToFaturamentoValues.push(Number(tempoLeadFaturamento));
    }
    const tempoLeadTD = getValue(row, ['Dias_Lead_TestDrive', 'dias_lead_testdrive']);
    if (tempoLeadTD !== null && tempoLeadTD !== undefined && !isNaN(Number(tempoLeadTD))) {
      leadToTestDriveValues.push(Number(tempoLeadTD));
    }
  });

  sheet2Data.forEach(row => {
    const tempoTestDriveFaturamento = getValue(row, ['Dias_TestDrive_Faturamento', 'dias_testdrive_faturamento']);
    if (tempoTestDriveFaturamento !== null && tempoTestDriveFaturamento !== undefined && !isNaN(Number(tempoTestDriveFaturamento))) {
      testDriveToFaturamentoValues.push(Number(tempoTestDriveFaturamento));
    }
  });

  sheet3Data.forEach(row => {
    const tempoLeadTD = getValue(row, ['Dias_Lead_TestDrive', 'dias_lead_testdrive']);
    const tempoTDFaturamento = getValue(row, ['Dias_TestDrive_Faturamento', 'dias_testdrive_faturamento']);
    const tempoTotal = getValue(row, ['Dias_Lead_Faturamento', 'dias_lead_faturamento']);

    if (tempoLeadTD !== null && tempoLeadTD !== undefined && !isNaN(Number(tempoLeadTD))) {
      leadToTestDriveValues.push(Number(tempoLeadTD));
    }
    if (tempoTDFaturamento !== null && tempoTDFaturamento !== undefined && !isNaN(Number(tempoTDFaturamento))) {
      testDriveToFaturamentoValues.push(Number(tempoTDFaturamento));
    }
    if (tempoTotal !== null && tempoTotal !== undefined && !isNaN(Number(tempoTotal))) {
      totalJourneyValues.push(Number(tempoTotal));
    }
  });

  const avg = (arr: number[]) => (arr.length > 0 ? arr.reduce((s, v) => s + v, 0) / arr.length : null);

  const avgLeadToTestDrive = avg(leadToTestDriveValues);
  const avgTestDriveToFaturamento = avg(testDriveToFaturamentoValues);
  const avgLeadToFaturamento = avg(leadToFaturamentoValues);
  const avgTotalJourney = avg(totalJourneyValues);

  const totalLeadsFaturados = leadsFaturados + totalJornadaCompleta;

  let decidedLeadsCount = 0;
  [...sheet1Data, ...sheet3Data].forEach(row => {
    const tempoTotal = getValue(row, ['Dias_Lead_Faturamento', 'dias_lead_faturamento']);
    if (tempoTotal !== null && tempoTotal !== undefined && !isNaN(Number(tempoTotal)) && Number(tempoTotal) <= 10) {
      decidedLeadsCount++;
    }
  });

  const decidedLeadsPercentage = totalLeadsFaturados > 0 ? (decidedLeadsCount / totalLeadsFaturados) * 100 : 0;

  // Calcular percentuais de clientes novos e antigos
  let percNovos = 0;
  let percAntigos = 0;
  if (sheet6Data && sheet6Data.length > 0) {
    const novosValues: number[] = [];
    const antigosValues: number[] = [];
    sheet6Data.forEach(row => {
      const percNovosVal = getValue(row, ['PercNovos', 'percNovos', 'percentualNovos']);
      const percAntigosVal = getValue(row, ['PercAntigos', 'percAntigos', 'percentualAntigos']);
      if (percNovosVal !== null && percNovosVal !== undefined && !isNaN(Number(percNovosVal))) {
        novosValues.push(Number(percNovosVal));
      }
      if (percAntigosVal !== null && percAntigosVal !== undefined && !isNaN(Number(percAntigosVal))) {
        antigosValues.push(Number(percAntigosVal));
      }
    });
    percNovos = novosValues.length > 0 ? novosValues.reduce((s, v) => s + v, 0) / novosValues.length : 0;
    percAntigos = antigosValues.length > 0 ? antigosValues.reduce((s, v) => s + v, 0) / antigosValues.length : 0;
  }

  // Calcular OSAT para Car Handover - New Car e Test Drive
  let osatCarHandover = 0;
  let osatTestDrive = 0;
  if (sheet7Data && sheet7Data.length > 0) {
    const carHandoverValues: number[] = [];
    const testDriveValues: number[] = [];
    sheet7Data.forEach(row => {
      const surveyEvent = getValue(row, ['SURVEY_EVENT_NAME', 'survey_event_name']);
      const satisfaction = getValue(row, ['media_overall_satisfaction', 'mediaOverallSatisfaction']);
      if (satisfaction !== null && satisfaction !== undefined && !isNaN(Number(satisfaction))) {
        if (surveyEvent === 'Car Handover - New Car') {
          carHandoverValues.push(Number(satisfaction));
        } else if (surveyEvent === 'Test Drive') {
          testDriveValues.push(Number(satisfaction));
        }
      }
    });
    osatCarHandover = carHandoverValues.length > 0 ? carHandoverValues.reduce((s, v) => s + v, 0) / carHandoverValues.length : 0;
    osatTestDrive = testDriveValues.length > 0 ? testDriveValues.reduce((s, v) => s + v, 0) / testDriveValues.length : 0;
  }

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
    funnelMetrics,
    percNovos,
    percAntigos,
    osatCarHandover,
    osatTestDrive
  };
}
