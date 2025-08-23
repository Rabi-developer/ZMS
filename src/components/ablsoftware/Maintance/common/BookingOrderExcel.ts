// src/components/reports/BookingOrderExcel.ts

import * as XLSX from "xlsx";
import { RowData, ColumnKey, labelFor } from "@/components/ablsoftware/Maintance/common/BookingOrderTypes"; // Assume types in separate file

// Company constants
const COMPANY_NAME = "AL NASAR BASHEER LOGISTICS";
const COMPANY_ADDRESS = "Suit No. 108, SP Chamber, Main Estate Avenue, SITE Karachi";
const COMPANY_PHONE = "Phone: +92 21 32550917-18";
const REPORT_TITLE = "Contract Report (Detail)";

export const exportBookingOrderToExcel = (
  data: RowData[],
  selectedColumns: ColumnKey[],
  filterLine: string,
  colOrder: ColumnKey[],
  headRows: any[][]
) => {
  // Top header lines
  const wsData: any[][] = [];
  wsData.push([COMPANY_NAME]);
  wsData.push([COMPANY_ADDRESS]);
  wsData.push([COMPANY_PHONE]);
  wsData.push([REPORT_TITLE]);
  wsData.push([filterLine]);
  wsData.push([]); // spacer row to keep header area clear

  // Table header (grouped)
  const headerStart = wsData.length;
  const topRow = headRows[0].map((cell: any) => typeof cell === "string" ? cell : cell.content);
  wsData.push(topRow);
  if (headRows.length > 1) {
    wsData.push(headRows[1]);
  }

  // Data rows
  data.forEach((row) => {
    wsData.push(colOrder.map((k) => {
      const v: any = row[k];
      return typeof v === "number" ? v : (v ?? "-");
    }));
  });

  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Merges for top company header lines across all columns
  const colCount = colOrder.length || 1;
  const merges: XLSX.Range[] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: Math.max(colCount - 1, 0) } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: Math.max(colCount - 1, 0) } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: Math.max(colCount - 1, 0) } },
    { s: { r: 3, c: 0 }, e: { r: 3, c: Math.max(colCount - 1, 0) } },
    { s: { r: 4, c: 0 }, e: { r: 4, c: Math.max(colCount - 1, 0) } },
  ];

  // Grouped header merges
  const hdrTopRowIndex = headerStart; // top header row index
  const hdrSubExists = headRows.length > 1;
  let colPointer = 0;
  headRows[0].forEach((cell: any, idx: number) => {
    if (typeof cell === "string") {
      // Single column with rowSpan 2 => merge vertically if sub-header exists
      if (hdrSubExists) merges.push({ s: { r: hdrTopRowIndex, c: colPointer }, e: { r: hdrTopRowIndex + 1, c: colPointer } });
      colPointer += 1;
    } else if (cell && typeof cell === "object" && cell.colSpan) {
      // Group header => merge horizontally across colSpan
      merges.push({ s: { r: hdrTopRowIndex, c: colPointer }, e: { r: hdrTopRowIndex, c: colPointer + cell.colSpan - 1 } });
      colPointer += cell.colSpan;
    } else {
      colPointer += 1;
    }
  });

  (ws as any)["!merges"] = merges;

  // Set column widths
  const colWidths = colOrder.map((k) => {
    switch (k) {
      case "serial": return { wch: 12 };
      case "orderNo": return { wch: 18 };
      case "ablDate":
      case "orderDate": return { wch: 16 };
      case "vehicleNo": return { wch: 16 };
      case "bookingAmount":
      case "biltyAmount": return { wch: 18 };
      case "biltyNo": return { wch: 24 };
      case "consignor":
      case "consignee": return { wch: 28 };
      case "article": return { wch: 30 };
      case "departure":
      case "destination": return { wch: 22 };
      case "vendor":
      case "carrier": return { wch: 20 };
      case "qty": return { wch: 20 };
      default: return { wch: 16 };
    }
  });
  (ws as any)["!cols"] = colWidths;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "BookingReport");
  const fname = `${COMPANY_NAME.replace(/\s+/g, "_")}_BookingOrder_Report.xlsx`;
  XLSX.writeFile(wb, fname);
};