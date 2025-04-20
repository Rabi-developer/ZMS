'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'react-toastify';
import CustomInput from '@/components/ui/CustomInput';
import CustomInputDropdown from '@/components/ui/CustomeInputDropdown';
import { MdAddBusiness, MdAdd, MdDelete } from 'react-icons/md';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { getAllOrganization } from '@/apis/organization';
import { getAllBranch } from '@/apis/branchs';
import { getAllDescriptions } from '@/apis/description';
import { createContract, updateContract } from '@/apis/contract';
import { getAllBlendRatios } from '@/apis/blendratio';
import { getAllEndUses } from '@/apis/enduse';
import { getAllFabricTypess } from '@/apis/fabrictypes';
import { getAllPackings } from '@/apis/packing';
import { getAllPeiceLengths } from '@/apis/peicelength';
import { getAllPickInsertions } from '@/apis/pickinsertion';
import { getAllWrapYarnTypes } from '@/apis/wrapyarntype';
import { getAllWeftYarnType } from '@/apis/weftyarntype';
import { getAllWeaves } from '@/apis/weaves';
import { getAllFinal } from '@/apis/final';
import { getAllSelveges } from '@/apis/selvege';
import { getAllSelvegeWeaves } from '@/apis/selvegeweave';
import { getAllSelvegeWidths } from '@/apis/selvegewidth';
import { getAllStuffs } from '@/apis/stuff';
import { getAllSellers } from '@/apis/seller';
import { getAllBuyer } from '@/apis/buyer';

// Zod schema for form validation (unchanged)
const Schema = z.object({
  contractNumber: z.string().min(1, 'Contract Number is required'),
  date: z.string().min(1, 'Date is required'),
  contractType: z.enum(['Sale', 'Purchase'], { required_error: 'Contract Type is required' }),
  companyId: z.string().min(1, 'Company is required'),
  branchId: z.string().min(1, 'Branch is required'),
  contractOwner: z.string().min(1, 'Contract Owner is required'),
  seller: z.string().min(1, 'Seller is required'),
  buyer: z.string().min(1, 'Buyer is required'),
  referenceNumber: z.string().optional(),
  deliveryDate: z.string().min(1, 'Delivery Date is required'),
  refer: z.string().optional(),
  referdate: z.string().optional(),
  fabricType: z.string().min(1, 'Fabric Type is required'),
  descriptionId: z.string().min(1, 'Description is required'),
  stuff: z.string().min(1, 'Stuff is required'),
  blendRatio: z.string().optional(),
  blendType: z.string().optional(),
  warpCount: z.string().optional(),
  warpYarnType: z.string().optional(),
  weftCount: z.string().optional(),
  weftYarnCount: z.string().min(1, 'Weft Yarn Type is required'),
  noOfEnds: z.string().optional(),
  noOfPicks: z.string().optional(),
  weaves: z.string().optional(),
  pickInsertion: z.string().optional(),
  width: z.string().optional(),
  final: z.string().optional(),
  selvedge: z.string().optional(),
  selvedgeWeave: z.string().optional(),
  selvedgeWidth: z.string().optional(),
  quantity: z.string().min(1, 'Quantity is required'),
  unitOfMeasure: z.string().min(1, 'Unit of Measure is required'),
  tolerance: z.string().optional(),
  rate: z.string().min(1, 'Rate is required'),
  packing: z.string().optional(),
  pieceLength: z.string().optional(),
  fabricValue: z.string().min(1, 'Fabric Value is required'),
  gst: z.string().optional(),
  gstValue: z.string().optional(),
  totalAmount: z.string().min(1, 'Total Amount is required'),
  paymentTermsSeller: z.string().optional(),
  paymentTermsBuyer: z.string().optional(),
  deliveryTerms: z.string().optional(),
  commissionFrom: z.string().optional(),
  commissionType: z.string().optional(),
  commissionPercentage: z.string().optional(),
  commissionValue: z.string().optional(),
  dispatchAddress: z.string().optional(),
  sellerRemark: z.string().optional(),
  buyerRemark: z.string().optional(),
  createdBy: z.string().optional(),
  creationDate: z.string().optional(),
  updatedBy: z.string().optional(),
  updationDate: z.string().optional(),
  approvedBy: z.string().optional(),
  approvedDate: z.string().optional(),
  endUse: z.string().optional(),
  buyerDeliveryBreakups: z
    .array(
      z.object({
        qty: z.string().optional(),
        deliveryDate: z.string().optional(),
      })
    )
    .optional(),
  sellerDeliveryBreakups: z
    .array(
      z.object({
        qty: z.string().optional(),
        deliveryDate: z.string().optional(),
      })
    )
    .optional(),
  sampleDetails: z
    .array(
      z.object({
        sampleQty: z.string().optional(),
        sampleReceivedDate: z.string().optional(),
        sampleDeliveredDate: z.string().optional(),
        createdBy: z.string().optional(),
        creationDate: z.string().optional(),
        updatedBy: z.string().optional(),
        updateDate: z.string().optional(),
      })
    )
    .optional(),
});

type FormData = z.infer<typeof Schema>;

type ContractFormProps = {
  id?: string;
  initialData?: any;
};

const ContractForm = ({ id, initialData }: ContractFormProps) => {
  const router = useRouter();
  const [companies, setCompanies] = useState<{ id: string; name: string }[]>([]);
  const [branches, setBranches] = useState<{ id: string; name: string }[]>([]);
  const [descriptions, setDescriptions] = useState<{ id: string; name: string }[]>([]);
  const [blendRatios, setBlendRatios] = useState<{ id: string; name: string }[]>([]);
  const [endUses, setEndUses] = useState<{ id: string; name: string }[]>([]);
  const [fabricTypes, setFabricTypes] = useState<{ id: string; name: string }[]>([]);
  const [packings, setPackings] = useState<{ id: string; name: string }[]>([]);
  const [pieceLengths, setPieceLengths] = useState<{ id: string; name: string }[]>([]);
  const [pickInsertions, setPickInsertions] = useState<{ id: string; name: string }[]>([]);
  const [warpYarnTypes, setWarpYarnTypes] = useState<{ id: string; name: string }[]>([]);
  const [weftYarnTypes, setWeftYarnTypes] = useState<{ id: string; name: string }[]>([]);
  const [weaves, setWeaves] = useState<{ id: string; name: string }[]>([]);
  const [finals, setFinals] = useState<{ id: string; name: string }[]>([]);
  const [selvedges, setSelvedges] = useState<{ id: string; name: string }[]>([]);
  const [selvedgeWeaves, setSelvedgeWeaves] = useState<{ id: string; name: string }[]>([]);
  const [selvedgeWidths, setSelvedgeWidths] = useState<{ id: string; name: string }[]>([]);
  const [stuffs, setStuffs] = useState<{ id: string; name: string }[]>([]);
  const [sellers, setSellers] = useState<{ id: string; name: string }[]>([]);
  const [buyers, setBuyers] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [deliveryDetails, setDeliveryDetails] = useState({
    quantity: '',
    unitOfMeasure: '',
    lbs: '',
    tolerance: '',
    rate: '',
    perLbs: '',
    packing: '',
    pieceLength: '',
    payTermSeller: '',
    payTermBuyer: '',
    fabricValue: '',
    gst: '',
    gstValue: '',
    finishWidth: '',
    totalAmount: '',
    deliveryTerms: '',
    commissionFrom: '',
    commissionType: '',
    commissionPercentage: '',
    commissionValue: '',
    dispatchLater: '',
    sellerRemark: '',
    buyerRemark: '',
    deliveryDate: '',
  });
  const [notes, setNotes] = useState('');
  const [showForm, setShowForm] = useState(false);

  // Modified: Initialize with empty arrays to prevent initial rows
  const [buyerDeliveryBreakups, setBuyerDeliveryBreakups] = useState<
    { qty: string; deliveryDate: string }[]
  >([]);
  const [sellerDeliveryBreakups, setSellerDeliveryBreakups] = useState<
    { qty: string; deliveryDate: string }[]
  >([]);

  // State for Sample Details (unchanged)
  const [sampleDetails, setSampleDetails] = useState<
    {
      sampleQty: string;
      sampleReceivedDate: string;
      sampleDeliveredDate: string;
      createdBy: string;
      creationDate: string;
      updatedBy: string;
      updateDate: string;
    }[]
  >([
    {
      sampleQty: '',
      sampleReceivedDate: '',
      sampleDeliveredDate: '',
      createdBy: '',
      creationDate: '',
      updatedBy: '',
      updateDate: '',
    },
  ]);
  const [showSampleDetailsTable, setShowSampleDetailsTable] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<FormData>({
    resolver: zodResolver(Schema),
    defaultValues: initialData || {},
  });

  // Dropdown options (unchanged)
  const contractTypes = [
    { id: 'Sale', name: 'Sale' },
    { id: 'Purchase', name: 'Purchase' },
  ];
  const unitsOfMeasure = [
    { id: 'Meter', name: 'Meter' },
    { id: 'Yard', name: 'Yard' },
    { id: 'Kilogram', name: 'Kilogram' },
  ];
  const paymentTermsOptions = [
    { id: 'Immediate', name: 'Immediate' },
    { id: '30 Days', name: '30 Days' },
    { id: '60 Days', name: '60 Days' },
  ];
  const deliveryTermsOptions = [
    { id: 'FOB', name: 'FOB' },
    { id: 'CIF', name: 'CIF' },
    { id: 'EXW', name: 'EXW' },
  ];
  const commissionFromOptions = [
    { id: 'Seller', name: 'Seller' },
    { id: 'Buyer', name: 'Buyer' },
  ];
  const commissionTypeOptions = [
    { id: 'Percentage', name: 'Percentage' },
    { id: 'Fixed', name: 'Fixed' },
  ];
  const dispatchLaterOptions = [
    { id: 'Yes', name: 'Yes' },
    { id: 'No', name: 'No' },
  ];

  // Fetch data functions (unchanged)
  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const response = await getAllOrganization(1, 100);
      setCompanies(response.data.map((org: any) => ({ id: org.id, name: org.name })));
    } catch (error) {
      console.error('Error fetching companies:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBranches = async () => {
    try {
      setLoading(true);
      const response = await getAllBranch(1, 100);
      setBranches(response.data.map((branch: any) => ({ id: branch.id, name: branch.name })));
    } catch (error) {
      console.error('Error fetching branches:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDescriptions = async () => {
    try {
      setLoading(true);
      const response = await getAllDescriptions();
      setDescriptions(
        response.data.map((desc: any) => ({
          id: desc.listid,
          name: `${desc.descriptions} - ${desc.subDescription}`,
        }))
      );
    } catch (error) {
      console.error('Error fetching descriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBlendRatios = async () => {
    try {
      setLoading(true);
      const response = await getAllBlendRatios();
      setBlendRatios(
        response.data.map((item: any) => ({
          id: item.listid,
          name: `${item.descriptions} - ${item.subDescription}`,
        }))
      );
    } catch (error) {
      console.error('Error fetching blend ratios:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEndUses = async () => {
    try {
      setLoading(true);
      const response = await getAllEndUses();
      setEndUses(
        response.data.map((item: any) => ({
          id: item.listid,
          name: `${item.descriptions} - ${item.subDescription}`,
        }))
      );
    } catch (error) {
      console.error('Error fetching end uses:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFabricTypes = async () => {
    try {
      setLoading(true);
      const response = await getAllFabricTypess();
      setFabricTypes(
        response.data.map((item: any) => ({
          id: item.listid,
          name: `${item.descriptions} - ${item.subDescription}`,
        }))
      );
    } catch (error) {
      console.error('Error fetching fabric types:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPackings = async () => {
    try {
      setLoading(true);
      const response = await getAllPackings();
      setPackings(
        response.data.map((item: any) => ({
          id: item.listid,
          name: `${item.descriptions} - ${item.subDescription}`,
        }))
      );
    } catch (error) {
      console.error('Error fetching packings:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPieceLengths = async () => {
    try {
      setLoading(true);
      const response = await getAllPeiceLengths();
      setPieceLengths(
        response.data.map((item: any) => ({
          id: item.listid,
          name: `${item.descriptions} - ${item.subDescription}`,
        }))
      );
    } catch (error) {
      console.error('Error fetching piece lengths:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPickInsertions = async () => {
    try {
      setLoading(true);
      const response = await getAllPickInsertions();
      setPickInsertions(
        response.data.map((item: any) => ({
          id: item.listid,
          name: `${item.descriptions} - ${item.subDescription}`,
        }))
      );
    } catch (error) {
      console.error('Error fetching pick insertions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchWarpYarnTypes = async () => {
    try {
      setLoading(true);
      const response = await getAllWrapYarnTypes();
      setWarpYarnTypes(
        response.data.map((item: any) => ({
          id: item.listid,
          name: `${item.descriptions} - ${item.subDescription}`,
        }))
      );
    } catch (error) {
      console.error('Error fetching warp yarn types:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchWeftYarnTypes = async () => {
    try {
      setLoading(true);
      const response = await getAllWeftYarnType();
      setWeftYarnTypes(
        response.data.map((item: any) => ({
          id: item.listid,
          name: `${item.descriptions} - ${item.subDescription}`,
        }))
      );
    } catch (error) {
      console.error('Error fetching weft yarn types:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchWeaves = async () => {
    try {
      setLoading(true);
      const response = await getAllWeaves();
      setWeaves(
        response.data.map((item: any) => ({
          id: item.listid,
          name: `${item.descriptions} - ${item.subDescription}`,
        }))
      );
    } catch (error) {
      console.error('Error fetching weaves:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFinals = async () => {
    try {
      setLoading(true);
      const response = await getAllFinal();
      setFinals(
        response.data.map((item: any) => ({
          id: item.listid,
          name: `${item.descriptions} - ${item.subDescription}`,
        }))
      );
    } catch (error) {
      console.error('Error fetching finals:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSelvedges = async () => {
    try {
      setLoading(true);
      const response = await getAllSelveges();
      setSelvedges(
        response.data.map((item: any) => ({
          id: item.listid,
          name: `${item.descriptions} - ${item.subDescription}`,
        }))
      );
    } catch (error) {
      console.error('Error fetching selvedges:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSelvedgeWeaves = async () => {
    try {
      setLoading(true);
      const response = await getAllSelvegeWeaves();
      setSelvedgeWeaves(
        response.data.map((item: any) => ({
          id: item.listid,
          name: `${item.descriptions} - ${item.subDescription}`,
        }))
      );
    } catch (error) {
      console.error('Error fetching selvedge weaves:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSelvedgeWidths = async () => {
    try {
      setLoading(true);
      const response = await getAllSelvegeWidths();
      setSelvedgeWidths(
        response.data.map((item: any) => ({
          id: item.listid,
          name: `${item.descriptions} - ${item.subDescription}`,
        }))
      );
    } catch (error) {
      console.error('Error fetching selvedge widths:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStuffs = async () => {
    try {
      setLoading(true);
      const response = await getAllStuffs();
      setStuffs(
        response.data.map((item: any) => ({
          id: item.listid,
          name: `${item.descriptions} - ${item.subDescription}`,
        }))
      );
    } catch (error) {
      console.error('Error fetching stuffs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSellers = async () => {
    try {
      setLoading(true);
      const response = await getAllSellers();
      setSellers(
        response.data.map((seller: any) => ({
          id: seller.id,
          name: seller.SellerName,
        }))
      );
    } catch (error) {
      console.error('Error fetching sellers:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBuyers = async () => {
    try {
      setLoading(true);
      const response = await getAllBuyer();
      setBuyers(
        response.data.map((buyer: any) => ({
          id: buyer.id,
          name: buyer.BuyerName,
        }))
      );
    } catch (error) {
      console.error('Error fetching buyers:', error);
    } finally {
      setLoading(false);
    }
  };

  const companyId = watch('companyId');
  const branchId = watch('branchId');
  useEffect(() => {
    setShowForm(!!companyId && !!branchId);
  }, [companyId, branchId]);

  useEffect(() => {
    fetchCompanies();
    fetchBranches();
    fetchDescriptions();
    fetchBlendRatios();
    fetchEndUses();
    fetchFabricTypes();
    fetchPackings();
    fetchPieceLengths();
    fetchPickInsertions();
    fetchWarpYarnTypes();
    fetchWeftYarnTypes();
    fetchWeaves();
    fetchFinals();
    fetchSelvedges();
    fetchSelvedgeWeaves();
    fetchSelvedgeWidths();
    fetchStuffs();
    fetchSellers();
    fetchBuyers();
    if (initialData) {
      reset({
        ...initialData,
        contractType:
          initialData.contractType === 'Sale' || initialData.contractType === 'Purchase'
            ? initialData.contractType
            : 'Sale',
      });
      if (initialData.buyerDeliveryBreakups) {
        setBuyerDeliveryBreakups(initialData.buyerDeliveryBreakups);
      }
      if (initialData.sellerDeliveryBreakups) {
        setSellerDeliveryBreakups(initialData.sellerDeliveryBreakups);
      }
      if (initialData.sampleDetails) {
        setSampleDetails(initialData.sampleDetails);
        setShowSampleDetailsTable(true);
      }
    }
  }, [initialData, reset]);

  const handleDeliveryDetailChange = (field: string, value: string) => {
    setDeliveryDetails((prev) => {
      const updatedDetails = { ...prev, [field]: value };

      if (field === 'commissionPercentage' && value) {
        const commissionPercentage = parseFloat(value);
        const fabricValue = parseFloat(updatedDetails.fabricValue || '0');
        const commissionValue = (fabricValue * commissionPercentage) / 100;
        updatedDetails.commissionValue = commissionValue.toFixed(2);
      }

      return updatedDetails;
    });
  };

  const addBuyerDeliveryBreakup = () => {
    setBuyerDeliveryBreakups([...buyerDeliveryBreakups, { qty: '', deliveryDate: '' }]);
  };

  const removeBuyerDeliveryBreakup = (index: number) => {
    setBuyerDeliveryBreakups(buyerDeliveryBreakups.filter((_, i) => i !== index));
  };

  const handleBuyerDeliveryBreakupChange = (index: number, field: string, value: string) => {
    const updatedBreakups = [...buyerDeliveryBreakups];
    updatedBreakups[index] = { ...updatedBreakups[index], [field]: value };
    setBuyerDeliveryBreakups(updatedBreakups);
  };

  const addSellerDeliveryBreakup = () => {
    setSellerDeliveryBreakups([...sellerDeliveryBreakups, { qty: '', deliveryDate: '' }]);
  };

  const removeSellerDeliveryBreakup = (index: number) => {
    setSellerDeliveryBreakups(sellerDeliveryBreakups.filter((_, i) => i !== index));
  };

  const handleSellerDeliveryBreakupChange = (index: number, field: string, value: string) => {
    const updatedBreakups = [...sellerDeliveryBreakups];
    updatedBreakups[index] = { ...updatedBreakups[index], [field]: value };
    setSellerDeliveryBreakups(updatedBreakups);
  };

  const addSampleDetail = () => {
    setSampleDetails([
      ...sampleDetails,
      {
        sampleQty: '',
        sampleReceivedDate: '',
        sampleDeliveredDate: '',
        createdBy: '',
        creationDate: '',
        updatedBy: '',
        updateDate: '',
      },
    ]);
  };

  const removeSampleDetail = (index: number) => {
    setSampleDetails(sampleDetails.filter((_, i) => i !== index));
  };

  const handleSampleDetailChange = (index: number, field: string, value: string) => {
    const updatedSampleDetails = [...sampleDetails];
    updatedSampleDetails[index] = { ...updatedSampleDetails[index], [field]: value };
    setSampleDetails(updatedSampleDetails);
  };

  const onSubmit = async (data: FormData) => {
    try {
      const payload = {
        ...data,
        deliveryDetails,
        notes,
        buyerDeliveryBreakups,
        sellerDeliveryBreakups,
        sampleDetails,
      };
      let response;
      if (id) {
        response = await updateContract(id, payload);
        toast('Contract Updated Successfully', { type: 'success' });
      } else {
        response = await createContract(payload);
        toast('Contract Created Successfully', { type: 'success' });
      }
      reset();
      router.push('/contracts');
    } catch (error) {
      toast('Error submitting contract', { type: 'error' });
      console.error('Error submitting form:', error);
    }
  };

  return (
    <div className="container mx-auto bg-white shadow-lg rounded dark:bg-[#030630]">
      <div className="w-full bg-[#06b6d4] h-[7vh] rounded dark:bg-[#387fbf]">
        <h1 className="text-base text-[23px] font-mono ml-10 mt-8 pt-3 text-white flex gap-2">
          <MdAddBusiness />
          {id ? 'EDIT CONTRACT' : 'ADD NEW CONTRACT'}
        </h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="p-2 w-full">
          <div className="p-4">
            <div className="grid grid-cols-2 gap-4">
              <CustomInputDropdown
                label="Company"
                options={companies}
                selectedOption={watch('companyId') || ''}
                onChange={(value) => setValue('companyId', value, { shouldValidate: true })}
                error={errors.companyId?.message}
                register={register}
              />
              <CustomInputDropdown
                label="Branch"
                options={branches}
                selectedOption={watch('branchId') || ''}
                onChange={(value) => setValue('branchId', value, { shouldValidate: true })}
                error={errors.branchId?.message}
                register={register}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <CustomInput
                variant="floating"
                borderThickness="2"
                label="Contract Number"
                id="contractNumber"
                {...register('contractNumber')}
                error={errors.contractNumber?.message}
              />
              <CustomInput
                type="date"
                variant="floating"
                borderThickness="2"
                label="Date"
                id="date"
                {...register('date')}
                error={errors.date?.message}
              />
              <CustomInputDropdown
                label="Contract Type"
                options={contractTypes}
                selectedOption={watch('contractType') || 'Sale'}
                onChange={(value) =>
                  setValue('contractType', value as 'Sale' | 'Purchase', { shouldValidate: true })
                }
                error={errors.contractType?.message}
                register={register}
              />
              <CustomInput
                variant="floating"
                borderThickness="2"
                label="Contract Owner"
                id="contractOwner"
                {...register('contractOwner')}
                error={errors.contractOwner?.message}
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
            </div>
            <div className="grid grid-cols-3 gap-4">
              <CustomInput
                variant="floating"
                borderThickness="2"
                label="Reference #"
                id="referenceNumber"
                {...register('referenceNumber')}
                error={errors.referenceNumber?.message}
              />
              <CustomInput
                type="date"
                variant="floating"
                borderThickness="2"
                label="Delivery Date"
                id="deliveryDate"
                {...register('deliveryDate')}
                error={errors.deliveryDate?.message}
              />
              <CustomInput
                variant="floating"
                borderThickness="2"
                label="Refer.#"
                id="refer"
                {...register('refer')}
                error={errors.refer?.message}
              />
              <CustomInput
                type="date"
                variant="floating"
                borderThickness="2"
                label="Delivery Date"
                id="referdate"
                {...register('referdate')}
                error={errors.referdate?.message}
              />
            </div>
          </div>

          {showForm && (
            <>
              <div className="p-4 border rounded-2xl mx-auto">
                <h2 className="text-xl text-[#06b6d4] font-bold dark:text-white">Items</h2>
                <div className="grid grid-cols-3 gap-4">
                  <CustomInputDropdown
                    label="Description"
                    options={descriptions}
                    selectedOption={watch('descriptionId') || ''}
                    onChange={(value) => setValue('descriptionId', value, { shouldValidate: true })}
                    error={errors.descriptionId?.message}
                    register={register}
                  />
                  <CustomInputDropdown
                    label="Stuff"
                    options={stuffs}
                    selectedOption={watch('stuff') || ''}
                    onChange={(value) => setValue('stuff', value, { shouldValidate: true })}
                    error={errors.stuff?.message}
                    register={register}
                  />
                  <CustomInputDropdown
                    label="Blend Ratio"
                    options={blendRatios}
                    selectedOption={watch('blendRatio') || ''}
                    onChange={(value) => setValue('blendRatio', value, { shouldValidate: true })}
                    error={errors.blendRatio?.message}
                    register={register}
                  />
                  <CustomInput
                    variant="floating"
                    borderThickness="2"
                    label="Blend Type"
                    id="blendType"
                    {...register('blendType')}
                    error={errors.blendType?.message}
                  />
                  <CustomInput
                    variant="floating"
                    borderThickness="2"
                    label="Warp Count"
                    id="warpCount"
                    {...register('warpCount')}
                    error={errors.warpCount?.message}
                  />
                  <CustomInputDropdown
                    label="Warp Yarn Type"
                    options={warpYarnTypes}
                    selectedOption={watch('warpYarnType') || ''}
                    onChange={(value) => setValue('warpYarnType', value, { shouldValidate: true })}
                    error={errors.warpYarnType?.message}
                    register={register}
                  />
                  <CustomInput
                    variant="floating"
                    borderThickness="2"
                    label="Weft Count"
                    id="weftCount"
                    {...register('weftCount')}
                    error={errors.weftCount?.message}
                  />
                  <CustomInput
                    type="number"
                    variant="floating"
                    borderThickness="2"
                    label="No. of Ends"
                    id="noOfEnds"
                    {...register('noOfEnds')}
                    error={errors.noOfEnds?.message}
                  />
                  <CustomInput
                    type="number"
                    variant="floating"
                    borderThickness="2"
                    label="No. of Picks"
                    id="noOfPicks"
                    {...register('noOfPicks')}
                    error={errors.noOfPicks?.message}
                  />
                  <CustomInputDropdown
                    label="Weaves"
                    options={weaves}
                    selectedOption={watch('weaves') || ''}
                    onChange={(value) => setValue('weaves', value, { shouldValidate: true })}
                    error={errors.weaves?.message}
                    register={register}
                  />
                  <CustomInputDropdown
                    label="Pick Insertion"
                    options={pickInsertions}
                    selectedOption={watch('pickInsertion') || ''}
                    onChange={(value) => setValue('pickInsertion', value, { shouldValidate: true })}
                    error={errors.pickInsertion?.message}
                    register={register}
                  />
                  <CustomInput
                    type="number"
                    variant="floating"
                    borderThickness="2"
                    label="Width"
                    id="width"
                    {...register('width')}
                    error={errors.width?.message}
                  />
                  <CustomInputDropdown
                    label="Final"
                    options={finals}
                    selectedOption={watch('final') || ''}
                    onChange={(value) => setValue('final', value, { shouldValidate: true })}
                    error={errors.final?.message}
                    register={register}
                  />
                  <CustomInputDropdown
                    label="Selvedge"
                    options={selvedges}
                    selectedOption={watch('selvedge') || ''}
                    onChange={(value) => setValue('selvedge', value, { shouldValidate: true })}
                    error={errors.selvedge?.message}
                    register={register}
                  />
                  <CustomInputDropdown
                    label="Selvedge Weave"
                    options={selvedgeWeaves}
                    selectedOption={watch('selvedgeWeave') || ''}
                    onChange={(value) => setValue('selvedgeWeave', value, { shouldValidate: true })}
                    error={errors.selvedgeWeave?.message}
                    register={register}
                  />
                  <CustomInputDropdown
                    label="Selvedge Width"
                    options={selvedgeWidths}
                    selectedOption={watch('selvedgeWidth') || ''}
                    onChange={(value) => setValue('selvedgeWidth', value, { shouldValidate: true })}
                    error={errors.selvedgeWidth?.message}
                    register={register}
                  />
                  <CustomInputDropdown
                    label="End Use"
                    options={endUses}
                    selectedOption={watch('endUse') || ''}
                    onChange={(value) => setValue('endUse', value, { shouldValidate: true })}
                    error={errors.endUse?.message}
                    register={register}
                  />
                  <CustomInputDropdown
                    label="Weft Yarn Type"
                    options={weftYarnTypes}
                    selectedOption={watch('weftYarnCount') || ''}
                    onChange={(value) => setValue('weftYarnCount', value, { shouldValidate: true })}
                    error={errors.weftYarnCount?.message}
                    register={register}
                  />
                  <CustomInputDropdown
                    label="Fabric Type"
                    options={fabricTypes}
                    selectedOption={watch('fabricType') || ''}
                    onChange={(value) => setValue('fabricType', value, { shouldValidate: true })}
                    error={errors.fabricType?.message}
                    register={register}
                  />
                </div>
              </div>

              <div className="p-4">
                <h2 className="text-xl font-bold text-black dark:text-white">Delivery Details</h2>
                <div className="grid grid-cols-4 gap-4 border rounded p-4">
                  <CustomInput
                    variant="floating"
                    borderThickness="2"
                    label="Quantity"
                    value={deliveryDetails.quantity}
                    onChange={(e) => handleDeliveryDetailChange('quantity', e.target.value)}
                  />
                  <CustomInputDropdown
                    label="Unit of Measure"
                    options={unitsOfMeasure}
                    selectedOption={deliveryDetails.unitOfMeasure || ''}
                    onChange={(value) => handleDeliveryDetailChange('unitOfMeasure', value)}
                  />
                  <CustomInput
                    variant="floating"
                    borderThickness="2"
                    label="LBS"
                    value={deliveryDetails.lbs}
                    onChange={(e) => handleDeliveryDetailChange('lbs', e.target.value)}
                  />
                  <CustomInput
                    variant="floating"
                    borderThickness="2"
                    label="Tolerance (%)"
                    value={deliveryDetails.tolerance}
                    onChange={(e) => handleDeliveryDetailChange('tolerance', e.target.value)}
                  />
                  <CustomInput
                    variant="floating"
                    borderThickness="2"
                    label="Rate"
                    value={deliveryDetails.rate}
                    onChange={(e) => handleDeliveryDetailChange('rate', e.target.value)}
                  />
                  <CustomInput
                    variant="floating"
                    borderThickness="2"
                    label="/LBS"
                    value={deliveryDetails.perLbs}
                    onChange={(e) => handleDeliveryDetailChange('perLbs', e.target.value)}
                  />
                  <CustomInputDropdown
                    label="Packing"
                    options={packings}
                    selectedOption={deliveryDetails.packing || ''}
                    onChange={(value) => handleDeliveryDetailChange('packing', value)}
                  />
                  <CustomInputDropdown
                    label="Piece Length"
                    options={pieceLengths}
                    selectedOption={deliveryDetails.pieceLength || ''}
                    onChange={(value) => handleDeliveryDetailChange('pieceLength', value)}
                  />
                  <CustomInputDropdown
                    label="Pay Term Seller"
                    options={paymentTermsOptions}
                    selectedOption={deliveryDetails.payTermSeller || ''}
                    onChange={(value) => handleDeliveryDetailChange('payTermSeller', value)}
                  />
                  <CustomInputDropdown
                    label="Pay Term Buyer"
                    options={paymentTermsOptions}
                    selectedOption={deliveryDetails.payTermBuyer || ''}
                    onChange={(value) => handleDeliveryDetailChange('payTermBuyer', value)}
                  />
                  <CustomInput
                    variant="floating"
                    borderThickness="2"
                    label="Fabric Value"
                    value={deliveryDetails.fabricValue}
                    onChange={(e) => handleDeliveryDetailChange('fabricValue', e.target.value)}
                  />
                  <CustomInput
                    variant="floating"
                    borderThickness="2"
                    label="GST (%)"
                    value={deliveryDetails.gst}
                    onChange={(e) => handleDeliveryDetailChange('gst', e.target.value)}
                  />
                  <CustomInput
                    variant="floating"
                    borderThickness="2"
                    label="GST Value"
                    value={deliveryDetails.gstValue}
                    onChange={(e) => handleDeliveryDetailChange('gstValue', e.target.value)}
                  />
                  <CustomInput
                    variant="floating"
                    borderThickness="2"
                    label="Finish Width"
                    value={deliveryDetails.finishWidth}
                    onChange={(e) => handleDeliveryDetailChange('finishWidth', e.target.value)}
                  />
                  <CustomInput
                    variant="floating"
                    borderThickness="2"
                    label="Total Amount"
                    value={deliveryDetails.totalAmount}
                    onChange={(e) => handleDeliveryDetailChange('totalAmount', e.target.value)}
                  />
                  <CustomInputDropdown
                    label="Delivery Terms"
                    options={deliveryTermsOptions}
                    selectedOption={deliveryDetails.deliveryTerms || ''}
                    onChange={(value) => handleDeliveryDetailChange('deliveryTerms', value)}
                  />
                  <CustomInputDropdown
                    label="Commission From"
                    options={commissionFromOptions}
                    selectedOption={deliveryDetails.commissionFrom || ''}
                    onChange={(value) => handleDeliveryDetailChange('commissionFrom', value)}
                  />
                  <CustomInputDropdown
                    label="Commission Type"
                    options={commissionTypeOptions}
                    selectedOption={deliveryDetails.commissionType || ''}
                    onChange={(value) => handleDeliveryDetailChange('commissionType', value)}
                  />
                  <CustomInput
                    variant="floating"
                    borderThickness="2"
                    label="Commission (%)"
                    value={deliveryDetails.commissionPercentage}
                    onChange={(e) => handleDeliveryDetailChange('commissionPercentage', e.target.value)}
                  />
                  <CustomInput
                    variant="floating"
                    borderThickness="2"
                    label="Commission Value"
                    value={deliveryDetails.commissionValue}
                    onChange={(e) => handleDeliveryDetailChange('commissionValue', e.target.value)}
                    disabled
                  />
                  <CustomInputDropdown
                    label="Dispatch Later"
                    options={dispatchLaterOptions}
                    selectedOption={deliveryDetails.dispatchLater || ''}
                    onChange={(value) => handleDeliveryDetailChange('dispatchLater', value)}
                  />
                  <CustomInput
                    variant="floating"
                    borderThickness="2"
                    label="Seller Remark"
                    value={deliveryDetails.sellerRemark}
                    onChange={(e) => handleDeliveryDetailChange('sellerRemark', e.target.value)}
                  />
                  <CustomInput
                    variant="floating"
                    borderThickness="2"
                    label="Buyer Remark"
                    value={deliveryDetails.buyerRemark}
                    onChange={(e) => handleDeliveryDetailChange('buyerRemark', e.target.value)}
                  />
                  <CustomInput
                    type="date"
                    variant="floating"
                    borderThickness="2"
                    label="Delivery Date"
                    value={deliveryDetails.deliveryDate}
                    onChange={(e) => handleDeliveryDetailChange('deliveryDate', e.target.value)}
                  />
                </div>
              </div>

              {/* Modified: Buyer Delivery Breakups - Always show header, rows only when array has entries */}
              <div className="p-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-black dark:text-white">
                    Buyer Delivery Breakups
                  </h2>
                  <Button
                    type="button"
                    onClick={addBuyerDeliveryBreakup}
                    className="bg-[#06b6d4] hover:bg-[#0891b2] text-white px-4 py-2 rounded flex items-center gap-2"
                  >
                    <MdAdd /> Add Row
                  </Button>
                </div>
                <div className="border rounded p-4 mt-2">
                  <div className="grid grid-cols-3 gap-4 font-bold">
                    <div>Qty</div>
                    <div>Del. Date</div>
                    <div>Actions</div>
                  </div>
                  {buyerDeliveryBreakups.length > 0 && (
                    <>
                      {buyerDeliveryBreakups.map((breakup, index) => (
                        <div key={index} className="grid grid-cols-3 gap-4 mt-2 items-center">
                          <CustomInput
                            variant="floating"
                            borderThickness="2"
                            label="Qty"
                            value={breakup.qty}
                            onChange={(e) =>
                              handleBuyerDeliveryBreakupChange(index, 'qty', e.target.value)
                            }
                          />
                          <CustomInput
                            type="date"
                            variant="floating"
                            borderThickness="2"
                            label="Del. Date"
                            value={breakup.deliveryDate}
                            onChange={(e) =>
                              handleBuyerDeliveryBreakupChange(index, 'deliveryDate', e.target.value)
                            }
                          />
                          <Button
                            type="button"
                            onClick={() => removeBuyerDeliveryBreakup(index)}
                            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded flex items-center gap-2"
                          >
                            <MdDelete /> Delete
                          </Button>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </div>

              {/* Modified: Seller Delivery Breakups - Always show header, rows only when array has entries */}
              <div className="p-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-black dark:text-white">
                    Seller Delivery Breakups
                  </h2>
                  <Button
                    type="button"
                    onClick={addSellerDeliveryBreakup}
                    className="bg-[#06b6d4] hover:bg-[#0891b2] text-white px-4 py-2 rounded flex items-center gap-2"
                  >
                    <MdAdd /> Add Row
                  </Button>
                </div>
                <div className="border rounded p-4 mt-2">
                  <div className="grid grid-cols-3 gap-4 font-bold">
                    <div>Qty</div>
                    <div>Del. Date</div>
                    <div>Actions</div>
                  </div>
                  {sellerDeliveryBreakups.length > 0 && (
                    <>
                      {sellerDeliveryBreakups.map((breakup, index) => (
                        <div key={index} className="grid grid-cols-3 gap-4 mt-2 items-center">
                          <CustomInput
                            variant="floating"
                            borderThickness="2"
                            label="Qty"
                            value={breakup.qty}
                            onChange={(e) =>
                              handleSellerDeliveryBreakupChange(index, 'qty', e.target.value)
                            }
                          />
                          <CustomInput
                            type="date"
                            variant="floating"
                            borderThickness="2"
                            label="Del. Date"
                            value={breakup.deliveryDate}
                            onChange={(e) =>
                              handleSellerDeliveryBreakupChange(index, 'deliveryDate', e.target.value)
                            }
                          />
                          <Button
                            type="button"
                            onClick={() => removeSellerDeliveryBreakup(index)}
                            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded flex items-center gap-2"
                          >
                            <MdDelete /> Delete
                          </Button>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </div>

              <div className="p-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-black dark:text-white">Sample Details</h2>
                  <Button
                    type="button"
                    onClick={() => {
                      setShowSampleDetailsTable(true);
                      if (sampleDetails.length === 0) {
                        addSampleDetail();
                      }
                    }}
                    className="bg-[#0e7d90] hover:bg-[#0899b2] text-white px-4 py-2 rounded flex items-center gap-2"
                  >
                    <MdAdd /> Add Sample Details
                  </Button>
                </div>
                {showSampleDetailsTable && (
                  <div className="border rounded p-4 mt-2">
                    <div className="flex justify-between items-center mb-4">
                      <div />
                      <Button
                        type="button"
                        onClick={addSampleDetail}
                        className="bg-[#06b6d4] hover:bg-[#0891b2] text-white px-4 py-2 rounded flex items-center gap-2"
                      >
                        <MdAdd /> Add Row
                      </Button>
                    </div>
                    <div className="grid grid-cols-8 gap-4 font-bold">
                      <div>Sample Qty</div>
                      <div>Received Date</div>
                      <div>Delivered Date</div>
                      <div>Created By</div>
                      <div>Creation Date</div>
                      <div>Updated By</div>
                      <div>Update Date</div>
                      <div>Actions</div>
                    </div>
                    {sampleDetails.map((sample, index) => (
                      <div key={index} className="grid grid-cols-8 gap-4 mt-2 items-center">
                        <CustomInput
                          type="number"
                          variant="floating"
                          borderThickness="2"
                          label=""
                          value={sample.sampleQty}
                          onChange={(e) =>
                            handleSampleDetailChange(index, 'sampleQty', e.target.value)
                          }
                        />
                        <CustomInput
                          type="date"
                          variant="floating"
                          borderThickness="2"
                          label=""
                          value={sample.sampleReceivedDate}
                          onChange={(e) =>
                            handleSampleDetailChange(index, 'sampleReceivedDate', e.target.value)
                          }
                        />
                        <CustomInput
                          type="date"
                          variant="floating"
                          borderThickness="2"
                          label=""
                          value={sample.sampleDeliveredDate}
                          onChange={(e) =>
                            handleSampleDetailChange(index, 'sampleDeliveredDate', e.target.value)
                          }
                        />
                        <CustomInput
                          variant="floating"
                          borderThickness="2"
                          label=""
                          value={sample.createdBy}
                          onChange={(e) =>
                            handleSampleDetailChange(index, 'createdBy', e.target.value)
                          }
                        />
                        <CustomInput
                          type="date"
                          variant="floating"
                          borderThickness="2"
                          label=""
                          value={sample.creationDate}
                          onChange={(e) =>
                            handleSampleDetailChange(index, 'creationDate', e.target.value)
                          }
                        />
                        <CustomInput
                          variant="floating"
                          borderThickness="2"
                          label=""
                          value={sample.updatedBy}
                          onChange={(e) =>
                            handleSampleDetailChange(index, 'updatedBy', e.target.value)
                          }
                        />
                        <CustomInput
                          type="date"
                          variant="floating"
                          borderThickness="2"
                          label=""
                          value={sample.updateDate}
                          onChange={(e) =>
                            handleSampleDetailChange(index, 'updateDate', e.target.value)
                          }
                        />
                        <Button
                          type="button"
                          onClick={() => removeSampleDetail(index)}
                          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded flex items-center gap-2"
                        >
                          <MdDelete /> Delete
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <div className="w-full h-[8vh] flex justify-end gap-2 mt-3 bg-transparent border-t-2 border-[#e7e7e7]">
          <Button
            type="submit"
            className="w-[160] gap-2 inline-flex items-center bg-[#0e7d90] hover:bg-[#0891b2] text-white px-6 py-2 text-sm font-medium transition-all duration-200 font-mono text-base hover:translate-y-[-2px] focus:outline-none active:shadow-[#3c4fe0_0_3px_7px_inset] active:translate-y-[2px] mt-2"
            disabled={!showForm}
          >
            {id ? 'Update' : 'Save'}
          </Button>
          <Link href="/contracts">
            <Button
              type="button"
              className="w-[160] gap-2 mr-2 inline-flex items-center bg-black hover:bg-[#b0b0b0] text-white px-6 py-2 text-sm font-medium transition-all duration-200 font-mono text-base hover:translate-y-[-2px] focus:outline-none active:shadow-[#3c4fe0_0_3px_7px_inset] active:translate-y-[2px] mt-2"
            >
              Cancel
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
};

export default ContractForm;