/**
 * extractPdfPages.js
 * 
 * REFACTORIZADO para extraer IMÁGENES REALES (XObjects) del PDF.
 * Si una página no contiene imágenes, ofrece renderizar la página completa como fallback.
 */

import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorkerUrl;

/**
 * @param {File} pdfFile
 * @param {object} [options]
 * @param {number} [options.maxPages=20]
 * @param {function} [options.onProgress]
 * @returns {Promise<File[]>} - Array de archivos JPG extraídos
 */
export async function extractPdfPages(pdfFile, options = {}) {
  const { maxPages = 20, onProgress } = options;
  const arrayBuffer = await pdfFile.arrayBuffer();
  
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const numPages = Math.min(pdf.numPages, maxPages);
  const extractedFiles = [];
  const baseName = pdfFile.name.replace(/\.pdf$/i, '').replace(/[^a-zA-Z0-9_-]/g, '_');

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    try {
      const page = await pdf.getPage(pageNum);
      const operatorList = await page.getOperatorList();
      
      const imagesOnPage = [];
      
      // Recorrer lista de operadores para encontrar imágenes
      for (let i = 0; i < operatorList.fnArray.length; i++) {
        const fn = operatorList.fnArray[i];
        
        // paintImageXObject o paintInlineImageXObject
        if (fn === pdfjsLib.OPS.paintImageXObject || fn === pdfjsLib.OPS.paintInlineImageXObject) {
          const imgId = operatorList.argsArray[i][0];
          
          try {
            const img = await new Promise((resolve, reject) => {
              page.objs.get(imgId, (image) => {
                if (image) resolve(image);
                else reject(new Error('Image not found in objs'));
              });
            });

            if (img && img.width > 200 && img.height > 200) { // Filtrar iconos/logos
              const blob = await imageToBlob(img);
              if (blob) {
                imagesOnPage.push(new File([blob], `${baseName}_p${pageNum}_img${imagesOnPage.length + 1}.jpg`, { type: 'image/jpeg' }));
              }
            }
          } catch (e) {
            console.warn(`[PDF] Error al obtener objeto de imagen ${imgId} en página ${pageNum}:`, e.message);
          }
        }
      }

      if (imagesOnPage.length > 0) {
        extractedFiles.push(...imagesOnPage);
      } else {
        // FALLBACK: Si no hay imágenes individuales claras, renderizar la página completa
        // Esto es vital para PDFs que son "una imagen gigante por página" (scanned)
        console.log(`[PDF] Página ${pageNum} no tiene XObjects, renderizando página completa.`);
        const pageBlob = await renderPageToBlob(page);
        if (pageBlob) {
          extractedFiles.push(new File([pageBlob], `${baseName}_p${pageNum}_page.jpg`, { type: 'image/jpeg' }));
        }
      }

      page.cleanup();
    } catch (err) {
      console.warn(`[PDF] Error procesando página ${pageNum}:`, err.message);
    }

    if (onProgress) onProgress(pageNum, numPages);
  }

  return extractedFiles;
}

/**
 * Convierte un objeto de imagen de PDF.js a Blob JPG
 */
async function imageToBlob(img) {
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d');
  
  // PDF.js retorna ImageData o buffers crudos dependiendo del tipo
  if (img.data instanceof Uint8ClampedArray) {
    const imageData = new ImageData(img.data, img.width, img.height);
    ctx.putImageData(imageData, 0, 0);
  } else {
    // Para algunos formatos (ej: ImageBitmap o img tags internos)
    ctx.drawImage(img, 0, 0);
  }
  
  return new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.9));
}

/**
 * Renderiza la página completa a Blob (Estrategia fallback)
 */
async function renderPageToBlob(page) {
  const viewport = page.getViewport({ scale: 1.5 });
  const canvas = document.createElement('canvas');
  canvas.width = Math.floor(viewport.width);
  canvas.height = Math.floor(viewport.height);
  const ctx = canvas.getContext('2d');

  await page.render({ canvasContext: ctx, viewport }).promise;
  return new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.85));
}

export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
