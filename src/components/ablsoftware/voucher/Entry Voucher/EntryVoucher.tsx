'use client';
import React, { useState, useEffect, JSX, useMemo } from 'react';
import { useForm, Controller, type UseFormSetValue, type Path } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import ABLCustomInput from '@/components/ui/ABLCustomInput';
import AblCustomDropdown from '@/components/ui/AblCustomDropdown';
import { toast } from 'react-toastify';
import { useRouter, useSearchParams } from 'next/navigation';
import { MdInfo, MdDelete } from 'react-icons/md';
import { FaFileInvoice } from 'react-icons/fa';
import { FiSave, FiX, FiSearch } from 'react-icons/fi';
import Link from 'next/link';
import { getAllEquality, updateEquality } from '@/apis/equality';
import { getAllAblLiabilities, updateAblLiabilities } from '@/apis/ablliabilities';
import { getAllAblAssests, updateAblAssests } from '@/apis/ablAssests';
import { getAllAblExpense, updateAblExpense } from '@/apis/ablExpense';
import { getAllAblRevenue, updateAblRevenue } from '@/apis/ablRevenue';
import { getAllBusinessAssociate } from '@/apis/businessassociate';
import { createEntryVoucher, updateEntryVoucher, getSingleEntryVoucher } from '@/apis/entryvoucher';

// Account type
type Account = {
  id: string;
  listid: string;
  description: string;
  parentAccountId: string | null;
  children: Account[];
  dueDate: string;
  fixedAmount: string;
  paid: string;
};

interface DropdownOption {
  id: string;
  name: string;
  contact?: string;
}

interface TableRow {
  account1Columns: Array<{
    account: string;
    debit: number;
    credit: number;
  }>;
  account2Columns: Array<{
    account: string;
    debit: number;
    credit: number;
  }>;
  narration: string;
}

type ApiResponse<T> = {
  data: T;
  statusCode: number;
  statusMessage: string;
  misc: {
    totalPages: number;
    total: number;
    pageIndex: number;
    pageSize: number;
    refId: string | null;
    searchQuery: string | null;
  };
};

// Zod schema for voucher form validation
const voucherSchema = z.object({
  voucherNo: z.string().optional(),
  voucherDate: z.string().optional(),
  referenceNo: z.string().optional(),
  chequeNo: z.string().optional(),
  depositSlipNo: z.string().optional(),
  paymentMode: z.string().optional(),
  bankName: z.string().optional(),
  chequeDate: z.string().optional(),
  paidTo: z.string().optional(),
  narration: z.string().optional(),
  description: z.string().optional(),
  tableData: z.array(
    z.object({
      account1Columns: z.array(
        z.object({
          account: z.string().min(1, 'Account is required'),
          debit: z.number().min(0, 'Debit must be non-negative').optional(),
          credit: z.number().min(0, 'Credit must be non-negative').optional(),
        })
      ).min(1, 'At least one Account 1 column is required'),
      account2Columns: z.array(
        z.object({
          account: z.string().min(1, 'Account is required'),
          debit: z.number().min(0, 'Debit must be non-negative').optional(),
          credit: z.number().min(0, 'Credit must be non-negative').optional(),
        })
      ).min(1, 'At least one Account 2 column is required'),
      narration: z.string().optional(),
    })
  ),
});
type VoucherFormData = z.infer<typeof voucherSchema>;

// Helper functions
const findAccountById = (id: string, accounts: Account[]): Account | null => {
  const walk = (nodes: Account[]): Account | null => {
    for (const node of nodes) {
      if (node.id === id) return node;
      if (node.children.length > 0) {
        const found = walk(node.children);
        if (found) return found;
      }
    }
    return null;
  };
  return walk(accounts);
};

const findAccountByDescription = (description: string, accounts: Account[]): Account | null => {
  const walk = (nodes: Account[]): Account | null => {
    for (const node of nodes) {
      if (node.description === description) return node;
      if (node.children.length > 0) {
        const found = walk(node.children);
        if (found) return found;
      }
    }
    return null;
  };
  return walk(accounts);
};

const getAccountType = (id: string, accounts: Account[]): string | null => {
  const walk = (nodes: Account[], parentType: string): string | null => {
    for (const node of nodes) {
      if (node.id === id) return parentType;
      if (node.children.length > 0) {
        const found = walk(node.children, parentType);
        if (found) return found;
      }
    }
    return null;
  };
  for (const root of accounts) {
    const found = walk(root.children, root.id);
    if (found) return found;
  }
  return null;
};

// Hierarchical Dropdown Component
interface HierarchicalDropdownProps {
  accounts: Account[];
  onSelect: (id: string, account: Account | null) => void;
  setValue: UseFormSetValue<VoucherFormData>;
  name: string;
  rowIndex?: number;
  columnIndex?: number;
  section?: 'account1' | 'account2';
  initialAccountId?: string;
  disabled?: boolean;
}

const HierarchicalDropdown: React.FC<HierarchicalDropdownProps> = ({ accounts, onSelect, setValue, name, rowIndex, columnIndex, section, initialAccountId, disabled }) => {
  const [selectionPath, setSelectionPath] = useState<string[]>([]); // Tracks selected IDs at each level
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearchList, setShowSearchList] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // Build path to an account by ID
  const buildPathToAccount = (targetId: string, nodes: Account[], currentPath: string[] = []): string[] | null => {
    for (const node of nodes) {
      const newPath = [...currentPath, node.id];
      if (node.id === targetId) {
        return newPath;
      }
      if (node.children && node.children.length > 0) {
        const found = buildPathToAccount(targetId, node.children, newPath);
        if (found) return found;
      }
    }
    return null;
  };

  // Initialize selection path when initialAccountId is provided
  useEffect(() => {
    if (initialAccountId && accounts.length > 0 && selectionPath.length === 0) {
      const path = buildPathToAccount(initialAccountId, accounts);
      if (path) {
        setSelectionPath(path);
      }
    }
  }, [initialAccountId, accounts]);

  // Build a flat list of leaf accounts for fast searching (excluding main category headers)
  type FlatLeaf = { id: string; label: string; pathIds: string[]; pathLabels: string[]; category: string; listid: string; description: string };
  const flatLeaves: FlatLeaf[] = useMemo(() => {
    const leaves: FlatLeaf[] = [];
    const walk = (node: Account, pathIds: string[], pathLabels: string[], categoryName: string) => {
      const newPathIds = [...pathIds, node.id];
      const newPathLabels = [...pathLabels, node.description];
      if (!node.children || node.children.length === 0) {
        leaves.push({ 
          id: node.id, 
          label: newPathLabels.join(' / '), 
          pathIds: newPathIds, 
          pathLabels: newPathLabels,
          category: categoryName,
          listid: node.listid,
          description: node.description
        });
      } else {
        node.children.forEach((child) => walk(child, newPathIds, newPathLabels, categoryName));
      }
    };
    // Skip the main category headers and start from their children
    accounts.forEach((root) => {
      if (root.children && root.children.length > 0) {
        root.children.forEach((child) => walk(child, [], [], root.description));
      }
    });
    return leaves;
  }, [accounts]);

  const filteredLeaves = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return flatLeaves; // Show all accounts when no search term
    return flatLeaves.filter((leaf) => 
      leaf.label.toLowerCase().includes(q) || 
      leaf.listid.toLowerCase().includes(q) ||
      leaf.description.toLowerCase().includes(q)
    );
  }, [searchTerm, flatLeaves]);

  const findAccountByPath = (pathIds: string[]): Account | null => {
    let current: Account[] = accounts;
    let found: Account | null = null;
    for (const id of pathIds) {
      found = current.find((a) => a.id === id) || null;
      if (!found) return null;
      current = found.children || [];
    }
    return found;
  };

  const handleSelect = (level: number, id: string) => {
    const newPath = selectionPath.slice(0, level);
    newPath.push(id);
    setSelectionPath(newPath);

    // Find the selected account
    let currentAccounts = accounts;
    let selectedAccount: Account | null = null;
    for (const selId of newPath) {
      const found = currentAccounts.find((acc) => acc.id === selId);
      if (found) {
        selectedAccount = found;
        currentAccounts = found.children;
      }
    }

    // If the selected account has no children, set it as the final selection
    if (selectedAccount && selectedAccount.children.length === 0) {
      if (rowIndex !== undefined && columnIndex !== undefined && section) {
        setValue(`tableData.${rowIndex}.${section}Columns.${columnIndex}.${name}` as Path<VoucherFormData>, id, { shouldValidate: true });
      } else {
        setValue(name as Path<VoucherFormData>, id, { shouldValidate: true });
      }
      onSelect(id, selectedAccount);
    } else {
      if (rowIndex !== undefined && columnIndex !== undefined && section) {
        setValue(`tableData.${rowIndex}.${section}Columns.${columnIndex}.${name}` as Path<VoucherFormData>, '' as unknown as string, { shouldValidate: true });
      } else {
        setValue(name as Path<VoucherFormData>, '' as unknown as string, { shouldValidate: true });
      }
      onSelect(id, selectedAccount);
    }
  };

  const getOptionsAtLevel = (level: number): Account[] => {
    if (level === 0) return accounts;
    let current = accounts;
    for (let i = 0; i < level; i++) {
      const selId = selectionPath[i];
      const found = current.find((acc) => acc.id === selId);
      if (found) {
        current = found.children;
      } else {
        return [];
      }
    }
    return current;
  };

  // Determine the number of dropdowns to show
  const levels = selectionPath.length + 1;
  let showLevels = levels;
  if (selectionPath.length > 0) {
    const nextOptions = getOptionsAtLevel(selectionPath.length);
    if (nextOptions.length === 0) {
      showLevels = selectionPath.length;
    }
  }

  // Build selected breadcrumb labels with listid
  const selectionLabels = selectionPath.map((id, idx) => {
    const acc = findAccountById(id, accounts);
    return acc ? `${acc.listid} ${acc.description}` : id;
  });

  const handlePickFromSearch = (leaf: FlatLeaf) => {
    setSelectionPath(leaf.pathIds);
    const selected = findAccountByPath(leaf.pathIds);
    if (rowIndex !== undefined && columnIndex !== undefined && section) {
      setValue(`tableData.${rowIndex}.${section}Columns.${columnIndex}.${name}` as Path<VoucherFormData>, leaf.id, { shouldValidate: true });
    } else {
      setValue(name as Path<VoucherFormData>, leaf.id, { shouldValidate: true });
    }
    onSelect(leaf.id, selected);
    setSearchTerm('');
    setShowSearchList(false);
    setShowModal(false);
  };

  const clearSelection = () => {
    setSelectionPath([]);
    if (rowIndex !== undefined && columnIndex !== undefined && section) {
      setValue(`tableData.${rowIndex}.${section}Columns.${columnIndex}.${name}` as Path<VoucherFormData>, '' as unknown as string, { shouldValidate: true });
    } else {
      setValue(name as Path<VoucherFormData>, '' as unknown as string, { shouldValidate: true });
    }
    onSelect('', null);
  };

  return (
    <div className="flex flex-col gap-2">
      {/* Search Input - Opens Modal */}
      <div className="relative">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => setShowModal(true)}
              onClick={() => setShowModal(true)}
              placeholder="Click to search and select account"
              className="w-full pl-9 pr-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition cursor-pointer"
              readOnly
            />
          </div>
          <button
            type="button"
            onClick={clearSelection}
            className="px-3 py-2 text-xs rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Modal for Account Selection */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-3xl max-h-[80vh] flex flex-col">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#3a614c] to-[#6e997f] text-white px-6 py-4 rounded-t-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FiSearch className="text-xl" />
                <h3 className="text-lg font-semibold">Select Account</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowModal(false);
                  setSearchTerm('');
                }}
                className="text-white hover:bg-white/20 rounded-full p-1 transition"
              >
                <FiX className="text-xl" />
              </button>
            </div>

            {/* Search Input in Modal */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-600">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search accounts by name..."
                  className="w-full pl-9 pr-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600"
                  autoFocus
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Showing {filteredLeaves.length} account{filteredLeaves.length !== 1 ? 's' : ''}
              </p>
            </div>

            {/* Account List */}
            <div className="flex-1 overflow-y-auto p-4">
              {filteredLeaves.length > 0 ? (
                <div className="space-y-1">
                  {filteredLeaves.map((leaf) => (
                    <button
                      type="button"
                      key={leaf.id + leaf.label}
                      onClick={() => handlePickFromSearch(leaf)}
                      className="w-full text-left px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-emerald-50 hover:border-emerald-300 dark:hover:bg-gray-700 dark:hover:border-emerald-500 transition-all duration-200 group"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 flex-1">
                          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded">
                            {leaf.listid}
                          </span>
                          <p className="text-sm font-medium text-gray-800 dark:text-gray-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-400">
                            {leaf.description}
                          </p>
                        </div>
                        <div className="text-emerald-600 dark:text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <FiSearch className="mx-auto text-4xl text-gray-300 dark:text-gray-600 mb-3" />
                  <p className="text-gray-500 dark:text-gray-400">No accounts found</p>
                  <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Try a different search term</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-600 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowModal(false);
                  setSearchTerm('');
                }}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Breadcrumb of selection */}
      {selectionLabels.length > 0 && (
        <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
          <span className="font-medium">Selected:</span>
          <div className="px-3 py-1 rounded-md border border-emerald-200 text-emerald-700 bg-emerald-50 dark:bg-gray-700 dark:text-emerald-300 font-medium">
            {selectionLabels[selectionLabels.length - 1]}
          </div>
        </div>
      )}
    </div>
  );
};

const EntryVoucherForm = ({ isEdit = false }: { isEdit?: boolean }) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isViewMode = searchParams?.get('mode') === 'view';
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    control,
  } = useForm<VoucherFormData>({
    resolver: zodResolver(voucherSchema),
    defaultValues: {
      voucherNo: '',
      voucherDate: new Date().toISOString().split('T')[0],
      referenceNo: '',
      chequeNo: '',
      depositSlipNo: '',
      paymentMode: '',
      bankName: '',
      chequeDate: '',
      paidTo: '',
      narration: '',
      description: '',
      tableData: [{
        account1Columns: [{ account: '', debit: 0, credit: 0 }],
        account2Columns: [{ account: '', debit: 0, credit: 0 }],
        narration: ''
      }],
    },
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [topLevelAccounts, setTopLevelAccounts] = useState<Account[]>([]);
  const [businessAssociates, setBusinessAssociates] = useState<DropdownOption[]>([]);
  const [selectedAccounts, setSelectedAccounts] = useState<Array<{
    account1: Array<Account | null>;
    account2: Array<Account | null>;
  }>>([{ account1: [null], account2: [null] }]);
  const [bankNames, setBankNames] = useState<DropdownOption[]>([
    { id: 'HBL', name: 'Habib Bank Limited (HBL)' },
    { id: 'MCB', name: 'MCB Bank Limited' },
    { id: 'UBL', name: 'United Bank Limited (UBL)' },
    { id: 'ABL', name: 'Allied Bank Limited (ABL)' },
    { id: 'NBP', name: 'National Bank of Pakistan (NBP)' },
    { id: 'Meezan', name: 'Meezan Bank' },
    { id: 'BankAlfalah', name: 'Bank Alfalah' },
    { id: 'Askari', name: 'Askari Bank' },
    { id: 'Faysal', name: 'Faysal Bank' },
    { id: 'BankAlHabib', name: 'Bank Al Habib' },
    { id: 'Soneri', name: 'Soneri Bank' },
    { id: 'Samba', name: 'Samba Bank' },
    { id: 'JS', name: 'JS Bank' },
    { id: 'Silk', name: 'Silk Bank' },
    { id: 'Summit', name: 'Summit Bank' },
    { id: 'StandardChartered', name: 'Standard Chartered Bank' },
    { id: 'BankIslami', name: 'BankIslami Pakistan' },
    { id: 'DubaiIslamic', name: 'Dubai Islamic Bank Pakistan' },
    { id: 'AlBaraka', name: 'Al Baraka Bank' },
    { id: 'ZaraiTaraqiati', name: 'Zarai Taraqiati Bank Limited (ZTBL)' },
    { id: 'SindhBank', name: 'Sindh Bank' },
    { id: 'BankOfPunjab', name: 'The Bank of Punjab' },
    { id: 'FirstWomenBank', name: 'First Women Bank' },
    { id: 'BankOfKhyber', name: 'The Bank of Khyber' },
    { id: 'BankOfAzadKashmir', name: 'Bank of Azad Kashmir' },
    { id: 'IndustrialDevelopment', name: 'Industrial Development Bank of Pakistan' },
    { id: 'Other', name: 'Other' },
  ]);

  const paymentModes: DropdownOption[] = [
    { id: 'Bank', name: 'Bank' },
    { id: 'Cheque', name: 'Cheque' },
    { id: 'Petty Cash', name: 'Petty Cash' },
    { id: 'Bad Debt', name: 'Bad Debt' },
    { id: 'LC', name: 'LC' },
  ];

  const tableData = watch('tableData');
  const paymentMode = watch('paymentMode');

  // Automatically set bankName to PettyCash when paymentMode is Petty Cash
  useEffect(() => {
    if (paymentMode === 'Petty Cash') {
      setValue('bankName', 'PettyCash', { shouldValidate: false });
    }
  }, [paymentMode, setValue]);

  // Calculate totals
  const totals = useMemo(() => {
    let totalDebit1 = 0, totalCredit1 = 0, totalDebit2 = 0, totalCredit2 = 0;
    tableData.forEach((row) => {
      row.account1Columns.forEach((acc) => {
        totalDebit1 += acc.debit || 0;
        totalCredit1 += acc.credit || 0;
      });
      row.account2Columns.forEach((acc) => {
        totalDebit2 += acc.debit || 0;
        totalCredit2 += acc.credit || 0;
      });
    });
    return { totalDebit1, totalCredit1, totalDebit2, totalCredit2 };
  }, [tableData]);

  // Build hierarchy
  const buildHierarchy = (accounts: Account[]): Account[] => {
    const map: Record<string, Account> = {};
    accounts.forEach((account) => {
      map[account.id] = { ...account, children: [] };
    });

    const rootAccounts: Account[] = [];
    accounts.forEach((account) => {
      if (account.parentAccountId === null) {
        rootAccounts.push(map[account.id]);
      } else {
        const parent = map[account.parentAccountId];
        if (parent) {
          parent.children.push(map[account.id]);
        }
      }
    });

    return rootAccounts;
  };

  // Render children accounts for display
  const renderChildren = (children: Account[], level = 0): JSX.Element[] => {
    return children.map((child) => (
      <div key={child.id} className={`pl-${level * 4} text-sm text-gray-600 dark:text-gray-400`}>
        <p>{child.description}</p>
        {child.children && child.children.length > 0 && renderChildren(child.children, level + 1)}
      </div>
    ));
  };

  // Fetch accounts
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [assetsRes, revenuesRes, liabilitiesRes, expensesRes, equitiesRes, baRes] = await Promise.all([
        getAllAblAssests(1, 10000).catch(() => ({ data: [], statusCode: 500, statusMessage: 'Failed to fetch assets', misc: {} })),
        getAllAblRevenue(1, 10000).catch(() => ({ data: [], statusCode: 500, statusMessage: 'Failed to fetch revenues', misc: {} })),
        getAllAblLiabilities(1, 10000).catch(() => ({ data: [], statusCode: 500, statusMessage: 'Failed to fetch liabilities', misc: {} })),
        getAllAblExpense(1, 10000).catch(() => ({ data: [], statusCode: 500, statusMessage: 'Failed to fetch expenses', misc: {} })),
        getAllEquality(1, 10000).catch(() => ({ data: [], statusCode: 500, statusMessage: 'Failed to fetch equities', misc: {} })),
        getAllBusinessAssociate().catch(() => ({ data: [], statusCode: 500, statusMessage: 'Failed to fetch business associates', misc: {} })),
      ]);

      const topLevel: Account[] = [
        { id: 'assets', listid: 'assets', description: 'Assets', parentAccountId: null, children: buildHierarchy(assetsRes.data || []), dueDate: '', fixedAmount: '', paid: '' },
        { id: 'revenues', listid: 'revenues', description: 'Revenues', parentAccountId: null, children: buildHierarchy(revenuesRes.data || []), dueDate: '', fixedAmount: '', paid: '' },
        { id: 'liabilities', listid: 'liabilities', description: 'Liabilities', parentAccountId: null, children: buildHierarchy(liabilitiesRes.data || []), dueDate: '', fixedAmount: '', paid: '' },
        { id: 'expenses', listid: 'expenses', description: 'Expenses', parentAccountId: null, children: buildHierarchy(expensesRes.data || []), dueDate: '', fixedAmount: '', paid: '' },
        { id: 'equities', listid: 'equities', description: 'Equities', parentAccountId: null, children: buildHierarchy(equitiesRes.data || []), dueDate: '', fixedAmount: '', paid: '' },
      ];

      setTopLevelAccounts(topLevel);
      setBusinessAssociates(baRes.data.map((ba: any) => ({ id: ba.id, name: ba.name, contact: ba.contact })));

      if (topLevel.every((acc) => acc.children.length === 0)) {
        toast.warn('No accounts found in any category');
      }
    } catch (error) {
      toast.error('Failed to load chart of accounts');
      console.error('Error fetching accounts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    if (!isEdit) {
      const generateVoucherNo = () => {
        const prefix = 'VOU';
        const timestamp = Date.now().toString().slice(-6);
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return `${prefix}-${timestamp}-${random}`;
      };
      setValue('voucherNo', generateVoucherNo());
    }
  }, [setValue, isEdit]);

  useEffect(() => {
    if (isEdit && topLevelAccounts.length > 0) {
      const fetchVoucher = async () => {
        setIsLoading(true);
        const id = window.location.pathname.split('/').pop();
        if (id) {
          try {
            const response = await getSingleEntryVoucher(id);
            const voucher = response.data;

            setValue('voucherNo', String(voucher.voucherNo || ''));
            setValue('voucherDate', voucher.voucherDate || '');
            setValue('referenceNo', voucher.referenceNo || '');
            setValue('chequeNo', voucher.chequeNo || '');
            setValue('depositSlipNo', voucher.depositSlipNo || '');
            setValue('paymentMode', voucher.paymentMode || '');
            setValue('bankName', voucher.bankName || '');
            setValue('chequeDate', voucher.chequeDate || '');
            setValue('paidTo', voucher.paidTo || '');
            setValue('narration', voucher.narration || '');
            setValue('description', voucher.description || '');

            // Parse VoucherDetails - each detail is one row with comma-separated columns
            const loadedTableData = (voucher.voucherDetails || []).map((detail: any) => {
              // Parse comma-separated values for Account 1
              const account1Ids = detail.account1 ? detail.account1.split(',') : [];
              const debit1Values = detail.debit1 ? detail.debit1.split(',') : [];
              const credit1Values = detail.credit1 ? detail.credit1.split(',') : [];

              // Parse comma-separated values for Account 2
              const account2Ids = detail.account2 ? detail.account2.split(',') : [];
              const debit2Values = detail.debit2 ? detail.debit2.split(',') : [];
              const credit2Values = detail.credit2 ? detail.credit2.split(',') : [];

              // Build account1Columns array
              const account1Columns = account1Ids.map((accId: string, index: string | number) => ({
                account: accId.trim(),
                debit: Number(debit1Values[index] || 0),
                credit: Number(credit1Values[index] || 0),
              }));

              // Build account2Columns array
              const account2Columns = account2Ids.map((accId: string, index: string | number) => ({
                account: accId.trim(),
                debit: Number(debit2Values[index] || 0),
                credit: Number(credit2Values[index] || 0),
              }));

              return {
                account1Columns: account1Columns.length > 0 ? account1Columns : [{ account: '', debit: 0, credit: 0 }],
                account2Columns: account2Columns.length > 0 ? account2Columns : [{ account: '', debit: 0, credit: 0 }],
                narration: detail.narration || ''
              };
            });

            setValue('tableData', loadedTableData.length > 0 ? loadedTableData : [{
              account1Columns: [{ account: '', debit: 0, credit: 0 }],
              account2Columns: [{ account: '', debit: 0, credit: 0 }],
              narration: ''
            }]);

            const loadedSelected = loadedTableData.map((row: { account1Columns: any[]; account2Columns: any[]; }) => ({
              account1: row.account1Columns.map((acc: { account: string; }) => findAccountById(acc.account, topLevelAccounts)),
              account2: row.account2Columns.map((acc: { account: string; }) => findAccountById(acc.account, topLevelAccounts)),
            }));
            setSelectedAccounts(loadedSelected.length > 0 ? loadedSelected : [{ account1: [null], account2: [null] }]);
          } catch (error) {
            toast.error('Failed to load voucher data');
            console.error('Error fetching voucher:', error);
          } finally {
            setIsLoading(false);
          }
        }
      };
      fetchVoucher();
    }
  }, [isEdit, setValue, topLevelAccounts]);

  const handleAccountSelect = (rowIndex: number, section: 'account1' | 'account2', columnIndex: number) => (id: string, account: Account | null) => {
    const updatedSelectedAccounts = [...selectedAccounts];
    if (!updatedSelectedAccounts[rowIndex]) {
      updatedSelectedAccounts[rowIndex] = { account1: [], account2: [] };
    }
    if (section === 'account1') {
      updatedSelectedAccounts[rowIndex].account1[columnIndex] = account;
    } else {
      updatedSelectedAccounts[rowIndex].account2[columnIndex] = account;
    }
    setSelectedAccounts(updatedSelectedAccounts);
  };

  const addTableRow = () => {
    setValue('tableData', [
      ...tableData,
      {
        account1Columns: [{ account: '', debit: 0, credit: 0 }],
        account2Columns: [{ account: '', debit: 0, credit: 0 }],
        narration: ''
      },
    ]);
    setSelectedAccounts([...selectedAccounts, { account1: [null], account2: [null] }]);
  };

  const deleteTableRow = (index: number) => {
    if (tableData.length <= 1) {
      toast.warn('At least one row is required');
      return;
    }
    const newTableData = tableData.filter((_, i) => i !== index);
    const newSelectedAccounts = selectedAccounts.filter((_, i) => i !== index);
    setValue('tableData', newTableData);
    setSelectedAccounts(newSelectedAccounts);
  };

  const addAccount1Column = (rowIndex: number) => {
    const updatedTableData = [...tableData];
    const row = updatedTableData[rowIndex];
    
    // Determine if we should add debit or credit based on existing entries
    // If first column has debit, new columns should also have debit
    const firstCol = row.account1Columns[0];
    const hasDebit = firstCol && firstCol.debit != null && firstCol.debit > 0;
    const hasCredit = firstCol && firstCol.credit != null && firstCol.credit > 0;
    
    updatedTableData[rowIndex].account1Columns.push({ 
      account: '', 
      debit: hasDebit ? 0 : 0, 
      credit: hasCredit ? 0 : 0 
    });
    setValue('tableData', updatedTableData);
    
    const updatedSelectedAccounts = [...selectedAccounts];
    updatedSelectedAccounts[rowIndex].account1.push(null);
    setSelectedAccounts(updatedSelectedAccounts);
  };

  const deleteAccount1Column = (rowIndex: number, columnIndex: number) => {
    const updatedTableData = [...tableData];
    if (updatedTableData[rowIndex].account1Columns.length <= 1) {
      toast.warn('At least one Account 1 column is required');
      return;
    }
    updatedTableData[rowIndex].account1Columns = updatedTableData[rowIndex].account1Columns.filter((_, i) => i !== columnIndex);
    setValue('tableData', updatedTableData);
    
    const updatedSelectedAccounts = [...selectedAccounts];
    updatedSelectedAccounts[rowIndex].account1 = updatedSelectedAccounts[rowIndex].account1.filter((_, i) => i !== columnIndex);
    setSelectedAccounts(updatedSelectedAccounts);
  };

  const addAccount2Column = (rowIndex: number) => {
    const updatedTableData = [...tableData];
    const row = updatedTableData[rowIndex];
    
    // Determine if we should add debit or credit based on existing entries
    // If first column has credit, new columns should also have credit
    const firstCol = row.account2Columns[0];
    const hasDebit = firstCol && firstCol.debit != null && firstCol.debit > 0;
    const hasCredit = firstCol && firstCol.credit != null && firstCol.credit > 0;
    
    updatedTableData[rowIndex].account2Columns.push({ 
      account: '', 
      debit: hasDebit ? 0 : 0, 
      credit: hasCredit ? 0 : 0 
    });
    setValue('tableData', updatedTableData);
    
    const updatedSelectedAccounts = [...selectedAccounts];
    updatedSelectedAccounts[rowIndex].account2.push(null);
    setSelectedAccounts(updatedSelectedAccounts);
  };

  const deleteAccount2Column = (rowIndex: number, columnIndex: number) => {
    const updatedTableData = [...tableData];
    if (updatedTableData[rowIndex].account2Columns.length <= 1) {
      toast.warn('At least one Account 2 column is required');
      return;
    }
    updatedTableData[rowIndex].account2Columns = updatedTableData[rowIndex].account2Columns.filter((_, i) => i !== columnIndex);
    setValue('tableData', updatedTableData);
    
    const updatedSelectedAccounts = [...selectedAccounts];
    updatedSelectedAccounts[rowIndex].account2 = updatedSelectedAccounts[rowIndex].account2.filter((_, i) => i !== columnIndex);
    setSelectedAccounts(updatedSelectedAccounts);
  };

  

  const onSubmit = async (data: VoucherFormData) => {
    setIsSubmitting(true);
    try {
      // Calculate totals for validation
      let totalDebit1 = 0, totalCredit1 = 0, totalDebit2 = 0, totalCredit2 = 0;
      data.tableData.forEach((row) => {
        row.account1Columns.forEach((acc) => {
          totalDebit1 += acc.debit || 0;
          totalCredit1 += acc.credit || 0;
        });
        row.account2Columns.forEach((acc) => {
          totalDebit2 += acc.debit || 0;
          totalCredit2 += acc.credit || 0;
        });
      });

      // Check if totals are balanced
      const totalDebit = totalDebit1 + totalDebit2;
      const totalCredit = totalCredit1 + totalCredit2;
      const difference = Math.abs(totalDebit - totalCredit);

      if (difference >= 0.01) {
        toast.error(`Accounts are not balanced! Total Debit (${totalDebit.toFixed(2)}) must equal Total Credit (${totalCredit.toFixed(2)}). Difference: ${difference.toFixed(2)}`);
        setIsSubmitting(false);
        return;
      }

      // Build VoucherDetails array - one detail per row with comma-separated values
      const voucherDetails: any[] = [];

      data.tableData.forEach((row) => {
        // Build comma-separated strings for this row
        const account1Ids: string[] = [];
        const debit1Values: string[] = [];
        const credit1Values: string[] = [];
        const account2Ids: string[] = [];
        const debit2Values: string[] = [];
        const credit2Values: string[] = [];

        // Collect Account 1 columns
        row.account1Columns.forEach((acc) => {
          if (acc.account) {
            account1Ids.push(acc.account);
            debit1Values.push(String(acc.debit || 0));
            credit1Values.push(String(acc.credit || 0));
          }
        });

        // Collect Account 2 columns
        row.account2Columns.forEach((acc) => {
          if (acc.account) {
            account2Ids.push(acc.account);
            debit2Values.push(String(acc.debit || 0));
            credit2Values.push(String(acc.credit || 0));
          }
        });

        // Only add if we have at least one account
        if (account1Ids.length > 0 || account2Ids.length > 0) {
          voucherDetails.push({
            account1: account1Ids.join(','),
            debit1: debit1Values.join(','),
            credit1: credit1Values.join(','),
            account2: account2Ids.join(','),
            debit2: debit2Values.join(','),
            credit2: credit2Values.join(','),
            narration: row.narration || '',
            currentBalance1: '0',
            projectedBalance1: '0',
            currentBalance2: '0',
            projectedBalance2: '0',
          });
        }
      });

      // Validate that we have at least one detail
      if (voucherDetails.length === 0) {
        toast.error('Please add at least one row with accounts');
        setIsSubmitting(false);
        return;
      }

      const payload = {
        voucherNo: data.voucherNo || '',
        voucherDate: data.voucherDate || '',
        referenceNo: data.referenceNo || '',
        chequeNo: data.chequeNo || '',
        depositSlipNo: data.depositSlipNo || '',
        paymentMode: data.paymentMode || '',
        bankName: data.bankName || '',
        chequeDate: data.chequeDate || '',
        paidTo: data.paidTo || '',
        narration: data.narration || '',
        description: data.description || '',
        creationDate: '',
        updationDate: '',
        status: 'Active',
        voucherDetails,
      } as any;

      if (isEdit) {
        const id = window.location.pathname.split('/').pop();
        if (!id) throw new Error('Missing voucher id for update');
        const updatePayload = { ...payload, id } as any;
        await updateEntryVoucher(updatePayload);
        toast.success('Voucher updated successfully');
      } else {
        await createEntryVoucher(payload);
        toast.success('Voucher created successfully');
      }
      router.push('/entryvoucher');
    } catch (error: any) {
      toast.error(error.message || 'An error occurred while saving the voucher');
      console.error('Error saving voucher:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Refresh accounts when a new account is saved
  useEffect(() => {
    const handleCustomEvent = () => {
      console.log('accountSaved event received');
      fetchData();
    };
    window.addEventListener('accountSaved', handleCustomEvent);
    return () => window.removeEventListener('accountSaved', handleCustomEvent);
  }, []);

  return (
    <div className="max-w-6xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="h-full w-full flex flex-col">
        {isLoading && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-xl">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-gray-700 dark:text-gray-300 text-sm font-medium">Loading...</span>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
          {!isViewMode && (
          <div className="bg-gradient-to-r from-[#3a614c] to-[#6e997f] text-white px-4 py-3 md:px-6 md:py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-md">
                  <FaFileInvoice className="text-xl" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold">{isEdit ? 'Edit Voucher' : 'Add New Voucher'}</h1>
                  <p className="text-white/80 text-sm">{isEdit ? 'Update voucher record' : 'Create a new voucher record'}</p>
                </div>
              </div>
              <Link href="/vouchers">
                <Button
                  type="button"
                  className="bg-white/10 hover:bg-white/20 text-white rounded-md transition-all duration-200 border border-white/20 px-4 py-2 text-sm flex items-center gap-1"
                >
                  <FiX /> Cancel
                </Button>
              </Link>
            </div>
          </div>
          )}
          {isViewMode && (
        <div className="m-6 p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl flex items-center gap-3">
          <div>
            <p className="font-medium text-amber-800 dark:text-amber-200">View Only Mode</p>
            <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
              This Entry Voucher record is read-only. No changes can be made.
            </p>
          </div>
        </div>
      )}

          <form onSubmit={handleSubmit(onSubmit)} className="p-4 md:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              <ABLCustomInput
                label="Voucher #"
                type="text"
                placeholder="Auto-generated"
                register={register}
                error={errors.voucherNo?.message}
                id="voucherNo"
                disabled
              />
              <ABLCustomInput
                label="Voucher Date"
                type="date"
                register={register}
                error={errors.voucherDate?.message}
                id="voucherDate"
                disabled={isViewMode}
              />
              <ABLCustomInput
                label="Reference No"
                type="text"
                placeholder="Enter reference number"
                register={register}
                error={errors.referenceNo?.message}
                id="referenceNo"
                disabled={isViewMode}
              />
               <Controller
                name="paymentMode"
                control={control}
                render={({ field }) => (
                  <AblCustomDropdown
                    label="Payment Mode"
                    options={paymentModes}
                    selectedOption={field.value || ''}
                    onChange={field.onChange}
                    error={errors.paymentMode?.message}
                    disabled={isViewMode}
                  />
                )}
              />
               {paymentMode === 'Bank' && (
                <Controller
                  name="bankName"
                  control={control}
                  render={({ field }) => (
                    <AblCustomDropdown
                      label="Bank Name"
                      options={bankNames}
                      selectedOption={field.value || ''}
                      onChange={field.onChange}
                      error={errors.bankName?.message}
                      disabled={isViewMode}
                    />
                  )}
                />
              )}
              {(paymentMode === 'Bank' || paymentMode === 'Cheque') && (
                <ABLCustomInput
                  label="Cheque Date"
                  type="date"
                  register={register}
                  error={errors.chequeDate?.message}
                  id="chequeDate"
                  disabled={isViewMode}
                />
              )}
              <ABLCustomInput
                label="Cheque No"
                type="text"
                placeholder="Enter cheque number"
                register={register}
                error={errors.chequeNo?.message}
                id="chequeNo"
                disabled={isViewMode}
              />
              <ABLCustomInput
                label="Deposit Slip No"
                type="text"
                placeholder="Enter deposit slip number"
                register={register}
                error={errors.depositSlipNo?.message}
                id="depositSlipNo"
                disabled={isViewMode}
              />
              <Controller
                name="paidTo"
                control={control}
                render={({ field }) => (
                  <AblCustomDropdown
                    label="Paid To"
                    options={businessAssociates}
                    selectedOption={field.value || ''}
                    onChange={field.onChange}
                    error={errors.paidTo?.message}
                    disabled={isViewMode}
                  />
                )}
              />
              {/* <ABLCustomInput
                label="Narration"
                type="text"
                placeholder="Enter narration"
                register={register}
                error={errors.narration?.message}
                id="narration"
              /> */}
              <ABLCustomInput
                label="Description"
                type="text"
                placeholder="Enter description"
                register={register}
                error={errors.description?.message}
                id="description"
                disabled={isViewMode}
              />
            </div>

            {/* Voucher Details Table */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 mb-6">
              <div className="bg-gradient-to-r from-[#3a614c] to-[#6e997f] text-white px-4 py-3 rounded-t-lg flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FaFileInvoice className="text-lg" />
                  <h3 className="text-base font-semibold">Voucher Details</h3>
                </div>
                <span className="text-xs bg-white/20 px-3 py-1 rounded-full">{tableData.length} Row{tableData.length !== 1 ? 's' : ''}</span>
              </div>
              <div className="p-4">
                <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-600">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-gray-700">
                        <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-700 dark:text-gray-200 border-b-2 border-gray-300 dark:border-gray-500 min-w-[250px]">
                          Account 1
                        </th>
                        <th className="px-3 py-2.5 text-right text-xs font-semibold text-gray-700 dark:text-gray-200 border-b-2 border-gray-300 dark:border-gray-500 min-w-[100px]">
                          Debit
                        </th>
                        <th className="px-3 py-2.5 text-right text-xs font-semibold text-gray-700 dark:text-gray-200 border-b-2 border-gray-300 dark:border-gray-500 min-w-[100px]">
                          Credit
                        </th>
                        <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-700 dark:text-gray-200 border-b-2 border-gray-300 dark:border-gray-500 min-w-[180px]">
                          Narration
                        </th>
                        <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-700 dark:text-gray-200 border-b-2 border-gray-300 dark:border-gray-500 min-w-[250px]">
                          Account 2
                        </th>
                        <th className="px-3 py-2.5 text-right text-xs font-semibold text-gray-700 dark:text-gray-200 border-b-2 border-gray-300 dark:border-gray-500 min-w-[100px]">
                          Debit
                        </th>
                        <th className="px-3 py-2.5 text-right text-xs font-semibold text-gray-700 dark:text-gray-200 border-b-2 border-gray-300 dark:border-gray-500 min-w-[100px]">
                          Credit
                        </th>
                        {!isViewMode && (
                          <th className="px-3 py-2.5 text-center text-xs font-semibold text-gray-700 dark:text-gray-200 border-b-2 border-gray-300 dark:border-gray-500 min-w-[80px]">
                            Action
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800">
                      {tableData.map((row, rowIndex) => {
                        const maxCols = Math.max(row.account1Columns.length, row.account2Columns.length);
                        
                        return (
                          <React.Fragment key={rowIndex}>
                            {/* Add buttons row - shown at the top of each row group */}
                            {!isViewMode && (
                              <tr className="bg-blue-50 dark:bg-gray-700/50">
                                <td colSpan={3} className="px-2 py-2 border-b border-gray-200 dark:border-gray-600">
                                  <button
                                    type="button"
                                    onClick={() => addAccount1Column(rowIndex)}
                                    className="w-full px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
                                    title="Add Account 1"
                                  >
                                    <span className="text-sm font-bold">+</span>
                                    <span>Add Account 1</span>
                                  </button>
                                </td>
                                <td className="px-2 py-2 border-b border-gray-200 dark:border-gray-600 text-center">
                                  <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">Row {rowIndex + 1}</span>
                                </td>
                                <td colSpan={3} className="px-2 py-2 border-b border-gray-200 dark:border-gray-600">
                                  <button
                                    type="button"
                                    onClick={() => addAccount2Column(rowIndex)}
                                    className="w-full px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
                                    title="Add Account 2"
                                  >
                                    <span className="text-sm font-bold">+</span>
                                    <span>Add Account 2</span>
                                  </button>
                                </td>
                                <td className="px-2 py-2 border-b border-gray-200 dark:border-gray-600 text-center">
                                  {tableData.length > 1 && (
                                    <button
                                      type="button"
                                      onClick={() => deleteTableRow(rowIndex)}
                                      className="inline-flex items-center justify-center p-1.5 bg-red-500 hover:bg-red-600 text-white rounded transition-colors"
                                      title="Delete Row"
                                    >
                                      <MdDelete className="text-base" />
                                    </button>
                                  )}
                                </td>
                              </tr>
                            )}
                            
                            {/* Data rows */}
                            {Array.from({ length: maxCols }).map((_, colIndex) => {
                              const acc1 = row.account1Columns[colIndex];
                              const acc2 = row.account2Columns[colIndex];
                              const isFirstCol = colIndex === 0;
                              
                              return (
                                <tr
                                  key={`${rowIndex}-${colIndex}`}
                                  className={`${
                                    rowIndex % 2 === 0
                                      ? 'bg-white dark:bg-gray-800'
                                      : 'bg-gray-50 dark:bg-gray-750'
                                  } hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors`}
                                >
                                  {/* Account 1 */}
                                  <td className="px-2 py-2 border-b border-gray-200 dark:border-gray-600">
                                    {acc1 && (
                                      <div className="flex items-start gap-1">
                                        <div className="flex-1">
                                          <HierarchicalDropdown
                                            accounts={topLevelAccounts}
                                            onSelect={handleAccountSelect(rowIndex, 'account1', colIndex)}
                                            setValue={setValue}
                                            name="account"
                                            rowIndex={rowIndex}
                                            columnIndex={colIndex}
                                            section="account1"
                                            initialAccountId={acc1.account}
                                            disabled={isViewMode}
                                          />
                                          {errors.tableData?.[rowIndex]?.account1Columns?.[colIndex]?.account && (
                                            <p className="text-red-500 text-xs mt-1">
                                              {errors.tableData[rowIndex].account1Columns?.[colIndex]?.account?.message}
                                            </p>
                                          )}
                                        </div>
                                        {row.account1Columns.length > 1 && !isViewMode && (
                                          <button
                                            type="button"
                                            onClick={() => deleteAccount1Column(rowIndex, colIndex)}
                                            className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors"
                                            title="Delete"
                                          >
                                            <MdDelete className="text-base" />
                                          </button>
                                        )}
                                      </div>
                                    )}
                                  </td>
                                  
                                  {/* Debit 1 */}
                                  <td className="px-2 py-2 border-b border-gray-200 dark:border-gray-600">
                                    {acc1 && (
                                      <input
                                        {...register(`tableData.${rowIndex}.account1Columns.${colIndex}.debit`, { valueAsNumber: true })}
                                        className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-500 rounded text-xs focus:ring-1 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-right"
                                        placeholder="0.00"
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        disabled={isViewMode}
                                      />
                                    )}
                                  </td>
                                  
                                  {/* Credit 1 */}
                                  <td className="px-2 py-2 border-b border-gray-200 dark:border-gray-600">
                                    {acc1 && (
                                      <input
                                        {...register(`tableData.${rowIndex}.account1Columns.${colIndex}.credit`, { valueAsNumber: true })}
                                        className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-500 rounded text-xs focus:ring-1 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-right"
                                        placeholder="0.00"
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        disabled={isViewMode}
                                      />
                                    )}
                                  </td>

                                  {/* Narration - Only show on first column */}
                                  {isFirstCol ? (
                                    <td className="px-2 py-2 border-b border-gray-200 dark:border-gray-600" rowSpan={maxCols}>
                                      <input
                                        {...register(`tableData.${rowIndex}.narration`)}
                                        className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-500 rounded text-xs focus:ring-1 focus:ring-emerald-500 dark:bg-gray-700 dark:text-white"
                                        placeholder="Enter narration"
                                        disabled={isViewMode}
                                      />
                                    </td>
                                  ) : null}

                                  {/* Account 2 */}
                                  <td className="px-2 py-2 border-b border-gray-200 dark:border-gray-600">
                                    {acc2 && (
                                      <div className="flex items-start gap-1">
                                        <div className="flex-1">
                                          <HierarchicalDropdown
                                            accounts={topLevelAccounts}
                                            onSelect={handleAccountSelect(rowIndex, 'account2', colIndex)}
                                            setValue={setValue}
                                            name="account"
                                            rowIndex={rowIndex}
                                            columnIndex={colIndex}
                                            section="account2"
                                            initialAccountId={acc2.account}
                                            disabled={isViewMode}
                                          />
                                          {errors.tableData?.[rowIndex]?.account2Columns?.[colIndex]?.account && (
                                            <p className="text-red-500 text-xs mt-1">
                                              {errors.tableData[rowIndex].account2Columns?.[colIndex]?.account?.message}
                                            </p>
                                          )}
                                        </div>
                                        {row.account2Columns.length > 1 && !isViewMode && (
                                          <button
                                            type="button"
                                            onClick={() => deleteAccount2Column(rowIndex, colIndex)}
                                            className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors"
                                            title="Delete"
                                          >
                                            <MdDelete className="text-base" />
                                          </button>
                                        )}
                                      </div>
                                    )}
                                  </td>
                                  
                                  {/* Debit 2 */}
                                  <td className="px-2 py-2 border-b border-gray-200 dark:border-gray-600">
                                    {acc2 && (
                                      <input
                                        {...register(`tableData.${rowIndex}.account2Columns.${colIndex}.debit`, { valueAsNumber: true })}
                                        className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-500 rounded text-xs focus:ring-1 focus:ring-emerald-500 dark:bg-gray-700 dark:text-white text-right"
                                        placeholder="0.00"
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        disabled={isViewMode}
                                      />
                                    )}
                                  </td>
                                  
                                  {/* Credit 2 */}
                                  <td className="px-2 py-2 border-b border-gray-200 dark:border-gray-600">
                                    {acc2 && (
                                      <input
                                        {...register(`tableData.${rowIndex}.account2Columns.${colIndex}.credit`, { valueAsNumber: true })}
                                        className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-500 rounded text-xs focus:ring-1 focus:ring-emerald-500 dark:bg-gray-700 dark:text-white text-right"
                                        placeholder="0.00"
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        disabled={isViewMode}
                                      />
                                    )}
                                  </td>

                                  {/* Action column */}
                                  {!isViewMode && isFirstCol ? (
                                    <td className="px-2 py-2 border-b border-gray-200 dark:border-gray-600 text-center" rowSpan={maxCols}>
                                      {/* Empty - actions are in the button row above */}
                                    </td>
                                  ) : null}
                                </tr>
                              );
                            })}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="bg-gray-100 dark:bg-gray-700 border-t-2 border-gray-300 dark:border-gray-600">
                        {/* Account 1 Totals */}
                        <td className="px-2 py-2.5 text-xs font-semibold text-blue-700 dark:text-blue-400">
                          Account 1 Total
                        </td>
                        <td className="px-2 py-2.5 text-right text-sm font-bold text-gray-900 dark:text-white">
                          {totals.totalDebit1.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-2 py-2.5 text-right text-sm font-bold text-gray-900 dark:text-white">
                          {totals.totalCredit1.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                        
                        {/* Balance Status */}
                        <td className="px-2 py-2.5 text-center">
                          {(() => {
                            const totalDebit = totals.totalDebit1 + totals.totalDebit2;
                            const totalCredit = totals.totalCredit1 + totals.totalCredit2;
                            const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;
                            const difference = Math.abs(totalDebit - totalCredit);
                            
                            return isBalanced ? (
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded text-xs font-semibold">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                Balanced
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded text-xs font-semibold">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                                Off by {difference.toFixed(2)}
                              </span>
                            );
                          })()}
                        </td>
                        
                        {/* Account 2 Totals */}
                        <td className="px-2 py-2.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                          Account 2 Total
                        </td>
                        <td className="px-2 py-2.5 text-right text-sm font-bold text-gray-900 dark:text-white">
                          {totals.totalDebit2.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-2 py-2.5 text-right text-sm font-bold text-gray-900 dark:text-white">
                          {totals.totalCredit2.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                        
                        {/* Empty Action */}
                        {!isViewMode && <td className="px-2 py-2.5"></td>}
                      </tr>
                    </tfoot>
                  </table>
                </div>
                <div className="mt-3 flex justify-between items-center">
                  <button
                    type="button"
                    onClick={addTableRow}
                    disabled={isViewMode}
                    className="px-5 py-2 bg-[#3a614c] hover:bg-[#2d4d3a] text-white rounded text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="text-lg font-bold">+</span>
                    <span>Add New Row</span>
                  </button>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    Total: <span className="font-semibold">{tableData.length}</span> row{tableData.length !== 1 ? 's' : ''}
                  </div>
                </div>
              </div>
            </div>

            {/* Selected Account Details */}
            {/* {selectedAccounts.some((sel) => sel.account1 !== null || sel.account2 !== null) && (
              <div className="mb-6">
                <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-md shadow-sm border border-gray-200 dark:border-gray-600">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Selected Account Details</h3>
                  {selectedAccounts.map((sel, index) => (
                    <div key={index} className="mb-4">
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Row {index + 1}</h4>
                      {sel.account1 && (
                        <div className="mb-2">
                          <h5 className="text-xs font-medium text-gray-600 dark:text-gray-400">Account 1</h5>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm text-gray-600 dark:text-gray-400">
                            <p><strong>Description:</strong> {sel.account1.description}</p>
                            <p><strong>List ID:</strong> {sel.account1.listid}</p>
                            {(() => {
                              const current_balance = parseFloat(sel.account1.fixedAmount || '0') - parseFloat(sel.account1.paid || '0') || 0;
                              const net_debit = nets.get(sel.account1.id)?.net_debit || 0;
                              const net_credit = nets.get(sel.account1.id)?.net_credit || 0;
                              const projected_balance = current_balance + net_debit - net_credit;
                              return (
                                <>
                                  <p><strong>Current Balance:</strong> {current_balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                  <p className={projected_balance < 0 ? 'text-red-500' : ''}><strong>Projected Balance:</strong> {projected_balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                </>
                              );
                            })()}
                          </div>
                          {sel.account1.children && sel.account1.children.length > 0 && (
                            <>
                              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mt-4 mb-2">Sub-Accounts</h4>
                              {renderChildren(sel.account1.children)}
                            </>
                          )}
                        </div>
                      )}
                      {sel.account2 && (
                        <div className="mb-2">
                          <h5 className="text-xs font-medium text-gray-600 dark:text-gray-400">Account 2</h5>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm text-gray-600 dark:text-gray-400">
                            <p><strong>Description:</strong> {sel.account2.description}</p>
                            <p><strong>List ID:</strong> {sel.account2.listid}</p>
                            {(() => {
                              const current_balance = parseFloat(sel.account2.fixedAmount || '0') - parseFloat(sel.account2.paid || '0') || 0;
                              const net_debit = nets.get(sel.account2.id)?.net_debit || 0;
                              const net_credit = nets.get(sel.account2.id)?.net_credit || 0;
                              const projected_balance = current_balance + net_debit - net_credit;
                              return (
                                <>
                                  <p><strong>Current Balance:</strong> {current_balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                  <p className={projected_balance < 0 ? 'text-red-500' : ''}><strong>Projected Balance:</strong> {projected_balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                </>
                              );
                            })()}
                          </div>
                          {sel.account2.children && sel.account2.children.length > 0 && (
                            <>
                              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mt-4 mb-2">Sub-Accounts</h4>
                              {renderChildren(sel.account2.children)}
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )} */}

            <div className="flex justify-end gap-4 pt-4 border-t border-gray-200 dark:border-gray-700 mt-6">
     {isViewMode ? (
    <Button
      type="button"
      onClick={() => router.back()}  
      className="px-6 py-2.5 bg-gray-600 hover:bg-gray-700 text-white rounded-md transition-all duration-300 shadow-md hover:shadow-lg flex items-center gap-2 text-sm font-medium"
    >
      <FiX className="text-base" />
      Back
    </Button>
  ) : (
    <Button
      type="submit"
      disabled={isSubmitting}
      className="px-6 py-2.5 bg-gradient-to-r from-[#3a614c] to-[#6e997f] hover:from-[#3a614c]/90 hover:to-[#6e997f]/90 text-white rounded-md transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl flex items-center gap-2 text-sm font-medium"
    >
      {isSubmitting ? (
        <>
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          <span>Saving...</span>
        </>
      ) : (
        <>
          <FiSave className="text-base" />
          <span>{isEdit ? 'Update Voucher' : 'Create Voucher'}</span>
        </>
      )}
    </Button>
   )}
          </div>
          </form>
            </div>

        <div className="mt-4 bg-white dark:bg-gray-800 rounded-md shadow-md p-3 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300 text-sm">
              <MdInfo className="text-[#3a614c] text-lg" />
              <span>Fill in all required fields marked with an asterisk (*)</span>
            </div>
            <Link href="/vouchers" className="text-[#3a614c] hover:text-[#6e997f] text-sm font-medium transition-colors duration-200">
              Back to Vouchers
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EntryVoucherForm;