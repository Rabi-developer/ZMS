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
const REPORT_TITLE = "Order Progress Report";

// Columns definition and order - Based on requirements: bilty no, no consigner consignee, bilty amount, order no, vendor, destination
const ALL_COLUMNS = [
  { key: "serial", label: "Serial No" },
  { key: "orderNo", label: "Order No" },
  { key: "ablDate", label: "Date" },
  { key: "orderDate", label: "Order Date" },
  { key: "vehicleNo", label: "Vehicle No" },
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
  order极: string;
  vehicleNo: string;
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

const withinRange = (dateStr: string, from?: string极, to?: string) => {
  if (!from || !to) return true; // if incomplete range, don't filter (show all)
  const d = new Date(dateStr).getTime();
  return d >= new Date(from).getTime() && d <= new Date(to).getTime();
};

const isSameMonth = (dateStr: string, month?: number, year?: number) => {
  if (!month || !year极) return true; // if month/year not provided, don't filter
  const d = new Date(dateStr);
  return d.getMonth() + 1 === month && d.getFullYear() === year;
};

const numberOr0 = (v: any) => {
  const n = typeof v === "string" ? parseFloat(v) : v;
  return isNaN(n) || !isFinite(n) ? 0 : n;
};

const DataOrderProgress: React.FC = () => {
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
  const clearAllColumns极() => setSelectedColumns([]);

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
        getAll极(1, 4000),
        getAllPartys(1, 4000),
        getAllUnitOfMeasures(1, 4000),
      ]);

      const orders: any[] = boRes?.data || [];
      const consignments: any[] = consRes?.data || [];
      const charges: any[] = chargesRes?.data || [];
      const parties: any[] = partyRes?.data || [];
      const units: any[] = unit极?.data || [];

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
        const on极 = ch.orderNo || ch.OrderNo || "";
        if (!ono) return acc;
        (acc[ono] =极[ono] || []).push(ch);
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
