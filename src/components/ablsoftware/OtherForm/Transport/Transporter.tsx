'use client';
import React, { useState, useEffect } from 'react';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import ABLCustomInput from '@/components/ui/ABLCustomInput';
import AblCustomDropdown from '@/components/ui/AblCustomDropdown';
import { createTransporter, updateTransporter } from '@/apis/transporter';
import { toast } from 'react-toastify';
import { useRouter } from 'next/navigation';
import { MdLocalShipping, MdInfo, MdLocationOn, MdPhone } from 'react-icons/md';
import { FaRegBuilding, FaMoneyBillWave, FaIdCard } from 'react-icons/fa';
import { HiDocumentText } from 'react-icons/hi';
import Link from 'next/link';
import { FiSave, FiX, FiUser } from 'react-icons/fi';

// Define the schema for transporter form validation
const transporterSchema = z.object({
  TransporterNumber: z.string().optional(),
  name: z.string().min(1, 'Transporter Name is required'),
  currency: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  bankName: z.string().optional(),
  tel: z.string().optional(),
  ntn: z.string().optional(),
  mobile: z.string().optional(),
  stn: z.string().optional(),
  fax: z.string().optional(),
  buyerCode: z.string().optional(),
  email: z.string().email('Invalid email address').optional(),
  website: z.union([z.string().url('Invalid website URL'), z.literal('')]).optional(),
});

type TransporterFormData = z.infer<typeof transporterSchema>;

interface TransporterFormProps {
  isEdit?: boolean;
  initialData?: Partial<TransporterFormData>;
}

const TransporterForm = ({ isEdit = false, initialData }: TransporterFormProps) => {
  const router = useRouter();
  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    reset,
  } = useForm<TransporterFormData>({
    resolver: zodResolver(transporterSchema),
    defaultValues: initialData
      ? {
          TransporterNumber: initialData.TransporterNumber || '',
          name: initialData.name || '',
          currency: initialData.currency || '',
          address: initialData.address || '',
          city: initialData.city || '',
          state: initialData.state || '',
          zipCode: initialData.zipCode || '',
          bankName: initialData.bankName || '',
          tel: initialData.tel || '',
          ntn: initialData.ntn || '',
          mobile: initialData.mobile || '',
          stn: initialData.stn || '',
          fax: initialData.fax || '',
          buyerCode: initialData.buyerCode || '',
          email: initialData.email || '',
          website: initialData.website || '',
        }
      : {
          TransporterNumber: '',
          name: '',
          currency: '',
          address: '',
          city: '',
          state: '',
          zipCode: '',
          bankName: '',
          tel: '',
          ntn: '',
          mobile: '',
          stn: '',
          fax: '',
          buyerCode: '',
          email: '',
          website: '',
        },
  });

  const watchedCity = useWatch({ control, name: 'city' });

  const [idFocused, setIdFocused] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('basic'); // 'basic' or 'additional'

  // Sample data for dropdowns - transform to match AblCustomDropdown requirements
  const currencies = ['PKR', 'USD', 'EUR', 'GBP'].map(currency => ({ id: currency, name: currency }));
  const pakistanCities = [
    'Karachi', 'Lahore', 'Faisalabad', 'Rawalpindi', 'Multan', 'Hyderabad',
    'Quetta', 'Peshawar', 'Islamabad', 'Sialkot', 'Gujranwala', 'Sargodha'
  ].map(city => ({ id: city, name: city }));

  // Generate TransporterNumber for new transporters
  useEffect(() => {
    if (!isEdit) {
      const generatedTransporterNumber = `T${Date.now()}${Math.floor(Math.random() * 1000)}`;
      setValue('TransporterNumber', generatedTransporterNumber);
    }
  }, [isEdit, setValue]);

  // Populate form with initialData in edit mode
  useEffect(() => {
    if (isEdit && initialData) {
      reset({
        TransporterNumber: initialData.TransporterNumber || '',
        name: initialData.name || '',
        currency: initialData.currency || '',
        address: initialData.address || '',
        city: initialData.city || '',
        state: initialData.state || '',
        zipCode: initialData.zipCode || '',
        bankName: initialData.bankName || '',
        tel: initialData.tel || '',
        ntn: initialData.ntn || '',
        mobile: initialData.mobile || '',
        stn: initialData.stn || '',
        fax: initialData.fax || '',
        buyerCode: initialData.buyerCode || '',
        email: initialData.email || '',
        website: initialData.website || '',
      });
    }
  }, [isEdit, initialData, reset]);

  const onSubmit = async (data: TransporterFormData) => {
    setIsSubmitting(true);
    try {
      // Replace with actual user ID logic
      const payload = {
        id: isEdit ? initialData?.TransporterNumber || window.location.pathname.split('/').pop() || '' : `T${Date.now()}${Math.floor(Math.random() * 1000)}`,
        isActive: true,
        isDeleted: false,
        // createdDateTime: isEdit ? initialData?.createdDateTime || currentDateTime : currentDateTime,
        // createdBy: isEdit ? initialData?.createdBy || userId : userId,
        // modifiedDateTime: currentDateTime,
        // modifiedBy: userId,
        transporterNumber: data.TransporterNumber || `T${Date.now()}${Math.floor(Math.random() * 1000)}`,
        name: data.name || '',
        currency: data.currency || '',
        address: data.address || '',
        city: data.city || '',
        state: data.state || '',
        zipCode: data.zipCode || '',
        bankName: data.bankName || '',
        tel: data.tel || '',
        ntn: data.ntn || '',
        mobile: data.mobile || '',
        stn: data.stn || '',
        fax: data.fax || '',
        buyerCode: data.buyerCode || '',
        email: data.email || '',
        website: data.website || '',
      };

      if (isEdit) {
        await updateTransporter( payload);
        toast.success('Transporter updated successfully!');
      } else {
        await createTransporter(payload);
        toast.success('Transporter created successfully!');
      }
      router.push('/transporter');
    } catch (error) {
      console.error('Error saving transporter:', error);
      toast.error('An error occurred while saving the transporter');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-800 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Main Container */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-700">
          <div className="bg-gradient-to-r from-[#3a614c] to-[#6e997f] text-white px-6 py-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-lg">
                  <MdLocalShipping className="text-2xl" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">
                    {isEdit ? 'Edit Transporter' : 'Add New Transporter'}
                  </h1>
                  <p className="text-white/90 mt-1 text-sm">
                    {isEdit ? 'Update transporter information' : 'Create a new transporter record'}
                  </p>
                </div>
              </div>
              <div className="flex space-x-3">
                <Link href="/transporter">
                  <Button
                    type="button"
                    className="bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all duration-200 border border-white/20 backdrop-blur-sm px-4 py-2 shadow-lg hover:shadow-xl"
                  >
                    <FiX className="mr-2" /> Cancel
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200 dark:border-gray-700 px-8 bg-gray-50 dark:bg-gray-850">
            <button
              className={`py-4 px-6 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'basic'
                  ? 'border-[#3a614c] text-[#3a614c] dark:text-[#3a614c] font-semibold'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
              onClick={() => setActiveTab('basic')}
            >
              <FiUser className={activeTab === 'basic' ? 'text-[#3a614c]' : 'text-gray-400'} />
              Basic Information
            </button>
            <button
              className={`py-4 px-6 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'additional'
                  ? 'border-[#3a614c] text-[#3a614c] dark:text-[#3a614c] font-semibold'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
              onClick={() => setActiveTab('additional')}
            >
              <HiDocumentText className={activeTab === 'additional' ? 'text-[#3a614c]' : 'text-gray-400'} />
              Additional Details
            </button>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit(onSubmit)} className="p-8">
            {activeTab === 'basic' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {/* Basic Information */}
                <div className="col-span-1 bg-gray-50 dark:bg-gray-750 p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
                  <div className="flex items-center gap-2 mb-5">
                    <FaIdCard className="text-[#3a614c] text-xl" />
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                      Transporter Details
                    </h3>
                  </div>
                  
                  <div className="space-y-5">
                    <Controller
                      name="TransporterNumber"
                      control={control}
                      render={({ field }) => (
                        <div className="relative">
                          <ABLCustomInput
                            {...field}
                            label="ID"
                            type="text"
                            placeholder={isEdit ? 'Transporter Number' : 'Auto-generated'}
                            register={register}
                            error={errors.TransporterNumber?.message}
                            id="TransporterNumber"
                            disabled
                          />
                          {idFocused && (
                            <div className="absolute -top-8 left-0 bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded shadow-lg z-10">
                              Auto-generated
                            </div>
                          )}
                        </div>
                      )}
                    />
                    
                    <ABLCustomInput
                      label="Transporter Name"
                      type="text"
                      placeholder="Enter transporter name"
                      register={register} 
                      error={errors.name?.message}
                      id="name"
                    />
                    
                    <Controller
                      name="currency"
                      control={control}
                      render={({ field }) => (
                        <AblCustomDropdown
                          label="Currency"
                          options={currencies}
                          selectedOption={field.value ?? ''}
                          onChange={(value) => setValue('currency', value, { shouldValidate: true })}
                          error={errors.currency?.message}
                          register={register}
                        />
                      )}
                    />
                    
                    <ABLCustomInput
                      label="Buyer Code"
                      type="text"
                      placeholder="Enter buyer code"
                      register={register}            
                      error={errors.buyerCode?.message}
                      id="buyerCode"
                    />
                  </div>
                </div>
                
                <div className="col-span-1 bg-gray-50 dark:bg-gray-750 p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
                  <div className="flex items-center gap-2 mb-5">
                    <MdLocationOn className="text-[#3a614c] text-xl" />
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                      Address Information
                    </h3>
                  </div>
                  
                  <div className="space-y-5">
                    <ABLCustomInput
                      label="Address"
                      type="text"
                      placeholder="Enter complete address"
                      register={register} 
                      error={errors.address?.message}
                      id="address"
                    />
                    
                    <AblCustomDropdown
                      label="City"
                      options={pakistanCities}
                      selectedOption={watchedCity || ''}
                      onChange={(value) => setValue('city', value, { shouldValidate: true })}
                      error={errors.city?.message}
                      register={register}
                    />
                    
                    <ABLCustomInput
                      label="State/Province"
                      type="text"
                      placeholder="Enter state"
                      register={register} 
                      error={errors.state?.message}
                      id="state"
                    />
                    
                    <ABLCustomInput
                      label="Zip Code"
                      type="text"
                      placeholder="Postal code"
                      register={register} 
                      error={errors.zipCode?.message}
                      id="zipCode"
                    />
                  </div>
                </div>
                
                <div className="col-span-1 bg-gray-50 dark:bg-gray-750 p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
                  <div className="flex items-center gap-2 mb-5">
                    <MdPhone className="text-[#3a614c] text-xl" />
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                      Contact Information
                    </h3>
                  </div>
                  
                  <div className="space-y-5">
                    <ABLCustomInput
                      label="Telephone"
                      type="tel"
                      placeholder="Phone number"
                      register={register} 
                      error={errors.tel?.message}
                      id="tel"
                    />
                    
                    <ABLCustomInput
                      label="Mobile"
                      type="tel"
                      placeholder="Mobile number"
                      register={register} 
                      error={errors.mobile?.message}
                      id="mobile"
                    />
                    
                    <ABLCustomInput
                      label="Email"
                      type="email"
                      placeholder="Enter email address"
                      register={register} 
                      error={errors.email?.message}
                      id="email"
                    />
                    
                    <ABLCustomInput
                      label="Website"
                      type="url"
                      placeholder="Enter website URL"
                      register={register} 
                      error={errors.website?.message}
                      id="website"
                    />
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'additional' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Additional Information */}
                <div className="col-span-1 bg-gray-50 dark:bg-gray-750 p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
                  <div className="flex items-center gap-2 mb-5">
                    <FaMoneyBillWave className="text-[#3a614c] text-xl" />
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                      Tax Information
                    </h3>
                  </div>
                  
                  <div className="space-y-5">
                    <ABLCustomInput
                      label="NTN"
                      type="text"
                      placeholder="Tax number"
                      register={register} 
                      error={errors.ntn?.message}
                      id="ntn"
                    />
                    
                    <ABLCustomInput
                      label="STN"
                      type="text"
                      placeholder="Sales tax"
                      register={register} 
                      error={errors.stn?.message}
                      id="stn"
                    />
                  </div>
                </div>
                
                <div className="col-span-1 bg-gray-50 dark:bg-gray-750 p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
                  <div className="flex items-center gap-2 mb-5">
                    <FaRegBuilding className="text-[#3a614c] text-xl" />
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                      Other Details
                    </h3>
                  </div>
                  
                  <div className="space-y-5">
                    <ABLCustomInput
                      label="Fax"
                      type="text"
                      placeholder="Fax number"
                      register={register} 
                      error={errors.fax?.message}
                      id="fax"
                    />
                    
                    <ABLCustomInput
                      label="Bank Name"
                      type="text"
                      placeholder="Bank name"
                      register={register} 
                      error={errors.bankName?.message}
                      id="bankName"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-4 pt-8 border-t border-gray-200 dark:border-gray-700 mt-8">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="px-8 py-3 bg-gradient-to-r from-[#3a614c] to-[#6e997f] hover:from-[#3a614c]/90 hover:to-[#6e997f]/90 text-white rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-[#3a614c]/30 font-medium text-sm"
              >
                <div className="flex items-center gap-2">
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <FiSave className="text-lg" />
                      <span>{isEdit ? 'Update Transporter' : 'Create Transporter'}</span>
                    </>
                  )}
                </div>
              </Button>
            </div>
          </form>
        </div>
        
        {/* Form Navigation Card */}
        <div className="mt-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
              <MdInfo className="text-[#3a614c]" />
              <span className="text-sm">Fill in all required fields marked with an asterisk (*)</span>
            </div>
            <Link href="/transporter" className="text-[#3a614c] hover:text-[#6e997f] dark:text-[#3a614c] dark:hover:text-[#6e997f] text-sm font-medium transition-colors">
              Back to Transporters List
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransporterForm;