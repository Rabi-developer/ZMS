'use client'
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Loader from '@/components/ui/Loader';
import MainLayout from '@/components/MainLayout/MainLayout'
import SelvegeWeavesForm from '@/components/item/selvegeweaves/SelvegeWeaves';
import { getSingleSelvegeWeave } from '@/apis/selvegeweave';

const UpdateSelvegeWeavesPage = () => {
  const { id } = useParams<{ id: string }>(); 
  const [initialData, setInitialData] = useState(null);

  const fetchSelvegeWeaves = async (id: string) => {
    try {
      const response = await getSingleSelvegeWeave(id);
      console.log(response)
      setInitialData(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (id) {
      fetchSelvegeWeaves(id);
    }
  }, [id]);

  return (
    <MainLayout>
      {
        !initialData ? <Loader /> :
          <div>
            <SelvegeWeavesForm isEdit={true} />
          </div>
      }
    </MainLayout>
  );
};

export default UpdateSelvegeWeavesPage;
