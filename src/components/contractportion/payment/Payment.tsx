'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { string, z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'react-toastify';
import CustomInput from '@/components/ui/CustomInput';
import CustomInputDropdown from '@/components/ui/CustomeInputDropdown';
import CustomSingleDatePicker from '@/components/ui/CustomDateRangePicker';
import { MdPayment } from 'react-icons/md';
import { BiSolidErrorAlt } from 'react-icons/bi';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { getAllSellers } from '@/apis/seller';
import { getAllBuyer } from '@/apis/buyer';
import { getAllInvoice } from '@/apis/invoice';
import { createPayment, updatePayment } from '@/apis/payment';

// Schema for form validation
const PaymentSchema = z.object({
  paymentNumber: z.string().optional(),
  paymentDate: z.string().min(1, 'Payment date is required'),
  paymentType: z.enum(['Advance', 'Payment'], { required_error: 'Payment type is required' }),
  mode: z.string().min(1, 'Payment mode is required'),
  bankName: z.string().min(1, 'Bank name is required'),
  chequeNo: z.string().optional(),
  chequeDate: z.string().optional(),
  seller: z.string().min(1, 'Seller is required'),
  buyer: z.string().min(1, 'Buyer is required'),
  paidAmount: z.string().min(1, 'Paid amount is required'),
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
  const [loading, setLoading] = useState(false);
  const [fetchingSellers, setFetchingSellers] = useState(false);
  const [fetchingBuyers, setFetchingBuyers] = useState(false);
  const [idFocused, setIdFocused] = useState(false);

  // Static options for Payment Type and Bank Name
  const paymentTypes = [
    { id: 'Advance', name: 'Advance' },
    { id: 'Payment', name: 'Payment' },
  ];

  const bankNames = [
    { id: '1', name: 'Habib Bank Limited' },
    { id: '2', name: 'United Bank Limited' },
    { id: '3', name: 'MCB Bank Limited' },
    { id: '4', name: 'Allied Bank Limited' },
    { id: '5', name: 'National Bank of Pakistan' },
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

  // Watch relatedInvoices for dynamic updates
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
      toast('Failed to fetch sellers', { type: 'error' });
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
          .map((invoice: any) => ({
            id: String(invoice.id),
            invoiceNumber: invoice.invoiceNumber || '',
            invoiceDate: invoice.invoiceDate || '',
            dueDate: invoice.dueDate || '',
            seller: invoice.seller || '',
            buyer: invoice.buyer || '',
            totalAmount: invoice.totalAmount || '0',
            receivedAmount: invoice.receivedAmount || '0',
            balance: (
              (parseFloat(invoice.totalAmount || '0') || 0) -
              (parseFloat(invoice.receivedAmount || '0')) || 0
            ).toFixed(2),
            invoiceAdjusted: invoice.invoiceAdjusted || 'No',
            isSelected: isEdit && initialData?.relatedInvoices?.some((ri) => ri?.id === invoice.id),
          }));
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
      setValue('paidAmount', initialData.paidAmount || '');
      setValue('incomeTaxAmount', initialData.incomeTaxAmount || '');
      setValue('advanceReceived', initialData.advanceReceived || '');
      setValue('remarks', initialData.remarks || '');
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
          invoiceAdjusted: ri.invoiceAdjusted || 'No',
        })) || []
      );
    }
  }, [isEdit, initialData, sellers, buyers, setValue, router]);

  // Filter invoices by Seller and Buyer
  useEffect(() => {
    let filtered: ExtendedInvoice[] = [];

    if (isEdit && initialData?.relatedInvoices) {
      filtered = invoices.filter((invoice) =>
        initialData.relatedInvoices!.some((ri) => ri.id === invoice.id)
      );
    } else {
      const selectedSellerObj = sellers.find((s) => String(s.id) === String(selectedSeller));
      const selectedBuyerObj = buyers.find((b) => String(b.id) === String(selectedBuyer));

      filtered = invoices.filter(
        (invoice) =>
          invoice.seller === selectedSellerObj?.name && invoice.buyer === selectedBuyerObj?.name
      );
    }

    setFilteredInvoices(filtered);
  }, [isEdit, initialData, selectedSeller, selectedBuyer, invoices, sellers, buyers]);

  // Fetch data on mount
  useEffect(() => {
    fetchSellers();
    fetchBuyers();
    fetchInvoices();
  }, []);

  // Handle invoice selection and update relatedInvoices
  const handleInvoiceSelect = (invoice: ExtendedInvoice, checked: boolean) => {
    setInvoices((prev) =>
      prev.map((inv) =>
        inv.id === invoice.id ? { ...inv, isSelected: checked } : inv
      )
    );
    setFilteredInvoices((prev) =>
      prev.map((inv) =>
        inv.id === invoice.id ? { ...inv, isSelected: checked } : inv
      )
    );

    if (checked) {
      setValue('relatedInvoices', [
        ...watchedInvoices,
        {
          id: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          invoiceDate: invoice.invoiceDate,
          dueDate: invoice.dueDate,
          seller: invoice.seller,
          buyer: invoice.buyer,
          totalAmount: invoice.totalAmount,
          receivedAmount: invoice.receivedAmount,
          balance: invoice.balance,
          invoiceAdjusted: invoice.invoiceAdjusted,
        },
      ]);
    } else {
      setValue(
        'relatedInvoices',
        watchedInvoices.filter((inv) => inv.id !== invoice.id)
      );
    }
  };

  // Update balance when totalAmount or receivedAmount changes
  const updateBalance = (index: number, totalAmount: string, receivedAmount: string) => {
    const balance = (parseFloat(totalAmount || '0') - parseFloat(receivedAmount || '0')).toFixed(2);
    const updatedInvoices = [...watchedInvoices];
    updatedInvoices[index] = {
      ...updatedInvoices[index],
      totalAmount,
      receivedAmount,
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
        bankName: bankNames.find((b) => b.id === data.bankName)?.name || data.bankName,
        chequeNo: data.chequeNo,
        chequeDate: data.chequeDate,
        seller: sellers.find((s) => s.id === data.seller)?.name || data.seller,
        buyer: buyers.find((b) => b.id === data.buyer)?.name || data.buyer,
        paidAmount: data.paidAmount,
        incomeTaxAmount: data.incomeTaxAmount,
        advanceReceived: data.advanceReceived,
        remarks: data.remarks,
        creationDate: isEdit
          ? initialData?.creationDate || new Date().toISOString()
          : new Date().toISOString(),
        updationDate: new Date().toISOString(),
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              onChange={(value) =>
                setValue('paymentType', value as 'Advance' | 'Payment', { shouldValidate: true })
              }
              error={errors.paymentType?.message}
              register={register}
            />
            <CustomInput
              variant="floating"
              borderThickness="2"
              label="Mode"
              id="mode"
              {...register('mode')}
              error={errors.mode?.message}
              className="w-full"
            />
            <CustomInputDropdown
              label="Bank Name"
              options={bankNames}
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
              onChange={(value) => setValue('seller', value, { shouldValidate: true })}
              error={errors.seller?.message}
              register={register}
            />
            <CustomInputDropdown
              label="Buyer"
              options={buyers}
              selectedOption={watch('buyer') || ''}
              onChange={(value) => setValue('buyer', value, { shouldValidate: true })}
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
            <div className="mt-4 col-span-1 md:col-span-3">
              <h2 className="text-lg md:text-xl text-[#06b6d4] font-bold dark:text-white">Remarks</h2>
              <textarea
                className="w-full p-2 border-[#06b6d4] border rounded text-sm md:text-base"
                rows={4}
                {...register('remarks')}
                placeholder="Enter any remarks"
              />
              {errors.remarks && <p className="text-red-500 text-sm">{errors.remarks.message}</p>}
            </div>
          </div>
        </div>

        {selectedPaymentType === 'Payment' && (
          <div className="p-2 md:p-4">
            <h2 className="text-lg md:text-xl text-[#06b6d4] font-bold dark:text-white">Related Invoices</h2>
            <div className="border rounded p-4 mt-2 overflow-x-auto">
              {loading || fetchingSellers || fetchingBuyers ? (
                <p className="text-gray-500 text-sm md:text-base">Loading invoices, sellers, or buyers...</p>
              ) : selectedSeller && selectedBuyer ? (
                filteredInvoices.length > 0 ? (
                  <table className="w-full text-left border-collapse text-sm md:text-base">
                    <thead>
                      <tr className="bg-[#06b6d4] text-white">
                        <th className="p-2 md:p-3 font-medium">Select</th>
                        <th className="p-2 md:p-3 font-medium">Invoice #</th>
                        <th className="p-2 md:p-3 font-medium">Invoice Date</th>
                        <th className="p-2 md:p-3 font-medium">Due Date</th>
                        <th className="p-2 md:p-3 font-medium">Inv. Amount</th>
                        <th className="p-2 md:p-3 font-medium">Received Amount</th>
                        <th className="p-2 md:p-3 font-medium">Balance</th>
                        <th className="p-2 md:p-3 font-medium">Invoice Adjusted</th>
                      </tr>
                    </thead>
                  <tbody>
  {filteredInvoices.map((invoice, index) => (
    <tr
      key={invoice.id}
      className={`border-b hover:bg-gray-100 cursor-pointer ${
        invoice.isSelected ? 'bg-blue-100' : ''
      } block md:table-row`}
      onClick={() => handleInvoiceSelect(invoice, !invoice.isSelected)}
    >
      <td className="p-2 md:p-3 block md:table-cell before:content-['Select:'] before:font-bold before:md:hidden">
        <input
          type="checkbox"
          checked={invoice.isSelected || false}
          onChange={(e) => handleInvoiceSelect(invoice, e.target.checked)}
          onClick={(e) => e.stopPropagation()}
        />
      </td>
      <td className="p-2 md:p-3 block md:table-cell before:content-['Invoice_#:'] before:font-bold before:md:hidden">
        {invoice.invoiceNumber || '-'}
      </td>
      <td className="p-2 md:p-3 block md:table-cell before:content-['Invoice_Date:'] before:font-bold before:md:hidden">
        {invoice.invoiceDate || '-'}
      </td>
      <td className="p-2 md:p-3 block md:table-cell before:content-['Due_Date:'] before:font-bold before:md:hidden">
        {invoice.dueDate || '-'}
      </td>
      <td className="p-2 md:p-3 block md:table-cell before:content-['Inv._Amount:'] before:font-bold before:md:hidden">
        <input
          type="number"
          step="0.01"
          value={
            watchedInvoices.find((inv) => inv.id === invoice.id)?.totalAmount === '0' ||
            !watchedInvoices.find((inv) => inv.id === invoice.id)?.totalAmount
              ? ''
              : watchedInvoices.find((inv) => inv.id === invoice.id)?.totalAmount || invoice.totalAmount || ''
          }
          onChange={(e) => {
            const value = e.target.value;
            const updatedInvoices = [...watchedInvoices];
            const invIndex = updatedInvoices.findIndex((inv) => inv.id === invoice.id);
            if (invIndex >= 0) {
              updatedInvoices[invIndex].totalAmount = value;
              updateBalance(
                invIndex,
                value,
                updatedInvoices[invIndex].receivedAmount || '0'
              );
            } else {
              updatedInvoices.push({
                ...invoice,
                totalAmount: value,
                receivedAmount: invoice.receivedAmount || '0',
                balance: invoice.balance || '0',
                invoiceAdjusted: invoice.invoiceAdjusted || 'No',
              });
              updateBalance(
                updatedInvoices.length - 1,
                value,
                invoice.receivedAmount || '0'
              );
            }
            setValue('relatedInvoices', updatedInvoices);
          }}
          onClick={(e) => e.stopPropagation()}
          className="w-full p-2 border border-gray-300 rounded"
        />
      </td>
      <td className="p-2 md:p-3 block md:table-cell before:content-['Received_Amount:'] before:font-bold before:md:hidden">
        <input
          type="number"
          step="0.01" // Changed to allow decimal places for consistency
          value={
            watchedInvoices.find((inv) => inv.id === invoice.id)?.receivedAmount === '0' ||
            !watchedInvoices.find((inv) => inv.id === invoice.id)?.receivedAmount
              ? ''
              : watchedInvoices.find((inv) => inv.id === invoice.id)?.receivedAmount || invoice.receivedAmount || ''
          }
          onChange={(e) => {
            const value = e.target.value;
            const updatedInvoices = [...watchedInvoices];
            const invIndex = updatedInvoices.findIndex((inv) => inv.id === invoice.id);
            if (invIndex >= 0) {
              updatedInvoices[invIndex].receivedAmount = value;
              updateBalance(
                invIndex,
                updatedInvoices[invIndex].totalAmount || '0',
                value
              );
            } else {
              updatedInvoices.push({
                ...invoice,
                totalAmount: invoice.totalAmount || '0',
                receivedAmount: value,
                balance: invoice.balance || '0',
                invoiceAdjusted: invoice.invoiceAdjusted || 'No',
              });
              updateBalance(
                updatedInvoices.length - 1,
                invoice.totalAmount || '0',
                value
              );
            }
            setValue('relatedInvoices', updatedInvoices);
          }}
          onClick={(e) => e.stopPropagation()}
          className="w-full p-2 border border-gray-300 rounded"
        />
      </td>
      <td className="p-2 md:p-3 block md:table-cell before:content-['Balance:'] before:font-bold before:md:hidden">
        {watchedInvoices.find((inv) => inv.id === invoice.id)?.balance || invoice.balance || '0.00'}
      </td>
      <td className="p-2 md:p-3 block md:table-cell before:content-['Invoice_Adjusted:'] before:font-bold before:md:hidden">
        <input
          type="number"
          step="0.01"
          value={
            watchedInvoices.find((inv) => inv.id === invoice.id)?.invoiceAdjusted === '0' ||
            !watchedInvoices.find((inv) => inv.id === invoice.id)?.invoiceAdjusted
              ? ''
              : watchedInvoices.find((inv) => inv.id === invoice.id)?.invoiceAdjusted || invoice.invoiceAdjusted || ''
          }
          onChange={(e) => {
            const value = e.target.value;
            const updatedInvoices = [...watchedInvoices];
            const invIndex = updatedInvoices.findIndex((inv) => inv.id === invoice.id);
            if (invIndex >= 0) {
              updatedInvoices[invIndex].invoiceAdjusted = value;
            } else {
              updatedInvoices.push({
                ...invoice,
                totalAmount: invoice.totalAmount || '0',
                receivedAmount: invoice.receivedAmount || '0',
                balance: invoice.balance || '0',
                invoiceAdjusted: value,
              });
            }
            setValue('relatedInvoices', updatedInvoices);
          }}
          onClick={(e) => e.stopPropagation()}
          className="w-full p-2 border border-gray-300 rounded"
        />
      </td>
    </tr>
  ))}
</tbody>
                  </table>
                ) : (
                  <p className="text-gray-500 text-sm md:text-base">
                    No approved invoices found for the selected Seller and Buyer.
                  </p>
                )
              ) : (
                <p className="text-gray-500 text-sm md:text-base">Please select both Seller and Buyer to view invoices.</p>
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
        onChange={(e) => setValue('advanceReceived', e.target.value, { shouldValidate: true })}
        className="w-full p-2 border border-gray-300 rounded"
        placeholder="Enter advance received (numbers only)"
      />
      {errors.advanceReceived && (
        <p className="text-red-500 text-sm mt-1">{errors.advanceReceived.message}</p>
      )}
    </td>
   <td className="p-2 md:p-3 block md:table-cell before:content-['Remarks:'] before:font-bold before:md:hidden">
   <input
    type="text"
    {...register('remarks')}
    onChange={(e) => setValue('remarks', e.target.value, { shouldValidate: true })}
    className="w-full p-2 border border-gray-300 rounded"
    placeholder="Enter remarks (text)"
   />
   {errors.remarks && (
    <p className="text-red-500 text-sm mt-1">{errors.remarks.message}</p>
   )}
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
          tbody, tr {
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
