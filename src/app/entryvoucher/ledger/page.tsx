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
import { FiSearch, FiFileText } from 'react-icons/fi';
import MainLayout from '@/components/MainLayout/MainLayout';

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

// Hierarchical account selector (compact)
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
    if (selected) {
      onSelect(id, selected);
    } else {
      onSelect('', null);
    }
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
              className="w-full pl-9 pr-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition"
            />
            {showSearchList && searchTerm && filteredLeaves.length > 0 && (
              <div className="absolute z-20 mt-1 w-full max-h-60 overflow-auto rounded-md border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-lg">
                {filteredLeaves.map((leaf) => (
                  <button
                    key={leaf.id}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handlePickFromSearch(leaf)}
                    className="block w-full text-left px-3 py-2 text-sm hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-gray-700"
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
                className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 shadow-sm"
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
                <span className="px-2 py-0.5 rounded-full border border-emerald-200 text-emerald-700 bg-emerald-50 dark:bg-gray-700 dark:text-emerald-300">
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
const COMPANY_COLOR = { r: 128, g: 0, b: 0 }; // Maroon

type GroupedRows = Array<{
  accountId: string;
  description: string;
  listid: string;
  rows: any[];
  totals: {
    credit1: number;
    debit1: number;
    pb1: number;
  };
}>;


function exportGroupedToPDF(titleLine: string, branch: string, filterLine: string, groups: GroupedRows) {
  const doc = new jsPDF();
  let y = 20; 

  // Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(66, 103, 149); // Lighter blue (matching table header color)
  doc.text(COMPANY_NAME, 105, y, { align: 'center' });
  y += 8;
  doc.setFontSize(14);
  doc.setTextColor(66, 103, 149); 
  doc.text('GENERAL LEDGER', 105, y, { align: 'center' });
  y += 6;
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text(titleLine.replace('General Ledger ', ''), 105, y, { align: 'center' });
  y += 6;
  doc.text(`Branch: ${branch}`, 105, y, { align: 'center' });
  if (filterLine) {
    y += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(filterLine, 105, y, { align: 'center' });
  }
  y += 10;

  // Format amounts with parentheses for negative values
  const formatAmount = (value: number) => {
    if (value === 0) return '';
    if (value < 0) return `(${Math.abs(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})`;
    return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  groups.forEach((g, idx) => {
    if (idx > 0) y += 6;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(`${g.description} (${g.listid})`, 12, y);
    y += 4;
    autoTable(doc, {
      startY: y,
      head: [
        [
          'Voucher Date',
          'Voucher No',
          'Cheque No',
          'Deposit Slip No',
          'Narration',
          'Debit ',
          'Credit ',
          'Net Balance',
        ],
      ],
      body: g.rows.map((r) => [
        r.voucherDate,
        r.voucherNo,
        r.chequeNo || '',
        r.depositSlipNo || '',
        r.narration || '',
        formatAmount(r.debit1Num ?? 0),
        formatAmount(r.credit1Num ?? 0),
        formatAmount(r.pb1Num ?? 0),
      ]),
      foot: [
        [
          {
            content: 'TOTAL',
            colSpan: 5,
            styles: { halign: 'right', fontStyle: 'bold' },
          },
          formatAmount(g.totals.debit1 || 0),
          formatAmount(g.totals.credit1 || 0),
          formatAmount(g.totals.pb1 || 0),
        ],
      ],
      headStyles: {
        fillColor: [66, 103, 149], 
        textColor: [255, 255, 255], 
        fontStyle: 'bold',
        fontSize: 8,
        cellPadding: 1.5,
      },
      footStyles: {
        fillColor: [224, 224, 224], 
        textColor: [0, 0, 0], 
        fontStyle: 'bold',
        fontSize: 8,
        cellPadding: 1.5,
      },
      bodyStyles: {
        fontSize: 7,
        textColor: [0, 0, 0], 
        cellPadding: 1.5,
      },
      alternateRowStyles: {
        fillColor: [240, 240, 240], 
      },
      theme: 'grid',
      margin: { left: 8, right: 8 },
      columnStyles: {
        0: { cellWidth: 20 }, 
        1: { cellWidth: 22 }, 
        2: { cellWidth: 22 }, 
        3: { cellWidth: 22 }, 
        4: { cellWidth: 46 }, 
                5: { halign: 'right' }, 
        6: { halign: 'right' }, 
        7: { halign: 'right' }, 
      },
    });
    y = (doc as any).lastAutoTable.finalY + 4;
    if (y > 260 && idx < groups.length - 1) {
      doc.addPage();
      y = 10; 
    }
  });

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const addressLines = doc.splitTextToSize(COMPANY_ADDRESS, pageWidth - 20);
    const addrY = pageHeight - 10 - (addressLines.length - 1) * 4;
    doc.text(addressLines, pageWidth / 2, addrY, { align: 'center' });
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - 10, pageHeight - 6, { align: 'right' });
  }

  const fname = `General-Ledger-${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(fname);
}
function exportGroupedToExcel(titleLine: string, branch: string, filterLine: string, groups: GroupedRows) {
  const wb = XLSX.utils.book_new();
  groups.forEach((g) => {
    const wsData: any[][] = [];
    // Header rows
    wsData.push([COMPANY_NAME]);
    wsData.push([`Branch: ${branch}`]);
    if (filterLine) wsData.push([filterLine]);
    wsData.push([titleLine]);
    wsData.push([`${g.description} (${g.listid})`]);
    wsData.push([]);
    // Table header
    wsData.push(['Voucher Date', 'Voucher No', 'Cheque No', 'Deposit Slip No', 'Narration', 'Debit 1', 'Credit 1', 'Proj Bal 1']);
    // Data rows (use raw numbers for numeric cells)
    g.rows.forEach((r) => {
      wsData.push([
        r.voucherDate,
        r.voucherNo,
        r.chequeNo || '-',
        r.depositSlipNo || '-',
        r.narration || '-',
        r.debit1Num ?? 0,
        r.credit1Num ?? 0,
        r.pb1Num ?? 0,
      ]);
    });
    // Totals row (raw numbers)
    wsData.push([
      'TOTAL', '', '', '', '',
      (g.totals.debit1 || 0),
      (g.totals.credit1 || 0),
      (g.totals.pb1 || 0),
    ]);

    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Merge header cells across 8 columns
    (ws as any)['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 7 } }, // Company Name
      { s: { r: 1, c: 0 }, e: { r: 1, c: 7 } }, // Branch
    ];
    let mergeIdx = 2;
    if (filterLine) {
      (ws as any)['!merges'].push({ s: { r: 2, c: 0 }, e: { r: 2, c: 7 } }); // Filter line
      mergeIdx++;
    }
    (ws as any)['!merges'].push(
      { s: { r: mergeIdx, c: 0 }, e: { r: mergeIdx, c: 7 } }, // Title
      { s: { r: mergeIdx + 1, c: 0 }, e: { r: mergeIdx + 1, c: 7 } } // Group caption
    );

    // Column widths for better readability
    (ws as any)['!cols'] = [
      { wch: 12 }, // Voucher Date
      { wch: 14 }, // Voucher No
      { wch: 14 }, // Cheque No
      { wch: 16 }, // Deposit Slip No
      { wch: 40 }, // Narration
      { wch: 14 }, // Debit 1
      { wch: 14 }, // Credit 1
      { wch: 14 }, // Proj Bal 1
    ];

    // Apply number formats for numeric columns
    const range = XLSX.utils.decode_range(ws['!ref'] as string);
    const firstDataRow = filterLine ? 7 : 6;
    for (let R = firstDataRow; R <= range.e.r; R++) {
      // Debit (col 5)
      const c5 = XLSX.utils.encode_cell({ r: R, c: 5 });
      if (ws[c5] && typeof ws[c5].v === 'number') { ws[c5].t = 'n'; (ws[c5] as any).z = '#,##0.00'; }
      // Credit (col 6)
      const c6 = XLSX.utils.encode_cell({ r: R, c: 6 });
      if (ws[c6] && typeof ws[c6].v === 'number') { ws[c6].t = 'n'; (ws[c6] as any).z = '#,##0.00'; }
      // Proj Bal (col 7)
      const c7 = XLSX.utils.encode_cell({ r: R, c: 7 });
      if (ws[c7] && typeof ws[c7].v === 'number') { ws[c7].t = 'n'; (ws[c7] as any).z = '#,##0.00'; }
    }

    XLSX.utils.book_append_sheet(wb, ws, (g.description || g.listid).slice(0, 25));
  });
  const fname = `General-Ledger-${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, fname);
}

function exportGroupedToWord(titleLine: string, branch: string, filterLine: string, groups: GroupedRows) {
  const css = `table{border-collapse:collapse;width:100%}th,td{border:1px solid #777;padding:4px;font-size:12px;text-align:right}th:nth-child(1),td:nth-child(1),th:nth-child(2),td:nth-child(2),th:nth-child(3),td:nth-child(3),th:nth-child(4),td:nth-child(4),th:nth-child(5),td:nth-child(5){text-align:left}`;
  const header = `<h2 style=\"text-align:center;margin:4px 0;color:#800000\">${COMPANY_NAME}</h2><div style=\"text-align:center\">Branch: ${branch}</div>${filterLine ? `<div style=\"text-align:center;margin:2px 0;font-size:12px\">${filterLine}</div>` : ''}<h3 style=\"text-align:center;margin:6px 0\">${titleLine}</h3>`;
  const tableHead = `<tr><th>Voucher Date</th><th>Voucher No</th><th>Cheque No</th><th>Deposit Slip No</th><th>Narration</th><th>Debit 1</th><th>Credit 1</th><th>Proj Bal 1</th></tr>`;
  const sections = groups.map((g) => {
    const rows = g.rows.map((r) => `<tr><td>${r.voucherDate}</td><td>${r.voucherNo}</td><td>${r.chequeNo || '-'}</td><td>${r.depositSlipNo || '-'}</td><td>${r.narration || '-'}</td><td>${r.debit1}</td><td>${r.credit1}</td><td>${r.pb1}</td></tr>`).join('');
    const totalsRow = `<tr><td colspan="5" style="text-align:right;font-weight:bold">TOTAL</td><td>${(g.totals.debit1 || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td><td>${(g.totals.credit1 || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td><td>${(g.totals.pb1 || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td></tr>`;
    return `<h4 style="margin:10px 0 4px">${g.description} (${g.listid})</h4><table>${tableHead}${rows}${totalsRow}</table>`;
  }).join('<br/>');
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8" /><style>${css}</style></head><body>${header}<hr/>${sections}</body></html>`;
  const blob = new Blob([html], { type: 'application/msword' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `General-Ledger-${new Date().toISOString().slice(0, 10)}.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Page Component
const LedgerPage: React.FC = () => {
  // Filters
  const [branch, setBranch] = useState('Head Office Karachi');
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

  // Grouped data
  const [groups, setGroups] = useState<GroupedRows>([]);

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

  // Fetch vouchers (paginate all) and filter
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

      // Compute previous balance per account before From Date
      const prevMap: Record<string, { date: number; pb: number }> = {};
      if (from) {
        all.forEach((v) => {
          const d = v.voucherDate ? new Date(v.voucherDate) : null;
          if (!d || isNaN(d.getTime())) return;
          if (!matchesStatus(v.status)) return;
          if (d >= from) return;
          (v.voucherDetails || []).forEach((r) => {
            const t = d.getTime();
            const k1 = (r.account1 ?? '').trim().toLowerCase();
            const k2 = (r.account2 ?? '').trim().toLowerCase();
            if (k1) {
              const pb = Number(r.projectedBalance1 ?? 0);
              const prev = prevMap[k1];
              if (!prev || t > prev.date) prevMap[k1] = { date: t, pb };
            }
            if (k2) {
              const pb = Number(r.projectedBalance2 ?? 0);
              const prev = prevMap[k2];
              if (!prev || t > prev.date) prevMap[k2] = { date: t, pb };
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
          const minCode = fromListId < toListId ? fromListId : toListId;
          const maxCode = fromListId < toListId ? toListId : fromListId;
          selectedAccountIds = Object.keys(accountIndex).filter((id) => {
            const code = accountIndex[id]?.listid || id;
            return code >= minCode && code <= maxCode;
          });
        } else if (rangeFromId || rangeToId) {
          const onlyId = rangeFromId || rangeToId;
          selectedAccountIds = onlyId ? [onlyId] : [];
        } else {
          selectedAccountIds = [];
        }
      } else if (filterType === 'specific') {
        selectedAccountIds = Array.from(new Set([specific1Id, specific2Id].filter(Boolean)));
      }

      // Build normalized key set (id, listid, description) for robust matching
      const normalize = (s?: string) => (s ?? '').trim().toLowerCase();
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

      const groupMap: Record<string, { accountId: string; description: string; listid: string; rows: any[]; totals: { credit1: number; debit1: number; pb1: number } }> = {};

      const pushRow = (accountId: string, v: VoucherItem, r: VoucherDetailRow) => {
        const accInfo = accountIndex[accountId] || ({ description: accountId, listid: accountId } as any);
        const key = accountId;
        if (!groupMap[key]) {
          groupMap[key] = {
            accountId,
            description: accInfo.description,
            listid: accInfo.listid,
            rows: [],
            totals: { credit1: 0, debit1: 0, pb1: 0 },
          };
        }
        // Determine which side
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
        // pb1 totals set later as closing balance

        groupMap[key].rows.push({
          // internal insertion index for stable sorting
          _idx: groupMap[key].rows.length,
          voucherDate: v.voucherDate || '-',
          voucherNo: v.voucherNo || '-',
          chequeNo: v.chequeNo || '-',
          depositSlipNo: v.depositSlipNo || '-',
          narration: v.narration || v.description || r.narration || '-',
          // formatted strings for UI/PDF/Word
          debit1: debit ? debit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '',
          credit1: credit ? credit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '',
          pb1: pb.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
          // raw numbers for Excel
          debit1Num: debit,
          credit1Num: credit,
          pb1Num: pb,
        });
      };

      filteredVouchers.forEach((v) => {
        (v.voucherDetails || []).forEach((r) => {
          const inSel1 = selectedKeys.size === 0 || selectedKeys.has(normalize(r.account1));
          const inSel2 = selectedKeys.size === 0 || selectedKeys.has(normalize(r.account2));
          if (inSel1 && r.account1) pushRow(r.account1, v, r);
          if (inSel2 && r.account2) pushRow(r.account2, v, r);
        });
      });

      const grouped: GroupedRows = Object.values(groupMap)
        .filter((g) => g.rows.length > 0)
        .map((g) => {
          // Sort rows by date then voucherNo
          const rowsSorted = [...g.rows].sort((r1: any, r2: any) => {
            const d1 = new Date(r1.voucherDate || '0000-00-00');
            const d2 = new Date(r2.voucherDate || '0000-00-00');
            if (d1 < d2) return -1;
            if (d1 > d2) return 1;
            const v1 = (r1.voucherNo || '').toString();
            const v2 = (r2.voucherNo || '').toString();
            return v1.localeCompare(v2, undefined, { numeric: true, sensitivity: 'base' });
          });
          // Insert opening balance row always
          const keyNorm = normalize(g.accountId);
          const prev = prevMap[keyNorm];
          const opening = prev ? prev.pb : 0;
          rowsSorted.unshift({
            _idx: -1,
            voucherDate: '-',
            voucherNo: '-',
            chequeNo: '-',
            depositSlipNo: '-',
            narration: 'Opening Balance (previous period)',
            debit1: '',
            credit1: '',
            pb1: opening.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            debit1Num: 0,
            credit1Num: 0,
            pb1Num: opening,
          });
          // Set closing balance for totals.pb1
          const closing = rowsSorted.length > 0 ? rowsSorted[rowsSorted.length - 1].pb1Num : 0;
          return { ...g, rows: rowsSorted, totals: { ...g.totals, pb1: closing } };
        })
        .sort((a, b) => (a.listid || a.description).localeCompare(b.listid || b.description));

      setGroups(grouped);
      if (grouped.length === 0) toast.info('No vouchers matched filters');
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
    return `General Ledger From ${f} To ${t}`;
  }, [fromDate, toDate]);

  const filterSummary = useMemo(() => {
    let statusPart = status && status !== 'All' ? `Status: ${status}` : '';
    let accPart = '';
    if (filterType === 'byHead' && headAccountId) accPart = `Filter: By Head (${headAccountId})`;
    if (filterType === 'range' && (rangeFromId || rangeToId)) accPart = `Filter: Range (${rangeFromId || '-'} to ${rangeToId || '-'})`;
    if (filterType === 'specific' && (specific1Id || specific2Id)) accPart = `Filter: Specific (${specific1Id || '-'} & ${specific2Id || '-'})`;
    let summary = [statusPart, accPart].filter(Boolean).join(', ');
    return summary;
  }, [status, filterType, headAccountId, rangeFromId, rangeToId, specific1Id, specific2Id]);

  // Reset all filters to default values
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
  };

  return (
    <MainLayout activeInterface="ABL">
      <div className="p-3 md:p-5">
        {/* Header */}
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg border-2 border-emerald-200 dark:border-emerald-900 mb-4 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <h1 className="text-lg font-semibold">Account Ledger Report</h1>
            <p className="text-xs text-gray-500">{COMPANY_NAME}</p>
          </div>
          {/* Top controls: search and quick actions */}
          <div className="p-4 flex flex-col gap-3">
            <div className="flex flex-col md:flex-row md:items-end gap-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 flex-1">
                <div>
                  <label className="block text-xs text-gray-600">Branch</label>
                  <input
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    className="mt-1 w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 dark:text-white"
                    placeholder="Branch name"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600">From Date</label>
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="mt-1 w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600">To Date</label>
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="mt-1 w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="mt-1 w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 dark:text-white"
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
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-md flex items-center gap-2"
                >
                  <FiSearch />
                  Run Report
                </Button>
              </div>
            </div>

            {/* Advanced filter panel */}
            <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3 bg-gray-50 dark:bg-gray-900/40">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-gray-600">Account Filter Type</label>
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value as any)}
                    className="mt-1 w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 dark:text-white"
                  >
                    <option value="byHead">By Head (include all sub-accounts)</option>
                    <option value="range">From Account To Account (range by code)</option>
                    <option value="specific">From Which Account and Which Account (specific two)</option>
                  </select>
                </div>

                {/* Account selectors */}
                {filterType === 'byHead' && (
                  <div className="md:col-span-2">
                    <label className="block text-xs text-gray-600 mb-1">Select Head Account</label>
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
                      <label className="block text-xs text-gray-600 mb-1">From Account</label>
                      <HierarchicalDropdown
                        accounts={topLevelAccounts}
                        name="From Account"
                        onSelect={(id) => setRangeFromId(id)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">To Account</label>
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
                      <label className="block text-xs text-gray-600 mb-1">Account 1</label>
                      <HierarchicalDropdown
                        accounts={topLevelAccounts}
                        name="Account 1"
                        onSelect={(id) => setSpecific1Id(id)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Account 2</label>
                      <HierarchicalDropdown
                        accounts={topLevelAccounts}
                        name="Account 2"
                        onSelect={(id) => setSpecific2Id(id)}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-3 flex flex-wrap items-center justify-between gap-2 border-t border-gray-200 dark:border-gray-700 mt-3">
                <div className="text-xs text-gray-500">Tip: Use search inside account pickers to quickly find accounts.</div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => exportGroupedToPDF(titleLine, branch, filterSummary, groups)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md"
                  >
                    Export PDF
                  </Button>
                  <Button
                    onClick={() => exportGroupedToExcel(titleLine, branch, filterSummary, groups)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-md"
                  >
                    Export Excel
                  </Button>
                  <Button
                    onClick={() => exportGroupedToWord(titleLine, branch, filterSummary, groups)}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-md"
                  >
                    Export Word
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Grouped Tables */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700">
          <div className="px-4 py-3 flex items-center justify-between border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-base font-semibold">{COMPANY_NAME}</h2>
            <div className="text-xs text-gray-600">{titleLine}</div>
          </div>
          {loading ? (
            <div className="px-4 py-6 text-center">Loading...</div>
          ) : groups.length === 0 ? (
            <div className="px-4 py-6 text-center text-gray-500">No data</div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {groups.map((g) => (
                <div key={g.accountId} className="p-4">
                  <div className="text-sm font-semibold mb-2">
                    {g.description} <span className="font-normal text-gray-500">({g.listid})</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead className="bg-gray-100 dark:bg-gray-700">
                        <tr>
                          <th className="px-3 py-2 text-left">Voucher Date</th>
                          <th className="px-3 py-2 text-left">Voucher No</th>
                          <th className="px-3 py-2 text-left">Cheque No</th>
                          <th className="px-3 py-2 text-left">Deposit Slip No</th>
                          <th className="px-3 py-2 text-left">Narration</th>
                          <th className="px-3 py-2 text-right">Debit </th>
                          <th className="px-3 py-2 text-right">Credit </th>
                          <th className="px-3 py-2 text-right">Net Balance</th>
                        </tr>
                      </thead>
                      <tbody>
                        {g.rows.map((r: any, idx: number) => (
                          <tr key={idx} className={idx % 2 === 0 ? '' : 'bg-gray-50 dark:bg-gray-700/40'}>
                            <td className="px-3 py-2">{r.voucherDate}</td>
                            <td className="px-3 py-2">{r.voucherNo}</td>
                            <td className="px-3 py-2">{r.chequeNo}</td>
                            <td className="px-3 py-2">{r.depositSlipNo}</td>
                            <td className="px-3 py-2">{r.narration}</td>
                            <td className="px-3 py-2 text-right">{r.debit1}</td>
                            <td className="px-3 py-2 text-right">{r.credit1}</td>
                            <td className="px-3 py-2 text-right">{r.pb1}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-white dark:bg-gray-700 font-semibold">
                          <td className="px-3 py-2 text-right" colSpan={5}>
                            TOTAL
                          </td>
                          <td className="px-3 py-2 text-right">
                            {(g.totals.debit1 || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="px-3 py-2 text-right">
                            {(g.totals.credit1 || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="px-3 py-2 text-right">
                            {(g.totals.pb1 || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                  <div className="text-xs text-gray-500 mt-2 flex items-center gap-2">
                    <FiFileText />
                    Rows: {g.rows.length}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default LedgerPage;