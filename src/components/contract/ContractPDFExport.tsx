'use client';
import { toast } from 'react-toastify';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Contract } from './columns';

// Load ZMS logo (assumes logo is in public/ZMS-logo.png)
const ZMS_LOGO = '/ZMS-logo.png';

interface ExportToPDFProps {
  contract: Contract | null;
  sellerSignature?: string;
  buyerSignature?: string;
}

const ContractPDFExport = {
  exportToPDF: ({ contract, sellerSignature, buyerSignature }: ExportToPDFProps) => {
    if (!contract) {
      toast('Contract not found', { type: 'error' });
      return;
    }

    const doc = new jsPDF();

    // Header (unchanged)
    doc.setFillColor(6, 182, 212);
    doc.rect(0, 0, 210, 35, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(255, 255, 255);
    doc.text('Contract Details', 105, 12, { align: 'center' });
    doc.setFontSize(11);
    doc.text('ZMS Textiles Ltd.', 105, 22, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(230, 230, 230);
    doc.text(
      'Office No. 108, 1st Floor S.P Chamber, Plot No. B-9, B-1, Main Estate Avenue,',
      105,
      28,
      { align: 'center' }
    );
    doc.text('Near Metro Chowrangi, S.I.T.E Karachi | Tel: +92-21-32550917-18', 105, 32, {
      align: 'center',
    });

    // Logo (unchanged)
    try {
      doc.addImage(ZMS_LOGO, 'PNG', 15, 8, 25, 18);
    } catch (error) {
      console.error('Failed to load logo:', error);
      doc.setFontSize(9);
      doc.setTextColor(255, 255, 255);
      doc.text('[ZMS Logo]', 15, 18);
    }

    // Document ID (unchanged)
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7);
    doc.setTextColor(255, 255, 255);
    doc.text(`Document ID: ${contract.contractNumber}`, 195, 12, { align: 'right' });

    // Format Finish Width (unchanged)
    const formattedWidth = contract.width ? contract.width.replace('/', '"/"') + '"' : '-';

    // Contract Details (unchanged)
    let yPos = 45;
    const leftColX = 15;
    const rightColX = 105;
    const labelStyle = { font: 'helvetica' as const, style: 'bold' as const, size: 9, color: [6, 182, 212] as [number, number, number] };
    const valueStyle = { font: 'helvetica' as const, style: 'normal' as const, size: 9, color: [33, 33, 33] as [number, number, number] };

    // Contract and Date in one row (unchanged)
    doc.setFont(labelStyle.font, labelStyle.style);
    doc.setFontSize(labelStyle.size);
    doc.setTextColor(...labelStyle.color);
    doc.text('Contract:', leftColX, yPos);
    doc.setFont(valueStyle.font, valueStyle.style);
    doc.setFontSize(valueStyle.size);
    doc.setTextColor(...valueStyle.color);
    doc.text(contract.contractNumber, leftColX + doc.getTextWidth('Contract:') + 2, yPos);

    doc.setFont(labelStyle.font, labelStyle.style);
    doc.setFontSize(labelStyle.size);
    doc.setTextColor(...labelStyle.color);
    doc.text('Date:', rightColX, yPos);
    doc.setFont(valueStyle.font, valueStyle.style);
    doc.setFontSize(valueStyle.size);
    doc.setTextColor(...valueStyle.color);
    doc.text(contract.date || '-', rightColX + doc.getTextWidth('Date:') + 2, yPos);

    yPos += 6;

    // Seller and Contract Type in one row
    doc.setFont(labelStyle.font, labelStyle.style);
    doc.setFontSize(labelStyle.size);
    doc.setTextColor(...labelStyle.color);
    doc.text('Seller:', leftColX, yPos);
    doc.setFont(valueStyle.font, valueStyle.style);
    doc.setFontSize(valueStyle.size);
    doc.setTextColor(...valueStyle.color);
    doc.text(contract.buyer, leftColX + doc.getTextWidth('Seller:') + 2, yPos);

    doc.setFont(labelStyle.font, labelStyle.style);
    doc.setFontSize(labelStyle.size);
    doc.setTextColor(...labelStyle.color);
    doc.text('Contract Type:', rightColX, yPos);
    doc.setFont(valueStyle.font, valueStyle.style);
    doc.setFontSize(valueStyle.size);
    doc.setTextColor(...valueStyle.color);
    doc.text(contract.contractType, rightColX + doc.getTextWidth('Contract Type:') + 2, yPos);

    yPos += 6; // Move to next row
    const fields = [
      { label: 'Buyer:', value: contract.buyer },
      { label: 'Description:', value: contract.descriptionName || '-' },
      { label: 'Finish Width:', value: formattedWidth },
      { label: 'Quantity:', value: `${contract.quantity} ${contract.unitOfMeasure}` },
      { label: 'Rate:', value: contract.rate || '-' },
      { label: 'Piece Length:', value: contract.pieceLength || '-' },
      { label: 'Delivery:', value: contract.refer || '-' },
      {
        label: 'Payment Terms:',
        value: `Seller: ${contract.paymentTermsSeller || '-'} | Buyer: ${contract.paymentTermsBuyer || '-'}`,
      },
      { label: 'Packing:', value: contract.packing || '-' },
      { label: 'GST:', value: contract.gst || '-' },
      { label: 'GST Value:', value: contract.gstValue || '-' },
      { label: 'Fabric Value:', value: contract.fabricValue || '-' },
      { label: 'Total Amount:', value: contract.totalAmount.toString() },
      { label: 'Commission:', value: contract.commissionPercentage || '-' },
      { label: 'Commission Value:', value: contract.commissionValue || '-' },
      { label: 'Dispatch Address:', value: contract.dispatchAddress || '-' },
      {
        label: 'Remarks:',
        value: `Seller: ${contract.sellerRemark || '-'} | Buyer: ${contract.buyerRemark || '-'}`,
      },
    ];

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
      doc.setTextColor(...labelStyle.color);
      doc.text(field.label, leftColX, yPos);

      doc.setFont(valueStyle.font, valueStyle.style);
      doc.setFontSize(valueStyle.size);
      doc.setTextColor(...valueStyle.color);
      doc.text(value, leftColX + doc.getTextWidth(field.label) + 2, yPos);

      yPos += 6;
    });

    // Section Divider
    yPos += 20;
    doc.setLineWidth(0.2);
    doc.setDrawColor(200, 200, 200);
    doc.line(15, yPos, 195, yPos);
    yPos += 20;

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
        textColor: [33, 33, 33],
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
          doc.setTextColor(6, 182, 212);
          doc.text('Terms and Conditions', 15, data.cell.y - 5);
        }
      },
    });

    // Signatures (unchanged)
    const signatureY = 255;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(6, 182, 212);
    doc.text('Signature:', 15, signatureY);
    if (sellerSignature) {
      doc.addImage(sellerSignature, 'PNG', 15, signatureY + 2, 50, 15);
    } else {
      doc.setLineWidth(0.3);
      doc.setDrawColor(33, 33, 33);
      doc.line(15, signatureY + 10, 75, signatureY + 10);
    }
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(33, 33, 33);
    doc.text(`Name: ${contract.buyer || '-'}`, 15, signatureY + 20);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(6, 182, 212);
    doc.text('Buyer Signature:', 105, signatureY);
    if (buyerSignature) {
      doc.addImage(buyerSignature, 'PNG', 105, signatureY + 2, 50, 15);
    } else {
      doc.setLineWidth(0.3);
      doc.setDrawColor(33, 33, 33);
      doc.line(105, signatureY + 10, 165, signatureY + 10);
    }
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(33, 33, 33);
    doc.text(`Name: ${contract.buyer || '-'}`, 105, signatureY + 20);

    // Footer (unchanged)
    doc.setFillColor(6, 182, 212);
    doc.rect(0, 280, 210, 17, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(255, 255, 255);
    doc.text('Page 1 of 1', 195, 290, { align: 'right' });
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
      290
    );
    doc.text('Confidential - ZMS Textiles Ltd.', 105, 290, { align: 'center' });

    doc.save(`Contract_${contract.contractNumber}.pdf`);
  },
};

export default ContractPDFExport;