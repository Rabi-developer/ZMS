'use client'
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getSingleBookingOrder} from '@/apis/bookingorder';
import Loader from '@/components/ui/Loader';
import MainLayout from '@/components/MainLayout/MainLayout'
import BookingOrderForm from '@/components/ablsoftware/Maintance/BookingOrder.tsx/BookingOrder';

const UpdateBookingOrder = () => {
  const { id } = useParams<{ id: string }>(); 
  const [initialData, setInitialData] = useState(null);

  const fetchBookingOrder = async (id: string) => {
    try {
      const response = await getSingleBookingOrder(id);
      console.log(response)
      setInitialData(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (id) {
      fetchBookingOrder(id);
    }
  }, [id]);

  return (
    <MainLayout activeInterface="ABL">
      {
        !initialData ? <Loader /> :
          <div>
            <BookingOrderForm isEdit={true} initialData={initialData} />
          </div>
      }
    </MainLayout>
  );
};

export default UpdateBookingOrder;
