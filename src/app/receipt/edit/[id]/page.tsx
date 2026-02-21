'use client'
import React, { useEffect, useState, Suspense } from 'react';
import { useParams } from 'next/navigation';
import { getSingleReceipt} from '@/apis/receipt';
import Loader from '@/components/ui/Loader';
import MainLayout from '@/components/MainLayout/MainLayout'
import ReceiptForm from '../../../../components/ablsoftware/Maintance/Receipt/Receipt';

const UpdateReceipt = () => {
  const { id } = useParams<{ id: string }>(); 
  const [initialData, setInitialData] = useState(null);

  const fetchReceipt = async (id: string) => {
    try {
      const response = await getSingleReceipt(id);
      console.log(response)
      setInitialData(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (id) {
      fetchReceipt(id);
    }
  }, [id]);

  return (
    <MainLayout activeInterface="ABL">
      {
        !initialData ? <Loader /> :
          <div>
            <Suspense fallback={<Loader />}>
              <ReceiptForm isEdit={true} initialData={initialData} />
            </Suspense>
          </div>
      }
    </MainLayout>
  );
};

export default UpdateReceipt;
