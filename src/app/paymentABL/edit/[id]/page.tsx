'use client'
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getSinglePaymentABL} from '@/apis/paymentABL';
import Loader from '@/components/ui/Loader';
import MainLayout from '@/components/MainLayout/MainLayout'
import PaymentABLForm from '@/components/ablsoftware/Maintance/PaymentABL/PaymentABL';

const UpdatePaymentABL = () => {
  const { id } = useParams<{ id: string }>(); 
  const [initialData, setInitialData] = useState(null);

  const fetchPaymentABL = async (id: string) => {
    try {
      const response = await getSinglePaymentABL(id);
      console.log(response)
      setInitialData(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (id) {
      fetchPaymentABL(id);
    }
  }, [id]);

  return (
    <MainLayout activeInterface="ABL">
      {
        !initialData ? <Loader /> :
          <div>
            <PaymentABLForm isEdit={true} initialData={initialData} />
          </div>
      }
    </MainLayout>
  );
};

export default UpdatePaymentABL;
