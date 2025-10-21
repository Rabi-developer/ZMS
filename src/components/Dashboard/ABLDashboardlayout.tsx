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

// Minimal Account shape used here
type Account = {
  id: string;
  description: string;
  parentAccountId: string | null;
  children: Account[];
  fixedAmount?: string;
  paid?: string;
};

const ABLDashboardlayout = () => {
  const pathname = usePathname() || '';
  const [topAccounts, setTopAccounts] = useState<Account[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [inProgressBookings, setInProgressBookings] = useState<any[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);

  // Determine if current route is bookingorder create/start
  const isBookingOrderStart = (() => {
    const p = pathname.toLowerCase();
    if (!p) return false;
    if (p.includes('/bookingorder/create')) return true;
    if (p.includes('/bookingorder/edit')) return true;
    if (p === '/bookingorder' || p.startsWith('/bookingorder?')) return true;
    return false;
  })();

  // Fetch accounts
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

      const topLevel = [
        { id: 'assets', description: 'Assets', parentAccountId: null, children: buildHierarchy(assetsRes.data || []) },
        { id: 'revenues', description: 'Revenues', parentAccountId: null, children: buildHierarchy(revenuesRes.data || []) },
        { id: 'liabilities', description: 'Liabilities', parentAccountId: null, children: buildHierarchy(liabilitiesRes.data || []) },
        { id: 'expenses', description: 'Expenses', parentAccountId: null, children: buildHierarchy(expensesRes.data || []) },
        { id: 'equities', description: 'Equities', parentAccountId: null, children: buildHierarchy(equitiesRes.data || []) },
      ];

      setTopAccounts(topLevel as Account[]);
    } catch (e) {
      console.warn('Failed to load accounts for dashboard', e);
    } finally {
      setLoadingAccounts(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch bookings and determine which are not fully completed
  useEffect(() => {
    let mounted = true;
    const run = async () => {
      setLoadingBookings(true);
      try {
        const res = await getAllBookingOrder(1, 200);
        const list = res?.data || [];
        const candidates = list.slice(0, 50);
        const results: any[] = [];
        await Promise.all(
          candidates.map(async (b: any) => {
            try {
              const orderNo = b.orderNo || b.OrderNo || '';
              const consRes = await getConsignmentsForBookingOrder(b.id || orderNo, 1, 200).catch(() => ({ data: [] }));
              const consignments = consRes.data || [];

              const chargesRes = await getAllCharges(1, 200).catch(() => ({ data: [] }));
              const chargesList = (chargesRes.data || []).filter((c: any) => ((c.orderNo || c.OrderNo || '') === orderNo));
              const chargesCount = chargesList.length;

              const receiptsRes = await getAllReceipt(1, 500).catch(() => ({ data: [] }));
              const allReceipts = receiptsRes.data || [];
              const biltyKeys = new Set((consignments || []).flatMap((c: any) => [c.biltyNo, c.BiltyNo, c.consignmentNo, c.ConsignmentNo, c.id]).filter(Boolean));
              const recs = allReceipts.filter((r: any) => {
                const topOrder = r.orderNo ?? r.OrderNo ?? '';
                const topBilty = r.biltyNo ?? r.BiltyNo ?? '';
                const matchOrder = topOrder && topOrder === orderNo;
                const matchBilty = topBilty && biltyKeys.has(topBilty);
                return matchOrder || matchBilty;
              });
              const receiptsTotalReceived = recs.reduce((sum: number, r: any) => sum + Number(r.receiptAmount ?? r.receivedAmount ?? r.totalAmount ?? 0), 0);

              const paymentsRes = await getAllPaymentABL(1, 500).catch(() => ({ data: [] }));
              const allPayments = paymentsRes.data || [];
              const payments = allPayments.filter((p: any) => {
                const items = Array.isArray(p.items) ? p.items : [];
                const topOrder = p.orderNo ?? p.OrderNo ?? '';
                const matchOrder = (topOrder && topOrder === orderNo) || items.some((it: any) => ((it.orderNo ?? it.OrderNo ?? '') === orderNo));
                const matchBilty = biltyKeys.size > 0 && items.some((it: any) => {
                  const b = it.biltyNo ?? it.BiltyNo ?? it.consignmentNo ?? it.ConsignmentNo ?? it.id;
                  return b && biltyKeys.has(b);
                });
                return matchOrder || matchBilty;
              });
              const paymentsCompletedCount = payments.filter((p: any) => (p.status || '').toLowerCase() === 'completed').length;

              const consignmentCount = consignments.length;
              const allConsDelivered = consignments.length > 0 && consignments.every((c: any) => (c.status || '').toLowerCase() === 'delivered');

              const bookingCompleted = true;
              const consignmentCompleted = consignmentCount > 0;
              const chargesCompleted = chargesCount > 0;
              const receiptCompleted = receiptsTotalReceived > 0;
              const paymentCompleted = paymentsCompletedCount > 0;

              const steps = [
                { key: 'booking', label: 'Booking', completed: bookingCompleted },
                { key: 'consignment', label: 'Consignment', completed: consignmentCompleted },
                { key: 'charges', label: 'Charges', completed: chargesCompleted },
                { key: 'receipt', label: 'Receipt', completed: receiptCompleted },
                { key: 'payment', label: 'Payment', completed: paymentCompleted },
              ];

              const firstNotDone = steps.find((s) => !s.completed);
              const completedAll = !firstNotDone;

              if (!completedAll) {
                results.push({ id: b.id, orderNo, booking: b, steps, currentStage: firstNotDone?.label || 'In Progress' });
              }
            } catch (e) {
              // ignore per-booking errors
            }
          })
        );
        if (mounted) setInProgressBookings(results);
      } catch (e) {
        console.warn('Failed to fetch booking progress', e);
      } finally {
        if (mounted) setLoadingBookings(false);
      }
    };
    run();
    return () => { mounted = false; };
  }, []);

  // Find the first account with due > 0
  const accountWithDue = (() => {
    const flatten = (nodes: Account[]): Account[] => nodes.flatMap((n) => [n, ...flatten(n.children || [])]);
    const all = flatten(topAccounts);
    for (const a of all) {
      const fixed = parseFloat((a as any).fixedAmount || '0') || 0;
      const paid = parseFloat((a as any).paid || '0') || 0;
      if (fixed - paid > 0) return a;
    }
    return null;
  })();

  // Total due across all accounts
  const totalDue = (() => {
    const flatten = (nodes: Account[]): Account[] => nodes.flatMap((n) => [n, ...flatten(n.children || [])]);
    const all = flatten(topAccounts);
    return all.reduce((sum, a) => {
      const fixed = parseFloat((a as any).fixedAmount || '0') || 0;
      const paid = parseFloat((a as any).paid || '0') || 0;
      return sum + Math.max(0, fixed - paid);
    }, 0);
  })();

  // Flattened list of accounts with due amounts
  const accountsWithDue = (() => {
    const flatten = (nodes: Account[]): Account[] => nodes.flatMap((n) => [n, ...flatten(n.children || [])]);
    const all = flatten(topAccounts);
    return all.filter((a) => {
      const fixed = parseFloat((a as any).fixedAmount || '0') || 0;
      const paid = parseFloat((a as any).paid || '0') || 0;
      return fixed - paid > 0;
    });
  })();

  // Parse due date
  const parseDueDate = (a: Account): Date | null => {
    const d = (a as any).dueDate || (a as any).due_date || (a as any).duedate || (a as any).due || '';
    if (!d) return null;
    const parsed = new Date(d);
    return isNaN(parsed.getTime()) ? null : parsed;
  };

  const earliestDueDate = (() => {
    const dates = accountsWithDue.map(parseDueDate).filter((d): d is Date => !!d);
    if (dates.length === 0) return null;
    return new Date(Math.min(...dates.map((d) => d.getTime())));
  })();

  // Booking order start page
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
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">ID: {(accountWithDue as any).id}</p>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">Name: {accountWithDue.description}</p>
              <p className="text-sm text-gray-700 dark:text-gray-200 mt-1">Due Amount: {(parseFloat((accountWithDue as any).fixedAmount || '0') - parseFloat((accountWithDue as any).paid || '0')).toLocaleString()}</p>
              {parseDueDate(accountWithDue) ? (
                <p className="text-xs text-gray-500 mt-1">Due Date: {parseDueDate(accountWithDue)?.toLocaleDateString()}</p>
              ) : null}
              <p className="text-xs text-gray-400 mt-2">To manage this account open Liabilities or Equality from the side menu.</p>
            </div>
          </div>
        )}
        <div className="max-w-7xl mx-auto w-full p-4">
          <OrderProgress orderNo={new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '').get('orderNo') || ''} />
        </div>
      </div>
    );
  }

  return (
    <div className="pb-4 grid rounded bg-white mt-20 h-[100vh] overflow-y-auto gap-5 dark:bg-[#1a2a22]">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Accounts Due card */}
        <div className="p-4 bg-[#1a5f3a] rounded-md border-2 border-[#d4a017] shadow-md dark:bg-[#2a7f4a]">
          <div className="text-white">
            <h4 className="text-sm font-medium">Accounts Due</h4>
            <div className="mt-2">
              <div className="text-2xl font-bold">{accountsWithDue.length}</div>
              {earliestDueDate ? (
                <div className="text-xs mt-1">Next Due: {earliestDueDate.toLocaleDateString()}</div>
              ) : (
                <div className="text-xs mt-1">No due dates available</div>
              )}
              <div className="mt-3">
                {accountsWithDue.length === 0 && (
                  <div className="text-xs text-gray-200">No accounts with due amounts</div>
                )}
                {accountsWithDue.length > 0 && (
                  <div className="mt-2 overflow-auto max-h-56">
                    <table className="min-w-full text-sm text-left text-white">
                      <thead>
                        <tr>
                          <th className="px-2 py-2 text-xs font-medium">ID</th>
                          <th className="px-2 py-2 text-xs font-medium">Name</th>
                          <th className="px-2 py-2 text-xs font-medium">Due Amount</th>
                          <th className="px-2 py-2 text-xs font-medium">Due Date</th>
                          <th className="px-2 py-2 text-xs font-medium">Notes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {accountsWithDue.map((a) => {
                          const fixed = parseFloat((a as any).fixedAmount || '0') || 0;
                          const paid =  parseFloat((a as any).paid || '0') || 0;
                          const due = fixed - paid;
                          const dueDate = parseDueDate(a);
                          const accountUrl = `/chart-of-accounts/view?id=${encodeURIComponent((a as any).id)}`;
                          return (
                            <tr key={a.id} className="border-t border-white/20">
                              <td className="px-2 py-2 align-top text-xs">
                                <a href={accountUrl} className="text-white hover:underline">{(a as any).id}</a>
                              </td>
                              <td className="px-2 py-2 align-top font-medium">
                                <a href={accountUrl} className="text-white hover:underline">{a.description || (a as any).name || '—'}</a>
                              </td>
                              <td className="px-2 py-2 align-top font-semibold">{due.toLocaleString()}</td>
                              <td className="px-2 py-2 align-top text-xs">{dueDate ? dueDate.toLocaleDateString() : '—'}</td>
                              <td className="px-2 py-2 align-top text-xs text-gray-200 truncate max-w-[220px]">{(a as any).notes || (a as any).description || '—'}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* In-progress Bookings card with scrollable table */}
        <div className="p-4 bg-[#1a5f3a] rounded-md border-2 border-[#d4a017] shadow-md dark:bg-[#2a7f4a]">
          <div className="text-white">
            <h4 className="text-sm font-medium">In-progress Bookings</h4>
            <div className="mt-2">
              <div className="text-2xl font-bold">{inProgressBookings.length}</div>
              <div className="mt-3">
                {loadingBookings ? (
                  <div className="text-xs text-gray-200">Loading bookings…</div>
                ) : inProgressBookings.length === 0 ? (
                  <div className="text-xs text-gray-200">No active bookings</div>
                ) : (
                  <div className="overflow-auto max-h-56">
                    <table className="min-w-full text-sm text-left text-white">
                      <thead>
                        <tr>
                          <th className="px-2 py-2 text-xs font-medium">Order No</th>
                          <th className="px-2 py-2 text-xs font-medium">Current Stage</th>
                          <th className="px-2 py-2 text-xs font-medium">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {inProgressBookings.map((b) => (
                          <tr key={b.id} className="border-t border-white/20">
                            <td className="px-2 py-2 text-xs">{b.orderNo || b.id}</td>
                            <td className="px-2 py-2 text-xs">{b.currentStage}</td>
                            <td className="px-2 py-2 text-xs">
                              <a
                                href={`/bookingorder?orderNo=${encodeURIComponent(b.orderNo || b.id)}`}
                                className="text-white hover:underline"
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
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <div className="p-4 bg-white rounded-md shadow-md dark:bg-[#1a2a22]">
          <DeliveryGraph />
        </div>
        <div className="p-4 bg-white rounded-md shadow-md dark:bg-[#1a2a22]">
          <FuelUsageGraph />
        </div>
        <div className="p-4 bg-white rounded-md shadow-md dark:bg-[#1a2a22]">
          <MaintenanceGraph />
        </div>
      </div>
      {accountWithDue && (
        <div className="max-w-7xl mx-auto w-full p-4">
          <div  className="bg-white dark:bg-gray-800 rounded-md shadow-md p-4 border border-gray-200 dark:border-gray-700"
          >
            <h3 className="text-lg font-semibold">Account with Due</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">{accountWithDue.description}</p>
            <p className="text-sm text-gray-700 dark:text-gray-200 mt-1">
              Due Amount:{' '}
              {(parseFloat((accountWithDue as any).fixedAmount || '0') - parseFloat((accountWithDue as any).paid || '0')).toLocaleString()}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};


export default ABLDashboardlayout;