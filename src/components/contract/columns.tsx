'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'react-toastify';
import CustomInput from '@/components/ui/CustomInput';
import CustomInputDropdown from '@/components/ui/CustomeInputDropdown';
import { MdAddBusiness, MdAdd } from 'react-icons/md';
import { AiOutlinePlus, AiOutlineDelete } from 'react-icons/ai';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { getAllOrganization } from '@/apis/organization';
import { getAllBranch } from '@/apis/branchs';
import { getAllDescriptions } from '@/apis/description';
import { createContract, updateContract } from '@/apis/contract'; // Hypothetical API

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
  fabricType: z.string().min(1, 'Fabric Type is required'),
  descriptionId: z.string().min(1, 'Description is required'),
  stuff: z.string().optional(),
  blendRatio: z.string().optional(),
  blendType: z.string().optional(),
  warpCount: z.string().optional(),
  warpYarnType: z.string().optional(),
  weftCount: z.string().optional(),
  weftYarnCount: z.string().optional(),
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
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([{ description: '', quantity: '', deliveryDate: '' }]);
  const [notes, setNotes] = useState('');

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

  // Dropdown options (static for now, can be fetched from API if needed)
  const contractTypes = [
    { id: 'Sale', name: 'Sale' },
    { id: 'Purchase', name: 'Purchase' },
  ];

  const fabricTypes = [
    { id: 'GREY', name: 'GREY' },
    { id: 'DYED', name: 'DYED' },
    { id: 'PRINTED', name: 'PRINTED' },
  ];

  const unitsOfMeasure = [
    { id: 'Meter', name: 'Meter' },
    { id: 'Yard', name: 'Yard' },
    { id: 'Kilogram', name: 'Kilogram' },
  ];

  // Fetch companies
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

  // Fetch branches based on selected company
  const fetchBranches = async (companyId: string) => {
    try {
      setLoading(true);
      const response = await getAllBranch(1, 100, { organizationId: companyId });
      setBranches(response.data.map((branch: any) => ({ id: branch.id, name: branch.name })));
    } catch (error) {
      console.error('Error fetching branches:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch descriptions
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

  // Watch companyId to fetch branches
  const companyId = watch('companyId');
  useEffect(() => {
    if (companyId) {
      fetchBranches(companyId);
    } else {
      setBranches([]);
    }
  }, [companyId]);

  // Initial data setup
  useEffect(() => {
    fetchCompanies();
    fetchDescriptions();
    if (initialData) {
      reset(initialData);
      if (initialData.companyId) {
        fetchBranches(initialData.companyId);
      }
    }
  }, [initialData, reset]);

  // Handle adding new item
  const addItem = () => {
    setItems([...items, { description: '', quantity: '', deliveryDate: '' }]);
  };

  // Handle removing item
  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  // Handle item change
  const handleItemChange = (index: number, field: string, value: string) => {
    const updatedItems = [...items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setItems(updatedItems);
  };

  // Form submission
  const onSubmit = async (data: FormData) => {
    try {
      const payload = { ...data, items }; // Include items in payload
      let response;
      if (id) {
        response = await updateContract(id, payload);
        toast('Contract Updated успешно', { type: 'success' });
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
            <h2 className="text-xl font-bold text-black dark:text-white">Basic Contract Information</h2>
            <div className="grid grid-cols-3 gap-4">
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
                selectedOption={watch('contractType') || ''}
                onChange={(value) => setValue('contractType', value, { shouldValidate: true })}
                error={errors.contractType?.message}
                register={register}
              />
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
              <CustomInput
                variant="floating"
                borderThickness="2"
                label="Contract Owner"
                id="contractOwner"
                {...register('contractOwner')}
                error={errors.contractOwner?.message}
              />
              <CustomInput
                variant="floating"
                borderThickness="2"
                label="Seller"
                id="seller"
                {...register('seller')}
                error={errors.seller?.message}
              />
              <CustomInput
                variant="floating"
                borderThickness="2"
                label="Buyer"
                id="buyer"
                {...register('buyer')}
                error={errors.buyer?.message}
              />
              <CustomInput
                variant="floating"
                borderThickness="2"
                label="Reference Number"
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
            </div>
          </div>

          {/* Fabric Details */}
          <div className="p-4 border rounded-2xl mx-auto">
            <h2 className="text-xl font-bold text-black dark:text-white">Fabric Details</h2>
            <div className="grid grid-cols-3 gap-4">
              <CustomInputDropdown
                label="Fabric Type"
                options={fabricTypes}
                selectedOption={watch('fabricType') || ''}
                onChange={(value) => setValue('fabricType', value, { shouldValidate: true })}
                error={errors.fabricType?.message}
                register={register}
              />
              <CustomInputDropdown
                label="Description"
                options={descriptions}
                selectedOption={watch('descriptionId') || ''}
                onChange={(value) => setValue('descriptionId', value, { shouldValidate: true })}
                error={errors.descriptionId?.message}
                register={register}
              />
              <CustomInput
                variant="floating"
                borderThickness="2"
                label="Stuff"
                id="stuff"
                {...register('stuff')}
                error={errors.stuff?.message}
              />
              <CustomInput
                variant="floating"
                borderThickness="2"
                label="Blend Ratio"
                id="blendRatio"
                {...register('blendRatio')}
                error={errors.blendRatio?.message}
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
              <CustomInput
                variant="floating"
                borderThickness="2"
                label="Warp Yarn Type"
                id="warpYarnType"
                {...register('warpYarnType')}
                error={errors.warpYarnType?.message}
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
                variant="floating"
                borderThickness="2"
                label="Weft Yarn Count"
                id="weftYarnCount"
                {...register('weftYarnCount')}
                error={errors.weftYarnCount?.message}
              />
              <CustomInput
                variant="floating"
                borderThickness="2"
                label="No. of Ends"
                id="noOfEnds"
                {...register('noOfEnds')}
                error={errors.noOfEnds?.message}
              />
              <CustomInput
                variant="floating"
                borderThickness="2"
                label="No. of Picks"
                id="noOfPicks"
                {...register('noOfPicks')}
                error={errors.noOfPicks?.message}
              />
              <CustomInput
                variant="floating"
                borderThickness="2"
                label="Weaves"
                id="weaves"
                {...register('weaves')}
                error={errors.weaves?.message}
              />
              <CustomInput
                variant="floating"
                borderThickness="2"
                label="Pick Insertion"
                id="pickInsertion"
                {...register('pickInsertion')}
                error={errors.pickInsertion?.message}
              />
              <CustomInput
                variant="floating"
                borderThickness="2"
                label="Width"
                id="width"
                {...register('width')}
                error={errors.width?.message}
              />
              <CustomInput
                variant="floating"
                borderThickness="2"
                label="Final"
                id="final"
                {...register('final')}
                error={errors.final?.message}
              />
              <CustomInput
                variant="floating"
                borderThickness="2"
                label="Selvedge"
                id="selvedge"
                {...register('selvedge')}
                error={errors.selvedge?.message}
              />
              <CustomInput
                variant="floating"
                borderThickness="2"
                label="Selvedge Weave"
                id="selvedgeWeave"
                {...register('selvedgeWeave')}
                error={errors.selvedgeWeave?.message}
              />
              <CustomInput
                variant="floating"
                borderThickness="2"
                label="Selvedge Width"
                id="selvedgeWidth"
                {...register('selvedgeWidth')}
                error={errors.selvedgeWidth?.message}
              />
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
                    label="Item Description"
                    value={item.description}
                    onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                  />
                  <CustomInput
                    variant="floating"
                    borderThickness="2"
                    label="Quantity"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
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
              <CustomInputDropdown
                label="Unit of Measure"
                options={unitsOfMeasure}
                selectedOption={watch('unitOfMeasure') || ''}
                onChange={(value) => setValue('unitOfMeasure', value, { shouldValidate: true })}
                error={errors.unitOfMeasure?.message}
                register={register}
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
              <CustomInput
                variant="floating"
                borderThickness="2"
                label="Packing"
                id="packing"
                {...register('packing')}
                error={errors.packing?.message}
              />
              <CustomInput
                variant="floating"
                borderThickness="2"
                label="Piece Length"
                id="pieceLength"
                {...register('pieceLength')}
                error={errors.pieceLength?.message}
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

          {/* Remarks */}
          <div className="p-5 ml-7 bg-white shadow-md rounded-lg mx-auto">
            <textarea
              id="notes"
              className="w-full h-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
              placeholder="Any additional notes or comments about the contract"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            ></textarea>
            <p className="text-gray-500 mt-2">Character Count: {notes.length}</p>
          </div>
        </div>

        {/* Form Actions */}
        <div className="w-full h-[8vh] flex justify-end gap-2 mt-3 bg-transparent border-t-2 border-[#e7e7e7]">
          <Button
            type="submit"
            className="w-[160] gap-2 inline-flex items-center bg-[#0e7d90] hover:bg-[#0891b2] text-white px-6 py-2 text-sm font-medium transition-all duration-200 font-mono text-base hover:translate-y-[-2px] focus:outline-none active:shadow-[#3c4fe0_0_3px_7px_inset] active:translate-y-[2px] mt-2"
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