'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'react-toastify';
import CustomInput from '@/components/ui/CustomInput';
import CustomInputDropdown from '../ui/CustomeInputDropdown';
import { MdAddBusiness } from 'react-icons/md';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { AiOutlinePlus, AiOutlineDelete } from "react-icons/ai";

// Zod schema for form validation
const Schema = z.object({
  supplierName: z.string().min(1, 'Supplier Name is required'),
  supplierId: z.string().min(1, 'Supplier ID is required'),
  contactPerson: z.string().min(1, 'Contact Person is required'),
  phoneNumber: z.string().min(1, 'Phone Number is required'),
  emailAddress: z.string().email('Invalid email address'),
  address: z.string().min(1, 'Address is required'),
  supplierType: z.string().min(1, 'Supplier Type is required'),
  accountNo: z.array(z.string().min(1, 'Account Number is required')),
  notes: z.string().optional(),
  website: z.string().url('Invalid URL').optional(), 
  taxId: z.string().min(1, 'Tax ID is required'), 
  paymentTerms: z.string().min(1, 'Payment Terms are required'),
  contractStartDate: z.string().min(1, 'Contract Start Date is required'), 
  contractEndDate: z.string().min(1, 'Contract End Date is required'), 
});

type FormData = z.infer<typeof Schema>;

const Supplier = ({ id, initialData }: any) => {
  const [accountNos, setAccountNos] = useState<string[]>(['']);
  const [supplierType, setSupplierType] = useState<string>(''); // State for selected supplier type
  const [text, setText] = useState("");

  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue, 
  } = useForm<FormData>({
    resolver: zodResolver(Schema),
    defaultValues: initialData || {},
  });

  // Dropdown options for supplier type
  const supplierTypeOptions = [
    { id: 1, name: 'Manufacturer' },
    { id: 2, name: 'Distributor' },
    { id: 3, name: 'Wholesaler' },
    { id: 4, name: 'Retailer' },
  ];

  // Handle dynamic account numbers input
  const addAccountNo = () => {
    setAccountNos([...accountNos, '']);
  };

  const removeAccountNo = (index: number) => {
    const updatedAccountNos = accountNos.filter((_, i) => i !== index);
    setAccountNos(updatedAccountNos);
  };

  const handleAccountNoChange = (index: number, value: string) => {
    const updatedAccountNos = [...accountNos];
    updatedAccountNos[index] = value;
    setAccountNos(updatedAccountNos);
  };

  // Handle supplier type change
  const handleSupplierTypeChange = (value: string) => {
    setSupplierType(value); // Update state
    setValue('supplierType', value); // Update form value
  };

  useEffect(() => {
    if (initialData) {
      reset(initialData);
      setSupplierType(initialData.supplierType || ''); 
    }
  }, [initialData, reset]);

  const onSubmit = async (data: FormData) => {
    try {
      // Here you would call your API to create or update the supplier
      toast(id ? 'Supplier Updated Successfully' : 'Supplier Created Successfully', { type: 'success' });
      reset();
      router.push('/suppliers'); // Redirect to the supplier list page
    } catch (error) {
      console.error('Error submitting form:', error);
      toast('An error occurred', { type: 'error' });
    }
  };

  return (
    <div className="container mx-auto bg-white shadow-lg rounded dark:bg-[#030630]">
      <div className="w-full bg-[#06b6d4] h-[7vh] rounded dark:bg-[#387fbf]">
        <h1 className="text-base text-[23px] font-mono ml-10 mt-8 pt-3 text-white flex gap-2">
          <MdAddBusiness />
          {id ? 'Edit Supplier' : 'Add New Supplier'}
        </h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-2 gap-4 p-4">
          <CustomInput
            variant="floating"
            borderThickness="2"
            label="Supplier Name"
            id="supplierName"
            register={register}
            {...register('supplierName')}
            error={errors.supplierName?.message}
          />
          <CustomInput
            variant="floating"
            borderThickness="2"
            label="Supplier ID"
            id="supplierId"
            register={register}
            {...register('supplierId')}
            error={errors.supplierId?.message}
          />
          <CustomInput
            variant="floating"
            borderThickness="2"
            label="Contact Person"
            id="contactPerson"
            register={register}
            {...register('contactPerson')}
            error={errors.contactPerson?.message}
          />
          <CustomInput
            variant="floating"
            borderThickness="2"
            label="Phone Number"
            id="phoneNumber"
            register={register}
            {...register('phoneNumber')}
            error={errors.phoneNumber?.message}
          />
          <CustomInputDropdown
            label="Supplier Type"
            options={supplierTypeOptions}
            selectedOption={supplierType}
            onChange={(value) => handleSupplierTypeChange(value)}
            error={errors.supplierType?.message}
          />
          <CustomInput
            variant="floating"
            borderThickness="2"
            label="Email Address"
            id="emailAddress"
            register={register}
            {...register('emailAddress')}
            error={errors.emailAddress?.message}
          />
          <CustomInput
            variant="floating"
            borderThickness="2"
            label="Address"
            id="address"
            register={register}
            {...register('address')}
            error={errors.address?.message}
          />
        
          <CustomInput
            variant="floating"
            borderThickness="2"
            label="Notes"
            id="notes"
            register={register}
            {...register('notes')}
            error={errors.notes?.message}
          />

         <CustomInput
         variant="floating"
         borderThickness="2"
         label="Website"
         id="website"
         register={register}
         {...register('website')}
         error={errors.website?.message}
         />
        <CustomInput
        variant="floating"
        borderThickness="2"
        label="Tax ID"
        id="taxId"
        register={register}
        {...register('taxId')}
        error={errors.taxId?.message}
        />
      <CustomInput
      variant="floating"
      borderThickness="2"
      label="Payment Terms"
      id="paymentTerms"
      register={register}
      {...register('paymentTerms')}
      error={errors.paymentTerms?.message}
      />
     <CustomInput
     variant="floating"
     borderThickness="2"
     label="Contract Start Date"
     id="contractStartDate"
     type="date" 
     register={register}
     {...register('contractStartDate')}
     error={errors.contractStartDate?.message}
     />
    <CustomInput
    variant="floating"
    borderThickness="2"
    label="Contract End Date"
    id="contractEndDate"
    type="date"
    register={register}
    {...register('contractEndDate')}
    error={errors.contractEndDate?.message}
   />
        </div>
        <div>          
          {accountNos.map((accountNo, index) => (
            <div key={index} className="flex items-center gap-2">
                <div className='p-4 w-[60vh]'> 
                <CustomInput
                variant="floating"
                borderThickness="2"
                label={`Account No ${index + 1}`}
                value={accountNo}
                onChange={(e) => handleAccountNoChange(index, e.target.value)}
              />
                </div>
              <div className='mt-8 gap-4'> 
              {index > 0 && (
                
                <button
                  type="button"
                  onClick={() => removeAccountNo(index)}
                  className="p-2 bg-red-500 hover:bg-red-600 text-white rounded "
                >
                  <AiOutlineDelete size={20} />
                </button>
              )}
              <button
                type="button"
                onClick={addAccountNo}
                className="p-2 bg-green-500 hover:bg-green-600 text-white rounded ml-4"
              >
                <AiOutlinePlus size={20} />
              </button>
              </div>
            </div>
          ))}
            <div className="  p-5 ml-7 bg-white shadow-md rounded-lg mx-auto">
      <textarea
        id="message"
        className="w-full h-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
        placeholder="Any additional notes or comments about the supplier work details"
        value={text}
        onChange={(e) => setText(e.target.value)}
      ></textarea>
      <p className="text-gray-500 mt-2">Character Count: {text.length}</p>
    </div>
        </div>
        <div className="w-full h-[8vh] flex justify-end gap-2 mt-3 bg-transparent border-t-2 [#e7e7e7]">
          <Button
            type="submit"
            className="w-[160] gap-2 inline-flex items-center bg-[#0e7d90] hover:bg-[#0891b2] text-white px-6 py-2 text-sm font-medium transition-all duration-200 font-mono text-base hover:translate-y-[-2px] focus:outline-none active:shadow-[#3c4fe0_0_3px_7px_inset] active:translate-y-[2px] mt-2"
          >
            {id ? 'Update' : 'Submit'}
          </Button>
          <Link href="/suppliers">
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

export default Supplier; 