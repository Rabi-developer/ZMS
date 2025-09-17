"use client";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { createBranch, updateBranch } from "@/apis/branchs";
import { getAllOrganization } from "@/apis/organization";
import { toast } from "react-toastify";
import CustomInput from "@/components/ui/CustomInput";
import CustomInputDropdown from "@/components/ui/CustomeInputDropdown"; 
import { MdAddBusiness } from "react-icons/md";
import { useRouter } from "next/navigation";  // Import useRouter
import Link from "next/link";
import { Button } from "@/components/ui/button";

// Define Zod schema for validation
const Schema = z.object({
  name: z.string().min(1, "Branch Name is required"),
  description: z.string().optional(),
  contactPerson: z.string().optional(),
  email: z.string().optional(),
  website: z.string().optional(),
  addressLine1: z.string().optional(),
  addressLine2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  zip: z.string().optional(),
  organizationId: z.string().optional(),
});
type FormData = z.infer<typeof Schema>;

const Branch = ({ id, initialData }: { id?: string; initialData?: FormData }) => {
  const [organizations, setOrganizations] = useState<{ id: string; name: string }[]>([]);
  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm<FormData>({
    resolver: zodResolver(Schema),
    defaultValues: initialData || {},
  });

  const router = useRouter();  // Initialize router here

  const fetchOrganizations = async () => {
    try {
      const response = await getAllOrganization(1, 100);
      setOrganizations(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchOrganizations();
    if (initialData) {
      reset(initialData);
    }
  }, [initialData, reset]);

  const onSubmit = async (data: FormData) => {
    try {
      let response;
      if (id) {
        const updateData = { ...data, id };
        response = await updateBranch(id, updateData);
        toast("Updated Successfully", { type: "success" });
      } else {
        response = await createBranch(data);
        toast("Created Successfully", { type: "success" });
      }
      console.log(response);
      reset();
      router.push("/branchs");  
    } catch (error) {
      console.error("Error submitting form:", error);
    }
  };

  return (
    <div className="container mx-auto bg-white shadow-lg rounded">
      <div className="w-full bg-[#06b6d4] h-[7vh] rounded">
        <h1 className="text-base text-[23px] font-mono ml-10 mt-8 pt-3 text-white flex gap-2">
          <MdAddBusiness />
          ADD NEW Branch
        </h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-3 gap-4 p-10 w-full flex justify-center">
          <CustomInput
            variant="floating"
            borderThickness="2"
            label="Branch Name"
            register={register} 
            id="name"
            {...register("name")}
            error={errors.name?.message}
          />
          <CustomInput
            variant="floating"
            borderThickness="2"
            label="Description"
            id="description"
            register={register} 
            {...register("description")}
            error={errors.description?.message}
          />
          <CustomInput
            variant="floating"
            borderThickness="2"
            label="Contact Person"
            id="contactPerson"
            register={register} 
            {...register("contactPerson")}
            error={errors.contactPerson?.message}
          />
          <CustomInput
            variant="floating"
            borderThickness="2"
            label="Branch Email"
            id="email"
            register={register} 
            {...register("email")}
            error={errors.email?.message}
          />
          <CustomInput
            variant="floating"
            borderThickness="2"
            label="Website"
            id="website"
            {...register("website")}
            error={errors.website?.message}
          />
          <CustomInput
            variant="floating"
            borderThickness="2"
            label="Address Line 1"
            id="addressLine1"
            register={register} 
            {...register("addressLine1")}
            error={errors.addressLine1?.message}
          />
          <CustomInput
            variant="floating"
            borderThickness="2"
            label="Address Line 2"
            id="addressLine2"
            register={register} 
            {...register("addressLine2")}
            error={errors.addressLine2?.message}
          />
          <CustomInput
            variant="floating"
            borderThickness="2"
            label="City"
            id="city"
            register={register} 
            {...register("city")}
            error={errors.city?.message}
          />
          <CustomInput
            variant="floating"
            borderThickness="2"
            label="State"
            register={register} 
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
          <CustomInputDropdown
            label="Organization"
            options={organizations.map((org) => ({
              id: org.id,
              name: org.name,
            }))}
            selectedOption={initialData?.organizationId || ""}
            onChange={(value) => setValue("organizationId", value)} 
            error={errors.organizationId?.message}
          />  
        </div>
        <div className="w-full h-[8vh] flex justify-end gap-2 mt-3 bg-transparent border-t-2 border-[#e7e7e7]">
          <Button
            type="submit"
            className="w-[160] gap-2 inline-flex items-center bg-[#0e7d90] hover:bg-[#0891b2] text-white px-6 py-2 text-sm font-medium transition-all duration-200 font-mono text-base hover:translate-y-[-2px] focus:outline-none active:shadow-[#3c4fe0_0_3px_7px_inset] active:translate-y-[2px] mt-2"
          >
            {id ? "Update" : "Create"} Branch
          </Button>
          <Link href="/branchs">
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

export default Branch;
