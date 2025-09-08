"use client";
import React, { useEffect, useMemo, useState } from "react";
import MainLayout from "@/components/MainLayout/MainLayout";
import { Button } from "@/components/ui/button";
import { toast } from "react-toastify";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { getAllConsignment } from "@/apis/consignment";
import { getAllPaymentABL } from "@/apis/paymentABL";
import { FiSearch } from "react-icons/fi";

// Extend jsPDF type to include getNumberOfPages method
declare module 'jspdf' {
  interface jsPDF {
    getNumberOfPages(): number;
  }
}

// Types based on Consignment & PaymentABL forms
interface ConsignmentItem {
  qty?: number;
  rate?: number;
}
interface ConsignmentRow {
  id?: string;
  biltyNo?: string;
  orderNo?: string;
  date?: string; // base date
  consignee?: string;
  consignor?: string;
  creditAllowed?: string; // days (string)
  items?: ConsignmentItem[];
}
interface PaymentRow {
  id?: string;
  paymentNo?: string;
  paymentDate?: string;
  paymentAmount?: number; // advanced + pdc
  advanced?: number;
  pdc?: number;
}
interface AgingRow {
  biltyNo: string;
  orderNo: string;
  date: string; // yyyy-mm-dd
  creditAllowedDays: number;
  dueDate: string; // yyyy-mm-dd
  agingDays: number;
  consignee: string;
  consignor: string;
  qty: number;
  rateTotal: number;
  invoiceAmount: number; // (Sum of Qty) * (Sum of Rate)
  sbrAmount: number; // 15% of invoiceAmount
  whtAmount: number; // WHT% of sbrAmount
  total: number; // invoiceAmount + sbrAmount - whtAmount
  advanced: number;
  pdc: number;
  paymentAmount: number; // advanced + pdc
  notDue: number; // Based on invoiceAmount
  overDue: number; // Based on invoiceAmount
}

interface Column {
  key: keyof AgingRow;
  label: string;
  type: 'string' | 'number';
  align: 'left' | 'right';
  filterType: 'text' | 'select-multiple';
}

// Export helpers
const COMPANY_NAME = 'AL-NASAR BASHEER LOGISTICS';
const COMPANY_ADDRESS = 'Suit No. 108, S.P Chamber, 1st Floor, Plot No B-9/B-1 Near Habib Bank Chowrangi, S.I.T.E, Karachi, Pakistan';
const COMPANY_COLOR = { r: 46, g: 153, b: 172 }; // #2e99ac
const BG_TEAL_100 = { r: 224, g: 242, b: 241 }; // bg-teal-100

const fmt = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const toDate = (s?: string): Date | null => (s ? new Date(s) : null);
const addDays = (d: Date, days: number) => { const nd = new Date(d); nd.setDate(nd.getDate() + days); return nd; };
const ymd = (d: Date) => d.toISOString().slice(0, 10);

const exportToPDF = (rows: AgingRow[], displayedColumns: Column[], dateFrom: string, dateTo: string, filter: string) => {
  const doc = new jsPDF({ orientation: 'landscape' });
  let y = 20;

  // Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(COMPANY_COLOR.r, COMPANY_COLOR.g, COMPANY_COLOR.b);
  doc.text(COMPANY_NAME.toUpperCase(), 148.5, y, { align: 'center' });
  const cw = doc.getTextWidth(COMPANY_NAME.toUpperCase());
  doc.setDrawColor(COMPANY_COLOR.r, COMPANY_COLOR.g, COMPANY_COLOR.b);
  doc.setLineWidth(0.4);
  doc.line(148.5 - cw / 2, y + 1.5, 148.5 + cw / 2, y + 1.5);
  y += 7;

  // Aging Report heading
  doc.setFontSize(11);
  doc.setTextColor(COMPANY_COLOR.r, COMPANY_COLOR.g, COMPANY_COLOR.b);
  doc.text('AGING REPORT', 148.5, y, { align: 'center' });
  y += 4;

  // Date range and filter
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);
  const dateRange = `From ${dateFrom || '-'} To ${dateTo || '-'}`;
  doc.text(dateRange, 148.5, y, { align: 'center' });
  y += 4;
  if (filter !== 'Both') {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(`Filter: ${filter}`, 148.5, y, { align: 'center' });
    y += 8;
  } else {
    y += 4;
  }

  // Table
  const head = displayedColumns.map(c => c.label);
  const body = rows.map((r) => displayedColumns.map(c => c.type === 'number' ? fmt(Number(r[c.key])) : r[c.key]));

  autoTable(doc, {
    startY: y,
    head: [head],
    body,
    headStyles: {
      fillColor: [COMPANY_COLOR.r, COMPANY_COLOR.g, COMPANY_COLOR.b],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 6,
      cellPadding: 1,
    },
    bodyStyles: {
      fontSize: 6,
      textColor: [0, 0, 0],
      cellPadding: 1,
      fillColor: [255, 255, 255],
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
    theme: 'grid',
    margin: { left: 5, right: 5 },
  });

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const addressLines = doc.splitTextToSize(COMPANY_ADDRESS, pageWidth - 20);
    const addrY = pageHeight - 10 - (addressLines.length - 1) * 4;
    doc.text(addressLines, pageWidth / 2, addrY, { align: 'center' });
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - 10, pageHeight - 6, { align: 'right' });
  }

  doc.save(`Aging-Report-${new Date().toISOString().slice(0, 10)}.pdf`);
};

const exportToExcel = (rows: AgingRow[], displayedColumns: Column[], dateFrom: string, dateTo: string, filter: string) => {
  const wb = XLSX.utils.book_new();
  const wsData: any[][] = [];
  wsData.push([COMPANY_NAME]);
  wsData.push(['AGING REPORT']);
  wsData.push([`From ${dateFrom || '-'} To ${dateTo || '-'}`]);
  if (filter !== 'Both') wsData.push([`Filter: ${filter}`]);
  wsData.push([]);
  wsData.push(displayedColumns.map(c => c.label));
  rows.forEach((r) => {
    wsData.push(displayedColumns.map(c => c.type === 'number' ? Number(r[c.key]) : r[c.key]));
  });

  const ws = XLSX.utils.aoa_to_sheet(wsData);
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: displayedColumns.length - 1 } }, // Company name
    { s: { r: 1, c: 0 }, e: { r: 1, c: displayedColumns.length - 1 } }, // Report title
    { s: { r: 2, c: 0 }, e: { r: 2, c: displayedColumns.length - 1 } }, // Date range
  ];
  if (filter !== 'Both') {
    ws['!merges'].push({ s: { r: 3, c: 0 }, e: { r: 3, c: displayedColumns.length - 1 } }); // Filter
  }

  ws['!cols'] = Array(displayedColumns.length).fill({ wch: 10 });

  const firstDataRow = filter !== 'Both' ? 6 : 5;
  const ref = ws['!ref'] as string | undefined;
  const endRow = ref ? XLSX.utils.decode_range(ref).e.r : 0;
  for (let R = firstDataRow; R <= endRow; R++) {
    for (let C = 0; C < displayedColumns.length; C++) {
      const cell = XLSX.utils.encode_cell({ r: R, c: C });
      if (ws[cell] && typeof ws[cell].v === 'number') {
        ws[cell].t = 'n';
        ws[cell].z = '#,##0.00';
      }
    }
  }

  XLSX.utils.book_append_sheet(wb, ws, 'Aging Report');
  XLSX.writeFile(wb, `Aging-Report-${new Date().toISOString().slice(0, 10)}.xlsx`);
};

const exportToWord = (rows: AgingRow[], displayedColumns: Column[], dateFrom: string, dateTo: string, filter: string) => {
  const css = `table{border-collapse:collapse;width:100%;margin:0 auto}th,td{border:1px solid #555;padding:3px;font-size:8px}th{background-color:#2e99ac;color:#fff;font-weight:bold}tr:nth-child(even){background-color:#e6f7f8}`;
  const header = `<h2 style="text-align:center;margin:4px 0;color:#2e99ac">${COMPANY_NAME}</h2><h3 style="text-align:center;margin:6px 0;color:#2e99ac">AGING REPORT</h3><div style="text-align:center">${`From ${dateFrom || '-'} To ${dateTo || '-'}`}</div>${filter !== 'Both' ? `<div style="text-align:center;margin:2px 0;font-size:8px">Filter: ${filter}</div>` : ''}`;
  const tableHead = `<tr>${displayedColumns.map(c => `<th style="text-align:${c.align}">${c.label}</th>`).join('')}</tr>`;
  const rowsHtml = rows.map((r, idx) => `<tr style="background-color:${idx % 2 === 0 ? '#fff' : '#e6f7f8'}">${displayedColumns.map(c => `<td style="text-align:${c.align}">${c.type === 'number' ? fmt(Number(r[c.key])) : r[c.key]}</td>`).join('')}</tr>`).join('');
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8" /><style>${css}</style></head><body>${header}<hr style="border-color:#2e99ac"/><table>${tableHead}${rowsHtml}</table></body></html>`;
  const blob = new Blob([html], { type: 'application/msword' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Aging-Report-${new Date().toISOString().slice(0, 10)}.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export default function AgingReportPage() {
  const columns: Column[] = [
    { key: 'biltyNo', label: 'Bilty No', type: 'string', align: 'left', filterType: 'select-multiple' },
    { key: 'orderNo', label: 'Order No', type: 'string', align: 'left', filterType: 'select-multiple' },
    { key: 'date', label: 'Date', type: 'string', align: 'left', filterType: 'text' },
    { key: 'creditAllowedDays', label: 'Credit Allowed', type: 'number', align: 'right', filterType: 'text' },
    { key: 'dueDate', label: 'Due Date', type: 'string', align: 'left', filterType: 'text' },
    { key: 'agingDays', label: 'Aging Days', type: 'number', align: 'right', filterType: 'text' },
    { key: 'consignee', label: 'Consignee', type: 'string', align: 'left', filterType: 'select-multiple' },
    { key: 'consignor', label: 'Consignor', type: 'string', align: 'left', filterType: 'select-multiple' },
    { key: 'qty', label: 'Qty', type: 'number', align: 'right', filterType: 'text' },
    { key: 'rateTotal', label: 'Rate', type: 'number', align: 'right', filterType: 'text' },
    { key: 'invoiceAmount', label: 'Invoice Amount', type: 'number', align: 'right', filterType: 'text' },
    { key: 'sbrAmount', label: 'SBR Amount', type: 'number', align: 'right', filterType: 'text' },
    { key: 'whtAmount', label: 'WHT Amount', type: 'number', align: 'right', filterType: 'text' },
    { key: 'total', label: 'Total', type: 'number', align: 'right', filterType: 'text' },
    { key: 'advanced', label: 'Advanced', type: 'number', align: 'right', filterType: 'text' },
    { key: 'pdc', label: 'PDC', type: 'number', align: 'right', filterType: 'text' },
    { key: 'paymentAmount', label: 'Payment Amount', type: 'number', align: 'right', filterType: 'text' },
    { key: 'notDue', label: 'Not Due', type: 'number', align: 'right', filterType: 'text' },
    { key: 'overDue', label: 'Over Due', type: 'number', align: 'right', filterType: 'text' },
  ];

  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<AgingRow[]>([]);
  const [filter, setFilter] = useState<"Both" | "Over Due" | "Not Due">("Both");
  const [whtPercent, setWhtPercent] = useState<number>(2);
  const [paymentMatchKey, setPaymentMatchKey] = useState<"orderNo" | "biltyNo">("biltyNo");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [biltyNoFilter, setBiltyNoFilter] = useState<string>("");
  const [orderNoFilter, setOrderNoFilter] = useState<string>("");
  const [consigneeFilter, setConsigneeFilter] = useState<string>("");
  const [consignorFilter, setConsignorFilter] = useState<string>("");
  const [visibleColumns, setVisibleColumns] = useState<string[]>(columns.map(c => c.key));
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
  const [showConfig, setShowConfig] = useState(false);
  const [savedVisibleColumns, setSavedVisibleColumns] = useState<string[]>(columns.map(c => c.key));

  useEffect(() => {
    const savedColumns = localStorage.getItem('agingVisibleColumns');
    if (savedColumns) {
      const parsed = JSON.parse(savedColumns);
      setVisibleColumns(parsed);
      setSavedVisibleColumns(parsed);
    } else {
      setVisibleColumns(columns.map(c => c.key));
      setSavedVisibleColumns(columns.map(c => c.key));
    }
    const savedFilters = localStorage.getItem('agingColumnFilters');
    if (savedFilters) {
      setColumnFilters(JSON.parse(savedFilters));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('agingVisibleColumns', JSON.stringify(savedVisibleColumns));
  }, [savedVisibleColumns]);

  useEffect(() => {
    // Update visibleColumns based on biltyNoFilter, orderNoFilter, consigneeFilter, or consignorFilter
    if (biltyNoFilter) {
      setVisibleColumns(['biltyNo']);
    } else if (orderNoFilter) {
      setVisibleColumns(['orderNo']);
    } else if (consigneeFilter || consignorFilter) {
      setVisibleColumns(['consignee', 'consignor']);
    } else {
      setVisibleColumns(savedVisibleColumns);
    }
  }, [biltyNoFilter, orderNoFilter, consigneeFilter, consignorFilter, savedVisibleColumns]);

  useEffect(() => {
    localStorage.setItem('agingColumnFilters', JSON.stringify(columnFilters));
  }, [columnFilters]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [consRes, payRes] = await Promise.all([
          getAllConsignment(1, 1000),
          getAllPaymentABL(1, 1000),
        ]);
        const consignments: ConsignmentRow[] = consRes?.data || [];
        const payments: PaymentRow[] = payRes?.data || [];

        const orderByBilty: Record<string, string> = {};
        for (const c of consignments) {
          const b = (c.biltyNo || "").trim();
          const o = (c.orderNo || "").trim();
          if (b && o) orderByBilty[b] = o;
        }

        const paymentsByOrder: Record<string, PaymentRow[]> = {};
        for (const p of payments) {
          const key = (p as any)?.orderNo || "";
          if (!key) continue;
          (paymentsByOrder[key] ||= []).push(p);
        }

        const now = new Date();
        const computed: AgingRow[] = [];
        for (const c of consignments) {
          const biltyNo = c.biltyNo || c.orderNo || "";
          const orderNo = c.orderNo || orderByBilty[c.biltyNo || ""] || "";
          const baseDate = toDate(c.date) || new Date();
          const creditDays = parseInt(String(c.creditAllowed || "0")) || 0;
          const dueDate = addDays(baseDate, creditDays);
          const items = c.items || [];
          const qty = items.reduce((s, it) => s + (Number(it.qty) || 0), 0); // Total Qty
          const rateTotal = items.reduce((s, it) => s + (Number(it.rate) || 0), 0); // Total Rate
          const invoiceAmount = qty * rateTotal; // (Sum of Qty) * (Sum of Rate)
          const sbrAmount = invoiceAmount * 0.15; // 15% of invoiceAmount
          const whtAmount = sbrAmount * (whtPercent / 100); // WHT% of sbrAmount
          const total = invoiceAmount + sbrAmount - whtAmount; // Total including SBR and WHT

          const keyToMatch = paymentMatchKey === "biltyNo" ? (orderByBilty[biltyNo || ""] || orderNo) : orderNo;
          const ps = keyToMatch ? (paymentsByOrder[keyToMatch] || []) : [];
          const advanced = ps.reduce((s, p) => s + (Number(p.advanced) || 0), 0);
          const pdc = ps.reduce((s, p) => s + (Number(p.pdc) || 0), 0);
          const paymentAmount = advanced + pdc;

          const todayYmd = ymd(now);
          const dueYmd = ymd(dueDate);
          const today = new Date(todayYmd);
          const due = new Date(dueYmd);
          const dateForYoung = baseDate;
          const daysBetween = (d1: Date, d2: Date) => Math.floor((d1.getTime() - d2.getTime()) / (1000 * 60 * 60 * 24));
          const agingDays = today <= due ? daysBetween(today, dateForYoung) : daysBetween(today, due);

          // Calculate notDue and overDue based on invoiceAmount
          const outstanding = Math.max(0, invoiceAmount - paymentAmount);
          const notDue = today < due ? outstanding : 0;
          const overDue = today >= due ? outstanding : 0;

          computed.push({
            biltyNo,
            orderNo,
            date: ymd(baseDate),
            creditAllowedDays: creditDays,
            dueDate: ymd(dueDate),
            agingDays: Math.max(0, agingDays),
            consignee: c.consignee || "",
            consignor: c.consignor || "",
            qty,
            rateTotal,
            invoiceAmount,
            sbrAmount,
            whtAmount,
            total,
            advanced,
            pdc,
            paymentAmount,
            notDue,
            overDue,
          });
        }
        setRows(computed);
      } catch (e) {
        toast.error("Failed to load aging data");
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [whtPercent, paymentMatchKey]);

  const uniqueValues = useMemo(() => {
    const u: Record<string, Set<string>> = {};
    columns.forEach((c) => (u[c.key] = new Set()));
    rows.forEach((r) => {
      columns.forEach((c) => u[c.key].add(String(r[c.key])));
    });
    return u;
  }, [rows]);

  const filtered = useMemo(() => {
    let result = rows;

    // Only apply filters if they are explicitly set
    const hasFilters = dateFrom || dateTo || filter !== "Both" || biltyNoFilter || orderNoFilter || consigneeFilter || consignorFilter || Object.keys(columnFilters).length > 0;

    if (hasFilters) {
      if (dateFrom) {
        result = result.filter((r) => new Date(r.date) >= new Date(dateFrom));
      }
      if (dateTo) {
        const to = new Date(dateTo);
        to.setHours(23, 59, 59, 999);
        result = result.filter((r) => new Date(r.date) <= to);
      }
      if (filter !== "Both") {
        const now = new Date();
        result = result.filter((r) => {
          const due = new Date(r.dueDate);
          return filter === "Over Due" ? now >= due : now < due;
        });
      }
      if (biltyNoFilter) {
        result = result.filter((r) => r.biltyNo.toLowerCase() === biltyNoFilter.toLowerCase());
      }
      if (orderNoFilter) {
        result = result.filter((r) => r.orderNo.toLowerCase() === orderNoFilter.toLowerCase());
      }
      if (consigneeFilter) {
        result = result.filter((r) => r.consignee.toLowerCase().includes(consigneeFilter.toLowerCase()));
      }
      if (consignorFilter) {
        result = result.filter((r) => r.consignor.toLowerCase().includes(consignorFilter.toLowerCase()));
      }
      result = result.filter((r) =>
        Object.keys(columnFilters).every((key) => {
          const filterVal = columnFilters[key] || "";
          if (!filterVal) return true;
          const rVal = String(r[key as keyof AgingRow]).toLowerCase();
          const col = columns.find((cc) => cc.key === key);
          if (col?.filterType === "select-multiple") {
            const selected = filterVal.toLowerCase().split(",");
            return selected.includes(rVal);
          } else {
            return rVal.includes(filterVal.toLowerCase());
          }
        })
      );
    }

    return result;
  }, [rows, filter, dateFrom, dateTo, biltyNoFilter, orderNoFilter, consigneeFilter, consignorFilter, columnFilters]);

  const displayedColumns = useMemo(() => {
    return visibleColumns.map((key) => columns.find((c) => c.key === key)!).filter(Boolean);
  }, [visibleColumns]);

  // Filter out biltyNo, orderNo, consignee, and consignor from table header filters
  const tableFilterColumns = useMemo(() => {
    return displayedColumns.filter((c) => !['biltyNo', 'orderNo', 'consignee', 'consignor'].includes(c.key));
  }, [displayedColumns]);

  const titleLine = useMemo(() => {
    const f = dateFrom ? new Date(dateFrom).toLocaleDateString("en-GB").split("/").join("-") : "-";
    const t = dateTo ? new Date(dateTo).toLocaleDateString("en-GB").split("/").join("-") : "-";
    return `Aging Report From ${f} To ${t}`;
  }, [dateFrom, dateTo]);

  const filterSummary = useMemo(() => {
    return filter !== "Both" ? `Filter: ${filter}` : "";
  }, [filter]);

  const clearFilters = () => {
    setFilter("Both");
    setDateFrom("");
    setDateTo("");
    setBiltyNoFilter("");
    setOrderNoFilter("");
    setConsigneeFilter("");
    setConsignorFilter("");
    setWhtPercent(2);
    setPaymentMatchKey("biltyNo");
    setColumnFilters({});
    setVisibleColumns(savedVisibleColumns);
  };

  const moveColumn = (idx: number, direction: "up" | "down") => {
    const newArr = [...savedVisibleColumns];
    if (direction === "up" && idx > 0) {
      [newArr[idx - 1], newArr[idx]] = [newArr[idx], newArr[idx - 1]];
    } else if (direction === "down" && idx < newArr.length - 1) {
      [newArr[idx], newArr[idx + 1]] = [newArr[idx + 1], newArr[idx]];
    }
    setSavedVisibleColumns(newArr);
    if (!biltyNoFilter && !orderNoFilter && !consigneeFilter && !consignorFilter) {
      setVisibleColumns(newArr);
    }
  };

  const toggleColumn = (key: string, show: boolean) => {
    let newSavedColumns: string[];
    if (show) {
      newSavedColumns = [...savedVisibleColumns, key];
    } else {
      newSavedColumns = savedVisibleColumns.filter((k) => k !== key);
    }
    setSavedVisibleColumns(newSavedColumns);
    if (!biltyNoFilter && !orderNoFilter && !consigneeFilter && !consignorFilter) {
      setVisibleColumns(newSavedColumns);
    }
  };

  const hiddenColumns = columns.filter((c) => !savedVisibleColumns.includes(c.key));

  return (
    <MainLayout activeInterface="ABL">
      <div className="p-3 md:p-5 bg-teal-50 dark:bg-gray-900">
        {/* Filter Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border-2 border-teal-200 dark:border-teal-900 mb-4 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 dark:border-teal-900 bg-teal-100 dark:bg-teal-950">
            <h1 className="text-lg font-semibold text-teal-900 dark:text-teal-200">Aging Report</h1>
            <p className="text-sm font-bold text-teal-700 dark:text-teal-300">{COMPANY_NAME}</p>
          </div>
          <div className="p-4 flex flex-col gap-3">
            <div className="flex flex-col md:flex-row md:items-end gap-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 flex-1">
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-300">Filter</label>
                  <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value as any)}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white rounded-md focus:ring-teal-600 focus:border-teal-600"
                  >
                    <option>Both</option>
                    <option>Over Due</option>
                    <option>Not Due</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-300">Date From</label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white rounded-md focus:ring-teal-600 focus:border-teal-600"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-300">Date To</label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white rounded-md focus:ring-teal-600 focus:border-teal-600"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-300">Bilty No</label>
                  <select
                    value={biltyNoFilter}
                    onChange={(e) => {
                      setBiltyNoFilter(e.target.value);
                      if (e.target.value && orderNoFilter) {
                        setOrderNoFilter("");
                      }
                    }}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white rounded-md focus:ring-teal-600 focus:border-teal-600"
                  >
                    <option value="">All</option>
                    {Array.from(uniqueValues.biltyNo || []).sort().map((v) => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-300">Order No</label>
                  <select
                    value={orderNoFilter}
                    onChange={(e) => {
                      setOrderNoFilter(e.target.value);
                      if (e.target.value && biltyNoFilter) {
                        setBiltyNoFilter("");
                      }
                    }}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white rounded-md focus:ring-teal-600 focus:border-teal-600"
                  >
                    <option value="">All</option>
                    {Array.from(uniqueValues.orderNo || []).sort().map((v) => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-300">Consignee</label>
                  <select
                    value={consigneeFilter}
                    onChange={(e) => setConsigneeFilter(e.target.value)}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white rounded-md focus:ring-teal-600 focus:border-teal-600"
                  >
                    <option value="">All</option>
                    {Array.from(uniqueValues.consignee || []).sort().map((v) => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-300">Consignor</label>
                  <select
                    value={consignorFilter}
                    onChange={(e) => setConsignorFilter(e.target.value)}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white rounded-md focus:ring-teal-600 focus:border-teal-600"
                  >
                    <option value="">All</option>
                    {Array.from(uniqueValues.consignor || []).sort().map((v) => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-300">WHT %</label>
                  <select
                    value={whtPercent}
                    onChange={(e) => setWhtPercent(Number(e.target.value))}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white rounded-md focus:ring-teal-600 focus:border-teal-600"
                  >
                    {Array.from({ length: 17 }).map((_, i) => {
                      const val = i + 2; // 2..18
                      return <option key={val} value={val}>{val}%</option>;
                    })}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-300">Match Payments By</label>
                  <select
                    value={paymentMatchKey}
                    onChange={(e) => setPaymentMatchKey(e.target.value as any)}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white rounded-md focus:ring-teal-600 focus:border-teal-600"
                  >
                    <option value="biltyNo">Bilty No</option>
                    <option value="orderNo">Order No</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={clearFilters}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-300 px-3 py-2 rounded-md"
                >
                  Clear
                </Button>
                <Button
                  onClick={() => {
                    setWhtPercent((prev) => prev);
                  }}
                  className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-md flex items-center gap-2"
                >
                  <FiSearch />
                  Run Report
                </Button>
              </div>
            </div>

            <div className="pt-3 flex flex-wrap items-center justify-between gap-2 border-t border-teal-200 dark:border-teal-900 mt-3">
              <div className="text-xs text-gray-500 dark:text-gray-400">Tip: Use filters to refine the aging report data.</div>
              <div className="flex gap-2">
                <Button
                  onClick={() => setShowConfig(true)}
                  className="bg-teal-600 hover:bg-teal-700 text-white px-3 py-2 rounded-md"
                >
                  Configure Columns
                </Button>
                <Button
                  onClick={() => exportToPDF(filtered, displayedColumns, dateFrom, dateTo, filter)}
                  className="bg-teal-600 hover:bg-teal-700 text-white px-3 py-2 rounded-md"
                >
                  Export PDF
                </Button>
                <Button
                  onClick={() => exportToExcel(filtered, displayedColumns, dateFrom, dateTo, filter)}
                  className="bg-cyan-600 hover:bg-cyan-700 text-white px-3 py-2 rounded-md"
                >
                  Export Excel
                </Button>
                <Button
                  onClick={() => exportToWord(filtered, displayedColumns, dateFrom, dateTo, filter)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-md"
                >
                  Export Word
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Table Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow border border-teal-200 dark:border-teal-900">
          <div className="px-4 py-3 flex justify-between border-b border-gray-200 dark:border-teal-900 bg-teal-100 dark:bg-teal-950">
            <h2 className="text-base font-semibold text-teal-900 dark:text-teal-200">{COMPANY_NAME}</h2>
            <div className="text-xs text-teal-700 dark:text-teal-300">{titleLine}</div>
          </div>
          {loading ? (
            <div className="px-4 py-6 text-center text-teal-600 dark:text-teal-300">Loading...</div>
          ) : rows.length === 0 ? (
            <div className="px-4 py-6 text-center text-gray-500 dark:text-gray-400">No data</div>
          ) : (
            <div className="p-4">
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm border-collapse">
                  <thead className="bg-teal-100 dark:bg-teal-950">
                    <tr>
                      {displayedColumns.map((c) => (
                        <th
                          key={c.key}
                          className="px-2 py-2 text-left font-medium text-teal-900 dark:text-teal-200 border border-gray-200 dark:border-teal-900"
                          style={{ textAlign: c.align }}
                        >
                          {c.label}
                        </th>
                      ))}
                    </tr>
                    <tr>
                      {displayedColumns.map((c) => (
                        <th key={`f-${c.key}`} className="px-1 py-1 border border-gray-200 dark:border-teal-900">
                          {tableFilterColumns.find((tc) => tc.key === c.key) ? (
                            c.filterType === "select-multiple" ? (
                              <select
                                multiple
                                size={3}
                                value={columnFilters[c.key]?.split(",") || []}
                                onChange={(e) =>
                                  setColumnFilters({
                                    ...columnFilters,
                                    [c.key]: Array.from(e.target.selectedOptions, (o) => o.value).join(","),
                                  })
                                }
                                className="w-full p-1 text-sm border rounded bg-white dark:bg-gray-700 dark:text-white focus:ring-teal-600 focus:border-teal-600"
                              >
                                {Array.from(uniqueValues[c.key] || [])
                                  .sort()
                                  .map((v) => (
                                    <option key={v} value={v}>
                                      {v}
                                    </option>
                                  ))}
                              </select>
                            ) : (
                              <input
                                type="text"
                                value={columnFilters[c.key] || ""}
                                onChange={(e) => setColumnFilters({ ...columnFilters, [c.key]: e.target.value })}
                                className="w-full p-1 text-sm border rounded bg-white dark:bg-gray-700 dark:text-white focus:ring-teal-600 focus:border-teal-600"
                              />
                            )
                          ) : null}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((r, idx) => (
                      <tr
                        key={idx}
                        className={idx % 2 === 0 ? "bg-white dark:bg-gray-800" : "bg-teal-50 dark:bg-gray-700/40"}
                      >
                        {displayedColumns.map((c) => (
                          <td
                            key={c.key}
                            className="px-2 py-1 border border-gray-200 dark:border-teal-900"
                            style={{ textAlign: c.align }}
                          >
                            {c.type === "number" ? fmt(Number(r[c.key])) : r[c.key]}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {showConfig && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg max-h-[80vh] overflow-auto w-96">
              <h3 className="text-lg font-semibold mb-4 text-teal-900 dark:text-teal-200">Configure Columns</h3>
              <div className="mb-4">
                <h4 className="text-sm font-medium mb-2">Visible Columns</h4>
                {savedVisibleColumns.map((key, idx) => {
                  const c = columns.find((cc) => cc.key === key);
                  return (
                    <div key={key} className="flex items-center gap-2 mb-2">
                      <input
                        type="checkbox"
                        checked={true}
                        onChange={(e) => toggleColumn(key, e.target.checked)}
                        className="form-checkbox"
                      />
                      <span className="flex-1">{c?.label}</span>
                      <Button
                        onClick={() => moveColumn(idx, "up")}
                        disabled={idx === 0}
                        className="bg-teal-600 hover:bg-teal-700 text-white px-2 py-1 rounded text-xs"
                      >
                        Up
                      </Button>
                      <Button
                        onClick={() => moveColumn(idx, "down")}
                        disabled={idx === savedVisibleColumns.length - 1}
                        className="bg-teal-600 hover:bg-teal-700 text-white px-2 py-1 rounded text-xs"
                      >
                        Down
                      </Button>
                    </div>
                  );
                })}
              </div>
              <div>
                <h4 className="text-sm font-medium mb-2">Hidden Columns</h4>
                {hiddenColumns.map((c) => (
                  <div key={c.key} className="flex items-center gap-2 mb-2">
                    <input
                      type="checkbox"
                      checked={false}
                      onChange={(e) => toggleColumn(c.key, e.target.checked)}
                      className="form-checkbox"
                    />
                    <span>{c.label}</span>
                  </div>
                ))}
              </div>
              <Button
                onClick={() => setShowConfig(false)}
                className="mt-4 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-md w-full"
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
