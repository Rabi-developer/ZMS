'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { createEmployee, updateEmployee } from '@/apis/employee';
import { toast } from 'react-toastify';
import CustomInput from '@/components/ui/CustomInput';
import CustomInputDropdown from '../ui/CustomeInputDropdown';
import { MdAddBusiness } from "react-icons/md";
import Link from 'next/link';
import { Button } from '@/components/ui/button';

const Schema = z.object({
  Name: z.string().optional(),
  EmployeeFirstName: z.string().optional(),
  employeemiddlename: z.string().optional(),
  employeelastname:  z.string().optional(),
  gender:  z.string().optional(),
  MobileNumber: z
    .string({ invalid_type_error: "Employee Number must be a number" })
    .min(1, "Employee Count must be at least 1"),
  Date:  z.string().optional(),
  status: z.string().optional(),
  cnicnumber: z
    .string({ invalid_type_error: "Employee CNIC Number must be a number" })
    .min(1, "Employee CNIC must be at least 1"),
  email: z.string().optional(),
  IndustryType:  z.string().optional(),
  address: z.string().optional(),
  Country:  z.string().optional(),
 EmploymentType:  z.string().optional(),
 // option: z.string().min(1, "Option is required"),
  states:  z.string().optional(),
  position:  z.string().optional(),
 // description: z.string().optional(),
});

type FormData = z.infer<typeof Schema>;

const Employee = ({ id, initialData }: any) => {
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [EmployeeOption, setEmployeeOption] = useState<string>('');
  const [statusOption, setstatusOption] = useState<string>('');
  const [marriedOption, setmarriedOption] = useState<string>('');

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

  const options = [
    { id: 1, name: 'Male' },
    { id: 2, name: 'Female' },
    { id: 3, name: 'Other' },
  ];

  const EmployeeType = [
    { id: 1, name: 'Permanent' },
    { id: 2, name: 'Contract' },
  ];

  const handlestatusType = [
    { id: 1, name: 'Active' },
    { id: 2, name: 'Resigned' },
  ];

  const handlemarriedType = [
    { id: 1, name: 'Single' },
    { id: 2, name: 'Married' },
  ];

  useEffect(() => {
    if (initialData) {
      console.log("Initial data:", initialData); // Debugging
      reset(initialData);
    }
  }, [initialData, reset]);

  const onSubmit = async (data: any) => {
    console.log("Form submitted with data:", data); 
    try {
      let response;
      if (id) {
        const updateData = { ...data, id };
        console.log("Updating employee with data:", updateData); 
        response = await updateEmployee(id, updateData);
        toast("Updated Successfully", { type: "success" });
      } else {
        console.log("Creating employee with data:", data); 
        response = await createEmployee(data);
        toast("Created Successfully", { type: "success" });
      }
      console.log("API response:", response); 
      reset();
      router.push("/employee");
    } catch (error) {
      console.error("Error submitting form:", error);
      toast("An error occurred while submitting the form", { type: "error" });
    }
  };

  return (
    <div className="container mx-auto bg-white shadow-lg rounded dark:bg-[#030630]">
      <div className="w-full bg-[#06b6d4] h-[7vh] rounded dark:bg-[#387fbf]">
        <h1 className='text-base text-[23px] font-mono ml-10 mt-8 pt-3 text-white flex gap-2'>
          <MdAddBusiness />
          ADD NEW Employee
        </h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className='p-2 w-full'>
          <div className='p-4'>
            <h2 className='text-xl font-bold text-black dark:text-white'>Personal Information</h2>
            <div className='grid grid-cols-3 gap-4'>
              <CustomInput
                variant="floating"
                borderThickness='2'
                label='First Name'
                id="name"
                 register={register}
                {...register("Name")}
                error={errors.Name?.message}
              />
              
              <CustomInput
                variant="floating"
                borderThickness='2'
                label='Middle  Name'
                id="employeemiddlename"
                register={register}
                {...register("employeemiddlename")}
                error={errors.employeemiddlename?.message}
              />
              <CustomInput
                variant="floating"
                borderThickness='2'
                label='Last Name'
                id="employeelastname"
                register={register}
                {...register("employeelastname")}
                error={errors.employeelastname?.message}
              />
              <CustomInput
                type='number'
                variant="floating"
                borderThickness='2'
                label='Mobile Number'
                id="MobileNumber"
                register={register}
                {...register("MobileNumber")}
                error={errors.MobileNumber?.message}
              />
              <CustomInputDropdown
                label="Gender"
                options={options}
                selectedOption={selectedOption}
                onChange={(value) => {
                console.log("Selected gender:", value); 
                setSelectedOption(value);
                setValue("gender", value);
                }}
                error={errors.gender?.message}
              />
              <CustomInputDropdown
                label="Married Status"
                options={handlemarriedType}
                selectedOption={marriedOption}
                onChange={(value) => {
                console.log("Selected married status:", value); 
                setmarriedOption(value);
                setValue("status", value);
                }}
                error={errors.status?.message}
              />
               <CustomInput
                variant="floating"
                borderThickness='2'
                label='Country'
                id="Country"
                register={register}
                {...register("Country")}
                error={errors.Country?.message}
              />
               <CustomInput
                variant="floating"
                borderThickness='2'
                label='Referance'
                id="EmployeeFirstName"
                register={register}
                {...register("EmployeeFirstName")}
                error={errors.EmployeeFirstName?.message}
              />
              <CustomInput
                variant="floating"
                borderThickness='2'
                label='Address'
                id="address"
                register={register}
                {...register("address")}
                error={errors.address?.message}
              />
            </div>
          </div>

          <div className='p-4'>
            <h2 className='text-xl font-bold text-black dark:text-white'>Company Employee Details</h2>
            <div className='grid grid-cols-3 gap-4'>
              <CustomInput
                type='date'
                variant="floating"
                borderThickness='2'
                label='Hire Date'
                id="date"
                register={register}
                {...register("Date")}
                error={errors.Date?.message}
              />
              <CustomInputDropdown
                label="States"
                options={handlestatusType}
                selectedOption={statusOption}
                onChange={(value) => {
                console.log("Selected state:", value); 
                  setstatusOption(value);
                  setValue("states", value);
                }}
                error={errors.states?.message}
              />
              <CustomInput
                type='number'
                variant="floating"
                borderThickness='2'
                label='CNIC Number'
                id="cnicnumber"
                register={register}
                {...register("cnicnumber")}
                error={errors.cnicnumber?.message}
              />
              <CustomInput
                type='email'
                variant="floating"
                borderThickness='2'
                label='Email'
                id="email"
                register={register}
                {...register("email")}
                error={errors.email?.message}
              />
              <CustomInput
                variant="floating"
                borderThickness='2'
                label='Industry Type'
                id="IndustryType"
                register={register}
                {...register("IndustryType")}
                error={errors.IndustryType?.message}
              />
              <CustomInputDropdown
                label="Employment Type"
                options={EmployeeType}
                selectedOption={EmployeeOption}
                onChange={(value) => {
                  console.log("Selected employment type:", value); // Debugging
                  setEmployeeOption(value);
                  setValue("EmploymentType", value);
                }}
                error={errors.EmploymentType?.message}
              />
              <CustomInput
                variant="floating"
                borderThickness='2'
                label='Employee Position'
                id="position"
                register={register}
                {...register("position")}
                error={errors.position?.message}
              />
            </div>
          </div>
        </div>

        <div className="w-full h-[8vh] flex justify-end gap-2 mt-3 bg-transparent border-t-2 border-[#e7e7e7]">
          <Button
            type="submit"
            className="w-[160] gap-2 inline-flex items-center bg-[#0e7d90] hover:bg-[#0891b2] text-white px-6 py-2 text-sm font-medium transition-all duration-200 font-mono text-base hover:translate-y-[-2px] focus:outline-none active:shadow-[#3c4fe0_0_3px_7px_inset] active:translate-y-[2px] mt-2"
          >
            {id ? "Update" : "Submit"}
          </Button>
          <Link href="/employee">
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

export default Employee;