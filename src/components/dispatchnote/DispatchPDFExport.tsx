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

// Style constants
const styles = {
  label: { size: 9, color: [33, 33, 33] as [number, number, number] },
  value: { size: 8, color: [33, 33, 33] as [number, number, number] },
  margins: { left: 15, right: 15, top: 15, bottom: 15 },
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
  destination: string;
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
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.5);
      doc.line(15, 25, 195, 25); // Horizontal line below header
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(20);
      doc.setTextColor(33, 33, 33);
      doc.text('ZM SOURCING', 105, 20, { align: 'center' });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(69, 69, 69);
      doc.text('Suit No. 108, SP Chamber, Main Estate Avenue, SITE Karachi', 105, 28, { align: 'center' });
      doc.text('Phone: +92 21 32550917-18', 105, 34, { align: 'center' });

      // Logo
      try {
        doc.addImage(ZMS_LOGO, 'PNG', 15, 10, 20, 15);
      } catch (error) {
        console.warn('Failed to load logo, using placeholder text:', error);
        doc.setFontSize(10);
        doc.setTextColor(33, 33, 33);
        doc.text('[ZMS Logo]', 15, 20);
      }

      // Subheading: ZMS/DispatchNo/Month/Year
      let yPos = 47;
      

      // Title
      yPos = 43
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(33, 33, 33);
      doc.text('DISPATCH NOTE', 105, yPos, { align: 'center' });

      // Date
      yPos = 47;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(33, 33, 33);
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
      doc.text(`Date: ${formattedDate}`, 117, yPos, { align: 'right' });
      yPos += 5;


     // Define margins with left: 5
const margins = {
  top: styles.margins.top || 10,
  bottom: styles.margins.bottom || 10,
  left: 8, // Set left margin to 5px
  right: styles.margins.right || 10,
};

// First Table: Date, Seller, Buyer, etc.
const tableBody: (string | number)[][] = [
  ['', '', '', '', 'Date:', formattedDate],
  ['Seller:', dispatchNote.seller || '-', '', '', 'Transporter:', dispatchNote.transporter || '-'],
  ['Buyer:', dispatchNote.buyer || '-', '', '', 'Vehicle#:', dispatchNote.remarks || '-'],
];

autoTable(doc, {
  startY: yPos,
  body: tableBody,
  styles: {
    font: 'OpenSans',
    fontSize: 8,
    cellPadding: { top: 3, bottom: 3, left: 3, right: 3 },
    lineColor: [200, 200, 200],
    lineWidth: 0.5,
    textColor: [72, 72, 72],
    fontStyle: 'bold',
    fillColor: [255, 255, 255],
  },
  columnStyles: {
    0: { cellWidth: 30, fontStyle: 'bold', textColor: [33, 33, 33] },
    1: { cellWidth: 65 },
    2: { cellWidth: 10 },
    3: { cellWidth: 10 },
    4: { cellWidth: 30, fontStyle: 'bold', textColor: [33, 33, 33] },
    5: { cellWidth: 48 },
  },
  margin: margins, // Use updated margins object
  theme: 'grid',
  didDrawCell: (data) => {
    const { row, cell, section } = data;
    if (section === 'body') {
      if (cell.text[0] === '') {
        doc.setDrawColor(255, 255, 255);
        doc.setLineWidth(1);
        doc.line(cell.x, cell.y, cell.x, cell.y + cell.height);
        doc.line(cell.x + cell.width, cell.y, cell.x + cell.width, cell.y + cell.height);
      }
    }
    if (data.column.index === 0) {
      doc.setDrawColor(200, 200, 200); // Border color
      doc.setLineWidth(0.5); // Border width
      doc.line(cell.x, cell.y, cell.x, cell.y + cell.height); // Draw left border
    }
  },
});

// Update yPos after first table
yPos = (doc as any).lastAutoTable.finalY + 10;

     // Define margins with left: 7
const margins2 = {
  top: styles.margins.top || 10,
  bottom: styles.margins.bottom || 10,
  left: 7, // Set left margin to 7px
  right: styles.margins.right || 10,
};

// Second Table: Contract Details
const tableHead = [
  ['ContractNo#.', 'BuyerNo#.', 'Quantity', 'Dispatch Qty', 'Bale / Role', 'Destination'],
];

const contractTableBody: (string | number)[][] = [];
let totalDispatchQty = 0;
let totalBaleRole = 0;

if (dispatchNote.relatedContracts && dispatchNote.relatedContracts.length > 0) {
  dispatchNote.relatedContracts.forEach((contract) => {
    const fabricDetails = formatFabricDetails(contract);
    const dispatchQty = Number(contract.totalDispatchQuantity) || 0;
    const baleRole = Number(contract.base) || 0;
    totalDispatchQty += dispatchQty;
    totalBaleRole += baleRole;
    contractTableBody.push([
      contract.contractNumber || '-',
      contract.buyerRefer || '-',
      fabricDetails,
      dispatchQty || '-',
      baleRole || '-',
      dispatchNote.destination || '-',
    ]);
  });
} else {
  contractTableBody.push(['-', '-', '-', '-', '-', '-']);
}

autoTable(doc, {
  startY: yPos,
  head: tableHead,
  body: contractTableBody,
  foot: [['', '', 'Total:', totalDispatchQty || '-', totalBaleRole || '-', '']],
  styles: {
    font: 'OpenSans', 
    fontSize: 8,
    cellPadding: { top: 3.5, bottom: 3.5, left: 4, right: 4 }, 
    lineColor: [210, 210, 210], 
    lineWidth: 0.4,
    textColor: [50, 50, 50], 
    fontStyle: 'normal', 
    fillColor: [248, 248, 248], 
  },
  headStyles: {
    fillColor: [240, 240, 240],
    textColor: [33, 33, 33],
    fontSize: 7,
    fontStyle: 'bold',
    lineWidth: 0.5,
  },
  footStyles: {
    fillColor: [240, 240, 240],
    textColor: [33, 33, 33],
    fontSize: 9,
    fontStyle: 'bold',
    lineWidth: 0.5,
  },
  columnStyles: {
    0: { cellWidth: 32 },
    1: { cellWidth: 15},
    2: { cellWidth: 84 },
    3: { cellWidth: 19 },    4: { cellWidth: 18},
    5: { cellWidth: 25 },
  },
  margin: margins2, // Use updated margins object
  theme: 'grid',
});

// Update yPos after second table
yPos = (doc as any).lastAutoTable.finalY + 20;

      // Signatures
      const signatureWidth = 40;
      const startX = 15;
      const gap = 40;
      const centerX = startX + signatureWidth + gap;
      const endX = centerX + signatureWidth + gap;

      const pageHeight = 297;
      const footerHeight = 15;
      const footerY = pageHeight - footerHeight;

      // Footer
      doc.setLineWidth(0.5);
      doc.setDrawColor(200, 200, 200);
      doc.line(15, footerY - 5, 195, footerY - 5);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(66, 66, 66);
      doc.text('Page 1 of 1', 195, footerY, { align: 'right' });
      doc.text(
        `Generated on ${new Date().toLocaleString('en-US', {
          timeZone: 'Asia/Karachi',
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        })}`,
        15,
        footerY
      );
      doc.text('Confidential - ZMS Textiles Ltd.', 105, footerY, { align: 'center' });

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