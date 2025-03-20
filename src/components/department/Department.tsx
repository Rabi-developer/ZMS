'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createDepartment, updateDepartment } from '@/apis/departments';
import { getAllBranch } from '@/apis/branchs';
import { getAllAddress } from '@/apis/address';
import { toast } from 'react-toastify';
import Link from 'next/link';
import CustomInput from '@/components/ui/CustomInput';
import CustomInputDropdown from '@/components/ui/CustomeInputDropdown';
import { Button } from '../ui/button';
import { MdAddBusiness } from "react-icons/md";

// Define Zod schema for validation
const Schema = z.object({
  name: z.string().min(1, "Name is required"),
  shortName: z.string().min(1, "Short Name is required"),
  headOfDepartment: z.string().min(1, "Head of Department is required"),
  addressId: z.string().min(1, "Address ID is required"),
  branchId: z.string().min(1, "Branch ID is required"),
});

type FormData = z.infer<typeof Schema>;

const Department = ({ id, initialData }: any) => {
  const [branchs, setBranchs] = useState([]);
  const [address, setAddress] = useState([]);
  const router = useRouter();
  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm<FormData>({
    resolver: zodResolver(Schema),
    defaultValues: initialData || {},
  });

  useEffect(() => {
    const fetchBranchs = async () => {
      try {
        const response = await getAllBranch(1, 100);
        console.log("Branch data fetched:", response.data); // Debugging
        setBranchs(response.data);
      } catch (error) {
        console.error(error);
      }
    };

    const fetchAddress = async () => {
      try {
        const response = await getAllAddress(1, 100);
        console.log("Address data fetched:", response.data); // Debugging
        setAddress(response.data);
      } catch (error) {
        console.error(error);
      }
    };

    fetchBranchs();
    fetchAddress();
    if (initialData) {
      console.log("Initial data:", initialData); // Debugging
      reset(initialData);
    }
  }, [initialData, reset]);

  const onSubmit = async (data: FormData) => {
    console.log("Form data submitted:", data); // Debugging
    try {
      let response;
      if (id) {
        const updateData = { ...data, id };
        console.log("Updating department with data:", updateData); // Debugging
        response = await updateDepartment(id, updateData);
        toast("Updated Successfully", { type: "success" });
      } else {
        console.log("Creating department with data:", data); // Debugging
        response = await createDepartment(data);
        toast("Created Successfully", { type: "success" });
      }
      console.log("API response:", response); // Debugging
      reset();
      router.push("/department");
    } catch (error) {
      console.error("Error submitting form:", error);
      toast("An error occurred while submitting the form", { type: "error" });
    }
  };

  return (
    <div className="container mx-auto bg-white shadow-lg rounded">
      <div className="w-full bg-[#06b6d4] h-[7vh] rounded">
        <h1 className='text-base text-[23px] font-mono ml-10 mt-8 pt-3 text-white flex gap-2 '>
          <MdAddBusiness />
          ADD NEW WAREHOUSE
        </h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className='grid grid-cols-2 gap-4 p-10 w-full flex justify-center'>
          {/* Warehouse Name */}
          <CustomInput
            variant="floating"
            borderThickness="2"
            label="Warehouse Name"
            id="name"
            register={register}
            {...register("name")}
            error={errors.name?.message}
          />

          {/* Short Name */}
          <CustomInput
            variant="floating"
            borderThickness="2"
            label="Short Name"
            id="shortName"
            register={register}
            {...register("shortName")}
            error={errors.shortName?.message}
          />

          {/* Head of Warehouse */}
          <CustomInput
            variant="floating"
            borderThickness="2"
            label="Head of Warehouse"
            id="headOfDepartment"
            register={register}
            {...register("headOfDepartment")}
            error={errors.headOfDepartment?.message}
          />

          {/* Branch Dropdown */}
          <CustomInputDropdown
            label="Choose a Branch"
            options={branchs.map((item: any) => ({
              id: item.id,
              name: item.name,
            }))}
            selectedOption={initialData?.branchId || ""}
            onChange={(value) => {
              console.log("Selected branchId:", value); // Debugging
              setValue("branchId", value);
            }}
            error={errors.branchId?.message}
          />

          {/* Address Dropdown */}
          <CustomInputDropdown
            label="Choose an Address"
            options={address.map((item: any) => ({
              id: item.id,
              name: item.name,
            }))}
            selectedOption={initialData?.addressId || ""}
            onChange={(value) => {
              console.log("Selected addressId:", value); // Debugging
              setValue("addressId", value);
            }}
            error={errors.addressId?.message}
          />
        </div>

        {/* Form Buttons */}
        <div className="w-full h-[8vh] flex justify-end gap-2 mt-3 bg-transparent border-t-2 border-[#e7e7e7]">
          <Button
            type="submit"
            className="w-[160] gap-2 inline-flex items-center bg-[#0e7d90] hover:bg-[#0891b2] text-white px-6 py-2 text-sm font-medium transition-all duration-200 font-mono text-base hover:translate-y-[-2px] focus:outline-none active:shadow-[#3c4fe0_0_3px_7px_inset] active:translate-y-[2px] mt-2"
          >
            {id ? "Update Warehouse" : "Submit Warehouse"}
          </Button>
          <Link href="/department">
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

export default Department;