'use client'
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Loader from '@/components/ui/Loader';
import MainLayout from '@/components/MainLayout/MainLayout'
import Branch from '@/components/branches/Branch';
import { getSingleBranch } from '@/apis/branchs';

const UpdateBranchPage = () => {
    const { id } = useParams<{ id: string }>(); // Access the dynamic route parameter
    const [initialData, setInitialData] = useState(null);

    // Fetch the initial data for the branch
    const fetchBranch = async (id: string) => {
        try {
            const response = await getSingleBranch(id);
            console.log(response)
            setInitialData(response.data);
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        if (id) {
            fetchBranch(id);
        }
    }, [id]);

    return (
        <MainLayout activeInterface="ZMS">
            {
                !initialData ? <Loader /> :
                    <Branch id={id} initialData={initialData} />
            }
        </MainLayout>
    );
};

export default UpdateBranchPage;
