'use client'
import React from 'react';
import MainLayout from '@/components/MainLayout/MainLayout'
import ConsignmentForm from '@/components/ablsoftware/Maintance/Consignment/Consignment';

const UpdateConsignment = () => {
  return (
    <MainLayout activeInterface="ABL">
      <div>
        <ConsignmentForm isEdit={true} />
      </div>
    </MainLayout>
  );
};

export default UpdateConsignment;
