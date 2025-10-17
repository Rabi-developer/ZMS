'use client';
import React, { useState, useEffect, Dispatch, SetStateAction } from 'react';
import { useForm, Controller, UseFormRegister } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'react-toastify';
import ABLCustomInput from '@/components/ui/ABLCustomInput';
import { Button } from '@/components/ui/button';
import { FaRegListAlt, FaArrowLeft, FaArrowRight, FaTimes } from 'react-icons/fa';
import { VscGoToSearch } from 'react-icons/vsc';
import { createAblLiabilities, getAllAblLiabilities, updateAblLiabilities, deleteAblLiabilities } from '@/apis/ablliabilities';

// Zod schema for form validation
const accountSchema = z.object({
  id: z.string().optional(),
  description: z.string().min(1, 'Description is required'),
  dueDate: z.string().optional().refine(
    (val) => {
      if (!val || val.trim() === '') return true;
      const textDateRegex = /^\d{2}-[A-Za-z]{3}-\d{4}( \d{2}:\d{2})?$/;
      const isoDateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;
      return textDateRegex.test(val) || isoDateRegex.test(val);
    },
    { message: 'Invalid date format. Use DD-MMM-YYYY or DD-MMM-YYYY HH:mm' }
  ),
  fixedAmount: z.string().optional(),
});

type AccountFormData = z.infer<typeof accountSchema>;

type Account = {
  id: string;
  listid: string;
  description: string;
  parentAccountId: string | null;
  children: Account[];
  dueDate: string;
  fixedAmount: string;
  paid: string;
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

// Define props for ABLCustomInput to ensure TypeScript compatibility
interface ABLCustomInputProps {
  id: string;
  label: string;
  type: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  register?: UseFormRegister<AccountFormData>;
  error?: string;
  disabled?: boolean;
}

const AblLiabilitiesForm = () => {
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
  const [alerts, setAlerts] = useState<Account[]>([]);
  const [currentAlertIndex, setCurrentAlertIndex] = useState(0);
  const [dueDateInputType, setDueDateInputType] = useState<'datetime-local' | 'text'>('datetime-local');
  const [showAlertPopup, setShowAlertPopup] = useState(false);
  const [highlightColor, setHighlightColor] = useState<string>('#FFFF99'); // Default highlight color (light yellow)
  const [highlightedItems, setHighlightedItems] = useState<Record<string, { type: 'row' | 'cell'; column?: string; color: string }>>({});
  const [showColorPicker, setShowColorPicker] = useState<{ id: string; type: 'row' | 'cell'; column?: string; x: number; y: number } | null>(null);
  const [selectedRows, setSelectedRows] = useState<string[]>([]); // State for selected rows

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

  // Load highlightedItems from localStorage on component mount
  useEffect(() => {
    const savedHighlights = localStorage.getItem('highlightedItems');
    if (savedHighlights) {
      setHighlightedItems(JSON.parse(savedHighlights));
    }
  }, []);
//  Save highlightedItems to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('highlightedItems', JSON.stringify(highlightedItems));
  }, [highlightedItems]);

  const parseTextDateToISO = (textDate: string): string => {
    const [datePart, timePart] = textDate.split(' ');
    const [day, month, year] = datePart.split('-');
    const monthIndex = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].indexOf(month);
    if (monthIndex === -1) return textDate;
    const isoDate = new Date(
      parseInt(year),
      monthIndex,
      parseInt(day),
      timePart ? parseInt(timePart.split(':')[0]) : 0,
      timePart ? parseInt(timePart.split(':')[1]) : 0
    );
    return isoDate.toISOString();
  };

  const formatDateTime = (isoString: string): string => {
    const date = new Date(isoString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = date.toLocaleString('en-US', { month: 'short' });
    const year = date.getFullYear();
    const hours = date.getHours() % 12 || 12;
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = date.getHours() >= 12 ? 'PM' : 'AM';
    return `${day}-${month}-${year} ${hours}:${minutes} ${ampm}`;
  };

  const getDaysLeft = (dueDate: string): string => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return `${diffDays} day${diffDays !== 1 ? 's' : ''} left`;
  };

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

  const fetchAblLiabilities = async () => {
    try {
      setLoading(true);
      const response: ApiResponse<Account[]> = await getAllAblLiabilities(pageIndex === 0 ? 1 : pageIndex, pageSize);
      const hierarchicalAccounts = buildHierarchy(response.data);
      setTotalPages(response.misc.totalPages);
      setAccounts(hierarchicalAccounts);
      checkDueDates(response.data);
    } catch (error) {
      console.error('Fetch error:', error);
      toast.error('Failed to fetch accounts. Please try again.', {
        position: 'top-right',
        autoClose: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAblLiabilities();
  }, [pageIndex, pageSize]);

  const checkDueDates = (accounts: Account[]) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const newAlerts = accounts.filter(account => {
      if (account.paid === "true" || !account.dueDate) return false;
      try {
        const dueDate = new Date(account.dueDate);
        if (isNaN(dueDate.getTime())) return false;
        dueDate.setHours(0, 0, 0, 0);
        const diffTime = dueDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 3 && diffDays >= 1;
      } catch (error) {
        console.error(`Invalid dueDate for account ${account.id}:`, account.dueDate);
        return false;
      }
    });
    setAlerts(newAlerts);
    setCurrentAlertIndex(0);
  };

  const findAccount = (accounts: Account[], id: string): Account | null => {
    for (const account of accounts) {
      if (account.id === id) return account;
      if (account.children) {
        const found = findAccount(account.children, id);
        if (found) return found;
      }
    }
    return null;
  };

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

  const updateAccount = (accounts: Account[], id: string, updatedData: Partial<Account>): Account[] => {
    return accounts.map((account) => {
      if (account.id === id) {
        return { ...account, ...updatedData };
      } else if (account.children) {
        return { ...account, children: updateAccount(account.children, id, updatedData) };
      }
      return account;
    });
  };

  const removeAccount = (accounts: Account[], id: string): Account[] => {
    return accounts.filter((account) => {
      if (account.id === id) return false;
      if (account.children) {
        account.children = removeAccount(account.children, id);
      }
      return true;
    });
  };

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

  const handleSelectRow = (id: string) => {
    setSelectedRows((prev) =>
      prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]
    );
  };

  const handleHighlightSelectedRows = () => {
    setHighlightedItems((prev) => {
      const newHighlights = { ...prev };
      selectedRows.forEach((id) => {
        newHighlights[id] = { type: 'row', color: highlightColor };
      });
      return newHighlights;
    });
    setSelectedRows([]); 
  };

  useEffect(() => {
    const handleClickOutside = () => {
      setContextMenu(null);
      setShowColorPicker(null);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  useEffect(() => {
    const initialAccountExists = accounts.some(account => account.listid === '2');
    if (!initialAccountExists) {
      const initialAccount: Account = {
        id: '',
        listid: '2',
        description: 'Liabilities',
        parentAccountId: null,
        children: [],
        dueDate: '',
        fixedAmount: '0',
        paid: 'false',
      };
      setAccounts([initialAccount, ...accounts]);
    }
  }, [accounts]);

  const onSubmit = async (data: AccountFormData) => {
    setLoading(true);
    try {
      let response: ApiResponse<Account>;
      const processedData = {
        ...data,
        dueDate: data.dueDate ? (dueDateInputType === 'text' ? parseTextDateToISO(data.dueDate) : data.dueDate) : '',
        fixedAmount: data.fixedAmount || '',
      };
      if (editingId) {
        const accountToUpdate = findAccount(accounts, editingId);
        if (accountToUpdate) {
          const updateData = {
            ...processedData,
            parentAccountId: accountToUpdate.parentAccountId,
            listid: accountToUpdate.listid,
            paid: accountToUpdate.paid,
          };
          response = await updateAblLiabilities(editingId, updateData);
          setAccounts((prevAccounts) => updateAccount(prevAccounts, editingId, updateData));
          setEditingId(null);
          toast.success('Account updated successfully!', {
            position: 'top-right',
            autoClose: 3000,
            style: { background: '#3a614c', color: '#fff' },
          });
        }
      } else {
        const newAccount: Omit<Account, 'id'> = {
          listid: '',
          description: processedData.description,
          parentAccountId: parentIdForChild || null,
          children: [],
          dueDate: processedData.dueDate,
          fixedAmount: processedData.fixedAmount,
          paid: 'false',
        };
        response = await createAblLiabilities(newAccount);
        setAccounts((prevAccounts) =>
          parentIdForChild
            ? addChildAccount(prevAccounts, parentIdForChild, response.data)
            : [...prevAccounts, response.data]
        );
        setParentIdForChild(null);
        toast.success(parentIdForChild ? 'Child account added successfully!' : 'Account added successfully!', {
          position: 'top-right',
          autoClose: 3000,
          style: { background: '#3a614c', color: '#fff' },
        });
      }
      setShowForm(false);
      reset();
      fetchAblLiabilities();
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error('Failed to process request. Please try again.', {
        position: 'top-right',
        autoClose: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleContextMenuAction = async (action: 'add' | 'addChild' | 'edit' | 'delete' | 'pay', id: string) => {
    setContextMenu(null);
    if (action === 'add') {
      setShowForm(true);
      reset({ id: '', description: '', dueDate: '', fixedAmount: '' });
    } else if (action === 'addChild') {
      setShowForm(true);
      const parentAccount = findAccount(accounts, id);
      if (parentAccount) {
        setParentIdForChild(parentAccount.id);
      }
      reset({ id: '', description: '', dueDate: '', fixedAmount: '' });
    } else if (action === 'edit') {
      setEditingId(id);
      const account = findAccount(accounts, id);
      if (account) {
        reset({
          id: account.id,
          description: account.description,
          dueDate: dueDateInputType === 'text' ? formatDateTime(account.dueDate) : account.dueDate,
          fixedAmount: account.fixedAmount,
        });
      }
      setShowForm(true);
    } else if (action === 'delete') {
      try {
        await deleteAblLiabilities(id);
        setAccounts((prevAccounts) => removeAccount(prevAccounts, id));
        setHighlightedItems((prev) => {
          const newHighlights = { ...prev };
          Object.keys(newHighlights).forEach((key) => {
            if (key.startsWith(id)) delete newHighlights[key];
          });
          return newHighlights;
        });
        toast.success('Account deleted successfully!', {
          position: 'top-right',
          autoClose: 3000,
          style: { background: '#3a614c', color: '#fff' },
        });
      } catch (error) {
        console.error('Error deleting account:', error);
        toast.error('Failed to delete account. Please try again.', {
          position: 'top-right',
          autoClose: 3000,
        });
      }
    } else if (action === 'pay') {
      try {
        const account = findAccount(accounts, id);
        if (account) {
          const updatedAccount = { ...account, paid: 'true' };
          await updateAblLiabilities(id, updatedAccount);
          setAccounts((prevAccounts) => updateAccount(prevAccounts, id, { paid: 'true' }));
          setAlerts((prevAlerts) => prevAlerts.filter(alert => alert.id !== id));
          setHighlightedItems((prev) => {
            const newHighlights = { ...prev };
            Object.keys(newHighlights).forEach((key) => {
              if (key.startsWith(id)) delete newHighlights[key];
            });
            return newHighlights;
          });
          toast.success('Account marked as paid!', {
            position: 'top-right',
            autoClose: 3000,
            style: { background: '#3a614c', color: '#fff' },
          });
        }
      } catch (error) {
        console.error('Error marking as paid:', error);
        toast.error('Failed to mark as paid. Please try again.', {
          position: 'top-right',
          autoClose: 3000,
        });
      }
    }
  };

  const dismissAlert = (id: string) => {
    setAlerts((prevAlerts) => prevAlerts.filter(alert => alert.id !== id));
    if (currentAlertIndex >= alerts.length - 1) {
      setCurrentAlertIndex(0);
    }
  };

  const filterAccountsByQuery = (accountsToFilter: Account[], query: string): Account[] => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) {
      return accountsToFilter;
    }

    const filterRecursive = (account: Account): Account | null => {
      const matchesSelf =
        account.listid.toLowerCase().includes(normalizedQuery) ||
        account.description.toLowerCase().includes(normalizedQuery);

      const filteredChildren = account.children
        .map((child) => filterRecursive(child))
        .filter((child): child is Account => child !== null);

      if (matchesSelf || filteredChildren.length > 0) {
        return {
          ...account,
          children: filteredChildren,
        };
      }

      return null;
    };

    return accountsToFilter
      .map((account) => filterRecursive(account))
      .filter((account): account is Account => account !== null);
  };

  const filteredAccounts = filterAccountsByQuery(accounts, searchQuery);

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setPageIndex(0);
  };

  const paginatedAccounts = filteredAccounts.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize);

  const renderAccounts = (accounts: Account[], level = 0) => {
    return (
      <ul className="list-none mt-4 bg-white dark:bg-[#1a2b21] z-0">
        {accounts.map((account) => (
          <li key={`${account.id}-${account.listid}`} className="relative pl-4">
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
              className="flex mb-4 items-center gap-3 p-2 bg-[#e6f8e6] border border-[#3a614c] text-black hover:bg-[#4a7a5e] rounded-lg transition-all duration-300 shadow-md"
              onContextMenu={(e) => handleRightClick(e, account.id)}
            >
              {account.children && account.children.length > 0 && (
                <button
                  onClick={() => toggleItem(account.id)}
                  className="flex items-center justify-center w-5 h-5 rounded-full bg-[#3a614c] hover:bg-[#2e4c3d] transition-colors duration-200 shadow"
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
              <div className="flex-1">
                <span className="font-bold text-white p-[3px] px-[6px] bg-[#3a614c] rounded-md">{account.listid}</span>
                <span className="ml-2 font-semibold text-black">{account.description}</span>
                {account.dueDate && (
                  <span className="ml-2 text-sm text-gray-600">
                     {account.paid === 'true' ? 'Paid' : 'Unpaid'}
                    {/* Due: {formatDateTime(account.dueDate)} | Amount: ${account.fixedAmount} | {account.paid === 'true' ? 'Paid' : 'Unpaid'} */}
                  </span>
                )}
              </div>
            </div>
            {account.children && openItems[account.id] && (
              <div className="pl-6">{renderAccounts(account.children, level + 1)}</div>
            )}
          </li>
        ))}
      </ul>
    );
  };

  const handleNextAlert = () => {
    setCurrentAlertIndex((prev) => (prev + 1) % alerts.length);
  };

  const handlePrevAlert = () => {
    setCurrentAlertIndex((prev) => (prev - 1 + alerts.length) % alerts.length);
  };

  const handleHighlight = (id: string, type: 'row' | 'cell', column?: string, color?: string) => {
    if (!color) return; // Color must be provided to apply highlight
    setHighlightedItems((prev) => {
      const key = column ? `${id}-${column}` : id;
      if (prev[key]) {
        const newHighlights = { ...prev };
        delete newHighlights[key];
        return newHighlights;
      }
      return {
        ...prev,
        [key]: { type, column, color },
      };
    });
    setShowColorPicker(null);
  };

  const handleColorPickerOpen = (e: React.MouseEvent, id: string, type: 'row' | 'cell', column?: string) => {
    e.stopPropagation();
    setShowColorPicker({ id, type, column, x: e.clientX, y: e.clientY });
  };

  return (
    <div className="container mx-auto p-4 z-10 relative">
      {/* Alerts Section */}
      {alerts.length > 0 && (
        <div className="fixed bottom-4 right-4 w-80 z-50 space-y-4">
          {alerts.map((alert, index) => (
            <div
              key={alert.id}
              className={`relative p-4 rounded-xl shadow-2xl transform transition-all duration-500 ease-in-out
                ${index === currentAlertIndex ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}
                ${index % 4 === 0 ? 'bg-gradient-to-r from-red-500 to-pink-500' : 
                  index %4 === 1 ? 'bg-gradient-to-r from-blue-500 to-blue-700' : 
                  index %4 === 2 ? 'bg-gradient-to-r from-green-500 to-teal-500' : 
                  'bg-gradient-to-r from-purple-500 to-violet-500'} 
                hover:scale-105 hover:shadow-3xl cursor-pointer animate-slide-in`}
              style={{ display: index === currentAlertIndex ? 'block' : 'none' }}
              onClick={() => setShowAlertPopup(true)}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  dismissAlert(alert.id);
                }}
                className="absolute top-2 right-2 text-white hover:text-gray-200 transition-colors duration-200"
              >
                <FaTimes size={16} />
              </button>
              <div className="flex justify-between items-center mb-2">
                <span className="font-bold text-white text-lg">Payment Due Alert</span>
                {alerts.length > 1 && (
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePrevAlert();
                      }}
                      className="text-white hover:text-gray-200 transition-colors duration-200"
                    >
                      <FaArrowLeft size={16} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleNextAlert();
                      }}
                      className="text-white hover:text-gray-200 transition-colors duration-200"
                    >
                      <FaArrowRight size={16} />
                    </button>
                  </div>
                )}
              </div>
              <p className="font-semibold text-white">
                Payment of ${alert.fixedAmount} for {alert.description} due in{' '}
                {Math.ceil(
                  (new Date(alert.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                )}{' '}
                day(s)!
              </p>
              <p className="text-sm text-white opacity-80">Due at: {formatDateTime(alert.dueDate)}</p>
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  handleContextMenuAction('pay', alert.id);
                }}
                className="mt-3 bg-white text-gray-800 hover:bg-gray-100 rounded-lg shadow-md transition-all duration-200 font-semibold"
              >
                Mark as Paid
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Alert Popup */}
      {showAlertPopup && alerts.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-4xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-[#3a614c]">Due Payments</h2>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={highlightColor}
                    onChange={(e) => setHighlightColor(e.target.value)}
                    className="w-8 h-8 border-2 border-[#3a614c] rounded"
                  />
                  <Button
                    onClick={handleHighlightSelectedRows}
                    className="bg-[#3a614c] text-white hover:bg-[#4a7a5e] rounded-lg"
                    disabled={selectedRows.length === 0}
                  >
                    Highlight Selected Rows
                  </Button>
                </div>
                <button
                  onClick={() => setShowAlertPopup(false)}
                  className="text-gray-600 hover:text-gray-800"
                >
                  <FaTimes size={20} />
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-[#3a614c] text-white">
                    <th className="p-3 text-left border-r border-gray-300">
                      <input
                        type="checkbox"
                        checked={selectedRows.length === alerts.length && alerts.length > 0}
                        onChange={() => {
                          if (selectedRows.length === alerts.length) {
                            setSelectedRows([]);
                          } else {
                            setSelectedRows(alerts.map((alert) => alert.id));
                          }
                        }}
                        className="h-4 w-4"
                      />
                    </th>
                    <th className="p-3 text-left border-r border-gray-300">Description</th>
                    <th className="p-3 text-left border-r border-gray-300">Due Date</th>
                    <th className="p-3 text-left border-r border-gray-300">Time Left</th>
                    <th className="p-3 text-left border-r border-gray-300">Fixed Amount</th>
                    <th className="p-3 text-left border-r border-gray-300">Status</th>
                    <th className="p-3 text-left">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {alerts.map((alert) => (
                    <tr
                      key={alert.id}
                      className="border-b border-gray-300 transition-colors duration-200 cursor-pointer hover:bg-[#e6f8e6]"
                      style={{ backgroundColor: highlightedItems[alert.id]?.type === 'row' ? highlightedItems[alert.id].color : undefined }}
                      onContextMenu={(e) => handleRightClick(e, alert.id)}
                    >
                      <td className="p-3 border-r border-gray-300">
                        <input
                          type="checkbox"
                          checked={selectedRows.includes(alert.id)}
                          onChange={() => handleSelectRow(alert.id)}
                          className="h-4 w-4"
                        />
                      </td>
                      <td
                        className="p-3 border-r border-gray-300"
                        style={{ backgroundColor: highlightedItems[`${alert.id}-description`]?.type === 'cell' ? highlightedItems[`${alert.id}-description`].color : undefined }}
                        onClick={(e) => handleColorPickerOpen(e, alert.id, 'cell', 'description')}
                      >
                        {alert.description}
                      </td>
                      <td
                        className="p-3 border-r border-gray-300"
                        style={{ backgroundColor: highlightedItems[`${alert.id}-dueDate`]?.type === 'cell' ? highlightedItems[`${alert.id}-dueDate`].color : undefined }}
                        onClick={(e) => handleColorPickerOpen(e, alert.id, 'cell', 'dueDate')}
                      >
                        {formatDateTime(alert.dueDate)}
                      </td>
                      <td
                        className="p-3 border-r border-gray-300"
                        style={{ backgroundColor: highlightedItems[`${alert.id}-daysLeft`]?.type === 'cell' ? highlightedItems[`${alert.id}-daysLeft`].color : undefined }}
                        onClick={(e) => handleColorPickerOpen(e, alert.id, 'cell', 'daysLeft')}
                      >
                        {getDaysLeft(alert.dueDate)}
                      </td>
                      <td
                        className="p-3 border-r border-gray-300"
                        style={{ backgroundColor: highlightedItems[`${alert.id}-fixedAmount`]?.type === 'cell' ? highlightedItems[`${alert.id}-fixedAmount`].color : undefined }}
                        onClick={(e) => handleColorPickerOpen(e, alert.id, 'cell', 'fixedAmount')}
                      >
                        ${alert.fixedAmount}
                      </td>
                      <td
                        className="p-3 border-r border-gray-300"
                        style={{ backgroundColor: highlightedItems[`${alert.id}-paid`]?.type === 'cell' ? highlightedItems[`${alert.id}-paid`].color : undefined }}
                        onClick={(e) => handleColorPickerOpen(e, alert.id, 'cell', 'paid')}
                      >
                        {alert.paid === 'true' ? 'Paid' : 'Unpaid'}
                      </td>
                      <td className="p-3">
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleContextMenuAction('pay', alert.id);
                          }}
                          className="bg-[#3a614c] text-white hover:bg-[#4a7a5e] rounded-lg"
                        >
                          Mark as Paid
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-between mt-4">
              <Button
                onClick={() => setHighlightedItems({})}
                className="bg-red-500 text-white hover:bg-red-600 rounded-lg"
              >
                Clear Highlights
              </Button>
              <Button
                onClick={() => setShowAlertPopup(false)}
                className="bg-black text-white hover:bg-[#b0b0b0] rounded-lg"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Color Picker Popup */}
      {showColorPicker && (
        <div
          className="fixed bg-white shadow-lg rounded-lg p-4 z-50 flex flex-col gap-2"
          style={{ top: showColorPicker.y, left: showColorPicker.x }}
        >
          <input
            type="color"
            value={highlightColor}
            onChange={(e) => setHighlightColor(e.target.value)}
            className="w-8 h-8 border-2 border-[#3a614c] rounded"
          />
          <Button
            onClick={() => handleHighlight(showColorPicker.id, showColorPicker.type, showColorPicker.column, highlightColor)}
            className="bg-[#3a614c] text-white hover:bg-[#4a7a5e] rounded-lg"
          >
            Apply Highlight
          </Button>
          <Button
            onClick={() => setShowColorPicker(null)}
            className="bg-gray-500 text-white hover:bg-gray-600 rounded-lg"
          >
            Cancel
          </Button>
        </div>
      )}

      {contextMenu && (
        <div
          className="fixed bg-white shadow-lg rounded-lg p-2 z-50"
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          <button
            className="block w-full text-left p-2 hover:bg-gray-100 rounded"
            onClick={() => handleContextMenuAction('add', contextMenu.id!)}
          >
            Add
          </button>
          <button
            className="block w-full text-left p-2 hover:bg-gray-100 rounded"
            onClick={() => handleContextMenuAction('addChild', contextMenu.id!)}
          >
            Add Child
          </button>
          <button
            className="block w-full text-left p-2 hover:bg-gray-100 rounded"
            onClick={() => handleContextMenuAction('edit', contextMenu.id!)}
          >
            Edit
          </button>
          <button
            className="block w-full text-left p-2 hover:bg-gray-100 text-red-500 rounded"
            onClick={() => handleContextMenuAction('delete', contextMenu.id!)}
          >
            Delete
          </button>
          <button
            className="block w-full text-left p-2 hover:bg-gray-100 text-green-500 rounded"
            onClick={() => handleContextMenuAction('pay', contextMenu.id!)}
          >
            Mark as Paid
          </button>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md"
          >
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Due Date Input Type
              </label>
              <select
                value={dueDateInputType}
                onChange={(e) => setDueDateInputType(e.target.value as 'datetime-local' | 'text')}
                className="w-full px-3 py-2 border-2 border-[#3a614c] rounded-lg focus:ring-2 focus:ring-[#4a7a5e] focus:border-[#4a7a5e] outline-none"
              >
                <option value="datetime-local">Date Picker</option>
                <option value="text">Text Input (DD-MMM-YYYY HH:mm)</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Controller
                name="id"
                control={control}
                render={({ field }) => (
                  <ABLCustomInput
                    {...field}
                    type="text"
                    placeholder="ID"
                    label="ID"
                    disabled
                    id="id"
                  />
                )}
              />
              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <ABLCustomInput
                    {...field}
                    label="Description"
                    type="text"
                    placeholder="Description"
                    register={register}
                    error={errors.description?.message}
                    id="description"
                  />
                )}
              />
              <Controller
                name="dueDate"
                control={control}
                render={({ field }) => (
                  <ABLCustomInput
                    {...field}
                    label="Due Date and Time"
                    type={dueDateInputType}
                    placeholder={dueDateInputType === 'text' ? 'DD-MMM-YYYY HH:mm' : ''}
                    register={register}
                    error={errors.dueDate?.message}
                    id="dueDate"
                  />
                )}
              />
              <Controller
                name="fixedAmount"
                control={control}
                render={({ field }) => (
                  <ABLCustomInput
                    {...field}
                    value={field.value || ''}
                    label="Fixed Amount"
                    type="text"
                    placeholder="Fixed Amount"
                    register={register}
                    error={errors.fixedAmount?.message}
                    id="fixedAmount"
                  />
                )}
              />
            </div>
            <div className="w-full h-[8vh] flex justify-end gap-2 mt-6 bg-transparent border-t-2 border-[#e7e7e7]">
              <Button
                type="submit"
                className="w-[160px] gap-2 inline-flex items-center bg-[#3a614c] hover:bg-[#4a7a5e] text-white px-6 py-2 text-sm font-medium transition-all duration-200 font-mono text-base rounded-lg shadow-md hover:translate-y-[-2px] focus:outline-none active:bg-[#2e4c3d] active:translate-y-[2px]"
                disabled={loading}
              >
                {loading ? 'Submitting...' : (editingId ? 'Update' : 'Create')} Account
              </Button>
              <Button
                type="button"
                className="w-[160px] gap-2 inline-flex items-center bg-black hover:bg-[#b0b0b0] text-white px-6 py-2 text-sm font-medium transition-all duration-200 font-mono text-base rounded-lg shadow-md hover:translate-y-[-2px] focus:outline-none active:bg-[#2e2e2e] active:translate-y-[2px]"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      <div className="p-4 border-2 border-[#3a614c] shadow-lg rounded-lg bg-white dark:bg-[#1a2b21]">
        <div className="w-full bg-[#3a614c] h-[7vh] rounded-lg dark:bg-[#2e4c3d] mb-4 pt-2">
          <h1 className="text-[24px] font-mono ml-10 pt-2 text-white flex gap-2">
            <FaRegListAlt size={30} />
            <span className="">LIST OF ACCOUNT-Liabilities</span>
          </h1>
        </div>

        <div className="w-full flex justify-end mb-4">
          <div className="flex items-center border-2 border-[#3a614c] rounded-lg focus-within:ring-2 focus-within:ring-[#4a7a5e] shadow-md">
            <VscGoToSearch className="ml-3 text-gray-500" size={20} />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="p-2 outline-none bg-transparent text-gray-800"
            />
            <button className="bg-[#3a614c] text-white px-4 py-2 rounded-r-lg hover:bg-[#4a7a5e] transition-all duration-200">
              Search
            </button>
          </div>
        </div>

        <div>{renderAccounts(paginatedAccounts)}</div>
        <div className="flex justify-between py-2 mt-4 px-4 rounded-lg items-center">
          <div className="flex items-center">
            <span className="text-sm text-gray-700">
              Page {pageIndex + 1} of {totalPages}
            </span>
          </div>
          <div className="flex items-center space-x-3">
            <span className="text-sm text-gray-700">Rows per page:</span>
            <select
              value={pageSize}
              onChange={(e) => handlePageSizeChange(Number(e.target.value))}
              className="border-2 border-[#3a614c] rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4a7a5e] dark:text-[#1a2b21]"
            >
              {[50, 100, 1000, 2000, 5000, 10000].map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AblLiabilitiesForm;