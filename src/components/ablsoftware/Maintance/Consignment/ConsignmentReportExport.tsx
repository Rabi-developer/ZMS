"use client";
import React, { useCallback, useMemo, useState } from "react";
import { toast } from "react-toastify";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { getAllConsignment } from "@/apis/consignment";
import { getAllPartys } from "@/apis/party";
import { getAllUnitOfMeasures } from "@/apis/unitofmeasure";

// Company constants
const COMPANY_NAME = "AL NASAR BASHEER LOGISTICS";
const COMPANY_ADDRESS = "Suit No. 108, SP Chamber, Main Estate Avenue, SITE Karachi";
const COMPANY_PHONE = "Phone: +92 21 32550917-18";
const REPORT_TITLE = "Consignment Report (Detailed)";

// Columns definition and order based on Consignment interface
const ALL_COLUMNS = [
  { key: "serial", label: "Serial No" },
  { key: "receiptNo", label: "Receipt No" },
  { key: "orderNo", label: "Order No" },
  { key: "biltyNo", label: "Bilty No" },
  { key: "date", label: "Date" },
  { key: "consignmentNo", label: "Consignment No" },
  { key: "consignmentDate", label: "Consignment Date" },
  { key: "consignor", label: "Consignor" },
  { key: "consignee", label: "Consignee" },
  { key: "receiverName", label: "Receiver Name" },
  { key: "receiverContactNo", label: "Receiver Contact No" },
  { key: "shippingLine", label: "Shipping Line" },
  { key: "containerNo", label: "Container No" },
  { key: "port", label: "Port" },
  { key: "destination", label: "Destination" },
  { key: "items", label: "Items" },
  { key: "itemDesc", label: "Item Description" },
  { key: "qty", label: "Quantity" },
  { key: "weight", label: "Weight" },
  { key: "totalQty", label: "Total Qty" },
  { key: "freight", label: "Freight" },
  { key: "srbTax", label: "SRB Tax" },
  { key: "srbAmount", label: "SRB Amount" },
  { key: "deliveryCharges", label: "Delivery Charges" },
  { key: "insuranceCharges", label: "Insurance Charges" },
  { key: "tollTax", label: "Toll Tax" },
  { key: "otherCharges", label: "Other Charges" },
  { key: "totalAmount", label: "Total Amount" },
  { key: "receivedAmount", label: "Received Amount" },
  { key: "incomeTaxDed", label: "Income Tax Ded." },
  { key: "incomeTaxAmount", label: "Income Tax Amount" },
  { key: "deliveryDate", label: "Delivery Date" },
  { key: "freightFrom", label: "Freight From" },
  { key: "remarks", label: "Remarks" },
  { key: "status", label: "Status" },
] as const;

type ColumnKey = typeof ALL_COLUMNS[number]["key"];

type FilterType = "none" | "dateRange" | "status";

interface RowData {
  serial: number;
  receiptNo: string;
  orderNo: string;
  biltyNo: string;
  date: string;
  consignmentNo: string;
  consignmentDate: string;
  consignor: string;
  consignee: string;
  receiverName: string;
  receiverContactNo: string;
  shippingLine: string;
  containerNo: string;
  port: string;
  destination: string;
  items: string;
  itemDesc: string;
  qty: string;
  weight: string;
  totalQty: string;
  freight: string;
  srbTax: string;
  srbAmount: string;
  deliveryCharges: string;
  insuranceCharges: string;
  tollTax: string;
  otherCharges: string;
  totalAmount: string;
  receivedAmount: string;
  incomeTaxDed: string;
  incomeTaxAmount: string;
  deliveryDate: string;
  freightFrom: string;
  remarks: string;
  status: string;
}

const labelFor = (key: ColumnKey) => ALL_COLUMNS.find((c) => c.key === key)?.label || key;

const withinDateRange = (dateStr: string, from?: string, to?: string) => {
  if (!from || !to) return true;
  const d = new Date(dateStr).getTime();
  return d >= new Date(from).getTime() && d <= new Date(to).getTime();
};

const numberOrEmpty = (v: any): string => {
  if (v === undefined || v === null || v === "") return "";
  const n = typeof v === "string" ? parseFloat(v) : v;
  return isNaN(n) || !isFinite(n) ? "" : n.toString();
};

const formatItems = (items: any): string => {
  if (!items) return "";
  if (Array.isArray(items)) {
    return items.map((item: any) => 
      `${item.desc || ''} (${item.qty || ''} ${item.qtyUnit || ''})`
    ).filter(Boolean).join(", ");
  }
  return items.toString();
};

const ConsignmentReportExport: React.FC = () => {
  const today = useMemo(() => new Date(), []);

  // Filters
  const [filterType, setFilterType] = useState<FilterType>("none");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("All");
  const [orderNoFilter, setOrderNoFilter] = useState<string>("");

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
    setSelectedStatus("All");
    setOrderNoFilter("");
  };

  const generateData = useCallback(async (): Promise<RowData[]> => {
    setLoading(true);
    try {
      // Fetch datasets with large page sizes
      const [consRes, partyRes, unitRes] = await Promise.all([
        getAllConsignment(1, 4000),
        getAllPartys(1, 4000),
        getAllUnitOfMeasures(1, 4000),
      ]);

      const consignments: any[] = consRes?.data || [];
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

      // Filter consignments
      const filteredConsignments = consignments.filter((c) => {
        // Order number filter
        if (orderNoFilter && !(c.orderNo || "").toLowerCase().includes(orderNoFilter.toLowerCase())) {
          return false;
        }

        // Status filter
        if (selectedStatus !== "All" && c.status !== selectedStatus) {
          return false;
        }

        // Date range filter
        const consignmentDate = c.consignmentDate || c.date || "";
        if (filterType === "dateRange" && consignmentDate) {
          return withinDateRange(consignmentDate, fromDate, toDate);
        }

        return true;
      });

      // Map to rows
      const rows: RowData[] = filteredConsignments.map((c, idx) => {
        // Map party IDs to names
        const consignorName = partyMap.get(String(c.consignor || "")) || c.consignor || "";
        const consigneeName = partyMap.get(String(c.consignee || "")) || c.consignee || "";

        // Format items if they exist as array
        const formattedItems = formatItems(c.items);

        return {
          serial: idx + 1,
          receiptNo: c.receiptNo || "",
          orderNo: c.orderNo || "",
          biltyNo: c.biltyNo || "",
          date: c.date || "",
          consignmentNo: c.consignmentNo || "",
          consignmentDate: c.consignmentDate || "",
          consignor: consignorName,
          consignee: consigneeName,
          receiverName: c.receiverName || "",
          receiverContactNo: c.receiverContactNo || "",
          shippingLine: c.shippingLine || "",
          containerNo: c.containerNo || "",
          port: c.port || "",
          destination: c.destination || "",
          items: formattedItems,
          itemDesc: c.itemDesc || "",
          qty: c.qty || "",
          weight: c.weight || "",
          totalQty: c.totalQty || "",
          freight: numberOrEmpty(c.freight),
          srbTax: numberOrEmpty(c.srbTax),
          srbAmount: numberOrEmpty(c.srbAmount),
          deliveryCharges: numberOrEmpty(c.deliveryCharges),
          insuranceCharges: numberOrEmpty(c.insuranceCharges),
          tollTax: numberOrEmpty(c.tollTax),
          otherCharges: numberOrEmpty(c.otherCharges),
          totalAmount: numberOrEmpty(c.totalAmount),
          receivedAmount: numberOrEmpty(c.receivedAmount),
          incomeTaxDed: numberOrEmpty(c.incomeTaxDed),
          incomeTaxAmount: numberOrEmpty(c.incomeTaxAmount),
          deliveryDate: c.deliveryDate || "",
          freightFrom: c.freightFrom || "",
          remarks: c.remarks || "",
          status: c.status || "Pending",
        };
      });

      return rows;
    } catch (err: any) {
      console.error("Failed to generate consignment data", err);
      toast.error("Failed to fetch consignment data for report");
      return [];
    } finally {
      setLoading(false);
    }
  }, [filterType, fromDate, toDate, selectedStatus, orderNoFilter]);

  const exportPDF = useCallback(async () => {
    const data = await generateData();
    if (data.length === 0) {
      toast.info("No consignment data to export");
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
    let filterLine = "All consignments";
    if (filterType === "dateRange" && fromDate && toDate) {
      filterLine = `Date Range: ${fromDate} to ${toDate}`;
    }
    if (selectedStatus !== "All") {
      filterLine += filterLine !== "All consignments" ? ` | Status: ${selectedStatus}` : `Status: ${selectedStatus}`;
    }
    if (orderNoFilter) {
      filterLine += filterLine !== "All consignments" ? ` | Order No: ${orderNoFilter}` : `Order No: ${orderNoFilter}`;
    }
    doc.text(filterLine, pageWidth / 2, 108, { align: "center" });

    // Separator line
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(1);
    doc.line(40, 116, pageWidth - 40, 116);

    // Table data
    const tableBody = data.map((row) =>
      selectedColumns.map((key) => (row as any)[key] || "-")
    );

    const headers = selectedColumns.map(key => labelFor(key));

    autoTable(doc, {
      startY: 128,
      head: [headers],
      body: tableBody,
      styles: {
        font: "helvetica",
        fontSize: 8,
        cellPadding: 4,
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
        fontSize: 9,
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

    const filename = `${COMPANY_NAME.replace(/\s+/g, "_")}_Consignment_Report.pdf`;
    doc.save(filename);
    toast.success("PDF generated successfully");
  }, [generateData, selectedColumns, filterType, fromDate, toDate, selectedStatus, orderNoFilter]);

  const exportExcel = useCallback(async () => {
    const data = await generateData();
    if (data.length === 0) {
      toast.info("No consignment data to export");
      return;
    }

    // Top header lines
    const wsData: any[][] = [];
    wsData.push([COMPANY_NAME]);
    wsData.push([COMPANY_ADDRESS]);
    wsData.push([COMPANY_PHONE]);
    wsData.push([REPORT_TITLE]);
    
    let headerLine = "All consignments";
    if (filterType === "dateRange" && fromDate && toDate) {
      headerLine = `Date Range: ${fromDate} to ${toDate}`;
    }
    if (selectedStatus !== "All") {
      headerLine += headerLine !== "All consignments" ? ` | Status: ${selectedStatus}` : `Status: ${selectedStatus}`;
    }
    if (orderNoFilter) {
      headerLine += headerLine !== "All consignments" ? ` | Order No: ${orderNoFilter}` : `Order No: ${orderNoFilter}`;
    }
    wsData.push([headerLine]);
    wsData.push([]); // spacer row

    // Table header
    const headers = selectedColumns.map(key => labelFor(key));
    wsData.push(headers);

    // Data rows
    data.forEach((row) => {
      wsData.push(selectedColumns.map((key) => (row as any)[key] || "-"));
    });

    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Merges for top company header lines across all columns
    const colCount = selectedColumns.length || 1;
    const merges: XLSX.Range[] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: Math.max(colCount - 1, 0) } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: Math.max(colCount - 1, 0) } },
      { s: { r: 2, c: 0 }, e: { r: 2, c: Math.max(colCount - 1, 0) } },
      { s: { r: 3, c: 0 }, e: { r: 3, c: Math.max(colCount - 1, 0) } },
      { s: { r: 4, c: 0 }, e: { r: 4, c: Math.max(colCount - 1, 0) } },
    ];

    (ws as
