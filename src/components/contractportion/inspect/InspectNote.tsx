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
import { BiSolidErrorAlt } from 'react-icons/bi';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { getAllSellers } from '@/apis/seller';
import { getAllBuyer } from '@/apis/buyer';
import { getAllDispatchNotes } from '@/apis/dispatchnote';
import { getAllEmployee } from '@/apis/employee';
import { createInspectionNote, updateInspectionNote } from '@/apis/inspectnote';

// Schema for form validation
const InspectionNoteSchema = z.object({
  IrnNumber: z.string().optional(),
  IrnDate: z.string().min(1, 'IRN date is required'),
  Seller: z.string().min(1, 'Seller is required'),
  Buyer: z.string().min(1, 'Buyer is required'),
  DispatchNoteId: z.string().min(1, 'Dispatch note is required'),
  Remarks: z.string().optional(),
});

type FormData = z.infer<typeof InspectionNoteSchema>;

interface ExtendedContract {
  id: string;
  contractNumber: string;
  quantity: string;
  totalDispatchQuantity: string;
  bGrade: string;
  sl: string;
  shrinkage: string;
  returnFabric: string;
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
  dispatchNoteId?: string;
  remarks?: string;
  createdBy?: string;
  creationDate?: string;
  updatedBy?: string;
  updationDate?: string;
  relatedContracts?: {
    id?: string;
    contractNumber?: string;
    quantity?: string;
    totalDispatchQuantity?: string;
    bGrade?: string;
    sl?: string;
    shrinkage?: string;
    returnFabric?: string;
    aGrade?: string;
    inspectedBy?: string;
  }[];
}

interface DispatchNote {
  id: string;
  listid: string;
  status: string;
  seller: string;
  buyer: string;
  relatedContracts?: {
    id: string;
    contractNumber: string;
    quantity: string;
    totalDispatchQuantity: string;
  }[];
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
  const [dispatchNotes, setDispatchNotes] = useState<DispatchNote[]>([]);
  const [employees, setEmployees] = useState<{ id: string; name: string }[]>([]);
  const [filteredContracts, setFilteredContracts] = useState<ExtendedContract[]>([]);
  const [loading, setLoading] = useState(false);
  const [irnFocused, setIrnFocused] = useState(false);

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
      DispatchNoteId: '',
      Remarks: '',
    },
  });

  const selectedDispatchNoteId = watch('DispatchNoteId');

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

  // Fetch Approved Dispatch Notes
  const fetchDispatchNotes = async () => {
    try {
      const response = await getAllDispatchNotes(1, 100);
      const approvedDispatchNotes = response?.data?.filter((dn: DispatchNote) => dn.status === 'Approved') || [];
      setDispatchNotes(approvedDispatchNotes);
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
    setLoading(true);
    Promise.all([fetchSellers(), fetchBuyers(), fetchDispatchNotes(), fetchEmployees()])
      .finally(() => setLoading(false));
  }, []);

  // Handle query parameter for pre-populating dispatch note
  useEffect(() => {
    const dispatchNoteId = searchParams.get('dispatchNoteId');
    if (dispatchNoteId && dispatchNotes.length > 0 && !isEdit) {
      const selectedDispatchNote = dispatchNotes.find((dn) => dn.id === dispatchNoteId);
      if (selectedDispatchNote) {
        setValue('DispatchNoteId', selectedDispatchNote.id, { shouldValidate: true });
        setValue('Seller', sellers.find((s) => s.name === selectedDispatchNote.seller)?.id || '', { shouldValidate: true });
        setValue('Buyer', buyers.find((b) => b.name === selectedDispatchNote.buyer)?.id || '', { shouldValidate: true });
      }
    }
  }, [searchParams, dispatchNotes, sellers, buyers, setValue, isEdit]);

  // Initialize form with initialData when editing
  useEffect(() => {
    if (isEdit && initialData) {
      setValue('IrnNumber', initialData.irnNumber || '', { shouldValidate: true });
      setValue('IrnDate', initialData.irnDate?.split('T')[0] || new Date().toISOString().split('T')[0], { shouldValidate: true });
      setValue('Seller', sellers.find((s) => s.name === initialData.seller)?.id || '', { shouldValidate: true });
      setValue('Buyer', buyers.find((b) => b.name === initialData.buyer)?.id || '', { shouldValidate: true });
      setValue('DispatchNoteId', initialData.dispatchNoteId || '', { shouldValidate: true });
      setValue('Remarks', initialData.remarks || '');

      const initialContracts = initialData.relatedContracts?.map((rc) => ({
        id: rc.id || `new-${Date.now()}-${Math.random()}`,
        contractNumber: rc.contractNumber || '',
        quantity: rc.quantity || '0',
        totalDispatchQuantity: rc.totalDispatchQuantity || '0',
        bGrade: rc.bGrade || '0',
        sl: rc.sl || '0',
        shrinkage: rc.shrinkage || '0',
        returnFabric: rc.returnFabric || '0',
        aGrade: rc.aGrade || '0',
        inspectedBy: rc.inspectedBy || '',
        isSelected: true,
      })) || [];
      setFilteredContracts(initialContracts);
    }
  }, [isEdit, initialData, sellers, buyers, setValue]);

  // Update contracts when dispatch note is selected
  useEffect(() => {
    if (!selectedDispatchNoteId) {
      setFilteredContracts([]);
      return;
    }

    const selectedDispatchNote = dispatchNotes.find(
      (dn) => dn.id === selectedDispatchNoteId || dn.listid === selectedDispatchNoteId
    );
    if (!selectedDispatchNote) {
      setFilteredContracts([]);
      return;
    }

    const dispatchNoteContracts = (selectedDispatchNote.relatedContracts || []).map((rc) => ({
      id: rc.id || `new-${Date.now()}-${Math.random()}`,
      contractNumber: rc.contractNumber || '',
      quantity: rc.quantity || '0',
      totalDispatchQuantity: rc.totalDispatchQuantity || '0',
      bGrade: '',
      sl: '',
      shrinkage: '',
      returnFabric: '',
      aGrade: '',
      inspectedBy: '',
      isSelected: isEdit
        ? initialData?.relatedContracts?.some(
            (irc) => irc.contractNumber === rc.contractNumber
          ) || false
        : true,
    }));

    setFilteredContracts(dispatchNoteContracts);
  }, [selectedDispatchNoteId, dispatchNotes, isEdit, initialData]);

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
    field: 'bGrade' | 'sl' | 'shrinkage' | 'returnFabric' | 'inspectedBy',
    value: string
  ) => {
    setFilteredContracts((prev) =>
      prev.map((contract) => {
        if (contract.id === contractId) {
          const updatedContract = { ...contract, [field]: value };
          const totalDispatchQuantity = parseFloat(updatedContract.totalDispatchQuantity || '0');
          const bGrade = parseFloat(updatedContract.bGrade || '0');
          const sl = parseFloat(updatedContract.sl || '0');
          const shrinkage = parseFloat(updatedContract.shrinkage || '0');
          const returnFabric = parseFloat(updatedContract.returnFabric || '0');
          const totalDeductions =bGrade + sl + shrinkage + returnFabric;
          updatedContract.aGrade = (totalDispatchQuantity - totalDeductions).toFixed(2);
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

      const selectedDispatchNote = dispatchNotes.find(
        (dn) => dn.id === data.DispatchNoteId || dn.listid === data.DispatchNoteId
      );

      const payload = {
        ...(isEdit && initialData?.id ? { id: initialData.id } : {}),
        irnNumber: data.IrnNumber,
        irnDate: data.IrnDate,
        seller: sellers.find((s) => s.id === data.Seller)?.name || data.Seller,
        buyer: buyers.find((b) => b.id === data.Buyer)?.name || data.Buyer,
        dispatchNoteId: selectedDispatchNote?.id || data.DispatchNoteId,
        remarks: data.Remarks,
        creationDate: isEdit ? initialData?.creationDate || new Date().toISOString() : new Date().toISOString(),
        updationDate: new Date().toISOString(),
        relatedContracts: selectedContracts.map((contract) => ({
          ...(isEdit && !contract.id.startsWith('new-') ? { id: contract.id } : {}),
          contractNumber: contract.contractNumber,
          quantity: contract.quantity,
          totalDispatchQuantity: contract.totalDispatchQuantity,
          bGrade: contract.bGrade,
          sl: contract.sl,
          shrinkage: contract.shrinkage,
          returnFabric: contract.returnFabric,
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
            <div
              className="relative group"
              onMouseEnter={() => setIrnFocused(true)}
              onMouseLeave={() => setIrnFocused(false)}
            >
              <CustomInput
                type="text"
                variant="floating"
                borderThickness="2"
                label="IRN #"
                id="IrnNumber"
                {...register('IrnNumber')}
                disabled
                error={errors.IrnNumber?.message}
                className="w-full"
              />
              {irnFocused && (
                <>
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <BiSolidErrorAlt className="text-red-500 text-xl cursor-pointer" />
                  </div>
                  <div className="absolute bottom-full right-0 h-8 w-max text-large text-black bg-[#d5e4ff] rounded px-3 py-1 shadow-lg z-10 animate-fade-in">
                    IRN is provided by the system
                  </div>
                </>
              )}
            </div>
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
              label="Dispatch Note #"
              options={dispatchNotes.map((dn) => ({ id: dn.id, name: dn.listid }))}
              selectedOption={watch('DispatchNoteId') || ''}
              onChange={(value) => {
                setValue('DispatchNoteId', value, { shouldValidate: true });
                const selectedDn = dispatchNotes.find((dn) => dn.id === value);
                if (selectedDn) {
                  setValue('Seller', sellers.find((s) => s.name === selectedDn.seller)?.id || '', { shouldValidate: true });
                  setValue('Buyer', buyers.find((b) => b.name === selectedDn.buyer)?.id || '', { shouldValidate: true });
                }
              }}
              error={errors.DispatchNoteId?.message}
              register={register}
              disabled
            />
            <CustomInputDropdown
              label="Seller"
              options={sellers}
              selectedOption={watch('Seller') || ''}
              onChange={(value) => setValue('Seller', value, { shouldValidate: true })}
              error={errors.Seller?.message}
              register={register}
              disabled={!!selectedDispatchNoteId || isEdit}
            />
            <CustomInputDropdown
              label="Buyer"
              options={buyers}
              selectedOption={watch('Buyer') || ''}
              onChange={(value) => setValue('Buyer', value, { shouldValidate: true })}
              error={errors.Buyer?.message}
              register={register}
              disabled={!!selectedDispatchNoteId || isEdit}
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
            ) : selectedDispatchNoteId ? (
              filteredContracts.length > 0 ? (
                <table className="w-full text-left border-collapse text-sm md:text-base">
                  <thead>
                    <tr className="bg-[#06b6d4] text-white">
                      <th className="p-2 md:p-3 font-medium">Select</th>
                      <th className="p-2 md:p-3 font-medium">Contract #</th>
                      <th className="p-2 md:p-3 font-medium">Dispatch Qty</th>
                      <th className="p-2 md:p-3 font-medium">B Grade</th>
                      <th className="p-2 md:p-3 font-medium">S.L</th>
                      <th className="p-2 md:p-3 font-medium">Shrinkage</th>
                      <th className="p-2 md:p-3 font-medium">Return Fabric</th>
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
                        <td className="p-2 md:p-3">{contract.totalDispatchQuantity || '-'}</td>
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
                        <td className="p-2 md:p-3">
                          <input
                            type="number"
                            value={contract.shrinkage || ''}
                            onChange={(e) => handleContractInputChange(contract.id, 'shrinkage', e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </td>
                        <td className="p-2 md:p-3">
                          <input
                            type="number"
                            value={contract.returnFabric || ''}
                            onChange={(e) => handleContractInputChange(contract.id, 'returnFabric', e.target.value)}
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
                <p className="text-gray-500 text-sm md:text-base">No contracts found for the selected dispatch note.</p>
              )
            ) : (
              <p className="text-gray-500 text-sm md:text-base">Please select a dispatch note to view contracts.</p>
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