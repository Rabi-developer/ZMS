'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, SubmitHandler } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'react-toastify';
import CustomInput from '@/components/ui/CustomInput';
import DescriptionWithSubSelect from '@/components/ui/DescriptionWithSubSelect';
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
import { getAllSelvegeThicknesss } from '@/apis/selvegethickness';
import { getAllInductionThreads } from '@/apis/Inductionthread';
import { getAllGSMs } from '@/apis/gsm';
import { getAllSellers } from '@/apis/seller';
import { getAllBuyer } from '@/apis/buyer';
import { getAllDeliveryTerms } from '@/apis/deliveryterm';
import { getAllCommissionTypes } from '@/apis/commissiontype';
import { getAllPaymentTerms } from '@/apis/paymentterm';
import { getAllUnitOfMeasures } from '@/apis/unitofmeasure';
import { getAllGeneralSaleTextTypes } from '@/apis/generalSaleTextType';
import CustomInputDropdown from '../ui/CustomeInputDropdown';
import { getAllStuffs } from '@/apis/stuff';

// Schema Definitions
const DeliveryBreakupSchema = z.object({
  Id: z.string().optional(),
  Qty: z.string(),
  DeliveryDate: z.string(),
});

const DeliveryTermDetailSchema = z.object({
  Id: z.string().optional(),
  TermDescription: z.string(),
  EffectiveDate: z.string(),
});

const AdditionalInfoSchema = z.object({
  Id: z.string().optional(),
  EndUse: z.string(),
  Count: z.string(),
  Weight: z.string(),
  YarnBags: z.string(),
  Labs: z.string(),
});

const SampleDetailSchema = z.object({
  Id: z.string().optional(),
  SampleQty: z.string(),
  SampleReceivedDate: z.string(),
  SampleDeliveredDate: z.string(),
  CreatedBy: z.string(),
  CreationDate: z.string(),
  UpdatedBy: z.string(),
  UpdateDate: z.string(),
  AdditionalInfo: z.array(AdditionalInfoSchema),
});

const ContractSchema = z.object({
  Id: z.string().optional(),
  ContractNumber: z.string().min(1, 'Contract Number is required'),
  Date: z.string().min(1, 'Date is required'),
  ContractType: z.enum(['Sale', 'Purchase'], { required_error: 'Contract Type is required' }),
  CompanyId: z.string().min(1, 'Company is required'),
  BranchId: z.string().min(1, 'Branch is required'),
  ContractOwner: z.string().min(1, 'Contract Owner is required'),
  Seller: z.string().min(1, 'Seller is required'),
  Buyer: z.string().min(1, 'Buyer is required'),
  ReferenceNumber: z.string().optional(),
  DeliveryDate: z.string().min(1, 'Delivery Date is required'),
  Refer: z.string().optional(),
  Referdate: z.string().optional(),
  FabricType: z.string().min(1, 'Fabric Type is required'),
  Description: z.string().min(1, 'Description is required'),
  DescriptionSubOptions: z.array(z.string()).optional(),
  Stuff: z.string().min(1, 'Stuff is required'),
  StuffSubOptions: z.array(z.string()).optional(),
  BlendRatio: z.string().optional(),
  BlendType: z.array(z.string()).optional(),
  WarpCount: z.string().optional(),
  WarpYarnType: z.string().optional(),
  WarpYarnTypeSubOptions: z.array(z.string()).optional(),
  WeftCount: z.string().optional(),
  WeftYarnType: z.string().min(1, 'Weft Yarn Type is required'),
  WeftYarnTypeSubOptions: z.array(z.string()).optional(),
  NoOfEnds: z.string().optional(),
  NoOfPicks: z.string().optional(),
  Weaves: z.string().optional(),
  WeavesSubOptions: z.array(z.string()).optional(),
  PickInsertion: z.string().optional(),
  PickInsertionSubOptions: z.array(z.string()).optional(),
  Width: z.string().optional(),
  Final: z.string().optional(),
  FinalSubOptions: z.array(z.string()).optional(),
  Selvedge: z.string().optional(),
  SelvedgeSubOptions: z.array(z.string()).optional(),
  SelvedgeWeave: z.string().optional(),
  SelvedgeWeaveSubOptions: z.array(z.string()).optional(),
  SelvedgeWidth: z.string().optional(),
  SelvedgeWidthSubOptions: z.array(z.string()).optional(),
  SelvageThread: z.string().optional(),
  SelvageThreadSubOptions: z.array(z.string()).optional(),
  InductionThread: z.string().optional(),
  InductionThreadSubOptions: z.array(z.string()).optional(),
  GSM: z.string().optional(),
  GSMSubOptions: z.array(z.string()).optional(),
  EndUse: z.string().optional(),
  EndUseSubOptions: z.array(z.string()).optional(),
  Quantity: z.string().min(1, 'Quantity is required'),
  UnitOfMeasure: z.string().min(1, 'Unit of Measure is required'),
  Tolerance: z.string().optional(),
  Rate: z.string().min(1, 'Rate is required'),
  Packing: z.string().optional(),
  PieceLength: z.string().optional(),
  FabricValue: z.string().min(1, 'Fabric Value is required'),
  Gst: z.string().min(1, 'GST Type is required'),
  GstValue: z.string().optional(),
  TotalAmount: z.string().min(1, 'Total Amount is required'),
  PaymentTermsSeller: z.string().optional(),
  PaymentTermsBuyer: z.string().optional(),
  DeliveryTerms: z.string().optional(),
  CommissionFrom: z.string().optional(),
  CommissionType: z.string().optional(),
  CommissionPercentage: z.string().optional(),
  CommissionValue: z.string().optional(),
  DispatchAddress: z.string().optional(),
  SellerRemark: z.string().optional(),
  BuyerRemark: z.string().optional(),
  CreatedBy: z.string().optional(),
  CreationDate: z.string().optional(),
  UpdatedBy: z.string().optional(),
  UpdationDate: z.string().optional(),
  ApprovedBy: z.string().optional(),
  ApprovedDate: z.string().optional(),
  DispatchLater: z.string().optional(),
  SellerCommission: z.string().optional(),
  BuyerCommission: z.string().optional(),
  FinishWidth: z.string().optional(),
  Color: z.string().optional(),
  Weight: z.string().optional(),
  Shrinkage: z.string().optional(),
  Finish: z.string().optional(),
  WidthDelivery: z.string().optional(),
  LBDispNo: z.string().optional(),
  LabDispatchDate: z.string().optional(),
  BuyerDeliveryBreakups: z.array(DeliveryBreakupSchema).optional(),
  SellerDeliveryBreakups: z.array(DeliveryBreakupSchema).optional(),
  DeliveryTermDetails: z.array(DeliveryTermDetailSchema).optional(),
  SampleDetails: z.array(SampleDetailSchema).optional(),
  Notes: z.string().optional(),
  SelvegeThickness: z.string().optional(),
});

type FormData = z.infer<typeof ContractSchema>;

type ContractApiResponse = {
  id: string;
  contractNumber: string;
  date: string;
  contractType: 'Sale' | 'Purchase';
  companyId: string;
  branchId: string;
  contractOwner: string;
  seller: string;
  buyer: string;
  referenceNumber: string;
  deliveryDate: string;
  refer: string;
  referdate: string;
  fabricType: string;
  description: string;
  descriptionSubOptions: string;
  stuff: string;
  stuffSubOptions: string;
  blendRatio: string;
  blendType: string;
  warpCount: string;
  warpYarnType: string;
  warpYarnTypeSubOptions: string;
  weftCount: string;
  weftYarnType: string;
  weftYarnTypeSubOptions: string;
  noOfEnds: string;
  noOfPicks: string;
  weaves: string;
  weavesSubOptions: string;
  pickInsertion: string;
  pickInsertionSubOptions: string;
  width: string;
  final: string;
  finalSubOptions: string;
  selvege: string;
  selvedgeSubOptions: string;
  selvegeWeaves: string;
  selvedgeWeaveSubOptions: string;
  selvegeWidth: string;
  selvedgeWidthSubOptions: string;
  selvageThread: string;
  selvageThreadSubOptions: string;
  inductionThread: string;
  inductionThreadSubOptions: string;
  gsm: string;
  gsmSubOptions: string;
  endUse: string;
  endUseSubOptions: string;
  quantity: string;
  unitOfMeasure: string;
  tolerance: string;
  rate: string;
  packing: string;
  pieceLength: string;
  fabricValue: string;
  gst: string;
  gstValue: string;
  totalAmount: string;
  paymentTermsSeller: string;
  paymentTermsBuyer: string;
  deliveryTerms: string;
  commissionFrom: string;
  commissionType: string;
  commissionPercentage: string;
  commissionValue: string;
  dispatchAddress: string;
  sellerRemark: string;
  buyerRemark: string;
  createdBy: string;
  creationDate: string;
  updatedBy: string;
  updationDate: string;
  approvedBy: string;
  approvedDate: string;
  notes?: string;
  selvegeThickness?: string;
  color?: string;
  weight?: string;
  shrinkage?: string;
  finish?: string;
  widthDelivery?: string;
  lbDispNo?: string;
  labDispatchDate?: string;
  buyerDeliveryBreakups: Array<{
    id?: string;
    qty: string;
    deliveryDate: string;
  }>;
  sellerDeliveryBreakups: Array<{
    id?: string;
    qty: string;
    deliveryDate: string;
  }>;
  deliveryTermDetails: Array<{
    id?: string;
    termDescription: string;
    effectiveDate: string;
  }>;
  sampleDetails: Array<{
    id?: string;
    sampleQty: string;
    sampleReceivedDate: string;
    sampleDeliveredDate: string;
    createdBy: string;
    creationDate: string;
    updatedBy: string;
    updateDate: string;
    additionalInfo: Array<{
      id?: string;
      endUse: string;
      count: string;
      weight: string;
      yarnBags: string;
      labs: string;
    }>;
  }>;
};

type ContractFormProps = {
  id?: string;
  initialData?: Partial<ContractApiResponse>;
};

const ContractForm = ({ id, initialData }: ContractFormProps) => {
  const router = useRouter();
  const [companies, setCompanies] = useState<{ id: string; name: string }[]>([]);
  const [branches, setBranches] = useState<{ id: string; name: string }[]>([]);
  const [descriptions, setDescriptions] = useState<{ id: string; name: string; subDescription: string }[]>([]);
  const [descriptionSubOptions, setDescriptionSubOptions] = useState<string[]>([]);
  const [stuffs, setStuffs] = useState<{ id: string; name: string; subDescription: string }[]>([]);
  const [stuffSubOptions, setStuffSubOptions] = useState<string[]>([]);
  const [blendRatios, setBlendRatios] = useState<{ id: string; name: string; subDescription: string }[]>([]);
  const [blendTypeOptions, setBlendTypeOptions] = useState<string[]>([]);
  const [endUses, setEndUses] = useState<{ id: string; name: string; subDescription: string }[]>([]);
  const [endUseSubOptions, setEndUseSubOptions] = useState<string[]>([]);
  const [fabricTypes, setFabricTypes] = useState<{ id: string; name: string }[]>([]);
  const [packings, setPackings] = useState<{ id: string; name: string }[]>([]);
  const [pieceLengths, setPieceLengths] = useState<{ id: string; name: string }[]>([]);
  const [pickInsertions, setPickInsertions] = useState<{ id: string; name: string; subDescription: string }[]>([]);
  const [pickInsertionSubOptions, setPickInsertionSubOptions] = useState<string[]>([]);
  const [warpYarnTypes, setWarpYarnTypes] = useState<{ id: string; name: string; subDescription: string }[]>([]);
  const [warpYarnTypeSubOptions, setWarpYarnTypeSubOptions] = useState<string[]>([]);
  const [weftYarnTypes, setWeftYarnTypes] = useState<{ id: string; name: string; subDescription: string }[]>([]);
  const [weftYarnTypeSubOptions, setWeftYarnTypeSubOptions] = useState<string[]>([]);
  const [weaves, setWeaves] = useState<{ id: string; name: string; subDescription: string }[]>([]);
  const [weavesSubOptions, setWeavesSubOptions] = useState<string[]>([]);
  const [finals, setFinals] = useState<{ id: string; name: string; subDescription: string }[]>([]);
  const [finalSubOptions, setFinalSubOptions] = useState<string[]>([]);
  const [selvedges, setSelvedges] = useState<{ id: string; name: string; subDescription: string }[]>([]);
  const [selvedgeSubOptions, setSelvedgeSubOptions] = useState<string[]>([]);
  const [selvedgeWeaves, setSelvedgeWeaves] = useState<{ id: string; name: string; subDescription: string }[]>([]);
  const [selvedgeWeaveSubOptions, setSelvedgeWeaveSubOptions] = useState<string[]>([]);
  const [selvedgeWidths, setSelvedgeWidths] = useState<{ id: string; name: string; subDescription: string }[]>([]);
  const [selvedgeWidthSubOptions, setSelvedgeWidthSubOptions] = useState<string[]>([]);
  const [selvageThreads, setSelvageThreads] = useState<{ id: string; name: string; subDescription: string }[]>([]);
  const [selvageThreadSubOptions, setSelvageThreadSubOptions] = useState<string[]>([]);
  const [inductionThreads, setInductionThreads] = useState<{ id: string; name: string; subDescription: string }[]>([]);
  const [inductionThreadSubOptions, setInductionThreadSubOptions] = useState<string[]>([]);
  const [gsms, setGsms] = useState<{ id: string; name: string; subDescription: string }[]>([]);
  const [gsmSubOptions, setGsmSubOptions] = useState<string[]>([]);
  const [sellers, setSellers] = useState<{ id: string; name: string }[]>([]);
  const [buyers, setBuyers] = useState<{ id: string; name: string }[]>([]);
  const [deliveryTerms, setDeliveryTerms] = useState<{ id: string; name: string }[]>([]);
  const [commissionTypes, setCommissionTypes] = useState<{ id: string; name: string }[]>([]);
  const [paymentTerms, setPaymentTerms] = useState<{ id: string; name: string }[]>([]);
  const [unitsOfMeasure, setUnitsOfMeasure] = useState<{ id: string; name: string }[]>([]);
  const [gstTypes, setGstTypes] = useState<{ id: string; name: string }[]>([]);
  const [selvegeThicknesses, setSelvegeThicknesses] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [buyerDeliveryBreakups, setBuyerDeliveryBreakups] = useState<
    Array<{
      Id?: string;
      Qty: string;
      DeliveryDate: string;
    }>
  >([]);
  const [sellerDeliveryBreakups, setSellerDeliveryBreakups] = useState<
    Array<{
      Id?: string;
      Qty: string;
      DeliveryDate: string;
    }>
  >([]);
  const [deliveryTermDetails, setDeliveryTermDetails] = useState<
    Array<{
      Id?: string;
      TermDescription: string;
      EffectiveDate: string;
    }>
  >([]);
  const [sampleDetails, setSampleDetails] = useState<
    Array<{
      Id?: string;
      SampleQty: string;
      SampleReceivedDate: string;
      SampleDeliveredDate: string;
      CreatedBy: string;
      CreationDate: string;
      UpdatedBy: string;
      UpdateDate: string;
      AdditionalInfo: Array<{
        Id?: string;
        EndUse: string;
        Count: string;
        Weight: string;
        YarnBags: string;
        Labs: string;
      }>;
    }>
  >([
    {
      Id: undefined,
      SampleQty: '',
      SampleReceivedDate: '',
      SampleDeliveredDate: '',
      CreatedBy: 'Current User',
      CreationDate: new Date().toISOString().split('T')[0],
      UpdatedBy: '',
      UpdateDate: '',
      AdditionalInfo: [
        {
          Id: undefined,
          EndUse: '',
          Count: '',
          Weight: '',
          YarnBags: '',
          Labs: '',
        },
      ],
    },
  ]);
  const [showSamplePopup, setShowSamplePopup] = useState<number | null>(null);
  const currentUser = 'Current User';

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
    trigger,
  } = useForm<FormData>({
    resolver: zodResolver(ContractSchema),
    defaultValues: {
      ContractType: 'Sale',
      BuyerDeliveryBreakups: [],
      SellerDeliveryBreakups: [],
      DeliveryTermDetails: [],
      SampleDetails: [
        {
          SampleQty: '',
          SampleReceivedDate: '',
          SampleDeliveredDate: '',
          CreatedBy: 'Current User',
          CreationDate: new Date().toISOString().split('T')[0],
          UpdatedBy: '',
          UpdateDate: '',
          AdditionalInfo: [
            {
              EndUse: '',
              Count: '',
              Weight: '',
              YarnBags: '',
              Labs: '',
            },
          ],
        },
      ],
      Notes: '',
      BlendType: [],
      DescriptionSubOptions: [],
      StuffSubOptions: [],
      WarpYarnTypeSubOptions: [],
      WeftYarnTypeSubOptions: [],
      WeavesSubOptions: [],
      PickInsertionSubOptions: [],
      FinalSubOptions: [],
      SelvedgeSubOptions: [],
      SelvedgeWeaveSubOptions: [],
      SelvedgeWidthSubOptions: [],
      SelvageThreadSubOptions: [],
      InductionThreadSubOptions: [],
      GSMSubOptions: [],
      EndUseSubOptions: [],
    },
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

  // Fetch Data Functions
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
          subDescription: desc.subDescription || '',
        })),
      );
    } catch (error) {
      console.error('Error fetching descriptions:', error);
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

  const fetchBlendRatios = async () => {
    try {
      setLoading(true);
      const response = await getAllBlendRatios();
      setBlendRatios(
        response.data.map((item: any) => ({
          id: item.listid,
          name: item.descriptions,
          subDescription: item.subDescription || '',
        })),
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
          subDescription: item.subDescription || '',
        })),
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
        })),
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
        })),
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
        })),
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
          subDescription: item.subDescription || '',
        })),
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
          subDescription: item.subDescription || '',
        })),
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
          subDescription: item.subDescription || '',
        })),
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
          subDescription: item.subDescription || '',
        })),
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
          subDescription: item.subDescription || '',
        })),
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
          subDescription: item.subDescription || '',
        })),
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
          subDescription: item.subDescription || '',
        })),
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
          subDescription: item.subDescription || '',
        })),
      );
    } catch (error) {
      console.error('Error fetching selvedge widths:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSelvageThreads = async () => {
    try {
      setLoading(true);
      const response = await getAllSelvegeThicknesss();
      setSelvageThreads(
        response.data.map((item: any) => ({
          id: item.listid,
          name: item.descriptions,
          subDescription: item.subDescription || '',
        })),
      );
    } catch (error) {
      console.error('Error fetching selvage threads:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchInductionThreads = async () => {
    try {
      setLoading(true);
      const response = await getAllInductionThreads();
      setInductionThreads(
        response.data.map((item: any) => ({
          id: item.listid,
          name: item.descriptions,
          subDescription: item.subDescription || '',
        })),
      );
    } catch (error) {
      console.error('Error fetching induction threads:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchGsms = async () => {
    try {
      setLoading(true);
      const response = await getAllGSMs();
      setGsms(
        response.data.map((item: any) => ({
          id: item.listid,
          name: item.descriptions,
          subDescription: item.subDescription || '',
        })),
      );
    } catch (error) {
      console.error('Error fetching GSMs:', error);
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
          name: seller.sellerName,
        })),
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
          name: buyer.buyerName,
        })),
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
        })),
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
        })),
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
        })),
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
        })),
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
        })),
      );
    } catch (error) {
      console.error('Error fetching GST types:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSelvegeThicknesses = async () => {
    try {
      setLoading(true);
      const response = await getAllSelvegeThicknesss();
      setSelvegeThicknesses(
        response.data.map((item: any) => ({
          id: item.listid,
          name: item.descriptions,
        })),
      );
    } catch (error) {
      console.error('Error fetching selvege thicknesses:', error);
    } finally {
      setLoading(false);
    }
  };

  const companyId = watch('CompanyId');
  const branchId = watch('BranchId');
  const quantity = watch('Quantity');
  const rate = watch('Rate');
  const gst = watch('Gst');
  const commissionType = watch('CommissionType');
  const commissionPercentage = watch('CommissionPercentage');

  useEffect(() => {
    setShowForm(!!companyId && !!branchId);
  }, [companyId, branchId]);

  // Calculate Fabric Value, GST Value, Total Amount, and Commission Value
  useEffect(() => {
    const qty = parseFloat(quantity || '0');
    const rt = parseFloat(rate || '0');
    const fabricValue = (qty * rt).toFixed(2);
    setValue('FabricValue', fabricValue, { shouldValidate: true });

    const selectedGst = gstTypes.find((g) => g.id === gst);
    let gstValue = '0.00';
    if (selectedGst) {
      const percentage = parseFloat(selectedGst.name.replace('% GST', '')) || 0;
      gstValue = ((parseFloat(fabricValue) * percentage) / 100).toFixed(2);
    }
    setValue('GstValue', gstValue, { shouldValidate: true });

    const totalAmount = (parseFloat(fabricValue) + parseFloat(gstValue)).toFixed(2);
    setValue('TotalAmount', totalAmount, { shouldValidate: true });

    let commissionValue = '0.00';
    const commissionInput = parseFloat(commissionPercentage || '0');
    if (commissionType) {
      const commissionTypeName = commissionTypes.find(
        (type) => type.id === commissionType,
      )?.name.toLowerCase();
      if (commissionTypeName === 'on value' && commissionInput > 0 && parseFloat(totalAmount) > 0) {
        commissionValue = ((parseFloat(totalAmount) * commissionInput) / 100).toFixed(2);
      } else if (commissionTypeName === 'on qty' && commissionInput > 0 && qty > 0) {
        commissionValue = (qty * commissionInput).toFixed(2);
      }
    }
    setValue('CommissionValue', commissionValue, { shouldValidate: true });
  }, [quantity, rate, gst, commissionType, commissionPercentage, gstTypes, commissionTypes, setValue]);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);
        await Promise.all([
          fetchCompanies(),
          fetchBranches(),
          fetchDescriptions(),
          fetchStuffs(),
          fetchBlendRatios(),
          fetchEndUses(),
          fetchFabricTypes(),
          fetchPackings(),
          fetchPieceLengths(),
          fetchPickInsertions(),
          fetchWarpYarnTypes(),
          fetchWeftYarnTypes(),
          fetchWeaves(),
          fetchFinals(),
          fetchSelvedges(),
          fetchSelvedgeWeaves(),
          fetchSelvedgeWidths(),
          fetchSelvageThreads(),
          fetchInductionThreads(),
          fetchGsms(),
          fetchSellers(),
          fetchBuyers(),
          fetchDeliveryTerms(),
          fetchCommissionTypes(),
          fetchPaymentTerms(),
          fetchUnitsOfMeasure(),
          fetchGstTypes(),
          fetchSelvegeThicknesses(),
        ]);

        if (initialData) {
          setTimeout(() => {
            const formattedData = {
              ...initialData,
              ContractType: initialData.contractType || 'Sale',
              CompanyId: initialData.companyId || '',
              BranchId: initialData.branchId || '',
              ContractNumber: initialData.contractNumber || '',
              Date: initialData.date || '',
              ContractOwner: initialData.contractOwner || '',
              Seller: initialData.seller || '',
              Buyer: initialData.buyer || '',
              ReferenceNumber: initialData.referenceNumber || '',
              DeliveryDate: initialData.deliveryDate || '',
              Refer: initialData.refer || '',
              Referdate: initialData.referdate || '',
              FabricType: initialData.fabricType || '',
              Description: initialData.description || '',
              DescriptionSubOptions: initialData.descriptionSubOptions
                ? initialData.descriptionSubOptions.split(',').map((s) => s.trim())
                : [],
              Stuff: initialData.stuff || '',
              StuffSubOptions: initialData.stuffSubOptions
                ? initialData.stuffSubOptions.split(',').map((s) => s.trim())
                : [],
              BlendRatio: initialData.blendRatio || '',
              BlendType: initialData.blendType
                ? initialData.blendType.split(',').map((s) => s.trim())
                : [],
              WarpCount: initialData.warpCount || '',
              WarpYarnType: initialData.warpYarnType || '',
              WarpYarnTypeSubOptions: initialData.warpYarnTypeSubOptions
                ? initialData.warpYarnTypeSubOptions.split(',').map((s) => s.trim())
                : [],
              WeftCount: initialData.weftCount || '',
              WeftYarnType: initialData.weftYarnType || '',
              WeftYarnTypeSubOptions: initialData.weftYarnTypeSubOptions
                ? initialData.weftYarnTypeSubOptions.split(',').map((s) => s.trim())
                : [],
              NoOfEnds: initialData.noOfEnds || '',
              NoOfPicks: initialData.noOfPicks || '',
              Weaves: initialData.weaves || '',
              WeavesSubOptions: initialData.weavesSubOptions
                ? initialData.weavesSubOptions.split(',').map((s) => s.trim())
                : [],
              PickInsertion: initialData.pickInsertion || '',
              PickInsertionSubOptions: initialData.pickInsertionSubOptions
                ? initialData.pickInsertionSubOptions.split(',').map((s) => s.trim())
                : [],
              Width: initialData.width || '',
              Final: initialData.final || '',
              FinalSubOptions: initialData.finalSubOptions
                ? initialData.finalSubOptions.split(',').map((s) => s.trim())
                : [],
              Selvedge: initialData.selvege || '',
              SelvedgeSubOptions: initialData.selvedgeSubOptions
                ? initialData.selvedgeSubOptions.split(',').map((s) => s.trim())
                : [],
              SelvedgeWeave: initialData.selvegeWeaves || '',
              SelvedgeWeaveSubOptions: initialData.selvedgeWeaveSubOptions
                ? initialData.selvedgeWeaveSubOptions.split(',').map((s) => s.trim())
                : [],
              SelvedgeWidth: initialData.selvegeWidth || '',
              SelvedgeWidthSubOptions: initialData.selvedgeWidthSubOptions
                ? initialData.selvedgeWidthSubOptions.split(',').map((s) => s.trim())
                : [],
              SelvageThread: initialData.selvageThread || '',
              SelvageThreadSubOptions: initialData.selvageThreadSubOptions
                ? initialData.selvageThreadSubOptions.split(',').map((s) => s.trim())
                : [],
              InductionThread: initialData.inductionThread || '',
              InductionThreadSubOptions: initialData.inductionThreadSubOptions
                ? initialData.inductionThreadSubOptions.split(',').map((s) => s.trim())
                : [],
              GSM: initialData.gsm || '',
              GSMSubOptions: initialData.gsmSubOptions
                ? initialData.gsmSubOptions.split(',').map((s) => s.trim())
                : [],
              EndUse: initialData.endUse || '',
              EndUseSubOptions: initialData.endUseSubOptions
                ? initialData.endUseSubOptions.split(',').map((s) => s.trim())
                : [],
              Quantity: initialData.quantity || '',
              UnitOfMeasure: initialData.unitOfMeasure || '',
              Tolerance: initialData.tolerance || '',
              Rate: initialData.rate || '',
              Packing: initialData.packing || '',
              PieceLength: initialData.pieceLength || '',
              FabricValue: initialData.fabricValue || '',
              Gst: initialData.gst || '',
              GstValue: initialData.gstValue || '',
              TotalAmount: initialData.totalAmount || '',
              PaymentTermsSeller: initialData.paymentTermsSeller || '',
              PaymentTermsBuyer: initialData.paymentTermsBuyer || '',
              DeliveryTerms: initialData.deliveryTerms || '',
              CommissionFrom: initialData.commissionFrom || '',
              CommissionType: initialData.commissionType || '',
              CommissionPercentage: initialData.commissionPercentage || '',
              CommissionValue: initialData.commissionValue || '',
              DispatchAddress: initialData.dispatchAddress || '',
              SellerRemark: initialData.sellerRemark || '',
              BuyerRemark: initialData.buyerRemark || '',
              CreatedBy: initialData.createdBy || '',
              CreationDate: initialData.creationDate || '',
              UpdatedBy: initialData.updatedBy || '',
              UpdationDate: initialData.updationDate || '',
              ApprovedBy: initialData.approvedBy || '',
              ApprovedDate: initialData.approvedDate || '',
              Notes: initialData.notes || '',
              SelvegeThickness: initialData.selvegeThickness || '',
              Color: initialData.color || '',
              Weight: initialData.weight || '',
              Shrinkage: initialData.shrinkage || '',
              Finish: initialData.finish || '',
              WidthDelivery: initialData.widthDelivery || '',
              LBDispNo: initialData.lbDispNo || '',
              LabDispatchDate: initialData.labDispatchDate || '',
              BuyerDeliveryBreakups:
                initialData.buyerDeliveryBreakups?.map((breakup) => ({
                  Id: breakup.id,
                  Qty: breakup.qty,
                  DeliveryDate: breakup.deliveryDate,
                })) || [],
              SellerDeliveryBreakups:
                initialData.sellerDeliveryBreakups?.map((breakup) => ({
                  Id: breakup.id,
                  Qty: breakup.qty,
                  DeliveryDate: breakup.deliveryDate,
                })) || [],
              DeliveryTermDetails:
                initialData.deliveryTermDetails?.map((detail) => ({
                  Id: detail.id,
                  TermDescription: detail.termDescription,
                  EffectiveDate: detail.effectiveDate,
                })) || [],
              SampleDetails:
                initialData.sampleDetails?.map((detail) => ({
                  Id: detail.id,
                  SampleQty: detail.sampleQty,
                  SampleReceivedDate: detail.sampleReceivedDate,
                  SampleDeliveredDate: detail.sampleDeliveredDate,
                  CreatedBy: detail.createdBy,
                  CreationDate: detail.creationDate,
                  UpdatedBy: detail.updatedBy,
                  UpdateDate: detail.updateDate,
                  AdditionalInfo:
                    detail.additionalInfo?.map((info) => ({
                      Id: info.id,
                      EndUse: info.endUse,
                      Count: info.count,
                      Weight: info.weight,
                      YarnBags: info.yarnBags,
                      Labs: info.labs,
                    })) || [],
                })) || [],
            };

            reset(formattedData);
            setDescriptionSubOptions(formattedData.DescriptionSubOptions);
            setStuffSubOptions(formattedData.StuffSubOptions);
            setBlendTypeOptions(formattedData.BlendType);
            setWarpYarnTypeSubOptions(formattedData.WarpYarnTypeSubOptions);
            setWeftYarnTypeSubOptions(formattedData.WeftYarnTypeSubOptions);
            setWeavesSubOptions(formattedData.WeavesSubOptions);
            setPickInsertionSubOptions(formattedData.PickInsertionSubOptions);
            setFinalSubOptions(formattedData.FinalSubOptions);
            setSelvedgeSubOptions(formattedData.SelvedgeSubOptions);
            setSelvedgeWeaveSubOptions(formattedData.SelvedgeWeaveSubOptions);
            setSelvedgeWidthSubOptions(formattedData.SelvedgeWidthSubOptions);
            setSelvageThreadSubOptions(formattedData.SelvageThreadSubOptions);
            setInductionThreadSubOptions(formattedData.InductionThreadSubOptions);
            setGsmSubOptions(formattedData.GSMSubOptions);
            setEndUseSubOptions(formattedData.EndUseSubOptions);
            setBuyerDeliveryBreakups(formattedData.BuyerDeliveryBreakups);
            setSellerDeliveryBreakups(formattedData.SellerDeliveryBreakups);
            setDeliveryTermDetails(formattedData.DeliveryTermDetails);
            setSampleDetails(formattedData.SampleDetails);

            Object.keys(formattedData).forEach((key) => {
              trigger(key as keyof FormData);
            });
          }, 100);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [initialData, reset, trigger]);

  const handleBuyerDeliveryBreakupChange = (index: number, field: string, value: string) => {
    const updatedBreakups = [...buyerDeliveryBreakups];
    updatedBreakups[index] = { ...updatedBreakups[index], [field]: value };
    setBuyerDeliveryBreakups(updatedBreakups);
  };

  const handleSellerDeliveryBreakupChange = (index: number, field: string, value: string) => {
    const updatedBreakups = [...sellerDeliveryBreakups];
    updatedBreakups[index] = { ...updatedBreakups[index], [field]: value };
    setSellerDeliveryBreakups(updatedBreakups);
  };

  const handleDeliveryTermDetailChange = (index: number, field: string, value: string) => {
    const updatedDetails = [...deliveryTermDetails];
    updatedDetails[index] = { ...updatedDetails[index], [field]: value };
    setDeliveryTermDetails(updatedDetails);
  };

  const handleSampleDetailChange = (index: number, field: string, value: string) => {
    const updatedSampleDetails = [...sampleDetails];
    updatedSampleDetails[index] = { ...updatedSampleDetails[index], [field]: value };
    if (field === 'CreatedBy' && value) {
      updatedSampleDetails[index].CreationDate = new Date().toISOString().split('T')[0];
    }
    if (field === 'UpdatedBy' && value) {
      updatedSampleDetails[index].UpdateDate = new Date().toISOString().split('T')[0];
    }
    setSampleDetails(updatedSampleDetails);
  };

  const handleAdditionalInfoChange = (
    sampleIndex: number,
    infoIndex: number,
    field: string,
    value: string,
  ) => {
    const updatedSampleDetails = [...sampleDetails];
    updatedSampleDetails[sampleIndex].AdditionalInfo[infoIndex] = {
      ...updatedSampleDetails[sampleIndex].AdditionalInfo[infoIndex],
      [field]: value,
    };
    setSampleDetails(updatedSampleDetails);
  };

  const addBuyerDeliveryBreakup = () => {
    setBuyerDeliveryBreakups([...buyerDeliveryBreakups, { Id: undefined, Qty: '', DeliveryDate: '' }]);
  };

  const addSellerDeliveryBreakup = () => {
    setSellerDeliveryBreakups([...sellerDeliveryBreakups, { Id: undefined, Qty: '', DeliveryDate: '' }]);
  };

  const addDeliveryTermDetail = () => {
    setDeliveryTermDetails([...deliveryTermDetails, { Id: undefined, TermDescription: '', EffectiveDate: '' }]);
  };

  const addSampleDetail = () => {
    setSampleDetails([
      ...sampleDetails,
      {
        Id: undefined,
        SampleQty: '',
        SampleReceivedDate: '',
        SampleDeliveredDate: '',
        CreatedBy: 'Current User',
        CreationDate: new Date().toISOString().split('T')[0],
        UpdatedBy: '',
        UpdateDate: '',
        AdditionalInfo: [
          {
            Id: undefined,
            EndUse: '',
            Count: '',
            Weight: '',
            YarnBags: '',
            Labs: '',
          },
        ],
      },
    ]);
  };

  const removeBuyerDeliveryBreakup = (index: number) => {
    const updatedBreakups = buyerDeliveryBreakups.filter((_, i) => i !== index);
    setBuyerDeliveryBreakups(updatedBreakups);
  };

  const removeSellerDeliveryBreakup = (index: number) => {
    const updatedBreakups = sellerDeliveryBreakups.filter((_, i) => i !== index);
    setSellerDeliveryBreakups(updatedBreakups);
  };

  const removeDeliveryTermDetail = (index: number) => {
    const updatedDetails = deliveryTermDetails.filter((_, i) => i !== index);
    setDeliveryTermDetails(updatedDetails);
  };

  const removeSampleDetail = (index: number) => {
    const updatedSampleDetails = sampleDetails.filter((_, i) => i !== index);
    setSampleDetails(updatedSampleDetails);
  };

  const addAdditionalInfo = (sampleIndex: number) => {
    const updatedSampleDetails = [...sampleDetails];
    updatedSampleDetails[sampleIndex].AdditionalInfo.push({
      Id: undefined,
      EndUse: '',
      Count: '',
      Weight: '',
      YarnBags: '',
      Labs: '',
    });
    setSampleDetails(updatedSampleDetails);
  };

  const removeAdditionalInfo = (sampleIndex: number, infoIndex: number) => {
    const updatedSampleDetails = [...sampleDetails];
    updatedSampleDetails[sampleIndex].AdditionalInfo = updatedSampleDetails[sampleIndex].AdditionalInfo.filter(
      (_, i) => i !== infoIndex,
    );
    setSampleDetails(updatedSampleDetails);
  };

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    try {
      const payload = {
        id: id || undefined,
        contractNumber: data.ContractNumber,
        date: data.Date,
        contractType: data.ContractType,
        companyId: data.CompanyId,
        branchId: data.BranchId,
        contractOwner: data.ContractOwner,
        seller: data.Seller,
        buyer: data.Buyer,
        referenceNumber: data.ReferenceNumber || '',
        deliveryDate: data.DeliveryDate,
        refer: data.Refer || '',
        referdate: data.Referdate || '',
        fabricType: data.FabricType,
        description: data.Description,
        descriptionSubOptions: data.DescriptionSubOptions?.join(',') || '',
        stuff: data.Stuff,
        stuffSubOptions: data.StuffSubOptions?.join(',') || '',
        blendRatio: data.BlendRatio || '',
        blendType: data.BlendType?.join(',') || '',
        warpCount: data.WarpCount || '',
        warpYarnType: data.WarpYarnType || '',
        warpYarnTypeSubOptions: data.WarpYarnTypeSubOptions?.join(',') || '',
        weftCount: data.WeftCount || '',
        weftYarnType: data.WeftYarnType,
        weftYarnTypeSubOptions: data.WeftYarnTypeSubOptions?.join(',') || '',
        noOfEnds: data.NoOfEnds || '',
        noOfPicks: data.NoOfPicks || '',
        weaves: data.Weaves || '',
        weavesSubOptions: data.WeavesSubOptions?.join(',') || '',
        pickInsertion: data.PickInsertion || '',
        pickInsertionSubOptions: data.PickInsertionSubOptions?.join(',') || '',
        width: data.Width || '',
        final: data.Final || '',
        finalSubOptions: data.FinalSubOptions?.join(',') || '',
        selvege: data.Selvedge || '',
        selvedgeSubOptions: data.SelvedgeSubOptions?.join(',') || '',
        selvegeWeaves: data.SelvedgeWeave || '',
        selvedgeWeaveSubOptions: data.SelvedgeWeaveSubOptions?.join(',') || '',
        selvedgeWidth: data.SelvedgeWidth || '',
        selvedgeWidthSubOptions: data.SelvedgeWidthSubOptions?.join(',') || '',
        selvageThread: data.SelvageThread || '',
        selvageThreadSubOptions: data.SelvageThreadSubOptions?.join(',') || '',
        inductionThread: data.InductionThread || '',
        inductionThreadSubOptions: data.InductionThreadSubOptions?.join(',') || '',
        gsm: data.GSM || '',
        gsmSubOptions: data.GSMSubOptions?.join(',') || '',
        endUse: data.EndUse || '',
        endUseSubOptions: data.EndUseSubOptions?.join(',') || '',
        quantity: data.Quantity,
        unitOfMeasure: data.UnitOfMeasure,
        tolerance: data.Tolerance || '',
        rate: data.Rate,
        packing: data.Packing || '',
        pieceLength: data.PieceLength || '',
        fabricValue: data.FabricValue,
        gst: data.Gst,
        gstValue: data.GstValue || '',
        totalAmount: data.TotalAmount,
        paymentTermsSeller: data.PaymentTermsSeller || '',
        paymentTermsBuyer: data.PaymentTermsBuyer || '',
        deliveryTerms: data.DeliveryTerms || '',
        commissionFrom: data.CommissionFrom || '',
        commissionType: data.CommissionType || '',
        commissionPercentage: data.CommissionPercentage || '',
        commissionValue: data.CommissionValue || '',
        dispatchAddress: data.DispatchAddress || '',
        sellerRemark: data.SellerRemark || '',
        buyerRemark: data.BuyerRemark || '',
        createdBy: data.CreatedBy || '',
        creationDate: data.CreationDate || '',
        updatedBy: data.UpdatedBy || '',
        updationDate: data.UpdationDate || '',
        approvedBy: data.ApprovedBy || '',
        approvedDate: data.ApprovedDate || '',
        notes: data.Notes || '',
        selvegeThickness: data.SelvegeThickness || '',
        color: data.Color || '',
        weight: data.Weight || '',
        shrinkage: data.Shrinkage || '',
        finish: data.Finish || '',
        widthDelivery: data.WidthDelivery || '',
        lbDispNo: data.LBDispNo || '',
        labDispatchDate: data.LabDispatchDate || '',
        buyerDeliveryBreakups: buyerDeliveryBreakups.map((breakup) => ({
          id: breakup.Id || undefined,
          qty: breakup.Qty,
          deliveryDate: breakup.DeliveryDate,
        })),
        sellerDeliveryBreakups: sellerDeliveryBreakups.map((breakup) => ({
          id: breakup.Id || undefined,
          qty: breakup.Qty,
          deliveryDate: breakup.DeliveryDate,
        })),
        deliveryTermDetails: deliveryTermDetails.map((detail) => ({
          id: detail.Id || undefined,
          termDescription: detail.TermDescription,
          effectiveDate: detail.EffectiveDate,
        })),
        sampleDetails: sampleDetails.map((detail) => ({
          id: detail.Id || '',
          sampleQty: detail.SampleQty,
          sampleReceivedDate: detail.SampleReceivedDate,
          sampleDeliveredDate: detail.SampleDeliveredDate,
          createdBy: detail.CreatedBy,
          creationDate: detail.CreationDate,
          updatedBy: detail.UpdatedBy || '',
          updateDate: detail.UpdateDate,
          additionalInfo: detail.AdditionalInfo.map((info) => ({
            id: info.Id || undefined,
            endUse: info.EndUse,
            count: info.Count,
            weight: info.Weight,
            yarnBags: info.YarnBags,
            labs: info.Labs,
          })),
        })),
      };

      const cleanPayload = Object.fromEntries(
        Object.entries(payload).filter(([_, value]) => {
          if (Array.isArray(value)) {
            return value.length > 0;
          }
          return value !== undefined && value !== null && value !== '';
        }),
      );

      console.log('Form Payload:', JSON.stringify(cleanPayload, null, 2));
      let response;
      if (id) {
        response = await updateContract(id, cleanPayload);
        toast('Contract Updated Successfully', { type: 'success' });
      } else {
        response = await createContract(cleanPayload);
        toast('Contract Created Successfully', { type: 'success' });
      }
      reset();
      router.push('/contract');
    } catch (error) {
      console.error('Error submitting form:', error);
      toast('Error submitting contract', { type: 'error' });
    }
  };

  return (
    <div className="container mx-auto bg-white shadow-lg rounded-lg dark:bg-[#030630] p-6">
      <div className="w-full bg-[#06b6d4] h-[7vh] rounded-t-lg flex items-center">
        <h1 className="text-2xl font-mono ml-6 text-white flex items-center gap-2">
          <MdAddBusiness />
          {id ? 'EDIT CONTRACT' : 'ADD NEW CONTRACT'}
        </h1>
      </div>

      <div className="flex flex-col gap-6">
        <div className="flex flex-row gap-6">
          <div className="w-[100%]">
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="flex flex-row gap-6 p-6">
                <div className="w-11/12 space-y-6">
                  <div className="border rounded-lg p-6 bg-gray-50 dark:bg-gray-800">
                    <h2 className="text-xl font-bold text-[#06b6d4] dark:text-white mb-4">General Information</h2>
                    <div className="grid grid-cols-5 gap-4">
                      <CustomInputDropdown
                        label="Company"
                        options={companies}
                        selectedOption={watch('CompanyId') || ''}
                        onChange={(value) => setValue('CompanyId', value, { shouldValidate: true })}
                        error={errors.CompanyId?.message}
                        register={register}
                      />
                      <CustomInputDropdown
                        label="Branch"
                        options={branches}
                        selectedOption={watch('BranchId') || ''}
                        onChange={(value) => setValue('BranchId', value, { shouldValidate: true })}
                        error={errors.BranchId?.message}
                        register={register}
                      />
                      <CustomInput
                        variant="floating"
                        borderThickness="2"
                        label="Contract Number"
                        id="ContractNumber"
                        {...register('ContractNumber')}
                        error={errors.ContractNumber?.message}
                      />
                      <CustomInput
                        type="date"
                        variant="floating"
                        borderThickness="2"
                        label="Date"
                        id="Date"
                        {...register('Date')}
                        error={errors.Date?.message}
                      />
                      <CustomInputDropdown
                        label="Contract Type"
                        options={contractTypes}
                        selectedOption={watch('ContractType') || 'Sale'}
                        onChange={(value) =>
                          setValue('ContractType', value as 'Sale' | 'Purchase', { shouldValidate: true })
                        }
                        error={errors.ContractType?.message}
                        register={register}
                      />
                      <CustomInput
                        variant="floating"
                        borderThickness="2"
                        label="Contract Owner"
                        id="ContractOwner"
                        {...register('ContractOwner')}
                        error={errors.ContractOwner?.message}
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
                      <CustomInput
                        variant="floating"
                        borderThickness="2"
                        label="Reference #"
                        id="ReferenceNumber"
                        {...register('ReferenceNumber')}
                        error={errors.ReferenceNumber?.message}
                      />
                      <CustomInput
                        type="date"
                        variant="floating"
                        borderThickness="2"
                        label="Refer Date"
                        id="Referdate"
                        {...register('Referdate')}
                        error={errors.Referdate?.message}
                      />
                      <CustomInput
                        variant="floating"
                        borderThickness="2"
                        label="Refer.#"
                        id="Refer"
                        {...register('Refer')}
                        error={errors.Refer?.message}
                      />
                      <CustomInputDropdown
                        label="Fabric Type"
                        options={fabricTypes}
                        selectedOption={watch('FabricType') || ''}
                        onChange={(value) => setValue('FabricType', value, { shouldValidate: true })}
                        error={errors.FabricType?.message}
                        register={register}
                      />
                    </div>
                  </div>

                  <div className="border rounded-lg p-6 bg-gray-50 dark:bg-gray-800">
                    <h2 className="text-xl font-bold text-[#06b6d4] dark:text-white mb-4">Items</h2>
                    <div className="grid grid-cols-6 gap-4">
                      <DescriptionWithSubSelect
                        label="Description"
                        name="Description"
                        subName="DescriptionSubOptions"
                        options={descriptions}
                        selectedOption={watch('Description') || ''}
                        selectedSubOptions={watch('DescriptionSubOptions') || []}
                        onChange={(value) => setValue('Description', value, { shouldValidate: true })}
                        onSubChange={(values) => setValue('DescriptionSubOptions', values, { shouldValidate: true })}
                        error={errors.Description?.message}
                        subError={errors.DescriptionSubOptions?.message}
                        register={register}
                      />
                      <DescriptionWithSubSelect
                        label="Stuff"
                        name="Stuff"
                        subName="StuffSubOptions"
                        options={stuffs}
                        selectedOption={watch('Stuff') || ''}
                        selectedSubOptions={watch('StuffSubOptions') || []}
                        onChange={(value) => setValue('Stuff', value, { shouldValidate: true })}
                        onSubChange={(values) => setValue('StuffSubOptions', values, { shouldValidate: true })}
                        error={errors.Stuff?.message}
                        subError={errors.StuffSubOptions?.message}
                        register={register}
                      />
                      <DescriptionWithSubSelect
                        label="Blend Ratio"
                        name="BlendRatio"
                        subName="BlendType"
                        options={blendRatios}
                        selectedOption={watch('BlendRatio') || ''}
                        selectedSubOptions={watch('BlendType') || []}
                        onChange={(value) => setValue('BlendRatio', value, { shouldValidate: true })}
                        onSubChange={(values) => setValue('BlendType', values, { shouldValidate: true })}
                        error={errors.BlendRatio?.message}
                        subError={errors.BlendType?.message}
                        register={register}
                      />
                      <CustomInput
                        variant="floating"
                        borderThickness="2"
                        label="Warp Count"
                        id="WarpCount"
                        {...register('WarpCount')}
                        error={errors.WarpCount?.message}
                      />
                      <DescriptionWithSubSelect
                        label="Warp Yarn Type"
                        name="WarpYarnType"
                        subName="WarpYarnTypeSubOptions"
                        options={warpYarnTypes}
                        selectedOption={watch('WarpYarnType') || ''}
                        selectedSubOptions={watch('WarpYarnTypeSubOptions') || []}
                        onChange={(value) => setValue('WarpYarnType', value, { shouldValidate: true })}
                        onSubChange={(values) => setValue('WarpYarnTypeSubOptions', values, { shouldValidate: true })}
                        error={errors.WarpYarnType?.message}
                        subError={errors.WarpYarnTypeSubOptions?.message}
                        register={register}
                      />
                      <CustomInput
                        variant="floating"
                        borderThickness="2"
                        label="Weft Count"
                        id="WeftCount"
                        {...register('WeftCount')}
                        error={errors.WeftCount?.message}
                      />
                      {weftYarnTypes.length === 0 && loading ? (
                        <div>Loading Weft Yarn Types...</div>
                      ) : (
                        <DescriptionWithSubSelect
                          label="Weft Yarn Type"
                          name="WeftYarnType"
                          subName="WeftYarnTypeSubOptions"
                          options={weftYarnTypes}
                          selectedOption={watch('WeftYarnType') || ''}
                          selectedSubOptions={watch('WeftYarnTypeSubOptions') || []}
                          onChange={(value) => setValue('WeftYarnType', value, { shouldValidate: true })}
                          onSubChange={(values) => setValue('WeftYarnTypeSubOptions', values, { shouldValidate: true })}
                          error={errors.WeftYarnType?.message}
                          subError={errors.WeftYarnTypeSubOptions?.message}
                          register={register}
                        />
                      )}
                      <CustomInput
                        type="number"
                        variant="floating"
                        borderThickness="2"
                        label="No. of Ends"
                        id="NoOfEnds"
                        {...register('NoOfEnds')}
                        error={errors.NoOfEnds?.message}
                      />
                      <CustomInput
                        type="number"
                        variant="floating"
                        borderThickness="2"
                        label="No. of Picks"
                        id="NoOfPicks"
                        {...register('NoOfPicks')}
                        error={errors.NoOfPicks?.message}
                      />
                      {weaves.length === 0 && loading ? (
                        <div>Loading Weaves...</div>
                      ) : (
                        <DescriptionWithSubSelect
                          label="Weaves"
                          name="Weaves"
                          subName="WeavesSubOptions"
                          options={weaves}
                          selectedOption={watch('Weaves') || ''}
                          selectedSubOptions={watch('WeavesSubOptions') || []}
                          onChange={(value) => setValue('Weaves', value, { shouldValidate: true })}
                          onSubChange={(values) => setValue('WeavesSubOptions', values, { shouldValidate: true })}
                          error={errors.Weaves?.message}
                          subError={errors.WeavesSubOptions?.message}
                          register={register}
                        />
                      )}
                      <DescriptionWithSubSelect
                        label="Pick Insertion"
                        name="PickInsertion"
                        subName="PickInsertionSubOptions"
                        options={pickInsertions}
                        selectedOption={watch('PickInsertion') || ''}
                        selectedSubOptions={watch('PickInsertionSubOptions') || []}
                        onChange={(value) => setValue('PickInsertion', value, { shouldValidate: true })}
                        onSubChange={(values) => setValue('PickInsertionSubOptions', values, { shouldValidate: true })}
                        error={errors.PickInsertion?.message}
                        subError={errors.PickInsertionSubOptions?.message}
                        register={register}
                      />
                      <CustomInput
                        variant="floating"
                        borderThickness="2"
                        label="Width"
                        id="Width"
                        {...register('Width')}
                        error={errors.Width?.message}
                      />
                      <DescriptionWithSubSelect
                        label="Final"
                        name="Final"
                        subName="FinalSubOptions"
                        options={finals}
                        selectedOption={watch('Final') || ''}
                        selectedSubOptions={watch('FinalSubOptions') || []}
                        onChange={(value) => setValue('Final', value, { shouldValidate: true })}
                        onSubChange={(values) => setValue('FinalSubOptions', values, { shouldValidate: true })}
                        error={errors.Final?.message}
                        subError={errors.FinalSubOptions?.message}
                        register={register}
                      />
                      <DescriptionWithSubSelect
                        label="Selvedge"
                        name="Selvedge"
                        subName="SelvedgeSubOptions"
                        options={selvedges}
                        selectedOption={watch('Selvedge') || ''}
                        selectedSubOptions={watch('SelvedgeSubOptions') || []}
                        onChange={(value) => setValue('Selvedge', value, { shouldValidate: true })}
                        onSubChange={(values) => setValue('SelvedgeSubOptions', values, { shouldValidate: true })}
                        error={errors.Selvedge?.message}
                        subError={errors.SelvedgeSubOptions?.message}
                        register={register}
                      />
                      <DescriptionWithSubSelect
                        label="Selvedge Weave"
                        name="SelvedgeWeave"
                        subName="SelvedgeWeaveSubOptions"
                        options={selvedgeWeaves}
                        selectedOption={watch('SelvedgeWeave') || ''}
                        selectedSubOptions={watch('SelvedgeWeaveSubOptions') || []}
                        onChange={(value) => setValue('SelvedgeWeave', value, { shouldValidate: true })}
                        onSubChange={(values) => setValue('SelvedgeWeaveSubOptions', values, { shouldValidate: true })}
                        error={errors.SelvedgeWeave?.message}
                        subError={errors.SelvedgeWeaveSubOptions?.message}
                        register={register}
                      />
                      <DescriptionWithSubSelect
                        label="Selvedge Width"
                        name="SelvedgeWidth"
                        subName="SelvedgeWidthSubOptions"
                        options={selvedgeWidths}
                        selectedOption={watch('SelvedgeWidth') || ''}
                        selectedSubOptions={watch('SelvedgeWidthSubOptions') || []}
                        onChange={(value) => setValue('SelvedgeWidth', value, { shouldValidate: true })}
                        onSubChange={(values) => setValue('SelvedgeWidthSubOptions', values, { shouldValidate: true })}
                        error={errors.SelvedgeWidth?.message}
                        subError={errors.SelvedgeWidthSubOptions?.message}
                        register={register}
                      />
                      {selvageThreads.length === 0 && loading ? (
                        <div>Loading Selvage Threads...</div>
                      ) : (
                        <DescriptionWithSubSelect
                          label="Selvage Thickness"
                          name="SelvageThread"
                          subName="SelvageThreadSubOptions"
                          options={selvageThreads}
                          selectedOption={watch('SelvageThread') || ''}
                          selectedSubOptions={watch('SelvageThreadSubOptions') || []}
                          onChange={(value) => setValue('SelvageThread', value, { shouldValidate: true })}
                          onSubChange={(values) => setValue('SelvageThreadSubOptions', values, { shouldValidate: true })}
                          error={errors.SelvageThread?.message}
                          subError={errors.SelvageThreadSubOptions?.message}
                          register={register}
                        />
                      )}
                      {inductionThreads.length === 0 && loading ? (
                        <div>Loading Induction Threads...</div>
                      ) : (
                        <DescriptionWithSubSelect
                          label="Induction Thread"
                          name="InductionThread"
                          subName="InductionThreadSubOptions"
                          options={inductionThreads}
                          selectedOption={watch('InductionThread') || ''}
                          selectedSubOptions={watch('InductionThreadSubOptions') || []}
                          onChange={(value) => setValue('InductionThread', value, { shouldValidate: true })}
                          onSubChange={(values) => setValue('InductionThreadSubOptions', values, { shouldValidate: true })}
                          error={errors.InductionThread?.message}
                          subError={errors.InductionThreadSubOptions?.message}
                          register={register}
                        />
                      )}
                      {gsms.length === 0 && loading ? (
                        <div>Loading GSMs...</div>
                      ) : (
                        <DescriptionWithSubSelect
                          label="GSM"
                          name="GSM"
                          subName="GSMSubOptions"
                          options={gsms}
                          selectedOption={watch('GSM') || ''}
                          selectedSubOptions={watch('GSMSubOptions') || []}
                          onChange={(value) => setValue('GSM', value, { shouldValidate: true })}
                          onSubChange={(values) => setValue('GSMSubOptions', values, { shouldValidate: true })}
                          error={errors.GSM?.message}
                          subError={errors.GSMSubOptions?.message}
                          register={register}
                        />
                      )}
                      <DescriptionWithSubSelect
                        label="End Use"
                        name="EndUse"
                        subName="EndUseSubOptions"
                        options={endUses}
                        selectedOption={watch('EndUse') || ''}
                        selectedSubOptions={watch('EndUseSubOptions') || []}
                        onChange={(value) => setValue('EndUse', value, { shouldValidate: true })}
                        onSubChange={(values) => setValue('EndUseSubOptions', values, { shouldValidate: true })}
                        error={errors.EndUse?.message}
                        subError={errors.EndUseSubOptions?.message}
                        register={register}
                      />
                    </div>
                  </div>
                  
                  <div className="border rounded-lg p-6 bg-gray-50 dark:bg-gray-800">
                    <h2 className="text-xl font-bold text-[#06b6d4] dark:text-white mb-4">Delivery Details</h2>
                    <div className="grid grid-cols-5 gap-4">
                      <CustomInput
                        variant="floating"
                        borderThickness="2"
                        label="Quantity"
                        id="Quantity"
                        {...register('Quantity')}
                        error={errors.Quantity?.message}
                      />
                       <CustomInput
                        variant="floating"
                        borderThickness="2"
                        label="Rate"
                        id="Rate"
                        {...register('Rate')}
                        error={errors.Rate?.message}
                      />
                       <CustomInput
                        variant="floating"
                        borderThickness="2"
                        label="Fabric Value"
                        id="FabricValue"
                        {...register('FabricValue')}
                        error={errors.FabricValue?.message}
                        disabled
                        className="auto-calculated-field"
                      />
                      {gstTypes.length === 0 && loading ? (
                        <div>Loading GST Types...</div>
                      ) : (
                        <CustomInputDropdown
                          label="GST Type"
                          options={gstTypes}
                          selectedOption={watch('Gst') || ''}
                          onChange={(value) => {
                            setValue('Gst', value, { shouldValidate: true });
                            trigger('Gst');
                          }}
                          error={errors.Gst?.message}
                          register={register}
                        />
                      )}
                      <CustomInput
                        variant="floating"
                        borderThickness="2"
                        label="GST Value"
                        id="GstValue"
                        {...register('GstValue')}
                        error={errors.GstValue?.message}
                        disabled
                        className="auto-calculated-field"
                      />
                      {commissionTypes.length === 0 && loading ? (
                        <div>Loading Commission Types...</div>
                      ) : (
                        <CustomInputDropdown
                          label="Commission Type"
                          options={commissionTypes}
                          selectedOption={watch('CommissionType') || ''}
                          onChange={(value) => setValue('CommissionType', value, { shouldValidate: true })}
                          error={errors.CommissionType?.message}
                          register={register}
                        />
                      )}
                      <CustomInput
                        variant="floating"
                        borderThickness="2"
                        label="Commission (%)"
                        id="CommissionPercentage"
                        {...register('CommissionPercentage')}
                        error={errors.CommissionPercentage?.message}
                      />
                      <CustomInput
                        variant="floating"
                        borderThickness="2"
                        label="Commission Value"
                        id="CommissionValue"
                        {...register('CommissionValue')}
                        error={errors.CommissionValue?.message}
                        disabled
                        className="auto-calculated-field"
                      />
                       <CustomInput
                        variant="floating"
                        borderThickness="2"
                        label="Total Amount"
                        id="TotalAmount"
                        {...register('TotalAmount')}
                        error={errors.TotalAmount?.message}
                        disabled
                        className="auto-calculated-field"
                      />
                      {unitsOfMeasure.length === 0 && loading ? (
                        <div>Loading Units of Measure...</div>
                      ) : (
                        <CustomInputDropdown
                          label="Unit of Measure"
                          options={unitsOfMeasure}
                          selectedOption={watch('UnitOfMeasure') || ''}
                          onChange={(value) => {
                            setValue('UnitOfMeasure', value, { shouldValidate: true });
                            trigger('UnitOfMeasure');
                          }}
                          error={errors.UnitOfMeasure?.message}
                          register={register}
                        />
                      )}
                      <CustomInput
                        variant="floating"
                        borderThickness="2"
                        label="Tolerance (%)"
                        id="Tolerance"
                        {...register('Tolerance')}
                        error={errors.Tolerance?.message}
                      />
                     
                      <CustomInputDropdown
                        label="Packing"
                        options={packings}
                        selectedOption={watch('Packing') || ''}
                        onChange={(value) => setValue('Packing', value, { shouldValidate: true })}
                        error={errors.Packing?.message}
                        register={register}
                      />
                      <CustomInputDropdown
                        label="Piece Length"
                        options={pieceLengths}
                        selectedOption={watch('PieceLength') || ''}
                        onChange={(value) => setValue('PieceLength', value, { shouldValidate: true })}
                        error={errors.PieceLength?.message}
                        register={register}
                      />
                      {paymentTerms.length === 0 && loading ? (
                        <div>Loading Payment Terms...</div>
                      ) : (
                        <CustomInputDropdown
                          label="Pay Term Seller"
                          options={paymentTerms}
                          selectedOption={watch('PaymentTermsSeller') || ''}
                          onChange={(value) => setValue('PaymentTermsSeller', value, { shouldValidate: true })}
                          error={errors.PaymentTermsSeller?.message}
                          register={register}
                        />
                      )}
                      {paymentTerms.length === 0 && loading ? (
                        <div>Loading Payment Terms...</div>
                      ) : (
                        <CustomInputDropdown
                          label="Pay Term Buyer"
                          options={paymentTerms}
                          selectedOption={watch('PaymentTermsBuyer') || ''}
                          onChange={(value) => setValue('PaymentTermsBuyer', value, { shouldValidate: true })}
                          error={errors.PaymentTermsBuyer?.message}
                          register={register}
                        />
                      )}
                     
                      <CustomInput
                        variant="floating"
                        borderThickness="2"
                        label="Finish Width"
                        id="FinishWidth"
                        {...register('FinishWidth')}
                        error={errors.FinishWidth?.message}
                      />
                     
                      {deliveryTerms.length === 0 && loading ? (
                        <div>Loading Delivery Terms...</div>
                      ) : (
                        <CustomInputDropdown
                          label="Delivery Terms"
                          options={deliveryTerms}
                          selectedOption={watch('DeliveryTerms') || ''}
                          onChange={(value) => setValue('DeliveryTerms', value, { shouldValidate: true })}
                          error={errors.DeliveryTerms?.message}
                          register={register}
                        />
                      )}
                      <CustomInputDropdown
                        label="Commission From"
                        options={commissionFromOptions}
                        selectedOption={watch('CommissionFrom') || ''}
                        onChange={(value) => setValue('CommissionFrom', value, { shouldValidate: true })}
                        error={errors.CommissionFrom?.message}
                        register={register}
                      />
                      {watch('CommissionFrom') === 'Both' && (
                        <CustomInput
                          variant="floating"
                          borderThickness="2"
                          label="Seller Commission"
                          id="SellerCommission"
                          {...register('SellerCommission')}
                          error={errors.SellerCommission?.message}
                        />
                      )}
                      {watch('CommissionFrom') === 'Both' && (
                        <CustomInput
                          variant="floating"
                          borderThickness="2"
                          label="Buyer Commission"
                          id="BuyerCommission"
                          {...register('BuyerCommission')}
                          error={errors.BuyerCommission?.message}
                        />
                      )}
                    
                      <CustomInputDropdown
                        label="Dispatch Later"
                        options={dispatchLaterOptions}
                        selectedOption={watch('DispatchLater') || ''}
                        onChange={(value) => setValue('DispatchLater', value, { shouldValidate: true })}
                        error={errors.DispatchLater?.message}
                        register={register}
                      />
                      <CustomInput
                        variant="floating"
                        borderThickness="2"
                        label="Seller Remark"
                        id="SellerRemark"
                        {...register('SellerRemark')}
                        error={errors.SellerRemark?.message}
                      />
                      <CustomInput
                        variant="floating"
                        borderThickness="2"
                        label="Buyer Remark"
                        id="BuyerRemark"
                        {...register('BuyerRemark')}
                        error={errors.BuyerRemark?.message}
                      />
                      <CustomInput
                        type="date"
                        variant="floating"
                        borderThickness="2"
                        label="Delivery Date"
                        id="DeliveryDate"
                        {...register('DeliveryDate')}
                        error={errors.DeliveryDate?.message}
                      />

                      <CustomInput
                        variant="floating"
                        borderThickness="2"
                        label="Color"
                        id="Color"
                        {...register('Color')}
                        error={errors.Color?.message}
                      />
                      <CustomInput
                        variant="floating"
                        borderThickness="2"
                        label="Weight"
                        id="Weight"
                        {...register('Weight')}
                        error={errors.Weight?.message}
                      />
                      <CustomInput
                        variant="floating"
                        borderThickness="2"
                        label="Shrinkage"
                        id="Shrinkage"
                        {...register('Shrinkage')}
                        error={errors.Shrinkage?.message}
                      />
                      <CustomInput
                        variant="floating"
                        borderThickness="2"
                        label="Finish Width"
                        id="Finish"
                        {...register('Finish')}
                        error={errors.Finish?.message}
                      />
                      <CustomInput
                        variant="floating"
                        borderThickness="2"
                        label="Lab Disp.NO"
                        id="LBDispNo"
                        {...register('LBDispNo')}
                        error={errors.LBDispNo?.message}
                      />
                      <CustomInput
                        type="date"
                        variant="floating"
                        borderThickness="2"
                        label="Lab Disp.Date"
                        id="LabDispatchDate"
                        {...register('LabDispatchDate')}
                        error={errors.LabDispatchDate?.message}
                      />
                    </div>
                  </div>
                </div>
                {/* Second Div: Delivery Breakups and Sample Details (30% width) */}
                <div className="w-3/12 space-y-6">
                  <div className="border rounded-lg p-6 bg-gray-50 dark:bg-gray-800">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-xl font-bold text-[#06b6d4] dark:text-white">Buyer Delivery Breakups</h2>
                      <Button
                        type="button"
                        onClick={addBuyerDeliveryBreakup}
                        className="bg-[#06b6d4] hover:bg-[#0891b2] text-white px-4 py-2 rounded-lg flex items-center gap-2"
                      >
                        <MdAdd /> Add Row
                      </Button>
                    </div>
                    <div className="border rounded-lg p-4 bg-white dark:bg-gray-700">
                      <div className="grid grid-cols-3 gap-4 font-bold text-gray-700 dark:text-gray-300">
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
                                label=""
                                value={breakup.Qty}
                                onChange={(e) =>
                                  handleBuyerDeliveryBreakupChange(index, 'Qty', e.target.value)
                                }
                              />
                              <CustomInput
                                type="date"
                                variant="floating"
                                borderThickness="2"
                                label=""
                                value={breakup.DeliveryDate}
                                onChange={(e) =>
                                  handleBuyerDeliveryBreakupChange(index, 'DeliveryDate', e.target.value)
                                }
                              />
                              <Button
                                type="button"
                                onClick={() => removeBuyerDeliveryBreakup(index)}
                                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                              >
                                <MdDelete /> Delete
                              </Button>
                            </div>
                          ))}
                        </>
                      )}
                    </div>
                  </div>

                  <div className="border rounded-lg p-6 bg-gray-50 dark:bg-gray-800">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-xl font-bold text-[#06b6d4] dark:text-white">Seller Delivery Breakups</h2>
                      <Button

                        type="button"
                        onClick={addSellerDeliveryBreakup}
                        className="bg-[#06b6d4] hover:bg-[#0891b2] text-white px-4 py-2 rounded-lg flex items-center gap-2"
                      >
                        <MdAdd /> Add Row
                      </Button>
                    </div>
                    <div className="border rounded-lg p-4 bg-white dark:bg-gray-700">
                      <div className="grid grid-cols-3 gap-4 font-bold text-gray-700 dark:text-gray-300">
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
                                label=""
                                value={breakup.Qty}
                                onChange={(e) =>
                                  handleSellerDeliveryBreakupChange(index, 'Qty', e.target.value)
                                }
                              />
                              <CustomInput
                                type="date"
                                variant="floating"
                                borderThickness="2"
                                label=""
                                value={breakup.DeliveryDate}
                                onChange={(e) =>
                                  handleSellerDeliveryBreakupChange(index, 'DeliveryDate', e.target.value)
                                }
                              />
                              <Button
                                type="button"
                                onClick={() => removeSellerDeliveryBreakup(index)}
                                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                              >
                                <MdDelete /> Delete
                              </Button>
                            </div>
                          ))}
                        </>
                      )}
                    </div>
                  </div>

                  <div className="border rounded-lg p-6 bg-gray-50 dark:bg-gray-800">
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
                    <div className="border rounded-lg p-4 bg-white dark:bg-gray-700">
                      <div className="grid grid-cols-1 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Sample Quantity
                          </label>
                          <CustomInput
                            type="number"
                            variant="floating"
                            borderThickness="2"
                            label="Sample Quantity"
                            value={sampleDetails[0].SampleQty}
                            onChange={(e) => handleSampleDetailChange(0, 'SampleQty', e.target.value)}
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
                            value={sampleDetails[0].SampleReceivedDate}
                            onChange={(e) => handleSampleDetailChange(0, 'SampleReceivedDate', e.target.value)}
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
                            value={sampleDetails[0].SampleDeliveredDate}
                            onChange={(e) => handleSampleDetailChange(0, 'SampleDeliveredDate', e.target.value)}
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
                            value={sampleDetails[0].CreatedBy}
                            onChange={(e) => handleSampleDetailChange(0, 'CreatedBy', e.target.value)}
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
                            value={sampleDetails[0].CreationDate}
                            onChange={(e) => handleSampleDetailChange(0, 'CreationDate', e.target.value)}
                            disabled
                            className="auto-calculated-field"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="border rounded-lg p-6 bg-gray-50 dark:bg-gray-800">
                    <h2 className="text-xl font-bold text-[#06b6d4] dark:text-white mb-4">Notes</h2>
                    <textarea
                      className="w-full p-2 border rounded-lg text-base dark:bg-gray-700 dark:text-white"
                      rows={4}
                      {...register('Notes')}
                      placeholder="Enter any additional notes"
                    />
                    {errors.Notes && <p className="text-red-500">{errors.Notes.message}</p>}
                  </div>
                </div>    
              </div>

              {/* Sample Details Popup */}
              {showSamplePopup !== null && (
                <div className="border rounded-lg p-6 bg-gray-50 dark:bg-gray-800">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-[#06b6d4] dark:text-white">Sample Details</h2>
                    <Button
                      type="button"
                      onClick={() => setShowSamplePopup(0)}
                      className="bg-[#06b6d4] hover:bg-[#0891b2] text-white px-4 py-2 rounded-lg flex items-center gap-2"
                    >
                      <MdInfo /> Additional Info
                    </Button>
                  </div>
                  <div className="border rounded-lg p-6 bg-gray-50 dark:bg-gray-800">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-xl font-bold text-[#06b6d4] dark:text-white">Sample Details</h2>
                      <Button
                        type="button"
                        onClick={() => setShowSamplePopup(0)}
                        className="bg-[#06b6d4] hover:bg-[#0891b2] text-white px-4 py-2 rounded-lg flex items-center gap-2"
                      >
                        <MdInfo /> Additional Info
                      </Button>
                    </div>
                    <div className="border rounded-lg p-4 bg-white dark:bg-gray-700">
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
                            value={sampleDetails[0].SampleQty}
                            onChange={(e) => handleSampleDetailChange(0, 'SampleQty', e.target.value)}
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
                            value={sampleDetails[0].SampleReceivedDate}
                            onChange={(e) => handleSampleDetailChange(0, 'SampleReceivedDate', e.target.value)}
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
                            value={sampleDetails[0].SampleDeliveredDate}
                            onChange={(e) => handleSampleDetailChange(0, 'SampleDeliveredDate', e.target.value)}
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
                            value={sampleDetails[0].CreatedBy}
                            onChange={(e) => handleSampleDetailChange(0, 'CreatedBy', e.target.value)}
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
                            value={sampleDetails[0].CreationDate}
                            onChange={(e) => handleSampleDetailChange(0, 'CreationDate', e.target.value)}
                            disabled
                            className="auto-calculated-field"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Updated By
                          </label>
                          <CustomInput
                            variant="floating"
                            borderThickness="2"
                            label="Updated By"
                            value={sampleDetails[0].UpdatedBy}
                            onChange={(e) => handleSampleDetailChange(0, 'UpdatedBy', e.target.value)}
                            disabled
                            className="auto-calculated-field"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Update Date
                          </label>
                          <CustomInput
                            type="date"
                            variant="floating"
                            borderThickness="2"
                            label="Update Date"
                            value={sampleDetails[0].UpdateDate}
                            onChange={(e) => handleSampleDetailChange(0, 'UpdateDate', e.target.value)}
                            disabled
                            className="auto-calculated-field"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="w-full h-[8vh] flex justify-end gap-2 mt-3 bg-transparent border-t-2 border-[#e7e7e7]">
                <Button
                  type="submit"
                  className="w-[160] gap-2 inline-flex items-center bg-[#0e7d90] hover:bg-[#0891b2] text-white px-6 py-2 text-sm font-medium transition-all duration-200 font-mono text-base hover:translate-y-[-2px] focus:outline-none active:shadow-[#3c4fe0_0_3px_7px_inset] active:translate-y-[2px] mt-2"
                >
                  {id ? "Update" : "Submit"}
                </Button>
                <Link href="/contract">
                  <Button
                    type="button"
                    className="w-[160] gap-2 mr-2 inline-flex items-center bg-black hover:bg-[#b0b0b0] text-white px-6 py-2 text-sm font-medium transition-all duration-200 font-mono text-base hover:translate-y-[-2px] focus:outline-none active:shadow-[#3c4fe0_0_3px_7px_inset] active:translate-y-[2px] mt-2"
                  >
                    Cancel
                  </Button>
                </Link>
              </div>  
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContractForm;