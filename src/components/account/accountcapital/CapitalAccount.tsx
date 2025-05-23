'use client';
import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'react-toastify';
import CustomInput from '@/components/ui/CustomInput';
import { Button } from '@/components/ui/button';
import { FaRegListAlt, FaArrowLeft, FaArrowRight } from 'react-icons/fa';
import { VscGoToSearch } from 'react-icons/vsc';
import Link from 'next/link';
import { createCapitalAccount, updateCapitalAccount, getAllCapitalAccount, deleteCapitalAccount } from '@/apis/capitalaccount';

// Zod schema for form validation
const accountSchema = z.object({
  id: z.string().optional(),
  description: z.string().min(1, 'Description is required'),
});

type AccountFormData = z.infer<typeof accountSchema>;

type Account = {
  id: string;
  listid: string;
  description: string;
  parentAccountId: string | null;
  children: Account[];
};

type ApiResponse<T> = {
  data: T;
  statusCode: number;
  statusMessage: string;
  misc: {
    totalPages: number;
    total: number;
    pageIndex: number;
    pageSize: number;
    refId: string | null;
    searchQuery: string | null;
  };
};

// Main component
const CapitalAccount = () => {
  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [parentIdForChild, setParentIdForChild] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; id: string | null } | null>(null);
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
    const [totalPages, setTotalPages] = useState(1);
    const [flatAccounts, setFlatAccounts] = useState<Account[]>([]);

  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    control,
  } = useForm<AccountFormData>({
    resolver: zodResolver(accountSchema),
  });

  // Build hierarchical structure from flat data
  const buildHierarchy = (accounts: Account[]): Account[] => {
    const map: Record<string, Account> = {};
    accounts.forEach((account) => {
      map[account.id] = { ...account, children: [] };
    });

    const rootAccounts: Account[] = [];
    accounts.forEach((account) => {
      if (account.parentAccountId === null) {
        rootAccounts.push(map[account.id]);
      } else {
        const parent = map[account.parentAccountId];
        if (parent) {
          parent.children.push(map[account.id]);
        }
      }
    });

    return rootAccounts;
  };

  // Fetch capital accounts
  const fetchCapitalAccount = async () => {
    try {
      setLoading(true);
      const response: ApiResponse<Account[]> = await getAllCapitalAccount(pageIndex === 0 ? 1 : pageIndex, pageSize);
      const hierarchicalAccounts = buildHierarchy(response.data);
      setTotalPages(response.misc.totalPages); // Update total pages
      setAccounts(hierarchicalAccounts);
    } catch (error) {
      console.error(error);
      // toast.error('Failed to fetch accounts. Please try again.');
      
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCapitalAccount();
  }, [pageIndex, pageSize]);

  // Recursively find an account by id
  const findAccount = (accounts: Account[], id: string): Account | null => {
    for (const account of accounts) {
      if (account.id === id) {
        return account;
      } else if (account.children) {
        const found = findAccount(account.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  // Add a child account
  const addChildAccount = (accounts: Account[], parentId: string, newAccount: Account): Account[] => {
    return accounts.map((account) => {
      if (account.id === parentId) {
        return { ...account, children: [...account.children, newAccount] };
      } else if (account.children) {
        return { ...account, children: addChildAccount(account.children, parentId, newAccount) };
      }
      return account;
    });
  };

  // Update account description
  const updateDescription = (accounts: Account[], id: string, description: string): Account[] => {
    return accounts.map((account) => {
      if (account.id === id) {
        return { ...account, description };
      } else if (account.children) {
        return { ...account, children: updateDescription(account.children, id, description) };
      }
      return account;
    });
  };

  // Remove an account
  const removeAccount = (accounts: Account[], id: string): Account[] => {
    return accounts.filter((account) => {
      if (account.id === id) {
        return false;
      } else if (account.children) {
        account.children = removeAccount(account.children, id);
      }
      return true;
    });
  };

  // Handle right-click for context menu
  const handleRightClick = (event: React.MouseEvent, id: string) => {
    event.preventDefault();
    setContextMenu({ x: event.clientX, y: event.clientY, id });
  };
  
  const toggleItem = (id: string) => {
    setOpenItems((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Close context menu on outside click
  useEffect(() => {
    const handleClickOutside = () => {
      setContextMenu(null);
    };
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const initialAccountExists = accounts.some(account => account.listid === '1');
    if (!initialAccountExists) {
      const initialAccount: Account = {
        id: '',
        listid: '1',
        description: 'Equity',
        parentAccountId: null,
        children: [],
      };
      setAccounts([initialAccount, ...accounts]);
    }
  }, [accounts]);
  
const onSubmit = async (data: AccountFormData) => {
  setLoading(true);
  try {
    let response: ApiResponse<Account>;
    if (editingId) {
      const accountToUpdate = findAccount(accounts, editingId);
      if (accountToUpdate) {
        const updateData = {
          ...data,
          parentAccountId: accountToUpdate.parentAccountId,
          listid: accountToUpdate.listid,
        };
        response = await updateCapitalAccount(editingId, updateData);
        setAccounts((prevAccounts) => updateDescription(prevAccounts, editingId, data.description));
        setEditingId(null);
        toast.success('Account updated successfully!');
      }
    } else if (parentIdForChild) {
      const newAccount: Omit<Account, 'id'> = {
        listid: '', 
        description: data.description,
        parentAccountId: parentIdForChild,
        children: [],
      };
      response = await createCapitalAccount(newAccount);
      setAccounts((prevAccounts) => addChildAccount(prevAccounts, parentIdForChild, response.data));
      setParentIdForChild(null);
      toast.success('Child account added successfully!');
    } else {
      const newAccount: Omit<Account, 'id'> = {
        listid: '', 
        description: data.description,
        parentAccountId: null,
        children: [],
      };
      response = await createCapitalAccount(newAccount);
      setAccounts((prevAccounts) => [...prevAccounts, response.data]);
      toast.success('Account added successfully!');
    }
   
    setShowForm(false);
    reset();
    fetchCapitalAccount();
  } catch (error) {
    console.error('Error submitting form:', error);
  } finally {
    setLoading(false);
  }
};
  // Handle context menu actions
  const handleContextMenuAction = async (action: 'add' | 'addChild' | 'edit' | 'delete', id: string) => {
    setContextMenu(null);
    if (action === 'add') {
      setShowForm(true);
      reset({ id: '', description: '' });
    } else if (action === 'addChild') {
      setShowForm(true);
      const parentAccount = findAccount(accounts, id);
      if (parentAccount) {
        setParentIdForChild(parentAccount.id);
      }
      reset({ id: '', description: '' });
    } else if (action === 'edit') {
      setEditingId(id);
      const account = findAccount(accounts, id);
      if (account) {
        reset({ id: account.id, description: account.description });
      }
      setShowForm(true);
    } else if (action === 'delete') {
      try {
        await deleteCapitalAccount(id);
        setAccounts((prevAccounts) => removeAccount(prevAccounts, id));
        toast.success('Account deleted successfully!');
      } catch (error) {
        console.error('Error deleting account:', error);
        toast.error('Failed to delete account. Please try again.');
      }
    }
  };

  const filteredAccounts = accounts.filter((account) => {
    return (
      (account.listid && account.listid.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (account.description && account.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setPageIndex(0); 
  };  
  const paginatedAccounts = filteredAccounts.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize);
  const renderAccounts = (accounts: Account[], level = 0) => {
    return (
      <ul className="list-none mt-4 bg-white dark:bg-[#030630] z-0">
        {accounts.map((account) => (
          <li   key={`${account.id}-${account.listid}`}
          className="relative pl-4">
            {level > 0 && (
              <div
                className="absolute left-0 top-0 bottom-0 w-px bg-gray-300 dark:bg-gray-600 z-0"
                style={{ height: '100%' }}
              />
            )}
            {level > 0 && (
              <div
                className="absolute left-0 top-1/2 w-4 h-px bg-gray-300 dark:bg-gray-600"
                style={{ transform: 'translateY(-50%)' }}
              />
            )}
            <div
              className="flex mb-4 items-center gap-3 p-2 bg-[#e6f8fb] border border-[#06b6d4]  text-black hover:bg-[#06b6d4] rounded-lg  transition-all duration-300"
              onContextMenu={(e) => handleRightClick(e, account.id)}
            >
              {/* Expand/Collapse Icon */}
              {account.children && account.children.length > 0 && (
                <button
                  onClick={() => toggleItem(account.id)}
                  className="flex items-center justify-center w-5 h-5 rounded-full  bg-[#06b5d4] hover:bg-black transition-colors duration-200 shadow"
                >
                  {openItems[account.id] ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-white"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-white"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </button>
              )}
              {/* Account Details */}
              <div className="flex-1">
                <span className="font-bold text-white p-[3px] px-[6px] br bg-[#06b6d4] rounded-md">{account.listid}</span>
                <span className="ml-2 font-semibold text-black ">{account.description}</span>
              </div>
            </div>
            {/* Render sub-children if expanded */}
            {account.children && openItems[account.id] && (
              <div className="pl-6">{renderAccounts(account.children, level + 1)}</div>
            )}
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="container mx-auto p-4 z-10 relative">
      {contextMenu && (
        <div
          className="fixed bg-white shadow-lg rounded p-2 z-50"
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          <button
            className="block w-full text-left p-1 hover:bg-gray-100"
            onClick={() => handleContextMenuAction('add', contextMenu.id!)}
          >
            Add
          </button>
          <button
            className="block w-full text-left p-1 hover:bg-gray-100"
            onClick={() => handleContextMenuAction('addChild', contextMenu.id!)}
          >
            Add Child
          </button>
          <button
            className="block w-full text-left p-1 hover:bg-gray-100"
            onClick={() => handleContextMenuAction('edit', contextMenu.id!)}
          >
            Edit
          </button>
          <button
            className="block w-full text-left p-1 hover:bg-gray-100 text-red-500"
            onClick={() => handleContextMenuAction('delete', contextMenu.id!)}
          >
            Delete
          </button>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md"
          >
            <div className="grid grid-cols-2 gap-4">
              <Controller
                name="id"
                control={control}
                render={({ field }) => (
                  <CustomInput
                    {...field}
                    type="text"
                    placeholder="ID"
                    label="ID"
                    disabled
                  />
                )}
              />

              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <CustomInput
                    {...field}
                    label="Description"
                    type="text"
                    placeholder="Description"
                    register={register}
                    {...register("description")}
                    error={errors.description?.message}
                  />
                )}
              />
            </div>
            <div className="w-full h-[8vh] flex justify-end gap-2 mt-3 bg-transparent border-t-2 border-[#e7e7e7]">
              <Button
                type="submit"
                className="w-[160] gap-2 inline-flex items-center bg-[#0e7d90] hover:bg-[#0891b2] text-white px-6 py-2 text-sm font-medium transition-all duration-200 font-mono text-base hover:translate-y-[-2px] focus:outline-none active:shadow-[#3c4fe0_0_3px_7px_inset] active:translate-y-[2px] mt-2"
                disabled={loading}
              >
                {loading ? 'Submitting...' : (editingId ? 'Update' : 'Create')} Account
              </Button>
              <Button
                type="button"
                className="w-[160] gap-2 mr-2 inline-flex items-center bg-black hover:bg-[#b0b0b0] text-white px-6 py-2 text-sm font-medium transition-all duration-200 font-mono text-base hover:translate-y-[-2px] focus:outline-none active:shadow-[#3c4fe0_0_3px_7px_inset] active:translate-y-[2px] mt-2"
                variant="outline"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* List of accounts */}
      <div className="p-2 border-2 border-[#2aa0cd] shadow-2xl rounded">
        {/* Header */}
        <div className="w-full bg-[#06b6d4] h-[7vh] rounded dark:bg-[#387fbf] mb-2 pt-2">
          <h1 className="text-base text-[24px] font-mono ml-10  pt-2 text-white flex gap-2">
            <FaRegListAlt size={30} />
            <span className="mt-1"> LIST OF ACCOUNT-CAPITAL </span>
          </h1>
        </div>

        {/* Search Input */}
        <div className="w-full flex justify-end">
          <div className="flex items-center border border-gray-300 rounded-md focus-within:ring-2 focus-within:ring-[#0891b2]">
            <VscGoToSearch className="ml-3 text-gray-500" size={20} />
            <input
              type="text"
              placeholder="Anything....."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="p-2 outline-none"
            />
            <button className="bg-[#0891b2] text-white px-4 py-2 rounded-r-md hover:bg-[#07779d] transition">
              Search
            </button>
          </div>
        </div>

        <div>{renderAccounts(paginatedAccounts)}</div>
        <div className="flex justify-between py-2 mt-1 px-4 rounded-md items-center">
    {/* Page count (Start Section) */}
    <div className="flex items-center">
      <span className="text-sm text-gray-700">
        Page {pageIndex + 1} of {totalPages}
      </span>
    </div>

    {/* Pagination controls (End Section) */}
    <div className="flex items-center space-x-3">
      {/* Rows per page selection */}
      <div className="flex items-center space-x-3">
        <span className="text-sm text-gray-700">Rows per page:</span>
        <select
          value={pageSize}
          onChange={(e) => handlePageSizeChange(Number(e.target.value))}
          className="border border-gray-300 rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-[#030630]"
        >
          {[  50, 100, 1000, 2000, 5000, 10000].map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

    
    </div>
  </div>
      </div>
    </div>
  );
};

export default CapitalAccount;