'use client';
import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { createOrganization, updateOrganization } from '@/apis/organization';
import { toast } from 'react-toastify';
import CustomInput from '@/components/ui/CustomInput';
import { MdAddBusiness } from "react-icons/md";
import Link from 'next/link';
import { Button } from '@/components/ui/button';

const Schema = z.object({
  name: z.string().min(1, "Organisation Name is required"),
  description: z.string().optional(),
  email: z.string().optional(),
  website: z.string().optional(),
  addressLine1: z.string().optional(),
  addressLine2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  zip: z.string().optional(),
});

type FormData = z.infer<typeof Schema>;

const Organization = ({ id, initialData }: any) => {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(Schema),
    defaultValues: initialData || {},
  });

  useEffect(() => {
    if (initialData) {
      reset(initialData);
    }
  }, [initialData, reset]);

  const onSubmit = async (data: any) => {
    try {
      let response;
      if (id) {
        const updateData = { ...data, id };
        response = await updateOrganization(id, updateData);
        toast("Updated Successfully", { type: "success" });
      } else {
        response = await createOrganization(data);
        toast("Created Successfully", { type: "success" });
      }
      console.log(response);
      reset();
      router.push("/organization");
    } catch (error) {
      console.error("Error submitting form:", error);
    }
  };

  return (
    <div className="container mx-auto  bg-white shadow-lg rounded">
        <div className=" w-full  bg-[#06b6d4] h-[7vh] rounded ">
         <h1 className='text-base text-[23px] font-mono ml-10 mt-8 pt-3 text-white flex gap-2 '>
         <MdAddBusiness className=''/>
          ADD NEW Comapny</h1>
        </div>

       <form onSubmit={handleSubmit(onSubmit)}>
      <div className='grid grid-cols-2 gap-4  p-10  w-full flex justify-center'>
          <CustomInput
           label="Company Name" 
            id="name"
            variant="floating"
            register={register}
            borderThickness="2"
        
           {...register("name")}
          
           error={errors.name?.message}
            />


          <CustomInput
           variant="floating"
           register={register}
           label="Description"
           borderThickness="2" 
           id="description"
            {...register("description")} 
             error={errors.description?.message}
             />
          <CustomInput 
          variant="floating"
          register={register}
          borderThickness="2"
          label="Company Email" 
          id="email" 
          type="email"
          {...register("email")} 
          error={errors.email?.message}
          />

       

          <CustomInput 
           variant="floating"
           register={register}
           borderThickness="2"
           label="Website" 
           id="website" 
           type="url" {...register("website")}
           error={errors.website?.message}
            />

          <CustomInput  
           variant="floating"
           register={register}
           borderThickness="2"
           label="Address Line 1" 
           id="addressLine1" 
           {...register("addressLine1")}
           error={errors.addressLine1?.message}
           />

          
          <CustomInput 
          variant="floating"
          borderThickness="2"
          register={register}
          label="Address Line 2" 
          id="addressLine2" 
          {...register("addressLine2")} />

          <CustomInput 
          variant="floating"
          borderThickness="2"
          label="City"
          register={register} 
          id="city" 
          {...register("city")} 
          error={errors.city?.message}
          />


          <CustomInput 
          variant="floating"
          borderThickness="2"
          register={register}
          label="State" 
          id="state" 
          {...register("state")} 
          error={errors.state?.message}
          />


          <CustomInput 
           variant="floating"
           borderThickness="2"
           label="Country"
           register={register}
           id="country"
           {...register("country")} 
           error={errors.country?.message}
           />
      
          <CustomInput 
          variant="floating"
          register={register}
          borderThickness="2"
          label="Zip Code"
          id="zip" {...register("zip")}
          error={errors.zip?.message}
            />
      
          </div>
          <div className=" w-full h-[8vh] flex justify-end gap-2 mt-3 bg-transpanent border-t-2  [#e7e7e7]">
        <Button type="submit" className=" w-[160] gap-2 inline-flex items-center bg-[#0e7d90] hover:bg-[#0891b2] text-white  px-6 py-2 text-sm font-medium transition-all duration-200 font-mono text-base  hover:translate-y-[-2px] focus:outline-none active:shadow-[#3c4fe0_0_3px_7px_inset] active:translate-y-[2px] mt-2">
        {id ? "Update" : "Submit"}
        </Button>
        <Link href="/organization" className="">
        <Button type="button" className="w-[160] gap-2 mr-2 inline-flex items-center bg-black hover:bg-[#b0b0b0] text-white  px-6 py-2 text-sm font-medium transition-all duration-200 font-mono text-base  hover:translate-y-[-2px] focus:outline-none active:shadow-[#3c4fe0_0_3px_7px_inset] active:translate-y-[2px] mt-2 ">Cancel
        </Button>
        </Link>
        </div>
      </form>
     
    </div>
  );
};

export default Organization;
