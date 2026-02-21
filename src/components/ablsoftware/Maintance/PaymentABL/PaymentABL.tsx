'use client';
import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
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
import { toast } from 'react-toastify';
import { useRouter, useSearchParams } from 'next/navigation';
import { MdInfo } from 'react-icons/md';
import { FaFileInvoice, FaMoneyBillWave } from 'react-icons/fa';
import { FiSave, FiX } from 'react-icons/fi';
import Link from 'next/link';
import { isEqual } from 'lodash'; // Optional, remove if using custom areItemsEqual

// Interfaces
interface DropdownOption {
  id: string;
  name: string;
}

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
  paidAmount: z.number().min(0, 'Paid Amount must be non-negative').nullable(),
  advanced: z.number().min(0, 'Advanced Amount must be non-negative').nullable(),
  advancedDate: z.string().optional(),
  pdc: z.number().min(0, 'PDC Amount must be non-negative').nullable(),
  pdcDate: z.string().optional(),
  paymentAmount: z.number().min(0, 'Payment Amount must be non-negative').nullable(),
  paymentABLItems: z.array(
    z.object({
      id: z.string().optional().nullable(),
      vehicleNo: z.string().optional(),
      orderNo: z.string().min(1, 'Order No is required').optional(),
      charges: z.string().min(1, 'Charges are required').optional(),
      chargeNo: z.string().optional(),
      orderDate: z.string().optional(),
      dueDate: z.string().optional(),
      expenseAmount: z.number().min(0, 'Expense Amount must be non-negative').nullable(),
      balance: z.number().min(0, 'Balance must be non-negative').nullable(),
      paidAmount: z.number().min(0, 'Paid Amount must be non-negative').nullable(),
    })
  ),
});

type PaymentFormData = z.infer<typeof paymentSchema>;

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
        paidAmount: initialData.paidAmount ?? null,
        advanced: initialData.advanced ?? null,
        advancedDate: initialData.advancedDate || '',
        pdc: initialData.pdc ?? null,
        pdcDate: initialData.pdcDate || '',
        paymentAmount: initialData.paymentAmount ?? null,
        paymentABLItems: (initialData.paymentABLItems || initialData.paymentABLItem)?.map?.((row: any) => ({
          id: row.id ?? null,
          vehicleNo: row.vehicleNo || '',
          orderNo: row.orderNo || '',
          charges: row.charges || '',
          chargeNo: row.chargeNo || '',
          orderDate: row.orderDate || '',
          dueDate: row.dueDate || '',
          expenseAmount: row.expenseAmount ?? null,
          balance: row.balance ?? null,
          paidAmount: row.paidAmount ?? null,
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

  const bankNames: DropdownOption[] = [
      { id: 'HBL', name: 'Habib Bank Limited (HBL)' },
    { id: 'HMB', name: 'Habib Metro Bank (HMB)' },
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
    { id: 'PettyCash', name: 'Petty Cash' },
    { id: 'Other', name: 'Other' },
  ];

  const paymentABLItems = watch('paymentABLItems');

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
        const [orderRes, chargeRes, billPaymentRes, munshyanaRes, openingBalanceRes, vendorRes] = await Promise.all([
          getAllBookingOrder(1, 10000),
          getAllCharges(1, 10000),
          getAllBiltyPaymentInvoice(1, 10000),
          getAllMunshyana(1, 10000),
          getAllOpeningBalance(1, 10000),
          getAllVendor(1, 10000),
        ]);
        
        // Create vendor lookup map
        const vendorMap = new Map();
        (vendorRes.data || []).forEach((vendor: any) => {
          vendorMap.set(vendor.id, vendor.vendorName || vendor.name || 'Unknown');
        });
        
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
        expenseAmount: row.expenseAmount ?? null,
        balance: row.balance ?? null,
        paidAmount: row.paidAmount ?? null,
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
        paidAmount: initialData.paidAmount ?? null,
        advanced: initialData.advanced ?? null,
        advancedDate: initialData.advancedDate || '',
        pdc: initialData.pdc ?? null,
        pdcDate: initialData.pdcDate || '',
        paymentAmount: initialData.paymentAmount ?? null,
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

  const selectOpeningBalance = (index: number, ob: any) => {
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
          
          // History API returns data directly, not wrapped in .data
          const historyData = Array.isArray(historyRes) ? historyRes : (historyRes?.data && Array.isArray(historyRes.data) ? historyRes.data : (historyRes ? [historyRes] : []));
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
        } catch (historyError) {
          console.warn('History check failed, continuing with normal flow:', historyError);
          // Continue with normal flow if history check fails
        }
      } else {
        console.warn('Skipping history check - missing required fields:', { vehicleNo, orderNo, chargeNo });
      }

      // No history or history check skipped - use charge amount only (not BillPaymentInvoice)
      console.log('No history found or history check skipped - using Charge amount only');
      let finalAmount = charge.amount || null;

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
        bankName: data.bankName || '',
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
                type="number"
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
                type="number"
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
                <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-600">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600">
                        <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-200 border-r border-gray-200 dark:border-gray-500 min-w-[120px]">
                          Vehicle No
                        </th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-200 border-r border-gray-200 dark:border-gray-500 min-w-[120px]">
                          Order No
                        </th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-200 border-r border-gray-200 dark:border-gray-500 min-w-[120px]">
                          Charges
                        </th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-200 border-r border-gray-200 dark:border-gray-500 min-w-[110px]">
                          Order Date
                        </th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-200 border-r border-gray-200 dark:border-gray-500 min-w-[110px]">
                          Due Date
                        </th>
                        <th className="px-4 py-3 text-right font-semibold text-gray-700 dark:text-gray-200 border-r border-gray-200 dark:border-gray-500 min-w-[120px]">
                          Expense Amount
                        </th>
                        <th className="px-4 py-3 text-right font-semibold text-gray-700 dark:text-gray-200 border-r border-gray-200 dark:border-gray-500 min-w-[100px]">
                          Balance
                        </th>
                        <th className="px-4 py-3 text-right font-semibold text-gray-700 dark:text-gray-200 min-w-[130px]">
                          Paid Amount
                        </th>
                        <th className="px-4 py-3 text-right font-semibold text-gray-700 dark:text-gray-200 min-w-[100px]">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800">
                      {paymentABLItems.map((row, index) => (
                        <tr key={index} className="border-b border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                          <td className="px-4 py-3 border-r border-gray-200 dark:border-gray-600">
                            <Button
                              type="button"
                              onClick={() => setShowOrderPopup(index)}
                              className="w-full px-3 py-2 bg-[#3a614c] hover:bg-[#3a614c]/90 text-white text-sm rounded-md transition-all duration-200 shadow-sm hover:shadow-md"
                              disabled={isViewMode}  
                            >
                              {row.vehicleNo || 'Select Vehicle'}
                            </Button>
                            {errors.paymentABLItems?.[index]?.orderNo && (
                              <p className="text-red-500 text-xs mt-1">{errors.paymentABLItems[index].orderNo.message}</p>
                            )}
                          </td>
                          <td className="px-4 py-3 border-r border-gray-200 dark:border-gray-600">
                            <input
                              {...register(`paymentABLItems.${index}.orderNo`)}
                              disabled
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-500 rounded-md text-sm bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 focus:outline-none"
                              placeholder="Order No"
                            />
                          </td>
                          <td className="px-4 py-3 border-r border-gray-200 dark:border-gray-600">
                            <Button
                              type="button"
                              onClick={() => setShowChargePopup(index)}
                              className="w-full px-3 py-2 bg-[#3a614c] hover:bg-[#3a614c]/90 text-white text-sm rounded-md transition-all duration-200 shadow-sm hover:shadow-md"
                              disabled={isViewMode || !row.vehicleNo || !row.orderNo}
                            >
                              {row.charges || row.chargeNo || 'Select Charges'}
                            </Button>
                            {errors.paymentABLItems?.[index]?.charges && (
                              <p className="text-red-500 text-xs mt-1">{errors.paymentABLItems[index].charges.message}</p>
                            )}
                          </td>
                          <td className="px-4 py-3 border-r border-gray-200 dark:border-gray-600">
                            <input
                              {...register(`paymentABLItems.${index}.orderDate`)}
                              disabled
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-500 rounded-md text-sm bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 focus:outline-none"
                              placeholder="Date"
                            />
                          </td>
                          <td className="px-4 py-3 border-r border-gray-200 dark:border-gray-600">
                            <input
                              {...register(`paymentABLItems.${index}.dueDate`)}
                              disabled
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-500 rounded-md text-sm bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 focus:outline-none"
                              placeholder="Date"
                            />
                          </td>
                          <td className="px-4 py-3 border-r border-gray-200 dark:border-gray-600">
                            <input
                              {...register(`paymentABLItems.${index}.expenseAmount`, { valueAsNumber: true })}
                              disabled
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-500 rounded-md text-sm bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-right focus:outline-none"
                              placeholder="0.00"
                            />
                          </td>
                          <td className="px-4 py-3 border-r border-gray-200 dark:border-gray-600">
                            <input
                              value={(() => {
                                const expenseAmount = Number(row.expenseAmount) || 0;
                                const paidAmount = Number(row.paidAmount) || 0;
                                const balance = expenseAmount - paidAmount;
                                return balance >= 0 ? balance.toFixed(2) : '0.00';
                              })()}
                              disabled
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-500 rounded-md text-sm bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-right focus:outline-none font-medium"
                              placeholder="0.00"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              {...register(`paymentABLItems.${index}.paidAmount`, { valueAsNumber: true })}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-500 rounded-md text-sm focus:ring-2 focus:ring-[#3a614c] focus:border-[#3a614c] dark:bg-gray-700 dark:text-white text-right transition-all duration-200"
                              placeholder="0.00"
                              type="number"
                              min="0"
                              step="0.01"
                              disabled={isViewMode}
                            />
                            {errors.paymentABLItems?.[index]?.paidAmount && (
                              <p className="text-red-500 text-xs mt-1">{errors.paymentABLItems[index].paidAmount.message}</p>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <Button
                              type="button"
                              onClick={() => removeTableRow(index)}
                              className="bg-red-500 hover:bg-red-600 text-white text-xs px-2 py-1 rounded-md"
                              disabled={paymentABLItems.length <= 1}
                            >
                              <FiX />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="text-black">
                        <td colSpan={5} className="px-4 py-3 text-right font-bold text-base">
                          TOTALS:
                        </td>
                        <td className="px-4 py-3 font-bold text-right text-base border-r border-white/20">
                          {paymentABLItems.reduce((sum, row) => sum + (Number(row.expenseAmount) || 0), 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-3 font-bold text-right text-base border-r border-white/20">
                          {paymentABLItems.reduce((sum, row) => {
                            const expenseAmount = Number(row.expenseAmount) || 0;
                            const paidAmount = Number(row.paidAmount) || 0;
                            const balance = expenseAmount - paidAmount;
                            return sum + (balance >= 0 ? balance : 0);
                          }, 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-3 font-bold text-right text-base">
                          {paymentABLItems.reduce((sum, row) => sum + (Number(row.paidAmount) || 0), 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                    disabled={isViewMode}
                 >
                    + Add New Row
                  </Button>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
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
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-xl max-w-3xl w-full mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200">Select Charges</h3>
                <Button
                  onClick={() => {
                    setShowChargePopup(null);
                    setChargeSearch('');
                  }}
                  className="text-gray-400 hover:text-gray-600 p-1"
                  variant="ghost"
                >
                  <FiX className="text-lg" />
                </Button>
              </div>
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Search by Charge Name, Vehicle, Order No, Dates, or Amount..."
                  value={chargeSearch}
                  onChange={(e) => setChargeSearch(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#3a614c] dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div className="max-h-64 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-600">
                {getFilteredCharges(showChargePopup).length === 0 ? (
                  <p className="text-sm text-gray-600 dark:text-gray-400 p-4">No approved charges available for this order</p>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600">
                        <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-200 border-r border-gray-200 dark:border-gray-500">
                          Charges Name
                        </th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-200 border-r border-gray-200 dark:border-gray-500">
                          Vehicle
                        </th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-200 border-r border-gray-200 dark:border-gray-500">
                          Order No
                        </th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-200 border-r border-gray-200 dark:border-gray-500">
                          Order Date
                        </th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-200 border-r border-gray-200 dark:border-gray-500">
                          Due Date
                        </th>
                        <th className="px-4 py-3 text-right font-semibold text-gray-700 dark:text-gray-200 border-r border-gray-200 dark:border-gray-500">
                          Amount
                        </th>
                        <th className="px-4 py-3 text-right font-semibold text-gray-700 dark:text-gray-200">
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
                          <td className="px-4 py-3 border-r border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-200">
                            {charge.chargeNo}
                          </td>
                          <td className="px-4 py-3 border-r border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-200">
                            {charge.vehicle}{selectedVehiclesSet.has(String(charge.vehicle || '').trim()) ? ' (Selected)' : ''}
                          </td>
                          <td className="px-4 py-3 border-r border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-200">
                            {charge.orderNo}
                          </td>
                          <td className="px-4 py-3 border-r border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-200">
                            {charge.chargeDate}
                          </td>
                          <td className="px-4 py-3 border-r border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-200">
                            {charge.date}
                          </td>
                          <td className="px-4 py-3 border-r border-gray-200 dark:border-gray-600 text-right text-gray-800 dark:text-gray-200">
                            {Number(charge.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="px-4 py-3 text-right text-gray-800 dark:text-gray-200">
                            {Number(charge.balance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
              <div className="flex justify-end mt-4">
                <Button
                  onClick={() => {
                    setShowChargePopup(null);
                    setChargeSearch('');
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

export default PaymentForm;
