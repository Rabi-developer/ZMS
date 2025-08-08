'use client'
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Loader from '@/components/ui/Loader';
import MainLayout from '@/components/MainLayout/MainLayout'
import { getSingleEmployeeManagement } from '@/apis/employeemanagement';
import EmployeeManagementForm from '@/components/Employee/EmployeeManagement/EmployeeManagementForm';

const UpdateEmployeeManagemetPage = () => {
    const { id } = useParams<{ id: string }>(); 
    const [initialData, setInitialData] = useState(null);

    
    const fetchEmployee = async (orgId: string) => {
        try {
            const response = await getSingleEmployeeManagement(orgId);
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
                    <EmployeeManagementForm />
            }
        </MainLayout>
    );
};

export default UpdateEmployeeManagemetPage;
