"use client";
import { Suspense } from 'react';
import InspectionNote from '@/components/contractportion/inspect/InspectNote';
import InspectionNoteList from '@/components/contractportion/inspect/InspectNoteList';
import MainLayout from '@/components/MainLayout/MainLayout';

const InspectNote = () => {
    return (
        <MainLayout activeInterface="ZMS">
            <Suspense fallback={<div>Loading...</div>}>
                <InspectionNoteList/>
            </Suspense>
        </MainLayout>
    )
}

export default InspectNote