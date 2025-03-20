'use client'
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Loader from '@/components/ui/Loader';
import MainLayout from '@/components/MainLayout/MainLayout'
import Department from '@/components/department/Department';
import { getSingleDepartment } from '@/apis/departments';

const UpdateDepartmentPage = () => {
    const { id } = useParams<{ id: string }>(); 
    const [initialData, setInitialData] = useState(null);

    // Fetch the initial data for the branch
    const fetchDepartment = async (orgId: string) => {
        try {
            const response = await getSingleDepartment(orgId);
            console.log(response)
            setInitialData(response.data);
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        if (id) {
            fetchDepartment(id);
        }
    }, [id]);

    return (
        <MainLayout>
            {
                !initialData ? <Loader /> :
                    <Department id={id} initialData={initialData} />
            }
        </MainLayout>
    );
};

export default UpdateDepartmentPage;
