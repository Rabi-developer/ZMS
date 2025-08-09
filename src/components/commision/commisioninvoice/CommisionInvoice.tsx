'use client';
import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { toast } from 'react-toastify';
import CustomInput from '@/components/ui/CustomInput';
import CustomInputDropdown from '@/components/ui/CustomeInputDropdown';
import CustomSingleDatePicker from '@/components/ui/CustomDateRangePicker';
import { FaTimes } from 'react-icons/fa';
import { createCommisionInvoice, getAllCommisionInvoice } from '@/apis/commisioninvoice';
import { getAllSellers } from '@/apis/seller';
import { getAllBuyer } from '@/apis/buyer';
import { getAllPayment } from '@/apis/payment';

// Schema for form validation
const CommissionInvoiceSchema = z.object({
  commissionInvoiceNumber: z.string().optional(),
  date: z.string().min(1, 'Date is required'),
  dueDate: z.string().min(1, 'Due Date is required'),
  commissionFrom: z.enum(['Seller', 'Buyer', 'Both'], { required_error: 'Commission From is required' }),
  seller: z.string().optional(),
  buyer: z.string().optional(),
  remarks: z.string().optional(),
  excludeSRB: z.boolean().optional(),
  relatedInvoices: z
    .array(
      z.object({
        id: z.string(),
        invoiceNumber: z.string(),
        invoiceDate: z.string(),
        buyer: z.string(),
        quality: z.string(),
        invoiceQty: z.string(),
        rate: z.string(),
        invoiceValue: z.string(),
        commissionPercent: z.string(),
        amount: z.string(),
        srTax: z.string(),
        srTaxAmount: z.string(),
        totalAmount: z.string(),
      })
    )
    .optional(),
});

type FormData = z.infer<typeof CommissionInvoiceSchema>;

interface Invoice {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  buyer: string;
  seller?: string;
  quality: string;
  invoiceQty: string;
  rate: string;
  invoiceValue: string;
  commissionPercent: string;
  status: string;
  srTax?: string;
  srTaxAmount?: string;
  totalAmount?: string;
}

interface PaymentData {
  id?: string;
  seller?: string;
  buyer?: string;
  status?: string;
  paymentType?: string; // 'Payment' or 'Advance'
  advanceReceived?: string;
  relatedInvoices?: {
    invoiceNumber?: string;
    receivedAmount?: string;
    invoiceAdjusted?: string;
    balance?: string;
  }[];
}

const CommissionInvoiceForm = () => {
  const [sellers, setSellers] = useState<{ id: string; name: string }[]>([]);
  const [buyers, setBuyers] = useState<{ id: string; name: string }[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [previousPayments, setPreviousPayments] = useState<PaymentData[]>([]);
  const [showInvoiceSelection, setShowInvoiceSelection] = useState(false);
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<string[]>([]);
  const [selectedInvoices, setSelectedInvoices] = useState<Invoice[]>([]);
  const [excludeSRB, setExcludeSRB] = useState(false);
  const [srTaxMap, setSrTaxMap] = useState<{ [id: string]: string }>({});
  const [loading, setLoading] = useState(false);
  const [fetchingSellers, setFetchingSellers] = useState(false);
  const [fetchingBuyers, setFetchingBuyers] = useState(false);
  const [fetchingPayments, setFetchingPayments] = useState(false);

  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(CommissionInvoiceSchema),
    defaultValues: {
      commissionInvoiceNumber: '',
      date: new Date().toISOString().split('T')[0],
      dueDate: '',
      commissionFrom: 'Seller',
      seller: '',
      buyer: '',
      remarks: '',
      excludeSRB: false,
      relatedInvoices: [],
    },
  });

  const commissionFrom = watch('commissionFrom');
  const selectedSeller = watch('seller');
  const selectedBuyer = watch('buyer');

  // Calculate invoice balance
  const calculateInvoiceBalance = (invoice: Invoice, payments: PaymentData[]): number => {
    const invoiceAmount = parseFloat(invoice.invoiceValue || '0');
    const totalReceived = payments
      .filter(
        (payment) =>
          (payment.status === 'Approved' || payment.status === 'Pending') &&
          (commissionFrom === 'Seller' || commissionFrom === 'Both'
            ? payment.seller === sellers.find((s) => s.id === selectedSeller)?.name
            : true) &&
          (commissionFrom === 'Buyer' || commissionFrom === 'Both'
            ? payment.buyer === buyers.find((b) => b.id === selectedBuyer)?.name
            : payment.buyer === invoice.buyer)
      )
      .reduce((sum, payment) => {
        const invoiceData = (payment.relatedInvoices || []).find(
          (ri) => ri.invoiceNumber === invoice.invoiceNumber
        );
        if (invoiceData) {
          return (
            sum +
            (parseFloat(invoiceData.receivedAmount || '0') || 0) +
            (parseFloat(invoiceData.invoiceAdjusted || '0') || 0)
          );
        }
        return sum;
      }, 0);

    return invoiceAmount - totalReceived;
  };

  // Fetch sellers
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

  // Fetch buyers
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

  // Fetch invoices
  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const response = await getAllCommisionInvoice(1, 100);
      if (response && response.data) {
        const invoiceData = response.data.map((invoice: any) => ({
          id: String(invoice.id),
          invoiceNumber: invoice.invoiceNumber || '',
          invoiceDate: invoice.invoiceDate || '',
          buyer: invoice.buyer || '',
          seller: invoice.seller || '',
          quality: invoice.quality || '',
          invoiceQty: invoice.invoiceQty || '0',
          rate: invoice.rate || '0',
          invoiceValue: invoice.invoiceValue || '0',
          commissionPercent: invoice.commissionPercent || '0',
          status: invoice.status || '',
        }));
        setInvoices(invoiceData);
      } else {
        setInvoices([]);
        toast('No completed commission invoices found', { type: 'warning' });
      }
    } catch (error) {
      setInvoices([]);
      toast('Failed to fetch invoices', { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Fetch previous payments (including advances)
  const fetchPreviousPayments = async () => {
    try {
      setFetchingPayments(true);
      const response = await getAllPayment();
      if (response && response.data) {
        setPreviousPayments(response.data);
      } else {
        setPreviousPayments([]);
        toast('No previous payments found', { type: 'warning' });
      }
    } catch (error) {
      setPreviousPayments([]);
      toast('Failed to fetch previous payments', { type: 'error' });
    } finally {
      setFetchingPayments(false);
    }
  };

  // Fetch data on mount
  useEffect(() => {
    fetchSellers();
    fetchBuyers();
    fetchInvoices();
    fetchPreviousPayments();
  }, []);

  // Handle EXCLUDE SRB logic
  useEffect(() => {
    setValue('commissionInvoiceNumber', excludeSRB ? 'AUTO-GENERATED' : 'ZMS-AUTO-GENERATED', { shouldValidate: true });
  }, [excludeSRB, setValue]);

  // Handle invoice selection
  const handleInvoiceSelect = (invoice: Invoice) => {
    setSelectedInvoiceIds((prev) => {
      if (prev.includes(invoice.id)) {
        return prev.filter((id) => id !== invoice.id);
      } else {
        return [...prev, invoice.id];
      }
    });
  };

  // Update selectedInvoices and srTaxMap
  useEffect(() => {
    const filteredInvoices = invoices.filter((inv) => selectedInvoiceIds.includes(inv.id));
    setSelectedInvoices(filteredInvoices);
    setSrTaxMap((prev) => {
      const updated = { ...prev };
      selectedInvoiceIds.forEach((id) => {
        if (!updated[id]) updated[id] = '1';
      });
      Object.keys(updated).forEach((id) => {
        if (!selectedInvoiceIds.includes(id)) delete updated[id];
      });
      return updated;
    });

    // Update relatedInvoices in form
    const relatedInvoices = filteredInvoices.map((invoice) => {
      const commissionPercent = parseFloat(invoice.commissionPercent || '0');
      const invoiceValue = parseFloat(invoice.invoiceValue || '0');
      const amount = ((invoiceValue * commissionPercent) / 100).toFixed(2);
      const srTax = srTaxMap[invoice.id] || '1';
      const srTaxAmount = excludeSRB ? '0.00' : ((parseFloat(amount) * parseFloat(srTax)) / 100).toFixed(2);
      const totalAmount = excludeSRB ? amount : (parseFloat(amount) + parseFloat(srTaxAmount)).toFixed(2);
      return {
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        invoiceDate: invoice.invoiceDate,
        buyer: invoice.buyer,
        quality: invoice.quality,
        invoiceQty: invoice.invoiceQty,
        rate: invoice.rate,
        invoiceValue: invoice.invoiceValue,
        commissionPercent: invoice.commissionPercent,
        amount,
        srTax,
        srTaxAmount,
        totalAmount,
      };
    });
    setValue('relatedInvoices', relatedInvoices, { shouldValidate: true });
  }, [selectedInvoiceIds, invoices, srTaxMap, excludeSRB, setValue]);

  // On form submit
  const onSubmit = async (data: FormData) => {
    try {
      const payload = {
        ...data,
        commissionInvoiceNumber: data.commissionInvoiceNumber || (excludeSRB ? 'AUTO-GENERATED' : 'ZMS-AUTO-GENERATED'),
        seller: commissionFrom === 'Buyer' ? undefined : sellers.find((s) => s.id === data.seller)?.name || data.seller,
        buyer: commissionFrom === 'Seller' ? undefined : buyers.find((b) => b.id === data.buyer)?.name || data.buyer,
        relatedInvoices: data.relatedInvoices?.map(({ id, ...rest }) => rest),
      };
      await createCommisionInvoice(payload);
      toast('Commission Invoice Created Successfully', { type: 'success' });
      reset();
      setSelectedInvoiceIds([]);
      setSelectedInvoices([]);
      setSrTaxMap({});
      setExcludeSRB(false);
    } catch (error) {
      toast(`Error creating commission invoice: ${(error as Error).message}`, { type: 'error' });
    }
  };

  // Check if selection is valid based on commissionFrom
  const isSelectionValid = () => {
    if (commissionFrom === 'Seller') return !!selectedSeller;
    if (commissionFrom === 'Buyer') return !!selectedBuyer;
    if (commissionFrom === 'Both') return !!selectedSeller && !!selectedBuyer;
    return false;
  };

  // Get zero-balance invoice numbers from payments
  const getZeroBalanceInvoiceNumbers = (): Set<string> => {
    const zeroBalanceInvoices = new Set<string>();
    previousPayments
      .filter((payment) => {
        // Filter payments by status and seller/buyer based on commissionFrom
        const sellerMatch =
          commissionFrom === 'Seller' || commissionFrom === 'Both'
            ? payment.seller === sellers.find((s) => s.id === selectedSeller)?.name
            : true;
        const buyerMatch =
          commissionFrom === 'Buyer' || commissionFrom === 'Both'
            ? payment.buyer === buyers.find((b) => b.id === selectedBuyer)?.name
            : true;
        return (payment.status === 'Approved' || payment.status === 'Pending') && sellerMatch && buyerMatch;
      })
      .forEach((payment) => {
        (payment.relatedInvoices || []).forEach((ri) => {
          if (ri.invoiceNumber && Math.abs(parseFloat(ri.balance || '0')) < 0.01) {
            zeroBalanceInvoices.add(ri.invoiceNumber);
          }
        });
      });
    return zeroBalanceInvoices;
  };

  return (
    <div className="container mx-auto bg-white shadow-lg rounded dark:bg-[#030630] p-4 md:p-6">
      <div className="w-full bg-[#06b6d4] h-16 md:h-[7vh] rounded dark:bg-[#387fbf] flex items-center">
        <h1 className="text-lg md:text-[23px] font-mono ml-4 md:ml-10 text-white flex items-center gap-2">
          Commission Invoice
        </h1>
      </div>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="p-2 md:p-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <CustomInput
              variant="floating"
              borderThickness="2"
              label="Comm.Invoice#"
              id="commissionInvoiceNumber"
              type="text"
              disabled
              {...register('commissionInvoiceNumber')}
              error={errors.commissionInvoiceNumber?.message}
              className="w-full"
            />
            <CustomSingleDatePicker
              label="Date"
              selectedDate={watch('date') || ''}
              onChange={(date: string) => setValue('date', date, { shouldValidate: true })}
              error={errors.date?.message}
              register={register}
              name="date"
              variant="floating"
              borderThickness="2"
            />
            <CustomSingleDatePicker
              label="Due Date"
              selectedDate={watch('dueDate') || ''}
              onChange={(date: string) => setValue('dueDate', date, { shouldValidate: true })}
              error={errors.dueDate?.message}
              register={register}
              name="dueDate"
              variant="floating"
              borderThickness="2"
            />
            <CustomInputDropdown
              label="Commission From"
              options={[
                { id: 'Seller', name: 'Seller' },
                { id: 'Buyer', name: 'Buyer' },
                { id: 'Both', name: 'Both' },
              ]}
              selectedOption={watch('commissionFrom') || ''}
              onChange={(value) => {
                setValue('commissionFrom', value as 'Seller' | 'Buyer' | 'Both', { shouldValidate: true });
                setValue('seller', '', { shouldValidate: true });
                setValue('buyer', '', { shouldValidate: true });
                setSelectedInvoiceIds([]);
                setSelectedInvoices([]);
                setValue('relatedInvoices', []);
              }}
              error={errors.commissionFrom?.message}
              register={register}
            />
            {(commissionFrom === 'Seller' || commissionFrom === 'Both') && (
              <CustomInputDropdown
                label="Seller"
                options={sellers}
                selectedOption={watch('seller') || ''}
                onChange={(value) => {
                  setValue('seller', value, { shouldValidate: true });
                  setSelectedInvoiceIds([]);
                  setSelectedInvoices([]);
                  setValue('relatedInvoices', []);
                }}
                error={errors.seller?.message}
                register={register}
                disabled={fetchingSellers}
              />
            )}
            {(commissionFrom === 'Buyer' || commissionFrom === 'Both') && (
              <CustomInputDropdown
                label="Buyer"
                options={buyers}
                selectedOption={watch('buyer') || ''}
                onChange={(value) => {
                  setValue('buyer', value, { shouldValidate: true });
                  setSelectedInvoiceIds([]);
                  setSelectedInvoices([]);
                  setValue('relatedInvoices', []);
                }}
                error={errors.buyer?.message}
                register={register}
                disabled={fetchingBuyers}
              />
            )}
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
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={excludeSRB}
                onChange={() => setExcludeSRB((v) => !v)}
                className="form-checkbox"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-white">EXCLUDE SRB</span>
            </label>
          </div>
        </div>
        <div className="p-2 md:p-4">
          <Button
            type="button"
            onClick={() => setShowInvoiceSelection(true)}
            className="mb-2 px-4 py-2 bg-[#06b6d4] text-white rounded hover:bg-[#0891b2] font-semibold"
            disabled={loading || fetchingSellers || fetchingBuyers || fetchingPayments || !isSelectionValid()}
          >
            Select Invoice
          </Button>
        </div>
        {showInvoiceSelection && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-white dark:bg-[#030630] rounded shadow-lg p-6 w-full max-w-4xl relative">
              <button
                type="button"
                className="absolute top-2 right-2 text-gray-500 hover:text-black dark:hover:text-white"
                onClick={() => setShowInvoiceSelection(false)}
              >
                <FaTimes />
              </button>
              <h3 className="text-lg font-semibold mb-2 dark:text-white">Select Invoices (Completed Payments with Zero Balance)</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm md:text-base">
                  <thead>
                    <tr className="bg-[#06b6d4] text-white">
                      <th className="p-2 md:p-3"></th>
                      <th className="p-2 md:p-3">Invoice#</th>
                      <th className="p-2 md:p-3">Invoice Date</th>
                      <th className="p-2 md:p-3">Buyer Name</th>
                      <th className="p-2 md:p-3">Quality</th>
                      <th className="p-2 md:p-3">Invoice Qty</th>
                      <th className="p-2 md:p-3">Rate</th>
                      <th className="p-2 md:p-3">Invoice Value</th>
                      <th className="p-2 md:p-3">Commission %</th>
                      <th className="p-2 md:p-3">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      // Get zero-balance invoice numbers from payments/advances
                      const zeroBalanceInvoiceNumbers = getZeroBalanceInvoiceNumbers();

                      // Filter invoices that are completed, have zero balance, and match seller/buyer
                      return invoices
                        .filter((invoice) => {
                          // Only show completed invoices
                          if (invoice.status !== 'Completed') return false;

                          // Check if invoice has zero balance
                          const isZeroBalance = zeroBalanceInvoiceNumbers.has(invoice.invoiceNumber);

                          // Match seller and buyer based on commissionFrom
                          const sellerMatch =
                            commissionFrom === 'Seller' || commissionFrom === 'Both'
                              ? invoice.seller === sellers.find((s) => s.id === selectedSeller)?.name
                              : true;
                          const buyerMatch =
                            commissionFrom === 'Buyer' || commissionFrom === 'Both'
                              ? invoice.buyer === buyers.find((b) => b.id === selectedBuyer)?.name
                              : true;

                          return isZeroBalance && sellerMatch && buyerMatch;
                        })
                        .map((invoice) => {
                          const commissionPercent = parseFloat(invoice.commissionPercent || '0');
                          const invoiceValue = parseFloat(invoice.invoiceValue || '0');
                          const amount = ((invoiceValue * commissionPercent) / 100).toFixed(2);
                          return (
                            <tr
                              key={invoice.id}
                              className={`border-b hover:bg-gray-100 ${selectedInvoiceIds.includes(invoice.id) ? 'bg-blue-100' : ''}`}
                            >
                              <td className="p-2 md:p-3">
                                <input
                                  type="checkbox"
                                  checked={selectedInvoiceIds.includes(invoice.id)}
                                  onChange={() => handleInvoiceSelect(invoice)}
                                />
                              </td>
                              <td className="p-2 md:p-3">{invoice.invoiceNumber}</td>
                              <td className="p-2 md:p-3">{invoice.invoiceDate}</td>
                              <td className="p-2 md:p-3">{invoice.buyer}</td>
                              <td className="p-2 md:p-3">{invoice.quality}</td>
                              <td className="p-2 md:p-3">{invoice.invoiceQty}</td>
                              <td className="p-2 md:p-3">{invoice.rate}</td>
                              <td className="p-2 md:p-3">{invoice.invoiceValue}</td>
                              <td className="p-2 md:p-3">{invoice.commissionPercent}</td>
                              <td className="p-2 md:p-3">{amount}</td>
                            </tr>
                          );
                        });
                    })()}
                  </tbody>
                </table>
                {(() => {
                  const zeroBalanceInvoiceNumbers = getZeroBalanceInvoiceNumbers();
                  const matchingInvoices = invoices.filter((inv) => {
                    const isZeroBalance = zeroBalanceInvoiceNumbers.has(inv.invoiceNumber);
                    const sellerMatch =
                      commissionFrom === 'Seller' || commissionFrom === 'Both'
                        ? inv.seller === sellers.find((s) => s.id === selectedSeller)?.name
                        : true;
                    const buyerMatch =
                      commissionFrom === 'Buyer' || commissionFrom === 'Both'
                        ? inv.buyer === buyers.find((b) => b.id === selectedBuyer)?.name
                        : true;
                    return inv.status === 'Completed' && isZeroBalance && sellerMatch && buyerMatch;
                  });
                  return matchingInvoices.length === 0 ? (
                    <p className="text-gray-500 text-sm md:text-base mt-2">
                      No completed invoices with zero balance found for the selected {commissionFrom}.
                    </p>
                  ) : null;
                })()}
              </div>
              <div className="flex justify-end mt-4">
                <Button
                  type="button"
                  onClick={() => setShowInvoiceSelection(false)}
                  className="px-4 py-2 bg-[#06b6d4] text-white rounded hover:bg-[#0891b2] font-semibold"
                >
                  Done
                </Button>
              </div>
            </div>
          </div>
        )}
        {selectedInvoices.length > 0 && (
          <div className="p-2 md:p-4">
            <h2 className="text-lg md:text-xl text-[#06b6d4] font-bold dark:text-white mb-2">Selected Invoices</h2>
            <div className="border rounded p-4 mt-2 overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm md:text-base">
                <thead>
                  <tr className="bg-[#06b6d4] text-white">
                    <th className="p-2 md:p-3">Invoice#</th>
                    <th className="p-2 md:p-3">Invoice Date</th>
                    <th className="p-2 md:p-3">Buyer Name</th>
                    <th className="p-2 md:p-3">Quality</th>
                    <th className="p-2 md:p-3">Invoice Qty</th>
                    <th className="p-2 md:p-3">Rate</th>
                    <th className="p-2 md:p-3">Invoice Value</th>
                    <th className="p-2 md:p-3">Commission %</th>
                    <th className="p-2 md:p-3">Amount</th>
                    <th className="p-2 md:p-3">SR Tax</th>
                    <th className="p-2 md:p-3">SR Tax Amount</th>
                    <th className="p-2 md:p-3">Total Amount</th>
                    <th className="p-2 md:p-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedInvoices.map((invoice) => {
                    const srTax = srTaxMap[invoice.id] || '1';
                    const commissionPercent = parseFloat(invoice.commissionPercent || '0');
                    const invoiceValue = parseFloat(invoice.invoiceValue || '0');
                    const amount = ((invoiceValue * commissionPercent) / 100).toFixed(2);
                    const srTaxAmount = excludeSRB ? '0.00' : ((parseFloat(amount) * parseFloat(srTax)) / 100).toFixed(2);
                    const totalAmount = excludeSRB ? amount : (parseFloat(amount) + parseFloat(srTaxAmount)).toFixed(2);
                    return (
                      <tr key={invoice.id} className="border-b hover:bg-gray-100">
                        <td className="p-2 md:p-3">{invoice.invoiceNumber}</td>
                        <td className="p-2 md:p-3">{invoice.invoiceDate}</td>
                        <td className="p-2 md:p-3">{invoice.buyer}</td>
                        <td className="p-2 md:p-3">{invoice.quality}</td>
                        <td className="p-2 md:p-3">{invoice.invoiceQty}</td>
                        <td className="p-2 md:p-3">{invoice.rate}</td>
                        <td className="p-2 md:p-3">{invoice.invoiceValue}</td>
                        <td className="p-2 md:p-3">{invoice.commissionPercent}</td>
                        <td className="p-2 md:p-3">{amount}</td>
                        <td className="p-2 md:p-3">
                          <select
                            value={srTax}
                            onChange={(e) => {
                              const value = e.target.value;
                              setSrTaxMap((prev) => ({ ...prev, [invoice.id]: value }));
                              const updatedInvoices = [...selectedInvoices];
                              const index = updatedInvoices.findIndex((inv) => inv.id === invoice.id);
                              if (index >= 0) {
                                updatedInvoices[index].srTax = value;
                                updatedInvoices[index].srTaxAmount = excludeSRB
                                  ? '0.00'
                                  : ((parseFloat(amount) * parseFloat(value)) / 100).toFixed(2);
                                updatedInvoices[index].totalAmount = excludeSRB
                                  ? amount
                                  : (parseFloat(amount) + parseFloat(updatedInvoices[index].srTaxAmount)).toFixed(2);
                                setValue(
                                  'relatedInvoices',
                                  updatedInvoices.map((inv) => ({
                                    id: inv.id,
                                    invoiceNumber: inv.invoiceNumber,
                                    invoiceDate: inv.invoiceDate,
                                    buyer: inv.buyer,
                                    quality: inv.quality,
                                    invoiceQty: inv.invoiceQty,
                                    rate: inv.rate,
                                    invoiceValue: inv.invoiceValue,
                                    commissionPercent: inv.commissionPercent,
                                    amount: ((parseFloat(inv.invoiceValue || '0') * parseFloat(inv.commissionPercent || '0')) / 100).toFixed(2),
                                    srTax: inv.srTax ? String(inv.srTax) : '1',
                                    srTaxAmount: inv.srTaxAmount ? String(inv.srTaxAmount) : '0.00',
                                    totalAmount: inv.totalAmount ? String(inv.totalAmount) : '0.00',
                                  }))
                                );
                              }
                            }}
                            className="border p-1 rounded"
                            disabled={excludeSRB}
                          >
                            <option value="1">1%</option>
                            <option value="15">15%</option>
                          </select>
                        </td>
                        <td className="p-2 md:p-3">{srTaxAmount}</td>
                        <td className="p-2 md:p-3">{totalAmount}</td>
                        <td className="p-2 md:p-3">
                          <button
                            type="button"
                            onClick={() => handleInvoiceSelect(invoice)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <FaTimes />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="mt-2 font-bold">Buyer Name: {selectedInvoices[0]?.buyer || 'N/A'}</div>
          </div>
        )}
        <div className="w-full h-16 md:h-[8vh] flex flex-col md:flex-row justify-end gap-2 mt-3 bg-transparent border-t-2 border-[#e7e7e7] p-2 md:p-4">
          <Button
            type="submit"
            className="w-full md:w-[160px] gap-2 inline-flex items-center bg-[#0e7d90] hover:bg-[#0891b2] text-white px-6 py-2 text-sm font-medium transition-all duration-200 font-mono hover:translate-y-[-2px] focus:outline-none active:shadow-[#3c4fe0_0_3px_7px_inset] active:translate-y-[2px]"
            disabled={loading || fetchingSellers || fetchingBuyers || fetchingPayments}
          >
            Save
          </Button>
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

export default CommissionInvoiceForm;