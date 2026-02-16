'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  useForm,
  useFieldArray,
  Controller,
  UseFormSetValue,
  Path,
} from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { toast } from 'react-toastify';
import { useRouter } from 'next/navigation';
import { FiPlus, FiX, FiTrash2, FiSearch } from 'react-icons/fi';
import { FaBalanceScale } from 'react-icons/fa';

// API imports
import {
  createAccountOpeningBalance,
  updateAccountOpeningBalance,
  getSingleAccountOpeningBalance,
} from '@/apis/accountopeningbalance';
import { getAllEquality } from '@/apis/equality';
import { getAllAblLiabilities } from '@/apis/ablliabilities';
import { getAllAblAssests } from '@/apis/ablAssests';
import { getAllAblExpense } from '@/apis/ablExpense';
import { getAllAblRevenue } from '@/apis/ablRevenue';

import ABLCustomInput from '@/components/ui/ABLCustomInput';

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

const rowSchema = z
  .object({
    accountId: z.string().min(1, 'Account is required'),
    debit: z.number().min(0).default(0),
    credit: z.number().min(0).default(0),
    narration: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    const d = data.debit ?? 0;
    const c = data.credit ?? 0;

    if (d === 0 && c === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Either Debit or Credit must be > 0',
        path: ['debit'],
      });
    }
    if (d > 0 && c > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Only one of Debit or Credit can be > 0',
        path: ['debit'],
      });
    }
  });

const openingBalanceSchema = z.object({
  id: z.string().optional(),
  OpeningNo: z.string().optional(),
  OpeningDate: z.string().min(1, 'Opening date is required'),
  entries: z.array(rowSchema).min(1, 'At least one entry is required'),
});

type OpeningBalanceFormData = z.infer<typeof openingBalanceSchema>;
interface HierarchicalDropdownProps {
  accounts: Account[];
  setValue: UseFormSetValue<OpeningBalanceFormData>;
  index?: number;
  initialAccountId?: string;
}

const HierarchicalDropdown: React.FC<HierarchicalDropdownProps> = ({
  accounts,
  setValue,
  index,
  initialAccountId,
}) => {
  const [selectionPath, setSelectionPath] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearchList, setShowSearchList] = useState(false);

  const buildPathToAccount = (
    targetId: string,
    nodes: Account[],
    currentPath: string[] = []
  ): string[] | null => {
    for (const node of nodes) {
      const newPath = [...currentPath, node.id];
      if (node.id === targetId) return newPath;
      if (node.children?.length) {
        const found = buildPathToAccount(targetId, node.children, newPath);
        if (found) return found;
      }
    }
    return null;
  };

  useEffect(() => {
    if (initialAccountId && accounts.length && !selectionPath.length) {
      const path = buildPathToAccount(initialAccountId, accounts);
      if (path) setSelectionPath(path);
    }
  }, [initialAccountId, accounts, selectionPath.length]);

  type FlatLeaf = {
    id: string;
    label: string;
    pathIds: string[];
    pathLabels: string[];
  };

  const flatLeaves = useMemo(() => {
    const leaves: FlatLeaf[] = [];
    const walk = (
      node: Account,
      pathIds: string[] = [],
      pathLabels: string[] = []
    ) => {
      const newPathIds = [...pathIds, node.id];
      const newPathLabels = [...pathLabels, node.description];
      if (!node.children?.length) {
        leaves.push({
          id: node.id,
          label: newPathLabels.join(' → '),
          pathIds: newPathIds,
          pathLabels: newPathLabels,
        });
      } else {
        node.children.forEach((child) =>
          walk(child, newPathIds, newPathLabels)
        );
      }
    };
    accounts.forEach((root) => walk(root));
    return leaves;
  }, [accounts]);

  const filteredLeaves = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return [];
    return flatLeaves.filter((leaf) => leaf.label.toLowerCase().includes(q)).slice(0, 10);
  }, [searchTerm, flatLeaves]);

  const handlePickFromSearch = (leaf: FlatLeaf) => {
    setSelectionPath(leaf.pathIds);
    setValue(
      `entries.${index}.accountId` as Path<OpeningBalanceFormData>,
      leaf.id,
      { shouldValidate: true }
    );
    setSearchTerm('');
    setShowSearchList(false);
  };

  const clearSelection = () => {
    setSelectionPath([]);
    setValue(
      `entries.${index}.accountId` as Path<OpeningBalanceFormData>,
      '',
      { shouldValidate: true }
    );
  };

  const handleSelect = (level: number, id: string) => {
    const newPath = selectionPath.slice(0, level);
    newPath.push(id);
    setSelectionPath(newPath);

    let currentAccounts = accounts;
    let selected: Account | null = null;
    for (const selId of newPath) {
      selected = currentAccounts.find((acc) => acc.id === selId) ?? null;
      if (selected) currentAccounts = selected.children;
      else return;
    }

    const targetPath = `entries.${index}.accountId` as Path<OpeningBalanceFormData>;
    if (selected?.children.length === 0) {
      setValue(targetPath, id, { shouldValidate: true });
    } else {
      setValue(targetPath, '', { shouldValidate: true });
    }
  };

  const getOptionsAtLevel = (level: number): Account[] => {
    if (level === 0) return accounts;
    let current = accounts;
    for (let i = 0; i < level; i++) {
      const selId = selectionPath[i];
      const found = current.find((acc) => acc.id === selId);
      if (!found) return [];
      current = found.children;
    }
    return current;
  };

  const levels = selectionPath.length + 1;
  let showLevels = levels;
  if (selectionPath.length > 0) {
    const next = getOptionsAtLevel(selectionPath.length);
    if (next.length === 0) showLevels = selectionPath.length;
  }

  const selectionLabels = selectionPath.map((id, idx) => {
    const opts = getOptionsAtLevel(idx);
    return opts.find((a) => a.id === id)?.description ?? id;
  });

  return (
    <div className="flex flex-col gap-2">
      <div className="relative flex items-center gap-2">
        <div className="relative flex-1">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setShowSearchList(true);
            }}
            onFocus={() => setShowSearchList(true)}
            placeholder="Search account..."
            className="w-full pl-10 pr-4 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          {showSearchList && searchTerm && filteredLeaves.length > 0 && (
            <div className="absolute z-20 w-full mt-1 max-h-64 overflow-auto bg-white dark:bg-gray-800 border dark:border-gray-600 rounded-md shadow-xl">
              {filteredLeaves.map((leaf) => (
                <button
                  key={leaf.id}
                  type="button"
                  onClick={() => handlePickFromSearch(leaf)}
                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-emerald-50 dark:hover:bg-gray-700"
                >
                  {leaf.label}
                </button>
              ))}
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={clearSelection}
          className="px-3 py-2 text-sm border rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 dark:border-gray-600"
        >
          Reset
        </button>
      </div>

      {selectionLabels.length > 0 && (
        <div className="flex flex-wrap gap-1.5 text-xs text-gray-600 dark:text-gray-300">
          <span className="font-medium">Path:</span>
          {selectionLabels.map((label, i) => (
            <React.Fragment key={i}>
              <span className="px-2 py-0.5 bg-emerald-100/60 dark:bg-emerald-900/40 rounded">
                {label}
              </span>
              {i < selectionLabels.length - 1 && <span className="text-gray-400">→</span>}
            </React.Fragment>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-3 overflow-x-auto pb-1">
        {Array.from({ length: showLevels }).map((_, level) => {
          const options = getOptionsAtLevel(level);
          const value = selectionPath[level] ?? '';
          return (
            <select
              key={level}
              value={value}
              onChange={(e) => handleSelect(level, e.target.value)}
              className="min-w-[220px] px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">Select level {level + 1}...</option>
              {options.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.description}
                </option>
              ))}
            </select>
          );
        })}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────

interface AccountOpeningBalanceProps {
  isEdit?: boolean;
}

const AccountOpeningBalance: React.FC<AccountOpeningBalanceProps> = ({ isEdit = false }) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [topLevelAccounts, setTopLevelAccounts] = useState<Account[]>([]);

  const form = useForm<OpeningBalanceFormData>({
    resolver: zodResolver(openingBalanceSchema),
    defaultValues: {
      OpeningDate: new Date().toISOString().split('T')[0],
      entries: [
        {
          accountId: '',
          debit: 0,
          credit: 0,
          narration: '',
        },
      ],
    },
  });

  const { control, register, handleSubmit, setValue, watch, formState: { errors } } = form;
  const { fields, append, remove } = useFieldArray({ control, name: 'entries' });

  const entries = watch('entries') ?? [];

  const totals = useMemo(() => {
    const debit = entries.reduce((sum, r) => sum + (r?.debit ?? 0), 0);
    const credit = entries.reduce((sum, r) => sum + (r?.credit ?? 0), 0);
    return { debit, credit, difference: debit - credit };
  }, [entries]);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [assets, revenues, liabilities, expenses, equities] = await Promise.all([
          getAllAblAssests(1, 10000),
          getAllAblRevenue(1, 10000),
          getAllAblLiabilities(1, 10000),
          getAllAblExpense(1, 10000),
          getAllEquality(1, 10000),
        ].map((p) => p.catch(() => ({ data: [] }))));

        const buildHierarchy = (list: any[]) => {
          const map: Record<string, Account> = {};
          list.forEach((i) => (map[i.id] = { ...i, children: [] }));
          const roots: Account[] = [];
          list.forEach((i) => {
            if (!i.parentAccountId) roots.push(map[i.id]);
            else if (map[i.parentAccountId]) map[i.parentAccountId].children.push(map[i.id]);
          });
          return roots;
        };

        setTopLevelAccounts([
          { id: 'assets', description: 'Assets', children: buildHierarchy(assets.data ?? []), listid: '', dueDate: '', fixedAmount: '', paid: '', parentAccountId: null },
          { id: 'revenues', description: 'Revenues', children: buildHierarchy(revenues.data ?? []), listid: '', dueDate: '', fixedAmount: '', paid: '', parentAccountId: null },
          { id: 'liabilities', description: 'Liabilities', children: buildHierarchy(liabilities.data ?? []), listid: '', dueDate: '', fixedAmount: '', paid: '', parentAccountId: null },
          { id: 'expenses', description: 'Expenses', children: buildHierarchy(expenses.data ?? []), listid: '', dueDate: '', fixedAmount: '', paid: '', parentAccountId: null },
          { id: 'equities', description: 'Equities', children: buildHierarchy(equities.data ?? []), listid: '', dueDate: '', fixedAmount: '', paid: '', parentAccountId: null },
        ]);

        if (isEdit) {
          const id = window.location.pathname.split('/').pop();
          if (id) {
            const { data } = await getSingleAccountOpeningBalance(id);
            setValue('OpeningNo', String(data.accountOpeningNo ?? ''));
            setValue('OpeningDate', data.accountOpeningDate ?? '');

            const loadedEntries = (data.accountOpeningBalanceEntrys ?? []).map((e: any) => ({
              accountId: e.account ?? '',
              debit: Number(e.debit ?? 0),
              credit: Number(e.credit ?? 0),
              narration: e.narration ?? '',
            }));

            if (loadedEntries.length) {
              setValue('entries', loadedEntries);
            }
          }
        }
      } catch (err) {
        toast.error('Failed to load data');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [isEdit, setValue]);

 const onSubmit = async (data: OpeningBalanceFormData) => {
  setIsSubmitting(true);
  try {
    const payload = {
      accountOpeningNo: data.OpeningNo ? parseInt(data.OpeningNo, 10) : undefined,
      accountOpeningDate: data.OpeningDate,
      accountOpeningBalanceEntrys: data.entries.map((e) => ({
        account: e.accountId,
        debit: e.debit,
        credit: e.credit,
        narration: e.narration || null,
      })),
    };

    if (isEdit) {
      const id = window.location.pathname.split('/').pop()!;
      await updateAccountOpeningBalance({ id, ...payload });
      toast.success('Opening balance updated successfully');
    } else {
      await createAccountOpeningBalance(payload);
      toast.success('Opening balance created successfully');
    }

    router.push('/AccountOpeningBalance');
  } catch (err: any) {
    toast.error(err?.response?.data?.message || 'Failed to save opening balance');
    console.error(err);
  } finally {
    setIsSubmitting(false);
  }
};

  return (
    <div className="max-w-7xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="bg-gradient-to-r from-[#3a614c] to-[#6e997f] hover:from-[#3a614c]/90 hover:to-[#6e997f]/90 text-white px-6 py-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 p-3 rounded-lg">
              <FaBalanceScale className="text-2xl" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold">
                {isEdit ? 'Edit Account Opening Balance' : 'Account Opening Balance'}
              </h1>
              <p className="text-white/80 text-sm mt-1">
                {isEdit ? 'Modify existing opening balances' : 'Enter initial account balances'}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => router.push('/openingbalance')}
            className="border-white/30 hover:bg-white/10 text-white"
          >
            <FiX className="mr-2" /> Cancel
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-gray-500 dark:text-gray-400">Loading accounts...</div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-8">
          {/* Header Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 bg-gray-50 dark:bg-gray-900 p-6 rounded-lg border">
            <ABLCustomInput
              label="Account Opening Balance #"
              type="text"
              {...register('OpeningNo')}
              disabled
              placeholder="Auto-generated"
            />
            <ABLCustomInput
              label="Date"
              type="date"
              {...register('OpeningDate')}
              error={errors.OpeningDate?.message}
            />
          </div>

          {/* Entries Table - simplified */}
          <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
            <table className="w-full min-w-max divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-100 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-4 text-left font-semibold text-gray-700 dark:text-gray-200">Account</th>
                  <th className="px-6 py-4 text-right font-semibold text-gray-700 dark:text-gray-200">Debit</th>
                  <th className="px-6 py-4 text-right font-semibold text-gray-700 dark:text-gray-200">Credit</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-700 dark:text-gray-200">Narration</th>
                  <th className="px-4 py-4 text-center font-semibold text-gray-700 dark:text-gray-200 w-20">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {fields.map((field, index) => (
                  <tr key={field.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40">
                    <td className="px-4 py-4 align-top border-r dark:border-gray-700">
                      <Controller
                        name={`entries.${index}.accountId`}
                        control={control}
                        render={({ field: ctrlField }) => (
                          <HierarchicalDropdown
                            accounts={topLevelAccounts}
                            setValue={setValue}
                            index={index}
                            initialAccountId={ctrlField.value}
                          />
                        )}
                      />
                      {errors.entries?.[index]?.accountId && (
                        <p className="text-red-500 text-xs mt-1.5">
                          {errors.entries[index].accountId?.message}
                        </p>
                      )}
                    </td>

                    <td className="px-4 py-4 border-r dark:border-gray-700">
                      <input
                        {...register(`entries.${index}.debit`, { valueAsNumber: true })}
                        className="w-full text-right px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                      />
                      {errors.entries?.[index]?.debit && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors.entries[index].debit?.message}
                        </p>
                      )}
                    </td>

                    <td className="px-4 py-4 border-r dark:border-gray-700">
                      <input
                        {...register(`entries.${index}.credit`, { valueAsNumber: true })}
                        className="w-full text-right px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                      />
                      {errors.entries?.[index]?.credit && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors.entries[index].credit?.message}
                        </p>
                      )}
                    </td>

                    <td className="px-4 py-4 border-r dark:border-gray-700">
                      <input
                        {...register(`entries.${index}.narration`)}
                        className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                        placeholder="Optional narration..."
                      />
                    </td>

                    <td className="px-4 py-4 text-center">
                      {fields.length > 1 && (
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          onClick={() => remove(index)}
                        >
                          <FiTrash2 size={18} />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>

              <tfoot>
                <tr className="bg-gray-100 dark:bg-gray-900 font-semibold">
                  <td className="px-6 py-4 text-right">TOTAL</td>
                  <td className="px-6 py-4 text-right text-emerald-600 dark:text-emerald-400">
                    {totals.debit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-4 text-right text-red-600 dark:text-red-400">
                    {totals.credit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td colSpan={3} className="px-6 py-4 text-right">
                    {totals.difference !== 0 && (
                      <span className="text-amber-600 dark:text-amber-400">
                        Difference: {totals.difference.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    )}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="flex flex-col sm:flex-row justify-between gap-4 mt-8 ">
            <Button
              type="button"
              onClick={() =>
                append({
                  accountId: '',
                  debit: 0,
                  credit: 0,
                  narration: '',
                })
              }
              className="flex bg-gradient-to-r from-[#3a614c] to-[#6e997f] hover:from-[#3a614c]/90 hover:to-[#6e997f]/90 text-white"
            >
              <FiPlus /> Add Row
            </Button>

            <Button type="submit"
            className='bg-gradient-to-r from-[#3a614c] to-[#6e997f] hover:from-[#3a614c]/90 hover:to-[#6e997f]/90 text-white' disabled={isSubmitting || totals.difference !== 0}>
              {isSubmitting ? 'Saving...' : isEdit ? 'Update Balance' : 'Save Opening Balance'}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};

export default AccountOpeningBalance;