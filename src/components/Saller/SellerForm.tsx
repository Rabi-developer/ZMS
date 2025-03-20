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
  PayableCode: z.string().min(1, "Payable Code is required"),
  accountNo: z.array(z.string().min(1, 'Account Number is required')),
  InvoiceNumber: z.string().optional(),
  PaymentStatus: z.string().optional(),
  PaymentMode: z.string().min(1, "Payment Mode is required"),
  OrderDate: z.string().optional(),
  DeliveryDate: z.string().optional(),
});

type FormData = z.infer<typeof Schema>;

const Saller = ({ id, initialData }: any) => {
  const [accountNos, setAccountNos] = useState<string[]>(['']);
  const [paymentStatusOption, setPaymentStatusOption] = useState<string>('');
  const [paymentModeOption, setPaymentModeOption] = useState<string>('');
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

  const paymentModes = [
    { id: 1, name: 'Cash' },
    { id: 2, name: 'Bank Transfer' },
    { id: 3, name: 'Cheque' },
  ];

  const paymentStatuses = [
    { id: 1, name: 'Paid' },
    { id: 2, name: 'Pending' },
    { id: 3, name: 'Partial Payment' },
  ];

  const sellerTypes = [
    { id: 1, name: 'Manufacturer' },
    { id: 2, name: 'Distributor' },
    { id: 3, name: 'Wholesaler' },
    { id: 4, name: 'Retailer' },
  ];


  useEffect(() => {
    if (initialData) {
      console.log("Initial data:", initialData); // Debugging
      reset(initialData);
    }
  }, [initialData, reset]);

  const addAccountNo = () => {
    setAccountNos([...accountNos, '']);
  };

  const removeAccountNo = (index: number) => {
    const updatedAccountNos = accountNos.filter((_, i) => i !== index);
    setAccountNos(updatedAccountNos);
  };

  const handleAccountNoChange = (index: number, value: string) => {
    const updatedAccountNos = [...accountNos];
    updatedAccountNos[index] = value;
    setAccountNos(updatedAccountNos);
  };

  const onSubmit = async (data: any) => {
    console.log("Form submitted with data:", data); 
    try {
      let response;
      if (id) {
        const updateData = { ...data, id };
        console.log("Updating seller with data:", updateData); 
        // response = await updateSeller(id, updateData);
        toast("Updated Successfully", { type: "success" });
      } else {
        console.log("Creating seller with data:", data); 
        // response = await createSeller(data);
        toast("Created Successfully", { type: "success" });
      }
      console.log("API response:", response); 
      reset();
      router.push("/seller");
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
                register={register}
                {...register("SellerName")}
                error={errors.SellerName?.message}
              />
              <CustomInputDropdown
                label="Seller Type"
                options={sellerTypes}
                selectedOption={''}
                onChange={(value) => {
                  setValue("SellerType", value);
                }}
                error={errors.SellerType?.message}
              />
              <CustomInput
                variant="floating"
                borderThickness='2'
                label='City'
                id="City"
                register={register}
                {...register("City")}
                error={errors.City?.message}
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
                type='number'
                variant="floating"
                borderThickness='2'
                label='Phone Number'
                id="PhoneNumber"
                register={register}
                {...register("PhoneNumber")}
                error={errors.PhoneNumber?.message}
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
               <CustomInput
                type='email'
                variant="floating"
                borderThickness='2'
                label='Email Address'
                id="EmailAddress"
                register={register}
                {...register("EmailAddress")}
                error={errors.EmailAddress?.message}
              />
              <CustomInput
                type='number'
                variant="floating"
                borderThickness='2'
                label='Fax Number'
                id="FaxNumber"
                register={register}
                {...register("FaxNumber")}
                error={errors.FaxNumber?.message}
              />
              <CustomInput
                type='number'
                variant="floating"
                borderThickness='2'
                label='STN'
                id="STN"
                register={register}
                {...register("STN")}
                error={errors.STN?.message}
              />
              <CustomInput
                type='number'
                variant="floating"
                borderThickness='2'
                label='MTN'
                id="MTN"
                register={register}
                {...register("MTN")}
                error={errors.MTN?.message}
              />
              <CustomInput
                variant="floating"
                borderThickness='2'
                label='Payable Code'
                id="PayableCode"
                register={register}
                {...register("PayableCode")}
                error={errors.PayableCode?.message}
              />
            </div>
          </div>
          <div className='p-4 '>
               <CustomInput
                variant="floating"
                borderThickness='2'
                label='Address'
                id="Address"
                register={register}
                {...register("Address")}
                error={errors.Address?.message}
              />
           </div>
          {/* <div className='p-4'>
            <h2 className='text-xl font-bold text-black dark:text-white'>Payment Details</h2>
            <div className='grid grid-cols-3 gap-4'>
              <CustomInput
                variant="floating"
                borderThickness='2'
                label='Invoice Number'
                id="InvoiceNumber"
                register={register}
                {...register("InvoiceNumber")}
                error={errors.InvoiceNumber?.message}
              />
              <CustomInputDropdown
                label="Payment Status"
                options={paymentStatuses}
                selectedOption={paymentStatusOption}
                onChange={(value) => {
                  console.log("Selected payment status:", value); 
                  setPaymentStatusOption(value);
                  setValue("PaymentStatus", value);
                }}
                error={errors.PaymentStatus?.message}
              />
                <CustomInputDropdown
                label="Payment Mode"
                options={paymentModes}
                selectedOption={paymentModeOption}
                onChange={(value) => {
                  setPaymentModeOption(value);
                  setValue("PaymentMode", value);
                }}
                error={errors.PaymentMode?.message}
              />
            </div> */}
          {/* </div> */}
            <div>          
                    {accountNos.map((accountNo, index) => (
                      <div key={index} className="flex items-center gap-2">
                          <div className='p-4 w-[60vh]'> 
                          <CustomInput
                          variant="floating"
                          borderThickness="2"
                          label={`Payment-Method /Account No ${index + 1}`}
                          value={accountNo}
                          onChange={(e) => handleAccountNoChange(index, e.target.value)}
                        />
                          </div>
                        <div className='mt-8 gap-4'> 
                        {index > 0 && (
                          
                          <button
                            type="button"
                            onClick={() => removeAccountNo(index)}
                            className="p-2 bg-red-500 hover:bg-red-600 text-white rounded "
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
            </div>

           <div className='p-4'>
            <h2 className='text-xl font-bold text-black dark:text-white'>Additional Information</h2>
            <div className='grid grid-cols-3 gap-4'>
              <CustomInput
                type='date'
                variant="floating"
                borderThickness='2'
                label='Order Date'
                id="OrderDate"
                register={register}
                {...register("OrderDate")}
                error={errors.OrderDate?.message}
              />
              <CustomInput
                type='date'
                variant="floating"
                borderThickness='2'
                label='Delivery Date'
                id="DeliveryDate"
                register={register}
                {...register("DeliveryDate")}
                error={errors.DeliveryDate?.message}
              />
             
            </div>
          </div>
        
          <div className="  p-5 ml-7 bg-white shadow-md rounded-lg mx-auto">
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