'use client'
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Loader from '@/components/ui/Loader';
import MainLayout from '@/components/MainLayout/MainLayout'
import Address from '@/components/address/Address';
import { getSingleAddress } from '@/apis/address';

const UpdateAddressPage = () => {
    const { id } = useParams<{ id: string }>(); // Access the dynamic route parameter
    const [initialData, setInitialData] = useState(null);

    // Fetch the initial data for the branch
    const fetchAddress = async (id: string) => {
        try {
            const response = await getSingleAddress(id);
            console.log(response)
            setInitialData(response.data);
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        if (id) {
            fetchAddress(id);
        }
    }, [id]);

    return (
        <MainLayout>
            {
                !initialData ? <Loader /> :
                    <Address id={id} initialData={initialData} />
            }
        </MainLayout>
    );
};

export default UpdateAddressPage;
