'use client';
import { toast } from 'react-toastify';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Contract } from './columns';

// Load ZMS logo (assumes logo is in public/ZMS-logo.png)
const ZMS_LOGO = '/ZMS-logo.png';
// Style constants
const styles = {
  label: { size: 9, color: [6, 182, 212] as [number, number, number] }, // Cyan label color
  value: { size: 9, color: [33, 33, 33] as [number, number, number] }, // Dark gray value color
  margins: { left: 15, right: 15 }
};
interface ExportToPDFProps {
  contract: Contract | null;
  sellerSignature?: string;
  buyerSignature?: string;
  zmsSignature?: string;
  selleraddress?: string;
  buyeraddress?: string;
}

const ContractPDFExport = {
  exportToPDF: ({ contract, sellerSignature, buyerSignature, zmsSignature, selleraddress, buyeraddress }: ExportToPDFProps) => {
    if (!contract) {
      toast('Contract not found', { type: 'error' });
      return;
    }

    const doc = new jsPDF();

    // Header Background
    doc.setFillColor(6, 182, 212);
    doc.rect(0, 0, 210, 35, 'F');

    // Header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(255, 255, 255); // White text for contrast
    doc.text('Z.M. Sourcing', 105, 12, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255); // White text
    doc.text('Suit No. 108, SP Chamber, Main Estate Avenue,', 105, 22, { align: 'center' });
    doc.text('SITE Karachi', 105, 27, { align: 'center' });
    doc.text('Phone: +92 21 32550917-18 Email: info@zmt.com.pk', 105, 32, { align: 'center' });

    // Logo
    try {
      doc.addImage(ZMS_LOGO, 'PNG', 15, 8, 25, 18);
    } catch (error) {
      console.error('Failed to load logo:', error);
      doc.setFontSize(9);
      doc.setTextColor(255, 255, 255); // White text for placeholder
      doc.text('[ZMS Logo]', 15, 18);
    }

    // Document ID
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7);
    doc.setTextColor(255, 255, 255); // White text
    doc.text(`Document ID: ${contract.contractNumber}`, 195, 12, { align: 'right' });

    // PURCHASE CONTRACT Heading
    let yPos = 45;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(6, 182, 212);
    doc.text('Purchase Contract', 105, yPos, { align: 'center' });
    yPos += 10;

    // Seller and Buyer Information (Seller on left, Buyer on right with gap)
    const leftColX = 15;
    const rightColX = 115; // Adjusted to position Buyer near the right with a gap
    const labelStyle = { font: 'helvetica' as const, style: 'bold' as const, size: 9, color: [6, 182, 212] as [number, number, number] }; // Cyan label color
    const valueStyle = { font: 'helvetica' as const, style: 'normal' as const, size: 9, color: [33, 33, 33] as [number, number, number] }; // Dark gray value color

    // Seller Info (Left, no border)
    doc.setFont(labelStyle.font, labelStyle.style);
    doc.setFontSize(labelStyle.size);
    doc.setTextColor(...labelStyle.color); // Cyan text for "Seller:"
    doc.text('Seller:', leftColX, yPos);
    doc.setFont(valueStyle.font, valueStyle.style);
    doc.setFontSize(valueStyle.size);
    doc.setTextColor(...valueStyle.color); // Dark gray for values
    let sellerName = contract.seller || '-';
    let sellerAddressText = selleraddress || 'M/S Ahmed Fine Textile Mills Ltd.59/3';
    const maxSellerWidth = 65; // Adjusted for smaller box width
    if (doc.getTextWidth(sellerName) > maxSellerWidth) {
      while (doc.getTextWidth(sellerName + '...') > maxSellerWidth && sellerName.length > 0) {
        sellerName = sellerName.slice(0, -1);
      }
      sellerName += '...';
    }
    if (doc.getTextWidth(sellerAddressText) > maxSellerWidth) {
      while (doc.getTextWidth(sellerAddressText + '...') > maxSellerWidth && sellerAddressText.length > 0) {
        sellerAddressText = sellerAddressText.slice(0, -1);
      }
      sellerAddressText += '...';
    }
    doc.text(sellerName, leftColX + doc.getTextWidth('Seller:') + 10, yPos);
    doc.text(sellerAddressText, leftColX + doc.getTextWidth('Seller:') + 10, yPos + 6);

    // Buyer Info (Right, no border)
    doc.setFont(labelStyle.font, labelStyle.style);
    doc.setFontSize(labelStyle.size);
    doc.setTextColor(...labelStyle.color); // Cyan text for "Buyer:"
    doc.text('Buyer:', rightColX, yPos);
    doc.setFont(valueStyle.font, valueStyle.style);
    doc.setFontSize(valueStyle.size);
    doc.setTextColor(...valueStyle.color); // Dark gray for values
    let buyerName = contract.buyer || '-';
    let buyerAddressText = buyeraddress || 'M/S Union Fabrics (Pvt) Ltd';
    const maxBuyerWidth = 60; // Adjusted for smaller box width
    if (doc.getTextWidth(buyerName) > maxBuyerWidth) {
      while (doc.getTextWidth(buyerName + '...') > maxBuyerWidth && buyerName.length > 0) {
        buyerName = buyerName.slice(0, -1);
      }
      buyerName += '...';
    }
    if (doc.getTextWidth(buyerAddressText) > maxBuyerWidth) {
      while (doc.getTextWidth(buyerAddressText + '...') > maxBuyerWidth && buyerAddressText.length > 0) {
        buyerAddressText = buyerAddressText.slice(0, -1);
      }
      buyerAddressText += '...';
    }
    doc.text(buyerName, rightColX + doc.getTextWidth('Buyer:') + 10, yPos);
    doc.text(buyerAddressText, rightColX + doc.getTextWidth('Buyer:') + 10, yPos + 6);

    yPos += 17; // Adjusted for box height (15) + minimal gap (2)

    // Fields (Description, Blend Ratio, Construction)
    const fields = [
      { label: 'Description:', value: contract.descriptionName || '-' },
      { label: 'Blend Ratio:', value: contract.blendRatio || '-' },
      { label: 'Construction:', value: contract.descriptionId || '-' },
    ];

    doc.setFont(labelStyle.font, labelStyle.style);
    doc.setFontSize(labelStyle.size);
    const maxLabelWidth = Math.max(...fields.map(field => doc.getTextWidth(field.label)));

    fields.forEach((field) => {
      const maxWidth = 180;
      let value = field.value;
      if (doc.getTextWidth(value) > maxWidth) {
        while (doc.getTextWidth(value + '...') > maxWidth && value.length > 0) {
          value = value.slice(0, -1);
        }
        value += '...';
      }

      doc.setFont(labelStyle.font, labelStyle.style);
      doc.setFontSize(labelStyle.size);
      doc.setTextColor(...labelStyle.color); // Cyan text for field labels
      doc.text(field.label, leftColX, yPos);

      doc.setFont(valueStyle.font, valueStyle.style);
      doc.setFontSize(valueStyle.size);
      doc.setTextColor(...valueStyle.color); // Dark gray for values
      doc.text(value, leftColX + maxLabelWidth + 10, yPos);

      yPos += 6;
    });

    // Financial Table with Blank Rows
    autoTable(doc, {
      startY: yPos,
      head: [['Width', 'Quantity', 'Rate', 'Amount', 'Delivery', 'Warp', 'Weft']],
      body: [
        [
          contract.width ? `${contract.width}"` : '-',
          `${contract.quantity} ${contract.unitOfMeasure}`,
          contract.rate,
          contract.totalAmount,
          contract.refer || '-',
          contract.warpCount || '-',
          contract.weftCount || '-',
        ],
        ['', '', '', '', '', '', ''],
        ['', '', '', '', '', '', ''],
        ['', '', '', '', '', '', ''],
        ['', '', 'GST:', contract.gstValue || '-', '', '', ''],
        ['', '', 'Total Amount:', contract.totalAmount.toString(), '', '', '']
      ],
      styles: { fontSize: 9, cellPadding: 2, lineColor: [200, 200, 200], lineWidth: 0.3 },
      headStyles: { fillColor: [28, 78, 128], textColor: [255, 255, 255], lineWidth: 0.3, lineColor: [200, 200, 200] },
      columnStyles: {
        2: { halign: 'right' },
        3: { halign: 'right' }
      },
      margin: { left: 15, right: 15 },
      theme: 'grid',
      didParseCell: (data) => {
        if (data.row.index >= 4) {
          data.cell.styles.fontStyle = 'bold';
        }
      }
    });

    yPos = (doc as any).lastAutoTable.finalY + 15;

    // Additional Fields
    const additionalFields = [
      { label: 'Piece Length:', value: contract.pieceLength || '-' },
      { label: 'Packing:', value: contract.packing || '-' },
      { label: 'Commission:', value: contract.commissionPercentage || '-' },
      { label: 'Commission Value:', value: contract.commissionValue || '-' },
      { label: 'Delivery Destination:', value: contract.deliveryDate || '-' },
      { label: 'Remarks:', value: `Seller: ${contract.sellerRemark || ''} | Buyer: ${contract.buyerRemark || ''}` },
    ];

    doc.setFont(labelStyle.font, labelStyle.style);
    doc.setFontSize(labelStyle.size);
    const maxAdditionalLabelWidth = Math.max(...additionalFields.map(field => doc.getTextWidth(field.label)));

    additionalFields.forEach((field) => {
      const maxWidth = 180;
      let value = field.value;
      if (doc.getTextWidth(value) > maxWidth) {
        while (doc.getTextWidth(value + '...') > maxWidth && value.length > 0) {
          value = value.slice(0, -1);
        }
        value += '...';
      }

      doc.setFont(labelStyle.font, labelStyle.style);
      doc.setFontSize(labelStyle.size);
      doc.setTextColor(...labelStyle.color); // Cyan text for additional field labels
      doc.text(field.label, leftColX, yPos);

      doc.setFont(valueStyle.font, valueStyle.style);
      doc.setFontSize(valueStyle.size);
      doc.setTextColor(...valueStyle.color); // Dark gray for values
      doc.text(value, leftColX + maxAdditionalLabelWidth + 10, yPos);

      yPos += 6;
    });

    // Section Divider
    yPos += 10;
    doc.setLineWidth(0.2);
    doc.setDrawColor(200, 200, 200);
    doc.line(15, yPos, 195, yPos);
    yPos += 25;

    // Terms and Conditions Table
    autoTable(doc, {
      startY: yPos,
      body: [
        ['01', 'Please courier first 5 meters fabric as production sample'],
        ['02', 'Bales and rolls are clearly marked with article name, blend ratio & total meters packed'],
      ],
      theme: 'plain',
      styles: {
        font: 'helvetica',
        fontSize: 8,
        cellPadding: { top: 2, bottom: 2, left: 4, right: 4 },
        textColor: [0, 0, 0],
        lineWidth: 0,
        halign: 'left',
      },
      columnStyles: {
        0: { cellWidth: 20, fontStyle: 'bold' },
        1: { cellWidth: 160 },
      },
      margin: { left: 15, right: 15 },
      didDrawCell: (data) => {
        if (data.section === 'body' && data.row.index === 0) {
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(10);
          doc.setTextColor(...labelStyle.color); // Cyan text to match Seller/Buyer labels
          doc.text('Terms and Conditions', 15, data.cell.y - 5);
        }
      },
    });

    // Signatures
    const signatureY = 250;
    const signatureWidth = 50;
    const startX = 10;
    const centerX = 120 - signatureWidth / 2;
    const endX = 220 - signatureWidth;
    const labelColor: [number, number, number] = [0, 0, 0];
    const textColor: [number, number, number] = [0, 0, 0];

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...labelColor);
    if (zmsSignature) {
      doc.addImage(zmsSignature, 'PNG', startX, signatureY + 2, signatureWidth, 15);
    }
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.setTextColor(...textColor);
    const zmsText = 'Z.M. Sourcing';
    const zmsTextWidth = doc.getTextWidth(zmsText);
    doc.text(zmsText, startX, signatureY + 20);
    doc.setLineWidth(0.3);
    doc.setDrawColor(...textColor);
    doc.line(startX, signatureY + 21, startX + zmsTextWidth, signatureY + 21);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...labelColor);
    if (sellerSignature) {
      doc.addImage(sellerSignature, 'PNG', centerX, signatureY + 2, signatureWidth, 15);
    }
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.setTextColor(...textColor);
    const sellerText = `${contract.seller || '-'}`;
    const sellerTextWidth = doc.getTextWidth(sellerText);
    doc.text(sellerText, centerX, signatureY + 20);
    doc.setLineWidth(0.3);
    doc.setDrawColor(...textColor);
    doc.line(centerX, signatureY + 21, centerX + sellerTextWidth, signatureY + 21);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...labelColor);
    if (buyerSignature) {
      doc.addImage(buyerSignature, 'PNG', endX, signatureY + 2, signatureWidth, 15);
    }
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.setTextColor(...textColor);
    const buyerText = `${contract.buyer || '-'}`;
    const buyerTextWidth = doc.getTextWidth(buyerText);
    doc.text(buyerText, endX, signatureY + 20);
    doc.setLineWidth(0.3);
    doc.setDrawColor(...textColor);
    doc.line(endX, signatureY + 21, endX + buyerTextWidth, signatureY + 21);

    // Footer Divider Line
    doc.setLineWidth(0.2);
    doc.setDrawColor(200, 200, 200);
    doc.line(15, 275, 195, 275); // Line before footer at y=275

    // Footer Background
    doc.setFillColor(6, 182, 212);
    doc.rect(0, 275, 210, 22, 'F'); // Footer background from y=275 to y=297

    // Footer
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(255, 255, 255); // White text for contrast
    doc.text('Page 1 of 1', 195, 280, { align: 'right' });
    doc.text(
      `Generated on ${new Date().toLocaleString('en-US', {
        timeZone: 'Asia/Karachi',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      })}`,
      15,
      280
    );
    doc.text('Confidential - ZMS Textiles Ltd.', 105, 280, { align: 'center' });

    doc.save(`ZMS Sourcing Contract: (Seller:${contract.seller})(Buyer:${contract.buyer}).pdf`);
  },
};

export default ContractPDFExport;