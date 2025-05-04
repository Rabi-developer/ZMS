'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'react-toastify';
import { createProjectTarget, updateProjectTarget } from '@/apis/projecttarget';
import { getAllEmployee } from '@/apis/employee';
import { AiOutlinePlus, AiOutlineDelete } from 'react-icons/ai';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { MdAddBusiness } from 'react-icons/md';
import { FaCheck } from 'react-icons/fa';

// Zod schema for form validation
const Schema = z.object({
  targetPeriod: z.string().min(1, 'Target Period is required'),
  targetDate: z.string().min(1, 'Target Start Date is required'),
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
  employeeId: z.string().min(1, 'Employee is required'),
  employeeType: z.string().min(1, 'Employee Type is required'),
  duedate: z.string().optional(),
  approvedBy: z.string().min(1, 'Approved By is required'),
  approvalDate: z.string().min(1, 'Approval Date is required'),
});

type FormData = z.infer<typeof Schema>;

const ProjectTarget = ({ id, initialData }: any) => {
  const [targetPeriod, setTargetPeriod] = useState<string>('');
  const [projectStatus, setProjectStatus] = useState<string>('');
  const [financialHealth, setFinancialHealth] = useState<string>('');
  const [employeeOptions, setEmployeeOptions] = useState<{ id: string; name: string }[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [steps, setSteps] = useState<string[]>(['']);
  const [employeeType, setEmployeeType] = useState<string>('');

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

  // Handle project status checkbox selection
  const handleStatusChange = (status: string) => {
    setProjectStatus(status);
    setValue('projectStatus', status, { shouldValidate: true });
  };

  // Fetch employees on component mount
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const employees = await getAllEmployee();
        setEmployeeOptions(employees.data.map((emp: any) => ({ id: emp.id, name: emp.name })));
      } catch (error) {
        console.error('Error fetching employees:', error);
        toast('Failed to fetch employees', { type: 'error' });
      }
    };

    fetchEmployees();
  }, []);

  // Dropdown options
  const targetPeriodOptions = [
    { id: 1, name: 'Daily' },
    { id: 2, name: 'Weekly' },
    { id: 3, name: '15 Days' },
    { id: 4, name: 'Monthly' },
  ];

  const projectStatusOptions = [
    { id: 1, name: 'Planning', color: '#eab308' },
    { id: 2, name: 'In Progress', color: '#3b82f6' },
    { id: 3, name: 'Completed', color: '#22c55e' },
    { id: 4, name: 'On Hold', color: '#f97316' },
    { id: 5, name: 'Cancelled', color: '#ef4444' },
  ];

  const financialHealthOptions = [
    { id: 1, name: 'Excellent' },
    { id: 2, name: 'Good' },
    { id: 3, name: 'Fair' },
    { id: 4, name: 'Poor' },
  ];

  const employeeTypeOptions = [
    { id: 1, name: 'Full-Time' },
    { id: 2, name: 'Part-Time' },
    { id: 3, name: 'Contract' },
  ];

  useEffect(() => {
    if (initialData) {
      reset(initialData);
      setTargetPeriod(initialData.targetPeriod || '');
      setProjectStatus(initialData.projectStatus || '');
      setFinancialHealth(initialData.financialHealth || '');
      setSelectedEmployee(initialData.employeeId || '');
      setEmployeeType(initialData.employeeType || '');
      setSteps(initialData.stepsToComplete || ['']);
    }
  }, [initialData, reset]);

  const onSubmit = async (data: FormData) => {
    try {
      let response;
      if (id) {
        response = await updateProjectTarget(id, { ...data, stepsToComplete: steps });
        toast('Project Target Updated Successfully', { type: 'success' });
      } else {
        response = await createProjectTarget({ ...data, stepsToComplete: steps });
        toast('Project Target Created Successfully', { type: 'success' });
      }
      reset();
      router.push('/project-target');
    } catch (error) {
      console.error('Error submitting form:', error);
      toast('An error occurred', { type: 'error' });
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-6">
      <div className="container mx-auto bg-white dark:bg-gray-800 shadow-2xl rounded-lg p-8">
        {/* Header */}
        <div className="w-full bg-[#06b6d4] h-[7vh] rounded">
        <h1 className="text-[23px] font-mono ml-10 mt-8 pt-3 text-white flex gap-2">
          <MdAddBusiness />
            {id ? 'Edit Project Target' : 'Add New Project Target'}
          </h1>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="mt-6">
          {/* Target Details */}
          <div className="border-b border-gray-200 dark:border-gray-700 pb-4 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
              Target Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
              <div className="relative">
                <select
                  id="targetPeriod"
                  value={targetPeriod}
                  onChange={(e) => {
                    setTargetPeriod(e.target.value);
                    setValue('targetPeriod', e.target.value, { shouldValidate: true });
                  }}
                  className="peer w-full px-4 py-3 border-2 border-[#06b6d4] dark:border-[#06b6d4] rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:border-[#06b6d4] focus:ring-2 focus:ring-[#06b6d4] hover:border-[#06b6d4] transition-all duration-300 appearance-none"
                >
                  <option value="">Select Period</option>
                  {targetPeriodOptions.map((option) => (
                    <option key={option.id} value={option.name}>
                      {option.name}
                    </option>
                  ))}
                </select>
                <label
                  htmlFor="targetPeriod"
                  className="absolute left-3 -top-2.5 px-1 bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300 peer-focus:text-[#06b6d4] transition-all duration-300"
                >
                  Target Period
                </label>
                {errors.targetPeriod && (
                  <p className="mt-1 text-sm text-red-600">{errors.targetPeriod.message}</p>
                )}
              </div>

              <div className="relative">
                <input
                  id="targetDate"
                  type="date"
                  {...register('targetDate')}
                  className="peer w-full px-4 py-3 border-2 border-[#06b6d4] dark:border-[#06b6d4] rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:border-[#06b6d4] focus:ring-2 focus:ring-[#06b6d4] hover:border-[#06b6d4] transition-all duration-300"
                />
                <label
                  htmlFor="targetDate"
                  className="absolute left-3 -top-2.5 px-1 bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300 peer-focus:text-[#06b6d4] transition-all duration-300"
                >
                  Target Start Date
                </label>
                {errors.targetDate && (
                  <p className="mt-1 text-sm text-red-600">{errors.targetDate.message}</p>
                )}
              </div>

              <div className="relative">
                <input
                  id="targetEndDate"
                  type="date"
                  {...register('targetEndDate')}
                  className="peer w-full px-4 py-3 border-2 border-[#06b6d4] dark:border-[#06b6d4] rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:border-[#06b6d4] focus:ring-2 focus:ring-[#06b6d4] hover:border-[#06b6d4] transition-all duration-300"
                />
                <label
                  htmlFor="targetEndDate"
                  className="absolute left-3 -top-2.5 px-1 bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300 peer-focus:text-[#06b6d4] transition-all duration-300"
                >
                  Target End Date
                </label>
                {errors.targetEndDate && (
                  <p className="mt-1 text-sm text-red-600">{errors.targetEndDate.message}</p>
                )}
              </div>

              <div className="relative">
                <input
                  id="targetValue"
                  type="text"
                  {...register('targetValue')}
                  className="peer w-full px-4 py-3 border-2 border-[#06b6d4] dark:border-[#06b6d4] rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:border-[#06b6d4] focus:ring-2 focus:ring-[#06b6d4] hover:border-[#06b6d4] transition-all duration-300"
                />
                <label
                  htmlFor="targetValue"
                  className="absolute left-3 -top-2.5 px-1 bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300 peer-focus:text-[#06b6d4] transition-all duration-300"
                >
                  Target Value
                </label>
                {errors.targetValue && (
                  <p className="mt-1 text-sm text-red-600">{errors.targetValue.message}</p>
                )}
              </div>

              <div className="relative">
                <input
                  id="purpose"
                  type="text"
                  {...register('purpose')}
                  className="peer w-full px-4 py-3 border-2 border-[#06b6d4] dark:border-[#06b6d4] rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:border-[#06b6d4] focus:ring-2 focus:ring-[#06b6d4] hover:border-[#06b6d4] transition-all duration-300"
                />
                <label
                  htmlFor="purpose"
                  className="absolute left-3 -top-2.5 px-1 bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300 peer-focus:text-[#06b6d4] transition-all duration-300"
                >
                  Purpose
                </label>
                {errors.purpose && (
                  <p className="mt-1 text-sm text-red-600">{errors.purpose.message}</p>
                )}
              </div>

          

              <div className="relative">
                <input
                  id="projectManager"
                  type="text"
                  {...register('projectManager')}
                  className="peer w-full px-4 py-3 border-2 border-[#06b6d4] dark:border-[#06b6d4] rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:border-[#06b6d4] focus:ring-2 focus:ring-[#06b6d4] hover:border-[#06b6d4] transition-all duration-300"
                />
                <label
                  htmlFor="projectManager"
                  className="absolute left-3 -top-2.5 px-1 bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300 peer-focus:text-[#06b6d4] transition-all duration-300"
                >
                  Project Manager
                </label>
                {errors.projectManager && (
                  <p className="mt-1 text-sm text-red-600">{errors.projectManager.message}</p>
                )}
              </div>

              <div className="relative">
                <select
                  id="financialHealth"
                  value={financialHealth}
                  onChange={(e) => {
                    setFinancialHealth(e.target.value);
                    setValue('financialHealth', e.target.value, { shouldValidate: true });
                  }}
                  className="peer w-full px-4 py-3 border-2 border-[#06b6d4] dark:border-[#06b6d4] rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:border-[#06b6d4] focus:ring-2 focus:ring-[#06b6d4] hover:border-[#06b6d4] transition-all duration-300 appearance-none"
                >
                  <option value="">Select Health</option>
                  {financialHealthOptions.map((option) => (
                    <option key={option.id} value={option.name}>
                      {option.name}
                    </option>
                  ))}
                </select>
                <label
                  htmlFor="financialHealth"
                  className="absolute left-3 -top-2.5 px-1 bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300 peer-focus:text-[#06b6d4] transition-all duration-300"
                >
                  Financial Health
                </label>
                {errors.financialHealth && (
                  <p className="mt-1 text-sm text-red-600">{errors.financialHealth.message}</p>
                )}
              </div>

              <div className="relative">
                <input
                  id="buyerName"
                  type="text"
                  {...register('buyerName')}
                  className="peer w-full px-4 py-3 border-2 border-[#06b6d4] dark:border-[#06b6d4] rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:border-[#06b6d4] focus:ring-2 focus:ring-[#06b6d4] hover:border-[#06b6d4] transition-all duration-300"
                />
                <label
                  htmlFor="buyerName"
                  className="absolute left-3 -top-2.5 px-1 bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300 peer-focus:text-[#06b6d4] transition-all duration-300"
                >
                  Buyer Name
                </label>
                {errors.buyerName && (
                  <p className="mt-1 text-sm text-red-600">{errors.buyerName.message}</p>
                )}
              </div>

              <div className="relative">
                <input
                  id="sellerName"
                  type="text"
                  {...register('sellerName')}
                  className="peer w-full px-4 py-3 border-2 border-[#06b6d4] dark:border-[#06b6d4] rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:border-[#06b6d4] focus:ring-2 focus:ring-[#06b6d4] hover:border-[#06b6d4] transition-all duration-300"
                />
                <label
                  htmlFor="sellerName"
                  className="absolute left-3 -top-2.5 px-1 bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300 peer-focus:text-[#06b6d4] transition-all duration-300"
                >
                  Seller Name
                </label>
                {errors.sellerName && (
                  <p className="mt-1 text-sm text-red-600">{errors.sellerName.message}</p>
                )}
              </div>

              <div className="relative">
                <select
                  id="employeeId"
                  value={selectedEmployee}
                  onChange={(e) => {
                    setSelectedEmployee(e.target.value);
                    setValue('employeeId', e.target.value, { shouldValidate: true });
                  }}
                  className="peer w-full px-4 py-3 border-2 border-[#06b6d4] dark:border-[#06b6d4] rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:border-[#06b6d4] focus:ring-2 focus:ring-[#06b6d4] hover:border-[#06b6d4] transition-all duration-300 appearance-none"
                >
                  <option value="">Select Employee</option>
                  {employeeOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.name}
                    </option>
                  ))}
                </select>
                <label
                  htmlFor="employeeId"
                  className="absolute left-3 -top-2.5 px-1 bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300 peer-focus:text-[#06b6d4] transition-all duration-300"
                >
                  Employee
                </label>
                {errors.employeeId && (
                  <p className="mt-1 text-sm text-red-600">{errors.employeeId.message}</p>
                )}
              </div>

              <div className="relative">
                <select
                  id="employeeType"
                  value={employeeType}
                  onChange={(e) => {
                    setEmployeeType(e.target.value);
                    setValue('employeeType', e.target.value, { shouldValidate: true });
                  }}
                  className="peer w-full px-4 py-3 border-2 border-[#06b6d4] dark:border-[#06b6d4] rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:border-[#06b6d4] focus:ring-2 focus:ring-[#06b6d4] hover:border-[#06b6d4] transition-all duration-300 appearance-none"
                >
                  <option value="">Select Type</option>
                  {employeeTypeOptions.map((option) => (
                    <option key={option.id} value={option.name}>
                      {option.name}
                    </option>
                  ))}
                </select>
                <label
                  htmlFor="employeeType"
                  className="absolute left-3 -top-2.5 px-1 bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300 peer-focus:text-[#06b6d4] transition-all duration-300"
                >
                  Employee Type
                </label>
                {errors.employeeType && (
                  <p className="mt-1 text-sm text-red-600">{errors.employeeType.message}</p>
                )}
              </div>

              <div className="relative">
                <input
                  id="duedate"
                  type="date"
                  {...register('duedate')}
                  className="peer w-full px-4 py-3 border-2 border-[#06b6d4] dark:border-[#06b6d4] rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:border-[#06b6d4] focus:ring-2 focus:ring-[#06b6d4] hover:border-[#06b6d4] transition-all duration-300"
                />
                <label
                  htmlFor="duedate"
                  className="absolute left-3 -top-2.5 px-1 bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300 peer-focus:text-[#06b6d4] transition-all duration-300"
                >
                  Due Date
                </label>
                {errors.duedate && (
                  <p className="mt-1 text-sm text-red-600">{errors.duedate.message}</p>
                )}
              </div>

              <div className="relative">
                <input
                  id="approvedBy"
                  type="text"
                  {...register('approvedBy')}
                  className="peer w-full px-4 py-3 border-2 border-[#06b6d4] dark:border-[#06b6d4] rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:border-[#06b6d4] focus:ring-2 focus:ring-[#06b6d4] hover:border-[#06b6d4] transition-all duration-300"
                />
                <label
                  htmlFor="approvedBy"
                  className="absolute left-3 -top-2.5 px-1 bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300 peer-focus:text-[#06b6d4] transition-all duration-300"
                >
                  Approved By
                </label>
                {errors.approvedBy && (
                  <p className="mt-1 text-sm text-red-600">{errors.approvedBy.message}</p>
                )}
              </div>

              <div className="relative">
                <input
                  id="approvalDate"
                  type="date"
                  {...register('approvalDate')}
                  className="peer w-full px-4 py-3 border-2 border-[#06b6d4] dark:border-[#06b6d4] rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:border-[#06b6d4] focus:ring-2 focus:ring-[#06b6d4] hover:border-[#06b6d4] transition-all duration-300"
                />
                <label
                  htmlFor="approvalDate"
                  className="absolute left-3 -top-2.5 px-1 bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300 peer-focus:text-[#06b6d4] transition-all duration-300"
                >
                  Approval Date
                </label>
                {errors.approvalDate && (
                  <p className="mt-1 text-sm text-red-600">{errors.approvalDate.message}</p>
                )}
              </div>

              <div className="relative">
                <input
                  id="attachments"
                  type="file"
                  {...register('attachments')}
                  className="peer w-full px-4 py-3 border-2 border-[#06b6d4] dark:border-[#06b6d4] rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:border-[#06b6d4] focus:ring-2 focus:ring-[#06b6d4] hover:border-[#06b6d4] transition-all duration-300"
                />
                <label
                  htmlFor="attachments"
                  className="absolute left-3 -top-2.5 px-1 bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300 peer-focus:text-[#06b6d4] transition-all duration-300"
                >
                  Attachments
                </label>
                {errors.attachments && (
                  <p className="mt-1 text-sm text-red-600">{errors.attachments.message}</p>
                )}
              </div>
            </div>
          </div>
          
   <div className="relative space-y-2">
  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
    Project Status
  </label>

  <div className="flex flex-wrap gap-4">
    {projectStatusOptions.map((option, index) => {
      const currentIndex = projectStatusOptions.findIndex(
        (opt) => opt.name === projectStatus
      );
      const isSelected = projectStatus === option.name;
      const isCompleted = index < currentIndex;
      return (
        <label
          key={option.id}
          className={`relative flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all duration-300 shadow-md hover:scale-105 active:scale-95
            ${isSelected
              ? `border-[${option.color}] bg-gradient-to-r from-[${option.color}/10] to-[${option.color}/20] dark:from-[${option.color}/20] dark:to-[${option.color}/30] text-[${option.color}]`
              : isCompleted
              ? 'border-green-500 bg-green-50 dark:bg-green-900 text-green-600'
              : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 hover:border-gray-400'
            }`}
        >
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => handleStatusChange(option.name)}
            className="hidden"
          />
          <span className="text-sm font-semibold">{option.name}</span>

          {isSelected ? (
            <FaCheck className={`text-[${option.color}] animate-bounce`} size={18} />
          ) : isCompleted ? (
            <FaCheck className="text-green-600" size={16} />
          ) : null}
        </label>
      );
    })}
  </div>

  

  {errors.projectStatus && (
    <p className="mt-1 text-sm text-red-600">{errors.projectStatus.message}</p>
  )}
</div>

          {/* Steps to Complete */}
          <div className="border-b border-gray-200 dark:border-gray-700 pb-4 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
              Steps to Complete Project
            </h2>
            <div className="mt-4 space-y-4">
              {steps.map((step, index) => (
                <div key={index} className="flex items-center gap-4">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={step}
                      onChange={(e) => handleStepChange(index, e.target.value)}
                      className="peer w-full px-4 py-3 border-2 border-[#06b6d4] dark:border-[#06b6d4] rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:border-[#06b6d4] focus:ring-2 focus:ring-[#06b6d4] hover:border-[#06b6d4] transition-all duration-300"
                      placeholder={`Step ${index + 1}`}
                    />
                    <label
                      className="absolute left-3 -top-2.5 px-1 bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300 peer-focus:text-[#06b6d4] transition-all duration-300"
                    >
                      Step {index + 1}
                    </label>
                  </div>
                  <div className="flex gap-2">
                    {index > 0 && (
                      <button
                        type="button"
                        onClick={() => removeStep(index)}
                        className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-md transition-all duration-300"
                      >
                        <AiOutlineDelete size={20} />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={addStep}
                      className="p-2 bg-green-500 hover:bg-green-600 text-white rounded-md transition-all duration-300"
                    >
                      <AiOutlinePlus size={20} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-4">
           
            <Button
            type="submit"
            className="w-[160px] gap-2 inline-flex items-center bg-[#0e7d90] hover:bg-[#0891b2] text-white px-6 py-2 text-sm font-medium transition-all duration-200 font-mono text-base hover:translate-y-[-2px] focus:outline-none active:shadow-[#3c4fe0_0_3px_7px_inset] active:translate-y-[2px] mt-2"
          >
              {id ? 'Update' : 'Submit'}
            </Button>
            <Link href="/project-target">
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
    </div>
  );
};

export default ProjectTarget; 