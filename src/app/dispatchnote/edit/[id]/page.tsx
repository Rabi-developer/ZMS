'use client';
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getSingleDispatchNote } from '@/apis/dispatchnote';
import Loader from '@/components/ui/Loader';
import MainLayout from '@/components/MainLayout/MainLayout';
import DispatchNote from '@/components/dispatchnote/DispatchNote';

const UpdateDispatchNotePage = () => {
  const { id } = useParams<{ id: string }>();
  const [initialData, setInitialData] = useState<any>(null);

  const fetchDispatchNote = async (id: string) => {
    try {
      const response = await getSingleDispatchNote(id);
      console.log('Fetched dispatch note:', response);
      setInitialData(response.data);
    } catch (error) {
      console.error('Error fetching dispatch note:', error);
    }
  };

  useEffect(() => {
    if (id) {
      fetchDispatchNote(id);
    }
  }, [id]);

  return (
    <MainLayout activeInterface="ZMS">
      {!initialData ? (
        <Loader />
      ) : (
        <div>
          <DispatchNote isEdit={true} initialData={initialData} />
        </div>
      )}
    </MainLayout>
  );
};

export default UpdateDispatchNotePage;