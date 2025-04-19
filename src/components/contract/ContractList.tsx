'use client';

import React from 'react';
import { getAllContract, deleteContract } from '@/apis/contract';
import { columns, Contract } from './columns';
import { DataTable } from '@/components/ui/table';
import DeleteConfirmModel from '@/components/ui/DeleteConfirmModel';
import { toast } from 'react-toastify';

const ContractList = () => {
  const [contracts, setContracts] = React.useState<Contract[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const [deleteId, setDeleteId] = React.useState('');
  const [pageIndex, setPageIndex] = React.useState(0);
  const [pageSize, setPageSize] = React.useState(10);

  const fetchContracts = async () => {
    try {
      setLoading(true);
      const response = await getAllContract(pageIndex === 0 ? 1 : pageIndex, pageSize);
      setContracts(response.data);
    } catch (error) {
      console.error('Error fetching contracts:', error);
      toast('Failed to fetch contracts', { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchContracts();
  }, [pageIndex, pageSize]);

  const handleDelete = async () => {
    try {
      await deleteContract(deleteId);
      setOpen(false);
      toast('Contract Deleted Successfully', { type: 'success' });
      fetchContracts();
    } catch (error) {
      console.error('Failed to delete contract:', error);
      toast('Failed to delete contract', { type: 'error' });
    }
  };

  const handleDeleteOpen = (id: string) => {
    setOpen(true);
    setDeleteId(id);
  };

  const handleDeleteClose = () => {
    setOpen(false);
    setDeleteId('');
  };

  return (
    <div className="container bg-white rounded-md">
      <DataTable
        columns={columns(handleDeleteOpen)}
        data={contracts}
        loading={loading}
        link={'/contracts/create'}
        setPageIndex={setPageIndex}
        pageIndex={pageIndex}
        pageSize={pageSize}
        setPageSize={setPageSize}
      />
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

export default ContractList;