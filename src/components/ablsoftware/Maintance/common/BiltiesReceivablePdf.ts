// src/components/ablsoftware/Maintance/common/BiltiesReceivablePdf.ts

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Company constants (reuse style from BookingOrderPdf)
const COMPANY_NAME = "AL NASAR BASHEER LOGISTICS";
const REPORT_TITLE = "Bilties Receivable";

export interface BiltiesReceivableRow {
  orderNo: string;
  orderDate?: string;
  vehicleNo?: string;
  consignor?: string;
  consignee?: string;
  carrier?: string; // transporter
  vendor?: string;
  departure?: string; // fromLocation
  destination?: string; // toLocation
  vehicleType?: string;
}

export interface BiltiesReceivablePdfParams {
  rows: BiltiesReceivableRow[];
  startDate?: string; // yyyy-mm-dd
  endDate?: string; // yyyy-mm-dd
  dateFilter?: string;
  columns?: string;
  valueFilter?: string;
  sorting?: string;
  quickActions?: string;
}

const formatDisplayDate = (d?: string) => {
  if (!d) return "-";
  // Expect yyyy-mm-dd or ISO
  try {
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) return d;
    const dd = String(dt.getDate()).padStart(2, "0");
    const mm = String(dt.getMonth() + 1).padStart(2, "0");
    const yyyy = dt.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  } catch {
    return d;
  }
};

export const exportBiltiesReceivableToPDF = ({ rows, startDate, endDate, dateFilter, columns, valueFilter, sorting, quickActions }: BiltiesReceivablePdfParams) => {
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "A4" });
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header: Company name
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(0, 0, 0);
  doc.text(COMPANY_NAME, pageWidth / 2, 42, { align: "center" });

  // Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(REPORT_TITLE, pageWidth / 2, 70, { align: "center" });

  // Date line (Before table):
  // "Start From: <date>" (left), "To Date: <date>" (center), "Report Date/Time: <now>" (right)
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);

  const startText = `Start From: ${startDate ? formatDisplayDate(startDate) : "-"}`;
  const toText = `To Date: ${endDate ? formatDisplayDate(endDate) : "-"}`;
  const nowText = `Report: ${formatDisplayDate(new Date().toISOString())} ${new Date().toLocaleTimeString()}`;

  doc.text(startText, 40, 96, { align: "left" });
  doc.text(toText, pageWidth / 2, 96, { align: "center" });
  doc.text(nowText, pageWidth - 40, 96, { align: "right" });

  // Separator line
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(1);
  doc.line(40, 108, pageWidth - 40, 108);

  // Filter lines
  let yPos = 120;
  const lineHeight = 12;
  const addLine = (label: string, value?: string) => {
    if (value) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(80, 80, 80);
      doc.text(`${label}: ${value}`, 40, yPos, { align: "left" });
      yPos += lineHeight;
    }
  };

  addLine("Date Filter", dateFilter);
  addLine("Columns", columns);
  addLine("Value Filter", valueFilter);
  addLine("Sorting", sorting);
  addLine("Quick Actions", quickActions);

  // Table head & body
  const head = [[
    "Order No",
    "Order Date",
    "Vehicle No",
    "Consigner",
    "Consignee",
    "Carrier",
    "Vendor",
    "Departure",
    "Destination",
    "Vehicle Type",
  ]];

  const body = rows.map((r) => [
    r.orderNo || "-",
    formatDisplayDate(r.orderDate),
    r.vehicleNo || "-",
    r.consignor || "-",
    r.consignee || "-",
    r.carrier || "-",
    r.vendor || "-",
    r.departure || "-",
    r.destination || "-",
    r.vehicleType || "-",
  ]);

  autoTable(doc, {
    startY: 140,
    head,
    body,
    styles: {
      font: "helvetica",
      fontSize: 9,
      cellPadding: 6,
      lineColor: [220, 220, 220],
      lineWidth: 0.5,
      textColor: [30, 30, 30],
      overflow: "linebreak",
      cellWidth: "auto",
    },
    headStyles: {
      fillColor: [200, 200, 200],
      textColor: [0, 0, 0],
      fontStyle: "bold",
      fontSize: 10,
      halign: "center",
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
    margin: { top: 140, left: 40, right: 40, bottom: 60 },
    theme: "grid",
    didDrawPage: (d) => {
      const pw = doc.internal.pageSize.getWidth();
      const ph = doc.internal.pageSize.getHeight();
      doc.setFontSize(9);
      doc.setTextColor(150, 150, 150);
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 40, ph - 30);
      doc.text(`Page ${d.pageNumber}`, pw - 40, ph - 30, { align: "right" });
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.5);
      doc.line(40, ph - 50, pw - 40, ph - 50);
    },
  });

  const filename = `${COMPANY_NAME.replace(/\s+/g, "_")}_Bilties_Receivable.pdf`;
  doc.save(filename);
};