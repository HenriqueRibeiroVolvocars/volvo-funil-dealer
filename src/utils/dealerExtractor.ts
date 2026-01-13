import { getValue, normalizeDealerName } from './excelHelpers';

export function extractDealersFromSheets(...sheets: any[][]): string[] {
  const dealerMap = new Map<string, string>();

  const addDealer = (dealerName: string) => {
    if (dealerName && typeof dealerName === 'string' && dealerName.trim()) {
      const original = dealerName.trim();
      const normalized = normalizeDealerName(original);
      if (normalized && !dealerMap.has(normalized)) dealerMap.set(normalized, original);
    }
  };

  const [sheet1Data = [], sheet2Data = [], sheet3Data = [], sheet4Data = []] = sheets;

  let sheet1Dealers = 0;
  sheet1Data.forEach(row => {
    const dealer = getValue(row, ['Dealer', 'dealer', 'Concessionaria', 'concessionaria', 'Concessionária', 'concessionária']);
    if (dealer) { addDealer(String(dealer)); sheet1Dealers++; }
  });

  let sheet2Dealers = 0;
  sheet2Data.forEach(row => {
    const raw = getValue(row, ['Dealer', 'dealer', 'Concessionaria', 'concessionaria', 'Concessionária', 'concessionária']);
    if (raw !== undefined && raw !== null) {
      const dealerStr = String(raw).trim();
      if (dealerStr && !dealerStr.includes('@') && !/\d{3,}/.test(dealerStr) && dealerStr.length >= 3) { addDealer(dealerStr); sheet2Dealers++; }
    }
  });

  let sheet3Dealers = 0;
  sheet3Data.forEach(row => {
    const dealer = getValue(row, ['Dealer', 'dealer', 'Concessionaria', 'concessionaria', 'Concessionária', 'concessionária']);
    if (dealer) { addDealer(String(dealer)); sheet3Dealers++; }
  });

  let sheet4Dealers = 0;
  sheet4Data.forEach(row => {
    const raw = getValue(row, ['Dealer', 'dealer', 'Concessionaria', 'concessionaria', 'Concessionária', 'concessionária']);
    if (raw !== undefined && raw !== null) {
      const dealerStr = String(raw).trim();
      if (dealerStr && !dealerStr.includes('@') && !/\d{3,}/.test(dealerStr) && dealerStr.length >= 3) { addDealer(dealerStr); sheet4Dealers++; }
    }
  });

  console.info('🏢 Extraindo dealers de cada sheet:');
  console.info(`  - Sheet1: ${sheet1Dealers} linhas com dealer`);
  console.info(`  - Sheet2: ${sheet2Dealers} linhas com dealer`);
  console.info(`  - Sheet3: ${sheet3Dealers} linhas com dealer`);
  console.info(`  - Sheet4: ${sheet4Dealers} linhas com dealer`);

  const dealers = Array.from(dealerMap.values()).sort();
  console.info(`🏢 Total de dealers únicos encontrados: ${dealers.length}`);
  console.info(`🏢 Lista de dealers:`, dealers);

  return dealers;
}
