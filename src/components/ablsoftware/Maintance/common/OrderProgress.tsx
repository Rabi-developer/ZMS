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
  bookingOrderId?: string; // API returns bookingOrderId (GUID)
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
  recvAmount?: string | number; // API returns recvAmount
  deliveryDate?: string;
  delDate?: string; // API returns delDate
  status?: string;
  orderNo?: string | number;
  item?: string;
  itemDesc?: string;
  description?: string;
  qty?: number;
  quantity?: number;
  qtyUnit?: string;
  unit?: string;
}

interface BookingOrderInfo {
  id?: string;
  orderNo: string;
  orderDate: string;
  vehicleNo: string;
}

interface Charge {
  paidToPerson?: string;
  charges?: string;
  amount?: string | number;
  biltyNo?: string;
  paidAmount?: number;
  paymentNos?: string[];
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

  console.log("OrderProgress: Component props received:", {
    orderNo: orderNo,
    bookingOrderProp: bookingOrder,
    selectedOrder: selOrder,
    consignmentsLength: consignments.length,
    timestamp: new Date().toISOString()
  });

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

  // FETCH BOOKING ORDER WHEN orderNo CHANGES OR FROM CONSIGNMENT bookingOrderId
  useEffect(() => {
    let mounted = true;
    const fetchBookingOrder = async () => {
      if (!selOrder && consignments.length === 0) {
        setBookingOrder(null);
        return;
      }
      if (propBookingOrder) {
        setBookingOrder(propBookingOrder);
        return;
      }

      try {
        // First, try to get bookingOrderId from consignments
        const bookingOrderId = consignments[0]?.bookingOrderId;
        
        if (bookingOrderId) {
          // Fetch by ID if we have bookingOrderId
          const res = await getAllBookingOrder(1, 200, {});
          const found = (res?.data || []).find((b: any) => b.id === bookingOrderId);
          if (mounted && found) {
            setBookingOrder({
              id: found.id,
              orderNo: String(found.orderNo || selOrder),
              orderDate: found.orderDate || "Not Set",
              vehicleNo: found.vehicleNo || "-",
            });
            return;
          }
        }
        
        // Fallback: try to fetch by orderNo
        if (selOrder) {
          const res = await getAllBookingOrder(1, 200, { orderNo: selOrder });
          const found = (res?.data || []).find((b: any) => String(b.orderNo) === selOrder);
          if (mounted) {
            setBookingOrder({
              id: found?.id,
              orderNo: selOrder,
              orderDate: found?.orderDate || "Not Set",
              vehicleNo: found?.vehicleNo || "-",
            });
          }
        }
      } catch (e) {
        if (mounted) {
          setBookingOrder({ orderNo: selOrder, orderDate: "Not Set", vehicleNo: "-" });
        }
      }
    };
    fetchBookingOrder();
    return () => { mounted = false; };
  }, [selOrder, propBookingOrder, consignments]);

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
      } catch (error) { }
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
        console.log("OrderProgress: Fetching charges for order:", selOrder);
        const chargesRes = await getAllCharges(1, 100, { orderNo: selOrder });
        console.log("OrderProgress: Raw charges response:", chargesRes);

        const allChargesData = chargesRes?.data || [];
        console.log("OrderProgress: All charges data:", allChargesData);

        // Try multiple filtering approaches to catch charges
        const exactMatch = allChargesData.filter((c: any) => String(c.orderNo) === String(selOrder));
        const looseMatch = allChargesData.filter((c: any) =>
          c.orderNo && String(c.orderNo).includes(String(selOrder))
        );
        const chargesData = exactMatch.length > 0 ? exactMatch : looseMatch;

        console.log("OrderProgress: Filtered charges data:", {
          selOrder,
          exactMatch,
          looseMatch,
          finalChargesData: chargesData
        });

        const paid = chargesData.filter((x: any) => (x.status || "").toLowerCase() === "paid");
        const normalized = chargesData.flatMap((c: any) => {
          console.log("OrderProgress: Processing individual charge:", c);

          // Calculate paid amount from payments array in charge object
          const totalPaid = (c.payments || []).reduce((sum: number, p: any) => sum + (Number(p.paidAmount) || 0), 0);
          const pNos = (c.payments || []).map((p: any) => p.payNo).filter(Boolean);

          // Extract charge information - prioritize line data, fallback to parent charge data
          const base = {
            paidToPerson: c.paidToPerson ?? c.paidTo ?? "-",
            charges: c.charges ?? c.chargeType ?? c.description ?? `Charge #${c.chargeNo}`,
            amount: c.amount ?? c.chargeAmount ?? c.total ?? "-",
            biltyNo: c.biltyNo ?? "",
            paidAmount: totalPaid,
            paymentNos: pNos
          };

          // If lines exist, map them but use parent data as fallback for empty fields
          return Array.isArray(c.lines) && c.lines.length > 0
            ? c.lines.map((l: any, idx: number) => {
                // Use line data if available, otherwise use parent charge data
                const linePaidTo = l.paidTo || l.paidToPerson || c.paidTo || c.paidToPerson || "-";
                const lineCharges = l.charges || l.charge || l.chargeType || l.description || c.charges || c.chargeType || `Charge #${c.chargeNo}`;
                const lineAmount = l.amount ?? c.amount ?? c.chargeAmount ?? 0;
                const lineBiltyNo = l.biltyNo || c.biltyNo || "";
                
                return {
                  paidToPerson: linePaidTo,
                  charges: lineCharges,
                  amount: lineAmount,
                  biltyNo: lineBiltyNo,
                  paidAmount: idx === 0 ? totalPaid : 0,
                  paymentNos: idx === 0 ? pNos : []
                };
              })
            : [base];
        });

        console.log("OrderProgress: Charges data processed:", {
          rawChargesData: chargesData,
          normalizedCharges: normalized,
          chargesCount: normalized.length,
          chargesPaidCount: paid.length
        });

        if (mounted) {
          setChargesCount(normalized.length);
          setChargesPaidCount(paid.length);
          setCharges(normalized);
        }

        // Also try fetching charges without filters as fallback
        if (normalized.length === 0) {
          console.log("OrderProgress: No charges found with filters, trying without filters...");
          const allChargesRes = await getAllCharges(1, 200, {});
          const allCharges = allChargesRes?.data || [];
          console.log("OrderProgress: All charges without filters:", allCharges);

          const matchingCharges = allCharges.filter((c: any) => {
            return c.orderNo && (
              String(c.orderNo) === String(selOrder) ||
              String(c.orderNo).includes(String(selOrder)) ||
              String(selOrder).includes(String(c.orderNo))
            );
          });

          console.log("OrderProgress: Matching charges found:", matchingCharges);

          if (matchingCharges.length > 0 && mounted) {
            const fallbackNormalized = matchingCharges.flatMap((c: any) => {
              const totalPaid = (c.payments || []).reduce((sum: number, p: any) => sum + (Number(p.paidAmount) || 0), 0);
              const pNos = (c.payments || []).map((p: any) => p.payNo).filter(Boolean);

              const base = {
                paidToPerson: c.paidToPerson ?? c.paidTo ?? "-",
                charges: c.charges ?? c.chargeType ?? c.description ?? `Charge #${c.chargeNo}`,
                amount: c.amount ?? c.chargeAmount ?? c.total ?? "-",
                biltyNo: c.biltyNo ?? "",
                paidAmount: totalPaid,
                paymentNos: pNos
              };
              return [base];
            });

            setChargesCount(fallbackNormalized.length);
            setCharges(fallbackNormalized);
            console.log("OrderProgress: Using fallback charges:", fallbackNormalized);
          }
        }

        const payRes = await getAllPaymentABL(1, 200);
        const allPayments = payRes?.data || [];
        console.log("OrderProgress: All payments data:", allPayments);
        const biltyKeys = new Set(consignments.flatMap(c => [c.biltyNo, c.id]).filter(Boolean));
        const payments = allPayments.filter((p: any) => {
          // Check if payment has paymentABLItem array
          const paymentItems = p.paymentABLItem || p.items || [];
          
          // Match by orderNo in payment items
          const matchOrder = paymentItems.some((item: any) => String(item.orderNo) === String(selOrder));
          
          // Match by biltyNo or vehicleNo
          const matchBilty = paymentItems.some((item: any) => biltyKeys.has(item.biltyNo ?? item.vehicleNo));
          
          return matchOrder || matchBilty;
        });
        
        console.log("OrderProgress: Filtered payments:", {
          selOrder,
          allPaymentsCount: allPayments.length,
          filteredPaymentsCount: payments.length,
          payments
        });
        const completed = payments.filter((p: any) => (p.status || "").toLowerCase() === "completed");
        const paymentNosList = payments.map((p: any) => p.paymentNo ?? "").filter(Boolean);
        // Calculate total paid from payment items
        const totalPaid = payments.reduce((sum: number, p: any) => {
          const paymentItems = p.paymentABLItem || p.items || [];
          const itemsTotal = paymentItems.reduce((itemSum: number, item: any) => {
            return itemSum + (formatNumber(item.paidAmount) || formatNumber(item.expenseAmount) || 0);
          }, 0);
          return sum + itemsTotal;
        }, 0);
        
        console.log("OrderProgress: Payment totals:", {
          paymentNosList,
          totalPaid,
          completedCount: completed.length
        });
        if (mounted) {
          setPaymentsCompletedCount(completed.length);
          setPaymentNos(paymentNosList);
          setPaymentsTotalPaid(totalPaid);
        }
      } catch (err) {
        console.error("OrderProgress: Error fetching charges:", err);
        console.log("OrderProgress: Failed to fetch charges for order:", selOrder);
      } finally {
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
        
        // Match receipts by orderNo or by biltyNo from receipt items
        const recs = list.filter((r: any) => {
          // Check if receipt has matching orderNo
          const topOrder = r.orderNo ?? "";
          if (String(topOrder) === selOrder) return true;
          
          // Check if receipt items have biltyNo matching consignments
          if (Array.isArray(r.items) && r.items.length > 0) {
            return r.items.some((item: any) => {
              const itemBiltyNo = item.biltyNo?.toString();
              // Match by biltyNo or by receiptNo
              return consignments.some(c => 
                (c.biltyNo && itemBiltyNo === c.biltyNo?.toString()) ||
                (c.receiptNo && itemBiltyNo === c.receiptNo?.toString())
              );
            });
          }
          
          return false;
        });
        const nos = recs.map((r: any) => r.receiptNo ?? "").filter(Boolean);
        const total = recs.reduce((sum: number, r: any) => sum + formatNumber(r.receiptAmount), 0);
        if (mounted) {
          setReceiptNos(nos);
          setReceiptsTotalReceived(total);
        }
      } catch (e) { }
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
      console.log("OrderProgress: No consignments, showing default row with charges if available");

      // Process charges even without consignments
      const chargesInfo = (() => {
        console.log("OrderProgress: Processing charges for no consignment case:", {
          availableCharges: charges,
          chargesLength: charges.length
        });

        if (charges.length === 0) {
          return {
            paidToPerson: "-",
            charges: "-",
            amount: "-",
            paidAmount: "-",
            hasCharges: false
          };
        }

        const validCharges = charges.filter(ch =>
          ch.charges && ch.charges !== "-" && ch.charges !== "" &&
          ch.charges !== null && ch.charges !== undefined
        );
        const validAmounts = charges.filter(ch => {
          const amount = ch.amount;
          return amount && amount !== "-" && amount !== "" &&
            amount !== null && amount !== undefined &&
            !isNaN(Number(amount)) && Number(amount) > 0;
        });
        const validPaidTo = charges.filter(ch =>
          ch.paidToPerson && ch.paidToPerson !== "-" &&
          ch.paidToPerson !== "" && ch.paidToPerson !== null &&
          ch.paidToPerson !== undefined
        );

        console.log("OrderProgress: Filtered charges for no consignment:", {
          validCharges: validCharges,
          validAmounts: validAmounts,
          validPaidTo: validPaidTo
        });

        return {
          paidToPerson: validPaidTo.map(ch => ch.paidToPerson).join(", ") || "-",
          charges: validCharges.map(ch => ch.charges).join(", ") || "-",
          amount: validAmounts.map(ch => {
            const amt = formatNumber(ch.amount);
            return amt > 0 ? amt.toLocaleString() : ch.amount;
          }).join(", ") || "-",
          paidAmount: "-",
          hasCharges: validCharges.length > 0 || validAmounts.length > 0
        };
      })();

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
        paidToPerson: chargesInfo.paidToPerson,
        charges: chargesInfo.charges,
        amount: chargesInfo.amount,
        hasCharges: chargesInfo.hasCharges,
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
        // Priority: actual biltyNo > consignmentNo > generate from receiptNo
        const bilty = c.biltyNo?.toString().trim();
        const consignmentNo = c.consignmentNo?.toString().trim();
        const receiptNo = c.receiptNo?.toString().trim();
        const id = c.id?.toString().trim();

        if (bilty && bilty !== '' && bilty !== 'undefined' && bilty !== 'null') {
          return bilty;
        } else if (consignmentNo && consignmentNo !== '' && consignmentNo !== 'undefined' && consignmentNo !== 'null') {
          return consignmentNo;
        } else if (receiptNo && receiptNo !== '' && receiptNo !== 'undefined' && receiptNo !== 'null') {
          // Use receipt number as bilty identifier if biltyNo is empty
          return `B-${receiptNo}`;
        } else if (id && id !== '' && id !== 'undefined' && id !== 'null') {
          // Last resort: use shortened ID
          return `B-${id.substring(0, 8)}`;
        } else {
          return "-";
        }
      })();

      console.log(`OrderProgress: Consignment ${index + 1} biltyNo mapping:`, {
        originalBiltyNo: c.biltyNo,
        originalConsignmentNo: c.consignmentNo,
        finalBiltyNo: finalBiltyNo,
        consignmentId: c.id
      });

      // Enhanced charges processing
      const chargesInfo = (() => {
        console.log("OrderProgress: Processing charges for consignment:", {
          consignmentIndex: index,
          biltyNo: finalBiltyNo,
          availableCharges: charges,
          chargesLength: charges.length
        });

        if (charges.length === 0) {
          return {
            paidToPerson: "-",
            charges: "-",
            amount: "-",
            paidAmount: "-",
            paymentNos: "-",
            hasCharges: false
          };
        }

        // Filter charges by biltyNo if available
        const relevantCharges = charges.filter((ch: any) => {
          // Match by biltyNo (string comparison)
          const chargeBilty = String(ch.biltyNo || "").trim();
          const consignmentBilty = String(finalBiltyNo || "").trim();

          // If both are present, match them.
          if (chargeBilty && consignmentBilty && chargeBilty !== "No Bilty") {
            return chargeBilty === consignmentBilty;
          }

          // If charge has no bilty (order level charge) and there is only one consignment, link it.
          if (!chargeBilty && consignments.length === 1) {
            return true;
          }

          // Fallback: strict match (handles empty-empty case)
          return chargeBilty === consignmentBilty;
        });

        const validCharges = relevantCharges.filter(ch =>
          ch.charges && ch.charges !== "-" && ch.charges !== "" &&
          ch.charges !== null && ch.charges !== undefined
        );
        const validAmounts = relevantCharges.filter(ch => {
          const amount = ch.amount;
          return amount && amount !== "-" && amount !== "" &&
            amount !== null && amount !== undefined &&
            !isNaN(Number(amount)) && Number(amount) > 0;
        });
        const validPaidTo = relevantCharges.filter(ch =>
          ch.paidToPerson && ch.paidToPerson !== "-" &&
          ch.paidToPerson !== "" && ch.paidToPerson !== null &&
          ch.paidToPerson !== undefined
        );

        // Sum paid amount from relevant charges
        const totalPaidForConsignment = relevantCharges.reduce((sum, ch) => sum + (ch.paidAmount || 0), 0);

        // Collect payment numbers from relevant charges
        const relevantPaymentNos = relevantCharges.flatMap(ch => ch.paymentNos || []).filter(Boolean);
        const uniquePaymentNos = Array.from(new Set(relevantPaymentNos));

        console.log("OrderProgress: Filtered charges data:", {
          validCharges: validCharges,
          validAmounts: validAmounts,
          validPaidTo: validPaidTo,
          totalPaidForConsignment,
          uniquePaymentNos
        });

        return {
          paidToPerson: validPaidTo.map(ch => ch.paidToPerson).join(", ") || "-",
          charges: validCharges.map(ch => ch.charges).join(", ") || "-",
          amount: validAmounts.map(ch => {
            const amt = formatNumber(ch.amount);
            return amt > 0 ? amt.toLocaleString() : ch.amount;
          }).join(", ") || "-",
          paidAmount: totalPaidForConsignment > 0 ? totalPaidForConsignment.toLocaleString() : "-",
          paymentNos: uniquePaymentNos.length > 0 ? uniquePaymentNos.join(", ") : "-",
          hasCharges: validCharges.length > 0 || validAmounts.length > 0
        };
      })();

      // Map API response fields correctly
      const receivedAmt = c.receivedAmount ?? c.recvAmount ?? 0;
      const deliveryDt = c.deliveryDate ?? c.delDate ?? "";

      rows.push({
        biltyNo: finalBiltyNo,
        receiptNo: c.receiptNo != null ? String(c.receiptNo) : (receiptNos.join(", ") || "-"),
        // Use payment numbers from charges if available, otherwise fallback to global
        paymentNo: chargesInfo.paymentNos !== "-" ? chargesInfo.paymentNos : (paymentNos.join(", ") || "-"),
        orderNo: bo?.orderNo || selOrder || "-",
        orderDate: bo?.orderDate || "Not Set",
        vehicleNo: bo?.vehicleNo || "-",
        consignor: consignorName || "-",
        consignee: consigneeName || "-",
        items: itemsDetail,
        qty: qtyDetail,
        totalAmount: formatNumber(c.totalAmount).toLocaleString(),
        receivedAmount: formatNumber(receivedAmt).toLocaleString(),
        deliveryDate: formatDate(deliveryDt),
        consignmentStatus: c.status ?? "Pending",
        paidToPerson: chargesInfo.paidToPerson,
        charges: chargesInfo.charges,
        amount: chargesInfo.amount,
        hasCharges: chargesInfo.hasCharges,
        paidAmount: chargesInfo.paidAmount !== "-" ? chargesInfo.paidAmount : (paymentsTotalPaid > 0 ? paymentsTotalPaid.toLocaleString() : "-"),
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
          {chargesCount > 0 && (
            <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded-full">
              {chargesCount} Charge{chargesCount > 1 ? "s" : ""} • {chargesPaidCount} Paid
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
                  <th className="p-3 font-semibold text-green-700 bg-green-50">Charges</th>
                  <th className="p-3 font-semibold text-emerald-700 bg-emerald-50">Amount</th>
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
                    <td className={`p-3 ${row.hasCharges ? 'text-blue-700 font-medium' : 'text-gray-500'}`}>
                      {row.paidToPerson !== "-" ? (
                        <span className="bg-blue-50 px-2 py-1 rounded text-xs">{row.paidToPerson}</span>
                      ) : (
                        row.paidToPerson
                      )}
                    </td>
                    <td className={`p-3 min-w-[120px] ${row.hasCharges ? 'text-green-700 font-medium' : 'text-gray-500'}`}>
                      {row.charges !== "-" ? (
                        <span className="bg-green-100 px-3 py-1 rounded-md text-sm font-medium text-green-800">{row.charges}</span>
                      ) : (
                        <span className="text-gray-400 italic">No Charges</span>
                      )}
                    </td>
                    <td className={`p-3 min-w-[100px] ${row.hasCharges ? 'text-emerald-700 font-semibold' : 'text-gray-500'}`}>
                      {row.amount !== "-" ? (
                        <span className="bg-emerald-100 px-3 py-1 rounded-md text-sm font-bold text-emerald-800">Rs.{row.amount}</span>
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