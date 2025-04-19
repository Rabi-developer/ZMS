'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'react-toastify';
import CustomInput from '@/components/ui/CustomInput';
import CustomInputDropdown from '@/components/ui/CustomeInputDropdown';
import { MdAddBusiness } from 'react-icons/md';
import { AiOutlinePlus, AiOutlineDelete } from 'react-icons/ai';
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
import { getAllSelveges }from '@/apis/selvege';
import { getAllSelvegeWeaves } from '@/apis/selvegeweave';
import { getAllSelvegeWidths } from '@/apis/selvegewidth';
import { getAllStuffs } from '@/apis/stuff';
import { getAllSellers } from '@/apis/seller';
import { getAllBuyer } from '@/apis/buyer';

// Zod schema for form validation
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
  refer:z.string().optional(),
  referdate:z.string().optional(),
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
  const [items, setItems] = useState([{ description: '', quantity: '', deliveryDate: '' }]);
  const [notes, setNotes] = useState('');
  const [showForm, setShowForm] = useState(false);

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

  // Dropdown options
  const contractTypes = [
    { id: 'Sale', name: 'Sale' },
    { id: 'Purchase', name: 'Purchase' },
  ];

  const unitsOfMeasure = [
    { id: 'Meter', name: 'Meter' },
    { id: 'Yard', name: 'Yard' },
    { id: 'Kilogram', name: 'Kilogram' },
  ];

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
        contractType: initialData.contractType === 'Sale' || initialData.contractType === 'Purchase' ? initialData.contractType : 'Sale',
      });
    }
  }, [initialData, reset]);

  const addItem = () => {
    setItems([...items, { description: '', quantity: '', deliveryDate: '' }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: string, value: string) => {
    const updatedItems = [...items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setItems(updatedItems);
  };

  const onSubmit = async (data: FormData) => {
    try {
      const payload = { ...data, items, notes };
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
          {/* Basic Information */}
          <div className="p-4">

            {/* <h2 className="text-xl font-bold text-black dark:text-white">Basic Contract Information</h2> */}
            <div className='grid grid-cols-2 gap-4' >
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
                onChange={(value) => setValue('contractType', value as 'Sale' | 'Purchase', { shouldValidate: true })}
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
            <div className='grid grid-cols-3 gap-4'>
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
                    label="Finanl"
                    options={finals}
                    selectedOption={watch('final') || ''}
                    onChange={(value) => setValue('final', value, { shouldValidate: true })}
                    error={errors.final?.message}
                    register={register}
                  />
                  <CustomInputDropdown
                    label="Selvege"
                    options={selvedges}
                    selectedOption={watch('selvedge') || ''}
                    onChange={(value) => setValue('selvedge', value, { shouldValidate: true })}
                    error={errors.selvedge?.message}
                    register={register}
                  />
                  <CustomInputDropdown
                    label="Selvege Weave"
                    options={selvedgeWeaves}
                    selectedOption={watch('selvedgeWeave') || ''}
                    onChange={(value) => setValue('selvedgeWeave', value, { shouldValidate: true })}
                    error={errors.selvedgeWeave?.message}
                    register={register}
                  />
                  <CustomInputDropdown
                    label="Selvege Width"
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
                   {/* <CustomInput
                        variant="floating"
                        borderThickness="2"
                        label="Item Description"
                        value={item.description}
                        onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                      /> */}
                </div>
              </div>

              {/* Seller/Buyer Delivery Breakups */}
              <div className="p-4">
                <h2 className="text-xl font-bold text-black dark:text-white">Delivery Breakups</h2>
                {items.map((item, index) => (
                  <div key={index} className="flex items-center gap-2 mb-4">
                    <div className="grid grid-cols-3 gap-4 w-full">
                      
                      <CustomInput
                        variant="floating"
                        borderThickness="2"
                        label="Quantity"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                      />
                      <CustomInputDropdown
                      label="Unit of Measure"
                      options={unitsOfMeasure}
                      selectedOption={watch('unitOfMeasure') || ''}
                      onChange={(value) => setValue('unitOfMeasure', value, { shouldValidate: true })}
                      error={errors.unitOfMeasure?.message}
                      register={register}
                    />
                    

                      <CustomInput
                        type="date"
                        variant="floating"
                        borderThickness="2"
                        label="Delivery Date"
                        value={item.deliveryDate}
                        onChange={(e) => handleItemChange(index, 'deliveryDate', e.target.value)}
                      />
                    </div>
                    <div className="mt-8 gap-4">
                      {index > 0 && (
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="p-2 bg-red-500 hover:bg-red-600 text-white rounded"
                        >
                          <AiOutlineDelete size={20} />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={addItem}
                        className="p-2 bg-green-500 hover:bg-green-600 text-white rounded ml-4"
                      >
                        <AiOutlinePlus size={20} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Financial Details */}
              <div className="p-4 border rounded-2xl mx-auto">
                <h2 className="text-xl font-bold text-black dark:text-white">Financial Details</h2>
                <div className="grid grid-cols-3 gap-4">
                  <CustomInput
                    variant="floating"
                    borderThickness="2"
                    label="Quantity"
                    id="quantity"
                    {...register('quantity')}
                    error={errors.quantity?.message}
                  />
                 
                  <CustomInput
                    variant="floating"
                    borderThickness="2"
                    label="Tolerance (%)"
                    id="tolerance"
                    {...register('tolerance')}
                    error={errors.tolerance?.message}
                  />
                  <CustomInput
                    variant="floating"
                    borderThickness="2"
                    label="Rate"
                    id="rate"
                    {...register('rate')}
                    error={errors.rate?.message}
                  />
                  <CustomInput
                    variant="floating"
                    borderThickness="2"
                    label="Fabric Value"
                    id="fabricValue"
                    {...register('fabricValue')}
                    error={errors.fabricValue?.message}
                  />
                  <CustomInput
                    variant="floating"
                    borderThickness="2"
                    label="GST (%)"
                    id="gst"
                    {...register('gst')}
                    error={errors.gst?.message}
                  />
                  <CustomInput
                    variant="floating"
                    borderThickness="2"
                    label="GST Value"
                    id="gstValue"
                    {...register('gstValue')}
                    error={errors.gstValue?.message}
                  />
                  <CustomInput
                    variant="floating"
                    borderThickness="2"
                    label="Total Amount"
                    id="totalAmount"
                    {...register('totalAmount')}
                    error={errors.totalAmount?.message}
                  />
                </div>
              </div>

              {/* Additional Information */}
              <div className="p-4">
                <h2 className="text-xl font-bold text-black dark:text-white">Additional Information</h2>
                <div className="grid grid-cols-3 gap-4">
                  <CustomInputDropdown
                    label="Packing"
                    options={packings}
                    selectedOption={watch('packing') || ''}
                    onChange={(value) => setValue('packing', value, { shouldValidate: true })}
                    error={errors.packing?.message}
                    register={register}
                  />
                  <CustomInputDropdown
                    label="Piece Length"
                    options={pieceLengths}
                    selectedOption={watch('pieceLength') || ''}
                    onChange={(value) => setValue('pieceLength', value, { shouldValidate: true })}
                    error={errors.pieceLength?.message}
                    register={register}
                  />
                  <CustomInput
                    variant="floating"
                    borderThickness="2"
                    label="Payment Terms (Seller)"
                    id="paymentTermsSeller"
                    {...register('paymentTermsSeller')}
                    error={errors.paymentTermsSeller?.message}
                  />
                  <CustomInput
                    variant="floating"
                    borderThickness="2"
                    label="Payment Terms (Buyer)"
                    id="paymentTermsBuyer"
                    {...register('paymentTermsBuyer')}
                    error={errors.paymentTermsBuyer?.message}
                  />
                  <CustomInput
                    variant="floating"
                    borderThickness="2"
                    label="Delivery Terms"
                    id="deliveryTerms"
                    {...register('deliveryTerms')}
                    error={errors.deliveryTerms?.message}
                  />
                  <CustomInput
                    variant="floating"
                    borderThickness="2"
                    label="Commission From"
                    id="commissionFrom"
                    {...register('commissionFrom')}
                    error={errors.commissionFrom?.message}
                  />
                  <CustomInput
                    variant="floating"
                    borderThickness="2"
                    label="Commission Type"
                    id="commissionType"
                    {...register('commissionType')}
                    error={errors.commissionType?.message}
                  />
                  <CustomInput
                    variant="floating"
                    borderThickness="2"
                    label="Commission (%)"
                    id="commissionPercentage"
                    {...register('commissionPercentage')}
                    error={errors.commissionPercentage?.message}
                  />
                  <CustomInput
                    variant="floating"
                    borderThickness="2"
                    label="Commission Value"
                    id="commissionValue"
                    {...register('commissionValue')}
                    error={errors.commissionValue?.message}
                  />
                  <CustomInput
                    variant="floating"
                    borderThickness="2"
                    label="Dispatch Address"
                    id="dispatchAddress"
                    {...register('dispatchAddress')}
                    error={errors.dispatchAddress?.message}
                  />
                </div>
              </div>

              {/* Remarks
              <div className="p-5 ml-7 bg-white shadow-md rounded-lg mx-auto">
                <textarea
                  id="notes"
                  className="w-full h-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  placeholder="Any additional notes or comments about the contract"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                ></textarea>
                <p className="text-gray-500 mt-2">Character Count: {notes.length}</p>
              </div> */}
            </>
          )}
        </div>

        {/* Form Actions */}
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