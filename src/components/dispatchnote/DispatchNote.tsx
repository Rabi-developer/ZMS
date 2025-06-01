'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'react-toastify';
import CustomInput from '@/components/ui/CustomInput';
import CustomInputDropdown from '@/components/ui/CustomeInputDropdown';
import { MdLocalShipping } from 'react-icons/md';
import { BiSolidErrorAlt } from 'react-icons/bi';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { getAllSellers } from '@/apis/seller';
import { getAllBuyer } from '@/apis/buyer';
import { getAllContract } from '@/apis/contract';
import { createDispatchNote, updateDispatchNote } from '@/apis/dispatchnote';
import { Contract } from '../contract/columns';

// Schema for form validation
const DispatchNoteSchema = z.object({
  listid: z.string().optional(),
  Date: z.string().min(1, 'Date is required'),
  Bilty: z.string().min(1, 'Bilty number is required'),
  Seller: z.string().min(1, 'Seller is required'),
  Buyer: z.string().min(1, 'Buyer is required'),
  VehicleType: z.string().optional(),
  Vehicle: z.string().optional(),
  ContractNumber: z.string().min(1, 'Contract number is required'),
  Remarks: z.string().optional(),
  DriverName: z.string().min(1, 'Driver name is required'),
});

type FormData = z.infer<typeof DispatchNoteSchema>;

interface ExtendedContract extends Contract {
  status?: 'Pending' | 'Approved' | 'Canceled' | 'Closed Dispatch' | 'Closed Payment' | 'Complete Closed';
  base?: string;
  dispatchQty: string;
  isSelected?: boolean;
}

// Interface for dispatch note data
interface DispatchNoteData {
  id?: string;
  listid?: string;
  date?: string;
  bilty?: string;
  seller?: string;
  buyer?: string;
  vehicleType?: string;
  vehicle?: string;
  contractNumber?: string;
  remarks?: string;
  driverName?: string;
  createdBy?: string;
  creationDate?: string;
  updatedBy?: string;
  updationDate?: string;
  relatedContracts?: {
    id?: string;
    contractNumber?: string;
    seller?: string;
    buyer?: string;
    date?: string;
    quantity?: string;
    totalAmount?: string;
    base?: string;
    dispatchQty?: string;
  }[];
}

interface DispatchNoteProps {
  isEdit?: boolean;
  initialData?: DispatchNoteData;
}

const DispatchNote = ({ isEdit = false, initialData }: DispatchNoteProps) => {
  const router = useRouter();
  const [sellers, setSellers] = useState<{ id: string; name: string }[]>([]);
  const [buyers, setBuyers] = useState<{ id: string; name: string }[]>([]);
  const [contracts, setContracts] = useState<ExtendedContract[]>([]);
  const [filteredContracts, setFilteredContracts] = useState<ExtendedContract[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingSellers, setFetchingSellers] = useState(false);
  const [fetchingBuyers, setFetchingBuyers] = useState(false);
  const [idFocused, setIdFocused] = useState(false);

  // Static options for Vehicle Type and Vehicle
  const vehicleTypes = [
    { id: '1', name: 'Truck' },
    { id: '2', name: 'Van' },
    { id: '3', name: 'Car' },
  ];
  const vehicles = [
    { id: '1', name: 'Vehicle A' },
    { id: '2', name: 'Vehicle B' },
    { id: '3', name: 'Vehicle C' },
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
    resolver: zodResolver(DispatchNoteSchema),
    defaultValues: {
      listid: '',
      Date: new Date().toISOString().split('T')[0],
      Bilty: '',
      Seller: '',
      Buyer: '',
      VehicleType: '',
      Vehicle: '',
      ContractNumber: '',
      Remarks: '',
      DriverName: '',
    },
  });

  const selectedSeller = watch('Seller');
  const selectedBuyer = watch('Buyer');

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

  // Fetch Contracts
  const fetchContracts = async () => {
    try {
      setLoading(true);
      const response = await getAllContract(1, 100);
      if (response && response.data) {
        let updatedContracts: ExtendedContract[] = [];

        if (isEdit && initialData?.relatedContracts) {
          const relatedContractNumbers = initialData.relatedContracts.map((rc) => rc.contractNumber);
          updatedContracts = response.data
            .filter((contract: Contract) => relatedContractNumbers.includes(contract.contractNumber))
            .map((contract: Contract) => {
              const relatedContract = initialData.relatedContracts!.find(
                (rc) => rc.contractNumber === contract.contractNumber && rc.id
              );
              return {
                ...contract,
                isSelected: relatedContract?.contractNumber === initialData.contractNumber,
                base: relatedContract?.base || '',
                dispatchQty: relatedContract?.dispatchQty || '',
              };
            });

          const contractMap = new Map<string, ExtendedContract>();
          initialData.relatedContracts.forEach((rc) => {
            const contract = updatedContracts.find(
              (c) => c.contractNumber === rc.contractNumber && !contractMap.has(rc.id!)
            );
            if (contract && rc.id) {
              contractMap.set(rc.id, { ...contract, id: rc.id });
            }
          });
          updatedContracts = Array.from(contractMap.values());
        } else {
          updatedContracts = response.data.map((contract: Contract) => ({
            ...contract,
            isSelected: false,
            base: '',
            dispatchQty: '',
          }));
        }

        setContracts(updatedContracts);
      } else {
        setContracts([]);
        toast('No contracts found', { type: 'warning' });
      }
    } catch (error) {
      setContracts([]);
      toast('Failed to fetch contracts', { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Initialize form with initialData when editing
  useEffect(() => {
    if (isEdit && initialData) {
      if (!initialData.id) {
        toast('Invalid dispatch note data', { type: 'error' });
        router.push('/dispatchnote');
        return;
      }
      setValue('listid', initialData.listid || '');
      setValue('Date', initialData.date?.split('T')[0] || '');
      setValue('Bilty', initialData.bilty || '');
      setValue(
        'Seller',
        sellers.find((s) => s.name === initialData.seller)?.id || initialData.seller || ''
      );
      setValue(
        'Buyer',
        buyers.find((b) => b.name === initialData.buyer)?.id || initialData.buyer || ''
      );
      setValue('VehicleType', initialData.vehicleType || '');
      setValue('Vehicle', initialData.vehicle || '');
      setValue('ContractNumber', initialData.contractNumber || '');
      setValue('Remarks', initialData.remarks || '');
      setValue('DriverName', initialData.driverName || '');
    }
  }, [isEdit, initialData, sellers, buyers, setValue, router]);

  // Filter contracts by Seller and Buyer
  useEffect(() => {
    let filtered: ExtendedContract[] = [];

    if (isEdit && initialData?.relatedContracts) {
      filtered = contracts.filter((contract) =>
        initialData.relatedContracts!.some(
          (rc) => rc.contractNumber === contract.contractNumber && rc.id === contract.id
        )
      );
    } else {
      const selectedSellerObj = sellers.find((s) => String(s.id) === String(selectedSeller));
      const selectedBuyerObj = buyers.find((b) => String(b.id) === String(selectedBuyer));

      filtered = contracts.filter((contract) => {
        if (
          (String(contract.seller) === String(selectedSeller) ||
            contract.seller === selectedSellerObj?.name) &&
          (String(contract.buyer) === String(selectedBuyer) ||
            contract.buyer === selectedBuyerObj?.name)
        ) {
          return true;
        }
        return false;
      });
    }

    setFilteredContracts(filtered);
  }, [isEdit, initialData, selectedSeller, selectedBuyer, contracts, sellers, buyers]);

  // Fetch data on mount
  useEffect(() => {
    fetchSellers();
    fetchBuyers();
    fetchContracts();
  }, []);

  // Handle contract row selection
  const handleContractSelect = (contractId: string, checked: boolean) => {
    setContracts((prev) =>
      prev.map((contract) =>
        contract.id === contractId
          ? { ...contract, isSelected: checked }
          : { ...contract, isSelected: false }
      )
    );
    const selectedContract = contracts.find((c) => c.id === contractId);
    if (selectedContract && checked) {
      setValue('ContractNumber', selectedContract.contractNumber, { shouldValidate: true });
    } else {
      setValue('ContractNumber', '', { shouldValidate: true });
    }
  };

  // Handle Base and Dispatch Qty input changes
  const handleContractInputChange = (
    contractId: string,
    field: 'base' | 'dispatchQty',
    value: string
  ) => {
    setContracts((prev) =>
      prev.map((contract) =>
        contract.id === contractId ? { ...contract, [field]: value } : contract
      )
    );
  };

  // Format Fabric Details
  const getFabricDetails = (contract: ExtendedContract) => {
    const fabricDetails = [
      `${contract.warpCount || ''}${contract.warpYarnType || ''}`,
      `${contract.weftCount || ''}${contract.weftYarnType || ''}`,
      `${contract.noOfEnds || ''} * ${contract.noOfPicks || ''}`,
      contract.weaves || '',
      contract.width || '',
      contract.final || '',
      contract.selvedge || '',
    ]
      .filter((item) => item.trim() !== '')
      .join(' / ');
    return fabricDetails || 'N/A';
  };

  const onSubmit = async (data: FormData) => {
    try {
      const relatedContracts = contracts
        .filter((contract) => contract.base || contract.dispatchQty)
        .map((contract) => {
          if (isEdit) {
            const relatedContract = initialData?.relatedContracts?.find(
              (rc) => rc.contractNumber === contract.contractNumber && rc.id === contract.id
            );
            return {
              id: relatedContract?.id || contract.id,
              contractNumber: contract.contractNumber || '',
              seller: contract.seller || '',
              buyer: contract.buyer || '',
              date: contract.date || '',
              quantity: contract.quantity || '',
              totalAmount: contract.totalAmount || '',
              base: contract.base || '',
              dispatchQty: contract.dispatchQty || '',
            };
          }
          return {
            contractNumber: contract.contractNumber || '',
            seller: contract.seller || '',
            buyer: contract.buyer || '',
            date: contract.date || '',
            quantity: contract.quantity || '',
            totalAmount: contract.totalAmount || '',
            base: contract.base || '',
            dispatchQty: contract.dispatchQty || '',
          };
        });

      if (relatedContracts.length === 0) {
        toast('Please fill at least one contract with Base or Dispatch Quantity', { type: 'error' });
        return;
      }

      const payload = {
        ...(isEdit && { id: initialData?.id }),
        listid: isEdit ? initialData?.listid : undefined,
        date: data.Date,
        bilty: data.Bilty,
        seller: sellers.find((s) => s.id === data.Seller)?.name || data.Seller,
        buyer: buyers.find((b) => b.id === data.Buyer)?.name || data.Buyer,
        vehicleType: data.VehicleType,
        vehicle: data.Vehicle,
        contractNumber: data.ContractNumber,
        remarks: data.Remarks,
        driverName: data.DriverName,
        creationDate: isEdit
          ? initialData?.creationDate || new Date().toISOString()
          : new Date().toISOString(),
        updationDate: new Date().toISOString(),
        relatedContracts,
      };

      if (isEdit) {
        await updateDispatchNote(payload);
        toast('Dispatch Note Updated Successfully', { type: 'success' });
      } else {
        await createDispatchNote(payload);
        toast('Dispatch Note Created Successfully', { type: 'success' });
      }

      reset();
      router.push('/dispatchnote');
    } catch (error) {
      toast(`Error ${isEdit ? 'updating' : 'creating'} dispatch note: ${(error as Error).message}`, {
        type: 'error',
      });
    }
  };

  return (
    <div className="container mx-auto bg-white shadow-lg rounded dark:bg-[#030630]">
      <div className="w-full bg-[#06b6d4] h-[7vh] rounded dark:bg-[#387fbf]">
        <h1 className="text-base text-[23px] font-mono ml-10 mt-8 pt-3 text-white flex gap-2">
          <MdLocalShipping />
          {isEdit ? 'UPDATE DISPATCH NOTE' : 'ADD DISPATCH NOTE'}
        </h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="p-2 w-full">
          <div className="p-4">
            <div className="grid grid-cols-3 gap-4">
              <div
                className="relative group"
                onMouseEnter={() => setIdFocused(true)}
                onMouseLeave={() => setIdFocused(false)}
              >
              <Controller
              name="listid"
              control={control}
              render={({ field }) => (
                <>
                  <CustomInput
                    {...field}
                    label="Dispatch#"
                    type="text"
                    disabled
                    placeholder=""
                    value={field.value || ''}
                  />
                  {idFocused && (
                    <>
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <BiSolidErrorAlt className="text-red-500 text-xl cursor-pointer" />
                      </div>
                      <div className="absolute bottom-full right-0 h-8 w-max text-large text-black bg-[#d5e4ff] rounded px-3 py-1 shadow-lg z-10 animate-fade-in">
                        ID is auto-generated by the system
                      </div>
                    </>
                  )}
                </>
              )}
            />
              </div>
              <CustomInput
                type="date"
                variant="floating"
                borderThickness="2"
                label="Dispatch Date"
                id="Date"
                {...register('Date')}
                error={errors.Date?.message}
              />
              <CustomInput
                variant="floating"
                borderThickness="2"
                label="Bilty"
                id="Bilty"
                {...register('Bilty')}
                error={errors.Bilty?.message}
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
              <CustomInputDropdown
                label="Vehicle Type"
                options={vehicleTypes}
                selectedOption={watch('VehicleType') || ''}
                onChange={(value) => setValue('VehicleType', value, { shouldValidate: true })}
                error={errors.VehicleType?.message}
                register={register}
              />
              <CustomInputDropdown
                label="Vehicle"
                options={vehicles}
                selectedOption={watch('Vehicle') || ''}
                onChange={(value) => setValue('Vehicle', value, { shouldValidate: true })}
                error={errors.Vehicle?.message}
                register={register}
              />
              <CustomInput
                variant="floating"
                borderThickness="2"
                label="Contract #"
                id="ContractNumber"
                {...register('ContractNumber')}
                error={errors.ContractNumber?.message}
              />
              <CustomInput
                variant="floating"
                borderThickness="2"
                label="Driver Name"
                id="DriverName"
                {...register('DriverName')}
                error={errors.DriverName?.message}
              />
            </div>
            <div className="mt-4">
              <h2 className="text-xl text-[#06b6d4] font-bold dark:text-white">Remarks</h2>
              <textarea
                className="w-full p-2 border rounded text-base"
                rows={4}
                {...register('Remarks')}
                placeholder="Enter any remarks"
              />
              {errors.Remarks && <p className="text-red-500">{errors.Remarks.message}</p>}
            </div>
          </div>

          <div className="p-4">
            <h2 className="text-xl text-[#06b6d4] font-bold dark:text-white">Related Contracts</h2>
            <div className="border rounded p-4 mt-2">
              {(loading || fetchingSellers || fetchingBuyers) ? (
                <p className="text-gray-500">Loading contracts, sellers, or buyers...</p>
              ) : selectedSeller && selectedBuyer ? (
                filteredContracts.length > 0 ? (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#06b6d4] text-white">
                        <th className="p-3 font-medium">Select</th>
                        <th className="p-3 font-medium">Contract #</th>
                        <th className="p-3 font-medium">Fabric Details</th>
                        <th className="p-3 font-medium">Contract Date</th>
                        <th className="p-3 font-medium">Quantity</th>
                        <th className="p-3 font-medium">Total Amount</th>
                        <th className="p-3 font-medium">Base</th>
                        <th className="p-3 font-medium">Dispatch Qty</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredContracts.map((contract) => {
                        const seller = sellers.find(
                          (s) => String(s.id) === String(contract.seller) || s.name === contract.seller
                        );
                        const buyer = buyers.find(
                          (b) => String(b.id) === String(contract.buyer) || b.name === contract.buyer
                        );
                        return (
                          <tr
                            key={contract.id}
                            className={`border-b hover:bg-gray-100 cursor-pointer ${
                              contract.isSelected ? 'bg-blue-100' : ''
                            }`}
                            onClick={() => handleContractSelect(contract.id, !contract.isSelected)}
                          >
                            <td className="p-3">
                              <input
                                type="checkbox"
                                checked={contract.isSelected || false}
                                onChange={(e) => handleContractSelect(contract.id, e.target.checked)}
                                onClick={(e) => e.stopPropagation()}
                              />
                            </td>
                            <td className="p-3">{contract.contractNumber || '-'}</td>
                            <td className="p-3">{getFabricDetails(contract)}</td>
                            <td className="p-3">{contract.date || '-'}</td>
                            <td className="p-3">{contract.quantity || '-'}</td>
                            <td className="p-3">{contract.totalAmount || '-'}</td>
                            <td className="p-3">
                              <input
                                type="text"
                                value={contract.base || ''}
                                onChange={(e) =>
                                  handleContractInputChange(contract.id, 'base', e.target.value)
                                }
                                className="w-full p-2 border border-gray-300 rounded"
                                onClick={(e) => e.stopPropagation()}
                              />
                            </td>
                            <td className="p-3">
                              <input
                                type="text"
                                value={contract.dispatchQty || ''}
                                onChange={(e) =>
                                  handleContractInputChange(contract.id, 'dispatchQty', e.target.value)
                                }
                                className="w-full p-2 border border-gray-300 rounded"
                                onClick={(e) => e.stopPropagation()}
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                ) : (
                  <p className="text-gray-500">No contracts found for the selected Seller and Buyer.</p>
                )
              ) : (
                <p className="text-gray-500">Please select both Seller and Buyer to view contracts.</p>
              )}
            </div>
          </div>
        </div>

        <div className="w-full h-[8vh] flex justify-end gap-2 mt-3 bg-transparent border-t-2 border-[#e7e7e7]">
          <Button
            type="submit"
            className="w-[160px] gap-2 inline-flex items-center bg-[#0e7d90] hover:bg-[#0891b2] text-white px-6 py-2 text-sm font-medium transition-all duration-200 font-mono text-base hover:translate-y-[-2px] focus:outline-none active:shadow-[#3c4fe0_0_3px_7px_inset] active:translate-y-[2px] mt-2"
          >
            Save
          </Button>
          <Link href="/dispatchnote">
            <Button
              type="button"
              className="w-[160px] gap-2 mr-2 inline-flex items-center bg-black hover:bg-[#b0b0b0] text-white px-6 py-2 text-sm font-medium transition-all duration-200 font-mono text-base hover:translate-y-[-2px] focus:outline-none active:shadow-[#3c4fe0_0_3px_7px_inset] active:translate-y-[2px] mt-2"
            >
              Cancel
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
};

export default DispatchNote;