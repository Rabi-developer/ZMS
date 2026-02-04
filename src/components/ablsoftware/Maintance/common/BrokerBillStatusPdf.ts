// File: src/components/ablsoftware/Maintance/common/BrokerBillStatusPdf.ts
'use client';
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Company constants
const COMPANY_NAME = "AL NASAR BASHEER LOGISTICS";
const COMPANY_ADDRESS = "Suit No. 108, SP Chamber, Main Estate Avenue, SITE Karachi";
const COMPANY_PHONE = "Phone: +92 21 32550917-18";
const LOGO_PATH = "/ABL-Logo.png"; 

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
  if (!d) return "-";
  try {
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return d;
    const dd = String(dt.getDate()).padStart(2, "0");
    const mm = String(dt.getMonth() + 1).padStart(2, "0");
    const yyyy = dt.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  } catch {
    return d;
  }
};

export interface BrokerBillRow {
  serial: number;
  orderNo: string;
  invoiceNo?: string;
  vehicleNo: string;
  amount: number;
  dueDate?: string;
  paidAmount: number;
  balance: number;
  brokerName: string;
  brokerMobile?: string;
  remarks?: string;
  status?: string;
  munshyana?: number;
  otherCharges?: number;
}

export const exportBrokerBillStatusToPDF = async (
  data: BrokerBillRow[],
  reportType: "Paid" | "Unpaid",
  startDate?: string,
  endDate?: string,
  billPaymentInvoices?: any[],
  munshyanaData?: any[],
) => {
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "A4" });

  // Page dimensions
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Header function
  const addHeader = async () => {
    doc.setFillColor(220, 220, 220);
    doc.rect(0, 0, pageWidth, 80, "F");

    doc.setFont("times", "bold");
    doc.setFontSize(16);
    doc.setTextColor(50, 50, 50);
    doc.text(COMPANY_NAME, 40, 30);

    doc.setFont("times", "normal");
    doc.setFontSize(10);
    doc.text(COMPANY_ADDRESS, 40, 45);
    doc.text(COMPANY_PHONE, 40, 55);

    try {
      const logoData = await loadImage(LOGO_PATH);
      doc.addImage(logoData, 'PNG', pageWidth - 52, 30, 38, 26);
    } catch (error) {
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text('[ABL Logo]', pageWidth - 40, 50, { align: "right" });
    }
  };

  const addFooter = (pageNumber: number) => {
    const footerY = pageHeight - 40;
    doc.setFillColor(245, 245, 245);
    doc.rect(0, footerY - 10, pageWidth, 50, "F");

    doc.setFont("times", "normal");
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated on: ${new Date().toLocaleString('en-US', { timeZone: 'Asia/Karachi' })}`, 40, footerY);
    doc.text(`Page ${pageNumber}`, pageWidth - 40, footerY, { align: "right" });
  };

  await addHeader();

  doc.setFont("times", "bold");
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text(`BROKER ${reportType.toUpperCase()} BILLS REPORT`, pageWidth / 2, 98, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  const dateLineY = 125;
  const startText = `Start From: ${startDate ? formatDisplayDate(startDate) : "-"}`;
  const toText = `To Date: ${endDate ? formatDisplayDate(endDate) : "-"}`;
  doc.text(startText, 40, dateLineY, { align: "left" });
  doc.text(toText, pageWidth / 2, dateLineY, { align: "center" });

  // Preprocess rows: detect munshyana and additional charges from provided bill payment invoices
  const processed = data.map((r) => {
    let munshyana = Number(r.munshyana) || 0;
    let otherCharges = Number(r.otherCharges) || 0;

    if ((munshyana === 0 && otherCharges === 0) && Array.isArray(billPaymentInvoices) && billPaymentInvoices.length) {
      // try to find a matching bill payment invoice by vehicle/order/bill
      const match = billPaymentInvoices.find((bill: any) => {
        if (!bill.lines || !Array.isArray(bill.lines)) return false;
        return bill.lines.some((line: any) => {
          const vehicleMatch = line.vehicleNo && String(line.vehicleNo) === String(r.vehicleNo);
          const orderMatch = line.orderNo && String(line.orderNo) === String(r.orderNo);
          const billMatch = line.biltyNo && String(line.biltyNo) === String(r.invoiceNo);
          return vehicleMatch || orderMatch || billMatch;
        });
      });

      if (match) {
        // sum additional charges (lines flagged as additional)
        try {
          const totalAdditional = match.lines.reduce((sum: number, l: any) => sum + (l.isAdditionalLine ? (Number(l.amountCharges ?? l.amount) || 0) : 0), 0);
          const munshyanaDeduction = match.lines.reduce((sum: number, l: any) => sum + (!l.isAdditionalLine ? (Number(l.munshyana || 0) || 0) : 0), 0);
          otherCharges = otherCharges || totalAdditional;
          munshyana = munshyana || munshyanaDeduction;
        } catch (e) {
          // ignore and keep existing values
        }
      }
    }

    const paid = Number(r.paidAmount) || 0;
    const balance = Number(r.balance) || 0;
    const adjustedPaid = paid - munshyana + otherCharges;
    const adjustedBalance = balance - munshyana + otherCharges;

    return { original: r, munshyana, otherCharges, adjustedPaid, adjustedBalance };
  });

  // Calculate totals for footer using processed values
  const totalAmount = processed.reduce((s, p) => s + (Number(p.original.amount) || 0), 0);
  const totalMunshyana = processed.reduce((s, p) => s + (Number(p.munshyana) || 0), 0);
  const totalOtherCharges = processed.reduce((s, p) => s + (Number(p.otherCharges) || 0), 0);
  const totalPaid = processed.reduce((s, p) => s + (Number(p.original.paidAmount) || 0), 0);
  const totalBalance = processed.reduce((s, p) => s + (Number(p.original.balance) || 0), 0);
  const totalAdjustedPaid = processed.reduce((s, p) => s + (Number(p.adjustedPaid) || 0), 0);
  const totalAdjustedBalance = processed.reduce((s, p) => s + (Number(p.adjustedBalance) || 0), 0);

  const head = [
    [
      "SNo",
      "Order No",
      "Bill No",
      "Vehicle No",
      "Amount",
      "Due Date",
      "Paid Amount",
      "Balance",
      "Broker (Name / Mobile)",
      "Remarks",
    ],
  ];

  const body = processed.map((p) => {
    const row = p.original;
    return [
      row.serial,
      row.orderNo || "-",
      row.invoiceNo || "-",
      row.vehicleNo || "-",
      (Number(row.amount) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 }),
      row.dueDate ? formatDisplayDate(row.dueDate) : "-",
      (Number(p.adjustedPaid) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 }),
      (Number(p.adjustedBalance) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 }),
      `${row.brokerName || '-'}` + (row.brokerMobile ? `\n${row.brokerMobile}` : ''),
      row.remarks || "",
    ];
  });

  autoTable(doc, {
    startY: dateLineY + 20,
    head: head,
    body: body,
    foot: [[
      "",
      "",
      "",
      "Totals",
      totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 }),
      "",
      totalAdjustedPaid.toLocaleString(undefined, { minimumFractionDigits: 2 }),
      totalAdjustedBalance.toLocaleString(undefined, { minimumFractionDigits: 2 }),
      "",
      "",
    ]],
    styles: {
      font: "times",
      fontSize: 9,
      cellPadding: 5,
      lineColor: [180, 180, 180],
      lineWidth: 0.25,
      textColor: [0, 0, 0],
    },
    headStyles: {
      fillColor: [240, 240, 240],
      textColor: [0, 0, 0],
      fontStyle: "bold",
      fontSize: 10,
      halign: "center",
    },
    footStyles: {
      fillColor: [250, 250, 250],
      textColor: [0, 0, 0],
      fontStyle: "bold",
    },
    columnStyles: {
      4: { halign: 'right' },
      6: { halign: 'right' },
      7: { halign: 'right' },
      8: { cellWidth: 120 },
    },
    alternateRowStyles: {
      fillColor: [250, 250, 250],
    },
    margin: { top: 110, left: 40, right: 40, bottom: 60 },
    theme: "grid",
    didDrawPage: (d) => {
      addFooter(d.pageNumber);
      if (d.pageNumber > 1) {
        d.settings.startY = 40;
      }
    },
  });

  // Broker Wise Summary (moved near top look by keeping styling consistent)
  const groupMap = new Map<string, { brokerLabel: string; amount: number; paid: number; balance: number }>();
  processed.forEach((p) => {
    const r = p.original;
    const label = `${r.brokerName || '-'}${r.brokerMobile ? ` / ${r.brokerMobile}` : ''}`;
    const entry = groupMap.get(label) || { brokerLabel: label, amount: 0, paid: 0, balance: 0 };
    entry.amount += Number(r.amount) || 0;
    entry.paid += Number(p.adjustedPaid) || 0;
    entry.balance += Number(p.adjustedBalance) || 0;
    groupMap.set(label, entry);
  });
  const summary = Array.from(groupMap.values());

  let nextY = (doc as any).lastAutoTable?.finalY ? (doc as any).lastAutoTable.finalY + 24 : dateLineY + 44;
  doc.setFont("times", "bold");
  doc.setFontSize(13);
  doc.setTextColor(0, 0, 0);
  doc.text("Broker Wise Summary", pageWidth / 5, nextY, { align: 'right' });

  autoTable(doc, {
    startY: nextY + 12,
    head: [["Broker (Name / Mobile)", "Amount", "Paid", "Balance"]],
    body: summary.map(s => [
      s.brokerLabel,
      s.amount.toLocaleString(undefined, { minimumFractionDigits: 2 }),
      s.paid.toLocaleString(undefined, { minimumFractionDigits: 2 }),
      s.balance.toLocaleString(undefined, { minimumFractionDigits: 2 }),
    ]),
    styles: { font: 'times', fontSize: 9, cellPadding: 3, textColor: [0,0,0] },
    headStyles: { fillColor: [240,240,240], fontStyle: 'bold', textColor: [0,0,0] },
    columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' }, 3: { halign: 'right' }, },
    theme: 'grid',
    margin: { left: 40, right: 100 },
  });

  const filename = `Broker_${reportType}_Bills_Report_${new Date().getTime()}.pdf`;
  doc.save(filename);
};
