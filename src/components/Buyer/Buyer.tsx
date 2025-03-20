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
import { getAllSellers } from '@/apis/seller';

type Seller = {
  id: string; 
  SellerName: string; 
};

const Schema = z.object({
  BuyerName: z.string().min(1, "Buyer Name is required"),
  BuyerType: z.string().min(1, "Buyer Type is required"),
  Address: z.string().min(1, "Address is required"),
  City: z.string().min(1, "City is required"),
  Currency: z.string().min(1, "Currency is required"),
  State: z.string().optional(),
  ZipCode: z.string().optional(),
  Region: z.string().min(1, "Region is required"),
  BankName: z.string().optional(),
  PhoneNumber: z.string().min(1, "Phone Number is required"),
  MobileNumber: z.string().min(1, "Mobile Number is required"),
  FaxNumber: z.string().optional(),
  NTN: z.string().min(1, "NTN is required"),
  STN: z.string().min(1, "STN is required"),
  BuyerCode: z.string().min(1, "Buyer Code is required"),
  Email: z.string().email("Invalid email address").optional(),
  Website: z.string().optional(),
  ReceiveableAccount: z.string().min(1, "Receiveable Account is required"),
  Seller: z.string().min(1, "Seller is required"), 
});

type FormData = z.infer<typeof Schema>;

const Buyer = ({ id, initialData }: any) => {
  const [text, setText] = useState("");
  const [sellers, setSellers] = useState<Seller[]>([]); 
  const [SellerOption, setSellerOption] = useState<string>('');
  const [accountNos, setAccountNos] = useState<string[]>(['']);
  
  

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

  const handleEmployeeDropdownChange = (value: string) => {
    setSellerOption(value);
  };

  useEffect(() => {
    const fetchSellers = async () => {
      try {
        const response = await getAllSellers();
        setSellers(response.data); 
      } catch (error) {
        console.error("Error fetching sellers:", error);
        toast("Failed to fetch sellers", { type: "error" });
      }
    };

    fetchSellers();
  }, []);

  // Fetch seller
  useEffect(() => {
    const fetchSellers = async () => {
      try {
        const response = await getAllSellers();
        setSellers(response.data);
      } catch (error) {
        console.error("Error fetching employees:", error);
      }
    };
    fetchSellers();
  }, []);

  const buyerTypes = [
    { id: 1, name: 'Exports' },
    { id: 2, name: 'Imports' },
    { id: 3, name: 'Local' },
  ];

  const currencies = [
    { id: 1, name: 'Pak Rupee' },
    { id: 2, name: 'US Dollar' },
    { id: 3, name: 'Euro' },
  ];

  const regions = [
    { id: 1, name: 'Default' },
    { id: 2, name: 'Region 1' },
    { id: 3, name: 'Region 2' },
    { id: 4, name: 'Region 3' },
  ];

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

  useEffect(() => {
    if (initialData) {
      console.log("Initial data:", initialData); 
      reset(initialData);
    }
  }, [initialData, reset]);

  const onSubmit = async (data: any) => {
    console.log("Form submitted with data:", data); 
    try {
      let response;
      if (id) {
        const updateData = { ...data, id };
        console.log("Updating buyer with data:", updateData); 
        // response = await updateBuyer(id, updateData); // Uncomment and implement if needed
        toast("Updated Successfully", { type: "success" });
      } else {
        console.log("Creating buyer with data:", data); 
        // response = await createBuyer(data); // Uncomment and implement if needed
        toast("Created Successfully", { type: "success" });
      }
      console.log("API response:", response); 
      reset();
      router.push("/buyer");
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
          ADD NEW Buyer
        </h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className='p-2 w-full'>
          <div className='p-4'>
            {/* <h2 className='text-xl font-bold text-black dark:text-white'>Basic Buyer Information</h2> */}
            <div className='grid grid-cols-3 gap-4'>
              <CustomInput
                variant="floating"
                borderThickness='2'
                label='Buyer Name'
                id="BuyerName"
                register={register}
                {...register("BuyerName")}
                error={errors.BuyerName?.message}
              />
              <CustomInputDropdown
                label="Buyer Type"
                options={buyerTypes}
                selectedOption={''}
                onChange={(value) => {
                  setValue("BuyerType", value);
                }}
                error={errors.BuyerType?.message}
              />
              <CustomInput
                variant="floating"
                borderThickness='2'
                label='Address'
                id="Address"
                register={register}
                {...register("Address")}
                error={errors.Address?.message}
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
              <CustomInputDropdown
                label="Currency"
                options={currencies}
                selectedOption={''}
                onChange={(value) => {
                  setValue("Currency", value);
                }}
                error={errors.Currency?.message}
              />
              <CustomInput
                variant="floating"
                borderThickness='2'
                label='State'
                id="State"
                register={register}
                {...register("State")}
                error={errors.State?.message}
              />
              <CustomInput
                variant="floating"
                borderThickness='2'
                label='Zip Code'
                id="ZipCode"
                register={register}
                {...register("ZipCode")}
                error={errors.ZipCode?.message}
              />
              <CustomInputDropdown
                label="Region"
                options={regions}
                selectedOption={''}
                onChange={(value) => {
                  setValue("Region", value);
                }}
                error={errors.Region?.message}
              />
              <CustomInput
                variant="floating"
                borderThickness='2'
                label='Bank Name'
                id="BankName"
                register={register}
                {...register("BankName")}
                error={errors.BankName?.message}
              />
              <CustomInput
                type='tel'
                variant="floating"
                borderThickness='2'
                label='Phone Number'
                id="PhoneNumber"
                register={register}
                {...register("PhoneNumber")}
                error={errors.PhoneNumber?.message}
              />
              <CustomInput
                type='tel'
                variant="floating"
                borderThickness='2'
                label='Mobile Number'
                id="MobileNumber"
                register={register}
                {...register("MobileNumber")}
                error={errors.MobileNumber?.message}
              />
              <CustomInput
                type='tel'
                variant="floating"
                borderThickness='2'
                label='Fax Number'
                id="FaxNumber"
                register={register}
                {...register("FaxNumber")}
                error={errors.FaxNumber?.message}
              />
              <CustomInput
                variant="floating"
                borderThickness='2'
                label='NTN'
                id="NTN"
                register={register}
                {...register("NTN")}
                error={errors.NTN?.message}
              />
              <CustomInput
                variant="floating"
                borderThickness='2'
                label='STN'
                id="STN"
                register={register}
                {...register("STN")}
                error={errors.STN?.message}
              />
              <CustomInput
                variant="floating"
                borderThickness='2'
                label='Buyer Code'
                id="BuyerCode"
                register={register}
                {...register("BuyerCode")}
                error={errors.BuyerCode?.message}
              />
              <CustomInput
                type='email'
                variant="floating"
                borderThickness='2'
                label='Email'
                id="Email"
                register={register}
                {...register("Email")}
                error={errors.Email?.message}
              />
              <CustomInput
                variant="floating"
                borderThickness='2'
                label='Website'
                id="Website"
                register={register}
                {...register("Website")}
                error={errors.Website?.message}
              />
              <CustomInput
                variant="floating"
                borderThickness='2'
                label='Receiveable Account'
                id="ReceiveableAccount"
                register={register}
                {...register("ReceiveableAccount")}
                error={errors.ReceiveableAccount?.message}
              />
              {/* Seller Dropdown */}
              <CustomInputDropdown
                label="Seller"
                options={sellers.map((seller) => ({
                  id: seller.id,
                  name: seller.SellerName,
                }))}
                selectedOption={''}
                onChange={(value) => {
                  setSellerOption(value);
                  setValue("Seller", value);
                }}
                error={errors.Seller?.message}
              />
            </div>
          </div>
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
          <div className="  p-5 ml-7 bg-white shadow-md rounded-lg mx-auto">
            <textarea
              id="message"
              className="w-full h-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
              placeholder="Any additional notes or comments about the Buyer's work details"
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
          <Link href="/buyer">
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

export default Buyer;