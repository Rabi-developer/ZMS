'use client';
import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import CustomInput from '@/components/ui/CustomInput';
import { createDeliveryTerm, updateDeliveryTerm, getAllDeliveryTerms } from '@/apis/deliveryterm';
import { toast } from 'react-toastify';
import { useRouter } from 'next/navigation';
import { MdAddBusiness, MdAdd, MdDelete } from 'react-icons/md';
import Link from 'next/link';
import { BiSolidErrorAlt } from 'react-icons/bi';

const DeliveryTermSchema = z.object({
  listid: z.string().optional(),
  descriptions: z.string().min(1, 'Description is required'),
  segment: z.string().optional(),
});

type DeliveryTermData = z.infer<typeof DeliveryTermSchema>;

const DeliveryTerm = ({ isEdit = false }: { isEdit?: boolean }) => {
  const router = useRouter();
  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<DeliveryTermData>({
    resolver: zodResolver(DeliveryTermSchema),
    defaultValues: {
      listid: '',
      descriptions: '',
      segment: '',
    },
  });

  const [idFocused, setIdFocused] = useState(false);
  const [segment, setsegment] = useState<string[]>(['']);

  React.useEffect(() => {
    if (isEdit) {
      const fetchDeliveryTerm = async () => {
        const listid = window.location.pathname.split('/deliveryterm/').pop();
        if (listid) {
          try {
            const response = await getAllDeliveryTerms();
            const foundDeliveryTerm = response.data.find((item: any) => item.listid === listid);
            if (foundDeliveryTerm) {
              setValue('listid', foundDeliveryTerm.listid || '');
              setValue('descriptions', foundDeliveryTerm.description || '');
              const conditionArray = foundDeliveryTerm.segment?.split('|')?.filter((s: string) => s) || [''];
              setsegment(conditionArray);
              setValue('segment', foundDeliveryTerm.segment || '');
            } else {
              toast.error('Delivery Term not found');
              router.push('/deliveryterm');
            }
          } catch (error) {
            console.error('Error fetching Delivery Term:', error);
            toast.error('Failed to load Delivery Term');
          }
        }
      };
      fetchDeliveryTerm();
    }
  }, [isEdit, setValue, router]);

  const handleAddCondition = () => {
    setsegment([...segment, '']);
  };

  const handleDeleteCondition = (index: number) => {
    if (segment.length > 1) {
      const newsegment = segment.filter((_, i) => i !== index);
      setsegment(newsegment);
      setValue('segment', newsegment.join('|'));
    }
  };

  const handleConditionChange = (index: number, value: string) => {
    const newsegment = [...segment];
    newsegment[index] = value;
    setsegment(newsegment);
    setValue('segment', newsegment.join('|'));
  };

  const onSubmit = async (data: DeliveryTermData) => {
    try {
      if (isEdit) {
        await updateDeliveryTerm(data.listid!, data);
        toast.success('Delivery Term updated successfully!');
      } else {
        await createDeliveryTerm(data);
        toast.success('Delivery Term created successfully!');
      }
      router.push('/deliveryterm');
    } catch (error) {
      toast.error('An error occurred while saving the Delivery Term');
    }
  };

  return (
    <div className="container mx-auto bg-white shadow-lg rounded dark:bg-[#030630]">
      <div className="w-full bg-[#06b6d4] h-[7vh] rounded">
        <h1 className="text-[23px] font-mono ml-10 mt-8 pt-3 text-white flex gap-2">
          <MdAddBusiness />
          {isEdit ? 'EDIT DELIVERY TERM' : 'ADD NEW DELIVERY TERM'}
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
                placeholder="Enter term name"
                value={field.value || ''}
                onChange={field.onChange}
              />
            )}
          />

          <div className="col-span-3">
            <label className="block text-sm font-medium text-gray-700 mb-2">Segment</label>
            {segment.map((condition, index) => (
              <div
                key={index}
                className="grid grid-cols-2 gap-3 mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700"
              >
                <CustomInput
                  label=""
                  type="text"
                  placeholder="Enter Condition"
                  value={condition}
                  onChange={(e) => handleConditionChange(index, e.target.value)}
                  error={index === 0 ? errors.segment?.message : undefined}
                />
                {segment.length > 1 && (
                  <Button
                    type="button"
                    onClick={() => handleDeleteCondition(index)}
                    className="bg-red-500 hover:bg-red-600 text-white p-2.5 rounded-full h-10 w-10 flex items-center justify-center"
                  >
                    <MdDelete className="text-lg" />
                  </Button>
                )}
              </div>
            ))}
            <Button
              type="button"
              onClick={handleAddCondition}
              className="mt-3 bg-[#06b6d4] hover:bg-[#0891b2] text-white px-5 py-2.5 rounded-lg flex items-center gap-2 text-sm font-medium transition-all duration-200"
            >
              <MdAdd className="text-lg" />
              Add More Condition
            </Button>
          </div>
        </div>
        <div className="w-full h-[8vh] flex justify-end gap-2 mt-3 border-t-2 border-[#e7e7e7]">
          <Button
            type="submit"
            className="w-[160px] gap-2 inline-flex items-center bg-[#0e7d90] hover:bg-[#0891b2] text-white px-6 py-2 text-sm font-medium transition-all duration-200 font-mono text-base hover:translate-y-[-2px] focus:outline-none active:shadow-[#3c4fe0_0_3px_7px_inset] active:translate-y-[2px] mt-2"
          >
            {isEdit ? 'Update Delivery Term' : 'Create Delivery Term'}
          </Button>
          <Link href="/deliveryterm">
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

export default DeliveryTerm;