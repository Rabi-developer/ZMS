'use client';
import React, { useState, useEffect, JSX, useMemo } from 'react';
import { useForm, Controller, type UseFormSetValue, type Path } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import ABLCustomInput from '@/components/ui/ABLCustomInput';
import AblCustomDropdown from '@/components/ui/AblCustomDropdown';
import { toast } from 'react-toastify';
import { useRouter } from 'next/navigation';
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
  account1: string;
  debit1: number;
  credit1: number;
  narration: string;
  account2: string;
  debit2: number;
  credit2: number;
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
  voucherDate: z.string().min(1, 'Voucher Date is required'),
  referenceNo: z.string().optional(),
  chequeNo: z.string().optional(),
  depositSlipNo: z.string().optional(),
  paymentMode: z.string().min(1, 'Payment Mode is required'),
  bankName: z.string().optional(),
  chequeDate: z.string().optional(),
  paidTo: z.string().min(1, 'Paid To is required'),
  narration: z.string().optional(),
  description: z.string().optional(),
  tableData: z.array(
    z.object({
      account1: z.string().min(1, 'Account is required'),
      debit1: z.number().min(0, 'Debit must be non-negative').optional(),
      credit1: z.number().min(0, 'Credit must be non-negative').optional(),
      narration: z.string().optional(),
      account2: z.string().min(1, 'Account is required'),
      debit2: z.number().min(0, 'Debit must be non-negative').optional(),
      credit2: z.number().min(0, 'Credit must be non-negative').optional(),
    })
  ),
});

type VoucherFormData = z.infer<typeof voucherSchema>;

// Hierarchical Dropdown Component
interface HierarchicalDropdownProps {
  accounts: Account[];
  onSelect: (id: string, account: Account | null) => void;
  setValue: UseFormSetValue<VoucherFormData>;
  name: string;
  index?: number;
}

const HierarchicalDropdown: React.FC<HierarchicalDropdownProps> = ({ accounts, onSelect, setValue, name, index }) => {
  const [selectionPath, setSelectionPath] = useState<string[]>([]); // Tracks selected IDs at each level
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearchList, setShowSearchList] = useState(false);

  // Build a flat list of leaf accounts for fast searching
  type FlatLeaf = { id: string; label: string; pathIds: string[]; pathLabels: string[] };
  const flatLeaves: FlatLeaf[] = useMemo(() => {
    const leaves: FlatLeaf[] = [];
    const walk = (node: Account, pathIds: string[], pathLabels: string[]) => {
      const newPathIds = [...pathIds, node.id];
      const newPathLabels = [...pathLabels, node.description];
      if (!node.children || node.children.length === 0) {
        leaves.push({ id: node.id, label: newPathLabels.join(' / '), pathIds: newPathIds, pathLabels: newPathLabels });
      } else {
        node.children.forEach((child) => walk(child, newPathIds, newPathLabels));
      }
    };
    accounts.forEach((root) => walk(root, [], []));
    return leaves;
  }, [accounts]);

  const filteredLeaves = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return [] as FlatLeaf[];
    return flatLeaves
      .filter((leaf) => leaf.label.toLowerCase().includes(q))
      .slice(0, 12);
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
      if (index !== undefined) {
        setValue(`tableData.${index}.${name}` as Path<VoucherFormData>, id, { shouldValidate: true });
      } else {
        setValue(name as Path<VoucherFormData>, id, { shouldValidate: true });
      }
      onSelect(id, selectedAccount);
    } else {
      if (index !== undefined) {
        setValue(`tableData.${index}.${name}` as Path<VoucherFormData>, '' as unknown as string, { shouldValidate: true });
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

  // Build selected breadcrumb labels
  const selectionLabels = selectionPath.map((id, idx) => {
    const options = getOptionsAtLevel(idx);
    const found = options.find((a) => a.id === id);
    return found?.description || id;
  });

  const handlePickFromSearch = (leaf: FlatLeaf) => {
    setSelectionPath(leaf.pathIds);
    const selected = findAccountByPath(leaf.pathIds);
    if (index !== undefined) {
      setValue(`tableData.${index}.${name}` as Path<VoucherFormData>, leaf.id, { shouldValidate: true });
    } else {
      setValue(name as Path<VoucherFormData>, leaf.id, { shouldValidate: true });
    }
    onSelect(leaf.id, selected);
    setSearchTerm('');
    setShowSearchList(false);
  };

  const clearSelection = () => {
    setSelectionPath([]);
    if (index !== undefined) {
      setValue(`tableData.${index}.${name}` as Path<VoucherFormData>, '' as unknown as string, { shouldValidate: true });
    } else {
      setValue(name as Path<VoucherFormData>, '' as unknown as string, { shouldValidate: true });
    }
    onSelect('', null);
  };

  return (
    <div className="flex flex-col gap-2">
      {/* Search Input */}
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
              placeholder="Search account (e.g., Cash, Bank)"
              className="w-full pl-9 pr-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition"
            />
            {showSearchList && searchTerm && filteredLeaves.length > 0 && (
              <div className="absolute z-20 mt-1 w-full max-h-60 overflow-auto rounded-md border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-lg">
                {filteredLeaves.map((leaf) => (
                  <button
                    type="button"
                    key={leaf.id + leaf.label}
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
          <button
            type="button"
            onClick={clearSelection}
            className="px-3 py-2 text-xs rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Horizontal selects */}
      <div className="flex flex-row flex-wrap gap-3 overflow-x-auto py-1">
        {Array.from({ length: showLevels }).map((_, level) => {
          const options = getOptionsAtLevel(level);
          const selected = selectionPath[level] || '';
          return (
            <div key={level} className="min-w-[220px]">
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
                {level === 0 ? 'Account' : `Sub-Account ${level}`}
              </label>
              <select
                value={selected}
                onChange={(e) => handleSelect(level, e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 shadow-sm"
              >
                <option value="">Select {level === 0 ? 'Account' : 'Sub-Account'}</option>
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

      {/* Breadcrumb of selection */}
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

const EntryVoucherForm = ({ isEdit = false }: { isEdit?: boolean }) => {
  const router = useRouter();
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
      tableData: [{ account1: '', debit1: 0, credit1: 0, narration: '', account2: '', debit2: 0, credit2: 0 }],
    },
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [topLevelAccounts, setTopLevelAccounts] = useState<Account[]>([]);
  const [businessAssociates, setBusinessAssociates] = useState<DropdownOption[]>([]);
  const [selectedAccounts, setSelectedAccounts] = useState<Array<{account1: Account | null, account2: Account | null}>>([{account1: null, account2: null}]);
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

  const nets = useMemo(() => {
    const map = new Map<string, { net_debit: number; net_credit: number }>();
    tableData.forEach((row, idx) => {
      const sel = selectedAccounts[idx];
      if (sel.account1 && row.account1) {
        const id = sel.account1.id;
        const entry = map.get(id) || { net_debit: 0, net_credit: 0 };
        entry.net_debit += row.debit1 || 0;
        entry.net_credit += row.credit1 || 0;
        map.set(id, entry);
      }
      if (sel.account2 && row.account2) {
        const id = sel.account2.id;
        const entry = map.get(id) || { net_debit: 0, net_credit: 0 };
        entry.net_debit += row.debit2 || 0;
        entry.net_credit += row.credit2 || 0;
        map.set(id, entry);
      }
    });
    return map;
  }, [tableData, selectedAccounts]);

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
    if (isEdit) {
      const fetchVoucher = async () => {
        setIsLoading(true);
        const id = window.location.pathname.split('/').pop();
        if (id) {
          try {
            const response = await getSingleEntryVoucher(id);
            const voucher = response.data;

            setValue('voucherNo', voucher.voucherNo || '');
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

            const loadedTableData = (voucher.voucherDetails && voucher.voucherDetails.length
              ? voucher.voucherDetails
              : [{ account1: '', debit1: 0, credit1: 0, narration: '', account2: '', debit2: 0, credit2: 0 }]
            ).map((d: any) => ({
              account1: d.account1 || '',
              debit1: Number(d.debit1 || 0),
              credit1: Number(d.credit1 || 0),
              narration: d.narration || '',
              account2: d.account2 || '',
              debit2: Number(d.debit2 || 0),
              credit2: Number(d.credit2 || 0),
            }));
            setValue('tableData', loadedTableData);

            const loadedSelected = loadedTableData.map((row: any) => ({
              account1: findAccountById(row.account1, topLevelAccounts),
              account2: findAccountById(row.account2, topLevelAccounts),
            }));
            setSelectedAccounts(loadedSelected);
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

  const handleAccountSelect = (index: number, isFirst: boolean) => (id: string, account: Account | null) => {
    const updatedSelectedAccounts = [...selectedAccounts];
    if (isFirst) {
      updatedSelectedAccounts[index] = { ...updatedSelectedAccounts[index], account1: account };
    } else {
      updatedSelectedAccounts[index] = { ...updatedSelectedAccounts[index], account2: account };
    }
    setSelectedAccounts(updatedSelectedAccounts);
  };

  const addTableRow = () => {
    setValue('tableData', [
      ...tableData,
      { account1: '', debit1: 0, credit1: 0, narration: '', account2: '', debit2: 0, credit2: 0 },
    ]);
    setSelectedAccounts([...selectedAccounts, {account1: null, account2: null}]);
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

  const onSubmit = async (data: VoucherFormData) => {
    setIsSubmitting(true);
    try {
        // Validate net balances (uncomment check if needed)
        for (const [id, { net_debit, net_credit }] of nets.entries()) {
            const acc = findAccountById(id, topLevelAccounts);
            if (acc) {
                const current_balance = parseFloat(acc.fixedAmount || '0') - parseFloat(acc.paid || '0');
                const new_balance = current_balance + net_debit - net_credit;
                // if (new_balance < 0) {
                //     throw new Error(`Insufficient balance for account ${acc.description}. Would result in negative balance: ${new_balance}`);
                // }
            }
        }

      // // Update balances with nets
      // for (const [id, { net_debit, net_credit }] of nets.entries()) {
      //   const acc = findAccountById(id, topLevelAccounts);
      //   const type = getAccountType(id, topLevelAccounts);
      //   if (acc && type) {
      //     const new_fixed = parseFloat(acc.fixedAmount || '0') + net_debit;
      //     const new_paid = parseFloat(acc.paid || '0') + net_credit;
      //     const updateData = { ...acc, fixedAmount: new_fixed.toString(), paid: new_paid.toString() };

      //     if (type === 'assets') {
      //       await updateAblAssests(id, updateData);
      //     } else if (type === 'revenues') {
      //       await updateAblRevenue(id, updateData);
      //     } else if (type === 'liabilities') {
      //       await updateAblLiabilities(id, updateData);
      //     } else if (type === 'expenses') {
      //       await updateAblExpense(id, updateData);
      //     } else if (type === 'equities') {
      //       await updateEquality(id, updateData);
      //     }
      //   }
      // }

      // Build backend payload
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
        // audit fields may be set by backend; send empty if not available
        // createdBy: '',
        creationDate: '',
        // updatedBy: '',
        updationDate: '',
        status: 'Active',
        voucherDetails: (data.tableData || []).map((r) => ({
          account1: r.account1 || '',
          debit1: Number(r.debit1 || 0),
          credit1: Number(r.credit1 || 0),
          currentBalance1: 0,
          projectedBalance1: 0,
          narration: r.narration || '',
          account2: r.account2 || '',
          debit2: Number(r.debit2 || 0),
          credit2: Number(r.credit2 || 0),
          currentBalance2: 0,
          projectedBalance2: 0,
        })),
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-800 p-2 md:p-4 lg:p-6">
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
              />
              <ABLCustomInput
                label="Reference No"
                type="text"
                placeholder="Enter reference number"
                register={register}
                error={errors.referenceNo?.message}
                id="referenceNo"
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
                />
              )}
              <ABLCustomInput
                label="Cheque No"
                type="text"
                placeholder="Enter cheque number"
                register={register}
                error={errors.chequeNo?.message}
                id="chequeNo"
              />
              <ABLCustomInput
                label="Deposit Slip No"
                type="text"
                placeholder="Enter deposit slip number"
                register={register}
                error={errors.depositSlipNo?.message}
                id="depositSlipNo"
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
              />
            </div>

            {/* Voucher Details Table */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 mb-6">
              <div className="bg-gradient-to-r from-[#3a614c] to-[#6e997f] text-white px-4 py-3 rounded-t-lg">
                <div className="flex items-center gap-2">
                  <FaFileInvoice className="text-lg" />
                  <h3 className="text-base font-semibold">Voucher Details</h3>
                </div>
              </div>
              <div className="p-4">
                <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-600">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600">
                        <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-200 border-r border-gray-200 dark:border-gray-500 min-w-[200px]">
                          Account 1
                        </th>
                        <th className="px-4 py-3 text-right font-semibold text-gray-700 dark:text-gray-200 border-r border-gray-200 dark:border-gray-500 min-w-[120px]">
                          Debit 1
                        </th>
                        <th className="px-4 py-3 text-right font-semibold text-gray-700 dark:text-gray-200 border-r border-gray-200 dark:border-gray-500 min-w-[120px]">
                          Credit 1
                        </th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-200 border-r border-gray-200 dark:border-gray-500 min-w-[200px]">
                          Narration
                        </th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-200 border-r border-gray-200 dark:border-gray-500 min-w-[200px]">
                          Account 2
                        </th>
                        <th className="px-4 py-3 text-right font-semibold text-gray-700 dark:text-gray-200 border-r border-gray-200 dark:border-gray-500 min-w-[120px]">
                          Debit 2
                        </th>
                        <th className="px-4 py-3 text-right font-semibold text-gray-700 dark:text-gray-200 border-r border-gray-200 dark:border-gray-500 min-w-[120px]">
                          Credit 2
                        </th>
                        <th className="px-4 py-3 text-center font-semibold text-gray-700 dark:text-gray-200 min-w-[80px]">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800">
                      {tableData.map((row, index) => (
                        <tr
                          key={index}
                          className={`border-b border-gray-200 dark:border-gray-600 transition-colors ${
                            index % 2 === 0
                              ? 'bg-white dark:bg-gray-800'
                              : 'bg-gray-50 dark:bg-gray-700/50'
                          } hover:bg-gray-100 dark:hover:bg-gray-600/50`}
                        >
                          <td className="px-4 py-3 border-r border-gray-200 dark:border-gray-600 align-top">
                            <HierarchicalDropdown
                              accounts={topLevelAccounts}
                              onSelect={handleAccountSelect(index, true)}
                              setValue={setValue}
                              name="account1"
                              index={index}
                            />
                            {errors.tableData?.[index]?.account1 && (
                              <p className="text-red-500 text-xs mt-1">{errors.tableData[index].account1?.message}</p>
                            )}
                          </td>
                          <td className="px-4 py-3 border-r border-gray-200 dark:border-gray-600 align-top">
                            <input
                              {...register(`tableData.${index}.debit1`, { valueAsNumber: true })}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-500 rounded-md text-sm focus:ring-2 focus:ring-[#3a614c] focus:border-[#3a614c] dark:bg-gray-700 dark:text-white text-right transition-all duration-200"
                              placeholder="0.00"
                              type="number"
                              min="0"
                              step="0.01"
                            />
                            {errors.tableData?.[index]?.debit1 && (
                              <p className="text-red-500 text-xs mt-1">{errors.tableData[index].debit1?.message}</p>
                            )}
                          </td>
                          <td className="px-4 py-3 border-r border-gray-200 dark:border-gray-600 align-top">
                            <input
                              {...register(`tableData.${index}.credit1`, { valueAsNumber: true })}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-500 rounded-md text-sm focus:ring-2 focus:ring-[#3a614c] focus:border-[#3a614c] dark:bg-gray-700 dark:text-white text-right transition-all duration-200"
                              placeholder="0.00"
                              type="number"
                              min="0"
                              step="0.01"
                            />
                            {errors.tableData?.[index]?.credit1 && (
                              <p className="text-red-500 text-xs mt-1">{errors.tableData[index].credit1?.message}</p>
                            )}
                          </td>
                          <td className="px-4 py-3 border-r border-gray-200 dark:border-gray-600 align-top">
                            <input
                              {...register(`tableData.${index}.narration`)}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-500 rounded-md text-sm focus:ring-2 focus:ring-[#3a614c] focus:border-[#3a614c] dark:bg-gray-700 dark:text-white transition-all duration-200"
                              placeholder="Enter narration"
                            />
                            {errors.tableData?.[index]?.narration && (
                              <p className="text-red-500 text-xs mt-1">{errors.tableData[index].narration?.message}</p>
                            )}
                          </td>
                          <td className="px-4 py-3 border-r border-gray-200 dark:border-gray-600 align-top">
                            <HierarchicalDropdown
                              accounts={topLevelAccounts}
                              onSelect={handleAccountSelect(index, false)}
                              setValue={setValue}
                              name="account2"
                              index={index}
                            />
                            {errors.tableData?.[index]?.account2 && (
                              <p className="text-red-500 text-xs mt-1">{errors.tableData[index].account2?.message}</p>
                            )}
                          </td>
                          <td className="px-4 py-3 border-r border-gray-200 dark:border-gray-600 align-top">
                            <input
                              {...register(`tableData.${index}.debit2`, { valueAsNumber: true })}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-500 rounded-md text-sm focus:ring-2 focus:ring-[#3a614c] focus:border-[#3a614c] dark:bg-gray-700 dark:text-white text-right transition-all duration-200"
                              placeholder="0.00"
                              type="number"
                              min="0"
                              step="0.01"
                            />
                            {errors.tableData?.[index]?.debit2 && (
                              <p className="text-red-500 text-xs mt-1">{errors.tableData[index].debit2?.message}</p>
                            )}
                          </td>
                          <td className="px-4 py-3 border-r border-gray-200 dark:border-gray-600 align-top">
                            <input
                              {...register(`tableData.${index}.credit2`, { valueAsNumber: true })}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-500 rounded-md text-sm focus:ring-2 focus:ring-[#3a614c] focus:border-[#3a614c] dark:bg-gray-700 dark:text-white text-right transition-all duration-200"
                              placeholder="0.00"
                              type="number"
                              min="0"
                              step="0.01"
                            />
                            {errors.tableData?.[index]?.credit2 && (
                              <p className="text-red-500 text-xs mt-1">{errors.tableData[index].credit2?.message}</p>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center align-middle">
                            {tableData.length > 1 && (
                              <Button
                                type="button"
                                onClick={() => deleteTableRow(index)}
                                className="bg-red-500 hover:bg-red-600 text-white rounded-md p-2 transition-all duration-200"
                                title="Delete Row"
                              >
                                <MdDelete className="text-lg" />
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600">
                        <td className="px-4 py-3 text-right font-bold text-base">TOTALS:</td>
                        <td className="px-4 py-3 font-bold text-right text-base border-r border-gray-200 dark:border-gray-500">
                          {tableData
                            .reduce((sum, row) => sum + (row.debit1 || 0), 0)
                            .toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-3 font-bold text-right text-base border-r border-gray-200 dark:border-gray-500">
                          {tableData
                            .reduce((sum, row) => sum + (row.credit1 || 0), 0)
                            .toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-3 border-r border-gray-200 dark:border-gray-500"></td>
                        <td className="px-4 py-3 text-right font-bold text-base"></td>
                        <td className="px-4 py-3 font-bold text-right text-base border-r border-gray-200 dark:border-gray-500">
                          {tableData
                            .reduce((sum, row) => sum + (row.debit2 || 0), 0)
                            .toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-3 font-bold text-right text-base border-r border-gray-200 dark:border-gray-500">
                          {tableData
                            .reduce((sum, row) => sum + (row.credit2 || 0), 0)
                            .toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-3"></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
                <div className="mt-4 flex justify-between items-center">
                  <Button
                    type="button"
                    onClick={addTableRow}
                    className="bg-gradient-to-r from-[#3a614c] to-[#6e997f] hover:from-[#3a614c]/90 hover:to-[#6e997f]/90 text-white px-4 py-2 rounded-md transition-all duration-200 shadow-md hover:shadow-lg"
                  >
                    + Add New Row
                  </Button>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Total Rows: {tableData.length}
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

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 bg-gradient-to-r from-[#3a614c] to-[#6e997f] hover:from-[#3a614c]/90 hover:to-[#6e997f]/90 text-white rounded-md transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm shadow-sm"
              >
                <div className="flex items-center gap-2">
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <FiSave className="text-sm" />
                      <span>{isEdit ? 'Update Voucher' : 'Create Voucher'}</span>
                    </>
                  )}
                </div>
              </Button>
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