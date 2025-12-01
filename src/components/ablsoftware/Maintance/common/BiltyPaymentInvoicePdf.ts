import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export interface BiltyPaymentLineRow {
  isAdditionalLine: boolean;
  biltyNo?: string;
  vehicleNo?: string;
  orderNo?: string;
  amount?: number;
  nameCharges?: string;
  amountCharges?: number;
  munshayana?: number;
}

export interface BrokerSnapshot {
  name?: string;
  mobile?: string;
}

export interface BiltyPaymentInvoicePdfPayload {
  invoiceNo?: string;
  paymentDate?: string;
  bookingDate?: string;
  checkDate?: string;
  lines?: BiltyPaymentLineRow[];
  broker?: BrokerSnapshot;
}

const COMPANY_NAME = "AL NASAR BASHEER LOGISTICS";
const COMPANY_ADDRESS = "Suit No. 108, SP Chamber, Main Estate Avenue, SITE Karachi";
const COMPANY_PHONE = "Phone: +92 21 32550917-18";
const COMPANY_TAGLINE = "Reliable Transport & Logistics Solutions";
const LOGO_PATH = "/ABL-Logo.PNG";

const formatDisplayDate = (value?: string) => {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  const day = String(parsed.getDate()).padStart(2, "0");
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const year = parsed.getFullYear();
  return `${day}-${month}-${year}`;
};

const loadLogo = async () => {
  try {
    const response = await fetch(LOGO_PATH);
    if (!response.ok) throw new Error("Failed to fetch logo");
    const blob = await response.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.warn("Unable to fetch logo for Bilty Payment invoice:", error);
    return null;
  }
};

export const exportBiltyPaymentInvoicePdf = async (
  invoice: BiltyPaymentInvoicePdfPayload,
  filename?: string
) => {
  const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "A4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const marginX = 48;
  let cursorY = 60;

  // Draw header
  doc.setFillColor(58, 97, 76);
  doc.rect(0, 0, pageWidth, 80, "F");

  try {
    const logo = await loadLogo();
    if (logo) {
      doc.addImage(logo, "PNG", pageWidth - marginX - 80, 18, 70, 44);
    }
  } catch {
    /* handled in loader */
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  doc.text(COMPANY_NAME, marginX, 36);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(COMPANY_ADDRESS, marginX, 52);
  doc.text(COMPANY_PHONE, marginX, 66);

  // Move title and tagline further down
  cursorY += 56;

  doc.setFillColor(243, 244, 246);
  doc.roundedRect(marginX, cursorY, pageWidth - marginX * 2, 56, 10, 10, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(58, 97, 76);
  doc.text("Bilty Payment Invoice", pageWidth / 2, cursorY + 24, { align: "center" });

  doc.setFont("helvetica", "italic");
  doc.setFontSize(11);
  doc.setTextColor(99, 102, 106);
  doc.text(COMPANY_TAGLINE, pageWidth / 2, cursorY + 42, { align: "center" });

  cursorY += 76;

  const leftColumnX = marginX;
  const rightColumnX = pageWidth / 2 + 16;
  const columnGapY = 20;

  const drawLabelValue = (label: string, value?: string, x?: number, y?: number) => {
    if (typeof x === "number" && typeof y === "number") {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(55, 65, 81);
      doc.text(label, x, y);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(75, 85, 99);
      const display = value == null || value === "" ? "-" : String(value);
      doc.text(display, x, y + 14);
    }
  };

  const bookingDate = formatDisplayDate(invoice.bookingDate);
  const paymentDate = formatDisplayDate(invoice.paymentDate);
  const checkDate = invoice.checkDate ? formatDisplayDate(invoice.checkDate) : paymentDate;

  const firstRegularLine = invoice.lines?.find((line) => !line.isAdditionalLine);

  drawLabelValue("Booking Date", bookingDate, leftColumnX, cursorY);
  drawLabelValue("Invoice No", invoice.invoiceNo || "-", leftColumnX, cursorY + columnGapY * 2);
  drawLabelValue("Vehicle No", firstRegularLine?.vehicleNo || "-", leftColumnX, cursorY + columnGapY * 4);

  drawLabelValue("S / No", firstRegularLine?.orderNo || "-", rightColumnX, cursorY);
  drawLabelValue("Payment Date", paymentDate, rightColumnX, cursorY + columnGapY * 2);
  drawLabelValue("Check Date", checkDate, rightColumnX, cursorY + columnGapY * 4);

  cursorY += columnGapY * 6 + 16;

  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(1);
  doc.line(marginX, cursorY, pageWidth - marginX, cursorY);
  cursorY += 16;

  const head = [[
    "Bilty No",
    "Amount",
    "Extra Charges",
    "Ex-Amount Charges",
    "Munshayana",
  ]];

  const regularRows = (invoice.lines || [])
    .filter((line) => !line.isAdditionalLine)
    .map((line) => [
      line.orderNo || line.biltyNo || "-",
      (line.amount ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      "",
      "",
      (line.munshayana ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    ]);

  const additionalRows = (invoice.lines || [])
    .filter((line) => line.isAdditionalLine)
    .map((line) => [
      "", // Bilty No
      "", // Amount
      line.nameCharges || "", // Name Charges
      (line.amountCharges ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }), // Amount Charges
      "", // Munshayana
    ]);

  const body = [...regularRows, ...additionalRows];

  autoTable(doc, {
    startY: cursorY,
    head,
    body: body.length ? body : [["", "0.00", "", "0.00", "0.00"]],
    styles: {
      font: "helvetica",
      fontSize: 10,
      cellPadding: 8,
      lineColor: [229, 231, 235],
      lineWidth: 0.6,
      textColor: [31, 41, 55],
      halign: "center",
    },
    headStyles: {
      fillColor: [58, 97, 76],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 11,
    },
    alternateRowStyles: {
      fillColor: [243, 244, 246],
    },
    margin: { left: marginX, right: marginX },
    theme: "grid",
  });

  cursorY = (doc as any).lastAutoTable?.finalY || cursorY + 120;
  cursorY += 20;

  const totalRegular = (invoice.lines || []).reduce((acc, line) => acc + (!line.isAdditionalLine ? line.amount ?? 0 : 0), 0);
  const totalAdditional = (invoice.lines || []).reduce((acc, line) => acc + (line.isAdditionalLine ? line.amountCharges ?? 0 : 0), 0);
  const totalMunshayana = (invoice.lines || []).reduce((acc, line) => acc + (!line.isAdditionalLine ? line.munshayana ?? 0 : 0), 0);
  const netPayable = totalRegular + totalAdditional - totalMunshayana;

  const totalsBoxHeight = 90;
  doc.setFillColor(250, 250, 250);
  doc.roundedRect(pageWidth - marginX - 210, cursorY, 210, totalsBoxHeight, 8, 8, "F");
  doc.setDrawColor(229, 231, 235);
  doc.roundedRect(pageWidth - marginX - 210, cursorY, 210, totalsBoxHeight, 8, 8, "S");

  const totalsLines = [
    { label: "Bilty Amount", value: totalRegular },
    { label: "Additional Charges", value: totalAdditional },
    { label: "Munshayana Deduction", value: totalMunshayana },
    { label: "Net Payable", value: netPayable },
  ];

  totalsLines.forEach((item, index) => {
    const y = cursorY + 22 + index * 18;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(55, 65, 81);
    doc.text(item.label, pageWidth - marginX - 190, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(17, 24, 39);
    doc.text(
      (item.value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      pageWidth - marginX - 20,
      y,
      { align: "right" }
    );
  });

  cursorY += totalsBoxHeight + 40;

  const brokerBoxWidth = pageWidth - marginX * 2;
  doc.setDrawColor(229, 231, 235);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(marginX, cursorY, brokerBoxWidth, 120, 10, 10, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(58, 97, 76);
  doc.text("Broker Details", marginX + 18, cursorY + 24);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(55, 65, 81);
  doc.text(`Name: ${invoice.broker?.name || "-"}`, marginX + 18, cursorY + 44);
  doc.text(`Mobile No: ${invoice.broker?.mobile || "-"}`, marginX + 18, cursorY + 64);

  // Move "Authorized Signature" and line further down
  doc.setDrawColor(209, 213, 219);
  doc.line(pageWidth - marginX - 220, cursorY + 90, pageWidth - marginX - 40, cursorY + 90);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(107, 114, 128);
  doc.text("Authorized Signature", pageWidth - marginX - 130, cursorY + 106, { align: "center" });

  cursorY += 120 + 20;

  doc.setDrawColor(229, 231, 235);
  doc.line(marginX, cursorY, pageWidth - marginX, cursorY);
  doc.setFont("helvetica", "italic");
  doc.setFontSize(9);
  doc.setTextColor(156, 163, 175);
  doc.text("Thank you for your business", pageWidth / 2, cursorY + 16, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(156, 163, 175);
  const generatedInfo = `Generated on: ${new Date().toLocaleString("en-US", { timeZone: "Asia/Karachi" })}`;
  doc.text(generatedInfo, marginX, pageHeight - 24);
  doc.text("Page 1 of 1", pageWidth - marginX, pageHeight - 24, { align: "right" });

  const outputFilename = filename || `${invoice.invoiceNo || "BiltyPaymentInvoice"}.pdf`;
  try {
    doc.save(outputFilename);
  } catch (err) {
    try {
      const blob = doc.output("blob");
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = outputFilename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (innerErr) {
      console.error("Failed to save PDF", innerErr);
      throw innerErr;
    }
  }
};