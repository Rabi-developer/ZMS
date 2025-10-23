'use client';
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'react-toastify';
import { createAccount, updateAccount } from '@/apis/users'; 
import { getAllRoles } from '@/apis/roles';
import CustomInput from '@/components/ui/CustomInput';
import { Button } from '@/components/ui/button';

const userSchema = z.object({
  userName: z.string().min(1, "Username is required"),
  email: z.string().email("Invalid email address"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  middleName: z.string().optional(),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.string().min(1, "Role is required"),
});

type UserFormValues = z.infer<typeof userSchema>;

interface UserFormProps {
  id?: string;
  initialData?: Partial<UserFormValues> & { id?: string };
  onClose?: (refresh?: boolean) => void;
}

const UserForm: React.FC<UserFormProps> = ({ id, initialData, onClose }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: initialData || {},
  });

  const [roles, setRoles] = useState<{ id: string; name: string }[]>([]);
  const selectedRole = watch("role");

  useEffect(() => {
    if (initialData) reset(initialData);
  }, [initialData, reset]);

  useEffect(() => {
    // Fetch roles for dropdown
    const fetchRoles = async () => {
      try {
        const res = await getAllRoles(1, 100); // fetch all roles (adjust pageSize if needed)
        // Support both array and paged response
        let rolesArr: { id: string; name: string }[] = [];
        if (Array.isArray(res)) {
          rolesArr = res;
        } else if (Array.isArray(res?.data)) {
          rolesArr = res.data;
        }
        setRoles(rolesArr);
      } catch (e) {
        toast.error("Failed to load roles");
      }
    };
    fetchRoles();
  }, []);

  const onSubmit = async (data: UserFormValues) => {
    try {
      let response;
      if (id) {
        response = await updateAccount(id, { ...data, id });
        toast.success("User updated successfully");
      } else {
        response = await createAccount(data);
        toast.success("User created successfully");
      }
      reset();
      if (onClose) onClose(true);
    } catch (error) {
      toast.error("Error submitting form");
      console.error("Error submitting form:", error);
    }
  };

  return (
    <div className="mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-lg border-2 border-[#d4a017] overflow-hidden">
      <div className="p-6 bg-gradient-to-r from-[#1a5f3a] to-[#2a7f4a] border-b-2 border-[#d4a017]">
        <h2 className="text-xl font-semibold text-white">
          {id ? 'Edit User' : 'Create New User'}
        </h2>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="p-6 grid grid-cols-2 gap-4 bg-white dark:bg-gray-800">
        <CustomInput
          label="Username"
          id="userName"
          register={register}
          {...register("userName")}
          error={errors.userName?.message}
        />
        <CustomInput
          label="Email"
          id="email"
          register={register}
          {...register("email")}
          error={errors.email?.message}
        />
        <CustomInput
          label="First Name"
          id="firstName"
          register={register}
          {...register("firstName")}
          error={errors.firstName?.message}
        />
        <CustomInput
          label="Last Name"
          id="lastName"
          register={register}
          {...register("lastName")}
          error={errors.lastName?.message}
        />
        <CustomInput
          label="Middle Name"
          id="middleName"
          register={register}
          {...register("middleName")}
          error={errors.middleName?.message}
        />
        <CustomInput
          label="Password"
          id="password"
          type="password"
          register={register}
          {...register("password")}
          error={errors.password?.message}
        />
        <div className="col-span-2">
          <label htmlFor="role" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Role
          </label>
          <select
            id="role"
            {...register("role")}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#1a5f3a] bg-white dark:bg-gray-700 dark:text-white ${
              errors.role ? 'border-red-500' : 'border-[#d4a017] dark:border-[#d4a017]'
            }`}
            value={selectedRole || ""}
            onChange={e => setValue("role", e.target.value)}
          >
            <option value="">Select a role</option>
            {roles.map(role => (
              <option key={role.id} value={role.name}>
                {role.name}
              </option>
            ))}
          </select>
          {errors.role && (
            <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>
          )}
        </div>
        <div className="col-span-2 flex justify-end gap-3 pt-6 border-t-2 border-[#d4a017] mt-4">
          <Button
            type="button"
            variant="outline"
            className="px-6 py-2 border-2 border-[#1a5f3a] text-[#1a5f3a] hover:bg-[#1a5f3a] hover:text-white rounded-xl transition-all duration-300"
            onClick={() => onClose ? onClose() : window.history.back()}
          >
            Cancel
          </Button>
          <Button 
            type="submit"
            className="px-6 py-2 bg-gradient-to-r from-[#1a5f3a] to-[#2a7f4a] hover:from-[#1a5f3a]/90 hover:to-[#2a7f4a]/90 text-white rounded-xl transition-all duration-300 shadow-lg"
          >
            {id ? 'Update User' : 'Create User'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default UserForm;
