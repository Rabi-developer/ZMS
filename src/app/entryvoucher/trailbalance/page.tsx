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

// Extend jsPDF type to include getNumberOfPages method
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
  voucherDate?: string; // YYYY-MM-DD
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

// Account tree
type Account = {
  id: string;
  listid: string;
  description: string;
  parentAccountId: string | null;
  children: Account[];
};

// Build hierarchy from flat list
const buildHierarchy = (accounts: Account[]): Account[] => {
  const map: Record<string, Account> = {};
  accounts.forEach((account) => {
    map[account.id] = { ...account, children: [] } as Account;
  });
  const roots: Account[] = [];
  accounts.forEach((acc) => {
    if (acc.parentAccountId === null) {
      roots.push(map[acc.id]);
    } else {
      const p = map[acc.parentAccountId];
      if (p) p.children.push(map[acc.id]);
    }
  });
  return roots;
};

// Find node by id
const findAccountById = (id: string, accounts: Account[]): Account | null => {
  const walk = (nodes: Account[]): Account | null => {
    for (const node of nodes) {
      if (node.id === id) return node;
      if (node.children?.length) {
        const f = walk(node.children);
        if (f) return f;
      }
    }
    return null;
  };
  return walk(accounts);
};

// Flatten to index id -> {id, listid, description}
const flattenAccounts = (roots: Account[]): Record<string, { id: string; listid: string; description: string }> => {
  const out: Record<string, { id: string; listid: string; description: string }> = {};
  const walk = (n: Account) => {
    out[n.id] = { id: n.id, listid: n.listid || n.id, description: n.description || n.id };
    (n.children || []).forEach(walk);
  };
  roots.forEach(walk);
  return out;
};

// Collect all descendant ids for By Head filter
const collectDescendantIds = (node: Account | null): Set<string> => {
  const ids = new Set<string>();
  const walk = (n: Account | null) => {
    if (!n) return;
    ids.add(n.id);
    (n.children || []).forEach(walk);
  };
  walk(node);
  return ids;
};

// Hierarchical account selector
interface HierarchicalDropdownProps {
  accounts: Account[];
  name: string;
  onSelect: (id: string, account: Account | null) => void;
}

const HierarchicalDropdown: React.FC<HierarchicalDropdownProps> = ({ accounts, name, onSelect }) => {
  const [selectionPath, setSelectionPath] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearchList, setShowSearchList] = useState(false);

  type FlatLeaf = { id: string; label: string; pathIds: string[]; pathLabels: string[] };
  const flatLeaves: FlatLeaf[] = useMemo(() => {
    const leaves: FlatLeaf[] = [];
    const walk = (node: Account, ids: string[], labels: string[]) => {
      const nids = [...ids, node.id];
      const nlabs = [...labels, node.description];
      if (!node.children || node.children.length === 0) {
        leaves.push({ id: node.id, label: nlabs.join(' / '), pathIds: nids, pathLabels: nlabs });
      } else {
        node.children.forEach((c) => walk(c, nids, nlabs));
      }
    };
    accounts.forEach((r) => walk(r, [], []));
    return leaves;
  }, [accounts]);

  const filteredLeaves = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return [] as FlatLeaf[];
    return flatLeaves.filter((l) => l.label.toLowerCase().includes(q)).slice(0, 12);
  }, [flatLeaves, searchTerm]);

  const getOptionsAtLevel = (level: number): Account[] => {
    if (level === 0) return accounts;
    let current = accounts;
    for (let i = 0; i < level; i++) {
      const selId = selectionPath[i];
      const found = current.find((acc) => acc.id === selId);
      if (!found) return [];
      current = found.children || [];
    }
    return current;
  };

  const handleSelect = (level: number, id: string) => {
    const newPath = selectionPath.slice(0, level);
    newPath.push(id);
    setSelectionPath(newPath);
    let current = accounts;
    let selected: Account | null = null;
    for (const sel of newPath) {
      const f = current.find((a) => a.id === sel);
      if (f) {
        selected = f;
        current = f.children || [];
      }
    }
    onSelect(id, selected);
  };

  const handlePickFromSearch = (leaf: FlatLeaf) => {
    setSelectionPath(leaf.pathIds);
    const selected = findAccountById(leaf.id, accounts);
    onSelect(leaf.id, selected);
    setSearchTerm('');
    setShowSearchList(false);
  };

  const selectionLabels = selectionPath.map((id, idx) => {
    const opts = getOptionsAtLevel(idx);
    const f = opts.find((a) => a.id === id);
    return f?.description || id;
  });

  let showLevels = selectionPath.length + 1;
  if (selectionPath.length > 0) {
    const nextOpts = getOptionsAtLevel(selectionPath.length);
    if (nextOpts.length === 0) showLevels = selectionPath.length;
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setShowSearchList(true);
              }}
              onFocus={() => setShowSearchList(true)}
              placeholder={`Search account (${name})`}
              className="w-full pl-9 pr-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition"
            />
            {showSearchList && searchTerm && filteredLeaves.length > 0 && (
              <div className="absolute z-20 mt-1 w-full max-h-60 overflow-auto rounded-md border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-lg">
                {filteredLeaves.map((leaf) => (
                  <button
                    key={leaf.id}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handlePickFromSearch(leaf)}
                    className="block w-full text-left px-3 py-2 text-sm hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-gray-700"
                  >
                    {leaf.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-row flex-wrap gap-3 overflow-x-auto py-1">
        {Array.from({ length: showLevels }).map((_, level) => {
          const options = getOptionsAtLevel(level);
          const selected = selectionPath[level] || '';
          return (
            <div key={level} className="min-w-[220px]">
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
                {level === 0 ? name : `${name} Sub-Account ${level}`}
              </label>
              <select
                value={selected}
                onChange={(e) => handleSelect(level, e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 shadow-sm"
              >
                <option value="">Select {level === 0 ? name : 'Sub-Account'}</option>
                {options.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.description}
                  </option>
                ))}
              </select>
            </div>
          );
        })}
      </div>

      {selectionLabels.length > 0 && (
        <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
          <span className="font-medium">Selected:</span>
          <div className="flex flex-wrap items-center gap-1">
            {selectionLabels.map((label, idx) => (
              <React.Fragment key={label + idx}>
                <span className="px-2 py-0.5 rounded-full border border-blue-200 text-blue-700 bg-blue-50 dark:bg-gray-700 dark:text-blue-300">
                  {label}
                </span>
                {idx < selectionLabels.length - 1 && <span className="text-gray-400">/</span>}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Export helpers
const COMPANY_NAME = 'AL-NASAR BASHEER LOGISTICS';
const COMPANY_ADDRESS = 'Suit No. 108, S.P Chamber, 1st Floor, Plot No B-9/B-1 Near Habib Bank Chowrangi, S.I.T.E, Karachi, Pakistan';
const COMPANY_COLOR = { r: 0, g: 0, b: 128 }; // Navy Blue
const BG_BLUE_100 = { r: 219, g: 234, b: 254 }; // Tailwind bg-blue-100

type GroupedRows = Array<{
  accountId: string;
  description: string;
  listid: string;
  rows: any[];
  totals: {
    credit1: number;
    debit1: number;
    pb1: number;
    balanceType: 'Debit' | 'Credit' | undefined;
  };
}>;

// Format amounts, preserving negative signs for Debit, absolute for Credit
const formatAmount = (value: number) => {
  return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

// Format amounts, returning empty string for zero, absolute for Credit
const formatAmountZeroBlank = (value: number, balanceType?: 'Debit' | 'Credit' | undefined) => {
  if (value === 0) return '';
  const displayValue = balanceType === 'Credit' ? Math.abs(value) : value;
  return formatAmount(displayValue);
};

function exportGroupedToPDF(titleLine: string, branch: string, filterLine: string, groups: GroupedRows, debitTotal: number, creditTotal: number) {
  const doc = new jsPDF();
  let y = 20;

  // Header
  const companyText = (COMPANY_NAME || '').toUpperCase();
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(COMPANY_COLOR.r, COMPANY_COLOR.g, COMPANY_COLOR.b);
  doc.text(companyText, 105, y, { align: 'center' });
  const cw = doc.getTextWidth(companyText);
  doc.setDrawColor(COMPANY_COLOR.r, COMPANY_COLOR.g, COMPANY_COLOR.b);
  doc.setLineWidth(0.4);
  doc.line(105 - cw / 2, y + 1.5, 105 + cw / 2, y + 1.5);
  y += 7;

  // TRIAL BALANCE heading
  doc.setFontSize(11);
  doc.setTextColor(COMPANY_COLOR.r, COMPANY_COLOR.g, COMPANY_COLOR.b);
  const headingText = 'TRIAL BALANCE';
  doc.text(headingText, 105, y, { align: 'center' });
  y += 4;

  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);
  doc.text(titleLine.replace('Trial Balance ', ''), 105, y, { align: 'center' });
  y += 4;
  doc.text(`Branch: ${branch}`, 105, y, { align: 'center' });
  if (filterLine) {
    y += 4;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(filterLine, 105, y, { align: 'center' });
  }
  y += 8;

  // Single table for all accounts
  const body = [
    ...groups.map((g, idx) => [
      `${idx + 1}`,
      `${g.description} (${g.listid})`,
      g.totals.balanceType === 'Debit' ? formatAmountZeroBlank(g.totals.pb1 || 0, 'Debit') : '',
      g.totals.balanceType === 'Credit' ? formatAmountZeroBlank(g.totals.pb1 || 0, 'Credit') : '',
    ]),
    ['-', 'Total', formatAmountZeroBlank(debitTotal, 'Debit'), formatAmountZeroBlank(creditTotal, 'Credit')],
  ];

  autoTable(doc, {
    startY: y,
    head: [['Serial No', 'Description', 'Debit Balance', 'Credit Balance']],
    body,
    headStyles: {
      fillColor: [BG_BLUE_100.r, BG_BLUE_100.g, BG_BLUE_100.b],
      textColor: [COMPANY_COLOR.r, COMPANY_COLOR.g, COMPANY_COLOR.b],
      fontStyle: 'bold',
      fontSize: 8,
      cellPadding: 2,
    },
    bodyStyles: {
      fontSize: 7,
      textColor: [0, 0, 0],
      cellPadding: 2,
      fillColor: [255, 255, 255],
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
    footStyles: {
      fillColor: [BG_BLUE_100.r, BG_BLUE_100.g, BG_BLUE_100.b],
      textColor: [COMPANY_COLOR.r, COMPANY_COLOR.g, COMPANY_COLOR.b],
      fontStyle: 'bold',
      fontSize: 8,
      cellPadding: 2,
    },
    theme: 'grid',
    margin: { left: 12, right: 15 },
    columnStyles: {
      0: { cellWidth: 20, halign: 'center' },
      1: { cellWidth: 90 },
      2: { halign: 'right', cellWidth: 40 },
      3: { halign: 'right', cellWidth: 40 },
    },
    didParseCell: (data) => {
      if (data.row.index === body.length - 1 && data.section === 'body') {
        data.cell.styles.fillColor = [BG_BLUE_100.r, BG_BLUE_100.g, BG_BLUE_100.b];
        data.cell.styles.textColor = [COMPANY_COLOR.r, COMPANY_COLOR.g, COMPANY_COLOR.b];
        data.cell.styles.fontStyle = 'bold';
      }
    },
  });

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const addressLines = doc.splitTextToSize(COMPANY_ADDRESS, pageWidth - 20);
    const addrY = pageHeight - 10 - (addressLines.length - 1) * 4;
    doc.text(addressLines, pageWidth / 2, addrY, { align: 'center' });
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - 10, pageHeight - 6, { align: 'right' });
  }

  const fname = `Trial-Balance-${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(fname);
}

function exportGroupedToExcel(titleLine: string, branch: string, filterLine: string, groups: GroupedRows, debitTotal: number, creditTotal: number) {
  const wb = XLSX.utils.book_new();
  const wsData: any[][] = [];
  wsData.push([COMPANY_NAME]);
  wsData.push([`Branch: ${branch}`]);
  if (filterLine) wsData.push([filterLine]);
  wsData.push([titleLine.replace('Trial Balance', 'Trial Balance')]);
  wsData.push([]);
  wsData.push(['Serial No', 'Description', 'Debit Balance', 'Credit Balance']);
  groups.forEach((g, idx) => {
    wsData.push([
      idx + 1,
      `${g.description} (${g.listid})`,
      g.totals.balanceType === 'Debit' ? (g.totals.pb1 || 0) : 0,
      g.totals.balanceType === 'Credit' ? Math.abs(g.totals.pb1 || 0) : 0,
    ]);
  });
  wsData.push(['-', 'Total', debitTotal, Math.abs(creditTotal)]);

  const ws = XLSX.utils.aoa_to_sheet(wsData);

  (ws as any)['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 3 } },
  ];
  let mergeIdx = 2;
  if (filterLine) {
    (ws as any)['!merges'].push({ s: { r: 2, c: 0 }, e: { r: 2, c: 3 } });
    mergeIdx++;
  }
  (ws as any)['!merges'].push({ s: { r: mergeIdx, c: 0 }, e: { r: mergeIdx, c: 3 } });

  (ws as any)['!cols'] = [
    { wch: 10 }, // Serial No
    { wch: 50 }, // Description
    { wch: 15 }, // Debit Balance
    { wch: 15 }, // Credit Balance
  ];

  const firstDataRow = filterLine ? 6 : 5;
  const ref = (ws as XLSX.WorkSheet)['!ref'] as string | undefined;
  const endRow = ref ? XLSX.utils.decode_range(ref).e.r : 0;
  for (let R = firstDataRow; R <= endRow; R++) {
    const c1 = XLSX.utils.encode_cell({ r: R, c: 2 });
    if (ws[c1] && typeof ws[c1].v === 'number') { ws[c1].t = 'n'; (ws[c1] as any).z = '#,##0.00'; }
    const c2 = XLSX.utils.encode_cell({ r: R, c: 3 });
    if (ws[c2] && typeof ws[c2].v === 'number') { ws[c2].t = 'n'; (ws[c2] as any).z = '#,##0.00'; }
  }

  XLSX.utils.book_append_sheet(wb, ws, 'Trial Balance');
  const fname = `Trial-Balance-${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, fname);
}

function exportGroupedToWord(titleLine: string, branch: string, filterLine: string, groups: GroupedRows, debitTotal: number, creditTotal: number) {
  const css = `table{border-collapse:collapse;width:100%;max-width:800px;margin:0 auto}th,td{border:1px solid #555;padding:5px;font-size:10px}th:nth-child(1),td:nth-child(1){text-align:center;width:10%}th:nth-child(2),td:nth-child(2){text-align:left;width:50%}th:nth-child(3),td:nth-child(3),th:nth-child(4),td:nth-child(4){text-align:right;width:20%}`;
  const header = `<h2 style="text-align:center;margin:4px 0;color:#000080">${COMPANY_NAME}</h2><div style="text-align:center">Branch: ${branch}</div>${filterLine ? `<div style="text-align:center;margin:2px 0;font-size:10px">${filterLine}</div>` : ''}<h3 style="text-align:center;margin:6px 0;background-color:#dbeafe;color:#000080;padding:3px">TRIAL BALANCE</h3>`;
  const tableHead = `<tr><th style="background-color:#dbeafe;color:#000080">Serial No</th><th style="background-color:#dbeafe;color:#000080">Description</th><th style="background-color:#dbeafe;color:#000080">Debit Balance</th><th style="background-color:#dbeafe;color:#000080">Credit Balance</th></tr>`;
  const rows = groups.map((g, idx) => `<tr style="background-color:${idx % 2 === 0 ? '#fff' : '#e6e6ff'}"><td>${idx + 1}</td><td>${g.description} (${g.listid})</td><td>${g.totals.balanceType === 'Debit' ? formatAmountZeroBlank(g.totals.pb1 || 0, 'Debit') : ''}</td><td>${g.totals.balanceType === 'Credit' ? formatAmountZeroBlank(g.totals.pb1 || 0, 'Credit') : ''}</td></tr>`).join('');
  const totalRow = `<tr style="background-color:#dbeafe;color:#000080;font-weight:bold"><td>-</td><td>Total</td><td>${formatAmountZeroBlank(debitTotal, 'Debit')}</td><td>${formatAmountZeroBlank(creditTotal, 'Credit')}</td></tr>`;
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8" /><style>${css}</style></head><body>${header}<hr style="border-color:#000080"/><table>${tableHead}${rows}${totalRow}</table></body></html>`;
  const blob = new Blob([html], { type: 'application/msword' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Trial-Balance-${new Date().toISOString().slice(0, 10)}.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Page Component
const TrialBalancePage: React.FC = () => {
  // Filters
  const [branch, setBranch] = useState<string>('Head Office Karachi');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [status, setStatus] = useState<string>('All');
  const [filterType, setFilterType] = useState<'byHead' | 'range' | 'specific'>('byHead');
  const [loading, setLoading] = useState<boolean>(false);

  // Accounts
  const [topLevelAccounts, setTopLevelAccounts] = useState<Account[]>([]);
  const accountIndex = useMemo(() => flattenAccounts(topLevelAccounts), [topLevelAccounts]);

  // Filter selections
  const [headAccountId, setHeadAccountId] = useState<string>('');
  const [rangeFromId, setRangeFromId] = useState<string>('');
  const [rangeToId, setRangeToId] = useState<string>('');
  const [specific1Id, setSpecific1Id] = useState<string>('');
  const [specific2Id, setSpecific2Id] = useState<string>('');

  // Grouped data and totals
  const [groups, setGroups] = useState<GroupedRows>([]);
  const [debitTotal, setDebitTotal] = useState<number>(0);
  const [creditTotal, setCreditTotal] = useState<number>(0);

  // Load chart of accounts
  useEffect(() => {
    const fetchAccounts = async () => {
      setLoading(true);
      try {
        const [assetsRes, revenuesRes, liabilitiesRes, expensesRes, equitiesRes] = await Promise.all([
          getAllAblAssests(1, 10000).catch(() => ({ data: [] })),
          getAllAblRevenue(1, 10000).catch(() => ({ data: [] })),
          getAllAblLiabilities(1, 10000).catch(() => ({ data: [] })),
          getAllAblExpense(1, 10000).catch(() => ({ data: [] })),
          getAllEquality(1, 10000).catch(() => ({ data: [] })),
        ]);
        const top: Account[] = [
          { id: 'assets', listid: 'assets', description: 'Assets', parentAccountId: null, children: buildHierarchy(assetsRes.data || []) },
          { id: 'revenues', listid: 'revenues', description: 'Revenues', parentAccountId: null, children: buildHierarchy(revenuesRes.data || []) },
          { id: 'liabilities', listid: 'liabilities', description: 'Liabilities', parentAccountId: null, children: buildHierarchy(liabilitiesRes.data || []) },
          { id: 'expenses', listid: 'expenses', description: 'Expenses', parentAccountId: null, children: buildHierarchy(expensesRes.data || []) },
          { id: 'equities', listid: 'equities', description: 'Equities', parentAccountId: null, children: buildHierarchy(equitiesRes.data || []) },
        ];
        setTopLevelAccounts(top);
      } catch (e) {
        toast.error('Failed to load chart of accounts');
      } finally {
        setLoading(false);
      }
    };
    fetchAccounts();
  }, []);

  // Fetch vouchers and build ledger
  const runReport = async () => {
    try {
      setLoading(true);
      const all: VoucherItem[] = [];
      let pageIndex = 1;
      let totalPages = 1;
      do {
        const res: any = await getAllEntryVoucher(pageIndex, 100, {});
        const data: VoucherItem[] = res?.data || [];
        all.push(...data);
        totalPages = res?.misc?.totalPages || 1;
        pageIndex += 1;
      } while (pageIndex <= totalPages);

      // Filter by date
      const normalize = (s?: string) => (s ?? '').trim().toLowerCase();
      const from = fromDate ? new Date(fromDate) : null;
      const to = toDate ? new Date(toDate) : null;
      const withinDate = (d?: string) => {
        if (!d) return true;
        const dt = new Date(d);
        if (isNaN(dt.getTime())) return true;
        if (from && dt < from) return false;
        if (to) {
          const tt = new Date(to);
          tt.setHours(23, 59, 59, 999);
          if (dt > tt) return false;
        }
        return true;
      };
      const matchesStatus = (s?: string) => {
        if (!status || status === 'All') return true;
        return (s || '').toLowerCase() === status.toLowerCase();
      };

      // Compute previous balance
      const prevMap: Record<string, { date: number; pb: number; lastEntry?: any; lastType: 'Debit' | 'Credit' | undefined }> = {};
      if (from) {
        all.forEach((v) => {
          const d = v.voucherDate ? new Date(v.voucherDate) : null;
          if (!d || isNaN(d.getTime())) return;
          if (!matchesStatus(v.status)) return;
          if (d >= from) return;
          (v.voucherDetails || []).forEach((r) => {
            const t = d.getTime();
            const k1 = normalize(r.account1);
            const k2 = normalize(r.account2);
            if (k1) {
              const prev = prevMap[k1] || { date: 0, pb: 0, lastType: undefined };
              if (t > prev.date) {
                const debit = Number(r.debit1 ?? 0);
                const credit = Number(r.credit1 ?? 0);
                const pb = Number(r.projectedBalance1 ?? 0);
                const lastType: 'Debit' | 'Credit' | undefined = pb > 0 ? 'Debit' : pb < 0 ? 'Credit' : undefined;
                const lastEntry = {
                  _idx: -1,
                  voucherDate: '-',
                  voucherNo: '-',
                  chequeNo: '-',
                  depositSlipNo: '-',
                  narration: `Opening Balance (Previous Period)`,
                  debitBalance: pb > 0 ? formatAmountZeroBlank(pb, 'Debit') : '',
                  creditBalance: pb < 0 ? formatAmountZeroBlank(pb, 'Credit') : '',
                  pb1Num: pb,
                  balanceType: lastType,
                };
                prevMap[k1] = { date: t, pb, lastEntry, lastType };
              }
            }
            if (k2) {
              const prev = prevMap[k2] || { date: 0, pb: 0, lastType: undefined };
              if (t > prev.date) {
                const debit = Number(r.debit2 ?? 0);
                const credit = Number(r.credit2 ?? 0);
                const pb = Number(r.projectedBalance2 ?? 0);
                const lastType: 'Debit' | 'Credit' | undefined = pb > 0 ? 'Debit' : pb < 0 ? 'Credit' : undefined;
                const lastEntry = {
                  _idx: -1,
                  voucherDate: '-',
                  voucherNo: '-',
                  chequeNo: '-',
                  depositSlipNo: '-',
                  narration: `Opening Balance (Previous Period)`,
                  debitBalance: pb > 0 ? formatAmountZeroBlank(pb, 'Debit') : '',
                  creditBalance: pb < 0 ? formatAmountZeroBlank(pb, 'Credit') : '',
                  pb1Num: pb,
                  balanceType: lastType,
                };
                prevMap[k2] = { date: t, pb, lastEntry, lastType };
              }
            }
          });
        });
      }

      // Determine selected account IDs based on mode
      let selectedAccountIds: string[] = [];
      if (filterType === 'byHead') {
        const node = findAccountById(headAccountId, topLevelAccounts);
        const set = collectDescendantIds(node);
        selectedAccountIds = Array.from(set);
      } else if (filterType === 'range') {
        if (rangeFromId && rangeToId) {
          const fromListId = accountIndex[rangeFromId]?.listid || rangeFromId;
          const toListId = accountIndex[rangeToId]?.listid || rangeToId;
          const minCode = fromListId.localeCompare(toListId) < 0 ? fromListId : toListId;
          const maxCode = fromListId.localeCompare(toListId) < 0 ? toListId : fromListId;
          selectedAccountIds = Object.keys(accountIndex).filter((id) => {
            const code = accountIndex[id]?.listid || id;
            return code.localeCompare(minCode) >= 0 && code.localeCompare(maxCode) <= 0;
          });
        } else if (rangeFromId || rangeToId) {
          const onlyId = rangeFromId || rangeToId || '';
          selectedAccountIds = onlyId ? [onlyId] : [];
        }
      } else if (filterType === 'specific') {
        selectedAccountIds = Array.from(new Set([specific1Id, specific2Id].filter(Boolean)));
      }

      const selectedKeys = new Set<string>();
      selectedAccountIds.forEach((id) => {
        if (!id) return;
        selectedKeys.add(normalize(id));
        const info = accountIndex[id];
        if (info) {
          if (info.listid) selectedKeys.add(normalize(info.listid));
          if (info.description) selectedKeys.add(normalize(info.description));
        }
      });

      const filteredVouchers: VoucherItem[] = all.filter((v) => withinDate(v.voucherDate) && matchesStatus(v.status));

      const groupMap: Record<string, { accountId: string; description: string; listid: string; rows: any[]; totals: { credit1: number; debit1: number; pb1: number; balanceType: 'Debit' | 'Credit' | undefined } }> = {};

      const pushRow = (accountId: string, v: VoucherItem, r: VoucherDetailRow) => {
        const accInfo = accountIndex[accountId] || ({ description: accountId, listid: accountId } as any);
        const key = accountId;
        if (!groupMap[key]) {
          groupMap[key] = {
            accountId,
            description: accInfo.description,
            listid: accInfo.listid,
            rows: [],
            totals: { credit1: 0, debit1: 0, pb1: 0, balanceType: undefined as 'Debit' | 'Credit' | undefined },
          };
        }
        let debit: number, credit: number, pb: number;
        if (accountId === r.account1) {
          debit = Number(r.debit1 ?? 0);
          credit = Number(r.credit1 ?? 0);
          pb = Number(r.projectedBalance1 ?? 0);
        } else {
          debit = Number(r.debit2 ?? 0);
          credit = Number(r.credit2 ?? 0);
          pb = Number(r.projectedBalance2 ?? 0);
        }

        groupMap[key].totals.debit1 += debit;
        groupMap[key].totals.credit1 += credit;
        groupMap[key].totals.pb1 = pb;
        groupMap[key].totals.balanceType = pb > 0 ? 'Debit' : pb < 0 ? 'Credit' : undefined;

        groupMap[key].rows = []; // No rows stored
      };

      filteredVouchers.forEach((v) => {
        (v.voucherDetails || []).forEach((r) => {
          const inSel1 = selectedKeys.size === 0 || selectedKeys.has(normalize(r.account1));
          const inSel2 = selectedKeys.size === 0 || selectedKeys.has(normalize(r.account2));
          if (inSel1 && r.account1) pushRow(r.account1, v, r);
          if (inSel2 && r.account2) pushRow(r.account2, v, r);
        });
      });

      Object.keys(prevMap).forEach((key) => {
        if (groupMap[key]) return;
        if (prevMap[key].pb === 0) return;
        if (selectedKeys.size > 0 && !selectedKeys.has(key)) return;
        const accInfo = Object.values(accountIndex).find((info) => normalize(info.id) === key) || { id: key, listid: key, description: key };
        groupMap[key] = {
          accountId: accInfo.id,
          description: accInfo.description,
          listid: accInfo.listid,
          rows: [],
          totals: { credit1: 0, debit1: 0, pb1: prevMap[key].pb, balanceType: prevMap[key].lastType },
        };
        if (prevMap[key].lastEntry) {
          groupMap[key].rows = [];
        }
      });

      const EPS = 1e-6;
      const grouped: GroupedRows = Object.values(groupMap)
        .filter((g) => Number.isFinite(g.totals.pb1) && Math.abs(g.totals.pb1 || 0) > EPS)
        .map((g) => {
          const periodDebit = 0;
          const periodCredit = 0;
          const closing = Number(g.totals.pb1 || 0);
          const closingType: 'Debit' | 'Credit' | undefined = closing > 0 ? 'Debit' : closing < 0 ? 'Credit' : undefined;
          return {
            ...g,
            rows: [],
            totals: { debit1: periodDebit, credit1: periodCredit, pb1: closing, balanceType: closingType },
          };
        })
        .sort((a, b) => (a.listid || a.description).localeCompare(b.listid || b.description));

      // Calculate totals
      const debitTotal = grouped.reduce((sum, g) => sum + (g.totals.balanceType === 'Debit' ? g.totals.pb1 : 0), 0);
      const creditTotal = grouped.reduce((sum, g) => sum + (g.totals.balanceType === 'Credit' ? Math.abs(g.totals.pb1) : 0), 0);

      setGroups(grouped);
      setDebitTotal(debitTotal);
      setCreditTotal(creditTotal);
      if (grouped.length === 0) toast.info('No accounts matched filters or all balances are zero');
    } catch (e) {
      console.error(e);
      toast.error('Failed to load vouchers');
    } finally {
      setLoading(false);
    }
  };

  const titleLine = useMemo(() => {
    const f = fromDate ? new Date(fromDate).toLocaleDateString('en-GB').split('/').join('-') : '-';
    const t = toDate ? new Date(toDate).toLocaleDateString('en-GB').split('/').join('-') : '-';
    return `Trial Balance From ${f} To ${t}`;
  }, [fromDate, toDate]);

  const filterSummary = useMemo(() => {
    let statusPart = status && status !== 'All' ? `Status: ${status}` : '';
    let accPart = '';
    if (filterType === 'byHead' && headAccountId) accPart = `Filter: By Head (${accountIndex[headAccountId]?.description || headAccountId})`;
    if (filterType === 'range' && (rangeFromId || rangeToId)) accPart = `Filter: Range (${accountIndex[rangeFromId]?.description || rangeFromId || '-'} to ${accountIndex[rangeToId]?.description || rangeToId || '-'})`;
    if (filterType === 'specific' && (specific1Id || specific2Id)) accPart = `Filter: Specific (${accountIndex[specific1Id]?.description || specific1Id || '-'} & ${accountIndex[specific2Id]?.description || specific2Id || '-'})`;
    return [statusPart, accPart].filter(Boolean).join(', ');
  }, [status, filterType, headAccountId, rangeFromId, rangeToId, specific1Id, specific2Id, accountIndex]);

  const clearFilters = () => {
    setBranch('Head Office Karachi');
    setFromDate('');
    setToDate('');
    setStatus('All');
    setFilterType('byHead');
    setHeadAccountId('');
    setRangeFromId('');
    setRangeToId('');
    setSpecific1Id('');
    setSpecific2Id('');
    setGroups([]);
    setDebitTotal(0);
    setCreditTotal(0);
  };

  return (
    <MainLayout activeInterface="ABL">
      <div className="p-3 md:p-5 bg-blue-50 dark:bg-gray-900">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border-2 border-blue-200 dark:border-blue-900 mb-4 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 dark:border-blue-900 bg-blue-100 dark:bg-blue-950">
            <h1 className="text-lg font-semibold text-blue-900 dark:text-blue-200">Trial Balance</h1>
            <p className="text-sm font-bold text-blue-700 dark:text-blue-300">{COMPANY_NAME}</p>
          </div>
          <div className="p-4 flex flex-col gap-3">
            <div className="flex flex-col md:flex-row md:items-end gap-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 flex-1">
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-300">Branch</label>
                  <input
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white rounded-md focus:ring-blue-600 focus:border-blue-600"
                    placeholder="Branch name"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-300">From Date</label>
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white rounded-md focus:ring-blue-600 focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-300">To Date</label>
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white rounded-md focus:ring-blue-600 focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-300">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white rounded-md focus:ring-blue-600 focus:border-blue-600"
                  >
                    <option>All</option>
                    <option>Active</option>
                    <option>Inactive</option>
                    <option>Created</option>
                    <option>Approved</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={clearFilters}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-300 px-3 py-2 rounded-md"
                >
                  Clear
                </Button>
                <Button
                  onClick={runReport}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center gap-2"
                >
                  <FiSearch />
                  Run Report
                </Button>
              </div>
            </div>

            <div className="rounded-lg border border-blue-200 dark:border-blue-900 p-3 bg-blue-50 dark:bg-gray-900/30">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-300">Account Filter Type</label>
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value as any)}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white rounded-md focus:ring-blue-600 focus:border-blue-600"
                  >
                    <option value="byHead">By Head (include all sub-accounts)</option>
                    <option value="range">From Account To Account (range by code)</option>
                    <option value="specific">From Which Account and Which Account (specific two)</option>
                  </select>
                </div>

                {filterType === 'byHead' && (
                  <div className="md:col-span-2">
                    <label className="block text-xs text-gray-600 dark:text-gray-300 mb-1">Select Head Account</label>
                    <HierarchicalDropdown
                      accounts={topLevelAccounts}
                      name="Head Account"
                      onSelect={(id) => setHeadAccountId(id)}
                    />
                  </div>
                )}

                {filterType === 'range' && (
                  <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-600 dark:text-gray-300 mb-1">From Account</label>
                      <HierarchicalDropdown
                        accounts={topLevelAccounts}
                        name="From Account"
                        onSelect={(id) => setRangeFromId(id)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 dark:text-gray-300 mb-1">To Account</label>
                      <HierarchicalDropdown
                        accounts={topLevelAccounts}
                        name="To Account"
                        onSelect={(id) => setRangeToId(id)}
                      />
                    </div>
                  </div>
                )}

                {filterType === 'specific' && (
                  <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-600 dark:text-gray-300 mb-1">Account 1</label>
                      <HierarchicalDropdown
                        accounts={topLevelAccounts}
                        name="Account 1"
                        onSelect={(id) => setSpecific1Id(id)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 dark:text-gray-300 mb-1">Account 2</label>
                      <HierarchicalDropdown
                        accounts={topLevelAccounts}
                        name="Account 2"
                        onSelect={(id) => setSpecific2Id(id)}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-3 flex flex-wrap items-center justify-between gap-2 border-t border-blue-200 dark:border-blue-900 mt-3">
                <div className="text-xs text-gray-500 dark:text-gray-400">Tip: Use search inside account pickers to quickly find accounts.</div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => exportGroupedToPDF(titleLine, branch, filterSummary, groups, debitTotal, creditTotal)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md"
                  >
                    Export PDF
                  </Button>
                  <Button
                    onClick={() => exportGroupedToExcel(titleLine, branch, filterSummary, groups, debitTotal, creditTotal)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-md"
                  >
                    Export Excel
                  </Button>
                  <Button
                    onClick={() => exportGroupedToWord(titleLine, branch, filterSummary, groups, debitTotal, creditTotal)}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-md"
                  >
                    Export Word
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow border border-blue-200 dark:border-blue-900">
          <div className="px-4 py-3 flex  justify-between border-b border-gray-200 dark:border-blue-900 bg-blue-100 dark:bg-blue-950">
            <h2 className="text-base font-semibold text-blue-900 dark:text-blue-200">{COMPANY_NAME}</h2>
            <div className="text-xs text-blue-700 dark:text-blue-300">{titleLine}</div>
          </div>
          {loading ? (
            <div className="px-4 py-6 text-center text-blue-600 dark:text-blue-300">Loading...</div>
          ) : groups.length === 0 ? (
            <div className="px-4 py-6 text-center text-gray-500 dark:text-gray-400">No data or all balances are zero</div>
          ) : (
            <div className="p-4">
              <div className="overflow-x-auto">
                <div className="mx-auto">
                  <table className="min-w-full text-sm border-collapse">
                    <thead className="bg-blue-100 dark:bg-blue-950">
                      <tr>
                        <th className="px-4 py-2 text-center text-blue-900 dark:text-blue-200 border border-gray-200 dark:border-blue-900 w-[80px]">
                          Serial No
                        </th>
                        <th className="px-4 py-2 text-left text-blue-900 dark:text-blue-200 border border-gray-200 dark:border-blue-900 w-[400px]">
                          Description
                        </th>
                        <th className="px-4 py-2 text-right text-blue-900 dark:text-blue-200 border border-gray-200 dark:border-blue-900 w-[200px]">
                          Debit Balance
                        </th>
                        <th className="px-4 py-2 text-right text-blue-900 dark:text-blue-200 border border-gray-200 dark:border-blue-900 w-[200px]">
                          Credit Balance
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {groups.map((g, idx) => (
                        <tr
                          key={g.accountId}
                          className={idx % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-blue-50 dark:bg-gray-700/40'}
                        >
                          <td className="px-4 py-2 text-center border border-gray-200 dark:border-blue-900">
                            {idx + 1}
                          </td>
                          <td className="px-4 py-2 border border-gray-200 dark:border-blue-900">
                            {g.description} ({g.listid})
                          </td>
                          <td className="px-4 py-2 text-right border border-gray-200 dark:border-blue-900">
                            {g.totals.balanceType === 'Debit' ? formatAmountZeroBlank(g.totals.pb1 || 0, 'Debit') : ''}
                          </td>
                          <td className="px-4 py-2 text-right border border-gray-200 dark:border-blue-900">
                            {g.totals.balanceType === 'Credit' ? formatAmountZeroBlank(g.totals.pb1 || 0, 'Credit') : ''}
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-blue-100 dark:bg-blue-950 font-bold">
                        <td className="px-4 py-2 text-center text-blue-900 dark:text-blue-200 border border-gray-200 dark:border-blue-900">
                          -
                        </td>
                        <td className="px-4 py-2 text-left text-blue-900 dark:text-blue-200 border border-gray-200 dark:border-blue-900">
                          Total
                        </td>
                        <td className="px-4 py-2 text-right text-blue-900 dark:text-blue-200 border border-gray-200 dark:border-blue-900">
                          {formatAmountZeroBlank(debitTotal, 'Debit')}
                        </td>
                        <td className="px-4 py-2 text-right text-blue-900 dark:text-blue-200 border border-gray-200 dark:border-blue-900">
                          {formatAmountZeroBlank(creditTotal, 'Credit')}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default TrialBalancePage;