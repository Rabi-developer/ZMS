'use client'
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getSingleEntryVoucher} from '@/apis/entryvoucher';
import Loader from '@/components/ui/Loader';
import MainLayout from '@/components/MainLayout/MainLayout'
import EntryVoucherForm from '@/components/ablsoftware/voucher/Entry Voucher/EntryVoucher';

const UpdateEntryVoucher = () => {
  const { id } = useParams<{ id: string }>(); 
  const [initialData, setInitialData] = useState(null);

  const fetchEntryVoucher = async (id: string) => {
    try {
      const response = await getSingleEntryVoucher(id);
      console.log(response)
      setInitialData(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (id) {
      fetchEntryVoucher(id);
    }
  }, [id]);

  return (
    <MainLayout activeInterface="ABL">
      {
        !initialData ? <Loader /> :
          <div>
            <EntryVoucherForm isEdit={true}  />
          </div>
      }
    </MainLayout>
  );
};

export default UpdateEntryVoucher;
