'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'react-toastify';
import CustomInput from '@/components/ui/CustomInput';
import CustomInputDropdown from '@/components/ui/CustomeInputDropdown';
import { MdReceipt } from 'react-icons/md';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { getAllSellers } from '@/apis/seller';
import { getAllBuyer } from '@/apis/buyer';
import { getAllContract } from '@/apis/contract';
import { getAllDispatchNotes } from '@/apis/dispatchnote'; 
import { Contract } from '@/components/contract/columns';
import { createInvoice, updateInvoice } from '@/apis/invoice';

// Schema for form validation
const InvoiceSchema = z.object({
  InvoiceNumber: z.string().min(1, 'Invoice number is required'),
  InvoiceDate: z.string().min(1, 'Invoice date is required'),
  DueDate: z.string().min(1, 'Due date is required'),
  InvoiceReceivedDate: z.string().optional(),
  InvoiceDeliveredByDate: z.string().optional(),
  Seller: z.string().min(1, 'Seller is required'),
  Buyer: z.string().min(1, 'Buyer is required'),
});

type FormData = z.infer<typeof InvoiceSchema>;

interface ExtendedContract extends Contract {
  dispatchQty: string; // Required to match Contract
  invoiceQty?: string;
  invoiceRate?: string;
  gstPercentage?: string;
  wht?: string;
  whtPercentage?: string;
  isSelected?: boolean;
  dispatchNoteId?: string; // Add to track associated dispatch note
}

// Interface for dispatch note data (to match DispatchNoteList)
interface DispatchNoteData {
  id: string;
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

// Interface for invoice data
interface InvoiceData {
  id?: string;
  invoiceNumber?: string;
  invoiceDate?: string;
  dueDate?: string;
  invoiceReceivedDate?: string;
  invoiceDeliveredByDate?: string;
  seller?: string;
  buyer?: string;
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
    dispatchQty?: string;
    invoiceQty?: string;
    invoiceRate?: string;
    gstPercentage?: string;
    wht?: string;
    whtPercentage?: string;
  }[];
}

interface InvoiceFormProps {
  isEdit?: boolean;
  initialData?: InvoiceData;
}

const InvoiceForm = ({ isEdit = false, initialData }: InvoiceFormProps) => {
  const router = useRouter();
  const [sellers, setSellers] = useState<{ id: string; name: string }[]>([]);
  const [buyers, setBuyers] = useState<{ id: string; name: string }[]>([]);
  const [contracts, setContracts] = useState<ExtendedContract[]>([]);
  const [filteredContracts, setFilteredContracts] = useState<ExtendedContract[]>([]);
  const [dispatchNotes, setDispatchNotes] = useState<DispatchNoteData[]>([]); // State for dispatch notes
  const [loading, setLoading] = useState(false);
  const [fetchingSellers, setFetchingSellers] = useState(false);
  const [fetchingBuyers, setFetchingBuyers] = useState(false);
  const [fetchingDispatchNotes, setFetchingDispatchNotes] = useState(false); // State for dispatch notes loading

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<FormData>({
    resolver: zodResolver(InvoiceSchema),
    defaultValues: {
      InvoiceNumber: '',
      InvoiceDate: new Date().toISOString().split('T')[0],
      DueDate: '',
      InvoiceReceivedDate: '',
      InvoiceDeliveredByDate: '',
      Seller: '',
      Buyer: '',
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

  // Fetch Dispatch Notes
  const fetchDispatchNotes = async () => {
    try {
      setFetchingDispatchNotes(true);
      const response = await getAllDispatchNotes(1, 100); // Fetch all dispatch notes
      if (response && response.data) {
        setDispatchNotes(response.data);
      } else {
        setDispatchNotes([]);
        toast('No dispatch notes found', { type: 'warning' });
      }
    } catch (error) {
      setDispatchNotes([]);
      toast('Failed to fetch dispatch notes', { type: 'error' });
    } finally {
      setFetchingDispatchNotes(false);
    }
  };

  // Fetch Contracts
  const fetchContracts = async () => {
    try {
      setLoading(true);
      const response = await getAllContract(1, 100);
      if (response && response.data) {
        let updatedContracts: ExtendedContract[] = response.data.map((contract: Contract) => ({
          ...contract,
          dispatchQty: '',
          invoiceQty: '',
          invoiceRate: '',
          gstPercentage: '',
          wht: '',
          whtPercentage: '',
          isSelected: false,
        }));

        if (isEdit && initialData?.relatedContracts) {
          updatedContracts = updatedContracts.map((contract) => {
            const relatedContract = initialData.relatedContracts!.find(
              (rc) => rc.contractNumber === contract.contractNumber && rc.id === contract.id
            );
            return {
              ...contract,
              isSelected: !!relatedContract,
              dispatchQty: relatedContract?.dispatchQty || '',
              invoiceQty: relatedContract?.invoiceQty || '',
              invoiceRate: relatedContract?.invoiceRate || '',
              gstPercentage: relatedContract?.gstPercentage || '',
              wht: relatedContract?.wht || '',
              whtPercentage: relatedContract?.whtPercentage || '',
            };
          });
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
        toast('Invalid invoice data', { type: 'error' });
        router.push('/invoice');
        return;
      }
      setValue('InvoiceNumber', initialData.invoiceNumber || '');
      setValue('InvoiceDate', initialData.invoiceDate?.split('T')[0] || '');
      setValue('DueDate', initialData.dueDate?.split('T')[0] || '');
      setValue('InvoiceReceivedDate', initialData.invoiceReceivedDate?.split('T')[0] || '');
      setValue('InvoiceDeliveredByDate', initialData.invoiceDeliveredByDate?.split('T')[0] || '');
      setValue(
        'Seller',
        sellers.find((s) => s.name === initialData.seller)?.id || initialData.seller || ''
      );
      setValue(
        'Buyer',
        buyers.find((b) => b.name === initialData.buyer)?.id || initialData.buyer || ''
      );
    }
  }, [isEdit, initialData, sellers, buyers, setValue, router]);

  // Filter contracts by Seller, Buyer, and Dispatch Notes
  useEffect(() => {
    let filtered: ExtendedContract[] = [];

    // Get all contract IDs from dispatch notes
    const dispatchNoteContracts = dispatchNotes.flatMap((dn) =>
      dn.relatedContracts?.map((rc) => ({
        id: rc.id,
        contractNumber: rc.contractNumber,
        seller: rc.seller,
        buyer: rc.buyer,
        dispatchQty: rc.dispatchQty || '',
        dispatchNoteId: dn.id,
      })) || []
    );

    if (isEdit && initialData?.relatedContracts) {
      filtered = contracts.filter((contract) =>
        initialData.relatedContracts!.some(
          (rc) => rc.contractNumber === contract.contractNumber && rc.id === contract.id
        )
      );
    } else {
      const selectedSellerObj = sellers.find((s) => String(s.id) === String(selectedSeller));
      const selectedBuyerObj = buyers.find((b) => String(b.id) === String(selectedBuyer));

      console.log(dispatchNoteContracts)
      filtered = contracts
        .filter((contract) => {
          // Match by seller and buyer
          const matchesSellerAndBuyer =
            (contract.seller === selectedSellerObj?.name ) &&
            (contract.buyer === selectedBuyerObj?.name);

          // Check if contract is in dispatch notes
          const isInDispatchNote = dispatchNoteContracts.some(
            (dc) => dc.contractNumber === contract.contractNumber
          );

          return matchesSellerAndBuyer && isInDispatchNote;
        })
        .map((contract) => {
          const dispatchContract = dispatchNoteContracts.find(
            (dc) => dc.contractNumber === contract.contractNumber
          );
          return {
            ...contract,
            dispatchQty: dispatchContract?.dispatchQty || '',
            dispatchNoteId: dispatchContract?.dispatchNoteId,
          };
        });
    }
    console.log('Filtered Contracts:', filtered);

    setFilteredContracts(filtered);
  }, [isEdit, initialData, selectedSeller, selectedBuyer, contracts, sellers, buyers, dispatchNotes]);

  // Fetch data on mount
  useEffect(() => {
    fetchSellers();
    fetchBuyers();
    fetchContracts();
    fetchDispatchNotes();
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
  };

  // Handle input changes for table fields
  const handleContractInputChange = (
    contractId: string,
    field: 'invoiceQty' | 'invoiceRate' | 'gstPercentage' | 'wht' | 'whtPercentage',
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

  // Calculate totals
  const calculateTotals = () => {
    let totalInvoiceValue = 0;
    let totalGSTValue = 0;
    let totalInvoiceValueWithGST = 0;

    filteredContracts.forEach((contract) => {
      const invoiceQty = parseFloat(contract.invoiceQty || '0') || 0;
      const invoiceRate = parseFloat(contract.invoiceRate || '0') || 0;
      const gstPercentage = parseFloat(contract.gstPercentage || '0') || 0;
      const whtPercentage = parseFloat(contract.whtPercentage || '0') || 0;

      const invoiceValue = invoiceQty * invoiceRate;
      const gstValue = invoiceValue * (gstPercentage / 100);
      const invoiceValueWithGST = invoiceValue + gstValue;
      const whtValue = invoiceValueWithGST * (whtPercentage / 100);
      const totalContractInvoiceValue = invoiceValueWithGST - whtValue;

      totalInvoiceValue += invoiceValue;
      totalGSTValue += gstValue;
      totalInvoiceValueWithGST += totalContractInvoiceValue;
    });

    return { totalInvoiceValue, totalGSTValue, totalInvoiceValueWithGST };
  };

  const onSubmit = async (data: FormData) => {
    try {
      const relatedContracts = contracts
        .filter(
          (contract) =>
            contract.invoiceQty ||
            contract.invoiceRate ||
            contract.gstPercentage ||
            contract.wht ||
            contract.whtPercentage
        )
        .map((contract) => {
          const invoiceQty = parseFloat(contract.invoiceQty || '0') || 0;
          const invoiceRate = parseFloat(contract.invoiceRate || '0') || 0;
          const gstPercentage = parseFloat(contract.gstPercentage || '0') || 0;
          const whtPercentage = parseFloat(contract.whtPercentage || '0') || 0;

          const invoiceValue = invoiceQty * invoiceRate;
          const gstValue = invoiceValue * (gstPercentage / 100);
          const invoiceValueWithGST = invoiceValue + gstValue;
          const whtValue = invoiceValueWithGST * (whtPercentage / 100);

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
              dispatchQty: contract.dispatchQty || '',
              invoiceQty: contract.invoiceQty || '',
              invoiceRate: contract.invoiceRate || '',
              gstPercentage: contract.gstPercentage || '',
              wht: whtValue.toFixed(2),
              whtPercentage: contract.whtPercentage || '',
            };
          }
          return {
            contractNumber: contract.contractNumber || '',
            seller: contract.seller || '',
            buyer: contract.buyer || '',
            date: contract.date || '',
            quantity: contract.quantity || '',
            totalAmount: contract.totalAmount || '',
            dispatchQty: contract.dispatchQty || '',
            invoiceQty: contract.invoiceQty || '',
            invoiceRate: contract.invoiceRate || '',
            gstPercentage: contract.gstPercentage || '',
            wht: whtValue.toFixed(2),
            whtPercentage: contract.whtPercentage || '',
          };
        });

      if (relatedContracts.length === 0) {
        toast('Please fill at least one contract with Invoice Quantity, Rate, GST%, or WHT%', {
          type: 'error',
        });
        return;
      }

      const payload = {
        ...(isEdit && { id: initialData?.id }),
        invoiceNumber: data.InvoiceNumber,
        invoiceDate: data.InvoiceDate,
        dueDate: data.DueDate,
        invoiceReceivedDate: data.InvoiceReceivedDate,
        invoiceDeliveredByDate: data.InvoiceDeliveredByDate,
        seller: sellers.find((s) => s.id === data.Seller)?.name || data.Seller,
        buyer: buyers.find((b) => b.id === data.Buyer)?.name || data.Buyer,
        creationDate: isEdit
          ? initialData?.creationDate || new Date().toISOString()
          : new Date().toISOString(),
        updationDate: new Date().toISOString(),
        relatedContracts,
      };

      if (isEdit) {
        await updateInvoice(payload);
        toast('Invoice Updated Successfully', { type: 'success' });
      } else {
        await createInvoice(payload);
        toast('Invoice Created Successfully', { type: 'success' });
      }

      reset();
      router.push('/invoice');
    } catch (error) {
      toast(`Error ${isEdit ? 'updating' : 'creating'} invoice: ${(error as Error).message}`, {
        type: 'error',
      });
    }
  };

  const { totalInvoiceValue, totalGSTValue, totalInvoiceValueWithGST } = calculateTotals();

  return (
    <div className="container mx-auto bg-white shadow-lg rounded dark:bg-[#030630]">
      <div className="w-full bg-[#06b6d4] h-[7vh] rounded dark:bg-[#387fbf]">
        <h1 className="text-base text-[23px] font-mono ml-10 mt-8 pt-3 text-white flex gap-2">
          <MdReceipt />
          {isEdit ? 'UPDATE INVOICE' : 'ADD INVOICE'}
        </h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="p-2 w-full">
          <div className="p-4">
            <div className="grid grid-cols-3 gap-4">
              <CustomInput
                type="text"
                variant="floating"
                borderThickness="2"
                label="Invoice #"
                id="InvoiceNumber"
                {...register('InvoiceNumber')}
                error={errors.InvoiceNumber?.message}
              />
              <CustomInput
                type="date"
                variant="floating"
                borderThickness="2"
                label="Invoice Date"
                id="InvoiceDate"
                {...register('InvoiceDate')}
                error={errors.InvoiceDate?.message}
              />
              <CustomInput
                type="date"
                variant="floating"
                borderThickness="2"
                label="Due Date"
                id="DueDate"
                {...register('DueDate')}
                error={errors.DueDate?.message}
              />
              <CustomInput
                type="date"
                variant="floating"
                borderThickness="2"
                label="Invoice Received Date"
                id="InvoiceReceivedDate"
                {...register('InvoiceReceivedDate')}
                error={errors.InvoiceReceivedDate?.message}
              />
              <CustomInput
                type="date"
                variant="floating"
                borderThickness="2"
                label="Invoice Delivered By Date"
                id="InvoiceDeliveredByDate"
                {...register('InvoiceDeliveredByDate')}
                error={errors.InvoiceDeliveredByDate?.message}
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
            </div>

            {filteredContracts.length > 0 && filteredContracts.some((c) => c.isSelected) && (
              <div className="mt-4 grid grid-cols-2 gap-4">
                <CustomInput
                  type="text"
                  variant="floating"
                  borderThickness="2"
                  label="Seller Payment Term"
                  id="SellerPaymentTerm"
                  value={filteredContracts.find((c) => c.isSelected)?.paymentTermsSeller || ''}
                  disabled
                />
                <CustomInput
                  type="text"
                  variant="floating"
                  borderThickness="2"
                  label="Buyer Payment Term"
                  id="BuyerPaymentTerm"
                  value={filteredContracts.find((c) => c.isSelected)?.paymentTermsBuyer || ''}
                  disabled
                />
              </div>
            )}
          </div>

          <div className="p-4">
            <h2 className="text-xl text-[#06b6d4] font-bold dark:text-white">Related Contracts</h2>
            <div className="border rounded p-4 mt-2">
              {(loading || fetchingSellers || fetchingBuyers || fetchingDispatchNotes) ? (
                <p className="text-gray-500">Loading contracts, sellers, buyers, or dispatch notes...</p>
              ) : selectedSeller && selectedBuyer ? (
                filteredContracts.length > 0 ? (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#06b6d4] text-white">
                        <th className="p-3 font-medium">Select</th>
                        <th className="p-3 font-medium">Contract #</th>
                        <th className="p-3 font-medium">Fabric Details</th>
                        <th className="p-3 font-medium">Dispatch Qty</th>
                        <th className="p-3 font-medium">Invoice Qty</th>
                        <th className="p-3 font-medium">Invoice Rate</th>
                        <th className="p-3 font-medium">Invoice Value</th>
                        <th className="p-3 font-medium">GST</th>
                        <th className="p-3 font-medium">GST%</th>
                        <th className="p-3 font-medium">GST Value</th>
                        <th className="p-3 font-medium">Invoice Value</th>
                        <th className="p-3 font-medium">WHT</th>
                        <th className="p-3 font-medium">WHT%</th>
                        <th className="p-3 font-medium">WHT Value</th>
                        <th className="p-3 font-medium">Total Invoice Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredContracts.map((contract) => {
                        const invoiceQty = parseFloat(contract.invoiceQty || '0') || 0;
                        const invoiceRate = parseFloat(contract.invoiceRate || '0') || 0;
                        const gstPercentage = parseFloat(contract.gstPercentage || '0') || 0;
                        const whtPercentage = parseFloat(contract.whtPercentage || '0') || 0;

                        const invoiceValue = invoiceQty * invoiceRate;
                        const gstValue = invoiceValue * (gstPercentage / 100);
                        const invoiceValueWithGST = invoiceValue + gstValue;
                        const whtValue = invoiceValueWithGST * (whtPercentage / 100);
                        const totalInvoiceValue = invoiceValueWithGST - whtValue;

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
                            <td className="p-3">{contract.dispatchQty || '-'}</td>
                            <td className="p-3">
                              <input
                                type="number"
                                value={contract.invoiceQty || ''}
                                onChange={(e) =>
                                  handleContractInputChange(contract.id, 'invoiceQty', e.target.value)
                                }
                                className="w-full p-2 border border-gray-300 rounded"
                                onClick={(e) => e.stopPropagation()}
                              />
                            </td>
                            <td className="p-3">
                              <input
                                type="number"
                                value={contract.invoiceRate || ''}
                                onChange={(e) =>
                                  handleContractInputChange(contract.id, 'invoiceRate', e.target.value)
                                }
                                className="w-full p-2 border border-gray-300 rounded"
                                onClick={(e) => e.stopPropagation()}
                              />
                            </td>
                            <td className="p-3">{invoiceValue.toFixed(2)}</td>
                            <td className="p-3">{contract.gst || '-'}</td>
                            <td className="p-3">
                              <input
                                type="number"
                                value={contract.gstPercentage || ''}
                                onChange={(e) =>
                                  handleContractInputChange(
                                    contract.id,
                                    'gstPercentage',
                                    e.target.value
                                  )
                                }
                                className="w-full p-2 border border-gray-300 rounded"
                                onClick={(e) => e.stopPropagation()}
                              />
                            </td>
                            <td className="p-3">{gstValue.toFixed(2)}</td>
                            <td className="p-3">{invoiceValueWithGST.toFixed(2)}</td>
                            <td className="p-3">{whtValue.toFixed(2)}</td>
                            <td className="p-3">
                              <input
                                type="number"
                                value={contract.whtPercentage || ''}
                                onChange={(e) =>
                                  handleContractInputChange(
                                    contract.id,
                                    'whtPercentage',
                                    e.target.value
                                  )
                                }
                                className="w-full p-2 border border-gray-300 rounded"
                                onClick={(e) => e.stopPropagation()}
                              />
                            </td>
                            <td className="p-3">{whtValue.toFixed(2)}</td>
                            <td className="p-3">{totalInvoiceValue.toFixed(2)}</td>
                          </tr>
                        );
                      })}
                      {Array.from({ length: 5 }).map((_, index) => (
                        <tr key={`blank-${index}`} className="border-b">
                          <td className="p-3"></td>
                          <td className="p-3"></td>
                          <td className="p-3"></td>
                          <td className="p-3"></td>
                          <td className="p-3"></td>
                          <td className="p-3"></td>
                          <td className="p-3"></td>
                          <td className="p-3"></td>
                          <td className="p-3"></td>
                          <td className="p-3"></td>
                          <td className="p-3"></td>
                          <td className="p-3"></td>
                          <td className="p-3"></td>
                          <td className="p-3"></td>
                          <td className="p-3"></td>
                        </tr>
                      ))}
                      <tr className="bg-gray-100 font-bold">
                        <td className="p-3"></td>
                        <td className="p-3"></td>
                        <td className="p-3"></td>
                        <td className="p-3"></td>
                        <td className="p-3"></td>
                        <td className="p-3"></td>
                        <td className="p-3">{totalInvoiceValue.toFixed(2)}</td>
                        <td className="p-3"></td>
                        <td className="p-3"></td>
                        <td className="p-3">{totalGSTValue.toFixed(2)}</td>
                        <td className="p-3"></td>
                        <td className="p-3"></td>
                        <td className="p-3"></td>
                        <td className="p-3"></td>
                        <td className="p-3">{totalInvoiceValueWithGST.toFixed(2)}</td>
                      </tr>
                    </tbody>
                  </table>
                ) : (
                  <p className="text-gray-500">
                    No contracts found for the selected Seller and Buyer with associated Dispatch Notes.
                  </p>
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
          <Link href="/invoice">
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

export default InvoiceForm;