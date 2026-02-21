'use client'
import React, { Suspense } from 'react';
import MainLayout from '@/components/MainLayout/MainLayout'
import ConsignmentForm from '@/components/ablsoftware/Maintance/Consignment/Consignment';

const UpdateConsignment = () => {
  return (
    <MainLayout activeInterface="ABL">
      <div>
        <Suspense fallback={<div>Loading...</div>}>
          <ConsignmentForm isEdit={true} />
        </Suspense>
      </div>
    </MainLayout>
  );
};

export default UpdateConsignment;
