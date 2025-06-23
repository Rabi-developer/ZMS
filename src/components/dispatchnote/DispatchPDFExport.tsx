'use client';
import { toast } from 'react-toastify';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getAllSellers } from '@/apis/seller';
import { getAllBuyer } from '@/apis/buyer';
import { DispatchNote } from './columns';

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

interface ExportToPDFProps {
  dispatchNote: DispatchNote | null;
  sellerSignature?: string;
  buyerSignature?: string;
  zmsSignature?: string;
  sellerAddress?: string;
  buyerAddress?: string;
}

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
        GetSellerAddress = sellerMatch ? sellerMatch.address : '';
        GetBuyerAddress = buyerMatch ? buyerMatch.address : '';
      } catch (error) {
        console.error('Error fetching seller/buyer addresses:', error);
        toast('Failed to fetch addresses, proceeding with defaults', { type: 'warning' });
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
        ? new Date(dispatchNote.date).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
          }).split('/').join('-')
        : '-';
      doc.text(`Date: ${formattedDate}`, 200, yPos, { align: 'right' });
      yPos += 8;

      // Dispatch Table
      const tableBody: (string | number)[][] = [];

      // 1st Row: Date
      tableBody.push(['', '', '', '', 'Date:', ` ${formattedDate}`]);

      // 2nd Row: Transporter Name and Seller Name
      tableBody.push([
        `Seller`,
        `${dispatchNote.seller || '-'}`,
        '',
        '',
        'Transporter:',
        ` ${dispatchNote.transporter|| '-'}`,

      ]);

      // 3rd Row: Vehicle No
      tableBody.push(['Buyer:', `${dispatchNote.buyer || '-'}`, '', '', 'Vehicle#', ` ${dispatchNote.remarks || '-'}`]);


      // 5th Row: Gap (Empty Row)
      tableBody.push(['', '', '', '', '', '']);

      // 6th Row: Table Headers
      tableBody.push([
        'Contract Number',
        'Buyer Refer',
        'Fabric Detail',
        'Dispatch Qty',
        'Base',
        'Destination',
      ]);

      // 7th Row onwards: Contract Details
      if (dispatchNote.relatedContracts && dispatchNote.relatedContracts.length > 0) {
        dispatchNote.relatedContracts.forEach((contract) => {
          const fabricDetails = [
            contract.widthOrColor || '',
            contract.fabricDetails || '',
          ]
            .filter((item) => item.trim() !== '')
            .join(' / ');
            tableBody.push([
            contract.contractNumber || '-',
            contract.buyerRefer || '-',
            fabricDetails || '-',
            contract.totalDispatchQuantity || '-',
            contract.base || '-',
            dispatchNote.buyer || '-',
          ]);
        });
      } else {
        tableBody.push(['-', '-', '-', '-', '-', '-']);
      }

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
        didDrawCell: (data) => {
          const { row, cell, section } = data;
          // Merge cells and add border-top for specific rows
          if (section === 'body') {
            if (row.index === 0 || row.index === 2 || row.index === 3) {
              // Date, Vehicle No, Buyer: Merge all columns
              if (cell.colSpan === -1) {
                doc.setFillColor(255, 255, 255);
                doc.rect(cell.x, cell.y, 190, cell.height, 'F');
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(8);
                doc.setTextColor(0, 0, 0);
                doc.text(
                  cell.text[0],
                  cell.x + 2,
                  cell.y + cell.height / 2 + 1,
                  { align: row.index === 0 ? 'right' : 'left' }
                );
                // Add border-top
                doc.setLineWidth(0.2);
                doc.setDrawColor(0, 0, 0);
                doc.line(cell.x, cell.y, cell.x + 190, cell.y);
              }
            } else if (row.index === 1) {
              // Transporter and Seller: Merge columns for each
              if (cell.colSpan === -1) {
                const isSeller = cell.column.index === 0;
                const width = isSeller ? 90 : 100;
                const text = isSeller
                  ? `Seller: ${dispatchNote.seller || '-'}`
                  : `Transporter: ${dispatchNote.driverName || '-'}`;
                doc.setFillColor(255, 255, 255);
                doc.rect(cell.x, cell.y, width, cell.height, 'F');
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(8);
                doc.setTextColor(0, 0, 0);
                doc.text(text, cell.x + 2, cell.y + cell.height / 2 + 1, { align: 'left' });
                // Add border-top
                doc.setLineWidth(0.2);
                doc.setDrawColor(0, 0, 0);
                doc.line(cell.x, cell.y, cell.x + width, cell.y);
              }
            } else if (row.index === 4) {
              // Gap row: No border, no text
              doc.setFillColor(255, 255, 255);
              doc.rect(cell.x, cell.y, 190, cell.height, 'F');
            } else if (row.index === 5) {
              // Header row: Ensure bold and background
              if (cell.colSpan === -1) {
                doc.setFont('helvetica', 'bold');
                doc.setFillColor(6, 182, 212);
                doc.rect(cell.x, cell.y, cell.width, cell.height, 'F');
                doc.setTextColor(0, 0, 0);
                doc.text(cell.text[0], cell.x + 2, cell.y + cell.height / 2 + 1);
              }
            }
          }
        },
      });

      yPos = (doc as any).lastAutoTable.finalY + 10;

      // Additional Fields (e.g., Bilty Number)
      const additionalFields = [
        { label: 'Bilty Number:', value: dispatchNote.bilty || '-' },
      ];

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
      const maxAdditionalLabelWidth = Math.max(...additionalFields.map((field) => doc.getTextWidth(field.label)));
      additionalFields.forEach((field) => {
        const wrappedText = doc.splitTextToSize(field.value, leftColumnWidth - maxAdditionalLabelWidth - 4);
        doc.setFont(labelStyle.font, labelStyle.style);
        doc.setFontSize(labelStyle.size);
        doc.setTextColor(...labelStyle.color);
        doc.text(field.label, leftColumnX, leftColumnYPos);
        doc.setFont(valueStyle.font, valueStyle.style);
        doc.setFontSize(valueStyle.size);
        doc.setTextColor(...valueStyle.color);
        wrappedText.forEach((line: string, i: number) => {
          doc.text(line, leftColumnX + maxAdditionalLabelWidth + 4, leftColumnYPos + i * 4);
        });
        leftColumnYPos += wrappedText.length * 8;
      });

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

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(...labelColor);
      if (zmsSignature) {
        try {
          doc.addImage(zmsSignature, 'PNG', startX, signatureY, signatureWidth, 10);
        } catch (error) {
          console.warn('Failed to add ZMS signature:', error);
          doc.text('[ZMS Signature]', startX, signatureY + 5);
        }
      }
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(...textColor);
      const zmsText = 'Z.M. SOURCING';
      const zmsTextWidth = doc.getTextWidth(zmsText);
      doc.text(zmsText, startX, signatureY + 12);
      doc.setLineWidth(0.1);
      doc.setDrawColor(...textColor);
      doc.line(startX, signatureY + 13, startX + zmsTextWidth, signatureY + 13);

      if (sellerSignature) {
        try {
          doc.addImage(sellerSignature, 'PNG', centerX, signatureY, signatureWidth, 10);
        } catch (error) {
          console.warn('Failed to add seller signature:', error);
          doc.text('[Seller Signature]', centerX, signatureY + 5);
        }
      }
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(...textColor);
      const sellerText = `${dispatchNote.seller || '-'}`;
      const sellerTextWidth = doc.getTextWidth(sellerText);
      doc.text(sellerText, centerX, signatureY + 12);
      doc.setLineWidth(0.1);
      doc.setDrawColor(...textColor);
      doc.line(centerX, signatureY + 13, centerX + sellerTextWidth, signatureY + 13);

      if (buyerSignature) {
        try {
          doc.addImage(buyerSignature, 'PNG', endX, signatureY, signatureWidth, 10);
        } catch (error) {
          console.warn('Failed to add buyer signature:', error);
          doc.text('[Buyer Signature]', endX, signatureY + 5);
        }
      }
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