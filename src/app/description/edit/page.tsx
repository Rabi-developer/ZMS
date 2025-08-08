'use client'
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getSingleDescription} from '@/apis/description';
import Loader from '@/components/ui/Loader';
import MainLayout from '@/components/MainLayout/MainLayout'
import DescriptionForm from '@/components/item/discription/Description';

const UpdateDescriptionPage = () => {
  const { id } = useParams<{ id: string }>(); 
  const [initialData, setInitialData] = useState(null);

  const fetchDescriptions = async (id: string) => {
    try {
      const response = await getSingleDescription(id);
      console.log(response)
      setInitialData(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (id) {
      fetchDescriptions(id);
    }
  }, [id]);

  return (
    <MainLayout activeInterface="ZMS">
      {
        !initialData ? <Loader /> :
          <div>
            <DescriptionForm isEdit={true} />
          </div>
      }
    </MainLayout>
  );
};

export default UpdateDescriptionPage;
