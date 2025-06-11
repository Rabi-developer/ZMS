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

  // Load ZMS logo (assumes logo is in public/ZMS-logo.png)
  const ZMS_LOGO = '/ZMS-logo.png';
  let GetSellerAddress = '';
  let GetBuyerAddress = '';

  // Style constants
  const styles = {
    label: { size: 10, color: [6, 182, 212] as [number, number, number] },
    value: { size: 10, color: [33, 33, 33] as [number, number, number] },
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

      // Debug data
      console.log('Buyer Delivery Breakups:', JSON.stringify(buyerDeliveryBreakups, null, 2));
      console.log('Seller Delivery Breakups:', JSON.stringify(sellerDeliveryBreakups, null, 2));
      console.log('Contract:', JSON.stringify(contract, null, 2));

      // Fetch subDescriptions for all relevant fields
      let descriptionSub = '-';
      let blendRatioSub = '-';
      let warpYarnTypeSub = '-';
      let weftYarnTypeSub = '-';
      let weavesSub = '-';
      let pickInsertionSub = '-';
      let selvedgeSub = '-';

      try {
        // Fetch Seller and Buyer Addresses
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

        // Fetch Description subDescription
        const descriptionData = await getAllDescriptions();
        const descriptionMatch = descriptionData.data.find(
          (item: { descriptions: string; subDescription: string }) => item.descriptions === contract.description
        );
        descriptionSub = descriptionMatch ? descriptionMatch.subDescription : '-';

        // Fetch BlendRatio subDescription
        const blendRatioData = await getAllBlendRatios();
        const blendRatioMatch = blendRatioData.data.find(
          (item: { descriptions: string; subDescription: string }) => item.descriptions === contract.blendRatio
        );
        blendRatioSub = blendRatioMatch ? blendRatioMatch.subDescription : '-';

        // Fetch WarpYarnType subDescription
        const warpYarnData = await getAllWrapYarnTypes();
        const warpYarnMatch = warpYarnData.data.find(
          (item: { descriptions: string; subDescription: string }) => item.descriptions === contract.warpYarnType
        );
        warpYarnTypeSub = warpYarnMatch ? warpYarnMatch.subDescription : '-';

        // Fetch WeftYarnType subDescription
        const weftYarnData = await getAllWeftYarnType();
        const weftYarnMatch = weftYarnData.data.find(
          (item: { descriptions: string; subDescription: string }) => item.descriptions === contract.weftYarnType
        );
        weftYarnTypeSub = weftYarnMatch ? weftYarnMatch.subDescription : '-';

        // Fetch Weaves subDescription
        const weavesData = await getAllWeaves();
        const weavesMatch = weavesData.data.find(
          (item: { descriptions: string; subDescription: string }) => item.descriptions === contract.weaves
        );
        weavesSub = weavesMatch ? weavesMatch.subDescription : '-';

        // Fetch PickInsertion subDescription
        const pickInsertionData = await getAllPickInsertions();
        const pickInsertionMatch = pickInsertionData.data.find(
          (item: { descriptions: string; subDescription: string }) => item.descriptions === contract.pickInsertion
        );
        pickInsertionSub = pickInsertionMatch ? pickInsertionMatch.subDescription : '-';

        // Fetch Selvedge subDescription
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

      // Function to check for page overflow and add new page if needed
      const checkPageOverflow = (currentY: number, additionalHeight: number): number => {
        const pageHeight = 270; // A4 page height in mm (297mm - 10mm top margin - 17mm footer)
        if (currentY + additionalHeight > pageHeight) {
          doc.addPage();
          return 10; // Reset to top of new page
        }
        return currentY;
      };

      // Header Background
      doc.setFillColor(6, 182, 212);
      doc.rect(0, 0, 210, 32, 'F');

      // Header
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.setTextColor(255, 255, 255);
      doc.text('ZM SOURCING', 105, 12, { align: 'center' });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(255, 255, 255);
      doc.text('Suit No. 108, SP Chamber, Main Estate Avenue,', 105, 18, { align: 'center' });
      doc.text('SITE Karachi', 105, 22, { align: 'center' });
      doc.text('Phone: +92 21 32550917-18', 105, 26, { align: 'center' });

      // Logo
      try {
        doc.addImage(ZMS_LOGO, 'PNG', 10, 6, 24, 18);
      } catch (error) {
        console.error('Failed to load logo:', error);
        doc.setFontSize(10);
        doc.setTextColor(255, 255, 255);
        doc.text('[ZMS Logo]', 10, 18);
      }

      // Subheading: ZMS/ContractNo/Month/Year (Left-aligned, below Purchase Contract)
      let yPos = 42;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(33, 33, 33);
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
      doc.setFontSize(14);
      doc.setTextColor(6, 182, 212);
      doc.text('Purchase Contract', 105, yPos, { align: 'center' });

      yPos = 42;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(33, 33, 33);
      doc.text(`Date: ${contract.date || '-'}`, 200, yPos, { align: 'right' });
      yPos += 15;

      const leftColX = 10;
      const rightColX = 110;
      const labelStyle = { font: 'helvetica' as const, style: 'bold' as const, size: 9, color: [6, 182, 212] as [number, number, number] };
      const valueStyle = { font: 'helvetica' as const, style: 'normal' as const, size: 9, color: [33, 33, 33] as [number, number, number] };

      // Seller Info
      const sellerBoxY = yPos - 5;
      const sellerBoxHeight = 20; // Increased to accommodate wrapped text
      doc.setLineWidth(0.4);
      doc.setDrawColor(33, 33, 33);
      doc.rect(leftColX - 2, sellerBoxY, 90, sellerBoxHeight, 'S');

      doc.setFont(labelStyle.font, labelStyle.style);
      doc.setFontSize(labelStyle.size);
      doc.setTextColor(...labelStyle.color);
      doc.text('Seller:', leftColX, yPos);
      doc.setFont(valueStyle.font, valueStyle.style);
      doc.setFontSize(valueStyle.size);
      doc.setTextColor(...valueStyle.color);
      let sellerName = contract.seller || '-';
      let sellerAddressText = GetSellerAddress || '';
      const maxSellerWidth = 80;

      // Wrap sellerName
      const wrappedSellerName = doc.splitTextToSize(sellerName, maxSellerWidth);
      wrappedSellerName.forEach((line: string, i: number) => {
        doc.text(line, leftColX + doc.getTextWidth('Seller:') + 6, yPos + (i * 6));
      });

      // Wrap sellerAddressText
      const wrappedSellerAddress = doc.splitTextToSize(sellerAddressText, maxSellerWidth);
      wrappedSellerAddress.forEach((line: string, i: number) => {
        doc.text(line, leftColX + doc.getTextWidth('Seller:') + 6, yPos + 6 + (i * 6));
      });

      // Buyer Info
      const buyerBoxY = yPos - 5;
      const buyerBoxHeight = 20; // Increased to accommodate wrapped text
      doc.setLineWidth(0.4);
      doc.setDrawColor(33, 33, 33);
      doc.rect(rightColX - 2, buyerBoxY, 90, buyerBoxHeight, 'S');

      doc.setFont(labelStyle.font, labelStyle.style);
      doc.setFontSize(labelStyle.size);
      doc.setTextColor(...labelStyle.color);
      doc.text('Buyer:', rightColX, yPos);
      doc.setFont(valueStyle.font, valueStyle.style);
      doc.setFontSize(valueStyle.size);
      doc.setTextColor(...valueStyle.color);
      let buyerName = contract.buyer || '-';
      let buyerAddressText = GetBuyerAddress || '';
      const maxBuyerWidth = 75;

      // Wrap buyerName
      const wrappedBuyerName = doc.splitTextToSize(buyerName, maxBuyerWidth);
      wrappedBuyerName.forEach((line: string, i: number) => {
        doc.text(line, rightColX + doc.getTextWidth('Buyer:') + 6, yPos + (i * 6));
      });

      // Wrap buyerAddressText
      const wrappedBuyerAddress = doc.splitTextToSize(buyerAddressText, maxBuyerWidth);
      wrappedBuyerAddress.forEach((line: string, i: number) => {
        doc.text(line, rightColX + doc.getTextWidth('Buyer:') + 6, yPos + 6 + (i * 6));
      });

      yPos += Math.max(wrappedSellerName.length, wrappedSellerAddress.length, wrappedBuyerName.length, wrappedBuyerAddress.length) * 6 + 15;
      yPos = checkPageOverflow(yPos, 0);

      const fields = [
        { label: 'Description:', value: `${contract.description || '-'} ${contract.stuff}` },
        { label: 'Blend Ratio:', value: `${contract.blendRatio || '-'}, ` },
        {
          label: 'Construction:',
          value: `${contract.warpCount || '-'} ${contract.warpYarnType || '-'} ${warpYarnTypeSub} × ${contract.weftCount || '-'} ${contract.weftYarnType || '-'} ${weftYarnTypeSub} / ${contract.noOfEnds || '-'} × ${contract.noOfPicks || '-'} ${contract.weaves || '-'} ${contract.pickInsertion || '-'} ${contract.width || '-'} ${contract.final || '-'} ${contract.selvege || '-'}`,
        },
      ];

      doc.setFont(labelStyle.font, labelStyle.style);
      doc.setFontSize(labelStyle.size);
      const maxLabelWidth = Math.max(...fields.map(field => doc.getTextWidth(field.label)));

      fields.forEach((field) => {
        const maxWidth = 190;
        const wrappedText = doc.splitTextToSize(field.value, maxWidth);

        yPos = checkPageOverflow(yPos, wrappedText.length * 6);

        doc.setFont(labelStyle.font, labelStyle.style);
        doc.setFontSize(labelStyle.size);
        doc.setTextColor(...labelStyle.color);
        doc.text(field.label, leftColX, yPos);

        doc.setFont(valueStyle.font, valueStyle.style);
        doc.setFontSize(valueStyle.size);
        doc.setTextColor(...valueStyle.color);
        wrappedText.forEach((line: string, i: number) => {
          doc.text(line, leftColX + maxLabelWidth + 6, yPos + (i * 6));
        });

        yPos += wrappedText.length * 6;
      });

      yPos = checkPageOverflow(yPos, 10);

      // Financial Table
      autoTable(doc, {
        startY: yPos,
        head: [['Sel.Length', 'Selvege Weaves', 'Selvege Thickness', 'Ind.Thread', 'GSM']],
        body: [
          [
            contract.selvegeWidth || '-',
            contract.selvegeWeaves || '-',
            contract.selvegeThickness || '',
            contract.inductionThread || '-',
            contract.gsm || '-',
          ],
        ],
        styles: { fontSize: 10, cellPadding: 2, lineColor: [200, 200, 200], lineWidth: 0.3 },
        headStyles: { fillColor: [6, 182, 212], textColor: [255, 255, 255], fontSize: 10, cellPadding: 2, lineWidth: 0.3 },
        columnStyles: {
          0: { cellWidth: 38 },
          1: { cellWidth: 38 },
          2: { cellWidth: 38 },
          3: { cellWidth: 38 },
          4: { cellWidth: 38 },
        },
        margin: { left: 10, right: 10 },
        theme: 'grid',
      });

      yPos = (doc as any).lastAutoTable.finalY + 10;
      yPos = checkPageOverflow(yPos, 0);
      console.log('yPos before two-column layout:', yPos);

      // Two-Column Layout: Additional Fields (Left) and Delivery Breakups (Right)
      const leftColumnX = 10;
      const rightColumnX = 105;
      const leftColumnWidth = 90;
      const rightColumnWidth = 90;
      let leftColumnYPos = yPos;
      let rightColumnYPos = yPos;

      // Left Column: Additional Fields
      const additionalFields = [
        { label: 'Quantity:', value: `Rs. ${formatCurrency(contract.quantity)} Meter(+-${contract.tolerance || '-'})` },
        { label: 'Rate:', value: `Rs. ${formatCurrency(contract.rate)} / Meter + ${contract.gst || '-'} ${contract.deliveryTerms || '-'}` },
        { label: 'Piece Length:', value: contract.pieceLength || '-' },
        { label: 'Delivery:', value: contract.deliveryDate || '-' },
        { label: 'Payment Term:', value: `${contract.paymentTermsBuyer|| '-'}` },
        { label: 'Packing:', value: `${contract.packing || '-'} Packing` },
        { label: 'Fabric Value:', value: `Rs. ${formatCurrency(contract.fabricValue)}` },
        { label: 'GST:', value: `${contract.gst || '-'}` },
        { label: 'GST Value:', value: `Rs. ${formatCurrency(contract.gstValue)}` },
        { label: 'Total Amount:', value: `Rs. ${formatCurrency(contract.totalAmount)}` },
        { label: 'Commission:', value: `${contract.commissionPercentage || '-'}%` },
        { label: 'Commission Value:', value: `Rs. ${formatCurrency(contract.commissionValue)}` },
        { label: 'Dispatch Add:', value: `${contract.dispatchAddress || 'Adviced Later'}` },
        { label: 'Remarks:', value: `Seller: ${contract.sellerRemark || ''} | Buyer: ${contract.buyerRemark || ''}` },
      ];

      doc.setFont(labelStyle.font, labelStyle.style);
      doc.setFontSize(labelStyle.size);
      const maxAdditionalLabelWidth = Math.max(...additionalFields.map(field => doc.getTextWidth(field.label)));

      additionalFields.forEach((field, index) => {
        const maxWidth = leftColumnWidth - maxAdditionalLabelWidth - 6;
        const wrappedText = doc.splitTextToSize(field.value, maxWidth);

        leftColumnYPos = checkPageOverflow(leftColumnYPos, wrappedText.length * 6);

        doc.setFont(labelStyle.font, labelStyle.style);
        doc.setFontSize(labelStyle.size);
        doc.setTextColor(...labelStyle.color);
        doc.text(field.label, leftColumnX, leftColumnYPos);

        doc.setFont(valueStyle.font, valueStyle.style);
        doc.setFontSize(valueStyle.size);
        doc.setTextColor(...valueStyle.color);
        wrappedText.forEach((line: string, i: number) => {
          doc.text(line, leftColumnX + maxAdditionalLabelWidth + 6, leftColumnYPos + (i * 6));
        });

        leftColumnYPos += wrappedText.length * 6;
        console.log(`Field ${index + 1} rendered at y=${leftColumnYPos}`);
      });

      // Right Column: Buyer Delivery Breakups Table
      console.log('Rendering Buyer Delivery Breakups table...');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(...labelStyle.color);
      doc.text('Buyer Delivery Breakups', rightColumnX, rightColumnYPos);
      rightColumnYPos += 6;

      if (Array.isArray(buyerDeliveryBreakups) && buyerDeliveryBreakups.length > 0) {
        autoTable(doc, {
          startY: rightColumnYPos,
          head: [['Qty', 'Del. Date']],
          body: buyerDeliveryBreakups.slice(0, 5).map(breakup => [
            breakup.Qty?.toString() || '-',
            breakup.DeliveryDate?.toString() || '-',
          ]),
          styles: { fontSize: 10, cellPadding: 2, lineColor: [200, 200, 200], lineWidth: 0.3 },
          headStyles: { fillColor: [6, 182, 212], textColor: [255, 255, 255], fontSize: 10, cellPadding: 2, lineWidth: 0.3 },
          columnStyles: {
            0: { cellWidth: 35 },
            1: { cellWidth: 55 },
          },
          margin: { left: rightColumnX, right: 10 },
          theme: 'grid',
          didDrawCell: () => console.log('Buyer table cell rendered'),
        });

        rightColumnYPos = (doc as any).lastAutoTable.finalY + 6;
        console.log('Buyer table rendered at y=', rightColumnYPos);
        if (buyerDeliveryBreakups.length > 5) {
          rightColumnYPos = checkPageOverflow(rightColumnYPos, 6);
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(9);
          doc.setTextColor(100, 100, 100);
          doc.text('... (more rows)', rightColumnX, rightColumnYPos);
          rightColumnYPos += 6;
        }
      } else {
        console.log('No valid Buyer Delivery Breakups data');
        rightColumnYPos = checkPageOverflow(rightColumnYPos, 8);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        doc.text('No Buyer Breakups', rightColumnX, rightColumnYPos);
        rightColumnYPos += 8;
      }

      // Right Column: Seller Delivery Breakups Table
      console.log('Rendering Seller Delivery Breakups table...');
      rightColumnYPos = checkPageOverflow(rightColumnYPos, 6);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(...labelStyle.color);
      doc.text('Seller Delivery Breakups', rightColumnX, rightColumnYPos);
      rightColumnYPos += 6;

      if (Array.isArray(sellerDeliveryBreakups) && sellerDeliveryBreakups.length > 0) {
        autoTable(doc, {
          startY: rightColumnYPos,
          head: [['Qty', 'Del. Date']],
          body: sellerDeliveryBreakups.slice(0, 5).map(breakup => [
            breakup.Qty?.toString() || '-',
            breakup.DeliveryDate?.toString() || '-',
          ]),
          styles: { fontSize: 10, cellPadding: 2, lineColor: [200, 200, 200], lineWidth: 0.3 },
          headStyles: { fillColor: [6, 182, 212], textColor: [255, 255, 255], fontSize: 10, cellPadding: 2, lineWidth: 0.3 },
          columnStyles: {
            0: { cellWidth: 35 },
            1: { cellWidth: 55 },
          },
          margin: { left: rightColumnX, right: 10 },
          theme: 'grid',
          didDrawCell: () => console.log('Seller table cell rendered'),
        });

        rightColumnYPos = (doc as any).lastAutoTable.finalY + 6;
        console.log('Seller table rendered at y=', rightColumnYPos);
        if (sellerDeliveryBreakups.length > 5) {
          rightColumnYPos = checkPageOverflow(rightColumnYPos, 6);
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(9);
          doc.setTextColor(100, 100, 100);
          doc.text('... (more rows)', rightColumnX, rightColumnYPos);
          rightColumnYPos += 6;
        }
      } else {
        console.log('No valid Seller Delivery Breakups data');
        rightColumnYPos = checkPageOverflow(rightColumnYPos, 8);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        doc.text('No Seller Breakups', rightColumnX, rightColumnYPos);
        rightColumnYPos += 8;
      }

      yPos = Math.max(leftColumnYPos, rightColumnYPos) + 10;
      yPos = checkPageOverflow(yPos, 1);

      // Separator Line
      doc.setLineWidth(0.3);
      doc.setDrawColor(200, 200, 200);
      doc.line(10, yPos, 200, yPos);
      yPos += 1;

      // Terms and Conditions Table
      yPos = checkPageOverflow(yPos, 20);
      autoTable(doc, {
        startY: yPos,
        body: [
          ['01', 'Please courier first 5mm fabric as production sample'],
          ['02', 'Bales and rolls are clearly marked with article name, blend ratio & total meters packed'],
        ],
        theme: 'plain',
        styles: {
          font: 'helvetica',
          fontSize: 10,
          cellPadding: { top: 3, bottom: 3, left: 4, right: 10 },
          textColor: [0, 0, 0],
          lineWidth: 0,
          halign: 'left',
        },
        columnStyles: {
          0: { cellWidth: 20, fontStyle: 'bold' },
          1: { cellWidth: 170 },
        },
        margin: { left: 10, right: 10 },
        didDrawCell: (data) => {
          if (data.section === 'body' && data.row.index === 0) {
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(11);
            doc.setTextColor(...labelStyle.color);
            doc.text('Terms and Conditions', 10, data.cell.y - 4);
          }
        },
      });

      yPos = (doc as any).lastAutoTable.finalY + 9;
      yPos = checkPageOverflow(yPos, 24);

      // Signatures
      const signatureY = yPos;
      const signatureWidth = 55;
      const startX = 10;
      const centerX = 105 - signatureWidth / 2;
      const endX = 200 - signatureWidth;
      const labelColor: [number, number, number] = [0, 0, 0];
      const textColor: [number, number, number] = [0, 0, 0];

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(...labelColor);
      if (zmsSignature) {
        doc.addImage(zmsSignature, 'PNG', startX, signatureY + 2, signatureWidth, 14);
      }
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(12);
      doc.setTextColor(...textColor);
      const zmsText = 'Z.M. Sourcing';
      const zmsTextWidth = doc.getTextWidth(zmsText);
      doc.text(zmsText, startX, signatureY + 18);
      doc.setLineWidth(0.4);
      doc.setDrawColor(...textColor);
      doc.line(startX, signatureY + 19, startX + zmsTextWidth, signatureY + 19);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(...labelColor);
      if (sellerSignature) {
        doc.addImage(sellerSignature, 'PNG', centerX, signatureY + 2, signatureWidth, 14);
      }
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(12);
      doc.setTextColor(...textColor);
      const sellerText = `${contract.seller || '-'}`;
      const sellerTextWidth = doc.getTextWidth(sellerText);
      doc.text(sellerText, centerX, signatureY + 18);
      doc.setLineWidth(0.4);
      doc.setDrawColor(...textColor);
      doc.line(centerX, signatureY + 19, centerX + sellerTextWidth, signatureY + 19);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(...labelColor);
      if (buyerSignature) {
        doc.addImage(buyerSignature, 'PNG', endX, signatureY + 2, signatureWidth, 14);
      }
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(12);
      doc.setTextColor(...textColor);
      const buyerText = `${contract.buyer || '-'}`;
      const buyerTextWidth = doc.getTextWidth(buyerText);
      doc.text(buyerText, endX, signatureY + 18);
      doc.setLineWidth(0.4);
      doc.setDrawColor(...textColor);
      doc.line(endX, signatureY + 19, endX + buyerTextWidth, signatureY + 19);

      yPos = signatureY + 24;
      yPos = checkPageOverflow(yPos, 18);

      // Footer Divider Line
      doc.setLineWidth(0.3);
      doc.setDrawColor(200, 200, 200);
      doc.line(10, yPos, 200, yPos);

      // Footer Background
      doc.setFillColor(6, 182, 212);
      doc.rect(0, yPos, 210, 18, 'F');

      // Footer
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(255, 255, 255);
      doc.text('Page 1 of 1', 200, yPos + 5, { align: 'right' });
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
        10,
        yPos + 5
      );
      doc.text('Confidential - ZMS Textiles Ltd.', 105, yPos + 5, { align: 'center' });

      doc.save(`ZMS Sourcing Contract: (${contract.seller || '-'})-(${contract.buyer || '-'}).pdf`);
    },
  };

  export default ContractPDFExport;