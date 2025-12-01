'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { getAllEntryVoucher } from '@/apis/entryvoucher';
import { getAllAblAssests } from '@/apis/ablAssests';
import { getAllAblRevenue } from '@/apis/ablRevenue';
import { getAllAblLiabilities } from '@/apis/ablliabilities';
import { getAllAblExpense } from '@/apis/ablExpense';
import { getAllEquality } from '@/apis/equality';
import { toast } from 'react-toastify';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { FiSearch } from 'react-icons/fi';
import MainLayout from '@/components/MainLayout/MainLayout';

// Extend jsPDF
declare module 'jspdf' {
  interface jsPDF {
    getNumberOfPages(): number;
  }
}

// Types
interface VoucherDetailRow {
  account1: string;
  debit1?: number;
  credit1?: number;
  projectedBalance1?: number;
  narration?: string;
  account2: string;
  debit2?: number;
  credit2?: number;
  projectedBalance2?: number;
}

interface VoucherItem {
  id?: string;
  voucherNo?: string;
  voucherDate?: string;
  referenceNo?: string;
  chequeNo?: string;
  depositSlipNo?: string;
  paymentMode?: string;
  bankName?: string;
  chequeDate?: string;
  paidTo?: string;
  narration?: string;
  description?: string;
  status?: string;
  voucherDetails?: VoucherDetailRow[];
}

type Account = {
  id: string;
  listid: string;
  description: string;
  parentAccountId: string | null;
  children: Account[];
};

// Hierarchy helpers
const buildHierarchy = (accounts: Account[]): Account[] => {
  const map: Record<string, Account> = {};
  accounts.forEach((a) => (map[a.id] = { ...a, children: [] }));
  const roots: Account[] = [];
  accounts.forEach((a) => {
    if (a.parentAccountId === null) roots.push(map[a.id]);
    else map[a.parentAccountId]?.children.push(map[a.id]);
  });
  return roots;
};

const findAccountById = (id: string, accounts: Account[]): Account | null => {
  for (const node of accounts) {
    if (node.id === id) return node;
    if (node.children?.length) {
      const found = findAccountById(id, node.children);
      if (found) return found;
    }
  }
  return null;
};

const flattenAccounts = (roots: Account[]): Record<string, { id: string; listid: string; description: string }> => {
  const out: Record<string, any> = {};
  const walk = (n: Account) => {
    out[n.id] = { id: n.id, listid: n.listid || n.id, description: n.description || n.id };
    n.children?.forEach(walk);
  };
  roots.forEach(walk);
  return out;
};

const collectDescendantIds = (node: Account | null): Set<string> => {
  const ids = new Set<string>();
  const walk = (n: Account | null) => {
    if (!n) return;
    ids.add(n.id);
    n.children?.forEach(walk);
  };
  walk(node);
  return ids;
};

// Hierarchical Dropdown (unchanged - perfect as is)
const HierarchicalDropdown: React.FC<{
  accounts: Account[];
  name: string;
  onSelect: (id: string, account: Account | null) => void;
}> = ({ accounts, name, onSelect }) => {
  const [selectionPath, setSelectionPath] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearchList, setShowSearchList] = useState(false);

  const flatLeaves = useMemo(() => {
    const leaves: { id: string; label: string; pathIds: string[] }[] = [];
    const walk = (node: Account, path: string[], pathIds: string[]) => {
      const newPath = [...path, node.description];
      const newPathIds = [...pathIds, node.id];
      if (!node.children || node.children.length === 0) {
        leaves.push({ id: node.id, label: newPath.join(' / '), pathIds: newPathIds });
      } else {
        node.children.forEach((c) => walk(c, newPath, newPathIds));
      }
    };
    accounts.forEach((r) => walk(r, [], []));
    return leaves;
  }, [accounts]);

  const filtered = useMemo(() => {
    if (!searchTerm.trim()) return [];
    return flatLeaves
      .filter((l) => l.label.toLowerCase().includes(searchTerm.trim().toLowerCase()))
      .slice(0, 12);
  }, [flatLeaves, searchTerm]);

  const handlePick = (leaf: any) => {
    setSelectionPath(leaf.pathIds);
    const acc = findAccountById(leaf.id, accounts);
    onSelect(leaf.id, acc);
    setSearchTerm('');
    setShowSearchList(false);
  };

  const getOptionsAtLevel = (level: number): Account[] => {
    let nodes = accounts;
    for (let i = 0; i < level; i++) {
      const sel = selectionPath[i];
      const found = nodes.find((a) => a.id === sel);
      nodes = found?.children || [];
    }
    return nodes;
  };

  const selectionLabels = selectionPath.map((id, i) => {
    const opts = getOptionsAtLevel(i);
    return opts.find((a) => a.id === id)?.description || id;
  });

  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setShowSearchList(true);
          }}
          onFocus={() => setShowSearchList(true)}
          placeholder={`Search ${name.toLowerCase()}...`}
          className="w-full pl-9 pr-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm"
        />
        {showSearchList && filtered.length > 0 && (
          <div className="absolute z-20 mt-1 w-full max-h-60 overflow-auto rounded-md border bg-white dark:bg-gray-800 shadow-lg">
            {filtered.map((leaf) => (
              <button
                key={leaf.id}
                type="button"
                onClick={() => handlePick(leaf)}
                className="block w-full text-left px-3 py-2 text-sm hover:bg-blue-50 dark:hover:bg-gray-700"
              >
                {leaf.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        {Array.from({ length: selectionPath.length + 1 }).map((_, level) => {
          const options = getOptionsAtLevel(level);
          const selected = selectionPath[level] || '';
          return (
            <select
              key={level}
              value={selected}
              onChange={(e) => {
                const newPath = selectionPath.slice(0, level);
                if (e.target.value) newPath.push(e.target.value);
                setSelectionPath(newPath);
                if (e.target.value) {
                  const acc = findAccountById(e.target.value, accounts);
                  onSelect(e.target.value, acc);
                }
              }}
              className="min-w-[200px] px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm"
            >
              <option value="">Select...</option>
              {options.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.description}
                </option>
              ))}
            </select>
          );
        })}
      </div>

      {selectionLabels.length > 0 && (
        <div className="text-xs text-gray-600 dark:text-gray-400">
          Selected: {selectionLabels.join(' → ')}
        </div>
      )}
    </div>
  );
};

// Export Constants
const COMPANY_NAME = 'AL-NASAR BASHEER LOGISTICS';
const COMPANY_ADDRESS = 'Suit No. 108, S.P Chamber, 1st Floor, Plot No B-9/B-1 Near Habib Bank Chowrangi, S.I.T.E, Karachi, Pakistan';

const formatAmount = (v: number) => v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const formatAmountZeroBlank = (v: number, type?: 'Debit' | 'Credit') => {
  if (Math.abs(v) < 0.001) return '';
  return type === 'Credit' ? formatAmount(Math.abs(v)) : formatAmount(v);
};

type GroupedRow = {
  accountId: string;
  description: string;
  listid: string;
  closingBalance: number;
  balanceType: 'Debit' | 'Credit' | undefined;
};

const exportGroupedToPDF = (title: string, branch: string, filter: string, groups: GroupedRow[], debitTotal: number, creditTotal: number) => {
  const doc = new jsPDF();
  let y = 20;
  doc.setFont('helvetica', 'bold').setFontSize(18).setTextColor(0, 0, 128);
  doc.text(COMPANY_NAME.toUpperCase(), 105, y, { align: 'center' });
  doc.setLineWidth(0.4).setDrawColor(0, 0, 128).line(50, y + 2, 160, y + 2);
  y += 10;
  doc.setFontSize(12).text('TRIAL BALANCE', 105, y, { align: 'center' });
  y += 8;
  doc.setFontSize(10).setFont('helvetica', 'normal').setTextColor(0);
  doc.text(title, 105, y, { align: 'center' });
  y += 5;
  doc.text(`Branch: ${branch}`, 105, y, { align: 'center' });
  if (filter) { y += 5; doc.text(filter, 105, y, { align: 'center' }); }
  y += 10;

  const body = groups.map((g, i) => [
    `${i + 1}`,
    `${g.description} (${g.listid})`,
    g.balanceType === 'Debit' ? formatAmountZeroBlank(g.closingBalance) : '',
    g.balanceType === 'Credit' ? formatAmountZeroBlank(g.closingBalance) : '',
  ]);
  body.push(['-', 'Total', formatAmountZeroBlank(debitTotal), formatAmountZeroBlank(creditTotal)]);

  autoTable(doc, {
    startY: y,
    head: [['S.No', 'Account Name', 'Debit', 'Credit']],
    body,
    theme: 'grid',
    headStyles: { fillColor: [219, 234, 254], textColor: [0, 0, 128], fontStyle: 'bold' },
    footStyles: { fillColor: [219, 234, 254], textColor: [0, 0, 128], fontStyle: 'bold' },
    columnStyles: { 0: { halign: 'center' }, 2: { halign: 'right' }, 3: { halign: 'right' } },
  });

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8).text(COMPANY_ADDRESS, 105, doc.internal.pageSize.height - 10, { align: 'center' });
    doc.text(`Page ${i} of ${pageCount}`, 190, doc.internal.pageSize.height - 10, { align: 'right' });
  }

  doc.save(`Trial-Balance-${new Date().toISOString().slice(0, 10)}.pdf`);
};

// Excel & Word exports (unchanged logic, just updated data)
const exportGroupedToExcel = (title: string, branch: string, filter: string, groups: GroupedRow[], debitTotal: number, creditTotal: number) => {
  const wb = XLSX.utils.book_new();
  const data = [
    [COMPANY_NAME], [`Branch: ${branch}`], [filter || ''], [title], [],
    ['S.No', 'Account Name', 'Debit', 'Credit'],
    ...groups.map((g, i) => [
      i + 1,
      `${g.description} (${g.listid})`,
      g.balanceType === 'Debit' ? g.closingBalance : 0,
      g.balanceType === 'Credit' ? Math.abs(g.closingBalance) : 0,
    ]),
    ['-', 'Total', debitTotal, Math.abs(creditTotal)],
  ];
  const ws = XLSX.utils.aoa_to_sheet(data);
  ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 3 } }];
  ws['!cols'] = [{ wch: 10 }, { wch: 50 }, { wch: 18 }, { wch: 18 }];
  XLSX.utils.book_append_sheet(wb, ws, 'Trial Balance');
  XLSX.writeFile(wb, `Trial-Balance-${new Date().toISOString().slice(0, 10)}.xlsx`);
};

// Main Component
const TrialBalancePage: React.FC = () => {
  const [branch, setBranch] = useState('Head Office Karachi');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [status, setStatus] = useState('All');
  const [filterType, setFilterType] = useState<'byHead' | 'range' | 'specific'>('byHead');
  const [showZeroBalance, setShowZeroBalance] = useState(false);
  const [loading, setLoading] = useState(false);

  const [topLevelAccounts, setTopLevelAccounts] = useState<Account[]>([]);
  const accountIndex = useMemo(() => flattenAccounts(topLevelAccounts), [topLevelAccounts]);

  const [headAccountId, setHeadAccountId] = useState('');
  const [rangeFromId, setRangeFromId] = useState('');
  const [rangeToId, setRangeToId] = useState('');
  const [specific1Id, setSpecific1Id] = useState('');
  const [specific2Id, setSpecific2Id] = useState('');

  const [groups, setGroups] = useState<GroupedRow[]>([]);
  const [debitTotal, setDebitTotal] = useState(0);
  const [creditTotal, setCreditTotal] = useState(0);

  // Load Chart of Accounts
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [a, r, l, e, eq] = await Promise.all([
          getAllAblAssests(1, 10000).catch(() => ({ data: [] })),
          getAllAblRevenue(1, 10000).catch(() => ({ data: [] })),
          getAllAblLiabilities(1, 10000).catch(() => ({ data: [] })),
          getAllAblExpense(1, 10000).catch(() => ({ data: [] })),
          getAllEquality(1, 10000).catch(() => ({ data: [] })),
        ]);

        const roots: Account[] = [
          { id: 'assets', listid: '1', description: 'Assets', parentAccountId: null, children: buildHierarchy(a.data) },
          { id: 'liabilities', listid: '2', description: 'Liabilities', parentAccountId: null, children: buildHierarchy(l.data) },
          { id: 'equities', listid: '3', description: 'Equity', parentAccountId: null, children: buildHierarchy(eq.data) },
          { id: 'revenues', listid: '4', description: 'Revenue', parentAccountId: null, children: buildHierarchy(r.data) },
          { id: 'expenses', listid: '5', description: 'Expenses', parentAccountId: null, children: buildHierarchy(e.data) },
        ];
        setTopLevelAccounts(roots);
      } catch (err) {
        toast.error('Failed to load chart of accounts');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const runReport = async () => {
    setLoading(true);
    try {
      // Fetch all vouchers
      let all: VoucherItem[] = [];
      let page = 1;
      while (true) {
        const res: any = await getAllEntryVoucher(page++, 100, {});
        all.push(...(res?.data || []));
        if (!res?.misc?.totalPages || page > res.misc.totalPages) break;
      }

      // Date & status filter
      const from = fromDate ? new Date(fromDate) : null;
      const to = toDate ? new Date(toDate) : null;
      const inDateRange = (d: string) => {
        if (!d) return true;
        const dt = new Date(d);
        if (from && dt < from) return false;
        if (to) { const t = new Date(to); t.setHours(23, 59, 59); if (dt > t) return false; }
        return true;
      };

      const filtered = all.filter(v => inDateRange(v.voucherDate!) && (!status || status === 'All' || v.status === status));

      // Determine selected account IDs
      let selectedIds = new Set<string>();
      if (filterType === 'byHead' && headAccountId) {
        const node = findAccountById(headAccountId, topLevelAccounts);
        collectDescendantIds(node).forEach(id => selectedIds.add(id));
      } else if (filterType === 'range' && rangeFromId && rangeToId) {
        const fromCode = accountIndex[rangeFromId]?.listid || '';
        const toCode = accountIndex[rangeToId]?.listid || '';
        const [min, max] = fromCode < toCode ? [fromCode, toCode] : [toCode, fromCode];
        Object.keys(accountIndex).forEach(id => {
          const code = accountIndex[id].listid;
          if (code >= min && code <= max) selectedIds.add(id);
        });
      } else if (filterType === 'specific') {
        if (specific1Id) selectedIds.add(specific1Id);
        if (specific2Id) selectedIds.add(specific2Id);
      }

      // Running balance map: accountId → balance
      const balanceMap: Record<string, number> = {};

      filtered.forEach(v => {
        v.voucherDetails?.forEach(row => {
          const process = (accId: string, debit?: number, credit?: number) => {
            if (!accId) return;
            if (selectedIds.size > 0 && !selectedIds.has(accId)) return;
            if (!balanceMap[accId]) balanceMap[accId] = 0;
            balanceMap[accId] += (debit || 0) - (credit || 0);
          };
          process(row.account1, row.debit1, row.credit1);
          process(row.account2, row.debit2, row.credit2);
        });
      });

      // Build final groups
      const result: GroupedRow[] = Object.entries(balanceMap)
        .map(([id, balance]) => {
          const info = accountIndex[id] || { description: id, listid: id };
          const abs = Math.abs(balance);
          if (!showZeroBalance && abs < 0.01) return null;
          return {
            accountId: id,
            description: info.description,
            listid: info.listid,
            closingBalance: balance,
            balanceType: balance > 0 ? 'Debit' : balance < 0 ? 'Credit' : undefined,
          };
        })
        .filter(Boolean)
        .sort((a, b) => (a!.listid || '').localeCompare(b!.listid || '')) as GroupedRow[];

      const debits = result.reduce((s, g) => s + (g.balanceType === 'Debit' ? g.closingBalance : 0), 0);
      const credits = result.reduce((s, g) => s + (g.balanceType === 'Credit' ? Math.abs(g.closingBalance) : 0), 0);

      setGroups(result);
      setDebitTotal(debits);
      setCreditTotal(credits);
      if (result.length === 0) toast.info('No non-zero balances found');
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const titleLine = `Trial Balance${fromDate || toDate ? ` From ${fromDate || '...'} To ${toDate || '...'}` : ' (All Dates)'}`;
  const filterSummary = [status !== 'All' ? `Status: ${status}` : '', 
    filterType === 'byHead' && headAccountId ? `Head: ${accountIndex[headAccountId]?.description}` : '',
    filterType === 'range' ? `Range: ${rangeFromId && accountIndex[rangeFromId]?.description} → ${rangeToId && accountIndex[rangeToId]?.description}` : '',
    filterType === 'specific' ? `Accounts: ${[specific1Id, specific2Id].filter(Boolean).map(id => accountIndex[id]?.description).join(' & ')}` : '',
  ].filter(Boolean).join(' | ') || 'All Accounts';

  const clearAll = () => {
    setFromDate(''); setToDate(''); setStatus('All'); setBranch('Head Office Karachi');
    setHeadAccountId(''); setRangeFromId(''); setRangeToId(''); setSpecific1Id(''); setSpecific2Id('');
    setGroups([]); setDebitTotal(0); setCreditTotal(0);
  };

  return (
    <MainLayout activeInterface="ABL">
      <div className="p-4 bg-gray-50 dark:bg-gray-900 min-h-screen">
        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-blue-200 dark:border-blue-800 p-5 mb-5">
          <h1 className="text-2xl font-bold text-blue-900 dark:text-blue-200 mb-4">Trial Balance</h1>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <input placeholder="Branch" value={branch} onChange={e => setBranch(e.target.value)} className="px-3 py-2 border rounded-md" />
            <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="px-3 py-2 border rounded-md" />
            <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="px-3 py-2 border rounded-md" />
            <select value={status} onChange={e => setStatus(e.target.value)} className="px-3 py-2 border rounded-md">
              <option>All</option><option>Active</option><option>Created</option><option>Approved</option>
            </select>
          </div>

          <div className="space-y-4">
            <select value={filterType} onChange={e => setFilterType(e.target.value as any)} className="px-3 py-2 border rounded-md">
              <option value="byHead">By Head (All Sub-Accounts)</option>
              <option value="range">Range (From → To)</option>
              <option value="specific">Specific Two Accounts</option>
            </select>

            {filterType === 'byHead' && <HierarchicalDropdown accounts={topLevelAccounts} name="Head" onSelect={id => setHeadAccountId(id)} />}
            {filterType === 'range' && (
              <div className="flex gap-4">
                <HierarchicalDropdown accounts={topLevelAccounts} name="From" onSelect={id => setRangeFromId(id)} />
                <HierarchicalDropdown accounts={topLevelAccounts} name="To" onSelect={id => setRangeToId(id)} />
              </div>
            )}
            {filterType === 'specific' && (
              <div className="flex gap-4">
                <HierarchicalDropdown accounts={topLevelAccounts} name="Account 1" onSelect={id => setSpecific1Id(id)} />
                <HierarchicalDropdown accounts={topLevelAccounts} name="Account 2" onSelect={id => setSpecific2Id(id)} />
              </div>
            )}
          </div>

          <div className="flex items-center gap-4 mt-4">
            <label><input type="checkbox" checked={showZeroBalance} onChange={e => setShowZeroBalance(e.target.checked)} /> Show Zero Balances</label>
            <Button onClick={clearAll} variant="outline">Clear All</Button>
            <Button onClick={runReport} className="bg-blue-600 text-white">Run Report</Button>
          </div>
        </div>

        {/* Export Buttons */}
        {groups.length > 0 && (
          <div className="flex gap-3 mb-4">
            <Button onClick={() => exportGroupedToPDF(titleLine, branch, filterSummary, groups, debitTotal, creditTotal)}>Export PDF</Button>
            <Button onClick={() => exportGroupedToExcel(titleLine, branch, filterSummary, groups, debitTotal, creditTotal)}>Export Excel</Button>
          </div>
        )}

        {/* Result Table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden">
          <div className="bg-blue-100 dark:bg-blue-900 px-4 py-3">
            <h2 className="font-bold text-blue-900 dark:text-blue-200">{titleLine}</h2>
            <p className="text-sm">{filterSummary}</p>
          </div>

          {loading ? (
            <div className="p-10 text-center">Loading...</div>
          ) : groups.length === 0 ? (
            <div className="p-10 text-center text-gray-500">No data to display</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-blue-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left">S.No</th>
                    <th className="px-4 py-3 text-left">Account</th>
                    <th className="px-4 py-3 text-right">Debit</th>
                    <th className="px-4 py-3 text-right">Credit</th>
                  </tr>
                </thead>
                <tbody>
                  {groups.map((g, i) => (
                    <tr key={g.accountId} className={i % 2 === 0 ? 'bg-gray-50 dark:bg-gray-800' : ''}>
                      <td className="px-4 py-2">{i + 1}</td>
                      <td className="px-4 py-2">{g.description} ({g.listid})</td>
                      <td className="px-4 py-2 text-right">{g.balanceType === 'Debit' ? formatAmount(g.closingBalance) : ''}</td>
                      <td className="px-4 py-2 text-right">{g.balanceType === 'Credit' ? formatAmount(Math.abs(g.closingBalance)) : ''}</td>
                    </tr>
                  ))}
                  <tr className="font-bold bg-blue-100 dark:bg-blue-900">
                    <td colSpan={2} className="px-4 py-3 text-right">Total</td>
                    <td className="px-4 py-3 text-right">{formatAmount(debitTotal)}</td>
                    <td className="px-4 py-3 text-right">{formatAmount(creditTotal)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default TrialBalancePage;