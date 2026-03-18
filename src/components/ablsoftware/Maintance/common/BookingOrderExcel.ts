// src/components/reports/BookingOrderExcel.ts

import ExcelJS from "exceljs";
import { RowData, ColumnKey, labelFor } from "@/components/ablsoftware/Maintance/common/BookingOrderTypes";

// Company constants
const COMPANY_NAME = "AL NASAR BASHEER LOGISTICS";
const COMPANY_ADDRESS = "Suit No. 108, SP Chamber, Main Estate Avenue, SITE Karachi";
const COMPANY_PHONE = "Phone: +92 21 32550917-18";
const REPORT_TITLE = "Detailed Booking Order Report";

export const exportBookingOrderToExcel = async (
  data: RowData[],
  selectedColumns: ColumnKey[],
  filterLine: string,
  colOrder: ColumnKey[],
  headRows: any[][]
) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("BookingReport");

  const colCount = colOrder.length;

  // Helper to set borders for a cell
  const setBorders = (cell: ExcelJS.Cell, color = 'FF808080', style: ExcelJS.BorderStyle = 'thin') => {
    cell.border = {
      top: { style, color: { argb: color } },
      left: { style, color: { argb: color } },
      bottom: { style, color: { argb: color } },
      right: { style, color: { argb: color } }
    };
  };

  // 1. Company Header
  const headerLines = [
    { text: COMPANY_NAME, size: 16, bold: true },
    { text: COMPANY_ADDRESS, size: 10, bold: false },
    { text: COMPANY_PHONE, size: 10, bold: false },
    { text: REPORT_TITLE, size: 14, bold: true },
    { text: filterLine, size: 10, bold: false }
  ];

  headerLines.forEach((line, idx) => {
    const rowNum = idx + 1;
    const row = worksheet.getRow(rowNum);
    row.getCell(1).value = line.text;
    worksheet.mergeCells(rowNum, 1, rowNum, colCount);
    const cell = row.getCell(1);
    cell.font = { name: 'Arial', size: line.size, bold: line.bold };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    if (idx === 0) row.height = 30;
  });

  worksheet.addRow([]); // Spacer

  // 2. Table Headers
  const headerRow = worksheet.addRow(colOrder.map(labelFor));
  // Removed fixed height to allow auto-fit
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, size: 10 };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFC8C8C8' }
    };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    setBorders(cell);
  });

  // 3. Grouped Data Logic (matches PDF)
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

  // Render Groups
  groupedData.forEach((group) => {
    // A. Group Header (Route + Vendor)
    const groupHeaderRow = worksheet.addRow([]);
    const startIdx = groupHeaderRow.number;
    const groupText = `${group.order.departure || '-'} to ${group.order.destination || '-'}`;
    const vendorText = group.order.vendor || '-';
    
    groupHeaderRow.getCell(1).value = groupText;
    groupHeaderRow.getCell(colCount).value = vendorText;
    groupHeaderRow.getCell(colCount).alignment = { horizontal: 'right' };
    
    worksheet.mergeCells(startIdx, 1, startIdx, colCount - 1);
    groupHeaderRow.eachCell({ includeEmpty: true }, (cell) => {
      cell.font = { bold: true, size: 10 };
      cell.border = { 
        top: { style: 'medium', color: { argb: 'FF505050' } },
        left: { style: 'medium', color: { argb: 'FF505050' } },
        right: { style: 'medium', color: { argb: 'FF505050' } }
      };
    });
    groupHeaderRow.height = 20;

    // B. Order Row
    const orderFields = colOrder.map(k => {
      if (k === 'biltyAmount' || k === 'consignmentFreight') return "";
      const v = group.order[k];
      return typeof v === 'number' ? v : (v ?? "-");
    });
    const orderRow = worksheet.addRow(orderFields);
    // Removed fixed height to allow auto-fit
    orderRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F0F0' } };
      cell.font = { bold: true, size: 9 };
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      
      const key = colOrder[colNumber - 1];
      setBorders(cell);
      if (colNumber === 1) cell.border.left = { style: 'medium', color: { argb: 'FF505050' } };
      if (colNumber === colCount) cell.border.right = { style: 'medium', color: { argb: 'FF505050' } };

      if (key === 'bookingAmount' && typeof group.order[key] === 'number') {
        cell.numFmt = '#,##0.00';
      }
    });

    // C. Consignment Rows
    group.consignments.forEach((cRow, cIdx) => {
      const consignmentFields = colOrder.map((k, idx) => {
        if (idx < 5 && k !== 'biltyNo' && k !== 'biltyAmount' && k !== 'consignmentFreight') return "";
        const v = cRow[k];
        return typeof v === 'number' ? v : (v ?? "-");
      });
      const consRow = worksheet.addRow(consignmentFields);
      // Removed fixed height to allow auto-fit
      consRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        cell.font = { size: 9, color: { argb: 'FF404040' } };
        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        
        const key = colOrder[colNumber - 1];
        if (['biltyNo', 'biltyAmount', 'consignmentFreight', 'consignor', 'consignee', 'article', 'qty'].includes(key)) {
          setBorders(cell);
        }

        if (colNumber === 1) cell.border = { ...cell.border, left: { style: 'medium', color: { argb: 'FF505050' } } };
        if (colNumber === colCount) cell.border = { ...cell.border, right: { style: 'medium', color: { argb: 'FF505050' } } };
        
        if ((key === 'biltyAmount' || key === 'consignmentFreight') && typeof cRow[key] === 'number') {
          cell.numFmt = '#,##0.00';
        }
      });

      // Bottom border for the last consignment row in the group
      if (cIdx === group.consignments.length - 1) {
        consRow.eachCell({ includeEmpty: true }, (cell) => {
          cell.border = { ...cell.border, bottom: { style: 'medium', color: { argb: 'FF505050' } } };
        });
      }
    });

    // If no consignments, ensure order row has bottom medium border
    if (group.consignments.length === 0) {
      orderRow.eachCell({ includeEmpty: true }, (cell) => {
        cell.border = { ...cell.border, bottom: { style: 'medium', color: { argb: 'FF505050' } } };
      });
    }

    worksheet.addRow([]); // Spacer between groups
  });

  // 4. Totals Row
  const totalFreight = data.reduce((acc, row) => acc + (row.isOrderRow ? Number(row.bookingAmount) || 0 : 0), 0);
  const totalBiltyAmount = data.reduce((acc, row) => acc + (row.isOrderRow ? 0 : Number(row.biltyAmount || row.consignmentFreight) || 0), 0);

  const totalsData = colOrder.map((k) => {
    if (k === 'serial') return "Grand Total";
    if (k === 'bookingAmount') return totalFreight;
    if (k === 'biltyAmount' || k === 'consignmentFreight') return totalBiltyAmount;
    return "";
  });

  const totalsRow = worksheet.addRow(totalsData);
  totalsRow.height = 25;
  totalsRow.eachCell((cell, colNumber) => {
    cell.font = { bold: true, size: 10, color: { argb: 'FF143C64' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC8DCEF' } };
    setBorders(cell);
    const key = colOrder[colNumber - 1];
    if (['bookingAmount', 'biltyAmount', 'consignmentFreight'].includes(key)) {
      cell.numFmt = '#,##0.00';
      cell.alignment = { horizontal: 'right' };
    }
  });

  // 5. Column Widths
  worksheet.columns = colOrder.map((k) => {
    let w = 15;
    switch (k) {
      case "serial": w = 7; break;
      case "orderNo": w = 18; break;
      case "orderDate": w = 14; break;
      case "vehicleNo": w = 15; break;
      case "bookingAmount": w = 15; break;
      case "biltyNo": w = 15; break;
      case "biltyAmount": w = 15; break;
      case "consignor": w = 35; break;
      case "consignee": w = 35; break;
      case "article": w = 45; break;
      case "qty": w = 12; break;
      default: w = 20; break;
    }
    return { width: w };
  });

  // Write and download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${COMPANY_NAME.replace(/\s+/g, "_")}_BookingOrder_Report.xlsx`;
  anchor.click();
  window.URL.revokeObjectURL(url);
};
