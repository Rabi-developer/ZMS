  'use client';
  import React, { useState, useEffect } from 'react';
  import { useRouter } from 'next/navigation';
  import { useForm, UseFormRegister } from 'react-hook-form';
  import { z } from 'zod';
  import { zodResolver } from '@hookform/resolvers/zod';
  import { toast } from 'react-toastify';
  import CustomInput from '@/components/ui/CustomInput';
  import CustomInputDropdown from '@/components/ui/CustomeInputDropdown';
  import { MdLocalShipping } from 'react-icons/md';
  import Link from 'next/link';
  import { Button } from '@/components/ui/button';
  import { getAllSellers } from '@/apis/seller';
  import { getAllBuyer } from '@/apis/buyer';
  import { getAllContract } from '@/apis/contract';
  import { Contract } from '../contract/columns';
  import { createDispatchNote, updateDispatchNote } from '@/apis/dispatchnote';

  // Schema for form validation
  const DispatchNoteSchema = z.object({
    Date: z.string().min(1, 'Date is required'),
    Bilty: z.string().min(1, 'Bilty number is required'),
    Seller: z.string().min(1, 'Seller is required'),
    Buyer: z.string().min(1, 'Buyer is required'),
    VehicleType: z.string().optional(),
    Vehicle: z.string().optional(),
    ContractNumber: z.string().min(1, 'Contract number is required'),
    Remarks: z.string().optional(),
    DriverName: z.string().min(1, 'Driver name is required'),
    Base: z.string().optional(), // Added for Base field
    DispatchQty: z.string().optional(), // Added for Dispatch Qty field
  });

  type FormData = z.infer<typeof DispatchNoteSchema>;

  // Extend Contract type
  interface ExtendedContract extends Contract {
    status?: 'Pending' | 'Approved' | 'Canceled' | 'Closed Dispatch' | 'Closed Payment' | 'Complete Closed';
    base?: string; // Temporary field for editing Base
    dispatchQty?: string; 
    isSelected?: boolean;// Temporary field for editing Dispatch Qty
  }

  interface CustomDropdownProps {
    label: string;
    options: { id: string; name: string }[];
    selectedOption: string;
    onChange: (value: string) => void;
    error?: string;
    register: UseFormRegister<FormData>;
  }

  const DispatchNote = () => {
    const router = useRouter();
    const [sellers, setSellers] = useState<{ id: string; name: string }[]>([]);
    const [buyers, setBuyers] = useState<{ id: string; name: string }[]>([]);
    const [contracts, setContracts] = useState<ExtendedContract[]>([]);
    const [filteredContracts, setFilteredContracts] = useState<ExtendedContract[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedContractId, setSelectedContractId] = useState<string | null>(null); // Track selected contract

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
      register,
      handleSubmit,
      formState: { errors },
      reset,
      setValue,
      watch,
    } = useForm<FormData>({
      resolver: zodResolver(DispatchNoteSchema),
      defaultValues: {
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
        setLoading(true);
        const response = await getAllSellers();
        const sellerData = response.data.map((seller: any) => ({
          id: seller.id,
          name: seller.sellerName,
        }));
        setSellers(sellerData);
      } catch (error) {
        console.error('Error fetching sellers:', error);
        toast('Failed to fetch sellers', { type: 'error' });
      } finally {
        setLoading(false);
      }
    };

    // Fetch Buyers
    const fetchBuyers = async () => {
      try {
        setLoading(true);
        const response = await getAllBuyer();
        const buyerData = response.data.map((buyer: any) => ({
          id: buyer.id,
          name: buyer.buyerName,
        }));
        setBuyers(buyerData);
      } catch (error) {
        console.error('Error fetching buyers:', error);
        toast('Failed to fetch buyers', { type: 'error' });
      } finally {
        setLoading(false);
      }
    };

    // Fetch Contracts
    const fetchContracts = async () => {
      try {
        setLoading(true);
        const response = await getAllContract(1, 100);
        setContracts(response.data);
      } catch (error) {
        console.error('Error fetching contracts:', error);
        toast('Failed to fetch contracts', { type: 'error' });
        setContracts([]);
      } finally {
        setLoading(false);
      }
    };

    // Filter contracts by Seller, Buyer, and selected contract
    useEffect(() => {
      if (selectedSeller && selectedBuyer) {
        let filtered = contracts.filter(
          (contract) =>
            contract.seller === selectedSeller && contract.buyer === selectedBuyer
        );
        // If a contract is selected (Base/DispatchQty edited), show only that contract
        if (selectedContractId) {
          filtered = filtered.filter((contract) => contract.id === selectedContractId);
        }
        setFilteredContracts(filtered);
      } else {
        setFilteredContracts([]);
      }
    }, [selectedSeller, selectedBuyer, contracts, selectedContractId]);

    // Fetch data on mount
    useEffect(() => {
      fetchSellers();
      fetchBuyers();
      fetchContracts();
    }, []);

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
      setSelectedContractId(contractId);
    } else {
      setValue('ContractNumber', '', { shouldValidate: true });
      setSelectedContractId(null);
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

    const onSubmit = async (data: FormData) => {
      try {
        // Include Base and DispatchQty in the payload
        const payload = {
          ...data,
          Base: data.Base,
          DispatchQty: data.DispatchQty,
        };
        await createDispatchNote(payload);
        toast('Dispatch Note Created Successfully', { type: 'success' });
        reset();
        router.push('/dispatchnote');
      } catch (error) {
        toast('Error creating dispatch note', { type: 'error' });
        console.error('Error submitting form:', error);
      }
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

    return (
      <div className="container mx-auto bg-white shadow-lg rounded dark:bg-[#030630]">
        <div className="w-full bg-[#06b6d4] h-[7vh] rounded dark:bg-[#387fbf]">
          <h1 className="text-base text-[23px] font-mono ml-10 mt-8 pt-3 text-white flex gap-2">
            <MdLocalShipping />
            ADD DISPATCH NOTE
          </h1>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="p-2 w-full">
            <div className="p-4">
              <div className="grid grid-cols-3 gap-4">
                <CustomInput
                  type="date"
                  variant="floating"
                  borderThickness="2"
                  label="Date"
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
                  onChange={(value) => {
                    setValue('Seller', value, { shouldValidate: true });
                  }}
                  error={errors.Seller?.message}
                  register={register}
                />
                <CustomInputDropdown
                  label="Buyer"
                  options={buyers}
                  selectedOption={watch('Buyer') || ''}
                  onChange={(value) => {
                    setValue('Buyer', value, { shouldValidate: true });
                  }}
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
                  error={errors.VehicleType?.message}
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
                {loading ? (
                  <p className="text-gray-500">Loading contracts...</p>
                ) : selectedSeller && selectedBuyer ? (
                  filteredContracts.length > 0 ? (
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-[#06b6d4] text-white">
                          <th className="p-3 font-medium">Contract #</th>
                          <th className="p-3 font-medium">Seller</th>
                          <th className="p-3 font-medium">Buyer</th>
                          <th className="p-3 font-medium">Date</th>
                          <th className="p-3 font-medium">Quantity</th>
                          <th className="p-3 font-medium">Total Amount</th>
                          <th className="p-3 font-medium">Fabric Details</th>
                          <th className="p-3 font-medium">Base</th>
                          <th className="p-3 font-medium">Dispatch Qty</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredContracts.map((contract) => {
                          const seller = sellers.find((s) => s.id === contract.seller);
                          const buyer = buyers.find((b) => b.id === contract.buyer);
                          return (
                            <tr
                      key={contract.id}
                      className="border-b hover:bg-gray-100 cursor-pointer"
                      onClick={() => handleContractSelect(contract.id, !contract.isSelected)} 
                      >
                              <td className="p-3">{contract.contractNumber || '-'}</td>
                              <td className="p-3">{seller ? seller.name : contract.seller || '-'}</td>
                              <td className="p-3">{buyer ? buyer.name : contract.buyer || '-'}</td>
                              <td className="p-3">{contract.date || '-'}</td>
                              <td className="p-3">{contract.quantity || '-'}</td>
                              <td className="p-3">{contract.totalAmount || '-'}</td>
                              <td className="p-3">{getFabricDetails(contract)}</td>
                              <td className="p-3">
                                <input
                                  type="text"
                                  value={contract.base || ''}
                                  onChange={(e) =>
                                    handleContractInputChange(contract.id, 'base', e.target.value)
                                  }
                                  className="w-full p-2 border border-gray-300 rounded"
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