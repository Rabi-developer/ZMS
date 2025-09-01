'use client';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'react-toastify';

export interface VoucherTableRow {
  account1: string;
  debit1?: number;
  credit1?: number;
  currentBalance1?: number;
  projectedBalance1?: number;
  narration?: string;
  account2: string;
  debit2?: number;
  credit2?: number;
  currentBalance2?: number;
  projectedBalance2?: number;
}

export interface EntryVoucherDoc {
  id?: string;
  voucherNo?: string;
  voucherDate?: string; // YYYY-MM-DD
  referenceNo?: string;
  chequeNo?: string;
  depositSlipNo?: string;
  paymentMode?: string; // e.g., Cash, Bank, Cheque
  bankName?: string;
  chequeDate?: string; // YYYY-MM-DD
  paidTo?: string; // Party/BA id or name
  narration?: string; // Header narration
  description?: string; // additional description
  // Approval/User trail (optional)
  preparedByName?: string;
  preparedAt?: string; // ISO datetime
  checkedByName?: string;
  checkedAt?: string; // ISO datetime
  approvedByName?: string;
  approvedAt?: string; // ISO datetime
  tableData: VoucherTableRow[];
}

export interface AccountIndexEntry {
  id: string;
  listid?: string;
  description?: string;
}

export type AccountIndex = Record<string, AccountIndexEntry>;

// Convert a number to words (basic, international scale)
const ones = [
  '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
  'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen',
];
const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

function numberToWords(n: number): string {
  if (!isFinite(n)) return '';
  if (n === 0) return 'Zero';
  // Use absolute value to handle negative numbers
  if (n < 0) return numberToWords(Math.abs(n));

  const scales = [
    { value: 1_000_000_000, name: 'Billion' },
    { value: 1_000_000, name: 'Million' },
    { value: 1_000, name: 'Thousand' },
    { value: 1, name: '' },
  ];

  const words: string[] = [];

  for (const scale of scales) {
    if (n >= scale.value) {
      const chunk = Math.floor(n / scale.value);
      n = n % scale.value;
      if (chunk > 0) {
        words.push(hundredsToWords(chunk));
        if (scale.name) words.push(scale.name);
      }
    }
  }

  return words.join(' ').trim();
}

function hundredsToWords(n: number): string {
  const parts: string[] = [];
  if (n >= 100) {
    parts.push(ones[Math.floor(n / 100)] + ' Hundred');
    n = n % 100;
  }
  if (n >= 20) {
    parts.push(tens[Math.floor(n / 10)]);
    if (n % 10) parts.push(ones[n % 10]);
  } else if (n > 0) {
    parts.push(ones[n]);
  }
  return parts.join(' ');
}

const formatDate = (iso?: string) => {
  if (!iso) return '-';
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).split('/').join('-');
  } catch {
    return '-';
  }
};

const formatDateTime = (iso?: string) => {
  if (!iso) return '-';
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '-';
    const date = d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).split('/').join('-');
    const time = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    return `${date} ${time}`;
  } catch {
    return '-';
  }
};

const safe = (v?: string | number | null) => (v === undefined || v === null ? '-' : String(v));

const formatNumber = (n?: number) =>
  n === undefined || n === null ? '-' : Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const formatString = (s?: string) => (s === undefined || s === null ? '-' : s);

export interface ExportParams {
  voucher: EntryVoucherDoc;
  accountIndex?: AccountIndex; // id -> {listid, description}
}

const EntryVoucherPDFExport = {
  renderVoucherToDoc: (doc: jsPDF, voucher: EntryVoucherDoc, accountIndex: AccountIndex = {}) => {
    console.log('Rendering Voucher:', JSON.stringify(voucher, null, 2)); // Debug log
    console.log('Account Index:', JSON.stringify(accountIndex, null, 2)); // Debug log

    // Header Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(33, 33, 33);
    doc.text('AL-NASSAR BASHIR LOGISTIC', 105, 16, { align: 'center' });

    doc.setFontSize(14);
    const mode = (voucher.paymentMode || 'Cash').toUpperCase();
    doc.text(`${mode} PAYMENT VOUCHER`, 105, 26, { align: 'center' });

    // Info as simple text
    const infoStartY = 34;
    const infoRows = [
      { leftLabel: 'Voucher #:', leftValue: safe(voucher.voucherNo), rightLabel: 'Date:', rightValue: formatDate(voucher.voucherDate) },
      { leftLabel: 'Reference:', leftValue: safe(voucher.referenceNo), rightLabel: 'Cheque No:', rightValue: safe(voucher.chequeNo) },
      { leftLabel: 'Deposit Slip No:', leftValue: safe(voucher.depositSlipNo), rightLabel: 'Ref Date:', rightValue: formatDate(voucher.chequeDate) },
    ];

    let currentY = infoStartY;
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);

    const leftLabelX = 12;
    const leftValueX = 50;
    const rightLabelX = 110;
    const rightValueX = 140;

    infoRows.forEach((row) => {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(33, 33, 33);
      doc.text(row.leftLabel, leftLabelX, currentY);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(60, 60, 60);
      doc.text(row.leftValue, leftValueX, currentY);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(33, 33, 33);
      doc.text(row.rightLabel, rightLabelX, currentY);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(60, 60, 60);
      doc.text(row.rightValue, rightValueX, currentY);
      currentY += 8;
    });

    let yPos = currentY + 8;

    // Table header
    const tableHead = [[
      'SNO',
      'ACCOUNT',
      'DEBIT',
      'CREDIT',
      // 'Current Bal 1',
      'BALANCE',
      'NARRATION',
      'ACCOUNT',
      'DEBIT',
      'CREDIT',
      // 'Current Bal 2',
      'BALANCE'
    ]];

    // Build table body
    const body: (string | number)[][] = [];
    let sno = 1;
    let totalDebit1 = 0;
    let totalCredit1 = 0;
    let totalDebit2 = 0;
    let totalCredit2 = 0;

    const getAcc = (id?: string) => (id ? accountIndex[id] : undefined);

    (voucher.tableData || []).forEach((row, index) => {
      console.log(`Table Row ${index}:`, JSON.stringify(row, null, 2)); // Debug log
      const acc1 = getAcc(row.account1);
      const acc1Desc = acc1?.description || acc1?.id || row.account1 || '-';
      const acc2 = getAcc(row.account2);
      const acc2Desc = acc2?.description || acc2?.id || row.account2 || '-';
      const d1 = Number(row.debit1 || 0);
      const c1 = Number(row.credit1 || 0);
      const cb1 = Number(row.currentBalance1 || 0);
      const pb1 = Number(row.projectedBalance1 || 0);
      const d2 = Number(row.debit2 || 0);
      const c2 = Number(row.credit2 || 0);
      const cb2 = Number(row.currentBalance2 || 0);
      const pb2 = Number(row.projectedBalance2 || 0);
      totalDebit1 += Math.abs(d1);
      totalCredit1 += Math.abs(c1);
      totalDebit2 += Math.abs(d2);
      totalCredit2 += Math.abs(c2);

      body.push([
        String(sno++),
        acc1Desc,
        formatNumber(d1),
        formatNumber(c1),
        // formatNumber(cb1),
        formatNumber(pb1),
        formatString(row.narration),
        acc2Desc,
        formatNumber(d2),
        formatNumber(c2),
        // formatNumber(cb2),
        formatNumber(pb2),
      ]);
    });

    if (body.length === 0) {
      console.log('No table data, adding empty row');
      body.push(['1', '', '', '', '', '', '', '', '', '']);
      toast('No voucher details to display', { type: 'warning' });
    }

    autoTable(doc, {
      startY: yPos,
      head: tableHead,
      body,
      foot: [[
        { content: 'TOTAL', colSpan: 2, styles: { halign: 'right', fontStyle: 'bold' } },
        formatNumber(totalDebit1),
        formatNumber(totalCredit1),
        formatNumber(0), // Placeholder for Current Bal 1
        '',
        '',
        formatNumber(totalDebit2),
        formatNumber(totalCredit2),
        formatNumber(0), // Placeholder for Current Bal 2
      ]],
      styles: {
        font: 'helvetica',
        fontSize: 5,
        cellPadding: { top: 2, bottom: 2, left: 1, right: 1 },
        lineColor: [150, 150, 150],
        lineWidth: 0.2,
        textColor: [50, 50, 50],
      },
      headStyles: {
        fillColor: [255, 255, 255],
        textColor: [33, 33, 33],
        fontSize: 7,
        fontStyle: 'bold',
        lineColor: [150, 150, 150],
        lineWidth: 0.2,
      },
      footStyles: {
        fillColor: [240, 240, 240],
        textColor: [33, 33, 33],
        fontSize: 6,
        fontStyle: 'bold',
        lineColor: [150, 150, 150],
        lineWidth: 0.2,
      },
      columnStyles: {
        0: { cellWidth: 10, halign: 'left' },
        1: { cellWidth: 28, halign: 'left' },
        2: { cellWidth: 17, halign: 'right' },
        3: { cellWidth: 17, halign: 'right' },
        4: { cellWidth: 18, halign: 'right' },
        5: { cellWidth: 28, halign: 'right' },
        6: { cellWidth: 28, halign: 'left' },
        7: { cellWidth: 17, halign: 'right' },
        8: { cellWidth: 17, halign: 'right' },
        9: { cellWidth: 18, halign: 'right' },
      },
      theme: 'grid',
      margin: { left: 8, right: 12 },
    });

    yPos = (doc as any).lastAutoTable.finalY + 8;

    // Amount in words and Narration
    const baseAmount = Math.max(totalDebit1 + totalDebit2, totalCredit1 + totalCredit2);
    const rounded = Math.round(baseAmount * 100) / 100;
    const integerPart = Math.floor(rounded);
    const decimalPart = Math.round((rounded - integerPart) * 100);
    const words = `${numberToWords(integerPart)}${decimalPart ? ' and ' + numberToWords(decimalPart) + ' Cents' : ''} Only`;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Amount in Words:', 12, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(words, 50, yPos);
    yPos += 8;

    doc.setFont('helvetica', 'bold');
    doc.text('Narration:', 12, yPos);
    const currentDate = new Date();
    const printDateStr = formatDate(currentDate.toISOString());
    const printTimeStr = currentDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const narrationText = (formatString(voucher.narration || voucher.description) || '-') + ` (Date ${printDateStr} at ${printTimeStr})`;
    doc.setFont('helvetica', 'normal');
    const narrationLines = doc.splitTextToSize(narrationText, 178);
    doc.text(narrationLines, 12, yPos + 6);
    yPos += 6 + narrationLines.length * 6 + 6;

    // Signatures
    const signY = yPos + 8;
    const labels = ['Prepared By', 'Checked By', 'Approved By', 'Received By'];
    const startX = 12;
    const colW = (210 - 24) / 4; // A4 width - margins

    const signInfo = [
      { name: voucher.preparedByName || '-', at: voucher.preparedAt },
      { name: voucher.checkedByName || '-', at: voucher.checkedAt },
      { name: voucher.approvedByName || '-', at: voucher.approvedAt },
      { name: '-', at: '' }, // Received By has no timestamp
    ];

    // Add "Name" title once at the start
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(45, 45, 45);
  

    doc.setDrawColor(160, 160, 160);
    labels.forEach((label, i) => {
      const x = startX + i * colW;
      // Signature line
      doc.line(x, signY, x + colW - 6, signY);

      // Role label
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(33, 33, 33);
      doc.text(label, x, signY + 5);

      // User name
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(60, 60, 60);
      const name = signInfo[i].name;
      doc.text(name, x, signY + 11);
      doc.text('Name:', startX, signY - 4);

      // Timestamp
      const whenDate = signInfo[i].at ? formatDateTime(signInfo[i].at as string) : '-';
      if (whenDate !== '-') {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text(whenDate, x, signY + 16);
      }

      // Horizontal line under info
      doc.setDrawColor(200, 200, 200);
      doc.line(x, signY + 19, x + colW - 6, signY + 19);
    });

    // Footer
    const footerY = 290;
    doc.setDrawColor(210, 210, 210);
    doc.line(12, footerY - 4, 198, footerY - 4);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(80, 80, 80);
    doc.text('Generated by ABL', 12, footerY);
  },

  exportToPDF: ({ voucher, accountIndex = {} }: ExportParams) => {
    try {
      if (!voucher) {
        toast('Voucher not found', { type: 'error' });
        return;
      }
      if (!voucher.tableData || voucher.tableData.length === 0) {
        toast('No table data found in voucher', { type: 'warning' });
      }

      const doc = new jsPDF();
      EntryVoucherPDFExport.renderVoucherToDoc(doc, voucher, accountIndex);

      const mode = (voucher.paymentMode || 'Cash').toUpperCase();
      const filename = `${mode}-PAYMENT-VOUCHER-${safe(voucher.voucherNo)}.pdf`;
      doc.save(filename);
      toast('Voucher PDF generated', { type: 'success' });
    } catch (error) {
      console.error('Failed to generate voucher PDF:', error);
      toast('Failed to generate voucher PDF', { type: 'error' });
    }
  },

  exportManyToPDF: ({ vouchers, accountIndex = {}, filename = 'EntryVouchers.pdf' }: { vouchers: EntryVoucherDoc[]; accountIndex?: AccountIndex; filename?: string; }) => {
    try {
      if (!vouchers || vouchers.length === 0) {
        toast('No vouchers to export', { type: 'warning' });
        return;
      }
      const doc = new jsPDF();
      vouchers.forEach((v, idx) => {
        if (idx > 0) doc.addPage();
        EntryVoucherPDFExport.renderVoucherToDoc(doc, v, accountIndex);
      });
      doc.save(filename);
      toast('Vouchers PDF generated', { type: 'success' });
    } catch (error) {
      console.error('Failed to generate vouchers PDF:', error);
      toast('Failed to generate vouchers PDF', { type: 'error' });
    }
  },
};

export default EntryVoucherPDFExport;