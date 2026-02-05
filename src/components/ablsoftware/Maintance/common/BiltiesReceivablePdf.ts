// src/components/ablsoftware/Maintance/common/BiltiesReceivablePdf.ts

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Company constants (reuse style from BookingOrderPdf)
const COMPANY_NAME = "AL NASAR BASHEER LOGISTICS";
const REPORT_TITLE = "Bilties Receivable";

export interface BiltiesReceivableRow {
  serial?: number | string;
  orderNo: string;
  orderDate?: string;
  vehicleNo?: string;
  biltyNo?: string;
  biltyDate?: string;
  consignor?: string;
  consignee?: string;
  carrier?: string; // transporter
  vendor?: string;
  departure?: string; // fromLocation
  destination?: string; // toLocation
  vehicleType?: string;
  article?: string;
  qty?: string;
  biltyAmount?: number;
  receivedAmount?: number;
  pendingAmount?: number;
  ablDate?: string;
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
  exportType?: 'bilty' | 'party';
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

export const exportBiltiesReceivableToPDF = ({ rows, startDate, endDate, dateFilter, columns, valueFilter, sorting, quickActions, exportType = 'bilty' }: BiltiesReceivablePdfParams) => {
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
  const title = exportType === 'party' ? "Party Wise Bilty Report" : "Bilty Wise Receivable Report";
  doc.text(title, pageWidth / 2, 70, { align: "center" });

  // Date line
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

  let currentY = 130;

  const numberOr0 = (v: any) => {
    const n = typeof v === "string" ? parseFloat(v) : v;
    return isNaN(n) || !isFinite(n) ? 0 : n;
  };

  const formatCurrency = (num: any) => {
    return numberOr0(num).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  if (exportType === 'party') {
    // Group by Consignee
    const grouped: Record<string, BiltiesReceivableRow[]> = {};
    rows.forEach(r => {
      const party = r.consignee || "Unknown Party";
      if (!grouped[party]) grouped[party] = [];
      grouped[party].push(r);
    });

    let headerShownOnPage = false;
    const head = [[
      "Vehicle No",
      "Bilty No",
      "Bilty Date",
      "Destination",
      "Item Desc",
      "Qty",
      "Bilty Amount",
      "Received Amount",
      "Pending Amount"
    ]];

    Object.entries(grouped).forEach(([partyName, partyRows], index) => {
      // Check if we need a new page
      if (currentY + 80 > doc.internal.pageSize.getHeight()) {
        doc.addPage();
        currentY = 40;
        headerShownOnPage = false;
      }

      // Show header only once per page
      if (!headerShownOnPage) {
        autoTable(doc, {
          startY: currentY,
          head,
          body: [],
          styles: { fontSize: 8, cellPadding: 4 },
          headStyles: { fillColor: [200, 200, 200], textColor: [0, 0, 0] },
          theme: 'grid',
          margin: { left: 40, right: 40 },
        });
        currentY = (doc as any).lastAutoTable.finalY + 8;
        headerShownOnPage = true;
      }

      // Party name
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(50, 50, 50);
      doc.text(`${partyName}`, 40, currentY);
      currentY += 10;

      const body = partyRows.map(r => [
        r.vehicleNo || "-",
        r.biltyNo || "-",
        formatDisplayDate(r.biltyDate || r.orderDate),
        r.destination || "-",
        r.article || "-",
        r.qty || "-",
        formatCurrency(r.biltyAmount),
        formatCurrency(r.receivedAmount),
        formatCurrency(r.pendingAmount)
      ]);

      // Calculate totals for this party
      const partytotals = partyRows.reduce((acc, r) => {
        acc.bilty += numberOr0(r.biltyAmount);
        acc.received += numberOr0(r.receivedAmount);
        acc.pending += numberOr0(r.pendingAmount);
        return acc;
      }, { bilty: 0, received: 0, pending: 0 });

      body.push([
        { content: "Total", colSpan: 6, styles: { halign: 'right', fontStyle: 'bold' } },
        formatCurrency(partytotals.bilty),
        formatCurrency(partytotals.received),
        formatCurrency(partytotals.pending)
      ]);

      autoTable(doc, {
        startY: currentY,
        head: [], // Don't repeat header
        body,
        styles: { fontSize: 8, cellPadding: 4 },
        headStyles: { fillColor: [200, 200, 200], textColor: [0, 0, 0] },
        theme: 'grid',
        margin: { left: 40, right: 40 },
      });

      currentY = (doc as any).lastAutoTable.finalY + 15;
    });

  } else {
    // Bilty Wise
    const head = [[
      "Vehicle No",
      "Bilty No",
      "Bilty Date",
      "From [Consignee]",
      "Item Desc",
      "Qty",
      "Bilty Amount",
      "Received Amount",
      "Pending Amount"
    ]];

    const body = rows.map(r => [
      r.vehicleNo || "-",
      r.biltyNo || "-",
      formatDisplayDate(r.biltyDate || r.orderDate),
      r.consignee || "-",
      r.article || "-",
      r.qty || "-",
      formatCurrency(r.biltyAmount),
      formatCurrency(r.receivedAmount),
      formatCurrency(r.pendingAmount)
    ]);

    // Calculate totals
    const totals = rows.reduce((acc, r) => {
      acc.bilty += numberOr0(r.biltyAmount);
      acc.received += numberOr0(r.receivedAmount);
      acc.pending += numberOr0(r.pendingAmount);
      return acc;
    }, { bilty: 0, received: 0, pending: 0 });

    body.push([
      { content: "TOTAL", colSpan: 6, styles: { halign: 'right', fontStyle: 'bold' } },
      formatCurrency(totals.bilty),
      formatCurrency(totals.received),
      formatCurrency(totals.pending)
    ]);

    autoTable(doc, {
      startY: currentY,
      head,
      body,
      styles: { fontSize: 8, cellPadding: 4 },
      headStyles: { fillColor: [200, 200, 200], textColor: [0, 0, 0] },
      theme: 'grid',
      margin: { left: 40, right: 40 },
    });
  }

  const filename = `${COMPANY_NAME.replace(/\s+/g, "_")}_Receivable_Report.pdf`;
  doc.save(filename);
};