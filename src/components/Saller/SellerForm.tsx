
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'react-toastify';
import CustomInput from '@/components/ui/CustomInput';
import CustomInputDropdown from '../ui/CustomeInputDropdown';
import { MdAddBusiness } from "react-icons/md";
import Link from 'next/link';
import { AiOutlinePlus, AiOutlineDelete } from "react-icons/ai";
import { Button } from '@/components/ui/button';
import { createSeller, updateSeller } from '@/apis/seller';

// Zod schema expects accountNo as a string for API
const Schema = z.object({
  SellerName: z.string().min(1, "Seller Name is required"),
  SellerType: z.string().min(1, "Seller Type is required"),
  Address: z.string().min(1, "Address is required"),
  City: z.string().min(1, "City is required"),
  Country: z.string().min(1, "Country is required"),
  PhoneNumber: z.string().min(1, "Phone Number is required"),
  EmailAddress: z.string().email("Invalid email address").optional(),
  MobileNumber: z.string().min(1, "Mobile Number is required"),
  FaxNumber: z.string().optional(),
  STN: z.string().min(1, "STN is required"),
  MTN: z.string().min(1, "MTN is required"),
  PayableCode: z.string().optional().nullable(),
  accountNo: z.string().min(1, 'At least one Account Number is required'), // as string for API
  PaymentStatus: z.string().optional(),
  OrderDate: z.string().optional(),
  DeliveryDate: z.string().optional(),
  payableid: z.string().optional().nullable(),
});

type FormData = z.infer<typeof Schema>;

// UI state type for accountNos
type SellerFormUIProps = {
  id?: string;
  initialData?: any; // Accepts API data directly (camelCase)
};

// Mapping function: API camelCase -> Form PascalCase
function mapSellerApiToForm(apiData: any): FormData {
  return {
    SellerName: apiData.sellerName || "",
    SellerType: apiData.sellerType || "",
    Address: apiData.address || "",
    City: apiData.city || "",
    Country: apiData.country || "",
    PhoneNumber: apiData.phoneNumber || "",
    EmailAddress: apiData.emailAddress || "",
    MobileNumber: apiData.mobileNumber || "",
    FaxNumber: apiData.faxNumber || "",
    STN: apiData.stn || "",
    MTN: apiData.mtn || "",
    PayableCode: apiData.payableCode || "",
    accountNo: apiData.accountNo || "",
    PaymentStatus: apiData.paymentStatus || "",
    OrderDate: apiData.orderDate || "",
    DeliveryDate: apiData.deliveryDate || "",
    payableid: apiData.payableid || "",
  };
}

const Saller = ({ id, initialData }: SellerFormUIProps) => {
  // UI state for account numbers as array
  const [accountNos, setAccountNos] = useState<string[]>(['']);
  const [text, setText] = useState("");

  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<FormData>({
    resolver: zodResolver(Schema),
    defaultValues: initialData ? mapSellerApiToForm(initialData) : {},
  });

  const sellerTypes = [
    { id: 1, name: 'Manufacturer' },
    { id: 2, name: 'Distributor' },
    { id: 3, name: 'Wholesaler' },
    { id: 4, name: 'Retailer' },
  ];

  // When initialData changes, map and split accountNo string to array for UI
  useEffect(() => {
    if (initialData) {
      const mapped = mapSellerApiToForm(initialData);
      reset(mapped);
      if (mapped.accountNo && typeof mapped.accountNo === 'string') {
        const arr = mapped.accountNo.split(',').map(s => s.trim()).filter(Boolean);
        setAccountNos(arr.length > 0 ? arr : ['']);
      } else {
        setAccountNos(['']);
      }
    }
  }, [initialData, reset]);

  // Keep form value in sync for validation (as string)
  useEffect(() => {
    setValue('accountNo', accountNos.filter(Boolean).join(','));
  }, [accountNos, setValue]);

  const addAccountNo = () => {
    setAccountNos([...accountNos, '']);
  };

  const removeAccountNo = (index: number) => {
    const updatedAccountNos = accountNos.filter((_, i) => i !== index);
    setAccountNos(updatedAccountNos.length > 0 ? updatedAccountNos : ['']);
  };

  const handleAccountNoChange = (index: number, value: string) => {
    const updatedAccountNos = [...accountNos];
    updatedAccountNos[index] = value;
    setAccountNos(updatedAccountNos);
  };

  const onSubmit = async (data: FormData) => {
    try {
      let response;
      // data.accountNo is a comma-separated string
      if (id) {
        const updateData = { ...data, id };
        response = await updateSeller(id, updateData);
        if (response.statusMessage === "Created successfully") {
          toast("Updated Successfully", { type: "success" });
          reset();
          router.push("/saller");
        } else {
          toast(response.statusMessage, { type: "error" });
        }
      } else {
        response = await createSeller(data);
        if (response.statusMessage === "Created successfully") {
          toast("Created Successfully", { type: "success" });
          reset();
          router.push("/saller");
        } else {
          toast(response.statusMessage, { type: "error" });
        }
      }
    } catch (error) {
      toast("An error occurred while submitting the form", { type: "error" });
    }
  };

  return (
    <div className="container mx-auto bg-white shadow-lg rounded dark:bg-[#030630]">
      <div className="w-full bg-[#06b6d4] h-[7vh] rounded dark:bg-[#387fbf]">
        <h1 className='text-base text-[23px] font-mono ml-10 mt-8 pt-3 text-white flex gap-2'>
          <MdAddBusiness />
          ADD NEW Seller
        </h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className='p-2 w-full'>
          <div className='p-4'>
            <h2 className='text-xl font-bold text-black dark:text-white'>Basic Seller Information</h2>
            <div className='grid grid-cols-3 gap-4'>
              <CustomInput
                variant="floating"
                borderThickness='2'
                label='Seller Name'
                id="SellerName"
                {...register("SellerName")}
                error={errors.SellerName?.message}
              />
              <CustomInputDropdown
                label="Seller Type"
                options={sellerTypes}
                selectedOption={watch("SellerType") || ''}
                onChange={(value) => setValue("SellerType", value, { shouldValidate: true })}
                error={errors.SellerType?.message}
                register={register}
              />
              <CustomInput
                variant="floating"
                borderThickness='2'
                label='City'
                id="City"
                {...register("City")}
                error={errors.City?.message}
              />
              <CustomInput
                variant="floating"
                borderThickness='2'
                label='Country'
                id="Country"
                {...register("Country")}
                error={errors.Country?.message}
              />
              <CustomInput
                type='number'
                variant="floating"
                borderThickness='2'
                label='Phone Number'
                id="PhoneNumber"
                {...register("PhoneNumber")}
                error={errors.PhoneNumber?.message}
              />
              <CustomInput
                type='number'
                variant="floating"
                borderThickness='2'
                label='Mobile Number'
                id="MobileNumber"
                {...register("MobileNumber")}
                error={errors.MobileNumber?.message}
              />
              <CustomInput
                type='email'
                variant="floating"
                borderThickness='2'
                label='Email Address'
                id="EmailAddress"
                {...register("EmailAddress")}
                error={errors.EmailAddress?.message}
              />
              <CustomInput
                type='number'
                variant="floating"
                borderThickness='2'
                label='Fax Number'
                id="FaxNumber"
                {...register("FaxNumber")}
                error={errors.FaxNumber?.message}
              />
              <CustomInput
                type='number'
                variant="floating"
                borderThickness='2'
                label='STN'
                id="STN"
                {...register("STN")}
                error={errors.STN?.message}
              />
              <CustomInput
                type='number'
                variant="floating"
                borderThickness='2'
                label='MTN'
                id="MTN"
                {...register("MTN")}
                error={errors.MTN?.message}
              />
              <CustomInput
                variant="floating"
                borderThickness='2'
                label='Address'
                id="Address"
                {...register("Address")}
                error={errors.Address?.message}
              />
            </div>
          </div>
          <div className='p-4 ml-4 border rounded-2xl mx-auto'>
            <h2>Payable Code:</h2>
            <div className='grid grid-cols-3 gap-1'>
              <CustomInput
                type='string'
                variant="floating"
                borderThickness='2'
                label=''
                id="payableid"
                {...register("payableid")}
                error={errors.payableid?.message}
              />
              <CustomInput
                variant="floating"
                borderThickness='2'
                label=''
                id="PayableCode"
                {...register("PayableCode")}
                error={errors.PayableCode?.message}
              />
            </div>
          </div>

          <div className='p-4'>
            <h2 className='text-xl font-bold text-black dark:text-white'>Additional Information</h2>
            <div>
              {accountNos.map((accountNo, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className='w-[60vh]'>
                    <CustomInput
                      variant="floating"
                      borderThickness="2"
                      label={`Payment-Method /Account No ${index + 1}`}
                      value={accountNo}
                      onChange={(e) => handleAccountNoChange(index, e.target.value)}
                      error={errors.accountNo && errors.accountNo.message && typeof errors.accountNo.message === 'string'
                        ? errors.accountNo.message
                        : undefined}
                    />
                  </div>
                  <div className='mt-8 gap-4'>
                    {index > 0 && (
                      <button
                        type="button"
                        onClick={() => removeAccountNo(index)}
                        className="p-2 bg-red-500 hover:bg-red-600 text-white rounded"
                      >
                        <AiOutlineDelete size={20} />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={addAccountNo}
                      className="p-2 bg-green-500 hover:bg-green-600 text-white rounded ml-4"
                    >
                      <AiOutlinePlus size={20} />
                    </button>
                  </div>
                </div>
              ))}
              {errors.accountNo && typeof errors.accountNo.message === 'string' && (
                <p className="text-red-500 text-sm mt-2">{errors.accountNo.message}</p>
              )}
            </div>
            <div className='grid grid-cols-3 gap-4'>
              <CustomInput
                type='date'
                variant="floating"
                borderThickness='2'
                label='Order Date'
                id="OrderDate"
                {...register("OrderDate")}
                error={errors.OrderDate?.message}
              />
              <CustomInput
                type='date'
                variant="floating"
                borderThickness='2'
                label='Delivery Date'
                id="DeliveryDate"
                {...register("DeliveryDate")}
                error={errors.DeliveryDate?.message}
              />
            </div>
          </div>

          <div className="p-5 ml-7 bg-white shadow-md rounded-lg mx-auto">
            <textarea
              id="message"
              className="w-full h-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
              placeholder="Any additional notes or comments about the Saller's work details"
              value={text}
              onChange={(e) => setText(e.target.value)}
            ></textarea>
            <p className="text-gray-500 mt-2">Character Count: {text.length}</p>
          </div>
        </div>

        <div className="w-full h-[8vh] flex justify-end gap-2 mt-3 bg-transparent border-t-2 border-[#e7e7e7]">
          <Button
            type="submit"
            className="w-[160] gap-2 inline-flex items-center bg-[#0e7d90] hover:bg-[#0891b2] text-white px-6 py-2 text-sm font-medium transition-all duration-200 font-mono text-base hover:translate-y-[-2px] focus:outline-none active:shadow-[#3c4fe0_0_3px_7px_inset] active:translate-y-[2px] mt-2"
          >
            {id ? "Update" : "Submit"}
          </Button>
          <Link href="/seller">
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

export default Saller;
