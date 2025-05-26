'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { string, z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'react-toastify';
import CustomInput from '@/components/ui/CustomInput';
import CustomInputDropdown from '@/components/ui/CustomeInputDropdown';
import CustomSingleDatePicker from '@/components/ui/CustomDateRangePicker';
import { MdReceipt } from 'react-icons/md';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { getAllSellers } from '@/apis/seller';
import { getAllBuyer } from '@/apis/buyer';
import { getAllContract } from '@/apis/contract';
import { getAllDispatchNotes } from '@/apis/dispatchnote';
import { getAllGeneralSaleTextTypes } from '@/apis/generalSaleTextType';
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
  Remarks: z.string().optional(),
});

type FormData = z.infer<typeof InvoiceSchema>;

interface ExtendedContract extends Contract {
  dispatchQty: string;
  invoiceQty?: string;
  invoiceRate?: string;
  gstPercentage?: string;
  wht?: string;
  whtPercentage?: string;
  isSelected?: boolean;
  dispatchNoteId?: string;
  gstType?: string;
}

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

interface InvoiceData {
  invoiceremarks?: any;
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
    rate?: string;
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
  const [dispatchNotes, setDispatchNotes] = useState<DispatchNoteData[]>([]);
  const [gstTypes, setGstTypes] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingSellers, setFetchingSellers] = useState(false);
  const [fetchingBuyers, setFetchingBuyers] = useState(false);
  const [fetchingDispatchNotes, setFetchingDispatchNotes] = useState(false);
  const [fetchingGstTypes, setFetchingGstTypes] = useState(false);
  const [additionalContracts, setAdditionalContracts] = useState<ExtendedContract[]>([]);

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
      Remarks: '',
    },
  });

  const selectedSeller = watch('Seller');
  const selectedBuyer = watch('Buyer');

  // Fetch GST Types
  const fetchGstTypes = async () => {
    try {
      setFetchingGstTypes(true);
      const response = await getAllGeneralSaleTextTypes();
      if (response && response.data) {
        setGstTypes(
          response.data.map((item: any) => ({
            id: item.id,
            name: item.gstType,
          }))
        );
      } else {
        setGstTypes([]);
        toast('No GST types found', { type: 'warning' });
      }
    } catch (error) {
      setGstTypes([]);
      toast('Error fetching GST types', { type: 'error' });
    } finally {
      setFetchingGstTypes(false);
    }
  };

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
      const response = await getAllDispatchNotes(1, 100);
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
          invoiceRate: contract.rate || '',
          gstPercentage: contract.gst || '',
          wht: '',
          whtPercentage: '',
          isSelected: false,
          gstType: contract.gst ? gstTypes.find((gt) => gt.name === contract.gst)?.id : '',
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
              invoiceRate: relatedContract?.rate || contract.rate || '',
              gstPercentage: relatedContract?.gstPercentage || contract.gst || '',
              gstType: relatedContract?.gstPercentage
                ? gstTypes.find((gt) => gt.name === relatedContract.gstPercentage)?.id
                : contract.gst
                ? gstTypes.find((gt) => gt.name === contract.gst)?.id
                : '',
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
      setValue('Remarks', initialData.invoiceremarks || '');
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

      filtered = contracts
        .filter((contract) => {
          const matchesSellerAndBuyer =
            contract.seller === selectedSellerObj?.name &&
            contract.buyer === selectedBuyerObj?.name;
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

    setFilteredContracts([...filtered, ...additionalContracts]);
  }, [isEdit, initialData, selectedSeller, selectedBuyer, contracts, sellers, buyers, dispatchNotes, additionalContracts]);

  // Fetch data on mount
  useEffect(() => {
    fetchSellers();
    fetchBuyers();
    fetchContracts();
    fetchDispatchNotes();
    fetchGstTypes();
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
    setAdditionalContracts((prev) =>
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
    field: 'invoiceQty' | 'invoiceRate' | 'gstPercentage' | 'wht' | 'whtPercentage' | 'contractNumber' | 'gstType',
    value: string,
    isAdditional: boolean = false
  ) => {
    if (isAdditional) {
      setAdditionalContracts((prev) =>
        prev.map((contract) => {
          if (contract.id === contractId) {
            const updatedContract = { ...contract, [field]: value };
            if (field === 'gstType') {
              const selectedGst = gstTypes.find((gt) => gt.id === value);
              updatedContract.gstPercentage = selectedGst ? selectedGst.name.replace('%', '') : '';
            }
            return updatedContract;
          }
          return contract;
        })
      );
    } else {
      setContracts((prev) =>
        prev.map((contract) => {
          if (contract.id === contractId) {
            const updatedContract = { ...contract, [field]: value };
            if (field === 'gstType') {
              const selectedGst = gstTypes.find((gt) => gt.id === value);
              updatedContract.gstPercentage = selectedGst ? selectedGst.name.replace('%', '') : '';
            }
            return updatedContract;
          }
          return contract;
        })
      );
    }
  };

  // Add new contract row
  const addNewContractRow = () => {
    const newContract: ExtendedContract = {
      id: `new-${Date.now()}-${Math.random()}`,
      dispatchQty: '',
      invoiceQty: '',
      invoiceRate: '',
      gstPercentage: '',
      wht: '',
      whtPercentage: '',
      isSelected: true,
      contractNumber: '',
      date: '',
      contractType: 'Sale',
      companyId: '',
      branchId: '',
      contractOwner: '',
      seller: sellers.find((s) => s.id === selectedSeller)?.name || '',
      buyer: buyers.find((b) => b.id === selectedBuyer)?.name || '',
      deliveryDate: '',
      fabricType: '',
      descriptionId: '',
      stuff: '',
      quantity: '',
      unitOfMeasure: '',
      rate: '',
      totalAmount: '',
      gst: '',
      weftYarnType: '',
      fabricValue: '',
      gstType: '',
    };
    setAdditionalContracts((prev) => [...prev, newContract]);
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

    [...filteredContracts, ...additionalContracts].forEach((contract) => {
      const dispatchQty = parseFloat(contract.dispatchQty || '0') || 0;
      const invoiceQty = parseFloat(contract.invoiceQty || contract.dispatchQty || '0') || 0;
      const invoiceRate = parseFloat(contract.invoiceRate || contract.rate || '0') || 0;
      const gst = parseFloat(contract.gstPercentage || contract.gst || '0') || 0;
      const whtPercentage = parseFloat(contract.whtPercentage || '0') || 0;

      const invoiceValue = invoiceQty * invoiceRate;
      const gstValue = invoiceValue * (gst / 100);
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
      const relatedContracts = [...contracts, ...additionalContracts]
        .filter(
          (contract) =>
            contract.isSelected &&
            (contract.invoiceQty ||
              contract.invoiceRate ||
              contract.gstPercentage ||
              contract.wht ||
              contract.whtPercentage)
        )
        .map((contract) => {
          const invoiceQty = parseFloat(contract.invoiceQty || contract.dispatchQty || '0') || 0;
          const invoiceRate = parseFloat(contract.invoiceRate || contract.rate || '0') || 0;
          const gst = parseFloat(contract.gstPercentage || contract.gst || '0') || 0;
          const whtPercentage = parseFloat(contract.whtPercentage || '0') || 0;

          const invoiceValue = invoiceQty * invoiceRate;
          const gstValue = invoiceValue * (gst / 100);
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
              invoiceQty: contract.invoiceQty || contract.dispatchQty || '',
              invoiceRate: contract.invoiceRate || contract.rate || '',
              gst: contract.gst || '',
              gstPercentage: contract.gstPercentage || contract.gst || '',
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
            invoiceQty: contract.invoiceQty || contract.dispatchQty || '',
            invoiceRate: contract.invoiceRate || contract.rate || '',
            gst: contract.gst || '',
            gstPercentage: contract.gstPercentage || contract.gst || '',
            wht: whtValue.toFixed(2),
            whtPercentage: contract.whtPercentage || '',
          };
        });

      if (relatedContracts.length === 0) {
        toast('Please select at least one contract and fill in required fields.', {
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
        invoiceremarks: data.Remarks,
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
    <div className="container mx-auto bg-white shadow-lg rounded dark:bg-[#030630] p-4 md:p-6">
      <div className="w-full bg-[#06b6d4] h-16 md:h-[7vh] rounded dark:bg-[#387fbf] flex items-center">
        <h1 className="text-lg md:text-[23px] font-mono ml-4 md:ml-10 text-white flex items-center gap-2">
          <MdReceipt />
          {isEdit ? 'UPDATE INVOICE' : 'ADD INVOICE'}
        </h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="p-2 md:p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <CustomInput
              type="text"
              variant="floating"
              borderThickness="2"
              label="Invoice #"
              id="InvoiceNumber"
              {...register('InvoiceNumber')}
              error={errors.InvoiceNumber?.message}
              className="w-full"
            />
            <CustomSingleDatePicker
              label="Invoice Date"
              selectedDate={watch('InvoiceDate') || ''}
              onChange={(date: string) => setValue('InvoiceDate', date, { shouldValidate: true })}
              error={errors.InvoiceDate?.message}
              register={register}
              name="InvoiceDate"
              variant="floating"
              borderThickness="2"
            />
            <CustomSingleDatePicker
              label="Due Date"
              selectedDate={watch('DueDate') || ''}
              onChange={(date: string) => setValue('DueDate', date, { shouldValidate: true })}
              error={errors.DueDate?.message}
              register={register}
              name="DueDate"
              variant="floating"
              borderThickness="2"
            />
            <CustomSingleDatePicker
              label="Invoice Received Date"
              selectedDate={watch('InvoiceReceivedDate') || ''}
              onChange={(date: string | undefined) => setValue('InvoiceReceivedDate', date, { shouldValidate: true })}
              error={errors.InvoiceReceivedDate?.message}
              register={register}
              name="InvoiceReceivedDate"
              variant="floating"
              borderThickness="2"
            />
            <CustomSingleDatePicker
              label="Invoice Delivered By Date"
              selectedDate={watch('InvoiceDeliveredByDate') || ''}
              onChange={(date: string | undefined) => setValue('InvoiceDeliveredByDate', date, { shouldValidate: true })}
              error={errors.InvoiceDeliveredByDate?.message}
              register={register}
              name="InvoiceDeliveredByDate"
              variant="floating"
              borderThickness="2"
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

          {filteredContracts.length > 0 && filteredContracts.some((c) => c.isSelected) && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <CustomInput
                type="text"
                variant="floating"
                borderThickness="2"
                label="Seller Payment Term"
                id="SellerPaymentTerm"
                value={filteredContracts.find((c) => c.isSelected)?.paymentTermsSeller || ''}
                disabled
                className="w-full"
              />
              <CustomInput
                type="text"
                variant="floating"
                borderThickness="2"
                label="Buyer Payment Term"
                id="BuyerPaymentTerm"
                value={filteredContracts.find((c) => c.isSelected)?.paymentTermsBuyer || ''}
                disabled
                className="w-full"
              />
            </div>
          )}
        </div>

        <div className="p-2 md:p-4">
          <div className="flex flex-col md:flex-row justify-between items-center mb-2">
            <h2 className="text-lg md:text-xl text-[#06b6d4] font-bold dark:text-white">Related Contracts</h2>
          </div>
          <div className="mt-2 overflow-x-auto">
            {(loading || fetchingSellers || fetchingBuyers || fetchingDispatchNotes || fetchingGstTypes) ? (
              <p className="text-gray-500 text-sm md:text-base">Loading contracts, sellers, buyers, dispatch notes, or GST types...</p>
            ) : selectedSeller && selectedBuyer ? (
              [...filteredContracts, ...additionalContracts].length > 0 ? (
                <table className="w-full text-left border-collapse text-sm md:text-base">
                  <thead>
                    <tr className="bg-[#06b6d4] text-white">
                      <th className="p-2 md:p-3 font-medium">Select</th>
                      <th className="p-2 md:p-3 font-medium">Contract #</th>
                      <th className="p-2 md:p-3 font-medium">Fabric Details</th>
                      <th className="p-2 md:p-3 font-medium">Dispatch Qty</th>
                      <th className="p-2 md:p-3 font-medium">Invoice Qty</th>
                      <th className="p-2 md:p-3 font-medium">Invoice Rate</th>
                      <th className="p-2 md:p-3 font-medium">Invoice Value</th>
                      <th className="p-2 md:p-3 font-medium">GST</th>
                      <th className="p-2 md:p-3 font-medium">%</th>
                      <th className="p-2 md:p-3 font-medium">GST Value</th>
                      <th className="p-2 md:p-3 font-medium">Invoice Value with GST</th>
                      <th className="p-2 md:p-3 font-medium">WHT%</th>
                      <th className="p-2 md:p-3 font-medium">WHT Value</th>
                      <th className="p-2 md:p-3 font-medium">Total Invoice Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...filteredContracts, ...additionalContracts].map((contract, index) => {
                      const dispatchQty = parseFloat(contract.dispatchQty || '0') || 0;
                      const invoiceQty = parseFloat(contract.invoiceQty || contract.dispatchQty || '0') || 0;
                      const invoiceRate = parseFloat(contract.invoiceRate || contract.rate || '0') || 0;
                      const gst = parseFloat(contract.gstPercentage || contract.gst || '0') || 0;
                      const whtPercentage = parseFloat(contract.whtPercentage || '0') || 0;

                      const invoiceValue = invoiceQty * invoiceRate;
                      const gstValue = invoiceValue * (gst / 100);
                      const invoiceValueWithGST = invoiceValue + gstValue;
                      const whtValue = invoiceValueWithGST * (whtPercentage / 100);
                      const totalInvoiceValue = invoiceValueWithGST - whtValue;

                      const isAdditional = additionalContracts.some((c) => c.id === contract.id);

                      return (
                        <tr
                          key={contract.id}
                          className={`border-b hover:bg-gray-100 cursor-pointer ${
                            contract.isSelected ? 'bg-blue-100' : ''
                          } block md:table-row`}
                          onClick={() => handleContractSelect(contract.id, !contract.isSelected)}
                        >
                          <td className="p-2 md:p-3 block md:table-cell before:content-['Select:'] before:font-bold before:md:hidden">
                            <input
                              type="checkbox"
                              checked={contract.isSelected || false}
                              onChange={(e) => handleContractSelect(contract.id, e.target.checked)}
                              onClick={(e) => e.stopPropagation()}
                            />
                          </td>
                          <td className="p-2 md:p-3 block md:table-cell before:content-['Contract_#:'] before:font-bold before:md:hidden">
                            {isAdditional ? (
                              <input
                                type="text"
                                value={contract.contractNumber || ''}
                                onChange={(e) =>
                                  handleContractInputChange(
                                    contract.id,
                                    'contractNumber' as any,
                                    e.target.value,
                                    true
                                  )
                                }
                                className="w-full p-2 border border-gray-300 rounded"
                                onClick={(e) => e.stopPropagation()}
                              />
                            ) : (
                              contract.contractNumber || '-'
                            )}
                          </td>
                          <td className="p-2 md:p-3 block md:table-cell before:content-['Fabric_Details:'] before:font-bold before:md:hidden">
                            {getFabricDetails(contract)}
                          </td>
                          <td className="p-2 md:p-3 block md:table-cell before:content-['Dispatch_Qty:'] before:font-bold before:md:hidden">
                            {contract.dispatchQty || '-'}
                          </td>
                          <td className="p-2 md:p-3 block md:table-cell before:content-['Invoice_Qty:'] before:font-bold before:md:hidden">
                            {contract.dispatchQty || '-'}
                          </td>
                          <td className="p-2 md:p-3 block md:table-cell before:content-['Invoice_Rate:'] before:font-bold before:md:hidden">
                            <input
                              type="number"
                              value={contract.invoiceRate || contract.rate || ''}
                              onChange={(e) =>
                                handleContractInputChange(
                                  contract.id,
                                  'invoiceRate',
                                  e.target.value,
                                  isAdditional
                                )
                              }
                              className="w-full p-2 border border-gray-300 rounded"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </td>
                          <td className="p-2 md:p-3 block md:table-cell before:content-['Invoice_Value:'] before:font-bold before:md:hidden">
                            {invoiceValue.toFixed(2)}
                          </td>
                          <td className="p-2 md:p-3 block md:table-cell before:content-['GST:'] before:font-bold before:md:hidden">
                            <CustomInputDropdown
                              label=""
                              options={gstTypes}
                              selectedOption={contract.gstType || ''}
                              onChange={(value) =>
                                handleContractInputChange(contract.id, 'gstType', value, isAdditional)
                              }
                              register={register}
                            />
                          </td>
                          <td className="p-2 md:p-3 block md:table-cell before:content-['%:'] before:font-bold before:md:hidden">
                            {contract.gstPercentage || '-'}
                          </td>
                          <td className="p-2 md:p-3 block md:table-cell before:content-['GST_Value:'] before:font-bold before:md:hidden">
                            {gstValue.toFixed(2)}
                          </td>
                          <td className="p-2 md:p-3 block md:table-cell before:content-['Invoice_Value_with_GST:'] before:font-bold before:md:hidden">
                            {invoiceValueWithGST.toFixed(2)}
                          </td>
                          <td className="p-2 md:p-3 block md:table-cell before:content-['WHT%:'] before:font-bold before:md:hidden">
                            <input
                              type="number"
                              value={contract.whtPercentage || ''}
                              onChange={(e) =>
                                handleContractInputChange(
                                  contract.id,
                                  'whtPercentage',
                                  e.target.value,
                                  isAdditional
                                )
                              }
                              className="w-full p-2 border border-gray-300 rounded"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </td>
                          <td className="p-2 md:p-3 block md:table-cell before:content-['WHT_Value:'] before:font-bold before:md:hidden">
                            {whtValue.toFixed(2)}
                          </td>
                          <td className="p-2 md:p-3 block md:table-cell before:content-['Total_Invoice_Value:'] before:font-bold before:md:hidden">
                            {totalInvoiceValue.toFixed(2)}
                          </td>
                        </tr>
                      );
                    })}
                    <tr className="bg-gray-100 font-bold block md:table-row">
                      <td className="p-2 md:p-3 block md:table-cell"></td>
                      <td className="p-2 md:p-3 block md:table-cell"></td>
                      <td className="p-2 md:p-3 block md:table-cell"></td>
                      <td className="p-2 md:p-3 block md:table-cell"></td>
                      <td className="p-2 md:p-3 block md:table-cell"></td>
                      <td className="p-2 md:p-3 block md:table-cell"></td>
                      <td className="p-2 md:p-3 block md:table-cell before:content-['Invoice_Value:'] before:font-bold before:md:hidden">
                        {totalInvoiceValue.toFixed(2)}
                      </td>
                      <td className="p-2 md:p-3 block md:table-cell"></td>
                      <td className="p-2 md:p-3 block md:table-cell"></td>
                      <td className="p-2 md:p-3 block md:table-cell before:content-['GST_Value:'] before:font-bold before:md:hidden">
                        {totalGSTValue.toFixed(2)}
                      </td>
                      <td className="p-2 md:p-3 block md:table-cell"></td>
                      <td className="p-2 md:p-3 block md:table-cell"></td>
                      <td className="p-2 md:p-3 block md:table-cell"></td>
                      <td className="p-2 md:p-3 block md:table-cell before:content-['Total_Invoice_Value:'] before:font-bold before:md:hidden">
                        {totalInvoiceValueWithGST.toFixed(2)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              ) : (
                <p className="text-gray-500 text-sm md:text-base">
                  No contracts found for the selected Seller and Buyer with associated Dispatch Notes.
                </p>
              )
            ) : (
              <p className="text-gray-500 text-sm md:text-base">Please select both Seller and Buyer to view contracts.</p>
            )}
          </div>
        </div>

        <div className="w-full h-16 md:h-[8vh] flex flex-col md:flex-row justify-end gap-2 mt-3 bg-transparent border-t-2 border-[#e7e7e7] p-2 md:p-4">
          <Button
            type="submit"
            className="w-full md:w-[160px] gap-2 inline-flex items-center bg-[#0e7d90] hover:bg-[#0891b2] text-white px-6 py-2 text-sm font-medium transition-all duration-200 font-mono hover:translate-y-[-2px] focus:outline-none active:shadow-[#3c4fe0_0_3px_7px_inset] active:translate-y-[2px]"
          >
            Save
          </Button>
          <Link href="/invoice" className="w-full md:w-auto">
            <Button
              type="button"
              className="w-full md:w-[160px] gap-2 inline-flex items-center bg-black hover:bg-[#b0b0b0] text-white px-6 py-2 text-sm font-medium transition-all duration-200 font-mono hover:translate-y-[-2px] focus:outline-none active:shadow-[#3c4fe0_0_3px_7px_inset] active:translate-y-[2px]"
            >
              Cancel
            </Button>
          </Link>
        </div>
      </form>

      {/* Custom CSS for Responsive Table */}
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

export default InvoiceForm;