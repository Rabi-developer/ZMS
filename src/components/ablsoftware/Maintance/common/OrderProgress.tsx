"use client";
import React, { useEffect, useMemo, useState } from "react";
import { FaCheck } from "react-icons/fa";
import { getAllCharges } from "@/apis/charges";
import { getAllPaymentABL } from "@/apis/paymentABL";

interface OrderProgressProps {
  orderNo?: string | null;
  bookingStatus?: string | null;
  consignments?: Array<{
    totalAmount?: string | number;
    receivedAmount?: string | number;
    status?: string;
  }>;
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

const OrderProgress: React.FC<OrderProgressProps> = ({ orderNo, bookingStatus, consignments = [] }) => {
  const [chargesCount, setChargesCount] = useState<number>(0);
  const [chargesPaidCount, setChargesPaidCount] = useState<number>(0);
  const [paymentsCompletedCount, setPaymentsCompletedCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);

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
        // Charges filtered by orderNo (API supports filter)
        const chargesRes = await getAllCharges(1, 100, { orderNo });
        const charges = chargesRes?.data || [];
        const paid = charges.filter((x: any) => (x.status || "").toLowerCase() === "paid");
        if (mounted) {
          setChargesCount(charges.length);
          setChargesPaidCount(paid.length);
        }

        // Payments (filter client-side by orderNo)
        const payRes = await getAllPaymentABL(1, 200);
        const payments = (payRes?.data || []).filter((p: any) => (p.orderNo || "") === orderNo);
        const completed = payments.filter((p: any) => (p.status || "").toLowerCase() === "completed");
        if (mounted) {
          setPaymentsCompletedCount(completed.length);
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

  const steps: Step[] = useMemo(() => {
    const bookingCompleted = true; // Booking exists if we are here
    const consignmentCompleted = consignmentCount > 0; // any consignment created
    const chargesCompleted = chargesCount > 0; // any charges created
    const receiptCompleted = totalReceived > 0; // any receipt posted against consignments
    const paymentCompleted = paymentsCompletedCount > 0; // any completed payment

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
        hint: totalReceived > 0 ? `Received ${totalReceived.toLocaleString()}` : "None",
      },
      {
        key: "payment",
        label: "Payment",
        completed: paymentCompleted,
        hint: paymentsCompletedCount > 0 ? `${paymentsCompletedCount} completed` : "None",
      },
    ];

    // Determine active step (first not completed)
    const firstNotDone = list.findIndex((s) => !s.completed);
    if (firstNotDone >= 0) list[firstNotDone].active = true;

    return list;
  }, [bookingStatus, consignmentCount, allConsDelivered, chargesCount, chargesPaidCount, totalReceived, paymentsCompletedCount]);

  return (
    <div className="w-full mt-2">
      <div className="flex items-center gap-2 overflow-x-auto py-2">
        {steps.map((step, idx) => {
          const isLast = idx === steps.length - 1;
          const prevCompleted = idx === 0 ? true : steps[idx - 1].completed;
          return (
            <div key={step.key} className="flex items-center min-w-max">
              {/* Step Circle */}
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

              {/* Label */}
              <div className="ml-2 mr-3">
                <div className={`text-xs font-semibold ${step.completed ? "text-emerald-700" : step.active ? "text-blue-700" : "text-gray-600"}`}>
                  {step.label}
                </div>
                {step.hint && (
                  <div className="text-[10px] text-gray-500">{step.hint}</div>
                )}
              </div>

              {/* Connector */}
              {!isLast && (
                <div className="w-10 sm:w-16 md:w-20 h-1 rounded-full mr-2 "
                  style={{ background: prevCompleted && step.completed ? "linear-gradient(90deg, #10b981 0%, #34d399 100%)" : "#e5e7eb" }}
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