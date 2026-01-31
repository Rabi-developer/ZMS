"use client";
import React, { useCallback, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { format } from "date-fns";
import { Tooltip } from "react-tooltip";
import "react-tooltip/dist/react-tooltip.css";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AiOutlineDownload } from "react-icons/ai";
import { LuRefreshCcw } from "react-icons/lu";
import { WiRefreshAlt } from "react-icons/wi";
import { MdOutlineDoNotDisturbAlt } from "react-icons/md";

import { getAllBookingOrder } from '@/apis/bookingorder';
import { getAllConsignment } from '@/apis/consignment';
import { getAllCharges } from '@/apis/charges';
import { getAllPartys } from '@/apis/party';
import { getAllUnitOfMeasures } from '@/apis/unitofmeasure';
import { getAllBiltyPaymentInvoice } from '@/apis/biltypaymentnnvoice';
import { getAllPaymentABL } from '@/apis/paymentABL';
import { getAllBrooker } from '@/apis/brooker';
import { getAllVendor } from '@/apis/vendors';
import { exportBookingOrderToExcel } from './BookingOrderExcel';
import { exportBiltiesReceivableToPDF } from "@/components/ablsoftware/Maintance/common/BiltiesReceivablePdf";
import { exportGeneralBookingOrderToPDF } from './BookingOrderGeneralPdf';
import { exportDetailBookingOrderToPDF } from './BookingOrderDetailPdf';
import { exportBrokerBillStatusToPDF, BrokerBillRow } from './BrokerBillStatusPdf';
import type { ColumnKey } from '@/components/ablsoftware/Maintance/common/BookingOrderTypes';


// Company constant
const COMPANY_NAME = "AL NASAR BASHEER LOGISTICS";

// Use the imported ColumnKey type directly

interface RowData {
  serial: number | string;
  orderNo: string;
  orderDate: string;
  vehicleNo: string;
  bookingAmount: number;
  biltyNo: string;
  biltyAmount: number;
  consignmentFreight: number;
  consignor: string;
  consignee: string;
  article: string;
  qty: string;
  departure: string;
  destination: string;
  vendor: string;
  carrier: string;
  isOrderRow: boolean;
  ablDate: string;
}

const ALL_COLUMNS: { key: ColumnKey; label: string; tooltip: string }[] = [
  { key: "serial", label: "SNo", tooltip: "Unique row number" },
  { key: "orderNo", label: "Order No", tooltip: "Booking order number" },
  { key: "orderDate", label: "Order Date", tooltip: "Date of the order" },
  { key: "vehicleNo", label: "Vehicle No", tooltip: "Vehicle registration number" },
  { key: "bookingAmount", label: "Freight", tooltip: "Total charges amount for the order" },
  { key: "biltyNo", label: "Bilty No", tooltip: "Consignment order number" },
  { key: "biltyAmount", label: "Bilty Amount", tooltip: "Freight amount for consignment" },
  { key: "consignor", label: "Consignor", tooltip: "Party sending the goods" },
  { key: "consignee", label: "Consignee", tooltip: "Party receiving the goods" },
  { key: "article", label: "Article", tooltip: "Description of items" },
  { key: "qty", label: "Quantity", tooltip: "Quantity of items" },
  { key: "departure", label: "Departure", tooltip: "Starting location" },
  { key: "destination", label: "Destination", tooltip: "Ending location" },
  { key: "vendor", label: "Vendor", tooltip: "Vendor name" },
  { key: "carrier", label: "Carrier", tooltip: "Transporter name" },
];

const GENERAL_COLUMNS: ColumnKey[] = [
  "serial",
  "orderNo",
  "orderDate",
  "vehicleNo",
  "bookingAmount",
  "departure",
  "destination",
  "vendor",
];

const DETAIL_COLUMNS: ColumnKey[] = [
  "serial",
  "orderNo",
  "orderDate",
  "vehicleNo",
  "bookingAmount",
  "biltyNo",
  "biltyAmount",
  "consignor",
  "consignee",
  "article",
  "qty",
  "departure",
  "destination",
  "vendor",
];

const labelFor = (key: ColumnKey): string => ALL_COLUMNS.find(c => c.key === key)?.label || key;
const tooltipFor = (key: ColumnKey): string => ALL_COLUMNS.find(c => c.key === key)?.tooltip || "";

const formatDate = (dateStr?: string): string => {
  if (!dateStr || dateStr === "string" || dateStr === "") return "-";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "-";
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear() % 100;
  return `${day}-${month}-${year}`;
};

const formatOrderNo = (orderNo: string, dateStr?: string): string => {
  if (!dateStr || dateStr === "string" || dateStr === "") return `ABL/${orderNo}/-/--`;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return `ABL/${orderNo}/-/--`;
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = (d.getFullYear() % 100).toString().padStart(2, '0');
  return `ABL/${orderNo}/${month}/${year}`;
};

const withinRange = (dateStr: string, from?: string, to?: string) => {
  if (!from || !to || from === "" || to === "") return true;
  if (!dateStr || dateStr === "string" || dateStr === "") return true;
  const d = new Date(dateStr).getTime();
  return d >= new Date(from).getTime() && d <= new Date(to).getTime();
};

const numberOr0 = (v: any) => {
  const n = typeof v === "string" ? parseFloat(v) : v;
  return isNaN(n) || !isFinite(n) ? 0 : n;
};

const formatNumber = (v: any): string => {
  const num = numberOr0(v);
  return num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const BookingOrderReportExport: React.FC = () => {
  const today = useMemo(() => new Date(), []);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [data, setData] = useState<RowData[]>([]);
  const [billPaymentInvoices, setBillPaymentInvoices] = useState<any[]>([]);
  const [paymentABL, setPaymentABL] = useState<any[]>([]);
  const [brokers, setBrokers] = useState<any[]>([]);
  const [selectedBroker, setSelectedBroker] = useState<string>("All");
  const [totalBookingAmount, setTotalBookingAmount] = useState<string | null>(null);
  const [totalBiltyAmount, setTotalBiltyAmount] = useState<string | null>(null);
  const [isGeneralView, setIsGeneralView] = useState(true);
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [activeTab, setActiveTab] = useState<'booking' | 'bilty' | 'brokerBill'>('booking');

  const generateData = useCallback(async (isGeneral: boolean): Promise<RowData[]> => {
    setIsLoading(true);
    try {
      const [boRes, consRes, chargesRes, partyRes, unitRes, venRes, billInvRes, payAblRes, brokerRes] = await Promise.all([
        getAllBookingOrder(1, 2000),
        getAllConsignment(1, 4000),
        getAllCharges(1, 4000),
        getAllPartys(1, 4000),
        getAllUnitOfMeasures(1, 4000),
        getAllVendor(1, 4000),
        getAllBiltyPaymentInvoice(1, 2000),
        getAllPaymentABL(1, 2000),
        getAllBrooker(1, 2000),
      ]);

      const orders: any[] = boRes?.data || [];
      const consignments: any[] = consRes?.data || [];
      const charges: any[] = chargesRes?.data || [];
      const parties: any[] = partyRes?.data || [];
      const units: any[] = unitRes?.data || [];
      const vendors: any[] = venRes?.data || [];
      
      setBillPaymentInvoices(billInvRes?.data || []);
      setPaymentABL(payAblRes?.data || []);
      setBrokers(brokerRes?.data || []);

      const partyMap = new Map<string, string>(
        parties.map((p: any) => [String(p?.id ?? p?.Id ?? ""), p?.name || p?.Name || ""]) as [string, string][]
      );
      const unitMap = new Map<string, string>(
        units.map((u: any) => [String(u?.id ?? u?.Id ?? ""), u?.name || u?.unitName || u?.description || ""]) as [string, string][]
      );
      const vendorMap = new Map<string, string>(
        vendors.map((v: any) => [String(v?.id ?? v?.Id ?? v?.vendorId ?? ""), v?.name || v?.Name || v?.vendorName || ""]) as [string, string][]
      );

      const consByOrder = consignments.reduce((acc: Record<string, any[]>, c: any) => {
        const ono = String(c.orderNo || c.OrderNo || "");
        if (ono) acc[ono] = (acc[ono] || []).concat(c);
        return acc;
      }, {});

      const chargesByOrder = charges.reduce((acc: Record<string, any[]>, ch: any) => {
        const ono = String(ch.orderNo || ch.OrderNo || "");
        if (ono) acc[ono] = (acc[ono] || []).concat(ch);
        return acc;
      }, {});

      const filteredOrders = orders
        .filter((o) => withinRange(o.orderDate || o.date || o.createdAt, fromDate, toDate))
        .sort((a, b) => {
          const aOrderNo = String(a.orderNo || a.id || "");
          const bOrderNo = String(b.orderNo || b.id || "");
          const aNum = parseInt(aOrderNo, 10);
          const bNum = parseInt(bOrderNo, 10);
          if (!isNaN(aNum) && !isNaN(bNum)) {
            return aNum - bNum;
          }
          return aOrderNo.localeCompare(bOrderNo);
        });

      let serialCounter = 1;
      const rows: RowData[] = filteredOrders.flatMap((o) => {
        const ono = String(o.orderNo || o.id || "");
        const odate = o.orderDate || o.date || o.createdAt || "";
        const cons = consByOrder[ono] || [];
        const chargesForOrder = chargesByOrder[ono] || [];
        const bookingAmount = chargesForOrder.reduce((sum: number, ch: any) => {
          const lines = Array.isArray(ch.lines) ? ch.lines : [];
          return sum + lines.reduce((lineSum: number, line: any) => lineSum + numberOr0(line.amount), 0);
        }, 0);
        const vehicleNo = o.vehicleNo || o.vehicle || "-";
        const departure = o.fromLocation || o.from || "-";
        const destination = o.toLocation || o.to || "-";
        const vendorVal = o.vendorId ?? o.vendor ?? o.VendorId ?? o.Vendor ?? "";
        const vendor = vendorMap.get(String(vendorVal)) || o.vendorName || String(vendorVal) || "-";
        const carrier = o.transporter || o.carrier || "-";
        const consignorVal = o.consignor ?? o.Consignor ?? o.consignorId ?? o.ConsignorId ?? "";
        const consignor = partyMap.get(String(consignorVal)) || String(consignorVal) || "-";
        const consigneeVal = o.consignee ?? o.Consignee ?? o.consigneeId ?? o.ConsigneeId ?? "";
        const consignee = partyMap.get(String(consigneeVal)) || String(consigneeVal) || "-";

        const orderRow: RowData = {
          serial: serialCounter++,
          orderNo: formatOrderNo(ono, odate),
          orderDate: formatDate(odate),
          vehicleNo,
          bookingAmount,
          biltyNo: cons.length > 0 ? cons[0].biltyNo || cons[0].BiltyNo || cons[0].consignmentNo || cons[0].ConsignmentNo || "-" : "-",
          biltyAmount: 0,
          consignmentFreight: 0,
          consignor,
          consignee,
          article: "-",
          qty: "-",
          departure,
          destination,
          vendor,
          carrier,
          isOrderRow: true,
          ablDate: formatDate(odate),
        };

        if (isGeneral) {
          return [{
            ...orderRow,
            biltyNo: "-",
            article: "-",
            qty: cons.length.toString(),
            isOrderRow: true,
            ablDate: formatDate(odate),
          }];
        } else {
          const consignmentRows: RowData[] = cons.length > 0 ? cons.map((c: any) => {
            const consignorVal = c.consignor ?? c.Consignor ?? c.consignorId ?? c.ConsignorId ?? "";
            const consignor = partyMap.get(String(consignorVal)) || String(consignorVal) || "-";
            const consigneeVal = c.consignee ?? c.Consignee ?? c.consigneeId ?? c.ConsigneeId ?? "";
            const consignee = partyMap.get(String(consigneeVal)) || String(consigneeVal) || "-";
            const biltyNo = c.biltyNo || c.BiltyNo || c.consignmentNo || c.ConsignmentNo || "-";
            const consignmentFreight = numberOr0(c.freight);
            let article = "-";
            let qty = "-";
            if (Array.isArray(c.items) && c.items.length > 0) {
              article = c.items
                .map((it: any) => it.desc || it.description || it.itemDesc || it.Description || "")
                .filter(Boolean)
                .join(", ") || "-";
              qty = c.items
                .map((it: any) => {
                  const unitKey = it.qtyUnit || it.qtyUnitId || it.QtyUnit || it.QtyUnitId || "";
                  const unitName = unitMap.get(String(unitKey)) || String(unitKey) || "";
                  return `${it.qty || it.Qty || ""} ${unitName}`.trim();
                })
                .filter(Boolean)
                .join(", ") || "-";
            } else {
              article = c.itemDesc || c.description || c.Description || (typeof c.items === "string" ? c.items : "") || "-";
              qty = String(c.qty || c.Qty || "") || "-";
            }
            return {
              serial: "",
              orderNo: "",
              orderDate: "",
              vehicleNo: "",
              bookingAmount: 0,
              biltyNo,
              biltyAmount: consignmentFreight,
              consignmentFreight,
              consignor,
              consignee,
              article,
              qty,
              departure: "",
              destination: "",
              vendor: "",
              carrier: "",
              isOrderRow: false,
              ablDate: formatDate(odate),
            };
          }) : [{
            serial: "",
            orderNo: "",
            orderDate: "",
            vehicleNo: "",
            bookingAmount: 0,
            biltyNo: "-",
            biltyAmount: 0,
            consignmentFreight: 0,
            consignor: "",
            consignee: "",
            article: "-",
            qty: "-",
            departure: "",
            destination: "",
            vendor: "",
            carrier: "",
            isOrderRow: false,
            ablDate: formatDate(odate),
          }];

          return [orderRow, ...consignmentRows];
        }
      });

      return rows;
    } catch (err) {
      console.error("Failed to generate data", err);
      toast.error("Failed to fetch data for report");
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [fromDate, toDate]);

  const buildStructure = (selected: ColumnKey[], isGeneral: boolean) => {
    const selectedSet = new Set<ColumnKey>(selected);
    const fixedKeys = ['serial'] as const;
    const contractKeys = ['orderNo', 'orderDate'] as const;
    const vehicleKeys = ['vehicleNo', 'bookingAmount'] as const;
    const biltyKeys = ['biltyNo', 'biltyAmount'] as const;
    const partyKeys = ['consignor', 'consignee'] as const;
    const tailKeys = ['article', 'qty', 'departure', 'destination', 'vendor'] as const;

    const fixed = fixedKeys.filter(k => selectedSet.has(k)) as ColumnKey[];
    const contractSubs = contractKeys.filter(k => selectedSet.has(k)) as ColumnKey[];
    const vehicleSubs = vehicleKeys.filter(k => selectedSet.has(k)) as ColumnKey[];
    const biltySubs = biltyKeys.filter(k => selectedSet.has(k)) as ColumnKey[];
    const partySubs = partyKeys.filter(k => selectedSet.has(k)) as ColumnKey[];
    const tail = tailKeys.filter(k => selectedSet.has(k)) as ColumnKey[];

    const colOrder: ColumnKey[] = isGeneral 
      ? [...fixed, ...contractSubs, ...vehicleSubs, 'departure', 'destination', 'vendor']
      : [...fixed, ...contractSubs, ...vehicleSubs, ...biltySubs, ...partySubs, ...tail.filter(k => k !== 'departure' && k !== 'destination' && k !== 'vendor')];

    if (isGeneral) {
      const topRow: any[] = [{ content: "General Contract", colSpan: colOrder.length }];
      const secondRow: any[] = [];
      fixed.forEach(k => secondRow.push({ content: labelFor(k), rowSpan: 2 }));
      if (contractSubs.length > 0) secondRow.push({ content: "Order", colSpan: contractSubs.length });
      if (vehicleSubs.length > 0) secondRow.push({ content: "Vehicle", colSpan: vehicleSubs.length });
      secondRow.push({ content: labelFor('departure'), rowSpan: 2 });
      secondRow.push({ content: labelFor('destination'), rowSpan: 2 });
      secondRow.push({ content: labelFor('vendor'), rowSpan: 2 });
      const subRow: any[] = [];
      if (contractSubs.length > 0) contractSubs.forEach(k => subRow.push(labelFor(k)));
      if (vehicleSubs.length > 0) vehicleSubs.forEach(k => subRow.push(labelFor(k)));
      const headRows = subRow.length > 0 ? [topRow, secondRow, subRow] : [topRow, secondRow];
      return { colOrder, headRows, drawSeparators: false };
    } else {
      return { colOrder, headRows: [], drawSeparators: true };
    }
  };

  const computeFilterLine = () => {
    if (!fromDate && !toDate) return "All Orders";
    return `Date Range: ${formatDate(fromDate)} to ${formatDate(toDate)}`;
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const rows = await generateData(isGeneralView);
      setData(rows);
      setTotalBookingAmount(rows.reduce((acc, row) => acc + (row.isOrderRow ? row.bookingAmount : 0), 0).toLocaleString());
      setTotalBiltyAmount(rows.reduce((acc, row) => acc + (row.isOrderRow ? 0 : row.consignmentFreight), 0).toLocaleString());
      toast.success("Report generated successfully.");
    } catch (error) {
      console.error("Error generating report:", error);
      toast.error("Failed to generate report.");
    } finally {
      setIsGenerating(false);
    }
  };

  const exportGeneralPDF = useCallback(async () => {
    if (!data.length) {
      toast.error("No data to export.");
      return;
    }
    const columnsToUse = GENERAL_COLUMNS;
    const { colOrder, headRows } = buildStructure(columnsToUse, true);
    const filterLine = computeFilterLine();
    const reportTypeLabel = "GENERAL REPORT";
    exportGeneralBookingOrderToPDF(data, columnsToUse, `${reportTypeLabel} | ${filterLine}`, colOrder, headRows, fromDate, toDate);
    toast.success("PDF generated");
  }, [data, fromDate, toDate]);

  const exportDetailPDF = useCallback(async () => {
    if (!data.length) {
      toast.error("No data to export.");
      return;
    }
    const columnsToUse = [...DETAIL_COLUMNS, 'carrier'] as ColumnKey[];
    const { colOrder, headRows } = buildStructure(columnsToUse, false);
    const pdfData = data.map(row => ({
      ...row,
      biltyAmount: row.isOrderRow ? row.biltyAmount : row.consignmentFreight,
    }));
    const filterLine = computeFilterLine();
    const reportTypeLabel = "DETAIL REPORT";
    exportDetailBookingOrderToPDF(pdfData, columnsToUse, `${reportTypeLabel} | ${filterLine}`, colOrder, headRows, fromDate, toDate);
    toast.success("PDF generated");
  }, [data, fromDate, toDate]);

  const exportExcel = useCallback(async (isGeneral: boolean) => {
    if (!data.length) {
      toast.error("No data to export.");
      return;
    }
    const columnsToUse = isGeneral ? GENERAL_COLUMNS : [...DETAIL_COLUMNS, 'carrier'] as ColumnKey[];
    const { colOrder, headRows, drawSeparators } = buildStructure(columnsToUse, isGeneral);
    exportBookingOrderToExcel(data, columnsToUse, computeFilterLine(), colOrder, headRows);
    toast.success("Excel generated");
  }, [data]);

  const exportBiltiesReceivable = useCallback(async () => {
    if (!data.length) {
      toast.error("No data to export.");
      return;
    }
    const receivableRows = data.filter(r => !r.isOrderRow && (!r.biltyNo || r.biltyNo === "-"));
    if (!receivableRows.length) {
      toast.info("No receivable entries.");
      return;
    }
    const pdfRows = receivableRows.map(r => ({
      serial: typeof r.serial === "number" ? r.serial : 0,
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
      ablDate: r.ablDate || formatDate(r.orderDate) || "-",
    }));
    exportBiltiesReceivableToPDF({ rows: pdfRows, startDate: fromDate, endDate: toDate });
    toast.success("Bilties Receivable PDF generated");
  }, [data, fromDate, toDate]);

  const exportBrokerBills = useCallback(async (type: 'Paid' | 'Unpaid') => {
    if (!billPaymentInvoices.length) {
      toast.error("No bill payment invoices found. Please generate report first.");
      return;
    }

    // Filter invoices by date range if provided
    const filteredInvoices = billPaymentInvoices.filter(inv => 
      withinRange(inv.paymentDate, fromDate, toDate)
    );

    const brokerBillRows: BrokerBillRow[] = [];
    let serial = 1;

    filteredInvoices.forEach(inv => {
      // Determine if this invoice is "Paid" or "Unpaid"
      // Based on user description: PaymentABL entries with same order amount clear means it's paid
      
      (inv.lines || []).forEach((line: any) => {
        if (line.isAdditionalLine) return;

        const orderNo = line.orderNo;
        const invoiceAmount = line.amount || 0;
        const brokerName = line.broker || "-";

        // Filter by broker if selected
        if (selectedBroker !== "All" && brokerName !== selectedBroker) {
          return;
        }
        
        // Find matching payment in PaymentABL
        const payments = paymentABL.filter(p => 
          (p.paymentABLItems || p.paymentABLItem || []).some((item: any) => item.orderNo === orderNo)
        );

        const totalPaid = payments.reduce((sum, p) => {
          const item = (p.paymentABLItems || p.paymentABLItem || []).find((i: any) => i.orderNo === orderNo);
          return sum + (Number(item?.paidAmount) || 0);
        }, 0);

        const balance = invoiceAmount - totalPaid;
        const isPaid = balance <= 0;

        if ((type === 'Paid' && isPaid) || (type === 'Unpaid' && !isPaid)) {
          brokerBillRows.push({
            serial: serial++,
            orderNo: orderNo,
            orderDate: inv.paymentDate, // Using invoice date as a reference
            vehicleNo: line.vehicleNo || "-",
            brokerName: line.broker || "-",
            amount: invoiceAmount,
            paidAmount: totalPaid,
            balance: balance,
            status: isPaid ? "Paid" : "Unpaid"
          });
        }
      });
    });

    if (brokerBillRows.length === 0) {
      toast.info(`No ${type} bills found in this date range.`);
      return;
    }

    exportBrokerBillStatusToPDF(brokerBillRows, type, fromDate, toDate);
    toast.success(`${type} Broker Bills PDF generated`);
  }, [billPaymentInvoices, paymentABL, fromDate, toDate, selectedBroker]);

  const columnsToDisplay = isGeneralView ? GENERAL_COLUMNS : DETAIL_COLUMNS;
  const { colOrder, headRows, drawSeparators } = buildStructure(columnsToDisplay, isGeneralView);

  // Group data for Detail Report
  const groupedData = useMemo(() => {
    if (isGeneralView || !data.length) return [];
    const groups: { order: RowData; consignments: RowData[] }[] = [];
    let currentGroup: { order: RowData; consignments: RowData[] } | null = null;
    data.forEach(row => {
      if (row.isOrderRow) {
        if (currentGroup) groups.push(currentGroup);
        currentGroup = { order: row, consignments: [] };
      } else if (currentGroup) {
        currentGroup.consignments.push(row);
      }
    });
    if (currentGroup) groups.push(currentGroup);
    return groups;
  }, [data, isGeneralView]);

  const detailHeaderColumns = [
    { label: "SNo", width: "w-16" },
    { label: "Order No", width: "w-32" },
    { label: "Order Date", width: "w-24" },
    { label: "Vehicle No", width: "w-24" },
    { label: "Freight", width: "w-24" },
    { label: "Bilty No", width: "w-24" },
    { label: "Bilty Amount", width: "w-24" },
    { label: "Consignor", width: "w-40" },
    { label: "Consignee", width: "w-40" },
    { label: "Article", width: "w-40" },
    { label: "Qty", width: "w-20" },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <h1 className="text-4xl font-bold text-gray-900">Booking Order Reports</h1>
            <div className="text-sm font-medium text-gray-600">
              {today.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" })}
            </div>
          </div>
          <p className="mt-2 text-lg font-semibold text-gray-700">{COMPANY_NAME}</p>
        </div>

        <div className="mb-6 rounded-2xl shadow">
          <div className="flex gap-4 border-b border-gray-200">
            <button
              className={`flex-1 py-3 px-4 text-sm font-semibold rounded transition-all 
                ${activeTab === 'booking' 
                  ? 'text-[#9630ed] border-b-2 border-[#9630ed] rounded-2xl shadow' 
                  : 'text-gray-700 hover:text-black hover:border-b-2 hover:border-gray-300'
                }`}
              onClick={() => setActiveTab('booking')}
            >
              Booking Orders
            </button>
            <button
              className={`flex-1 py-3 px-4 text-sm font-semibold rounded-t-2xl transition-all 
                ${activeTab === 'bilty' 
                  ? 'text-green-500 border-b-2 border-green-500 rounded-2xl shadow' 
                  : 'text-gray-700 hover:text-black hover:border-b-2 hover:border-gray-300'
                }`}
              onClick={() => setActiveTab('bilty')}
            >
              Bilties Receivable
            </button>
            <button
              className={`flex-1 py-3 px-4 text-sm font-semibold rounded-t-2xl transition-all 
                ${activeTab === 'brokerBill' 
                  ? 'text-orange-500 border-b-2 border-orange-500 rounded-2xl shadow' 
                  : 'text-gray-700 hover:text-black hover:border-b-2 hover:border-gray-300'
                }`}
              onClick={() => setActiveTab('brokerBill')}
            >
              Broker Bills
            </button>
          </div>
        </div>

        <div className="space-y-6 bg-white p-6 rounded-2xl border mb-8">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">Start Date</label>
              <input
                type="date"
                id="startDate"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="mt-1 block w-full h-12 border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">End Date</label>
              <input
                type="date"
                id="endDate"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="mt-1 block w-full h-12 border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            {activeTab === 'brokerBill' && (
              <div>
                <label htmlFor="broker" className="block text-sm font-medium text-gray-700">Broker Name</label>
                <select
                  id="broker"
                  value={selectedBroker}
                  onChange={(e) => setSelectedBroker(e.target.value)}
                  className="mt-1 block w-full h-12 border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 px-3"
                >
                  <option value="All">All Brokers</option>
                  {brokers.map((b) => (
                    <option key={b.id} value={b.name}>{b.name}</option>
                  ))}
                </select>
              </div>
            )}
            <div className={`flex items-end ${activeTab !== 'booking' ? 'hidden' : ''}`}>
              <Button
                className={`w-full h-12 flex items-center hover:bg-[#c282fe] justify-center gap-2 font-medium rounded-lg transition-all ${isGeneralView ? 'bg-[#c282fe] text-white' : 'bg-gray-200 text-gray-700'}`}
                onClick={() => setIsGeneralView(true)}
              >
                General
              </Button>
            </div>
            <div className={`flex items-end ${activeTab !== 'booking' ? 'hidden' : ''}`}>
              <Button
                className={`w-full h-12 flex items-center hover:bg-[#c282fe] justify-center gap-2 font-medium rounded-lg transition-all ${!isGeneralView ? 'bg-[#c282fe] text-white' : 'bg-gray-200 text-gray-700'}`}
                onClick={() => setIsGeneralView(false)}
              >
                Detail
              </Button>
            </div>
            <div className="flex items-end">
              <Button
                onClick={handleGenerate}
                className="w-full h-12 flex items-center justify-center gap-2 text-white bg-[#181a26] hover:bg-[#181a26]/90 font-medium rounded-lg transition-all"
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <>
                    <WiRefreshAlt className="h-5 w-5 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <LuRefreshCcw className="h-5 w-5" />
                    Generate Report
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {activeTab === "booking" && (
          <>
            <div className="mt-6 p-6 rounded-xl grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                <h3 className="text-lg font-bold text-gray-900">Total Booking Amount</h3>
                <p className="text-2xl font-semibold text-gray-700 mt-2">{totalBookingAmount ?? '-'}</p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                <h3 className="text-lg font-bold text-gray-900">Total Bilty Amount</h3>
                <p className="text-2xl font-semibold text-gray-700 mt-2">{totalBiltyAmount ?? '-'}</p>
              </div>
            </div>

            {data.length > 0 && (
              <div className="flex justify-end mt-4 mr-2 space-x-4 mb-8">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="flex items-center gap-2 text-blue-600 border-blue-600 hover:bg-blue-50 px-4 py-2 rounded-lg transition-all"
                    >
                      <AiOutlineDownload className="h-5 w-5" />
                      Booking Order General
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={exportGeneralPDF}>PDF</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => exportExcel(true)}>Excel</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="flex items-center gap-2 text-blue-600 border-blue-600 hover:bg-blue-50 px-4 py-2 rounded-lg transition-all"
                    >
                      <AiOutlineDownload className="h-5 w-5" />
                      Report All Details
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={exportDetailPDF}>PDF</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => exportExcel(false)}>Excel</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}

            {data.length > 0 ? (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                {isGeneralView ? (
                  <div className="overflow-x-auto max-h-[400px]">
                    <table className="min-w-[1400px] w-full divide-y divide-gray-200">
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
                                  data-tooltip-id={`header-${cellIdx}`}
                                  data-tooltip-content={content}
                                >
                                  {content}
                                  <Tooltip id={`header-${cellIdx}`} />
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
                            className={`hover:bg-gray-50 ${rowIdx % 2 === 0 ? "bg-white" : "bg-gray-50"} ${row.isOrderRow ? "font-semibold" : "pl-4"}`}
                          >
                            {colOrder.map((k, colIdx) => {
                              const v: any = row[k];
                              const displayValue = k === "bookingAmount" && !row.isOrderRow ? "-" : (typeof v === "number" ? formatNumber(v) : v ?? "-");
                              return (
                                <td
                                  key={colIdx}
                                  className={`px-6 py-2 text-xs text-gray-900 whitespace-nowrap ${row.isOrderRow ? "" : "pl-8"}`}
                                  data-tooltip-id={`cell-${rowIdx}-${colIdx}`}
                                  data-tooltip-content={tooltipFor(k)}
                                >
                                  {displayValue}
                                  <Tooltip id={`cell-${rowIdx}-${colIdx}`} />
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="overflow-x-auto max-h-[400px]">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-100 sticky top-0 z-10">
                        <tr>
                          {detailHeaderColumns.map((col, idx) => (
                            <th
                              key={idx}
                              className={`px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider ${col.width}`}
                            >
                              {col.label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {groupedData.map((group, groupIdx) => (
                          <React.Fragment key={groupIdx}>
                            <tr className="bg-gray-50">
                              <td colSpan={11} className="px-4 py-2 font-semibold text-gray-900">
                                {`${group.order.departure} to ${group.order.destination} - ${group.order.vendor}`}
                              </td>
                            </tr>
                            <tr className="font-bold hover:bg-gray-50">
                              <td className="px-4 py-2 text-xs text-gray-900 w-16">{group.order.serial}</td>
                              <td className="px-4 py-2 text-xs text-gray-900 w-32">{group.order.orderNo}</td>
                              <td className="px-4 py-2 text-xs text-gray-900 w-24">{group.order.orderDate}</td>
                              <td className="px-4 py-2 text-xs text-gray-900 w-24">{group.order.vehicleNo}</td>
                              <td className="px-4 py-2 text-xs text-gray-900 w-24">{formatNumber(group.order.bookingAmount)}</td>
                              <td className="px-4 py-2 text-xs text-gray-900 w-24">{group.order.biltyNo}</td>
                              <td className="px-4 py-2 text-xs text-gray-900 w-24"></td>
                              <td className="px-4 py-2 text-xs text-gray-900 w-40">{group.order.consignor}</td>
                              <td className="px-4 py-2 text-xs text-gray-900 w-40">{group.order.consignee}</td>
                              <td className="px-4 py-2 text-xs text-gray-900 w-40">{group.order.article}</td>
                              <td className="px-4 py-2 text-xs text-gray-900 w-20">{group.order.qty}</td>
                            </tr>
                            {group.consignments.map((row, rowIdx) => (
                              <tr key={rowIdx} className="hover:bg-gray-50">
                                <td className="px-4 py-2 text-xs text-gray-900 w-16"></td>
                                <td className="px-4 py-2 text-xs text-gray-900 w-32"></td>
                                <td className="px-4 py-2 text-xs text-gray-900 w-24"></td>
                                <td className="px-4 py-2 text-xs text-gray-900 w-24"></td>
                                <td className="px-4 py-2 text-xs text-gray-900 w-24"></td>
                                <td className="px-4 py-2 text-xs text-gray-900 w-24">{row.biltyNo}</td>
                                <td className="px-4 py-2 text-xs text-gray-900 w-24">{formatNumber(row.consignmentFreight)}</td>
                                <td className="px-4 py-2 text-xs text-gray-900 w-40">{row.consignor}</td>
                                <td className="px-4 py-2 text-xs text-gray-900 w-40">{row.consignee}</td>
                                <td className="px-4 py-2 text-xs text-gray-900 w-40">{row.article}</td>
                                <td className="px-4 py-2 text-xs text-gray-900 w-20">{row.qty}</td>
                              </tr>
                            ))}
                          </React.Fragment>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex flex-col items-center justify-center space-y-3">
                  <MdOutlineDoNotDisturbAlt className="h-10 w-10 text-gray-400" />
                  <p className="text-gray-700 font-semibold">No booking order data available.</p>
                  <p className="text-gray-500 text-sm max-w-md">
                    Try changing your filter criteria or selecting a different date range.
                  </p>
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === "bilty" && (
          <div className="mb-8">
            <div className="bg-white rounded-xl shadow-lg border border-gray-100">
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-lg font-bold text-gray-900">Bilties Receivable Report</h3>
                <p className="text-sm text-gray-500">Export the Bilties Receivable report as PDF.</p>
              </div>
              <div className="p-6">
                <Button
                  onClick={exportBiltiesReceivable}
                  disabled={isLoading}
                  className="w-full px-6 py-3 bg-green-600 text-white text-sm font-bold rounded-lg hover:bg-green-500 transition-colors disabled:opacity-50"
                >
                  Export PDF
                </Button>
              </div>
            </div>
          </div>
        )}

        {activeTab === "brokerBill" && (
          <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white rounded-xl shadow-lg border border-gray-100">
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-lg font-bold text-gray-900 text-green-600">Paid Bills</h3>
                <p className="text-sm text-gray-500">Export report of brokers whose bills have been paid.</p>
              </div>
              <div className="p-6">
                <Button
                  onClick={() => exportBrokerBills('Paid')}
                  disabled={isLoading}
                  className="w-full px-6 py-3 bg-green-600 text-white text-sm font-bold rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  Paid Bills PDF
                </Button>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg border border-gray-100">
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-lg font-bold text-gray-900 text-red-600">Unpaid Bills</h3>
                <p className="text-sm text-gray-500">Export report of brokers whose bills are pending payment.</p>
              </div>
              <div className="p-6">
                <Button
                  onClick={() => exportBrokerBills('Unpaid')}
                  disabled={isLoading}
                  className="w-full px-6 py-3 bg-red-600 text-white text-sm font-bold rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  Unpaid Bills PDF
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default BookingOrderReportExport;