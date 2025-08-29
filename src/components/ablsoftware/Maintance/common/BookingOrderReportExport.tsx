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

// Reduced column set for "Generate Data" option
const GENERATE_COLUMNS: ColumnKey[] = [
  "serial",
  "orderNo",
  "ablDate",
  "orderDate",
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

// Utility function to format dates in DD-MM-YYYY format
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
  const year = d.getFullYear() % 100; // 2-digit year
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

// Helpers for ordering/sorting
const isNumericString = (s: any) => typeof s === "string" && /^-?\d+(\.\d+)?$/.test(s.trim());
const compareValues = (a: any, b: any, key?: ColumnKey | "") => {
  if (!key) return 0;
  let av: any = (a as RowData)[key];
  let bv: any = (b as RowData)[key];

  // Special handling for dates
  if (key === "orderDate") {
    const ad = new Date(av as string).getTime();
    const bd = new Date(bv as string).getTime();
    if (isFinite(ad) && isFinite(bd)) return ad - bd;
  }

  // Numeric compare
  const an = typeof av === "number" ? av : (isNumericString(av) ? parseFloat(av) : NaN);
  const bn = typeof bv === "number" ? bv : (isNumericString(bv) ? parseFloat(bv) : NaN);
  if (!isNaN(an) && !isNaN(bn)) return an - bn;

  // Fallback string compare
  const as = (av ?? "").toString().toLowerCase();
  const bs = (bv ?? "").toString().toLowerCase();
  return as.localeCompare(bs);
};
const compareByKey = (a: RowData, b: RowData, key?: ColumnKey | "") => compareValues(a, b, key);

const BookingOrderReportExport: React.FC = () => {
  const today = useMemo(() => new Date(), []);

  // Filters
  const [filterType, setFilterType] = useState<FilterType>("none"); // default: no filter
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [month, setMonth] = useState<number | undefined>(undefined);
  const [year, setYear] = useState<number | undefined>(undefined);

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

        const biltyAmount = cons.reduce(
          (sum: number, c: any) => sum + numberOr0(c.totalAmount ?? c.TotalAmount ?? c.biltyAmount ?? c.BiltyAmount),
          0
        );

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

    const topRow: any[] = [];
    fixed.forEach((k) => topRow.push({ content: labelFor(k), rowSpan: 2 }));
    if (vehicleSubs.length > 0) topRow.push({ content: "Vehicle", colSpan: vehicleSubs.length });
    if (biltySubs.length > 0) topRow.push({ content: "Bilty", colSpan: biltySubs.length });
    tail.forEach((k) => topRow.push({ content: labelFor(k), rowSpan: 2 }));

    const subRow: any[] = [];
    if (vehicleSubs.length > 0) vehicleSubs.forEach((k) => subRow.push(labelFor(k)));
    if (biltySubs.length > 0) biltySubs.forEach((k) => subRow.push(labelFor(k)));

    const headRows = subRow.length > 0 ? [topRow, subRow] : [topRow];

    return { colOrder, headRows };
  };

  const computeFilterLine = () => {
    let base = "All data";
    if (filterType === "range") {
      base = fromDate && toDate ? `Date Range: ${formatDate(fromDate)} to ${formatDate(toDate)}` : "All data";
    } else if (filterType === "month") {
      base = month && year ? `Month: ${month.toString().padStart(2, "0")}-${year}` : "All data";
    }
    const filterText = filterColumn && filterValue ? ` | Filter: ${labelFor(filterColumn)} = ${filterValue}` : "";
    const arr =
      primarySortKey
        ? ` | Arranged by: ${labelFor(primarySortKey)}${secondarySortKey ? `, then ${labelFor(secondarySortKey)}` : ""}`
        : "";
    return base + filterText + arr;
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
    const filterLine = computeFilterLine();
    exportBookingOrderToPDF(rowsToUse, columnsToUse, filterLine, colOrder, headRows);
    toast.success("PDF generated");
  }, [data, generateData, selectedColumns, composeView]);

  const exportBiltiesReceivable = useCallback(async () => {
    let rows = data;
    if (rows.length === 0) {
      rows = await generateData();
    }
    if (rows.length === 0) {
      toast.info("No data to export");
      return;
    }
    // Compose current view and then filter orders that have NO biltyNo present
    const rowsToUse = composeView(rows);
    const receivableRows = rowsToUse.filter((r) => !r.biltyNo || r.biltyNo.trim() === "-");
    if (receivableRows.length === 0) {
      toast.info("No receivable entries (all have Bilty No)");
      return;
    }
    // Map to BiltiesReceivableRow type
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
      vehicleType: "", // not part of RowData; leave blank
    }));

    // Derive date range from active filters if available
    const start = (filterType === "range" && fromDate) ? fromDate : undefined;
    const end = (filterType === "range" && toDate) ? toDate : undefined;

    exportBiltiesReceivableToPDF({ rows: pdfRows, startDate: start, endDate: end });
    toast.success("Bilties Receivable PDF generated");
  }, [data, generateData, composeView, filterType, fromDate, toDate]);

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
  }, [data, generateData, selectedColumns, composeView]);

  const columnsToDisplay = useGenerateColumns ? GENERATE_COLUMNS : selectedColumns;
  const { colOrder, headRows } = buildStructure(columnsToDisplay);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar for Controls */}
      <aside className="w-80 bg-white shadow-md p-6 overflow-y-auto border-r border-gray-200">
        <h2 className="text-xl font-bold text-gray-800 mb-6">Report Settings</h2>

        {/* Filter Type */}
        <div className="mb-8">
          <label className="block text-sm font-semibold text-gray-700 mb-3">Filter Type</label>
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => setFilterType("none")}
              className={`py-3 text-sm font-medium rounded-lg transition-all duration-200 ${filterType === "none" ? "bg-blue-600 text-white shadow-md" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
            >
              All
            </button>
            <button
              onClick={() => setFilterType("range")}
              className={`py-3 text-sm font-medium rounded-lg transition-all duration-200 ${filterType === "range" ? "bg-blue-600 text-white shadow-md" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
            >
              Range
            </button>
            <button
              onClick={() => setFilterType("month")}
              className={`py-3 text-sm font-medium rounded-lg transition-all duration-200 ${filterType === "month" ? "bg-blue-600 text-white shadow-md" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
            >
              Month
            </button>
          </div>
        </div>

        {/* Date Range */}
        {filterType === "range" && (
          <div className="mb-8">
            <label className="block text-sm font-semibold text-gray-700 mb-3">Date Range</label>
            <input
              type="date"
              className="w-full mb-3 px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
            <input
              type="date"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
          </div>
        )}

        {/* Month/Year */}
        {filterType === "month" && (
          <div className="mb-8">
            <label className="block text-sm font-semibold text-gray-700 mb-3">Month / Year</label>
            <select
              className="w-full mb-3 px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              value={month ?? ""}
              onChange={(e) => setMonth(e.target.value ? parseInt(e.target.value) : undefined)}
            >
              <option value="">Select Month</option>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>{m.toString().padStart(2, "0")}</option>
              ))}
            </select>
            <input
              type="number"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              value={year ?? ""}
              onChange={(e) => setYear(e.target.value ? parseInt(e.target.value) : undefined)}
              placeholder="Enter Year"
            />
          </div>
        )}

        {/* Column Selection */}
        <div className="mb-8 relative">
          <label className="block text-sm font-semibold text-gray-700 mb-3">Select Columns</label>
          <button
            onClick={() => setShowColsMenu(!showColsMenu)}
            className="w-full px-4 py-3 bg-gray-100 border border-gray-300 rounded-lg text-sm text-left font-medium text-gray-700 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
          >
            {selectedColumns.length} Columns Selected
          </button>
          {showColsMenu && (
            <div className="absolute z-20 mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-xl p-4 max-h-64 overflow-y-auto">
              <div className="flex justify-between mb-3 text-sm font-medium text-gray-600">
                <button onClick={selectAllColumns} className="hover:text-blue-600 transition-colors">Select All</button>
                <button onClick={clearAllColumns} className="hover:text-red-600 transition-colors">Clear All</button>
              </div>
              {ALL_COLUMNS.map((c) => (
                <label key={c.key} className="flex items-center mb-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    className="mr-3 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    checked={selectedColumns.includes(c.key)}
                    onChange={() => toggleColumn(c.key)}
                  />
                  {c.label}
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Filter By Column Value */}
        <div className="mb-8">
          <label className="block text-sm font-semibold text-gray-700 mb-3">Filter By Column</label>
          <select
            className="w-full mb-3 px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
            value={filterColumn}
            onChange={(e) => {
              setFilterColumn(e.target.value as ColumnKey || "");
              setFilterValue("");
            }}
          >
            <option value="">Select Column</option>
            {ALL_COLUMNS.map((c) => (
              <option key={c.key} value={c.key}>{c.label}</option>
            ))}
          </select>
          <select
            className="w-full mb-3 px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 disabled:opacity-50"
            value={filterValue}
            onChange={(e) => setFilterValue(e.target.value)}
            disabled={!filterColumn || filterOptions.length === 0}
          >
            <option value="">{filterColumn ? (filterOptions.length ? "Select Value" : "No Values Available") : "Select Column First"}</option>
            {filterOptions.map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
          <button
            onClick={() => { setFilterColumn(""); setFilterValue(""); allRows.length > 0 && setData(composeView(allRows)); }}
            className="w-full py-3 text-sm font-medium bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition-all duration-200"
          >
            Clear Filter
          </button>
        </div>

        {/* Arrange Data */}
        <div className="mb-8">
          <label className="block text-sm font-semibold text-gray-700 mb-3">Sort By</label>
          <select
            className="w-full mb-3 px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
            value={primarySortKey}
            onChange={(e) => setPrimarySortKey(e.target.value as ColumnKey || "")}
          >
            <option value="">Primary Sort (None)</option>
            {ALL_COLUMNS.map((c) => (
              <option key={c.key} value={c.key}>{c.label}</option>
            ))}
          </select>
          <select
            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 disabled:opacity-50"
            value={secondarySortKey}
            onChange={(e) => setSecondarySortKey(e.target.value as ColumnKey || "")}
            disabled={!primarySortKey}
          >
            <option value="">Secondary Sort (None)</option>
            {ALL_COLUMNS.map((c) => (
              <option key={c.key} value={c.key}>{c.label}</option>
            ))}
          </select>
        </div>

        <button
          onClick={() => allRows.length > 0 && setData(composeView(allRows))}
          className="w-full py-3 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 shadow-md"
        >
          Apply Changes
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto bg-gray-50">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-800">{COMPANY_NAME} - Booking Order Report</h1>
          <div className="text-sm font-medium text-gray-600">{new Date().toLocaleDateString()}</div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-4 mb-8">
          <button
            onClick={() => loadDataForPreview(false)}
            disabled={loading}
            className="px-6 py-3 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50 transition-all duration-200 shadow-md"
          >
            {loading ? "Loading..." : "Preview All Data"}
          </button>
          <button
            onClick={() => loadDataForPreview(true)}
            disabled={loading}
            className="px-6 py-3 bg-green-500 text-white text-sm font-semibold rounded-lg hover:bg-green-600 disabled:opacity-50 transition-all duration-200 shadow-md"
          >
            {loading ? "Loading..." : "Preview Generate Data"}
          </button>
          <button
            onClick={() => exportPDF(false)}
            disabled={loading}
            className="px-6 py-3 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-all duration-200 shadow-md"
          >
            Export PDF (All)
          </button>
          <button
            onClick={() => exportPDF(true)}
            disabled={loading}
            className="px-6 py-3 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-all duration-200 shadow-md"
          >
            Export PDF (Generate)
          </button>
          <button
            onClick={exportBiltiesReceivable}
            disabled={loading}
            className="px-6 py-3 bg-orange-600 text-white text-sm font-semibold rounded-lg hover:bg-orange-700 disabled:opacity-50 transition-all duration-200 shadow-md"
          >
            Bilties Receivable (PDF)
          </button>
          <button
            onClick={() => exportExcel(false)}
            disabled={loading}
            className="px-6 py-3 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-all duration-200 shadow-md"
          >
            Export Excel (All)
          </button>
          <button
            onClick={() => exportExcel(true)}
            disabled={loading}
            className="px-6 py-3 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-all duration-200 shadow-md"
          >
            Export Excel (Generate)
          </button>
          <button
            onClick={resetFilters}
            className="px-6 py-3 bg-gray-200 text-gray-800 text-sm font-semibold rounded-lg hover:bg-gray-300 transition-all duration-200 shadow-md"
          >
            Reset All
          </button>
        </div>

        {/* Preview Table */}
        {data.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">Data Preview</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  {headRows.map((row, rowIdx) => (
                    <tr key={rowIdx}>
                      {row.map((cell: any, cellIdx: number) => {
                        const content = typeof cell === "string" ? cell : cell.content;
                        const colSpan = typeof cell === "object" ? cell.colSpan || 1 : 1;
                        const rowSpan = typeof cell === "object" ? cell.rowSpan || 1 : 1;
                        return (
                          <th
                            key={cellIdx}
                            colSpan={colSpan}
                            rowSpan={rowSpan}
                            className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"
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
                    <tr key={rowIdx} className={`hover:bg-gray-50 transition-all duration-200 ${rowIdx % 2 === 0 ? "bg-white" : "bg-gray-50"}`}>
                      {colOrder.map((k, colIdx) => {
                        const v: any = row[k];
                        const displayValue = typeof v === "number" ? v.toLocaleString() : (v ?? "-");
                        return (
                          <td key={colIdx} className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
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
      </main>
    </div>
  );
};

export default BookingOrderReportExport;