'use client';
import React, { useState, useEffect } from 'react';
import { getAllEmployeeManagement, deleteEmployeeManagement } from '@/apis/employeemanagement';
import { columns, EmployeeManagement } from './columns';
import { DataTable } from '@/components/ui/table';
import DeleteConfirmModel from '@/components/ui/DeleteConfirmModel';
import { toast } from 'react-toastify';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const EmployeeManagementList = () => {
  const [employeeManagement, setEmployeeManagement] = useState<EmployeeManagement[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [deleteId, setDeleteId] = useState('');
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const fetchEmployeeManagement = async () => {
    try {
      setLoading(true);
      const response = await getAllEmployeeManagement(pageIndex === 0 ? 1 : pageIndex, pageSize);
      setEmployeeManagement(response.data);
    } catch (error) {
      console.error('Error fetching employee management data:', error);
      toast('Failed to fetch employee management data', { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployeeManagement();
  }, [pageIndex, pageSize]);

  const handleDelete = async () => {
    try {
      await deleteEmployeeManagement(deleteId);
      setOpen(false);
      toast('Employee Management Deleted Successfully', { type: 'success' });
      fetchEmployeeManagement(); 
    } catch (error) {
      console.error('Failed to delete employee management:', error);
      toast('Failed to delete employee management', { type: 'error' });
    }
  };

  const handleDeleteOpen = (id: string) => {
    setOpen(true);
    setDeleteId(id);
  };

  const handleDeleteClose = () => {
    setOpen(false);
  };

  return (
    <div className="container bg-white rounded-md p-4">
      
      {/* DataTable */}
      <DataTable
        columns={columns(handleDeleteOpen)}
        data={employeeManagement}
        loading={loading}
        link="/employeemanagement/create"
        setPageIndex={setPageIndex}
        pageIndex={pageIndex}
        pageSize={pageSize}
        setPageSize={setPageSize}
      />

      {/* Delete Confirmation Modal */}
      {open && (
        <DeleteConfirmModel
          handleDeleteclose={handleDeleteClose}
          handleDelete={handleDelete}
          isOpen={open}
        />
      )}
    </div>
  );
};

export default EmployeeManagementList;