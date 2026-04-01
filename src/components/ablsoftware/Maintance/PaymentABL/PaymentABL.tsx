'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { useForm, Controller, type UseFormSetValue, type Path } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import ABLCustomInput from '@/components/ui/ABLCustomInput';
import AblCustomDropdown from '@/components/ui/AblCustomDropdown';
import { getAllBookingOrder } from '@/apis/bookingorder';
import { getAllCharges } from '@/apis/charges';
import { createPaymentABL, updatePaymentABL, getPaymentABLHistory } from '@/apis/paymentABL';
import { getAllBiltyPaymentInvoice } from '@/apis/biltypaymentnnvoice';
import { getAllMunshyana } from '@/apis/munshyana';
import { getAllOpeningBalance } from '@/apis/openingbalance';
import { getAllVendor } from '@/apis/vendors';
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
import { isEqual } from 'lodash'; // Optional, remove if using custom areItemsEqual
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

interface BookingOrder {
  id: string;
  orderNo: string;
  vehicleNo: string;
  orderDate: string;
  vendor: string;
  vendorName: string;
}

interface ChargeLine {
  id: string;
  charge: string; // Used as chargeNo
  biltyNo: string;
  date: string;
  vehicle: string;
  paidTo: string;
  contact: string;
  remarks: string;
  amount: number;
}

interface Charge {
  id: string;
  chargeNo: string;
  chargeDate: string;
  orderNo: string;
  status: string;
  lines: ChargeLine[];
  isActive: boolean;
}

interface PaymentABLItem {
  id?: string | null;
  vehicleNo: string;
  orderNo: string;
  charges: string; // Displays chargeName (e.g., vehicle or derived name)
  chargeNo: string; // Stores charge ID for payload
  orderDate: string;
  dueDate: string;
  expenseAmount: number | null;
  balance: number | null;
  paidAmount: number | null;
}

interface PaymentFormProps {
  isEdit?: boolean;
  initialData?: Partial<PaymentFormData> & {
    id?: string;
    isActive?: boolean;
    isDeleted?: boolean;
    createdDateTime?: string;
    createdBy?: string;
    modifiedDateTime?: string;
    modifiedBy?: string;
    status?: string;
    paymentABLItem?: any[];
  };
}

// Schema for payment form validation
const paymentSchema = z.object({
  paymentNo: z.string().optional(),
  paymentDate: z.string().min(1, 'Payment Date is required'),
  paymentMode: z.string().min(1, 'Payment Mode is required'),
  bankName: z.string().optional(),
  chequeNo: z.string().optional(),
  chequeDate: z.string().optional(),
  remarks: z.string().optional(),
  paidTo: z.string().optional(),
  paidAmount: z.union([z.number(), z.string()]).transform(val => {
    if (val === null || val === undefined || val === '') return null;
    const num = typeof val === 'string' ? parseFloat(val) : val;
    return isNaN(num) ? null : num;
  }).nullable(),
  advanced: z.union([z.number(), z.string()]).transform(val => {
    if (val === null || val === undefined || val === '') return null;
    const num = typeof val === 'string' ? parseFloat(val) : val;
    return isNaN(num) ? null : num;
  }).nullable(),
  advancedDate: z.string().optional(),
  pdc: z.union([z.number(), z.string()]).transform(val => {
    if (val === null || val === undefined || val === '') return null;
    const num = typeof val === 'string' ? parseFloat(val) : val;
    return isNaN(num) ? null : num;
  }).nullable(),
  pdcDate: z.string().optional(),
  paymentAmount: z.union([z.number(), z.string()]).transform(val => {
    if (val === null || val === undefined || val === '') return null;
    const num = typeof val === 'string' ? parseFloat(val) : val;
    return isNaN(num) ? null : num;
  }).nullable(),
  paymentABLItems: z.array(
    z.object({
      id: z.string().optional().nullable(),
      vehicleNo: z.string().optional(),
      orderNo: z.string().min(1, 'Order No is required').optional(),
      charges: z.string().min(1, 'Charges are required').optional(),
      chargeNo: z.string().optional(),
      orderDate: z.string().optional(),
      dueDate: z.string().optional(),
      expenseAmount: z.union([z.number(), z.string()]).transform(val => {
        if (val === null || val === undefined || val === '') return null;
        const num = typeof val === 'string' ? parseFloat(val) : val;
        return isNaN(num) ? null : num;
      }).nullable(),
      balance: z.union([z.number(), z.string()]).transform(val => {
        if (val === null || val === undefined || val === '') return null;
        const num = typeof val === 'string' ? parseFloat(val) : val;
        return isNaN(num) ? null : num;
      }).nullable(),
      paidAmount: z.union([z.number(), z.string()]).transform(val => {
        if (val === null || val === undefined || val === '') return null;
        const num = typeof val === 'string' ? parseFloat(val) : val;
        return isNaN(num) ? null : num;
      }).nullable(),
    })
  ),
});

type PaymentFormData = z.infer<typeof paymentSchema>;

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

// Hierarchical Dropdown Component for PaymentABL
interface HierarchicalDropdownProps {
  accounts: Account[];
  onSelect: (id: string, account: Account | null) => void;
  setValue: UseFormSetValue<PaymentFormData>;
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
    setValue(name as Path<PaymentFormData>, leaf.id, {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true,
    });
    onSelect(leaf.id, selected);
    setSearchTerm('');
    setShowModal(false);
  };

  const clearSelection = () => {
    setSelectionPath([]);
    setValue(name as Path<PaymentFormData>, '' as unknown as string, {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true,
    });
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

const PaymentForm = ({ isEdit = false, initialData }: PaymentFormProps) => {
  const router = useRouter();
  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: initialData
      ? {
        paymentNo: initialData.paymentNo || '',
        paymentDate: initialData.paymentDate || '',
        paymentMode: initialData.paymentMode || '',
        bankName: initialData.bankName || '',
        chequeNo: initialData.chequeNo || '',
        chequeDate: initialData.chequeDate || '',
        remarks: initialData.remarks || '',
        paidTo: initialData.paidTo || '',
        paidAmount: typeof initialData.paidAmount === 'string' ? parseFloat(initialData.paidAmount) || null : initialData.paidAmount ?? null,
        advanced: typeof initialData.advanced === 'string' ? parseFloat(initialData.advanced) || null : initialData.advanced ?? null,
        advancedDate: initialData.advancedDate || '',
        pdc: typeof initialData.pdc === 'string' ? parseFloat(initialData.pdc) || null : initialData.pdc ?? null,
        pdcDate: initialData.pdcDate || '',
        paymentAmount: typeof initialData.paymentAmount === 'string' ? parseFloat(initialData.paymentAmount) || null : initialData.paymentAmount ?? null,
        paymentABLItems: (initialData.paymentABLItems || initialData.paymentABLItem)?.map?.((row: any) => ({
          id: row.id ?? null,
          vehicleNo: row.vehicleNo || '',
          orderNo: row.orderNo || '',
          charges: row.charges || '',
          chargeNo: row.chargeNo || '',
          orderDate: row.orderDate || '',
          dueDate: row.dueDate || '',
          expenseAmount: typeof row.expenseAmount === 'string' ? parseFloat(row.expenseAmount) || null : row.expenseAmount ?? null,
          balance: typeof row.balance === 'string' ? parseFloat(row.balance) || null : row.balance ?? null,
          paidAmount: typeof row.paidAmount === 'string' ? parseFloat(row.paidAmount) || null : row.paidAmount ?? null,
        })) ?? [{
          id: null,
          vehicleNo: '',
          orderNo: '',
          charges: '',
          chargeNo: '',
          orderDate: '',
          dueDate: '',
          expenseAmount: null,
          balance: null,
          paidAmount: null,
        }],
      }
      : {
        paymentNo: '',
        paymentDate: '',
        paymentMode: '',
        bankName: '',
        chequeNo: '',
        chequeDate: '',
        remarks: '',
        paidTo: '',
        paidAmount: null,
        advanced: null,
        advancedDate: '',
        pdc: null,
        pdcDate: '',
        paymentAmount: null,
        paymentABLItems: [{
          id: null,
          vehicleNo: '',
          orderNo: '',
          charges: '',
          chargeNo: '',
          orderDate: '',
          dueDate: '',
          expenseAmount: null,
          balance: null,
          paidAmount: null,
        }],
      },
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [idFocused, setIdFocused] = useState(false);
  const [bookingOrders, setBookingOrders] = useState<BookingOrder[]>([]);
  const [charges, setCharges] = useState<Charge[]>([]);
  const [billPaymentInvoices, setBillPaymentInvoices] = useState<any[]>([]);
  const [munshyanaData, setMunshyanaData] = useState<any[]>([]);
  const [openingBalances, setOpeningBalances] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [showOrderPopup, setShowOrderPopup] = useState<number | null>(null);
  const [showChargePopup, setShowChargePopup] = useState<number | null>(null);
  const [orderSearch, setOrderSearch] = useState('');
  const [chargeSearch, setChargeSearch] = useState('');
  const searchParams = useSearchParams();
  
  const paymentModes: DropdownOption[] = [
    { id: 'Cash', name: 'Cash' },
    { id: 'Cheque', name: 'Cheque' },
    { id: 'Bank Transfer', name: 'Bank Transfer' },
  ];

  const paymentABLItems = watch('paymentABLItems');
  const paymentMode = watch('paymentMode');
  const bankName = watch('bankName');

  // Custom deep comparison function (use instead of lodash.isEqual if preferred)
  const areItemsEqual = (items1: PaymentABLItem[], items2: PaymentABLItem[]) => {
    if (items1.length !== items2.length) return false;
    return items1.every((item1, index) => {
      const item2 = items2[index];
      return (
        item1.id === item2.id &&
        item1.vehicleNo === item2.vehicleNo &&
        item1.orderNo === item2.orderNo &&
        item1.charges === item2.charges &&
        item1.chargeNo === item2.chargeNo &&
        item1.orderDate === item2.orderDate &&
        item1.dueDate === item2.dueDate &&
        item1.expenseAmount === item2.expenseAmount &&
        item1.balance === item2.balance &&
        item1.paidAmount === item2.paidAmount
      );
    });
  };

  // Filter booking orders based on search term
  const filteredBookingOrders = bookingOrders.filter((order) =>
    [
      order.vehicleNo || '',
      order.orderNo || '',
      order.orderDate || '',
      order.vendorName || '',
    ].some((field) => field.toLowerCase().includes(orderSearch.toLowerCase()))
  );

  // Filter opening balances based on search term
  const filteredOpeningBalances = openingBalances.filter((ob) =>
    `${ob.biltyNo} ${ob.vehicleNo} ${ob.broker || ''} ${ob.chargeType || ''}`.toLowerCase().includes(orderSearch.toLowerCase())
  );

  // Filter charges based on orderNo, status, and search term
  const getFilteredCharges = (index: number | null) => {
    if (index === null) return [];
    const selectedOrderNo = paymentABLItems[index]?.orderNo || '';
    const selectedChargeNos = paymentABLItems
      .filter((_, i) => i !== index)
      .map(row => row.chargeNo)
      .filter(Boolean);
    const seenChargeIds = new Set<string>();
    const allCharges = charges.flatMap((charge) =>
      Array.isArray(charge.lines) && charge.lines.length > 0
        ? charge.lines
          .filter((line) => charge.status === 'Approved' )
          .map((line) => ({
            id: line.id,
            chargeNo: charge.chargeNo,
            chargeName: line.charge || line.vehicle || charge.chargeNo || `Charge ${line.id}`,
            orderNo: charge.orderNo,
            chargeDate: charge.chargeDate || new Date().toISOString().split('T')[0],
            date: line.date || charge.chargeDate || '',
            vehicle: line.vehicle || '',
            amount: Number(line.amount) || 0,
            balance: Number(line.amount) || 0,
            paidTo: line.paidTo || '',
          }))
        : []
    ).filter((charge) => !selectedChargeNos.includes(charge.chargeNo));
    return allCharges
      .filter((charge) => {
        if (!charge.id || seenChargeIds.has(charge.id)) return false;
        seenChargeIds.add(charge.id);
        return !selectedOrderNo || charge.orderNo === selectedOrderNo;
      })
      .filter((charge) =>
        [
          charge.chargeNo || '',
          charge.chargeName || '',
          charge.orderNo || '',
          charge.chargeDate || '',
          charge.date || '',
          charge.vehicle || '',
          charge.amount?.toString() || '',
          charge.balance?.toString() || '',
        ].some((field) => String(field).toLowerCase().includes(chargeSearch.toLowerCase()))
      );
  };

  // Fetch dropdown data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [orderRes, chargeRes, billPaymentRes, munshyanaRes, openingBalanceRes, vendorRes, equalityRes, liabilitiesRes, assetsRes, expenseRes, revenueRes] = await Promise.all([
          getAllBookingOrder(1, 10000),
          getAllCharges(1, 10000),
          getAllBiltyPaymentInvoice(1, 10000),
          getAllMunshyana(1, 10000),
          getAllOpeningBalance(1, 10000),
          getAllVendor(1, 10000),
          getAllEquality(1, 1000),
          getAllAblLiabilities(1, 1000),
          getAllAblAssests(1, 1000),
          getAllAblExpense(1, 1000),
          getAllAblRevenue(1, 1000),
        ]);
        
        // Create vendor lookup map
        const vendorMap = new Map();
        (vendorRes.data || []).forEach((vendor: any) => {
          vendorMap.set(vendor.id, vendor.vendorName || vendor.name || 'Unknown');
        });

        const hierarchicalAccounts: Account[] = [
          { id: 'equality', listid: 'EQ', description: 'Equality', parentAccountId: null, children: normalizeAccountTree(equalityRes.data), dueDate: '', fixedAmount: '', paid: '' },
          { id: 'liabilities', listid: 'LB', description: 'Liabilities', parentAccountId: null, children: normalizeAccountTree(liabilitiesRes.data), dueDate: '', fixedAmount: '', paid: '' },
          { id: 'assets', listid: 'AS', description: 'Assets', parentAccountId: null, children: normalizeAccountTree(assetsRes.data), dueDate: '', fixedAmount: '', paid: '' },
          { id: 'expense', listid: 'EX', description: 'Expense', parentAccountId: null, children: normalizeAccountTree(expenseRes.data), dueDate: '', fixedAmount: '', paid: '' },
          { id: 'revenue', listid: 'RV', description: 'Revenue', parentAccountId: null, children: normalizeAccountTree(revenueRes.data), dueDate: '', fixedAmount: '', paid: '' },
        ];
        setAccounts(hierarchicalAccounts);
        
        setBookingOrders(
          orderRes.data.map((item: any) => ({
            id: item.id || item.orderNo,
            orderNo: String(item.orderNo || item.id || ''),
            vehicleNo: String(item.vehicleNo || 'N/A'),
            orderDate: item.orderDate || new Date().toISOString().split('T')[0],
            vendor: item.vendor || 'N/A',
            vendorName: vendorMap.get(item.vendor) || item.vendorName || item.vendor || 'Unknown',
          }))
        );
        const validCharges = chargeRes.data
          .filter((item: any) => {
            // Check if charge is approved (case-insensitive)
            const isApproved = item.status && item.status.toLowerCase() === 'approved';
            if (!isApproved) {
              console.warn('Charge not approved, skipped:', item);
              return false;
            }
            // Check if lines exist and have at least one entry
            if (!item.lines || !Array.isArray(item.lines) || item.lines.length === 0) {
              console.warn('Charge has no lines, skipped:', item);
              return false;
            }
            return true;
          })
          .map((item: any) => ({
            id: item.id || '',
            chargeNo: item.chargeNo || '',
            chargeDate: item.chargeDate || new Date().toISOString().split('T')[0],
            orderNo: item.orderNo || '',
            status: item.status || '',
            lines: item.lines.map((line: any) => ({
              id: line.id || '',
              charge: line.charge || '',
              biltyNo: line.biltyNo || '',
              date: line.date || item.chargeDate || '',
              vehicle: line.vehicle || '',
              paidTo: line.paidTo || '',
              contact: line.contact || '',
              remarks: line.remarks || '',
              amount: Number(line.amount) || 0,
            })),
            isActive: item.isActive || false,
          }));
        setCharges(validCharges);
        setBillPaymentInvoices(billPaymentRes.data || []);
        setMunshyanaData(munshyanaRes.data || []);
        
        // Process opening balance entries for broker and charges (credit > 0)
        const obEntries: any[] = [];
        (openingBalanceRes?.data || []).forEach((ob: any) => {
          (ob.openingBalanceEntrys || []).forEach((entry: any) => {
            if (entry.credit > 0 && (entry.broker || entry.chargeType)) {
              obEntries.push({
                id: `OB-${ob.openingNo}-${entry.id || entry.broker || entry.chargeType}`,
                biltyNo: entry.biltyNo || `OB-${ob.openingNo}`,
                vehicleNo: entry.vehicleNo || 'N/A',
                biltyDate: entry.biltyDate || ob.openingDate,
                amount: entry.credit || 0,
                isOpeningBalance: true,
                openingBalanceId: entry.id,
                openingBalanceNo: ob.openingNo,
                broker: entry.broker,
                chargeType: entry.chargeType,
                city: entry.city,
              });
            }
          });
        });
        setOpeningBalances(obEntries);
        
        console.log('Processed charges:', validCharges);
        console.log('Bill Payment Invoices:', billPaymentRes.data);
        console.log('Munshyana Data:', munshyanaRes.data);
        console.log('Opening Balances (Broker/Charges):', obEntries);
      } catch (error) {
        toast.error('Failed to load data');
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // Generate paymentNo for new payment
  useEffect(() => {
    if (!isEdit) {
      const generatePaymentNo = () => {
        const prefix = 'PAY';
        const timestamp = Date.now().toString().slice(-6);
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return `${prefix}-${timestamp}-${random}`;
      };
      setValue('paymentNo', generatePaymentNo());
    }
  }, [isEdit, setValue]);

  // Populate form with initialData in edit mode
  useEffect(() => {
    if (isEdit && initialData) {
      const normalizedItems = (initialData.paymentABLItems || initialData.paymentABLItem)?.map((row: any) => ({
        id: row.id ?? null,
        vehicleNo: String(row.vehicleNo || ''),
        orderNo: String(row.orderNo || ''),
        charges: row.charges || '',
        chargeNo: row.chargeNo || '',
        orderDate: row.orderDate || '',
        dueDate: row.dueDate || '',
        expenseAmount: typeof row.expenseAmount === 'string' ? parseFloat(row.expenseAmount) || null : row.expenseAmount ?? null,
        balance: typeof row.balance === 'string' ? parseFloat(row.balance) || null : row.balance ?? null,
        paidAmount: typeof row.paidAmount === 'string' ? parseFloat(row.paidAmount) || null : row.paidAmount ?? null,
      })) ?? [{
        id: null,
        vehicleNo: '',
        orderNo: '',
        charges: '',
        chargeNo: '',
        orderDate: '',
        dueDate: '',
        expenseAmount: null,
        balance: null,
        paidAmount: null,
      }];

      reset({
        paymentNo: String(initialData.paymentNo || ''),
        paymentDate: initialData.paymentDate || '',
        paymentMode: initialData.paymentMode || '',
        bankName: initialData.bankName || '',
        chequeNo: initialData.chequeNo || '',
        chequeDate: initialData.chequeDate || '',
        remarks: initialData.remarks || '',
        paidTo: initialData.paidTo || '',
        paidAmount: typeof initialData.paidAmount === 'string' ? parseFloat(initialData.paidAmount) || null : initialData.paidAmount ?? null,
        advanced: typeof initialData.advanced === 'string' ? parseFloat(initialData.advanced) || null : initialData.advanced ?? null,
        advancedDate: initialData.advancedDate || '',
        pdc: typeof initialData.pdc === 'string' ? parseFloat(initialData.pdc) || null : initialData.pdc ?? null,
        pdcDate: initialData.pdcDate || '',
        paymentAmount: typeof initialData.paymentAmount === 'string' ? parseFloat(initialData.paymentAmount) || null : initialData.paymentAmount ?? null,
        paymentABLItems: normalizedItems,
      });
    }
  }, [isEdit, initialData, reset]);

  // Update table calculations - recalculate balance when paid amount changes
  useEffect(() => {
    let hasChanges = false;
    const updatedPaymentABLItems = paymentABLItems.map((row) => {
      // Calculate balance: Expense Amount - Paid Amount
      const expenseAmount = Number(row.expenseAmount) || 0;
      const paidAmount = Number(row.paidAmount) || 0;
      const calculatedBalance = expenseAmount - paidAmount;
      const newBalance = calculatedBalance >= 0 ? calculatedBalance : 0;
      
      // Check if balance needs updating
      if (row.balance !== newBalance) {
        hasChanges = true;
        return { ...row, balance: newBalance };
      }
      return row;
    });

    // Only update if there are actual changes to balance
    if (hasChanges) {
      setValue('paymentABLItems', updatedPaymentABLItems, { shouldValidate: false });
    }

    const totalPaidAmount = updatedPaymentABLItems.reduce((sum, row) => sum + (Number(row.paidAmount) || 0), 0);
    const currentPaidAmount = Number(watch('paidAmount')) || 0;
    if (Math.abs(totalPaidAmount - currentPaidAmount) > 0.01) {
      setValue('paidAmount', totalPaidAmount || null, { shouldValidate: false });
    }

    const advanced = parseFloat(watch('advanced')?.toString() || '0') || 0;
    const pdc = parseFloat(watch('pdc')?.toString() || '0') || 0;
    const paymentAmount = totalPaidAmount + advanced + pdc;
    const currentPaymentAmount = Number(watch('paymentAmount')) || 0;
    if (Math.abs(paymentAmount - currentPaymentAmount) > 0.01) {
      setValue('paymentAmount', paymentAmount || null, { shouldValidate: false });
    }
  }, [paymentABLItems, watch, setValue]);

  const selectOrder = (index: number, order: BookingOrder) => {
    setValue(`paymentABLItems.${index}.vehicleNo`, String(order.vehicleNo || ''), { shouldValidate: true });
    setValue(`paymentABLItems.${index}.orderNo`, String(order.orderNo || ''), { shouldValidate: true });
    setValue(`paymentABLItems.${index}.orderDate`, order.orderDate, { shouldValidate: true });
    setValue('paidTo', order.vendorName, { shouldValidate: true });
    setShowOrderPopup(null);
    setOrderSearch('');
  };

  const selectOpeningBalance = async (index: number, ob: any) => {
    try {
      const vehicleNo = ob.vehicleNo || '';
      const orderNo = ob.biltyNo || '';
      const chargeNo = ob.openingBalanceId || '';

      // Check history for opening balance if all required fields are present
      if (vehicleNo && orderNo && chargeNo) {
        try {
          // Check payment history for this opening balance
          const historyRes = await getPaymentABLHistory({
            vehicleNo: vehicleNo,
            orderNo: orderNo,
            charges: chargeNo,
            isOpeningBalance: true
          });
          
          console.log('Opening Balance History API Response:', {
            vehicleNo,
            orderNo,
            chargeNo,
            fullResponse: historyRes,
            dataArray: historyRes?.data
          });
          
          // Handle null data case - if data is null, treat as no history
          if (historyRes?.data === null) {
            console.log('Opening Balance: No previous payment history, using opening balance amount');
            // Fall through to use opening balance amount
          } else {
            // History API can return data as array or single object
            let historyData = [];
            if (Array.isArray(historyRes)) {
              historyData = historyRes;
            } else if (Array.isArray(historyRes?.data)) {
              historyData = historyRes.data;
            } else if (historyRes?.data && typeof historyRes.data === 'object') {
              // Single object returned, wrap it in array
              historyData = [historyRes.data];
            }
            
            console.log('Opening Balance: Processed History Data:', historyData);
            
            const historyRecord = historyData.find((h: any) => {
              return (h.vehicleNo === vehicleNo || h.charges === chargeNo || h.charges === String(chargeNo)) && 
                     (h.orderNo === orderNo || h.orderNo === String(orderNo));
            });

            console.log('Opening Balance: History Record Found:', historyRecord);

            // If history exists and balance is 0, show error and prevent selection
            if (historyRecord && Number(historyRecord.balance) === 0) {
              toast.error(`This opening balance has been fully paid. No remaining balance to pay.`);
              console.log('Opening Balance fully paid - preventing selection');
              setShowOrderPopup(null);
              setOrderSearch('');
              return; // Don't allow selection
            }

            // If history exists with balance > 0, use that balance
            if (historyRecord && Number(historyRecord.balance) > 0) {
              const remainingBalance = Number(historyRecord.balance);
              console.log('✓ Opening Balance History found:', {
                vehicleNo,
                orderNo,
                chargeNo,
                historyBalance: remainingBalance,
                historyPaidAmount: historyRecord.paidAmount
              });
              toast.info(`Opening Balance: Remaining balance is ${remainingBalance.toLocaleString()}.`);
              
              setValue(`paymentABLItems.${index}.vehicleNo`, ob.vehicleNo, { shouldValidate: true });
              setValue(`paymentABLItems.${index}.orderNo`, ob.biltyNo, { shouldValidate: true });
              setValue(`paymentABLItems.${index}.orderDate`, ob.biltyDate, { shouldValidate: true });
              setValue(`paymentABLItems.${index}.expenseAmount`, remainingBalance, { shouldValidate: true });
              setValue(`paymentABLItems.${index}.balance`, remainingBalance, { shouldValidate: true });
              setValue(`paymentABLItems.${index}.charges`, ob.broker || ob.chargeType || 'Opening Balance', { shouldValidate: true });
              setValue(`paymentABLItems.${index}.chargeNo`, ob.openingBalanceId, { shouldValidate: true });
              setValue(`paymentABLItems.${index}.paidAmount`, null, { shouldValidate: true });
              if (ob.broker) {
                setValue('paidTo', ob.broker, { shouldValidate: true });
              }
              setShowOrderPopup(null);
              setOrderSearch('');
              return;
            }
          }
        } catch (historyError) {
          console.warn('Opening Balance: History check failed, continuing with normal flow:', historyError);
          // Continue with normal flow if history check fails
        }
      }

      // No history or history check skipped - use opening balance amount
      console.log('Opening Balance: Using original amount');
      setValue(`paymentABLItems.${index}.vehicleNo`, ob.vehicleNo, { shouldValidate: true });
      setValue(`paymentABLItems.${index}.orderNo`, ob.biltyNo, { shouldValidate: true });
      setValue(`paymentABLItems.${index}.orderDate`, ob.biltyDate, { shouldValidate: true });
      setValue(`paymentABLItems.${index}.expenseAmount`, ob.amount, { shouldValidate: true });
      setValue(`paymentABLItems.${index}.balance`, ob.amount, { shouldValidate: true });
      setValue(`paymentABLItems.${index}.charges`, ob.broker || ob.chargeType || 'Opening Balance', { shouldValidate: true });
      setValue(`paymentABLItems.${index}.chargeNo`, ob.openingBalanceId, { shouldValidate: true });
      if (ob.broker) {
        setValue('paidTo', ob.broker, { shouldValidate: true });
      }
      setShowOrderPopup(null);
      setOrderSearch('');
    } catch (error) {
      console.error('Error selecting opening balance:', error);
      toast.error('An error occurred while selecting opening balance');
      setShowOrderPopup(null);
      setOrderSearch('');
    }
  };

  const selectCharge = async (index: number, charge: any) => {
    try {
      // Get vehicle number from the selected booking order (already in the row)
      const vehicleNo = paymentABLItems?.[index]?.vehicleNo || '';
      const orderNo = charge.orderNo || '';
      const chargeNo = charge.chargeNo || '';

      // Only check history if all required fields are present
      if (vehicleNo && orderNo && chargeNo) {
        try {
          // Check payment history for this specific vehicle/charge
          const historyRes = await getPaymentABLHistory({
            vehicleNo: vehicleNo,
            orderNo: orderNo,
            charges: chargeNo
          });
          
          console.log('History API Response:', {
            vehicleNo,
            orderNo,
            chargeNo,
            fullResponse: historyRes,
            dataArray: historyRes?.data,
            isArray: Array.isArray(historyRes?.data)
          });
          
          // Handle null data case - if data is null, treat as no history
          if (historyRes?.data === null) {
            console.log('History data is null - no previous payment history, using charge amount');
            // Fall through to use charge amount
          } else {
            // History API can return data as array or single object
            let historyData = [];
            if (Array.isArray(historyRes)) {
              historyData = historyRes;
            } else if (Array.isArray(historyRes?.data)) {
              historyData = historyRes.data;
            } else if (historyRes?.data && typeof historyRes.data === 'object') {
              // Single object returned, wrap it in array
              historyData = [historyRes.data];
            }
            
            console.log('Processed History Data:', historyData);
            
            const historyRecord = historyData.find((h: any) => {
              console.log('Comparing:', {
                historyVehicle: h.vehicleNo,
                searchVehicle: vehicleNo,
                vehicleMatch: h.vehicleNo === vehicleNo,
                historyCharges: h.charges,
                searchCharges: chargeNo,
                chargesMatch: h.charges === chargeNo || h.charges === String(chargeNo),
                historyOrder: h.orderNo,
                searchOrder: orderNo,
                orderMatch: h.orderNo === orderNo || h.orderNo === String(orderNo)
              });
              return (h.vehicleNo === vehicleNo || h.charges === chargeNo || h.charges === String(chargeNo)) && 
                     (h.orderNo === orderNo || h.orderNo === String(orderNo));
            });

            console.log('History Record Found:', historyRecord);

            // If history exists and balance is 0, show error
            if (historyRecord && Number(historyRecord.balance) === 0) {
              toast.error(`Payment already completed for Vehicle ${vehicleNo}. Balance is clear (0).`);
              return; // Don't allow selection
            }

            // If history exists with balance > 0, use that balance
            if (historyRecord && Number(historyRecord.balance) > 0) {
              const remainingBalance = Number(historyRecord.balance);
              console.log('✓ History found:', {
                vehicleNo,
                orderNo,
                chargeNo,
                historyBalance: remainingBalance,
                historyPaidAmount: historyRecord.paidAmount
              });
              toast.info(`Previous balance found: ${remainingBalance.toLocaleString()}. Showing remaining balance.`);
              
              setValue(`paymentABLItems.${index}.charges`, String(charge.chargeName || charge.vehicle || charge.chargeNo || ''), { shouldValidate: false });
              setValue(`paymentABLItems.${index}.chargeNo`, String(chargeNo), { shouldValidate: false });
              setValue(`paymentABLItems.${index}.orderDate`, charge.chargeDate, { shouldValidate: false });
              setValue(`paymentABLItems.${index}.dueDate`, charge.date, { shouldValidate: false });
              // Set expense amount to the remaining balance from history
              setValue(`paymentABLItems.${index}.expenseAmount`, remainingBalance, { shouldValidate: false });
              // Set initial balance to the same as expense amount (will update when user enters paid amount)
              setValue(`paymentABLItems.${index}.balance`, remainingBalance, { shouldValidate: false });
              // Reset paid amount to null for new payment entry
              setValue(`paymentABLItems.${index}.paidAmount`, null, { shouldValidate: false });
              setValue('paidTo', charge.paidTo || watch('paidTo'), { shouldValidate: false });
              setShowChargePopup(null);
              setChargeSearch('');
              return;
            }
          }
        } catch (historyError) {
          console.warn('History check failed, continuing with normal flow:', historyError);
          // Continue with normal flow if history check fails
        }
      } else {
        console.warn('Skipping history check - missing required fields:', { vehicleNo, orderNo, chargeNo });
      }

      // No history or history check skipped - calculate amount with Munshyana deduction if BillPaymentInvoice exists
      console.log('No history found or history check skipped - checking for BillPaymentInvoice');
      let finalAmount = charge.amount || null;

      // Use vehicle number from the already selected booking order
      const selectedVehicleNo = paymentABLItems?.[index]?.vehicleNo || '';

      console.log('Looking for BillPaymentInvoice match:', {
        selectedVehicleNo,
        orderNo,
        chargeNo,
        totalBillPayments: billPaymentInvoices.length
      });

      // Check if there's a matching billpaymentinvoice for this order/vehicle
      const matchingBillPayment = billPaymentInvoices.find((bill: any) => {
        if (!bill.lines || !Array.isArray(bill.lines)) return false;
        const hasMatch = bill.lines.some((line: any) => {
          const vehicleMatch = line.vehicleNo === selectedVehicleNo;
          const orderMatch = line.orderNo === orderNo || line.orderNo === String(orderNo);
          console.log('Checking bill line:', {
            billId: bill.id,
            lineVehicle: line.vehicleNo,
            lineOrder: line.orderNo,
            vehicleMatch,
            orderMatch,
            isAdditionalLine: line.isAdditionalLine,
            bothMatch: vehicleMatch && orderMatch
          });
          // MUST match BOTH vehicle AND order (not just one)
          return !line.isAdditionalLine && vehicleMatch && orderMatch;
        });
        return hasMatch;
      });

      console.log('Matching BillPayment found:', matchingBillPayment ? 'Yes' : 'No', matchingBillPayment?.id);

      // If matching billpayment found, calculate amount after Munshyana deduction
      if (matchingBillPayment && matchingBillPayment.lines) {
        const mainLine = matchingBillPayment.lines.find((l: any) => !l.isAdditionalLine);
        
        if (mainLine) {
          // Start with charge amount
          const chargeAmount = Number(charge.amount) || 0;
          
          // Get munshyana deduction from bill payment invoice
          const munshayanaDeduction = Number(mainLine.munshayana) || 0;
          
          // Calculate final amount after munshyana deduction
          finalAmount = chargeAmount - munshayanaDeduction;
          
          console.log('Amount calculation with Munshyana:', {
            originalChargeAmount: chargeAmount,
            munshayanaDeduction: munshayanaDeduction,
            finalAmount: finalAmount,
            mainLine: mainLine
          });
        }
      } else {
        console.log('No matching BillPayment - using charge amount as-is:', finalAmount);
      }

      setValue(`paymentABLItems.${index}.charges`, String(charge.chargeName || charge.vehicle || charge.chargeNo || ''), { shouldValidate: false });
      setValue(`paymentABLItems.${index}.chargeNo`, String(chargeNo), { shouldValidate: false });
      setValue(`paymentABLItems.${index}.orderDate`, charge.chargeDate, { shouldValidate: false });
      setValue(`paymentABLItems.${index}.dueDate`, charge.date, { shouldValidate: false });
      setValue(`paymentABLItems.${index}.expenseAmount`, finalAmount, { shouldValidate: false });
      // Balance will be calculated automatically by useEffect (expenseAmount - paidAmount)
      setValue(`paymentABLItems.${index}.balance`, finalAmount || null, { shouldValidate: false });
      // Reset paid amount to 0 for new entry
      setValue(`paymentABLItems.${index}.paidAmount`, null, { shouldValidate: false });
      setValue('paidTo', charge.paidTo || watch('paidTo'), { shouldValidate: false });
      setShowChargePopup(null);
      setChargeSearch('');
    } catch (error) {
      console.error('Error checking payment history:', error);
      // Continue with normal flow if history check fails
      toast.warning('Could not check payment history. Proceeding with charge selection.');
      
      let finalAmount = charge.amount || null;
      
      // Try to apply Munshyana deduction in error case too
      const selectedVehicleNo = paymentABLItems?.[index]?.vehicleNo || '';
      const orderNo = charge.orderNo || '';
      
      console.log('Error case - checking for BillPaymentInvoice:', {
        selectedVehicleNo,
        orderNo
      });
      
      const matchingBillPayment = billPaymentInvoices.find((bill: any) => {
        if (!bill.lines || !Array.isArray(bill.lines)) return false;
        return bill.lines.some((line: any) => {
          const vehicleMatch = line.vehicleNo === selectedVehicleNo;
          const orderMatch = line.orderNo === orderNo || line.orderNo === String(orderNo);
          // MUST match BOTH vehicle AND order (not just one)
          return !line.isAdditionalLine && vehicleMatch && orderMatch;
        });
      });
      
      if (matchingBillPayment && matchingBillPayment.lines) {
        const mainLine = matchingBillPayment.lines.find((l: any) => !l.isAdditionalLine);
        if (mainLine) {
          const chargeAmount = Number(charge.amount) || 0;
          const munshayanaDeduction = Number(mainLine.munshayana) || 0;
          finalAmount = chargeAmount - munshayanaDeduction;
          
          console.log('Error case - Munshyana deduction applied:', {
            chargeAmount,
            munshayanaDeduction,
            finalAmount
          });
        }
      }
      
      setValue(`paymentABLItems.${index}.charges`, String(charge.chargeName || charge.vehicle || charge.chargeNo || ''), { shouldValidate: false });
      setValue(`paymentABLItems.${index}.chargeNo`, String(charge.chargeNo || ''), { shouldValidate: false });
      setValue(`paymentABLItems.${index}.orderDate`, charge.chargeDate, { shouldValidate: false });
      setValue(`paymentABLItems.${index}.dueDate`, charge.date, { shouldValidate: false });
      setValue(`paymentABLItems.${index}.expenseAmount`, finalAmount, { shouldValidate: false });
      setValue(`paymentABLItems.${index}.balance`, finalAmount || null, { shouldValidate: false });
      // Reset paid amount to 0 for new entry
      setValue(`paymentABLItems.${index}.paidAmount`, null, { shouldValidate: false });
      setValue('paidTo', charge.paidTo || watch('paidTo'), { shouldValidate: false });
      setShowChargePopup(null);
      setChargeSearch('');
    }
  };

  // Set of vehicles selected in the table (used to mark charges)
  const selectedVehiclesSet = new Set<string>(
    paymentABLItems.map((row) => String(row.vehicleNo || '').trim()).filter(Boolean)
  );

  const addTableRow = () => {
    setValue('paymentABLItems', [
      ...paymentABLItems,
      {
        id: null,
        vehicleNo: '',
        orderNo: '',
        charges: '',
        chargeNo: '',
        orderDate: '',
        dueDate: '',
        expenseAmount: null,
        balance: null,
        paidAmount: null,
      },
    ], { shouldValidate: true });
  };

  const removeTableRow = (index: number) => {
    if (paymentABLItems.length > 1) {
      const newPaymentABLItems = paymentABLItems.filter((_, i) => i !== index);
      setValue('paymentABLItems', newPaymentABLItems, { shouldValidate: true });
    }
  };
  
  const isViewMode = searchParams.get('mode') === 'view';
  const isFieldDisabled = (): boolean => {
  return isViewMode;  
  };
  const onSubmit = async (data: PaymentFormData) => {
    setIsSubmitting(true);
    try {
      const currentDateTime = new Date().toISOString();
      const userId = '3fa85f64-5717-4562-b3fc-2c963f66afa6';
      const payload = {
        id: isEdit ? initialData?.id || window.location.pathname.split('/').pop() || null : null,
        isActive: true,
        isDeleted: false,
        createdDateTime: isEdit ? initialData?.createdDateTime || currentDateTime : currentDateTime,
        createdBy: isEdit ? initialData?.createdBy || userId : userId,
        modifiedDateTime: currentDateTime,
        modifiedBy: userId,
        creationDate: isEdit ? initialData?.createdDateTime || currentDateTime : currentDateTime,
        updatedBy: userId,
        updationDate: currentDateTime,
        status: initialData?.status || 'Active',
        paymentNo: String(data.paymentNo) || `PAY${Date.now()}${Math.floor(Math.random() * 1000)}`,
        paymentDate: data.paymentDate,
        paymentMode: data.paymentMode,
        bankName: bankName || data.bankName || initialData?.bankName || '',
        chequeNo: data.chequeNo || '',
        chequeDate: data.chequeDate || '',
        remarks: data.remarks || '',
        paidTo: data.paidTo,
        paidAmount: data.paidAmount !== null && data.paidAmount !== undefined ? String(data.paidAmount) : null,
        advanced: data.advanced !== null && data.advanced !== undefined ? String(data.advanced) : null,
        advancedDate: data.advancedDate || '',
        pdc: data.pdc !== null && data.pdc !== undefined ? String(data.pdc) : null,
        pdcDate: data.pdcDate || '',
        paymentAmount: data.paymentAmount !== null && data.paymentAmount !== undefined ? String(data.paymentAmount) : null,
        paymentABLItem: data.paymentABLItems.map(row => {
          // Calculate the correct balance: expenseAmount - paidAmount
          const expenseAmount = Number(row.expenseAmount) || 0;
          const paidAmount = Number(row.paidAmount) || 0;
          const calculatedBalance = expenseAmount - paidAmount;
          const finalBalance = calculatedBalance >= 0 ? calculatedBalance : 0;
          
          return {
            id: row.id ?? null,
            vehicleNo: row.vehicleNo || '',
            orderNo: row.orderNo || '',
            charges: row.charges || row.chargeNo || '',
            orderDate: row.orderDate || '',
            dueDate: row.dueDate || '',
            expenseAmount: row.expenseAmount !== null && row.expenseAmount !== undefined ? String(row.expenseAmount) : null,
            balance: String(finalBalance),
            paidAmount: row.paidAmount !== null && row.paidAmount !== undefined ? String(row.paidAmount) : null,
          };
        }),
      };

      if (isEdit) {
        await updatePaymentABL(payload);
        toast.success('Payment updated successfully');
      } else {
        await createPaymentABL(payload);
        toast.success('Payment created successfully');
      }
      router.push('/paymentABL');
    } catch (error) {
      console.error('Error saving payment:', error);
      toast.error('An error occurred while saving the payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-800 p-2 md:p-4">
      <div className="max-w-6xl mx-auto">
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

        <div className="max-w-7xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          {!isViewMode && (
          <div className="bg-gradient-to-r from-[#3a614c] to-[#6e997f] text-white px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="bg-white/20 p-1.5 rounded-md">
                  <FaFileInvoice className="text-lg" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold">{isEdit ? 'Edit Payment' : 'Add New Payment'}</h1>
                  <p className="text-white/80 text-xs">{isEdit ? 'Update payment record' : 'Create a new payment record'}</p>
                </div>
              </div>
              <Link href="/paymentABL">
                <Button
                  type="button"
                  className="bg-white/10 hover:bg-white/20 text-white rounded-md transition-all duration-200 border border-white/20 px-3 py-1 text-sm"
                >
                  <FiX className="mr-1" /> Cancel
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
              This Payment record is read-only. No changes can be made.
            </p>
          </div>
        </div>
      )}

          <form onSubmit={handleSubmit(onSubmit)} className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
              <div className="relative">
                <ABLCustomInput
                  label="Payment #"
                  type="text"
                  placeholder={isEdit ? 'Payment No' : 'Auto-generated'}
                  register={register}
                  error={errors.paymentNo?.message}
                  id="paymentNo"
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
                label="Payment Date"
                type="date"
                register={register}
                error={errors.paymentDate?.message}
                id="paymentDate"
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
              <ABLCustomInput
                label="Paid To"
                type="text"
                placeholder="Auto-filled from order"
                register={register}
                error={errors.paidTo?.message}
                id="paidTo"
                disabled
              />
              <ABLCustomInput
                label="Paid Amount"
                type="text"
                placeholder="Auto-calculated"
                register={register}
                error={errors.paidAmount?.message}
                id="paidAmount"
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
              <ABLCustomInput
                label="Advanced"
                type="number"
                placeholder="Enter advanced amount"
                register={register}
                error={errors.advanced?.message}
                id="advanced"
                {...register('advanced', { valueAsNumber: true })}
                disabled={isViewMode}
              />
              <ABLCustomInput
                label="Advanced Date"
                type="date"
                placeholder="Select advanced date"
                register={register}
                error={errors.advancedDate?.message}
                id="advancedDate"
                disabled={isViewMode}
              />
              <ABLCustomInput
                label="PDC"
                type="number"
                placeholder="Enter PDC amount"
                register={register}
                error={errors.pdc?.message}
                id="pdc"
                {...register('pdc', { valueAsNumber: true })}
                disabled={isViewMode}
              />
              <ABLCustomInput
                label="PDC Date"
                type="date"
                placeholder="Select PDC date"
                register={register}
                error={errors.pdcDate?.message}
                id="pdcDate"
                disabled={isViewMode}
              />
              <ABLCustomInput
                label="Payment Amount"
                type="text"
                placeholder="Auto-calculated"
                register={register}
                error={errors.paymentAmount?.message}
                id="paymentAmount"
                disabled
              />
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 mb-6">
              <div className="bg-gradient-to-r from-[#3a614c] to-[#6e997f] text-white px-4 py-3 rounded-t-lg">
                <div className="flex items-center gap-2">
                  <FaMoneyBillWave className="text-lg" />
                  <h3 className="text-base font-semibold">Payment Details</h3>
                </div>
              </div>

              <div className="p-4">
                <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-600 -mx-4 sm:mx-0">
                  <div className="inline-block min-w-full align-middle">
                    <table className="min-w-full text-xs sm:text-sm">
                      <thead>
                        <tr className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600">
                          <th className="px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold text-gray-700 dark:text-gray-200 border-r border-gray-200 dark:border-gray-500 min-w-[100px] sm:min-w-[120px]">
                            Vehicle No
                          </th>
                          <th className="px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold text-gray-700 dark:text-gray-200 border-r border-gray-200 dark:border-gray-500 min-w-[100px] sm:min-w-[120px]">
                            Order No
                          </th>
                          <th className="px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold text-gray-700 dark:text-gray-200 border-r border-gray-200 dark:border-gray-500 min-w-[100px] sm:min-w-[120px]">
                            Charges
                          </th>
                          <th className="px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold text-gray-700 dark:text-gray-200 border-r border-gray-200 dark:border-gray-500 min-w-[90px] sm:min-w-[110px]">
                            Order Date
                          </th>
                          <th className="px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold text-gray-700 dark:text-gray-200 border-r border-gray-200 dark:border-gray-500 min-w-[90px] sm:min-w-[110px]">
                            Due Date
                          </th>
                          <th className="px-2 sm:px-4 py-2 sm:py-3 text-right font-semibold text-gray-700 dark:text-gray-200 border-r border-gray-200 dark:border-gray-500 min-w-[100px] sm:min-w-[120px]">
                            Expense Amount
                          </th>
                          <th className="px-2 sm:px-4 py-2 sm:py-3 text-right font-semibold text-gray-700 dark:text-gray-200 border-r border-gray-200 dark:border-gray-500 min-w-[90px] sm:min-w-[100px]">
                            Balance
                          </th>
                          <th className="px-2 sm:px-4 py-2 sm:py-3 text-right font-semibold text-gray-700 dark:text-gray-200 min-w-[110px] sm:min-w-[130px]">
                            Paid Amount
                          </th>
                          <th className="px-2 sm:px-4 py-2 sm:py-3 text-right font-semibold text-gray-700 dark:text-gray-200 min-w-[70px] sm:min-w-[100px]">
                            Action
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800">
                        {paymentABLItems.map((row, index) => (
                          <tr key={index} className="border-b border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                            <td className="px-2 sm:px-4 py-2 sm:py-3 border-r border-gray-200 dark:border-gray-600">
                              <Button
                                type="button"
                                onClick={() => setShowOrderPopup(index)}
                                className="w-full px-2 sm:px-3 py-1.5 sm:py-2 bg-[#3a614c] hover:bg-[#3a614c]/90 text-white text-xs sm:text-sm rounded-md transition-all duration-200 shadow-sm hover:shadow-md whitespace-nowrap overflow-hidden text-ellipsis"
                                disabled={isViewMode}  
                              >
                                {row.vehicleNo || 'Select'}
                              </Button>
                              {errors.paymentABLItems?.[index]?.orderNo && (
                                <p className="text-red-500 text-xs mt-1">{errors.paymentABLItems[index].orderNo.message}</p>
                              )}
                            </td>
                            <td className="px-2 sm:px-4 py-2 sm:py-3 border-r border-gray-200 dark:border-gray-600">
                              <input
                                {...register(`paymentABLItems.${index}.orderNo`)}
                                disabled
                                className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 dark:border-gray-500 rounded-md text-xs sm:text-sm bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 focus:outline-none"
                                placeholder="Order No"
                              />
                            </td>
                            <td className="px-2 sm:px-4 py-2 sm:py-3 border-r border-gray-200 dark:border-gray-600">
                              <Button
                                type="button"
                                onClick={() => setShowChargePopup(index)}
                                className="w-full px-2 sm:px-3 py-1.5 sm:py-2 bg-[#3a614c] hover:bg-[#3a614c]/90 text-white text-xs sm:text-sm rounded-md transition-all duration-200 shadow-sm hover:shadow-md whitespace-nowrap overflow-hidden text-ellipsis"
                                disabled={isViewMode || !row.vehicleNo || !row.orderNo}
                              >
                                {row.charges || row.chargeNo || 'Select'}
                              </Button>
                              {errors.paymentABLItems?.[index]?.charges && (
                                <p className="text-red-500 text-xs mt-1">{errors.paymentABLItems[index].charges.message}</p>
                              )}
                            </td>
                            <td className="px-2 sm:px-4 py-2 sm:py-3 border-r border-gray-200 dark:border-gray-600">
                              <input
                                {...register(`paymentABLItems.${index}.orderDate`)}
                                disabled
                                className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 dark:border-gray-500 rounded-md text-xs sm:text-sm bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 focus:outline-none"
                                placeholder="Date"
                              />
                            </td>
                            <td className="px-2 sm:px-4 py-2 sm:py-3 border-r border-gray-200 dark:border-gray-600">
                              <input
                                {...register(`paymentABLItems.${index}.dueDate`)}
                                disabled
                                className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 dark:border-gray-500 rounded-md text-xs sm:text-sm bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 focus:outline-none"
                                placeholder="Date"
                              />
                            </td>
                            <td className="px-2 sm:px-4 py-2 sm:py-3 border-r border-gray-200 dark:border-gray-600">
                              <input
                                {...register(`paymentABLItems.${index}.expenseAmount`, { valueAsNumber: true })}
                                disabled
                                className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 dark:border-gray-500 rounded-md text-xs sm:text-sm bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-right focus:outline-none"
                                placeholder="0.00"
                              />
                            </td>
                            <td className="px-2 sm:px-4 py-2 sm:py-3 border-r border-gray-200 dark:border-gray-600">
                              <input
                                value={(() => {
                                  const expenseAmount = Number(row.expenseAmount) || 0;
                                  const paidAmount = Number(row.paidAmount) || 0;
                                  const balance = expenseAmount - paidAmount;
                                  return balance >= 0 ? balance.toFixed(2) : '0.00';
                                })()}
                                disabled
                                className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 dark:border-gray-500 rounded-md text-xs sm:text-sm bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-right focus:outline-none font-medium"
                                placeholder="0.00"
                              />
                            </td>
                            <td className="px-2 sm:px-4 py-2 sm:py-3">
                              <input
                                {...register(`paymentABLItems.${index}.paidAmount`, { valueAsNumber: true })}
                                className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 dark:border-gray-500 rounded-md text-xs sm:text-sm focus:ring-2 focus:ring-[#3a614c] focus:border-[#3a614c] dark:bg-gray-700 dark:text-white text-right transition-all duration-200"
                                placeholder="0.00"
                                type="number"
                                min="0"
                                step="0.01"
                                disabled={isViewMode}
                                onBlur={(e) => numberInputHandlers.onBlur(e, 2)}
                                onFocus={numberInputHandlers.onFocus}
                              />
                              {errors.paymentABLItems?.[index]?.paidAmount && (
                                <p className="text-red-500 text-xs mt-1">{errors.paymentABLItems[index].paidAmount.message}</p>
                              )}
                            </td>
                            <td className="px-2 sm:px-4 py-2 sm:py-3">
                              <Button
                                type="button"
                                onClick={() => removeTableRow(index)}
                                className="bg-red-500 hover:bg-red-600 text-white text-xs px-2 py-1 rounded-md"
                                disabled={paymentABLItems.length <= 1 || isViewMode}
                              >
                                <FiX />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="text-black bg-gray-50 dark:bg-gray-700">
                          <td colSpan={5} className="px-2 sm:px-4 py-2 sm:py-3 text-right font-bold text-xs sm:text-base">
                            TOTALS:
                          </td>
                          <td className="px-2 sm:px-4 py-2 sm:py-3 font-bold text-right text-xs sm:text-base border-r border-white/20">
                            {paymentABLItems.reduce((sum, row) => sum + (Number(row.expenseAmount) || 0), 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="px-2 sm:px-4 py-2 sm:py-3 font-bold text-right text-xs sm:text-base border-r border-white/20">
                            {paymentABLItems.reduce((sum, row) => {
                              const expenseAmount = Number(row.expenseAmount) || 0;
                              const paidAmount = Number(row.paidAmount) || 0;
                              const balance = expenseAmount - paidAmount;
                              return sum + (balance >= 0 ? balance : 0);
                            }, 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="px-2 sm:px-4 py-2 sm:py-3 font-bold text-right text-xs sm:text-base">
                            {paymentABLItems.reduce((sum, row) => sum + (Number(row.paidAmount) || 0), 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="px-2 sm:px-4 py-2 sm:py-3"></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>

                <div className="mt-4 flex flex-col sm:flex-row justify-between items-center gap-3">
                  <Button
                    type="button"
                    onClick={addTableRow}
                    className="w-full sm:w-auto bg-gradient-to-r from-[#3a614c] to-[#6e997f] hover:from-[#3a614c]/90 hover:to-[#6e997f]/90 text-white px-4 py-2 rounded-md transition-all duration-200 shadow-md hover:shadow-lg text-sm"
                    disabled={isViewMode}
                 >
                    + Add New Row
                  </Button>
                  <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                    Total Rows: {paymentABLItems.length}
                  </div>
                </div>
              </div>
            </div>

      <div className="flex justify-end gap-4 pt-4 border-t border-gray-200 dark:border-gray-700 mt-4">
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
          <span>{isEdit ? 'Update Payment' : 'Create Payment'}</span>
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
              <MdInfo className="text-[#3a614c]" />
              <span>Fill in all required fields marked with an asterisk (*)</span>
            </div>
            <Link href="/paymentABL" className="text-[#3a614c] hover:text-[#6e997f] text-sm font-medium">
              Back to Payments
            </Link>
          </div>
        </div>

        {/* Booking Order Selection Popup */}
        {showOrderPopup !== null && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-7xl w-full max-h-[90vh] flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Select Booking Order or Opening Balance</h3>
                <Button
                  onClick={() => {
                    setShowOrderPopup(null);
                    setOrderSearch('');
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
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  placeholder="Search by Vehicle No, Order No, Broker, Charges..."
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-[#3a614c] focus:border-transparent"
                />
              </div>

              {/* Side by Side Content */}
              <div className="flex-1 overflow-hidden flex gap-4 p-4">
                {/* Left Side - Booking Orders */}
                <div className="flex-1 flex flex-col border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                  <div className="bg-gradient-to-r from-[#3a614c] to-[#6e997f] text-white px-4 py-3">
                    <h4 className="font-semibold text-base">Booking Orders</h4>
                  </div>
                  <div className="flex-1 overflow-y-auto">
                    {filteredBookingOrders.length === 0 ? (
                      <p className="text-sm text-gray-600 dark:text-gray-400 text-center py-12">No booking orders found</p>
                    ) : (
                      <table className="w-full text-sm">
                        <thead className="sticky top-0 bg-gray-50 dark:bg-gray-700">
                          <tr>
                            <th className="px-3 py-2 text-left font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-600">
                              Vehicle No
                            </th>
                            <th className="px-3 py-2 text-left font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-600">
                              Order No
                            </th>
                            <th className="px-3 py-2 text-left font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-600">
                              Date
                            </th>
                            <th className="px-3 py-2 text-left font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-600">
                              Vendor
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800">
                          {filteredBookingOrders.map((order) => (
                            <tr
                              key={order.id}
                              onClick={() => selectOrder(showOrderPopup, order)}
                              className="border-b border-gray-100 dark:border-gray-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors cursor-pointer"
                            >
                              <td className="px-3 py-3 text-gray-800 dark:text-gray-200 font-medium">
                                {order.vehicleNo}
                              </td>
                              <td className="px-3 py-3 text-gray-600 dark:text-gray-400">
                                {order.orderNo}
                              </td>
                              <td className="px-3 py-3 text-gray-600 dark:text-gray-400">
                                {order.orderDate}
                              </td>
                              <td className="px-3 py-3 text-gray-600 dark:text-gray-400">
                                {order.vendorName}
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
                              Vehicle No
                            </th>
                            <th className="px-3 py-2 text-left font-semibold text-amber-900 dark:text-amber-200 border-b border-amber-200 dark:border-amber-700">
                              Broker
                            </th>
                            <th className="px-3 py-2 text-left font-semibold text-amber-900 dark:text-amber-200 border-b border-amber-200 dark:border-amber-700">
                              Charge Type
                            </th>
                            <th className="px-3 py-2 text-left font-semibold text-amber-900 dark:text-amber-200 border-b border-amber-200 dark:border-amber-700">
                              Date
                            </th>
                            <th className="px-3 py-2 text-right font-semibold text-amber-900 dark:text-amber-200 border-b border-amber-200 dark:border-amber-700">
                              Credit Amount
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800">
                          {filteredOpeningBalances.map((ob) => (
                            <tr
                              key={ob.id}
                              onClick={() => selectOpeningBalance(showOrderPopup!, ob)}
                              className="border-b border-amber-100 dark:border-amber-900/30 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors cursor-pointer"
                            >
                              <td className="px-3 py-3 text-amber-900 dark:text-amber-200 font-medium">
                                {ob.biltyNo}
                              </td>
                              <td className="px-3 py-3 text-amber-800 dark:text-amber-300">
                                {ob.vehicleNo}
                              </td>
                              <td className="px-3 py-3 text-amber-700 dark:text-amber-400">
                                {ob.broker || '-'}
                              </td>
                              <td className="px-3 py-3 text-amber-700 dark:text-amber-400">
                                {ob.chargeType || '-'}
                              </td>
                              <td className="px-3 py-3 text-amber-700 dark:text-amber-400">
                                {ob.biltyDate}
                              </td>
                              <td className="px-3 py-3 text-right text-amber-900 dark:text-amber-200 font-medium">
                                {ob.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
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
                    setShowOrderPopup(null);
                    setOrderSearch('');
                  }}
                  className="bg-gray-500 hover:bg-gray-600 text-white text-sm py-2 px-4 rounded-md"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Charges Selection Popup */}
        {showChargePopup !== null && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-3 sm:p-6 shadow-xl max-w-3xl w-full mx-2 sm:mx-4 max-h-[95vh] flex flex-col">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h3 className="text-sm sm:text-base font-semibold text-gray-800 dark:text-gray-200">Select Charges</h3>
                <Button
                  onClick={() => {
                    setShowChargePopup(null);
                    setChargeSearch('');
                  }}
                  className="text-gray-400 hover:text-gray-600 p-1"
                  variant="ghost"
                >
                  <FiX className="text-base sm:text-lg" />
                </Button>
              </div>
              <div className="mb-3 sm:mb-4">
                <input
                  type="text"
                  placeholder="Search charges..."
                  value={chargeSearch}
                  onChange={(e) => setChargeSearch(e.target.value)}
                  className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-md text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#3a614c] dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div className="flex-1 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-600">
                {getFilteredCharges(showChargePopup).length === 0 ? (
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 p-4 text-center">No approved charges available for this order</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs sm:text-sm">
                      <thead>
                        <tr className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600">
                          <th className="px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold text-gray-700 dark:text-gray-200 border-r border-gray-200 dark:border-gray-500 min-w-[80px] sm:min-w-auto">
                            Charges
                          </th>
                          <th className="px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold text-gray-700 dark:text-gray-200 border-r border-gray-200 dark:border-gray-500 min-w-[80px] sm:min-w-auto">
                            Vehicle
                          </th>
                          <th className="px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold text-gray-700 dark:text-gray-200 border-r border-gray-200 dark:border-gray-500 min-w-[80px] sm:min-w-auto">
                            Order No
                          </th>
                          <th className="px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold text-gray-700 dark:text-gray-200 border-r border-gray-200 dark:border-gray-500 hidden sm:table-cell">
                            Order Date
                          </th>
                          <th className="px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold text-gray-700 dark:text-gray-200 border-r border-gray-200 dark:border-gray-500 hidden sm:table-cell">
                            Due Date
                          </th>
                          <th className="px-2 sm:px-4 py-2 sm:py-3 text-right font-semibold text-gray-700 dark:text-gray-200 border-r border-gray-200 dark:border-gray-500 min-w-[70px] sm:min-w-auto">
                            Amount
                          </th>
                          <th className="px-2 sm:px-4 py-2 sm:py-3 text-right font-semibold text-gray-700 dark:text-gray-200 min-w-[70px] sm:min-w-auto">
                            Balance
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800">
                        {getFilteredCharges(showChargePopup).map((charge) => (
                          <tr
                            key={charge.id}
                            onClick={() => selectCharge(showChargePopup, charge)}
                            className="border-b border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
                          >
                            <td className="px-2 sm:px-4 py-2 sm:py-3 border-r border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-200">
                              {charge.chargeNo}
                            </td>
                            <td className="px-2 sm:px-4 py-2 sm:py-3 border-r border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-200">
                              {charge.vehicle}{selectedVehiclesSet.has(String(charge.vehicle || '').trim()) ? ' (✓)' : ''}
                            </td>
                            <td className="px-2 sm:px-4 py-2 sm:py-3 border-r border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-200">
                              {charge.orderNo}
                            </td>
                            <td className="px-2 sm:px-4 py-2 sm:py-3 border-r border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-200 hidden sm:table-cell">
                              {charge.chargeDate}
                            </td>
                            <td className="px-2 sm:px-4 py-2 sm:py-3 border-r border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-200 hidden sm:table-cell">
                              {charge.date}
                            </td>
                            <td className="px-2 sm:px-4 py-2 sm:py-3 border-r border-gray-200 dark:border-gray-600 text-right text-gray-800 dark:text-gray-200">
                              {Number(charge.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td className="px-2 sm:px-4 py-2 sm:py-3 text-right text-gray-800 dark:text-gray-200">
                              {Number(charge.balance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
              <div className="flex justify-end mt-3 sm:mt-4">
                <Button
                  onClick={() => {
                    setShowChargePopup(null);
                    setChargeSearch('');
                  }}
                  className="bg-gray-500 hover:bg-gray-600 text-white text-xs sm:text-sm py-1.5 sm:py-2 px-3 sm:px-4 rounded-md"
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

export default PaymentForm;
