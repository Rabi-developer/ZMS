'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'react-toastify';
import CustomInput from '@/components/ui/CustomInput';
import CustomInputDropdown from '@/components/ui/CustomeInputDropdown';
import { MdLocalShipping } from 'react-icons/md';
import { BiSolidErrorAlt } from 'react-icons/bi';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { getAllSellers } from '@/apis/seller';
import { getAllBuyer } from '@/apis/buyer';
import { getAllContract } from '@/apis/contract';
import { getAllTransporterCompanys } from '@/apis/transportercompany';
import { createDispatchNote, updateDispatchNote, getDispatchNoteHistory } from '@/apis/dispatchnote';
import { Contract } from '../contract/columns';

// Schema for form validation
const DispatchNoteSchema = z.object({
  listid: z.string().optional(),
  Date: z.string().min(1, 'Date is required'),
  Bilty: z.string().min(1, 'Bilty number is required'),
  Seller: z.string().min(1, 'Seller is required'),
  Buyer: z.string().min(1, 'Buyer is required'),
  VehicleType: z.string().optional(),
  Remarks: z.string().optional(),
  DriverName: z.string().min(1, 'Driver name is required'),
  DriverNumber: z.string().min(1, 'Driver number is required'),
  Transporter: z.string().optional(),
  Destination: z.string().min(1, 'Destination is required'),
});

type FormData = z.infer<typeof DispatchNoteSchema>;

interface ContractRow {
  rowId: string;
  contractId: string;
  contractNumber: string;
  seller: string;
  buyer: string;
  refer: string;
  date: string;
  quantity: string;
  rate: string;
  base: string;
  dispatchQty: string;
  addQuantity: string;
  balanceQuantity: string;
  isSelected: boolean;
  fabricDetails: Partial<Contract>;
  contractType: 'Conversion' | 'Diet' | 'MultiWidth';
  isFirstRow: boolean;
  width?: string;
  color?: string;
  rowIndex: number;
}

interface ExtendedContract extends Contract {
  contractRows: ContractRow[];
  rowCount: number;
}

interface DispatchNoteData {
  contractNumber: string | undefined;
  id?: string;
  listid?: string;
  date?: string;
  bilty?: string;
  seller?: string;
  buyer?: string;
  vehicleType?: string;
  vehicle?: string;
  remarks?: string;
  driverName?: string;
  driverNumber?: string;
  transporter?: string;
  destination?: string;
  createdBy?: string;
  creationDate?: string;
  updatedBy?: string;
  updationDate?: string;
  relatedContracts?: {
    id: string;
    contractId: string;
    contractNumber: string;
    seller: string;
    buyer: string;
    date: string;
    quantity: string;
    rate: string;
    totalAmount: string;
    base: string;
    dispatchQty: string;
    contractType: 'Conversion' | 'Diet' | 'MultiWidth';
  }[];
}

interface DispatchNoteProps {
  isEdit?: boolean;
  initialData?: DispatchNoteData;
}

const DispatchNote = ({ isEdit = false, initialData }: DispatchNoteProps) => {
  const router = useRouter();
  const [sellers, setSellers] = useState<{ id: string; name: string }[]>([]);
  const [buyers, setBuyers] = useState<{ id: string; name: string }[]>([]);
  const [contracts, setContracts] = useState<ExtendedContract[]>([]);
  const [filteredContractRows, setFilteredContractRows] = useState<ContractRow[]>([]);
  const [transporters, setTransporters] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingSellers, setFetchingSellers] = useState(false);
  const [fetchingBuyers, setFetchingBuyers] = useState(false);
  const [fetchingTransporters, setFetchingTransporters] = useState(false);
  const [idFocused, setIdFocused] = useState(false);  const [selectedContractInfo, setSelectedContractInfo] = useState<{ contractType: string; contractNumber: string } | null>(null);
  const [historyData, setHistoryData] = useState<any>(null);
  const [fetchingHistory, setFetchingHistory] = useState(false);
  const [lastFetchedPair, setLastFetchedPair] = useState<string>('');

  // Static options for Vehicle Type
  const vehicleTypes = [
    { id: '1', name: 'Truck' },
    { id: '2', name: 'Van' },
    { id: '3', name: 'Car' },
    { id: '4', name: 'Motor Cycle' },
    { id: '5', name: 'Pickup' },
    { id: '6', name: 'Trolly' },
    { id: '7', name: 'Shehzore' },
    { id: '8', name: 'Auto / Rickshaw' },
    { id: '9', name: 'Bike' },
    { id: '10', name: 'Bus' },
  ];

  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<FormData>({
    resolver: zodResolver(DispatchNoteSchema),
    defaultValues: {
      listid: '',
      Date: new Date().toISOString().split('T')[0],
      Bilty: '',
      Seller: '',
      Buyer: '',
      VehicleType: '',
      Remarks: '',
      DriverName: '',
      DriverNumber: '',
      Transporter: '',
      Destination: '',
    },
  });

  const selectedSeller = watch('Seller');
  const selectedBuyer = watch('Buyer');

  // Fetch Sellers
  const fetchSellers = async () => {
    try {
      setFetchingSellers(true);
      const response = await getAllSellers();
      if (response && response.data) {
        const sellerData = response.data.map((seller: any) => ({
          id: String(seller.id),
          name: seller.sellerName || '',
        }));
        setSellers(sellerData);
      } else {
        setSellers([]);
        toast('No sellers found', { type: 'warning' });
      }
    } catch (error) {
      setSellers([]);
      toast('Failed to fetch sellers', { type: 'error' });
    } finally {
      setFetchingSellers(false);
    }
  };

  // Fetch Buyers
  const fetchBuyers = async () => {
    try {
      setFetchingBuyers(true);
      const response = await getAllBuyer();
      if (response && response.data) {
        const buyerData = response.data.map((buyer: any) => ({
          id: String(buyer.id),
          name: buyer.buyerName || '',
        }));
        setBuyers(buyerData);
      } else {
        setBuyers([]);
        toast('No buyers found', { type: 'warning' });
      }
    } catch (error) {
      setBuyers([]);
      toast('Failed to fetch buyers', { type: 'error' });
    } finally {
      setFetchingBuyers(false);
    }
  };

  // Fetch Transporters
  const fetchTransporters = async () => {
    try {
      setFetchingTransporters(true);
      const response = await getAllTransporterCompanys();
      if (response && response.data) {
        const transporterData = response.data.map((transporter: any) => ({
          id: String(transporter.id),
          name: transporter.descriptions || '',
        }));
        setTransporters(transporterData);
      } else {
        setTransporters([]);
        toast('No transporters found', { type: 'warning' });
      }
    } catch (error) {
      setTransporters([]);
      toast('Failed to fetch transporters', { type: 'error' });
    } finally {
      setFetchingTransporters(false);
    }
  };  // Fetch Dispatch Note History
  const fetchDispatchHistory = async (sellerName: string, buyerName: string) => {
    try {
      if (!sellerName || !buyerName || fetchingHistory) return;
      
      const fetchPair = `${sellerName}-${buyerName}`;
      if (fetchPair === lastFetchedPair) return; // Avoid duplicate calls
      
      setFetchingHistory(true);
      setLastFetchedPair(fetchPair);
      
      const response = await getDispatchNoteHistory(sellerName, buyerName);
      if (response && response.data) {
        setHistoryData(response.data);
      } else {
        setHistoryData(null);
      }
    } catch (error) {
      console.error('Error fetching dispatch history:', error);
      setHistoryData(null);
    } finally {
      setFetchingHistory(false);
    }
  };
  const fetchContracts = async () => {
    try {
      setLoading(true);
      const response = await getAllContract(1, 100);
      if (response && response.data) {
        let updatedContracts: ExtendedContract[] = [];

        if (isEdit && initialData?.relatedContracts) {
          const relatedContractMap = new Map(
            initialData.relatedContracts.map((rc) => [`${rc.contractId}:${rc.id}`, rc])
          );

          updatedContracts = response.data
            .map((contract: Contract) => {
              const contractRows: ContractRow[] = [];
              let rowIndex = 1;

              // Conversion Contract Rows
              contract.conversionContractRow?.forEach((row, index) => {
                const rowId = `${contract.id}:${row.id}`;
                const relatedContract = relatedContractMap.get(rowId);
                const quantity = row.quantity || '0';
                const rate = row.fabRate || row.rate || contract.rate || '0';
                const dispatchQty = relatedContract?.dispatchQty || '0';
                const addQuantity = dispatchQty;
                const balanceQuantity = (
                  parseFloat(quantity) - parseFloat(dispatchQty)
                ).toString();

                contractRows.push({
                  rowId,
                  contractId: contract.id,
                  contractNumber: contract.contractNumber || '',
                  seller: contract.seller || '',
                  buyer: contract.buyer || '',
                  refer: contract.refer || '',
                  date: contract.date || '',
                  quantity,
                  rate,
                  base: relatedContract?.base || '',
                  dispatchQty,
                  addQuantity,
                  balanceQuantity,
                  isSelected: relatedContract?.contractNumber === initialData.contractNumber,
                  fabricDetails: contract,
                  contractType: 'Conversion',
                  isFirstRow: index === 0,
                  width: row.width || contract.width || '0',
                  rowIndex: rowIndex++,
                });
              });

              // Diet Contract Rows
              contract.dietContractRow?.forEach((row, index) => {
                const rowId = `${contract.id}:${row.id}`;
                const relatedContract = relatedContractMap.get(rowId);
                const quantity = row.quantity || '0';
                const rate = row.rate || contract.rate || '0';
                const dispatchQty = relatedContract?.dispatchQty || '0';
                const addQuantity = dispatchQty;
                const balanceQuantity = (
                  parseFloat(quantity) - parseFloat(dispatchQty)
                ).toString();

                contractRows.push({
                  rowId,
                  contractId: contract.id,
                  contractNumber: contract.contractNumber || '',
                  seller: contract.seller || '',
                  buyer: contract.buyer || '',
                  refer: contract.refer || '',
                  date: contract.date || '',
                  quantity,
                  rate,
                  base: relatedContract?.base || '',
                  dispatchQty,
                  addQuantity,
                  balanceQuantity,
                  isSelected: relatedContract?.contractNumber === initialData.contractNumber,
                  fabricDetails: contract,
                  contractType: 'Diet',
                  isFirstRow: index === 0 && contract.conversionContractRow.length === 0,
                  color: row.color || 'N/A',
                  rowIndex: rowIndex++,
                });
              });

              // MultiWidth Contract Rows
              contract.multiWidthContractRow?.forEach((row, index) => {
                const rowId = `${contract.id}:${row.id}`;
                const relatedContract = relatedContractMap.get(rowId);
                const quantity = row.quantity || '0';
                const rate = row.rate || contract.rate || '0';
                const dispatchQty = relatedContract?.dispatchQty || '0';
                const addQuantity = dispatchQty;
                const balanceQuantity = (
                  parseFloat(quantity) - parseFloat(dispatchQty)
                ).toString();

                contractRows.push({
                  rowId,
                  contractId: contract.id,
                  contractNumber: contract.contractNumber || '',
                  seller: contract.seller || '',
                  buyer: contract.buyer || '',
                  refer: contract.refer || '',
                  date: contract.date || '',
                  quantity,
                  rate,
                  base: relatedContract?.base || '',
                  dispatchQty,
                  addQuantity,
                  balanceQuantity,
                  isSelected: relatedContract?.contractNumber === initialData.contractNumber,
                  fabricDetails: contract,
                  contractType: 'MultiWidth',
                  isFirstRow:
                    index === 0 &&
                    contract.conversionContractRow.length === 0 &&
                    contract.dietContractRow.length === 0,
                  width: row.width || contract.width || '0',
                  rowIndex: rowIndex++,
                });
              });

              if (contractRows.length === 0) return null;

              return {
                ...contract,
                contractRows,
                rowCount: contractRows.length,
              };
            })
            .filter((contract: any): contract is ExtendedContract => contract !== null);
        } else {
          updatedContracts = response.data
            .map((contract: Contract) => {
              const contractRows: ContractRow[] = [];
              let rowIndex = 1;

              // Conversion Contract Rows
              contract.conversionContractRow?.forEach((row, index) => {
                const rowId = `${contract.id}:${row.id}`;
                const quantity = row.quantity || '0';
                const rate = row.fabRate || row.rate || contract.rate || '0';

                // Check for history data to populate fields
                let historyBase = '';
                let historyDispatchQty = '0';
                let historyBalanceQty = quantity;

                if (historyData && historyData.relatedContracts) {
                  const historyContract = historyData.relatedContracts.find(
                    (hc: any) => 
                      hc.contractNumber === contract.contractNumber && 
                      hc.contractType === 'Conversion'
                  );
                  if (historyContract) {
                    historyBase = historyContract.base || '';
                    historyDispatchQty = historyContract.totalDispatchQuantity || '0';
                    historyBalanceQty = historyContract.balanceQuantity || quantity;
                  }
                }

                contractRows.push({
                  rowId,
                  contractId: contract.id,
                  contractNumber: contract.contractNumber || '',
                  seller: contract.seller || '',
                  buyer: contract.buyer || '',
                  refer: contract.refer || '',
                  date: contract.date || '',
                  quantity,
                  rate,
                  base: historyBase,
                  dispatchQty: '0', // Keep this as 0 for new dispatch
                  addQuantity: '0',
                  balanceQuantity: historyBalanceQty,
                  isSelected: false,
                  fabricDetails: contract,
                  contractType: 'Conversion',
                  isFirstRow: index === 0,
                  width: row.width || contract.width || '0',
                  rowIndex: rowIndex++,
                });
              });

              // Diet Contract Rows
              contract.dietContractRow?.forEach((row, index) => {
                const rowId = `${contract.id}:${row.id}`;
                const quantity = row.quantity || '0';
                const rate = row.rate || contract.rate || '0';

                // Check for history data to populate fields
                let historyBase = '';
                let historyDispatchQty = '0';
                let historyBalanceQty = quantity;

                if (historyData && historyData.relatedContracts) {
                  const historyContract = historyData.relatedContracts.find(
                    (hc: any) => 
                      hc.contractNumber === contract.contractNumber && 
                      hc.contractType === 'Diet'
                  );
                  if (historyContract) {
                    historyBase = historyContract.base || '';
                    historyDispatchQty = historyContract.totalDispatchQuantity || '0';
                    historyBalanceQty = historyContract.balanceQuantity || quantity;
                  }
                }

                contractRows.push({
                  rowId,
                  contractId: contract.id,
                  contractNumber: contract.contractNumber || '',
                  seller: contract.seller || '',
                  buyer: contract.buyer || '',
                  refer: contract.refer || '',
                  date: contract.date || '',
                  quantity,
                  rate,
                  base: historyBase,
                  dispatchQty: '0', // Keep this as 0 for new dispatch
                  addQuantity: '0',
                  balanceQuantity: historyBalanceQty,
                  isSelected: false,
                  fabricDetails: contract,
                  contractType: 'Diet',
                  isFirstRow: index === 0 && contract.conversionContractRow.length === 0,
                  color: row.color || 'N/A',
                  rowIndex: rowIndex++,
                });
              });

              // MultiWidth Contract Rows
              contract.multiWidthContractRow?.forEach((row, index) => {
                const rowId = `${contract.id}:${row.id}`;
                const quantity = row.quantity || '0';
                const rate = row.rate || contract.rate || '0';

                // Check for history data to populate fields
                let historyBase = '';
                let historyDispatchQty = '0';
                let historyBalanceQty = quantity;

                if (historyData && historyData.relatedContracts) {
                  const historyContract = historyData.relatedContracts.find(
                    (hc: any) => 
                      hc.contractNumber === contract.contractNumber && 
                      hc.contractType === 'MultiWidth'
                  );
                  if (historyContract) {
                    historyBase = historyContract.base || '';
                    historyDispatchQty = historyContract.totalDispatchQuantity || '0';
                    historyBalanceQty = historyContract.balanceQuantity || quantity;
                  }
                }

                contractRows.push({
                  rowId,
                  contractId: contract.id,
                  contractNumber: contract.contractNumber || '',
                  seller: contract.seller || '',
                  buyer: contract.buyer || '',
                  refer: contract.refer || '',
                  date: contract.date || '',
                  quantity,
                  rate,
                  base: historyBase,
                  dispatchQty: '0', // Keep this as 0 for new dispatch
                  addQuantity: '0',
                  balanceQuantity: historyBalanceQty,
                  isSelected: false,
                  fabricDetails: contract,
                  contractType: 'MultiWidth',
                  isFirstRow:
                    index === 0 &&
                    contract.conversionContractRow.length === 0 &&
                    contract.dietContractRow.length === 0,
                  width: row.width || contract.width || '0',
                  rowIndex: rowIndex++,
                });
              });

              if (contractRows.length === 0) return null;

              return {
                ...contract,
                contractRows,
                rowCount: contractRows.length,
              };
            })
            .filter((contract: any): contract is ExtendedContract => contract !== null);
        }

        setContracts(updatedContracts);
      } else {
        setContracts([]);
        toast('No contracts found', { type: 'warning' });
      }
    } catch (error) {
      setContracts([]);
      toast('Error fetching contracts', { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Initialize form with initialData when editing
  useEffect(() => {
    if (isEdit && initialData) {
      if (!initialData.id) {
        toast('Invalid dispatch note data', { type: 'error' });
        router.push('/dispatchnote');
        return;
      }
      setValue('listid', initialData.listid || '');
      setValue('Date', initialData.date?.split('T')[0] || '');
      setValue('Bilty', initialData.bilty || '');
      setValue(
        'Seller',
        sellers.find((s) => s.name === initialData.seller)?.id || initialData.seller || ''
      );
      setValue(
        'Buyer',
        buyers.find((b) => b.name === initialData.buyer)?.id || initialData.buyer || ''
      );
      setValue('VehicleType', initialData.vehicleType || '');
      setValue('Remarks', initialData.remarks || '');
      setValue('DriverName', initialData.driverName || '');
      setValue('DriverNumber', initialData.driverNumber || '');
      setValue(
        'Transporter',
        transporters.find((t) => t.name === initialData.transporter)?.id || initialData.transporter || ''
      );
      setValue('Destination', initialData.destination || '');
    }
  }, [isEdit, initialData, sellers, buyers, transporters, setValue, router]);  // Fetch history when seller and buyer change (separate effect)
  useEffect(() => {
    // Reset history data when seller or buyer changes
    if (!isEdit) {
      setHistoryData(null);
      setLastFetchedPair('');
    }
    
    if (!isEdit && selectedSeller && selectedBuyer && sellers.length > 0 && buyers.length > 0) {
      const selectedSellerObj = sellers.find((s) => String(s.id) === String(selectedSeller));
      const selectedBuyerObj = buyers.find((b) => String(b.id) === String(selectedBuyer));
      
      if (selectedSellerObj && selectedBuyerObj) {
        // Add a small delay to debounce rapid changes
        const timeoutId = setTimeout(() => {
          fetchDispatchHistory(selectedSellerObj.name, selectedBuyerObj.name);
        }, 300);
        
        return () => clearTimeout(timeoutId);
      }
    }
  }, [selectedSeller, selectedBuyer, sellers, buyers, isEdit]);
  // Refetch contracts when history data changes
  useEffect(() => {
    if (historyData && !isEdit && !loading) {
      fetchContracts();
    }
  }, [historyData, isEdit]);

  // Filter contract rows by Seller and Buyer
  useEffect(() => {
    let filteredRows: ContractRow[] = [];

    if (isEdit && initialData?.relatedContracts) {
      filteredRows = contracts
        .flatMap((contract) => contract.contractRows)
        .filter((row) =>
          initialData.relatedContracts!.some(
            (rc) => rc.contractNumber === row.contractNumber && rc.id === row.rowId
          )
        );
    } else {
      const selectedSellerObj = sellers.find((s) => String(s.id) === String(selectedSeller));
      const selectedBuyerObj = buyers.find((b) => String(b.id) === String(selectedBuyer));

      filteredRows = contracts
        .flatMap((contract) => contract.contractRows)
        .filter((row) =>
          (String(row.seller) === String(selectedSeller) ||
            row.seller === selectedSellerObj?.name) &&
          (String(row.buyer) === String(selectedBuyer) ||
            row.buyer === selectedBuyerObj?.name)
        );
    }

    setFilteredContractRows(filteredRows);
  }, [isEdit, initialData, selectedSeller, selectedBuyer, contracts, sellers, buyers]);

  // Fetch data on mount
  useEffect(() => {
    fetchSellers();
    fetchBuyers();
    fetchTransporters();
    fetchContracts();
  }, []);

  // Handle contract row selection
  const handleContractSelect = (rowId: string, checked: boolean) => {
    setContracts((prev) =>
      prev.map((contract) => ({
        ...contract,
        contractRows: contract.contractRows.map((row) =>
          row.rowId === rowId ? { ...row, isSelected: checked } : { ...row, isSelected: false }
        ),
      }))
    );
  };
  // Handle Base and Dispatch Qty input changes
  const handleContractInputChange = (
    rowId: string,
    field: 'base' | 'dispatchQty',
    value: string
  ) => {
    setContracts((prev) =>
      prev.map((contract) => ({
        ...contract,
        contractRows: contract.contractRows.map((row) => {
          if (row.rowId === rowId) {
            const updatedRow = { ...row, [field]: value };
            if (field === 'dispatchQty') {
              const dispatchQty = parseFloat(value || '0');
              updatedRow.addQuantity = dispatchQty.toString();
              
              // Calculate balance quantity considering history
              let currentBalance = parseFloat(row.quantity || '0');
              if (historyData && historyData.relatedContracts) {
                const historyContract = historyData.relatedContracts.find(
                  (hc: any) => 
                    hc.contractNumber === row.contractNumber && 
                    hc.contractType === row.contractType
                );
                if (historyContract) {
                  currentBalance = parseFloat(historyContract.balanceQuantity || row.quantity);
                }
              }
              
              updatedRow.balanceQuantity = (currentBalance - dispatchQty).toString();
            }
            return updatedRow;
          }
          return row;
        }),
      }))
    );
  };

  // Handle row click to update selected contract info
  const handleRowClick = (rowId: string, isSelected: boolean, contractType: string, contractNumber: string, rowIndex: number) => {
    handleContractSelect(rowId, isSelected);
    setSelectedContractInfo(
      isSelected
        ? {
            contractType,
            contractNumber: rowIndex === 0 ? contractNumber : `${contractNumber}-${rowIndex}`,
          }
        : null
    );
  };

  // Format Fabric Details with Rate
  const getFabricDetails = (row: ContractRow) => {
    const contract = row.fabricDetails;
    const fabricDetails = [
      `${contract.warpCount || ''}${contract.warpYarnType || ''}`,
      `${contract.weftCount || ''}${contract.weftYarnType || ''}`,
      `${contract.noOfEnds || ''} * ${contract.noOfPicks || ''}`,
      contract.weaves || '',
      row.contractType === 'Diet' ? row.color || 'N/A' : row.width || 'N/A',
      contract.final || '',
      contract.selvege || '',
    ]
      .filter((item) => item.trim() !== '')
      .join(' / ');
    const rate = row.rate || 'N/A';
    return fabricDetails ? `${fabricDetails} @ ${rate}` : `N/A @ ${rate}`;
  };

  const onSubmit = async (data: FormData) => {
    try {
      const relatedContracts = contracts
        .flatMap((contract) => contract.contractRows)
        .filter((row) => row.dispatchQty != '0')
        .map((row) => ({
          // id: row.rowId,
         // contractId: row.contractId,
          contractNumber: row.contractNumber,
          seller: row.seller,
          buyer: row.buyer,
          fabricDetails: getFabricDetails(row),
          date: row.date,
          quantity: row.quantity,
          widthOrColor : row.width || row.color,
          buyerRefer: row.refer,
          rate: row.rate,
          totalAmount: (parseFloat(row.quantity) * parseFloat(row.rate || '0')).toString(),
          base: row.base,
          TotalDispatchQuantity : row.dispatchQty,
          balanceQuantity: row.balanceQuantity,
          dispatchQty: row.dispatchQty,
          contractType: row.contractType,
        }));

      if (relatedContracts.length === 0) {
        toast('Please fill at least one contract row with Base or Dispatch Quantity', { type: 'error' });
        return;
      }

      const payload = {
        ...(isEdit && { id: initialData?.id }),
        listid: isEdit ? initialData?.listid : undefined,
        date: data.Date,
        bilty: data.Bilty,
        seller: sellers.find((s) => s.id === data.Seller)?.name || data.Seller,
        buyer: buyers.find((b) => b.id === data.Buyer)?.name || data.Buyer,
        vehicleType: data.VehicleType,
        remarks: data.Remarks,
        driverName: data.DriverName,
        driverNumber: data.DriverNumber,
        transporter: transporters.find((t) => t.id === data.Transporter)?.name || data.Transporter,
        destination: data.Destination,
        contractNumber: relatedContracts[0]?.contractNumber || '',
       // createdBy: initialData?.createdBy || 'user',
        creationDate: isEdit
          ? initialData?.creationDate || new Date().toISOString()
          : new Date().toISOString(),
        //updatedBy: 'user',
        updationDate: new Date().toISOString(),
        relatedContracts,
      };

      if (isEdit) {
        await updateDispatchNote(payload);
        toast('Dispatch Note Updated Successfully', { type: 'success' });
      } else {
        await createDispatchNote(payload);
        toast('Dispatch Note Created Successfully', { type: 'success' });
      }

      reset();
      router.push('/dispatchnote');
    } catch (error) {
      toast(`Error ${isEdit ? 'updating' : 'creating'} dispatch note: ${(error as Error).message}`, {
        type: 'error',
      });
    }
  };

  return (
    <div className="container mx-auto bg-white shadow-lg rounded dark:bg-[#030630]">
      <div className="w-full bg-[#06b6d4] h-[7vh] rounded dark:bg-[#387fbf]">
        <h1 className="text-base text-[23px] font-mono ml-10 mt-8 pt-3 text-white flex gap-2">
          <MdLocalShipping />
          {isEdit ? 'UPDATE DISPATCH NOTE' : 'ADD DISPATCH NOTE'}
        </h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="p-2 w-full">
          <div className="p-4">
            <div className="grid grid-cols-5 gap-4">
              <div
                className="relative group"
                onMouseEnter={() => setIdFocused(true)}
                onMouseLeave={() => setIdFocused(false)}
              >
                <Controller
                  name="listid"
                  control={control}
                  render={({ field }) => (
                    <>
                      <CustomInput
                        {...field}
                        label="Dispatch#"
                        type="text"
                        disabled
                        placeholder=""
                        value={field.value || ''}
                      />
                      {idFocused && (
                        <>
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                            <BiSolidErrorAlt className="text-red-500 text-xl cursor-pointer" />
                          </div>
                          <div className="absolute bottom-full right-0 h-8 w-max text-large text-black bg-[#d5e4ff] rounded px-3 py-1 shadow-lg z-10 animate-fade-in">
                            ID is auto-generated by the system
                          </div>
                        </>
                      )}
                    </>
                  )}
                />
              </div>
              <CustomInput
                type="date"
                variant="floating"
                borderThickness="2"
                label="Dispatch Date"
                id="Date"
                {...register('Date')}
                error={errors.Date?.message}
              />
              <CustomInput
                variant="floating"
                borderThickness="2"
                label="Bilty"
                id="Bilty"
                {...register('Bilty')}
                error={errors.Bilty?.message}
              />
              <CustomInputDropdown
                label="Seller"
                options={sellers}
                selectedOption={watch('Seller') || ''}
                onChange={(value) => setValue('Seller', value, { shouldValidate: true })}
                error={errors.Seller?.message}
                register={register}
              />
              <CustomInputDropdown
                label="Buyer"
                options={buyers}
                selectedOption={watch('Buyer') || ''}
                onChange={(value) => setValue('Buyer', value, { shouldValidate: true })}
                error={errors.Buyer?.message}
                register={register}
              />
              <CustomInputDropdown
                label="Vehicle Type"
                options={vehicleTypes}
                selectedOption={watch('VehicleType') || ''}
                onChange={(value) => setValue('VehicleType', value, { shouldValidate: true })}
                error={errors.VehicleType?.message}
                register={register}
              />
              <CustomInput
                variant="floating"
                borderThickness="2"
                label="Driver Name"
                id="DriverName"
                {...register('DriverName')}
                error={errors.DriverName?.message}
              />
              <CustomInput
                variant="floating"
                borderThickness="2"
                label="Driver Number"
                id="DriverNumber"
                {...register('DriverNumber')}
                error={errors.DriverNumber?.message}
              />
              <CustomInputDropdown
                label="Transporter"
                options={transporters}
                selectedOption={watch('Transporter') || ''}
                onChange={(value) => setValue('Transporter', value, { shouldValidate: true })}
                error={errors.Transporter?.message}
                register={register}
              />
              <CustomInput
                variant="floating"
                borderThickness="2"
                label="Destination"
                id="Destination"
                {...register('Destination')}
                error={errors.Destination?.message}
              />
              <CustomInput
                variant="floating"
                borderThickness="2"
                label="Vehicle"
                id="Remark"
                {...register('Remarks')}
                error={errors.Remarks?.message}
              />
            </div>
          </div>

          <div className="p-4">
            <h2 className="text-xl text-[#06b6d4] font-bold dark:text-white ml-4">Related Contracts</h2>
            {selectedContractInfo && (
              <p className="text-gray-700 font-bold dark:text-gray-300 ml-4 mb-2">
                Selected: {selectedContractInfo.contractType} Contract (Contract #{selectedContractInfo.contractNumber})
              </p>
            )}
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl overflow-hidden">
              {(loading || fetchingSellers || fetchingBuyers || fetchingTransporters) ? (
                <p className="text-gray-500">Loading contracts, sellers, buyers, or transporters...</p>
              ) : selectedSeller && selectedBuyer ? (
                filteredContractRows.length > 0 ? (
                  <div className="relative overflow-x-auto max-h-[500px] overflow-y-auto">
                    <table className="w-full text-left border-collapse">
                      <thead className="sticky top-0 bg-white dark:bg-gray-900 z-10">
                        <tr className="bg-[#06b6d4] sticky bottom-0 text-sm font-extrabold uppercase text-white">
                          <th className="p-4 font-medium">Select</th>
                          <th className="p-4 font-medium">Contract#</th>
                          <th className="p-4 font-medium">Width / Color</th>
                          <th className="p-4 font-medium">Buyer#</th>
                          <th className="p-4 font-medium">Fabric Details</th>
                          <th className="p-4 font-medium">Contract Date</th>
                          <th className="p-4 font-medium">Contract Qty</th>
                          <th className="p-4 font-medium">Bale / Role</th>
                          <th className="p-4 font-medium">Dispatch Qty</th>
                          <th className="p-4 font-medium">Total Dispatch Quantity</th>
                          <th className="p-4 font-medium">Balance Qty</th>
                        </tr>
                      </thead>
                      <tbody className={filteredContractRows.length >= 5 ? " " : ""}>
                        {filteredContractRows.map((row, index) => {
                          const parentContract = contracts.find((c) => c.id === row.contractId);
                          const isMultiRow = parentContract ? parentContract.rowCount > 1 : false;

                          let rowStyle = {
                            backgroundColor: '',
                            borderColor: '',
                            fontWeight: 'normal',
                            fontFamily: 'inherit',
                          };

                          if (isMultiRow) {
                            switch (row.contractType) {
                              case 'MultiWidth':
                                rowStyle = {
                                  backgroundColor: '#dcdcdc', // gray-150
                                  borderColor: '#5aa796',
                                  fontWeight: 'bold',
                                  fontFamily: 'sans-serif',
                                };
                                break;
                              case 'Diet':
                                rowStyle = {
                                  backgroundColor: '#efefef', // gray-50
                                  borderColor: '#c1a8a8',
                                  fontWeight: 'bold',
                                  fontFamily: 'inherit',
                                };
                                break;
                              case 'Conversion':
                                rowStyle = {
                                  backgroundColor: '#f3eded', // gray-100
                                  borderColor: '#7197bf',
                                  fontWeight: 'bold',
                                  fontFamily: 'inherit',
                                };
                                break;
                            }
                          }

                          const isNewContract = index === 0 || row.contractId !== filteredContractRows[index - 1]?.contractId;
                          const contractIndex = contracts.findIndex((c) => c.id === row.contractId);
                          const contractBorderColor = contractIndex % 2 === 0 ? '' : '';
                          const displayContractNumber = row.rowIndex === 0 ? row.contractNumber : `${row.contractNumber}-${row.rowIndex}`;

                          return (
                            <>
                              {isNewContract && index > 0 && (
                                <tr className="h-2">
                                  <td colSpan={11} className="border-none bg-transparent"></td>
                                </tr>
                              )}
                              <tr
                                key={row.rowId}
                                className={`w-full cursor-pointer transition-colors ${
                                  filteredContractRows.length >= 5 ? 'table-row' : ''
                                } ${row.isSelected ? '!bg-[#ecfcff] !text-[#0e7d90] !border-[#0a0a0a] rounded-lg' : 'border-r-2 border-l-2'} ${
                                  isNewContract ? `rounded ${contractBorderColor}` : ' rounded-2xl'
                                }`}
                                style={{
                                  backgroundColor: row.isSelected ? undefined : rowStyle.backgroundColor,
                                  borderColor: row.isSelected ? undefined : rowStyle.borderColor,
                                  fontWeight: rowStyle.fontWeight,
                                  fontFamily: rowStyle.fontFamily,
                                }}
                                onClick={() => handleRowClick(row.rowId, !row.isSelected, row.contractType, row.contractNumber, row.rowIndex)}
                              >
                                <td className="p-3">
                                  <input
                                    type="checkbox"
                                    checked={row.isSelected}
                                    onChange={(e) => handleRowClick(row.rowId, e.target.checked, row.contractType, row.contractNumber, row.rowIndex)}
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                </td>
                                <td className="p-4">{displayContractNumber || '-'}</td>
                                <td className="p-4">{row.contractType === 'Diet' ? row.color || 'N/A' : row.width || '0'}</td>
                                <td className="p-4">{row.isFirstRow ? row.refer || '-' : ''}</td>
                                <td className="p-4">{getFabricDetails(row)}</td>
                                <td className="p-4">{row.isFirstRow ? row.date || '-' : ''}</td>
                                <td className="p-4">{row.quantity || '0'}</td>
                                <td className="p-4">
                                  <input
                                    type="text"
                                    value={row.base || ''}
                                    onChange={(e) =>
                                      handleContractInputChange(row.rowId, 'base', e.target.value)
                                    }
                                    className="w-full p-2 border border-gray-300 rounded bg-white"
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                </td>
                                <td className="p-4">
                                  <input
                                    type="text"
                                    value={row.dispatchQty || ''}
                                    onChange={(e) =>
                                      handleContractInputChange(row.rowId, 'dispatchQty', e.target.value)
                                    }
                                    className="w-full p-2 border border-gray-300 rounded bg-white"
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                </td>                                <td className="p-4">
                                  <input
                                    type="text"
                                    value={
                                      historyData && historyData.relatedContracts 
                                        ? historyData.relatedContracts.find(
                                            (hc: any) => 
                                              hc.contractNumber === row.contractNumber && 
                                              hc.contractType === row.contractType
                                          )?.totalDispatchQuantity || '0'
                                        : '0'
                                    }
                                    disabled
                                    className="w-full p-2 border border-gray-300 rounded bg-gray-100"
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                </td>                                <td className="p-4">
                                  <input
                                    type="text"
                                    value={
                                      historyData && historyData.relatedContracts 
                                        ? historyData.relatedContracts.find(
                                            (hc: any) => 
                                              hc.contractNumber === row.contractNumber && 
                                              hc.contractType === row.contractType
                                          )?.balanceQuantity || row.quantity
                                        : row.balanceQuantity
                                    }
                                    disabled
                                    className="w-full p-2 border border-gray-300 rounded bg-gray-100"
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                </td>
                              </tr>
                            </>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-gray-500 ml-5">No contracts found for the selected Seller and Buyer.</p>
                )
              ) : (
                <p className="text-gray-500 ml-5">Please select both Seller and Buyer to view contracts.</p>
              )}
            </div>
          </div>

          <div className="w-full h-[8vh] flex justify-end gap-4 mt-4 px-4 bg-white border-t-2 border-[#e0e0e0]">
            <Button
              type="submit"
              className="w-[160px] gap-2 inline-flex items-center bg-[#0e7d90] hover:bg-[#0891b2] text-white px-6 py-2 font-medium transition-all duration-200 font-mono text-base hover:translate-y-[-2px] focus:outline-none active:shadow-[#3c4fe0_0_3px_7px_inset] active:translate-y-[2px] mt-2"
            >
              Save
            </Button>
            <Link href="/dispatchnote">
              <Button
                type="button"
                className="w-[160px] gap-2 mr-2 inline-flex items-center bg-black hover:bg-[#b0b0b0] text-white px-6 py-2 font-medium transition-all duration-200 font-mono text-base hover:translate-y-[-2px] focus:outline-none active:shadow-[#3c4fe0_0_3px_7px_inset] active:translate-y-[2px] mt-2"
              >
                Cancel
              </Button>
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
};

export default DispatchNote;