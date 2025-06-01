'use client';
import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'react-toastify';
import CustomInput from '@/components/ui/CustomInput';
import CustomInputDropdown from '@/components/ui/CustomeInputDropdown';
import CustomSingleDatePicker from '@/components/ui/CustomDateRangePicker';
import { MdOutlineAssignment } from 'react-icons/md';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { getAllSellers } from '@/apis/seller';
import { getAllBuyer } from '@/apis/buyer';
import { getAllInvoice } from '@/apis/invoice';
import { getAllDispatchNotes } from '@/apis/dispatchnote';
import { getAllEmployee } from '@/apis/employee';
import { createInspectionNote, updateInspectionNote } from '@/apis/inspectnote';

// Schema for form validation
const InspectionNoteSchema = z.object({
  IrnNumber: z.string().min(1, 'IRN number is required'),
  IrnDate: z.string().min(1, 'IRN date is required'),
  Seller: z.string().min(1, 'Seller is required'),
  Buyer: z.string().min(1, 'Buyer is required'),
  InvoiceNumber: z.string().min(1, 'Invoice number is required'),
  Remarks: z.string().optional(),
});

type FormData = z.infer<typeof InspectionNoteSchema>;

interface ExtendedContract {
  id: string;
  contractNumber: string;
  quantity: string;
  dispatchQty: string;
  bGrade: string;
  sl: string;
  aGrade: string;
  inspectedBy: string;
  isSelected?: boolean;
}

interface InspectionNoteData {
  id?: string;
  irnNumber?: string;
  irnDate?: string;
  seller?: string;
  buyer?: string;
  invoiceNumber?: string;
  remarks?: string;
  createdBy?: string;
  creationDate?: string;
  updatedBy?: string;
  updationDate?: string;
  relatedContracts?: {
    id?: string;
    contractNumber?: string;
    quantity?: string;
    dispatchQty?: string;
    bGrade?: string;
    sl?: string;
    aGrade?: string;
    inspectedBy?: string;
  }[];
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  status: string;
  seller: string;
  buyer: string;
  relatedContracts?: { dispatchNoteId: string }[];
}

interface InspectionNoteProps {
  isEdit?: boolean;
  initialData?: InspectionNoteData;
}

const InspectionNote = ({ isEdit = false, initialData }: InspectionNoteProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [sellers, setSellers] = useState<{ id: string; name: string }[]>([]);
  const [buyers, setBuyers] = useState<{ id: string; name: string }[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [dispatchNotes, setDispatchNotes] = useState<any[]>([]);
  const [employees, setEmployees] = useState<{ id: string; name: string }[]>([]);
  const [filteredContracts, setFilteredContracts] = useState<ExtendedContract[]>([]);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<FormData>({
    resolver: zodResolver(InspectionNoteSchema),
    defaultValues: {
      IrnNumber: isEdit && initialData?.irnNumber ? initialData.irnNumber : '',
      IrnDate: new Date().toISOString().split('T')[0],
      Seller: '',
      Buyer: '',
      InvoiceNumber: '',
      Remarks: '',
    },
  });

  const selectedInvoice = watch('InvoiceNumber');

  // Fetch Sellers
  const fetchSellers = async () => {
    try {
      const response = await getAllSellers();
      setSellers(response?.data?.map((seller: any) => ({
        id: String(seller.id),
        name: seller.sellerName,
      })) || []);
    } catch (error) {
      toast('Failed to fetch sellers', { type: 'error' });
    }
  };

  // Fetch Buyers
  const fetchBuyers = async () => {
    try {
      const response = await getAllBuyer();
      setBuyers(response?.data?.map((buyer: any) => ({
        id: String(buyer.id),
        name: buyer.buyerName,
      })) || []);
    } catch (error) {
      toast('Failed to fetch buyers', { type: 'error' });
    }
  };

  // Fetch Approved Invoices
  const fetchInvoices = async () => {
    try {
      const response = await getAllInvoice(1, 100);
      const approvedInvoices = response?.data?.filter((invoice: Invoice) => invoice.status === 'Approved') || [];
      setInvoices(approvedInvoices);
    } catch (error) {
      toast('Failed to fetch invoices', { type: 'error' });
    }
  };

  // Fetch Dispatch Notes
  const fetchDispatchNotes = async () => {
    try {
      const response = await getAllDispatchNotes(1, 100);
      setDispatchNotes(response?.data || []);
    } catch (error) {
      toast('Failed to fetch dispatch notes', { type: 'error' });
    }
  };

  // Fetch Employees
  const fetchEmployees = async () => {
    try {
      const response = await getAllEmployee();
      setEmployees(response?.data?.map((emp: any) => ({
        id: String(emp.id),
        name: emp.name,
      })) || []);
    } catch (error) {
      toast('Failed to fetch employees', { type: 'error' });
    }
  };

  // Fetch data on mount
  useEffect(() => {
    fetchSellers();
    fetchBuyers();
    fetchInvoices();
    fetchDispatchNotes();
    fetchEmployees();
  }, []);

  // Handle query parameter for pre-populating invoice
  useEffect(() => {
    const invoiceNumber = searchParams.get('invoiceNumber');
    if (invoiceNumber && invoices.length > 0 && !isEdit) {
      const selectedInvoice = invoices.find((inv) => inv.invoiceNumber === invoiceNumber);
      if (selectedInvoice) {
        setValue('InvoiceNumber', selectedInvoice.id, { shouldValidate: true });
        setValue('Seller', sellers.find((s) => s.name === selectedInvoice.seller)?.id || '', { shouldValidate: true });
        setValue('Buyer', buyers.find((b) => b.name === selectedInvoice.buyer)?.id || '', { shouldValidate: true });
      }
    }
  }, [searchParams, invoices, sellers, buyers, setValue, isEdit]);

  // Initialize form with initialData when editing
  useEffect(() => {
    if (isEdit && initialData) {
      setValue('IrnNumber', initialData.irnNumber || '');
      setValue('IrnDate', initialData.irnDate?.split('T')[0] || '');
      setValue('Seller', sellers.find((s) => s.name === initialData.seller)?.id || '');
      setValue('Buyer', buyers.find((b) => b.name === initialData.buyer)?.id || '');
      setValue('InvoiceNumber', initialData.invoiceNumber || '');
      setValue('Remarks', initialData.remarks || '');

      const initialContracts = initialData.relatedContracts?.map((rc) => ({
        id: rc.id || `new-${Date.now()}-${Math.random()}`,
        contractNumber: rc.contractNumber || '',
        quantity: rc.quantity || '',
        dispatchQty: rc.dispatchQty || '',
        bGrade: rc.bGrade || '',
        sl: rc.sl || '',
        aGrade: rc.aGrade || '',
        inspectedBy: rc.inspectedBy || '',
        isSelected: true,
      })) || [];
      setFilteredContracts(initialContracts);
    }
  }, [isEdit, initialData, sellers, buyers, setValue]);

  useEffect(() => {
    if (!selectedInvoice) {
      setFilteredContracts([]);
      return;
    }

    const selectedInvoiceData = invoices.find((inv) => inv.id === selectedInvoice || inv.invoiceNumber === selectedInvoice);
    if (!selectedInvoiceData) return;

    const relatedDispatchNotes = dispatchNotes.filter((dn) =>
      selectedInvoiceData.relatedContracts?.some((rc) => rc.dispatchNoteId === dn.id)
    );

    const dispatchNoteContracts = relatedDispatchNotes.flatMap((dn) =>
      dn.relatedContracts?.map((rc: { id: any; contractNumber: string | undefined; quantity: any; dispatchQty: any; }) => ({
        id: rc.id || `new-${Date.now()}-${Math.random()}`,
        contractNumber: rc.contractNumber || '',
        quantity: rc.quantity || '',
        dispatchQty: rc.dispatchQty || '',
        bGrade: '',
        sl: '',
        aGrade: '',
        inspectedBy: '',
        isSelected: isEdit ? initialData?.relatedContracts?.some((irc) => irc.contractNumber === rc.contractNumber) : false,
      })) || []
    );

    setFilteredContracts(dispatchNoteContracts);
  }, [selectedInvoice, invoices, dispatchNotes, isEdit, initialData]);

  // Handle contract row selection
  const handleContractSelect = (contractId: string, checked: boolean) => {
    setFilteredContracts((prev) =>
      prev.map((contract) =>
        contract.id === contractId ? { ...contract, isSelected: checked } : contract
      )
    );
  };

  // Handle input changes for table fields
  const handleContractInputChange = (
    contractId: string,
    field: 'bGrade' | 'sl' | 'inspectedBy',
    value: string
  ) => {
    setFilteredContracts((prev) =>
      prev.map((contract) => {
        if (contract.id === contractId) {
          const updatedContract = { ...contract, [field]: value };
          const dispatchQty = parseFloat(updatedContract.dispatchQty || '0');
          const bGrade = parseFloat(updatedContract.bGrade || '0');
          const sl = parseFloat(updatedContract.sl || '0');
          updatedContract.aGrade = (dispatchQty - bGrade - sl).toFixed(2);
          return updatedContract;
        }
        return contract;
      })
    );
  };

  const onSubmit = async (data: FormData) => {
    try {
      const selectedContracts = filteredContracts.filter((contract) => contract.isSelected);
      if (selectedContracts.length === 0) {
        toast('Please select at least one contract.', { type: 'error' });
        return;
      }

      const payload = {
        ...(isEdit && initialData?.id ? { id: initialData.id } : {}),
        irnNumber: data.IrnNumber,
        irnDate: data.IrnDate,
        seller: sellers.find((s) => s.id === data.Seller)?.name || data.Seller,
        buyer: buyers.find((b) => b.id === data.Buyer)?.name || data.Buyer,
        invoiceNumber: invoices.find((inv) => inv.id === data.InvoiceNumber)?.invoiceNumber || data.InvoiceNumber,
        remarks: data.Remarks,
        creationDate: isEdit ? initialData?.creationDate || new Date().toISOString() : new Date().toISOString(),
        updationDate: new Date().toISOString(),
        relatedContracts: selectedContracts.map((contract) => ({
          ...(isEdit && !contract.id.startsWith('new-') ? { id: contract.id } : {}),
          contractNumber: contract.contractNumber,
          quantity: contract.quantity,
          dispatchQty: contract.dispatchQty,
          bGrade: contract.bGrade,
          sl: contract.sl,
          aGrade: contract.aGrade,
          inspectedBy: contract.inspectedBy,
        })),
      };

      if (isEdit) {
        await updateInspectionNote(payload);
        toast('Inspection Note Updated Successfully', { type: 'success' });
      } else {
        await createInspectionNote(payload);
        toast('Inspection Note Created Successfully', { type: 'success' });
      }

      reset();
      router.push('/inspectionnote');
    } catch (error) {
      toast(`Error ${isEdit ? 'updating' : 'creating'} inspection note`, { type: 'error' });
    }
  };

  return (
    <div className="container mx-auto bg-white shadow-lg rounded dark:bg-[#030630] p-4 md:p-6">
      <div className="w-full bg-[#06b6d4] h-16 md:h-[7vh] rounded dark:bg-[#387fbf] flex items-center">
        <h1 className="text-lg md:text-[23px] font-mono ml-4 md:ml-10 text-white flex items-center gap-2">
          <MdOutlineAssignment />
          {isEdit ? 'UPDATE INSPECTION NOTE' : 'ADD INSPECTION NOTE'}
        </h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="p-2 md:p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <CustomInput
              type="text"
              variant="floating"
              borderThickness="2"
              label="IRN #"
              id="IrnNumber"
              {...register('IrnNumber')}
              error={errors.IrnNumber?.message}
              className="w-full"
            />
            <CustomSingleDatePicker
              label="IRN Date"
              selectedDate={watch('IrnDate') || ''}
              onChange={(date: string) => setValue('IrnDate', date, { shouldValidate: true })}
              error={errors.IrnDate?.message}
              register={register}
              name="IrnDate"
              variant="floating"
              borderThickness="2"
            />
            <CustomInputDropdown
              label="Invoice Number"
              options={invoices.map((inv) => ({ id: inv.id, name: inv.invoiceNumber }))}
              selectedOption={watch('InvoiceNumber') || ''}
              onChange={(value) => {
                setValue('InvoiceNumber', value, { shouldValidate: true });
                const selectedInv = invoices.find((inv) => inv.id === value);
                if (selectedInv) {
                  setValue('Seller', sellers.find((s) => s.name === selectedInv.seller)?.id || '', { shouldValidate: true });
                  setValue('Buyer', buyers.find((b) => b.name === selectedInv.buyer)?.id || '', { shouldValidate: true });
                }
              }}
              error={errors.InvoiceNumber?.message}
              register={register}
            />
            <CustomInputDropdown
              label="Seller"
              options={sellers}
              selectedOption={watch('Seller') || ''}
              onChange={(value) => setValue('Seller', value, { shouldValidate: true })}
              error={errors.Seller?.message}
              register={register}
            />
            <CustomInputDropdown
              label="Buyer"
              options={buyers}
              selectedOption={watch('Buyer') || ''}
              onChange={(value) => setValue('Buyer', value, { shouldValidate: true })}
              error={errors.Buyer?.message}
              register={register}
            />
            <div className="mt-4 col-span-1 md:col-span-3">
              <h2 className="text-lg md:text-xl text-[#06b6d4] font-bold dark:text-white">Remarks</h2>
              <textarea
                className="w-full p-2 border-[#06b6d4] border rounded text-sm md:text-base"
                rows={4}
                {...register('Remarks')}
                placeholder="Enter any remarks"
              />
              {errors.Remarks && <p className="text-red-500 text-sm">{errors.Remarks.message}</p>}
            </div>
          </div>
        </div>

        <div className="p-2 md:p-4">
          <h2 className="text-lg md:text-xl text-[#06b6d4] font-bold dark:text-white">Related Contracts</h2>
          <div className="mt-2 overflow-x-auto">
            {loading ? (
              <p className="text-gray-500 text-sm md:text-base">Loading...</p>
            ) : selectedInvoice ? (
              filteredContracts.length > 0 ? (
                <table className="w-full text-left border-collapse text-sm md:text-base">
                  <thead>
                    <tr className="bg-[#06b6d4] text-white">
                      <th className="p-2 md:p-3 font-medium">Select</th>
                      <th className="p-2 md:p-3 font-medium">Contract #</th>
                      <th className="p-2 md:p-3 font-medium">Contract Quantity</th>
                      <th className="p-2 md:p-3 font-medium">Dispatch Qty</th>
                      <th className="p-2 md:p-3 font-medium">B Grade</th>
                      <th className="p-2 md:p-3 font-medium">S.L</th>
                      <th className="p-2 md:p-3 font-medium">A Grade</th>
                      <th className="p-2 md:p-3 font-medium">Inspected By</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredContracts.map((contract) => (
                      <tr
                        key={contract.id}
                        className={`border-b hover:bg-gray-100 cursor-pointer ${contract.isSelected ? 'bg-blue-100' : ''}`}
                        onClick={() => handleContractSelect(contract.id, !contract.isSelected)}
                      >
                        <td className="p-2 md:p-3">
                          <input
                            type="checkbox"
                            checked={contract.isSelected || false}
                            onChange={(e) => handleContractSelect(contract.id, e.target.checked)}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </td>
                        <td className="p-2 md:p-3">{contract.contractNumber || '-'}</td>
                        <td className="p-2 md:p-3">{contract.quantity || '-'}</td>
                        <td className="p-2 md:p-3">{contract.dispatchQty || '-'}</td>
                        <td className="p-2 md:p-3">
                          <input
                            type="number"
                            value={contract.bGrade || ''}
                            onChange={(e) => handleContractInputChange(contract.id, 'bGrade', e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </td>
                        <td className="p-2 md:p-3">
                          <input
                            type="number"
                            value={contract.sl || ''}
                            onChange={(e) => handleContractInputChange(contract.id, 'sl', e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </td>
                        <td className="p-2 md:p-3">{contract.aGrade || '-'}</td>
                        <td className="p-2 md:p-3">
                          <CustomInputDropdown
                            label=""
                            options={employees}
                            selectedOption={contract.inspectedBy || ''}
                            onChange={(value) => handleContractInputChange(contract.id, 'inspectedBy', value)}
                            register={register}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-gray-500 text-sm md:text-base">No contracts found for the selected invoice.</p>
              )
            ) : (
              <p className="text-gray-500 text-sm md:text-base">Please select an invoice to view contracts.</p>
            )}
          </div>
        </div>

        <div className="w-full h-16 md:h-[8vh] flex flex-col md:flex-row justify-end gap-2 mt-3 bg-transparent border-t-2 border-[#e7e7e7] p-2 md:p-4">
          <Button
            type="submit"
            className="w-full md:w-[160px] bg-[#0e7d90] hover:bg-[#0891b2] text-white"
          >
            Save
          </Button>
          <Link href="/inspectionnote">
            <Button
              type="button"
              className="w-full md:w-[160px] bg-black hover:bg-[#b0b0b0] text-white"
            >
              Cancel
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
};

export default InspectionNote;