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
const TABLE_START_Y = 50;
const TABLE_BOTTOM_MARGIN = 50;
const LINE_HEIGHT = 8;
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

  // Header (only on first page)
  const addHeader = async (pageNum: number) => {
    if (pageNum === 1) {
      doc.setFillColor(200, 200, 200);
      doc.rect(0, 0, pageWidth, 80, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(0, 0, 0);
      doc.text(COMPANY_NAME, MARGIN_LEFT, 30);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(60, 60, 60);
      doc.text(COMPANY_ADDRESS, MARGIN_LEFT, 45);
      doc.text(COMPANY_PHONE, MARGIN_LEFT, 55);

      try {
        const logoData = await loadImage(LOGO_PATH);
        doc.addImage(logoData, 'PNG', pageWidth - 70, 15, 50, 35);
      } catch {
        doc.setFontSize(9);
        doc.setTextColor(80, 80, 80);
        doc.text('[ABL Logo]', pageWidth - 40, 50, { align: 'right' });
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text('DETAILED BOOKING ORDER REPORT', pageWidth / 2, 100, { align: 'center' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(60, 60, 60);
      const startText = `From: ${startDate ? formatDisplayDate(startDate) : '-'}`;
      const toText = `To: ${endDate ? formatDisplayDate(endDate) : '-'}`;
      const nowText = `Generated: ${formatDisplayDate(new Date().toISOString())} ${new Date().toLocaleTimeString('en-US', { timeZone: 'Asia/Karachi', hour12: true })}`;
      doc.text(startText, MARGIN_LEFT, 110, { align: 'left' });
      doc.text(toText, pageWidth / 2, 110, { align: 'center' });
      doc.text(nowText, pageWidth - MARGIN_RIGHT, 110, { align: 'right' });
    }
  };

  // Table header config
  const defaultTableHeader: { key: ColumnKey; label: string; width: number }[] = [
    { key: 'serial', label: 'S.No', width: 30 },
    { key: 'orderNo', label: 'Order No', width: 75 },
    { key: 'orderDate', label: 'Order Date', width: 60 },
    { key: 'vehicleNo', label: 'Vehicle No', width: 60 },
    { key: 'bookingAmount', label: 'Freight', width: 70 },
    { key: 'biltyNo', label: 'Bilty No', width: 60 },
    { key: 'consignmentFreight', label: 'Bilty Amount', width: 60 },
    { key: 'consignor', label: 'Consignor', width: 120 },
    { key: 'consignee', label: 'Consignee', width: 120 },
    { key: 'article', label: 'Article', width: 120 },
    { key: 'qty', label: 'Qty', width: 80 },
  ];

  // Filter and order columns based on selectedColumns and colOrder
  const tableHeader = colOrder
    .filter((key) => selectedColumns.includes(key))
    .map((key) => defaultTableHeader.find((header) => header.key === key))
    .filter((header): header is NonNullable<typeof header> => !!header);

  // Calculate total table width for consistent borders
  const totalTableWidth = tableHeader.reduce((sum, header) => sum + header.width, 0);

  // Add table header
  const addTableHeader = () => {
    doc.setFillColor(200, 200, 200);
    doc.rect(MARGIN_LEFT, yPosition, totalTableWidth, 18, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(20, 20, 20);
    let xPosition = MARGIN_LEFT;
    tableHeader.forEach((header) => {
      doc.text(header.label, xPosition + CELL_PADDING, yPosition + 14, { maxWidth: header.width - CELL_PADDING * 2 });
      doc.setLineWidth(0.4);
      doc.setDrawColor(100, 100, 100);
      doc.rect(xPosition, yPosition, header.width, 18);
      xPosition += header.width;
    });
    yPosition += 20;
  };

  // Page break check
  const checkPageBreak = async (rowHeight = 16) => {
    if (yPosition + rowHeight > pageHeight - TABLE_BOTTOM_MARGIN) {
      await addFooter(doc.getNumberOfPages());
      doc.addPage();
      yPosition = TABLE_START_Y;
      await addHeader(doc.getNumberOfPages());
      addTableHeader();
    }
  };

  // Footer
  const addFooter = (pageNum: number) => {
    const footerY = pageHeight - 40;
    doc.setFillColor(230, 230, 230);
    doc.rect(0, footerY - 10, pageWidth, 50, 'F');

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(80, 80, 80);
    doc.text(
      `Generated on: ${new Date().toLocaleString('en-US', { timeZone: 'Asia/Karachi' })}`,
      MARGIN_LEFT,
      footerY
    );
    doc.text(`Page ${pageNum} of ${doc.getNumberOfPages()}`, pageWidth - MARGIN_RIGHT, footerY, { align: 'right' });

    doc.setDrawColor(150, 150, 150);
    doc.setLineWidth(0.3);
    doc.line(MARGIN_LEFT, footerY - 10, pageWidth - MARGIN_RIGHT, footerY - 10);
  };

  // Initialize first page
  let yPosition = TABLE_START_Y;
  await addHeader(1);
  yPosition += 80; // Extra space for first-page header
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
  const totalBiltyAmount = data.reduce((acc, row) => acc + (row.isOrderRow ? 0 : row.consignmentFreight || 0), 0);

  // Render groups
  for (const group of groupedData) {
    const groupHeaderHeight = 16;
    const minRowHeight = 18;
    await checkPageBreak(groupHeaderHeight + minRowHeight);

    // Track the start Y position of the group for the border
    const groupStartY = yPosition;

    // Group header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    const groupText = `${group.order.departure || '-'} to ${group.order.destination || '-'}`;
    const vendorText = group.order.vendor || '-';
    doc.text(groupText, MARGIN_LEFT, yPosition + 12);
    doc.text(vendorText, pageWidth - MARGIN_RIGHT, yPosition + 12, { align: 'right' });
    yPosition += 16;

    // Order row
    const orderFields = tableHeader.map((header) => {
      if (header.key === 'orderDate') return formatDisplayDate(group.order.orderDate);
      if (header.key === 'bookingAmount') return formatNumber(group.order.bookingAmount);
      if (header.key === 'consignmentFreight') return '';
      return String(group.order[header.key] ?? ''); // Type-safe with ColumnKey
    });

    let rowHeight = 18;
    orderFields.forEach((field, idx) => {
      const h = getCellHeight(String(field ?? ''), tableHeader[idx].width, doc, 9);
      if (h > rowHeight) rowHeight = h;
    });

    await checkPageBreak(rowHeight);

    // Background for order row
    doc.setFillColor(240, 240, 240);
    doc.rect(MARGIN_LEFT, yPosition, totalTableWidth, rowHeight, 'F');

    let xPosition = MARGIN_LEFT;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(40, 40, 40);
    orderFields.forEach((field, idx) => {
      const wrapped = doc.splitTextToSize(String(field ?? ''), tableHeader[idx].width - CELL_PADDING * 2);
      doc.text(wrapped, xPosition + CELL_PADDING, yPosition + 12);
      doc.setLineWidth(0.3);
      doc.setDrawColor(120, 120, 120);
      doc.rect(xPosition, yPosition, tableHeader[idx].width, rowHeight);
      xPosition += tableHeader[idx].width;
    });
    yPosition += rowHeight + 4;

    // Consignment rows (no background, table-like borders)
    for (const row of group.consignments) {
      const consignmentFields = tableHeader.map((header, idx) => {
        if (idx < 5 && header.key !== 'biltyNo' && header.key !== 'consignmentFreight') return '';
        if (header.key === 'consignmentFreight') return formatNumber(row.consignmentFreight ?? 0);
        return String(row[header.key] ?? ''); // Type-safe with ColumnKey
      });

      let rowHeight = 18;
      consignmentFields.forEach((field, idx) => {
        const h = getCellHeight(String(field ?? ''), tableHeader[idx].width, doc, 9);
        if (h > rowHeight) rowHeight = h;
      });

      await checkPageBreak(rowHeight);

      // No background for consignment row
      let xPosition = MARGIN_LEFT;
      doc.setTextColor(80, 80, 80);
      consignmentFields.forEach((field, idx) => {
        const wrapped = doc.splitTextToSize(String(field ?? ''), tableHeader[idx].width - CELL_PADDING * 2);
        doc.text(wrapped, xPosition + CELL_PADDING, yPosition + 12);
        // Draw borders for non-booking-order columns to form table structure
        if (['biltyNo', 'consignmentFreight', 'consignor', 'consignee', 'article', 'qty'].includes(tableHeader[idx].key)) {
          doc.setLineWidth(0.3);
          doc.setDrawColor(120, 120, 120);
          doc.rect(xPosition, yPosition, tableHeader[idx].width, rowHeight);
        }
        xPosition += tableHeader[idx].width;
      });
      // Draw horizontal line to complete table structure for consignment row
      doc.setLineWidth(0.3);
      doc.setDrawColor(120, 120, 120);
      let lineX = MARGIN_LEFT;
      tableHeader.forEach((header, idx) => {
        if (['biltyNo', 'consignmentFreight', 'consignor', 'consignee', 'article', 'qty'].includes(header.key)) {
          doc.line(lineX, yPosition + rowHeight, lineX + header.width, yPosition + rowHeight);
        }
        lineX += header.width;
      });
      yPosition += rowHeight + 4;
    }

    // Draw rectangular border around the group
    await checkPageBreak();
    doc.setDrawColor(80, 80, 80);
    doc.setLineWidth(0.6);
    doc.rect(MARGIN_LEFT, groupStartY, totalTableWidth, yPosition - groupStartY);
    yPosition += 10;
  }

  // Totals row
  await checkPageBreak();
  const totalFields = tableHeader.map((header) => {
    if (header.key === 'bookingAmount') return formatNumber(totalFreight);
    if (header.key === 'consignmentFreight') return formatNumber(totalBiltyAmount);
    return header.key === 'serial' ? 'Total' : '';
  });

  let totalRowHeight = 18;
  totalFields.forEach((field, idx) => {
    const h = getCellHeight(String(field ?? ''), tableHeader[idx].width, doc, 9);
    if (h > totalRowHeight) totalRowHeight = h;
  });

  let xPosition = MARGIN_LEFT;
  doc.setFillColor(200, 220, 240);
  doc.rect(MARGIN_LEFT, yPosition, totalTableWidth, totalRowHeight, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(20, 60, 100);
  totalFields.forEach((field, idx) => {
    const wrapped = doc.splitTextToSize(String(field ?? ''), tableHeader[idx].width - CELL_PADDING * 2);
    doc.text(wrapped, xPosition + CELL_PADDING, yPosition + 12);
    doc.setLineWidth(0.4);
    doc.setDrawColor(100, 100, 100);
    doc.rect(xPosition, yPosition, tableHeader[idx].width, totalRowHeight);
    xPosition += tableHeader[idx].width;
  });
  yPosition += totalRowHeight + 10;

  // Add footer to all pages
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    await addFooter(i);
  }

  // Save PDF
  const filename = `${COMPANY_NAME.replace(/\s+/g, '_')}_Detailed_Booking_Order_Report.pdf`;
  doc.save(filename);
};