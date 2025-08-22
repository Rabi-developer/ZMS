"use client";
import React, { useCallback, useMemo, useState } from "react";
import { toast } from "react-toastify";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { getAllBookingOrder } from "@/apis/bookingorder";
import { getAllConsignment } from "@/apis/consignment";
import { getAllCharges } from "@/apis/charges";
import { getAllPartys } from "@/apis/party";
import { getAllUnitOfMeasures } from "@/apis/unitofmeasure";

// Company constants
const COMPANY_NAME = "AL NASAR BASHEER LOGISTICS";
const COMPANY_ADDRESS = "Suit No. 108, SP Chamber, Main Estate Avenue, SITE Karachi";
const COMPANY_PHONE = "Phone: +92 21 32550917-18";
const REPORT_TITLE = "Contract Report (Detail)";

// Columns definition and order
const ALL_COLUMNS = [
  { key: "serial", label: "Serial No" },
  { key: "orderNo", label: "Order No" },
  { key: "ablDate", label: "Date" },
  { key: "orderDate", label: "Order Date" },
  { key: "consignor", label: "Consignor" },
  { key: "consignee", label: "Consignee" },
  { key: "vehicleNo", label: "Vehicle No" },
  { key: "bookingAmount", label: "Booking Amount" },
  { key: "biltyNo", label: "Bilty No" },
  { key: "biltyAmount", label: "Bilty Amount" },
  { key: "article", label: "Article" },
  { key: "qty", label: "Qty" },
  { key: "departure", label: "Departure" },
  { key: "destination", label: "Destination" },
  { key: "vendor", label: "Vendor" },
  { key: "carrier", label: "Carrier" },
] as const;

type ColumnKey = typeof ALL_COLUMNS[number]["key"];

type FilterType = "none" | "range" | "month";

interface RowData {
  serial: number;
  orderNo: string;
  ablDate: string; // formatted like ABL/11/8-25
  orderDate: string;
  consignor: string;
  consignee: string;
  vehicleNo: string;
  bookingAmount: number; // sum of charges for the order
  biltyNo: string; // joined
  biltyAmount: number; // sum of consignment totalAmount
  article: string; // joined description(s)
  qty: string; // joined or summed
  departure: string; // fromLocation
  destination: string; // toLocation
  vendor: string;
  carrier: string; // transporter
}

const labelFor = (key: ColumnKey) => ALL_COLUMNS.find((c) => c.key === key)?.label || key;

const formatABLDate = (dateStr?: string): string => {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "-";
  const day = d.getDate();
  const month = d.getMonth() + 1; // 1-12
  const year = d.getFullYear() % 100; // 2-digit
  return `ABL/${day}/${month}-${year}`;
};

const withinRange = (dateStr: string, from?: string, to?: string) => {
  if (!from || !to) return true; // if incomplete range, don't filter (show all)
  const d = new Date(dateStr).getTime();
  return d >= new Date(from).getTime() && d <= new Date(to).getTime();
};

const isSameMonth = (dateStr: string, month?: number, year?: number) => {
  if (!month || !year) return true; // if month/year not provided, don't filter
  const d = new Date(dateStr);
  return d.getMonth() + 1 === month && d.getFullYear() === year;
};

const numberOr0 = (v: any) => {
  const n = typeof v === "string" ? parseFloat(v) : v;
  return isNaN(n) || !isFinite(n) ? 0 : n;
};

const BookingOrderReportExport: React.FC = () => {
  const today = useMemo(() => new Date(), []);

  // Filters
  const [filterType, setFilterType] = useState<FilterType>("none"); // default: no filter
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [month, setMonth] = useState<number | undefined>(undefined);
  const [year, setYear] = useState<number | undefined>(undefined);

  // Columns
  const [selectedColumns, setSelectedColumns] = useState<ColumnKey[]>(ALL_COLUMNS.map(c => c.key));
  const [showColsMenu, setShowColsMenu] = useState(false);

  // State
  const [loading, setLoading] = useState<boolean>(false);

  const toggleColumn = (key: ColumnKey) => {
    setSelectedColumns((prev) => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  };

  const selectAllColumns = () => setSelectedColumns(ALL_COLUMNS.map(c => c.key));
  const clearAllColumns = () => setSelectedColumns([]);

  const resetFilters = () => {
    setFilterType("none");
    setFromDate("");
    setToDate("");
    setMonth(undefined);
    setYear(undefined);
  };

  const generateData = useCallback(async (): Promise<RowData[]> => {
    setLoading(true);
    try {
      // Fetch datasets with large page sizes once
      const [boRes, consRes, chargesRes, partyRes, unitRes] = await Promise.all([
        getAllBookingOrder(1, 2000),
        getAllConsignment(1, 4000),
        getAllCharges(1, 4000),
        getAllPartys(1, 4000),
        getAllUnitOfMeasures(1, 4000),
      ]);

      const orders: any[] = boRes?.data || [];
      const consignments: any[] = consRes?.data || [];
      const charges: any[] = chargesRes?.data || [];
      const parties: any[] = partyRes?.data || [];
      const units: any[] = unitRes?.data || [];

      const partyMap = new Map<string, string>(
        parties
          .map((p: any) => [String(p?.id ?? p?.Id ?? ""), p?.name || p?.Name || ""]) as [string, string][]
      );
      const unitMap = new Map<string, string>(
        units
          .map((u: any) => [String(u?.id ?? u?.Id ?? ""), u?.name || u?.unitName || u?.description || ""]) as [
            string,
            string
          ][]
      );

      // Index consignments and charges by orderNo for quick lookup
      const consByOrder = consignments.reduce((acc: Record<string, any[]>, c: any) => {
        const ono = c.orderNo || c.OrderNo || "";
        if (!ono) return acc;
        (acc[ono] = acc[ono] || []).push(c);
        return acc;
      }, {} as Record<string, any[]>);

      const chargesByOrder = charges.reduce((acc: Record<string, any[]>, ch: any) => {
        const ono = ch.orderNo || ch.OrderNo || "";
        if (!ono) return acc;
        (acc[ono] = acc[ono] || []).push(ch);
        return acc;
      }, {} as Record<string, any[]>);

      // Filter orders by selected filter
      const filteredOrders = orders.filter((o) => {
        const od = o.orderDate || o.date || o.createdAt || null;
        if (!od) return false;
        if (filterType === "range") return withinRange(od, fromDate, toDate);
        if (filterType === "month") return isSameMonth(od, month, year);
        return true; // none => no filtering
      });

      // Map to rows
      const rows: RowData[] = filteredOrders.map((o, idx) => {
        const ono = o.orderNo || o.id || "";
        const odate = o.orderDate || o.date || "";
        const cons = consByOrder[ono] || [];
        const chs = chargesByOrder[ono] || [];

        // Resolve consignor/consignee using multiple possible keys and map IDs to names when available
        const consignor = cons
          .map((c: any) => {
            const val = c.consignor ?? c.Consignor ?? c.consignorId ?? c.ConsignorId ?? "";
            return (val && partyMap.get(String(val))) || String(val);
          })
          .filter(Boolean)
          .join(", ");
        const consignee = cons
          .map((c: any) => {
            const val = c.consignee ?? c.Consignee ?? c.consigneeId ?? c.ConsigneeId ?? "";
            return (val && partyMap.get(String(val))) || String(val);
          })
          .filter(Boolean)
          .join(", ");
        const vehicleNo = o.vehicleNo || o.vehicle || "";
        const biltyNos = cons
          .map((c: any) => c.biltyNo ?? c.BiltyNo ?? c.consignmentNo ?? c.ConsignmentNo ?? "")
          .filter(Boolean)
          .join(", ");

        // Qty: prefer items qty list similar to OrderProgress, else use c.qty
        const qtyList = cons
          .map((c: any) => {
            if (Array.isArray(c.items) && c.items.length > 0) {
              return c.items
                .map((it: any) => {
                  const unitKey = it.qtyUnit ?? it.qtyUnitId ?? it.QtyUnit ?? it.QtyUnitId ?? "";
                  const unitName = unitMap.get(String(unitKey)) ?? String(unitKey);
                  return `${it.qty ?? it.Qty ?? ""} ${unitName}`.trim();
                })
                .filter(Boolean)
                .join(", ");
            }
            return c.qty ?? c.Qty ?? "";
          })
          .filter(Boolean)
          .join("; ");

        // Article: prefer items description list, else use itemDesc or items string
        const articleList = cons
          .map((c: any) => {
            if (Array.isArray(c.items) && c.items.length > 0) {
              return c.items
                .map((it: any) => it.desc ?? it.description ?? it.itemDesc ?? it.Description ?? "")
                .filter(Boolean)
                .join(", ");
            }
            return c.itemDesc || c.description || c.Description || (typeof c.items === "string" ? c.items : "");
          })
          .filter(Boolean)
          .join("; ");

        // Bilty amount from consignment totalAmount sum (support multiple casings)
        const biltyAmount = cons.reduce(
          (sum: number, c: any) => sum + numberOr0(c.totalAmount ?? c.TotalAmount ?? c.biltyAmount ?? c.BiltyAmount),
          0
        );

        // Booking amount from sum of charges lines amounts for that order
        const bookingAmount = chs.reduce((sum: number, ch: any) => {
          const chAmt = Array.isArray(ch.lines) ? ch.lines.reduce((lsum: number, line: any) => lsum + numberOr0(line.amount), 0) : numberOr0(ch.amount);
          return sum + chAmt;
        }, 0);

        return {
          serial: idx + 1,
          orderNo: ono,
          ablDate: formatABLDate(odate),
          orderDate: odate || "",
          consignor: consignor || "",
          consignee: consignee || "",
          vehicleNo: vehicleNo || "",
          bookingAmount,
          biltyNo: biltyNos || "-",
          biltyAmount,
          article: articleList || "-",
          qty: qtyList || "-",
          departure: o.fromLocation || o.from || "-",
          destination: o.toLocation || o.to || "-",
          vendor: o.vendor || o.vendorName || "-",
          carrier: o.transporter || o.carrier || "-",
        };
      });

      return rows;
    } catch (err: any) {
      console.error("Failed to generate data", err);
      toast.error("Failed to fetch data for report");
      return [];
    } finally {
      setLoading(false);
    }
  }, [filterType, fromDate, toDate, month, year]);

  // Compute grouped columns order and header rows for PDF/Excel
  const buildStructure = (selected: ColumnKey[]) => {
    const selectedSet = new Set<ColumnKey>(selected);

    const fixedKeys = ['serial','orderNo','ablDate','orderDate','consignor','consignee'] as const;
    const vehicleKeys = ['vehicleNo','bookingAmount'] as const;
    const biltyKeys = ['biltyNo','biltyAmount'] as const;
    const tailKeys = ['article','qty','departure','destination','vendor','carrier'] as const;

    const fixed = fixedKeys.filter((k) => selectedSet.has(k)) as ColumnKey[];
    const vehicleSubs = vehicleKeys.filter((k) => selectedSet.has(k)) as ColumnKey[];
    const biltySubs = biltyKeys.filter((k) => selectedSet.has(k)) as ColumnKey[];
    const tail = tailKeys.filter((k) => selectedSet.has(k)) as ColumnKey[];

    const colOrder: ColumnKey[] = [...fixed, ...vehicleSubs, ...biltySubs, ...tail];

    // PDF header rows
    const topRow: any[] = [];
    fixed.forEach((k) => topRow.push({ content: labelFor(k), rowSpan: 2 }));
    if (vehicleSubs.length > 0) topRow.push({ content: "Vehicle", colSpan: vehicleSubs.length });
    if (biltySubs.length > 0) topRow.push({ content: "Bilty", colSpan: biltySubs.length });
    tail.forEach((k) => topRow.push({ content: labelFor(k), rowSpan: 2 }));

    const subRow: any[] = [];
    if (vehicleSubs.length > 0) vehicleSubs.forEach((k) => subRow.push(labelFor(k)));
    if (biltySubs.length > 0) biltySubs.forEach((k) => subRow.push(labelFor(k)));

    const headRows = subRow.length > 0 ? [topRow, subRow] : [topRow];

    return { colOrder, headRows, vehicleSubs, biltySubs, fixed, tail };
  };

  const exportPDF = useCallback(async () => {
    const data = await generateData();
    if (data.length === 0) {
      toast.info("No data to export");
      return;
    }

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
    doc.text(COMPANY_ADDRESS, pageWidth / 2, 58, { align: "center" });
    doc.text(COMPANY_PHONE, pageWidth / 2, 72, { align: "center" });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text(REPORT_TITLE, pageWidth / 2, 92, { align: "center" });

    // Filter info
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    let filterLine = "";
    if (filterType === "range") {
      filterLine = fromDate && toDate ? `Date Range: ${fromDate} to ${toDate}` : "All data";
    } else if (filterType === "month") {
      filterLine = month && year ? `Month: ${month.toString().padStart(2, "0")}-${year}` : "All data";
    }
    doc.text(filterLine, pageWidth / 2, 108, { align: "center" });

    // Separator line
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(1);
    doc.line(40, 116, pageWidth - 40, 116);

    // Build grouped head and column order
    const { colOrder, headRows } = buildStructure(selectedColumns);

    // Table data
    const tableBody = data.map((row) =>
      colOrder.map((k) => {
        const v: any = (row as any)[k];
        if (typeof v === "number") return v.toLocaleString();
        return v ?? "-";
      })
    );

    autoTable(doc, {
      startY: 128,
      head: headRows as any,
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
    toast.success("PDF generated");
  }, [generateData, selectedColumns, filterType, fromDate, toDate, month, year]);

  const exportExcel = useCallback(async () => {
    const data = await generateData();
    if (data.length === 0) {
      toast.info("No data to export");
      return;
    }

    const { colOrder, headRows } = buildStructure(selectedColumns);

    // Top header lines
    const wsData: any[][] = [];
    wsData.push([COMPANY_NAME]);
    wsData.push([COMPANY_ADDRESS]);
    wsData.push([COMPANY_PHONE]);
    wsData.push([REPORT_TITLE]);
    let headerLine = "All data";
    if (filterType === "range") headerLine = fromDate && toDate ? `Date Range: ${fromDate} to ${toDate}` : "All data";
    if (filterType === "month") headerLine = month && year ? `Month: ${month.toString().padStart(2, "0")}-${year}` : "All data";
    wsData.push([headerLine]);
    wsData.push([]); // spacer row to keep header area clear

    // Table header (grouped)
    const headerStart = wsData.length;
    const topRow = (headRows[0] as any[]).map((cell) => typeof cell === "string" ? cell : cell.content);
    wsData.push(topRow);
    if (headRows.length > 1) {
      wsData.push(headRows[1] as any);
    }

    // Data rows
    data.forEach((row) => {
      wsData.push(colOrder.map((k) => {
        const v: any = (row as any)[k];
        return typeof v === "number" ? v : (v ?? "-");
      }));
    });

    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Merges for top company header lines across all columns
    const colCount = colOrder.length || 1;
    const merges: XLSX.Range[] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: Math.max(colCount - 1, 0) } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: Math.max(colCount - 1, 0) } },
      { s: { r: 2, c: 0 }, e: { r: 2, c: Math.max(colCount - 1, 0) } },
      { s: { r: 3, c: 0 }, e: { r: 3, c: Math.max(colCount - 1, 0) } },
      { s: { r: 4, c: 0 }, e: { r: 4, c: Math.max(colCount - 1, 0) } },
    ];

    // Grouped header merges
    const hdrTopRowIndex = headerStart; // top header row index
    const hdrSubExists = headRows.length > 1;
    let colPointer = 0;
    (headRows[0] as any[]).forEach((cell, idx) => {
      if (typeof cell === "string") {
        // Single column with rowSpan 2 => merge vertically if sub-header exists
        if (hdrSubExists) merges.push({ s: { r: hdrTopRowIndex, c: colPointer }, e: { r: hdrTopRowIndex + 1, c: colPointer } });
        colPointer += 1;
      } else if (cell && typeof cell === "object" && cell.colSpan) {
        // Group header => merge horizontally across colSpan
        merges.push({ s: { r: hdrTopRowIndex, c: colPointer }, e: { r: hdrTopRowIndex, c: colPointer + cell.colSpan - 1 } });
        colPointer += cell.colSpan;
      } else {
        colPointer += 1;
      }
    });

    (ws as any)["!merges"] = merges;

    // Set column widths
    const colWidths = colOrder.map((k) => {
      switch (k) {
        case "serial": return { wch: 10 };
        case "orderNo": return { wch: 16 };
        case "ablDate":
        case "orderDate": return { wch: 16 };
        case "vehicleNo": return { wch: 16 };
        case "bookingAmount":
        case "biltyAmount": return { wch: 18 };
        case "biltyNo": return { wch: 24 };
        case "consignor":
        case "consignee": return { wch: 28 };
        case "article": return { wch: 30 };
        case "departure":
        case "destination": return { wch: 22 };
        case "vendor":
        case "carrier": return { wch: 20 };
        case "qty": return { wch: 20 };
        default: return { wch: 16 };
      }
    });
    (ws as any)["!cols"] = colWidths;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "BookingReport");
    const fname = `${COMPANY_NAME.replace(/\s+/g, "_")}_BookingOrder_Report.xlsx`;
    XLSX.writeFile(wb, fname);
    toast.success("Excel generated");
  }, [generateData, selectedColumns, filterType, fromDate, toDate, month, year]);

  return (
    <div className="w-full h-[100vh] bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xl font-bold text-gray-800">{COMPANY_NAME}</div>
    
          </div>
          <div className="text-xs text-gray-500">{new Date().toLocaleString()}</div>
        </div>
      </div>

      {/* Controls */}
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Filter type */}
        <div className="col-span-1">
          <label className="block text-sm font-medium text-gray-700 mb-2">Filter Type</label>
          <div className="flex rounded-lg overflow-hidden border border-gray-300 shadow-sm">
            <button
              onClick={() => setFilterType("none")}
              className={`flex-1 px-4 py-2 text-sm ${filterType === "none" ? "bg-[#3a614c] text-white" : "bg-white text-gray-700 hover:bg-gray-50"} transition-colors`}
              type="button"
            >
              All
            </button>
            <button
              onClick={() => setFilterType("range")}
              className={`flex-1 px-4 py-2 text-sm border-l ${filterType === "range" ? "bg-[#3a614c] text-white" : "bg-white text-gray-700 hover:bg-gray-50"} transition-colors`}
              type="button"
            >
              Date Range
            </button>
            <button
              onClick={() => setFilterType("month")}
              className={`flex-1 px-4 py-2 text-sm border-l ${filterType === "month" ? "bg-[#3a614c] text-white" : "bg-white text-gray-700 hover:bg-gray-50"} transition-colors`}
              type="button"
            >
              Month
            </button>
          </div>
        </div>

        {/* Date Range */}
        <div className="col-span-1">
          <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
          <div className="flex gap-3">
            <input
              type="date"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[#3a614c] disabled:opacity-50"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              disabled={filterType !== "range"}
            />
            <input
              type="date"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[#3a614c] disabled:opacity-50"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              disabled={filterType !== "range"}
            />
          </div>
        </div>

        {/* Month/Year */}
        <div className="col-span-1">
          <label className="block text-sm font-medium text-gray-700 mb-2">Month / Year</label>
          <div className="flex gap-3">
            <select
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[#3a614c] disabled:opacity-50"
              value={month ?? ""}
              onChange={(e) => setMonth(e.target.value ? parseInt(e.target.value) : undefined)}
              disabled={filterType !== "month"}
            >
              <option value="">Month</option>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>{m.toString().padStart(2, "0")}</option>
              ))}
            </select>
            <input
              type="number"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[#3a614c] disabled:opacity-50"
              value={year ?? ""}
              onChange={(e) => setYear(e.target.value ? parseInt(e.target.value) : undefined)}
              placeholder="Year"
              disabled={filterType !== "month"}
            />
          </div>
        </div>

        {/* Columns dropdown */}
        <div className="col-span-1 sticky z-30 md:col-span-2 lg:col-span-3">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="text-sm text-gray-600">If no filter is selected, all data will be exported.</div>
            <div className="relative">
              <button
                type="button"
                className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#3a614c] transition-colors"
                onClick={() => setShowColsMenu((s) => !s)}
              >
                Select Columns ({selectedColumns.length})
              </button>
              {showColsMenu && (
                <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-xl z-20 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-sm font-medium text-gray-700">Select Columns</div>
                    <div className="flex gap-3">
                      <button onClick={selectAllColumns} className="text-xs text-[#3a614c] hover:underline">Select All</button>
                      <button onClick={clearAllColumns} className="text-xs text-red-600 hover:underline">Clear All</button>
                    </div>
                  </div>
                  <div className="max-h-64 overflow-auto grid grid-cols-2 gap-3">
                    {ALL_COLUMNS.map((c) => (
                      <label key={c.key} className="flex items-center gap-2 text-sm text-gray-700">
                        <input
                          type="checkbox"
                          className="w-4 h-4 text-[#3a614c] border-gray-300 rounded focus:ring-[#3a614c]"
                          checked={selectedColumns.includes(c.key)}
                          onChange={() => toggleColumn(c.key)}
                        />
                        {c.label}
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="col-span-1 md:col-span-2 lg:col-span-3 flex items-center gap-4 mt-2">
          <button
            onClick={exportPDF}
            disabled={loading}
            className="px-5 py-2.5 bg-[#3a614c] hover:bg-[#2f4e3f] text-white rounded-md text-sm font-medium disabled:opacity-50 shadow-md transition-colors"
          >
            {loading ? "Preparing…" : "Export PDF"}
          </button>
          <button
            onClick={exportExcel}
            disabled={loading}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium disabled:opacity-50 shadow-md transition-colors"
          >
            {loading ? "Preparing…" : "Export Excel"}
          </button>
          <button
            onClick={resetFilters}
            type="button"
            className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md text-sm font-medium border border-gray-300 shadow-sm transition-colors"
          >
            Reset Filters
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookingOrderReportExport;