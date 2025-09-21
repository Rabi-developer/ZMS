"use client";
import React, { useEffect, useMemo, useState } from "react";
import { FaCheck } from "react-icons/fa";
import { getAllCharges } from "@/apis/charges";
import { getAllPaymentABL } from "@/apis/paymentABL";
import { getAllBookingOrder } from "@/apis/bookingorder";
import { getAllReceipt } from "@/apis/receipt";

interface Consignment {
  consignor?: string;
  consignee?: string;
  items?: { desc: string; qty: number; qtyUnit: string }[];
  qty?: string | number;
  totalAmount?: string | number; 
  receivedAmount?: string | number;
  deliveryDate?: string;
  biltyNo?: string;
  receiptNo?: string;
  status?: string;
}

interface Charge {
  paidToPerson?: string;
  charges?: string;
  amount?: string | number;
}

interface OrderProgressProps {
  orderNo?: string | null;
  bookingStatus?: string | null;
  consignments?: Consignment[];
  bookingOrder?: { orderNo: string; orderDate: string; vehicleNo: string } | null;
  hideBookingOrderInfo?: boolean;
}

interface Step {
  key: string;
  label: string;
  completed: boolean;
  active?: boolean;
  hint?: string;
}

const formatNumber = (v: string | number | undefined | null): number => {
  if (v === undefined || v === null) return 0;
  const n = typeof v === "string" ? parseFloat(v) : v;
  return isNaN(n) ? 0 : n;
};

const OrderProgress: React.FC<OrderProgressProps> = ({ orderNo, bookingStatus, consignments = [], bookingOrder, hideBookingOrderInfo }) => {
  const [charges, setCharges] = useState<Charge[]>([]);
  const [chargesCount, setChargesCount] = useState<number>(0);
  const [chargesPaidCount, setChargesPaidCount] = useState<number>(0);
  const [paymentsCompletedCount, setPaymentsCompletedCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [bookingInfo, setBookingInfo] = useState<{ orderNo: string; orderDate: string; vehicleNo: string } | null>(null);
  const [receiptNos, setReceiptNos] = useState<string[]>([]);
  const [receiptsTotalReceived, setReceiptsTotalReceived] = useState<number>(0);
  const [paymentNos, setPaymentNos] = useState<string[]>([]);
  const [paymentsTotalPaid, setPaymentsTotalPaid] = useState<number>(0);

  const consignmentCount = consignments?.length || 0;
  const allConsDelivered = useMemo(() => {
    if (!consignments || consignments.length === 0) return false;
    return consignments.every((c) => (c.status || "").toLowerCase() === "delivered");
  }, [consignments]);

  const totalAmount = useMemo(() => consignments.reduce((sum, c) => sum + formatNumber(c.totalAmount), 0), [consignments]);
  const totalReceived = useMemo(() => consignments.reduce((sum, c) => sum + formatNumber(c.receivedAmount), 0), [consignments]);

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      if (!orderNo) return;
      setLoading(true);
      try {
        const chargesRes = await getAllCharges(1, 100, { orderNo });
        const allCharges = chargesRes?.data || [];
        const chargesData = allCharges.filter((c: any) => ((c.orderNo || c.OrderNo || "") === orderNo));
        const paid = chargesData.filter((x: any) => (x.status || "").toLowerCase() === "paid");
        const normalized = chargesData.flatMap((c: any) => {
          const basePaidTo = c.paidToPerson ?? c.paidToName ?? c.paidTo ?? '-';
          const baseCharge = c.charges ?? c.charge ?? '-';
          const baseAmount = c.amount ?? c.total ?? c.lineAmount ?? '-';

          if (Array.isArray(c.lines) && c.lines.length > 0) {
            return c.lines.map((l: any) => ({
              paidToPerson: l.paidTo ?? l.paidToPerson ?? basePaidTo ?? '-',
              charges: l.charges ?? l.charge ?? baseCharge ?? '-',
              amount: l.amount ?? l.lineAmount ?? baseAmount ?? '-',
            }));
          }
          return [{
            paidToPerson: basePaidTo,
            charges: baseCharge,
            amount: baseAmount,
          }];
        });
        if (mounted) {
          setChargesCount(normalized.length);
          setChargesPaidCount(paid.length);
          setCharges(normalized);
        }

        const payRes = await getAllPaymentABL(1, 200);
        const allPayments = (payRes?.data || []);
        const biltyKeys = new Set(
          (consignments || [])
            .flatMap((c: any) => [c.biltyNo, c.BiltyNo, c.consignmentNo, c.ConsignmentNo, c.id])
            .filter(Boolean)
        );
        const payments = allPayments.filter((p: any) => {
          const items = Array.isArray(p.items) ? p.items : [];
          const topOrder = p.orderNo ?? p.OrderNo ?? "";
          const matchOrder = (topOrder && topOrder === orderNo) || items.some((it: any) => ((it.orderNo ?? it.OrderNo ?? "") === orderNo));
          const matchBilty = biltyKeys.size > 0 && items.some((it: any) => {
            const b = it.biltyNo ?? it.BiltyNo ?? it.consignmentNo ?? it.ConsignmentNo ?? it.id;
            return b && biltyKeys.has(b);
          });
          return matchOrder || matchBilty;
        });
        const completed = payments.filter((p: any) => (p.status || "").toLowerCase() === "completed");
        const paymentNosList = payments.map((p: any) => p.paymentNo ?? p.PaymentNo ?? p.payNo ?? "").filter(Boolean);
        const totalPaid = payments.reduce((sum: number, p: any) => sum + Number(p.paidAmount ?? p.amount ?? 0), 0);
        if (mounted) {
          setPaymentsCompletedCount(completed.length);
          setPaymentNos(paymentNosList);
          setPaymentsTotalPaid(totalPaid);
        }
      } catch (err) {
        // Silently ignore in UI, keep counts as 0
      } finally {
        if (mounted) setLoading(false);
      }
    };
    run();
    return () => {
      mounted = false;
    };
  }, [orderNo]);

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      if (!orderNo || bookingOrder) return;
      try {
        const res = await getAllBookingOrder(1, 200, { orderNo });
        const list = res?.data || [];
        const found = list.find((b: any) => (b.orderNo || "") === orderNo);
        if (mounted && found) {
          setBookingInfo({
            orderNo: found.orderNo,
            orderDate: found.orderDate || found.date || "",
            vehicleNo: found.vehicleNo || found.vehicle || "",
          });
        }
      } catch (e) {
        // ignore
      }
    };
    run();
    return () => { mounted = false; };
  }, [orderNo, bookingOrder]);

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      if (!orderNo) return;
      try {
        const res = await getAllReceipt(1, 200);
        const list = res?.data || [];
        const biltyKeys = new Set(
          (consignments || [])
            .flatMap((c: any) => [c.biltyNo, c.BiltyNo, c.consignmentNo, c.ConsignmentNo, c.id])
            .filter(Boolean)
        );
        const recs = list.filter((r: any) => {
          const topOrder = r.orderNo ?? r.OrderNo ?? "";
          const topBilty = r.biltyNo ?? r.BiltyNo ?? "";
          const matchOrder = topOrder && topOrder === orderNo;
          const matchBilty = topBilty && biltyKeys.has(topBilty);
          return matchOrder || matchBilty;
        });
        const nos = recs.map((r: any) => r.receiptNo ?? r.ReceiptNo ?? "").filter(Boolean);
        const total = recs.reduce((sum: number, r: any) => sum + Number(r.receiptAmount ?? r.receivedAmount ?? r.totalAmount ?? 0), 0);
        if (mounted) {
          setReceiptNos(nos);
          setReceiptsTotalReceived(total);
        }
      } catch (e) {
        // ignore
      }
    };
    run();
    return () => { mounted = false; };
  }, [orderNo, consignments]);

  
  const steps: Step[] = useMemo(() => {
    const bookingCompleted = true;
    const consignmentCompleted = consignmentCount > 0;
    const chargesCompleted = chargesCount > 0;
    const receiptCompleted = (receiptsTotalReceived > 0) || (totalReceived > 0);
    const paymentCompleted = paymentsCompletedCount > 0;

    const list: Step[] = [
      {
        key: "booking",
        label: "Booking",
        completed: bookingCompleted,
        hint: bookingStatus ? `Status: ${bookingStatus}` : undefined,
      },
      {
        key: "consignment",
        label: "Consignment",
        completed: consignmentCompleted,
        hint: consignmentCount > 0 ? `${consignmentCount} created${allConsDelivered ? " • all delivered" : ""}` : "None",
      },
      {
        key: "charges",
        label: "Charges",
        completed: chargesCompleted,
        hint: chargesCount > 0 ? `${chargesCount} found • ${chargesPaidCount} paid` : "None",
      },
      {
        key: "receipt",
        label: "Receipt",
        completed: receiptCompleted,
        hint: receiptsTotalReceived > 0 ? `Received ${receiptsTotalReceived.toLocaleString()}` : (totalReceived > 0 ? `Received ${totalReceived.toLocaleString()}` : "None"),
      },
      {
        key: "payment",
        label: "Payment",
        completed: paymentCompleted,
        hint: paymentsCompletedCount > 0 ? `${paymentsCompletedCount} completed` : "None",
      },
    ];

    const firstNotDone = list.findIndex((s) => !s.completed);
    if (firstNotDone >= 0) list[firstNotDone].active = true;

    return list;
  }, [bookingStatus, consignmentCount, allConsDelivered, chargesCount, chargesPaidCount, totalReceived, receiptsTotalReceived, paymentsCompletedCount]);

  // Combine data for the table, one row per consignment
  const tableData = useMemo(() => {
    const rows: any[] = [];
    const bo = bookingOrder ?? bookingInfo;

    if (!bookingOrder && !bookingInfo && consignments.length === 0 && charges.length === 0) {
      return rows; // Return empty if no data
    }

    if (consignments.length > 0) {
      consignments.forEach((c, index) => {
        const row: any = {
          biltyNo: c.biltyNo ?? (c as any).BiltyNo ?? (c as any).consignmentNo ?? (c as any).ConsignmentNo ?? (c as any).id ?? '',
          receiptNo: c.receiptNo ?? (c as any).ReceiptNo ?? (receiptNos.length > 0 ? receiptNos.join(', ') : ''),
          paymentNo: paymentNos.length > 0 ? paymentNos.join(', ') : '',
          orderNo: bo?.orderNo || '',
          orderDate: bo?.orderDate || '',
          vehicleNo: bo?.vehicleNo || '',
          consignor: c.consignor ?? (c as any).Consignor ?? '',
          consignee: c.consignee ?? (c as any).Consignee ?? '',
          items: Array.isArray(c.items) ? c.items.map((item: any) => item.desc).join(', ') : '',
          qty: Array.isArray(c.items) ? c.items.map((item: any) => `${item.qty} ${item.qtyUnit}`).join(', ') : (c as any).qty || '',
          totalAmount: c.totalAmount ?? (c as any).TotalAmount ?? (c as any).amount ?? '',
          receivedAmount: c.receivedAmount ?? (c as any).ReceivedAmount ?? (c as any).receiptAmount ?? (receiptsTotalReceived > 0 ? receiptsTotalReceived : '-'),
          deliveryDate: c.deliveryDate ?? (c as any).DeliveryDate ?? (c as any).date ?? '',
          consignmentStatus: c.status ?? (c as any).Status ?? '',
          paidToPerson: charges.length > 0 ? charges.map((ch) => ch.paidToPerson || '').join(', ') : '',
          charges: charges.length > 0 ? charges.map((ch) => ch.charges || '').join(', ') : '',
          amount: charges.length > 0 ? charges.map((ch) => ch.amount || '').join(', ') : '',
          paidAmount: paymentsTotalPaid > 0 ? paymentsTotalPaid : '',
        };
        rows.push(row);
      });
    } else {
      // No consignments, create one row with booking and other data
      const row: any = {
        biltyNo: '',
        receiptNo: receiptNos.length > 0 ? receiptNos.join(', ') : '',
        paymentNo: paymentNos.length > 0 ? paymentNos.join(', ') : '',
        orderNo: bo?.orderNo || '',
        orderDate: bo?.orderDate || '',
        vehicleNo: bo?.vehicleNo || '',
        consignor: '',
        consignee: '',
        items: '',
        qty: '',
        totalAmount: '',
        receivedAmount: receiptsTotalReceived > 0 ? receiptsTotalReceived : '-',
        deliveryDate: '',
        consignmentStatus: '',
        paidToPerson: charges.length > 0 ? charges.map((c) => c.paidToPerson || '').join(', ') : '',
        charges: charges.length > 0 ? charges.map((c) => c.charges || '').join(', ') : '',
        amount: charges.length > 0 ? charges.map((c) => c.amount || '').join(', ') : '',
        paidAmount: paymentsTotalPaid > 0 ? paymentsTotalPaid : '',
      };
      rows.push(row);
    }

    return rows;
  }, [bookingOrder, bookingInfo, consignments, charges, receiptNos, paymentsTotalPaid, paymentNos, receiptsTotalReceived]);

  const hideBookingCols = !!hideBookingOrderInfo;
  const totalCols = (hideBookingCols ? 13 : 16) + 2;

  return (
    <div className="w-full max-h-[240px] overflow-y-auto  bg-white rounded-lg shadow-md  border border-gray-200">
      
      {/* Combined Data Table */}
      <div className="">
        <h4 className="text-lg font-semibold text-gray-800 mb-4">Order Details</h4>
        <div className="overflow-x-auto ">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-[#e0ebe2] from-cyan-500 to-blue-500 text-[#3a614c]">
                 <th className="p-3 font-semibold">Bilty No</th>
                <th className="p-3 font-semibold">Receipt No</th>
                <th className="p-3 font-semibold">Payment No</th>
                {!hideBookingCols && (
                  <>
                    <th className="p-3 font-semibold rounded-tl-lg">Order No</th>
                    <th className="p-3 font-semibold">Order Date</th>
                    <th className="p-3 font-semibold">Vehicle No</th>
                  </>
                )}
                <th className="p-3 font-semibold">Consignor</th>
                <th className="p-3 font-semibold">Consignee</th>
                <th className="p-3 font-semibold">Items</th>
                <th className="p-3 font-semibold">Quantity</th>
                <th className="p-3 font-semibold">Total Amount</th>
                <th className="p-3 font-semibold">Received Amount</th>
                <th className="p-3 font-semibold">Paid Amount</th>
                <th className="p-3 font-semibold">Delivery Date</th>
                <th className="p-3 font-semibold">Paid to Person</th>
                <th className="p-3 font-semibold">Charges</th>
                <th className="p-3 font-semibold rounded-tr-lg">Amount</th>
                <th className="p-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {tableData.length > 0 ? (
                tableData.map((row, index) => (
                  <tr
                    key={index}
                    className={`border-b border-gray-200 ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'} hover:bg-gray-100 transition-colors duration-150`}
                  >
                    <td className="p-3 truncate max-w-[120px]">{row.biltyNo}</td>
                    <td className="p-3 truncate max-w-[120px]">{row.receiptNo}</td>
                    <td className="p-3 truncate max-w-[120px]">{row.paymentNo}</td>
                    {!hideBookingCols && (
                      <>
                        <td className="p-3 truncate max-w-[150px]">{row.orderNo}</td>
                        <td className="p-3 truncate max-w-[120px]">{row.orderDate}</td>
                        <td className="p-3 truncate max-w-[120px]">{row.vehicleNo}</td>
                      </>
                    )}
                    <td className="p-3 truncate max-w-[150px]" title={row.consignor}>{row.consignor}</td>
                    <td className="p-3 truncate max-w-[150px]" title={row.consignee}>{row.consignee}</td>
                    <td className="p-3 truncate max-w-[200px]" title={row.items}>{row.items}</td>
                    <td className="p-3 truncate max-w-[150px]" title={row.qty}>{row.qty}</td>
                    <td className="p-3 truncate max-w-[120px]">{row.totalAmount}</td>
                    <td className="p-3 truncate max-w-[120px]">{row.receivedAmount}</td>
                    <td className="p-3 truncate max-w-[120px]">{row.paidAmount}</td>
                    <td className="p-3 truncate max-w-[120px]">{row.deliveryDate}</td>
                    <td className="p-3 truncate max-w-[150px]" title={row.paidToPerson}>{row.paidToPerson}</td>
                    <td className="p-3 truncate max-w-[150px]" title={row.charges}>{row.charges}</td>
                    <td className="p-3 truncate max-w-[120px]">{row.amount}</td>
                    <td className="p-3 truncate max-w-[120px]">{row.consignmentStatus}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={totalCols} className="p-4 text-center text-gray-500">
                    No data available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center gap-2 overflow-x-auto py-2 px-6 bg-gray-50 border-t border-gray-200">
        {steps.map((step, idx) => {
          const isLast = idx === steps.length - 1;
          const prevCompleted = idx === 0 ? true : steps[idx - 1].completed;
          return (
            <div key={step.key} className="flex items-center min-w-max">
              <div
                className={
                  `relative flex items-center justify-center w-9 h-9 rounded-full border-2 text-xs font-semibold ` +
                  (step.completed
                    ? "bg-emerald-600 border-emerald-600 text-white"
                    : step.active
                    ? "border-blue-500 text-blue-600 bg-blue-50"
                    : "border-gray-300 text-gray-500 bg-white")
                }
                title={step.hint}
              >
                {step.completed ? <FaCheck size={14} /> : idx + 1}
              </div>
              <div className="ml-2 mr-3">
                <div className={`text-xs font-semibold ${step.completed ? "text-emerald-700" : step.active ? "text-blue-700" : "text-gray-600"}`}>
                  {step.label}
                </div>
                {step.hint && (
                  <div className="text-[10px] text-gray-500">{step.hint}</div>
                )}
              </div>
              {!isLast && (
                <div
                  className="w-10 sm:w-16 md:w-20 h-1 rounded-full mr-2"
                  style={{ background: prevCompleted && step.completed ? "linear-gradient(90deg, #174637ff 0%, #34d399 100%)" : "#e5e7eb" }}
                />
              )}
            </div>
          );
        })}
        {loading && (
          <div className="ml-2 text-xs text-gray-500">updating…</div>
        )}
      </div>

    </div>
  );
};

export default OrderProgress;