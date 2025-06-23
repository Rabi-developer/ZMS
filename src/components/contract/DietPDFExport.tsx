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

// Helper function to split pipe-separated values into an array
const splitMultiValue = (value: string | number | undefined): string[] => {
  if (!value || typeof value !== 'string' || !value.includes('|')) {
    return [value?.toString() || '-'];
  }
  return value.split('|').map((v) => v.trim());
};

interface ExportToPDFProps {
  contract: Contract | null;
  sellerSignature?: string;
  buyerSignature?: string;
  zmsSignature?: string;
  sellerAddress?: string;
  buyerAddress?: string;
  type: 'sale' | 'purchase';
}

const DietPDFExport = {
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
      const [sellerData, buyerData, descriptionData, blendRatioData, warpYarnData, weftYarnData, weavesData, pickInsertionData, selvedgeData] = await Promise.all([
        getAllSellers(),
        getAllBuyer(),
        getAllDescriptions(),
        getAllBlendRatios(),
        getAllWrapYarnTypes(),
        getAllWeftYarnType(),
        getAllWeaves(),
        getAllPickInsertions(),
        getAllSelveges(),
      ]);

      const sellerMatch = sellerData.data.find(
        (item: { sellerName: string; address: string }) => item.sellerName === contract.seller
      );
      const buyerMatch = buyerData.data.find(
        (item: { buyerName: string; address: string }) => item.buyerName === contract.buyer
      );
      GetSellerAddress = sellerMatch ? sellerMatch.address : '';
      GetBuyerAddress = buyerMatch ? buyerMatch.address : '';

      const descriptionMatch = descriptionData.data.find(
        (item: { descriptions: string; subDescription: string }) => item.descriptions === contract.description
      );
      descriptionSub = descriptionMatch ? descriptionMatch.subDescription : '-';

      const blendRatioMatch = blendRatioData.data.find(
        (item: { descriptions: string; subDescription: string }) => item.descriptions === contract.blendRatio
      );
      blendRatioSub = blendRatioMatch ? blendRatioMatch.subDescription : '-';

      const warpYarnMatch = warpYarnData.data.find(
        (item: { descriptions: string; subDescription: string }) => item.descriptions === contract.warpYarnType
      );
      warpYarnTypeSub = warpYarnMatch ? warpYarnMatch.subDescription : '-';

      const weftYarnMatch = weftYarnData.data.find(
        (item: { descriptions: string; subDescription: string }) => item.descriptions === contract.weftYarnType
      );
      weftYarnTypeSub = weftYarnMatch ? weftYarnMatch.subDescription : '-';

      const weavesMatch = weavesData.data.find(
        (item: { descriptions: string; subDescription: string }) => item.descriptions === contract.weaves
      );
      weavesSub = weavesMatch ? weavesMatch.subDescription : '-';

      const pickInsertionMatch = pickInsertionData.data.find(
        (item: { descriptions: string; subDescription: string }) => item.descriptions === contract.pickInsertion
      );
      pickInsertionSub = pickInsertionMatch ? pickInsertionMatch.subDescription : '-';

      const selvedgeMatch = selvedgeData.data.find(
        (item: { descriptions: string; subDescription: string }) => item.descriptions === contract.selvege
      );
      selvedgeSub = selvedgeMatch ? selvedgeMatch.subDescription : '-';
    } catch (error) {
      console.error('Error fetching subDescriptions:', error);
      toast('Failed to fetch subDescriptions, proceeding with defaults', { type: 'warning' });
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

    // Subheading: ZMS/ContractNo/Month/Year
    let yPos = 39;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
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

    // Title
    yPos = 34;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    const title = type === 'purchase' ? ' PURCHASE CONTRACT' : ' SALE CONTRACT';
    doc.text(title, 105, yPos, { align: 'center' });

    // Date
    yPos = 39;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(0, 0, 0);
    const formattedDate = contract.date
      ? new Date(contract.date).toLocaleDateString('en-GB', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        }).split('/').join('-')
      : '-';
    doc.text(`Date: ${formattedDate}`, 200, yPos, { align: 'right' });
    yPos += 8;

    /// Seller and Buyer Info
const leftColX = 10;
const rightColX = 125;
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

// Set font for text width calculations
doc.setFont(valueStyle.font, valueStyle.style);
doc.setFontSize(valueStyle.size);

// Seller Info
let sellerName = contract.seller || '-';
let sellerAddressText = sellerAddress || GetSellerAddress || '-';
const maxSellerWidth = 65;
// Truncate sellerName if too wide
if (doc.getTextWidth(sellerName) > maxSellerWidth) {
  while (doc.getTextWidth(sellerName + '...') > maxSellerWidth && sellerName.length > 0) {
    sellerName = sellerName.slice(0, -1);
  }
  sellerName += '...';
}
// Split sellerAddressText into lines
const sellerAddressLines = doc.splitTextToSize(sellerAddressText, maxSellerWidth);

// Buyer Info
let buyerName = contract.buyer || '-';
let buyerAddressText = buyerAddress || GetBuyerAddress || '-';
const maxBuyerWidth = 65;
// Truncate buyerName if too wide
if (doc.getTextWidth(buyerName) > maxBuyerWidth) {
  while (doc.getTextWidth(buyerName + '...') > maxBuyerWidth && buyerName.length > 0) {
    buyerName = buyerName.slice(0, -1);
  }
  buyerName += '...';
}
// Split buyerAddressText into lines
const buyerAddressLines = doc.splitTextToSize(buyerAddressText, maxBuyerWidth);

// Calculate box height based on maximum line count
const maxLineCount = Math.max(sellerAddressLines.length, buyerAddressLines.length);
const boxHeight = 10 + (maxLineCount - 1) * 4; // Base height + 4 per additional line
const boxY = yPos - 3;

// Draw Seller Box
doc.setLineWidth(0.3);
doc.setDrawColor(isDarkMode ? 255 : 0, isDarkMode ? 255 : 0, isDarkMode ? 255 : 0);
doc.rect(leftColX - 2, boxY, 80, boxHeight, 'S');
// Render Seller Label and Name
doc.setFont(labelStyle.font, labelStyle.style);
doc.setFontSize(labelStyle.size);
doc.setTextColor(...labelStyle.color);
doc.text('Seller:', leftColX, yPos);
doc.setFont(valueStyle.font, valueStyle.style);
doc.setFontSize(valueStyle.size);
doc.setTextColor(...valueStyle.color);
doc.text(sellerName, leftColX + doc.getTextWidth('Seller:') + 4, yPos);
// Render Seller Address Lines
sellerAddressLines.forEach((line: string, index: number) => {
  doc.text(line, leftColX + doc.getTextWidth('Seller:') + 4, yPos + 4 + index * 4);
});

// Draw Buyer Box
doc.setLineWidth(0.3);
doc.setDrawColor(isDarkMode ? 255 : 0, isDarkMode ? 255 : 0, isDarkMode ? 255 : 0);
doc.rect(rightColX - 2, boxY, 80, boxHeight, 'S');
// Render Buyer Label and Name
doc.setFont(labelStyle.font, labelStyle.style);
doc.setFontSize(labelStyle.size);
doc.setTextColor(...labelStyle.color);
doc.text('Buyer:', rightColX, yPos);
doc.setFont(valueStyle.font, valueStyle.style);
doc.setFontSize(valueStyle.size);
doc.setTextColor(...valueStyle.color);
doc.text(buyerName, rightColX + doc.getTextWidth('Buyer:') + 4, yPos);
// Render Buyer Address Lines
buyerAddressLines.forEach((line: string, index: number) => {
  doc.text(line, rightColX + doc.getTextWidth('Buyer:') + 4, yPos + 4 + index * 4);
});

// Update yPos based on the maximum number of lines
yPos += 15 + (maxLineCount - 1) * 4; // Base offset + 4 per additional line    yPos += 15;

    // Fields
    const dietRow = contract.dietContractRow && contract.dietContractRow.length > 0 ? contract.dietContractRow[0] : null;
    const fields = [
      { label: 'Description:', value: `${contract.description || '-'}, ${contract.stuff || '-'}` },
      { label: 'Blend Ratio:', value: `${contract.blendRatio || '-'}, ${contract.warpYarnType || '-'}` },
      {
        label: 'Construction:',
        value: `${contract.warpCount || '-'} ${contract.warpYarnTypeSubOptions} × ${contract.weftCount || '-'} ${contract.weftYarnTypeSubOptions} / ${contract.noOfEnds || '-'} × ${contract.noOfPicks || '-'} ${weavesSub} ${pickInsertionSub} ${contract.selvege || 'selvedge'}`,
      },
      { label: 'Finish Width:', value: dietRow?.finishWidth || contract.finishWidth || '-' },
      { label: 'Weight:', value: dietRow?.weight || '-' },
      { label: 'Shrinkage:', value: dietRow?.shrinkage || '-' },
    ];

    doc.setFont(labelStyle.font, labelStyle.style);
    doc.setFontSize(labelStyle.size);
    const maxLabelWidth = Math.max(...fields.map((field) => doc.getTextWidth(field.label)));

    fields.forEach((field) => {
      const maxWidth = 170;
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
      doc.text(value, leftColX + maxLabelWidth + 4, yPos);

      yPos += 7;
    });

    yPos += 5;

    // Financial Table
    const tableBody: (string | number)[][] = [];
    let totalQty = 0;
    let totalAmount = 0;
    let totalCommissionValue = 0;

    // Helper function to get the maximum length of split values
    const getMaxSplitLength = (values: string[][]): number => {
      return Math.max(...values.map((v) => v.length));
    };

    // Define table headers based on contract type
    const tableHeaders = [
      'Lab Dis.No.',
      'Lab Dis.Date',
      'Color',
      'Finish Qty',
      'PKR/Mtr',
      'Amount',
      'Delivery',
      ...(type === 'purchase' ? ['Comm. %', 'Comm. Value'] : []),
    ];

    if (Array.isArray(contract.dietContractRow) && contract.dietContractRow.length > 0) {
      contract.dietContractRow.forEach((row, index) => {
        const qty = parseFloat(row.quantity || '0');
        const rate = parseFloat(row.rate || '0');
        const amount = parseFloat(row.amountTotal || '0');
        const commissionPercentage = parseFloat(row.commissionPercentage || '0');
        const commissionValue = parseFloat(row.commissionValue || '0');

        if (!isNaN(qty)) totalQty += qty;
        if (!isNaN(amount)) totalAmount += amount;
        if (type === 'purchase' && !isNaN(commissionValue)) totalCommissionValue += commissionValue;

        // Split all relevant fields
        const labDispatchNoValues = splitMultiValue(row.labDispatchNo);
        const labDispatchDateValues = splitMultiValue(
          row.labDispatchDate
            ? new Date(row.labDispatchDate).toLocaleDateString('en-GB', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
              }).split('/').join('-')
            : '-'
        );
        const colorValues = splitMultiValue(row.color);
        const rateValues = splitMultiValue(row.rate);
        const commissionPercentageValues = type === 'purchase' ? splitMultiValue(row.commissionPercentage) : [];
        const commissionValueValues = type === 'purchase' ? splitMultiValue(row.commissionValue) : [];

        // Get the maximum number of rows needed
        const maxRows = getMaxSplitLength([
          labDispatchNoValues,
          labDispatchDateValues,
          colorValues,
          rateValues,
          ...(type === 'purchase' ? [commissionPercentageValues, commissionValueValues] : []),
        ]);

        // Create a row for each split value
        for (let i = 0; i < maxRows; i++) {
          tableBody.push([
            labDispatchNoValues[i] || (i === 0 ? labDispatchNoValues[0] || '-' : '-'),
            labDispatchDateValues[i] || (i === 0 ? labDispatchDateValues[0] || '-' : '-'),
            colorValues[i] || (i === 0 ? colorValues[0] || '-' : '-'),
            i === 0 ? row.quantity?.toString() || '-' : '-',
            `PKR ${rateValues[i] || (i === 0 ? formatCurrency(rate) : '-')}`,
            i === 0 ? formatCurrency(amount) : '-',
            i === 0 && row.buyerDeliveryBreakups?.[index]?.deliveryDate
              ? new Date(row.buyerDeliveryBreakups[index].deliveryDate).toLocaleDateString('en-GB', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                }).split('/').join('-')
              : i === 0 ? (row.deliveryDate
                  ? new Date(row.deliveryDate).toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                    }).split('/').join('-')
                  : '-') : '-',
            ...(type === 'purchase'
              ? [
                  commissionPercentageValues[i] || (i === 0 ? formatCurrency(commissionPercentage) : '-'),
                  commissionValueValues[i] || (i === 0 ? formatCurrency(commissionValue) : '-'),
                ]
              : []),
          ]);
        }
      });
    } else {
      const qty = parseFloat(contract.quantity || '0');
      const rate = parseFloat(contract.rate || '0');
      const amount = qty * rate;
      const commissionPercentage = parseFloat(dietRow?.commissionPercentage || '0');
      const commissionValue = parseFloat(dietRow?.commissionValue || '0');

      if (!isNaN(qty)) totalQty += qty;
      if (!isNaN(amount)) totalAmount += amount;
      if (type === 'purchase' && !isNaN(commissionValue)) totalCommissionValue += commissionValue;

      // Split all relevant fields
      const labDispatchNoValues = splitMultiValue('');
      const labDispatchDateValues = splitMultiValue('');
      const colorValues = splitMultiValue('');
      const rateValues = splitMultiValue(contract.rate);
      const commissionPercentageValues = type === 'purchase' ? splitMultiValue(dietRow?.commissionPercentage) : [];
      const commissionValueValues = type === 'purchase' ? splitMultiValue(dietRow?.commissionValue) : [];

      // Get the maximum number of rows needed
      const maxRows = getMaxSplitLength([
        labDispatchNoValues,
        labDispatchDateValues,
        colorValues,
        rateValues,
        ...(type === 'purchase' ? [commissionPercentageValues, commissionValueValues] : []),
      ]);

      // Create a row for each split value
      for (let i = 0; i < maxRows; i++) {
        tableBody.push([
          labDispatchNoValues[i] || (i === 0 ? labDispatchNoValues[0] || '-' : '-'),
          labDispatchDateValues[i] || (i === 0 ? labDispatchDateValues[0] || '-' : '-'),
          colorValues[i] || (i === 0 ? colorValues[0] || '-' : '-'),
          i === 0 ? contract.quantity?.toString() || '-' : '-',
          `PKR ${rateValues[i] || (i === 0 ? formatCurrency(rate) : '-')}`,
          i === 0 ? formatCurrency(amount) : '-',
          i === 0 && contract.deliveryDate
            ? new Date(contract.deliveryDate).toLocaleDateString('en-GB', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
              }).split('/').join('-')
            : '-',
          ...(type === 'purchase'
            ? [
                commissionPercentageValues[i] || (i === 0 ? formatCurrency(commissionPercentage) : '-'),
                commissionValueValues[i] || (i === 0 ? formatCurrency(commissionValue) : '-'),
              ]
            : []),
        ]);
      }
    }

    // Calculate GST amount and total with GST
    const gstPercentage = 18; // Hardcoded to 18% as per request
    const gstAmount = (totalAmount * gstPercentage) / 100;
    const totalWithGST = totalAmount + gstAmount;


       // Add GST row
      const blankrow = type === 'purchase'
        ? ['', '', '', '', '', '', '', '', '', ]
        : ['', '', '', '', '', '', '', ];
      tableBody.push(blankrow);

    // Add total quantity row (subtotal before GST)
    tableBody.push([
      'TOTAL:', '', '', formatCurrency(totalQty), '', formatCurrency(totalAmount), '',
      ...(type === 'purchase' ? ['', formatCurrency(totalCommissionValue)] : []),
    ]);

    // Add GST row
    tableBody.push([
      '', '', '', '', 'GST (18%):', formatCurrency(gstAmount), '',
      ...(type === 'purchase' ? ['', ''] : []),
    ]);

    // Add total with GST row
    tableBody.push([
      '', '', '', '', 'Total (with 18% GST):', formatCurrency(totalWithGST.toFixed(2)), '',
      ...(type === 'purchase' ? ['', ''] : []),
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [tableHeaders],
      body: tableBody,
      styles: {
        fontSize: 7,
        cellPadding: { top: 1, bottom: 1.5, left: 1, right: 0.1 },
        lineColor: [0, 0, 0],
        lineWidth: 0.1,
        textColor: [0, 0, 0],
        fontStyle: 'normal',
      },
      headStyles: {
        fillColor: [6, 182, 212],
        textColor: [0, 0, 0],
        lineColor: [0, 0, 0],
        fontSize: 7,
        cellPadding: { top: 1.2, bottom: 1, left: 1, right: 0.1 },
        lineWidth: 0.1,
        fontStyle: 'bold',
      },
      columnStyles: {
        0: { cellWidth: 20 }, // Lab Dispatch No.
        1: { cellWidth: 20 }, // Lab Dispatch Date
        2: { cellWidth: 25 }, // Color
        3: { cellWidth: 20 }, // Finish Qty
        4: { cellWidth: 20}, // PKR/Mtr
        5: { cellWidth: 20 }, // Amount
        6: { cellWidth: 25 }, // Delivery
        ...(type === 'purchase'
          ? {
              7: { cellWidth: 16 }, // Comm. %
              8: { cellWidth: 18}, // Comm. Value
            }
          : {}),
           ...(type === 'sale'
          ? {
             0: { cellWidth: 25 }, // Lab Dispatch No.
             1: { cellWidth: 25 }, // Lab Dispatch Date
             2: { cellWidth: 25 }, // Color
             3: { cellWidth: 25 }, // Finish Qty
             4: { cellWidth: 25}, // PKR/Mtr
             5: { cellWidth: 30 }, // Amount
             6: { cellWidth: 29 }, // Delivery
            }
          : {}),
      },
      margin: { left: 10, right: 10 },
      theme: 'grid',
    });

    yPos = (doc as any).lastAutoTable.finalY + 9;

    // Two-Column Layout
    const leftColumnX = 12;
    const rightColumnX = 160;
    const leftColumnWidth = 125;
    const rightColumnWidth = 45;
    let leftColumnYPos = yPos;
    let rightColumnYPos = yPos;

    // Left Column: Additional Fields
    const additionalFields = [
      { label: 'Piece Length:', value: contract.pieceLength || '-' },
     { 
          label: 'Payment Term:', 
          value: type === 'purchase' 
            ? contract.paymenterm || '45 days PDC before dispatch' 
            : contract.paymenterm || '45 days PDC before dispatch' 
        },
        { label: 'Packing:', value: `${contract.packing || '-'} Packing` },
      { label: 'Delivery Destination:', value: contract.buyer || '-' },
      { 
        label: 'Remarks:', 
        value: type === 'purchase' 
          ? dietRow?.commisionInfo?.sellerRemark || '-' 
          : dietRow?.commisionInfo?.buyerRemark || '-' 
      },
    ];

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

    // Right Column: Delivery Breakups
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(...labelStyle.color);
    rightColumnYPos += 4;
    const deliveryBreakups = dietRow?.buyerDeliveryBreakups || [];
    if (Array.isArray(deliveryBreakups) && deliveryBreakups.length > 0) {
      autoTable(doc, {
        startY: rightColumnYPos,
        head: [['Qty', 'Date']],
        body: deliveryBreakups.slice(0, 3).map((breakup) => [
          breakup.qty?.toString() || '-',
          breakup.deliveryDate
            ? new Date(breakup.deliveryDate).toLocaleDateString('en-GB', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
              }).split('/').join('-')
            : '-',
        ]),
        styles: {
          fontSize: 5,
          cellPadding: { top: 1, bottom: 1, left: 0.3, right: 0.1 },
          lineColor: [0, 0, 0],
          lineWidth: 0.1,
        },
        headStyles: {
          fillColor: [6, 182, 212],
          textColor: [0, 0, 0],
          fontSize: 5,
          cellPadding: { top: 1, bottom: 1, left: 0.3, right: 0.1 },
          lineWidth: 0.1,
          fontStyle: 'bold',
        },
        columnStyles: { 0: { cellWidth: 15 }, 1: { cellWidth: 20 } },
        margin: { left: rightColumnX, right: 10 },
        theme: 'grid',
      });
      rightColumnYPos = (doc as any).lastAutoTable.finalY + 2;
    } else {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(5);
      doc.setTextColor(0, 0, 0);
      rightColumnYPos += 4;
    }

    yPos = Math.max(leftColumnYPos, rightColumnYPos) + 12;

    // Terms and Conditions
    autoTable(doc, {
      startY: yPos,
      body: [
        ['01', 'Dispatch first 5Mt fabric as production sample'],
        ['02', 'No Contamination guarantee in Pakistan Cotton'],
      ],
      theme: 'plain',
      styles: {
        font: 'helvetica',
        fontSize: 10,
        cellPadding: { top: 2, bottom: 0.5, left: 1, right: 3 },
        textColor: [0, 0, 0],
        halign: 'left',
      },
      columnStyles: { 0: { cellWidth: 10 }, 1: { cellWidth: 150 } },
      margin: { left: 10, right: 10 },
      didDrawCell: (data) => {
        if (data.section === 'body' && data.row.index === 0) {
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(10);
          doc.setTextColor(...labelStyle.color);
          doc.text('Terms and Conditions', 10, data.cell.y - 2);
        }
      },
    });

    yPos = (doc as any).lastAutoTable.finalY + 5;

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
    const sellerText = `${contract.seller || '-'}`;
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
    const buyerText = `${contract.buyer || '-'}`;
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
    const filename = type === 'purchase'
      ? `ZMS Sourcing Purchase Diet Contract (${contract.seller || '-'})-(${contract.buyer || '-'}).pdf`
      : `ZMS Sourcing Sale Diet Contract (${contract.seller || '-'})-(${contract.buyer || '-'}).pdf`;
    doc.save(filename);
    toast('PDF generated successfully', { type: 'success' });
  },
};

export default DietPDFExport;