"use client";
import React, { useEffect, useMemo, useState } from "react";
import { FaCheck } from "react-icons/fa";
import { getAllCharges } from "@/apis/charges";
import { getAllPaymentABL } from "@/apis/paymentABL";
import { getAllBookingOrder } from "@/apis/bookingorder";
import { getAllReceipt } from "@/apis/receipt";
import { getAllCustomers } from "@/apis/customer";
import { getAllPartys } from "@/apis/party";
import { getAllVendor } from "@/apis/vendors";
import { getAllTransporter } from "@/apis/transporter";

interface Consignment {
  consignmentNo: any;
  id: string;
  biltyNo: string;
  receiptNo?: string | number;
  consignor: string;
  consignee: string;
  items?: Array<{
    desc?: string;
    description?: string;
    itemName?: string;
    name?: string;
    qty?: number;
    quantity?: number;
    qtyValue?: number;
    qtyUnit?: string;
    unit?: string;
    qtyUnitName?: string;
  }> | null;
  totalAmount?: string | number;
  receivedAmount?: string | number;
  deliveryDate?: string;
  status?: string;
  orderNo?: string | number;
}

interface BookingOrderInfo {
  orderNo: string;
  orderDate: string;
  vehicleNo: string;
}

interface Charge {
  paidToPerson?: string;
  charges?: string;
  amount?: string | number;
}

interface OrderProgressProps {
  orderNo?: string | number | null;
  bookingStatus?: string | null;
  consignments?: Consignment[];
  bookingOrder?: BookingOrderInfo | null;
  hideBookingOrderInfo?: boolean;
}

interface Step {
  key: string;
  label: string;
  completed: boolean;
  active?: boolean;
  hint?: string;
}

interface PartyOption {
  id: string;
  name: string;
}

const formatNumber = (v: any): number => {
  if (v === undefined || v === null) return 0;
  const n = typeof v === "string" ? parseFloat(v) : v;
  return isNaN(n) ? 0 : n;
};

const formatDate = (dateStr: string | undefined | null): string => {
  if (!dateStr || dateStr.toString().trim() === "") return "Not Set";
  try {
    const d = new Date(dateStr.toString());
    return isNaN(d.getTime()) ? "Not Set" : d.toISOString().split("T")[0];
  } catch {
    return "Not Set";
  }
};

const OrderProgress: React.FC<OrderProgressProps> = ({
  orderNo,
  bookingStatus,
  consignments: propConsignments = [],
  bookingOrder: propBookingOrder,
  hideBookingOrderInfo,
}) => {
  const [consignments, setConsignments] = useState<Consignment[]>(propConsignments);
  const [bookingOrder, setBookingOrder] = useState<BookingOrderInfo | null>(propBookingOrder || null);
  const [charges, setCharges] = useState<Charge[]>([]);
  const [chargesCount, setChargesCount] = useState<number>(0);
  const [chargesPaidCount, setChargesPaidCount] = useState<number>(0);
  const [paymentsCompletedCount, setPaymentsCompletedCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [receiptNos, setReceiptNos] = useState<string[]>([]);
  const [receiptsTotalReceived, setReceiptsTotalReceived] = useState<number>(0);
  const [paymentNos, setPaymentNos] = useState<string[]>([]);
  const [paymentsTotalPaid, setPaymentsTotalPaid] = useState<number>(0);

  const [customers, setCustomers] = useState<PartyOption[]>([]);
  const [parties, setParties] = useState<PartyOption[]>([]);
  const [vendors, setVendors] = useState<PartyOption[]>([]);
  const [transporters, setTransporters] = useState<PartyOption[]>([]);

  const selOrder = orderNo ? String(orderNo).trim() : "";

  // Resolve party name from ID
  const resolvePartyName = (id?: string): string => {
    if (!id || id.trim() === "") return "-";
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      return id;
    }
    const found =
      customers.find(c => c.id === id) ||
      parties.find(p => p.id === id) ||
      vendors.find(v => v.id === id) ||
      transporters.find(t => t.id === id);
    return found ? found.name : `ID: ${id.substring(0, 8)}...`;
  };

  // UPDATE CONSIGNMENTS WHEN PROP CHANGES
  useEffect(() => {
    console.log("OrderProgress: Prop consignments received →", propConsignments);
    if (Array.isArray(propConsignments)) {
      console.log("OrderProgress: Setting consignments from props, count:", propConsignments.length);
      setConsignments(propConsignments);
    } else {
      console.log("OrderProgress: PropConsignments is not an array, setting empty:", propConsignments);
      setConsignments([]);
    }
  }, [propConsignments]);

  // DEBUG: LOG CONSIGNMENTS WHEN UPDATED
  useEffect(() => {
    console.log("OrderProgress: Consignments state updated →", {
      count: consignments.length,
      data: consignments,
      orderNo: selOrder
    });
  }, [consignments, selOrder]);

  // FETCH BOOKING ORDER WHEN orderNo CHANGES
  useEffect(() => {
    let mounted = true;
    const fetchBookingOrder = async () => {
      if (!selOrder) {
        setBookingOrder(null);
        return;
      }
      if (propBookingOrder) {
        setBookingOrder(propBookingOrder);
        return;
      }

      try {
        const res = await getAllBookingOrder(1, 200, { orderNo: selOrder });
        const found = (res?.data || []).find((b: any) => String(b.orderNo) === selOrder);
        if (mounted) {
          setBookingOrder({
            orderNo: selOrder,
            orderDate: found?.orderDate || "Not Set",
            vehicleNo: found?.vehicleNo || "-",
          });
        }
      } catch (e) {
        if (mounted) {
          setBookingOrder({ orderNo: selOrder, orderDate: "Not Set", vehicleNo: "-" });
        }
      }
    };
    fetchBookingOrder();
    return () => { mounted = false; };
  }, [selOrder, propBookingOrder]);

  const consignmentCount = consignments.length;

  // Fetch party data
  useEffect(() => {
    let mounted = true;
    const fetchPartyData = async () => {
      try {
        const [custRes, partyRes, vendorRes, transRes] = await Promise.all([
          getAllCustomers(1, 1000).catch(() => ({ data: [] })),
          getAllPartys(1, 1000).catch(() => ({ data: [] })),
          getAllVendor(1, 1000).catch(() => ({ data: [] })),
          getAllTransporter(1, 1000).catch(() => ({ data: [] })),
        ]);
        if (mounted) {
          setCustomers((custRes?.data || []).map((c: any) => ({ id: c.id, name: c.name || c.customerName || "" })));
          setParties((partyRes?.data || []).map((p: any) => ({ id: p.id, name: p.name || p.partyName || "" })));
          setVendors((vendorRes?.data || []).map((v: any) => ({ id: v.id, name: v.name || v.vendorName || "" })));
          setTransporters((transRes?.data || []).map((t: any) => ({ id: t.id, name: t.name || t.transporterName || "" })));
        }
      } catch (error) {}
    };
    fetchPartyData();
    return () => { mounted = false; };
  }, []);

  // Fetch charges, payments, receipts
  useEffect(() => {
    let mounted = true;
    const run = async () => {
      if (!selOrder || consignments.length === 0) return;
      setLoading(true);
      try {
        const chargesRes = await getAllCharges(1, 100, { orderNo: selOrder });
        const chargesData = (chargesRes?.data || []).filter((c: any) => String(c.orderNo) === selOrder);
        const paid = chargesData.filter((x: any) => (x.status || "").toLowerCase() === "paid");
        const normalized = chargesData.flatMap((c: any) => {
          const base = { paidToPerson: c.paidToPerson ?? "-", charges: c.charges ?? "-", amount: c.amount ?? "-" };
          return Array.isArray(c.lines) && c.lines.length > 0
            ? c.lines.map((l: any) => ({
                paidToPerson: l.paidTo ?? base.paidToPerson,
                charges: l.charges ?? base.charges,
                amount: l.amount ?? base.amount,
              }))
            : [base];
        });
        if (mounted) {
          setChargesCount(normalized.length);
          setChargesPaidCount(paid.length);
          setCharges(normalized);
        }

        const payRes = await getAllPaymentABL(1, 200);
        const allPayments = payRes?.data || [];
        const biltyKeys = new Set(consignments.flatMap(c => [c.biltyNo, c.id]).filter(Boolean));
        const payments = allPayments.filter((p: any) => {
          const topOrder = p.orderNo ?? "";
          const matchOrder = String(topOrder) === selOrder;
          const matchBilty = (p.items || []).some((it: any) => biltyKeys.has(it.biltyNo ?? it.id));
          return matchOrder || matchBilty;
        });
        const completed = payments.filter((p: any) => (p.status || "").toLowerCase() === "completed");
        const paymentNosList = payments.map((p: any) => p.paymentNo ?? "").filter(Boolean);
        const totalPaid = payments.reduce((sum: number, p: any) => sum + formatNumber(p.paidAmount), 0);
        if (mounted) {
          setPaymentsCompletedCount(completed.length);
          setPaymentNos(paymentNosList);
          setPaymentsTotalPaid(totalPaid);
        }
      } catch (err) {} finally {
        if (mounted) setLoading(false);
      }
    };
    run();
    return () => { mounted = false; };
  }, [selOrder, consignments]);

  // Fetch receipts
  useEffect(() => {
    let mounted = true;
    const run = async () => {
      if (!selOrder || consignments.length === 0) return;
      try {
        const res = await getAllReceipt(1, 200);
        const list = res?.data || [];
        const biltyKeys = new Set(consignments.flatMap(c => [c.biltyNo, c.id]).filter(Boolean));
        const recs = list.filter((r: any) => {
          const topOrder = r.orderNo ?? "";
          const topBilty = r.biltyNo ?? "";
          return String(topOrder) === selOrder || (topBilty && biltyKeys.has(topBilty));
        });
        const nos = recs.map((r: any) => r.receiptNo ?? "").filter(Boolean);
        const total = recs.reduce((sum: number, r: any) => sum + formatNumber(r.receiptAmount), 0);
        if (mounted) {
          setReceiptNos(nos);
          setReceiptsTotalReceived(total);
        }
      } catch (e) {}
    };
    run();
    return () => { mounted = false; };
  }, [selOrder, consignments]);

  // Progress steps
  const steps: Step[] = useMemo(() => {
    const list: Step[] = [
      { key: "booking", label: "Booking", completed: true, hint: `Order: ${selOrder}` },
      { key: "consignment", label: "Consignment", completed: consignmentCount > 0, hint: consignmentCount > 0 ? `${consignmentCount} created` : "None" },
      { key: "charges", label: "Charges", completed: chargesCount > 0, hint: chargesCount > 0 ? `${chargesCount} • ${chargesPaidCount} paid` : "None" },
      { key: "receipt", label: "Receipt", completed: receiptsTotalReceived > 0, hint: receiptsTotalReceived > 0 ? `${receiptsTotalReceived.toLocaleString()}` : "None" },
      { key: "payment", label: "Payment", completed: paymentsCompletedCount > 0, hint: paymentsCompletedCount > 0 ? `${paymentsCompletedCount} completed` : "None" },
    ];
    const firstNotDone = list.findIndex(s => !s.completed);
    if (firstNotDone >= 0) list[firstNotDone].active = true;
    return list;
  }, [selOrder, consignmentCount, chargesCount, chargesPaidCount, receiptsTotalReceived, paymentsCompletedCount]);

  // TABLE DATA – FORCED RE-RENDER + DEBUG
  const tableData = useMemo(() => {
    console.log("OrderProgress: Rebuilding tableData with:", {
      consignments: consignments,
      consignmentsLength: consignments.length,
      bookingOrder: bookingOrder,
      orderNo: selOrder
    });
    const rows: any[] = [];
    const bo = bookingOrder;

    // Always show at least one row, even with no consignments
    if (consignments.length === 0) {
      console.log("OrderProgress: No consignments, showing default row");
      rows.push({
        biltyNo: "No Bilty",
        receiptNo: receiptNos.join(", ") || "-",
        paymentNo: paymentNos.join(", ") || "-",
        orderNo: bo?.orderNo || selOrder || "-",
        orderDate: bo?.orderDate || "Not Set",
        vehicleNo: bo?.vehicleNo || "-",
        consignor: "-",
        consignee: "-",
        items: "-",
        qty: "-",
        totalAmount: "-",
        receivedAmount: receiptsTotalReceived > 0 ? receiptsTotalReceived.toLocaleString() : "-",
        deliveryDate: "-",
        consignmentStatus: "No Consignment",
        paidToPerson: "-",
        charges: "-",
        amount: "-",
        paidAmount: paymentsTotalPaid > 0 ? paymentsTotalPaid.toLocaleString() : "-",
      });
      return rows;
    }

    console.log("OrderProgress: Processing individual consignments...");
    consignments.forEach((c, index) => {
      console.log(`OrderProgress: Processing consignment ${index + 1}/${consignments.length}:`, c);
      const consignorName = /^[0-9a-f]{8}-/.test(c.consignor) ? resolvePartyName(c.consignor) : c.consignor;
      const consigneeName = /^[0-9a-f]{8}-/.test(c.consignee) ? resolvePartyName(c.consignee) : c.consignee;

      // Enhanced items processing with multiple field variations
      console.log(`OrderProgress: Processing items for consignment ${index + 1}:`, {
        rawItems: c.items,
        itemsIsArray: Array.isArray(c.items),
        itemsLength: Array.isArray(c.items) ? c.items.length : 0,
        singleItemFields: {
          item: c.item,
          itemDesc: c.itemDesc,
          description: c.description,
          qty: c.qty,
          quantity: c.quantity
        }
      });
      
      const itemsArray = Array.isArray(c.items) ? c.items : [];
      
      // If no items array, try to construct from individual fields
      if (itemsArray.length === 0) {
        const singleItem = {
          desc: c.item || c.itemDesc || c.description || '',
          qty: c.qty || c.quantity || 0,
          qtyUnit: c.qtyUnit || c.unit || 'pcs'
        };
        if (singleItem.desc) {
          itemsArray.push(singleItem);
        }
      }
      
      const validItems = itemsArray.filter((item: any) => {
        const hasDesc = item?.desc || item?.description || item?.itemName || item?.name || item?.item;
        console.log(`Item validation:`, { item, hasDesc });
        return hasDesc;
      });

      let itemsDetail = "No Items";
      let qtyDetail = "-";

      if (validItems.length > 0) {
        itemsDetail = validItems
          .map((item: any) => item.desc || item.description || item.itemName || item.name || item.item || "Unnamed")
          .join(", ");

        qtyDetail = validItems
          .map((item: any) => {
            const qty = Number(item.qty || item.quantity || item.qtyValue || 0);
            const unit = item.qtyUnit || item.unit || item.qtyUnitName || "pcs";
            return qty > 0 ? `${qty} ${unit}` : null;
          })
          .filter(Boolean)
          .join(", ") || "-";
      }
      
      console.log(`OrderProgress: Final items processing result:`, {
        validItemsCount: validItems.length,
        itemsDetail,
        qtyDetail
      });

      const finalBiltyNo = (() => {
        // Priority: actual biltyNo > consignmentNo > id as fallback
        const bilty = c.biltyNo?.toString().trim();
        const consignmentNo = c.consignmentNo?.toString().trim();
        const id = c.id?.toString().trim();
        
        if (bilty && bilty !== '' && bilty !== 'undefined' && bilty !== 'null') {
          return bilty;
        } else if (consignmentNo && consignmentNo !== '' && consignmentNo !== 'undefined' && consignmentNo !== 'null') {
          return consignmentNo;
        } else if (id && id !== '' && id !== 'undefined' && id !== 'null') {
          return id;
        } else {
          return "No Bilty";
        }
      })();
      
      console.log(`OrderProgress: Consignment ${index + 1} biltyNo mapping:`, {
        originalBiltyNo: c.biltyNo,
        originalConsignmentNo: c.consignmentNo,
        finalBiltyNo: finalBiltyNo,
        consignmentId: c.id
      });
      
      rows.push({
        biltyNo: finalBiltyNo,
        receiptNo: c.receiptNo != null ? String(c.receiptNo) : (receiptNos.join(", ") || "-"),
        paymentNo: paymentNos.join(", ") || "-",
        orderNo: bo?.orderNo || selOrder || "-",
        orderDate: bo?.orderDate || "Not Set",
        vehicleNo: bo?.vehicleNo || "-",
        consignor: consignorName || "-",
        consignee: consigneeName || "-",
        items: itemsDetail,
        qty: qtyDetail,
        totalAmount: formatNumber(c.totalAmount).toLocaleString(),
        receivedAmount: formatNumber(c.receivedAmount).toLocaleString(),
        deliveryDate: formatDate(c.deliveryDate),
        consignmentStatus: c.status ?? "Pending",
        paidToPerson: charges.map(ch => ch.paidToPerson).filter(Boolean).join(", ") || "-",
        charges: charges.map(ch => ch.charges).filter(Boolean).join(", ") || "-",
        amount: charges.map(ch => ch.amount).filter(Boolean).join(", ") || "-",
        paidAmount: paymentsTotalPaid > 0 ? paymentsTotalPaid.toLocaleString() : "-",
      });
    });

    return rows;
  }, [
    consignments,
    bookingOrder,
    charges,
    receiptNos,
    paymentNos,
    receiptsTotalReceived,
    paymentsTotalPaid,
    selOrder,
    resolvePartyName,
  ]);

  const hideBookingCols = !!hideBookingOrderInfo;

  return (
    <div className="w-full bg-white rounded-lg shadow-md border border-gray-200">
      <div className="p-4">
        <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          Order Progress
          {consignmentCount > 0 && (
            <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
              {consignmentCount} Consignment{consignmentCount > 1 ? "s" : ""}
            </span>
          )}
        </h4>

        <div className="overflow-x-auto">
          <div className="max-h-[300px] overflow-y-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead className="sticky top-0 bg-[#e0ebe2] z-10">
                <tr className="text-[#3a614c]">
                  <th className="p-3 font-semibold">Bilty No</th>
                  <th className="p-3 font-semibold">Receipt No</th>
                  <th className="p-3 font-semibold">Payment No</th>
                  {!hideBookingCols && (
                    <>
                      <th className="p-3 font-semibold">Order No</th>
                      <th className="p-3 font-semibold">Order Date</th>
                      <th className="p-3 font-semibold">Vehicle No</th>
                    </>
                  )}
                  <th className="p-3 font-semibold">Consignor</th>
                  <th className="p-3 font-semibold">Consignee</th>
                  <th className="p-3 font-semibold">Items</th>
                  <th className="p-3 font-semibold">Qty</th>
                  <th className="p-3 font-semibold">Total</th>
                  <th className="p-3 font-semibold">Received</th>
                  <th className="p-3 font-semibold">Paid</th>
                  <th className="p-3 font-semibold">Delivery Date</th>
                  <th className="p-3 font-semibold">Paid To</th>
                  <th className="p-3 font-semibold">Charges</th>
                  <th className="p-3 font-semibold">Amount</th>
                  <th className="p-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {tableData.map((row, i) => (
                  <tr key={i} className={`border-b ${i % 2 === 0 ? "bg-gray-50" : "bg-white"} hover:bg-gray-100`}>
                    <td className="p-3 font-medium text-blue-700">{row.biltyNo}</td>
                    <td className="p-3">{row.receiptNo}</td>
                    <td className="p-3">{row.paymentNo}</td>
                    {!hideBookingCols && (
                      <>
                        <td className="p-3 font-medium">{row.orderNo}</td>
                        <td className="p-3 text-orange-700 font-medium">{row.orderDate}</td>
                        <td className="p-3 text-purple-700 font-medium">{row.vehicleNo}</td>
                      </>
                    )}
                    <td className="p-3">{row.consignor}</td>
                    <td className="p-3">{row.consignee}</td>
                    <td className="p-3 truncate max-w-[200px]" title={row.items}>{row.items}</td>
                    <td className="p-3 truncate max-w-[150px] font-medium" title={row.qty}>{row.qty}</td>
                    <td className="p-3 text-green-700 font-medium">{row.totalAmount}</td>
                    <td className="p-3 text-emerald-700 font-medium">{row.receivedAmount}</td>
                    <td className="p-3 text-purple-700 font-medium">{row.paidAmount}</td>
                    <td className="p-3 text-orange-700 font-medium">{row.deliveryDate}</td>
                    <td className="p-3">{row.paidToPerson}</td>
                    <td className="p-3">{row.charges}</td>
                    <td className="p-3">{row.amount}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        row.consignmentStatus === "Delivered" ? "bg-green-100 text-green-800" :
                        row.consignmentStatus === "In Transit" ? "bg-blue-100 text-blue-800" :
                        row.consignmentStatus === "Pending" ? "bg-yellow-100 text-yellow-800" :
                        "bg-gray-100 text-gray-600"
                      }`}>
                        {row.consignmentStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto py-2 px-6 bg-gray-50 border-t">
        {steps.map((step, idx) => {
          const isLast = idx === steps.length - 1;
          const prevDone = idx === 0 || steps[idx - 1].completed;
          return (
            <div key={step.key} className="flex items-center min-w-max">
              <div
                className={`w-9 h-9 rounded-full border-2 flex items-center justify-center text-xs font-semibold ${
                  step.completed ? "bg-emerald-600 border-emerald-600 text-white" :
                  step.active ? "border-blue-500 text-blue-600 bg-blue-50" :
                  "border-gray-300 text-gray-500 bg-white"
                }`}
                title={step.hint || ""}
              >
                {step.completed ? <FaCheck size={14} /> : idx + 1}
              </div>
              <div className="ml-2 mr-3">
                <div className={`text-xs font-semibold ${step.completed ? "text-emerald-700" : step.active ? "text-blue-700" : "text-gray-600"}`}>
                  {step.label}
                </div>
                {step.hint && <div className="text-[10px] text-gray-500">{step.hint}</div>}
              </div>
              {!isLast && (
                <div className="w-16 h-1 rounded-full" style={{ background: prevDone && step.completed ? "linear-gradient(90deg, #065f46, #34d399有一个)" : "#e5e7eb" }} />
              )}
            </div>
          );
        })}
        {loading && <span className="ml-2 text-xs text-gray-500">updating…</span>}
      </div>
    </div>
  );
};

export default OrderProgress;