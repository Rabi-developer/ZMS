'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, UseFormRegister, SubmitHandler } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'react-toastify';
import CustomInput from '@/components/ui/CustomInput';
import CustomInputDropdown from '@/components/ui/CustomeInputDropdown';
import DescriptionWithSubSelect from '@/components/ui/DescriptionWithSubSelect';
import { MdAddBusiness, MdAdd, MdDelete, MdArrowForward, MdArrowBack } from 'react-icons/md';
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
import { getAllSelvegeThicknesss } from '@/apis/selvegethickness';
import { getAllInductionThreads } from '@/apis/Inductionthread';
import { getAllGSMs } from '@/apis/gsm';
import { MdLibraryAddCheck } from "react-icons/md";

// Schema definitions
const DeliveryBreakupSchema = z.object({
  Id: z.string().optional(),
  Qty: z.string().min(1, 'Quantity is required'),
  DeliveryDate: z.string().min(1, 'Delivery Date is required'),
});

const AdditionalInfoSchema = z.object({
  Id: z.string().optional(),
  EndUse: z.string().optional(),
  Count: z.string().optional(),
  Weight: z.string().optional(),
  YarnBags: z.string().optional(),
  Labs: z.string().optional(),
});

const SampleDetailSchema = z.object({
  Id: z.string().optional(),
  SampleQty: z.string().optional(),
  SampleReceivedDate: z.string().optional(),
  SampleDeliveredDate: z.string().optional(),
  CreatedBy: z.string().optional(),
  CreationDate: z.string().optional(),
  UpdatedBy: z.string().optional(),
  UpdateDate: z.string().optional(),
  AdditionalInfo: z.array(AdditionalInfoSchema).optional(),
});

const ConversionContractRowSchema = z.object({
  Width: z.string().optional(),
  Quantity: z.string().min(1, 'Quantity is required'),
  PickRate: z.string().optional(),
  FabRate: z.string().optional(),
  Rate: z.string().min(1, 'Rate is required'),
  Amounts: z.string().optional(),
  DeliveryDate: z.string().min(1, 'Delivery Date is required'),
  Wrapwt: z.string().optional(),
  Weftwt: z.string().optional(),
  WrapBag: z.string().optional(),
  WeftBag: z.string().optional(),
  TotalAmountMultiple: z.string().optional(),
  Gst: z.string().min(1, 'GST is required'),
  GstValue: z.string().optional(),
  FabricValue: z.string().optional(),
  CommissionType: z.string().optional(),
  CommissionPercentage: z.string().optional(),
  CommissionValue: z.string().optional(),
  TotalAmount: z.string().optional(),
});

const DietContractRowSchema = z.object({
  LabDispatchNo: z.string().optional(),
  LabDispatchDate: z.string().optional(),
  Color: z.string().optional(),
  Quantity: z.string().min(1, 'Quantity is required'),
  Finish: z.string().optional(),
  Rate: z.string().min(1, 'Rate is required'),
  AmountTotal: z.string().optional(),
  DeliveryDate: z.string().min(1, 'Delivery Date is required'),
  Gst: z.string().min(1, 'GST is required'),
  GstValue: z.string().optional(),
  FabricValue: z.string().optional(),
  CommissionType: z.string().optional(),
  CommissionPercentage: z.string().optional(),
  CommissionValue: z.string().optional(),
  TotalAmount: z.string().optional(),
  Shrinkage: z.string().optional(),
  FinishWidth: z.string().optional(),
  Weight: z.string().optional(),
});

const MultiWidthContractRowSchema = z.object({
  Width: z.string().optional(),
  Quantity: z.string().min(1, 'Quantity is required'),
  Rate: z.string().min(1, 'Rate is required'),
  Amount: z.string().optional(),
  Gst: z.string().min(1, 'GST is required'),
  GstValue: z.string().optional(),
  FabricValue: z.string().optional(),
  CommissionType: z.string().optional(),
  CommissionPercentage: z.string().optional(),
  CommissionValue: z.string().optional(),
  TotalAmount: z.string().optional(),
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
  DeliveryDate: z.string().optional(),
  Refer: z.string().optional(),
  Referdate: z.string().optional(),
  FabricType: z.string().min(1, 'Fabric Type is required'),
  Description: z.string().min(1, 'Description is required'),
  DescriptionSubOptions: z.array(z.string()).optional(),
  Stuff: z.string().min(1, 'Stuff is required'),
  StuffSubOptions: z.array(z.string()).optional(),
  BlendRatio: z.string().optional(),
  BlendType: z.string().optional(),
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
  InductionThread: z.string().optional(),
  InductionThreadSubOptions: z.array(z.string()).optional(),
  GSM: z.string().optional(),
  Quantity: z.string().optional(),
  UnitOfMeasure: z.string().optional(),
  Tolerance: z.string().optional(),
  Rate: z.string().optional(),
  Packing: z.string().optional(),
  PieceLength: z.string().optional(),
  FabricValue: z.string().optional(),
  Gst: z.string().optional(),
  GstValue: z.string().optional(),
  TotalAmount: z.string().optional(),
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
  EndUse: z.string().optional(),
  EndUseSubOptions: z.array(z.string()).optional(),
  Notes: z.string().optional(),
  SelvegeThickness: z.string().optional(),
  DispatchLater: z.string().optional(),
  SellerCommission: z.array(z.string()).optional(),
  BuyerCommission: z.array(z.string()).optional(),
});

type FormData = z.infer<typeof ContractSchema>;

type ConversionContractRow = z.infer<typeof ConversionContractRowSchema>;
type DietContractRow = z.infer<typeof DietContractRowSchema>;
type MultiWidthContractRow = z.infer<typeof MultiWidthContractRowSchema>;

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
  stuff: string;
  blendRatio: string;
  blendType: string;
  warpCount: string;
  warpYarnType: string;
  weftCount: string;
  weftYarnType: string;
  noOfEnds: string;
  noOfPicks: string;
  weaves: string;
  pickInsertion: string;
  width: string;
  final: string;
  selvege: string;
  selvegeWeaves: string;
  selvegeWidth: string;
  inductionThread: string;
  gsm: string;
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
  endUse: string;
  notes?: string;
  selvegeThickness?: string;
  dispatchLater: string;
  sellerCommission?: string;
  buyerCommission?: string;
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

interface CustomDropdownProps {
  label: string;
  options: { id: string; name: string }[];
  selectedOption: string;
  onChange: (value: string) => void;
  error?: string;
  register: UseFormRegister<FormData>;
}

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
  const [inductionThreads, setInductionThreads] = useState<{ id: string; name: string }[]>([]);
  const [gsms, setGsms] = useState<{ id: string; name: string }[]>([]);
  const [stuffs, setStuffs] = useState<{ id: string; name: string }[]>([]);
  const [sellers, setSellers] = useState<{ id: string; name: string }[]>([]);
  const [buyers, setBuyers] = useState<{ id: string; name: string }[]>([]);
  const [deliveryTerms, setDeliveryTerms] = useState<{ id: string; name: string }[]>([]);
  const [commissionTypes, setCommissionTypes] = useState<{ id: string; name: string }[]>([]);
  const [paymentTerms, setPaymentTerms] = useState<{ id: string; name: string }[]>([]);
  const [unitsOfMeasure, setUnitsOfMeasure] = useState<{ id: string; name: string }[]>([]);
  const [gstTypes, setGstTypes] = useState<{ id: string; name: string }[]>([]);
  const [selvegeThicknesses, setSelvegeThicknesses] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [buyerDeliveryBreakups, setBuyerDeliveryBreakups] = useState<Array<{
    Id?: string;
    Qty: string;
    DeliveryDate: string;
  }>>([]);
  const [sellerDeliveryBreakups, setSellerDeliveryBreakups] = useState<Array<{
    Id?: string;
    Qty: string;
    DeliveryDate: string;
  }>>([]);
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
  }>>([]);
  const [submissionErrors, setSubmissionErrors] = useState<string[]>([]);
  const [activeContractType, setActiveContractType] = useState<'Conversion' | 'Diet' | 'MultiWidth' | null>(null);
  const [conversionContractRows, setConversionContractRows] = useState<ConversionContractRow[]>([
    {
      Width: '',
      Quantity: '1',
      PickRate: '',
      FabRate: '',
      Rate: '0',
      Amounts: '',
      DeliveryDate: '',
      Wrapwt: '',
      Weftwt: '',
      WrapBag: '',
      WeftBag: '',
      TotalAmountMultiple: '',
      Gst: '',
      GstValue: '',
      FabricValue: '',
      CommissionType: '',
      CommissionPercentage: '',
      CommissionValue: '',
      TotalAmount: '',
    },
  ]);
  const [dietContractRows, setDietContractRows] = useState<DietContractRow[]>([
    {
      LabDispatchNo: '',
      LabDispatchDate: '',
      Color: '',
      Quantity: '1',
      Finish: '',
      Rate: '0',
      AmountTotal: '',
      DeliveryDate: '',
      Gst: '',
      GstValue: '',
      FabricValue: '',
      CommissionType: '',
      CommissionPercentage: '',
      CommissionValue: '',
      TotalAmount: '',
    },
  ]);
  const [multiWidthContractRows, setMultiWidthContractRows] = useState<MultiWidthContractRow[]>([
    {
      Width: '',
      Quantity: '1',
      Rate: '0',
      Amount: '',
      Gst: '',
      GstValue: '',
      FabricValue: '',
      CommissionType: '',
      CommissionPercentage: '',
      CommissionValue: '',
      TotalAmount: '',
    },
  ]);
  const [activeSection, setActiveSection] = useState<'GeneralInfo' | 'Items' | 'DeliveryDetails'>('GeneralInfo');

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
      Notes: '',
    },
  });

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
        })),
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
  const selectedBlendRatio = watch('BlendRatio');
  const commissionFrom = watch('CommissionFrom');

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
      setValue('BlendType', subDescArray[0]?.name || '', { shouldValidate: true });
    } else {
      setBlendTypeOptions([]);
      setValue('BlendType', '', { shouldValidate: true });
    }
  }, [selectedBlendRatio, blendRatios, setValue]);

  // Calculations for Conversion Contract Rows
  useEffect(() => {
    const noOfEnds = parseFloat(watch('NoOfEnds') || '0');
    setConversionContractRows((prevRows) =>
      prevRows.map((row) => {
        const pickRate = parseFloat(row.PickRate || '0');
        const fabRate = (pickRate * noOfEnds).toFixed(2);
        const qty = parseFloat(row.Quantity || '0');
        const amounts = (qty * parseFloat(fabRate || '0')).toFixed(2);
        const wrapwt = parseFloat(row.Wrapwt || '0');
        const wrapBag = ((qty * wrapwt) / 100).toFixed(2);
        const weftwt = parseFloat(row.Weftwt || '0');
        const weftBag = ((qty * weftwt) / 100).toFixed(2);
        const totalAmountMultiple = (
          parseFloat(wrapBag || '0') + parseFloat(weftBag || '0')
        ).toFixed(2);
        const rate = parseFloat(row.Rate || '0');
        const fabricValue = (qty * rate).toFixed(2);
        const selectedGst = gstTypes.find((g) => g.id === row.Gst);
        let gstValue = '0.00';
        if (selectedGst) {
          const percentage = parseFloat(selectedGst.name.replace('% GST', '')) || 0;
          gstValue = ((parseFloat(fabricValue) * percentage) / 100).toFixed(2);
        }
        const totalAmount = (parseFloat(fabricValue) + parseFloat(gstValue)).toFixed(2);
        let commissionValue = '0.00';
        const commissionPercentage = parseFloat(row.CommissionPercentage || '0');
        if (row.CommissionType) {
          const commissionTypeName = commissionTypes.find(
            (type) => type.id === row.CommissionType,
          )?.name.toLowerCase();
          if (
            commissionTypeName === 'on value' &&
            commissionPercentage > 0 &&
            parseFloat(totalAmount) > 0
          ) {
            commissionValue = (
              (parseFloat(totalAmount) * commissionPercentage) / 100
            ).toFixed(2);
          } else if (
            commissionTypeName === 'on qty' &&
            commissionPercentage > 0 &&
            qty > 0
          ) {
            commissionValue = (qty * commissionPercentage).toFixed(2);
          }
        }
        return {
          ...row,
          FabRate: fabRate,
          Amounts: amounts,
          WrapBag: wrapBag,
          WeftBag: weftBag,
          TotalAmountMultiple: totalAmountMultiple,
          FabricValue: fabricValue,
          GstValue: gstValue,
          TotalAmount: totalAmount,
          CommissionValue: commissionValue,
        };
      }),
    );
  }, [
    conversionContractRows,
    watch('NoOfEnds'),
    gstTypes,
    commissionTypes,
  ]);

  // Calculations for Diet Contract Rows
  useEffect(() => {
    setDietContractRows((prevRows) =>
      prevRows.map((row) => {
        const qty = parseFloat(row.Quantity || '0');
        const rate = parseFloat(row.Rate || '0');
        const amountTotal = (qty * rate).toFixed(2);
        const fabricValue = amountTotal;
        const selectedGst = gstTypes.find((g) => g.id === row.Gst);
        let gstValue = '0.00';
        if (selectedGst) {
          const percentage = parseFloat(selectedGst.name.replace('% GST', '')) || 0;
          gstValue = ((parseFloat(fabricValue) * percentage) / 100).toFixed(2);
        }
        const totalAmount = (parseFloat(fabricValue) + parseFloat(gstValue)).toFixed(2);
        let commissionValue = '0.00';
        const commissionPercentage = parseFloat(row.CommissionPercentage || '0');
        if (row.CommissionType) {
          const commissionTypeName = commissionTypes.find(
            (type) => type.id === row.CommissionType,
          )?.name.toLowerCase();
          if (
            commissionTypeName === 'on value' &&
            commissionPercentage > 0 &&
            parseFloat(totalAmount) > 0
          ) {
            commissionValue = (
              (parseFloat(totalAmount) * commissionPercentage) / 100
            ).toFixed(2);
          } else if (
            commissionTypeName === 'on qty' &&
            commissionPercentage > 0 &&
            qty > 0
          ) {
            commissionValue = (qty * commissionPercentage).toFixed(2);
          }
        }
        return {
          ...row,
          AmountTotal: amountTotal,
          FabricValue: fabricValue,
          GstValue: gstValue,
          TotalAmount: totalAmount,
          CommissionValue: commissionValue,
        };
      }),
    );
  }, [dietContractRows, gstTypes, commissionTypes]);

  // Calculations for Multi Width Contract Rows
  useEffect(() => {
    setMultiWidthContractRows((prevRows) =>
      prevRows.map((row) => {
        const qty = parseFloat(row.Quantity || '0');
        const rate = parseFloat(row.Rate || '0');
        const amount = (qty * rate).toFixed(2);
        const fabricValue = amount;
        const selectedGst = gstTypes.find((g) => g.id === row.Gst);
        let gstValue = '0.00';
        if (selectedGst) {
          const percentage = parseFloat(selectedGst.name.replace('% GST', '')) || 0;
          gstValue = ((parseFloat(fabricValue) * percentage) / 100).toFixed(2);
        }
        const totalAmount = (parseFloat(fabricValue) + parseFloat(gstValue)).toFixed(2);
        let commissionValue = '0.00';
        const commissionPercentage = parseFloat(row.CommissionPercentage || '0');
        if (row.CommissionType) {
          const commissionTypeName = commissionTypes.find(
            (type) => type.id === row.CommissionType,
          )?.name.toLowerCase();
          if (
            commissionTypeName === 'on value' &&
            commissionPercentage > 0 &&
            parseFloat(totalAmount) > 0
          ) {
            commissionValue = (
              (parseFloat(totalAmount) * commissionPercentage) / 100
            ).toFixed(2);
          } else if (
            commissionTypeName === 'on qty' &&
            commissionPercentage > 0 &&
            qty > 0
          ) {
            commissionValue = (qty * commissionPercentage).toFixed(2);
          }
        }
        return {
          ...row,
          Amount: amount,
          FabricValue: fabricValue,
          GstValue: gstValue,
          TotalAmount: totalAmount,
          CommissionValue: commissionValue,
        };
      }),
    );
  }, [multiWidthContractRows, gstTypes, commissionTypes]);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);
        await Promise.all([
          fetchCompanies(),
          fetchBranches(),
          fetchDescriptions(),
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
          fetchInductionThreads(),
          fetchGsms(),
          fetchStuffs(),
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
            const splitToArray = (value: string | string[] | null | undefined): string[] => {
              if (typeof value === 'string' && value) {
                return value.split('|').filter((v) => v);
              }
              if (Array.isArray(value)) {
                return value.length > 0 ? value.filter((v): v is string => typeof v === 'string') : [''];
              }
              return [''];
            };

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
              Stuff: initialData.stuff || '',
              BlendRatio: initialData.blendRatio || '',
              BlendType: initialData.blendType || '',
              WarpCount: initialData.warpCount || '',
              WarpYarnType: initialData.warpYarnType || '',
              WeftCount: initialData.weftCount || '',
              WeftYarnType: initialData.weftYarnType || '',
              NoOfEnds: initialData.noOfEnds || '',
              NoOfPicks: initialData.noOfPicks || '',
              Weaves: initialData.weaves || '',
              PickInsertion: initialData.pickInsertion || '',
              Width: initialData.width || '',
              Final: initialData.final || '',
              Selvedge: initialData.selvege || '',
              SelvedgeWeave: initialData.selvegeWeaves || '',
              SelvedgeWidth: initialData.selvegeWidth || '',
              InductionThread: initialData.inductionThread || '',
              GSM: initialData.gsm || '',
              Quantity: initialData.quantity || '1',
              UnitOfMeasure: initialData.unitOfMeasure || '',
              Tolerance: initialData.tolerance || '',
              Rate: initialData.rate || '0',
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
              EndUse: initialData.endUse || '',
              Notes: initialData.notes || '',
              SelvegeThickness: initialData.selvegeThickness || '',
              DispatchLater: initialData.dispatchLater || '',
              SellerCommission: splitToArray(initialData.sellerCommission),
              BuyerCommission: splitToArray(initialData.buyerCommission),
            };

            reset(formattedData);

            if (initialData.buyerDeliveryBreakups) {
              setBuyerDeliveryBreakups(
                initialData.buyerDeliveryBreakups.map((breakup) => ({
                  Id: breakup.id,
                  Qty: breakup.qty,
                  DeliveryDate: breakup.deliveryDate,
                })),
              );
            }
            if (initialData.sellerDeliveryBreakups) {
              setSellerDeliveryBreakups(
                initialData.sellerDeliveryBreakups.map((breakup) => ({
                  Id: breakup.id,
                  Qty: breakup.qty,
                  DeliveryDate: breakup.deliveryDate,
                })),
              );
            }
            if (initialData.sampleDetails) {
              setSampleDetails(
                initialData.sampleDetails.map((detail) => ({
                  Id: detail.id,
                  SampleQty: detail.sampleQty || '',
                  SampleReceivedDate: detail.sampleReceivedDate || '',
                  SampleDeliveredDate: detail.sampleDeliveredDate || '',
                  CreatedBy: detail.createdBy || '',
                  CreationDate: detail.creationDate || '',
                  UpdatedBy: detail.updatedBy || '',
                  UpdateDate: detail.updateDate || '',
                  AdditionalInfo: (detail.additionalInfo || []).map((info) => ({
                    Id: info.id,
                    EndUse: info.endUse || '',
                    Count: info.count || '',
                    Weight: info.weight || '',
                    YarnBags: info.yarnBags || '',
                    Labs: info.labs || '',
                  })),
                })),
              );
            }

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
        AdditionalInfo: [],
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
    updatedSampleDetails[sampleIndex].AdditionalInfo = updatedSampleDetails[
      sampleIndex
    ].AdditionalInfo.filter((_, i) => i !== infoIndex);
    setSampleDetails(updatedSampleDetails);
  };

  const addConversionContractRow = () => {
    setConversionContractRows([
      ...conversionContractRows,
      {
        Width: '',
        Quantity: '1',
        PickRate: '',
        FabRate: '',
        Rate: '0',
        Amounts: '',
        DeliveryDate: '',
        Wrapwt: '',
        Weftwt: '',
        WrapBag: '',
        WeftBag: '',
        TotalAmountMultiple: '',
        Gst: '',
        GstValue: '',
        FabricValue: '',
        CommissionType: '',
        CommissionPercentage: '',
        CommissionValue: '',
        TotalAmount: '',
      },
    ]);
  };

  const addDietContractRow = () => {
    setDietContractRows([
      ...dietContractRows,
      {
        LabDispatchNo: '',
        LabDispatchDate: '',
        Color: '',
        Quantity: '1',
        Finish: '',
        Rate: '0',
        AmountTotal: '',
        DeliveryDate: '',
        Gst: '',
        GstValue: '',
        FabricValue: '',
        CommissionType: '',
        CommissionPercentage: '',
        CommissionValue: '',
        TotalAmount: '',
      },
    ]);
  };

  const addMultiWidthContractRow = () => {
    setMultiWidthContractRows([
      ...multiWidthContractRows,
      {
        Width: '',
        Quantity: '1',
        Rate: '0',
        Amount: '',
        Gst: '',
        GstValue: '',
        FabricValue: '',
        CommissionType: '',
        CommissionPercentage: '',
        CommissionValue: '',
        TotalAmount: '',
      },
    ]);
  };

  const removeConversionContractRow = (index: number) => {
    setConversionContractRows(conversionContractRows.filter((_, i) => i !== index));
  };

  const removeDietContractRow = (index: number) => {
    setDietContractRows(dietContractRows.filter((_, i) => i !== index));
  };

  const removeMultiWidthContractRow = (index: number) => {
    setMultiWidthContractRows(multiWidthContractRows.filter((_, i) => i !== index));
  };

  const handleConversionContractChange = (
    index: number,
    field: keyof ConversionContractRow,
    value: string,
  ) => {
    setConversionContractRows((prev) =>
      prev.map((row, i) =>
        i === index ? { ...row, [field]: value } : row,
      ),
    );
  };

  const handleDietContractChange = (
    index: number,
    field: keyof DietContractRow,
    value: string,
  ) => {
    setDietContractRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)),
    );
  };

  const handleMultiWidthContractChange = (
    index: number,
    field: keyof MultiWidthContractRow,
    value: string,
  ) => {
    setMultiWidthContractRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)),
    );
  };

  const validateBreakups = (
    breakups: Array<{ Id?: string; Qty: string; DeliveryDate: string }>,
  ) => {
    return breakups.filter((breakup) => {
      try {
        DeliveryBreakupSchema.parse(breakup);
        return true;
      } catch (error) {
        return false;
      }
    });
  };

  const validateSampleDetails = (
    details: Array<{
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
    }>,
  ) => {
    return details.filter((detail) => {
      try {
        SampleDetailSchema.parse(detail);
        return (
          detail.SampleQty ||
          detail.SampleReceivedDate ||
          detail.SampleDeliveredDate
        );
      } catch (error) {
        return false;
      }
    });
  };

  const validateSection = async (section: 'GeneralInfo' | 'Items' | 'DeliveryDetails') => {
    const fieldsToValidate: Record<string, (keyof FormData)[]> = {
      GeneralInfo: [
        'CompanyId', 'BranchId', 'ContractNumber', 'Date', 'ContractType', 'ContractOwner',
        'Seller', 'Buyer', 'FabricType',
      ],
      Items: [
        'Description', 'Stuff', 'WeftYarnType',
      ],
      DeliveryDetails: [
        // Add required fields if any
      ],
    };

    const fields = fieldsToValidate[section];
    const validationResults = await Promise.all(
      fields.map((field) => trigger(field)),
    );

    return validationResults.every((result) => result);
  };

  const handleNextSection = async () => {
    const sectionOrder: ('GeneralInfo' | 'Items' | 'DeliveryDetails')[] = [
      'GeneralInfo',
      'Items',
      'DeliveryDetails',
    ];
    const currentIndex = sectionOrder.indexOf(activeSection);
    if (currentIndex < sectionOrder.length - 1) {
      const isValid = await validateSection(activeSection);
      if (isValid) {
        setActiveSection(sectionOrder[currentIndex + 1]);
      } else {
        toast('Please fill all required fields before proceeding.', { type: 'error' });
      }
    }
  };

  const handlePreviousSection = () => {
    const sectionOrder: ('GeneralInfo' | 'Items' | 'DeliveryDetails')[] = [
      'GeneralInfo',
      'Items',
      'DeliveryDetails',
    ];
    const currentIndex = sectionOrder.indexOf(activeSection);
    if (currentIndex > 0) {
      setActiveSection(sectionOrder[currentIndex - 1]);
    }
  };

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    try {
      setSubmissionErrors([]);
      const validBuyerBreakups = validateBreakups(buyerDeliveryBreakups);
      const validSellerBreakups = validateBreakups(sellerDeliveryBreakups);
      const validSampleDetails = validateSampleDetails(sampleDetails);

      const buyerDeliveryBreakupsPayload = validBuyerBreakups.map((b) => ({
        id: b.Id,
        qty: b.Qty,
        deliveryDate: b.DeliveryDate,
      }));
      const sellerDeliveryBreakupsPayload = validSellerBreakups.map((b) => ({
        id: b.Id,
        qty: b.Qty,
        deliveryDate: b.DeliveryDate,
      }));

      const sampleDetailsPayload = validSampleDetails.map((s) => ({
        id: s.Id,
        sampleQty: s.SampleQty,
        sampleReceivedDate: s.SampleReceivedDate,
        sampleDeliveredDate: s.SampleDeliveredDate,
        createdBy: s.CreatedBy,
        creationDate: s.CreationDate,
        updatedBy: s.UpdatedBy,
        updateDate: s.UpdateDate,
        additionalInfo: (s.AdditionalInfo || []).map((a) => ({
          id: a.Id,
          endUse: a.EndUse,
          count: a.Count,
          weight: a.Weight,
          yarnBags: a.YarnBags,
          labs: a.Labs,
        })),
      }));

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
        stuff: data.Stuff,
        blendRatio: data.BlendRatio || '',
        blendType: data.BlendType || '',
        warpCount: data.WarpCount || '',
        warpYarnType: data.WarpYarnType || '',
        weftCount: data.WeftCount || '',
        weftYarnType: data.WeftYarnType,
        noOfEnds: data.NoOfEnds || '',
        noOfPicks: data.NoOfPicks || '',
        weaves: data.Weaves || '',
        pickInsertion: data.PickInsertion || '',
        width: data.Width || '',
        final: data.Final || '',
        selvege: data.Selvedge || '',
        selvegeWeaves: data.SelvedgeWeave || '',
        selvegeWidth: data.SelvedgeWidth || '',
        inductionThread: data.InductionThread || '',
        gsm: data.GSM || '',
        quantity: data.Quantity || '',
        unitOfMeasure: data.UnitOfMeasure || '',
        tolerance: data.Tolerance || '',
        rate: data.Rate || '',
        packing: data.Packing || '',
        pieceLength: data.PieceLength || '',
        fabricValue: data.FabricValue || '',
        gst: data.Gst || '',
        gstValue: data.GstValue || '',
        totalAmount: data.TotalAmount || '',
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
        endUse: data.EndUse || '',
        notes: data.Notes || '',
        selvegeThickness: data.SelvegeThickness || '',
        dispatchLater: data.DispatchLater || '',
        sellerCommission:
          commissionFrom === 'Both'
            ? (data.SellerCommission || []).filter((v) => v).join('|')
            : '',
        buyerCommission:
          commissionFrom === 'Both'
            ? (data.BuyerCommission || []).filter((v) => v).join('|')
            : '',
        buyerDeliveryBreakups: buyerDeliveryBreakupsPayload,
        sellerDeliveryBreakups: sellerDeliveryBreakupsPayload,
        sampleDetails: sampleDetailsPayload,
        conversionContractRows:
          activeContractType === 'Conversion'
            ? conversionContractRows.map((row) => ({
                width: row.Width,
                quantity: row.Quantity,
                pickRate: row.PickRate,
                fabRate: row.FabRate,
                rate: row.Rate,
                amounts: row.Amounts,
                deliveryDate: row.DeliveryDate,
                wrapwt: row.Wrapwt,
                weftwt: row.Weftwt,
                wrapBag: row.WrapBag,
                weftBag: row.WeftBag,
                totalAmountMultiple: row.TotalAmountMultiple,
                gst: row.Gst,
                gstValue: row.GstValue,
                fabricValue: row.FabricValue,
                commissionType: row.CommissionType,
                commissionPercentage: row.CommissionPercentage,
                commissionValue: row.CommissionValue,
                totalAmount: row.TotalAmount,
              }))
            : [],
        dietContractRows:
          activeContractType === 'Diet'
            ? dietContractRows.map((row) => ({
                labDispatchNo: row.LabDispatchNo,
                labDispatchDate: row.LabDispatchDate,
                color: row.Color,
                quantity: row.Quantity,
                finish: row.Finish,
                rate: row.Rate,
                amountTotal: row.AmountTotal,
                deliveryDate: row.DeliveryDate,
                gst: row.Gst,
                gstValue: row.GstValue,
                fabricValue: row.FabricValue,
                commissionType: row.CommissionType,
                commissionPercentage: row.CommissionPercentage,
                commissionValue: row.CommissionValue,
                totalAmount: row.TotalAmount,
              }))
            : [],
        multiWidthContractRows:
          activeContractType === 'MultiWidth'
            ? multiWidthContractRows.map((row) => ({
                width: row.Width,
                quantity: row.Quantity,
                rate: row.Rate,
                amount: row.Amount,
                gst: row.Gst,
                gstValue: row.GstValue,
                fabricValue: row.FabricValue,
                commissionType: row.CommissionType,
                commissionPercentage: row.CommissionPercentage,
                commissionValue: row.CommissionValue,
                totalAmount: row.TotalAmount,
              }))
            : [],
      };

      const cleanPayload = Object.fromEntries(
        Object.entries(payload).filter(([key, value]) => {
          if (Array.isArray(value)) {
            return true;
          }
          return value !== undefined && value !== null;
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
    } catch (error: any) {
      console.error('Error submitting form:', error);
      const errorMessages = error?.response?.data?.errors || ['Error submitting contract'];
      setSubmissionErrors(errorMessages);
      toast(errorMessages.join(', '), { type: 'error' });
    }
  };
  useEffect(() => {
  if (activeSection === 'DeliveryDetails') {
    setActiveContractType('Conversion');
  }
}, [activeSection]);

  return (
    <div className="container mx-auto bg-white shadow-lg rounded-lg dark:bg-[#030630] p-6">
      <div className="w-full bg-[#06b6d4] h-[7vh] rounded-t-lg flex items-center">
        <h1 className="text-2xl font-mono ml-6 text-white flex items-center gap-2">
          <MdAddBusiness />
          {id ? 'EDIT CONTRACT' : 'ADD NEW CONTRACT'}
        </h1>
      </div>

      <div className="flex flex-col gap-6 p-6">
      <div className="flex justify-center gap-4 border-b border-[#06b6d4] mb-4">
  <button
    onClick={() => setActiveSection('GeneralInfo')}
    className={`px-6 py-2 text-gray-800 relative transition-colors duration-300 mb-2 hover:bg-transparent focus:outline-none
      ${activeSection === 'GeneralInfo' ? 'after:absolute after:bottom-0 after:left-0 after:right-0 after:h-1 after:bg-[#06b6d4] text-[#06b6d4]' : 'hover:text-[#06b6d4]'}`}
  >
    General Info
  </button>
  <button
    onClick={() => setActiveSection('Items')}
    className={`px-6 py-2 text-gray-800 relative transition-colors duration-300 mb-2 hover:bg-transparent focus:outline-none
      ${activeSection === 'Items' ? 'after:absolute after:bottom-0 after:left-0 after:right-0 after:h-1 after:bg-[#06b6d4] text-[#06b6d4]' : 'hover:text-[#06b6d4]'}`}
  >
    Items
  </button>
  <button
    onClick={() => setActiveSection('DeliveryDetails')}
    className={`px-6 py-2 text-gray-800 relative transition-colors duration-300 mb-2 hover:bg-transparent focus:outline-none
      ${activeSection === 'DeliveryDetails' ? 'after:absolute after:bottom-0 after:left-0 after:right-0 after:h-1 after:bg-[#06b6d4] text-[#06b6d4]' : 'hover:text-[#06b6d4]'}`}
  >
    Contracts
  </button>
</div>


        <form onSubmit={handleSubmit(onSubmit)}>
          {activeSection === 'GeneralInfo' && (
            <div className="border rounded-lg p-6 bg-gray-50 dark:bg-gray-800">
              <h2 className="text-xl font-bold text-[#06b6d4] dark:text-white mb-4">General Information</h2>
              <div className="grid grid-cols-3 gap-4">
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
              <div className="flex justify-end mt-6">
                <Button
                  type="button"
                  onClick={handleNextSection}
                  className="bg-[#06b6d4] text-white hover:bg-[#0895b0] flex items-center gap-2"
                >
                  Next <MdArrowForward />
                </Button>
              </div>
            </div>
          )}

        {activeSection === 'Items' && (
  <div className="border rounded-lg p-6 bg-gray-50 dark:bg-gray-800">
    <h2 className="text-2xl font-bold text-[#06b6d4] dark:text-white mb-6">Items</h2>
    
    {/* Yarn and Blend Details Section */}
    <div className="mb-8 p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Yarn & Blend Details</h3>
      <div className="grid grid-cols-5 gap-4">
        <DescriptionWithSubSelect
          label="Description"
          name="Description"
          subName="DescriptionSubOptions"
          options={descriptions}
          selectedOption={watch('Description') || ''}
          selectedSubOptions={
            Array.isArray(watch('DescriptionSubOptions'))
              ? ((watch('DescriptionSubOptions') || []) as unknown[]).slice().filter((v) => typeof v === 'string')
              : []
          }
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
          selectedSubOptions={watch('BlendType') ? [watch('BlendType')].filter((v): v is string => typeof v === 'string') : []}
          onChange={(value) => setValue('BlendRatio', value, { shouldValidate: true })}
          onSubChange={(values) => setValue('BlendType', values[0] || '', { shouldValidate: true })}
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
          selectedSubOptions={
            Array.isArray(watch('WarpYarnTypeSubOptions'))
              ? ((watch('WarpYarnTypeSubOptions') || []) as unknown[]).slice().filter((v) => typeof v === 'string')
              : []
          }
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
          subError={errors.WarpYarnTypeSubOptions?.message}
          register={register}
        />
        <DescriptionWithSubSelect
          label="Induction Thread"
          name="InductionThread"
          subName="InductionThreadSubOptions"
          options={inductionThreads}
          selectedOption={watch('InductionThread') || ''}
          selectedSubOptions={
            Array.isArray(watch('InductionThreadSubOptions'))
              ? (watch('InductionThreadSubOptions') ?? []).slice().filter((v) => typeof v === 'string')
              : []
          }
          onChange={(value) => setValue('InductionThread', value, { shouldValidate: true })}
          onSubChange={(values) => setValue('InductionThreadSubOptions', values, { shouldValidate: true })}
          error={errors.InductionThread?.message}
          subError={errors.InductionThreadSubOptions?.message}
          register={register}
        />
      </div>
    </div>

    {/* Fabric and Measurement Details Section */}
    <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Fabric & Measurement Details</h3>
      <div className="grid grid-cols-5 gap-4">
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
        <DescriptionWithSubSelect
          label="Weaves"
          name="Weaves"
          subName="WeavesSubOptions"
          options={weaves}
          selectedOption={watch('Weaves') || ''}
          selectedSubOptions={
            Array.isArray(watch('WeavesSubOptions'))
              ? watch('WeavesSubOptions')?.slice().filter((v) => typeof v === 'string')
              : []
          }
          onChange={(value) => setValue('Weaves', value, { shouldValidate: true })}
          onSubChange={(values) => setValue('WeavesSubOptions', values, { shouldValidate: true })}
          error={errors.Weaves?.message}
          subError={errors.WeavesSubOptions?.message}
          register={register}
        />
        <DescriptionWithSubSelect
          label="Pick Insertion"
          name="PickInsertion"
          subName="PickInsertionSubOptions"
          options={pickInsertions}
          selectedOption={watch('PickInsertion') || ''}
          selectedSubOptions={
            Array.isArray(watch('PickInsertionSubOptions'))
              ? (watch('PickInsertionSubOptions') ?? []).slice().filter((v) => typeof v === 'string')
              : []
          }
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
          selectedSubOptions={
            Array.isArray(watch('FinalSubOptions'))
              ? (watch('FinalSubOptions') ?? []).slice().filter((v) => typeof v === 'string')
              : []
          }
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
          selectedSubOptions={
            Array.isArray(watch('SelvedgeSubOptions'))
              ? ((watch('SelvedgeSubOptions') || []) as unknown[]).slice().filter((v) => typeof v === 'string')
              : []
          }
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
          selectedSubOptions={
            Array.isArray(watch('SelvedgeWeaveSubOptions'))
              ? watch('SelvedgeWeaveSubOptions')?.slice().filter((v) => typeof v === 'string')
              : []
          }
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
          selectedSubOptions={[]}
          onChange={(value) => setValue('SelvedgeWidth', value, { shouldValidate: true })}
          onSubChange={() => {}}
          error={errors.SelvedgeWidth?.message}
          subError={undefined}
          register={register}
        />
        <CustomInputDropdown
          label="Selvedge Thickness"
          options={selvegeThicknesses}
          selectedOption={watch('SelvegeThickness') || ''}
          onChange={(value) => setValue('SelvegeThickness', value, { shouldValidate: true })}
          error={errors.SelvegeThickness?.message}
          register={register}
        />
        <CustomInputDropdown
          label="GSM"
          options={gsms}
          selectedOption={watch('GSM') || ''}
          onChange={(value) => setValue('GSM', value, { shouldValidate: true })}
          error={errors.GSM?.message}
          register={register}
        />
        <CustomInput
          type="number"
          variant="floating"
          borderThickness="2"
          label="Quantity"
          id="Quantity"
          {...register('Quantity')}
          error={errors.Quantity?.message}
        />
        <CustomInputDropdown
          label="Unit of Measure"
          options={unitsOfMeasure}
          selectedOption={watch('UnitOfMeasure') || ''}
          onChange={(value) => setValue('UnitOfMeasure', value, { shouldValidate: true })}
          error={errors.UnitOfMeasure?.message}
          register={register}
        />
        <CustomInput
          variant="floating"
          borderThickness="2"
          label="Tolerance"
          id="Tolerance"
          {...register('Tolerance')}
          error={errors.Tolerance?.message}
        />
        <CustomInput
          type="number"
          variant="floating"
          borderThickness="2"
          label="Rate"
          id="Rate"
          {...register('Rate')}
          error={errors.Rate?.message}
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
        <CustomInput
          type="number"
          variant="floating"
          borderThickness="2"
          label="Fabric Value"
          id="FabricValue"
          {...register('FabricValue')}
          error={errors.FabricValue?.message}
        />
        <CustomInputDropdown
          label="GST"
          options={gstTypes}
          selectedOption={watch('Gst') || ''}
          onChange={(value) => setValue('Gst', value, { shouldValidate: true })}
          error={errors.Gst?.message}
          register={register}
        />
        <CustomInput
          type="number"
          variant="floating"
          borderThickness="2"
          label="GST Value"
          id="GstValue"
          {...register('GstValue')}
          error={errors.GstValue?.message}
        />
        <CustomInput
          type="number"
          variant="floating"
          borderThickness="2"
          label="Total Amount"
          id="TotalAmount"
          {...register('TotalAmount')}
          error={errors.TotalAmount?.message}
        />
        <CustomInputDropdown
          label="End Use"
          options={endUses}
          selectedOption={watch('EndUse') || ''}
          onChange={(value) => setValue('EndUse', value, { shouldValidate: true })}
          error={errors.EndUse?.message}
          register={register}
        />
      </div>
    </div>

    <div className="flex justify-between mt-8">
      <Button
        type="button"
        onClick={handlePreviousSection}
        className="bg-[#06b6d4] text-white hover:bg-[#0895b0] flex items-center gap-2 px-6 py-2 rounded-lg transition-colors"
      >
        <MdArrowBack /> Previous
      </Button>
      <Button
        type="button"
        onClick={handleNextSection}
        className="bg-[#06b6d4] text-white hover:bg-[#0895b0] flex items-center gap-2 px-6 py-2 rounded-lg transition-colors"
      >
        Next <MdArrowForward />
      </Button>
    </div>
  </div>
)}
    
        {activeSection === 'DeliveryDetails' && (
  <div className="border rounded-lg p-8 bg-gray-50 dark:bg-gray-900">
    <h2 className="text-2xl font-bold text-[#06b6d4] dark:text-white mb-6">Delivery Details</h2>
    <div className="flex justify-center gap-6 mb-6">
      <Button
        type="button"
        onClick={() => setActiveContractType('Conversion')}
        className={`px-6 py-2 text-gray-800 dark:text-gray-200 text-lg font-semibold border-b-2 ${
          activeContractType === 'Conversion' ? 'border-[#06b6d4] text-[#06b6d4]' : 'border-transparent'
        }  hover:text-white hover:bg-[#06b6d4] transition-colors bg-transparent`}
      >
        Conversion Contract
      </Button>
      <Button
        type="button"
        onClick={() => setActiveContractType('Diet')}
        className={`px-6 py-2 text-gray-800 dark:text-gray-200 text-lg font-semibold border-b-2 ${
          activeContractType === 'Diet' ? 'border-[#06b6d4] text-[#06b6d4]' : 'border-transparent'
        }  hover:text-white hover:bg-[#06b6d4] transition-colors bg-transparent`}
      >
        Dyed Contract
      </Button>
      <Button
        type="button"
        onClick={() => setActiveContractType('MultiWidth')}
        className={`px-6 py-2 text-gray-800 dark:text-gray-200 text-lg font-semibold border-b-2 ${
          activeContractType === 'MultiWidth' ? 'border-[#06b6d4] text-[#06b6d4]' : 'border-transparent'
        }  hover:text-white hover:bg-[#06b6d4] transition-colors bg-transparent`}
      >
        Multi Width Contract
      </Button>
    </div>

    {activeContractType === 'Conversion' && (
      <div className="mt-6">
        <div className="overflow-x-auto rounded-lg shadow-md">
          <table className="min-w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200">
                {[
                  'Width', 'Quantity', 'Pick Rate', 'Fab Rate', 'Rate', 'Amounts', 'Delivery Date',
                  'Wrap Wt', 'Weft Wt', 'Wrap Bag', 'Weft Bag', 'Total Amt', 'GST', 'GST Value',
                  'Fabric Value', 'Commission Type', 'Commission %', 'Commission Value', 'Total Amount', 'Actions'
                ].map((header, index) => (
                  <th
                    key={index}
                    className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-700 dark:text-gray-200"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {conversionContractRows.map((row, index) => (
                <tr
                  key={index}
                  className="border-t dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <td className="px-4 py-3">
                    <input
                      type="text"
                      value={row.Width}
                      onChange={(e) => handleConversionContractChange(index, 'Width', e.target.value)}
                      className="w-full min-w-[120px] p-2 border rounded-lg focus:ring-2 focus:ring-[#06b6d4] dark:bg-gray-900 dark:text-white dark:border-gray-600"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      value={row.Quantity}
                      onChange={(e) => handleConversionContractChange(index, 'Quantity', e.target.value)}
                      className="w-full min-w-[120px] p-2 border rounded-lg focus:ring-2 focus:ring-[#06b6d4] dark:bg-gray-900 dark:text-white dark:border-gray-600"
                      min="1"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      value={row.PickRate}
                      onChange={(e) => handleConversionContractChange(index, 'PickRate', e.target.value)}
                      className="w-full min-w-[120px] p-2 border rounded-lg focus:ring-2 focus:ring-[#06b6d4] dark:bg-gray-900 dark:text-white dark:border-gray-600"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="text"
                      value={row.FabRate}
                      readOnly
                      className="w-full min-w-[120px] p-2 border rounded-lg bg-gray-100 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      value={row.Rate}
                      onChange={(e) => handleConversionContractChange(index, 'Rate', e.target.value)}
                      className="w-full min-w-[120px] p-2 border rounded-lg focus:ring-2 focus:ring-[#06b6d4] dark:bg-gray-900 dark:text-white dark:border-gray-600"
                      min="0"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="text"
                      value={row.Amounts}
                      readOnly
                      className="w-full min-w-[120px] p-2 border rounded-lg bg-gray-100 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="date"
                      value={row.DeliveryDate}
                      onChange={(e) => handleConversionContractChange(index, 'DeliveryDate', e.target.value)}
                      className="w-full min-w-[150px] p-2 border rounded-lg focus:ring-2 focus:ring-[#06b6d4] dark:bg-gray-900 dark:text-white dark:border-gray-600"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      value={row.Wrapwt}
                      onChange={(e) => handleConversionContractChange(index, 'Wrapwt', e.target.value)}
                      className="w-full min-w-[120px] p-2 border rounded-lg focus:ring-2 focus:ring-[#06b6d4] dark:bg-gray-900 dark:text-white dark:border-gray-600"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      value={row.Weftwt}
                      onChange={(e) => handleConversionContractChange(index, 'Weftwt', e.target.value)}
                      className="w-full min-w-[120px] p-2 border rounded-lg focus:ring-2 focus:ring-[#06b6d4] dark:bg-gray-900 dark:text-white dark:border-gray-600"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="text"
                      value={row.WrapBag}
                      readOnly
                      className="w-full min-w-[120px] p-2 border rounded-lg bg-gray-100 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="text"
                      value={row.WeftBag}
                      readOnly
                      className="w-full min-w-[120px] p-2 border rounded-lg bg-gray-100 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="text"
                      value={row.TotalAmountMultiple}
                      readOnly
                      className="w-full min-w-[120px] p-2 border rounded-lg bg-gray-100 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={row.Gst}
                      onChange={(e) => handleConversionContractChange(index, 'Gst', e.target.value)}
                      className="w-full min-w-[150px] p-2 border rounded-lg focus:ring-2 focus:ring-[#06b6d4] dark:bg-gray-900 dark:text-white dark:border-gray-600"
                    >
                      <option value="">Select GST</option>
                      {gstTypes.map((gst) => (
                        <option key={gst.id} value={gst.id}>
                          {gst.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="text"
                      value={row.GstValue}
                      readOnly
                      className="w-full min-w-[120px] p-2 border rounded-lg bg-gray-100 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="text"
                      value={row.FabricValue}
                      readOnly
                      className="w-full min-w-[120px] p-2 border rounded-lg bg-gray-100 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={row.CommissionType}
                      onChange={(e) => handleConversionContractChange(index, 'CommissionType', e.target.value)}
                      className="w-full min-w-[150px] p-2 border rounded-lg focus:ring-2 focus:ring-[#06b6d4] dark:bg-gray-900 dark:text-white dark:border-gray-600"
                    >
                      <option value="">Select Commission Type</option>
                      {commissionTypes.map((type) => (
                        <option key={type.id} value={type.id}>
                          {type.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      value={row.CommissionPercentage}
                      onChange={(e) => handleConversionContractChange(index, 'CommissionPercentage', e.target.value)}
                      className="w-full min-w-[120px] p-2 border rounded-lg focus:ring-2 focus:ring-[#06b6d4] dark:bg-gray-900 dark:text-white dark:border-gray-600"
                      min="0"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="text"
                      value={row.CommissionValue}
                      readOnly
                      className="w-full min-w-[120px] p-2 border rounded-lg bg-gray-100 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="text"
                      value={row.TotalAmount}
                      readOnly
                      className="w-full min-w-[120px] p-2 border rounded-lg bg-gray-100 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                    />
                  </td>
                  <td className="px-4 py-3 flex gap-2">
                    <Button
                      type="button"
                      onClick={() => removeConversionContractRow(index)}
                      className="flex items-center justify-center bg-red-500 text-white hover:bg-red-600 p-2 rounded-lg transition-colors"
                    >
                      <MdDelete className="w-5 h-5" />
                    </Button>
                    <Button
                      type="button"
                      onClick={addConversionContractRow}
                      className="flex items-center justify-center bg-[#06b6d4] text-white hover:bg-[#0895b0] p-2 rounded-lg transition-colors"
                    >
                      <MdAdd className="w-5 h-5" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="grid grid-cols-2 gap-10 mt-6">
          <div className="grid grid-cols-3 gap-4 border rounded-lg p-6 bg-white dark:bg-gray-800">
            <CustomInputDropdown
              label="Payment Terms (Seller)"
              options={paymentTerms}
              selectedOption={watch('PaymentTermsSeller') || ''}
              onChange={(value) => setValue('PaymentTermsSeller', value, { shouldValidate: true })}
              error={errors.PaymentTermsSeller?.message}
              register={register}
            />
            <CustomInputDropdown
              label="Payment Terms (Buyer)"
              options={paymentTerms}
              selectedOption={watch('PaymentTermsBuyer') || ''}
              onChange={(value) => setValue('PaymentTermsBuyer', value, { shouldValidate: true })}
              error={errors.PaymentTermsBuyer?.message}
              register={register}
            />
            <CustomInputDropdown
              label="Delivery Terms"
              options={deliveryTerms}
              selectedOption={watch('DeliveryTerms') || ''}
              onChange={(value) => setValue('DeliveryTerms', value, { shouldValidate: true })}
              error={errors.DeliveryTerms?.message}
              register={register}
            />
            <CustomInputDropdown
              label="Commission From"
              options={commissionFromOptions}
              selectedOption={watch('CommissionFrom') || ''}
              onChange={(value) => setValue('CommissionFrom', value, { shouldValidate: true })}
              error={errors.CommissionFrom?.message}
              register={register}
            />
            {commissionFrom === 'Both' && (
              <>
                <CustomInput
                  variant="floating"
                  borderThickness="2"
                  label="Seller Commission"
                  id="SellerCommission"
                  {...register('SellerCommission')}
                  error={errors.SellerCommission?.message}
                />
                <CustomInput
                  variant="floating"
                  borderThickness="2"
                  label="Buyer Commission"
                  id="BuyerCommission"
                  {...register('BuyerCommission')}
                  error={errors.BuyerCommission?.message}
                />
              </>
            )}
            <CustomInput
              variant="floating"
              borderThickness="2"
              label="Dispatch Address"
              id="DispatchAddress"
              {...register('DispatchAddress')}
              error={errors.DispatchAddress?.message}
            />
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
          <div className="space-y-6 border rounded-lg p-6 bg-white dark:bg-gray-800">
            <div>
              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2">Seller Delivery Breakup</h3>
              {sellerDeliveryBreakups.map((breakup, index) => (
                <div key={index} className="flex gap-2 mb-4">
                  <CustomInput
                    type="number"
                    variant="floating"
                    borderThickness="2"
                    label="Quantity"
                    value={breakup.Qty}
                    onChange={(e) => handleSellerDeliveryBreakupChange(index, 'Qty', e.target.value)}
                    error={undefined}
                  />
                  <CustomInput
                    type="date"
                    variant="floating"
                    borderThickness="2"
                    label="Delivery Date"
                    value={breakup.DeliveryDate}
                    onChange={(e) => handleSellerDeliveryBreakupChange(index, 'DeliveryDate', e.target.value)}
                    error={undefined}
                  />
                  <Button
                    type="button"
                    onClick={() => removeSellerDeliveryBreakup(index)}
                    className="bg-red-500 text-white hover:bg-red-600 mt-2 p-2 rounded-lg"
                  >
                    <MdDelete className="w-5 h-5" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                onClick={addSellerDeliveryBreakup}
                className="bg-[#06b6d4] text-white hover:bg-[#0895b0] px-4 py-2 rounded-lg"
              >
                Add
              </Button>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2">Buyer Delivery Breakup</h3>
              {buyerDeliveryBreakups.map((breakup, index) => (
                <div key={index} className="flex gap-2 mb-4">
                  <CustomInput
                    type="number"
                    variant="floating"
                    borderThickness="2"
                    label="Quantity"
                    value={breakup.Qty}
                    onChange={(e) => handleBuyerDeliveryBreakupChange(index, 'Qty', e.target.value)}
                    error={undefined}
                  />
                  <CustomInput
                    type="date"
                    variant="floating"
                    borderThickness="2"
                    label="Delivery Date"
                    value={breakup.DeliveryDate}
                    onChange={(e) => handleBuyerDeliveryBreakupChange(index, 'DeliveryDate', e.target.value)}
                    error={undefined}
                  />
                  <Button
                    type="button"
                    onClick={() => removeBuyerDeliveryBreakup(index)}
                    className="bg-red-500 text-white hover:bg-red-600 mt-2 p-2 rounded-lg"
                  >
                    <MdDelete className="w-5 h-5" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                onClick={addBuyerDeliveryBreakup}
                className="bg-[#06b6d4] text-white hover:bg-[#0895b0] px-4 py-2 rounded-lg"
              >
                Add
              </Button>
            </div>
          </div>
        </div>
      </div>
    )}

    {activeContractType === 'Diet' && (
      <div className="mt-6">
        <div className="overflow-x-auto rounded-lg shadow-md">
          <table className="min-w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200">
                {[
                  'Lab Dispatch No', 'Lab Dispatch Date', 'Color', 'Quantity', 'Finish', 'Rate',
                  'Amount Total', 'Delivery Date', 'GST', 'GST Value', 'Fabric Value',
                  'Commission Type', 'Commission %', 'Commission Value', 'Total Amount', 'Shrinkage', 'Finish Width','Weight', 'Actions'
                ].map((header, index) => (
                  <th
                    key={index}
                    className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-700 dark:text-gray-200"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dietContractRows.map((row, index) => (
                <tr
                  key={index}
                  className="border-t dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <td className="px-4 py-3">
                    <input
                      type="text"
                      value={row.LabDispatchNo}
                      onChange={(e) => handleDietContractChange(index, 'LabDispatchNo', e.target.value)}
                      className="w-full min-w-[150px] p-2 border rounded-lg focus:ring-2 focus:ring-[#06b6d4] dark:bg-gray-900 dark:text-white dark:border-gray-600"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="date"
                      value={row.LabDispatchDate}
                      onChange={(e) => handleDietContractChange(index, 'LabDispatchDate', e.target.value)}
                      className="w-full min-w-[150px] p-2 border rounded-lg focus:ring-2 focus:ring-[#06b6d4] dark:bg-gray-900 dark:text-white dark:border-gray-600"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="text"
                      value={row.Color}
                      onChange={(e) => handleDietContractChange(index, 'Color', e.target.value)}
                      className="w-full min-w-[120px] p-2 border rounded-lg focus:ring-2 focus:ring-[#06b6d4] dark:bg-gray-900 dark:text-white dark:border-gray-600"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      value={row.Quantity}
                      onChange={(e) => handleDietContractChange(index, 'Quantity', e.target.value)}
                      className="w-full min-w-[120px] p-2 border rounded-lg focus:ring-2 focus:ring-[#06b6d4] dark:bg-gray-900 dark:text-white dark:border-gray-600"
                      min="1"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="text"
                      value={row.Finish}
                      onChange={(e) => handleDietContractChange(index, 'Finish', e.target.value)}
                      className="w-full min-w-[120px] p-2 border rounded-lg focus:ring-2 focus:ring-[#06b6d4] dark:bg-gray-900 dark:text-white dark:border-gray-600"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      value={row.Rate}
                      onChange={(e) => handleDietContractChange(index, 'Rate', e.target.value)}
                      className="w-full min-w-[120px] p-2 border rounded-lg focus:ring-2 focus:ring-[#06b6d4] dark:bg-gray-900 dark:text-white dark:border-gray-600"
                      min="0"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="text"
                      value={row.AmountTotal}
                      readOnly
                      className="w-full min-w-[120px] p-2 border rounded-lg bg-gray-100 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="date"
                      value={row.DeliveryDate}
                      onChange={(e) => handleDietContractChange(index, 'DeliveryDate', e.target.value)}
                      className="w-full min-w-[150px] p-2 border rounded-lg focus:ring-2 focus:ring-[#06b6d4] dark:bg-gray-900 dark:text-white dark:border-gray-600"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={row.Gst}
                      onChange={(e) => handleDietContractChange(index, 'Gst', e.target.value)}
                      className="w-full min-w-[150px] p-2 border rounded-lg focus:ring-2 focus:ring-[#06b6d4] dark:bg-gray-900 dark:text-white dark:border-gray-600"
                    >
                      <option value="">Select GST</option>
                      {gstTypes.map((gst) => (
                        <option key={gst.id} value={gst.id}>
                          {gst.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="text"
                      value={row.GstValue}
                      readOnly
                      className="w-full min-w-[120px] p-2 border rounded-lg bg-gray-100 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="text"
                      value={row.FabricValue}
                      readOnly
                      className="w-full min-w-[120px] p-2 border rounded-lg bg-gray-100 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={row.CommissionType}
                      onChange={(e) => handleDietContractChange(index, 'CommissionType', e.target.value)}
                      className="w-full min-w-[150px] p-2 border rounded-lg focus:ring-2 focus:ring-[#06b6d4] dark:bg-gray-900 dark:text-white dark:border-gray-600"
                    >
                      <option value="">Select Commission Type</option>
                      {commissionTypes.map((type) => (
                        <option key={type.id} value={type.id}>
                          {type.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      value={row.CommissionPercentage}
                      onChange={(e) => handleDietContractChange(index, 'CommissionPercentage', e.target.value)}
                      className="w-full min-w-[120px] p-2 border rounded-lg focus:ring-2 focus:ring-[#06b6d4] dark:bg-gray-900 dark:text-white dark:border-gray-600"
                      min="0"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="text"
                      value={row.CommissionValue}
                      readOnly
                      className="w-full min-w-[120px] p-2 border rounded-lg bg-gray-100 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="text"
                      value={row.TotalAmount}
                      readOnly
                      className="w-full min-w-[120px] p-2 border rounded-lg bg-gray-100 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                    />
                  </td>
                  <td>
                 <input
                      type="text"
                      value={row.Shrinkage}
                      onChange={(e) => handleDietContractChange(index, 'LabDispatchNo', e.target.value)}
                      className="w-full min-w-[150px] p-2 border rounded-lg focus:ring-2 focus:ring-[#06b6d4] dark:bg-gray-900 dark:text-white dark:border-gray-600"
                    />
                    </td>
                    <td>
                  <input
                      type="text"
                      value={row.FinishWidth}
                      onChange={(e) => handleDietContractChange(index, 'LabDispatchNo', e.target.value)}
                      className="w-full min-w-[150px] p-2 border rounded-lg focus:ring-2 focus:ring-[#06b6d4] dark:bg-gray-900 dark:text-white dark:border-gray-600"
                    />
                    </td>
                    <td>
                  <input
                      type="text"
                      value={row.Weight}
                      onChange={(e) => handleDietContractChange(index, 'LabDispatchNo', e.target.value)}
                      className="w-full min-w-[150px] p-2 border rounded-lg focus:ring-2 focus:ring-[#06b6d4] dark:bg-gray-900 dark:text-white dark:border-gray-600"
                    />
                    </td>
                  <td className="px-4 py-3 flex gap-2">
                    <Button
                      type="button"
                      onClick={() => removeDietContractRow(index)}
                      className="flex items-center justify-center bg-red-500 text-white hover:bg-red-600 p-2 rounded-lg transition-colors"
                    >
                      <MdDelete className="w-5 h-5" />
                    </Button>
                    <Button
                      type="button"
                      onClick={addDietContractRow}
                      className="flex items-center justify-center bg-[#06b6d4] text-white hover:bg-[#0895b0] p-2 rounded-lg transition-colors"
                    >
                      <MdAdd className="w-5 h-5" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="grid grid-cols-2 gap-10 mt-6">
          <div className="grid grid-cols-3 gap-4 border rounded-lg p-6 bg-white dark:bg-gray-800">
            <CustomInputDropdown
              label="Payment Terms (Seller)"
              options={paymentTerms}
              selectedOption={watch('PaymentTermsSeller') || ''}
              onChange={(value) => setValue('PaymentTermsSeller', value, { shouldValidate: true })}
              error={errors.PaymentTermsSeller?.message}
              register={register}
            />
            <CustomInputDropdown
              label="Payment Terms (Buyer)"
              options={paymentTerms}
              selectedOption={watch('PaymentTermsBuyer') || ''}
              onChange={(value) => setValue('PaymentTermsBuyer', value, { shouldValidate: true })}
              error={errors.PaymentTermsBuyer?.message}
              register={register}
            />
            <CustomInputDropdown
              label="Delivery Terms"
              options={deliveryTerms}
              selectedOption={watch('DeliveryTerms') || ''}
              onChange={(value) => setValue('DeliveryTerms', value, { shouldValidate: true })}
              error={errors.DeliveryTerms?.message}
              register={register}
            />
            <CustomInputDropdown
              label="Commission From"
              options={commissionFromOptions}
              selectedOption={watch('CommissionFrom') || ''}
              onChange={(value) => setValue('CommissionFrom', value, { shouldValidate: true })}
              error={errors.CommissionFrom?.message}
              register={register}
            />
            {commissionFrom === 'Both' && (
              <>
                <CustomInput
                  variant="floating"
                  borderThickness="2"
                  label="Seller Commission"
                  id="SellerCommission"
                  {...register('SellerCommission')}
                  error={errors.SellerCommission?.message}
                />
                <CustomInput
                  variant="floating"
                  borderThickness="2"
                  label="Buyer Commission"
                  id="BuyerCommission"
                  {...register('BuyerCommission')}
                  error={errors.BuyerCommission?.message}
                />
              </>
            )}
            <CustomInput
              variant="floating"
              borderThickness="2"
              label="Dispatch Address"
              id="DispatchAddress"
              {...register('DispatchAddress')}
              error={errors.DispatchAddress?.message}
            />
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
          <div className="space-y-6 border rounded-lg p-6 bg-white dark:bg-gray-800">
            <div>
              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2">Seller Delivery Breakup</h3>
              {sellerDeliveryBreakups.map((breakup, index) => (
                <div key={index} className="flex gap-2 mb-4">
                  <CustomInput
                    type="number"
                    variant="floating"
                    borderThickness="2"
                    label="Quantity"
                    value={breakup.Qty}
                    onChange={(e) => handleSellerDeliveryBreakupChange(index, 'Qty', e.target.value)}
                    error={undefined}
                  />
                  <CustomInput
                    type="date"
                    variant="floating"
                    borderThickness="2"
                    label="Delivery Date"
                    value={breakup.DeliveryDate}
                    onChange={(e) => handleSellerDeliveryBreakupChange(index, 'DeliveryDate', e.target.value)}
                    error={undefined}
                  />
                  <Button
                    type="button"
                    onClick={() => removeSellerDeliveryBreakup(index)}
                    className="bg-red-500 text-white hover:bg-red-600 mt-2 p-2 rounded-lg"
                  >
                    <MdDelete className="w-5 h-5" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                onClick={addSellerDeliveryBreakup}
                className="bg-[#06b6d4] text-white hover:bg-[#0895b0] px-4 py-2 rounded-lg"
              >
                Add
              </Button>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2">Buyer Delivery Breakup</h3>
              {buyerDeliveryBreakups.map((breakup, index) => (
                <div key={index} className="flex gap-2 mb-4">
                  <CustomInput
                    type="number"
                    variant="floating"
                    borderThickness="2"
                    label="Quantity"
                    value={breakup.Qty}
                    onChange={(e) => handleBuyerDeliveryBreakupChange(index, 'Qty', e.target.value)}
                    error={undefined}
                  />
                  <CustomInput
                    type="date"
                    variant="floating"
                    borderThickness="2"
                    label="Delivery Date"
                    value={breakup.DeliveryDate}
                    onChange={(e) => handleBuyerDeliveryBreakupChange(index, 'DeliveryDate', e.target.value)}
                    error={undefined}
                  />
                  <Button
                    type="button"
                    onClick={() => removeBuyerDeliveryBreakup(index)}
                    className="bg-red-500 text-white hover:bg-red-600 mt-2 p-2 rounded-lg"
                  >
                    <MdDelete className="w-5 h-5" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                onClick={addBuyerDeliveryBreakup}
                className="bg-[#06b6d4] text-white hover:bg-[#0895b0] px-4 py-2 rounded-lg"
              >
                Add
              </Button>
            </div>
          </div>
        </div>
      </div>
    )}

    {activeContractType === 'MultiWidth' && (
      <div className="mt-6">
        <div className="overflow-x-auto rounded-lg shadow-md">
          <table className="min-w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200">
                {[
                  'Width', 'Quantity', 'Rate', 'Amount', 'GST', 'GST Value',
                  'Fabric Value', 'Commission Type', 'Commission %', 'Commission Value',
                  'Total Amount', 'Actions'
                ].map((header, index) => (
                  <th
                    key={index}
                    className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-700 dark:text-gray-200"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {multiWidthContractRows.map((row, index) => (
                <tr
                  key={index}
                  className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <td className="px-4 py-3">
                    <input
                      type="text"
                      value={row.Width}
                      onChange={(e) => handleMultiWidthContractChange(index, 'Width', e.target.value)}
                      className="w-full min-w-[120px] p-2 border rounded-lg focus:ring-2 focus:ring-[#06b6d4] dark:bg-gray-900 dark:text-white dark:border-gray-600"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      value={row.Quantity}
                      onChange={(e) => handleMultiWidthContractChange(index, 'Quantity', e.target.value)}
                      className="w-full min-w-[120px] p-2 border rounded-lg focus:ring-2 focus:ring-[#06b6d4] dark:bg-gray-900 dark:text-white dark:border-gray-600"
                      min="1"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      value={row.Rate}
                      onChange={(e) => handleMultiWidthContractChange(index, 'Rate', e.target.value)}
                      className="w-full min-w-[120px] p-2 border rounded-lg focus:ring-2 focus:ring-[#06b6d4] dark:bg-gray-900 dark:text-white dark:border-gray-600"
                      min="0"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="text"
                      value={row.Amount}
                      readOnly
                      className="w-full min-w-[120px] p-2 border rounded-lg bg-gray-100 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={row.Gst}
                      onChange={(e) => handleMultiWidthContractChange(index, 'Gst', e.target.value)}
                      className="w-full min-w-[150px] p-2 border rounded-lg focus:ring-2 focus:ring-[#06b6d4] dark:bg-gray-900 dark:text-white dark:border-gray-600"
                    >
                      <option value="">Select GST</option>
                      {gstTypes.map((gst) => (
                        <option key={gst.id} value={gst.id}>
                          {gst.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="text"
                      value={row.GstValue}
                      readOnly
                      className="w-full min-w-[120px] p-2 border rounded-lg bg-gray-100 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="text"
                      value={row.FabricValue}
                      readOnly
                      className="w-full min-w-[120px] p-2 border rounded-lg bg-gray-100 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={row.CommissionType}
                      onChange={(e) => handleMultiWidthContractChange(index, 'CommissionType', e.target.value)}
                      className="w-full min-w-[150px] p-2 border rounded-lg focus:ring-2 focus:ring-[#06b6d4] dark:bg-gray-900 dark:text-white dark:border-gray-600"
                    >
                      <option value="">Select Commission Type</option>
                      {commissionTypes.map((type) => (
                        <option key={type.id} value={type.id}>
                          {type.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      value={row.CommissionPercentage}
                      onChange={(e) => handleMultiWidthContractChange(index, 'CommissionPercentage', e.target.value)}
                      className="w-full min-w-[120px] p-2 border rounded-lg focus:ring-2 focus:ring-[#06b6d4] dark:bg-gray-900 dark:text-white dark:border-gray-600"
                      min="0"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="text"
                      value={row.CommissionValue}
                      readOnly
                      className="w-full min-w-[120px] p-2 border rounded-lg bg-gray-100 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="text"
                      value={row.TotalAmount}
                      readOnly
                      className="w-full min-w-[120px] p-2 border rounded-lg bg-gray-100 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                    />
                  </td>
                  <td className="px-4 py-3 flex gap-2">
                    <Button
                      type="button"
                      onClick={() => removeMultiWidthContractRow(index)}
                      className="flex items-center justify-center bg-red-500 text-white hover:bg-red-600 p-2 rounded-lg transition-colors"
                    >
                      <MdDelete className="w-5 h-5" />
                    </Button>
                    <Button
                      type="button"
                      onClick={addMultiWidthContractRow}
                      className="flex items-center justify-center bg-[#06b6d4] text-white hover:bg-[#0895b0] p-2 rounded-lg transition-colors"
                    >
                      <MdAdd className="w-5 h-5" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="grid grid-cols-2 gap-10 mt-6">
          <div className="grid grid-cols-3 gap-4 border rounded-lg p-6 bg-white dark:bg-gray-800">
            <CustomInputDropdown
              label="Payment Terms (Seller)"
              options={paymentTerms}
              selectedOption={watch('PaymentTermsSeller') || ''}
              onChange={(value) => setValue('PaymentTermsSeller', value, { shouldValidate: true })}
              error={errors.PaymentTermsSeller?.message}
              register={register}
            />
            <CustomInputDropdown
              label="Payment Terms (Buyer)"
              options={paymentTerms}
              selectedOption={watch('PaymentTermsBuyer') || ''}
              onChange={(value) => setValue('PaymentTermsBuyer', value, { shouldValidate: true })}
              error={errors.PaymentTermsBuyer?.message}
              register={register}
            />
            <CustomInputDropdown
              label="Delivery Terms"
              options={deliveryTerms}
              selectedOption={watch('DeliveryTerms') || ''}
              onChange={(value) => setValue('DeliveryTerms', value, { shouldValidate: true })}
              error={errors.DeliveryTerms?.message}
              register={register}
            />
            <CustomInputDropdown
              label="Commission From"
              options={commissionFromOptions}
              selectedOption={watch('CommissionFrom') || ''}
              onChange={(value) => setValue('CommissionFrom', value, { shouldValidate: true })}
              error={errors.CommissionFrom?.message}
              register={register}
            />
            {commissionFrom === 'Both' && (
              <>
                <CustomInput
                  variant="floating"
                  borderThickness="2"
                  label="Seller Commission"
                  id="SellerCommission"
                  {...register('SellerCommission')}
                  error={errors.SellerCommission?.message}
                />
                <CustomInput
                  variant="floating"
                  borderThickness="2"
                  label="Buyer Commission"
                  id="BuyerCommission"
                  {...register('BuyerCommission')}
                  error={errors.BuyerCommission?.message}
                />
              </>
            )}
            <CustomInput
              variant="floating"
              borderThickness="2"
              label="Dispatch Address"
              id="DispatchAddress"
              {...register('DispatchAddress')}
              error={errors.DispatchAddress?.message}
            />
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
          <div className="space-y-6 border rounded-lg p-6 bg-white dark:bg-gray-800">
            <div>
              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2">Seller Delivery Breakup</h3>
              {sellerDeliveryBreakups.map((breakup, index) => (
                <div key={index} className="flex gap-2 mb-4">
                  <CustomInput
                    type="number"
                    variant="floating"
                    borderThickness="2"
                    label="Quantity"
                    value={breakup.Qty}
                    onChange={(e) => handleSellerDeliveryBreakupChange(index, 'Qty', e.target.value)}
                    error={undefined}
                  />
                  <CustomInput
                    type="date"
                    variant="floating"
                    borderThickness="2"
                    label="Delivery Date"
                    value={breakup.DeliveryDate}
                    onChange={(e) => handleSellerDeliveryBreakupChange(index, 'DeliveryDate', e.target.value)}
                    error={undefined}
                  />
                  <Button
                    type="button"
                    onClick={() => removeSellerDeliveryBreakup(index)}
                    className="bg-red-500 text-white hover:bg-red-600 mt-2 p-2 rounded-lg"
                  >
                    <MdDelete className="w-5 h-5" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                onClick={addSellerDeliveryBreakup}
                className="bg-[#06b6d4] text-white hover:bg-[#0895b0] px-4 py-2 rounded-lg"
              >
                Add
              </Button>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2">Buyer Delivery Breakup</h3>
              {buyerDeliveryBreakups.map((breakup, index) => (
                <div key={index} className="flex gap-2 mb-4">
                  <CustomInput
                    type="number"
                    variant="floating"
                    borderThickness="2"
                    label="Quantity"
                    value={breakup.Qty}
                    onChange={(e) => handleBuyerDeliveryBreakupChange(index, 'Qty', e.target.value)}
                    error={undefined}
                  />
                  <CustomInput
                    type="date"
                    variant="floating"
                    borderThickness="2"
                    label="Delivery Date"
                    value={breakup.DeliveryDate}
                    onChange={(e) => handleBuyerDeliveryBreakupChange(index, 'DeliveryDate', e.target.value)}
                    error={undefined}
                  />
                  <Button
                    type="button"
                    onClick={() => removeBuyerDeliveryBreakup(index)}
                    className="bg-red-500 text-white hover:bg-red-600 mt-2 p-2 rounded-lg"
                  >
                    <MdDelete className="w-5 h-5" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                onClick={addBuyerDeliveryBreakup}
                className="bg-[#06b6d4] text-white hover:bg-[#0895b0] px-4 py-2 rounded-lg"
              >
                Add
              </Button>
            </div>
          </div>
        </div>
      </div>
    )}

    <div className="flex justify-between mt-8">
      <Button
        type="button"
        onClick={handlePreviousSection}
        className="bg-[#06b6d4] text-white hover:bg-[#0895b0] flex items-center gap-2 px-6 py-2 rounded-lg transition-colors"
      >
        <MdArrowBack /> Previous
      </Button>
      <div className="flex gap-4">
        <Button
          type="submit"
          disabled={loading}
          className="bg-[#06b6d4] text-white hover:bg-[#0895b0] flex items-center gap-2 px-6 py-2 rounded-lg transition-colors"
        >
          <MdLibraryAddCheck /> {id ? 'Update Contract' : 'Create Contract'}
        </Button>
        <Link href="/contract">
          <Button className="bg-gray-500 text-white hover:bg-gray-600 flex items-center gap-2 px-6 py-2 rounded-lg transition-colors">
            Cancel
          </Button>
        </Link>
      </div>
    </div>
  </div>
)}
          {submissionErrors.length > 0 && (
            <div className="mt-4 text-red-500">
              <ul>
                {submissionErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default ContractForm;