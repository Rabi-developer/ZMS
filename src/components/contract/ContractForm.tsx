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
import { MdAddBusiness, MdAdd, MdDelete, MdInfo } from 'react-icons/md';
import Link from 'next/link';
import {
  MdStar,
  MdClose,
  MdScale,
  MdArrowUpward,
  MdArrowDownward,
  MdCheck,
  MdTag,
  MdCalendarToday,
  MdAccessTime,
  MdAttachMoney,
  MdShoppingBag,
  MdBookmark,
  MdFavorite,
  MdFlag
} from 'react-icons/md';
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
  GSM: z.string().optional(),
  Quantity: z.string().min(1, 'Quantity is required'),
  UnitOfMeasure: z.string().min(1, 'Unit of Measure is required'),
  Tolerance: z.string().optional(),
  Rate: z.string().min(1, 'Rate is required'),
  Packing: z.string().optional(),
  PieceLength: z.string().optional(),
  FabricValue: z.string().optional(),
  Gst: z.string().min(1, 'GST is required'),
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
  FinishWidth: z.array(z.string()).optional(),
  SellerCommission: z.array(z.string()).optional(),
  BuyerCommission: z.array(z.string()).optional(),
  DispatchLater: z.string().optional(),
  Color: z.array(z.string()).optional(),
  Weight: z.array(z.string()).optional(),
  Shrinkage: z.array(z.string()).optional(),
  Finish: z.array(z.string()).optional(),
  LabDispNo: z.array(z.string()).optional(),
  LabDispDate: z.array(z.string()).optional(),
  PickRate: z.array(z.string()).optional(),
  FabricRate: z.array(z.string()).optional(),
  Amounts: z.array(z.string()).optional(),
  Wrapwt: z.array(z.string()).optional(),
  Weftwt: z.array(z.string()).optional(),
  WrapBag: z.array(z.string()).optional(),
  WeftBag: z.array(z.string()).optional(),
  TotalBag: z.array(z.string()).optional(),
  TotalAmountMultiple: z.array(z.string()).optional(),
});

type FormData = z.infer<typeof ContractSchema>;

type ContractApiResponse = {
  id: string;
  contractNumber: string;
  date: string;
  contractType: "Sale" | "Purchase";
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
  finishWidth: string;
  sellerCommission: string;
  buyerCommission: string;
  dispatchLater: string;
  color: string;
  weight: string;
  shrinkage: string;
  finish: string;
  labDispNo: string;
  labDispDate: string;
  pickRate: string;
  fabricRate: string;
  amounts: string;
  wrapwt: string;
  weftwt: string;
  wrapBag: string;
  weftBag: string;
  totalBag: string;
  totalAmountMultiple: string;
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
  const [showForm, setShowForm] = useState(false);
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
  const [showSamplePopup, setShowSamplePopup] = useState<boolean>(false);
  const currentUser = 'Current User';
  const [fieldValues, setFieldValues] = useState<Partial<Record<keyof FormData, string[]>>>({
    FinishWidth: [''],
    Color: [''],
    Weight: [''],
    Shrinkage: [''],
    Finish: [''],
    LabDispNo: [''],
    LabDispDate: [''],
    PickRate: [''],
    FabricRate: [''],
    Amounts: [''],
    Wrapwt: [''],
    Weftwt: [''],
    WrapBag: [''],
    WeftBag: [''],
    TotalBag: [''],
    TotalAmountMultiple: [''],
    SellerCommission: [''],
    BuyerCommission: [''],
  });
  const [submissionErrors, setSubmissionErrors] = useState<string[]>([]);

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
      ContractType: "Sale",
      Notes: "",
      Quantity: "1",
      Rate: "0",
      FinishWidth: [''],
      Color: [''],
      Weight: [''],
      Shrinkage: [''],
      Finish: [''],
      LabDispNo: [''],
      LabDispDate: [''],
      PickRate: [''],
      FabricRate: [''],
      Amounts: [''],
      Wrapwt: [''],
      Weftwt: [''],
      WrapBag: [''],
      WeftBag: [''],
      TotalBag: [''],
      TotalAmountMultiple: [''],
      SellerCommission: [''],
      BuyerCommission: [''],
    }
  });

  const fieldIcons = {
    FinishWidth: { add: MdAdd, delete: MdDelete },
    Color: { add: MdStar, delete: MdClose },
    Weight: { add: MdScale, delete: MdArrowDownward },
    Shrinkage: { add: MdArrowUpward, delete: MdArrowDownward },
    Finish: { add: MdCheck, delete: MdClose },
    LabDispNo: { add: MdTag, delete: MdDelete },
    LabDispDate: { add: MdCalendarToday, delete: MdClose },
    PickRate: { add: MdAccessTime, delete: MdArrowDownward },
    FabricRate: { add: MdAttachMoney, delete: MdDelete },
    Amounts: { add: MdShoppingBag, delete: MdClose },
    Wrapwt: { add: MdScale, delete: MdDelete },
    Weftwt: { add: MdScale, delete: MdArrowDownward },
    WrapBag: { add: MdShoppingBag, delete: MdDelete },
    WeftBag: { add: MdShoppingBag, delete: MdClose },
    TotalBag: { add: MdBookmark, delete: MdDelete },
    TotalAmountMultiple: { add: MdAttachMoney, delete: MdClose },
    SellerCommission: { add: MdFavorite, delete: MdDelete },
    BuyerCommission: { add: MdFlag, delete: MdClose },
  };

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
          name: buyer.buyerName,
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

  const fetchSelvegeThicknesses = async () => {
    try {
      setLoading(true);
      const response = await getAllSelvegeThicknesss();
      setSelvegeThicknesses(
        response.data.map((item: any) => ({
          id: item.listid,
          name: item.descriptions,
        }))
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
  const quantity = watch('Quantity');
  const rate = watch('Rate');
  const gst = watch('Gst');
  const commissionType = watch('CommissionType');
  const commissionPercentage = watch('CommissionPercentage');
  const commissionFrom = watch('CommissionFrom');
  const noOfEnds = watch('NoOfEnds');

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
      setValue('BlendType', subDescArray[0]?.name || '', { shouldValidate: true });
    } else {
      setBlendTypeOptions([]);
      setValue('BlendType', '', { shouldValidate: true });
    }
  }, [selectedBlendRatio, blendRatios, setValue]);

  // Calculations for Fabric Value, GST Value, Total Amount, and Commission Value
  useEffect(() => {
    // Fabric Value: Quantity * Rate
    const qty = parseFloat(quantity || '0');
    const rt = parseFloat(rate || '0');
    const fabricValue = (qty * rt).toFixed(2);
    setValue('FabricValue', fabricValue, { shouldValidate: true });

    // GST Value: Based on GST Type and Fabric Value
    const selectedGst = gstTypes.find((g) => g.id === gst);
    let gstValue = '0.00';
    if (selectedGst) {
      const percentage = parseFloat(selectedGst.name.replace('% GST', '')) || 0;
      gstValue = ((parseFloat(fabricValue) * percentage) / 100).toFixed(2);
    }
    setValue('GstValue', gstValue, { shouldValidate: true });

    // Total Amount: Fabric Value + GST Value
    const totalAmount = (parseFloat(fabricValue) + parseFloat(gstValue)).toFixed(2);
    setValue('TotalAmount', totalAmount, { shouldValidate: true });

    // Commission Value
    let commissionValue = '0.00';
    const commissionInput = parseFloat(commissionPercentage || '0');
    if (commissionType) {
      const commissionTypeName = commissionTypes.find(
        (type) => type.id === commissionType
      )?.name.toLowerCase();
      if (commissionTypeName === 'on value' && commissionInput > 0 && parseFloat(totalAmount) > 0) {
        commissionValue = ((parseFloat(totalAmount) * commissionInput) / 100).toFixed(2);
      } else if (commissionTypeName === 'on qty' && commissionInput > 0 && qty > 0) {
        commissionValue = (qty * commissionInput).toFixed(2);
      }
    }
    setValue('CommissionValue', commissionValue, { shouldValidate: true });
  }, [quantity, rate, gst, commissionType, commissionPercentage, gstTypes, commissionTypes, setValue]);

  // Calculations for FabricRate, Amounts, WrapBag, WeftBag, and TotalAmountMultiple
  useEffect(() => {
    const pickRate = fieldValues.PickRate || [''];
    const wrapwt = fieldValues.Wrapwt || [''];
    const weftwt = fieldValues.Weftwt || [''];
    const qty = parseFloat(quantity || '0');
    const ends = parseFloat(noOfEnds || '0');

    const maxLength = Math.max(
      pickRate.length,
      wrapwt.length,
      weftwt.length,
      fieldValues.FabricRate?.length || 1,
      fieldValues.Amounts?.length || 1,
      fieldValues.WrapBag?.length || 1,
      fieldValues.WeftBag?.length || 1,
      fieldValues.TotalAmountMultiple?.length || 1
    );

    const fabricRate: string[] = new Array(maxLength).fill('');
    const amounts: string[] = new Array(maxLength).fill('');
    const wrapBag: string[] = new Array(maxLength).fill('');
    const weftBag: string[] = new Array(maxLength).fill('');
    const totalAmountMultiple: string[] = new Array(maxLength).fill('');

    for (let i = 0; i < maxLength; i++) {
      // FabricRate = PickRate * NoOfEnds
      const pr = parseFloat(pickRate[i] || '0');
      fabricRate[i] = (pr * ends).toFixed(2);

      // Amounts = Quantity * FabricRate
      amounts[i] = (qty * parseFloat(fabricRate[i] || '0')).toFixed(2);

      // WrapBag = (Quantity * Wrapwt) / 100
      const ww = parseFloat(wrapwt[i] || '0');
      wrapBag[i] = ((qty * ww) / 100).toFixed(2);

      // WeftBag = (Quantity * Weftwt) / 100
      const wf = parseFloat(weftwt[i] || '0');
      weftBag[i] = ((qty * wf) / 100).toFixed(2);

      // TotalAmountMultiple = WeftBag + WrapBag
      totalAmountMultiple[i] = (
        parseFloat(wrapBag[i] || '0') + parseFloat(weftBag[i] || '0')
      ).toFixed(2);
    }

    setFieldValues((prev) => ({
      ...prev,
      FabricRate: fabricRate,
      Amounts: amounts,
      WrapBag: wrapBag,
      WeftBag: weftBag,
      TotalAmountMultiple: totalAmountMultiple,
    }));

    setValue('FabricRate', fabricRate, { shouldValidate: true });
    setValue('Amounts', amounts, { shouldValidate: true });
    setValue('WrapBag', wrapBag, { shouldValidate: true });
    setValue('WeftBag', weftBag, { shouldValidate: true });
    setValue('TotalAmountMultiple', totalAmountMultiple, { shouldValidate: true });
  }, [
    fieldValues.PickRate,
    fieldValues.Wrapwt,
    fieldValues.Weftwt,
    quantity,
    noOfEnds,
    setValue,
  ]);

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
                    return value.split('|');
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
              FinishWidth: splitToArray(initialData.finishWidth),
              Color: splitToArray(initialData.color),
              Weight: splitToArray(initialData.weight),
              Shrinkage: splitToArray(initialData.shrinkage),
              Finish: splitToArray(initialData.finish),
              LabDispNo: splitToArray(initialData.labDispNo),
              LabDispDate: splitToArray(initialData.labDispDate),
              PickRate: splitToArray(initialData.pickRate),
              FabricRate: splitToArray(initialData.fabricRate),
              Amounts: splitToArray(initialData.amounts),
              Wrapwt: splitToArray(initialData.wrapwt),
              Weftwt: splitToArray(initialData.weftwt),
              WrapBag: splitToArray(initialData.wrapBag),
              WeftBag: splitToArray(initialData.weftBag),
              TotalBag: splitToArray(initialData.totalBag),
              TotalAmountMultiple: splitToArray(initialData.totalAmountMultiple),
              SellerCommission: splitToArray(initialData.sellerCommission),
              BuyerCommission: splitToArray(initialData.buyerCommission),
            };

            reset(formattedData);

            if (initialData.buyerDeliveryBreakups) {
              setBuyerDeliveryBreakups(initialData.buyerDeliveryBreakups.map(breakup => ({
                Id: breakup.id,
                Qty: breakup.qty,
                DeliveryDate: breakup.deliveryDate
              })));
            }
            if (initialData.sellerDeliveryBreakups) {
              setSellerDeliveryBreakups(initialData.sellerDeliveryBreakups.map(breakup => ({
                Id: breakup.id,
                Qty: breakup.qty,
                DeliveryDate: breakup.deliveryDate
              })));
            }
            if (initialData.sampleDetails) {
              setSampleDetails(initialData.sampleDetails.map(detail => ({
                Id: detail.id,
                SampleQty: detail.sampleQty || '',
                SampleReceivedDate: detail.sampleReceivedDate || '',
                SampleDeliveredDate: detail.sampleDeliveredDate || '',
                CreatedBy: detail.createdBy || '',
                CreationDate: detail.creationDate || '',
                UpdatedBy: detail.updatedBy || '',
                UpdateDate: detail.updateDate || '',
                AdditionalInfo: (detail.additionalInfo || []).map(info => ({
                  Id: info.id,
                  EndUse: info.endUse || '',
                  Count: info.count || '',
                  Weight: info.weight || '',
                  YarnBags: info.yarnBags || '',
                  Labs: info.labs || '',
                }))
              })));
            }

            setFieldValues({
              FinishWidth: splitToArray(initialData.finishWidth),
              Color: splitToArray(initialData.color),
              Weight: splitToArray(initialData.weight),
              Shrinkage: splitToArray(initialData.shrinkage),
              Finish: splitToArray(initialData.finish),
              LabDispNo: splitToArray(initialData.labDispNo),
              LabDispDate: splitToArray(initialData.labDispDate),
              PickRate: splitToArray(initialData.pickRate),
              FabricRate: splitToArray(initialData.fabricRate),
              Amounts: splitToArray(initialData.amounts),
              Wrapwt: splitToArray(initialData.wrapwt),
              Weftwt: splitToArray(initialData.weftwt),
              WrapBag: splitToArray(initialData.wrapBag),
              WeftBag: splitToArray(initialData.weftBag),
              TotalBag: splitToArray(initialData.totalBag),
              TotalAmountMultiple: splitToArray(initialData.totalAmountMultiple),
              SellerCommission: splitToArray(initialData.sellerCommission),
              BuyerCommission: splitToArray(initialData.buyerCommission),
            });

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

  const handleAdditionalInfoChange = (sampleIndex: number, infoIndex: number, field: string, value: string) => {
    const updatedSampleDetails = [...sampleDetails];
    updatedSampleDetails[sampleIndex].AdditionalInfo[infoIndex] = {
      ...updatedSampleDetails[sampleIndex].AdditionalInfo[infoIndex],
      [field]: value
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
    setSampleDetails([...sampleDetails, {
      Id: undefined,
      SampleQty: '',
      SampleReceivedDate: '',
      SampleDeliveredDate: '',
      CreatedBy: currentUser,
      CreationDate: new Date().toISOString().split('T')[0],
      UpdatedBy: '',
      UpdateDate: '',
      AdditionalInfo: [],
    }]);
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

  const handleFieldChange = (fieldName: keyof FormData, index: number, value: string) => {
    setFieldValues(prev => {
      const updated = { ...prev };
      updated[fieldName] = [...(updated[fieldName] || [])];
      updated[fieldName]![index] = value;
      return updated;
    });
    const updatedValues = [...(fieldValues[fieldName] || [])];
    updatedValues[index] = value;
    setValue(fieldName, updatedValues, { shouldValidate: true });
  };

  const handleAddField = (fieldName: keyof FormData) => {
    setFieldValues(prev => {
      const updated = { ...prev };
      updated[fieldName] = [...(updated[fieldName] || []), ''];
      return updated;
    });
    setValue(fieldName, [...(fieldValues[fieldName] || []), ''], { shouldValidate: true });
  };

  const handleRemoveField = (fieldName: keyof FormData, index: number) => {
    setFieldValues(prev => {
      const updated = { ...prev };
      updated[fieldName] = (updated[fieldName] || []).filter((_, i) => i !== index);
      return updated;
    });
    setValue(fieldName, fieldValues[fieldName]?.filter((_, i) => i !== index) || [''], { shouldValidate: true });
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
    updatedSampleDetails[sampleIndex].AdditionalInfo = updatedSampleDetails[sampleIndex].AdditionalInfo.filter((_, i) => i !== infoIndex);
    setSampleDetails(updatedSampleDetails);
  };

  const renderMultiInputField = (
    fieldName: keyof FormData,
    label: string,
    index: number,
    DeleteIcon: React.ComponentType<any>,
    isDate: boolean = false
  ) => {
    const disabledFields: (keyof FormData)[] = [
      'FabricRate',
      'Amounts',
      'WrapBag',
      'WeftBag',
      'TotalAmountMultiple',
    ];
    const isDisabled = disabledFields.includes(fieldName);

    return (
      <div key={`${fieldName}-${index}`} className="flex items-center gap-2 mb-2">
        <CustomInput
          variant="floating"
          borderThickness="2"
          label={`${label} ${index + 1}`}
          id={`${fieldName}-${index}`}
          type={isDate ? 'date' : 'text'}
          value={fieldValues[fieldName]?.[index] || ''}
          onChange={(e) => handleFieldChange(fieldName, index, e.target.value)}
          error={Array.isArray(errors[fieldName]) ? errors[fieldName]?.[index]?.message : undefined}
          disabled={isDisabled}
          className={isDisabled ? 'auto-calculated-field' : ''}
        />
        {fieldValues[fieldName]?.length! > 1 && (
          <Button
            type="button"
            onClick={() => handleRemoveField(fieldName, index)}
            className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded-lg flex items-center gap-2"
          >
            <DeleteIcon className="h-5 w-5" />
          </Button>
        )}
      </div>
    );
  };

  const renderMultiInputGroup = (
    fieldName: keyof FormData,
    label: string,
    AddIcon: React.ComponentType<any>,
    DeleteIcon: React.ComponentType<any>,
    isDate: boolean = false
  ) => (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        {label}
      </label>
      {fieldValues[fieldName]?.map((_, index) => renderMultiInputField(fieldName, label, index, DeleteIcon, isDate))}
      <Button
        type="button"
        onClick={() => handleAddField(fieldName)}
        className="bg-[#06b6d4] hover:bg-[#0891b2] text-white px-2 py-1 rounded-lg flex items-center gap-2 mt-2"
      >
        <AddIcon className="h-5 w-5" /> Add {label}
      </Button>
    </div>
  );

  const validateBreakups = (breakups: Array<{ Id?: string; Qty: string; DeliveryDate: string }>) => {
    return breakups.filter(breakup => {
      try {
        DeliveryBreakupSchema.parse(breakup);
        return true;
      } catch (error) {
        return false;
      }
    });
  };

  const validateSampleDetails = (details: Array<{
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
  }>) => {
    return details.filter(detail => {
      try {
        SampleDetailSchema.parse(detail);
        return detail.SampleQty || detail.SampleReceivedDate || detail.SampleDeliveredDate;
      } catch (error) {
        return false;
      }
    });
  };

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    try {
      setSubmissionErrors([]);
      const validBuyerBreakups = validateBreakups(buyerDeliveryBreakups);
      const validSellerBreakups = validateBreakups(sellerDeliveryBreakups);
      const validSampleDetails = validateSampleDetails(sampleDetails);

      const buyerDeliveryBreakupsPayload = validBuyerBreakups.map(b => ({
        id: b.Id,
        qty: b.Qty,
        deliveryDate: b.DeliveryDate,
      }));
      const sellerDeliveryBreakupsPayload = validSellerBreakups.map(b => ({
        id: b.Id,
        qty: b.Qty,
        deliveryDate: b.DeliveryDate,
      }));

      const sampleDetailsPayload = validSampleDetails.map(s => ({
        id: s.Id,
        sampleQty: s.SampleQty,
        sampleReceivedDate: s.SampleReceivedDate,
        sampleDeliveredDate: s.SampleDeliveredDate,
        createdBy: s.CreatedBy,
        creationDate: s.CreationDate,
        updatedBy: s.UpdatedBy,
        updateDate: s.UpdateDate,
        additionalInfo: (s.AdditionalInfo || []).map(a => ({
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
        // createdBy: data.CreatedBy || '',
        creationDate: data.CreationDate || '',
       // updatedBy: data.UpdatedBy || '',
        updationDate: data.UpdationDate || '',
        approvedBy: data.ApprovedBy || '',
        approvedDate: data.ApprovedDate || '',
        endUse: data.EndUse || '',
        notes: data.Notes || '',
        selvegeThickness: data.SelvegeThickness || '',
        finishWidth: fieldValues.FinishWidth?.filter(v => v).join('|') || '',
        color: fieldValues.Color?.filter(v => v).join('|') || '',
        weight: fieldValues.Weight?.filter(v => v).join('|') || '',
        shrinkage: fieldValues.Shrinkage?.filter(v => v).join('|') || '',
        finish: fieldValues.Finish?.filter(v => v).join('|') || '',
        labDispNo: fieldValues.LabDispNo?.filter(v => v).join('|') || '',
        labDispDate: fieldValues.LabDispDate?.filter(v => v).join('|') || '',
        pickRate: fieldValues.PickRate?.filter(v => v).join('|') || '',
        fabricRate: fieldValues.FabricRate?.filter(v => v).join('|') || '',
        amounts: fieldValues.Amounts?.filter(v => v).join('|') || '',
        wrapwt: fieldValues.Wrapwt?.filter(v => v).join('|') || '',
        weftwt: fieldValues.Weftwt?.filter(v => v).join('|') || '',
        wrapBag: fieldValues.WrapBag?.filter(v => v).join('|') || '',
        weftBag: fieldValues.WeftBag?.filter(v => v).join('|') || '',
        totalBag: fieldValues.TotalBag?.filter(v => v).join('|') || '',
        totalAmountMultiple: fieldValues.TotalAmountMultiple?.filter(v => v).join('|') || '',
        sellerCommission: fieldValues.SellerCommission?.filter(v => v).join('|') || '',
        buyerCommission: fieldValues.BuyerCommission?.filter(v => v).join('|') || '',
        dispatchLater: data.DispatchLater || '',
        buyerDeliveryBreakups: buyerDeliveryBreakupsPayload,
        sellerDeliveryBreakups: sellerDeliveryBreakupsPayload,
        sampleDetails: sampleDetailsPayload,
      };

      const cleanPayload = Object.fromEntries(
        Object.entries(payload).filter(([key, value]) => {
          if (Array.isArray(value)) {
            return true; 
          }
          return value !== undefined && value !== null;
        })
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

  return (
    <div className="container mx-auto bg-white shadow-lg rounded-lg dark:bg-[#030630] p-6">
      <div className="w-full bg-[#06b6d4] h-[7vh] rounded-t-lg flex items-center">
        <h1 className="text-2xl font-mono ml-6 text-white flex items-center gap-2">
          <MdAddBusiness />
          {id ? 'EDIT CONTRACT' : 'ADD NEW CONTRACT'}
        </h1>
      </div>

      <div className="flex flex-col gap-6">
        <div className="flex flex-row gap-6 ">
          {/* First Div: Input Fields (70% width) */}
          <div className="w-[100%]">
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="flex flex-row gap-6 p-6">
                {/* First Div: Input Fields (70% width) */}
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
                        selectedSubOptions={Array.isArray(watch('DescriptionSubOptions')) ? (watch('DescriptionSubOptions') ?? []).slice().filter((v): v is string => typeof v === 'string') : []}
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
                        selectedSubOptions={watch('StuffSubOptions') ?? []}
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
                        selectedSubOptions={watch('BlendType') ? [watch('BlendType')!] : []}
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
                            ? (watch('WarpYarnTypeSubOptions') ?? []).slice().filter((v): v is string => typeof v === 'string')
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
                      {weftYarnTypes.length === 0 && loading ? (
                        <div>Loading Weft Yarn Types...</div>
                      ) : (
                        <DescriptionWithSubSelect
                          label="Weft Yarn Type"
                          name="WeftYarnType"
                          subName="WeftYarnTypeSubOptions"
                          options={weftYarnTypes}
                          selectedOption={watch('WeftYarnType') || ''}
                          selectedSubOptions={watch('WeftYarnTypeSubOptions') ?? []}
                          onChange={(value) => setValue('WeftYarnType', value, { shouldValidate: true })}
                          onSubChange={(values) => setValue('WeftYarnTypeSubOptions', values, { shouldValidate: true })}
                          error={errors.WeftYarnType?.message}
                          subError={errors.WarpYarnTypeSubOptions?.message}
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
                        <>
                          <div>Loading Weaves...</div>
                          <DescriptionWithSubSelect
                            label="Weaves"
                            name="Weaves"
                            subName="WeavesSubOptions"
                            options={weaves}
                            selectedOption={watch('Weaves') || ''}
                            selectedSubOptions={Array.isArray(watch('WeavesSubOptions')) ? (watch('WeavesSubOptions') ?? []).slice().filter((v): v is string => typeof v === 'string') : []}
                            onChange={(value) => setValue('Weaves', value, { shouldValidate: true })}
                            onSubChange={(values) => setValue('WeavesSubOptions', values, { shouldValidate: true })}
                            error={errors.Weaves?.message}
                            subError={errors.WeavesSubOptions?.message}
                            register={register}
                          />
                        </>
                      ) : (
                        <DescriptionWithSubSelect
                          label="Weaves"
                          name="Weaves"
                          subName="WeavesSubOptions"
                          options={weaves}
                          selectedOption={watch('Weaves') || ''}
                          selectedSubOptions={Array.isArray(watch('WeavesSubOptions')) ? (watch('WeavesSubOptions') ?? []).slice().filter((v): v is string => typeof v === 'string') : []}
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
                        selectedSubOptions={Array.isArray(watch('SelvedgeSubOptions'))
                          ? (watch('SelvedgeSubOptions') ?? []).slice().filter((v): v is string => typeof v === 'string')
                          : []}
                        onChange={(value) => setValue('Selvedge', value, { shouldValidate: true })}
                        onSubChange={(values) => setValue('SelvedgeSubOptions', values, { shouldValidate: true })}
                        error={errors.Selvedge?.message}
                        subError={errors.SelvedgeSubOptions?.message}
                        register={register} selectedOption={watch('Selvedge') || ''}                      />
                      <DescriptionWithSubSelect
                        label="Selvedge Weave"
                        name="SelvedgeWeave"
                        subName="SelvedgeWeaveSubOptions"
                        options={selvedgeWeaves}
                        selectedOption={watch('SelvedgeWeave') || ''}
                        selectedSubOptions={
                          Array.isArray(watch('SelvedgeWeaveSubOptions'))
                            ? watch('SelvedgeWeaveSubOptions')!.slice().filter((v): v is string => typeof v === 'string')
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
                        subError={errors.SelvedgeSubOptions?.message}
                        register={register}
                      />
                      {selvegeThicknesses.length === 0 && loading ? (
                        <div>Loading Selvage Thickness...</div>
                      ) : (
                        <DescriptionWithSubSelect
                          label="Selvage Thickness"
                          name="SelvegeThickness"
                          subName="SelvegeThicknessSubOptions"
                          options={selvegeThicknesses}
                          selectedOption={watch('SelvegeThickness') || ''}
                          selectedSubOptions={[]}
                          onChange={(value) => setValue('SelvegeThickness', value, { shouldValidate: true })}
                          onSubChange={() => {}}
                          error={errors.SelvegeThickness?.message}
                          subError={undefined}
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
                          selectedSubOptions={[]} // No field in schema, so pass empty array
                          onChange={(value) => setValue('InductionThread', value, { shouldValidate: true })}
                          onSubChange={() => {}} // No-op since not in schema
                          error={errors.InductionThread?.message}
                          subError={undefined}
                          register={register}
                        />
                      )}
                      <CustomInput
                        variant="floating"
                        borderThickness="2"
                        label="GSM"
                        id="GSM"
                        {...register('GSM')}
                        error={errors.GSM?.message}
                      />
                      <DescriptionWithSubSelect
                        label="End Use"
                        name="EndUse"
                        subName="EndUseSubOptions"
                        options={endUses}
                        selectedOption={watch('EndUse') || ''}
                        selectedSubOptions={Array.isArray(watch('EndUseSubOptions')) ? (watch('EndUseSubOptions') ?? []).slice().filter((v): v is string => typeof v === 'string') : []}
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
  <div className="grid grid-cols-6 gap-4">
    <CustomInput
      type="number"
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
     </div>
   <div className=" border  rounded-2xl p-2 grid grid-cols-4 gap-4">

    {renderMultiInputGroup('FinishWidth', 'FinishWidth', fieldIcons.FinishWidth.add, fieldIcons.FinishWidth.delete)}
    {renderMultiInputGroup('Color', 'Color', fieldIcons.Color.add, fieldIcons.Color.delete)}  
    {renderMultiInputGroup('Weight', 'Weight', fieldIcons.Weight.add, fieldIcons.Weight.delete)}
    {renderMultiInputGroup('Shrinkage', 'Shrinkage', fieldIcons.Shrinkage.add, fieldIcons.Shrinkage.delete)}
    {renderMultiInputGroup('Finish', 'Finish', fieldIcons.Finish.add, fieldIcons.Finish.delete)}
    {renderMultiInputGroup('LabDispNo', 'LabDispNo', fieldIcons.LabDispNo.add, fieldIcons.LabDispNo.delete)}
    {renderMultiInputGroup('LabDispDate', 'LabDispDate', fieldIcons.LabDispDate.add, fieldIcons.LabDispDate.delete, true)}

    {renderMultiInputGroup('PickRate', 'PickRate', fieldIcons.PickRate.add, fieldIcons.PickRate.delete)}
    {renderMultiInputGroup('FabricRate', 'FabRate', fieldIcons.FabricRate.add, fieldIcons.FabricRate.delete)}
    {renderMultiInputGroup('Amounts', 'Amount', fieldIcons.Amounts.add, fieldIcons.Amounts.delete)}
    {renderMultiInputGroup('Wrapwt', 'Wrapwt.', fieldIcons.Wrapwt.add, fieldIcons.Wrapwt.delete)}
    {renderMultiInputGroup('Weftwt', 'Weft.wt', fieldIcons.Weftwt.add, fieldIcons.Weftwt.delete)}
    {renderMultiInputGroup('WrapBag', 'WrapBag', fieldIcons.WrapBag.add, fieldIcons.WrapBag.delete)}
    {renderMultiInputGroup('WeftBag', 'WeftBag', fieldIcons.WeftBag.add, fieldIcons.WeftBag.delete)}
    {/* {renderMultiInputGroup('TotalBag', 'Total Bag', fieldIcons.TotalBag.add, fieldIcons.TotalBag.delete)} */}
    {renderMultiInputGroup('TotalAmountMultiple', 'TotalAmount', fieldIcons.TotalAmountMultiple.add, fieldIcons.TotalAmountMultiple.delete)}
    {watch('CommissionFrom') === 'Both' && (
      <>
        {renderMultiInputGroup('SellerCommission', 'Seller Commission', fieldIcons.SellerCommission.add, fieldIcons.SellerCommission.delete)}
        {renderMultiInputGroup('BuyerCommission', 'Buyer Commission', fieldIcons.BuyerCommission.add, fieldIcons.BuyerCommission.delete)}
      </>
    )}
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
                          onClick={() => {
                            if (sampleDetails.length === 0) {
                              addSampleDetail();
                            }
                            setShowSamplePopup(true);
                          }}
                          className="bg-[#06b6d4] hover:bg-[#0891b2] text-white px-4 py-2 rounded flex items-center gap-2"
                        >
                          <MdInfo /> Additional Info
                        </Button>
                      </div>
                    <div className="border rounded-lg p-4 bg-white dark:bg-gray-700">
                      <p className="text-center text-gray-500 dark:text-gray-400">
                        Click "Additional Info" to view and edit sample details.
                      </p>
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
              {showSamplePopup && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-2xl font-bold text-[#06b6d4]">Sample Details</h2>
                            <Button
                                type="button"
                                onClick={() => setShowSamplePopup(false)}
                                className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white"
                            >
                                <MdClose size={24} />
                            </Button>
                        </div>
                        <div className="space-y-4">
                            {sampleDetails.map((detail, sampleIndex) => (
                                <div key={sampleIndex} className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-700">
                                    <div className="flex justify-between items-center mb-2">
                                        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                                            Sample {sampleIndex + 1}
                                        </h3>
                                        <Button
                                            type="button"
                                            onClick={() => removeSampleDetail(sampleIndex)}
                                            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md flex items-center gap-1 text-sm"
                                        >
                                            <MdDelete /> Remove
                                        </Button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <CustomInput
                                            type="number"
                                            variant="floating"
                                            borderThickness="2"
                                            label="Sample Quantity"
                                            value={detail.SampleQty || ''}
                                            onChange={(e) => handleSampleDetailChange(sampleIndex, 'SampleQty', e.target.value)}
                                        />
                                        <CustomInput
                                            type="date"
                                            variant="floating"
                                            borderThickness="2"
                                            label="Received Date"
                                            value={detail.SampleReceivedDate || ''}
                                            onChange={(e) => handleSampleDetailChange(sampleIndex, 'SampleReceivedDate', e.target.value)}
                                        />
                                        <CustomInput
                                            type="date"
                                            variant="floating"
                                            borderThickness="2"
                                            label="Delivered Date"
                                            value={detail.SampleDeliveredDate || ''}
                                            onChange={(e) => handleSampleDetailChange(sampleIndex, 'SampleDeliveredDate', e.target.value)}
                                        />
                                        <CustomInput
                                            variant="floating"
                                            borderThickness="2"
                                            label="Created By"
                                            value={detail.CreatedBy || ''}
                                            onChange={(e) => handleSampleDetailChange(sampleIndex, 'CreatedBy', e.target.value)}
                                            disabled
                                        />
                                        <CustomInput
                                            type="date"
                                            variant="floating"
                                            borderThickness="2"
                                            label="Creation Date"
                                            value={detail.CreationDate || ''}
                                            onChange={(e) => handleSampleDetailChange(sampleIndex, 'CreationDate', e.target.value)}
                                            disabled
                                        />
                                    </div>
                                    <div className="mt-4">
                                        <div className="flex justify-between items-center mb-2">
                                            <h4 className="text-md font-semibold text-gray-700 dark:text-gray-300">Additional Info</h4>
                                            <Button
                                                type="button"
                                                onClick={() => addAdditionalInfo(sampleIndex)}
                                                className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-md flex items-center gap-1 text-sm"
                                            >
                                                <MdAdd /> Add Info
                                            </Button>
                                        </div>
                                        {detail.AdditionalInfo.map((info, infoIndex) => (
                                            <div key={infoIndex} className="grid grid-cols-3 gap-2 items-center mb-2 p-2 border rounded-md">
                                                <CustomInput
                                                    variant="floating"
                                                    borderThickness="2"
                                                    label="End Use"
                                                    value={info.EndUse}
                                                    onChange={(e) => handleAdditionalInfoChange(sampleIndex, infoIndex, 'EndUse', e.target.value)}
                                                />
                                                <CustomInput
                                                    variant="floating"
                                                    borderThickness="2"
                                                    label="Count"
                                                    value={info.Count}
                                                    onChange={(e) => handleAdditionalInfoChange(sampleIndex, infoIndex, 'Count', e.target.value)}
                                                />
                                                <CustomInput
                                                    variant="floating"
                                                    borderThickness="2"
                                                    label="Weight"
                                                    value={info.Weight}
                                                    onChange={(e) => handleAdditionalInfoChange(sampleIndex, infoIndex, 'Weight', e.target.value)}
                                                />
                                                <CustomInput
                                                    variant="floating"
                                                    borderThickness="2"
                                                    label="Yarn Bags"
                                                    value={info.YarnBags}
                                                    onChange={(e) => handleAdditionalInfoChange(sampleIndex, infoIndex, 'YarnBags', e.target.value)}
                                                />
                                                <CustomInput
                                                    variant="floating"
                                                    borderThickness="2"
                                                    label="Labs"
                                                    value={info.Labs}
                                                    onChange={(e) => handleAdditionalInfoChange(sampleIndex, infoIndex, 'Labs', e.target.value)}
                                                />
                                                <Button
                                                    type="button"
                                                    onClick={() => removeAdditionalInfo(sampleIndex, infoIndex)}
                                                    className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded-md flex items-center justify-center"
                                                >
                                                    <MdDelete />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                            <Button
                                type="button"
                                onClick={addSampleDetail}
                                className="w-full bg-green-500 hover:bg-green-600 text-white py-2 rounded-md flex items-center justify-center gap-2"
                            >
                                <MdAdd /> Add Sample
                            </Button>
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