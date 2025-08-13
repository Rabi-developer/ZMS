'use client';
import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'react-toastify';
import CustomInput from '@/components/ui/CustomInput';
import { Button } from '@/components/ui/button';
import { FaRegListAlt, FaArrowLeft, FaArrowRight } from 'react-icons/fa';
import { VscGoToSearch } from 'react-icons/vsc';


const accountSchema = z.object({
  id: z.string(),
  subChildId: z.string().optional(),
  description: z.string().min(1, 'Description is required'),
});

type AccountFormData = z.infer<typeof accountSchema>;

type Account = {
  id: string;
  description: string;
  children: Account[];
};

// Main component
const OtherIncome = () => {
  const [accounts, setAccounts] = useState<Account[]>([
    { id: '7', description: 'OTHER INCOME', children: [] },
  ]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [parentIdForChild, setParentIdForChild] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; id: string | null } | null>(
    null
  );
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});
  const [pageIndex, setPageIndex] = useState(0); // Pagination state
  const [pageSize, setPageSize] = useState(10); // Rows per page
  const [searchQuery, setSearchQuery] = useState(''); // Search query

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AccountFormData>({
    resolver: zodResolver(accountSchema),
  });

  // Generate ID for new accounts
  const generateId = (parentId = '') => {
    if (!parentId) {
      const topLevelCount = accounts.filter((acc) => !acc.id.includes('.')).length;
      return `${topLevelCount + 7}`; // Start IDs from 7
    } else {
      const parentAccount = findAccount(accounts, parentId);
      if (parentAccount) {
        const siblingCount = parentAccount.children.length;
        const level = parentId.split('.').length;
        let childId: string;
        if (level === 1) {
          childId = `${parentId}.${String(siblingCount + 1).padStart(2, '0')}`;
        } else if (level === 2) {
          childId = `${parentId}.${String(siblingCount + 1).padStart(2, '0')}`;
        } else if (level === 3) {
          childId = `${parentId}.${String(siblingCount + 1).padStart(3, '0')}`;
        } else {
          childId = `${parentId}.${String(siblingCount + 1).padStart(3, '0')}`;
        }
        return childId;
      }
    }
    return '';
  };

  // Recursively find an account by ID
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

  // Handle form submission
  const onSubmit = (data: AccountFormData) => {
    if (editingId) {
      setAccounts((prevAccounts) => updateDescription(prevAccounts, editingId, data.description));
      setEditingId(null);
      toast.success('Account updated successfully!');
    } else if (parentIdForChild) {
      const newId = generateId(parentIdForChild);
      const newAccount: Account = { id: newId, description: data.description, children: [] };
      setAccounts((prevAccounts) => addChildAccount(prevAccounts, parentIdForChild, newAccount));
      setParentIdForChild(null);
      toast.success('Child account added successfully!');
    } else {
      const newId = generateId();
      const newAccount: Account = { id: newId, description: data.description, children: [] };
      setAccounts((prevAccounts) => [...prevAccounts, newAccount]);
      toast.success('Account added successfully!');
    }
    setShowForm(false);
    reset();
  };

  // Handle context menu actions
  const handleContextMenuAction = (action: 'add' | 'addChild' | 'edit' | 'delete', id: string) => {
    setContextMenu(null);
    if (action === 'add') {
      setShowForm(true);
      reset({ id: generateId(), description: '' });
    } else if (action === 'addChild') {
      setShowForm(true);
      setParentIdForChild(id);
      reset({ id: generateId(id), description: '' });
    } else if (action === 'edit') {
      setEditingId(id);
      const account = findAccount(accounts, id);
      if (account) {
        reset({ id: account.id, description: account.description });
      }
      setShowForm(true);
    } else if (action === 'delete') {
      setAccounts((prevAccounts) => removeAccount(prevAccounts, id));
      toast.success('Account deleted successfully!');
    }
  };

  // Toggle expand/collapse for accounts
  const toggleItem = (id: string) => {
    setOpenItems((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Paginate accounts based on saved data (accounts state)
  const paginatedAccounts = accounts.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize);

  // Render accounts with hierarchical lines
  const renderAccounts = (accounts: Account[], level = 0) => {
    return (
      <ul className="list-none mt-4 dark:bg-[#030630] bg-white z-0">
        {accounts.map((account) => (
          <li key={account.id} className="relative pl-4 ">
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
              onContextMenu={(e) => handleRightClick(e, account.id)}
            >
              {/* Expand/Collapse Icon */}
              {account.children && account.children.length > 0 && (
                <button
                  onClick={() => toggleItem(account.id)}
                  className="flex items-center justify-center w-6 h-6 rounded-full hover:bg-gray-200 transition-colors duration-200"
                >
                  {openItems[account.id] ? (
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
                <span className="font-bold  text-[#17678d]">{account.id}</span>
                <span className="ml-2 font-semibold text-[#2aa0cd]">{account.description}</span>
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
      {/* Context Menu */}
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

      {/* Form for adding/editing accounts */}
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
                    error={errors.description?.message}
                  />
                )}
              />
            </div>
            <div className="w-full h-[8vh] flex justify-end gap-2 mt-3 bg-transparent border-t-2 border-[#e7e7e7]">
              <Button
                type="submit"
                className="w-[160] gap-2 inline-flex items-center bg-[#0e7d90] hover:bg-[#0891b2] text-white px-6 py-2 text-sm font-medium transition-all duration-200 font-mono text-base hover:translate-y-[-2px] focus:outline-none active:shadow-[#3c4fe0_0_3px_7px_inset] active:translate-y-[2px] mt-2"
              >
                Submit
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
            <span className="mt-1"> LIST OF ACCOUNT-OTHER INCOME </span>
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

        {/* Render accounts with hierarchical lines */}
        <div>{renderAccounts(paginatedAccounts)}</div>

        {/* Pagination Controls */}
        <div className="flex justify-between py-2 mt-1 px-4 rounded-md items-center">
          {/* Page count (Start Section) */}
          <div className="flex items-center">
            <span className="text-sm text-gray-700">
              Page {pageIndex + 1} of {Math.ceil(accounts.length / pageSize)}
            </span>
          </div>

          {/* Pagination controls (End Section) */}
          <div className="flex items-center space-x-3">
            {/* Rows per page selection */}
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-700">Rows per page:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPageIndex(0); // Reset to the first page when page size changes
                }}
                className="border border-gray-300 rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-[#030630]"
              >
                {[5, 10, 20, 50, 100].map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            {/* Previous button */}
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

            {/* Current page indicator */}
            <span className="px-4 py-2 text-sm font-medium bg-blue-50 text-blue-700 border border-blue-100 rounded-md">
              {pageIndex + 1}
            </span>

            {/* Next button */}
            <button
              onClick={() => setPageIndex(pageIndex + 1)}
              disabled={(pageIndex + 1) * pageSize >= accounts.length}
              className={`px-3 py-2 text-sm border rounded-md ${
                (pageIndex + 1) * pageSize >= accounts.length
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

export default OtherIncome;