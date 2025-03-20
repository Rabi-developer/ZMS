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
import { createCapitalAccount, updateCapitalAccount, getAllCapitalAccount } from '@/apis/capitalaccount';

// Zod schema for form validation
const accountSchema = z.object({
  id: z.string(),
  description: z.string().min(1, 'Description is required'),
});

type AccountFormData = z.infer<typeof accountSchema>;

type Account = {
 
  listid: string;
  description: string;
  parentAccountId: string | null;
  children: Account[];
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
      map[account.listid] = { ...account, children: [] };
    });

    const rootAccounts: Account[] = [];
    accounts.forEach((account) => {
      if (account.parentAccountId === null) {
        rootAccounts.push(map[account.listid]);
      } else {
        const parent = map[account.parentAccountId];
        if (parent) {
          parent.children.push(map[account.listid]);
        }
      }
    });

    return rootAccounts;
  };

  
  // Fetch capital accounts
  const fetchCapitalAccount = async () => {
    try {
      setLoading(true);
      const response = await getAllCapitalAccount(pageIndex === 0 ? 1 : pageIndex, pageSize);
      const hierarchicalAccounts = buildHierarchy(response.data);
      setAccounts(hierarchicalAccounts);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCapitalAccount();
  }, [pageIndex, pageSize]);

  // Generate ID for new accounts
  const generateId = (parentId = '') => {
    if (!parentId) {
      const topLevelCount = accounts.filter((acc) => !acc.listid.includes('.')).length;
      return `${topLevelCount + 1}`;
    } else {
      const parentAccount = findAccount(accounts, parentId);
      if (parentAccount) {
        const siblingCount = parentAccount.children.length;
        return `${parentId}.${String(siblingCount + 1).padStart(3, '0')}`
      }
    }
    return '';
  };

  // Recursively find an account by listid
  const findAccount = (accounts: Account[], listid: string): Account | null => {
    for (const account of accounts) {
      if (account.listid === listid) {
        return account;
      } else if (account.children) {
        const found = findAccount(account.children, listid);
        if (found) return found;
      }
    }
    return null;
  };

  // Add a child account
  const addChildAccount = (accounts: Account[], parentId: string, newAccount: Account): Account[] => {
    return accounts.map((account) => {
      if (account.listid === parentId) {
        return { ...account, children: [...account.children, newAccount] };
      } else if (account.children) {
        return { ...account, children: addChildAccount(account.children, parentId, newAccount) };
      }
      return account;
    });
  };

  // Update account description
  const updateDescription = (accounts: Account[], listid: string, description: string): Account[] => {
    return accounts.map((account) => {
      if (account.listid === listid) {
        return { ...account, description };
      } else if (account.children) {
        return { ...account, children: updateDescription(account.children, listid, description) };
      }
      return account;
    });
  };

  // Remove an account
  const removeAccount = (accounts: Account[], listid: string): Account[] => {
    return accounts.filter((account) => {
      if (account.listid === listid) {
        return false;
      } else if (account.children) {
        account.children = removeAccount(account.children, listid);
      }
      return true;
    });
  };

  // Handle right-click for context menu
  const handleRightClick = (event: React.MouseEvent, listid: string) => {
    event.preventDefault();
    setContextMenu({ x: event.clientX, y: event.clientY, id: listid });
  };
  
  const toggleItem = (listid: string) => {
    setOpenItems((prev) => ({
      ...prev,
      [listid]: !prev[listid],
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
    // Check if the initial account (ID: 1, Description: Equity) exists
    const initialAccountExists = accounts.some(account => account.listid === '1');
    if (!initialAccountExists) {
      const initialAccount: Account = {
        listid: '1',
        description: 'Equity',
        parentAccountId: null,
        children: [],
      };
      setAccounts([initialAccount, ...accounts]);
    }
  }, [accounts]);
  // Handle form submission
  const onSubmit = async (data: AccountFormData) => {
    setLoading(true);
    try {
      let response;
      if (editingId) {
        // Update existing account
        response = await updateCapitalAccount(editingId, data);
        setAccounts((prevAccounts) => updateDescription(prevAccounts, editingId, data.description));
        setEditingId(null);
        toast.success('Account updated successfully!');
      } else if (parentIdForChild) {
        // Add a new child account
        const newId = generateId(parentIdForChild);
        const newAccount: Account = {
      
          listid: newId,
          description: data.description,
          parentAccountId: null,
          children: [],
        };
        response = await createCapitalAccount(newAccount);
        setAccounts((prevAccounts) => addChildAccount(prevAccounts, parentIdForChild, newAccount));
        setParentIdForChild(null);
        toast.success('Child account added successfully!');
      } else {
        // Add a new top-level account
        const newId = generateId();
        const newAccount: Account = {
          
          listid: newId,
          description: data.description,
          parentAccountId: null,
          children: [],
        };
        response = await createCapitalAccount(newAccount);
        setAccounts((prevAccounts) => [...prevAccounts, newAccount]);
        toast.success('Account added successfully!');
      }
      console.log(response);
      setShowForm(false);
      reset();
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error('Failed to submit form. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle context menu actions
  const handleContextMenuAction = (action: 'add' | 'addChild' | 'edit' | 'delete', listid: string) => {
    setContextMenu(null);
    if (action === 'add') {
      setShowForm(true);
      reset({ id: generateId(), description: '' });
    } else if (action === 'addChild') {
      setShowForm(true);
      setParentIdForChild(listid);
      reset({ id: generateId(listid), description: '' });
    } else if (action === 'edit') {
      setEditingId(listid);
      const account = findAccount(accounts, listid);
      if (account) {
        reset({ id: account.listid, description: account.description });
      }
      setShowForm(true);
    } else if (action === 'delete') {
      setAccounts((prevAccounts) => removeAccount(prevAccounts, listid));
      toast.success('Account deleted successfully!');
    }
  };


  // Filter accounts based on search query
  const filteredAccounts = accounts.filter((account) => {
    return (
      account.listid.toLowerCase().includes(searchQuery.toLowerCase()) ||
      account.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  // Paginate accounts
  const paginatedAccounts = filteredAccounts.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize);

  // Render accounts with hierarchical lines
  const renderAccounts = (accounts: Account[], level = 0) => {
    return (
      <ul className="list-none mt-4 dark:bg-[#030630] bg-white z-0">
      {accounts.map((account) => (
        <li key={account.listid} className="relative pl-4 ">
          {/* Vertical line */}
          {level > 0 && (
            <div
              className="absolute left-0 top-0 bottom-0 w-px bg-gray-300 z-0"
              style={{ height: '100%' }}
            />
          )}
          {/* Horizontal line */}
          {level > 0 && (
            <div
              className="absolute left-0 top-1/2 w-4 h-px bg-gray-300"
              style={{ transform: 'translateY(-50%)' }}
            />
          )}
          <div
            className="flex items-center gap-2 p-2 hover:bg-[#c2e5f5] rounded transition-colors duration-200"
            onContextMenu={(e) => handleRightClick(e, account.listid)}
          >
            {/* Expand/Collapse Icon */}
            {account.children && account.children.length > 0 && (
              <button
                onClick={() => toggleItem(account.listid)}
                className="flex items-center justify-center w-6 h-6 rounded-full hover:bg-gray-200 transition-colors duration-200"
              >
                {openItems[account.listid] ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 text-gray-600"
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
                    className="h-4 w-4 text-gray-600"
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
              <span className="font-bold  text-[#17678d]">{account.listid}</span>
              <span className="ml-2 font-semibold text-[#2aa0cd]">{account.description}</span>
            </div>
          </div>
          {/* Render sub-children if expanded */}
          {account.children && openItems[account.listid] && (
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
          <div className="flex items-center">
            <span className="text-sm text-gray-700">
              Page {pageIndex + 1} of {Math.ceil(filteredAccounts.length / pageSize)}
            </span>
          </div>

          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-700">Rows per page:</span>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="border border-gray-300 rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-[#030630]"
              >
                {[5, 10, 20, 50, 100].map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => setPageIndex(pageIndex - 1)}
              disabled={pageIndex === 0}
              className={`px-3 py-2 text-sm border rounded-md ${
                pageIndex === 0
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-white text-blue-600 hover:bg-blue-50 hover:text-blue-700'
              }`}
            >
              <FaArrowLeft size={14} />
            </button>

            <span className="px-4 py-2 text-sm font-medium bg-blue-50 text-blue-700 border border-blue-100 rounded-md">
              {pageIndex + 1}
            </span>

            <button
              onClick={() => setPageIndex(pageIndex + 1)}
              disabled={(pageIndex + 1) * pageSize >= filteredAccounts.length}
              className={`px-3 py-2 text-sm border rounded-md ${
                (pageIndex + 1) * pageSize >= filteredAccounts.length
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-white text-blue-600 hover:bg-blue-50 hover:text-blue-700'
              }`}
            >
              <FaArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CapitalAccount;