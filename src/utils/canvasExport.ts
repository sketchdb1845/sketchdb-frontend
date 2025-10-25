import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';

export interface ExportOptions {
  quality?: number;
  backgroundColor?: string;
  scale?: number;
  transparent?: boolean;
  includeWatermark?: boolean;
  filename?: string;
}

// Helper function to download image
const downloadImage = (dataUrl: string, filename: string, format: string = 'png') => {
  const a = document.createElement('a');
  a.download = `${filename}.${format}`;
  a.href = dataUrl;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};

// Helper function to create watermark
const addWatermark = (
  canvas: HTMLCanvasElement, 
  ctx: CanvasRenderingContext2D, 
  text: string = 'SketchDB'
): void => {
  const fontSize = Math.max(12, canvas.width * 0.02);
  ctx.font = `${fontSize}px Arial`;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
  ctx.lineWidth = 1;
  
  const x = 20;
  const y = canvas.height - 20;
  
  // Add text with outline
  ctx.strokeText(text, x, y);
  ctx.fillText(text, x, y);
};

export const exportCanvasAsPNG = async (options: ExportOptions = {}): Promise<void> => {
  try {
    // Find the React Flow wrapper
    const reactFlowWrapper = document.querySelector('.react-flow') as HTMLElement;
    if (!reactFlowWrapper) {
      throw new Error('React Flow wrapper not found');
    }

    const {
      scale = 2,
      transparent = false,
      includeWatermark = true,
      filename = 'schema-diagram',
      backgroundColor = 'rgb(15, 23, 42)'
    } = options;

    console.log('Starting PNG export...');

    // Deselect all nodes for clean export
    const selectedNodes = reactFlowWrapper.querySelectorAll('.react-flow__node.selected');
    selectedNodes.forEach(node => node.classList.remove('selected'));

    // Get the computed background color if not transparent
    const finalBackgroundColor = transparent ? 'transparent' : 
      (backgroundColor || window.getComputedStyle(reactFlowWrapper).backgroundColor || 'rgb(15, 23, 42)');

    // Export using html-to-image
    const dataUrl = await toPng(reactFlowWrapper, {
      backgroundColor: finalBackgroundColor,
      pixelRatio: scale,
      quality: 1,
      skipFonts: false,
      cacheBust: true,
      filter: (node: Element) => {
        // Exclude UI controls from export
        if (node.classList) {
          return !node.classList.contains('react-flow__controls') &&
                 !node.classList.contains('react-flow__minimap') &&
                 !node.classList.contains('react-flow__attribution');
        }
        return true;
      },
    });

    if (includeWatermark) {
      // Create canvas for watermark
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error('Could not get canvas context');
      }

      const img = new Image();
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        
        // Draw the original image
        ctx.drawImage(img, 0, 0);
        
        // Add watermark
        addWatermark(canvas, ctx);
        
        // Convert to data URL and download
        const finalDataUrl = canvas.toDataURL('image/png', 1.0);
        downloadImage(finalDataUrl, filename, 'png');
        
        console.log('PNG export completed successfully');
      };
      
      img.onerror = () => {
        console.error('Failed to load image for watermark');
        // Fallback: download without watermark
        downloadImage(dataUrl, filename, 'png');
      };
      
      img.src = dataUrl;
    } else {
      // Download without watermark
      downloadImage(dataUrl, filename, 'png');
      console.log('PNG export completed successfully');
    }

  } catch (error) {
    console.error('PNG export failed:', error);
    throw error;
  }
};

export const exportCanvasAsPDF = async (options: ExportOptions = {}): Promise<void> => {
  try {
    // Find the React Flow wrapper
    const reactFlowWrapper = document.querySelector('.react-flow') as HTMLElement;
    if (!reactFlowWrapper) {
      throw new Error('React Flow wrapper not found');
    }

    const {
      scale = 2,
      filename = 'schema-diagram',
      backgroundColor = 'rgb(15, 23, 42)'
    } = options;

    console.log('Starting PDF export...');

    // Deselect all nodes for clean export
    const selectedNodes = reactFlowWrapper.querySelectorAll('.react-flow__node.selected');
    selectedNodes.forEach(node => node.classList.remove('selected'));

    // Get the element dimensions
    const rect = reactFlowWrapper.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    // Export as PNG first
    const dataUrl = await toPng(reactFlowWrapper, {
      backgroundColor: backgroundColor,
      pixelRatio: scale,
      quality: 1,
      skipFonts: false,
      cacheBust: true,
      filter: (node: Element) => {
        // Exclude UI controls from export
        if (node.classList) {
          return !node.classList.contains('react-flow__controls') &&
                 !node.classList.contains('react-flow__minimap') &&
                 !node.classList.contains('react-flow__attribution');
        }
        return true;
      },
    });

    // Create PDF
    const pdf = new jsPDF({
      orientation: width > height ? 'landscape' : 'portrait',
      unit: 'px',
      format: [width, height],
    });

    // Set background color for PDF
    pdf.setFillColor(15, 23, 42); // Dark background
    pdf.rect(0, 0, width, height, 'F');

    // Add the image to PDF
    pdf.addImage(dataUrl, 'PNG', 0, 0, width, height);

    // Add title
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(16);
    pdf.text('Database Schema Diagram', 20, 30);

    // Save the PDF
    pdf.save(`${filename}.pdf`);
    
    console.log('PDF export completed successfully');

  } catch (error) {
    console.error('PDF export failed:', error);
    throw error;
  }
};
