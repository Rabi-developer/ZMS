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
}

interface OrderProgressProps {
  orderNo?: string | number | null;
  bookingOrderId?: string;
  bookingStatus?: string | null;
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
  bookingOrderId: propBookingOrderId,
  bookingStatus,
  consignments: propConsignments = [],
  bookingOrder: propBookingOrder,
  hideBookingOrderInfo,
}) => {
  const [progressData, setProgressData] = useState<OrderProgressRes[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [bookingOrderId, setBookingOrderId] = useState<string | undefined>(propBookingOrderId);

  // If bookingOrderId is not provided but orderNo is, we might need to fetch it.
  // Or if consignments are provided, we might find it there.
  
  useEffect(() => {
    if (propBookingOrderId) {
      setBookingOrderId(propBookingOrderId);
    } else if (propConsignments && propConsignments.length > 0 && propConsignments[0].bookingOrderId) {
      setBookingOrderId(propConsignments[0].bookingOrderId);
    } else if (orderNo) {
       // Try to fetch booking order to get ID if we only have orderNo
       const fetchId = async () => {
         try {
            const res = await getAllBookingOrder(1, 1, { orderNo: String(orderNo) });
            if (res?.data && res.data.length > 0) {
                setBookingOrderId(res.data[0].id);
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
            setProgressData(res.data);
        }
      } catch (error) {
        console.error("Error fetching order progress:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [bookingOrderId]);

  // Calculate steps based on progressData
  const steps: Step[] = useMemo(() => {
    const hasConsignments = progressData.some(p => p.biltyNo || p.consignmentStatus !== "No Consignment");
    const hasCharges = progressData.some(p => p.charges && p.charges !== "-");
    const hasReceipts = progressData.some(p => p.receiptNo && p.receiptNo !== "-");
    const hasPayments = progressData.some(p => p.paymentNo && p.paymentNo !== "-");
    
    const list: Step[] = [
      { 
        key: "booking", 
        label: "Booking", 
        completed: true, 
        hint: `Order: ${orderNo || progressData[0]?.orderNo || ""}` 
      },
      { 
        key: "consignment", 
        label: "Consignment Issued", 
        completed: hasConsignments, 
        hint: hasConsignments ? "Issued" : "None" 
      },
      { 
        key: "charges", 
        label: "Charges Note", 
        completed: hasCharges, 
        hint: hasCharges ? "Charges added" : "None" 
      },
      { 
        key: "receipt", 
        label: "Receipt Note", 
        completed: hasReceipts, 
        hint: hasReceipts ? "Receipts added" : "None" 
      },
      { 
        key: "payment", 
        label: "Payment Note", 
        completed: hasPayments, 
        hint: hasPayments ? "Payments added" : "None" 
      },
    ];
    const firstNotDone = list.findIndex(s => !s.completed);
    if (firstNotDone >= 0) list[firstNotDone].active = true;
    return list;
  }, [progressData, orderNo]);

  const hideBookingCols = !!hideBookingOrderInfo;

  return (
    <div className="w-full bg-white rounded-lg shadow-md border border-gray-200">
      <div className="p-4">
        <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          Order Progress
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
                  <th className="p-3 font-semibold text-green-700 bg-green-50">Charges</th>
                  <th className="p-3 font-semibold text-emerald-700 bg-emerald-50">Amount</th>
                  <th className="p-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {progressData.length === 0 ? (
                    <tr><td colSpan={16} className="p-4 text-center text-gray-500">No data available</td></tr>
                ) : (
                progressData.map((row, i) => (
                  <tr key={i} className={`border-b ${i % 2 === 0 ? "bg-gray-50" : "bg-white"} hover:bg-gray-100`}>
                    <td className="p-3 font-medium text-blue-700">{row.biltyNo || "-"}</td>
                    <td className="p-3">{row.receiptNo || "-"}</td>
                    <td className="p-3">{row.paymentNo || "-"}</td>
                    {!hideBookingCols && (
                      <>
                        <td className="p-3 font-medium">{row.orderNo || "-"}</td>
                        <td className="p-3 text-orange-700 font-medium">{formatDate(row.orderDate)}</td>
                        <td className="p-3 text-purple-700 font-medium">{row.vehicleNo || "-"}</td>
                      </>
                    )}
                    <td className="p-3">{row.consignor || "-"}</td>
                    <td className="p-3">{row.consignee || "-"}</td>
                    <td className="p-3 truncate max-w-[200px]" title={row.items}>{row.items || "-"}</td>
                    <td className="p-3 truncate max-w-[150px] font-medium" title={row.qty}>{row.qty || "-"}</td>
                    <td className="p-3 text-green-700 font-medium">{row.totalAmount ? Number(row.totalAmount).toLocaleString() : "-"}</td>
                    <td className="p-3 text-emerald-700 font-medium">{row.receivedAmount ? Number(row.receivedAmount).toLocaleString() : "-"}</td>
                    <td className="p-3 text-purple-700 font-medium">{row.paidAmount ? Number(row.paidAmount).toLocaleString() : "-"}</td>
                    <td className="p-3 text-orange-700 font-medium">{formatDate(row.deliveryDate)}</td>
                    <td className="p-3 text-blue-700 font-medium">
                      {row.paidToPerson ? (
                        <span className="bg-blue-50 px-2 py-1 rounded text-xs">{row.paidToPerson}</span>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="p-3 min-w-[120px] text-green-700 font-medium">
                      {row.charges ? (
                        <span className="bg-green-100 px-3 py-1 rounded-md text-sm font-medium text-green-800">{row.charges}</span>
                      ) : (
                        <span className="text-gray-400 italic">No Charges</span>
                      )}
                    </td>
                    <td className="p-3 min-w-[100px] text-emerald-700 font-semibold">
                      {row.amount ? (
                         <span className="bg-emerald-100 px-3 py-1 rounded-md text-sm font-bold text-emerald-800">
                             Rs.{row.amount}
                         </span>
                      ) : (
                        <span className="text-gray-400 italic">No Amount</span>
                      )}
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${row.consignmentStatus === "Delivered" ? "bg-green-100 text-green-800" :
                        row.consignmentStatus === "In Transit" ? "bg-blue-100 text-blue-800" :
                          row.consignmentStatus === "Pending" ? "bg-yellow-100 text-yellow-800" :
                            "bg-gray-100 text-gray-600"
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

      <div className="flex items-center gap-2 overflow-x-auto py-2 px-6 bg-gray-50 border-t">
        {steps.map((step, idx) => {
          const isLast = idx === steps.length - 1;
          const prevDone = idx === 0 || steps[idx - 1].completed;
          return (
            <div key={step.key} className="flex items-center min-w-max">
              <div
                className={`w-9 h-9 rounded-full border-2 flex items-center justify-center text-xs font-semibold ${step.completed ? "bg-emerald-600 border-emerald-600 text-white" :
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
                <div className="w-16 h-1 rounded-full" style={{ background: prevDone && step.completed ? "linear-gradient(90deg, #065f46, #34d399)" : "#e5e7eb" }} />
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