// src/components/reports/BookingOrderPdf.ts

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { RowData, ColumnKey, labelFor } from "@/components/ablsoftware/Maintance/common/BookingOrderTypes";

// Company constants
const COMPANY_NAME = "AL NASAR BASHEER LOGISTICS";
// const COMPANY_ADDRESS = "Suit No. 108, SP Chamber, Main Estate Avenue, SITE Karachi";
// const COMPANY_PHONE = "Phone: +92 21 32550917-18";
const REPORT_TITLE = "Contract Report (Detail)";

export const exportBookingOrderToPDF = (
  data: RowData[],
  selectedColumns: ColumnKey[],
  filterLine: string,
  colOrder: ColumnKey[],
  headRows: any[][]
) => {
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "A4" });

  // Header with company name, address, phone, and report title
  const pageWidth = doc.internal.pageSize.getWidth();
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(0, 0, 0);
  doc.text(COMPANY_NAME, pageWidth / 2, 42, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);


  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text(REPORT_TITLE, pageWidth / 2, 92, { align: "center" });

  // Filter info
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(filterLine, pageWidth / 2, 108, { align: "center" });

  // Separator line
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(1);
  doc.line(40, 116, pageWidth - 40, 116);

  // Table data
  const tableBody = data.map((row) =>
    colOrder.map((k) => {
      const v: any = row[k];
      if (typeof v === "number") return v.toLocaleString();
      return v ?? "-";
    })
  );

  autoTable(doc, {
    startY: 128,
    head: headRows,
    body: tableBody,
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
    margin: { top: 128, left: 40, right: 40, bottom: 60 },
    theme: "grid",
    didDrawPage: (d) => {
      // Footer
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

  const filename = `${COMPANY_NAME.replace(/\s+/g, "_")}_BookingOrder_Report.pdf`;
  doc.save(filename);
};