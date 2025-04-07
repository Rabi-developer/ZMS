'use client'
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getSingleBlendRatio} from '@/apis/blendratio';
import Loader from '@/components/ui/Loader';
import MainLayout from '@/components/MainLayout/MainLayout'
import BlendRatioForm from '@/components/item/BlendRatio/BlendRatioForm';

const UpdateBlendRatioPage = () => {
  const { id } = useParams<{ id: string }>(); 
  const [initialData, setInitialData] = useState(null);

  const fetchBlendRatios = async (id: string) => {
    try {
      const response = await getSingleBlendRatio(id);
      console.log(response)
      setInitialData(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (id) {
      fetchBlendRatios(id);
    }
  }, [id]);

  return (
    <MainLayout>
      {
        !initialData ? <Loader /> :
          <div>
            <BlendRatioForm isEdit={true} />
          </div>
      }
    </MainLayout>
  );
};

export default UpdateBlendRatioPage;
