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
  orderDate: string;
  vehicleNo: string;
  brokerName: string;
  amount: number;
  paidAmount: number;
  balance: number;
  status: string;
}

export const exportBrokerBillStatusToPDF = async (
  data: BrokerBillRow[],
  reportType: "Paid" | "Unpaid",
  startDate?: string,
  endDate?: string,
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
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text(`BROKER ${reportType.toUpperCase()} BILLS REPORT`, pageWidth / 2, 98, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  const dateLineY = 125;
  const startText = `Start From: ${startDate ? formatDisplayDate(startDate) : "-"}`;
  const toText = `To Date: ${endDate ? formatDisplayDate(endDate) : "-"}`;
  doc.text(startText, 40, dateLineY, { align: "left" });
  doc.text(toText, pageWidth / 2, dateLineY, { align: "center" });

  const head = [
    ["SNo", "Order No", "Order Date", "Vehicle No", "Broker Name", "Bill Amount", "Paid Amount", "Balance", "Status"]
  ];

  const body = data.map(row => [
    row.serial,
    row.orderNo,
    row.orderDate,
    row.vehicleNo,
    row.brokerName,
    row.amount.toLocaleString(undefined, { minimumFractionDigits: 2 }),
    row.paidAmount.toLocaleString(undefined, { minimumFractionDigits: 2 }),
    row.balance.toLocaleString(undefined, { minimumFractionDigits: 2 }),
    row.status
  ]);

  autoTable(doc, {
    startY: dateLineY + 20,
    head: head,
    body: body,
    styles: {
      font: "times",
      fontSize: 8,
      cellPadding: 4,
      lineColor: [150, 150, 150],
      lineWidth: 0.2,
      textColor: [30, 30, 30],
    },
    headStyles: {
      fillColor: [220, 220, 220],
      textColor: [50, 50, 50],
      fontStyle: "bold",
      fontSize: 9,
      halign: "center",
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
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

  const filename = `Broker_${reportType}_Bills_Report_${new Date().getTime()}.pdf`;
  doc.save(filename);
};
