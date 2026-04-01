'use client';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useForm, Controller, useFieldArray, type UseFormSetValue, type Path } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import ABLCustomInput from '@/components/ui/ABLCustomInput';
import AblCustomDropdown from '@/components/ui/AblCustomDropdown';
import { getAllPartys } from '@/apis/party';
import { getAllSaleTexes } from '@/apis/salestexes';
import { getAllConsignment, updateConsignment } from '@/apis/consignment';
import { createReceipt, updateReceipt, getBiltyBalance } from '@/apis/receipt';
import { getAllOpeningBalance } from '@/apis/openingbalance';
import { getAllEquality, updateEquality } from '@/apis/equality';
import { getAllAblLiabilities, updateAblLiabilities } from '@/apis/ablliabilities';
import { getAllAblAssests, updateAblAssests } from '@/apis/ablAssests';
import { getAllAblExpense, updateAblExpense } from '@/apis/ablExpense';
import { getAllAblRevenue, updateAblRevenue } from '@/apis/ablRevenue';
import { toast } from 'react-toastify';
import { useRouter, useSearchParams } from 'next/navigation';
import { MdInfo } from 'react-icons/md';
import { FaFileInvoice, FaMoneyBillWave } from 'react-icons/fa';
import { FiSave, FiX, FiSearch } from 'react-icons/fi';
import Link from 'next/link';
import { numberInputHandlers } from '@/utils/numberFormat';

// Interfaces
interface DropdownOption {
  id: string;
  name: string;
}

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

interface Consignment {
  freightPaidBy: string;
  customerName: any;
  id: string;
  biltyNo: string;
  vehicleNo: string;
  biltyDate: string;
  biltyAmount: number;
  srbAmount: number;
  totalAmount: number;
  consignor: string;
  consignee: string;
  consignorName: string;
  consigneeName: string;
}

interface TableRow {
  biltyNo: string;
  consignmentId?: string;
  vehicleNo: string;
  biltyDate: string;
  biltyAmount: number;
  srbAmount: number;
  totalAmount: number;
  balance: number;
  initialBalance?: number;
  receiptAmount: number;
  isOpeningBalance?: boolean;
  openingBalanceId?: string;
  freightPaidBy?: 'consignor' | 'consignee' | null; 
  customerName?: string;
}

// Define the schema for receipt form validation
const receiptSchema = z.object({
  receiptNo: z.string().optional(),
  receiptDate: z.string().min(1, 'Receipt Date is required'),
  paymentMode: z.string().min(1, 'Payment Mode is required'),
  bankName: z.string().optional(),
  chequeNo: z.string().optional(),
  chequeDate: z.string().optional(),
  party: z.string().min(1, 'Party is required'),
  receiptAmount: z.number().min(0, 'Receipt Amount must be non-negative').optional(),
  remarks: z.string().optional(),
  items: z.array(
    z.object({
      id: z.string().optional().nullable(),
      biltyNo: z.string().optional(), // Changed from .min(1) to .optional() to allow empty rows
      consignmentId: z.string().optional(),
      vehicleNo: z.string().optional(),
      biltyDate: z.string().optional(),
      biltyAmount: z.number().optional(), // Allow any number including negative
      srbAmount: z.number().optional(), // Allow any number including negative
      totalAmount: z.number().optional(), // Allow any number including negative
      balance: z.number().optional(), // Allow any number including negative (can be negative if overpaid)
      initialBalance: z.number().optional(),
      receiptAmount: z.number().min(0, 'Receipt Amount must be non-negative').optional(),
      isOpeningBalance: z.boolean().optional(),
      openingBalanceId: z.string().optional(),
      freightPaidBy: z.enum(['consignor', 'consignee']).optional().nullable(),
      customerName: z.string().optional().nullable(),
    })
  ).refine(
    (items) => items.some(item => item.biltyNo && item.biltyNo.trim() !== ''),
    { message: 'At least one item with a Bilty No is required' }
  ),
  salesTaxOption: z.string().optional(),
  salesTaxRate: z.string().optional(),
  whtOnSbr: z.string().optional(),
});

type ReceiptFormData = z.infer<typeof receiptSchema>;

interface ReceiptFormProps {
  isEdit?: boolean;
  initialData?: Partial<ReceiptFormData> & {
    id?: string;
    isActive?: boolean;
    isDeleted?: boolean;
    createdDateTime?: string;
    createdBy?: string;
    modifiedDateTime?: string;
    modifiedBy?: string;
  };
}

// Helper functions
const normalizeAccountTree = (nodes: any[] = []): Account[] => {
  return (nodes || [])
    .filter((node) => node && typeof node === 'object')
    .map((node) => ({
      id: String(node.id ?? ''),
      listid: String(node.listid ?? node.listId ?? ''),
      description: String(node.description ?? node.name ?? ''),
      parentAccountId: node.parentAccountId ?? node.parentId ?? null,
      children: normalizeAccountTree(Array.isArray(node.children) ? node.children : []),
      dueDate: String(node.dueDate ?? ''),
      fixedAmount: String(node.fixedAmount ?? ''),
      paid: String(node.paid ?? ''),
    }))
    .filter((node) => node.id !== '');
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

// Hierarchical Dropdown Component for Receipt
interface HierarchicalDropdownProps {
  accounts: Account[];
  onSelect: (id: string, account: Account | null) => void;
  setValue: UseFormSetValue<ReceiptFormData>;
  name: string;
  initialAccountId?: string;
  disabled?: boolean;
}

const HierarchicalDropdown: React.FC<HierarchicalDropdownProps> = ({ accounts, onSelect, setValue, name, initialAccountId, disabled }) => {
  const [selectionPath, setSelectionPath] = useState<string[]>([]); // Tracks selected IDs at each level
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);

  // Debounce search term to improve performance
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

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
    if (!initialAccountId) {
      if (selectionPath.length > 0) {
        setSelectionPath([]);
      }
      return;
    }

    if (accounts.length > 0) {
      const path = buildPathToAccount(initialAccountId, accounts);
      setSelectionPath(path || []);
    }
  }, [initialAccountId, accounts, selectionPath.length]);

  // Build a flat list of leaf accounts for fast searching
  type FlatLeaf = { id: string; label: string; pathIds: string[]; pathLabels: string[]; category: string; listid: string; description: string };
  const flatLeaves: FlatLeaf[] = useMemo(() => {
    const leaves: FlatLeaf[] = [];
    const walk = (node: Account, pathIds: string[], pathLabels: string[], categoryName: string) => {
      const nodeDescription = String(node.description ?? '').trim();
      const nodeListId = String(node.listid ?? '').trim();
      const newPathIds = [...pathIds, node.id];
      const newPathLabels = [...pathLabels, nodeDescription || nodeListId || node.id];
      if (!node.children || node.children.length === 0) {
        leaves.push({ 
          id: node.id, 
          label: newPathLabels.join(' / '), 
          pathIds: newPathIds, 
          pathLabels: newPathLabels,
          category: categoryName,
          listid: nodeListId,
          description: nodeDescription
        });
      } else {
        node.children.forEach((child) => walk(child, newPathIds, newPathLabels, categoryName));
      }
    };
    accounts.forEach((root) => {
      if (root.children && root.children.length > 0) {
        root.children.forEach((child) => walk(child, [], [], root.description));
      }
    });
    return leaves;
  }, [accounts]);

  const filteredLeaves = useMemo(() => {
    const q = debouncedSearchTerm.trim().toLowerCase();
    if (!q) return [];
    
    // Sort and filter results
    const results = flatLeaves
      .filter((leaf) => {
        const descMatch = String(leaf.description ?? '').toLowerCase().includes(q);
        const idMatch = String(leaf.listid ?? '').toLowerCase().includes(q);
        // Only match label if it's a very specific search or if we have no direct matches
        const labelMatch = q.length > 2 && String(leaf.label ?? '').toLowerCase().includes(q);
        
        return descMatch || idMatch || labelMatch;
      })
      .sort((a, b) => {
        const aDirect = String(a.description ?? '').toLowerCase().includes(q) || String(a.listid ?? '').toLowerCase().includes(q);
        const bDirect = String(b.description ?? '').toLowerCase().includes(q) || String(b.listid ?? '').toLowerCase().includes(q);
        if (aDirect && !bDirect) return -1;
        if (!aDirect && bDirect) return 1;
        return 0;
      });

    // Limit and de-duplicate
    const seen = new Set();
    return results.filter(leaf => {
      const duplicate = seen.has(leaf.id);
      seen.add(leaf.id);
      return !duplicate;
    }).slice(0, 50); // Show only top 50 matches for performance
  }, [debouncedSearchTerm, flatLeaves]);

  const handlePickFromSearch = (leaf: FlatLeaf) => {
    setSelectionPath(leaf.pathIds);
    const selected = findAccountById(leaf.id, accounts);
    setValue(name as Path<ReceiptFormData>, leaf.id, { shouldValidate: true });
    onSelect(leaf.id, selected);
    setSearchTerm('');
    setShowModal(false);
  };

  const clearSelection = () => {
    setSelectionPath([]);
    setValue(name as Path<ReceiptFormData>, '' as unknown as string, { shouldValidate: true });
    onSelect('', null);
  };

  const selectedAccount = selectionPath.length > 0 ? findAccountById(selectionPath[selectionPath.length - 1], accounts) : null;

  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={selectedAccount ? `${selectedAccount.listid || ''} ${selectedAccount.description || ''}`.trim() : ''}
              onFocus={() => !disabled && setShowModal(true)}
              onClick={() => !disabled && setShowModal(true)}
              placeholder="Click to search and select account"
              className="w-full pl-9 pr-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition cursor-pointer"
              readOnly
              disabled={disabled}
            />
          </div>
          <button
            type="button"
            onClick={clearSelection}
            disabled={disabled}
            className="px-3 py-2 text-xs rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
          >
            Reset
          </button>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-3xl max-h-[80vh] flex flex-col">
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

            <div className="p-4 border-b border-gray-200 dark:border-gray-600">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search accounts by name or ID..."
                  className="w-full pl-9 pr-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600"
                  autoFocus
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="flex flex-col">
                {filteredLeaves.map((leaf) => (
                  <button
                    key={leaf.id}
                    type="button"
                    onClick={() => handlePickFromSearch(leaf)}
                    className="flex flex-col px-6 py-3 w-full hover:bg-emerald-50 dark:hover:bg-emerald-900/10 text-left transition border-b border-gray-100 dark:border-gray-700/50 last:border-0 group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex-shrink-0">
                        <span className="inline-flex items-center justify-center px-2 py-1 rounded bg-[#f0f9f4] dark:bg-emerald-900/30 border border-emerald-100 dark:border-emerald-800 text-[11px] font-mono font-medium text-[#10b981] dark:text-emerald-400 min-w-[100px] text-center">
                          {leaf.listid}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-200 group-hover:text-emerald-700 dark:group-hover:text-emerald-300">
                          {leaf.description}
                        </span>
                        <span className="text-[11px] text-gray-400 dark:text-gray-500">
                          {leaf.label}
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
                {searchTerm.trim() === '' && (
                  <div className="py-12 text-center text-gray-500 dark:text-gray-400">
                    Start typing to search bank accounts
                  </div>
                )}
                {searchTerm.trim() !== '' && searchTerm !== debouncedSearchTerm && (
                  <div className="py-12 text-center text-gray-500 dark:text-gray-400">
                    Searching...
                  </div>
                )}
                {searchTerm.trim() !== '' && searchTerm === debouncedSearchTerm && filteredLeaves.length === 0 && (
                  <div className="py-12 text-center text-gray-500 dark:text-gray-400">
                    No accounts found matching "{searchTerm}"
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ReceiptForm = ({ isEdit = false, initialData }: ReceiptFormProps) => {
  const router = useRouter();
    const searchParams = useSearchParams();

  const emptyItemRow = {
    id: null,
    biltyNo: '',
    consignmentId: '',
    vehicleNo: '',
    biltyDate: '',
    biltyAmount: 0,
    srbAmount: 0,
    totalAmount: 0,
    balance: 0,
    initialBalance: 0,
    receiptAmount: 0,
    isOpeningBalance: false,
    openingBalanceId: '',
  };

  // Check if we're in view mode
  const isViewMode = searchParams.get('mode') === 'view';
  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<ReceiptFormData>({
    resolver: zodResolver(receiptSchema),
    defaultValues: initialData
      ? {
          receiptNo: initialData.receiptNo || '',
          receiptDate: initialData.receiptDate || '',
          paymentMode: initialData.paymentMode || '',
          bankName: initialData.bankName || '',
          chequeNo: initialData.chequeNo || '',
          chequeDate: initialData.chequeDate || '',
          party: initialData.party || '',
          receiptAmount: initialData.receiptAmount || 0,
          remarks: initialData.remarks || '',
          items: initialData.items?.length
            ? initialData.items.map(row => ({ ...row, initialBalance: row.initialBalance || row.balance || 0, isOpeningBalance: row.isOpeningBalance || false, openingBalanceId: row.openingBalanceId || '' }))
            : [{ ...emptyItemRow }],
          salesTaxOption: initialData.salesTaxOption || 'without',
          salesTaxRate: initialData.salesTaxRate || '',
          whtOnSbr: initialData.whtOnSbr || '',
        }
      : {
          receiptNo: '',
          receiptDate: '',
          paymentMode: '',
          bankName: '',
          chequeNo: '',
          chequeDate: '',
          party: '',
          receiptAmount: 0,
          remarks: '',
          items: [{ ...emptyItemRow }],
          salesTaxOption: 'without',
          salesTaxRate: '',
          whtOnSbr: '',
        },
  });
  const { append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [idFocused, setIdFocused] = useState(false);
  const [parties, setParties] = useState<DropdownOption[]>([]);
  const [saleTaxes, setSaleTaxes] = useState<DropdownOption[]>([]);
  const [selectedSaleTaxes,setselectedSaleTaxes] = useState('');
  const [selectedWHTTaxes,setselectedWHTTaxes] = useState('');
  const [consignments, setConsignments] = useState<Consignment[]>([]);
  const [openingBalances, setOpeningBalances] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [showConsignmentPopup, setShowConsignmentPopup] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectingConsignment, setSelectingConsignment] = useState(false);
  const consignmentTableRef = useRef<HTMLDivElement | null>(null);

  const paymentModes: DropdownOption[] = [
    { id: 'Cash', name: 'Cash' },
    { id: 'Cheque', name: 'Cheque' },
    { id: 'Bank Transfer', name: 'Bank Transfer' },
  ];
  const salesTaxOptions: DropdownOption[] = [
    { id: 'with', name: 'With Sales Tax' },
    { id: 'without', name: 'Without Sales Tax' },
  ];

  const items = watch('items');
  const salesTaxOption = watch('salesTaxOption');
  const salesTaxRate = watch('salesTaxRate');
  const whtOnSbr = watch('whtOnSbr');
  const paymentMode = watch('paymentMode');

  // Initialize selected tax percentages when salesTaxRate or whtOnSbr changes
  useEffect(() => {
    if (salesTaxRate && saleTaxes.length > 0) {
      const selectedTax = saleTaxes.find(tax => tax.id === salesTaxRate);
      if (selectedTax && 'percentage' in selectedTax) {
        setselectedSaleTaxes(selectedTax.percentage as string);
      }
    }
  }, [salesTaxRate, saleTaxes]);

  useEffect(() => {
    if (whtOnSbr && saleTaxes.length > 0) {
      const selectedTax = saleTaxes.find(tax => tax.id === whtOnSbr);
      if (selectedTax && 'percentage' in selectedTax) {
        setselectedWHTTaxes(selectedTax.percentage as string);
      }
    }
  }, [whtOnSbr, saleTaxes]);

  // Filter consignments and opening balances based on search query
  const filteredConsignments = consignments.filter((consignment) =>
    `${consignment.biltyNo} ${consignment.id}`.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const filteredOpeningBalances = openingBalances.filter((ob) =>
    `${ob.biltyNo} ${ob.vehicleNo} ${ob.customer}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Helper function to resolve party ID to name
  const resolvePartyName = (partyId: string, partyData: any[]): string => {
    if (!partyId) return '';
    const party = partyData.find(p => p.id === partyId);
    return party ? party.name : partyId;
  };

  // Fetch dropdown data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [partyRes, saleTaxRes, consignmentRes, openingBalanceRes, equalityRes, liabilitiesRes, assetsRes, expenseRes, revenueRes] = await Promise.all([
          getAllPartys(1, 1000),
          getAllSaleTexes(1, 1000),
          getAllConsignment(1, 1000),
          getAllOpeningBalance(1, 10000),
          getAllEquality(1, 1000),
          getAllAblLiabilities(1, 1000),
          getAllAblAssests(1, 1000),
          getAllAblExpense(1, 1000),
          getAllAblRevenue(1, 1000),
        ]);
        const partyData = partyRes.data.map((p: any) => ({ id: p.id, name: p.name }));
        setParties(partyData);
        setSaleTaxes(saleTaxRes.data.map((t: any) => ({ id: t.id, name: t.taxName, percentage: t.percentage })));
        
        const hierarchicalAccounts: Account[] = [
          { id: 'equality', listid: 'EQ', description: 'Equality', parentAccountId: null, children: normalizeAccountTree(equalityRes.data), dueDate: '', fixedAmount: '', paid: '' },
          { id: 'liabilities', listid: 'LB', description: 'Liabilities', parentAccountId: null, children: normalizeAccountTree(liabilitiesRes.data), dueDate: '', fixedAmount: '', paid: '' },
          { id: 'assets', listid: 'AS', description: 'Assets', parentAccountId: null, children: normalizeAccountTree(assetsRes.data), dueDate: '', fixedAmount: '', paid: '' },
          { id: 'expense', listid: 'EX', description: 'Expense', parentAccountId: null, children: normalizeAccountTree(expenseRes.data), dueDate: '', fixedAmount: '', paid: '' },
          { id: 'revenue', listid: 'RV', description: 'Revenue', parentAccountId: null, children: normalizeAccountTree(revenueRes.data), dueDate: '', fixedAmount: '', paid: '' },
        ];
        setAccounts(hierarchicalAccounts);

        setConsignments(
          consignmentRes.data.map((item: any) => {
            const consignorName = resolvePartyName(item.consignor, partyData) || item.consignorName || 'Unknown Consignor';
            const consigneeName = resolvePartyName(item.consignee, partyData) || item.consigneeName || 'Unknown Consignee';
            
            // Check if freightFrom is empty or not selected
            const freightFromRaw = item.freightFrom?.trim();
            const hasFreightFrom = freightFromRaw && freightFromRaw !== '';
            
            // Use freightFrom field and normalize to lowercase
            const freightFrom = hasFreightFrom ? freightFromRaw.toLowerCase() : null;
            
            // Determine customer name based on who is paying the freight
            let customerName = 'Unselected Freight From';
            if (hasFreightFrom) {
              customerName = freightFrom === 'consignee' ? consigneeName : consignorName;
            }
            
            return {
              id: item.id,
              biltyNo: item.biltyNo || item.bilty || item.id,
              vehicleNo: item.vehicleNo || item.orderNo || 'Unknown',
              biltyDate: item.biltyDate || item.consignmentDate || new Date().toISOString().split('T')[0],
              biltyAmount: item.totalAmount || 0,
              srbAmount: item.sprAmount || 0,
              totalAmount: item.totalAmount || 0,
              freightPaidBy: freightFrom,
              consignor: item.consignor,
              consignee: item.consignee,
              consignorName: consignorName,
              consigneeName: consigneeName,
              customerName: customerName,
            };
          })   
        );
        
        // Process opening balance entries for customers (debit > 0)
        const obEntries: any[] = [];
        (openingBalanceRes?.data || []).forEach((ob: any) => {
          (ob.openingBalanceEntrys || []).forEach((entry: any) => {
            if (entry.debit > 0 && entry.customer) {
              obEntries.push({
                id: `OB-${ob.openingNo}-${entry.id || entry.customer}`,
                biltyNo: entry.biltyNo || `OB-${ob.openingNo}`,
                vehicleNo: entry.vehicleNo || 'N/A',
                biltyDate: entry.biltyDate || ob.openingDate,
                biltyAmount: entry.debit || 0,
                srbAmount: 0,
                totalAmount: entry.debit || 0,
                isOpeningBalance: true,
                openingBalanceId: entry.id,
                openingBalanceNo: ob.openingNo,
                customer: entry.customer,
                city: entry.city,
              });
            }
          });
        });
        setOpeningBalances(obEntries);
      } catch (error) {
        toast.error('Failed to load data');
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // Generate receiptNo for new receipt
  useEffect(() => {
    if (!isEdit) {
      const generateReceiptNo = () => {
        const prefix = 'REC';
        const timestamp = Date.now().toString().slice(-6);
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return `${prefix}-${timestamp}-${random}`;
      };
      setValue('receiptNo', generateReceiptNo());
    }
  }, [isEdit, setValue]);

  // Populate form with initialData in edit mode
  useEffect(() => {
    if (isEdit && initialData) {
      reset({
        receiptNo: String(initialData.receiptNo || ''),
        receiptDate: initialData.receiptDate || '',
        paymentMode: initialData.paymentMode || '',
        bankName: initialData.bankName || '',
        chequeNo: initialData.chequeNo || '',
        chequeDate: initialData.chequeDate || '',
        party: initialData.party || '',
        receiptAmount: initialData.receiptAmount || 0,
        remarks: initialData.remarks || '',
        items: initialData.items?.length
          ? initialData.items.map(row => ({
            id: row.id || null,
              biltyNo: row.biltyNo || '',
              consignmentId: row.consignmentId || '',
              vehicleNo: row.vehicleNo || '',
              biltyDate: row.biltyDate || '',
              biltyAmount: row.biltyAmount || 0,
              srbAmount: row.srbAmount || 0,
              totalAmount: row.totalAmount || 0,
              balance: row.balance || 0,
              // Calculate initialBalance: current balance + current receiptAmount = original balance before this receipt
              initialBalance: (row.balance || 0) + (row.receiptAmount || 0),
              receiptAmount: row.receiptAmount || 0,
            }))
          : [{ ...emptyItemRow }],
        salesTaxOption: initialData.salesTaxOption || 'without',
        salesTaxRate: initialData.salesTaxRate || '',
        whtOnSbr: initialData.whtOnSbr || '',
      });
    }
  }, [isEdit, initialData, reset]);

  // Update table calculations
  useEffect(() => {
    const updateditems = items.map((row) => {
      // Calculate totalAmount
      // In edit mode with existing biltyNo, preserve the original totalAmount
      let totalAmount;
      if (isEdit && row.biltyNo && row.initialBalance) {
        // Use initialBalance as the original total amount
        totalAmount = row.initialBalance;
      } else {
        // Calculate from biltyAmount + srbAmount
        totalAmount = (row.biltyAmount || 0) + (row.srbAmount || 0);
      }
      
      // Calculate balance: totalAmount - receiptAmount
      const balance = totalAmount - (row.receiptAmount || 0);
      
      return { ...row, totalAmount, balance };
    });
    
    // Only update if values actually changed to prevent infinite loop
    const hasChanged = items.some((row, index) => {
      const updated = updateditems[index];
      return row.totalAmount !== updated.totalAmount || row.balance !== updated.balance;
    });
    
    if (hasChanged) {
      setValue('items', updateditems, { shouldValidate: false });
    }

    const totalReceiptAmount = updateditems.reduce((sum, row) => sum + (row.receiptAmount || 0), 0);
    const currentReceiptAmount = watch('receiptAmount');
    if (currentReceiptAmount !== totalReceiptAmount) {
      setValue('receiptAmount', totalReceiptAmount, { shouldValidate: false });
    }
  }, [items, setValue, watch, isEdit]);

  const selectConsignment = async (index: number, consignment: any) => {
  setSelectingConsignment(true);
  try {
    const balanceData = await getBiltyBalance(consignment.biltyNo);
    const remainingBalance = balanceData.balance || balanceData.remainingBalance || 0;
    if (remainingBalance <= 0) {
      toast.error('This bilty has no remaining balance. Cannot create receipt.');
      return;
    }

    // Check if freightFrom is selected
    const freightFromRaw = consignment.freightPaidBy;
    const hasFreightFrom = freightFromRaw && freightFromRaw !== null;
    
    // Determine who paid freight and set customer name correctly
    let customerName = 'Unselected Freight From';
    let freightPaidBy = null;
    
    if (hasFreightFrom) {
      freightPaidBy = freightFromRaw;
      customerName =
        freightFromRaw === 'consignee'
          ? consignment.consigneeName || consignment.consignee || 'Unknown Consignee'
          : consignment.consignorName || consignment.consignor || 'Unknown Consignor';
    }

    setValue(`items.${index}.biltyNo`, consignment.biltyNo, { shouldValidate: true });
    setValue(`items.${index}.consignmentId`, consignment.id, { shouldValidate: true });
    setValue(`items.${index}.vehicleNo`, consignment.vehicleNo, { shouldValidate: true });
    setValue(`items.${index}.biltyDate`, consignment.biltyDate, { shouldValidate: true });
    setValue(`items.${index}.biltyAmount`, consignment.totalAmount, { shouldValidate: true });
    setValue(`items.${index}.srbAmount`, consignment.srbAmount, { shouldValidate: true });
    setValue(`items.${index}.balance`, remainingBalance, { shouldValidate: true });
    setValue(`items.${index}.initialBalance`, remainingBalance, { shouldValidate: true });

    setValue(`items.${index}.freightPaidBy`, freightPaidBy);
    setValue(`items.${index}.customerName`, customerName);

    setShowConsignmentPopup(null);
    setSearchQuery('');
  } catch (error) {
    toast.error('Failed to fetch bilty balance');
    console.error('Error:', error);
  } finally {
    setSelectingConsignment(false);
  }
};

  const selectOpeningBalance = async (index: number, ob: any) => {
    try {
      const biltyNo = ob.biltyNo || '';

      // Check balance for opening balance using getBiltyBalance
      if (biltyNo) {
        try {
          // Check bilty balance for this opening balance
          const balanceData = await getBiltyBalance(biltyNo);
          const remainingBalance = balanceData.balance || balanceData.remainingBalance || 0;
          
          console.log('Opening Balance - getBiltyBalance Response:', {
            biltyNo,
            balanceData,
            remainingBalance
          });

          // If balance is 0 or negative, show error and prevent selection
          if (remainingBalance <= 0) {
            toast.error(`This opening balance has been fully paid. No remaining balance to receive.`);
            console.log('Opening Balance fully paid - preventing selection');
            return; // Don't allow selection
          }

          // If balance > 0, use that balance
          console.log('✓ Opening Balance has remaining balance:', remainingBalance);
          toast.info(`Opening Balance: Remaining balance is ${remainingBalance.toLocaleString()}.`);
          
          setValue(`items.${index}.biltyNo`, ob.biltyNo, { shouldValidate: true });
          setValue(`items.${index}.consignmentId`, ob.id, { shouldValidate: true });
          setValue(`items.${index}.vehicleNo`, ob.vehicleNo, { shouldValidate: true });
          setValue(`items.${index}.biltyDate`, ob.biltyDate, { shouldValidate: true });
          setValue(`items.${index}.biltyAmount`, remainingBalance, { shouldValidate: true });
          setValue(`items.${index}.srbAmount`, 0, { shouldValidate: true });
          setValue(`items.${index}.balance`, remainingBalance, { shouldValidate: true });
          setValue(`items.${index}.initialBalance`, remainingBalance, { shouldValidate: true });
          setValue(`items.${index}.isOpeningBalance`, true, { shouldValidate: true });
          setValue(`items.${index}.openingBalanceId`, ob.openingBalanceId, { shouldValidate: true });
          setShowConsignmentPopup(null);
          setSearchQuery('');
          return;
        } catch (balanceError) {
          console.warn('Opening Balance: Balance check failed, continuing with normal flow:', balanceError);
          // Continue with normal flow if balance check fails
        }
      }

      // No balance check or balance check failed - use opening balance amount
      console.log('Opening Balance: Using original amount');
      setValue(`items.${index}.biltyNo`, ob.biltyNo, { shouldValidate: true });
      setValue(`items.${index}.consignmentId`, ob.id, { shouldValidate: true });
      setValue(`items.${index}.vehicleNo`, ob.vehicleNo, { shouldValidate: true });
      setValue(`items.${index}.biltyDate`, ob.biltyDate, { shouldValidate: true });
      setValue(`items.${index}.biltyAmount`, ob.totalAmount, { shouldValidate: true });
      setValue(`items.${index}.srbAmount`, 0, { shouldValidate: true });
      setValue(`items.${index}.balance`, ob.totalAmount, { shouldValidate: true });
      setValue(`items.${index}.initialBalance`, ob.totalAmount, { shouldValidate: true });
      setValue(`items.${index}.isOpeningBalance`, true, { shouldValidate: true });
      setValue(`items.${index}.openingBalanceId`, ob.openingBalanceId, { shouldValidate: true });
      setShowConsignmentPopup(null);
      setSearchQuery('');
    } catch (error) {
      console.error('Error selecting opening balance:', error);
      toast.error('An error occurred while selecting opening balance');
    }
  };

  const addTableRow = (e?: React.MouseEvent<HTMLButtonElement>) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    append({ ...emptyItemRow });

    // Keep newest row visible when list is long
    setTimeout(() => {
      if (consignmentTableRef.current) {
        consignmentTableRef.current.scrollTop = consignmentTableRef.current.scrollHeight;
      }
    }, 0);
  };

  const removeTableRow = (index: number) => {
    if (items.length > 1) {
      remove(index);
    }
  };

  const onSubmit = async (data: ReceiptFormData) => {
    console.log('=== onSubmit called ===');
    console.log('Form data:', data);
    console.log('isEdit:', isEdit);
    console.log('initialData:', initialData);
    
    // Only validate receipt amounts against balances in create mode
    // In edit mode, the balance calculation is different because we're updating existing receipts
    if (!isEdit) {
      for (const row of data.items) {
        if (row.biltyNo && (row.receiptAmount || 0) > (row.initialBalance || 0)) {
          console.log('Validation failed for bilty:', row.biltyNo);
          toast.error(`Receipt amount for bilty ${row.biltyNo} exceeds the remaining balance.`);
          return;
        }
      }
    }

    console.log('Validation passed, setting isSubmitting to true');
    setIsSubmitting(true);
    
    try {
      // Ensure we have a valid ID for edit mode
      const receiptId = isEdit ? (initialData?.id || '') : undefined;
      console.log('Receipt ID:', receiptId);
      
      if (isEdit && !receiptId) {
        console.error('Missing receipt ID in edit mode');
        toast.error('Receipt ID is missing. Cannot update receipt.');
        setIsSubmitting(false);
        return;
      }

      const payload: any = {
        ...(receiptId && { id: receiptId }), // Only include id if it exists
        isActive: initialData?.isActive ?? true,
        isDeleted: initialData?.isDeleted ?? false,
        ...(isEdit && initialData?.createdDateTime && { createdDateTime: initialData.createdDateTime }),
        ...(isEdit && initialData?.createdBy && { createdBy: initialData.createdBy }),
        ...(isEdit && { modifiedDateTime: new Date().toISOString() }),
        receiptNo: String(data.receiptNo) || `REC${Date.now()}${Math.floor(Math.random() * 1000)}`,
        receiptDate: data.receiptDate,
        paymentMode: data.paymentMode,
        bankName: data.bankName || '',
        chequeNo: data.chequeNo || '',
        chequeDate: data.chequeDate || '',
        party: data.party,
        receiptAmount: data.receiptAmount || 0,
        remarks: data.remarks || '',
        items: data.items
          .filter(row => row.biltyNo && row.biltyNo.trim() !== '') // Filter out empty rows
          .map(row => {
            // Calculate correct balance for payload
            const totalAmount = row.totalAmount || 0;
            const receiptAmount = row.receiptAmount || 0;
            const calculatedBalance = totalAmount - receiptAmount;
            
            const item: any = {
              biltyNo: row.biltyNo || '',
              consignmentId: row.consignmentId || '',
              vehicleNo: row.vehicleNo || '',
              biltyDate: row.biltyDate || '',
              biltyAmount: row.biltyAmount || 0,
              srbAmount: row.srbAmount || 0,
              totalAmount: totalAmount,
              balance: calculatedBalance, // Use calculated balance
              receiptAmount: receiptAmount,
              isOpeningBalance: row.isOpeningBalance || false,
              openingBalanceId: row.openingBalanceId || '',
            };
            // Only include id if it's a valid GUID (not null, not empty string)
            if (row.id && row.id.trim() !== '' && row.id !== 'null') {
              item.id = row.id;
            }
            
            console.log('Item payload:', {
              biltyNo: item.biltyNo,
              totalAmount: item.totalAmount,
              receiptAmount: item.receiptAmount,
              calculatedBalance: item.balance,
              originalBalance: row.balance
            });
            
            return item;
          }),
        salesTaxOption: data.salesTaxOption || 'without',
        salesTaxRate: data.salesTaxRate || '',
        whtOnSbr: data.whtOnSbr || '',
      };

      console.log('Payload prepared:', payload);
      console.log('About to call API...');

      // Save receipt
      if (isEdit) {
        console.log('Calling updateReceipt API...');
        const response = await updateReceipt(payload);
        console.log('Update response:', response);
        toast.success('Receipt updated successfully');
      } else {
        console.log('Calling createReceipt API...');
        const response = await createReceipt(payload);
        console.log('Create response:', response);
        toast.success('Receipt created successfully');
      }

      console.log('API call successful, navigating to /receipt');
      // Navigate back to receipt list after successful save
      router.push('/receipt');
    } catch (error) {
      console.error('Error in onSubmit:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Failed to ${isEdit ? 'update' : 'create'} receipt: ${errorMessage}`);
    } finally {
      console.log('Setting isSubmitting to false');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-800 p-1 sm:p-2 md:p-4">
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

        <div className="w-full lg:max-w-6xl mx-auto bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          {!isViewMode && (
          <div className="bg-gradient-to-r from-[#3a614c] to-[#6e997f] text-white px-3 sm:px-4 py-2 sm:py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="bg-white/20 p-1 sm:p-1.5 rounded-md">
                  <FaFileInvoice className="text-base sm:text-lg" />
                </div>
                <div>
                  <h1 className="text-base sm:text-lg font-semibold">{isEdit ? 'Edit Receipt' : 'Add New Receipt'}</h1>
                  <p className="text-white/80 text-xs hidden sm:block">{isEdit ? 'Update receipt record' : 'Create a new receipt record'}</p>
                </div>
              </div>
              <Link href="/receipt">
                <Button
                  type="button"
                  className="bg-white/10 hover:bg-white/20 text-white rounded-md transition-all duration-200 border border-white/20 px-2 sm:px-3 py-1 text-xs sm:text-sm"
                >
                  <FiX className="sm:mr-1" /> <span className="hidden sm:inline">Cancel</span>
                </Button>
              </Link>
            </div>
          </div>
          )}
          {isViewMode && (
        <div className="m-3 sm:m-6 p-3 sm:p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg sm:rounded-xl flex items-center gap-3">
          <div>
            <p className="font-medium text-sm sm:text-base text-amber-800 dark:text-amber-200">View Only Mode</p>
            <p className="text-xs sm:text-sm text-amber-700 dark:text-amber-300 mt-1">
              This Receipt record is read-only. No changes can be made.
            </p>
          </div>
        </div>
      )}

          <form onSubmit={handleSubmit(onSubmit, (errors) => {
            console.log('Form validation errors:', errors);
            console.log('Current form values:', watch());
            toast.error('Please fix form validation errors');
          })} className="p-2 sm:p-4">
            {Object.keys(errors).length > 0 && (
              <div className="mb-3 sm:mb-4 p-3 sm:p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <h4 className="text-red-800 dark:text-red-200 font-semibold mb-2 text-sm sm:text-base">Form Validation Errors:</h4>
                <ul className="list-disc list-inside text-xs sm:text-sm text-red-700 dark:text-red-300">
                  {Object.entries(errors).map(([key, error]: [string, any]) => {
                    if (key === 'items' && Array.isArray(error)) {
                      return error.map((itemError, index) => 
                        itemError ? (
                          <li key={`${key}-${index}`}>
                            Item {index + 1}: {Object.entries(itemError).map(([field, err]: [string, any]) => 
                              `${field}: ${err?.message || 'Invalid'}`
                            ).join(', ')}
                          </li>
                        ) : null
                      );
                    }
                    return (
                      <li key={key}>
                        {key}: {error?.message || 'Invalid value'}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-4 px-2 sm:px-0">
              <div className="relative">
                <ABLCustomInput
                  label="Receipt #"
                  type="text"
                  placeholder={isEdit ? 'Receipt No' : 'Auto-generated'}
                  register={register}
                  error={errors.receiptNo?.message}
                  id="receiptNo"
                  disabled
                  onFocus={() => setIdFocused(true)}
                  onBlur={() => setIdFocused(false)}
                />
                {idFocused && (
                  <div className="absolute -top-8 left-0 bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded shadow-lg z-10">
                    Auto-generated
                  </div>
                )}
              </div>
              <ABLCustomInput
                label="Receipt Date"
                type="date"
                register={register}
                error={errors.receiptDate?.message}
                id="receiptDate"
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
                  />
                )}
                disabled={isViewMode}
              />
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Bank Name</label>
                <Controller
                  name="bankName"
                  control={control}
                  render={({ field }) => (
                    <HierarchicalDropdown
                      accounts={accounts}
                      onSelect={(id) => field.onChange(id)}
                      setValue={setValue}
                      name="bankName"
                      initialAccountId={field.value}
                      disabled={isViewMode}
                    />
                  )}
                />
                {errors.bankName && (
                  <p className="text-xs text-red-500 mt-1">{errors.bankName.message}</p>
                )}
              </div>
              <ABLCustomInput
                label="Cheque #"
                type="text"
                placeholder="Enter cheque number"
                register={register}
                error={errors.chequeNo?.message}
                id="chequeNo"
                disabled={isViewMode}
              />
              <ABLCustomInput
                label="Cheque Date"
                type="date"
                register={register}
                error={errors.chequeDate?.message}
                id="chequeDate"
                disabled={isViewMode}
              />
              <Controller
                name="party"
                control={control}
                render={({ field }) => (
                  <AblCustomDropdown
                    label="Party"
                    options={parties}
                    selectedOption={field.value || ''}
                    onChange={field.onChange}
                    error={errors.party?.message}
                    disabled={isViewMode}
                  />
                )}
              />
              <ABLCustomInput
                label="Receipt Amount"
                type="number"
                placeholder="Auto-calculated"
                register={register}
                error={errors.receiptAmount?.message}
                id="receiptAmount"
                disabled
                
                
              />
              <ABLCustomInput
                label="Remarks"
                type="text"
                placeholder="Enter remarks"
                register={register}
                error={errors.remarks?.message}
                id="remarks"
                disabled={isViewMode}
              />
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 mb-4 sm:mb-6">
              <div className="bg-gradient-to-r from-[#3a614c] to-[#6e997f] text-white px-3 sm:px-4 py-2 sm:py-3 rounded-t-lg">
                <div className="flex items-center gap-2">
                  <FaMoneyBillWave className="text-base sm:text-lg" />
                  <h3 className="text-sm sm:text-base font-semibold">Consignment Details</h3>
                </div>
              </div>

              <div className="p-2 sm:p-4">
                <div
                  ref={consignmentTableRef}
                  className="overflow-x-auto overflow-y-auto max-h-[420px] rounded-lg border border-gray-200 dark:border-gray-600 -mx-4 sm:mx-0"
                  style={{ WebkitOverflowScrolling: 'touch' }}
                >
                  <div className="min-w-[1200px]">
                  <table className="w-full text-sm">
                    <thead className='sticky top-0 z-10'>
                      <tr className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600">
                        <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-200 border-r border-gray-200 dark:border-gray-500 min-w-[120px]">
                          Bilty #
                        </th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-200 border-r border-gray-200 dark:border-gray-500 min-w-[100px]">
                          Vehicle No
                        </th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-200 border-r border-gray-200 dark:border-gray-500 min-w-[110px]">
                          Bilty Date
                        </th>
                        <th className="px-4 py-3 text-right font-semibold text-gray-700 dark:text-gray-200 border-r border-gray-200 dark:border-gray-500 min-w-[120px]">
                          Bilty Amount
                        </th>
                        <th className="px-4 py-3 text-right font-semibold text-gray-700 dark:text-gray-200 border-r border-gray-200 dark:border-gray-500 min-w-[120px]">
                          SRB Amount
                        </th>
                        <th className="px-4 py-3 text-right font-semibold text-gray-700 dark:text-gray-200 border-r border-gray-200 dark:border-gray-500 min-w-[120px]">
                          Total Amount
                        </th>
                        <th className="px-4 py-3 text-right font-semibold text-gray-700 dark:text-gray-200 border-r border-gray-200 dark:border-gray-500 min-w-[100px]">
                          Balance
                        </th>
                        <th className="px-4 py-3 text-right font-semibold text-gray-700 dark:text-gray-200 min-w-[130px]">
                          Receipt Amount
                        </th>
                        <th className="px-4 py-3 text-right font-semibold text-gray-700 dark:text-gray-200 min-w-[100px]">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800">
                      {items.map((row, index) => (
                        <tr key={index} className="border-b border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                          <td className="px-4 py-3 border-r border-gray-200 dark:border-gray-600">
                            <Button
                              type="button"
                              onClick={() => setShowConsignmentPopup(index)}
                              className="w-full px-3 py-2 bg-[#3a614c] hover:bg-[#3a614c]/90 text-white text-sm rounded-md transition-all duration-200 shadow-sm hover:shadow-md whitespace-nowrap"
                              disabled={isViewMode}
                            >
                              {row.biltyNo || 'Select Bilty'}
                              {row.isOpeningBalance && (
                                <span className="ml-2 text-xs bg-amber-500 text-white px-2 py-0.5 rounded">OB</span>
                              )}
                            </Button>
                            {errors.items?.[index]?.biltyNo && (
                              <p className="text-red-500 text-xs mt-1">{errors.items[index].biltyNo.message}</p>
                            )}
                          </td>
                          <td className="px-4 py-3 border-r border-gray-200 dark:border-gray-600">
                            <input
                              {...register(`items.${index}.vehicleNo`)}
                              disabled
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-500 rounded-md text-sm bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 focus:outline-none"
                              placeholder="Vehicle No"
                            />
                          </td>
                          <td className="px-4 py-3 border-r border-gray-200 dark:border-gray-600">
                            <input
                              {...register(`items.${index}.biltyDate`)}
                              disabled
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-500 rounded-md text-sm bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 focus:outline-none"
                              placeholder="Date"
                            />
                          </td>
                          <td className="px-4 py-3 border-r border-gray-200 dark:border-gray-600">
                            <input
                              {...register(`items.${index}.biltyAmount`, { valueAsNumber: true })}
                              disabled
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-500 rounded-md text-sm bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-right focus:outline-none"
                              placeholder="0.00"
                            />
                          </td>
                          <td className="px-4 py-3 border-r border-gray-200 dark:border-gray-600">
                            <input
                              {...register(`items.${index}.srbAmount`, { valueAsNumber: true })}
                              disabled
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-500 rounded-md text-sm bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-right focus:outline-none"
                              placeholder="0.00"
                            />
                          </td>
                          <td className="px-4 py-3 border-r border-gray-200 dark:border-gray-600">
                            <input
                              {...register(`items.${index}.totalAmount`, { valueAsNumber: true })}
                              disabled
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-500 rounded-md text-sm bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-right focus:outline-none font-medium"
                              placeholder="0.00"
                            />
                          </td>
                          <td className="px-4 py-3 border-r border-gray-200 dark:border-gray-600">
                            <input
                              {...register(`items.${index}.balance`, { valueAsNumber: true })}
                              disabled
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-500 rounded-md text-sm bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-right focus:outline-none font-medium"
                              placeholder="0.00"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              {...register(`items.${index}.receiptAmount`, { valueAsNumber: true })}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-500 rounded-md text-sm focus:ring-2 focus:ring-[#3a614c] focus:border-[#3a614c] dark:bg-gray-700 dark:text-white text-right transition-all duration-200"
                              placeholder="0.00"
                              type="number"
                              min="0"
                              step="0.01"
                              disabled={isViewMode || !row.biltyNo}
                              onBlur={(e) => numberInputHandlers.onBlur(e, 2)}
                              onFocus={numberInputHandlers.onFocus}
                            />
                            {errors.items?.[index]?.receiptAmount && (
                              <p className="text-red-500 text-xs mt-1">{errors.items[index].receiptAmount.message}</p>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <Button
                              type="button"
                              onClick={() => removeTableRow(index)}
                              className="bg-red-500 hover:bg-red-600 text-white text-xs px-2 py-1 rounded-md"
                              disabled={items.length <= 1}
                            >
                              <FiX />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="sticky bottom-0 bg-white dark:bg-gray-800">
                      <tr className="text-black dark:text-white border-t-2 border-gray-300 dark:border-gray-600">
                        <td colSpan={3} className="px-4 py-3 text-right font-bold text-base">
                          TOTALS:
                        </td>
                        <td className="px-4 py-3 font-bold text-right text-base border-r border-gray-200 dark:border-gray-600">
                          {items.reduce((sum, row) => sum + (row.biltyAmount || 0), 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-3 font-bold text-right text-base border-r border-gray-200 dark:border-gray-600">
                          {items.reduce((sum, row) => sum + (row.srbAmount || 0), 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-3 font-bold text-right text-base border-r border-gray-200 dark:border-gray-600">
                          {items.reduce((sum, row) => sum + (row.totalAmount || 0), 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-3 font-bold text-right text-base border-r border-gray-200 dark:border-gray-600">
                          {items.reduce((sum, row) => sum + (row.balance || 0), 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-3 font-bold text-right text-base">
                         
                          {items.reduce((sum, row) => sum + (row.receiptAmount ?? 0), 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-3"></td>
                      </tr>
                    </tfoot>
                  </table>
                  </div>
                </div>

                <div className="mt-4 flex flex-col sm:flex-row justify-between items-center gap-3">
                  <Button
                    type="button"
                    onClick={addTableRow}
                    onAuxClick={addTableRow}
                    className="w-full sm:w-auto bg-gradient-to-r from-[#3a614c] to-[#6e997f] hover:from-[#3a614c]/90 hover:to-[#6e997f]/90 text-white px-4 py-2 rounded-md transition-all duration-200 shadow-md hover:shadow-lg"
                    disabled={isViewMode}
                  >
                    + Add New Row
                  </Button>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Total Rows: {items.length}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 mb-4 sm:mb-6">
              <div className="px-3 sm:px-4 py-2 sm:py-3 rounded-t-lg">
                <div className="flex items-center gap-2">
                  <FaMoneyBillWave className="text-base sm:text-lg" />
                  <h3 className="text-sm sm:text-base font-semibold">Tax & Calculations</h3>
                </div>
              </div>

              <div className="p-4 sm:p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  <div className="space-y-3 sm:space-y-4">
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 border-b border-gray-200 dark:border-gray-600 pb-2">
                      Tax Configuration
                    </h4>

                    <div className="bg-gray-50 dark:bg-gray-700 p-3 sm:p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                      <Controller
                        name="salesTaxOption"
                        control={control}
                        render={({ field }) => (
                          <AblCustomDropdown
                            label="Sales Tax Option"
                            options={salesTaxOptions}
                            selectedOption={field.value || ''}
                            onChange={field.onChange}
                            error={errors.salesTaxOption?.message}
                            disabled={isViewMode}
                          />
                        )}
                      />
                    </div>

                    {salesTaxOption === 'with' && (
                      <div className="bg-gray-50 dark:bg-gray-700 p-3 sm:p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                        <Controller
                          name="salesTaxRate"
                          control={control}
                          render={({ field }) => (
                            <AblCustomDropdown
                              label="Sales Tax Rate"
                              options={saleTaxes}
                              selectedOption={field.value || ''}
                              onChange={(value) => {
                                field.onChange(value);
                                const selectedTax = saleTaxes.find(tax => tax.id === value);
                                if (selectedTax && 'percentage' in selectedTax) {
                                  setselectedSaleTaxes(selectedTax.percentage as string);
                                }
                              }}
                              error={errors.salesTaxRate?.message}
                              disabled={isViewMode}
                            />
                          )}
                        />
                      </div>
                    )}

                    <div className="bg-gray-50 dark:bg-gray-700 p-3 sm:p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                      <Controller
                        name="whtOnSbr"
                        control={control}
                        render={({ field }) => (
                          <AblCustomDropdown
                            label="WHT on SBR Amount"
                            options={saleTaxes}
                            selectedOption={field.value || ''}
                          onChange={(value) => {
                                field.onChange(value);
                                const selectedTax = saleTaxes.find(tax => tax.id === value);
                                if (selectedTax && 'percentage' in selectedTax) {
                                  setselectedWHTTaxes(selectedTax.percentage as string);
                                }
                              }}
                            error={errors.whtOnSbr?.message}
                            disabled={isViewMode}
                          />
                        )}
                      />
                    </div>
                  </div>

  <div className="space-y-3 sm:space-y-4">
  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 border-b border-gray-200 dark:border-gray-600 pb-2">
    Amount Summary
  </h4>

  <div className="space-y-2 sm:space-y-3">
    {/* Receipt Amount Total */}
    <div className="flex items-center justify-between bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-3 sm:p-4 rounded-lg border border-blue-200 dark:border-blue-700">
      <span className="font-medium text-xs sm:text-sm text-blue-700 dark:text-blue-300">Receipt Amount Total</span>
      <span className="text-xs sm:text-sm font-bold text-blue-800 dark:text-blue-200">
        {items.reduce((sum, row) => sum + (row.receiptAmount ?? 0), 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </span>
    </div>

    {/* Total SBR Amount */}
    <div className="flex items-center justify-between bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 p-3 sm:p-4 rounded-lg border border-purple-200 dark:border-purple-700">
      <span className="font-medium text-xs sm:text-sm text-purple-700 dark:text-purple-300">Total SBR Amount</span>
      <span className="text-xs sm:text-sm font-bold text-purple-800 dark:text-purple-200">
        {items.reduce((sum, row) => sum + (row.srbAmount || 0), 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </span>
    </div>

    {/* Subtotal Amount */}
    <div className="flex items-center justify-between bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-3 sm:p-4 rounded-lg border border-green-200 dark:border-green-700">
      <span className="font-medium text-xs sm:text-sm text-green-700 dark:text-green-300">Subtotal Amount</span>
      <span className="text-xs sm:text-sm font-bold text-green-800 dark:text-green-200">
        {(() => {
          const subtotal = items.reduce((sum, row) => sum + (row.receiptAmount || 0) + (row.srbAmount || 0), 0);
          return subtotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        })()}
      </span>
    </div>

    {/* Sales Tax Amount */}
    <div className="flex items-center justify-between bg-gradient-to-r from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20 p-3 sm:p-4 rounded-lg border border-indigo-200 dark:border-indigo-700">
      <span className="font-medium text-xs sm:text-sm text-indigo-700 dark:text-indigo-300">Sales Tax Amount</span>
      <span className="text-xs sm:text-sm font-bold text-indigo-800 dark:text-indigo-200">
        {(() => {
          const subtotal = items.reduce((sum, row) => sum + (row.receiptAmount || 0) + (row.srbAmount || 0), 0);
          if (salesTaxOption === 'with' && salesTaxRate) {
            const taxRate = parseFloat(selectedSaleTaxes);
            console.log('Subtotal for tax calculation:', subtotal);
            console.log('Using tax rate:', taxRate);
            return (subtotal * (taxRate / 100)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
          }
          return '0.00';
        })()}
      </span>
    </div>

    {/* Total After Sales Tax (Subtotal - Sales Tax) */}
    <div className="flex items-center justify-between bg-gradient-to-r from-[#3a614c] to-[#6e997f] text-white p-3 sm:p-4 rounded-lg shadow-md">
      <span className="font-semibold text-xs sm:text-sm">Total After Sales Tax</span>
      <span className="text-base sm:text-lg font-bold">
        {(() => {
          const subtotal = items.reduce((sum, row) => sum + (row.receiptAmount || 0) + (row.srbAmount || 0), 0);
          let totalAfterSalesTax = subtotal;
          if (salesTaxOption === 'with' && salesTaxRate) {
            const taxRate = parseFloat(selectedSaleTaxes);
            const salesTaxAmount = subtotal * (taxRate / 100);
            totalAfterSalesTax = subtotal - salesTaxAmount;
          }
          return totalAfterSalesTax.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        })()}
      </span>
    </div>

    {/* WHT Deduction Amount */}
    <div className="flex items-center justify-between bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 p-3 sm:p-4 rounded-lg border border-orange-200 dark:border-orange-700">
      <span className="font-medium text-xs sm:text-sm text-orange-700 dark:text-orange-300">WHT Deduction Amount</span>
      <span className="text-xs sm:text-sm font-bold text-orange-800 dark:text-orange-200">
        {(() => {
          const subtotal = items.reduce((sum, row) => sum + (row.receiptAmount || 0) + (row.srbAmount || 0), 0);
          let totalAfterSalesTax = subtotal;
          if (salesTaxOption === 'with' && salesTaxRate) {
            const taxRate = parseFloat(selectedWHTTaxes);
            const salesTaxAmount = subtotal * (taxRate / 100);
            totalAfterSalesTax = subtotal - salesTaxAmount;
          }
          if (whtOnSbr) {
            const whtRate = parseFloat(selectedWHTTaxes)
            return (totalAfterSalesTax * (whtRate / 100)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
          }
          return '0.00';
        })()}
      </span>
    </div>

    {/* Final Cheque Amount */}
    <div className="flex items-center justify-between bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 p-3 sm:p-4 rounded-lg border-2 border-gray-300 dark:border-gray-500">
      <span className="font-bold text-sm sm:text-base text-gray-800 dark:text-gray-200">Final Cheque Amount</span>
      <span className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100">
        {(() => {
          const subtotal = items.reduce((sum, row) => sum + (row.receiptAmount || 0) + (row.srbAmount || 0), 0);
          let totalAfterSalesTax = subtotal;
          if (salesTaxOption === 'with' && salesTaxRate) {
            const taxRate = parseFloat(selectedSaleTaxes);
            const salesTaxAmount = subtotal * (taxRate / 100);
            totalAfterSalesTax = subtotal - salesTaxAmount;
          }
          let finalAmount = totalAfterSalesTax;
          if (whtOnSbr) {
            const whtRate = parseFloat(selectedWHTTaxes);
            const whtAmount = totalAfterSalesTax * (whtRate / 100);
            finalAmount = totalAfterSalesTax - whtAmount;
          }
          return finalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        })()}
      </span>
    </div>
  </div>
</div>
                </div>
              </div>
            </div>

      <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-4 pt-3 sm:pt-4 border-t border-gray-200 dark:border-gray-700 mt-3 sm:mt-4">
      {isViewMode ? (
    <Button
      type="button"
      onClick={() => router.back()} 
      className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-2.5 bg-gray-600 hover:bg-gray-700 text-white rounded-md transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center gap-2 text-xs sm:text-sm font-medium"
    >
      <FiX className="text-sm sm:text-base" />
      Back
     </Button>
      ) : (
       <>
      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-2.5 bg-gradient-to-r from-[#3a614c] to-[#6e997f] hover:from-[#3a614c]/90 hover:to-[#6e997f]/90 text-white rounded-md transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl flex items-center justify-center gap-2 text-xs sm:text-sm font-medium"
      >
        {isSubmitting ? (
          <>
            <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span>Saving...</span>
          </>
        ) : (
          <>
            <FiSave className="text-sm sm:text-base" />
            <span>{isEdit ? 'Update Receipt' : 'Create Receipt'}</span>
          </>
        )}
      </Button>

      <Button
        type="button"
        onClick={() => router.back()}
        className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-2.5 bg-gray-500 hover:bg-gray-600 text-white rounded-md transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center gap-2 text-xs sm:text-sm font-medium"
      >
        <FiX className="text-sm sm:text-base" />
        Cancel
      </Button>
      </>
      )}
     </div>
          </form>
        </div>

        <div className="mt-3 sm:mt-4 bg-white dark:bg-gray-800 rounded-md shadow-md p-2 sm:p-3 border border-gray-100 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300 text-xs sm:text-sm">
              <MdInfo className="text-[#3a614c] flex-shrink-0" />
              <span>Fill in all required fields marked with an asterisk (*)</span>
            </div>
            <Link href="/receipt" className="text-[#3a614c] hover:text-[#6e997f] text-xs sm:text-sm font-medium whitespace-nowrap">
              Back to Receipts
            </Link>
          </div>
        </div>

        {showConsignmentPopup !== null && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-7xl w-full max-h-[90vh] flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Select Consignment or Opening Balance</h3>
                <Button
                  onClick={() => {
                    setShowConsignmentPopup(null);
                    setSearchQuery('');
                  }}
                  className="text-gray-400 hover:text-gray-600 p-1"
                  variant="ghost"
                >
                  <FiX className="text-xl" />
                </Button>
              </div>

              {/* Search */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by Bilty No, Vehicle No, Customer..."
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-[#3a614c] focus:border-transparent"
                />
              </div>

              {/* Side by Side Content */}
              <div className="flex-1 overflow-hidden flex gap-4 p-4">
                {/* Left Side - Consignments */}
                <div className="flex-1 flex flex-col border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                  <div className="bg-gradient-to-r from-[#3a614c] to-[#6e997f] text-white px-4 py-3">
                    <h4 className="font-semibold text-base">Consignments</h4>
                  </div>
                  <div className="flex-1 overflow-y-auto">
                    {selectingConsignment ? (
                      <div className="flex items-center justify-center py-12">
                        <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                        <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Fetching balance...</span>
                      </div>
                    ) : filteredConsignments.length === 0 ? (
                      <p className="text-sm text-gray-600 dark:text-gray-400 text-center py-12">No consignments found</p>
                    ) : (
                      <table className="w-full text-sm">
                        <thead className="sticky top-0 bg-gray-50 dark:bg-gray-700">
                          <tr>
                            <th className="px-3 py-2 text-left font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-600">
                              Bilty #
                            </th>
                            <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-200 border-r border-gray-200 dark:border-gray-500 min-w-[180px]">
                             Customer (Freight By)
                            </th>
                            <th className="px-3 py-2 text-left font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-600">
                              Vehicle No
                            </th>
                            <th className="px-3 py-2 text-left font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-600">
                              Date
                            </th>
                            <th className="px-3 py-2 text-right font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-600">
                              Amount
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800">
                          {filteredConsignments.map((consignment) => (
                            <tr
                              key={consignment.id}
                              onClick={() => selectConsignment(showConsignmentPopup, consignment)}
                              className="border-b border-gray-100 dark:border-gray-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors cursor-pointer"
                            >
                              <td className="px-3 py-3 text-gray-800 dark:text-gray-200 font-medium">
                                {consignment.biltyNo}
                              </td>
                              <td className="px-4 py-3 border-r border-gray-200 dark:border-gray-600">
                                {consignment.customerName ? (
                                  <div className="flex items-center gap-2">
                                    {consignment.customerName === 'Unselected Freight From' ? (
                                      <span className="text-sm font-medium text-red-600 dark:text-red-400 flex items-center gap-1">
                                        <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300">
                                          ⚠️ Unselected Freight From
                                        </span>
                                      </span>
                                    ) : (
                                      <>
                                        <span className="font-medium">{consignment.customerName}</span>
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                                          consignment.freightPaidBy === 'consignee' 
                                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300' 
                                            : 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300'
                                        }`}>
                                          {consignment.freightPaidBy === 'consignee' ? 'Consignee' : 'Consignor'}
                                        </span>
                                      </>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-sm text-gray-400">—</span>
                                )}
                              </td>
                              <td className="px-3 py-3 text-gray-600 dark:text-gray-400">
                                {consignment.vehicleNo}
                              </td>
                              <td className="px-3 py-3 text-gray-600 dark:text-gray-400">
                                {consignment.biltyDate}
                              </td>
                              <td className="px-3 py-3 text-right text-gray-800 dark:text-gray-200 font-medium">
                                {consignment.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>

                {/* Right Side - Opening Balance */}
                <div className="flex-1 flex flex-col border border-amber-300 dark:border-amber-700 rounded-lg overflow-hidden bg-amber-50/30 dark:bg-amber-900/10">
                  <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-white px-4 py-3">
                    <h4 className="font-semibold text-base flex items-center gap-2">
                      <span>📋</span>
                      <span>Opening Balance</span>
                    </h4>
                  </div>
                  <div className="flex-1 overflow-y-auto">
                    {filteredOpeningBalances.length === 0 ? (
                      <p className="text-sm text-amber-700 dark:text-amber-400 text-center py-12">No opening balance entries found</p>
                    ) : (
                      <table className="w-full text-sm">
                        <thead className="sticky top-0 bg-amber-100 dark:bg-amber-900/30">
                          <tr>
                            <th className="px-3 py-2 text-left font-semibold text-amber-900 dark:text-amber-200 border-b border-amber-200 dark:border-amber-700">
                              Bilty #
                            </th>
                            <th className="px-3 py-2 text-left font-semibold text-amber-900 dark:text-amber-200 border-b border-amber-200 dark:border-amber-700">
                              Customer
                            </th>
                            <th className="px-3 py-2 text-left font-semibold text-amber-900 dark:text-amber-200 border-b border-amber-200 dark:border-amber-700">
                              Vehicle No
                            </th>
                            <th className="px-3 py-2 text-left font-semibold text-amber-900 dark:text-amber-200 border-b border-amber-200 dark:border-amber-700">
                              Date
                            </th>
                            <th className="px-3 py-2 text-right font-semibold text-amber-900 dark:text-amber-200 border-b border-amber-200 dark:border-amber-700">
                              Debit Amount
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800">
                          {filteredOpeningBalances.map((ob) => (
                            <tr
                              key={ob.id}
                              onClick={() => selectOpeningBalance(showConsignmentPopup!, ob)}
                              className="border-b border-amber-100 dark:border-amber-900/30 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors cursor-pointer"
                            >
                              <td className="px-3 py-3 text-amber-900 dark:text-amber-200 font-medium">
                                {ob.biltyNo}
                              </td>
                              <td className="px-3 py-3 text-amber-800 dark:text-amber-300">
                                {ob.customer}
                                {ob.city && <span className="text-xs ml-1">({ob.city})</span>}
                              </td>
                              <td className="px-3 py-3 text-amber-700 dark:text-amber-400">
                                {ob.vehicleNo}
                              </td>
                              <td className="px-3 py-3 text-amber-700 dark:text-amber-400">
                                {ob.biltyDate}
                              </td>
                              <td className="px-3 py-3 text-right text-amber-900 dark:text-amber-200 font-medium">
                                {ob.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-2 p-4 border-t border-gray-200 dark:border-gray-700">
                <Button
                  onClick={() => {
                    setShowConsignmentPopup(null);
                    setSearchQuery('');
                  }}
                  className="bg-gray-500 hover:bg-gray-600 text-white text-sm py-2 px-4 rounded-md"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReceiptForm;
