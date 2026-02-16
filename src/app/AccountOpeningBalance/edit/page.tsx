'use client'
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getSingleAccountOpeningBalance} from '@/apis/accountopeningbalance';
import Loader from '@/components/ui/Loader';
import MainLayout from '@/components/MainLayout/MainLayout'
import AccountOpeningBalance from '@/components/ablsoftware/voucher/AccountOpenningBalance/AccountOpeningBalance';

const UpdateAccountOpeningBalance = () => {
  const { id } = useParams<{ id: string }>(); 
  const [initialData, setInitialData] = useState(null);

  const fetchAccountOpeningBalance = async (id: string) => {
    try {
      const response = await getSingleAccountOpeningBalance(id);
      console.log(response)
      setInitialData(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (id) {
      fetchAccountOpeningBalance(id);
    }
  }, [id]);

  return (
    <MainLayout activeInterface="ABL">
      {
        !initialData ? <Loader /> :
          <div>
            <AccountOpeningBalance isEdit={true}/>
          </div>
      }
    </MainLayout>
  );
};

export default UpdateAccountOpeningBalance;
