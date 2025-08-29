'use client';
import React, { useState, useEffect } from 'react';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import ABLCustomInput from '@/components/ui/ABLCustomInput';
import AblCustomDropdown from '@/components/ui/AblCustomDropdown';
import { createParty, updateParty, getAllPartys } from '@/apis/party';
import { getAllAblLiabilities } from '@/apis/ablliabilities';
import { toast } from 'react-toastify';
import { useRouter } from 'next/navigation';
import {MdInfo, MdLocationOn, MdPhone, MdBusiness } from 'react-icons/md';
import { FaRegBuilding, FaMoneyBillWave, FaIdCard } from 'react-icons/fa';
import { HiDocumentText } from 'react-icons/hi';
import Link from 'next/link';
import { FiSave, FiX, FiUser } from 'react-icons/fi';

// Define the schema for party form validation
const partySchema = z.object({
  PartyNumber: z.string().optional(),
  name: z.string().optional(),
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
  email: z.string().email('').optional(),
  website: z.string().url('Invalid website URL').optional().or(z.literal('')),
  receivableAccount: z.string().optional(),
});

type PartyFormData = z.infer<typeof partySchema>;

// Type for liability account data
type LiabilityAccount = {
  id: string;
  listid: string;
  description: string;
  parentAccountId: string | null;
  children: LiabilityAccount[];
  dueDate: string;
  fixedAmount: string;
  paid: string;
};

const PartyForm = ({ isEdit = false }: { isEdit?: boolean }) => {
  const router = useRouter();
  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<PartyFormData>({
    resolver: zodResolver(partySchema),
    defaultValues: {
      PartyNumber: '',
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
      receivableAccount: '',
    },
  });

  const watchedCity = useWatch({ control, name: 'city' });

  const [idFocused, setIdFocused] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('basic'); // 'basic' or 'additional'
  const [accounts, setAccounts] = useState<{ id: string; name: string }[]>([]);

  // Sample data for dropdowns - transform to match AblCustomDropdown requirements
  const currencies = ['PKR', 'USD', 'EUR', 'GBP'].map(currency => ({ id: currency, name: currency }));
  const pakistanCities = [
    'Karachi', 'Lahore', 'Faisalabad', 'Rawalpindi', 'Multan', 'Hyderabad',
    'Quetta', 'Peshawar', 'Islamabad', 'Sialkot', 'Gujranwala', 'Sargodha'
  ].map(city => ({ id: city, name: city }));

  // Fetch liabilities data for payable accounts
  const fetchLiabilities = async () => {
    try {
      const response = await getAllAblLiabilities(1, 100); // Get first 100 records
      const liabilitiesData: LiabilityAccount[] = response.data || [];
      
      // Transform the data to match AblCustomDropdown requirements
      const transformedAccounts = liabilitiesData.map((liability) => ({
        id: liability.id,
        name: `${liability.id} - ${liability.description}`
      }));
      
      setAccounts(transformedAccounts);
    } catch (error) {
      console.error('Error fetching liabilities:', error);
      toast.error('Failed to load payable accounts');
      // Set empty array as fallback
      setAccounts([]);
    }
  };

  // Fetch liabilities data on component mount
  useEffect(() => {
    fetchLiabilities();
  }, []);

  useEffect(() => {
    if (isEdit) {
      const fetchParty = async () => {
        setIsLoading(true);
        const id = window.location.pathname.split('/').pop();
        if (id) {
          try {
            const response = await getAllPartys(id);
            const party = response.data;
            if (party) {
              setValue('PartyNumber', party.id || '');
              setValue('name', party.name || '');
              setValue('currency', party.currency || '');
              setValue('address', party.address || '');
              setValue('city', party.city || '');
              setValue('state', party.state || '');
              setValue('zipCode', party.zipCode || '');
              setValue('bankName', party.bankName || '');
              setValue('tel', party.tel || '');
              setValue('ntn', party.ntn || '');
              setValue('mobile', party.mobile || '');
              setValue('stn', party.stn || '');
              setValue('fax', party.fax || '');
              setValue('buyerCode', party.buyerCode || '');
              setValue('email', party.email || '');
              setValue('website', party.website || '');
              setValue('receivableAccount', party.receivableAccount || '');
            } else {
              toast.error('Party not found');
              router.push('/party');
            }
          } catch (error) {
            console.error('Error fetching party:', error);
            toast.error('Failed to load party data');
          } finally {
            setIsLoading(false);
          }
        }
      };
      fetchParty();
    }
  }, [isEdit, setValue, router]);

  // Generate PartyNumber for new parties
  useEffect(() => {
    if (!isEdit) {
      // Generate a unique PartyNumber for new parties
      const generatedPartyNumber = `P${Date.now()}${Math.floor(Math.random() * 1000)}`;
      setValue('PartyNumber', generatedPartyNumber);
    }
  }, [isEdit, setValue]);

  const onSubmit = async (data: PartyFormData) => {
    setIsSubmitting(true);
    try {
      if (isEdit) {
        await updateParty(data.PartyNumber!, data);
        toast.success('Party updated successfully!');
      } else {
        // For new parties, generate a unique PartyNumber
        const partyData = { ...data };
        if (!partyData.PartyNumber || partyData.PartyNumber.trim() === '') {
          // Generate a unique PartyNumber using timestamp and random number
          partyData.PartyNumber = `P${Date.now()}${Math.floor(Math.random() * 1000)}`;
        }
        await createParty(partyData);
        toast.success('Party created successfully!');
      }
      router.push('/party');
    } catch (error) {
      console.error('Error saving party:', error);
      toast.error('An error occurred while saving the party');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-800 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Loading Overlay */}
        {isLoading && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-2xl">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-gray-700 dark:text-gray-300 font-medium">Loading party data...</span>
              </div>
            </div>
          </div>
        )}

        {/* Main Container */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-700">
          <div className="bg-gradient-to-r from-[#3a614c] to-[#6e997f] text-white px-6 py-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-lg">
                  <MdBusiness className="text-2xl" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">
                    {isEdit ? 'Edit Party' : 'Add New Party'}
                  </h1>
                  <p className="text-white/90 mt-1 text-sm">
                    {isEdit ? 'Update party information' : 'Create a new party record'}
                  </p>
                </div>
              </div>
              <div className="flex space-x-3">
                <Link href="/party">
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
                      Party Details
                    </h3>
                  </div>
                  
                  <div className="space-y-5">
                    <Controller
                      name="PartyNumber"
                      control={control}
                      render={({ field }) => (
                        <div className="relative">
                          <ABLCustomInput
                            {...field}
                            label="ID"
                            type="text"
                            placeholder={isEdit ? "Party Number" : "Auto-generated"}
                            register={register}
                            error={errors.PartyNumber?.message}
                            id="PartyNumber"
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
                      label="Party Name"
                      type="text"
                      placeholder="Enter party name"
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

                    <Controller
                      name="receivableAccount"
                      control={control}
                      render={({ field }) => (
                        <AblCustomDropdown
                          label="Payable A/C"
                          options={accounts}
                          selectedOption={field.value || ''}
                          onChange={(value) => setValue('receivableAccount', value, { shouldValidate: true })}
                          error={errors.receivableAccount?.message}
                          register={register}
                        />
                      )}
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
                      <span>{isEdit ? 'Update Party' : 'Create Party'}</span>
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
            <Link href="/party" className="text-[#3a614c] hover:text-[#6e997f] dark:text-[#3a614c] dark:hover:text-[#6e997f] text-sm font-medium transition-colors">
              Back to Parties List
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PartyForm;