// 'use client';

// import React, { useState, useEffect, useMemo } from 'react';
// import { useForm, useFieldArray } from 'react-hook-form';
// import { zodResolver } from '@hookform/resolvers/zod';
// import { z } from 'zod';
// import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
// import { toast } from 'react-toastify';
// import { useRouter } from 'next/navigation';
// import { FiSave, FiX, FiPlus, FiTrash2, FiSearch } from 'react-icons/fi';
// import { MdInfo } from 'react-icons/md';
// import Link from 'next/link';

// // API imports
// import {
//   createOpeningBalance,
//   updateOpeningBalance,
//   OpeningBalancePayload,
// } from '@/apis/openingBalance';

// // ────────────────────────────────────────────────
// // Types & Schema (same as before)
// // ────────────────────────────────────────────────

// type Account = {
//   id: string;
//   description: string;
//   parentAccountId: string | null;
//   children: Account[];
// };

// const rowSchema = z.object({
//   accountId: z.string().min(1, 'Account is required'),
//   debit: z.number().min(0).optional().default(0),
//   credit: z.number().min(0).optional().default(0),
//   vehicleNo: z.string().optional().default(''),
//   date: z.string().min(1, 'Date is required'),
// }).superRefine((val, ctx) => {
//   const d = Number(val.debit ?? 0);
//   const c = Number(val.credit ?? 0);
//   if (d > 0 && c > 0) {
//     ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Only one of Debit or Credit', path: ['debit'] });
//   }
//   if (d === 0 && c === 0) {
//     ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Enter Debit or Credit', path: ['debit'] });
//   }
// });

// const formSchema = z.object({
//   description: z.string().optional(),
//   entries: z.array(rowSchema).min(1),
// });

// type FormValues = z.infer<typeof formSchema>;

// // ────────────────────────────────────────────────
// // Embedded Account Selector (same as previous)
// // ────────────────────────────────────────────────

// interface AccountSelectorProps {
//   accounts: Account[];
//   value: string;
//   onChange: (id: string) => void;
// }

// const AccountSelector = ({ accounts, value, onChange }: AccountSelectorProps) => {
//   const [search, setSearch] = useState('');
//   const flat = useMemo(() => {
//     const res: { id: string; label: string }[] = [];
//     const walk = (node: Account, path: string[] = []) => {
//       const label = [...path, node.description].join(' → ');
//       res.push({ id: node.id, label });
//       node.children.forEach(c => walk(c, [...path, node.description]));
//     };
//     accounts.forEach(r => walk(r));
//     return res;
//   }, [accounts]);

//   const filtered = flat.filter(f => f.label.toLowerCase().includes(search.toLowerCase())).slice(0, 12);

//   const selectedLabel = flat.find(f => f.id === value)?.label || '';

//   return (
//     <div className="relative">
//       <div className="flex border rounded focus-within:ring-2 ring-emerald-500">
//         <FiSearch className="m-2.5 text-gray-400" />
//         <input
//           value={search}
//           onChange={e => setSearch(e.target.value)}
//           placeholder={selectedLabel || 'Search account...'}
//           className="flex-1 p-2 outline-none bg-transparent"
//         />
//       </div>
//       {search && (
//         <div className="absolute w-full mt-1 bg-white border rounded shadow max-h-60 overflow-auto z-10 dark:bg-gray-800">
//           {filtered.map(item => (
//             <button
//               key={item.id}
//               className="w-full text-left px-4 py-2 hover:bg-emerald-50 dark:hover:bg-gray-700 text-sm"
//               onClick={() => { onChange(item.id); setSearch(''); }}
//             >
//               {item.label}
//             </button>
//           ))}
//         </div>
//       )}
//       {value && !search && (
//         <div className="mt-1 text-sm text-gray-600 dark:text-gray-300">
//           {selectedLabel}
//         </div>
//       )}
//     </div>
//   );
// };

// // ────────────────────────────────────────────────
// // Main Form
// // ────────────────────────────────────────────────

// interface OpeningBalanceFormProps {
//   isEdit?: boolean;
//   initialData?: OpeningBalancePayload;
// }

// export default function OpeningBalanceForm({ isEdit = false, initialData }: OpeningBalanceFormProps) {
//   const router = useRouter();
//   const [accounts, setAccounts] = useState<Account[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [submitting, setSubmitting] = useState(false);

//   const form = useForm<FormValues>({
//     resolver: zodResolver(formSchema),
//     defaultValues: {
//       description: `Opening Balance - ${new Date().toLocaleDateString()}`,
//       entries: [{
//         accountId: '',
//         debit: 0,
//         credit: 0,
//         vehicleNo: '',
//         date: new Date().toISOString().split('T')[0],
//       }],
//     },
//   });

//   const { register, control, handleSubmit, formState: { errors }, watch } = form;
//   const { fields, append, remove } = useFieldArray({ control, name: 'entries' });

//   // Mock accounts – replace with real fetch
//   useEffect(() => {
//     // In real app → Promise.all([getAllAblAssests(), ...])
//     setAccounts([
//       { id: 'cash', description: 'Cash in Hand', parentAccountId: null, children: [] },
//       { id: 'bank', description: 'Bank Accounts', parentAccountId: null, children: [] },
//       { id: 'capital', description: 'Owner Capital', parentAccountId: null, children: [] },
//       // ...
//     ]);
//     setLoading(false);
//   }, []);

//   // Load edit data
//   useEffect(() => {
//     if (isEdit && initialData) {
//       form.reset({
//         description: initialData.description || '',
//         entries: initialData.entries?.map(e => ({
//           accountId: e.accountId || '',
//           debit: Number(e.debit || 0),
//           credit: Number(e.credit || 0),
//           vehicleNo: e.vehicleNo || '',
//           date: e.date || '',
//         })) || [],
//       });
//     }
//   }, [isEdit, initialData, form]);

//   const totals = useMemo(() => {
//     let d = 0, c = 0;
//     fields.forEach((_, i) => {
//       d += Number(watch(`entries.${i}.debit`) || 0);
//       c += Number(watch(`entries.${i}.credit`) || 0);
//     });
//     return { debit: d, credit: c };
//   }, [fields, watch]);

//   const onSubmit = async (values: FormValues) => {
//     setSubmitting(true);
//     try {
//       const payload: OpeningBalancePayload = {
//         description: values.description || 'Opening Balance Entry',
//         entries: values.entries.map(e => ({
//           accountId: e.accountId,
//           debit: e.debit,
//           credit: e.credit,
//           vehicleNo: e.vehicleNo.trim() || undefined,
//           date: e.date,
//         })),
//       };

//       if (isEdit && initialData?.id) {
//         await updateOpeningBalance(initialData.id, payload);
//         toast.success('Opening balance updated');
//       } else {
//         await createOpeningBalance(payload);
//         toast.success('Opening balance created');
//       }

//       router.push('/opening-balance');
//     } catch (err: any) {
//       toast.error(err.message || 'Operation failed');
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   if (loading) return <div className="p-10 text-center">Loading accounts...</div>;

//   return (
//     <div className="max-w-6xl mx-auto p-6 bg-white dark:bg-gray-900 rounded-xl shadow">
//       <h1 className="text-2xl font-bold mb-2">
//         {isEdit ? 'Edit Opening Balance' : 'Record Opening Balance'}
//       </h1>

//       <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
//         <div>
//           <Label>Description</Label>
//           <Input {...register('description')} className="mt-1" />
//         </div>

//         <div className="border rounded overflow-hidden">
//           <div className="bg-emerald-700 text-white px-5 py-3 font-semibold">
//             Entries
//           </div>

//           <div className="overflow-x-auto">
//             <table className="w-full text-sm">
//               <thead className="bg-gray-100 dark:bg-gray-800">
//                 <tr>
//                   <th className="px-4 py-3 text-left">Account</th>
//                   <th className="px-4 py-3 text-right">Debit</th>
//                   <th className="px-4 py-3 text-right">Credit</th>
//                   <th className="px-4 py-3 text-left">Vehicle No</th>
//                   <th className="px-4 py-3 text-left">Date</th>
//                   <th className="w-16"></th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {fields.map((f, idx) => (
//                   <tr key={f.id} className="border-t hover:bg-gray-50">
//                     <td className="p-3">
//                       <Controller
//                         name={`entries.${idx}.accountId`}
//                         control={control}
//                         render={({ field }) => (
//                           <AccountSelector
//                             accounts={accounts}
//                             value={field.value}
//                             onChange={field.onChange}
//                           />
//                         )}
//                       />
//                       {errors.entries?.[idx]?.accountId && (
//                         <p className="text-red-500 text-xs mt-1">
//                           {errors.entries[idx]?.accountId?.message}
//                         </p>
//                       )}
//                     </td>
//                     <td className="p-3">
//                       <Input
//                         type="number"
//                         step="0.01"
//                         {...register(`entries.${idx}.debit`, { valueAsNumber: true })}
//                         className="text-right"
//                       />
//                     </td>
//                     <td className="p-3">
//                       <Input
//                         type="number"
//                         step="0.01"
//                         {...register(`entries.${idx}.credit`, { valueAsNumber: true })}
//                         className="text-right"
//                       />
//                     </td>
//                     <td className="p-3">
//                       <Input {...register(`entries.${idx}.vehicleNo`)} />
//                     </td>
//                     <td className="p-3">
//                       <Input type="date" {...register(`entries.${idx}.date`)} />
//                     </td>
//                     <td className="p-3 text-center">
//                       {fields.length > 1 && (
//                         <button type="button" onClick={() => remove(idx)} className="text-red-600">
//                           <FiTrash2 />
//                         </button>
//                       )}
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//               <tfoot className="bg-gray-100 font-medium">
//                 <tr>
//                   <td className="px-4 py-3 text-right">Total</td>
//                   <td className="px-4 py-3 text-right">{totals.debit.toFixed(2)}</td>
//                   <td className="px-4 py-3 text-right">{totals.credit.toFixed(2)}</td>
//                   <td colSpan={3}></td>
//                 </tr>
//               </tfoot>
//             </table>
//           </div>

//           <div className="p-4 flex justify-between border-t">
//             <Button type="button" variant="outline" onClick={() => append({
//               accountId: '', debit: 0, credit: 0, vehicleNo: '', date: new Date().toISOString().split('T')[0]
//             })}>
//               + Add Row
//             </Button>
//             <div>{fields.length} rows</div>
//           </div>
//         </div>

//         <div className="flex justify-end gap-4">
//           <Link href="/opening-balance">
//             <Button type="button" variant="outline">Cancel</Button>
//           </Link>
//           <Button type="submit" disabled={submitting} className="bg-emerald-600">
//             {submitting ? 'Saving...' : isEdit ? 'Update' : 'Save'}
//           </Button>
//         </div>
//       </form>
//     </div>
//   );
// }