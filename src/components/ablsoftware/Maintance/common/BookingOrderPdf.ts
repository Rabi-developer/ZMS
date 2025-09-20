'use client';
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { RowData, ColumnKey, labelFor } from "@/components/ablsoftware/Maintance/common/BookingOrderTypes";

// Company constants
const COMPANY_NAME = "AL NASAR BASHEER LOGISTICS";
const COMPANY_ADDRESS = "Suit No. 108, SP Chamber, Main Estate Avenue, SITE Karachi";
const COMPANY_PHONE = "Phone: +92 21 32550917-18";
const LOGO_PATH = "/ABL-Logo.png"; 
// Utility function to preload image as base64
const loadImage = async (path: string): Promise<string> => {
  try {
    const response = await fetch(path); // Adjust path if needed (e.g., '/public/ABL-Logo.png')
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
  // Expect yyyy-mm-dd or ISO
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

export const exportBookingOrderToPDF = async (
  data: RowData[],
  selectedColumns: ColumnKey[],
  filterLine: string,
  colOrder: ColumnKey[],
  headRows: any[][],
  startDate?: string,
  endDate?: string
) => {
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "A4" });

  // Page dimensions
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Header function for first page only
  const addHeader = async () => {
    // Light gray background for header
    doc.setFillColor(220, 220, 220); // RGB #DCDCDC
    doc.rect(0, 0, pageWidth, 80, "F");

    // Company name (left)
    doc.setFont("times", "bold");
    doc.setFontSize(16);
    doc.setTextColor(50, 50, 50); // Dark gray text
    doc.text(COMPANY_NAME, 40, 30);

    // Company details (left)
    doc.setFont("times", "normal");
    doc.setFontSize(10);
    doc.text(COMPANY_ADDRESS, 40, 45);
    doc.text(COMPANY_PHONE, 40, 55);

    // Logo (right)
    try {
      const logoData = await loadImage(LOGO_PATH);
      doc.addImage(logoData, 'PNG', pageWidth - 52, 30, 38,26); // Increased size: 36pt wide, 24pt high
    } catch (error) {
      console.warn('Failed to load ABL logo, using placeholder text:', error);
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text('[ABL Logo]', pageWidth - 40, 50, { align: "right" });
    }
  };

  // Footer function for all pages
  const addFooter = (pageNumber: number) => {
    const footerY = pageHeight - 40;
    doc.setFillColor(245, 245, 245); // Very light gray background
    doc.rect(0, footerY - 10, pageWidth, 50, "F");

    doc.setFont("times", "normal");
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated on: ${new Date().toLocaleString('en-US', { timeZone: 'Asia/Karachi' })}`, 40, footerY);
    doc.text(`Page ${pageNumber}`, pageWidth - 40, footerY, { align: "right" });

  };

  // Add header to first page only
  await addHeader();

  // Filters Applied title (replacing Contract Report (Detail))
  doc.setFont("times", "bold");
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0); // Black text
  doc.text(" DETAIL REPORT", pageWidth / 2, 98, { align: "center" });

  // Date line: "Start From: <date>" (left), "To Date: <date>" (center), "Report: <date> <time>" (right)
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  const dateLineY = 125;
  const startText = `Start From: ${startDate ? formatDisplayDate(startDate) : "-"}`;
  const toText = `To Date: ${endDate ? formatDisplayDate(endDate) : "-"}`;
  const nowText = `Report: 20-09-2025 12:22:08 PM`; // Hardcoded as per example
  doc.text(startText, 40, dateLineY, { align: "left" });
  doc.text(toText, pageWidth / 2, dateLineY, { align: "center" });
  doc.text(nowText, pageWidth - 40, dateLineY, { align: "right" });
  // Table data
  const tableBody = data.map((row) =>
    colOrder.map((k) => {
      const v: any = row[k];
      if (typeof v === "number") return v.toLocaleString();
      return v ?? "-";
    })
  );

  // Table styling
  autoTable(doc, {
    startY: dateLineY + 20,
    head: headRows,
    body: tableBody,
    styles: {
      font: "times",
      fontSize: 8,
      cellPadding: 8,
      lineColor: [150, 150, 150],
      lineWidth: 0.5,
      textColor: [30, 30, 30],
      overflow: "linebreak",
      cellWidth: "auto",
    },
    headStyles: {
      fillColor: [220, 220, 220], // Light gray to match header
      textColor: [50, 50, 50], // Dark gray text
      fontStyle: "bold",
      fontSize: 9,
      halign: "center",
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245], // Very light gray for alternate rows
    },
    margin: { top: 110, left: 40, right: 40, bottom: 60 },
    theme: "grid",
    didDrawPage: (d) => {
      // Only add footer on subsequent pages
      addFooter(d.pageNumber);
      // If not the first page, adjust table startY to avoid header space
      if (d.pageNumber > 1) {
        d.settings.startY = 40; // Start table closer to top on subsequent pages
      }
    },
  });

  // Save the PDF
  const filename = `${COMPANY_NAME.replace(/\s+/g, "_")}_BookingOrder_Report.pdf`;
  doc.save(filename);
};