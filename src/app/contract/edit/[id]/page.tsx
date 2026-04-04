'use client'
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Loader from '@/components/ui/Loader';
import MainLayout from '@/components/MainLayout/MainLayout'
import ContractForm from '@/components/contract/ContractForm'
import { getSingleContract } from '@/apis/contract';

const UpdateContractPage = () => {
    const { id } = useParams<{ id: string }>(); 
    const [initialData, setInitialData] = useState(null);

    // Fetch the initial data for the branch
    const fetchContract = async (orgId: string) => {
        try {
            const response = await getSingleContract(orgId);
            console.log(response)
            setInitialData(response.data);
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        if (id) {
            fetchContract(id);
        }
    }, [id]);

    return (
        <MainLayout activeInterface="ZMS">
            {
                !initialData ? <Loader /> :
                    <ContractForm id={id} initialData={initialData} />
            }
        </MainLayout>
    );
};

export default UpdateContractPage;
