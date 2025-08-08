'use client'
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Loader from '@/components/ui/Loader';
import MainLayout from '@/components/MainLayout/MainLayout'
import { getSingleEmployee } from '@/apis/employee';
import EmployeeForm from '@/components/Employee/EmployeeForm';

const UpdateEmployeePage = () => {
    const { id } = useParams<{ id: string }>(); 
    const [initialData, setInitialData] = useState(null);

    
    const fetchEmployee = async (orgId: string) => {
        try {
            const response = await getSingleEmployee(orgId);
            console.log(response)
            setInitialData(response.data);
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        if (id) {
            fetchEmployee(id);
        }
    }, [id]);

    return (
        <MainLayout activeInterface="ZMS">
            {
                !initialData ? <Loader /> :
                    <EmployeeForm id={id} initialData={initialData} />
            }
        </MainLayout>
    );
};

export default UpdateEmployeePage;
