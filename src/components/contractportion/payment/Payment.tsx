'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { string, z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'react-toastify';
import CustomInput from '@/components/ui/CustomInput';
import CustomInputDropdown from '@/components/ui/CustomeInputDropdown';
// import Select from 'react-select';

import CustomSingleDatePicker from '@/components/ui/CustomDateRangePicker';
import { MdPayment } from 'react-icons/md';
import { BiSolidErrorAlt } from 'react-icons/bi';
import { FaTimes } from 'react-icons/fa';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { getAllSellers } from '@/apis/seller';
import { getAllBuyer } from '@/apis/buyer';
import { getAllInvoice } from '@/apis/invoice';
import { createPayment, updatePayment, getAllPayment } from '@/apis/payment';

// Schema for form validation
const PaymentSchema = z.object({
  paymentNumber: z.string().optional(),
  paymentDate: z.string().optional(),
  paymentType: z.enum(['Advance', 'Payment'], { required_error: 'Payment type is required' }),
  mode: z.string().min(1, 'Payment mode is required'),
  bankName: z.string().min(1, 'Bank name is required'),
  chequeNo: z.string().optional(),
  chequeDate: z.string().optional(),
  seller: z.string().min(1, 'Seller is required'),
  buyer: z.string().min(1, 'Buyer is required'),
  paidAmount: z.string().optional(),
  incomeTaxAmount: z.string().optional(),
  advanceReceived: z.string().optional(),
  remarks: z.string().optional(),
  relatedInvoices: z
    .array(
      z.object({
        id: z.string(),
        invoiceNumber: z.string(),
        invoiceDate: z.string(),
        dueDate: z.string(),
        seller: z.string(),
        buyer: z.string(),
        totalAmount: z.string(),
        receivedAmount: z.string().optional(),
        balance: z.string().optional(),
        invoiceAdjusted: z.string().optional(),
      })
    )
    .optional(),
});

type FormData = z.infer<typeof PaymentSchema>;

interface ExtendedInvoice {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  seller: string;
  buyer: string;
  totalAmount: string;
  receivedAmount: string;
  balance: string;
  invoiceAdjusted: string;
  isSelected?: boolean;
  invoiceValueWithGst?: string;
}

interface PaymentData {
  id?: string;
  paymentNumber?: string;
  paymentDate?: string;
  paymentType?: 'Advance' | 'Payment';
  mode?: string;
  bankName?: string;
  chequeNo?: string;
  chequeDate?: string;
  seller?: string;
  buyer?: string;
  paidAmount?: string;
  incomeTaxAmount?: string;
  advanceReceived?: string;
  remarks?: string;
  createdBy?: string;
  creationDate?: string;
  updatedBy?: string;
  updationDate?: string;
  status?: string;
  relatedInvoices?: {
    id?: string;
    invoiceNumber?: string;
    invoiceDate?: string;
    dueDate?: string;
    seller?: string;
    buyer?: string;
    totalAmount?: string;
    receivedAmount?: string;
    balance?: string;
    invoiceAdjusted?: string;
  }[];
}

interface PaymentFormProps {
  isEdit?: boolean;
  initialData?: PaymentData;
}

const PaymentForm = ({ isEdit = false, initialData }: PaymentFormProps) => {
  const router = useRouter();
  const [sellers, setSellers] = useState<{ id: string; name: string }[]>([]);
  const [buyers, setBuyers] = useState<{ id: string; name: string }[]>([]);
  const [invoices, setInvoices] = useState<ExtendedInvoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<ExtendedInvoice[]>([]);
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<string[]>([]);
  const [showInvoiceSelection, setShowInvoiceSelection] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetchingSellers, setFetchingSellers] = useState(false);
  const [fetchingBuyers, setFetchingBuyers] = useState(false);
  const [idFocused, setIdFocused] = useState(false);
  const [previousPayments, setPreviousPayments] = useState<PaymentData[]>([]);

  // Static options for Payment Type, Mode, and Bank Name
  const paymentTypes = [
    { id: 'Advance', name: 'Advance' },
    { id: 'Payment', name: 'Payment' },
  ];

  const modeOptions = [
    { id: 'Cash', name: 'Cash' },
    { id: 'Cheque', name: 'Cheque' },
    { id: 'Bank Letter', name: 'Bank Letter' },
    { id: 'LC', name: 'LC' },
    { id: 'Bad Debts', name: 'Bad Debts' },
  ];

  // All major Pakistani banks
  const pakistanBanks = [
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
  ];



  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<FormData>({
    resolver: zodResolver(PaymentSchema),
    defaultValues: {
      paymentNumber: '',
      paymentDate: new Date().toISOString().split('T')[0],
      paymentType: 'Payment',
      mode: '',
      bankName: '',
      chequeNo: '',
      chequeDate: '',
      seller: '',
      buyer: '',
      paidAmount: '',
      incomeTaxAmount: '',
      advanceReceived: '',
      remarks: '',
      relatedInvoices: [],
    },
  });

  const selectedSeller = watch('seller');
  const selectedBuyer = watch('buyer');
  const selectedPaymentType = watch('paymentType');
  const chequeNo = watch('chequeNo');
  const advanceReceived = watch('advanceReceived');
  const [advanceRemarks, setAdvanceRemarks] = useState('');
  const watchedInvoices = watch('relatedInvoices') || [];

  // Fetch Sellers
  const fetchSellers = async () => {
    try {
      setFetchingSellers(true);
      const response = await getAllSellers();
      if (response && response.data) {
        const sellerData = response.data.map((seller: any) => ({
          id: String(seller.id),
          name: seller.sellerName,
        }));
        setSellers(sellerData);
      } else {
        setSellers([]);
        toast('No sellers found', { type: 'warning' });
      }
    } catch (error) {
      setSellers([]);
      toast('Failed to fetch sellers', { type: 'error' });
    } finally {
      setFetchingSellers(false);
    }
  };

  // Fetch Buyers
  const fetchBuyers = async () => {
    try {
      setFetchingBuyers(true);
      const response = await getAllBuyer();
      if (response && response.data) {
        const buyerData = response.data.map((buyer: any) => ({
          id: String(buyer.id),
          name: buyer.buyerName,
        }));
        setBuyers(buyerData);
      } else {
        setBuyers([]);
        toast('No buyers found', { type: 'warning' });
      }
    } catch (error) {
      setBuyers([]);
      toast('Failed to fetch buyers', { type: 'error' });
    } finally {
      setFetchingBuyers(false);
    }
  };

  // Fetch Invoices
  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const response = await getAllInvoice(1, 100);
      if (response && response.data) {
        const updatedInvoices: ExtendedInvoice[] = response.data
          .filter((invoice: any) => invoice.status === 'Approved')
          .map((invoice: any) => {
            const invoiceValueWithGst = invoice.relatedContracts
              ? invoice.relatedContracts
                  .reduce(
                    (sum: number, contract: any) =>
                      sum + (parseFloat(contract.invoiceValueWithGst) || 0),
                    0
                  )
                  .toFixed(2)
              : invoice.invoiceValueWithGst || '0.00';
            return {
              id: String(invoice.id),
              invoiceNumber: invoice.invoiceNumber || '',
              invoiceDate: invoice.invoiceDate || '',
              dueDate: invoice.dueDate || '',
              seller: invoice.seller || '',
              buyer: invoice.buyer || '',
              totalAmount: invoice.totalAmount || '0',
              receivedAmount: invoice.receivedAmount || '0',
              balance: invoice.balance || '0',
              invoiceAdjusted: invoice.invoiceAdjusted || '0',
              invoiceValueWithGst,
              isSelected: isEdit && initialData?.relatedInvoices?.some((ri) => ri?.id === invoice.id),
            };
          });
        setInvoices(updatedInvoices);
      } else {
        setInvoices([]);
        toast('No approved invoices found', { type: 'warning' });
      }
    } catch (error) {
      setInvoices([]);
      toast('Failed to fetch invoices', { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Fetch Previous Payments
  const fetchPreviousPayments = async () => {
    try {
      const response = await getAllPayment();
      if (response && response.data) {
        setPreviousPayments(response.data);
      } else {
        setPreviousPayments([]);
      }
    } catch (error) {
      setPreviousPayments([]);
      toast('Failed to fetch previous payments', { type: 'error' });
    }
  };

  // Initialize form with initialData when editing
  useEffect(() => {
    if (isEdit && initialData) {
      if (!initialData.id) {
        toast('Invalid payment data', { type: 'error' });
        router.push('/payment');
        return;
      }
      setValue('paymentNumber', initialData.paymentNumber || '');
      setValue('paymentDate', initialData.paymentDate?.split('T')[0] || '');
      setValue('paymentType', initialData.paymentType || 'Payment');
      setValue('mode', initialData.mode || '');
      setValue('bankName', initialData.bankName || '');
      setValue('chequeNo', initialData.chequeNo || '');
      setValue('chequeDate', initialData.chequeDate?.split('T')[0] || '');
      setValue(
        'seller',
        sellers.find((s) => s.name === initialData.seller)?.id || initialData.seller || ''
      );
      setValue(
        'buyer',
        buyers.find((b) => b.name === initialData.buyer)?.id || initialData.buyer || ''
      );
      setValue('incomeTaxAmount', initialData.incomeTaxAmount || '');
      setValue('advanceReceived', initialData.advanceReceived || '');
      setValue('remarks', initialData.remarks || '');
      if (initialData.status === 'Approved' && initialData.paymentType === 'Advance') {
        setValue('paidAmount', initialData.advanceReceived || '');
      } else {
        setValue('paidAmount', initialData.paidAmount || '');
      }
      setValue(
        'relatedInvoices',
        initialData.relatedInvoices?.map((ri) => ({
          id: ri.id || '',
          invoiceNumber: ri.invoiceNumber || '',
          invoiceDate: ri.invoiceDate || '',
          dueDate: ri.dueDate || '',
          seller: ri.seller || '',
          buyer: ri.buyer || '',
          totalAmount: ri.totalAmount || '0',
          receivedAmount: ri.receivedAmount || '0',
          balance: ri.balance || '0',
          invoiceAdjusted: ri.invoiceAdjusted || '0',
        })) || []
      );
      setSelectedInvoiceIds(initialData.relatedInvoices?.map((ri) => ri.id || '') || []);
    }
  }, [isEdit, initialData, sellers, buyers, setValue, router]);

  // Filter invoices and update selected invoices
  useEffect(() => {
    const selectedSellerObj = sellers.find((s) => String(s.id) === String(selectedSeller));
    const selectedBuyerObj = buyers.find((b) => String(b.id) === String(selectedBuyer));

    const filtered = invoices.filter(
      (invoice) =>
        invoice.seller === selectedSellerObj?.name &&
        invoice.buyer === selectedBuyerObj?.name
    );

    // Update filteredInvoices to only include selected invoices
    const selectedInvoices = filtered.filter((invoice) => selectedInvoiceIds.includes(invoice.id));
    setFilteredInvoices(selectedInvoices);

    // Update relatedInvoices with advance adjustments
    const updatedRelatedInvoices = selectedInvoices.map((invoice) => {
      const totalAdvance = previousPayments
        .filter(
          (payment) =>
            payment.paymentType === 'Advance' &&
            payment.status === 'Approved' &&
            payment.seller === invoice.seller &&
            payment.buyer === invoice.buyer
        )
        .reduce(
          (sum, payment) => sum + (parseFloat(payment.advanceReceived || '0') || 0),
          0
        );

      const invoiceAmount = parseFloat(invoice.invoiceValueWithGst || invoice.totalAmount || '0');
      const receivedAmount = parseFloat(invoice.receivedAmount || '0');
      const existingInvoice = watchedInvoices.find((inv) => inv.id === invoice.id);
      const adjustedAmount = existingInvoice
        ? existingInvoice.invoiceAdjusted
        : Math.min(totalAdvance, invoiceAmount - receivedAmount).toFixed(2);

      return {
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        invoiceDate: invoice.invoiceDate,
        dueDate: invoice.dueDate,
        seller: invoice.seller,
        buyer: invoice.buyer,
        totalAmount: invoice.totalAmount || invoice.invoiceValueWithGst || '0',
        receivedAmount: existingInvoice?.receivedAmount || invoice.receivedAmount || '0',
        balance: existingInvoice?.balance || (
          invoiceAmount -
          (parseFloat(existingInvoice?.receivedAmount || invoice.receivedAmount || '0') +
            parseFloat(adjustedAmount || '0'))
        ).toFixed(2),
        invoiceAdjusted: adjustedAmount,
      };
    });

    setValue('relatedInvoices', updatedRelatedInvoices);
  }, [selectedSeller, selectedBuyer, invoices, sellers, buyers, selectedInvoiceIds, previousPayments, setValue, watchedInvoices]);

  // Fetch data on mount
  useEffect(() => {
    fetchSellers();
    fetchBuyers();
    fetchInvoices();
    fetchPreviousPayments();
  }, []);

  // Handle invoice selection by clicking Invoice #
  const handleInvoiceSelect = (invoice: ExtendedInvoice) => {
    setSelectedInvoiceIds((prev) => {
      if (prev.includes(invoice.id)) {
        // Deselect invoice
        return prev.filter((id) => id !== invoice.id);
      } else {
        // Select invoice
        return [...prev, invoice.id];
      }
    });
    setShowInvoiceSelection(false);
  };

  // Handle invoice removal
  const handleRemoveInvoice = (invoiceId: string) => {
    setSelectedInvoiceIds((prev) => prev.filter((id) => id !== invoiceId));
  };

  // Update balance and synchronize receivedAmount and invoiceAdjusted
  const updateBalance = (
    index: number,
    totalAmount: string,
    receivedAmount: string,
    invoiceAdjusted: string,
    invoiceNumber?: string,
    seller?: string,
    buyer?: string
  ) => {
    let invoiceAmount = parseFloat(totalAmount || '0');
    if (invoiceNumber && seller && buyer) {
      const found = invoices.find(
        (inv) =>
          inv.invoiceNumber === invoiceNumber &&
          inv.seller === seller &&
          inv.buyer === buyer
      );
      if (found && found.invoiceValueWithGst) {
        invoiceAmount = parseFloat(found.invoiceValueWithGst);
      }
    }

    // Calculate total advance received for this seller and buyer
    const totalAdvance = previousPayments
      .filter(
        (payment) =>
          payment.paymentType === 'Advance' &&
          payment.status === 'Approved' &&
          payment.seller === seller &&
          payment.buyer === buyer
      )
      .reduce(
        (sum, payment) => sum + (parseFloat(payment.advanceReceived || '0') || 0),
        0
      );

    const balance = (
      invoiceAmount -
      (parseFloat(receivedAmount || '0') + parseFloat(invoiceAdjusted || '0') + totalAdvance)
    ).toFixed(2);

    const updatedInvoices = [...watchedInvoices];
    updatedInvoices[index] = {
      ...updatedInvoices[index],
      totalAmount,
      receivedAmount,
      invoiceAdjusted,
      balance,
    };
    setValue('relatedInvoices', updatedInvoices);
  };

  const onSubmit = async (data: FormData) => {
    try {
      const payload = {
        ...(isEdit && initialData?.id ? { id: initialData.id } : {}),
        paymentNumber: isEdit ? initialData?.paymentNumber : undefined,
        paymentDate: data.paymentDate,
        paymentType: data.paymentType,
        mode: data.mode,
        bankName: pakistanBanks.find((b) => b.id === data.bankName)?.name || data.bankName,
        chequeNo: data.chequeNo,
        chequeDate: data.chequeDate,
        seller: sellers.find((s) => s.id === data.seller)?.name || data.seller,
        buyer: buyers.find((b) => b.id === data.buyer)?.name || data.buyer,
        paidAmount: data.paidAmount,
        incomeTaxAmount: data.incomeTaxAmount,
        advanceReceived: data.advanceReceived,
        remarks: data.paymentType === 'Advance' ? advanceRemarks : data.remarks,
        creationDate: isEdit
          ? initialData?.creationDate || new Date().toISOString()
          : new Date().toISOString(),
        updationDate: new Date().toISOString(),
        status: 'Pending',
        relatedInvoices: data.paymentType === 'Payment' ? data.relatedInvoices : [],
      };

      if (isEdit) {
        await updatePayment(payload);
        toast('Payment Updated Successfully', { type: 'success' });
      } else {
        await createPayment(payload);
        toast('Payment Created Successfully', { type: 'success' });
      }

      reset();
      router.push('/payment');
    } catch (error) {
      toast(`Error ${isEdit ? 'updating' : 'creating'} payment: ${(error as Error).message}`, {
        type: 'error',
      });
    }
  };

  return (
    <div className="container mx-auto bg-white shadow-lg rounded dark:bg-[#030630] p-4 md:p-6">
      <div className="w-full bg-[#06b6d4] h-16 md:h-[7vh] rounded dark:bg-[#387fbf] flex items-center">
        <h1 className="text-lg md:text-[23px] font-mono ml-4 md:ml-10 text-white flex items-center gap-2">
          <MdPayment />
          {isEdit ? 'UPDATE PAYMENT' : 'ADD PAYMENT'}
        </h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="p-2 md:p-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div
              className="relative group"
              onMouseEnter={() => setIdFocused(true)}
              onMouseLeave={() => setIdFocused(false)}
            >
              <Controller
                name="paymentNumber"
                control={control}
                render={({ field }) => (
                  <>
                    <CustomInput
                      {...field}
                      label="Payment#"
                      type="text"
                      disabled
                      placeholder=""
                      value={field.value || ''}
                      className="w-full"
                    />
                    {idFocused && (
                      <>
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <BiSolidErrorAlt className="text-red-500 text-xl cursor-pointer" />
                        </div>
                        <div className="absolute bottom-full right-0 h-8 w-max text-sm md:text-large text-black bg-[#d5e4ff] rounded px-3 py-1 shadow-lg z-10 animate-fade-in">
                          Payment# is auto-generated by the system
                        </div>
                      </>
                    )}
                  </>
                )}
              />
            </div>
            <CustomSingleDatePicker
              label="Payment Date"
              selectedDate={watch('paymentDate') || ''}
              onChange={(date: string) => setValue('paymentDate', date, { shouldValidate: true })}
              error={errors.paymentDate?.message}
              register={register}
              name="paymentDate"
              variant="floating"
              borderThickness="2"
            />
            <CustomInputDropdown
              label="Payment Type"
              options={paymentTypes}
              selectedOption={watch('paymentType') || ''}
              onChange={(value) => {
                setValue('paymentType', value as 'Advance' | 'Payment', { shouldValidate: true });
                setSelectedInvoiceIds([]);
                setValue('relatedInvoices', []);
                setShowInvoiceSelection(false);
              }}
              error={errors.paymentType?.message}
              register={register}
            />
            <CustomInputDropdown
              label="Mode"
              options={modeOptions}
              selectedOption={watch('mode') || ''}
              onChange={(value) => setValue('mode', value, { shouldValidate: true })}
              error={errors.mode?.message}
              register={register}
            />
            <CustomInputDropdown
              label="Bank Name"
              options={pakistanBanks}
              selectedOption={watch('bankName') || ''}
              onChange={(value) => setValue('bankName', value, { shouldValidate: true })}
              error={errors.bankName?.message}
              register={register}
            />
            <CustomInput
              variant="floating"
              borderThickness="2"
              label="Cheque No"
              id="chequeNo"
              {...register('chequeNo')}
              error={errors.chequeNo?.message}
              className="w-full"
            />
            <CustomSingleDatePicker
              label="Cheque Date"
              selectedDate={watch('chequeDate') || ''}
              onChange={(date: string | undefined) =>
                setValue('chequeDate', date, { shouldValidate: true })
              }
              error={errors.chequeDate?.message}
              register={register}
              name="chequeDate"
              variant="floating"
              borderThickness="2"
            />
            <CustomInputDropdown
              label="Seller"
              options={sellers}
              selectedOption={watch('seller') || ''}
              onChange={(value) => {
                setValue('seller', value, { shouldValidate: true });
                setSelectedInvoiceIds([]);
                setValue('relatedInvoices', []);
                setShowInvoiceSelection(false);
              }}
              error={errors.seller?.message}
              register={register}
            />
            <CustomInputDropdown
              label="Buyer"
              options={buyers}
              selectedOption={watch('buyer') || ''}
              onChange={(value) => {
                setValue('buyer', value, { shouldValidate: true });
                setSelectedInvoiceIds([]);
                setValue('relatedInvoices', []);
                setShowInvoiceSelection(false);
              }}
              error={errors.buyer?.message}
              register={register}
            />
            <CustomInput
              variant="floating"
              borderThickness="2"
              label="Paid Amount"
              id="paidAmount"
              type="number"
              {...register('paidAmount')}
              error={errors.paidAmount?.message}
              className="w-full"
              disabled
            />
            <CustomInput
              variant="floating"
              borderThickness="2"
              label="Income Tax Amount"
              id="incomeTaxAmount"
              type="number"
              {...register('incomeTaxAmount')}
              error={errors.incomeTaxAmount?.message}
              className="w-full"
            />
            <CustomInput
              variant="floating"
              borderThickness="2"
              label="Advance Received"
              id="advanceReceived"
              type="number"
              {...register('advanceReceived')}
              error={errors.advanceReceived?.message}
              className="w-full"
            />
            <CustomInput
              variant="floating"
              borderThickness="2"
              label="Remarks"
              id="remarks"
              type="text"
              {...register('remarks')}
              error={errors.remarks?.message}
              className="w-full"
            />
          </div>
        </div>

        {selectedPaymentType === 'Payment' && (
          <div className="p-2 md:p-4">
            <h2 className="text-lg md:text-xl text-[#06b6d4] font-bold dark:text-white">Related Invoices</h2>
            <div className="border rounded p-4 mt-2 overflow-x-auto">
              {loading || fetchingSellers || fetchingBuyers ? (
                <p className="text-gray-500 text-sm md:text-base">Loading invoices, sellers, or buyers...</p>
              ) : selectedSeller && selectedBuyer ? (
                <>
                  <button
                    type="button"
                    className="mb-2 px-4 py-2 bg-[#06b6d4] text-white rounded hover:bg-[#0891b2] font-semibold"
                    onClick={() => setShowInvoiceSelection(true)}
                  >
                    Add Invoice
                  </button>
                  {showInvoiceSelection && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                      <div className="bg-white dark:bg-[#030630] rounded shadow-lg p-6 w-full max-w-3xl relative">
                        <button
                          type="button"
                          className="absolute top-2 right-2 text-gray-500 hover:text-black dark:hover:text-white"
                          onClick={() => setShowInvoiceSelection(false)}
                        >
                          <FaTimes />
                        </button>
                        <h3 className="text-md md:text-lg font-semibold dark:text-white mb-2">Select Invoices</h3>
                        <div className="mb-3 text-base text-blue-700 bg-blue-100 rounded px-3 py-2">
                          Double click on a row to select or deselect the invoice you want.
                        </div>
                        {invoices.filter(
                          (invoice) =>
                            invoice.seller === sellers.find((s) => s.id === selectedSeller)?.name &&
                            invoice.buyer === buyers.find((b) => b.id === selectedBuyer)?.name
                        ).length > 0 ? (
                          <table className="w-full text-left border-collapse text-sm md:text-base">
                            <thead>
                              <tr className="bg-[#06b6d4] text-white">
                                <th className="p-2 md:p-3 font-medium">Invoice #</th>
                                <th className="p-2 md:p-3 font-medium">Invoice Date</th>
                                <th className="p-2 md:p-3 font-medium">Due Date</th>
                                <th className="p-2 md:p-3 font-medium">Received Amount</th>
                                <th className="p-2 md:p-3 font-medium">Inv. Amount</th>
                                <th className="p-2 md:p-3 font-medium">Balance</th>
                                <th className="p-2 md:p-3 font-medium">Invoice Adjusted</th>
                              </tr>
                            </thead>
                            <tbody>
                              {invoices
                                .filter(
                                  (invoice) =>
                                    invoice.seller === sellers.find((s) => s.id === selectedSeller)?.name &&
                                    invoice.buyer === buyers.find((b) => b.id === selectedBuyer)?.name
                                )
                                .map((invoice) => {
                                  const totalAdvance = previousPayments
                                    .filter(
                                      (payment) =>
                                        payment.paymentType === 'Advance' &&
                                        payment.status === 'Approved' &&
                                        payment.seller === invoice.seller &&
                                        payment.buyer === invoice.buyer
                                    )
                                    .reduce(
                                      (sum, payment) => sum + (parseFloat(payment.advanceReceived || '0') || 0),
                                      0
                                    );
                                  const invoiceAmount = parseFloat(invoice.invoiceValueWithGst || invoice.totalAmount || '0');
                                  const receivedAmount = parseFloat(invoice.receivedAmount || '0');
                                  const balance = (invoiceAmount - receivedAmount - totalAdvance).toFixed(2);
                                  return (
                                    <tr
                                      key={invoice.id}
                                      className={`border-b hover:bg-gray-100 cursor-pointer ${
                                        selectedInvoiceIds.includes(invoice.id) ? 'bg-blue-100' : ''
                                      } block md:table-row`}
                                      onDoubleClick={() => handleInvoiceSelect(invoice)}
                                      title="Double click to select/deselect"
                                    >
                                      <td className="p-2 md:p-3 block md:table-cell before:content-['Invoice_#:'] before:font-bold before:md:hidden">
                                        {invoice.invoiceNumber || '-'}
                                      </td>
                                      <td className="p-2 md:p-3 block md:table-cell before:content-['Invoice_Date:'] before:font-bold before:md:hidden">
                                        {invoice.invoiceDate || '-'}
                                      </td>
                                      <td className="p-2 md:p-3 block md:table-cell before:content-['Due_Date:'] before:font-bold before:md:hidden">
                                        {invoice.dueDate || '-'}
                                      </td>
                                      <td className="p-2 md:p-3 block md:table-cell before:content-['Received_Amount:'] before:font-bold before:md:hidden">
                                        {invoice.receivedAmount || '0.00'}
                                      </td>
                                      <td className="p-2 md:p-3 block md:table-cell before:content-['Inv._Amount:'] before:font-bold before:md:hidden">
                                        {invoice.invoiceValueWithGst || invoice.totalAmount || '0.00'}
                                      </td>
                                      <td className="p-2 md:p-3 block md:table-cell before:content-['Balance:'] before:font-bold before:md:hidden">
                                        {balance}
                                      </td>
                                      <td className="p-2 md:p-3 block md:table-cell before:content-['Invoice_Adjusted:'] before:font-bold before:md:hidden">
                                        {Math.min(totalAdvance, invoiceAmount - receivedAmount).toFixed(2)}
                                      </td>
                                    </tr>
                                  );
                                })}
                            </tbody>
                          </table>
                        ) : (
                          <p className="text-gray-500 text-sm md:text-base">
                            No approved invoices found for the selected Seller and Buyer.
                          </p>
                        )}
                        <div className="flex justify-end mt-4">
                          <button
                            type="button"
                            className="px-4 py-2 bg-[#06b6d4] text-white rounded hover:bg-[#0891b2] font-semibold"
                            onClick={() => setShowInvoiceSelection(false)}
                          >
                            Done
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                  {filteredInvoices.length > 0 ? (
                    <table className="w-full text-left border-collapse text-sm md:text-base">
                      <thead>
                        <tr className="bg-[#06b6d4] text-white">
                          <th className="p-2 md:p-3 font-medium">Invoice #</th>
                          <th className="p-2 md:p-3 font-medium">Invoice Date</th>
                          <th className="p-2 md:p-3 font-medium">Due Date</th>
                          <th className="p-2 md:p-3 font-medium">Received Amount</th>
                          <th className="p-2 md:p-3 font-medium">Inv. Amount</th>
                          <th className="p-2 md:p-3 font-medium">Balance</th>
                          <th className="p-2 md:p-3 font-medium">Invoice Adjusted</th>
                          <th className="p-2 md:p-3 font-medium">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredInvoices.map((invoice, index) => (
                          <tr
                            key={invoice.id}
                            className={`border-b hover:bg-gray-100 block md:table-row`}
                          >
                            <td className="p-2 md:p-3 block md:table-cell before:content-['Invoice_#:'] before:font-bold before:md:hidden">
                              {invoice.invoiceNumber || '-'}
                            </td>
                            <td className="p-2 md:p-3 block md:table-cell before:content-['Invoice_Date:'] before:font-bold before:md:hidden">
                              {invoice.invoiceDate || '-'}
                            </td>
                            <td className="p-2 md:p-3 block md:table-cell before:content-['Due_Date:'] before:font-bold before:md:hidden">
                              {invoice.dueDate || '-'}
                            </td>
                            <td className="p-2 md:p-3 block md:table-cell before:content-['Received_Amount:'] before:font-bold before:md:hidden">
                              <input
                                type="number"
                                step="0.01"
                                value={
                                  watchedInvoices.find((inv) => inv.id === invoice.id)?.receivedAmount || ''
                                }
                                onChange={(e) => {
                                  const value = e.target.value;
                                  const updatedInvoices = [...watchedInvoices];
                                  const invIndex = updatedInvoices.findIndex((inv) => inv.id === invoice.id);
                                  if (invIndex >= 0) {
                                    updatedInvoices[invIndex].receivedAmount = value;
                                    updatedInvoices[invIndex].invoiceAdjusted = value;
                                    updateBalance(
                                      invIndex,
                                      updatedInvoices[invIndex].totalAmount || invoice.invoiceValueWithGst || '0',
                                      value,
                                      value,
                                      invoice.invoiceNumber,
                                      invoice.seller,
                                      invoice.buyer
                                    );
                                    setValue('relatedInvoices', updatedInvoices);
                                  }
                                }}
                                className="w-full p-2 border border-gray-300 rounded"
                              />
                            </td>
                            <td className="p-2 md:p-3 block md:table-cell before:content-['Inv._Amount:'] before:font-bold before:md:hidden">
                              {invoice.invoiceValueWithGst || invoice.totalAmount || '0.00'}
                            </td>
                            <td className="p-2 md:p-3 block md:table-cell before:content-['Balance:'] before:font-bold before:md:hidden">
                              {watchedInvoices.find((inv) => inv.id === invoice.id)?.balance || invoice.balance || '0.00'}
                            </td>
                            <td className="p-2 md:p-3 block md:table-cell before:content-['Invoice_Adjusted:'] before:font-bold before:md:hidden">
                              <input
                                type="number"
                                step="0.01"
                                value={
                                  watchedInvoices.find((inv) => inv.id === invoice.id)?.invoiceAdjusted || ''
                                }
                                onChange={(e) => {
                                  const value = e.target.value;
                                  const updatedInvoices = [...watchedInvoices];
                                  const invIndex = updatedInvoices.findIndex((inv) => inv.id === invoice.id);
                                  if (invIndex >= 0) {
                                    updatedInvoices[invIndex].invoiceAdjusted = value;
                                    // Recalculate balance based on new invoiceAdjusted and receivedAmount
                                    const totalAmount = updatedInvoices[invIndex].totalAmount || invoice.invoiceValueWithGst || '0';
                                    const seller = invoice.seller;
                                    const buyer = invoice.buyer;
                                    let invoiceAmount = parseFloat(totalAmount || '0');
                                    const found = invoices.find(
                                      (inv) =>
                                        inv.invoiceNumber === invoice.invoiceNumber &&
                                        inv.seller === seller &&
                                        inv.buyer === buyer
                                    );
                                    if (found && found.invoiceValueWithGst) {
                                      invoiceAmount = parseFloat(found.invoiceValueWithGst);
                                    }
                                    // Calculate total advance received for this seller and buyer
                                    const totalAdvance = previousPayments
                                      .filter(
                                        (payment) =>
                                          payment.paymentType === 'Advance' &&
                                          payment.status === 'Approved' &&
                                          payment.seller === seller &&
                                          payment.buyer === buyer
                                      )
                                      .reduce(
                                        (sum, payment) => sum + (parseFloat(payment.advanceReceived || '0') || 0),
                                        0
                                      );
                                    const receivedAmount = updatedInvoices[invIndex].receivedAmount || '0';
                                    const balance = (
                                      invoiceAmount -
                                      (parseFloat(receivedAmount || '0') + parseFloat(value || '0') + totalAdvance)
                                    ).toFixed(2);
                                    updatedInvoices[invIndex].balance = balance;
                                    setValue('relatedInvoices', updatedInvoices);
                                  }
                                }}
                                className="w-full p-2 border border-gray-300 rounded"
                              />
                            </td>
                            <td className="p-2 md:p-3 block md:table-cell before:content-['Action:'] before:font-bold before:md:hidden">
                              <button
                                type="button"
                                onClick={() => handleRemoveInvoice(invoice.id)}
                                className="text-red-500 hover:text-red-700"
                              >
                                <FaTimes />
                              </button>
                            </td>
                          </tr>
                        ))}
                        <tr className="font-bold bg-gray-100">
                          <td className="p-2 md:p-3">Total</td>
                          <td className="p-2 md:p-3"></td>
                          <td className="p-2 md:p-3"></td>
                          <td className="p-2 md:p-3">
                            {filteredInvoices.reduce(
                              (sum, inv) =>
                                sum +
                                parseFloat(
                                  watchedInvoices.find((i) => i.id === inv.id)?.receivedAmount ||
                                    inv.receivedAmount ||
                                    '0'
                                ),
                              0
                            ).toFixed(2)}
                          </td>
                          <td className="p-2 md:p-3">
                            {filteredInvoices.reduce(
                              (sum, inv) =>
                                sum +
                                parseFloat(inv.invoiceValueWithGst || inv.totalAmount || '0'),
                              0
                            ).toFixed(2)}
                          </td>
                          <td className="p-2 md:p-3">
                            {filteredInvoices.reduce(
                              (sum, inv) =>
                                sum +
                                parseFloat(
                                  watchedInvoices.find((i) => i.id === inv.id)?.balance ||
                                    inv.balance ||
                                    '0'
                                ),
                              0
                            ).toFixed(2)}
                          </td>
                          <td className="p-2 md:p-3">
                            {filteredInvoices.reduce(
                              (sum, inv) =>
                                sum +
                                parseFloat(
                                  watchedInvoices.find((i) => i.id === inv.id)?.invoiceAdjusted ||
                                    inv.invoiceAdjusted ||
                                    '0'
                                ),
                              0
                            ).toFixed(2)}
                          </td>
                          <td className="p-2 md:p-3"></td>
                        </tr>
                      </tbody>
                    </table>
                  ) : (
                    <p className="text-gray-500 text-sm md:text-base">No invoices selected.</p>
                  )}
                </>
              ) : (
                <p className="text-gray-500 text-sm md:text-base">
                  Please select both Seller and Buyer to select invoices.
                </p>
              )}
            </div>
          </div>
        )}

        {selectedPaymentType === 'Advance' && (
          <div className="p-2 md:p-4">
            <h2 className="text-lg md:text-xl text-[#06b6d4] font-bold dark:text-white">Advance Details</h2>
            <div className="border rounded p-4 mt-2 overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm md:text-base">
                <thead>
                  <tr className="bg-[#06b6d4] text-white">
                    <th className="p-2 md:p-3 font-medium">Advance Received</th>
                    <th className="p-2 md:p-3 font-medium">Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b hover:bg-gray-100 block md:table-row">
                    <td className="p-2 md:p-3 block md:table-cell before:content-['Advance_Received:'] before:font-bold before:md:hidden">
                      <input
                        type="number"
                        step="0.01"
                        {...register('advanceReceived')}
                        onChange={(e) => {
                          setValue('advanceReceived', e.target.value, { shouldValidate: true });
                          if (initialData?.status === 'Approved') {
                            setValue('paidAmount', e.target.value, { shouldValidate: true });
                          }
                        }}
                        className="w-full p-2 border border-gray-300 rounded"
                        placeholder="Enter advance received (numbers only)"
                      />
                      {errors.advanceReceived && (
                        <p className="text-red-500 text-sm mt-1">{errors.advanceReceived.message}</p>
                      )}
                    </td>
                    <td className="p-2 md:p-3 block md:table-cell before:content-['Remarks:'] before:font-bold before:md:hidden">
                      <div className="flex items-center gap-2">
                        {chequeNo && (
                          <span style={{ fontWeight: 'bold', whiteSpace: 'pre' }}>{` ${chequeNo}`}</span>
                        )}
                        <input
                          type="text"
                          value={advanceRemarks}
                          onChange={(e) => setAdvanceRemarks(e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded"
                          placeholder="Enter remarks for Advance only"
                          style={{ flex: 1 }}
                        />
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="w-full h-16 md:h-[8vh] flex flex-col md:flex-row justify-end gap-2 mt-3 bg-transparent border-t-2 border-[#e7e7e7] p-2 md:p-4">
          <Button
            type="submit"
            className="w-full md:w-[160px] gap-2 inline-flex items-center bg-[#0e7d90] hover:bg-[#0891b2] text-white px-6 py-2 text-sm font-medium transition-all duration-200 font-mono hover:translate-y-[-2px] focus:outline-none active:shadow-[#3c4fe0_0_3px_7px_inset] active:translate-y-[2px]"
          >
            Save
          </Button>
          <Link href="/payment" className="w-full md:w-auto">
            <Button
              type="button"
              className="w-full md:w-[160px] gap-2 inline-flex items-center bg-black hover:bg-[#b0b0b0] text-white px-6 py-2 text-sm font-medium transition-all duration-200 font-mono hover:translate-y-[-2px] focus:outline-none active:shadow-[#3c4fe0_0_3px_7px_inset] active:translate-y-[2px]"
            >
              Cancel
            </Button>
          </Link>
        </div>
      </form>

      <style jsx>{`
        @media (max-width: 768px) {
          table {
            display: block;
            width: 100%;
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
          }
          thead {
            display: none;
          }
          tbody,
          tr {
            display: block;
          }
          td {
            display: block;
            text-align: left;
            padding: 0.5rem;
            position: relative;
            padding-left: 50%;
          }
          td:before {
            position: absolute;
            left: 0.5rem;
            width: 45%;
            padding-right: 0.5rem;
            white-space: nowrap;
          }
          tr {
            margin-bottom: 1rem;
            border-bottom: 1px solid #e7e7e7;
          }
        }
      `}</style>
    </div>
  );
};

export default PaymentForm;
