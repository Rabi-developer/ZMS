"use client";
import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import Link from "next/link";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { createGeneralSaleTextType, updateGeneralSaleTextType } from "@/apis/generalSaleTextType";
import CustomInput from "@/components/ui/CustomInput";
import { Button } from '../ui/button';
import { MdAddBusiness } from "react-icons/md";

// Define Zod schema for validation
const Schema = z.object({
  gstType: z.string().min(1, "GST Type is required"),
  percentage: z.string().min(1, "Percentage is required").regex(/^\d+$/, "Percentage must be a number"),
});

type FormData = z.infer<typeof Schema>;

const GeneralSaleTextType = ({ id, initialData }: any) => {
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
    if (initialData) {
      reset(initialData);
      // Format GST Type to include percentage
      if (initialData.percentage) {
        setValue("gstType", `${initialData.percentage}% GST`);
      }
    }
  }, [initialData, reset, setValue]);

  const onSubmit = async (data: FormData) => {
    try {
      let response;
      // Ensure GST Type includes the percentage
      const formattedData = {
        ...data,
        gstType: `${data.percentage}% GST`,
      };
      if (id) {
        const updateData = { ...formattedData, id };
        response = await updateGeneralSaleTextType(id, updateData);
        toast("Updated Successfully", { type: "success" });
      } else {
        response = await createGeneralSaleTextType(formattedData);
        toast("Created Successfully", { type: "success" });
      }
      console.log(response);
      reset();
      router.push("/generalsaletexttype");
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
          ADD NEW General Sale Text Type
        </h1>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-2 gap-4 p-10 w-full flex justify-center">
          {/* GST Type Field */}
          <CustomInput
            variant="floating"
            borderThickness="2"
            label="GST Type"
            id="gstType"
            {...register("gstType")}
            register={register}
            error={errors.gstType?.message}
          />

          {/* Percentage Field */}
          <CustomInput
            type="number"
            variant="floating"
            borderThickness="2"
            label="Percentage"
            id="percentage"
            {...register("percentage")}
            register={register}
            error={errors.percentage?.message}
          />
        </div>

        {/* Buttons */}
        <div className="w-full h-[8vh] flex justify-end gap-2 mt-3 border-t-2 border-[#e7e7e7]">
          <Button
            type="submit"
            className="w-[160] gap-2 inline-flex items-center bg-[#0e7d90] hover:bg-[#0891b2] text-white px-6 py-2 text-sm font-medium transition-all duration-200 font-mono text-base hover:translate-y-[-2px] focus:outline-none active:shadow-[#3c4fe0_0_3px_7px_inset] active:translate-y-[2px] mt-2"
          >
            {id ? "Update GST Type" : "Create GST Type"}
          </Button>
          <Link href="/generalsaletexttype">
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

export default GeneralSaleTextType;