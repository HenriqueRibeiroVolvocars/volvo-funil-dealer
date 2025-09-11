import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export const exportToPDF = async (elementId: string = 'dashboard-content') => {
  try {
    // Encontrar o elemento ou usar o body como fallback
    const element = document.getElementById(elementId) || document.body;
    
    // Capturar screenshot do elemento
    const canvas = await html2canvas(element, {
      scale: 2, // Melhor qualidade
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      height: element.scrollHeight,
      width: element.scrollWidth
    });

    // Configurar PDF
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Calcular dimensões para caber na página
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    
    // Manter proporção da imagem
    const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
    const scaledWidth = imgWidth * ratio;
    const scaledHeight = imgHeight * ratio;

    // Adicionar imagem ao PDF
    pdf.addImage(imgData, 'PNG', 0, 0, scaledWidth, scaledHeight);

    // Gerar nome do arquivo com data atual
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