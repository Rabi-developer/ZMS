'use client'
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getSingleBusinessAssociate} from '@/apis/businessassociate';
import Loader from '@/components/ui/Loader';
import MainLayout from '@/components/MainLayout/MainLayout'
import BusinessAssociateForm from '@/components/ablsoftware/OtherForm/Businessassociate/Businessssociate';

const UpdateBusinessAssociate = () => {
  const { id } = useParams<{ id: string }>(); 
  const [initialData, setInitialData] = useState(null);

  const fetchBusinessAssociate = async (id: string) => {
    try {
      const response = await getSingleBusinessAssociate(id);
      console.log(response)
      setInitialData(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (id) {
      fetchBusinessAssociate(id);
    }
  }, [id]);

  return (
    <MainLayout activeInterface="ABL">
      {
        !initialData ? <Loader /> :
          <div>
            <BusinessAssociateForm isEdit={true} initialData={initialData} />
          </div>
      }
    </MainLayout>
  );
};

export default UpdateBusinessAssociate;
