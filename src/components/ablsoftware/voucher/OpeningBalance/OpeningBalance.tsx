'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  useForm, 
  useFieldArray,
} from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { toast } from 'react-toastify';
import { useRouter } from 'next/navigation';
import { FiPlus, FiSave, FiTrash2 } from 'react-icons/fi';
import { MdInfo } from 'react-icons/md';
import ABLCustomInput from '@/components/ui/ABLCustomInput';

import {
  createOpeningBalance,
  updateOpeningBalance,
  getSingleOpeningBalance,
} from '@/apis/openingbalance';
import { getAllMunshyana } from '@/apis/munshyana';

// Default charge types as fallback
const defaultChargeTypes = [
  { value: 'freight', label: 'Freight Charges' },
  { value: 'loading', label: 'Loading / Unloading' },
  { value: 'detention', label: 'Detention Charges' },
  { value: 'demurrage', label: 'Demurrage' },
  { value: 'toll', label: 'Toll / Octroi' },
  { value: 'fuel_surcharge', label: 'Fuel Surcharge' },
  { value: 'advance', label: 'Advance / Hamali' },
  { value: 'service_tax', label: 'Service Tax / GST' },
  { value: 'other', label: 'Other Charges' },
]; 
const rowSchema = z.object({
  id:          z.string().optional(), // For edit mode
  type:        z.enum(['customer', 'broker', 'charges']),
  biltyNo:     z.string().optional(),
  biltyDate:   z.string().optional(),
  vehicleNo:   z.string().optional(),
  city:        z.string().optional(),
  customer:    z.string().optional(),
  broker:      z.string().optional(),
  chargeType:  z.string().optional(),
  debit:       z.number().min(0).default(0),
  credit:      z.number().min(0).default(0),
}).superRefine((data, ctx) => {
  if (data.type === 'customer') {
    if (data.debit <= 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Debit > 0 required', path: ['debit'] });
    }
    if (data.credit > 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Credit should be 0', path: ['credit'] });
    }
    if (!data.customer?.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Customer required', path: ['customer'] });
    }
  } else if (data.type === 'broker') {
    if (data.credit <= 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Credit > 0 required', path: ['credit'] });
    }
    if (data.debit > 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Debit should be 0', path: ['debit'] });
    }
    if (!data.broker?.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Broker required', path: ['broker'] });
    }
  } else if (data.type === 'charges') {
    if (data.credit <= 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Amount (credit) > 0 required', path: ['credit'] });
    }
    if (data.debit > 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Debit should be 0', path: ['debit'] });
    }
    if (!data.chargeType?.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Charge type required', path: ['chargeType'] });
    }
  }
});

const openingBalanceSchema = z.object({
  id:          z.string().optional(),
  openingNo:   z.string().optional(),
  openingDate: z.string().min(1, 'Date is required'),
  createdBy:   z.string().optional(),
  creationDate: z.string().optional(),
  updatedBy:   z.string().optional(),
  updationDate: z.string().optional(),
  status:      z.string().optional(),
  OpeningBalanceEntrys: z.array(rowSchema).min(1, 'At least one entry required'),
});

type OpeningBalanceFormData = z.infer<typeof openingBalanceSchema>;

const OpeningBalanceForm = ({ isEdit = false }: { isEdit?: boolean }) => {
  const router = useRouter();
  
  // Check if we're in view mode
  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const isViewMode = searchParams?.get('mode') === 'view';
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [chargeTypes, setChargeTypes] = useState<{ value: string; label: string }[]>(defaultChargeTypes);

  const form = useForm<OpeningBalanceFormData>({
    resolver: zodResolver(openingBalanceSchema),
    defaultValues: {
      openingDate: new Date().toISOString().split('T')[0],
      OpeningBalanceEntrys: [{
        type: 'customer',
        biltyNo: '',
        biltyDate: '',
        vehicleNo: '',
        city: '',
        customer: '',
        broker: '',
        chargeType: '',
        debit: 0,
        credit: 0,
      }],
    },
  });

  const { register, handleSubmit, setValue, watch, formState: { errors } } = form;
  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'OpeningBalanceEntrys' });

  const OpeningBalanceEntrys = watch('OpeningBalanceEntrys') || [];

  const hasCustomer   = OpeningBalanceEntrys.some(e => e.type === 'customer');
  const hasBroker     = OpeningBalanceEntrys.some(e => e.type === 'broker');
  const hasCharges    = OpeningBalanceEntrys.some(e => e.type === 'charges');

  const totals = useMemo(() => {
    const debit  = OpeningBalanceEntrys.reduce((sum, r) => sum + (r.debit  || 0), 0);
    const credit = OpeningBalanceEntrys.reduce((sum, r) => sum + (r.credit || 0), 0);
    return { debit, credit, difference: debit - credit };
  }, [OpeningBalanceEntrys]);

  const handleAddRow = (e?: React.MouseEvent<HTMLButtonElement>) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    append({
      type: 'customer',
      biltyNo: '',
      biltyDate: '',
      vehicleNo: '',
      city: '',
      customer: '',
      broker: '',
      chargeType: '',
      debit: 0,
      credit: 0,
    });
  };

  // Fetch charge types from Munshyana on component mount
  useEffect(() => {
    const fetchChargeTypes = async () => {
      try {
        const response = await getAllMunshyana(1, 1000);
        if (response?.data && Array.isArray(response.data)) {
          const fetchedCharges = response.data.map((m: any) => ({
            value: m.id || m.chargesDesc || '',
            label: m.chargesDesc || m.id || '',
          })).filter((c: { value: string; label: string }) => c.value && c.label);
          
          if (fetchedCharges.length > 0) {
            setChargeTypes(fetchedCharges);
          }
        }
      } catch (error) {
        console.error('Failed to fetch charge types:', error);
        // Keep default charge types on error
      }
    };

    fetchChargeTypes();
  }, []);

  useEffect(() => {
    if (!isEdit) {
      setIsLoading(false);
      return;
    }

    const load = async () => {
      setIsLoading(true);
      try {
        const id = window.location.pathname.split('/').pop();
        if (!id) return;

        const { data } = await getSingleOpeningBalance(id);

        setValue('id', data.id || id);
        setValue('openingNo', String(data.openingNo || ''));
        setValue('openingDate', data.openingDate || '');
        setValue('createdBy', data.createdBy || '');
        setValue('creationDate', data.creationDate || '');
        setValue('updatedBy', data.updatedBy || '');
        setValue('updationDate', data.updationDate || '');
        setValue('status', data.status || '');

        const loaded = (data.openingBalanceEntrys || []).map((e: any) => {
          const debitVal  = Number(e.debit  || 0);
          const creditVal = Number(e.credit || 0);
          let rowType: 'customer' | 'broker' | 'charges' = 'broker';

          if (debitVal > 0) rowType = 'customer';
          else if (creditVal > 0 && e.chargeType) rowType = 'charges';

          return {
            id: e.id, // Include the entry ID for updates
            type: rowType,
            biltyNo:     e.biltyNo    || '',
            biltyDate:   e.biltyDate  || '',
            vehicleNo:   e.vehicleNo  || '',
            city:        e.city       || '',
            customer:    rowType === 'customer' ? (e.customer || '') : '',
            broker:      rowType === 'broker'   ? (e.broker   || e.customer || '') : '',
            chargeType:  rowType === 'charges'  ? (e.chargeType || '') : '',
            debit:       debitVal,
            credit:      creditVal,
          };
        });

        setValue('OpeningBalanceEntrys', loaded.length ? loaded : form.getValues().OpeningBalanceEntrys);
      } catch (err) {
        toast.error('Failed to load opening balance');
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [isEdit, setValue]);

  const onSubmit = async (data: OpeningBalanceFormData) => {
    setIsSubmitting(true);
    try {
      const payload: any = {
        openingDate: data.openingDate,
        openingBalanceEntrys: data.OpeningBalanceEntrys.map(e => ({
          id:          e.id || undefined, // Include ID for existing entries
          biltyNo:     e.biltyNo || null,
          biltyDate:   e.biltyDate || null,
          vehicleNo:   e.vehicleNo || null,
          city:        e.city || null,
          customer:    e.type === 'customer' ? (e.customer || null) : null,
          broker:      e.type === 'broker'   ? (e.broker || null)   : null,
          chargeType:  e.type === 'charges'  ? (e.chargeType || null) : null,
          debit:       e.debit || 0,
          credit:      e.credit || 0,
        })),
      };

      if (isEdit) {
        const id = window.location.pathname.split('/').pop();
        payload.id = id;
        payload.createdBy = data.createdBy || null;
        payload.creationDate = data.creationDate || null;
        payload.updatedBy = 'System'; // You can get this from auth context
        payload.updationDate = new Date().toISOString();
        payload.status = data.status || null;
        
        await updateOpeningBalance(payload);
        toast.success('Updated successfully');
      } else {
        await createOpeningBalance(payload);
        toast.success('Created successfully');
      }
      router.push('/openingbalance');
    } catch (error) {
      console.error('Failed to save:', error);
      toast.error('Failed to save');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      {!isViewMode && (
      <div className="bg-gradient-to-r from-[#3a614c] to-[#6e997f] text-white px-6 py-5">
        <h1 className="text-2xl md:text-3xl font-bold">
          {isEdit ? 'Edit Party Opening Balance' : 'Party Opening Balance'}
        </h1>
        <p className="mt-2 text-emerald-100/90">
          Customer (Debit) • Broker / Charges (Credit)
        </p>
      </div>
      )}


      {isViewMode && (
        <div className="m-6 p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl flex items-center gap-3">
          <div>
            <p className="font-medium text-amber-800 dark:text-amber-200">View Only Mode</p>
            <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
              This opening balance record is read-only. No changes can be made.
            </p>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="p-12 text-center text-gray-500 dark:text-gray-400">Loading...</div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 md:p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 bg-gray-50 dark:bg-gray-800/40 p-6 rounded-xl border">
            <ABLCustomInput label="Opening Balance #" type="text" {...register('openingNo')} disabled placeholder="Auto-generated" />
            <ABLCustomInput label="Date *" type="date" {...register('openingDate')} error={errors.openingDate?.message} disabled={isViewMode} />
          </div>

          <div className="overflow-x-auto max-h-[400px] overflow-y-auto rounded-xl border border-gray-200 dark:border-gray-700 shadow">
            <table className="w-full min-w-[1600px] table-fixed">
              <thead className='sticky top-0 z-10'>
                <tr className="bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700">
                  <th className="px-5 py-4 text-left font-semibold text-gray-700 dark:text-gray-300 w-28">PARTICULAR</th>
                  <th className="px-10 py-4 text-left font-semibold text-gray-700 dark:text-gray-300">BILTY NO</th>
                  <th className="px-10 py-4 text-left font-semibold text-gray-700 dark:text-gray-300">BILTY DATE</th>
                  <th className="px-10 py-4 text-left font-semibold text-gray-700 dark:text-gray-300">VEHICLE NO</th>
                  <th className="px-10 py-4 text-left font-semibold text-gray-700 dark:text-gray-300">CITY</th>

                  {hasCustomer && <th className="px-10 py-4 text-left font-semibold text-gray-700 dark:text-gray-300">CUSTOMER</th>}
                  {hasBroker   && <th className="px-10 py-4 text-left font-semibold text-gray-700 dark:text-gray-300">BROKER</th>}
                  {hasCharges  && <th className="px-14 py-4 text-left font-semibold text-gray-700 dark:text-gray-300">CHARGE TYPE</th>}

                  <th className="px-10 py-4 text-right font-semibold text-gray-700 dark:text-gray-300">DEBIT</th>
                  <th className="px-10 py-4 text-right font-semibold text-gray-700 dark:text-gray-300">CREDIT</th>
                  <th className="px-10 py-4 text-center font-semibold text-gray-700 dark:text-gray-300 w-20">ACTION</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {fields.map((field, index) => {
                  const row = OpeningBalanceEntrys[index] || {};
                  const isCustomer = row.type === 'customer';
                  const isBroker   = row.type === 'broker';
                  const isCharges  = row.type === 'charges';

                  return (
                    <tr key={field.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="px-1 py-3 ">
                        <select
                          {...register(`OpeningBalanceEntrys.${index}.type`)}
                          className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600 focus:ring-2 focus:ring-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed"
                          disabled={isViewMode}
                        >
                          <option value="customer">Customer</option>
                          <option value="broker">Broker</option>
                          <option value="charges">Charges</option>
                        </select>
                      </td>

                      <td className="px-5 py-3"><input {...register(`OpeningBalanceEntrys.${index}.biltyNo`)} className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600 disabled:opacity-60 disabled:cursor-not-allowed" placeholder="Bilty #" disabled={isViewMode} /></td>
                      <td className="px-5 py-3"><input {...register(`OpeningBalanceEntrys.${index}.biltyDate`)} type="date" className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600 disabled:opacity-60 disabled:cursor-not-allowed" disabled={isViewMode} /></td>
                      <td className="px-5 py-3"><input {...register(`OpeningBalanceEntrys.${index}.vehicleNo`)} className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600 disabled:opacity-60 disabled:cursor-not-allowed" placeholder="Vehicle #" disabled={isViewMode} /></td>
                      <td className="px-5 py-3"><input {...register(`OpeningBalanceEntrys.${index}.city`)} className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600 disabled:opacity-60 disabled:cursor-not-allowed" placeholder="City" disabled={isViewMode} /></td>

                      {hasCustomer && (
                        <td className="px-5 py-3">
                          {isCustomer ? (
                            <input {...register(`OpeningBalanceEntrys.${index}.customer`)} className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600 focus:ring-2 focus:ring-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed" placeholder="Customer name" disabled={isViewMode} />
                          ) : (
                            <div className="h-10 bg-gray-100 dark:bg-gray-700 rounded-lg" />
                          )}
                        </td>
                      )}

                      {hasBroker && (
                        <td className="px-5 py-3">
                          {isBroker ? (
                            <input {...register(`OpeningBalanceEntrys.${index}.broker`)} className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600 focus:ring-2 focus:ring-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed" placeholder="Broker name" disabled={isViewMode} />
                          ) : (
                            <div className="h-10 bg-gray-100 dark:bg-gray-700 rounded-lg" />
                          )}
                        </td>
                      )}

                      {hasCharges && (
                        <td className="px-5 py-3">
                          {isCharges ? (
                            <select
                              {...register(`OpeningBalanceEntrys.${index}.chargeType`)}
                              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600 focus:ring-2 focus:ring-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed"
                              disabled={isViewMode}
                            >
                              <option value="">Select charge type</option>
                              {chargeTypes.map(ct => (
                                <option key={ct.value} value={ct.value}>{ct.label}</option>
                              ))}
                            </select>
                          ) : (
                            <div className="h-10 bg-gray-100 dark:bg-gray-700 rounded-lg" />
                          )}
                        </td>
                      )}

                      <td className="px-5 py-3">
                        <input
                          {...register(`OpeningBalanceEntrys.${index}.debit`, { valueAsNumber: true })}
                          type="number"
                          min="0"
                          step="0.01"
                          disabled={!isCustomer || isViewMode}
                          className={`w-full px-3 py-2 text-right border rounded-lg dark:bg-gray-800 dark:border-gray-600 ${
                            isCustomer && !isViewMode ? 'focus:ring-2 focus:ring-emerald-500' : 'bg-gray-100 dark:bg-gray-700 cursor-not-allowed opacity-60'
                          }`}
                          placeholder="0.00"
                        />
                      </td>

                      <td className="px-5 py-3">
                        <input
                          {...register(`OpeningBalanceEntrys.${index}.credit`, { valueAsNumber: true })}
                          type="number"
                          min="0"
                          step="0.01"
                          disabled={(!isBroker && !isCharges) || isViewMode}
                          className={`w-full px-3 py-2 text-right border rounded-lg dark:bg-gray-800 dark:border-gray-600 ${
                            (isBroker || isCharges) && !isViewMode ? 'focus:ring-2 focus:ring-emerald-500' : 'bg-gray-100 dark:bg-gray-700 cursor-not-allowed opacity-60'
                          }`}
                          placeholder="0.00"
                        />
                      </td>

                      <td className="px-5 py-3 text-center">
                        {!isViewMode && fields.length > 1 && (
                          <Button type="button" variant="destructive" size="icon" className="h-9 w-9" onClick={() => remove(index)}>
                            <FiTrash2 size={18} />
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>

              <tfoot>
                <tr className="bg-gray-50 dark:bg-gray-800/70 font-semibold">
                  <td colSpan={
                    5 + // fixed: type + biltyNo + date + vehicle + city
                    (hasCustomer ? 1 : 0) +
                    (hasBroker ? 1 : 0) +
                    (hasCharges ? 1 : 0)
                  } className="px-5 py-4 text-right text-gray-800 dark:text-gray-200">
                    TOTAL
                  </td>
                  <td className="px-5 py-4 text-right text-emerald-700 dark:text-emerald-400">
                    {totals.debit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-5 py-4 text-right text-emerald-700 dark:text-emerald-400">
                    {totals.credit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-5 py-4">
                    {Math.abs(totals.difference) > 0.001 && (
                      <span className="text-red-600 dark:text-red-400 text-sm">
                        Diff: {Math.abs(totals.difference).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>
                    )}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-between items-center">
            {!isViewMode && (
              <Button
                type="button"
                onClick={handleAddRow}
                onAuxClick={handleAddRow}
                className="bg-gradient-to-r from-[#3a614c] to-[#6e997f] text-white px-6 py-2.5 rounded-lg flex items-center gap-2 shadow-md"
              >
                <FiPlus size={18} /> Add Row
              </Button>
            )}

            {isViewMode ? (
              <Button
                type="button"
                onClick={() => router.back()}
                className="bg-gray-500 hover:bg-gray-600 text-white px-8 py-2.5 rounded-lg ml-auto"
              >
                Close
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-gradient-to-r from-[#3a614c] to-[#6e997f] text-white px-8 py-2.5 rounded-lg flex items-center gap-2 shadow-md min-w-[220px] justify-center disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <FiSave size={18} />
                    {isEdit ? 'Update' : 'Save'} Opening Balance
                  </>
                )}
              </Button>
            )}
          </div>
        </form>
      )}

      <div className="mx-6 md:mx-8 mb-8 p-5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl text-sm text-emerald-800 dark:text-emerald-200 flex items-start gap-3">
        <MdInfo className="text-emerald-600 dark:text-emerald-400 text-xl flex-shrink-0 mt-0.5" />
        <p>
          <strong>Customer</strong> → Debit only<br />
          <strong>Broker / Charges</strong> → Credit only<br />
        </p>
      </div>
    </div>
  );
};

export default OpeningBalanceForm;  
