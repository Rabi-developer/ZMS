'use client';
import React, { useState, useEffect } from 'react';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import ABLCustomInput from '@/components/ui/ABLCustomInput';
import AblCustomDropdown from '@/components/ui/AblCustomDropdown';
import { createCharges, updateCharges , getAllCharges } from '@/apis/charges'; // Assume
import { getAllMunshyana } from '@/apis/munshyana';
import { getAllConsignment } from '@/apis/consignment';
import { getAllBusinessAssociate } from '@/apis/businessassociate';
import { toast } from 'react-toastify';
import { useRouter, useSearchParams } from 'next/navigation';
import { MdLocalShipping, MdInfo, MdPayment, MdAccountBalance } from 'react-icons/md';
import { FaMoneyBillWave, FaCreditCard, FaReceipt } from 'react-icons/fa';
import Link from 'next/link';
import { FiSave, FiX, FiPlus, FiTrash2 } from 'react-icons/fi';

// Interfaces
interface DropdownOption {
  id: string;
  name: string;
  contact?: string; // For business associates
}

interface Consignment {
  id: string;
  biltyNo: string;
  // Other fields if needed
}

interface ChargeLine {
  charge: string;
  biltyNo: string;
  date: string;
  vehicle: string;
  paidTo: string;
  contact: string;
  remarks: string;
  amount: number;
}

interface Payment {
  paidAmount: number;
  bankCash: string;
  chqNo: string;
  chqDate: string;
  payNo: string;
}

// Schema for charges
const chargesSchema = z.object({
  ChargeNo: z.string().optional(),
  chargeDate: z.string().min(1, 'Charge Date is required'),
  orderNo: z.string().min(1, 'Order No is required'),
  lines: z.array(z.object({
    charge: z.string().optional(),
    biltyNo: z.string().optional(),
    date: z.string().optional(),
    vehicle: z.string().optional(),
    paidTo: z.string().optional(),
    contact: z.string().optional(),
    remarks: z.string().optional(),
    amount: z.number().optional(),
  })),
  payments: z.array(z.object({
    paidAmount: z.number().optional(),
    bankCash: z.string().optional(),
    chqNo: z.string().optional(),
    chqDate: z.string().optional(),
    payNo: z.string().optional(),
  })),
});

type ChargesFormData = z.infer<typeof chargesSchema>;

const ChargesForm = ({ isEdit = false }: { isEdit?: boolean }) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromBooking = searchParams.get('fromBooking') === 'true';
  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<ChargesFormData>({
    resolver: zodResolver(chargesSchema),
    defaultValues: {
      ChargeNo: '',
      chargeDate: '',
      orderNo: '',
      lines: [{ charge: '', biltyNo: '', date: '', vehicle: '', paidTo: '', contact: '', remarks: '', amount: 0 }],
      payments: [{ paidAmount: 0, bankCash: '', chqNo: '', chqDate: '', payNo: '' }], // Initialize with one payment row
    },
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [munshyanas, setMunshyanas] = useState<DropdownOption[]>([]);
  const [consignments, setConsignments] = useState<Consignment[]>([]);
  const [businessAssociates, setBusinessAssociates] = useState<DropdownOption[]>([]);
  const [showBiltyPopup, setShowBiltyPopup] = useState(false);
  const [selectedLineIndex, setSelectedLineIndex] = useState(0);
  const lines = watch('lines');
  const payments = watch('payments');

  const bankCashOptions: DropdownOption[] = [
    { id: 'Bank', name: 'Bank' },
    { id: 'Cash', name: 'Cash' },
    { id: 'Cheque', name: 'Cheque' }
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [munRes, consRes, baRes] = await Promise.all([
          getAllMunshyana(),
          getAllConsignment(1, 100), // Get first 100 consignments
          getAllBusinessAssociate(),
        ]);
        setMunshyanas(munRes.data.map((m: any) => ({ id: m.id, name: m.name })));
        setConsignments(consRes.data);
        setBusinessAssociates(baRes.data.map((ba: any) => ({ id: ba.id, name: ba.name, contact: ba.contact })));
      } catch (error) {
        toast.error('Failed to load data');
      }
    };
    fetchData();

    if (isEdit) {
      // Fetch charges data
      const fetchCharges = async () => {
        const id = window.location.pathname.split('/').pop();
        if (id) {
          try {
            // Assume getChargesById exists
            const response = await getAllCharges(id);
            const charges = response.data;
            Object.keys(charges).forEach(key => setValue(key as keyof ChargesFormData, charges[key]));
          } catch (error) {
            toast.error('Failed to load charges data');
          }
        }
      };
      fetchCharges();
    }
  }, [isEdit, setValue]);

  const selectBilty = (cons: Consignment, index: number) => {
    setValue(`lines.${index}.biltyNo`, cons.biltyNo);
    setShowBiltyPopup(false);
  };

  const handlePaidToChange = (value: string, index: number) => {
    setValue(`lines.${index}.paidTo`, value);
    const associate = businessAssociates.find(ba => ba.id === value);
    if (associate) {
      setValue(`lines.${index}.contact`, associate.contact || '');
    }
  };

  const addLine = () => {
    setValue('lines', [...lines, { charge: '', biltyNo: '', date: '', vehicle: '', paidTo: '', contact: '', remarks: '', amount: 0 }]);
  };

  const removeLine = (index: number) => {
    if (lines.length > 1) {
      const newLines = lines.filter((_, i) => i !== index);
      setValue('lines', newLines);
    }
  };

  const addPayment = () => {
    setValue('payments', [...payments, { paidAmount: 0, bankCash: '', chqNo: '', chqDate: '', payNo: '' }]);
  };

  const removePayment = (index: number) => {
    if (payments.length > 1) {
      const newPayments = payments.filter((_, i) => i !== index);
      setValue('payments', newPayments);
    }
  };

  const onSubmit = async (data: ChargesFormData) => {
    setIsSubmitting(true);
    try {
      if (isEdit) {
        await updateCharges(data.ChargeNo || '', data);
        toast.success('Charges updated successfully!');
      } else {
        await createCharges(data);
        toast.success('Charges created successfully!');
      }
      router.push('/charges');
    } catch (error) {
      toast.error('An error occurred while saving the charges');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFieldDisabled = (field: string) => {
    if (!fromBooking) return false;
    // When coming from booking, only allow charges and amount fields in the table to be edited
    return !['charge', 'amount'].includes(field);
  };

  const totalCharges = lines.reduce((sum, line) => sum + (line.amount || 0), 0);
  const totalPayments = payments.reduce((sum, payment) => sum + (payment.paidAmount || 0), 0);
  const balance = totalCharges - totalPayments;

  return (
    <div className="h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-800 p-3 overflow-hidden">
      <div className="h-full w-full flex flex-col">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 h-full flex flex-col">
          {/* Compact Header */}
          <div className="bg-gradient-to-r from-[#3a614c] to-[#6e997f] text-white px-4 py-3 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-1.5 rounded-lg">
                  <FaMoneyBillWave className="text-xl" />
                </div>
                <div>
                  <h1 className="text-xl font-bold">
                    {isEdit ? 'Edit Charges' : 'Add New Charges'}
                  </h1>
                  <p className="text-white/90 text-xs">
                    {isEdit ? 'Update charges information' : 'Create a new charges record'}
                  </p>
                </div>
              </div>
              <Link href="/charges">
                <Button
                  type="button"
                  className="bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all duration-200 border border-white/20 backdrop-blur-sm px-3 py-1.5 shadow-lg hover:shadow-xl text-sm"
                >
                  <FiX className="mr-1" /> Cancel
                </Button>
              </Link>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="flex-1 p-4 overflow-hidden flex flex-col">
            {fromBooking && (
              <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
                  <MdInfo className="text-lg" />
                  <span className="font-medium text-sm">Restricted Mode</span>
                </div>
                <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
                  You can only edit Charges and Amount fields when creating from booking order.
                </p>
              </div>
            )}

            {/* Basic Information - Compact Row */}
            <div className="mb-4 bg-gray-50 dark:bg-gray-800 p-3 rounded-xl border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2 mb-3">
                <FaReceipt className="text-gray-600 text-lg" />
                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Basic Information</h3>
                {fromBooking && <span className="ml-auto px-2 py-0.5 bg-red-100 text-red-800 text-xs rounded-full">Restricted</span>}
              </div>
              <div className="grid grid-cols-3 gap-4">
                <ABLCustomInput
                  label="Charge No"
                  type="text"
                  placeholder="Auto"
                  register={register}
                  error={errors.ChargeNo?.message}
                  id="chargeNo"
                  disabled
                />
                <ABLCustomInput
                  label="Charge Date"
                  type="date"
                  register={register}
                  error={errors.chargeDate?.message}
                  id="chargeDate"
                  disabled={isFieldDisabled('chargeDate')}
                />
                <ABLCustomInput
                  label="Order No"
                  type="text"
                  register={register}
                  error={errors.orderNo?.message}
                  id="orderNo"
                  disabled={isFieldDisabled('orderNo')}
                />
              </div>
            </div>

            {/* Two Tables Side by Side */}
            <div className="flex-1 grid grid-cols-2 gap-4 overflow-hidden">
              {/* Charges Table */}
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 p-3 rounded-xl border border-orange-200 dark:border-orange-700 flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <MdLocalShipping className="text-orange-600 text-lg" />
                    <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Charges Details</h3>
                    {fromBooking && <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full">Charges & Amount Editable</span>}
                  </div>
                  <Button 
                    type="button" 
                    onClick={addLine}
                    className="bg-orange-600 hover:bg-orange-700 text-white text-xs px-2 py-1"
                  >
                    <FiPlus className="mr-1" /> Add Line
                  </Button>
                </div>
                
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-orange-200 dark:border-orange-700 flex-1 flex flex-col overflow-hidden">
                  <div className="flex-1 overflow-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-orange-600 text-white sticky top-0">
                        <tr>
                          <th className="px-2 py-2 text-left font-medium">Charges</th>
                          <th className="px-2 py-2 text-left font-medium">Bilty No</th>
                          <th className="px-2 py-2 text-left font-medium">Date</th>
                          <th className="px-2 py-2 text-left font-medium">Vehicle#</th>
                          <th className="px-2 py-2 text-left font-medium">Paid to</th>
                          <th className="px-2 py-2 text-left font-medium">Contact#</th>
                          <th className="px-2 py-2 text-left font-medium">Remarks</th>
                          <th className="px-2 py-2 text-left font-medium">Amount</th>
                          <th className="px-2 py-2 text-left font-medium">Action</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800">
                        {lines.map((line, index) => (
                          <tr key={index} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750">
                            <td className="px-2 py-2">
                              <Controller
                                name={`lines.${index}.charge`}
                                control={control}
                                render={({ field }) => (
                                  <select
                                    {...field}
                                    disabled={isFieldDisabled('charge')}
                                    className="w-full px-1 py-1 border border-gray-300 rounded text-xs"
                                  >
                                    <option value="">Select</option>
                                    {munshyanas.map(mun => (
                                      <option key={mun.id} value={mun.id}>{mun.name}</option>
                                    ))}
                                  </select>
                                )}
                              />
                            </td>
                            <td className="px-2 py-2">
                              <div className="space-y-1">
                                <Button 
                                  type="button" 
                                  onClick={() => { setShowBiltyPopup(true); setSelectedLineIndex(index); }}
                                  className="bg-orange-600 hover:bg-orange-700 text-white text-xs px-2 py-0.5 w-full"
                                  disabled={isFieldDisabled('biltyNo')}
                                >
                                  Select
                                </Button>
                                <input 
                                  {...register(`lines.${index}.biltyNo`)} 
                                  disabled 
                                  className="w-full px-1 py-1 border border-gray-300 rounded text-xs bg-gray-50"
                                />
                              </div>
                            </td>
                            <td className="px-2 py-2">
                              <input 
                                type="date" 
                                {...register(`lines.${index}.date`)} 
                                disabled={isFieldDisabled('date')}
                                className="w-full px-1 py-1 border border-gray-300 rounded text-xs"
                              />
                            </td>
                            <td className="px-2 py-2">
                              <input 
                                {...register(`lines.${index}.vehicle`)} 
                                disabled={isFieldDisabled('vehicle')}
                                className="w-full px-1 py-1 border border-gray-300 rounded text-xs"
                              />
                            </td>
                            <td className="px-2 py-2">
                              <Controller
                                name={`lines.${index}.paidTo`}
                                control={control}
                                render={({ field }) => (
                                  <select
                                    {...field}
                                    onChange={(e) => handlePaidToChange(e.target.value, index)}
                                    disabled={isFieldDisabled('paidTo')}
                                    className="w-full px-1 py-1 border border-gray-300 rounded text-xs"
                                  >
                                    <option value="">Select</option>
                                    {businessAssociates.map(ba => (
                                      <option key={ba.id} value={ba.id}>{ba.name}</option>
                                    ))}
                                  </select>
                                )}
                              />
                            </td>
                            <td className="px-2 py-2">
                              <input 
                                {...register(`lines.${index}.contact`)} 
                                disabled 
                                className="w-full px-1 py-1 border border-gray-300 rounded text-xs bg-gray-50"
                              />
                            </td>
                            <td className="px-2 py-2">
                              <input 
                                {...register(`lines.${index}.remarks`)} 
                                disabled={isFieldDisabled('remarks')}
                                className="w-full px-1 py-1 border border-gray-300 rounded text-xs"
                              />
                            </td>
                            <td className="px-2 py-2">
                              <input 
                                type="number" 
                                {...register(`lines.${index}.amount`, { valueAsNumber: true })} 
                                disabled={isFieldDisabled('amount')}
                                className="w-full px-1 py-1 border border-gray-300 rounded text-xs"
                              />
                            </td>
                            <td className="px-2 py-2">
                              <Button 
                                type="button" 
                                onClick={() => removeLine(index)}
                                className="bg-red-500 hover:bg-red-600 text-white text-xs px-1 py-1"
                                disabled={lines.length <= 1}
                              >
                                <FiTrash2 />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="bg-orange-100 dark:bg-orange-900/30 p-2 border-t border-orange-200 dark:border-orange-700">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">Total Charges:</span>
                      <span className="text-lg font-bold text-orange-600">${totalCharges.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Table */}
              <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 p-3 rounded-xl border border-emerald-200 dark:border-emerald-700 flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <MdPayment className="text-emerald-600 text-lg" />
                    <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Payment Information</h3>
                  </div>
                  <Button 
                    type="button" 
                    onClick={addPayment}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-2 py-1"
                  >
                    <FiPlus className="mr-1" /> Add Payment
                  </Button>
                </div>
                
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-emerald-200 dark:border-emerald-700 flex-1 flex flex-col overflow-hidden">
                  <div className="flex-1 overflow-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-emerald-600 text-white sticky top-0">
                        <tr>
                          <th className="px-2 py-2 text-left font-medium">Paid Amount</th>
                          <th className="px-2 py-2 text-left font-medium">Bank/Cash</th>
                          <th className="px-2 py-2 text-left font-medium">Chq No</th>
                          <th className="px-2 py-2 text-left font-medium">Chq Date</th>
                          <th className="px-2 py-2 text-left font-medium">Pay. No</th>
                          <th className="px-2 py-2 text-left font-medium">Action</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800">
                        {payments.map((payment, index) => (
                          <tr key={index} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750">
                            <td className="px-2 py-2">
                              <input 
                                type="number" 
                                {...register(`payments.${index}.paidAmount`, { valueAsNumber: true })} 
                                className="w-full px-1 py-1 border border-gray-300 rounded text-xs"
                              />
                            </td>
                            <td className="px-2 py-2">
                              <Controller
                                name={`payments.${index}.bankCash`}
                                control={control}
                                render={({ field }) => (
                                  <select
                                    {...field}
                                    className="w-full px-1 py-1 border border-gray-300 rounded text-xs"
                                  >
                                    <option value="">Select</option>
                                    {bankCashOptions.map(option => (
                                      <option key={option.id} value={option.id}>{option.name}</option>
                                    ))}
                                  </select>
                                )}
                              />
                            </td>
                            <td className="px-2 py-2">
                              <input 
                                {...register(`payments.${index}.chqNo`)} 
                                className="w-full px-1 py-1 border border-gray-300 rounded text-xs"
                              />
                            </td>
                            <td className="px-2 py-2">
                              <input 
                                type="date" 
                                {...register(`payments.${index}.chqDate`)} 
                                className="w-full px-1 py-1 border border-gray-300 rounded text-xs"
                              />
                            </td>
                            <td className="px-2 py-2">
                              <input 
                                {...register(`payments.${index}.payNo`)} 
                                className="w-full px-1 py-1 border border-gray-300 rounded text-xs"
                              />
                            </td>
                            <td className="px-2 py-2">
                              <Button 
                                type="button" 
                                onClick={() => removePayment(index)}
                                className="bg-red-500 hover:bg-red-600 text-white text-xs px-1 py-1"
                                disabled={payments.length <= 1}
                              >
                                <FiTrash2 />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="bg-emerald-100 dark:bg-emerald-900/30 p-2 border-t border-emerald-200 dark:border-emerald-700">
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">Total Payments:</span>
                        <span className="text-lg font-bold text-emerald-600">${totalPayments.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">Balance:</span>
                        <span className={`text-lg font-bold ${balance >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                          ${Math.abs(balance).toFixed(2)} {balance >= 0 ? '(Due)' : '(Excess)'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bilty Selection Popup */}
            {showBiltyPopup && (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-2xl max-w-md w-full mx-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Select Bilty</h3>
                    <Button 
                      onClick={() => setShowBiltyPopup(false)}
                      className="text-gray-400 hover:text-gray-600 p-1"
                      variant="ghost"
                    >
                      <FiX className="text-xl" />
                    </Button>
                  </div>
                  <div className="max-h-60 overflow-y-auto space-y-2">
                    {consignments.map((cons) => (
                      <div 
                        key={cons.id} 
                        onClick={() => selectBilty(cons, selectedLineIndex)} 
                        className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 p-3 rounded-lg border border-gray-200 dark:border-gray-600 transition-colors"
                      >
                        <span className="font-medium text-gray-800 dark:text-gray-200">{cons.biltyNo}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-end mt-4">
                    <Button 
                      onClick={() => setShowBiltyPopup(false)}
                      className="bg-gray-500 hover:bg-gray-600 text-white"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700 mt-4">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 bg-gradient-to-r from-[#3a614c] to-[#6e997f] hover:from-[#3a614c]/90 hover:to-[#6e997f]/90 text-white rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-[#3a614c]/30 font-medium text-sm"
              >
                <div className="flex items-center gap-2">
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <FiSave className="text-lg" />
                      <span>{isEdit ? 'Update Charges' : 'Create Charges'}</span>
                    </>
                  )}
                </div>
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChargesForm;