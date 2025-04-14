'use client';
import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import CustomInput from '@/components/ui/CustomInput';
import { createPickInsertion, updatePickInsertion, getAllPickInsertions } from '@/apis/pickinsertion'; 
import { toast } from 'react-toastify';
import { useRouter } from 'next/navigation';
import { MdAddBusiness } from "react-icons/md";
import Link from "next/link";
import { BiSolidErrorAlt } from "react-icons/bi";

const PickInsertionSchema = z.object({
  listid: z.string().optional(), 
  descriptions: z.string().min(1, 'Description is required'), 
  subDescription: z.string().min(1, 'Sub-Description is required'), 
  useDeletedId: z.boolean().optional(),
});

type PickInsertionData = z.infer<typeof PickInsertionSchema>;

const PickInsertion = ({ isEdit = false }: { isEdit?: boolean }) => {
  const router = useRouter();
  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<PickInsertionData>({
    resolver: zodResolver(PickInsertionSchema),
    defaultValues: {
      listid: '',
      descriptions: '',
      subDescription: '',
      useDeletedId: false,
    },
  });

  const [idFocused, setIdFocused] = useState(false);

  React.useEffect(() => {
    if (isEdit) {
      const fetchPickInsertion = async () => {
        const listid = window.location.pathname.split('/pickinsertion').pop(); 
        if (listid) {
          try {
            const response = await getAllPickInsertions();
            const foundPickInsertion = response.data.find((item: any) => item.listid === listid); 
            if (foundPickInsertion) {
              setValue('listid', foundPickInsertion.listid || '');
              setValue('descriptions', foundPickInsertion.descriptions || '');
              setValue('subDescription', foundPickInsertion.subDescription || '');
              setValue('useDeletedId', false);
            } else {
              toast.error('PickInsertion not found');
              router.push('/pickinsertion');
            }
          } catch (error) {
            console.error('Error fetching Pick Insertion:', error);
            toast.error('Failed to load Pick Insertion');
          }
        }
      };
      fetchPickInsertion();
    }
  }, [isEdit, setValue, router]);

  const onSubmit = async (data: PickInsertionData) => {
    try {
      if (isEdit) {
        await updatePickInsertion(data.listid!, data);
        toast.success('Pick Insertion updated successfully!');
      } else {
        await createPickInsertion(data);
        toast.success('Pick Insertion created successfully!');
      }
      router.push('/pickinsertion');
    } catch (error) {
      toast.error('An error occurred while saving the Pick Insertion');
    }
  };

  return (
    <div className="container mx-auto bg-white shadow-lg rounded dark:bg-[#030630]">
      <div className="w-full bg-[#06b6d4] h-[7vh] rounded">
        <h1 className="text-[23px] font-mono ml-10 mt-8 pt-3 text-white flex gap-2">
          <MdAddBusiness />
          {isEdit ? "EDIT PickInsertion" : "ADD NEW PickInsertion"}
        </h1>
      </div>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-2 gap-4 p-10 w-full flex justify-center">
          <div
            className="relative group"
            onMouseEnter={() => setIdFocused(true)}
            onMouseLeave={() => setIdFocused(false)}
          >
            <Controller
              name="listid" 
              control={control}
              render={({ field }) => (
                <>
                  <CustomInput
                    {...field}
                    label="ID"
                    type="text"
                    disabled
                    placeholder=""
                    value={field.value || ''}
                  />
                  {idFocused && (
                    <>
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <BiSolidErrorAlt className="text-red-500 text-xl cursor-pointer" />
                      </div>
                      <div className="absolute bottom-full right-0 h-8 w-max text-large text-black bg-[#d5e4ff] rounded px-3 py-1 shadow-lg z-10 animate-fade-in">
                        ID is auto-generated by the system
                      </div>
                    </>
                  )}
                </>
              )}
            />
          </div>

          <Controller
            name="descriptions"
            control={control}
            render={({ field }) => (
              <CustomInput
                {...field}
                label="Description" 
                type="text"
                error={errors.descriptions?.message} 
                placeholder="Enter description"
                value={field.value || ''}
                onChange={field.onChange}
              />
            )}
          />

          <Controller
            name="subDescription" 
            control={control}
            render={({ field }) => (
              <CustomInput
                {...field}
                label="Sub-Description" 
                type="text"
                error={errors.subDescription?.message} 
                placeholder="Enter sub-description"
                value={field.value || ''}
                onChange={field.onChange}
              />
            )}
          />

          {!isEdit && (
            <div className="col-span-2 flex items-center gap-2">
              <Controller
                name="useDeletedId"
                control={control}
                render={({ field }) => (
                  <input
                    type="checkbox"
                    checked={field.value || false}
                    onChange={(e) => field.onChange(e.target.checked)}
                    className="h-4 w-4"
                  />
                )}
              />
              <label className="text-sm">Use a previously deleted ID if available</label>
            </div>
          )}
        </div>
        <div className="w-full h-[8vh] flex justify-end gap-2 mt-3 border-t-2 border-[#e7e7e7]">
          <Button
            type="submit"
            className="w-[160px] gap-2 inline-flex items-center bg-[#0e7d90] hover:bg-[#0891b2] text-white px-6 py-2 text-sm font-medium transition-all duration-200 font-mono text-base hover:translate-y-[-2px] focus:outline-none active:shadow-[#3c4fe0_0_3px_7px_inset] active:translate-y-[2px] mt-2"
          >
            {isEdit ? "Update PickInsertion" : "Create PickInsertion"}
          </Button>
          <Link href="/pickinsertion">
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

export default PickInsertion;