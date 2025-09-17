'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'react-toastify';
import CustomInput from '@/components/ui/CustomInput';  
import CustomInputDropdown from '@/components/ui/CustomeInputDropdown';
import { MdAddBusiness } from "react-icons/md";
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { createEmployeeManagement, updateEmployeeManagement } from '@/apis/employeemanagement';
import { getAllEmployee } from '@/apis/employee';

  const Schema = z.object({
  EmployeeId: z.string().min(1, "Employee is required"),
  Department: z.string().min(1, "Department is required"),
  JobTitle: z.string().min(1, "Job Tittle are required"),
  HireDate: z.string().optional(),
  EmployeeType: z.string().optional(),
  Salary: z.string().optional(),
  ImportantDates: z.string().optional(),
  WorkLocation:z.string().optional(),
  Promotion:z.string().optional(),
  Position:z.string().optional(),
  });

type FormData = z.infer<typeof Schema>;

const EmployeeManagementForm = ({ id, initialData }: any) => {
  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [salaryStructure, setSalaryStructure] = useState<string>('');
  const [EmployeeOption, setEmployeeOption] = useState<string>('');
  const [text, setText] = useState("");


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
  
  const EmployeeType = [
    { id: 1, name: 'Permanent' },
    { id: 2, name: 'Contract' },
    { id: 3, name: 'Full-Time' },
    { id: 4, name: 'Part-Time' },
    { id: 5, name: 'Freelance' },
  ];

  const handleEmployeeDropdownChange = (value: string) => {
    setEmployeeOption(value);
  };
 
  // Fetch employees 
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const response = await getAllEmployee();
        setEmployees(response.data);
      } catch (error) {
        console.error("Error fetching employees:", error);
      }
    };
    fetchEmployees();
  }, []);

   
  // Set initial data if editing
  useEffect(() => {
    if (initialData) {
      reset(initialData);
      setSelectedEmployee(initialData.employeeId);
      setSalaryStructure(initialData.salaryStructure);
    }
  }, [initialData, reset]);

  const onSubmit = async (data: any) => {
    console.log("Form submitted with data:", data); 
    try {
      let response;
      if (id) {
        const updateData = { ...data, id };
        console.log("Updating employee with data:", updateData); 
        response = await updateEmployeeManagement(id, updateData);
        toast("Updated Successfully", { type: "success" });
      } else {
        console.log("Creating employee with data:", data); 
        response = await createEmployeeManagement(data);
        toast("Created Successfully", { type: "success" });
      }
      console.log("API response:", response); 
      reset();
      router.push("/employeemanagement");
    } catch (error) {
      console.error("Error submitting form:", error);
      toast("An error occurred while submitting the form", { type: "error" });
    }
  };
  return (
    <div className="container mx-auto bg-white shadow-lg rounded dark:bg-[#030630]">
      <div className="w-full bg-[#06b6d4] h-[7vh] rounded dark:bg-[#387fbf]">
        <h1 className="text-base text-[23px] font-mono ml-10 mt-8 pt-3 text-white flex gap-2">
          <MdAddBusiness />
          {id ? "Edit Employee Management" : "Add New Employee Management"}
        </h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="p-2 w-full">
          <div className="p-4">
            <h2 className="text-xl font-bold text-black dark:text-white">Employee Details</h2>
            <div className="grid grid-cols-3 gap-4">
              <CustomInputDropdown
                label="Employee Name"
                options={employees.map((emp) => ({ id: emp.id, name: emp.name }))}
                selectedOption={selectedEmployee}
                onChange={(value) => {
                  setSelectedEmployee(value);
                  setValue("EmployeeId", value);
                }}
                error={errors.EmployeeId?.message}
              />
              <CustomInput
                variant="floating"
                borderThickness="2"
                label="Department"
                id="department"
                register={register}
                {...register("Department")}
                error={errors.Department?.message}
              />
              <CustomInput
                variant="floating"
                borderThickness="2"
                label="Job Tittle"
                id="jobtittle"
                register={register}
                {...register("JobTitle")}
                error={errors.JobTitle?.message}
              />
              <CustomInput
                type="number"
                variant="floating"
                borderThickness="2"
                label="Salary"
                id="salary"
                register={register}
                {...register("Salary")}
                error={errors.Salary?.message}
              />
              <CustomInput
                type="date"
                variant="floating"
                borderThickness="2"
                label="Hire Date"
                id="hireDate"
                register={register}
                {...register("HireDate")}
                error={errors.HireDate?.message}
              />
              <CustomInputDropdown
              label="Employment Type"
              options={EmployeeType.map((type) => ({ id: type.id, name: type.name }))}
              selectedOption={EmployeeOption}
              onChange={(value) => {
              console.log("Selected employment type:", value);
              setEmployeeOption(value);
              setValue("EmployeeType", value);
              }}
              error={errors.EmployeeType?.message}
               />
              <CustomInput
                variant="floating"
                borderThickness="2"
                label="Work Location"
                id="worklocation"
                register={register}
                {...register("WorkLocation")}
                error={errors.WorkLocation?.message}
              />
              <CustomInput
                variant="floating"
                borderThickness="2"
                label="Promotion History"
                id="promotion"
                register={register}
                {...register("Promotion")}
                error={errors.Promotion?.message}
              />
              <CustomInput
                type="date"
                variant="floating"
                borderThickness="2"
                label="Termination Dates"
                id="importantDates"
                register={register}
                {...register("ImportantDates")}
                error={errors.ImportantDates?.message}
              />
              <CustomInput
                variant="floating"
                borderThickness="2"
                label="Employee Position"
                id="employeeposition"
                register={register}
                {...register("Position")}
                error={errors.Position?.message}
              />
            </div>
            <div className="  p-5 ml-7 bg-white shadow-md rounded-lg mx-auto">
            <textarea
            id="message"
            className="w-full h-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
            placeholder="Any additional notes or comments about the employee's work details"
            value={text}
            onChange={(e) => setText(e.target.value)}
             ></textarea>
            <p className="text-gray-500 mt-2">Character Count: {text.length}</p>
            </div>
            </div>
            </div>

        <div className="w-full h-[8vh] flex justify-end gap-2  mt-3 bg-transparent border-t-2 [#e7e7e7]">
          <Button
            type="submit"
            className="w-[160] gap-2 inline-flex items-center bg-[#0e7d90] hover:bg-[#0891b2] text-white px-6 py-2 text-sm font-medium transition-all duration-200 font-mono text-base hover:translate-y-[-2px] focus:outline-none active:shadow-[#3c4fe0_0_3px_7px_inset] active:translate-y-[2px] mt-2"
          >
            {id ? "Update" : "Submit"}
          </Button>
            <Link href="/employeemanagement">
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

export default EmployeeManagementForm;