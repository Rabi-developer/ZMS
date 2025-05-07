'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'react-toastify';
import CustomInput from '@/components/ui/CustomInput';
import CustomInputDropdown from '@/components/ui/CustomeInputDropdown';
import { MdAddBusiness, MdAdd, MdDelete, MdInfo } from 'react-icons/md';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { getAllOrganization } from '@/apis/organization';
import { getAllBranch } from '@/apis/branchs';
import { getAllDescriptions } from '@/apis/description';
import { createContract, updateContract } from '@/apis/contract';
import { getAllBlendRatios } from '@/apis/blendratio';
import { getAllEndUses } from '@/apis/enduse';
import { getAllFabricTypess } from '@/apis/fabrictypes';
import { getAllPackings } from '@/apis/packing';
import { getAllPeiceLengths } from '@/apis/peicelength';
import { getAllPickInsertions } from '@/apis/pickinsertion';
import { getAllWrapYarnTypes } from '@/apis/wrapyarntype';
import { getAllWeftYarnType } from '@/apis/weftyarntype';
import { getAllWeaves } from '@/apis/weaves';
import { getAllFinal } from '@/apis/final';
import { getAllSelveges } from '@/apis/selvege';
import { getAllSelvegeWeaves } from '@/apis/selvegeweave';
import { getAllSelvegeWidths } from '@/apis/selvegewidth';
import { getAllStuffs } from '@/apis/stuff';
import { getAllSellers } from '@/apis/seller';
import { getAllBuyer } from '@/apis/buyer';
import { getAllDeliveryTerms } from '@/apis/deliveryterm';
import { getAllCommissionTypes } from '@/apis/commissiontype';
import { getAllPaymentTerms } from '@/apis/paymentterm';
import { getAllUnitOfMeasures } from '@/apis/unitofmeasure';
import { getAllGeneralSaleTextTypes } from '@/apis/generalSaleTextType';
import ContractSummaryCard from '../contractcard/ContractSummaryCard';

// Zod schema for form validation
const Schema = z.object({
  contractNumber: z.string().min(1, 'Contract Number is required'),
  date: z.string().min(1, 'Date is required'),
  contractType: z.enum(['Sale', 'Purchase'], { required_error: 'Contract Type is required' }),
  companyId: z.string().min(1, 'Company is required'),
  branchId: z.string().min(1, 'Branch is required'),
  contractOwner: z.string().min(1, 'Contract Owner is required'),
  seller: z.string().min(1, 'Seller is required'),
  buyer: z.string().min(1, 'Buyer is required'),
  referenceNumber: z.string().optional(),
  deliveryDate: z.string().min(1, 'Delivery Date is required'),
  refer: z.string().optional(),
  referdate: z.string().optional(),
  fabricType: z.string().min(1, 'Fabric Type is required'),
  descriptionId: z.string().min(1, 'Description is required'),
  stuff: z.string().min(1, 'Stuff is required'),
  blendRatio: z.string().optional(),
  blendType: z.string().optional(),
  warpCount: z.string().optional(),
  warpYarnType: z.string().optional(),
  weftCount: z.string().optional(),
  weftYarnType: z.string().min(1, 'Weft Yarn Type is required'),
  noOfEnds: z.string().optional(),
  noOfPicks: z.string().optional(),
  weaves: z.string().optional(),
  pickInsertion: z.string().optional(),
  width: z.string().optional(),
  final: z.string().optional(),
  selvedge: z.string().optional(),
  selvedgeWeave: z.string().optional(),
  selvedgeWidth: z.string().optional(),
  quantity: z.string().min(1, 'Quantity is required'),
  unitOfMeasure: z.string().min(1, 'Unit of Measure is required'),
  tolerance: z.string().optional(),
  rate: z.string().min(1, 'Rate is required'),
  packing: z.string().optional(),
  pieceLength: z.string().optional(),
  fabricValue: z.string().min(1, 'Fabric Value is required'),
  gst: z.string().min(1, 'GST Type is required'),
  gstValue: z.string().optional(),
  totalAmount: z.string().min(1, 'Total Amount is required'),
  paymentTermsSeller: z.string().optional(),
  paymentTermsBuyer: z.string().optional(),
  deliveryTerms: z.string().optional(),
  commissionFrom: z.string().optional(),
  commissionType: z.string().optional(),
  commissionPercentage: z.string().optional(),
  commissionValue: z.string().optional(),
  dispatchAddress: z.string().optional(),
  sellerRemark: z.string().optional(),
  buyerRemark: z.string().optional(),
  createdBy: z.string().optional(),
  creationDate: z.string().optional(),
  updatedBy: z.string().optional(),
  updationDate: z.string().optional(),
  approvedBy: z.string().optional(),
  approvedDate: z.string().optional(),
  endUse: z.string().optional(),
  buyerDeliveryBreakups: z
    .array(
      z.object({
        qty: z.string().optional(),
        deliveryDate: z.string().optional(),
      })
    )
    .optional(),
  sellerDeliveryBreakups: z
    .array(
      z.object({
        qty: z.string().optional(),
        deliveryDate: z.string().optional(),
      })
    )
    .optional(),
  sampleDetails: z
    .array(
      z.object({
        sampleQty: z.string().optional(),
        sampleReceivedDate: z.string().optional(),
        sampleDeliveredDate: z.string().optional(),
        createdBy: z.string().optional(),
        creationDate: z.string().optional(),
        updatedBy: z.string().optional(),
        updateDate: z.string().optional(),
        additionalInfo: z
          .array(
            z.object({
              endUse: z.string().optional(),
              count: z.string().optional(),
              weight: z.string().optional(),
              yarnBags: z.string().optional(),
              labs: z.string().optional(),
            })
          )
          .optional(),
      })
    )
    .optional(),
});

type FormData = z.infer<typeof Schema>;

type ContractFormProps = {
  id?: string;
  initialData?: any;
};

const ContractForm = ({ id, initialData }: ContractFormProps) => {
  const router = useRouter();
  const [companies, setCompanies] = useState<{ id: string; name: string }[]>([]);
  const [branches, setBranches] = useState<{ id: string; name: string }[]>([]);
  const [descriptions, setDescriptions] = useState<{ id: string; name: string }[]>([]);
  const [blendRatios, setBlendRatios] = useState<{ id: string; name: string; subDescription: string }[]>([]);
  const [blendTypeOptions, setBlendTypeOptions] = useState<{ id: string; name: string }[]>([]);
  const [endUses, setEndUses] = useState<{ id: string; name: string }[]>([]);
  const [fabricTypes, setFabricTypes] = useState<{ id: string; name: string }[]>([]);
  const [packings, setPackings] = useState<{ id: string; name: string }[]>([]);
  const [pieceLengths, setPieceLengths] = useState<{ id: string; name: string }[]>([]);
  const [pickInsertions, setPickInsertions] = useState<{ id: string; name: string }[]>([]);
  const [warpYarnTypes, setWarpYarnTypes] = useState<{ id: string; name: string }[]>([]);
  const [weftYarnTypes, setWeftYarnTypes] = useState<{ id: string; name: string }[]>([]);
  const [weaves, setWeaves] = useState<{ id: string; name: string }[]>([]);
  const [finals, setFinals] = useState<{ id: string; name: string }[]>([]);
  const [selvedges, setSelvedges] = useState<{ id: string; name: string }[]>([]);
  const [selvedgeWeaves, setSelvedgeWeaves] = useState<{ id: string; name: string }[]>([]);
  const [selvedgeWidths, setSelvedgeWidths] = useState<{ id: string; name: string }[]>([]);
  const [stuffs, setStuffs] = useState<{ id: string; name: string }[]>([]);
  const [sellers, setSellers] = useState<{ id: string; name: string }[]>([]);
  const [buyers, setBuyers] = useState<{ id: string; name: string }[]>([]);
  const [deliveryTerms, setDeliveryTerms] = useState<{ id: string; name: string }[]>([]);
  const [commissionTypes, setCommissionTypes] = useState<{ id: string; name: string }[]>([]);
  const [paymentTerms, setPaymentTerms] = useState<{ id: string; name: string }[]>([]);
  const [unitsOfMeasure, setUnitsOfMeasure] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [gstTypes, setGstTypes] = useState<{ id: string; name: string }[]>([]);
  const [deliveryDetails, setDeliveryDetails] = useState({
    quantity: '',
    unitOfMeasure: '',
    lbs: '',
    tolerance: '',
    rate: '',
    perLbs: '',
    packing: '',
    pieceLength: '',
    payTermSeller: '',
    payTermBuyer: '',
    fabricValue: '',
    gst: '',
    gstValue: '',
    finishWidth: '',
    totalAmount: '',
    deliveryTerms: '',
    commissionFrom: '',
    commissionType: '',
    commissionPercentage: '',
    commissionValue: '',
    dispatchLater: '',
    sellerRemark: '',
    buyerRemark: '',
    deliveryDate: '',
    sellerCommission: '',
    buyerCommission: '',
  });
  const [notes, setNotes] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [buyerDeliveryBreakups, setBuyerDeliveryBreakups] = useState<
    { qty: string; deliveryDate: string }[]
  >([]);
  const [sellerDeliveryBreakups, setSellerDeliveryBreakups] = useState<
    { qty: string; deliveryDate: string }[]
  >([]);
  const [sampleDetails, setSampleDetails] = useState<
    {
      sampleQty: string;
      sampleReceivedDate: string;
      sampleDeliveredDate: string;
      createdBy: string;
      creationDate: string;
      updatedBy: string;
      updateDate: string;
      additionalInfo: {
        endUse: string;
        count: string;
        weight: string;
        yarnBags: string;
        labs: string;
      }[];
    }[]
  >([{
    sampleQty: '',
    sampleReceivedDate: '',
    sampleDeliveredDate: '',
    createdBy: 'Current User',
    creationDate: new Date().toISOString().split('T')[0],
    updatedBy: '',
    updateDate: '',
    additionalInfo: [{
      endUse: '',
      count: '',
      weight: '',
      yarnBags: '',
      labs: '',
    }],
  }]);
  const [showSamplePopup, setShowSamplePopup] = useState<number | null>(null);
  const currentUser = 'Current User';
  const currentDate = new Date().toISOString().split('T')[0];

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<FormData>({
    resolver: zodResolver(Schema),
    defaultValues: initialData || {},
  });

  // Dropdown options
  const contractTypes = [
    { id: 'Sale', name: 'Sale' },
    { id: 'Purchase', name: 'Purchase' },
  ];
  const commissionFromOptions = [
    { id: 'Seller', name: 'Seller' },
    { id: 'Buyer', name: 'Buyer' },
    { id: 'Both', name: 'Both' },
  ];
  const dispatchLaterOptions = [
    { id: 'Yes', name: 'Yes' },
    { id: 'No', name: 'No' },
  ];

  // Fetch data functions
  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const response = await getAllOrganization(1, 100);
      setCompanies(response.data.map((org: any) => ({ id: org.id, name: org.name })));
    } catch (error) {
      console.error('Error fetching companies:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBranches = async () => {
    try {
      setLoading(true);
      const response = await getAllBranch(1, 100);
      setBranches(response.data.map((branch: any) => ({ id: branch.id, name: branch.name })));
    } catch (error) {
      console.error('Error fetching branches:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDescriptions = async () => {
    try {
      setLoading(true);
      const response = await getAllDescriptions();
      setDescriptions(
        response.data.map((desc: any) => ({
          id: desc.listid,
          name: desc.descriptions,
        }))
      );
    } catch (error) {
      console.error('Error fetching descriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBlendRatios = async () => {
    try {
      setLoading(true);
      const response = await getAllBlendRatios();
      setBlendRatios(
        response.data.map((item: any) => ({
          id: item.listid,
          name: item.descriptions,
          subDescription: item.subDescription,
        }))
      );
    } catch (error) {
      console.error('Error fetching blend ratios:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEndUses = async () => {
    try {
      setLoading(true);
      const response = await getAllEndUses();
      setEndUses(
        response.data.map((item: any) => ({
          id: item.listid,
          name: item.descriptions,
        }))
      );
    } catch (error) {
      console.error('Error fetching end uses:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFabricTypes = async () => {
    try {
      setLoading(true);
      const response = await getAllFabricTypess();
      setFabricTypes(
        response.data.map((item: any) => ({
          id: item.listid,
          name: item.descriptions,
        }))
      );
    } catch (error) {
      console.error('Error fetching fabric types:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPackings = async () => {
    try {
      setLoading(true);
      const response = await getAllPackings();
      setPackings(
        response.data.map((item: any) => ({
          id: item.listid,
          name: item.descriptions,
        }))
      );
    } catch (error) {
      console.error('Error fetching packings:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPieceLengths = async () => {
    try {
      setLoading(true);
      const response = await getAllPeiceLengths();
      setPieceLengths(
        response.data.map((item: any) => ({
          id: item.listid,
          name: item.descriptions,
        }))
      );
    } catch (error) {
      console.error('Error fetching piece lengths:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPickInsertions = async () => {
    try {
      setLoading(true);
      const response = await getAllPickInsertions();
      setPickInsertions(
        response.data.map((item: any) => ({
          id: item.listid,
          name: item.descriptions,
        }))
      );
    } catch (error) {
      console.error('Error fetching pick insertions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchWarpYarnTypes = async () => {
    try {
      setLoading(true);
      const response = await getAllWrapYarnTypes();
      setWarpYarnTypes(
        response.data.map((item: any) => ({
          id: item.listid,
          name: item.descriptions,
        }))
      );
    } catch (error) {
      console.error('Error fetching warp yarn types:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchWeftYarnTypes = async () => {
    try {
      setLoading(true);
      const response = await getAllWeftYarnType();
      setWeftYarnTypes(
        response.data.map((item: any) => ({
          id: item.listid,
          name: item.descriptions,
        }))
      );
    } catch (error) {
      console.error('Error fetching weft yarn types:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchWeaves = async () => {
    try {
      setLoading(true);
      const response = await getAllWeaves();
      setWeaves(
        response.data.map((item: any) => ({
          id: item.listid,
          name: item.descriptions,
        }))
      );
    } catch (error) {
      console.error('Error fetching weaves:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFinals = async () => {
    try {
      setLoading(true);
      const response = await getAllFinal();
      setFinals(
        response.data.map((item: any) => ({
          id: item.listid,
          name: item.descriptions,
        }))
      );
    } catch (error) {
      console.error('Error fetching finals:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSelvedges = async () => {
    try {
      setLoading(true);
      const response = await getAllSelveges();
      setSelvedges(
        response.data.map((item: any) => ({
          id: item.listid,
          name: item.descriptions,
        }))
      );
    } catch (error) {
      console.error('Error fetching selvedges:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSelvedgeWeaves = async () => {
    try {
      setLoading(true);
      const response = await getAllSelvegeWeaves();
      setSelvedgeWeaves(
        response.data.map((item: any) => ({
          id: item.listid,
          name: item.descriptions,
        }))
      );
    } catch (error) {
      console.error('Error fetching selvedge weaves:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSelvedgeWidths = async () => {
    try {
      setLoading(true);
      const response = await getAllSelvegeWidths();
      setSelvedgeWidths(
        response.data.map((item: any) => ({
          id: item.listid,
          name: item.descriptions,
        }))
      );
    } catch (error) {
      console.error('Error fetching selvedge widths:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStuffs = async () => {
    try {
      setLoading(true);
      const response = await getAllStuffs();
      setStuffs(
        response.data.map((item: any) => ({
          id: item.listid,
          name: item.descriptions,
        }))
      );
    } catch (error) {
      console.error('Error fetching stuffs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSellers = async () => {
    try {
      setLoading(true);
      const response = await getAllSellers();
      setSellers(
        response.data.map((seller: any) => ({
          id: seller.id,
          name: seller.SellerName,
        }))
      );
    } catch (error) {
      console.error('Error fetching sellers:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBuyers = async () => {
    try {
      setLoading(true);
      const response = await getAllBuyer();
      setBuyers(
        response.data.map((buyer: any) => ({
          id: buyer.id,
          name: buyer.BuyerName,
        }))
      );
    } catch (error) {
      console.error('Error fetching buyers:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDeliveryTerms = async () => {
    try {
      setLoading(true);
      const response = await getAllDeliveryTerms();
      setDeliveryTerms(
        response.data.map((item: any) => ({
          id: item.listid,
          name: item.descriptions,
        }))
      );
    } catch (error) {
      console.error('Error fetching delivery terms:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCommissionTypes = async () => {
    try {
      setLoading(true);
      const response = await getAllCommissionTypes();
      setCommissionTypes(
        response.data.map((item: any) => ({
          id: item.listid,
          name: item.descriptions,
        }))
      );
    } catch (error) {
      console.error('Error fetching commission types:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentTerms = async () => {
    try {
      setLoading(true);
      const response = await getAllPaymentTerms();
      setPaymentTerms(
        response.data.map((item: any) => ({
          id: item.listid,
          name: item.descriptions,
        }))
      );
    } catch (error) {
      console.error('Error fetching payment terms:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnitsOfMeasure = async () => {
    try {
      setLoading(true);
      const response = await getAllUnitOfMeasures();
      setUnitsOfMeasure(
        response.data.map((item: any) => ({
          id: item.listid,
          name: item.descriptions,
        }))
      );
    } catch (error) {
      console.error('Error fetching units of measure:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchGstTypes = async () => {
    try {
      setLoading(true);
      const response = await getAllGeneralSaleTextTypes();
      setGstTypes(
        response.data.map((item: any) => ({
          id: item.id,
          name: item.gstType,
        }))
      );
    } catch (error) {
      console.error('Error fetching GST types:', error);
    } finally {
      setLoading(false);
    }
  };

  const companyId = watch('companyId');
  const branchId = watch('branchId');
  const selectedBlendRatio = watch('blendRatio');

  useEffect(() => {
    setShowForm(!!companyId && !!branchId);
  }, [companyId, branchId]);

  // Update Blend Type options when Blend Ratio changes
  useEffect(() => {
    const selectedRatio = blendRatios.find((ratio) => ratio.id === selectedBlendRatio);
    if (selectedRatio && selectedRatio.subDescription) {
      const subDescArray = selectedRatio.subDescription
        .split('|')
        .filter((s: string) => s)
        .map((subDesc: string, index: number) => ({
          id: `${index}`,
          name: subDesc.trim(),
        }));
      setBlendTypeOptions(subDescArray);
      setValue('blendType', subDescArray[0]?.name || '', { shouldValidate: true });
    } else {
      setBlendTypeOptions([]);
      setValue('blendType', '', { shouldValidate: true });
    }
  }, [selectedBlendRatio, blendRatios, setValue]);

  useEffect(() => {
    fetchCompanies();
    fetchBranches();
    fetchDescriptions();
    fetchBlendRatios();
    fetchEndUses();
    fetchFabricTypes();
    fetchPackings();
    fetchPieceLengths();
    fetchPickInsertions();
    fetchWarpYarnTypes();
    fetchWeftYarnTypes();
    fetchWeaves();
    fetchFinals();
    fetchSelvedges();
    fetchSelvedgeWeaves();
    fetchSelvedgeWidths();
    fetchStuffs();
    fetchSellers();
    fetchBuyers();
    fetchDeliveryTerms();
    fetchCommissionTypes();
    fetchPaymentTerms();
    fetchUnitsOfMeasure();
    fetchGstTypes();

    if (initialData) {
      reset({
        ...initialData,
        contractType:
          initialData.contractType === 'Sale' || initialData.contractType === 'Purchase'
            ? initialData.contractType
            : 'Sale',
        weftYarnType: initialData.weftYarnType || initialData.weftYarnCount || '',
        weaves: initialData.weaves || '',
      });
      if (initialData.deliveryDetails) {
        setDeliveryDetails(initialData.deliveryDetails);
      }
      if (initialData.buyerDeliveryBreakups) {
        setBuyerDeliveryBreakups(initialData.buyerDeliveryBreakups);
      }
      if (initialData.sellerDeliveryBreakups) {
        setSellerDeliveryBreakups(initialData.sellerDeliveryBreakups);
      }
      if (initialData.sampleDetails && initialData.sampleDetails.length > 0) {
        setSampleDetails([initialData.sampleDetails[0]]);
      }
    }
  }, [initialData, reset]);

  const calculateDeliveryDetails = (currentDetails: typeof deliveryDetails) => {
    const updatedDetails = { ...currentDetails };

    // Fabric Value: Quantity * Rate
    const quantity = parseFloat(updatedDetails.quantity || '0');
    const rate = parseFloat(updatedDetails.rate || '0');
    updatedDetails.fabricValue = (quantity * rate).toFixed(2);

    // GST Value: Based on GST Type and Fabric Value
    const selectedGst = gstTypes.find((gst) => gst.id === updatedDetails.gst);
    if (selectedGst) {
      const percentage = parseFloat(selectedGst.name.replace('% GST', '')) || 0;
      const fabricValue = parseFloat(updatedDetails.fabricValue || '0');
      updatedDetails.gstValue = ((fabricValue * percentage) / 100).toFixed(2);
    } else {
      updatedDetails.gstValue = '0.00';
    }

    // Total Amount: Fabric Value + GST Value
    const fabricValue = parseFloat(updatedDetails.fabricValue || '0');
    const gstValue = parseFloat(updatedDetails.gstValue || '0');
    updatedDetails.totalAmount = (fabricValue + gstValue).toFixed(2);

    // Commission Value
    const commissionType = updatedDetails.commissionType;
    const commissionInput = parseFloat(updatedDetails.commissionPercentage || '0');
    const totalAmount = parseFloat(updatedDetails.totalAmount || '0');
    if (commissionType) {
      const commissionTypeName = commissionTypes.find(
        (type) => type.id === commissionType
      )?.name.toLowerCase();
      if (commissionTypeName === 'on value' && commissionInput > 0 && totalAmount > 0) {
        updatedDetails.commissionValue = ((totalAmount * commissionInput) / 100).toFixed(2);
      } else if (commissionTypeName === 'on qty' && commissionInput > 0 && quantity > 0) {
        updatedDetails.commissionValue = (quantity * commissionInput).toFixed(2);
      } else {
        updatedDetails.commissionValue = '0.00';
      }
    } else {
      updatedDetails.commissionValue = '0.00';
    }

    return updatedDetails;
  };

  const handleDeliveryDetailChange = (field: string, value: string) => {
    setDeliveryDetails((prev) => {
      const updatedDetails = { ...prev, [field]: value };
      if (['quantity', 'rate', 'gst', 'commissionType', 'commissionPercentage'].includes(field)) {
        return calculateDeliveryDetails(updatedDetails);
      }
      return updatedDetails;
    });
  };

  const handleEnterKeyPress = (field: string) => (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setDeliveryDetails((prev) => calculateDeliveryDetails(prev));
    }
  };

  const addBuyerDeliveryBreakup = () => {
    setBuyerDeliveryBreakups([...buyerDeliveryBreakups, { qty: '', deliveryDate: '' }]);
  };

  const removeBuyerDeliveryBreakup = (index: number) => {
    setBuyerDeliveryBreakups(buyerDeliveryBreakups.filter((_, i) => i !== index));
  };

  const handleBuyerDeliveryBreakupChange = (index: number, field: string, value: string) => {
    const updatedBreakups = [...buyerDeliveryBreakups];
    updatedBreakups[index] = { ...updatedBreakups[index], [field]: value };
    setBuyerDeliveryBreakups(updatedBreakups);
  };

  const addSellerDeliveryBreakup = () => {
    setSellerDeliveryBreakups([...sellerDeliveryBreakups, { qty: '', deliveryDate: '' }]);
  };

  const removeSellerDeliveryBreakup = (index: number) => {
    setSellerDeliveryBreakups(sellerDeliveryBreakups.filter((_, i) => i !== index));
  };

  const handleSellerDeliveryBreakupChange = (index: number, field: string, value: string) => {
    const updatedBreakups = [...sellerDeliveryBreakups];
    updatedBreakups[index] = { ...updatedBreakups[index], [field]: value };
    setSellerDeliveryBreakups(updatedBreakups);
  };

  const handleSampleDetailChange = (field: string, value: string) => {
    const updatedSampleDetails = [...sampleDetails];
    updatedSampleDetails[0] = { ...updatedSampleDetails[0], [field]: value };
    if (field === 'createdBy' && value) {
      updatedSampleDetails[0].creationDate = currentDate;
    }
    if (field === 'updatedBy' && value) {
      updatedSampleDetails[0].updateDate = currentDate;
    }
    setSampleDetails(updatedSampleDetails);
  };

  const handleAdditionalInfoChange = (
    infoIndex: number,
    field: string,
    value: string
  ) => {
    const updatedSampleDetails = [...sampleDetails];
    const updatedAdditionalInfo = [...(updatedSampleDetails[0].additionalInfo || [])];
    updatedAdditionalInfo[infoIndex] = { ...updatedAdditionalInfo[infoIndex], [field]: value };
    updatedSampleDetails[0].additionalInfo = updatedAdditionalInfo;
    setSampleDetails(updatedSampleDetails);
  };

  const addAdditionalInfoRow = () => {
    const updatedSampleDetails = [...sampleDetails];
    const updatedAdditionalInfo = [...(updatedSampleDetails[0].additionalInfo || [])];
    updatedAdditionalInfo.push({
      endUse: '',
      count: '',
      weight: '',
      yarnBags: '',
      labs: '',
    });
    updatedSampleDetails[0].additionalInfo = updatedAdditionalInfo;
    setSampleDetails(updatedSampleDetails);
  };

  const onSubmit = async (data: FormData) => {
    try {
      const payload = {
        ...data,
        deliveryDetails,
        notes,
        buyerDeliveryBreakups,
        sellerDeliveryBreakups,
        sampleDetails,
      };
      console.log('Form Payload:', payload); // Debug log
      let response;
      if (id) {
        response = await updateContract(id, payload);
        toast('Contract Updated Successfully', { type: 'success' });
      } else {
        response = await createContract(payload);
        toast('Contract Created Successfully', { type: 'success' });
      }
      reset();
      router.push('/contracts');
    } catch (error) {
      toast('Error submitting contract', { type: 'error' });
      console.error('Error submitting form:', error);
    }
  };

  return (
    <div className="container mx-auto bg-white shadow-lg rounded dark:bg-[#030630]">
      <div className="w-full bg-[#06b6d4] h-[7vh] rounded dark:bg-[#387fbf]">
        <h1 className="text-base text-[23px] font-mono ml-10 mt-8 pt-3 text-white flex gap-2">
          <MdAddBusiness />
          {id ? 'EDIT CONTRACT' : 'ADD NEW CONTRACT'}
        </h1>
      </div>
      
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="p-2 w-full">
          <div className="p-4">
            <div className="grid grid-cols-2 gap-4">
              <CustomInputDropdown
                label="Company"
                options={companies}
                selectedOption={watch('companyId') || ''}
                onChange={(value) => setValue('companyId', value, { shouldValidate: true })}
                error={errors.companyId?.message}
                register={register}
              />
              <CustomInputDropdown
                label="Branch"
                options={branches}
                selectedOption={watch('branchId') || ''}
                onChange={(value) => setValue('branchId', value, { shouldValidate: true })}
                error={errors.branchId?.message}
                register={register}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <CustomInput
                variant="floating"
                borderThickness="2"
                label="Contract Number"
                id="contractNumber"
                {...register('contractNumber')}
                error={errors.contractNumber?.message}
              />
              <CustomInput
                type="date"
                variant="floating"
                borderThickness="2"
                label="Date"
                id="date"
                {...register('date')}
                error={errors.date?.message}
              />
              <CustomInputDropdown
                label="Contract Type"
                options={contractTypes}
                selectedOption={watch('contractType') || 'Sale'}
                onChange={(value) =>
                  setValue('contractType', value as 'Sale' | 'Purchase', { shouldValidate: true })
                }
                error={errors.contractType?.message}
                register={register}
              />
              <CustomInput
                variant="floating"
                borderThickness="2"
                label="Contract Owner"
                id="contractOwner"
                {...register('contractOwner')}
                error={errors.contractOwner?.message}

              />
              <CustomInputDropdown
                label="Seller"
                options={sellers}
                selectedOption={watch('seller') || ''}
                onChange={(value) => setValue('seller', value, { shouldValidate: true })}
                error={errors.seller?.message}
                register={register}
              />
              <CustomInputDropdown
                label="Buyer"
                options={buyers}
                selectedOption={watch('buyer') || ''}
                onChange={(value) => setValue('buyer', value, { shouldValidate: true })}
                error={errors.buyer?.message}
                register={register}
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <CustomInput
                variant="floating"
                borderThickness="2"
                label="Reference #"
                id="referenceNumber"
                {...register('referenceNumber')}
                error={errors.referenceNumber?.message}
              />
              <CustomInput
                type="date"
                variant="floating"
                borderThickness="2"
                label="Delivery Date"
                id="deliveryDate"
                {...register('deliveryDate')}
                error={errors.deliveryDate?.message}
              />
              <CustomInput
                variant="floating"
                borderThickness="2"
                label="Refer.#"
                id="refer"
                {...register('refer')}
                error={errors.refer?.message}
              />
              <CustomInput
                type="date"
                variant="floating"
                borderThickness="2"
                label="Refer Date"
                id="referdate"
                {...register('referdate')}
                error={errors.referdate?.message}
              />
              <CustomInputDropdown
                label="Fabric Type"
                options={fabricTypes}
                selectedOption={watch('fabricType') || ''}
                onChange={(value) => setValue('fabricType', value, { shouldValidate: true })}
                error={errors.fabricType?.message}
                register={register}
              />
            </div>
          </div>

          {showForm && (
            <>
              <div className="p-4 border rounded-2xl mx-auto">
                <h2 className="text-xl text-[#06b6d4] font-bold dark:text-white">Items</h2>
                <div className="grid grid-cols-3 gap-4">
                  <CustomInputDropdown
                    label="Description"
                    options={descriptions}
                    selectedOption={watch('descriptionId') || ''}
                    onChange={(value) => setValue('descriptionId', value, { shouldValidate: true })}
                    error={errors.descriptionId?.message}
                    register={register}
                  />
                  <CustomInputDropdown
                    label="Stuff"
                    options={stuffs}
                    selectedOption={watch('stuff') || ''}
                    onChange={(value) => setValue('stuff', value, { shouldValidate: true })}
                    error={errors.stuff?.message}
                    register={register}
                  />
                  <CustomInputDropdown
                    label="Blend Ratio"
                    options={blendRatios}
                    selectedOption={watch('blendRatio') || ''}
                    onChange={(value) => setValue('blendRatio', value, { shouldValidate: true })}
                    error={errors.blendRatio?.message}
                    register={register}
                  />
                  <CustomInputDropdown
                    label="Blend Type"
                    options={blendTypeOptions}
                    selectedOption={watch('blendType') || ''}
                    onChange={(value) => setValue('blendType', value, { shouldValidate: true })}
                    error={errors.blendType?.message}
                    register={register}
                  />
                  <CustomInput
                    variant="floating"
                    borderThickness="2"
                    label="Warp Count"
                    id="warpCount"
                    {...register('warpCount')}
                    error={errors.warpCount?.message}
                  />
                  <CustomInputDropdown
                    label="Warp Yarn Type"
                    options={warpYarnTypes}
                    selectedOption={watch('warpYarnType') || ''}
                    onChange={(value) => setValue('warpYarnType', value, { shouldValidate: true })}
                    error={errors.warpYarnType?.message}
                    register={register}
                  />
                  <CustomInput
                    variant="floating"
                    borderThickness="2"
                    label="Weft Count"
                    id="weftCount"
                    {...register('weftCount')}
                    error={errors.weftCount?.message}
                  />
                  <CustomInput
                    type="number"
                    variant="floating"
                    borderThickness="2"
                    label="No. of Ends"
                    id="noOfEnds"
                    {...register('noOfEnds')}
                    error={errors.noOfEnds?.message}
                  />
                  <CustomInput
                    type="number"
                    variant="floating"
                    borderThickness="2"
                    label="No. of Picks"
                    id="noOfPicks"
                    {...register('noOfPicks')}
                    error={errors.noOfPicks?.message}
                  />
                  {weaves.length === 0 && loading ? (
                    <div>Loading Weaves...</div>
                  ) : (
                    <CustomInputDropdown
                      label="Weaves"
                      options={weaves}
                      selectedOption={watch('weaves') || ''}
                      onChange={(value) => setValue('weaves', value, { shouldValidate: true })}
                      error={errors.weaves?.message}
                      register={register}
                    />
                  )}
                  <CustomInputDropdown
                    label="Pick Insertion"
                    options={pickInsertions}
                    selectedOption={watch('pickInsertion') || ''}
                    onChange={(value) => setValue('pickInsertion', value, { shouldValidate: true })}
                    error={errors.pickInsertion?.message}
                    register={register}
                  />
                  <CustomInput
                    type="number"
                    variant="floating"
                    borderThickness="2"
                    label="Width"
                    id="width"
                    {...register('width')}
                    error={errors.width?.message}
                  />
                  <CustomInputDropdown
                    label="Final"
                    options={finals}
                    selectedOption={watch('final') || ''}
                    onChange={(value) => setValue('final', value, { shouldValidate: true })}
                    error={errors.final?.message}
                    register={register}
                  />
                  <CustomInputDropdown
                    label="Selvedge"
                    options={selvedges}
                    selectedOption={watch('selvedge') || ''}
                    onChange={(value) => setValue('selvedge', value, { shouldValidate: true })}
                    error={errors.selvedge?.message}
                    register={register}
                  />
                  <CustomInputDropdown
                    label="Selvedge Weave"
                    options={selvedgeWeaves}
                    selectedOption={watch('selvedgeWeave') || ''}
                    onChange={(value) => setValue('selvedgeWeave', value, { shouldValidate: true })}
                    error={errors.selvedgeWeave?.message}
                    register={register}
                  />
                  <CustomInputDropdown
                    label="Selvedge Width"
                    options={selvedgeWidths}
                    selectedOption={watch('selvedgeWidth') || ''}
                    onChange={(value) => setValue('selvedgeWidth', value, { shouldValidate: true })}
                    error={errors.selvedgeWidth?.message}
                    register={register}
                  />
                  <CustomInputDropdown
                    label="End Use"
                    options={endUses}
                    selectedOption={watch('endUse') || ''}
                    onChange={(value) => setValue('endUse', value, { shouldValidate: true })}
                    error={errors.endUse?.message}
                    register={register}
                  />
                  {weftYarnTypes.length === 0 && loading ? (
                    <div>Loading Weft Yarn Types...</div>
                  ) : (
                    <CustomInputDropdown
                      label="Weft Yarn Type"
                      options={weftYarnTypes}
                      selectedOption={watch('weftYarnType') || ''}
                      onChange={(value) => setValue('weftYarnType', value, { shouldValidate: true })}
                      error={errors.weftYarnType?.message}
                      register={register}
                    />
                  )}
                </div>
              </div>

              <div className="p-4">
                <h2 className="text-xl text-[#06b6d4] font-bold dark:text-white">Delivery Details</h2>
                <div className="grid grid-cols-4 gap-4 border rounded p-4">
                  <CustomInput
                    variant="floating"
                    borderThickness="2"
                    label="Quantity"
                    value={deliveryDetails.quantity}
                    onChange={(e) => handleDeliveryDetailChange('quantity', e.target.value)}
                  />
                  {unitsOfMeasure.length === 0 && loading ? (
                    <div>Loading Units of Measure...</div>
                  ) : (
                    <CustomInputDropdown
                      label="Unit of Measure"
                      options={unitsOfMeasure}
                      selectedOption={deliveryDetails.unitOfMeasure || ''}
                      onChange={(value) => handleDeliveryDetailChange('unitOfMeasure', value)}
                      error={errors.unitOfMeasure?.message}
                      register={register}
                    />
                  )}
                  <CustomInput
                    variant="floating"
                    borderThickness="2"
                    label="LBS"
                    value={deliveryDetails.lbs}
                    onChange={(e) => handleDeliveryDetailChange('lbs', e.target.value)}
                  />
                  <CustomInput
                    variant="floating"
                    borderThickness="2"
                    label="Tolerance (%)"
                    value={deliveryDetails.tolerance}
                    onChange={(e) => handleDeliveryDetailChange('tolerance', e.target.value)}
                  />
                  <CustomInput
                    variant="floating"
                    borderThickness="2"
                    label="Rate"
                    value={deliveryDetails.rate}
                    onChange={(e) => handleDeliveryDetailChange('rate', e.target.value)}
                  />
                  <CustomInput
                    variant="floating"
                    borderThickness="2"
                    label="/LBS"
                    value={deliveryDetails.perLbs}
                    onChange={(e) => handleDeliveryDetailChange('perLbs', e.target.value)}
                  />
                  <CustomInputDropdown
                    label="Packing"
                    options={packings}
                    selectedOption={deliveryDetails.packing || ''}
                    onChange={(value) => handleDeliveryDetailChange('packing', value)}
                  />
                  <CustomInputDropdown
                    label="Piece Length"
                    options={pieceLengths}
                    selectedOption={deliveryDetails.pieceLength || ''}
                    onChange={(value) => handleDeliveryDetailChange('pieceLength', value)}
                  />
                  {paymentTerms.length === 0 && loading ? (
                    <div>Loading Payment Terms...</div>
                  ) : (
                    <CustomInputDropdown
                      label="Pay Term Seller"
                      options={paymentTerms}
                      selectedOption={deliveryDetails.payTermSeller || ''}
                      onChange={(value) => handleDeliveryDetailChange('payTermSeller', value)}
                      error={errors.paymentTermsSeller?.message}
                      register={register}
                    />
                  )}
                  {paymentTerms.length === 0 && loading ? (
                    <div>Loading Payment Terms...</div>
                  ) : (
                    <CustomInputDropdown
                      label="Pay Term Buyer"
                      options={paymentTerms}
                      selectedOption={deliveryDetails.payTermBuyer || ''}
                      onChange={(value) => handleDeliveryDetailChange('payTermBuyer', value)}
                      error={errors.paymentTermsBuyer?.message}
                      register={register}
                    />
                  )}
                  <CustomInput
                    variant="floating"
                    borderThickness="2"
                    label="Fabric Value"
                    value={deliveryDetails.fabricValue}
                    onChange={(e) => handleDeliveryDetailChange('fabricValue', e.target.value)}
                    disabled
                    className="auto-calculated-field"

                  />
                  {gstTypes.length === 0 && loading ? (
                    <div>Loading GST Types...</div>
                  ) : (
                    <CustomInputDropdown
                      label="GST Type"
                      options={gstTypes}
                      selectedOption={deliveryDetails.gst || ''}
                      onChange={(value) => handleDeliveryDetailChange('gst', value)}
                      error={errors.gst?.message}
                      register={register}
                    />
                  )}
                  <CustomInput
                    variant="floating"
                    borderThickness="2"
                    label="GST Value"
                    value={deliveryDetails.gstValue}
                    onChange={(e) => handleDeliveryDetailChange('gstValue', e.target.value)}
                    disabled
                    className="auto-calculated-field"

                  />
                  <CustomInput
                    variant="floating"
                    borderThickness="2"
                    label="Finish Width"
                    value={deliveryDetails.finishWidth}
                    onChange={(e) => handleDeliveryDetailChange('finishWidth', e.target.value)}
                  />
                  <CustomInput
                    variant="floating"
                    borderThickness="2"
                    label="Total Amount"
                    value={deliveryDetails.totalAmount}
                    onChange={(e) => handleDeliveryDetailChange('totalAmount', e.target.value)}
                    disabled
                   className="auto-calculated-field"
                  />
                  {deliveryTerms.length === 0 && loading ? (
                    <div>Loading Delivery Terms...</div>
                  ) : (
                    <CustomInputDropdown
                      label="Delivery Terms"
                      options={deliveryTerms}
                      selectedOption={deliveryDetails.deliveryTerms || ''}
                      onChange={(value) => handleDeliveryDetailChange('deliveryTerms', value)}
                      error={errors.deliveryTerms?.message}
                      register={register}
                    />
                  )}
                  <CustomInputDropdown
                    label="Commission From"
                    options={commissionFromOptions}
                    selectedOption={deliveryDetails.commissionFrom || ''}
                    onChange={(value) => handleDeliveryDetailChange('commissionFrom', value)}
                  />
                  {deliveryDetails.commissionFrom === 'Both' && (
                    <CustomInput
                      variant="floating"
                      borderThickness="2"
                      label="Seller Commission"
                      value={deliveryDetails.sellerCommission}
                      onChange={(e) => handleDeliveryDetailChange('sellerCommission', e.target.value)}
                    />
                  )}
                  {deliveryDetails.commissionFrom === 'Both' && (
                    <CustomInput
                      variant="floating"
                      borderThickness="2"
                      label="Buyer Commission"
                      value={deliveryDetails.buyerCommission}
                      onChange={(e) => handleDeliveryDetailChange('buyerCommission', e.target.value)}
                    />
                  )}
                  {commissionTypes.length === 0 && loading ? (
                    <div>Loading Commission Types...</div>
                  ) : (
                    <CustomInputDropdown
                      label="Commission Type"
                      options={commissionTypes}
                      selectedOption={deliveryDetails.commissionType || ''}
                      onChange={(value) => handleDeliveryDetailChange('commissionType', value)}
                      error={errors.commissionType?.message}
                      register={register}
                    />
                  )}
                  <CustomInput
                    variant="floating"
                    borderThickness="2"
                    label="Commission (%)"
                    value={deliveryDetails.commissionPercentage}
                    onChange={(e) => handleDeliveryDetailChange('commissionPercentage', e.target.value)}
                  />
                 <CustomInput
                    variant="floating"
                    borderThickness="2"
                    label="Commission Value"
                    value={deliveryDetails.commissionValue}
                    onChange={(e) => handleDeliveryDetailChange('commissionValue', e.target.value)}
                    disabled
                    className="auto-calculated-field"

                  />
                  <CustomInputDropdown
                    label="Dispatch Later"
                    options={dispatchLaterOptions}
                    selectedOption={deliveryDetails.dispatchLater || ''}
                    onChange={(value) => handleDeliveryDetailChange('dispatchLater', value)}
                  />
                  <CustomInput
                    variant="floating"
                    borderThickness="2"
                    label="Seller Remark"
                    value={deliveryDetails.sellerRemark}
                    onChange={(e) => handleDeliveryDetailChange('sellerRemark', e.target.value)}
                  />
                  <CustomInput
                    variant="floating"
                    borderThickness="2"
                    label="Buyer Remark"
                    value={deliveryDetails.buyerRemark}
                    onChange={(e) => handleDeliveryDetailChange('buyerRemark', e.target.value)}
                  />
                  <CustomInput
                    type="date"
                    variant="floating"
                    borderThickness="2"
                    label="Delivery Date"
                    value={deliveryDetails.deliveryDate}
                    onChange={(e) => handleDeliveryDetailChange('deliveryDate', e.target.value)}
                  />
                </div>
              </div>

              <div className="p-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl text-[#06b6d4] font-bold dark:text-white">
                    Buyer Delivery Breakups
                  </h2>
                  <Button
                    type="button"
                    onClick={addBuyerDeliveryBreakup}
                    className="bg-[#06b6d4] hover:bg-[#0891b2] text-white px-4 py-2 rounded flex items-center gap-2"
                  >
                    <MdAdd /> Add Row
                  </Button>
                </div>
                <div className="border rounded p-4 mt-2">
                  <div className="grid grid-cols-3 gap-4 font-bold">
                    <div>Qty</div>
                    <div>Del. Date</div>
                    <div>Actions</div>
                  </div>
                  {buyerDeliveryBreakups.length > 0 && (
                    <>
                      {buyerDeliveryBreakups.map((breakup, index) => (
                        <div key={index} className="grid grid-cols-3 gap-4 mt-2 items-center">
                          <CustomInput
                            variant="floating"
                            borderThickness="2"
                            label="Qty"
                            value={breakup.qty}
                            onChange={(e) =>
                              handleBuyerDeliveryBreakupChange(index, 'qty', e.target.value)
                            }
                          />
                          <CustomInput
                            type="date"
                            variant="floating"
                            borderThickness="2"
                            label="Del. Date"
                            value={breakup.deliveryDate}
                            onChange={(e) =>
                              handleBuyerDeliveryBreakupChange(index, 'deliveryDate', e.target.value)
                            }
                          />
                          <Button
                            type="button"
                            onClick={() => removeBuyerDeliveryBreakup(index)}
                            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded flex items-center gap-2"
                          >
                            <MdDelete /> Delete
                          </Button>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </div>

              <div className="p-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl text-[#06b6d4] font-bold dark:text-white">
                    Seller Delivery Breakups
                  </h2>
                  <Button
                    type="button"
                    onClick={addSellerDeliveryBreakup}
                    className="bg-[#06b6d4] hover:bg-[#0891b2] text-white px-4 py-2 rounded flex items-center gap-2"
                  >
                    <MdAdd /> Add Row
                  </Button>
                </div>
                <div className="border rounded p-4 mt-2">
                  <div className="grid grid-cols-3 gap-4 font-bold">
                    <div>Qty</div>
                    <div>Del. Date</div>
                    <div>Actions</div>
                  </div>
                  {sellerDeliveryBreakups.length > 0 && (
                    <>
                      {sellerDeliveryBreakups.map((breakup, index) => (
                        <div key={index} className="grid grid-cols-3 gap-4 mt-2 items-center">
                          <CustomInput
                            variant="floating"
                            borderThickness="2"
                            label="Qty"
                            value={breakup.qty}
                            onChange={(e) =>
                              handleSellerDeliveryBreakupChange(index, 'qty', e.target.value)
                            }
                          />
                          <CustomInput
                            type="date"
                            variant="floating"
                            borderThickness="2"
                            label="Del. Date"
                            value={breakup.deliveryDate}
                            onChange={(e) =>
                              handleSellerDeliveryBreakupChange(index, 'deliveryDate', e.target.value)
                            }
                          />
                          <Button
                            type="button"
                            onClick={() => removeSellerDeliveryBreakup(index)}
                            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded flex items-center gap-2"
                          >
                            <MdDelete /> Delete
                          </Button>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </div>

              <div className="p-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-[#06b6d4] dark:text-white">Sample Details</h2>
                  <Button
                    type="button"
                    onClick={() => setShowSamplePopup(0)}
                    className="bg-[#06b6d4] hover:bg-[#0891b2] text-white px-4 py-2 rounded flex items-center gap-2"
                  >
                    <MdInfo /> Additional Info
                  </Button>
                </div>
                <div className="border rounded-2xl p-6 mt-4 bg-gray-50 dark:bg-gray-800 shadow-sm">
                  <div className="grid grid-cols-1 gap-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Sample Quantity
                        </label>
                        <CustomInput
                          type="number"
                          variant="floating"
                          borderThickness="2"
                          label="Sample Quantity"
                          value={sampleDetails[0].sampleQty}
                          onChange={(e) => handleSampleDetailChange('sampleQty', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Received Date
                        </label>
                        <CustomInput
                          type="date"
                          variant="floating"
                          borderThickness="2"
                          label="Received Date"
                          value={sampleDetails[0].sampleReceivedDate}
                          onChange={(e) => handleSampleDetailChange('sampleReceivedDate', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Delivered Date
                        </label>
                        <CustomInput
                          type="date"
                          variant="floating"
                          borderThickness="2"
                          label="Delivered Date"
                          value={sampleDetails[0].sampleDeliveredDate}
                          onChange={(e) => handleSampleDetailChange('sampleDeliveredDate', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Created By
                        </label>
                        <CustomInput
                          variant="floating"
                          borderThickness="2"
                          label="Created By"
                          value={sampleDetails[0].createdBy}
                          onChange={(e) => handleSampleDetailChange('createdBy', e.target.value)}
                          disabled
                          className="auto-calculated-field"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Creation Date
                        </label>
                        <CustomInput
                          type="date"
                          variant="floating"
                          borderThickness="2"
                          label="Creation Date"
                          value={sampleDetails[0].creationDate}
                          onChange={(e) => handleSampleDetailChange('creationDate', e.target.value)}
                          disabled
                          className="auto-calculated-field"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {showSamplePopup !== null && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl max-w-3xl w-full shadow-2xl">
                    <h2 className="text-2xl font-bold text-[#06b6d4] dark:text-white mb-6">Additional Sample Information</h2>
                    {(sampleDetails[0].additionalInfo || []).map((info, infoIndex) => (
                      <div key={infoIndex} className="grid grid-cols-3 gap-6 mb-6 bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                        <CustomInputDropdown
                          label="End Use"
                          options={endUses}
                          selectedOption={info.endUse || ''}
                          onChange={(value) =>
                            handleAdditionalInfoChange(infoIndex, 'endUse', value)
                          }
                        />
                        <CustomInput
                          variant="floating"
                          borderThickness="2"
                          label="Count"
                          value={info.count}
                          onChange={(e) =>
                            handleAdditionalInfoChange(infoIndex, 'count', e.target.value)
                          }
                        />
                        <CustomInput
                          variant="floating"
                          borderThickness="2"
                          label="Weight"
                          value={info.weight}
                          onChange={(e) =>
                            handleAdditionalInfoChange(infoIndex, 'weight', e.target.value)
                          }
                        />
                        <CustomInput
                          variant="floating"
                          borderThickness="2"
                          label="Yarn Bags"
                          value={info.yarnBags}
                          onChange={(e) =>
                            handleAdditionalInfoChange(infoIndex, 'yarnBags', e.target.value)
                          }
                        />
                        <CustomInput
                          variant="floating"
                          borderThickness="2"
                          label="Labs"
                          value={info.labs}
                          onChange={(e) =>
                            handleAdditionalInfoChange(infoIndex, 'labs', e.target.value)
                          }
                        />
                      </div>
                    ))}
                    <div className="flex justify-between mt-6">
                      <Button
                        type="button"
                        onClick={() => addAdditionalInfoRow()}
                        className="bg-[#06b6d4] hover:bg-[#0891b2] text-white px-6 py-2 rounded-lg flex items-center gap-2"
                      >
                        <MdAdd /> Add Row
                      </Button>
                      <Button
                        type="button"
                        onClick={() => setShowSamplePopup(null)}
                        className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg"
                      >
                        Close
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="w-full h-[8vh] flex justify-end gap-2 mt-3 bg-transparent border-t-2 border-[#e7e7e7]">
          <Button
            type="submit"
            className="w-[160px] gap-2 inline-flex items-center bg-[#0e7d90] hover:bg-[#0891b2] text-white px-6 py-2 text-sm font-medium transition-all duration-200 font-mono text-base hover:translate-y-[-2px] focus:outline-none active:shadow-[#3c4fe0_0_3px_7px_inset] active:translate-y-[2px] mt-2"
            disabled={!showForm}
          >
            {id ? 'Update' : 'Save'}
          </Button>
          <Link href="/contract">
            <Button
              type="button"
              className="w-[160px] gap-2 mr-2 inline-flex items-center bg-black hover:bg-[#b0b0b0] text-white px-6 py-2 text-sm font-medium transition-all duration-200 font-mono text-base hover:translate-y-[-2px] focus:outline-none active:shadow-[#3c4fe0_0_3px_7px_inset] active:translate-y-[2px] mt-2"
            >
              Cancel
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
};

export default ContractForm;
