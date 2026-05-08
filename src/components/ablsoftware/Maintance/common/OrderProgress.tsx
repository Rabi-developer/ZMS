import React, { useEffect, useMemo, useState } from "react";
import { FaCheck } from "react-icons/fa";
import { getOrderProgress, getAllBookingOrder } from "@/apis/bookingorder";

export interface OrderProgressRes {
  id?: string;
  biltyNo?: string;
  receiptNo?: string;
  paymentNo?: string;
  orderNo?: string;
  orderDate?: string;
  vehicleNo?: string;
  consignor?: string;
  consignee?: string;
  items?: string;      // comma-separated or you can split
  qty?: string;
  totalAmount?: string;
  receivedAmount?: string;
  paidAmount?: string;
  deliveryDate?: string;
  paidToPerson?: string;
  charges?: string;    // comma-separated
  amount?: string;
  consignmentStatus?: string;
  freight?: string;    // Freight from consignment
  freightFrom?: string; // Freight From from consignment
}

interface OrderProgressProps {
  orderNo?: string | number | null;
  bookingOrderId?: string;
  bookingStatus?: string | null;
  biltyNo?: string | null; // NEW: Filter by specific bilty number
  // Legacy props - kept for compatibility but might be unused if using new API
  consignments?: any[]; 
  bookingOrder?: any | null;
  hideBookingOrderInfo?: boolean;
}

interface Step {
  key: string;
  label: string;
  completed: boolean;
  active?: boolean;
  hint?: string;
}

const formatNumber = (v: any): number => {
  if (v === undefined || v === null) return 0;
  const n = typeof v === "string" ? parseFloat(v) : v;
  return isNaN(n) ? 0 : n;
};

const formatDate = (dateStr: string | undefined | null): string => {
  if (!dateStr || dateStr.toString().trim() === "") return "-";
  try {
    const d = new Date(dateStr.toString());
    return isNaN(d.getTime()) ? "-" : d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' }).replace(/\//g, '-');
  } catch {
    return "-";
  }
};

const OrderProgress: React.FC<OrderProgressProps> = ({
  orderNo,
  bookingOrderId: propBookingOrderId,
  bookingStatus,
  biltyNo, // NEW: biltyNo filter
  consignments: propConsignments = [],
  bookingOrder: propBookingOrder,
  hideBookingOrderInfo,
}) => {
  const [progressData, setProgressData] = useState<OrderProgressRes[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [bookingOrderId, setBookingOrderId] = useState<string | undefined>(propBookingOrderId);

  useEffect(() => {
    if (propBookingOrderId) {
      setBookingOrderId(propBookingOrderId);
    } else if (propConsignments && propConsignments.length > 0 && propConsignments[0].bookingOrderId) {
      setBookingOrderId(propConsignments[0].bookingOrderId);
    } else if (orderNo) {
       const fetchId = async () => {
         try {
            const res = await getAllBookingOrder(1, 100, { orderNo: String(orderNo) });
            if (res?.data) {
                const found = res.data.find((b: any) => String(b.orderNo) === String(orderNo));
                if (found) {
                    setBookingOrderId(found.id);
                }
            }
         } catch (e) {
             console.error("Failed to fetch booking order ID", e);
         }
       }
       fetchId();
    }
  }, [propBookingOrderId, propConsignments, orderNo]);

  useEffect(() => {
    const fetchData = async () => {
      if (!bookingOrderId) return;
      
      setLoading(true);
      try {
        const res = await getOrderProgress(bookingOrderId);
        if (res?.data) {
            let filteredData = res.data;
            if (biltyNo && biltyNo.trim() !== '') {
              filteredData = res.data.filter((item: OrderProgressRes) => 
                item.biltyNo === biltyNo || item.biltyNo === biltyNo.trim()
              );
            }
            setProgressData(filteredData);
        }
      } catch (error) {
        console.error("Error fetching order progress:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [bookingOrderId, biltyNo]);

  const steps: Step[] = useMemo(() => {
    const hasConsignments = progressData.some(p => p.biltyNo || p.consignmentStatus !== "No Consignment");
    const hasCharges = progressData.some(p => p.charges && p.charges !== "-");
    const hasReceipts = progressData.some(p => p.receiptNo && p.receiptNo !== "-");
    const hasPayments = progressData.some(p => p.paymentNo && p.paymentNo !== "-");
    
    const list: Step[] = [
      { key: "booking", label: "Booking", completed: true },
      { key: "consignment", label: "Consignment", completed: hasConsignments },
      { key: "charges", label: "Charges", completed: hasCharges },
      { key: "receipt", label: "Receipt", completed: hasReceipts },
      { key: "payment", label: "Payment", completed: hasPayments },
    ];
    const firstNotDone = list.findIndex(s => !s.completed);
    if (firstNotDone >= 0) list[firstNotDone].active = true;
    return list;
  }, [progressData]);

  const hideBookingCols = !!hideBookingOrderInfo;

  return (
    <div className="w-full bg-white shadow-inner border-t border-gray-300">
      <div className="p-0">
        <div className="overflow-x-auto">
          <div className="max-h-[35vh] overflow-y-auto">
            <table className="w-full text-left border-collapse text-[10px]">
              <thead className="sticky top-0 bg-[#e0ebe2] z-10 shadow-sm">
                <tr className="text-[#3a614c] uppercase tracking-tighter">
                  <th className="p-2 font-bold border-r border-gray-300">Bilty No</th>
                  <th className="p-2 font-bold border-r border-gray-300">Receipt No</th>
                  <th className="p-2 font-bold border-r border-gray-300">Payment No</th>
                  {!hideBookingCols && (
                    <>
                      <th className="p-2 font-bold border-r border-gray-300">Order No</th>
                      <th className="p-2 font-bold border-r border-gray-300">Order Date</th>
                      <th className="p-2 font-bold border-r border-gray-300">Vehicle No</th>
                    </>
                  )}
                  <th className="p-2 font-bold border-r border-gray-300">Consignor</th>
                  <th className="p-2 font-bold border-r border-gray-300">Consignee</th>
                  <th className="p-2 font-bold border-r border-gray-300">Freight</th>
                  <th className="p-2 font-bold border-r border-gray-300">Items</th>
                  <th className="p-2 font-bold border-r border-gray-300 text-right">Qty</th>
                  <th className="p-2 font-bold border-r border-gray-300 text-right">Total</th>
                  <th className="p-2 font-bold border-r border-gray-300 text-right">Received</th>
                  <th className="p-2 font-bold border-r border-gray-300 text-right">Paid</th>
                  <th className="p-2 font-bold border-r border-gray-300">Del. Date</th>
                  <th className="p-2 font-bold border-r border-gray-300">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {progressData.length === 0 ? (
                    <tr><td colSpan={18} className="p-8 text-center text-gray-400 italic bg-gray-50">No consignment records available for this order</td></tr>
                ) : (
                progressData.map((row, i) => (
                  <tr key={i} className={`hover:bg-blue-50/50 transition-colors ${i % 2 === 0 ? "bg-white" : "bg-gray-50/30"}`}>
                    <td className="p-2 font-bold text-blue-800 border-r border-gray-200">{row.biltyNo || "-"}</td>
                    <td className="p-2 border-r border-gray-200">{row.receiptNo || "-"}</td>
                    <td className="p-2 border-r border-gray-200">{row.paymentNo || "-"}</td>
                    {!hideBookingCols && (
                      <>
                        <td className="p-2 font-medium border-r border-gray-200">{row.orderNo || "-"}</td>
                        <td className="p-2 text-orange-800 border-r border-gray-200">{formatDate(row.orderDate)}</td>
                        <td className="p-2 text-purple-800 border-r border-gray-200">{row.vehicleNo || "-"}</td>
                      </>
                    )}
                    <td className="p-2 border-r border-gray-200 truncate max-w-[120px]" title={row.consignor}>{row.consignor || "-"}</td>
                    <td className="p-2 border-r border-gray-200 truncate max-w-[120px]" title={row.consignee}>{row.consignee || "-"}</td>
                    <td className="p-2 text-indigo-800 font-bold border-r border-gray-200 text-right">{row.freight || "0.00"}</td>
                    <td className="p-2 truncate max-w-[150px] border-r border-gray-200" title={row.items}>{row.items || "-"}</td>
                    <td className="p-2 font-bold border-r border-gray-200 text-right">{row.qty || "0"}</td>
                    <td className="p-2 text-green-800 font-bold border-r border-gray-200 text-right">{row.totalAmount ? Number(row.totalAmount).toLocaleString(undefined, {minimumFractionDigits:2}) : "0.00"}</td>
                    <td className="p-2 text-emerald-800 font-bold border-r border-gray-200 text-right">{row.receivedAmount ? Number(row.receivedAmount).toLocaleString(undefined, {minimumFractionDigits:2}) : "0.00"}</td>
                    <td className="p-2 text-purple-800 font-bold border-r border-gray-200 text-right">{row.paidAmount ? Number(row.paidAmount).toLocaleString(undefined, {minimumFractionDigits:2}) : "0.00"}</td>
                    <td className="p-2 text-orange-800 border-r border-gray-200">{formatDate(row.deliveryDate)}</td>
                    <td className="p-2 font-bold">
                      <span className={`px-2 py-0.5 rounded-sm text-[9px] uppercase tracking-tighter ${row.consignmentStatus === "Delivered" ? "bg-green-100 text-green-800 border border-green-200" :
                        row.consignmentStatus === "In Transit" ? "bg-blue-100 text-blue-800 border border-blue-200" :
                        row.consignmentStatus === "Pending" ? "bg-yellow-100 text-yellow-800 border border-yellow-200" :
                        "bg-gray-100 text-gray-600 border border-gray-200"
                        }`}>
                        {row.consignmentStatus || "Pending"}
                      </span>
                    </td>
                  </tr>
                )))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 overflow-x-auto py-1 px-4 bg-gray-100 border-t border-gray-300">
        {steps.map((step, idx) => {
          const isLast = idx === steps.length - 1;
          const prevDone = idx === 0 || steps[idx - 1].completed;
          return (
            <div key={step.key} className="flex items-center min-w-max group">
              <div
                className={`w-6 h-6 rounded-full border flex items-center justify-center text-[10px] font-bold shadow-sm transition-all ${step.completed ? "bg-emerald-600 border-emerald-700 text-white" :
                  step.active ? "border-blue-500 text-blue-600 bg-white ring-2 ring-blue-100" :
                    "border-gray-400 text-gray-400 bg-gray-50"
                  }`}
                title={step.hint || ""}
              >
                {step.completed ? <FaCheck size={10} /> : idx + 1}
              </div>
              <div className="ml-1.5">
                <div className={`text-[10px] font-bold uppercase tracking-tight ${step.completed ? "text-emerald-800" : step.active ? "text-blue-800" : "text-gray-500"}`}>
                  {step.label}
                </div>
              </div>
              {!isLast && (
                <div className="ml-3 w-8 h-0.5 rounded-full opacity-50" style={{ background: prevDone && step.completed ? "#059669" : "#9ca3af" }} />
              )}
            </div>
          );
        })}
        {loading && (
           <div className="ml-auto flex items-center gap-1.5 text-[9px] font-bold text-blue-600 animate-pulse uppercase">
             <div className="w-2 h-2 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
             Refreshing
           </div>
        )}
      </div>
    </div>
  );
};

export default OrderProgress;