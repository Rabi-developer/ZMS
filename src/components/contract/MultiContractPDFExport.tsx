'use client';
import { toast } from 'react-toastify';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getAllDescriptions } from '@/apis/description';
import { getAllWrapYarnTypes } from '@/apis/wrapyarntype';
import { getAllWeftYarnType } from '@/apis/weftyarntype';
import { getAllWeaves } from '@/apis/weaves';
import { getAllPickInsertions } from '@/apis/pickinsertion';
import { getAllBlendRatios } from '@/apis/blendratio';
import { getAllSelveges } from '@/apis/selvege';
import { Contract } from './columns';
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

// Utility function to format numbers with commas
const formatCurrency = (value: string | number | undefined): string => {
  if (!value) return '-';
  const num = parseFloat(value.toString());
  if (isNaN(num)) return value.toString();
  return num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

interface ExportToPDFProps {
  contract: Contract | null;
  sellerSignature?: string;
  buyerSignature?: string;
  zmsSignature?: string;
  sellerAddress?: string;
  buyerAddress?: string;
  type: 'sale' | 'purchase' | 'multiwidth';
}

type MultiContractPDFExportType = {
  exportToPDF: (props: ExportToPDFProps) => Promise<void>;
};

const MultiContractPDFExport: MultiContractPDFExportType = {
  exportToPDF: async ({
    contract,
    sellerSignature,
    buyerSignature,
    zmsSignature,
    sellerAddress,
    buyerAddress,
    type,
  }: ExportToPDFProps) => {
    if (!contract) {
      toast('Contract not found', { type: 'error' });
      return;
    }

    // Fetch subDescriptions
    let descriptionSub = '-';
    let blendRatioSub = '-';
    let warpYarnTypeSub = '-';
    let weftYarnTypeSub = '-';
    let weavesSub = '-';
    let pickInsertionSub = '-';
    let selvedgeSub = '-';

    try {
      const sellerData = await getAllSellers();
      const buyerData = await getAllBuyer();
      const sellerMatch = sellerData.data.find(
        (item: { sellerName: string; address: string }) => item.sellerName === contract.seller
      );
      const buyerMatch = buyerData.data.find(
        (item: { buyerName: string; address: string }) => item.buyerName === contract.buyer
      );
      GetSellerAddress = sellerMatch ? sellerMatch.address : '';
      GetBuyerAddress = buyerMatch ? buyerMatch.address : '';

      const descriptionData = await getAllDescriptions();
      const descriptionMatch = descriptionData.data.find(
        (item: { descriptions: string; subDescription: string }) => item.descriptions === contract.description
      );
      descriptionSub = descriptionMatch ? descriptionMatch.subDescription : '-';

      const blendRatioData = await getAllBlendRatios();
      const blendRatioMatch = blendRatioData.data.find(
        (item: { descriptions: string; subDescription: string }) => item.descriptions === contract.blendRatio
      );
      blendRatioSub = blendRatioMatch ? blendRatioMatch.subDescription : '-';

      const warpYarnData = await getAllWrapYarnTypes();
      const warpYarnMatch = warpYarnData.data.find(
        (item: { descriptions: string; subDescription: string }) => item.descriptions === contract.warpYarnType
      );
      warpYarnTypeSub = warpYarnMatch ? warpYarnMatch.subDescription : '-';

      const weftYarnData = await getAllWeftYarnType();
      const weftYarnMatch = weftYarnData.data.find(
        (item: { descriptions: string; subDescription: string }) => item.descriptions === contract.weftYarnType
      );
      weftYarnTypeSub = weftYarnMatch ? weftYarnMatch.subDescription : '-';

      const weavesData = await getAllWeaves();
      const weavesMatch = weavesData.data.find(
        (item: { descriptions: string; subDescription: string }) => item.descriptions === contract.weaves
      );
      weavesSub = weavesMatch ? weavesMatch.subDescription : '-';

      const pickInsertionData = await getAllPickInsertions();
      const pickInsertionMatch = pickInsertionData.data.find(
        (item: { descriptions: string; subDescription: string }) => item.descriptions === contract.pickInsertion
      );
      pickInsertionSub = pickInsertionMatch ? pickInsertionMatch.subDescription : '-';

      const selvedgeData = await getAllSelveges();
      const selvedgeMatch = selvedgeData.data.find(
        (item: { descriptions: string; subDescription: string }) => item.descriptions === contract.selvege
      );
      selvedgeSub = selvedgeMatch ? selvedgeMatch.subDescription : '-';
    } catch (error) {
      console.error('Error fetching subDescriptions:', error);
      toast('Failed to fetch subDescriptions', { type: 'warning' });
    }

    const doc = new jsPDF();

    // Header
    doc.setFillColor(6, 182, 212);
    doc.rect(0, 0, 210, 28, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(26);
    doc.setTextColor(0, 0, 0);
    doc.text('ZM SOURCING', 105, 10, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.text('Suit No. 108, SP Chamber, Main Estate Avenue, SITE Karachi', 105, 16, { align: 'center' });
    doc.text('Phone: +92 21 32550917-18', 105, 22, { align: 'center' });

    // Logo
    try {
      doc.addImage(ZMS_LOGO, 'PNG', 10, 6, 20, 14);
    } catch (error) {
      console.error('Failed to load logo:', error);
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text('[ZMS Logo]', 10, 14);
    }

    // Subheading: ZMS/ContractNo/Month/Year
    let yPos = 38;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0);
    let monthYear = '-';
    if (contract.date) {
      try {
        const dateObj = new Date(contract.date);
        if (!isNaN(dateObj.getTime())) {
          monthYear = `${dateObj.getMonth() + 1}/${dateObj.getFullYear()}`;
        }
      } catch (error) {
        console.error('Error parsing contract date:', error);
      }
    }
    const contractSubheading = `${contract.contractNumber || '-'}`;
    doc.text(contractSubheading, 10, yPos, { align: 'left' });

    // Heading
    yPos = 34;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    const heading = type === 'sale' ? 'MULTIWIDTH SALE CONTRACT' : type === 'purchase' ? 'MULTIWIDTH PURCHASE CONTRACT' : 'MULTIWIDTH CONTRACT';
    doc.text(heading, 105, yPos, { align: 'center' });

    // Date
    yPos = 38;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0);
    const formattedDate = contract.date
      ? new Date(contract.date).toLocaleDateString('en-GB', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        }).split('/').join('-')
      : '-';
    doc.text(`Date: ${formattedDate}`, 200, yPos, { align: 'right' });
    yPos += 10;

    // Seller and Buyer Info
    const leftColX = 10;
    const rightColX = 105;
    const labelStyle = {
      font: 'helvetica' as const,
      style: 'bold' as const,
      size: 8,
      color: [0, 0, 0] as [number, number, number],
    };
    const valueStyle = {
      font: 'helvetica' as const,
      style: 'normal' as const,
      size: 7,
      color: [0, 0, 0] as [number, number, number],
    };

    // Seller Info
    const sellerBoxY = yPos - 4;
    const sellerBoxHeight = 12;
    doc.setLineWidth(0.4);
    doc.setDrawColor(isDarkMode ? 0 : 0, isDarkMode ? 0 : 0, isDarkMode ? 0 : 0);
    doc.rect(leftColX - 2, sellerBoxY, 85, sellerBoxHeight, 'S');
    doc.setFont(labelStyle.font, labelStyle.style);
    doc.setFontSize(labelStyle.size);
    doc.setTextColor(...labelStyle.color);
    doc.text('Seller:', leftColX, yPos);
    doc.setFont(valueStyle.font, valueStyle.style);
    doc.setFontSize(valueStyle.size);
    doc.setTextColor(...valueStyle.color);
    let sellerName = contract.seller || '-';
    let sellerAddressText = sellerAddress || GetSellerAddress || '-';
    const maxSellerWidth = 70;
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
    doc.text(sellerName, leftColX + doc.getTextWidth('Seller:') + 5, yPos);
    doc.text(sellerAddressText, leftColX + doc.getTextWidth('Seller:') + 5, yPos + 5);

    // Buyer Info
    const buyerBoxY = yPos - 4;
    const buyerBoxHeight = 12;
    doc.setLineWidth(0.4);
    doc.setDrawColor(isDarkMode ? 0 : 0, isDarkMode ? 0 : 0, isDarkMode ? 0 : 0);
    doc.rect(rightColX - 2, buyerBoxY, 85, buyerBoxHeight, 'S');
    doc.setFont(labelStyle.font, labelStyle.style);
    doc.setFontSize(labelStyle.size);
    doc.setTextColor(...labelStyle.color);
    doc.text('Buyer:', rightColX, yPos);
    doc.setFont(valueStyle.font, valueStyle.style);
    doc.setFontSize(valueStyle.size);
    doc.setTextColor(...valueStyle.color);
    let buyerName = contract.buyer || '-';
    let buyerAddressText = buyerAddress || GetBuyerAddress || '-';
    const maxBuyerWidth = 70;
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
    doc.text(buyerName, rightColX + doc.getTextWidth('Buyer:') + 5, yPos);
    doc.text(buyerAddressText, rightColX + doc.getTextWidth('Buyer:') + 5, yPos + 5);

    yPos += 15;

    // Fields
    const fields = [
      { label: 'Description:', value: `${contract.description || '-'}, ${contract.stuff || '-'}` },
      { label: 'Blend Ratio:', value: `${contract.blendRatio || '-'}, ${contract.warpYarnType || '-'}` },
      {
        label: 'Construction:',
        value: `${contract.warpCount || '-'} ${warpYarnTypeSub} × ${contract.weftCount || '-'} ${weftYarnTypeSub} / ${contract.noOfEnds || '-'} × ${contract.noOfPicks || '-'} ${weavesSub} ${pickInsertionSub} ${contract.width || '-'} ${contract.final || '-'}${contract.selvege || 'selvedge'}`,
      },
      { label: 'Reference Number:', value: contract.referenceNumber || '-' },
      { label: 'Fabric Type:', value: contract.fabricType || '-' },
    ];

    doc.setFont(labelStyle.font, labelStyle.style);
    doc.setFontSize(labelStyle.size);
    const maxLabelWidth = Math.max(...fields.map((field) => doc.getTextWidth(field.label)));

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
      doc.text(value, leftColX + maxLabelWidth + 5, yPos);

      yPos += 4;
    });

    yPos += 3;

    // Financial Table
    const tableBody: (string | number)[][] = [];
    let totalQty = 0;
    let totalAmount = 0;
    const multiRow = contract.multiWidthContractRow && contract.multiWidthContractRow.length > 0 ? contract.multiWidthContractRow[0] : null;
    const rowCount = contract.multiWidthContractRow?.length || 1;

    // Dynamic table styling based on row count
    const tableStyles = rowCount > 10
      ? { fontSize: 6, cellPadding: 0.5, lineWidth: 0.1 }
      : rowCount > 5
        ? { fontSize: 7, cellPadding: 0.7, lineWidth: 0.15 }
        : { fontSize: 8, cellPadding: 1, lineWidth: 0.2 };

    if (Array.isArray(contract.multiWidthContractRow) && contract.multiWidthContractRow.length > 0) {
      contract.multiWidthContractRow.forEach((row) => {
        const qty = parseFloat(row.quantity || '0');
        const amount = parseFloat(row.amount || '0');

        if (!isNaN(qty)) totalQty += qty;
        if (!isNaN(amount)) totalAmount += amount;

        tableBody.push([
          row.width || '-',
          row.quantity || '-',
          `PKR ${formatCurrency(row.rate)}`,
          formatCurrency(amount),
          row.buyerDeliveryBreakups?.[0]?.deliveryDate
            ? new Date(row.buyerDeliveryBreakups[0].deliveryDate).toLocaleDateString('en-GB', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
              }).split('/').join('-')
            : row.deliveryDate
              ? new Date(row.deliveryDate).toLocaleDateString('en-GB', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                }).split('/').join('-')
              : '-',
        ]);
      });
    } else {
      const qty = parseFloat(contract.quantity || '0');
      const amount = parseFloat(contract.totalAmount || '0');

      if (!isNaN(qty)) totalQty += qty;
      if (!isNaN(amount)) totalAmount += amount;

      tableBody.push([
        contract.width || '-',
        contract.quantity || '-',
        `PKR ${formatCurrency(contract.rate)}`,
        formatCurrency(amount),
        contract.deliveryDate
          ? new Date(contract.deliveryDate).toLocaleDateString('en-GB', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
            }).split('/').join('-')
          : '-',
      ]);
    }

    // Calculate GST and total with GST
    const gstPercentage = multiRow?.gst ? parseFloat(multiRow.gst) : parseFloat(contract.gst || '0');
    const gstAmount = (totalAmount * gstPercentage) / 100;
    const totalWithGST = totalAmount + gstAmount;

    // Add total rows
    tableBody.push(['', 'Subtotal:', '', formatCurrency(totalQty), formatCurrency(totalAmount), '']);
    tableBody.push(['', `GST (${gstPercentage}%):`, '', '', formatCurrency(gstAmount), '']);
    tableBody.push(['', `Total (with ${gstPercentage}% GST):`, '', '', formatCurrency(totalWithGST), '']);

    autoTable(doc, {
      startY: yPos,
      head: [['Width', 'Quantity', 'Rate', 'Amount', 'Delivery Date']],
      body: tableBody,
      styles: {
        fontSize: tableStyles.fontSize,
        cellPadding: tableStyles.cellPadding,
        lineColor: [0, 0, 0],
        lineWidth: tableStyles.lineWidth,
        textColor: [0, 0, 0],
        fontStyle: 'normal',
      },
      headStyles: {
        fillColor: [6, 182, 212],
        textColor: [0, 0, 0],
        lineColor: [0, 0, 0],
        fontSize: tableStyles.fontSize,
        cellPadding: tableStyles.cellPadding,
        lineWidth: tableStyles.lineWidth,
        fontStyle: 'bold',
      },
      columnStyles: {
        0: { cellWidth: 25 }, // Width
        1: { cellWidth: 20 }, // Quantity
        2: { cellWidth: 25 }, // Rate
        3: { cellWidth: 30 }, // Amount
        4: { cellWidth: 30 }, // Delivery Date
      },
      margin: { left: 10, right: 10 },
      theme: 'grid',
    });

    yPos = (doc as any).lastAutoTable.finalY + 3;

    // Additional Fields
    const leftColumnX = 10;
    const leftColumnWidth = 180;
    let leftColumnYPos = yPos;

    const additionalFields = [
      { label: 'Piece Length:', value: contract.pieceLength || '-' },
      { label: 'Packing:', value: contract.packing || '-' },
      { 
        label: 'Payment:', 
        value: type === 'purchase' 
          ? multiRow?.commisionInfo?.paymentTermsSeller || '-' 
          : multiRow?.commisionInfo?.paymentTermsBuyer || '-' 
      },
      { label: 'Total:', value: `Rs. ${formatCurrency(totalWithGST)}` },
      ...(type === 'purchase'
        ? [
            { label: 'Commission:', value: `${multiRow?.commissionPercentage || '-'}%` },
            { label: 'Commission Value:', value: `Rs. ${formatCurrency(multiRow?.commissionValue)}` },
          ]
        : []),
      { label: 'Delivery Destination:', value: contract.buyer || '-' },
      { 
        label: 'Remarks:', 
        value: type === 'purchase' 
          ? multiRow?.commisionInfo?.sellerRemark || '-' 
          : multiRow?.commisionInfo?.buyerRemark || '-' 
      },
    ];

    doc.setFont(labelStyle.font, labelStyle.style);
    doc.setFontSize(labelStyle.size);
    const maxAdditionalLabelWidth = Math.max(...additionalFields.map((field) => doc.getTextWidth(field.label)));
    additionalFields.forEach((field) => {
      const wrappedText = doc.splitTextToSize(field.value, leftColumnWidth - maxAdditionalLabelWidth - 5);
      doc.setFont(labelStyle.font, labelStyle.style);
      doc.setFontSize(labelStyle.size);
      doc.setTextColor(...labelStyle.color);
      doc.text(field.label, leftColumnX, leftColumnYPos);
      doc.setFont(valueStyle.font, valueStyle.style);
      doc.setFontSize(valueStyle.size);
      doc.setTextColor(...valueStyle.color);
      wrappedText.forEach((line: string, i: number) => {
        doc.text(line, leftColumnX + maxAdditionalLabelWidth + 5, leftColumnYPos + i * 4);
      });
      leftColumnYPos += wrappedText.length * 4;
    });

    yPos = leftColumnYPos + 5;

    // Terms and Conditions
    autoTable(doc, {
      startY: yPos,
      body: [
        ['01', 'Dispatch first 5Mt fabric as multi-width sample'],
        ['02', 'No Contamination guarantee in Pakistan Cotton'],
      ],
      theme: 'plain',
      styles: {
        font: 'helvetica',
        fontSize: 7,
        cellPadding: { top: 1, bottom: 1, left: 2, right: 5 },
        textColor: [0, 0, 0],
        halign: 'left',
      },
      columnStyles: { 0: { cellWidth: 12 }, 1: { cellWidth: 160 } },
      margin: { left: 10, right: 10 },
      didDrawCell: (data) => {
        if (data.section === 'body' && data.row.index === 0) {
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(8);
          doc.setTextColor(...labelStyle.color);
          doc.text('Terms and Conditions', 10, data.cell.y - 3);
        }
      },
    });

    yPos = (doc as any).lastAutoTable.finalY + 5;

    // Signatures
    const signatureY = yPos;
    const signatureWidth = 35;
    const startX = 10;
    const sellerMargin = 8;
    const centerX = startX + signatureWidth + sellerMargin;
    const pageWidth = 210;
    const margin = 10;
    const availableWidth = pageWidth - margin - (centerX + signatureWidth);
    const gap = availableWidth / 2;
    const endX = centerX + signatureWidth + gap;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...labelStyle.color);
    if (zmsSignature) {
      doc.addImage(zmsSignature, 'PNG', startX, signatureY, signatureWidth, 12);
    }
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...valueStyle.color);
    const zmsText = 'Z.M. SOURCING';
    const zmsTextWidth = doc.getTextWidth(zmsText);
    doc.text(zmsText, startX, signatureY + 14);
    doc.setLineWidth(0.2);
    doc.setDrawColor(...valueStyle.color);
    doc.line(startX, signatureY + 15, startX + zmsTextWidth, signatureY + 15);

    if (sellerSignature) {
      doc.addImage(sellerSignature, 'PNG', centerX, signatureY, signatureWidth, 12);
    }
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...valueStyle.color);
    const sellerText = `${contract.seller || '-'}`;
    const sellerTextWidth = doc.getTextWidth(sellerText);
    doc.text(sellerText, centerX, signatureY + 14);
    doc.setLineWidth(0.2);
    doc.setDrawColor(...valueStyle.color);
    doc.line(centerX, signatureY + 15, centerX + sellerTextWidth, signatureY + 15);

    if (buyerSignature) {
      doc.addImage(buyerSignature, 'PNG', endX, signatureY, signatureWidth, 12);
    }
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...valueStyle.color);
    const buyerText = `${contract.buyer || '-'}`;
    const buyerTextWidth = doc.getTextWidth(buyerText);
    doc.text(buyerText, endX, signatureY + 14);
    doc.setLineWidth(0.2);
    doc.setDrawColor(...valueStyle.color);
    doc.line(endX, signatureY + 15, endX + buyerTextWidth, signatureY + 15);

    yPos = signatureY + 20;

    // Footer
    doc.setLineWidth(0.2);
    doc.setFillColor(6, 182, 212);
    doc.rect(0, yPos, 210, 12, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(0, 0, 0);
    doc.text('Page 1 of 1', 200, yPos + 5, { align: 'right' });
    doc.text(
      `Generated on ${new Date().toLocaleString('en-US', {
        timeZone: 'Asia/Karachi',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })}`,
      10,
      yPos + 5
    );
    doc.text('Confidential - ZMS Textiles Ltd.', 105, yPos + 5, { align: 'center' });

    // Save PDF
    const filename = type === 'purchase'
      ? `ZMS Sourcing MultiWidth Purchase Contract (${contract.seller || '-'})-(${contract.buyer || '-'}).pdf`
      : `ZMS Sourcing MultiWidth Sale Contract (${contract.seller || '-'})-(${contract.buyer || '-'}).pdf`;
    doc.save(filename);
  },
};

export default MultiContractPDFExport;