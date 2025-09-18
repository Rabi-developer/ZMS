'use client';
import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import ABLCustomInput from '@/components/ui/ABLCustomInput';
import { createBrooker, updateBrooker } from '@/apis/brooker';
import { toast } from 'react-toastify';
import { useRouter } from 'next/navigation';
import { MdAddBusiness, MdLocationOn, MdPhone } from 'react-icons/md';
import { FiSave, FiX } from 'react-icons/fi';
import Link from 'next/link';

// Define the schema for brooker form validation
const brookerSchema = z.object({
  BrookerNumber: z.string().optional(),
  name: z.string().min(1, 'Brooker Name is required'),
  mobile: z.string().optional(),
  address: z.string().optional(),
});

type BrookerFormData = z.infer<typeof brookerSchema>;

interface BrookerFormProps {
  isEdit?: boolean;
  initialData?: Partial<BrookerFormData> & {
    id?: string;
    isActive?: boolean;
    isDeleted?: boolean;
    createdDateTime?: string;
    createdBy?: string;
    modifiedDateTime?: string;
    modifiedBy?: string;
  };
}

const BrookerForm = ({ isEdit = false, initialData }: BrookerFormProps) => {
  const router = useRouter();
  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    reset,
  } = useForm<BrookerFormData>({
    resolver: zodResolver(brookerSchema),
    defaultValues: initialData
      ? {
          BrookerNumber: initialData.BrookerNumber || '',
          name: initialData.name || '',
          mobile: initialData.mobile || '',
          address: initialData.address || '',
        }
      : {
          BrookerNumber: '',
          name: '',
          mobile: '',
          address: '',
        },
  });

  const [idFocused, setIdFocused] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Generate BrookerNumber for new brookers
  useEffect(() => {
    if (!isEdit) {
      const generatedBrookerNumber = `B${Date.now()}${Math.floor(Math.random() * 1000)}`;
      setValue('BrookerNumber', generatedBrookerNumber);
    }
  }, [isEdit, setValue]);

  // Populate form with initialData in edit mode
  useEffect(() => {
    if (isEdit && initialData) {
      reset({
        BrookerNumber: initialData.BrookerNumber || '',
        name: initialData.name || '',
        mobile: initialData.mobile || '',
        address: initialData.address || '',
      });
    }
  }, [isEdit, initialData, reset]);

  const onSubmit = async (data: BrookerFormData) => {
    setIsSubmitting(true);
    try {
      // Replace with actual user ID logic
      const payload = {
        id: isEdit ? initialData?.BrookerNumber || window.location.pathname.split('/').pop() || '' : `B${Date.now()}${Math.floor(Math.random() * 1000)}`,
        isActive: true,
        isDeleted: false,
      
        brookerNumber: data.BrookerNumber || `B${Date.now()}${Math.floor(Math.random() * 1000)}`,
        name: data.name || '',
        mobile: data.mobile || '',
        address: data.address || '',
      };

      if (isEdit) {
        await updateBrooker( payload);
        toast.success('Brooker updated successfully!');
      } else {
        await createBrooker(payload);
        toast.success('Brooker created successfully!');
      }
      router.push('/brookers');
    } catch (error) {
      console.error('Error saving brooker:', error);
      toast.error('An error occurred while saving the brooker');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-800 p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Main Container */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-700">
          <div className="bg-gradient-to-r from-[#3a614c] to-[#6e997f] text-white px-6 py-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-lg">
                  <MdAddBusiness className="text-2xl" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">
                    {isEdit ? 'Edit Brooker' : 'Add New Brooker'}
                  </h1>
                  <p className="text-white/90 mt-1 text-sm">
                    {isEdit ? 'Update brooker information' : 'Create a new brooker record'}
                  </p>
                </div>
              </div>
              <div className="flex space-x-3">
                <Link href="/brookers">
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

          {/* Form Content */}
          <form onSubmit={handleSubmit(onSubmit)} className="p-8">
            <div className="grid grid-cols-1 gap-8">
              <div className="col-span-1 bg-gray-50 dark:bg-gray-750 p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
                <div className="flex items-center gap-2 mb-5">
                  <MdAddBusiness className="text-[#3a614c] text-xl" />
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                    Brooker Details
                  </h3>
                </div>
                <div className="space-y-5">
                  <Controller
                    name="BrookerNumber"
                    control={control}
                    render={({ field }) => (
                      <div className="relative">
                        <ABLCustomInput
                          {...field}
                          label="ID"
                          type="text"
                          placeholder={isEdit ? 'Brooker Number' : 'Auto-generated'}
                          register={register}
                          error={errors.BrookerNumber?.message}
                          id="BrookerNumber"
                          disabled
                          onFocus={() => setIdFocused(true)}
                          onBlur={() => setIdFocused(false)}
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
                    label="Brooker Name"
                    type="text"
                    placeholder="Enter brooker name"
                    register={register}
                    error={errors.name?.message}
                    id="name"
                  />
                  <ABLCustomInput
                    label="Mobile Number"
                    type="tel"
                    placeholder="Enter mobile number"
                    register={register}
                    error={errors.mobile?.message}
                    id="mobile"
                  />
                  <ABLCustomInput
                    label="Address"
                    type="text"
                    placeholder="Enter complete address"
                    register={register}
                    error={errors.address?.message}
                    id="address"
                  />
                </div>
              </div>
            </div>

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
                      <span>{isEdit ? 'Update Brooker' : 'Create Brooker'}</span>
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
              <MdAddBusiness className="text-[#3a614c]" />
              <span className="text-sm">Fill in all required fields marked with an asterisk (*)</span>
            </div>
            <Link
              href="/brookers"
              className="text-[#3a614c] hover:text-[#6e997f] dark:text-[#3a614c] dark:hover:text-[#6e997f] text-sm font-medium transition-colors"
            >
              Back to Brookers List
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrookerForm;