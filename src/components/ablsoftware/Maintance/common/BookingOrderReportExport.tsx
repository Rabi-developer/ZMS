// src/components/reports/BookingOrderReportExport.tsx
"use client";
import React, { useCallback, useMemo, useState, useEffect } from "react";
import { toast } from "react-toastify";
import { getAllBookingOrder } from "@/apis/bookingorder";
import { getAllConsignment } from "@/apis/consignment";
import { getAllCharges } from "@/apis/charges";
import { getAllPartys } from "@/apis/party";
import { getAllUnitOfMeasures } from "@/apis/unitofmeasure";
import { exportBookingOrderToPDF } from "./BookingOrderPdf";
import { exportBookingOrderToExcel } from "./BookingOrderExcel";
import { ALL_COLUMNS, ColumnKey, RowData, labelFor } from "./BookingOrderTypes";
import { exportBiltiesReceivableToPDF } from "./BiltiesReceivablePdf";

// Company constants
const COMPANY_NAME = "AL NASAR BASHEER LOGISTICS";

const GENERATE_COLUMNS: ColumnKey[] = [
  "serial",
  "orderNo",
  "ablDate",
  "consignor",
  "consignee",
  "vehicleNo",
  "biltyNo",
  "article",
  "qty",
  "departure",
  "destination",
  "vendor",
  "carrier",
];

type FilterType = "none" | "range" | "month";
type ConsignmentFilterType = "all" | "single" | "multiple";

const formatDate = (dateStr?: string): string => {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "-";
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
};

const formatABLDate = (dateStr?: string): string => {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "-";
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear() % 100;
  return `ABL/${day}/${month}-${year}`;
};

const withinRange = (dateStr: string, from?: string, to?: string) => {
  if (!from || !to) return true;
  const d = new Date(dateStr).getTime();
  return d >= new Date(from).getTime() && d <= new Date(to).getTime();
};

const isSameMonth = (dateStr: string, month?: number, year?: number) => {
  if (!month || !year) return true;
  const d = new Date(dateStr);
  return d.getMonth() + 1 === month && d.getFullYear() === year;
};

const numberOr0 = (v: any) => {
  const n = typeof v === "string" ? parseFloat(v) : v;
  return isNaN(n) || !isFinite(n) ? 0 : n;
};

// Format numbers to remove .0 if the decimal part is zero
const formatNumber = (v: any): string => {
  const num = numberOr0(v);
  if (Number.isInteger(num)) {
    return num.toLocaleString();
  }
  return num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const isNumericString = (s: any) => typeof s === "string" && /^-?\d+(\.\d+)?$/.test(s.trim());
const compareValues = (a: any, b: any, key?: ColumnKey | "") => {
  if (!key) return 0;
  let av: any = (a as RowData)[key];
  let bv: any = (b as RowData)[key];

  if (key === "orderDate") {
    const ad = new Date(av as string).getTime();
    const bd = new Date(bv as string).getTime();
    if (isFinite(ad) && isFinite(bd)) return ad - bd;
  }

  const an = typeof av === "number" ? av : (isNumericString(av) ? parseFloat(av) : NaN);
  const bn = typeof bv === "number" ? bv : (isNumericString(bv) ? parseFloat(bv) : NaN);
  if (!isNaN(an) && !isNaN(bn)) return an - bn;

  const as = (av ?? "").toString().toLowerCase();
  const bs = (bv ?? "").toString().toLowerCase();
  return as.localeCompare(bs);
};
const compareByKey = (a: RowData, b: RowData, key?: ColumnKey | "") => compareValues(a, b, key);

const BookingOrderReportExport: React.FC = () => {
  const today = useMemo(() => new Date(), []);

  // Filters
  const [filterType, setFilterType] = useState<FilterType>("none");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [month, setMonth] = useState<number | undefined>(undefined);
  const [year, setYear] = useState<number | undefined>(undefined);
  const [consignmentFilter, setConsignmentFilter] = useState<ConsignmentFilterType>("all");

  // Arrangement (sorting)
  const [primarySortKey, setPrimarySortKey] = useState<ColumnKey | "">("");
  const [secondarySortKey, setSecondarySortKey] = useState<ColumnKey | "">("");

  // Column value filter
  const [filterColumn, setFilterColumn] = useState<ColumnKey | "">("");
  const [filterValue, setFilterValue] = useState<string>("");
  const [allRows, setAllRows] = useState<RowData[]>([]);
  const filterOptions = useMemo(() => {
    if (!filterColumn) return [] as string[];
    const set = new Set<string>();
    allRows.forEach((r) => {
      const v: any = (r as any)[filterColumn];
      if (v === undefined || v === null || v === "") return;
      set.add(String(v));
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [allRows, filterColumn]);

  // Columns
  const [selectedColumns, setSelectedColumns] = useState<ColumnKey[]>(ALL_COLUMNS.map(c => c.key));
  const [showColsMenu, setShowColsMenu] = useState(false);
  const [useGenerateColumns, setUseGenerateColumns] = useState<boolean>(false);

  // State
  const [loading, setLoading] = useState<boolean>(false);
  const [data, setData] = useState<RowData[]>([]);
  const [activeTab, setActiveTab] = useState<'booking' | 'bilty'>('booking');

  const toggleColumn = (key: ColumnKey) => {
    setSelectedColumns((prev) => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  };

  const selectAllColumns = () => setSelectedColumns(ALL_COLUMNS.map(c => c.key));
  const clearAllColumns = () => setSelectedColumns([]);

  const sortRows = useCallback((rows: RowData[]): RowData[] => {
    if (!primarySortKey && !secondarySortKey) return rows.map((r, i) => ({ ...r, serial: i + 1 }));
    const copy = [...rows];
    copy.sort((a, b) => {
      let cmp = compareByKey(a, b, primarySortKey);
      if (cmp !== 0) return cmp;
      return compareByKey(a, b, secondarySortKey);
    });
    return copy.map((r, i) => ({ ...r, serial: i + 1 }));
  }, [primarySortKey, secondarySortKey]);

  useEffect(() => {
    if (data.length === 0) return;
    setData(prev => sortRows(prev));
  }, [primarySortKey, secondarySortKey, sortRows]);

  const filterRows = useCallback((rows: RowData[]): RowData[] => {
    if (!filterColumn || !filterValue) return rows;
    return rows.filter((r) => String((r as any)[filterColumn] ?? "") === filterValue);
  }, [filterColumn, filterValue]);

  const composeView = useCallback((rows: RowData[]): RowData[] => {
    const sorted = sortRows(rows);
    const filtered = filterRows(sorted);
    return filtered.map((r, i) => ({ ...r, serial: i + 1 }));
  }, [sortRows, filterRows]);

  useEffect(() => {
    if (allRows.length === 0) return;
    setData(composeView(allRows));
  }, [primarySortKey, secondarySortKey, allRows, composeView]);

  useEffect(() => {
    if (allRows.length === 0) return;
    setData(composeView(allRows));
  }, [filterColumn, filterValue, allRows, composeView]);

  const resetFilters = () => {
    setFilterType("none");
    setFromDate("");
    setToDate("");
    setMonth(undefined);
    setYear(undefined);
    setConsignmentFilter("all");
    setPrimarySortKey("");
    setSecondarySortKey("");
    setFilterColumn("");
    setFilterValue("");
    setAllRows([]);
    setData([]);
    setUseGenerateColumns(false);
  };

  const generateData = useCallback(async (): Promise<RowData[]> => {
    setLoading(true);
    try {
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

      const filteredOrders = orders.filter((o) => {
        const od = o.orderDate || o.date || o.createdAt || null;
        if (!od) return false;
        if (filterType === "range") return withinRange(od, fromDate, toDate);
        if (filterType === "month") return isSameMonth(od, month, year);
        return true;
      });

      const rows: RowData[] = [];
      filteredOrders.forEach((o) => {
        const ono = o.orderNo || o.id || "";
        const odate = o.orderDate || o.date || "";
        const chs = chargesByOrder[ono] || [];
        const cons = consByOrder[ono] || [];
        const consCount = cons.length;

        // Apply consignment filter
        if (consignmentFilter === "single" && consCount !== 1) return;
        if (consignmentFilter === "multiple" && consCount <= 1) return;

        const bookingAmount = chs.reduce((sum: number, ch: any) => {
          const chAmt = Array.isArray(ch.lines) ? ch.lines.reduce((lsum: number, line: any) => lsum + numberOr0(line.amount), 0) : numberOr0(ch.amount);
          return sum + chAmt;
        }, 0);

        const vehicleNo = o.vehicleNo || o.vehicle || "";
        const departure = o.fromLocation || o.from || "-";
        const destination = o.toLocation || o.to || "-";
        const vendor = o.vendor || o.vendorName || "-";
        const carrier = o.transporter || o.carrier || "-";

        if (cons.length === 0) {
          rows.push({
            serial: 0,
            orderNo: ono,
            ablDate: formatABLDate(odate),
            orderDate: odate || "",
            consignor: "",
            consignee: "",
            vehicleNo: vehicleNo || "",
            bookingAmount,
            biltyNo: "-",
            biltyAmount: 0,
            article: "-",
            qty: "-",
            departure,
            destination,
            vendor,
            carrier,
          });
        } else {
          cons.forEach((c: any) => {
            const consignorVal = c.consignor ?? c.Consignor ?? c.consignorId ?? c.ConsignorId ?? "";
            const consignor = (consignorVal && partyMap.get(String(consignorVal))) || String(consignorVal) || "";

            const consigneeVal = c.consignee ?? c.Consignee ?? c.consigneeId ?? c.ConsigneeId ?? "";
            const consignee = (consigneeVal && partyMap.get(String(consigneeVal))) || String(consigneeVal) || "";

            const biltyNo = c.biltyNo ?? c.BiltyNo ?? c.consignmentNo ?? c.ConsignmentNo ?? "-";

            let article = "-";
            let qty = "-";
            if (Array.isArray(c.items) && c.items.length > 0) {
              article = c.items
                .map((it: any) => it.desc ?? it.description ?? it.itemDesc ?? it.Description ?? "")
                .filter(Boolean)
                .join(", ");
              qty = c.items
                .map((it: any) => {
                  const unitKey = it.qtyUnit ?? it.qtyUnitId ?? it.QtyUnit ?? it.QtyUnitId ?? "";
                  const unitName = unitMap.get(String(unitKey)) ?? String(unitKey);
                  return `${it.qty ?? it.Qty ?? ""} ${unitName}`.trim();
                })
                .filter(Boolean)
                .join(", ");
            } else {
              article = c.itemDesc || c.description || c.Description || (typeof c.items === "string" ? c.items : "") || "-";
              qty = String(c.qty ?? c.Qty ?? "") || "-";
            }

            const biltyAmount = numberOr0(c.totalAmount ?? c.TotalAmount ?? c.biltyAmount ?? c.BiltyAmount ?? 0);

            rows.push({
              serial: 0,
              orderNo: ono,
              ablDate: formatABLDate(odate),
              orderDate: odate || "",
              consignor,
              consignee,
              vehicleNo: vehicleNo || "",
              bookingAmount,
              biltyNo,
              biltyAmount,
              article,
              qty,
              departure,
              destination,
              vendor,
              carrier,
            });
          });
        }
      });

      return rows;
    } catch (err: any) {
      console.error("Failed to generate data", err);
      toast.error("Failed to fetch data for report");
      return [];
    } finally {
      setLoading(false);
    }
  }, [filterType, fromDate, toDate, month, year, consignmentFilter]);

  const buildStructure = (selected: ColumnKey[]) => {
    const selectedSet = new Set<ColumnKey>(selected);
    const fixedKeys = ['serial'] as const;
    const contractKeys = ['orderNo', 'ablDate'] as const;
    const tailKeys1 = ['consignor', 'consignee'] as const;
    const vehicleKeys = ['vehicleNo', 'bookingAmount'] as const;
    const biltyKeys = ['biltyNo', 'biltyAmount'] as const;
    const tailKeys2 = ['article', 'qty', 'departure', 'destination', 'vendor', 'carrier'] as const;

    const fixed = fixedKeys.filter((k) => selectedSet.has(k)) as ColumnKey[];
    const contractSubs = contractKeys.filter((k) => selectedSet.has(k)) as ColumnKey[];
    const tail1 = tailKeys1.filter((k) => selectedSet.has(k)) as ColumnKey[];
    const vehicleSubs = vehicleKeys.filter((k) => selectedSet.has(k)) as ColumnKey[];
    const biltySubs = biltyKeys.filter((k) => selectedSet.has(k)) as ColumnKey[];
    const tail2 = tailKeys2.filter((k) => selectedSet.has(k)) as ColumnKey[];

    const colOrder: ColumnKey[] = [...fixed, ...contractSubs, ...tail1, ...vehicleSubs, ...biltySubs, ...tail2];

    const topRow: any[] = [];
    fixed.forEach((k) => topRow.push({ content: labelFor(k), rowSpan: 2 }));
    if (contractSubs.length > 0) topRow.push({ content: "Contract", colSpan: contractSubs.length });
    tail1.forEach((k) => topRow.push({ content: labelFor(k), rowSpan: 2 }));
    if (vehicleSubs.length > 0) topRow.push({ content: "Vehicle", colSpan: vehicleSubs.length });
    if (biltySubs.length > 0) topRow.push({ content: "Bilty", colSpan: biltySubs.length });
    tail2.forEach((k) => topRow.push({ content: labelFor(k), rowSpan: 2 }));

    const subRow: any[] = [];
    if (contractSubs.length > 0) contractSubs.forEach((k) => subRow.push(labelFor(k)));
    if (vehicleSubs.length > 0) vehicleSubs.forEach((k) => subRow.push(labelFor(k)));
    if (biltySubs.length > 0) biltySubs.forEach((k) => subRow.push(labelFor(k)));

    const headRows = subRow.length > 0 ? [topRow, subRow] : [topRow];
    return { colOrder, headRows };
  };

  const computeFilterLine = () => {
    let base = "";
    if (filterType === "range") {
      base = fromDate && toDate ? `Date Range: ${formatDate(fromDate)} to ${formatDate(toDate)}` : "";
    } else if (filterType === "month") {
      base = month && year ? `Month: ${month.toString().padStart(2, "0")}-${year}` : "";
    }
    const consFilterText = consignmentFilter !== "all" ? ` | Consignments: ${consignmentFilter.toUpperCase()}` : "";
    const filterText = filterColumn && filterValue ? ` | Filter: ${labelFor(filterColumn)} = ${filterValue}` : "";
    const arr =
      primarySortKey
        ? ` | Arranged by: ${labelFor(primarySortKey)}${secondarySortKey ? `, then ${labelFor(secondarySortKey)}` : ""}`
        : "";
    return base + consFilterText + filterText + arr;
  };

  const loadDataForPreview = async (useReducedColumns: boolean = false) => {
    const rows = await generateData();
    setAllRows(rows);
    const view = composeView(rows);
    setData(view);
    setUseGenerateColumns(useReducedColumns);
    if (view.length === 0) {
      toast.info("No data found for the selected filters");
    } else {
      toast.success("Data loaded for preview");
    }
  };

  const exportPDF = useCallback(async (useReducedColumns: boolean = false) => {
    let rows = data;
    if (rows.length === 0) {
      rows = await generateData();
    }
    if (rows.length === 0) {
      toast.info("No data to export");
      return;
    }
    const rowsToUse = composeView(rows);
    const columnsToUse = useReducedColumns ? GENERATE_COLUMNS : selectedColumns;
    const { colOrder, headRows } = buildStructure(columnsToUse);
    const baseFilterLine = computeFilterLine();
    const reportTypeLabel = useReducedColumns ? "GENERAL REPORT" : "DETAIL REPORT";
    const filterLine = `${reportTypeLabel}${baseFilterLine ? " | " + baseFilterLine : ""}`;
    const startDate = (filterType === "range" && fromDate) ? fromDate : undefined;
    const endDate = (filterType === "range" && toDate) ? toDate : undefined;
    exportBookingOrderToPDF(rowsToUse, columnsToUse, filterLine, colOrder, headRows, startDate, endDate);
    toast.success("PDF generated");
  }, [data, generateData, selectedColumns, composeView, filterType, fromDate, toDate, consignmentFilter]);

  const exportBiltiesReceivable = useCallback(async () => {
    let rows = data;
    if (rows.length === 0) {
      rows = await generateData();
    }
    if (rows.length === 0) {
      toast.info("No data to export");
      return;
    }
    const rowsToUse = composeView(rows);
    const receivableRows = rowsToUse.filter((r) => !r.biltyNo || r.biltyNo.trim() === "-");
    if (receivableRows.length === 0) {
      toast.info("No receivable entries (all have Bilty No)");
      return;
    }
    const pdfRows = receivableRows.map((r) => ({
      orderNo: r.orderNo,
      orderDate: r.orderDate,
      vehicleNo: r.vehicleNo,
      consignor: r.consignor,
      consignee: r.consignee,
      carrier: r.carrier,
      vendor: r.vendor,
      departure: r.departure,
      destination: r.destination,
      vehicleType: "",
    }));
    const start = (filterType === "range" && fromDate) ? fromDate : undefined;
    const end = (filterType === "range" && toDate) ? toDate : undefined;
    exportBiltiesReceivableToPDF({ rows: pdfRows, startDate: start, endDate: end });
    toast.success("Bilties Receivable PDF generated");
  }, [data, generateData, composeView, filterType, fromDate, toDate, consignmentFilter]);

  const exportExcel = useCallback(async (useReducedColumns: boolean = false) => {
    let rows = data;
    if (rows.length === 0) {
      rows = await generateData();
    }
    if (rows.length === 0) {
      toast.info("No data to export");
      return;
    }
    const rowsToUse = composeView(rows);
    const columnsToUse = useReducedColumns ? GENERATE_COLUMNS : selectedColumns;
    const { colOrder, headRows } = buildStructure(columnsToUse);
    const filterLine = computeFilterLine();
    exportBookingOrderToExcel(rowsToUse, columnsToUse, filterLine, colOrder, headRows);
    toast.success("Excel generated");
  }, [data, generateData, selectedColumns, composeView, consignmentFilter]);

  const columnsToDisplay = useGenerateColumns ? GENERATE_COLUMNS : selectedColumns;
  const { colOrder, headRows } = buildStructure(columnsToDisplay);

  return (
    <div className="min-h-screen bg-gray-100">
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <h1 className="text-4xl font-bold text-gray-900">Booking Order Reports</h1>
            <div className="text-sm font-medium text-gray-600">
              {new Date().toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              })}
            </div>
          </div>
          <p className="mt-2 text-lg font-semibold text-gray-700">{COMPANY_NAME}</p>
        </div>

        {/* Tabs */}
        <div className="mb-6 bg-white/80 backdrop-blur border border-gray-200 rounded-2xl shadow">
          <div className="flex">
            <button
              className={`flex-1 py-3 px-4 text-sm font-semibold rounded-2xl transition-all ${activeTab === 'booking' ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow' : 'text-gray-700 hover:bg-gray-50'}`}
              onClick={() => setActiveTab('booking')}
            >
              Booking Orders
            </button>
            <button
              className={`flex-1 py-3 px-4 text-sm font-semibold rounded-2xl transition-all ${activeTab === 'bilty' ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow' : 'text-gray-700 hover:bg-gray-50'}`}
              onClick={() => setActiveTab('bilty')}
            >
              Bilties Receivable
            </button>
          </div>
        </div>

        {/* Booking Orders Tab */}
        {activeTab === "booking" && (
          <>
            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {/* Date Filter */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-100">
                <div className="p-6 border-b border-gray-100">
                  <h3 className="text-lg font-bold text-gray-900">Date Filter</h3>
                  <p className="text-sm text-gray-500">Select a date range for filtering data.</p>
                </div>
                <div className="p-6 grid grid-cols-3 gap-4">
                  <button
                    onClick={() => setFilterType("none")}
                    className={`py-3 px-4 rounded-lg text-sm font-semibold transition-colors ${
                      filterType === "none"
                        ? "bg-indigo-600 text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setFilterType("range")}
                    className={`py-3 px-4 rounded-lg text-sm font-semibold transition-colors ${
                      filterType === "range"
                        ? "bg-indigo-600 text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    Range
                  </button>
                  <button
                    onClick={() => setFilterType("month")}
                    className={`py-3 px-4 rounded-lg text-sm font-semibold transition-colors ${
                      filterType === "month"
                        ? "bg-indigo-600 text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    Month
                  </button>
                </div>
              </div>

              {/* Consignment Filter */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-100">
                <div className="p-6 border-b border-gray-100">
                  <h3 className="text-lg font-bold text-gray-900">Consignment Filter</h3>
                  <p className="text-sm text-gray-500">Filter by number of consignments per order.</p>
                </div>
                <div className="p-6">
                  <select
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                    value={consignmentFilter}
                    onChange={(e) => setConsignmentFilter(e.target.value as ConsignmentFilterType)}
                  >
                    <option value="all">All Orders</option>
                    <option value="single">Single Consignment</option>
                    <option value="multiple">Multiple Consignments</option>
                  </select>
                </div>
              </div>

              {/* Conditional Date Inputs */}
              {filterType === "range" && (
                <div className="bg-white rounded-xl shadow-lg border border-gray-100">
                  <div className="p-6 border-b border-gray-100">
                    <h3 className="text-lg font-bold text-gray-900">Date Range</h3>
                    <p className="text-sm text-gray-500">Select start and end dates.</p>
                  </div>
                  <div className="p-6 space-y-4">
                    <input
                      type="date"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                      value={fromDate}
                      onChange={(e) => setFromDate(e.target.value)}
                    />
                    <input
                      type="date"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                      value={toDate}
                      onChange={(e) => setToDate(e.target.value)}
                    />
                  </div>
                </div>
              )}
              {filterType === "month" && (
                <div className="bg-white rounded-xl shadow-lg border border-gray-100">
                  <div className="p-6 border-b border-gray-100">
                    <h3 className="text-lg font-bold text-gray-900">Month / Year</h3>
                    <p className="text-sm text-gray-500">Select a specific month and year.</p>
                  </div>
                  <div className="p-6 space-y-4">
                    <select
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                      value={month ?? ""}
                      onChange={(e) => setMonth(e.target.value ? parseInt(e.target.value) : undefined)}
                    >
                      <option value="">Select Month</option>
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                        <option key={m} value={m}>
                          {m.toString().padStart(2, "0")}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                      value={year ?? ""}
                      onChange={(e) => setYear(e.target.value ? parseInt(e.target.value) : undefined)}
                      placeholder="Enter Year"
                    />
                  </div>
                </div>
              )}

              {/* Value Filter */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-100">
                <div className="p-6 border-b border-gray-100">
                  <h3 className="text-lg font-bold text-gray-900">Value Filter</h3>
                  <p className="text-sm text-gray-500">Filter rows by a specific column value.</p>
                </div>
                <div className="p-6 space-y-4">
                  <select
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                    value={filterColumn}
                    onChange={(e) => {
                      setFilterColumn(e.target.value as ColumnKey | "");
                      setFilterValue("");
                    }}
                  >
                    <option value="">Select Column</option>
                    {ALL_COLUMNS.map((c) => (
                      <option key={c.key} value={c.key}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                  <select
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                    value={filterValue}
                    onChange={(e) => setFilterValue(e.target.value)}
                    disabled={!filterColumn || filterOptions.length === 0}
                  >
                    <option value="">
                      {filterColumn
                        ? filterOptions.length
                          ? "Select Value"
                          : "No Values Available"
                        : "Select Column First"}
                    </option>
                    {filterOptions.map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => {
                      setFilterColumn("");
                      setFilterValue("");
                      allRows.length > 0 && setData(composeView(allRows));
                    }}
                    className="w-full py-2 px-4 bg-gray-100 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-200 transition-colors"
                  >
                    Clear Filter
                  </button>
                </div>
              </div>

              {/* Sorting */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-100">
                <div className="p-6 border-b border-gray-100">
                  <h3 className="text-lg font-bold text-gray-900">Sorting</h3>
                  <p className="text-sm text-gray-500">Choose how to sort the rows.</p>
                </div>
                <div className="p-6 space-y-4">
                  <select
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                    value={primarySortKey}
                    onChange={(e) => setPrimarySortKey(e.target.value as ColumnKey | "")}
                  >
                    <option value="">Primary Sort (None)</option>
                    {ALL_COLUMNS.map((c) => (
                      <option key={c.key} value={c.key}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                  <select
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                    value={secondarySortKey}
                    onChange={(e) => setSecondarySortKey(e.target.value as ColumnKey | "")}
                    disabled={!primarySortKey}
                  >
                    <option value="">Secondary Sort (None)</option>
                    {ALL_COLUMNS.map((c) => (
                      <option key={c.key} value={c.key}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Columns - Moved to end for better layout */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-100 relative">
                <div className="p-6 border-b border-gray-100">
                  <h3 className="text-lg font-bold text-gray-900">Columns</h3>
                  <p className="text-sm text-gray-500">Select columns to include in the report.</p>
                </div>
                <div className="p-6">
                  <button
                    onClick={() => setShowColsMenu(!showColsMenu)}
                    className="w-full px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-200 transition-colors"
                  >
                    {selectedColumns.length} Columns Selected
                  </button>
                  {showColsMenu && (
                    <div className="absolute left-0 right-0 bottom-full z-20 mb-2 bg-white border border-gray-200 rounded-lg shadow-xl p-4 max-h-80 overflow-y-auto">
                      <div className="flex justify-between mb-4 text-sm font-semibold text-gray-600">
                        <button onClick={selectAllColumns} className="hover:text-indigo-600">
                          Select All
                        </button>
                        <button onClick={clearAllColumns} className="hover:text-rose-600">
                          Clear All
                        </button>
                      </div>
                      {ALL_COLUMNS.map((c) => (
                        <label key={c.key} className="flex items-center mb-3 text-sm text-gray-700">
                          <input
                            type="checkbox"
                            className="mr-3 w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                            checked={selectedColumns.includes(c.key)}
                            onChange={() => toggleColumn(c.key)}
                          />
                          {c.label}
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-lg border border-gray-100">
                <div className="p-6 border-b border-gray-100">
                  <h3 className="text-lg font-bold text-gray-900">Booking Order Report</h3>
                  <p className="text-sm text-gray-500">Preview and export the report.</p>
                </div>
                <div className="p-6 space-y-6">
                  <div>
                    <div className="text-sm font-semibold text-gray-600 mb-3">Preview</div>
                    <div className="flex flex-wrap gap-4">
                      <button
                        onClick={() => loadDataForPreview(false)}
                        disabled={loading}
                        className="px-6 py-3 bg-indigo-600 text-white text-sm font-bold rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                      >
                        {loading ? "Loading..." : "Preview Order Report (All)"}
                      </button>
                      <button
                        onClick={() => loadDataForPreview(true)}
                        disabled={loading}
                        className="px-6 py-3 bg-indigo-500 text-white text-sm font-bold rounded-lg hover:bg-indigo-600 transition-colors disabled:opacity-50"
                      >
                        {loading ? "Loading..." : "Preview Order Report (General)"}
                      </button>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-600 mb-3">Export PDF</div>
                    <div className="flex flex-wrap gap-4">
                      <button
                        onClick={() => exportPDF(false)}
                        disabled={loading}
                        className="px-6 py-3 bg-purple-600 text-white text-sm font-bold rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                      >
                        ORDER REPORT (DETAIL)
                      </button>
                      <button
                        onClick={() => exportPDF(true)}
                        disabled={loading}
                        className="px-6 py-3 bg-purple-600 text-white text-sm font-bold rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                      >
                        ORDER REPORT (GENERAL)
                      </button>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-600 mb-3">Export Excel</div>
                    <div className="flex flex-wrap gap-4">
                      <button
                        onClick={() => exportExcel(false)}
                        disabled={loading}
                        className="px-6 py-3 bg-emerald-600 text-white text-sm font-bold rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
                      >
                        ORDER REPORT (DETAIL)
                      </button>
                      <button
                        onClick={() => exportExcel(true)}
                        disabled={loading}
                        className="px-6 py-3 bg-emerald-600 text-white text-sm font-bold rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
                      >
                        ORDER REPORT (GENERAL)
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg border border-gray-100">
                <div className="p-6 border-b border-gray-100">
                  <h3 className="text-lg font-bold text-gray-900">Quick Actions</h3>
                  <p className="text-sm text-gray-500">Manage report settings.</p>
                </div>
                <div className="p-6 space-y-4">
                  <button
                    onClick={() => allRows.length > 0 && setData(composeView(allRows))}
                    className="w-full py-3 px-6 bg-indigo-600 text-white text-sm font-bold rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    Apply Changes
                  </button>
                  <button
                    onClick={resetFilters}
                    className="w-full py-3 px-6 bg-gray-200 text-gray-700 text-sm font-bold rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Reset All
                  </button>
                </div>
              </div>
            </div>

            {/* Preview Table */}
            {data.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                  <h3 className="text-lg font-bold text-gray-900">Data Preview</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-100 sticky top-0 z-10">
                      {headRows.map((row, rowIdx) => (
                        <tr key={rowIdx}>
                          {row.map((cell: any, cellIdx: number) => {
                            const content = typeof cell === "string" ? cell : cell.content;
                            const colSpan = typeof cell === "object" ? (cell.colSpan || 1) : 1;
                            const rowSpan = typeof cell === "object" ? (cell.rowSpan || 1) : 1;
                            return (
                              <th
                                key={cellIdx}
                                colSpan={colSpan}
                                rowSpan={rowSpan}
                                className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider"
                              >
                                {content}
                              </th>
                            );
                          })}
                        </tr>
                      ))}
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {data.map((row, rowIdx) => (
                        <tr
                          key={rowIdx}
                          className={`hover:bg-gray-50 ${
                            rowIdx % 2 === 0 ? "bg-white" : "bg-gray-50"
                          }`}
                        >
                          {colOrder.map((k, colIdx) => {
                            const v: any = row[k];
                            const displayValue =
                              typeof v === "number" ? formatNumber(v) : v ?? "-";
                            return (
                              <td
                                key={colIdx}
                                className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900"
                              >
                                {displayValue}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        {/* Bilties Receivable Tab */}
        {activeTab === "bilty" && (
          <div className="mb-8">
            <div className="bg-white rounded-xl shadow-lg border border-gray-100">
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-lg font-bold text-gray-900">Bilties Receivable Report</h3>
                <p className="text-sm text-gray-500">Export the Bilties Receivable report as PDF.</p>
              </div>
              <div className="p-6">
                <button
                  onClick={exportBiltiesReceivable}
                  disabled={loading}
                  className="w-full px-6 py-3 bg-rose-600 text-white text-sm font-bold rounded-lg hover:bg-rose-700 transition-colors disabled:opacity-50"
                >
                  Export PDF
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default BookingOrderReportExport;