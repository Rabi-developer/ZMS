"use client";

import React, { useEffect, useState } from "react";

import { useForm } from "react-hook-form";

import { useRouter } from "next/navigation";

import { toast } from "react-toastify";

import Link from "next/link";

import { z } from "zod";

import { zodResolver } from "@hookform/resolvers/zod";

import { createAddress, updateAddress } from "@/apis/address";

import { getAllBranch } from "@/apis/branchs";

import CustomInput from "@/components/ui/CustomInput"; 

import CustomInputDropdown from "@/components/ui/CustomeInputDropdown"; 

import { Button } from '../ui/button';

import { MdAddBusiness } from "react-icons/md";

// Define Zod schema for validation

const Schema = z.object({

  addressLine1: z.string().min(1, "Address Line 1 is required"),

  addressLine2: z.string().optional(),

  city: z.string().min(1, "City is required"),

  state: z.string().min(1, "State is required"),

  country: z.string().min(1, "Country is required"),

  zip: z.string().optional(),

  branchId: z.string().min(1, "Branch is required"),

});

type FormData = z.infer<typeof Schema>;

// Define Branch interface

interface Branch {

  id: string;

  name: string;

  [key: string]: unknown; // For any other properties

}

// Define component props interface

interface AddressProps {

  id?: string;

  initialData?: Partial<FormData>;

}

const Address = ({ id, initialData }: AddressProps) => {

  const [branches, setBranches] = useState<Branch[]>([]);

  const [loading, setLoading] = useState(false);

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

  const fetchBranches = async () => {

    try {

      setLoading(true);

      const response = await getAllBranch(1, 100);

      setBranches(response.data);

    } catch (error) {

      console.error("Error fetching branches:", error);

    } finally {

      setLoading(false);

    }

  };

  useEffect(() => {

    fetchBranches();

    if (initialData) {

      reset(initialData);

    }

  }, [initialData, reset]);

  const onSubmit = async (data: FormData) => {

    try {

      let response;

      if (id) {

        const updateData = { ...data, id };

        response = await updateAddress(id, updateData);

        toast("Updated Successfully", { type: "success" });

      } else {

        response = await createAddress(data);

        toast("Created Successfully", { type: "success" });

      }

      console.log(response);

      reset();

      router.push("/address");

    } catch (error) {

      console.error("Error submitting form:", error);

    }

  };

  return (

    <div className="container mx-auto bg-white shadow-lg rounded dark:bg-[#030630]">

      {/* Header */}

      <div className="w-full bg-[#06b6d4] h-[7vh] rounded">

        <h1 className="text-[23px] font-mono ml-10 mt-8 pt-3 text-white flex gap-2">

          <MdAddBusiness />

          {id ? "UPDATE" : "ADD NEW"} Address

        </h1>

      </div>

      {/* Form */}

      <form onSubmit={handleSubmit(onSubmit)}>

        <div className="grid grid-cols-2 gap-4 p-10 w-full flex justify-center">

          {/* Address Fields */}

          <CustomInput

            variant="floating"

            borderThickness="2"

            label="Address Line 1"

            id="addressLine1"

            {...register("addressLine1")}

            register={register} 

            error={errors.addressLine1?.message}

          />

          <CustomInput

            variant="floating"

            borderThickness="2"

            label="Address Line 2"

            id="addressLine2"

            register={register} 

            {...register("addressLine2")}

          />

          

          <CustomInput

            variant="floating"

            borderThickness="2"

            label="City"

            id="city"

            {...register("city")}

            register={register} 

            error={errors.city?.message}

          />

          <CustomInput

            variant="floating"

            borderThickness="2"

            label="State"

            id="state"

            {...register("state")}

            register={register} 

            error={errors.state?.message}

          />

          <CustomInput

            variant="floating"

            borderThickness="2"

            label="Country"

            id="country"

            register={register} 

            {...register("country")}

            error={errors.country?.message}

          />

          <CustomInput

            variant="floating"

            borderThickness="2"

            label="ZIP"

            id="zip"

            register={register} 

            {...register("zip")}

          />

         <CustomInputDropdown

          label="Choose a Branch"

          options={branches.map((item: Branch) => ({

            id: item.id,   

            name: item.name, 

          }))}

          selectedOption={initialData?.branchId || ""} 

          onChange={(value) => setValue("branchId", value)} 

          error={errors.branchId?.message}

         />

        </div>

        {/* Buttons */}

        <div className="w-full h-[8vh] flex justify-end gap-2 mt-3 border-t-2 border-[#e7e7e7]">

          <Button 

            type="submit" 

            className="w-[160] gap-2 inline-flex items-center bg-[#0e7d90] hover:bg-[#0891b2] text-white px-6 py-2 text-sm font-medium transition-all duration-200 font-mono text-base hover:translate-y-[-2px] focus:outline-none active:shadow-[#3c4fe0_0_3px_7px_inset] active:translate-y-[2px] mt-2"

          >

            {id ? "Update Address" : "Create Address"}

          </Button>

          <Link href="/address">

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

export default Address;

