'use client';
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const COMPANY_NAME = "AL NASAR BASHEER LOGISTICS";
const COMPANY_ADDRESS = "Suit No. 108, SP Chamber, Main Estate Avenue, SITE Karachi";
const COMPANY_PHONE = "Phone: +92 21 32550917-18";

const formatDisplayDate = (d?: string): string => {
  if (!d) return "-";
  try {
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return d;
    return dt.toLocaleDateString('en-GB').replace(/\//g, '-');
  } catch {
    return d;
  }
};

export interface ChargeReportRow {
  chargeNo: string;
  chargeName: string;
  date: string;
  orderNo: string;
  vehicleNo: string;
  amount: number;
  isOrderHeader?: boolean;
}

export const exportChargesReportToPDF = async (
  data: ChargeReportRow[],
  reportType: string,
  startDate?: string,
  endDate?: string
) => {
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "A4" });
  const pageWidth = doc.internal.pageSize.getWidth();

  const addHeader = () => {
    doc.setFillColor(240, 240, 240);
    doc.rect(0, 0, pageWidth, 80, "F");
    doc.setFont("times", "bold");
    doc.setFontSize(18);
    doc.setTextColor(40, 40, 40);
    doc.text(COMPANY_NAME, 40, 35);
    doc.setFontSize(10);
    doc.setFont("times", "normal");
    doc.text(COMPANY_ADDRESS, 40, 50);
    doc.text(COMPANY_PHONE, 40, 62);
  };

  addHeader();

  doc.setFont("times", "bold");
  doc.setFontSize(14);
  doc.text(`${reportType} REPORT`, pageWidth / 2, 100, { align: "center" });

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  const dateLine = `Period: ${startDate ? formatDisplayDate(startDate) : "Start"} to ${endDate ? formatDisplayDate(endDate) : "End"}`;
  doc.text(dateLine, 40, 120);

  const head = [["Charges No", "Charge Name", "Date", "Order No", "Vehicle No", "Amount"]];
  const body = data.map(row => [
    row.chargeNo,
    row.chargeName,
    row.date,
    row.orderNo,
    row.vehicleNo,
    row.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })
  ]);''
  const totalAmount = data.reduce((sum, row) => sum + (row.amount || 0), 0);
  body.push(["", "", "", "", "Total", totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })]);

  autoTable(doc, {
    startY: 135,
    head: head,
    body: body,
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 5 },
    headStyles: { fillColor: [70, 70, 70], textColor: [255, 255, 255] },
    didParseCell: (data) => {
      const rowIndex = data.row.index;
      if (data.section === 'body' && data.column.index === 5) {
        data.cell.styles.halign = 'right';
      }
      // If it's the "Order Header" style (optional visual distinction)
      if (data.section === 'body' && (data.row.raw as any)[0] && !(data.row.raw as any)[1]) {
         data.cell.styles.fontStyle = 'bold';
         data.cell.styles.fillColor = [245, 245, 245];
      }
    }
  });

  doc.save(`Charges_Report_${new Date().getTime()}.pdf`);
};
