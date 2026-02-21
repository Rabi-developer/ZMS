'use client'
import React, { useEffect, useState, Suspense } from 'react';
import { useParams } from 'next/navigation';
import { getSingleBiltyPaymentInvoice} from '@/apis/biltypaymentnnvoice';
import Loader from '@/components/ui/Loader';
import MainLayout from '@/components/MainLayout/MainLayout'
import BillPaymentInvoiceForm from '@/components/ablsoftware/Maintance/BillPaymentInvoices/BillPaymentInvoices';

const UpdateBillPaymentInvoice = () => {
  const { id } = useParams<{ id: string }>(); 
  const [initialData, setInitialData] = useState(null);

  const fetchBillPaymentInvoice = async (id: string) => {
    try {
      const response = await getSingleBiltyPaymentInvoice(id);
      console.log(response)
      setInitialData(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (id) {
      fetchBillPaymentInvoice(id);
    }
  }, [id]);

  return (
    <MainLayout activeInterface="ABL">
      {
        !initialData ? <Loader /> :
          <div>
            <Suspense fallback={<Loader />}>
              <BillPaymentInvoiceForm isEdit={true} initialData={initialData} />
            </Suspense>
          </div>
      }
    </MainLayout>
  );
};

export default UpdateBillPaymentInvoice;
