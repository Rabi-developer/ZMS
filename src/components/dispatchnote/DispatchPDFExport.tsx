'use client';
import { toast } from 'react-toastify';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getAllSellers } from '@/apis/seller';
import { getAllBuyer } from '@/apis/buyer';

// Load ZMS logo
const ZMS_LOGO = '/ZMS-logo.png';
let GetSellerAddress = '';
let GetBuyerAddress = '';

// Determine dark mode
const isDarkMode = typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;

// Style constants
const styles = {
  label: { size: 8, color: [0, 0, 0] as [number, number, number] },
  value: { size: 7, color: [0, 0, 0] as [number, number, number] },
  margins: { left: 10, right: 10 },
};

interface Contract {
  contractNumber?: string;
  buyerRefer?: string;
  widthOrColor?: string;
  fabricDetails?: string;
  totalDispatchQuantity?: number | string;
  base?: string;
}

interface DispatchNote {
  seller?: string;
  buyer?: string;
  date?: string;
  bilty?: string;
  transporter?: string;
  remarks?: string;
  relatedContracts?: Contract[];
}

interface ExportToPDFProps {
  dispatchNote: DispatchNote | null;
  sellerSignature?: string;
  buyerSignature?: string;
  zmsSignature?: string;
  sellerAddress?: string;
  buyerAddress?: string;
}

const formatFabricDetails = (contract: Contract): string => {
  return [contract.widthOrColor || '', contract.fabricDetails || '']
    .filter((item) => item.trim() !== '')
    .join(' / ') || '-';
};

const DispatchPDFExport = {
  exportToPDF: async ({
    dispatchNote,
    sellerSignature,
    buyerSignature,
    zmsSignature,
    sellerAddress,
    buyerAddress,
  }: ExportToPDFProps) => {
    if (!dispatchNote) {
      toast('Dispatch Note not found', { type: 'error' });
      console.error('Dispatch Note is null or undefined');
      return;
    }

    try {
      // Fetch seller and buyer addresses
      try {
        const [sellerData, buyerData] = await Promise.all([getAllSellers(), getAllBuyer()]);
        const sellerMatch = sellerData.data.find(
          (item: { sellerName: string; address: string }) => item.sellerName === dispatchNote.seller
        );
        const buyerMatch = buyerData.data.find(
          (item: { buyerName: string; address: string }) => item.buyerName === dispatchNote.buyer
        );
        GetSellerAddress = sellerMatch ? sellerMatch.address : sellerAddress || '-';
        GetBuyerAddress = buyerMatch ? buyerMatch.address : buyerAddress || '-';
      } catch (error) {
        console.error('Error fetching seller/buyer addresses:', error);
        toast('Failed to fetch addresses, proceeding with defaults', { type: 'warning' });
        GetSellerAddress = sellerAddress || '-';
        GetBuyerAddress = buyerAddress || '-';
      }

      const doc = new jsPDF();

      // Header
      doc.setFillColor(6, 182, 212);
      doc.rect(0, 0, 210, 28, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(24);
      doc.setTextColor(0, 0, 0);
      doc.text('ZM SOURCING', 105, 10, { align: 'center' });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6);
      doc.text('Suit No. 108, SP Chamber, Main Estate Avenue, SITE Karachi', 105, 15, { align: 'center' });
      doc.text('Phone: +92 21 32550917-18', 105, 20, { align: 'center' });

      // Logo
      try {
        doc.addImage(ZMS_LOGO, 'PNG', 10, 6, 18, 12);
      } catch (error) {
        console.warn('Failed to load logo, using placeholder text:', error);
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        doc.text('[ZMS Logo]', 10, 14);
      }

      // Subheading: ZMS/DispatchNo/Month/Year
      let yPos = 39;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(0, 0, 0);
      let monthYear = '-';
      if (dispatchNote.date) {
        try {
          const dateObj = new Date(dispatchNote.date);
          if (!isNaN(dateObj.getTime())) {
            monthYear = `${dateObj.getMonth() + 1}/${dateObj.getFullYear()}`;
          } else {
            console.warn('Invalid date provided:', dispatchNote.date);
          }
        } catch (error) {
          console.error('Error parsing dispatch note date:', error);
        }
      }
      const dispatchSubheading = `ZMS/${dispatchNote.bilty || '-'}/${monthYear}`;
      doc.text(dispatchSubheading, 10, yPos, { align: 'left' });

      // Title
      yPos = 34;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text('DISPATCH NOTE', 105, yPos, { align: 'center' });

      // Date
      yPos = 39;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(0, 0, 0);
      const formattedDate = dispatchNote.date
        ? (() => {
            try {
              const dateObj = new Date(dispatchNote.date);
              if (isNaN(dateObj.getTime())) {
                console.warn('Invalid date provided:', dispatchNote.date);
                return '-';
              }
              return dateObj.toLocaleDateString('en-GB', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
              }).split('/').join('-');
            } catch (error) {
              console.error('Error parsing date:', error);
              return '-';
            }
          })()
        : '-';
      doc.text(`Date: ${formattedDate}`, 200, yPos, { align: 'right' });
      yPos += 8;

      // First Table: Date, Seller, Buyer, etc.
      const tableBody: (string | number)[][] = [];

      // 1st Row: Date
      tableBody.push(['', '', '', '', 'Date:', ` ${formattedDate}`]);

      // 2nd Row: Seller and Transporter
      tableBody.push([
        `Seller:`,
        `${dispatchNote.seller || '-'}`,
        '',
        '',
        'Transporter:',
        ` ${dispatchNote.transporter || '-'}`,
      ]);

      // 3rd Row: Buyer and Vehicle#
      tableBody.push([
        'Buyer:',
        `${dispatchNote.buyer || '-'}`,
        '',
        '',
        'Vehicle#',
        ` ${dispatchNote.remarks || '-'}`,
      ]);

      // 4th Row: Gap (Empty Row)
      tableBody.push(['', '', '', '', '', '']);

      autoTable(doc, {
        startY: yPos,
        body: tableBody,
        styles: {
          fontSize: 8,
          cellPadding: { top: 2, bottom: 2, left: 2, right: 2 },
          lineColor: [0, 0, 0],
          lineWidth: 0.1,
          textColor: [0, 0, 0],
          fontStyle: 'normal',
        },        columnStyles: {
          0: { cellWidth: 30 },
          1: { cellWidth: 60 },
          2: { cellWidth: 10 },
          3: { cellWidth: 10 },
          4: { cellWidth: 30 },
          5: { cellWidth: 60 },
        },
        margin: { left: 10, right: 10 },
        theme: 'grid',        didDrawCell: (data) => {
          const { row, cell, section } = data;
          if (section === 'body') {
            
            if (row.index === 0) {
              // Date row
              if (cell.colSpan === -1) {
                doc.setFillColor(255, 255, 255);
                doc.rect(cell.x, cell.y, 190, cell.height, 'F');
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(8);
                doc.setTextColor(0, 0, 0);
                if (data.column.index === 4 || data.column.index === 5) {
                  doc.text(cell.text[0], cell.x + 2, cell.y + cell.height / 2 + 1, { align: 'left' });
                }
                doc.setLineWidth(0.2);
                doc.setDrawColor(0, 0, 0);
                doc.line(cell.x, cell.y, cell.x + 190, cell.y);
              }
            } else if (row.index === 1) {
              // Seller/Transporter row
              if (cell.colSpan === -1) {
                const isSeller = data.column.index === 0 || data.column.index === 1;
                const width = isSeller ? 90 : 100;
                const text = isSeller
                  ? data.column.index === 0
                    ? `Seller:`
                    : `${dispatchNote.seller || '-'}`
                  : data.column.index === 4
                  ? `Transporter:`
                  : data.column.index === 5
                  ? ` ${dispatchNote.transporter || '-'}`
                  : '';
                doc.setFillColor(255, 255, 255);
                doc.rect(cell.x, cell.y, width, cell.height, 'F');
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(8);
                doc.setTextColor(0, 0, 0);
                if (text) {
                  doc.text(text, cell.x + 2, cell.y + cell.height / 2 + 1, { align: 'left' });
                }
                doc.setLineWidth(0.2);
                doc.setDrawColor(0, 0, 0);
                doc.line(cell.x, cell.y, cell.x + width, cell.y);
              }
            } else if (row.index === 2) {
              // Buyer/Vehicle# row
              if (cell.colSpan === -1) {
                const isBuyer = data.column.index === 0 || data.column.index === 1;
                const width = isBuyer ? 90 : 100;
                const text = isBuyer
                  ? data.column.index === 0
                    ? `Buyer:`
                    : `${dispatchNote.buyer || '-'}`
                  : data.column.index === 4
                  ? `Vehicle#`
                  : data.column.index === 5
                  ? ` ${dispatchNote.remarks || '-'}`
                  : '';
                doc.setFillColor(255, 255, 255);
                doc.rect(cell.x, cell.y, width, cell.height, 'F');
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(8);
                doc.setTextColor(0, 0, 0);
                if (text) {
                  doc.text(text, cell.x + 2, cell.y + cell.height / 2 + 1, { align: 'left' });
                }
                doc.setLineWidth(0.2);
                doc.setDrawColor(0, 0, 0);
                doc.line(cell.x, cell.y, cell.x + width, cell.y);
              }
            } else if (row.index === 3) {
              // Gap row
              doc.setFillColor(255, 255, 255);
              doc.rect(cell.x, cell.y, 190, cell.height, 'F');
            }

            // Hide ONLY left and right borders for empty cells in columns 0, 2 and 3 (including first row)
            // This must come AFTER the custom drawing to override any borders drawn above
            if ((data.column.index === 0 || data.column.index === 2 || data.column.index === 3) && cell.text[0] === '') {
              // Draw thicker white lines only over left and right borders to hide them
              doc.setDrawColor(255, 255, 255);
              doc.setLineWidth(0.3);
              // Hide left border
              doc.line(cell.x, cell.y, cell.x, cell.y + cell.height);
              // Hide right border - extend slightly to ensure coverage
              doc.line(cell.x + cell.width, cell.y, cell.x + cell.width, cell.y + cell.height);
              // Keep top and bottom borders intact - don't draw over them
            }
          }
        },
      });

      // Update yPos after first table
      yPos = (doc as any).lastAutoTable.finalY + 0;
     // yPos += 1;

      // Second Table: Contract Details
      const tableHead = [
        ['Contract Number', 'Buyer Refer', 'Fabric Detail', 'Dispatch Qty', 'Base', 'Destination'],
      ];

      const contractTableBody: (string | number)[][] = [];

      // Contract Details
      if (dispatchNote.relatedContracts && dispatchNote.relatedContracts.length > 0) {
        dispatchNote.relatedContracts.forEach((contract) => {
          const fabricDetails = formatFabricDetails(contract);
          contractTableBody.push([
            contract.contractNumber || '-',
            contract.buyerRefer || '-',
            fabricDetails,
            contract.totalDispatchQuantity || '-',
            contract.base || '-',
            dispatchNote.buyer || '-',
          ]);
        });
      } else {
        contractTableBody.push(['-', '-', '-', '-', '-', '-']);
      }      autoTable(doc, {
        startY: yPos,
        head: tableHead,
        body: contractTableBody,
        styles: {
          fontSize: 8,
          cellPadding: { top: 2, bottom: 2, left: 2, right: 2 },
          lineColor: [0, 0, 0],
          lineWidth: 0.1,
          textColor: [0, 0, 0],
          fontStyle: 'normal',
        },
        headStyles: {
          fillColor: [6, 182, 212],
          textColor: [0, 0, 0],
          fontSize: 8,
          cellPadding: { top: 2, bottom: 2, left: 2, right: 2 },
          lineWidth: 0.1,
          fontStyle: 'bold',
        },
        columnStyles: {
          0: { cellWidth: 30 },
          1: { cellWidth: 30 },
          2: { cellWidth: 50 },
          3: { cellWidth: 25 },
          4: { cellWidth: 25 },
          5: { cellWidth: 30 },
        },
        margin: { left: 10, right: 10 },
        theme: 'grid',
      });

      yPos = (doc as any).lastAutoTable.finalY + 10;

    

      const leftColumnX = 12;
      const leftColumnWidth = 125;
      let leftColumnYPos = yPos;

      const labelStyle = {
        font: 'helvetica' as const,
        style: 'bold' as const,
        size: 8,
        color: [0, 0, 0] as [number, number, number],
      };
      const valueStyle = {
        font: 'helvetica' as const,
        style: 'normal' as const,
        size: 9,
        color: [0, 0, 0] as [number, number, number],
      };

      doc.setFont(labelStyle.font, labelStyle.style);
      doc.setFontSize(labelStyle.size);
      
      yPos = leftColumnYPos + 12;

      // Reserve space for footer and signatures
      const pageHeight = 297;
      const footerHeight = 12;
      const signatureHeight = 18;
      const footerY = pageHeight - footerHeight;
      const signatureY = footerY - signatureHeight - 3;

      // Signatures
      const signatureWidth = 30;
      const startX = 10;
      const sellerMargin = 6;
      const centerX = startX + signatureWidth + sellerMargin;
      const pageWidth = 210;
      const margin = 10;
      const availableWidth = pageWidth - margin - (centerX + signatureWidth);
      const gap = availableWidth / 2;
      const endX = centerX + signatureWidth + gap;

      const labelColor: [number, number, number] = [0, 0, 0];
      const textColor: [number, number, number] = [0, 0, 0];

      const addSignature = (signature: string | undefined, x: number, y: number, placeholder: string) => {
        if (signature) {
          try {
            doc.addImage(signature, 'PNG', x, y, signatureWidth, 10);
          } catch (error) {
            console.warn(`Failed to add ${placeholder.toLowerCase()}:`, error);
            doc.text(`[${placeholder}]`, x, y + 5);
          }
        } else {
          doc.text(`[${placeholder}]`, x, y + 5);
        }
      };

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(...labelColor);
      addSignature(zmsSignature, startX, signatureY, 'ZMS Signature');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(...textColor);
      const zmsText = 'Z.M. SOURCING';
      const zmsTextWidth = doc.getTextWidth(zmsText);
      doc.text(zmsText, startX, signatureY + 12);
      doc.setLineWidth(0.1);
      doc.setDrawColor(...textColor);
      doc.line(startX, signatureY + 13, startX + zmsTextWidth, signatureY + 13);

      addSignature(sellerSignature, centerX, signatureY, 'Seller Signature');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(...textColor);
      const sellerText = `${dispatchNote.seller || '-'}`;
      const sellerTextWidth = doc.getTextWidth(sellerText);
      doc.text(sellerText, centerX, signatureY + 12);
      doc.setLineWidth(0.1);
      doc.setDrawColor(...textColor);
      doc.line(centerX, signatureY + 13, centerX + sellerTextWidth, signatureY + 13);

      addSignature(buyerSignature, endX, signatureY, 'Buyer Signature');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(...textColor);
      const buyerText = `${dispatchNote.buyer || '-'}`;
      const buyerTextWidth = doc.getTextWidth(buyerText);
      doc.text(buyerText, endX, signatureY + 12);
      doc.setLineWidth(0.1);
      doc.setDrawColor(...textColor);
      doc.line(endX, signatureY + 13, endX + buyerTextWidth, signatureY + 13);

      // Footer
      doc.setLineWidth(0.1);
      doc.setFillColor(6, 182, 212);
      doc.rect(0, footerY, 210, footerHeight, 'F');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6);
      doc.setTextColor(0, 0, 0);
      doc.text('Page 1 of 1', 200, footerY + 4, { align: 'right' });
      doc.text(
        `Generated on ${new Date().toLocaleString('en-US', {
          timeZone: 'Asia/Karachi',
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        })}`,
         10,
         footerY + 4
       );
       doc.text('Confidential - ZMS Textiles Ltd.', 105, footerY + 4, { align: 'center' });

      // Save PDF
      const filename = `ZMS Sourcing Dispatch Note (${dispatchNote.seller || '-'})-(${dispatchNote.buyer || '-'}).pdf`;
      doc.save(filename);
      toast('Dispatch PDF generated successfully', { type: 'success' });
    } catch (error) {
      console.error('Failed to generate Dispatch PDF:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast(`Failed to generate Dispatch PDF: ${errorMessage}`, { type: 'error' });
    }
  },
};

export default DispatchPDFExport;