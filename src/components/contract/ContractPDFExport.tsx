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
  label: { size: 11, color: [0, 0, 0] as [number, number, number] }, // Increased font size for labels
  value: { size: 10, color: [0, 0, 0] as [number, number, number] },
  margins: { left: 12, right: 12 },
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
  buyerDeliveryBreakups?: { Qty: string; DeliveryDate: string }[];
  sellerDeliveryBreakups?: { Qty: string; DeliveryDate: string }[];
}

const ContractPDFExport = {
  exportToPDF: async ({
    contract,
    sellerSignature,
    buyerSignature,
    zmsSignature,
    sellerAddress,
    buyerAddress,
    buyerDeliveryBreakups = [],
    sellerDeliveryBreakups = [],
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

    doc.setFillColor(6, 182, 212);
    doc.rect(0, 0, 210, 32, 'F');

    // Header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(30);
    doc.setTextColor(0, 0, 0);
    doc.text('ZM SOURCING', 105, 10, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text('Suit No. 108, SP Chamber, Main Estate Avenue, SITE Karachi', 105, 16, { align: 'center' });
    doc.text('Phone: +92 21 32550917-18', 105, 22, { align: 'center' });

    // Logo
    try {
      doc.addImage(ZMS_LOGO, 'PNG', 12, 6, 22, 16);
    } catch (error) {
      console.error('Failed to load logo:', error);
      doc.setFontSize(15);
      doc.setTextColor(0, 0, 0);
      doc.text('[ZMS Logo]', 12, 16);
    }

    // Subheading: ZMS/ContractNo/Month/Year
    let yPos = 46;
    doc.setFont('helvetica', 'bold'); // Ensure bold font
    doc.setFontSize(9); // Increased font size for subheading
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

    yPos = 40;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16); // Increased font size for main header
    doc.setTextColor(0, 0, 0);
    doc.text('Purchase Contract', 105, yPos, { align: 'center' });

    yPos = 46;
    doc.setFont('helvetica', 'bold'); // Ensure bold font for date
    doc.setFontSize(9); // Increased font size for date subheading
    doc.setTextColor(0, 0, 0);

    // Format date
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
    yPos += 15;

    const leftColX = 10;
    const rightColX = 110;
    const labelStyle = {
      font: 'helvetica' as const,
      style: 'bold' as const,
      size: 9, // Increased font size for labels
      color: [0, 0, 0] as [number, number, number],
    };
    const valueStyle = {
      font: 'helvetica' as const,
      style: 'normal' as const,
      size: 9,
      color: [0, 0, 0] as [number, number, number],
    };

    // Seller Info
    const sellerBoxY = yPos - 5;
    const sellerBoxHeight = 14;
    doc.setLineWidth(0.5);
    doc.setDrawColor(isDarkMode ? 0 : 0, isDarkMode ? 0 : 0, isDarkMode ? 0 : 0);
    doc.rect(leftColX - 2, sellerBoxY, 90, sellerBoxHeight, 'S');

    doc.setFont(labelStyle.font, labelStyle.style);
    doc.setFontSize(labelStyle.size);
    doc.setTextColor(...(labelStyle.color as [number, number, number]));
    doc.text('Seller:', leftColX, yPos);
    doc.setFont(valueStyle.font, valueStyle.style);
    doc.setFontSize(valueStyle.size);
    doc.setTextColor(...valueStyle.color);
    let sellerName = contract.seller || '-';
    let sellerAddressText = GetSellerAddress || '';
    const maxSellerWidth = 75;
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
    doc.text(sellerName, leftColX + doc.getTextWidth('Seller:') + 6, yPos);
    doc.text(sellerAddressText, leftColX + doc.getTextWidth('Seller:') + 6, yPos + 6);

    // Buyer Info
    const buyerBoxY = yPos - 5;
    const buyerBoxHeight = 14;
    doc.setLineWidth(0.5);
    doc.setDrawColor(isDarkMode ? 0 : 0, isDarkMode ? 0 : 0, isDarkMode ? 0 : 0);
    doc.rect(rightColX - 2, buyerBoxY, 90, buyerBoxHeight, 'S');

    doc.setFont(labelStyle.font, labelStyle.style);
    doc.setFontSize(labelStyle.size);
    doc.setTextColor(...(labelStyle.color as [number, number, number]));
    doc.text('Buyer:', rightColX, yPos);
    doc.setFont(valueStyle.font, valueStyle.style);
    doc.setFontSize(valueStyle.size);
    doc.setTextColor(...valueStyle.color);
    let buyerName = contract.buyer || '-';
    let buyerAddressText = GetBuyerAddress || '';
    const maxBuyerWidth = 75;
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
    doc.text(buyerName, rightColX + doc.getTextWidth('Buyer:') + 6, yPos);
    doc.text(buyerAddressText, rightColX + doc.getTextWidth('Buyer:') + 6, yPos + 6);

    yPos += 25;

    const fields = [
      { label: 'Description:', value: `${contract.description || '-'}, ${contract.stuff}` },
      {
        label: 'Blend Ratio:',
        value: `${contract.blendRatio || '-'},${contract.warpYarnType || '-'} ${contract.warpYarnType || '-'} `,
      },
      {
        label: 'Construction:',
        value: `${contract.warpCount || '-'}  ${warpYarnTypeSub} × ${contract.weftCount || '-'} x ${weftYarnTypeSub} / ${contract.noOfEnds || '-'} × ${contract.noOfPicks || '-'} ${contract.weaves || '-'} ${contract.pickInsertion || '-'} ${contract.width || '-'} ${contract.final || '-'} ${contract.selvege || '-'}`,
      },
    ];

    doc.setFont(labelStyle.font, labelStyle.style);
    doc.setFontSize(labelStyle.size);
    const maxLabelWidth = Math.max(...fields.map((field) => doc.getTextWidth(field.label)));

    fields.forEach((field) => {
      const maxWidth = 190;
      let value = field.value;
      if (doc.getTextWidth(value) > maxWidth) {
        while (doc.getTextWidth(value + '...') > maxWidth && value.length > 0) {
          value = value.slice(0, -1);
        }
        value += '...';
      }

      doc.setFont(labelStyle.font, labelStyle.style);
      doc.setFontSize(labelStyle.size);
      doc.setTextColor(...(labelStyle.color as [number, number, number]));
      doc.text(field.label, leftColX, yPos);

      doc.setFont(valueStyle.font, valueStyle.style);
      doc.setFontSize(valueStyle.size);
      doc.setTextColor(...valueStyle.color);
      doc.text(value, leftColX + maxLabelWidth + 6, yPos);

      yPos += 10;
    });

    // Financial Table
    autoTable(doc, {
      startY: yPos,
      head: [['Sel.Length', 'Sel.Weaves', 'Sel.Thick', 'Ind.Thread', 'GSM']],
      body: [
        [
          contract.selvegeWidth || '-',
          contract.selvegeWeaves || '-',
          contract.selvegeThickness || '',
          contract.inductionThread || '-',
          contract.gsm || '-',
        ],
      ],
      styles: {
        fontSize: 9,
        cellPadding: 2,
        lineColor: [0, 0, 0],
        lineWidth: 0.4,
        textColor: [0, 0, 0], // Black text for table body
        fontStyle: 'bold', // Bold text for table body
      },
      headStyles: {
        fillColor: [6, 182, 212],
        textColor: [0, 0, 0], // Black text for header
        lineColor: [0, 0, 0],
        fontSize: 10, // Increased font size for table header
        cellPadding: 2,
        lineWidth: 0.4,
        fontStyle: 'bold', // Bold text for header
      },
      columnStyles: { 0: { cellWidth: 34 }, 1: { cellWidth: 34 }, 2: { cellWidth: 34 }, 3: { cellWidth: 34 }, 4: { cellWidth: 34 } },
      margin: { left: 12, right: 12 },
      theme: 'grid',
    });

    yPos = (doc as any).lastAutoTable.finalY + 8;

    // Two-Column Layout
    const leftColumnX = 12;
    const rightColumnX = 150;
    const leftColumnWidth = 150;
    const rightColumnWidth = 87;
    let leftColumnYPos = yPos;
    let rightColumnYPos = yPos;

    // Left Column: Additional Fields
    const additionalFields = [
      { label: 'Quantity:', value: `Rs. ${formatCurrency(contract.quantity)} Mtr(+-${contract.tolerance || '-'})` },
      {
        label: 'Rate:',
        value: `Rs. ${formatCurrency(contract.rate)}/Mtr + ${contract.gst || '-'} ${contract.deliveryTerms || '-'}`,
      },
      { label: 'Piece Length:', value: contract.pieceLength || '-' },
      {
        label: 'Delivery:',
        value: contract.deliveryDate && !isNaN(new Date(contract.deliveryDate).getTime())
          ? new Date(contract.deliveryDate)
              .toLocaleDateString('en-GB', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
              })
              .split('/')
              .join('-')
          : '-',
      },
      { label: 'Payment:', value: `${contract.paymentTermsBuyer || '-'}` },
      { label: 'Packing:', value: `${contract.packing || '-'} Packing` },
      { label: 'Fab.Value:', value: `Rs. ${formatCurrency(contract.fabricValue)}` },
      { label: 'GST:', value: `${contract.gst || '-'}` },
      { label: 'GST Val:', value: `Rs. ${formatCurrency(contract.gstValue)}` },
      { label: 'Total:', value: `Rs. ${formatCurrency(contract.totalAmount)}` },
      { label: 'Comm.:', value: `${contract.commissionPercentage || '-'}%` },
      { label: 'Comm.Val:', value: `Rs. ${formatCurrency(contract.commissionValue)}` },
      { label: 'Dispatch:', value: `${contract.dispatchAddress || 'Adviced Later'}` },
      { label: 'Remarks:', value: `${contract.buyerRemark || ''}` },
    ];

    doc.setFont(labelStyle.font, labelStyle.style);
    doc.setFontSize(labelStyle.size);
    const maxAdditionalLabelWidth = Math.max(...additionalFields.map((field) => doc.getTextWidth(field.label)));
    additionalFields.forEach((field) => {
      const wrappedText = doc.splitTextToSize(field.value, leftColumnWidth - maxAdditionalLabelWidth - 6);
      doc.setFont(labelStyle.font, labelStyle.style);
      doc.setFontSize(labelStyle.size);
      doc.setTextColor(...(labelStyle.color as [number, number, number]));
      doc.text(field.label, leftColumnX, leftColumnYPos);
      doc.setFont(valueStyle.font, valueStyle.style);
      doc.setFontSize(valueStyle.size);
      doc.setTextColor(...valueStyle.color);
      wrappedText.forEach((line: string, i: number) => {
        doc.text(line, leftColumnX + maxAdditionalLabelWidth + 6, leftColumnYPos + i * 6);
      });
      leftColumnYPos += wrappedText.length * 6;
    });

    // Right Column: Delivery Breakups
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11); // Increased font size for subheading
    doc.setTextColor(...(labelStyle.color as [number, number, number]));
    doc.text('Buyer Del. Breakups', rightColumnX, rightColumnYPos);
    rightColumnYPos += 8;
    if (Array.isArray(buyerDeliveryBreakups) && buyerDeliveryBreakups.length > 0) {
      autoTable(doc, {
        startY: rightColumnYPos,
        head: [['Qty', 'Del. Date']],
        body: buyerDeliveryBreakups.slice(0, 4).map((breakup) => [
          breakup.Qty?.toString() || '-',
          breakup.DeliveryDate?.toString() || '-',
        ]),
        styles: {
          fontSize: 9,
          cellPadding: 2,
          lineColor: isDarkMode ? [0, 0, 0] : [200, 200, 200],
          lineWidth: 0.2,
        },
        headStyles: {
          fillColor: isDarkMode ? [30, 30, 30] : [0, 0, 0],
          textColor: [0, 0, 0],
          fontSize: 10, // Increased font size for table header
          cellPadding: 2,
          lineWidth: 0.2,
          fontStyle: 'bold', // Ensure bold header
        },
        columnStyles: { 0: { cellWidth: 33 }, 1: { cellWidth: 48 } },
        margin: { left: rightColumnX, right: 5 },
        theme: 'grid',
      });
      rightColumnYPos = (doc as any).lastAutoTable.finalY + 6;
      if (buyerDeliveryBreakups.length > 4) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(0, 0, 0);
        doc.text('... (more)', rightColumnX, rightColumnYPos);
        rightColumnYPos += 6;
      }
    } else {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(0, 0, 0);
      doc.text('No Buyer Breakups', rightColumnX, rightColumnYPos);
      rightColumnYPos += 6;
    }

    rightColumnYPos += 4;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11); // Increased font size for subheading
    doc.setTextColor(...(labelStyle.color as [number, number, number]));
    doc.text('Seller Del. Breakups', rightColumnX, rightColumnYPos);
    rightColumnYPos += 6;
    if (Array.isArray(sellerDeliveryBreakups) && sellerDeliveryBreakups.length > 0) {
      autoTable(doc, {
        startY: rightColumnYPos,
        head: [['Qty', 'Del. Date']],
        body: sellerDeliveryBreakups.slice(0, 4).map((breakup) => [
          breakup.Qty?.toString() || '-',
          breakup.DeliveryDate?.toString() || '-',
        ]),
        styles: {
          fontSize: 9,
          cellPadding: 2,
          lineColor: isDarkMode ? [0, 0, 0] : [200, 200, 200],
          lineWidth: 0.2,
        },
        headStyles: {
          fillColor: isDarkMode ? [30, 30, 30] : [0, 0, 0],
          textColor: [0, 0, 0],
          fontSize: 10, // Increased font size for table header
          cellPadding: 2,
          lineWidth: 0.2,
          fontStyle: 'bold', // Ensure bold header
        },
        columnStyles: { 0: { cellWidth: 33 }, 1: { cellWidth: 48 } },
        margin: { left: rightColumnX, right: 5 },
        theme: 'grid',
      });
      rightColumnYPos = (doc as any).lastAutoTable.finalY + 6;
      if (sellerDeliveryBreakups.length > 4) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(0, 0, 0);
        doc.text('... (more)', rightColumnX, rightColumnYPos);
        rightColumnYPos += 6;
      }
    } else {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(0, 0, 0);
      doc.text('No Seller Breakups', rightColumnX, rightColumnYPos);
      rightColumnYPos += 6;
    }

    yPos = Math.max(leftColumnYPos, rightColumnYPos) + 8;

   // Separator Line
    doc.setLineWidth(0.4);
    doc.setDrawColor(0, 0, 0); 
    doc.line(10, yPos, 200, yPos);
    yPos += 1;

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
        fontSize: 9,
        cellPadding: { top: 2, bottom: 2, left: 3, right: 8 },
        textColor: [0, 0, 0],
        lineWidth: 0,
        halign: 'left',
      },
      columnStyles: { 0: { cellWidth: 15, fontStyle: 'bold' }, 1: { cellWidth: 165 } },
      margin: { left: 12, right: 12 },
      didDrawCell: (data) => {
        if (data.section === 'body' && data.row.index === 0) {
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(11); // Increased font size for Terms and Conditions heading
          doc.setTextColor(...(labelStyle.color as [number, number, number]));
          doc.text('Terms and Conditions', 12, data.cell.y - 4);
        }
      },
    });

    yPos = (doc as any).lastAutoTable.finalY + 8;

    // Signatures
    const signatureY = yPos;
    const signatureWidth = 40;
    const startX = 12;
    const sellerMargin = 10;
    const centerX = startX + signatureWidth + sellerMargin;
    const pageWidth = 210;
    const margin = 12;
    const availableWidth = pageWidth - margin - (centerX + signatureWidth);
    const gap = availableWidth / 2;
    const endX = centerX + signatureWidth + gap;

    const labelColor: [number, number, number] = [0, 0, 0];
    const textColor: [number, number, number] = [0, 0, 0];

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11); // Increased font size for signature labels
    doc.setTextColor(...labelColor);
    if (zmsSignature) {
      doc.addImage(zmsSignature, 'PNG', startX, signatureY, signatureWidth, 14);
    }
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(15);
    doc.setTextColor(...textColor);
    const zmsText = 'Z.M. SOURCING';
    const zmsTextWidth = doc.getTextWidth(zmsText);
    doc.text(zmsText, startX, signatureY + 16);
    doc.setLineWidth(0.3);
    doc.setDrawColor(...textColor);
    doc.line(startX, signatureY + 17, startX + zmsTextWidth, signatureY + 17);

    if (sellerSignature) {
      doc.addImage(sellerSignature, 'PNG', centerX, signatureY, signatureWidth, 14);
    }
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(14);
    doc.setTextColor(...textColor);
    const sellerText = `${contract.seller || '-'}`;
    const sellerTextWidth = doc.getTextWidth(sellerText);
    doc.text(sellerText, centerX, signatureY + 16);
    doc.setLineWidth(0.3);
    doc.setDrawColor(...textColor);
    doc.line(centerX, signatureY + 17, centerX + sellerTextWidth, signatureY + 17);

    if (buyerSignature) {
      doc.addImage(buyerSignature, 'PNG', endX, signatureY, signatureWidth, 14);
    }
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(14);
    doc.setTextColor(...textColor);
    const buyerText = `${contract.buyer || '-'}`;
    const buyerTextWidth = doc.getTextWidth(buyerText);
    doc.text(buyerText, endX, signatureY + 16);
    doc.setLineWidth(0.3);
    doc.setDrawColor(...textColor);
    doc.line(endX, signatureY + 17, endX + buyerTextWidth, signatureY + 17);

    yPos = signatureY + 26;

    // Footer
    doc.setLineWidth(0.2);
    // Footer Background
    doc.setFillColor(6, 182, 212);
    doc.rect(0, yPos, 210, 18, 'F');
    doc.rect(0, yPos, 210, 14, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0);
    doc.text('Page 1 of 1', 198, yPos + 6, { align: 'right' });
    doc.text(
      `Generated on ${new Date().toLocaleString('en-US', {
        timeZone: 'Asia/Karachi',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })}`,
      12,
      yPos + 6
    );
    doc.text('Confidential - ZMS Textiles Ltd.', 105, yPos + 6, { align: 'center' });

    doc.save(`ZMS Sourcing Contract: (${contract.seller || '-'})-(${contract.buyer || '-'}).pdf`);
  },
};

export default ContractPDFExport;
