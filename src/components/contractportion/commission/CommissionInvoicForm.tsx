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

const CommissionInvoiceForm = () => {
  const [sellers, setSellers] = useState<{ id: string; name: string }[]>([]);
  const [buyers, setBuyers] = useState<{ id: string; name: string }[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [showInvoiceSelection, setShowInvoiceSelection] = useState(false);
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<string[]>([]);
  const [selectedInvoices, setSelectedInvoices] = useState<Invoice[]>([]);
  const [excludeSRB, setExcludeSRB] = useState(false);
  const [srTaxMap, setSrTaxMap] = useState<{ [id: string]: string }>({});
  const [loading, setLoading] = useState(false);
  const [fetchingSellers, setFetchingSellers] = useState(false);
  const [fetchingBuyers, setFetchingBuyers] = useState(false);

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

  // Fetch data on mount
  useEffect(() => {
    fetchSellers();
    fetchBuyers();
    fetchInvoices();
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
      const srTaxAmount = ((parseFloat(amount) * parseFloat(srTax)) / 100).toFixed(2);
      const totalAmount = (parseFloat(amount) + parseFloat(srTaxAmount)).toFixed(2);
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
  }, [selectedInvoiceIds, invoices, srTaxMap, setValue]);

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
            disabled={loading || fetchingSellers || fetchingBuyers}
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
              <h3 className="text-lg font-semibold mb-2 dark:text-white">Select Invoices (Completed Payments Only)</h3>
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
                    {invoices
                      .filter((inv) => inv.status === 'Completed')
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
                      })}
                  </tbody>
                </table>
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
                  </tr>
                </thead>
                <tbody>
                  {selectedInvoices.map((invoice) => {
                    const srTax = srTaxMap[invoice.id] || '1';
                    const commissionPercent = parseFloat(invoice.commissionPercent || '0');
                    const invoiceValue = parseFloat(invoice.invoiceValue || '0');
                    const amount = ((invoiceValue * commissionPercent) / 100).toFixed(2);
                    const srTaxAmount = ((parseFloat(amount) * parseFloat(srTax)) / 100).toFixed(2);
                    const totalAmount = (parseFloat(amount) + parseFloat(srTaxAmount)).toFixed(2);
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
                                updatedInvoices[index].srTaxAmount = (
                                  (parseFloat(amount) * parseFloat(value)) / 100
                                ).toFixed(2);
                                updatedInvoices[index].totalAmount = (
                                  parseFloat(amount) + parseFloat(updatedInvoices[index].srTaxAmount)
                                ).toFixed(2);
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
                          >
                            <option value="1">1%</option>
                            <option value="15">15%</option>
                          </select>
                        </td>
                        <td className="p-2 md:p-3">{srTaxAmount}</td>
                        <td className="p-2 md:p-3">{totalAmount}</td>
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
            disabled={loading || fetchingSellers || fetchingBuyers}
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