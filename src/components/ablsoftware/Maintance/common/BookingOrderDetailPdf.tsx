'use client';
import jsPDF from 'jspdf';
import type { ColumnKey, RowData } from '@/components/ablsoftware/Maintance/common/BookingOrderTypes';

// Company constants
const COMPANY_NAME = 'AL NASAR BASHEER LOGISTICS';
const COMPANY_ADDRESS = 'Suit No. 108, SP Chamber, Main Estate Avenue, SITE Karachi';
const COMPANY_PHONE = 'Phone: +92 21 32550917-18';
const LOGO_PATH = '/ABL-Logo.png';

// Layout constants
const MARGIN_LEFT = 30;
const MARGIN_RIGHT = 30;
const TABLE_START_Y = 135; // Moved down to accommodate header
const TABLE_BOTTOM_MARGIN = 50;
const CELL_PADDING = 4;

// Utility function to preload image as base64
const loadImage = async (path: string): Promise<string> => {
  try {
    const response = await fetch(path);
    if (!response.ok) throw new Error('Failed to fetch logo');
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.warn('Failed to load logo:', error);
    throw error;
  }
};

const formatDisplayDate = (d?: string): string => {
  if (!d) return '-';
  try {
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return d;
    const dd = String(dt.getDate()).padStart(2, '0');
    const mm = String(dt.getMonth() + 1).padStart(2, '0');
    const yyyy = dt.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  } catch {
    return d;
  }
};

const formatNumber = (v: any): string => {
  const num = typeof v === 'string' ? parseFloat(v) : v;
  return isNaN(num) || !isFinite(num)
    ? '0.00'
    : num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

// Calculate cell height with wrapped text
const getCellHeight = (text: string, width: number, doc: jsPDF, fontSize: number): number => {
  doc.setFontSize(fontSize);
  const wrapped = doc.splitTextToSize(String(text ?? ''), width - CELL_PADDING * 2);
  return wrapped.length * (fontSize + 2) + CELL_PADDING;
};

export const exportDetailBookingOrderToPDF = async (
  data: RowData[],
  selectedColumns: ColumnKey[],
  filterLine: string,
  colOrder: ColumnKey[],
  headRows: any[][],
  startDate?: string,
  endDate?: string,
) => {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'A4' });

  // Page dimensions
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  let yPosition = TABLE_START_Y;
  let groupStartY = yPosition;
  let isInGroup = false;

  // Header (only on first page)
  const addHeader = async (pageNum: number) => {
    if (pageNum === 1) {
      doc.setFillColor(235, 235, 235);
      doc.rect(0, 0, pageWidth, 85, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.setTextColor(20, 40, 80);
      doc.text(COMPANY_NAME, MARGIN_LEFT, 35);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(60, 60, 60);
      doc.text(COMPANY_ADDRESS, MARGIN_LEFT, 50);
      doc.text(COMPANY_PHONE, MARGIN_LEFT, 62);

      try {
        const logoData = await loadImage(LOGO_PATH);
        doc.addImage(logoData, 'PNG', pageWidth - 80, 15, 50, 50);
      } catch {
        doc.setFontSize(9);
        doc.setTextColor(80, 80, 80);
        doc.text('[ABL Logo]', pageWidth - 40, 50, { align: 'right' });
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(15);
      doc.setTextColor(0, 0, 0);
      doc.text('DETAILED BOOKING ORDER REPORT', pageWidth / 2, 105, { align: 'center' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(60, 60, 60);
      const startText = `From: ${startDate ? formatDisplayDate(startDate) : '-'}`;
      const toText = `To: ${endDate ? formatDisplayDate(endDate) : '-'}`;
      const nowText = `Generated: ${formatDisplayDate(new Date().toISOString())} ${new Date().toLocaleTimeString('en-US', { timeZone: 'Asia/Karachi', hour12: true })}`;
      doc.text(startText, MARGIN_LEFT, 120, { align: 'left' });
      doc.text(toText, pageWidth / 2, 120, { align: 'center' });
      doc.text(nowText, pageWidth - MARGIN_RIGHT, 120, { align: 'right' });
    }
  };

  // Table header config
  const defaultTableHeader: { key: ColumnKey; label: string; width: number }[] = [
    { key: 'serial', label: 'S.No', width: 28 },
    { key: 'orderNo', label: 'Order No', width: 72 },
    { key: 'orderDate', label: 'Order Date', width: 62 },
    { key: 'vehicleNo', label: 'Vehicle No', width: 62 },
    { key: 'bookingAmount', label: 'Freight', width: 68 },
    { key: 'biltyNo', label: 'Bilty No', width: 62 },
    { key: 'biltyAmount', label: 'Bilty Amount', width: 68 },
    { key: 'consignor', label: 'Consignor', width: 100 },
    { key: 'consignee', label: 'Consignee', width: 100 },
    { key: 'article', label: 'Article', width: 100 },
    { key: 'qty', label: 'Qty', width: 58 },
  ];

  // Filter and order columns based on selectedColumns and colOrder
  const tableHeader = colOrder
    .filter((key) => selectedColumns.includes(key))
    .map((key) => defaultTableHeader.find((header) => header.key === key))
    .filter((header): header is NonNullable<typeof header> => !!header);

  // Calculate total table width
  const totalTableWidth = tableHeader.reduce((sum, header) => sum + header.width, 0);

  // Add table header
  const addTableHeader = () => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    
    // Calculate max height for header with word wrapping support
    let maxHeaderHeight = 22;
    tableHeader.forEach((header) => {
      const h = getCellHeight(header.label, header.width, doc, 8.5);
      if (h > maxHeaderHeight) maxHeaderHeight = h;
    });

    doc.setFillColor(210, 210, 210);
    doc.rect(MARGIN_LEFT, yPosition, totalTableWidth, maxHeaderHeight, 'F');
    doc.setTextColor(20, 20, 20);
    let xPosition = MARGIN_LEFT;
    tableHeader.forEach((header) => {
      const wrapped = doc.splitTextToSize(header.label, header.width - CELL_PADDING * 2);
      // Center header text vertically
      const textY = yPosition + (maxHeaderHeight / 2) - ((wrapped.length * 10) / 2) + 8;
      doc.text(wrapped, xPosition + CELL_PADDING, textY);
      doc.setLineWidth(0.5);
      doc.setDrawColor(80, 80, 80);
      doc.rect(xPosition, yPosition, header.width, maxHeaderHeight);
      xPosition += header.width;
    });
    yPosition += maxHeaderHeight;
  };

  const drawGroupSideBorders = (startY: number, endY: number) => {
    doc.setDrawColor(60, 60, 60);
    doc.setLineWidth(0.8);
    doc.line(MARGIN_LEFT, startY, MARGIN_LEFT, endY);
    doc.line(MARGIN_LEFT + totalTableWidth, startY, MARGIN_LEFT + totalTableWidth, endY);
  };

  // Footer
  const addFooter = (pageNum: number, totalPages: number) => {
    const footerY = pageHeight - 30;
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(
      `Generated on: ${new Date().toLocaleString('en-US', { timeZone: 'Asia/Karachi' })}`,
      MARGIN_LEFT,
      footerY
    );
    doc.text(`Page ${pageNum} of ${totalPages}`, pageWidth - MARGIN_RIGHT, footerY, { align: 'right' });
    
    doc.setDrawColor(180, 180, 180);
    doc.setLineWidth(0.5);
    doc.line(MARGIN_LEFT, footerY - 8, pageWidth - MARGIN_RIGHT, footerY - 8);
  };

  // Page break check
  const checkPageBreak = async (rowHeight = 18) => {
    if (yPosition + rowHeight > pageHeight - TABLE_BOTTOM_MARGIN) {
      if (isInGroup) {
        drawGroupSideBorders(groupStartY, yPosition);
        doc.line(MARGIN_LEFT, yPosition, MARGIN_LEFT + totalTableWidth, yPosition);
      }
      doc.addPage();
      yPosition = 40; // New page start y
      addTableHeader();
      if (isInGroup) {
        groupStartY = yPosition;
        doc.line(MARGIN_LEFT, yPosition, MARGIN_LEFT + totalTableWidth, yPosition);
      }
    }
  };

  // Initialize first page
  await addHeader(1);
  addTableHeader();

  // Group data
  const groupedData: { order: RowData; consignments: RowData[] }[] = [];
  let currentGroup: { order: RowData; consignments: RowData[] } | null = null;
  data.forEach((row) => {
    if (row.isOrderRow) {
      if (currentGroup) groupedData.push(currentGroup);
      currentGroup = { order: row, consignments: [] };
    } else if (currentGroup) {
      currentGroup.consignments.push(row);
    }
  });
  if (currentGroup) groupedData.push(currentGroup);

  // Totals
  const totalFreight = data.reduce((acc, row) => acc + (row.isOrderRow ? row.bookingAmount || 0 : 0), 0);
  const totalBiltyAmount = data.reduce((acc, row) => acc + (row.isOrderRow ? 0 : row.biltyAmount || 0), 0);

  // Render groups
  for (const group of groupedData) {
    const groupHeaderHeight = 18;
    await checkPageBreak(groupHeaderHeight + 20);

    // Start of group
    isInGroup = true;
    groupStartY = yPosition;
    doc.setDrawColor(60, 60, 60);
    doc.setLineWidth(0.8);
    doc.line(MARGIN_LEFT, yPosition, MARGIN_LEFT + totalTableWidth, yPosition);

    // Group header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(0, 0, 0);
    const groupText = `${group.order.departure || '-'} to ${group.order.destination || '-'}`;
    const vendorText = group.order.vendor || '-';
    doc.text(groupText, MARGIN_LEFT + 2, yPosition + 13);
    doc.text(vendorText, MARGIN_LEFT + totalTableWidth - 2, yPosition + 13, { align: 'right' });
    yPosition += groupHeaderHeight;

    // Order row
    const orderFields = tableHeader.map((header) => {
      if (header.key === 'orderDate') return formatDisplayDate(group.order.orderDate);
      if (header.key === 'bookingAmount') return formatNumber(group.order.bookingAmount);
      if (header.key === 'biltyAmount') return '';
      return String(group.order[header.key] ?? '');
    });

    let orderRowHeight = 18;
    orderFields.forEach((field, idx) => {
      const h = getCellHeight(String(field ?? ''), tableHeader[idx].width, doc, 9);
      if (h > orderRowHeight) orderRowHeight = h;
    });

    await checkPageBreak(orderRowHeight);

    doc.setFillColor(245, 245, 245);
    doc.rect(MARGIN_LEFT, yPosition, totalTableWidth, orderRowHeight, 'F');

    let xPosition = MARGIN_LEFT;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(30, 30, 30);
    orderFields.forEach((field, idx) => {
      const wrapped = doc.splitTextToSize(String(field ?? ''), tableHeader[idx].width - CELL_PADDING * 2);
      doc.text(wrapped, xPosition + CELL_PADDING, yPosition + 12);
      doc.setLineWidth(0.4);
      doc.setDrawColor(120, 120, 120);
      doc.rect(xPosition, yPosition, tableHeader[idx].width, orderRowHeight);
      xPosition += tableHeader[idx].width;
    });
    yPosition += orderRowHeight;

    // Consignment rows
    for (const row of group.consignments) {
      const consignmentFields = tableHeader.map((header, idx) => {
        if (idx < 5 && header.key !== 'biltyNo' && header.key !== 'biltyAmount') return '';
        if (header.key === 'biltyAmount') return formatNumber(row.biltyAmount ?? 0);
        return String(row[header.key] ?? '');
      });

      let consRowHeight = 18;
      consignmentFields.forEach((field, idx) => {
        const h = getCellHeight(String(field ?? ''), tableHeader[idx].width, doc, 8.5);
        if (h > consRowHeight) consRowHeight = h;
      });

      await checkPageBreak(consRowHeight);

      let xcPos = MARGIN_LEFT;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(60, 60, 60);
      consignmentFields.forEach((field, idx) => {
        const wrapped = doc.splitTextToSize(String(field ?? ''), tableHeader[idx].width - CELL_PADDING * 2);
        doc.text(wrapped, xcPos + CELL_PADDING, yPosition + 12);
        
        if (['biltyNo', 'biltyAmount', 'consignor', 'consignee', 'article', 'qty'].includes(tableHeader[idx].key)) {
          doc.setLineWidth(0.3);
          doc.setDrawColor(140, 140, 140);
          doc.rect(xcPos, yPosition, tableHeader[idx].width, consRowHeight);
        }
        xcPos += tableHeader[idx].width;
      });
      yPosition += consRowHeight;
    }

    // End of group
    drawGroupSideBorders(groupStartY, yPosition);
    doc.line(MARGIN_LEFT, yPosition, MARGIN_LEFT + totalTableWidth, yPosition);
    isInGroup = false;
    yPosition += 8;
  }

  // Grand Totals row
  const totalRowHeight = 22;
  await checkPageBreak(totalRowHeight);
  
  doc.setFillColor(200, 220, 240);
  doc.rect(MARGIN_LEFT, yPosition, totalTableWidth, totalRowHeight, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(20, 60, 120);
  
  let totalX = MARGIN_LEFT;
  tableHeader.forEach((header) => {
    let val = '';
    if (header.key === 'serial') val = 'GRAND TOTAL';
    if (header.key === 'bookingAmount') val = formatNumber(totalFreight);
    if (header.key === 'biltyAmount') val = formatNumber(totalBiltyAmount);
    
    if (val) {
      doc.text(val, totalX + CELL_PADDING, yPosition + 15);
    }
    doc.setLineWidth(0.6);
    doc.setDrawColor(80, 80, 80);
    doc.rect(totalX, yPosition, header.width, totalRowHeight);
    totalX += header.width;
  });

  // Finalize all footers
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addFooter(i, totalPages);
  }

  // Save PDF
  const filename = `${COMPANY_NAME.replace(/\s+/g, '_')}_Detailed_Booking_Report.pdf`;
  doc.save(filename);
};
