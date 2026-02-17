'use client';
import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import FuelUsageGraph from '@/components/Design/Graph/FuelUsageGraph';
import MaintenanceGraph from '@/components/Design/Graph/MaintenanceGraph';
import DeliveryGraph from '@/components/Design/Graph/DeliveryGraph';
import BookingOrderForm from '@/components/ablsoftware/Maintance/BookingOrder.tsx/BookingOrder';
import { getAllEquality } from '@/apis/equality';
import { getAllAblLiabilities } from '@/apis/ablliabilities';
import { getAllAblAssests } from '@/apis/ablAssests';
import { getAllAblRevenue } from '@/apis/ablRevenue';
import { getAllAblExpense } from '@/apis/ablExpense';
import OrderProgress from '@/components/ablsoftware/Maintance/common/OrderProgress';
import { getAllBookingOrder, getConsignmentsForBookingOrder } from '@/apis/bookingorder';
import { getAllCharges } from '@/apis/charges';
import { getAllPaymentABL } from '@/apis/paymentABL';
import { getAllReceipt } from '@/apis/receipt';
import { usePermissions } from '@/contexts/PermissionContext';

type Account = {
  id: string;
  description: string;
  parentAccountId: string | null;
  children: Account[];
  fixedAmount?: string;
  paid?: string;
};

type DashboardMetrics = {
  totalBookings: number;
  openBookings: number;
  totalApprovedCharges: number;
  totalPaidAmount: number;
  paymentRemainingAmount: number;
  totalReceiptAmount: number;
  pendingPaymentCount: number;
  monthLabels: string[];
  bookingsByMonth: number[];
  chargesByMonth: number[];
  receiptsByMonth: number[];
  paymentsByMonth: number[];
  remainingByMonth: number[];
};

const EMPTY_METRICS: DashboardMetrics = {
  totalBookings: 0,
  openBookings: 0,
  totalApprovedCharges: 0,
  totalPaidAmount: 0,
  paymentRemainingAmount: 0,
  totalReceiptAmount: 0,
  pendingPaymentCount: 0,
  monthLabels: [],
  bookingsByMonth: [],
  chargesByMonth: [],
  receiptsByMonth: [],
  paymentsByMonth: [],
  remainingByMonth: [],
};

const parseNum = (v: any): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const formatMoney = (n: number): string =>
  n.toLocaleString(undefined, { maximumFractionDigits: 2 });

const parseDate = (value: any): Date | null => {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

const monthKey = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

const toShortMonth = (key: string): string => {
  const [y, m] = key.split('-');
  const d = new Date(Number(y), Number(m) - 1, 1);
  return d.toLocaleString(undefined, { month: 'short' });
};

const getLastMonthKeys = (count: number): string[] => {
  const now = new Date();
  const keys: string[] = [];
  for (let i = count - 1; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    keys.push(monthKey(d));
  }
  return keys;
};

const getChargeAmount = (charge: any): number => {
  if (Array.isArray(charge?.lines) && charge.lines.length > 0) {
    return charge.lines.reduce(
      (sum: number, line: any) =>
        sum +
        parseNum(
          line.amount ?? line.amountCharges ?? line.totalAmount ?? line.expenseAmount ?? 0
        ),
      0
    );
  }
  return parseNum(charge.amount ?? charge.totalAmount ?? charge.expenseAmount ?? 0);
};

const getPaymentAmount = (payment: any): number => {
  const top = parseNum(payment.paidAmount ?? payment.paymentAmount ?? payment.totalAmount ?? 0);
  if (top > 0) return top;
  const items = Array.isArray(payment.paymentABLItem)
    ? payment.paymentABLItem
    : Array.isArray(payment.PaymentABLItem)
      ? payment.PaymentABLItem
      : Array.isArray(payment.items)
        ? payment.items
        : [];
  return items.reduce((sum: number, it: any) => sum + parseNum(it.paidAmount ?? 0), 0);
};

const getReceiptAmount = (receipt: any): number =>
  parseNum(receipt.receiptAmount ?? receipt.receivedAmount ?? receipt.totalAmount ?? 0);

const ABLDashboardlayout = () => {
  const pathname = usePathname() || '';
  
  // All hooks must be called before any conditional returns
  const [topAccounts, setTopAccounts] = useState<Account[]>([]);
  const [inProgressBookings, setInProgressBookings] = useState<any[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [loadingDashboard, setLoadingDashboard] = useState(false);
  const [metrics, setMetrics] = useState<DashboardMetrics>(EMPTY_METRICS);
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [detailData, setDetailData] = useState<any>({
    bookings: [],
    charges: [],
    payments: [],
    receipts: [],
    unpaidCharges: [],
  });
  const [overdueItems, setOverdueItems] = useState<any[]>([]);

  const { canRead, isSuperAdmin, isLoading: permissionsLoading } = usePermissions();

  const fetchAccounts = async () => {
    setLoadingAccounts(true);
    try {
      const [assetsRes, revenuesRes, liabilitiesRes, expensesRes, equitiesRes] = await Promise.all([
        getAllAblAssests(1, 10000).catch(() => ({ data: [] })),
        getAllAblRevenue(1, 10000).catch(() => ({ data: [] })),
        getAllAblLiabilities(1, 10000).catch(() => ({ data: [] })),
        getAllAblExpense(1, 10000).catch(() => ({ data: [] })),
        getAllEquality(1, 10000).catch(() => ({ data: [] })),
      ]);

      const buildHierarchy = (items: any[]): Account[] => {
        const map: Record<string, Account> = {};
        items.forEach((it: any) => (map[it.id] = { ...it, children: [] }));
        const roots: Account[] = [];
        items.forEach((it: any) => {
          if (!it.parentAccountId) roots.push(map[it.id]);
          else if (map[it.parentAccountId]) map[it.parentAccountId].children.push(map[it.id]);
        });
        return roots;
      };

      setTopAccounts([
        { id: 'assets', description: 'Assets', parentAccountId: null, children: buildHierarchy(assetsRes.data || []) },
        { id: 'revenues', description: 'Revenues', parentAccountId: null, children: buildHierarchy(revenuesRes.data || []) },
        { id: 'liabilities', description: 'Liabilities', parentAccountId: null, children: buildHierarchy(liabilitiesRes.data || []) },
        { id: 'expenses', description: 'Expenses', parentAccountId: null, children: buildHierarchy(expensesRes.data || []) },
        { id: 'equities', description: 'Equities', parentAccountId: null, children: buildHierarchy(equitiesRes.data || []) },
      ]);
    } catch (e) {
      console.warn('Failed to load accounts for dashboard', e);
    } finally {
      setLoadingAccounts(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      setLoadingDashboard(true);
      setLoadingBookings(true);
      try {
        const [bookingsRes, chargesRes, receiptsRes, paymentsRes] = await Promise.all([
          getAllBookingOrder(1, 10000).catch(() => ({ data: [] })),
          getAllCharges(1, 10000).catch(() => ({ data: [] })),
          getAllReceipt(1, 10000).catch(() => ({ data: [] })),
          getAllPaymentABL(1, 10000).catch(() => ({ data: [] })),
        ]);

        const bookings = bookingsRes?.data || [];
        const charges = chargesRes?.data || [];
        const receipts = receiptsRes?.data || [];
        const payments = paymentsRes?.data || [];

        const approvedCharges = charges.filter((c: any) =>
          ['approved', 'closed'].includes(String(c.status || '').toLowerCase())
        );
        const totalApprovedCharges = approvedCharges.reduce(
          (sum: number, c: any) => sum + getChargeAmount(c),
          0
        );
        const totalPaidAmount = payments.reduce(
          (sum: number, p: any) => sum + getPaymentAmount(p),
          0
        );
        const totalReceiptAmount = receipts.reduce(
          (sum: number, r: any) => sum + getReceiptAmount(r),
          0
        );

        const paymentItems = payments.flatMap((p: any) =>
          Array.isArray(p.paymentABLItem)
            ? p.paymentABLItem
            : Array.isArray(p.PaymentABLItem)
              ? p.PaymentABLItem
              : Array.isArray(p.items)
                ? p.items
                : []
        );
        const pendingPaymentCount = paymentItems.filter((it: any) => parseNum(it.balance) > 0).length;

        const openBookings = bookings.filter((b: any) => {
          const s = String(b.status || '').toLowerCase();
          return !['closed', 'completed', 'cancelled', 'canceled'].includes(s);
        }).length;

        const monthKeys = getLastMonthKeys(6);
        const monthIndex = Object.fromEntries(monthKeys.map((k, i) => [k, i]));
        const bookingsByMonth = Array(monthKeys.length).fill(0);
        const chargesByMonth = Array(monthKeys.length).fill(0);
        const receiptsByMonth = Array(monthKeys.length).fill(0);
        const paymentsByMonth = Array(monthKeys.length).fill(0);

        bookings.forEach((b: any) => {
          const d = parseDate(b.orderDate ?? b.OrderDate ?? b.date);
          if (!d) return;
          const idx = monthIndex[monthKey(d)];
          if (idx !== undefined) bookingsByMonth[idx] += 1;
        });
        approvedCharges.forEach((c: any) => {
          const d = parseDate(c.chargeDate ?? c.ChargeDate ?? c.date);
          if (!d) return;
          const idx = monthIndex[monthKey(d)];
          if (idx !== undefined) chargesByMonth[idx] += getChargeAmount(c);
        });
        receipts.forEach((r: any) => {
          const d = parseDate(r.receiptDate ?? r.ReceiptDate ?? r.date);
          if (!d) return;
          const idx = monthIndex[monthKey(d)];
          if (idx !== undefined) receiptsByMonth[idx] += getReceiptAmount(r);
        });
        payments.forEach((p: any) => {
          const d = parseDate(p.paymentDate ?? p.PaymentDate ?? p.date);
          if (!d) return;
          const idx = monthIndex[monthKey(d)];
          if (idx !== undefined) paymentsByMonth[idx] += getPaymentAmount(p);
        });

        const remainingByMonth = chargesByMonth.map((v, i) => Math.max(0, v - paymentsByMonth[i]));
        const monthLabels = monthKeys.map(toShortMonth);

        const bookingCandidates = bookings.slice(0, 50);
        const progressResults: any[] = [];
        await Promise.all(
          bookingCandidates.map(async (b: any) => {
            try {
              const orderNo = b.orderNo || b.OrderNo || '';
              const bookingId = b.id || orderNo;
              if (!bookingId) return;

              const consRes = await getConsignmentsForBookingOrder(bookingId, 1, 200).catch(
                () => ({ data: [] })
              );
              const consignments = consRes?.data || [];
              const biltyKeys = new Set(
                consignments
                  .flatMap((c: any) => [c.biltyNo, c.BiltyNo, c.consignmentNo, c.ConsignmentNo, c.id])
                  .filter(Boolean)
              );

              const chargesForOrder = charges.filter(
                (c: any) => String(c.orderNo ?? c.OrderNo ?? '') === String(orderNo)
              );

              const receiptsForOrder = receipts.filter((r: any) => {
                const topOrder = r.orderNo ?? r.OrderNo ?? '';
                const topBilty = r.biltyNo ?? r.BiltyNo ?? '';
                const itemList = Array.isArray(r.items) ? r.items : [];
                const itemMatch = itemList.some((it: any) => {
                  const itemOrder = it.orderNo ?? it.OrderNo ?? '';
                  const itemBilty = it.biltyNo ?? it.BiltyNo ?? '';
                  return (
                    String(itemOrder) === String(orderNo) ||
                    (itemBilty && biltyKeys.has(itemBilty))
                  );
                });
                return (
                  String(topOrder) === String(orderNo) ||
                  (topBilty && biltyKeys.has(topBilty)) ||
                  itemMatch
                );
              });

              const paymentsForOrder = payments.filter((p: any) => {
                const topOrder = p.orderNo ?? p.OrderNo ?? '';
                const items = Array.isArray(p.items)
                  ? p.items
                  : Array.isArray(p.paymentABLItem)
                    ? p.paymentABLItem
                    : Array.isArray(p.PaymentABLItem)
                      ? p.PaymentABLItem
                      : [];
                const itemMatch = items.some((it: any) => {
                  const itemOrder = it.orderNo ?? it.OrderNo ?? '';
                  const itemBilty =
                    it.biltyNo ?? it.BiltyNo ?? it.consignmentNo ?? it.ConsignmentNo ?? it.id;
                  return (
                    String(itemOrder) === String(orderNo) ||
                    (itemBilty && biltyKeys.has(itemBilty))
                  );
                });
                return String(topOrder) === String(orderNo) || itemMatch;
              });

              const steps = [
                { key: 'booking', label: 'Booking', completed: true },
                { key: 'consignment', label: 'Consignment', completed: consignments.length > 0 },
                { key: 'charges', label: 'Charges', completed: chargesForOrder.length > 0 },
                {
                  key: 'receipt',
                  label: 'Receipt',
                  completed:
                    receiptsForOrder.reduce(
                      (sum: number, r: any) => sum + getReceiptAmount(r),
                      0
                    ) > 0,
                },
                {
                  key: 'payment',
                  label: 'Payment',
                  completed:
                    paymentsForOrder.filter((p: any) =>
                      ['approved', 'completed', 'closed'].includes(
                        String(p.status || '').toLowerCase()
                      )
                    ).length > 0,
                },
              ];

              const firstNotDone = steps.find((s) => !s.completed);
              if (firstNotDone) {
                progressResults.push({
                  id: bookingId,
                  orderNo,
                  currentStage: firstNotDone.label,
                });
              }
            } catch {
              // ignore per-booking failures
            }
          })
        );

        if (mounted) {
          setInProgressBookings(progressResults);
          
          // Calculate unpaid charges
          const unpaidCharges = approvedCharges.map((charge: any) => {
            const chargeAmount = getChargeAmount(charge);
            const chargeId = charge.id || charge.chargeNo || '';
            
            // Find payments for this charge
            const relatedPayments = payments.filter((p: any) => {
              const items = Array.isArray(p.items)
                ? p.items
                : Array.isArray(p.paymentABLItem)
                  ? p.paymentABLItem
                  : Array.isArray(p.PaymentABLItem)
                    ? p.PaymentABLItem
                    : [];
              return items.some((it: any) => 
                String(it.chargeId || it.ChargeId || '') === String(chargeId)
              );
            });
            
            const paidAmount = relatedPayments.reduce(
              (sum: number, p: any) => sum + getPaymentAmount(p),
              0
            );
            
            const remainingAmount = chargeAmount - paidAmount;
            
            return {
              id: chargeId,
              chargeNo: charge.chargeNo || charge.ChargeNo || chargeId,
              orderNo: charge.orderNo || charge.OrderNo || '-',
              chargeDate: charge.chargeDate || charge.ChargeDate || '-',
              dueDate: charge.dueDate || charge.DueDate || null,
              totalAmount: chargeAmount,
              paidAmount,
              remainingAmount,
              status: charge.status || 'Pending',
            };
          }).filter((c: any) => c.remainingAmount > 0);
          
          // Find overdue items
          const now = new Date();
          const overdue: any[] = [];
          
          // Check overdue charges
          unpaidCharges.forEach((c: any) => {
            const dueDate = parseDate(c.dueDate);
            if (dueDate && dueDate < now) {
              const daysOverdue = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
              overdue.push({
                type: 'Charge',
                title: `Charge ${c.chargeNo}`,
                description: `Order: ${c.orderNo}`,
                amount: c.remainingAmount,
                dueDate: dueDate,
                daysOverdue,
                severity: daysOverdue > 30 ? 'critical' : daysOverdue > 7 ? 'high' : 'medium',
              });
            }
          });
          
          // Check overdue accounts
          accountsWithDue.forEach((a: any) => {
            const dueDate = parseDueDate(a);
            if (dueDate && dueDate < now) {
              const fixed = parseNum(a.fixedAmount);
              const paid = parseNum(a.paid);
              const due = fixed - paid;
              const daysOverdue = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
              overdue.push({
                type: 'Account',
                title: a.description,
                description: 'Account payment due',
                amount: due,
                dueDate: dueDate,
                daysOverdue,
                severity: daysOverdue > 30 ? 'critical' : daysOverdue > 7 ? 'high' : 'medium',
              });
            }
          });
          
          // Sort by days overdue (most overdue first)
          overdue.sort((a, b) => b.daysOverdue - a.daysOverdue);
          
          setOverdueItems(overdue);
          
          setDetailData({
            bookings: bookings.map((b: any) => ({
              id: b.id,
              orderNo: b.orderNo || b.OrderNo || '-',
              orderDate: b.orderDate || b.OrderDate || '-',
              status: b.status || 'Open',
              customer: b.customer || b.Customer || '-',
            })),
            charges: approvedCharges.map((c: any) => ({
              id: c.id,
              chargeNo: c.chargeNo || c.ChargeNo || '-',
              orderNo: c.orderNo || c.OrderNo || '-',
              chargeDate: c.chargeDate || c.ChargeDate || '-',
              amount: getChargeAmount(c),
              status: c.status || 'Approved',
            })),
            payments: payments.map((p: any) => ({
              id: p.id,
              paymentNo: p.paymentNo || p.PaymentNo || '-',
              paymentDate: p.paymentDate || p.PaymentDate || '-',
              amount: getPaymentAmount(p),
              status: p.status || 'Pending',
              paidTo: p.paidTo || p.PaidTo || '-',
            })),
            receipts: receipts.map((r: any) => ({
              id: r.id,
              receiptNo: r.receiptNo || r.ReceiptNo || '-',
              receiptDate: r.receiptDate || r.ReceiptDate || '-',
              amount: getReceiptAmount(r),
              receivedFrom: r.receivedFrom || r.ReceivedFrom || '-',
            })),
            unpaidCharges,
          });
          
          setMetrics({
            totalBookings: bookings.length,
            openBookings,
            totalApprovedCharges,
            totalPaidAmount,
            paymentRemainingAmount: Math.max(0, totalApprovedCharges - totalPaidAmount),
            totalReceiptAmount,
            pendingPaymentCount,
            monthLabels,
            bookingsByMonth,
            chargesByMonth,
            receiptsByMonth,
            paymentsByMonth,
            remainingByMonth,
          });
        }
      } catch (e) {
        console.warn('Failed to load dashboard data', e);
      } finally {
        if (mounted) {
          setLoadingBookings(false);
          setLoadingDashboard(false);
        }
      }
    };

    run();
    return () => {
      mounted = false;
    };
  }, []);

  // Helper functions
  const flattenAccounts = (nodes: Account[]): Account[] =>
    nodes.flatMap((n) => [n, ...flattenAccounts(n.children || [])]);

  const parseDueDate = (a: Account): Date | null =>
    parseDate((a as any).dueDate || (a as any).due_date || (a as any).duedate || (a as any).due);

  // Calculate derived values AFTER all hooks
  const isBookingOrderStart = (() => {
    const p = pathname.toLowerCase();
    if (!p) return false;
    if (p.includes('/bookingorder/create')) return true;
    if (p.includes('/bookingorder/edit')) return true;
    if (p === '/bookingorder' || p.startsWith('/bookingorder?')) return true;
    return false;
  })();

  const accountsWithDue = flattenAccounts(topAccounts).filter((a) => {
    const fixed = parseNum((a as any).fixedAmount);
    const paid = parseNum((a as any).paid);
    return fixed - paid > 0;
  });

  const totalDue = accountsWithDue.reduce((sum, a) => {
    const fixed = parseNum((a as any).fixedAmount);
    const paid = parseNum((a as any).paid);
    return sum + Math.max(0, fixed - paid);
  }, 0);

  const earliestDueDate = (() => {
    const dates = accountsWithDue.map(parseDueDate).filter((d): d is Date => !!d);
    if (!dates.length) return null;
    return new Date(Math.min(...dates.map((d) => d.getTime())));
  })();

  const accountWithDue = accountsWithDue[0] || null;

  // Permission checks AFTER all hooks and calculations
  const canAccessAblDashboard =
    isSuperAdmin || canRead('AblDashboard') || canRead('AblAssets') || canRead('BookingOrder');

  if (permissionsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!canAccessAblDashboard) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Access Denied</h2>
          <p className="text-gray-600 dark:text-gray-400">
            You don&apos;t have permission to access the ABL Dashboard.
          </p>
        </div>
      </div>
    );
  }

  if (isBookingOrderStart) {
    return (
      <div className="pb-4 grid rounded bg-white mt-20 h-[100vh] overflow-y-auto gap-5 dark:bg-[#1a2a22]">
        <div className="max-w-7xl mx-auto w-full p-4">
          <BookingOrderForm onSaved={() => fetchAccounts()} />
        </div>
        {accountWithDue && (
          <div className="max-w-7xl mx-auto w-full p-4">
            <div className="bg-white dark:bg-gray-800 rounded-md shadow-md p-4 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold">Account with Due</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{accountWithDue.description}</p>
              <p className="text-sm text-gray-700 dark:text-gray-200 mt-1">
                Due Amount:{' '}
                {formatMoney(
                  parseNum((accountWithDue as any).fixedAmount) - parseNum((accountWithDue as any).paid)
                )}
              </p>
            </div>
          </div>
        )}
        <div className="max-w-7xl mx-auto w-full p-4">
          <OrderProgress
            orderNo={
              new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '').get(
                'orderNo'
              ) || ''
            }
          />
        </div>
      </div>
    );
  }

  const cards = [
    {
      title: 'Total Booking Orders',
      value: metrics.totalBookings.toLocaleString(),
      subtitle: `Open: ${metrics.openBookings.toLocaleString()}`,
      accent: 'from-sky-500 to-cyan-500',
      tag: metrics.totalBookings > 0 ? `${Math.round((metrics.openBookings / metrics.totalBookings) * 100)}% Open` : 'No Orders',
      detailKey: 'bookings',
    },
    {
      title: 'Approved Charges',
      value: formatMoney(metrics.totalApprovedCharges),
      subtitle: 'Payable amount',
      accent: 'from-emerald-500 to-green-500',
      tag: 'Verified',
      detailKey: 'charges',
    },
    {
      title: 'Payments Made',
      value: formatMoney(metrics.totalPaidAmount),
      subtitle: `Pending balances: ${metrics.pendingPaymentCount.toLocaleString()}`,
      accent: 'from-violet-500 to-indigo-500',
      tag: metrics.pendingPaymentCount > 0 ? 'Action Needed' : 'Up to Date',
      detailKey: 'payments',
    },
    {
      title: 'Payment Remaining',
      value: formatMoney(metrics.paymentRemainingAmount),
      subtitle: 'Approved charges - payments',
      accent: 'from-amber-500 to-orange-500',
      tag: metrics.paymentRemainingAmount > 0 ? 'Outstanding' : 'Cleared',
      detailKey: 'unpaidCharges',
    },
    {
      title: 'Receipts Collected',
      value: formatMoney(metrics.totalReceiptAmount),
      subtitle: 'Total receipt amount',
      accent: 'from-teal-500 to-emerald-500',
      tag: 'Cash Inflow',
      detailKey: 'receipts',
    },
    {
      title: 'Accounts Due',
      value: accountsWithDue.length.toLocaleString(),
      subtitle: `Total due: ${formatMoney(totalDue)}`,
      accent: 'from-rose-500 to-pink-500',
      tag: accountsWithDue.length > 0 ? 'Review Due' : 'No Due',
      detailKey: 'accountsDue',
    },
  ];

  const renderDetailModal = () => {
    if (!selectedCard) return null;

    const getDetailContent = () => {
      switch (selectedCard) {
        case 'bookings':
          return (
            <div className="overflow-auto max-h-96">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-100 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-2 text-left">Order No</th>
                    <th className="px-4 py-2 text-left">Date</th>
                    <th className="px-4 py-2 text-left">Customer</th>
                    <th className="px-4 py-2 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {detailData.bookings.map((b: any) => (
                    <tr key={b.id} className="border-t dark:border-gray-700">
                      <td className="px-4 py-2">{b.orderNo}</td>
                      <td className="px-4 py-2">{new Date(b.orderDate).toLocaleDateString()}</td>
                      <td className="px-4 py-2">{b.customer}</td>
                      <td className="px-4 py-2">
                        <span className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                          {b.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        
        case 'charges':
          return (
            <div className="overflow-auto max-h-96">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-100 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-2 text-left">Charge No</th>
                    <th className="px-4 py-2 text-left">Order No</th>
                    <th className="px-4 py-2 text-left">Date</th>
                    <th className="px-4 py-2 text-right">Amount</th>
                    <th className="px-4 py-2 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {detailData.charges.map((c: any) => (
                    <tr key={c.id} className="border-t dark:border-gray-700">
                      <td className="px-4 py-2">{c.chargeNo}</td>
                      <td className="px-4 py-2">{c.orderNo}</td>
                      <td className="px-4 py-2">{new Date(c.chargeDate).toLocaleDateString()}</td>
                      <td className="px-4 py-2 text-right">{formatMoney(c.amount)}</td>
                      <td className="px-4 py-2">
                        <span className="px-2 py-1 rounded text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          {c.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        
        case 'payments':
          return (
            <div className="overflow-auto max-h-96">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-100 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-2 text-left">Payment No</th>
                    <th className="px-4 py-2 text-left">Date</th>
                    <th className="px-4 py-2 text-left">Paid To</th>
                    <th className="px-4 py-2 text-right">Amount</th>
                    <th className="px-4 py-2 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {detailData.payments.map((p: any) => (
                    <tr key={p.id} className="border-t dark:border-gray-700">
                      <td className="px-4 py-2">{p.paymentNo}</td>
                      <td className="px-4 py-2">{new Date(p.paymentDate).toLocaleDateString()}</td>
                      <td className="px-4 py-2">{p.paidTo}</td>
                      <td className="px-4 py-2 text-right">{formatMoney(p.amount)}</td>
                      <td className="px-4 py-2">
                        <span className="px-2 py-1 rounded text-xs bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        
        case 'unpaidCharges':
          return (
            <div className="overflow-auto max-h-96">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-100 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-2 text-left">Charge No</th>
                    <th className="px-4 py-2 text-left">Order No</th>
                    <th className="px-4 py-2 text-left">Date</th>
                    <th className="px-4 py-2 text-right">Total</th>
                    <th className="px-4 py-2 text-right">Paid</th>
                    <th className="px-4 py-2 text-right">Remaining</th>
                  </tr>
                </thead>
                <tbody>
                  {detailData.unpaidCharges.map((c: any) => (
                    <tr key={c.id} className="border-t dark:border-gray-700">
                      <td className="px-4 py-2">{c.chargeNo}</td>
                      <td className="px-4 py-2">{c.orderNo}</td>
                      <td className="px-4 py-2">{new Date(c.chargeDate).toLocaleDateString()}</td>
                      <td className="px-4 py-2 text-right">{formatMoney(c.totalAmount)}</td>
                      <td className="px-4 py-2 text-right text-green-600 dark:text-green-400">{formatMoney(c.paidAmount)}</td>
                      <td className="px-4 py-2 text-right text-red-600 dark:text-red-400 font-semibold">{formatMoney(c.remainingAmount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        
        case 'receipts':
          return (
            <div className="overflow-auto max-h-96">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-100 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-2 text-left">Receipt No</th>
                    <th className="px-4 py-2 text-left">Date</th>
                    <th className="px-4 py-2 text-left">Received From</th>
                    <th className="px-4 py-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {detailData.receipts.map((r: any) => (
                    <tr key={r.id} className="border-t dark:border-gray-700">
                      <td className="px-4 py-2">{r.receiptNo}</td>
                      <td className="px-4 py-2">{new Date(r.receiptDate).toLocaleDateString()}</td>
                      <td className="px-4 py-2">{r.receivedFrom}</td>
                      <td className="px-4 py-2 text-right">{formatMoney(r.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        
        case 'accountsDue':
          return (
            <div className="overflow-auto max-h-96">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-100 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-2 text-left">Account</th>
                    <th className="px-4 py-2 text-right">Fixed Amount</th>
                    <th className="px-4 py-2 text-right">Paid</th>
                    <th className="px-4 py-2 text-right">Due</th>
                    <th className="px-4 py-2 text-left">Due Date</th>
                  </tr>
                </thead>
                <tbody>
                  {accountsWithDue.map((a: any) => {
                    const fixed = parseNum(a.fixedAmount);
                    const paid = parseNum(a.paid);
                    const due = fixed - paid;
                    const dueDate = parseDueDate(a);
                    return (
                      <tr key={a.id} className="border-t dark:border-gray-700">
                        <td className="px-4 py-2">{a.description}</td>
                        <td className="px-4 py-2 text-right">{formatMoney(fixed)}</td>
                        <td className="px-4 py-2 text-right text-green-600 dark:text-green-400">{formatMoney(paid)}</td>
                        <td className="px-4 py-2 text-right text-red-600 dark:text-red-400 font-semibold">{formatMoney(due)}</td>
                        <td className="px-4 py-2">{dueDate ? dueDate.toLocaleDateString() : '-'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          );
        
        default:
          return <div>No details available</div>;
      }
    };

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={() => setSelectedCard(null)}>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[80vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {cards.find(c => c.detailKey === selectedCard)?.title} - Details
            </h3>
            <button
              onClick={() => setSelectedCard(null)}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="p-4">
            {getDetailContent()}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="pb-4 grid rounded bg-white mt-20 h-[100vh] overflow-y-auto gap-5 dark:bg-[#1a2a22] p-4">
      {renderDetailModal()}
      
      {/* Overdue Notifications Banner */}
      {overdueItems.length > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 rounded-lg shadow-md">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-semibold text-red-800 dark:text-red-200">
                ⚠️ {overdueItems.length} Overdue {overdueItems.length === 1 ? 'Item' : 'Items'} Require Attention
              </h3>
              <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {overdueItems.slice(0, 5).map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-white dark:bg-gray-800 p-2 rounded">
                      <div className="flex-1">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold mr-2 ${
                          item.severity === 'critical' ? 'bg-red-600 text-white' :
                          item.severity === 'high' ? 'bg-orange-500 text-white' :
                          'bg-yellow-500 text-white'
                        }`}>
                          {item.daysOverdue} days overdue
                        </span>
                        <span className="font-medium">{item.title}</span>
                        <span className="text-xs text-gray-600 dark:text-gray-400 ml-2">
                          {item.description}
                        </span>
                      </div>
                      <div className="text-right ml-4">
                        <div className="font-semibold text-red-600 dark:text-red-400">
                          {formatMoney(item.amount)}
                        </div>
                        <div className="text-xs text-gray-500">
                          Due: {item.dueDate.toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {overdueItems.length > 5 && (
                  <div className="mt-2 text-xs text-center text-red-600 dark:text-red-400">
                    + {overdueItems.length - 5} more overdue items
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
        {cards.map((card) => (
          <div
            key={card.title}
            onClick={() => setSelectedCard(card.detailKey)}
            className="relative overflow-hidden rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 dark:border-gray-700 dark:bg-[#15251d] cursor-pointer"
          >
            <div className={`absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r ${card.accent}`} />
            <div className="flex items-start justify-between">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-200">{card.title}</h4>
              <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                {card.tag}
              </span>
            </div>
            <div className="mt-4 text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
              {card.value}
            </div>
            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">{card.subtitle}</div>
            <div className="mt-3 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              Click to view details →
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-[#15251d]">
        <div className="text-gray-900 dark:text-white">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-200">In-progress Bookings</h4>
            <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
              Monitor
            </span>
          </div>
          <div className="mt-2 text-3xl font-extrabold tracking-tight">{inProgressBookings.length}</div>
          <div className="mt-3">
            {loadingBookings ? (
              <div className="text-xs text-gray-500 dark:text-gray-400">Loading bookings...</div>
            ) : inProgressBookings.length === 0 ? (
              <div className="text-xs text-gray-500 dark:text-gray-400">No active bookings</div>
            ) : (
              <div className="overflow-auto max-h-56">
                <table className="min-w-full text-sm text-left text-gray-700 dark:text-gray-100">
                  <thead>
                    <tr>
                      <th className="px-2 py-2 text-xs font-semibold">Order No</th>
                      <th className="px-2 py-2 text-xs font-semibold">Current Stage</th>
                      <th className="px-2 py-2 text-xs font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inProgressBookings.map((b) => (
                      <tr key={b.id} className="border-t border-gray-200 dark:border-gray-700">
                        <td className="px-2 py-2 text-xs">{b.orderNo || b.id}</td>
                        <td className="px-2 py-2 text-xs">{b.currentStage}</td>
                        <td className="px-2 py-2 text-xs">
                          <a
                            href={`/bookingorder?orderNo=${encodeURIComponent(b.orderNo || b.id)}`}
                            className="font-medium text-emerald-700 hover:underline dark:text-emerald-300"
                          >
                            Open
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* Bookings Trend Graph */}
        <div className="p-4 bg-white rounded-md shadow-md dark:bg-[#1a2a22]">
          <div className="mb-3">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Bookings Trend</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Number of booking orders created per month (Last 6 months)</p>
          </div>
          <DeliveryGraph
            labels={metrics.monthLabels}
            title=""
            datasets={[
              {
                label: 'Orders',
                data: metrics.bookingsByMonth,
                borderColor: '#1a5f3a',
                backgroundColor: 'rgba(26, 95, 58, 0.2)',
                pointBackgroundColor: '#d4a017',
                pointBorderColor: '#d4a017',
                fill: true,
              },
            ]}
          />
        </div>

        {/* Receipts vs Payments Graph */}
        <div className="p-4 bg-white rounded-md shadow-md dark:bg-[#1a2a22]">
          <div className="mb-3">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Cash Flow Analysis</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <span className="text-green-600 dark:text-green-400 font-medium">Receipts</span> (money received) vs{' '}
              <span className="text-amber-600 dark:text-amber-400 font-medium">Payments</span> (money paid out)
            </p>
          </div>
          <FuelUsageGraph
            labels={metrics.monthLabels}
            title=""
            datasets={[
              {
                label: 'Receipts (In)',
                data: metrics.receiptsByMonth,
                backgroundColor: 'rgba(26, 95, 58, 0.75)',
                borderColor: '#1a5f3a',
              },
              {
                label: 'Payments (Out)',
                data: metrics.paymentsByMonth,
                backgroundColor: 'rgba(212, 160, 23, 0.75)',
                borderColor: '#d4a017',
              },
            ]}
          />
        </div>

        {/* Charges vs Remaining Graph */}
        <div className="p-4 bg-white rounded-md shadow-md dark:bg-[#1a2a22]">
          <div className="mb-3">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Payment Status</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <span className="text-green-600 dark:text-green-400 font-medium">Approved Charges</span> vs{' '}
              <span className="text-amber-600 dark:text-amber-400 font-medium">Unpaid Balance</span> per month
            </p>
          </div>
          <MaintenanceGraph
            labels={metrics.monthLabels}
            title=""
            datasets={[
              {
                label: 'Approved Charges',
                data: metrics.chargesByMonth,
                borderColor: '#1a5f3a',
                backgroundColor: 'rgba(26, 95, 58, 0.15)',
                fill: false,
              },
              {
                label: 'Payment Remaining',
                data: metrics.remainingByMonth,
                borderColor: '#d4a017',
                backgroundColor: 'rgba(212, 160, 23, 0.15)',
                fill: false,
              },
            ]}
          />
        </div>

        {/* New: Payment Completion Rate Graph */}
        <div className="p-4 bg-white rounded-md shadow-md dark:bg-[#1a2a22]">
          <div className="mb-3">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Payment Completion Rate</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Percentage of charges paid each month (Higher is better)
            </p>
          </div>
          <MaintenanceGraph
            labels={metrics.monthLabels}
            title=""
            datasets={[
              {
                label: 'Payment Rate (%)',
                data: metrics.chargesByMonth.map((charge, idx) => {
                  const payment = metrics.paymentsByMonth[idx] || 0;
                  return charge > 0 ? Math.round((payment / charge) * 100) : 0;
                }),
                borderColor: '#10b981',
                backgroundColor: 'rgba(16, 185, 129, 0.2)',
                fill: true,
              },
            ]}
          />
        </div>
      </div>

      {accountWithDue && (
        <div className="max-w-7xl mx-auto w-full p-4">
          <div className="bg-white dark:bg-gray-800 rounded-md shadow-md p-4 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold">Next Due Account</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{accountWithDue.description}</p>
            <p className="text-sm text-gray-700 dark:text-gray-200 mt-1">
              Due Amount:{' '}
              {formatMoney(
                parseNum((accountWithDue as any).fixedAmount) - parseNum((accountWithDue as any).paid)
              )}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {earliestDueDate
                ? `Earliest due date: ${earliestDueDate.toLocaleDateString()}`
                : 'No due date set'}
            </p>
          </div>
        </div>
      )}

      {(loadingAccounts || loadingDashboard) && (
        <div className="text-center text-xs text-gray-500 dark:text-gray-400 pb-4">
          Refreshing dashboard data...
        </div>
      )}
    </div>
  );
};

export default ABLDashboardlayout;
