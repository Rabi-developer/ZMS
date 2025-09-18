'use client'
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getSingleCharges} from '@/apis/charges';
import Loader from '@/components/ui/Loader';
import MainLayout from '@/components/MainLayout/MainLayout'
import ChargesForm from '@/components/ablsoftware/Maintance/Charges/Charges';

const UpdateCharges = () => {
  const { id } = useParams<{ id: string }>(); 
  const [initialData, setInitialData] = useState(null);

  const fetchCharges = async (id: string) => {
    try {
      const response = await getSingleCharges(id);
      console.log(response)
      setInitialData(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (id) {
      fetchCharges(id);
    }
  }, [id]);

  return (
    <MainLayout activeInterface="ABL">
      {
        !initialData ? <Loader /> :
          <div>
            <ChargesForm isEdit={true} initialData={initialData} />
          </div>
      }
    </MainLayout>
  );
};

export default UpdateCharges;
