import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export const exportToPDF = async (elementId: string = 'dashboard-content') => {
  try {
    // Encontrar os elementos principais
    const mainElement = document.getElementById(elementId) || document.body;
    const dealersComparison = document.querySelector('[data-component="dealers-comparison"]') as HTMLElement;
    
    // Configurar PDF
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    // Capturar dashboard principal (sem o comparativo)
    if (dealersComparison) {
      dealersComparison.style.display = 'none';
    }
    
    const mainCanvas = await html2canvas(mainElement, {
      scale: 1.2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      height: mainElement.scrollHeight,
      width: mainElement.scrollWidth
    });

    // Restaurar visibilidade do comparativo
    if (dealersComparison) {
      dealersComparison.style.display = '';
    }

    // Adicionar primeira página (dashboard principal)
    const mainImgData = mainCanvas.toDataURL('image/jpeg', 0.8);
    const mainRatio = Math.min(pdfWidth / mainCanvas.width, pdfHeight / mainCanvas.height);
    const mainScaledWidth = mainCanvas.width * mainRatio;
    const mainScaledHeight = mainCanvas.height * mainRatio;
    
    pdf.addImage(mainImgData, 'JPEG', 0, 0, mainScaledWidth, mainScaledHeight);

    // Se existe comparativo de dealers, adicionar em página separada
    if (dealersComparison) {
      // Remover altura máxima temporariamente para capturar tabela completa
      const originalStyle = dealersComparison.style.cssText;
      const tableContainer = dealersComparison.querySelector('.overflow-x-auto') as HTMLElement;
      if (tableContainer) {
        tableContainer.style.maxHeight = 'none';
        tableContainer.style.overflowY = 'visible';
      }

      const dealersCanvas = await html2canvas(dealersComparison, {
        scale: 1.2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        height: dealersComparison.scrollHeight,
        width: dealersComparison.scrollWidth
      });

      // Restaurar estilo original
      dealersComparison.style.cssText = originalStyle;

      // Nova página para o comparativo
      pdf.addPage();
      
      const dealersImgData = dealersCanvas.toDataURL('image/jpeg', 0.8);
      const dealersRatio = Math.min(pdfWidth / dealersCanvas.width, pdfHeight / dealersCanvas.height);
      const dealersScaledWidth = dealersCanvas.width * dealersRatio;
      const dealersScaledHeight = dealersCanvas.height * dealersRatio;
      
      pdf.addImage(dealersImgData, 'JPEG', 0, 0, dealersScaledWidth, dealersScaledHeight);
    }

    // Gerar nome do arquivo
    const now = new Date();
    const dateString = now.toLocaleDateString('pt-BR').replace(/\//g, '-');
    const fileName = `funil-comercial-volvo-${dateString}.pdf`;

    // Fazer download
    pdf.save(fileName);
    
    return true;
  } catch (error) {
    console.error('Erro ao exportar PDF:', error);
    throw new Error('Falha ao gerar PDF. Tente novamente.');
  }
};