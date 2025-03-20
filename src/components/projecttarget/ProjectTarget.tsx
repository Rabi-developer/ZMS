'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'react-toastify';
import CustomInput from '@/components/ui/CustomInput';
import CustomInputDropdown from '../ui/CustomeInputDropdown';
import { MdAddBusiness } from 'react-icons/md';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { createProjectTarget, updateProjectTarget } from '@/apis/projecttarget'; 
import { getAllEmployee } from '@/apis/employee';
import { AiOutlinePlus, AiOutlineDelete } from "react-icons/ai";

// Zod schema for form validation
const Schema = z.object({
  targetPeriod: z.string().min(1, 'Target Period is required'),
  targetDate: z.string().min(1, 'Target Date is required'),
  targetEndDate: z.string().min(1, 'Target End Date is required'),
  targetValue: z.string().min(1, 'Target Value is required'),
  purpose: z.string().min(1, 'Purpose is required'),
  projectStatus: z.string().min(1, 'Project Status is required'),
  projectManager: z.string().min(1, 'Project Manager is required'),
  financialHealth: z.string().min(1, 'Financial Health is required'),
  buyerName: z.string().min(1, 'Buyer Name is required'),
  sellerName: z.string().min(1, 'Seller Name is required'),
  stepsToComplete: z.string().optional(),
  attachments: z.string().optional(),
  employeeId: z.string().min(1, "Employee is required"),
  EmployeeType: z.string().min(1, "Employee Type is required"),
  duedate: z.string().optional(),
  approvedBy: z.string().min(1, 'Approved By is required'),
  approvalDate: z.string().min(1, 'Approval Date is required'),
});

type FormData = z.infer<typeof Schema>;

const ProjectTarget = ({ id, initialData }: any) => {
  const [targetPeriod, setTargetPeriod] = useState<string>('');
  const [projectStatus, setProjectStatus] = useState<string>('');
  const [financialHealth, setFinancialHealth] = useState<string>('');
  const [employeeOptions, setEmployeeOptions] = useState<{ id: string, name: string }[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [steps, setSteps] = useState<string[]>(['']);

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

  // Handle dynamic steps input
  const addStep = () => {
    setSteps([...steps, '']);
  };

  const removeStep = (index: number) => {
    const updatedSteps = steps.filter((_, i) => i !== index);
    setSteps(updatedSteps);
  };

  const handleStepChange = (index: number, value: string) => {
    const updatedSteps = [...steps];
    updatedSteps[index] = value;
    setSteps(updatedSteps);
  };

  // Fetch employees on component mount
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const employees = await getAllEmployee();
        setEmployeeOptions(employees.map((emp: any) => ({ id: emp.id, name: emp.name })));
      } catch (error) {
        console.error('Error fetching employees:', error);
        toast('Failed to fetch employees', { type: 'error' });
      }
    };

    fetchEmployees();
  }, []);

  // Dropdown options
  const targetPeriodOptions = [
    { id: 1, name: 'Week' },
    { id: 2, name: 'Month' },
    { id: 3, name: 'Day' },
    { id: 4, name: 'Year' },
  ];

  const projectStatusOptions = [
    { id: 1, name: 'Planning' },
    { id: 2, name: 'In Progress' },
    { id: 3, name: 'Completed' },
    { id: 4, name: 'On Hold' },
    { id: 5, name: 'Cancelled' },
  ];

  const financialHealthOptions = [
    { id: 1, name: 'Excellent' },
    { id: 2, name: 'Good' },
    { id: 3, name: 'Fair' },
    { id: 4, name: 'Poor' },
  ];

  useEffect(() => {
    if (initialData) {
      reset(initialData);
    }
  }, [initialData, reset]);

  const onSubmit = async (data: FormData) => {
    try {
      let response;
      if (id) {
        // Update project target
        response = await updateProjectTarget(id, data);
        toast('Project Target Updated Successfully', { type: 'success' });
      } else {
        // Create new project target
        response = await createProjectTarget(data);
        toast('Project Target Created Successfully', { type: 'success' });
      }
      reset();
      router.push('/project-target'); // Redirect to the project target list page
    } catch (error) {
      console.error('Error submitting form:', error);
      toast('An error occurred', { type: 'error' });
    }
  };

  return (
    <div className="container mx-auto bg-white shadow-lg rounded dark:bg-[#030630]">
      <div className="w-full bg-[#06b6d4] h-[7vh] rounded dark:bg-[#387fbf]">
        <h1 className="text-base text-[23px] font-mono ml-10 mt-8 pt-3 text-white flex gap-2">
          <MdAddBusiness />
          {id ? 'Edit Project Target' : 'Add New Project Target'}
        </h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Target Details */}
          <h2 className="text-xl font-bold text-black dark:text-white">Target Details</h2>
          <div className="grid grid-cols-3 gap-4 p-4">
            <CustomInputDropdown
              label="Target Period"
              options={targetPeriodOptions}
              selectedOption={targetPeriod}
              onChange={(value) => setTargetPeriod(value)}
              error={errors.targetPeriod?.message}
            />
            <CustomInput
              type="date"
              variant="floating"
              borderThickness="2"
              label="Target Start Date"
              id="targetDate"
              register={register}
              {...register('targetDate')}
              error={errors.targetDate?.message}
            />
             <CustomInput
              type="date"
              variant="floating"
              borderThickness="2"
              label="Target End Date"
              id="targetDate"
              register={register}
              {...register('targetEndDate')}
              error={errors.targetEndDate?.message}
            />
           
        
       

            
          <CustomInput
              variant="floating"
              borderThickness="2"
              label="Target Value"
              id="targetValue"
              register={register}
              {...register('targetValue')}
              error={errors.targetValue?.message}
            />
            <CustomInput
              variant="floating"
              borderThickness="2"
              label="Purpose"
              id="purpose"
              register={register}
              {...register('purpose')}
              error={errors.purpose?.message}
            />
            <CustomInputDropdown
              label="Project Status"
              options={projectStatusOptions}
              selectedOption={projectStatus}
              onChange={(value) => setProjectStatus(value)}
              error={errors.projectStatus?.message}
            />
            <CustomInputDropdown
              label="Employee"
              options={employeeOptions}
              selectedOption={selectedEmployee}
              onChange={(value) => setSelectedEmployee(value)}
              error={errors.employeeId?.message}
            />
            <CustomInputDropdown
              label="Financial Health"
              options={financialHealthOptions}
              selectedOption={financialHealth}
              onChange={(value) => setFinancialHealth(value)}
              error={errors.financialHealth?.message}
            />
            <CustomInput
              variant="floating"
              borderThickness="2"
              label="Buyer Name"
              id="buyerName"
              register={register}
              {...register('buyerName')}
              error={errors.buyerName?.message}
            />
            <CustomInput
              variant="floating"
              borderThickness="2"
              label="Seller Name"
              id="sellerName"
              register={register}
              {...register('sellerName')}
              error={errors.sellerName?.message}
            />
            <CustomInput
              type="file"
              variant="floating"
              borderThickness="2"
              label="Attachments"
              id="attachments"
              register={register}
              {...register('attachments')}
              error={errors.attachments?.message}
            />
            <CustomInput
              type='date'
              variant="floating"
              borderThickness="2"
              label="Due Date"
              id="duedate"
              register={register}
              {...register('duedate')}
              error={errors.duedate?.message}
            />
          
        </div>

        {/* Steps to Complete Project */}
        <div className="p-4">
        <h2 className="text-xl font-bold text-black dark:text-white">Steps to Complete Project</h2>
       {steps.map((step, index) => (
       <div key={index} className="flex items-center  gap-2 mb-2">
        <div className='w-[100vh]'>
        <CustomInput
        variant="floating"
        borderThickness="2"
        label={`Step ${index + 1}`}
        value={step}
        onChange={(e) => handleStepChange(index, e.target.value)}
        />
        </div>
        <div className="flex gap-1 mt-7">
          {index > 0 && (
          <button
            type="button"
            onClick={() => removeStep(index)}
            className="p-2 bg-red-500 hover:bg-red-600 text-white rounded"
          >
            <AiOutlineDelete size={20} />
          </button>
          )}
          <button
          type="button"
          onClick={addStep}
          className="p-2 bg-green-500 hover:bg-green-600 text-white rounded"
         >
          <AiOutlinePlus size={20} />
        </button>
      </div>
      
    </div>
  ))}
  
             </div>
             <div className='grid grid-cols-2 gap-4 p-4'>
             <CustomInput
              variant="floating"
              borderThickness="2"
              label="Approved By"
              id="approvedBy"
              register={register}
              {...register('approvedBy')}
              error={errors.approvedBy?.message}
            />
            <CustomInput
              type="date"
              variant="floating"
              borderThickness="2"
              label="Approval Date"
              id="approvalDate"
              register={register}
              {...register('approvalDate')}
              error={errors.approvalDate?.message}
            />
         </div>
        {/* Submit and Cancel Buttons */}
        <div className="w-full h-[8vh] flex justify-end gap-2 mt-3 bg-transparent border-t-2 [#e7e7e7]">
          <Button
            type="submit"
            className="w-[160] gap-2 inline-flex items-center bg-[#0e7d90] hover:bg-[#0891b2] text-white px-6 py-2 text-sm font-medium transition-all duration-200 font-mono text-base hover:translate-y-[-2px] focus:outline-none active:shadow-[#3c4fe0_0_3px_7px_inset] active:translate-y-[2px] mt-2"
          >
            {id ? 'Update' : 'Submit'}
          </Button>
          <Link href="/projecttarget">
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

export default ProjectTarget;