"use client";

import Link from "next/link";
import React, { useEffect, useState } from "react";
import { Button } from "../../ui/button";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-toastify";
import ImageInput from "@/components/ui/imageinput";
import CustomInput from "@/components/ui/CustomInput";
import CustomInputDropdown from "@/components/ui/CustomeInputDropdown";
import { MdAddBusiness } from "react-icons/md";
import {
  getAllBranch,
  createBranchSetting,
  getBranchSetting,

} from "@/apis/branchs";
// import { getAllSessions } from "@/apis/sessions";

const Schema = z.object({
  BranchId: z.string().min(1, "Branch is required"),
  RptHeaderLogo: z.any(),
  image: z.any(),
  RptHeaderBranchName: z.string().min(1, "Branch Name is required"),
  RptHeaderBranchAddress: z.string().min(1, "Branch Address is required"),
  RptHeaderBranchPhone: z.string().min(1, "Branch Phone is required"),
  AdmissionNoPrefix: z.string().min(1, "Admission No Prefix is required"),
  CurrentSession: z.string().min(1, "Current Session is required"),
  RptHeaderBranchEmail: z.string().email("Invalid email").min(1, "Email is required"),
  RptFooterDetail: z.string().min(1, "Footer Detail is required"),
});

type FormData = z.infer<typeof Schema>;

const BranchSetting = ({ id, initialData }: any) => {
  const [branches, setBranches] = useState([]);
  const [Sessions, setSessions] = useState([]);
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

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const res = await getAllBranch(1, 100);
        setBranches(res.data);
      } catch (error) {
        console.error("Error fetching branches:", error);
      }
    };

    // const fetchSessions = async () => {
    //   try {
    //     const res = await getAllSessions(); // Replace with actual API
    //     setSessions(res.data);
    //   } catch (error) {
    //     console.error("Error fetching sessions:", error);
    //   }
    // };

    fetchBranches();
    // fetchSessions();
    
    if (initialData) {
      reset(initialData);
    }
  }, [initialData]);

  // const onSubmit = async (data: any) => {
  //   const formData = new FormData();

  //   if (data.RptHeaderLogo) {
  //     formData.append("RptHeaderLogo", data.RptHeaderLogo);
  //   }

  //   formData.append("BranchId", data.BranchId);
  //   formData.append("RptHeaderBranchName", data.RptHeaderBranchName);
  //   formData.append("AdmissionNoPrefix", data.AdmissionNoPrefix);
  //   formData.append("CurrentSession", data.CurrentSession);
  //   formData.append("RptHeaderBranchAddress", data.RptHeaderBranchAddress);
  //   formData.append("RptHeaderBranchPhone", data.RptHeaderBranchPhone);
  //   formData.append("RptHeaderBranchEmail", data.RptHeaderBranchEmail);
  //   formData.append("RptFooterDetail", data.RptFooterDetail);

  //   try {
  //     const response = await createBranchSetting(formData);
  //     toast.success("Form submitted successfully");
  //     reset(response.data);
  //   } catch (error) {
  //     toast.error("Error submitting form");
  //     console.error("Error submitting form:", error);
  //   }
  // };
  const onSubmit = async (data: any) => {
    try {
      let response;
      if (id) {
      } else {
        response = await createBranchSetting(data);
        toast("Created Successfully", { type: "success" });
      }
      console.log(response);
      reset();
      router.push("branchs/settings");  
    } catch (error) {
      console.error("Error submitting form:", error);
    }
  };

  const getBranchSettingData = async (id: any) => {
    try {
      const branchData = await getBranchSetting(id);
      if (branchData?.data.branchId) {
        reset(branchData?.data);
      }
    } catch (error) {
      console.log("branch error", error);
    }
  };

  return (
    <div className="container mx-auto bg-white shadow-lg rounded">
      {/* Header */}
      <div className="w-full bg-[#06b6d4] h-[7vh] rounded">
        <h1 className="text-[23px] font-mono ml-10 mt-8 pt-3 text-white flex gap-2">
          <MdAddBusiness />
          ADD NEW Branch Setting
        </h1>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-2 gap-4 p-10 w-full flex justify-center">
          {/* Branch Dropdown */}
          <CustomInputDropdown
          label="Branch"
          options={branches.map((branch: any) => ({
          id: (branch.id),  
          name: branch.name
         }))}
        selectedOption={initialData?.BranchId || ""}
        onChange={(value) => setValue("BranchId", value)}
        error={errors.BranchId?.message}
/>


          {/* Image Upload */}
          <ImageInput
            id="image"
            label="Upload Image"
            register={register}
            required={true}
          />

          {/* Branch Name */}
          <CustomInput
            variant="floating"
            borderThickness="2"
            label="Branch Name"
            id="RptHeaderBranchName"
            {...register("RptHeaderBranchName")}
            error={errors.RptHeaderBranchName?.message}
          />

          {/* Branch Address */}
          <CustomInput
            variant="floating"
            borderThickness="2"
            label="Branch Address"
            id="RptHeaderBranchAddress"
            register={register} 
            {...register("RptHeaderBranchAddress")}
            error={errors.RptHeaderBranchAddress?.message}
          />

          {/* Branch Phone */}
          <CustomInput
            variant="floating"
            borderThickness="2"
            label="Branch Phone"
            id="RptHeaderBranchPhone"
            register={register} 
            {...register("RptHeaderBranchPhone")}
            error={errors.RptHeaderBranchPhone?.message}
          />

          {/* Current Session Dropdown */}
          {/* <CustomInputDropdown
            label="Current Session"
            options={Sessions.map((session: any) => ({
              id: session.id,
              name: session.name
            }))}
            selectedOption={initialData?.CurrentSession || ""}
            onChange={(value) => setValue("CurrentSession", value)}
          />
          {errors.CurrentSession && <p className="text-red-500 text-xs mt-1">{errors.CurrentSession.message}</p>} */}

          {/* Email */}
          <CustomInput
            variant="floating"
            label="Email"
            id="RptHeaderBranchEmail"
            register={register} 
            {...register("RptHeaderBranchEmail")}
            type="email"
            error={errors.RptHeaderBranchEmail?.message}
          />
        </div>
         {/* Buttons */}
      <div className="w-full h-[8vh] flex justify-end gap-2 mt-3 border-t-2 border-[#e7e7e7]">
        <Button 
          type="submit" 
          className="w-[160] gap-2 inline-flex items-center bg-[#0e7d90] hover:bg-[#0891b2] text-white px-6 py-2 text-sm font-medium transition-all duration-200 font-mono text-base hover:translate-y-[-2px] focus:outline-none active:shadow-[#3c4fe0_0_3px_7px_inset] active:translate-y-[2px] mt-2"
        >
          {id ? "Update" : "Submit"}
        </Button>
        <Link href="/branchs/settings">
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

export default BranchSetting;
