'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, SubmitHandler } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'react-toastify';
import Link from 'next/link';
import CustomInput from '@/components/ui/CustomInput';
import DescriptionWithSubSelect from '@/components/ui/DescriptionWithSubSelect';
import { MdAddBusiness, MdAdd, MdDelete, MdInfo } from 'react-icons/md';
import { Button } from '@/components/ui/button';
import CustomInputDropdown from '../ui/CustomeInputDropdown';
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
import { getAllInductionThreads } from '@/apis/inductionthread';
import { getAllGSMs } from '@/apis/gsm';
import { getAllSellers } from '@/apis/seller';
import { getAllBuyer } from '@/apis/buyer';
import { getAllDeliveryTerms } from '@/apis/deliveryterm';
import { getAllCommissionTypes } from '@/apis/commissiontype';
import { getAllPaymentTerms } from '@/apis/paymentterm';
import { getAllUnitOfMeasures } from '@/apis/unitofmeasure';
import { getAllGeneralSaleTextTypes } from '@/apis/generalSaleTextType';
import { getAllStuffs } from '@/apis/stuff';

// Schema Definitions
const DeliveryBreakupSchema = z.object({
  Id: z.string().optional(),
  Qty: z.string(),
  DeliveryDate: z.string(),
});

const DeliveryTermDetailSchema = z.object({
  Id: z.string().optional(),
  TermDescription: z.string().min(1, 'Term Description is required'),
  EffectiveDate: z.string().min(1, 'Effective Date is required'),
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

const DeliveryDetailSchema = z.object({
  Id: z.string().optional(),
  Quantity: z.string().min(1, 'Quantity is required'),
  Rate: z.string().min(1, 'Rate is required'),
  FabricValue: z.string().min(1, 'Fabric Value is required'),
  Gst: z.string().min(1, 'GST Type is required'),
  GstValue: z.string().optional(),
  CommissionType: z.string().optional(),
  CommissionPercentage: z.string().optional(),
  CommissionValue: z.string().optional(),
  TotalAmount: z.string().min(1, 'Total Amount is required'),
  UnitOfMeasure: z.string().min(1, 'Unit of Measure is required'),
  Tolerance: z.string().optional(),
  Packing: z.string().optional(),
  PieceLength: z.string().optional(),
  PaymentTermsSeller: z.string().optional(),
  PaymentTermsBuyer: z.string().optional(),
  FinishWidth: z.string().optional(),
  DeliveryTerms: z.string().optional(),
  CommissionFrom: z.string().optional(),
  SellerCommission: z.string().optional(),
  BuyerCommission: z.string().optional(),
  DispatchLater: z.string().optional(),
  SellerRemark: z.string().optional(),
  BuyerRemark: z.string().optional(),
  DeliveryDate: z.string().min(1, 'Delivery Date is required'),
  Color: z.string().optional(),
  Weight: z.string().optional(),
  Shrinkage: z.string().optional(),
  Finish: z.string().optional(),
  LBDispNo: z.string().optional(),
  LabDispatchDate: z.string().optional(),
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
  CreatedBy: z.string().optional(),
  CreationDate: z.string().optional(),
  UpdatedBy: z.string().optional(),
  UpdationDate: z.string().optional(),
  ApprovedBy: z.string().optional(),
  ApprovedDate: z.string().optional(),
  Notes: z.string().optional(),
  SelvegeThickness: z.string().optional(),
  BuyerDeliveryBreakups: z.array(DeliveryBreakupSchema).optional(),
  SellerDeliveryBreakups: z.array(DeliveryBreakupSchema).optional(),
  DeliveryTermDetails: z.array(DeliveryTermDetailSchema).optional(),
  SampleDetails: z.array(SampleDetailSchema).optional(),
  DeliveryDetails: z.array(DeliveryDetailSchema).min(1, 'At least one Delivery Detail is required'),
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
  selvedgeWidth: string;
  selvedgeWidthSubOptions: string;
  selvageThread: string;
  selvageThreadSubOptions: string;
  inductionThread: string;
  inductionThreadSubOptions: string;
  gsm: string;
  gsmSubOptions: string;
  endUse: string;
  endUseSubOptions: string;
  createdBy: string;
  creationDate: string;
  updatedBy: string;
  updationDate: string;
  approvedBy: string;
  approvedDate: string;
  notes?: string;
  selvegeThickness?: string;
  // Root level fields for delivery details
  quantity?: string;
  rate?: string;
  fabricValue?: string;
  gst?: string;
  gstValue?: string;
  commissionType?: string;
  commissionPercentage?: string;
  commissionValue?: string;
  totalAmount?: string;
  unitOfMeasure?: string;
  tolerance?: string;
  packing?: string;
  pieceLength?: string;
  paymentTermsSeller?: string;
  paymentTermsBuyer?: string;
  deliveryTerms?: string;
  commissionFrom?: string;
  sellerRemark?: string;
  buyerRemark?: string;
  deliveryDate?: string;
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
  deliveryDetails: Array<{
    id?: string;
    quantity: string;
    rate: string;
    fabricValue: string;
    gst: string;
    gstValue: string;
    commissionType: string;
    commissionPercentage: string;
    commissionValue: string;
    totalAmount: string;
    unitOfMeasure: string;
    tolerance: string;
    packing: string;
    pieceLength: string;
    paymentTermsSeller: string;
    paymentTermsBuyer: string;
    finishWidth: string;
    deliveryTerms: string;
    commissionFrom: string;
    sellerCommission: string;
    buyerCommission: string;
    dispatchLater: string;
    sellerRemark: string;
    buyerRemark: string;
    deliveryDate: string;
    color: string;
    weight: string;
    shrinkage: string;
    finish: string;
    lbDispNo: string;
    labDispatchDate: string;
  }>;
};

type ContractFormProps = {
  id?: string;
  initialData?: Partial<ContractApiResponse>;
};

const ContractForm = ({ id, initialData }: ContractFormProps) => {
  const router = useRouter();
  const [companies, setCompanies] = useState<Array<{ id: string; name: string }>>([]);
  const [branches, setBranches] = useState<Array<{ id: string; name: string }>>([]);
  const [descriptions, setDescriptions] = useState<Array<{ id: string; name: string; subDescription: string }>>([]);
  const [descriptionSubOptions, setDescriptionSubOptions] = useState<string[]>([]);
  const [stuffs, setStuffs] = useState<Array<{ id: string; name: string; subDescription: string }>>([]);
  const [stuffSubOptions, setStuffSubOptions] = useState<string[]>([]);
  const [blendRatios, setBlendRatios] = useState<Array<{ id: string; name: string; subDescription: string }>>([]);
  const [blendTypeOptions, setBlendTypeOptions] = useState<string[]>([]);
  const [endUses, setEndUses] = useState<Array<{ id: string; name: string; subDescription: string }>>([]);
  const [endUseSubOptions, setEndUseSubOptions] = useState<string[]>([]);
  const [fabricTypes, setFabricTypes] = useState<Array<{ id: string; name: string }>>([]);
  const [packings, setPackings] = useState<Array<{ id: string; name: string }>>([]);
  const [pieceLengths, setPieceLengths] = useState<Array<{ id: string; name: string }>>([]);
  const [pickInsertions, setPickInsertions] = useState<Array<{ id: string; name: string; subDescription: string }>>([]);
  const [pickInsertionSubOptions, setPickInsertionSubOptions] = useState<string[]>([]);
  const [warpYarnTypes, setWarpYarnTypes] = useState<Array<{ id: string; name: string; subDescription: string }>>([]);
  const [warpYarnTypeSubOptions, setWarpYarnTypeSubOptions] = useState<string[]>([]);
  const [weftYarnTypes, setWeftYarnTypes] = useState<Array<{ id: string; name: string; subDescription: string }>>([]);
  const [weftYarnTypeSubOptions, setWeftYarnTypeSubOptions] = useState<string[]>([]);
  const [weaves, setWeaves] = useState<Array<{ id: string; name: string; subDescription: string }>>([]);
  const [weavesSubOptions, setWeavesSubOptions] = useState<string[]>([]);
  const [finals, setFinals] = useState<Array<{ id: string; name: string; subDescription: string }>>([]);
  const [finalSubOptions, setFinalSubOptions] = useState<string[]>([]);
  const [selvedges, setSelvedges] = useState<Array<{ id: string; name: string; subDescription: string }>>([]);
  const [selvedgeSubOptions, setSelvedgeSubOptions] = useState<string[]>([]);
  const [selvedgeWeaves, setSelvedgeWeaves] = useState<Array<{ id: string; name: string; subDescription: string }>>([]);
  const [selvedgeWeaveSubOptions, setSelvedgeWeaveSubOptions] = useState<string[]>([]);
  const [selvedgeWidths, setSelvedgeWidths] = useState<Array<{ id: string; name: string; subDescription: string }>>([]);
  const [selvedgeWidthSubOptions, setSelvedgeWidthSubOptions] = useState<string[]>([]);
  const [selvageThreads, setSelvageThreads] = useState<Array<{ id: string; name: string; subDescription: string }>>([]);
  const [selvageThreadSubOptions, setSelvageThreadSubOptions] = useState<string[]>([]);
  const [inductionThreads, setInductionThreads] = useState<Array<{ id: string; name: string; subDescription: string }>>([]);
  const [inductionThreadSubOptions, setInductionThreadSubOptions] = useState<string[]>([]);
  const [gsms, setGsms] = useState<Array<{ id: string; name: string; subDescription: string }>>([]);
  const [gsmSubOptions, setGsmSubOptions] = useState<string[]>([]);
  const [sellers, setSellers] = useState<Array<{ id: string; name: string }>>([]);
  const [buyers, setBuyers] = useState<Array<{ id: string; name: string }>>([]);
  const [deliveryTerms, setDeliveryTerms] = useState<Array<{ id: string; name: string }>>([]);
  const [commissionTypes, setCommissionTypes] = useState<Array<{ id: string; name: string }>>([]);
  const [paymentTerms, setPaymentTerms] = useState<Array<{ id: string; name: string }>>([]);
  const [unitsOfMeasure, setUnitsOfMeasure] = useState<Array<{ id: string; name: string }>>([]);
  const [gstTypes, setGstTypes] = useState<Array<{ id: string; name: string }>>([]);
  const [selvegeThicknesses, setSelvegeThicknesses] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [buyerDeliveryBreakups, setBuyerDeliveryBreakups] = useState<Array<{ Id?: string; Qty: string; DeliveryDate: string }>>([]);
  const [sellerDeliveryBreakups, setSellerDeliveryBreakups] = useState<Array<{ Id?: string; Qty: string; DeliveryDate: string }>>([]);
  const [deliveryTermDetails, setDeliveryTermDetails] = useState<Array<{ Id?: string; TermDescription: string; EffectiveDate: string }>>([]);
  const [sampleDetails, setSampleDetails] = useState<Array<{
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
  }>>([
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
  const [deliveryDetails, setDeliveryDetails] = useState<Array<{
    Id?: string;
    Quantity: string;
    Rate: string;
    FabricValue: string;
    Gst: string;
    GstValue: string;
    CommissionType: string;
    CommissionPercentage: string;
    CommissionValue: string;
    TotalAmount: string;
    UnitOfMeasure: string;
    Tolerance: string;
    Packing: string;
    PieceLength: string;
    PaymentTermsSeller: string;
    PaymentTermsBuyer: string;
    FinishWidth: string;
    DeliveryTerms: string;
    CommissionFrom: string;
    SellerCommission: string;
    BuyerCommission: string;
    DispatchLater: string;
    SellerRemark: string;
    BuyerRemark: string;
    DeliveryDate: string;
    Color: string;
    Weight: string;
    Shrinkage: string;
    Finish: string;
    LBDispNo: string;
    LabDispatchDate: string;
  }>>([{
    Id: undefined,
    Quantity: '',
    Rate: '',
    FabricValue: '',
    Gst: '',
    GstValue: '',
    CommissionType: '',
    CommissionPercentage: '',
    CommissionValue: '',
    TotalAmount: '',
    UnitOfMeasure: '',
    Tolerance: '',
    Packing: '',
    PieceLength: '',
    PaymentTermsSeller: '',
    PaymentTermsBuyer: '',
    FinishWidth: '',
    DeliveryTerms: '',
    CommissionFrom: '',
    SellerCommission: '',
    BuyerCommission: '',
    DispatchLater: '',
    SellerRemark: '',
    BuyerRemark: '',
    DeliveryDate: '',
    Color: '',
    Weight: '',
    Shrinkage: '',
    Finish: '',
    LBDispNo: '',
    LabDispatchDate: '',
  }]);
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
      DeliveryDetails: [{
        Quantity: '',
        Rate: '',
        FabricValue: '',
        Gst: '',
        GstValue: '',
        CommissionType: '',
        CommissionPercentage: '',
        CommissionValue: '',
        TotalAmount: '',
        UnitOfMeasure: '',
        Tolerance: '',
        Packing: '',
        PieceLength: '',
        PaymentTermsSeller: '',
        PaymentTermsBuyer: '',
        FinishWidth: '',
        DeliveryTerms: '',
        CommissionFrom: '',
        SellerCommission: '',
        BuyerCommission: '',
        DispatchLater: '',
        SellerRemark: '',
        BuyerRemark: '',
        DeliveryDate: '',
        Color: '',
        Weight: '',
        Shrinkage: '',
        Finish: '',
        LBDispNo: '',
        LabDispatchDate: '',
      }],
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

  // State Management for Delivery Details
  const handleDeliveryDetailChange = (index: number, field: string, value: string) => {
    const updatedDetails = [...deliveryDetails];
    updatedDetails[index] = { ...updatedDetails[index], [field]: value };
    setDeliveryDetails(updatedDetails);
    setValue(`DeliveryDetails.${index}.${field}` as any, value, { shouldValidate: true });
  };

  const addDeliveryDetail = () => {
    const newDetail = {
      Id: undefined,
      Quantity: '',
      Rate: '',
      FabricValue: '',
      Gst: '',
      GstValue: '',
      CommissionType: '',
      CommissionPercentage: '',
      CommissionValue: '',
      TotalAmount: '',
      UnitOfMeasure: '',
      Tolerance: '',
      Packing: '',
      PieceLength: '',
      PaymentTermsSeller: '',
      PaymentTermsBuyer: '',
      FinishWidth: '',
      DeliveryTerms: '',
      CommissionFrom: '',
      SellerCommission: '',
      BuyerCommission: '',
      DispatchLater: '',
      SellerRemark: '',
      BuyerRemark: '',
      DeliveryDate: '',
      Color: '',
      Weight: '',
      Shrinkage: '',
      Finish: '',
      LBDispNo: '',
      LabDispatchDate: '',
    };
    setDeliveryDetails([...deliveryDetails, newDetail]);
    setValue('DeliveryDetails', [...deliveryDetails, newDetail], { shouldValidate: true });
  };

  const removeDeliveryDetail = (index: number) => {
    if (deliveryDetails.length <= 1) {
      toast('At least one Delivery Detail is required', { type: 'warning' });
      return;
    }
    const updatedDetails = deliveryDetails.filter((_, i) => i !== index);
    setDeliveryDetails(updatedDetails);
    setValue('DeliveryDetails', updatedDetails, { shouldValidate: true });
  };

  // Other Event Handlers (simplified for brevity)
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
    setSampleDetails(updatedSampleDetails);
  };

  const handleAdditionalInfoChange = (sampleIndex: number, infoIndex: number, field: string, value: string) => {
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

  // Calculate Fabric Value, GST Value, Total Amount, and Commission Value for each Delivery Detail
  useEffect(() => {
    deliveryDetails.forEach((detail, index) => {
      const qty = parseFloat(detail.Quantity || '0');
      const rt = parseFloat(detail.Rate || '0');
      const fabricValue = (qty * rt).toFixed(2);
      if (fabricValue !== detail.FabricValue) {
        handleDeliveryDetailChange(index, 'FabricValue', fabricValue);
      }

      const selectedGst = gstTypes.find((g) => g.id === detail.Gst);
      let gstValue = '0.00';
      if (selectedGst) {
        const percentage = parseFloat(selectedGst.name.replace('% GST', '')) || 0;
        gstValue = ((parseFloat(fabricValue) * percentage) / 100).toFixed(2);
      }
      if (gstValue !== detail.GstValue) {
        handleDeliveryDetailChange(index, 'GstValue', gstValue);
      }

      const totalAmount = (parseFloat(fabricValue) + parseFloat(gstValue)).toFixed(2);
      if (totalAmount !== detail.TotalAmount) {
        handleDeliveryDetailChange(index, 'TotalAmount', totalAmount);
      }

      let commissionValue = '0.00';
      const commissionInput = parseFloat(detail.CommissionPercentage || '0');
      if (detail.CommissionType) {
        const commissionTypeName = commissionTypes.find((type) => type.id === detail.CommissionType)?.name.toLowerCase();
        if (commissionTypeName === 'on value' && commissionInput > 0 && parseFloat(totalAmount) > 0) {
          commissionValue = ((parseFloat(totalAmount) * commissionInput) / 100).toFixed(2);
        } else if (commissionTypeName === 'on qty' && commissionInput > 0 && qty > 0) {
          commissionValue = (qty * commissionInput).toFixed(2);
        }
      }
      if (commissionValue !== detail.CommissionValue) {
        handleDeliveryDetailChange(index, 'CommissionValue', commissionValue);
      }
    });
  }, [deliveryDetails, gstTypes, commissionTypes]);

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
              ContractType: initialData.contractType || 'Sale',
              CompanyId: initialData.companyId || '',
              BranchId: initialData.branchId || '',
              ContractNumber: initialData.contractNumber || '',
              Date: initialData.date || '',
              ContractOwner: initialData.contractOwner || '',
              Seller: initialData.seller || '',
              Buyer: initialData.buyer || '',
              ReferenceNumber: initialData.referenceNumber || '',
              Refer: initialData.refer || '',
              Referdate: initialData.referdate || '',
              FabricType: initialData.fabricType || '',
              Description: initialData.description || '',
              DescriptionSubOptions: initialData.descriptionSubOptions?.split(',') || [],
              Stuff: initialData.stuff || '',
              StuffSubOptions: initialData.stuffSubOptions?.split(',') || [],
              BlendRatio: initialData.blendRatio || '',
              BlendType: initialData.blendType?.split(',') || [],
              WarpCount: initialData.warpCount || '',
              WarpYarnType: initialData.warpYarnType || '',
              WarpYarnTypeSubOptions: initialData.warpYarnTypeSubOptions?.split(',') || [],
              WeftCount: initialData.weftCount || '',
              WeftYarnType: initialData.weftYarnType || '',
              WeftYarnTypeSubOptions: initialData.weftYarnTypeSubOptions?.split(',') || [],
              NoOfEnds: initialData.noOfEnds || '',
              NoOfPicks: initialData.noOfPicks || '',
              Weaves: initialData.weaves || '',
              WeavesSubOptions: initialData.weavesSubOptions?.split(',') || [],
              PickInsertion: initialData.pickInsertion || '',
              PickInsertionSubOptions: initialData.pickInsertionSubOptions?.split(',') || [],
              Width: initialData.width || '',
              Final: initialData.final || '',
              FinalSubOptions: initialData.finalSubOptions?.split(',') || [],
              Selvedge: initialData.selvege || '',
              SelvedgeSubOptions: initialData.selvedgeSubOptions?.split(',') || [],
              SelvedgeWeave: initialData.selvegeWeaves === null ? '' : initialData.selvegeWeaves || '',
              SelvedgeWeaveSubOptions: initialData.selvedgeWeaveSubOptions?.split(',') || [],
              SelvedgeWidth: initialData.selvedgeWidth === null ? '' : initialData.selvedgeWidth || '',
              SelvedgeWidthSubOptions: initialData.selvedgeWidthSubOptions?.split(',') || [],
              SelvageThread: initialData.selvageThread || '',
              SelvageThreadSubOptions: initialData.selvageThreadSubOptions?.split(',') || [],
              InductionThread: initialData.inductionThread || '',
              InductionThreadSubOptions: initialData.inductionThreadSubOptions?.split(',') || [],
              GSM: initialData.gsm || '',
              GSMSubOptions: initialData.gsmSubOptions?.split(',') || [],
              EndUse: initialData.endUse || '',
              EndUseSubOptions: initialData.endUseSubOptions?.split(',') || [],
              Notes: initialData.notes || '',
              SelvegeThickness: initialData.selvegeThickness || '',
              DeliveryDetails: initialData.deliveryDetails?.length ? initialData.deliveryDetails.map((detail) => ({
                Id: detail.id,
                Quantity: detail.quantity || '',
                Rate: detail.rate || '',
                FabricValue: detail.fabricValue || '',
                Gst: detail.gst || '',
                GstValue: detail.gstValue || '',
                CommissionType: detail.commissionType || '',
                CommissionPercentage: detail.commissionPercentage || '',
                CommissionValue: detail.commissionValue || '',
                TotalAmount: detail.totalAmount || '',
                UnitOfMeasure: detail.unitOfMeasure || '',
                Tolerance: detail.tolerance || '',
                Packing: detail.packing || '',
                PieceLength: detail.pieceLength || '',
                PaymentTermsSeller: detail.paymentTermsSeller || '',
                PaymentTermsBuyer: detail.paymentTermsBuyer || '',
                FinishWidth: detail.finishWidth || '',
                DeliveryTerms: detail.deliveryTerms || '',
                CommissionFrom: detail.commissionFrom || '',
                SellerCommission: detail.sellerCommission || '',
                BuyerCommission: detail.buyerCommission || '',
                DispatchLater: detail.dispatchLater || '',
                SellerRemark: detail.sellerRemark || '',
                BuyerRemark: detail.buyerRemark || '',
                DeliveryDate: detail.deliveryDate || '',
                Color: detail.color || '',
                Weight: detail.weight || '',
                Shrinkage: detail.shrinkage || '',
                Finish: detail.finish || '',
                LBDispNo: detail.lbDispNo || '',
                LabDispatchDate: detail.labDispatchDate || '',
              })) : [{
                Id: undefined,
                Quantity: initialData.quantity || '',
                Rate: initialData.rate || '',
                FabricValue: initialData.fabricValue || '',
                Gst: initialData.gst || '',
                GstValue: initialData.gstValue || '',
                CommissionType: initialData.commissionType || '',
                CommissionPercentage: initialData.commissionPercentage || '',
                CommissionValue: initialData.commissionValue || '',
                TotalAmount: initialData.totalAmount || '',
                UnitOfMeasure: initialData.unitOfMeasure || '',
                Tolerance: initialData.tolerance || '',
                Packing: initialData.packing || '',
                PieceLength: initialData.pieceLength || '',
                PaymentTermsSeller: initialData.paymentTermsSeller || '',
                PaymentTermsBuyer: initialData.paymentTermsBuyer || '',
                FinishWidth: initialData.width || '',
                DeliveryTerms: initialData.deliveryTerms || '',
                CommissionFrom: initialData.commissionFrom || '',
                SellerCommission: '',
                BuyerCommission: '',
                DispatchLater: '',
                SellerRemark: initialData.sellerRemark || '',
                BuyerRemark: initialData.buyerRemark || '',
                DeliveryDate: initialData.deliveryDate || '',
                Color: '',
                Weight: '',
                Shrinkage: '',
                Finish: '',
                LBDispNo: '',
                LabDispatchDate: '',
              }],
              BuyerDeliveryBreakups: initialData.buyerDeliveryBreakups?.map((breakup) => ({
                Id: breakup.id,
                Qty: breakup.qty,
                DeliveryDate: breakup.deliveryDate,
              })) || [],
              SellerDeliveryBreakups: initialData.sellerDeliveryBreakups?.map((breakup) => ({
                Id: breakup.id,
                Qty: breakup.qty,
                DeliveryDate: breakup.deliveryDate,
              })) || [],
              DeliveryTermDetails: initialData.deliveryTermDetails?.map((detail) => ({
                Id: detail.id,
                TermDescription: detail.termDescription,
                EffectiveDate: detail.effectiveDate,
              })) || [],
              SampleDetails: initialData.sampleDetails?.map((detail) => ({
                Id: detail.id,
                SampleQty: detail.sampleQty,
                SampleReceivedDate: detail.sampleReceivedDate,
                SampleDeliveredDate: detail.sampleDeliveredDate,
                CreatedBy: detail.createdBy,
                CreationDate: detail.creationDate,
                UpdatedBy: detail.updatedBy,
                UpdateDate: detail.updateDate,
                AdditionalInfo: detail.additionalInfo?.map((info) => ({
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
            setDeliveryDetails(formattedData.DeliveryDetails);
            setBuyerDeliveryBreakups(formattedData.BuyerDeliveryBreakups);
            setSellerDeliveryBreakups(formattedData.SellerDeliveryBreakups);
            setDeliveryTermDetails(formattedData.DeliveryTermDetails);
            setSampleDetails(formattedData.SampleDetails);
            setShowForm(true);
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
        createdBy: data.CreatedBy || '',
        creationDate: data.CreationDate || '',
        updatedBy: data.UpdatedBy || '',
        updationDate: data.UpdationDate || '',
        approvedBy: data.ApprovedBy || '',
        approvedDate: data.ApprovedDate || '',
        notes: data.Notes || '',
        selvegeThickness: data.SelvegeThickness || '',
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
          id: detail.Id || undefined,
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
        deliveryDetails: deliveryDetails.map((detail) => ({
          id: detail.Id || undefined,
          quantity: detail.Quantity,
          rate: detail.Rate,
          fabricValue: detail.FabricValue,
          gst: detail.Gst,
          gstValue: detail.GstValue,
          commissionType: detail.CommissionType,
          commissionPercentage: detail.CommissionPercentage,
          commissionValue: detail.CommissionValue,
          totalAmount: detail.TotalAmount,
          unitOfMeasure: detail.UnitOfMeasure,
          tolerance: detail.Tolerance,
          packing: detail.Packing,
          pieceLength: detail.PieceLength,
          paymentTermsSeller: detail.PaymentTermsSeller,
          paymentTermsBuyer: detail.PaymentTermsBuyer,
          finishWidth: detail.FinishWidth,
          deliveryTerms: detail.DeliveryTerms,
          commissionFrom: detail.CommissionFrom,
          sellerCommission: detail.SellerCommission,
          buyerCommission: detail.BuyerCommission,
          dispatchLater: detail.DispatchLater,
          sellerRemark: detail.SellerRemark,
          buyerRemark: detail.BuyerRemark,
          deliveryDate: detail.DeliveryDate,
          color: detail.Color,
          weight: detail.Weight,
          shrinkage: detail.Shrinkage,
          finish: detail.Finish,
          lbDispNo: detail.LBDispNo,
          labDispatchDate: detail.LabDispatchDate,
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
                  
                 {/* Delivery Details Section */}
              <div className="border rounded-lg p-6 bg-gray-50 dark:bg-gray-800">
                <h2 className="text-xl font-bold text-[#06b6d4] dark:text-white mb-4">Delivery Details</h2>
                {deliveryDetails.map((detail, index) => (
                  <div key={index} className="mb-6 border rounded-lg p-4 bg-white dark:bg-gray-700 relative">
                    <h3 className="text-lg font-semibold text-[#06b6d4] dark:text-white mb-4">Delivery Detail #{index + 1}</h3>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => removeDeliveryDetail(index)}
                      className="absolute top-4 right-4"
                    >
                      <MdDelete />
                    </Button>
                    <div className="grid grid-cols-5 gap-4">
                      <CustomInput
                        variant="floating"
                        borderThickness="2"
                        label="Quantity"
                        value={detail.Quantity}
                        onChange={(e) => handleDeliveryDetailChange(index, 'Quantity', e.target.value)}
                        error={errors.DeliveryDetails?.[index]?.Quantity?.message}
                      />
                      <CustomInput
                        variant="floating"
                        borderThickness="2"
                        label="Rate"
                        value={detail.Rate}
                        onChange={(e) => handleDeliveryDetailChange(index, 'Rate', e.target.value)}
                        error={errors.DeliveryDetails?.[index]?.Rate?.message}
                      />
                      <CustomInput
                        variant="floating"
                        borderThickness="2"
                        label="Fabric Value"
                        value={detail.FabricValue}
                        disabled
                        className="auto-calculated-field"
                        error={errors.DeliveryDetails?.[index]?.FabricValue?.message}
                      />
                      {gstTypes.length === 0 && loading ? (
                        <div>Loading GST Types...</div>
                      ) : (
                        <CustomInputDropdown
                          label="GST Type"
                          options={gstTypes}
                          selectedOption={detail.Gst || ''}
                          onChange={(value) => handleDeliveryDetailChange(index, 'Gst', value)}
                          error={errors.DeliveryDetails?.[index]?.Gst?.message}
                        />
                      )}
                      <CustomInput
                        variant="floating"
                        borderThickness="2"
                        label="GST Value"
                        value={detail.GstValue}
                        disabled
                        className="auto-calculated-field"
                        error={errors.DeliveryDetails?.[index]?.GstValue?.message}
                      />
                      {commissionTypes.length === 0 && loading ? (
                        <div>Loading Commission Types...</div>
                      ) : (
                        <CustomInputDropdown
                          label="Commission Type"
                          options={commissionTypes}
                          selectedOption={detail.CommissionType || ''}
                          onChange={(value) => handleDeliveryDetailChange(index, 'CommissionType', value)}
                          error={errors.DeliveryDetails?.[index]?.CommissionType?.message}
                        />
                      )}
                      <CustomInput
                        variant="floating"
                        borderThickness="2"
                        label="Commission (%)"
                        value={detail.CommissionPercentage}
                        onChange={(e) => handleDeliveryDetailChange(index, 'CommissionPercentage', e.target.value)}
                        error={errors.DeliveryDetails?.[index]?.CommissionPercentage?.message}
                      />
                      <CustomInput
                        variant="floating"
                        borderThickness="2"
                        label="Commission Value"
                        value={detail.CommissionValue}
                        disabled
                        className="auto-calculated-field"
                        error={errors.DeliveryDetails?.[index]?.CommissionValue?.message}
                      />
                      <CustomInput
                        variant="floating"
                        borderThickness="2"
                        label="Total Amount"
                        value={detail.TotalAmount}
                        disabled
                        className="auto-calculated-field"
                        error={errors.DeliveryDetails?.[index]?.TotalAmount?.message}
                      />
                      {unitsOfMeasure.length === 0 && loading ? (
                        <div>Loading Units of Measure...</div>
                      ) : (
                        <CustomInputDropdown
                            label="Unit of Measure"
                            options={unitsOfMeasure}
                            selectedOption={detail.UnitOfMeasure || ''}
                            onChange={(value) => handleDeliveryDetailChange(index, 'UnitOfMeasure', value)}
                            error={errors.DeliveryDetails?.[index]?.UnitOfMeasure?.message}
                          />
                      )}
                      <CustomInput
                        variant="floating"
                        borderThickness="2"
                        label="Tolerance (%)"
                        value={detail.Tolerance}
                        onChange={(e) => handleDeliveryDetailChange(index, 'Tolerance', e.target.value)}
                        error={errors.DeliveryDetails?.[index]?.Tolerance?.message}
                      />
                      <CustomInputDropdown
                        label="Packing"
                        options={packings}
                        selectedOption={detail.Packing}
                        onChange={(value) => handleDeliveryDetailChange(index, 'Packing', value)}
                        error={errors.DeliveryDetails?.[index]?.Packing?.message}
                      />
                      <CustomInputDropdown
                        label="Piece Length"
                        options={pieceLengths}
                        selectedOption={detail.PieceLength}
                        onChange={(value) => handleDeliveryDetailChange(index, 'PieceLength', value)}
                        error={errors.DeliveryDetails?.[index]?.PieceLength?.message}
                      />
                      {paymentTerms.length === 0 && loading ? (
                        <div>Loading Payment Terms...</div>
                        ) : (
                          <CustomInputDropdown
                            label="Pay Term Seller"
                            options={paymentTerms}
                            selectedOption={detail.PaymentTermsSeller || ''}
                            onChange={(value) => handleDeliveryDetailChange(index, 'PaymentTermsSeller', value)}
                            error={errors.DeliveryDetails?.[index]?.PaymentTermsSeller?.message}
                          />
                      )}
                      {paymentTerms.length === 0 && loading ? (
                        <div>Loading Payment Terms...</div>
                        ) : (
                          <CustomInputDropdown
                            label="Pay Term Buyer"
                            options={paymentTerms}
                            selectedOption={detail.PaymentTermsBuyer || ''}
                            onChange={(value) => handleDeliveryDetailChange(index, 'PaymentTermsBuyer', value)}
                            error={errors.DeliveryDetails?.[index]?.PaymentTermsBuyer?.message}
                          />
                      )}
                      <CustomInput
                        variant="floating"
                        borderThickness="2"
                        label="Finish Width"
                        value={detail.FinishWidth}
                        onChange={(e) => handleDeliveryDetailChange(index, 'FinishWidth', e.target.value)}
                        error={errors.DeliveryDetails?.[index]?.FinishWidth?.message}
                      />
                      {deliveryTerms.length === 0 && loading ? (
                        <div>Loading Delivery Terms...</div>
                        ) : (
                          <CustomInputDropdown
                            label="Delivery Terms"
                            options={deliveryTerms}
                            selectedOption={detail.DeliveryTerms || ''}
                            onChange={(value) => handleDeliveryDetailChange(index, 'DeliveryTerms', value)}
                            error={errors.DeliveryDetails?.[index]?.DeliveryTerms?.message}
                          />
                      )}
                      <CustomInputDropdown
                        label="Commission From"
                        options={commissionFromOptions}
                        selectedOption={detail.CommissionFrom || ''}
                        onChange={(value) => handleDeliveryDetailChange(index, 'CommissionFrom', value)}
                        error={errors.DeliveryDetails?.[index]?.CommissionFrom?.message}
                      />
                      {detail.CommissionFrom === 'Both' && (
                        <>
                          <CustomInput
                            variant="floating"
                            borderThickness="2"
                            label="Seller Commission"
                            value={detail.SellerCommission}
                            onChange={(e) => handleDeliveryDetailChange(index, 'SellerCommission', e.target.value)}
                            error={errors.DeliveryDetails?.[index]?.SellerCommission?.message}
                          />
                          <CustomInput
                            variant="floating"
                            borderThickness="2"
                            label="Buyer Commission"
                            value={detail.BuyerCommission}
                            onChange={(e) => handleDeliveryDetailChange(index, 'BuyerCommission', e.target.value)}
                            error={errors.DeliveryDetails?.[index]?.BuyerCommission?.message}
                          />
                        </>
                      )}
                      <CustomInputDropdown
                        label="Dispatch Later"
                        options={dispatchLaterOptions}
                        selectedOption={detail.DispatchLater || ''}
                        onChange={(value) => handleDeliveryDetailChange(index, 'DispatchLater', value)}
                        error={errors.DeliveryDetails?.[index]?.DispatchLater?.message}
                      />
                      <CustomInput
                        variant="floating"
                        borderThickness="2"
                        label="Seller Remark"
                        value={detail.SellerRemark}
                        onChange={(e) => handleDeliveryDetailChange(index, 'SellerRemark', e.target.value)}
                        error={errors.DeliveryDetails?.[index]?.SellerRemark?.message}
                      />
                      <CustomInput
                        variant="floating"
                        borderThickness="2"
                        label="Buyer Remark"
                        value={detail.BuyerRemark}
                        onChange={(e) => handleDeliveryDetailChange(index, 'BuyerRemark', e.target.value)}
                        error={errors.DeliveryDetails?.[index]?.BuyerRemark?.message}
                      />
                      <CustomInput
                        type="date"
                        variant="floating"
                        borderThickness="2"
                        label="Delivery Date"
                        value={detail.DeliveryDate}
                        onChange={(e) => handleDeliveryDetailChange(index, 'DeliveryDate', e.target.value)}
                        error={errors.DeliveryDetails?.[index]?.DeliveryDate?.message}
                      />
                      <CustomInput
                        variant="floating"
                        borderThickness="2"
                        label="Color"
                        value={detail.Color}
                        onChange={(e) => handleDeliveryDetailChange(index, 'Color', e.target.value)}
                        error={errors.DeliveryDetails?.[index]?.Color?.message}
                      />
                      <CustomInput
                        variant="floating"
                        borderThickness="2"
                        label="Weight"
                        value={detail.Weight}
                        onChange={(e) => handleDeliveryDetailChange(index, 'Weight', e.target.value)}
                        error={errors.DeliveryDetails?.[index]?.Weight?.message}
                      />
                      <CustomInput
                        variant="floating"
                        borderThickness="2"
                        label="Shrinkage"
                        value={detail.Shrinkage}
                        onChange={(e) => handleDeliveryDetailChange(index, 'Shrinkage', e.target.value)}
                        error={errors.DeliveryDetails?.[index]?.Shrinkage?.message}
                      />
                      <CustomInput
                        variant="floating"
                        borderThickness="2"
                        label="Finish"
                        value={detail.Finish}
                        onChange={(e) => handleDeliveryDetailChange(index, 'Finish', e.target.value)}
                        error={errors.DeliveryDetails?.[index]?.Finish?.message}
                      />
                      <CustomInput
                        variant="floating"
                        borderThickness="2"
                        label="Lab Disp.No"
                        value={detail.LBDispNo}
                        onChange={(e) => handleDeliveryDetailChange(index, 'LBDispNo', e.target.value)}
                        error={errors.DeliveryDetails?.[index]?.LBDispNo?.message}
                      />
                      <CustomInput
                        type="date"
                        variant="floating"
                        borderThickness="2"
                        label="Lab Disp.Date"
                        value={detail.LabDispatchDate}
                        onChange={(e) => handleDeliveryDetailChange(index, 'LabDispatchDate', e.target.value)}
                        error={errors.DeliveryDetails?.[index]?.LabDispatchDate?.message}
                      />
                    </div>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addDeliveryDetail}
                  className="mt-2"
                >
                    <MdAdd /> Add Delivery Detail
                </Button>
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