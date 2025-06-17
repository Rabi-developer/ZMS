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
  label: { size: 7, color: [0, 0, 0] as [number, number, number] },
  value: { size: 6, color: [0, 0, 0] as [number, number, number] },
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
      selvedgeSub = selvedgeMatch ? selvedgeSub : '-';
    } catch (error) {
      console.error('Error fetching subDescriptions:', error);
      toast('Failed to fetch subDescriptions', { type: 'warning' });
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
    doc.setFontSize(5);
    doc.text('Suit No. 108, SP Chamber, Main Estate Avenue, SITE Karachi', 105, 15, { align: 'center' });
    doc.text('Phone: +92 21 32550917-18', 105, 20, { align: 'center' });

    // Logo
    try {
      doc.addImage(ZMS_LOGO, 'PNG', 10, 6, 18, 12);
    } catch (error) {
      console.error('Failed to load logo:', error);
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text('[ZMS Logo]', 10, 14);
    }

    // Subheading: ZMS/ContractNo/Month/Year
    let yPos = 36;
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

    // Title based on type
    yPos = 32;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    const title = type === 'purchase' ? 'DIET PURCHASE CONTRACT' : 'DIET SALE CONTRACT';
    doc.text(title, 105, yPos, { align: 'center' });

    // Date
    yPos = 36;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(0, 0, 0);
    const formattedDate = contract.date
      ? new Date(contract.date).toLocaleDateString('en-GB', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        })
          .split('/')
          .join('-')
      : '-';
    doc.text(`Date: ${formattedDate}`, 200, yPos, { align: 'right' });
    yPos += 8;

    // Seller and Buyer Info
    const leftColX = 10;
    const rightColX = 105;
    const labelStyle = {
      font: 'helvetica' as const,
      style: 'bold' as const,
      size: 7,
      color: [0, 0, 0] as [number, number, number],
    };
    const valueStyle = {
      font: 'helvetica' as const,
      style: 'normal' as const,
      size: 6,
      color: [0, 0, 0] as [number, number, number],
    };

    // Seller Info
    const sellerBoxY = yPos - 3;
    const sellerBoxHeight = 10;
    doc.setLineWidth(0.3);
    doc.setDrawColor(isDarkMode ? 0 : 0, isDarkMode ? 0 : 0, isDarkMode ? 0 : 0);
    doc.rect(leftColX - 2, sellerBoxY, 80, sellerBoxHeight, 'S');
    doc.setFont(labelStyle.font, labelStyle.style);
    doc.setFontSize(labelStyle.size);
    doc.setTextColor(...labelStyle.color);
    doc.text('Seller:', leftColX, yPos);
    doc.setFont(valueStyle.font, valueStyle.style);
    doc.setFontSize(valueStyle.size);
    doc.setTextColor(...valueStyle.color);
    let sellerName = contract.seller || '-';
    let sellerAddressText = sellerAddress || contract.dietContractRow?.[0]?.commisionInfo?.dispatchAddress || GetSellerAddress || '-';
    const maxSellerWidth = 65;
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
    doc.text(sellerName, leftColX + doc.getTextWidth('Seller:') + 4, yPos);
    doc.text(sellerAddressText, leftColX + doc.getTextWidth('Seller:') + 4, yPos + 4);

    // Buyer Info
    const buyerBoxY = yPos - 3;
    const buyerBoxHeight = 10;
    doc.setLineWidth(0.3);
    doc.setDrawColor(isDarkMode ? 0 : 0, isDarkMode ? 0 : 0, isDarkMode ? 0 : 0);
    doc.rect(rightColX - 2, buyerBoxY, 80, buyerBoxHeight, 'S');
    doc.setFont(labelStyle.font, labelStyle.style);
    doc.setFontSize(labelStyle.size);
    doc.setTextColor(...labelStyle.color);
    doc.text('Buyer:', rightColX, yPos);
    doc.setFont(valueStyle.font, valueStyle.style);
    doc.setFontSize(valueStyle.size);
    doc.setTextColor(...valueStyle.color);
    let buyerName = contract.buyer || '-';
    let buyerAddressText = buyerAddress || GetBuyerAddress || '-';
    const maxBuyerWidth = 65;
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
    doc.text(buyerName, rightColX + doc.getTextWidth('Buyer:') + 4, yPos);
    doc.text(buyerAddressText, rightColX + doc.getTextWidth('Buyer:') + 4, yPos + 4);

    yPos += 12;

    // Fields
    const fields = [
      { label: 'Description:', value: `${contract.description || '-'}, ${contract.stuff || '-'}` },
      { label: 'Blend Ratio:', value: `${contract.blendRatio || '-'}, ${contract.warpYarnType || '-'}` },
      {
        label: 'Construction:',
        value: `${contract.warpCount || '-'} ${warpYarnTypeSub} × ${contract.weftCount || '-'} ${weftYarnTypeSub} / ${contract.noOfEnds || '-'} × ${contract.noOfPicks || '-'} ${weavesSub} ${pickInsertionSub} ${contract.finishWidth || '-'} ${contract.final || '-'}${contract.selvege || 'selvedge'}`,
      },
      { label: 'Finish Width:', value: `${contract.dietContractRow?.[0]?.finishWidth || contract.finishWidth || '-'}` },
      { label: 'Weight:', value: `${contract.dietContractRow?.[0]?.weight ||  '-'}` },
      { label: 'Shrinkage:', value: `${contract.dietContractRow?.[0]?.shrinkage  || '-'}` },
      { label: 'Reference Number:', value: contract.referenceNumber || '-' },
      { label: 'Fabric Type:', value: contract.fabricType || '-' },
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

      yPos += 3;
    });

    yPos += 2;

    // Financial Table
    const tableBody: (string | number)[][] = [];
    let totalQty = 0;
    let totalAmount = 0;

    // Helper function to get the maximum length of split values
    const getMaxSplitLength = (values: string[][]): number => {
      return Math.max(...values.map((v) => v.length));
    };

    if (Array.isArray(contract.dietContractRow) && contract.dietContractRow.length > 0) {
      contract.dietContractRow.forEach((row, index) => {
        const qty = parseFloat(row.quantity || '0');
        const rate = parseFloat(row.rate || '0');
        const amount = parseFloat(row.amountTotal || '0');

        if (!isNaN(qty)) totalQty += qty;
        if (!isNaN(amount)) totalAmount += amount;

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

        // Get the maximum number of rows needed
        const maxRows = getMaxSplitLength([labDispatchNoValues, labDispatchDateValues, colorValues, rateValues]);

        // Create a row for each split value
        for (let i = 0; i < maxRows; i++) {
          tableBody.push([
            labDispatchNoValues[i] || (i === 0 ? labDispatchNoValues[0] || '-' : '-'),
            labDispatchDateValues[i] || (i === 0 ? labDispatchDateValues[0] || '-' : '-'),
            colorValues[i] || (i === 0 ? colorValues[0] || '-' : '-'),
            i === 0 ? row.quantity?.toString() || '-' : '-',
            i === 0 ? row.finish?.toString() || '-' : '-',
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
          ]);
        }
      });
    } else {
      const qty = parseFloat(contract.quantity || '0');
      const rate = parseFloat(contract.rate || '0');
      const amount = qty * rate;

      if (!isNaN(qty)) totalQty += qty;
      if (!isNaN(amount)) totalAmount += amount;

      // Split all relevant fields
      const labDispatchNoValues = splitMultiValue('');
      const labDispatchDateValues = splitMultiValue('');
      const colorValues = splitMultiValue('');
      const rateValues = splitMultiValue(contract.rate);

      // Get the maximum number of rows needed
      const maxRows = getMaxSplitLength([labDispatchNoValues, labDispatchDateValues, colorValues, rateValues]);

      // Create a row for each split value
      for (let i = 0; i < maxRows; i++) {
        tableBody.push([
          labDispatchNoValues[i] || (i === 0 ? labDispatchNoValues[0] || '-' : '-'),
          labDispatchDateValues[i] || (i === 0 ? labDispatchDateValues[0] || '-' : '-'),
          colorValues[i] || (i === 0 ? colorValues[0] || '-' : '-'),
          i === 0 ? contract.quantity?.toString() || '-' : '-',
          i === 0 ? contract.finishWidth?.toString() || '-' : '-',
          `PKR ${rateValues[i] || (i === 0 ? formatCurrency(rate) : '-')}`,
          i === 0 ? formatCurrency(amount) : '-',
          i === 0 && contract.deliveryDate
            ? new Date(contract.deliveryDate).toLocaleDateString('en-GB', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
              }).split('/').join('-')
            : '-',
        ]);
      }
    }

    // Calculate GST amount and total with GST
    const gstPercentage = parseFloat(contract.dietContractRow?.[0]?.gst || contract.gst || '0');
    const gstAmount = (totalAmount * gstPercentage) / 100;
    const totalWithGST = totalAmount + gstAmount;

    // Add total quantity row (subtotal before GST)
    tableBody.push(['', '', 'Subtotal:', formatCurrency(totalQty), '', '', formatCurrency(totalAmount), '']);

    // Add GST row
    tableBody.push(['', '', `GST (${gstPercentage}%):`, '', '', '', formatCurrency(gstAmount), '']);

    // Add total with GST row
    tableBody.push(['', '', `Total (with ${gstPercentage}% GST):`, '', '', '', formatCurrency(totalWithGST), '']);

    autoTable(doc, {
      startY: yPos,
      head: [['Lab Dispatch No.', 'Lab Dispatch Date', 'Color', 'Qty', 'Finish', 'PKR/Mtr', 'Amount', 'Delivery']],
      body: tableBody,
      styles: {
        fontSize: 6,
        cellPadding: 0.5,
        lineColor: [0, 0, 0],
        lineWidth: 0.1,
        textColor: [0, 0, 0],
        fontStyle: 'normal',
      },
      headStyles: {
        fillColor: [6, 182, 212],
        textColor: [0, 0, 0],
        lineColor: [0, 0, 0],
        fontSize: 6,
        cellPadding: 0.5,
        lineWidth: 0.1,
        fontStyle: 'bold',
      },
      columnStyles: {
        0: { cellWidth: 20 }, // Lab Dispatch No.
        1: { cellWidth: 20 }, // Lab Dispatch Date
        2: { cellWidth: 25 }, // Color
        3: { cellWidth: 15 }, // Qty
        4: { cellWidth: 15 }, // Finish
        5: { cellWidth: 20 }, // PKR/Mtr
        6: { cellWidth: 25 }, // Amount
        7: { cellWidth: 25 }, // Delivery
      },
      margin: { left: 10, right: 10 },
      theme: 'grid',
    });

    yPos = (doc as any).lastAutoTable.finalY + 3;

    // Two-Column Layout
    const leftColumnX = 12;
    const rightColumnX = 145;
    const leftColumnWidth = 125;
    const rightColumnWidth = 45;
    let leftColumnYPos = yPos;
    let rightColumnYPos = yPos;

    // Left Column: Additional Fields
    const additionalFields = [
      { label: 'Piece Length:', value: contract.pieceLength || '-' },
      { 
        label: 'Payment:', 
        value: type === 'purchase' 
          ? contract.dietContractRow?.[0]?.commisionInfo?.paymentTermsSeller || '-' 
          : contract.dietContractRow?.[0]?.commisionInfo?.paymentTermsBuyer || '-' 
      },
      { label: 'Packing:', value: contract.packing || '-' },
      { label: 'Total:', value: `Rs. ${formatCurrency(totalWithGST)}` },
      ...(type === 'purchase'
        ? [
            { label: 'Commission:', value: `${contract.dietContractRow?.[0]?.commissionPercentage || '-'}%` },
            { label: 'Commission Value:', value: `Rs. ${formatCurrency(contract.dietContractRow?.[0]?.commissionValue)}` },
          ]
        : []),
      { label: 'Delivery Destination:', value: contract.buyer || '-' },
      { 
        label: 'Remarks:', 
        value: type === 'purchase' 
          ? contract.dietContractRow?.[0]?.commisionInfo?.sellerRemark || '-' 
          : contract.dietContractRow?.[0]?.commisionInfo?.buyerRemark || '-' 
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
        doc.text(line, leftColumnX + maxAdditionalLabelWidth + 4, leftColumnYPos + i * 3);
      });
      leftColumnYPos += wrappedText.length * 4;
    });

    // Right Column: Delivery Breakups
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(...labelStyle.color);
    doc.text('Delivery Schedule:', rightColumnX, rightColumnYPos);
    rightColumnYPos += 4;
    const deliveryBreakups = contract.dietContractRow?.[0]?.buyerDeliveryBreakups || [];
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
          cellPadding: 0.3,
          lineColor: [0, 0, 0],
          lineWidth: 0.1,
        },
        headStyles: {
          fillColor: [6, 182, 212],
          textColor: [0, 0, 0],
          fontSize: 5,
          cellPadding: 0.3,
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
      doc.text('No delivery breakups', rightColumnX, rightColumnYPos);
      rightColumnYPos += 4;
    }

    yPos = Math.max(leftColumnYPos, rightColumnYPos) + 3;

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
        fontSize: 6,
        cellPadding: { top: 0.5, bottom: 0.5, left: 1, right: 3 },
        textColor: [0, 0, 0],
        halign: 'left',
      },
      columnStyles: { 0: { cellWidth: 10 }, 1: { cellWidth: 150 } },
      margin: { left: 10, right: 10 },
      didDrawCell: (data) => {
        if (data.section === 'body' && data.row.index === 0) {
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(7);
          doc.setTextColor(...labelStyle.color);
          doc.text('Terms and Conditions', 10, data.cell.y - 2);
        }
      },
    });

    yPos = (doc as any).lastAutoTable.finalY + 3;

    // Reserve space for footer and signatures
    const pageHeight = 297;
    const footerHeight = 10;
    const signatureHeight = 16;
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
    doc.setFontSize(6);
    doc.setTextColor(...labelColor);
    if (zmsSignature) {
      doc.addImage(zmsSignature, 'PNG', startX, signatureY, signatureWidth, 10);
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
      doc.addImage(sellerSignature, 'PNG', centerX, signatureY, signatureWidth, 10);
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
      doc.addImage(buyerSignature, 'PNG', endX, signatureY, signatureWidth, 10);
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

    // Save PDF with dynamic name
    const filename = type === 'purchase'
      ? `ZMS Sourcing Purchase Diet Contract (${contract.seller || '-'})-(${contract.buyer || '-'}).pdf`
      : `ZMS Sourcing Sale Diet Contract (${contract.seller || '-'})-(${contract.buyer || '-'}).pdf`;
    doc.save(filename);
  },
};

export default DietPDFExport;