'use client';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'react-toastify';

export interface VoucherTableRow {
  account1: string;
  debit1?: number;
  credit1?: number;
  narration?: string;
  account2: string;
  debit2?: number;
  credit2?: number;
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
  if (n < 0) return 'Minus ' + numberToWords(-n);

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

const safe = (v?: string | number | null) => (v === undefined || v === null || v === '' ? '-' : String(v));

export interface ExportParams {
  voucher: EntryVoucherDoc;
  accountIndex?: AccountIndex; // id -> {listid, description}
}

const EntryVoucherPDFExport = {
  exportToPDF: ({ voucher, accountIndex = {} }: ExportParams) => {
    try {
      if (!voucher) {
        toast('Voucher not found', { type: 'error' });
        return;
      }

      const doc = new jsPDF();

      // Header Title
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.setTextColor(33, 33, 33);
      doc.text('AL-NASSAR BASHIR LOGISTIC', 105, 16, { align: 'center' });

      doc.setFontSize(14);
      const mode = (voucher.paymentMode || 'Cash').toUpperCase();
      doc.text(`${mode} PAYMENT VOUCHER`, 105, 26, { align: 'center' });

      // Info as simple text instead of table
      const infoStartY = 34;
      const infoRows = [
        { leftLabel: 'Voucher #:', leftValue: safe(voucher.voucherNo), rightLabel: 'Date:', rightValue: formatDate(voucher.voucherDate) },
        { leftLabel: 'Reference:', leftValue: safe(voucher.referenceNo), rightLabel: 'Cheque No:', rightValue: safe(voucher.chequeNo) },
        { leftLabel: 'Deposit Slip No:', leftValue: safe(voucher.depositSlipNo), rightLabel: 'Ref Date:', rightValue: formatDate(voucher.chequeDate) },
        // { leftLabel: 'Bank Name:', leftValue: safe(voucher.bankName), rightLabel: 'Paid To:', rightValue: safe(voucher.paidTo) },
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

      // Table header: SNO | List ID | Description | Debit | Credit | Narration
      const tableHead = [['SNO', 'List ID', 'Description', 'Debit', 'Credit', 'Narration']];

      // Build table body by splitting account1/account2 into separate lines
      const body: (string | number)[][] = [];
      let sno = 1;
      let totalDebit = 0;
      let totalCredit = 0;

      const getAcc = (id?: string) => (id ? accountIndex[id] : undefined);

      (voucher.tableData || []).forEach((row) => {
        if (row.account1) {
          const acc = getAcc(row.account1);
          const listid = acc?.listid || '-';
          const desc = acc?.description || acc?.id || row.account1 || '-';
          const d = Number(row.debit1 || 0);
          const c = Number(row.credit1 || 0);
          totalDebit += d;
          totalCredit += c;
          body.push([
            String(sno++),
            listid,
            desc,
            d ? d.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-',
            c ? c.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-',
            safe(row.narration),
          ]);
        }
        if (row.account2) {
          const acc = getAcc(row.account2);
          const listid = acc?.listid || '-';
          const desc = acc?.description || acc?.id || row.account2 || '-';
          const d = Number(row.debit2 || 0);
          const c = Number(row.credit2 || 0);
          totalDebit += d;
          totalCredit += c;
          body.push([
            String(sno++),
            listid,
            desc,
            d ? d.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-',
            c ? c.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-',
            '',
          ]);
        }
      });

      if (body.length === 0) {
        body.push(['1', '', '', '', '', '']);
      }

      autoTable(doc, {
        startY: yPos,
        head: tableHead,
        body,
        foot: [[
          { content: 'TOTAL', colSpan: 3, styles: { halign: 'right', fontStyle: 'bold' } },
          totalDebit ? totalDebit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '',
          totalCredit ? totalCredit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '',
          '',
        ]],
        styles: {
          font: 'helvetica',
          fontSize: 9,
          cellPadding: { top: 3, bottom: 3, left: 3, right: 3 },
          lineColor: [210, 210, 210],
          lineWidth: 0.4,
          textColor: [50, 50, 50],
        },
        headStyles: {
          fillColor: [240, 240, 240],
          textColor: [33, 33, 33],
          fontSize: 9,
          fontStyle: 'bold',
        },
        footStyles: {
          fillColor: [240, 240, 240],
          textColor: [33, 33, 33],
          fontSize: 10,
          fontStyle: 'bold',
        },
        columnStyles: {
          0: { cellWidth: 14 },
          1: { cellWidth: 34 },
          2: { cellWidth: 38 },
          3: { cellWidth: 22, halign: 'right' },
          4: { cellWidth: 22, halign: 'right' },
          5: { cellWidth: 40 },
        },
        theme: 'grid',
        margin: { left: 12, right: 12 },
      });

      yPos = (doc as any).lastAutoTable.finalY + 8;

      // Amount in words and Narration
      const baseAmount = Math.max(totalDebit, totalCredit);
      const rounded = Math.round(baseAmount * 100) / 100;
      const integerPart = Math.floor(rounded);
      const decimalPart = Math.round((rounded - integerPart) * 100);
      const words = `${numberToWords(integerPart)}${decimalPart ? ' and ' + numberToWords(decimalPart) + ' Cents' : ''} Only`;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('Amount in Words:', 12, yPos);
      doc.setFont('helvetica', 'bold');
      doc.text(words, 50, yPos);
      yPos += 8;

      doc.setFont('helvetica', 'bold');
      doc.text('Narration:', 12, yPos);
      const currentDate = new Date();
      const printDateStr = formatDate(currentDate.toISOString());
      const printTimeStr = currentDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const narrationText = (voucher.narration || voucher.description || '-') + ` (Date ${printDateStr} at ${printTimeStr})`;
      doc.setFont('helvetica', 'bold');
      const narrationLines = doc.splitTextToSize(narrationText, 178);
      doc.text(narrationLines, 12, yPos + 6);
      yPos += 6 + narrationLines.length * 6 + 6;

      // Signatures
      const signY = yPos + 8;
      const labels = ['Prepared By', 'Checked By', 'Approved By', 'Received By'];
      const startX = 12;
      const colW = (210 - 24) / 4; // A4 width - margins

      doc.setDrawColor(160, 160, 160);
      labels.forEach((label, i) => {
        const x = startX + i * colW;
        doc.line(x, signY, x + colW - 6, signY); // signature line
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.text(label, x, signY + 5);
      });

      // Footer
      const footerY = 290;
      doc.setDrawColor(210, 210, 210);
      doc.line(12, footerY - 4, 198, footerY - 4);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(80, 80, 80);
      doc.text('Generated by ABL', 12, footerY);
      doc.text('Page 1 of 1', 198, footerY, { align: 'right' });

      const filename = `${mode}-PAYMENT-VOUCHER-${safe(voucher.voucherNo)}.pdf`;
      doc.save(filename);
      toast('Voucher PDF generated', { type: 'success' });
    } catch (error) {
      console.error('Failed to generate voucher PDF:', error);
      toast('Failed to generate voucher PDF', { type: 'error' });
    }
  },
};

export default EntryVoucherPDFExport;