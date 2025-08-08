"use client";
import InspectionNote from '@/components/contractportion/inspect/InspectNote';
import InspectionNoteList from '@/components/contractportion/inspect/InspectNoteList';
import MainLayout from '@/components/MainLayout/MainLayout'

const InspectNote = () => {

    return (
        <MainLayout activeInterface="ZMS">
            <InspectionNoteList/>
        </MainLayout>
    )
}

export default InspectNote