import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

/**
 * Exportar un bloque de texto con dibujos a PDF
 *
 * @param {HTMLElement} element - Elemento DOM a exportar
 * @param {string} filename - Nombre del archivo PDF
 * @param {Object} options - Opciones adicionales
 */
export async function exportToPDF(element, filename = 'documento.pdf', options = {}) {
  const {
    quality = 0.95,
    format = 'a4',
    orientation = 'portrait',
    margin = 10
  } = options;

  try {
    // Capturar el elemento como imagen con html2canvas
    const canvas = await html2canvas(element, {
      scale: 2, // Mayor escala para mejor calidad
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    });

    const imgData = canvas.toDataURL('image/png', quality);
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;

    // Crear PDF
    const pdf = new jsPDF({
      orientation: orientation,
      unit: 'mm',
      format: format
    });

    // Calcular dimensiones del PDF
    const pdfWidth = pdf.internal.pageSize.getWidth() - (margin * 2);
    const pdfHeight = (imgHeight * pdfWidth) / imgWidth;

    // Agregar imagen al PDF
    pdf.addImage(imgData, 'PNG', margin, margin, pdfWidth, pdfHeight);

    // Descargar PDF
    pdf.save(filename);

    return { success: true };
  } catch (error) {
    console.error('Error exportando a PDF:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Exportar múltiples bloques de texto a un solo PDF
 *
 * @param {Array<HTMLElement>} elements - Array de elementos DOM
 * @param {string} filename - Nombre del archivo PDF
 */
export async function exportMultipleToPDF(elements, filename = 'documento.pdf') {
  try {
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const margin = 10;
    const pdfWidth = pdf.internal.pageSize.getWidth() - (margin * 2);
    const pdfHeight = pdf.internal.pageSize.getHeight() - (margin * 2);

    for (let i = 0; i < elements.length; i++) {
      const element = elements[i];

      // Capturar elemento
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png', 0.95);
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;

      const scaledHeight = (imgHeight * pdfWidth) / imgWidth;

      // Agregar nueva página si no es la primera
      if (i > 0) {
        pdf.addPage();
      }

      // Agregar imagen
      pdf.addImage(imgData, 'PNG', margin, margin, pdfWidth, Math.min(scaledHeight, pdfHeight));
    }

    // Descargar PDF
    pdf.save(filename);

    return { success: true };
  } catch (error) {
    console.error('Error exportando múltiples bloques a PDF:', error);
    return { success: false, error: error.message };
  }
}

export default { exportToPDF, exportMultipleToPDF };
