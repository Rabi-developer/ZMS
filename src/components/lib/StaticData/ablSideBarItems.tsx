import { FaTruck, FaMapMarkerAlt, FaGasPump, FaUsers, FaFileInvoice, FaTools } from 'react-icons/fa';
import {  MdOutlineDashboard, MdPayment } from 'react-icons/md';
import { GiRoad } from 'react-icons/gi';
import { IoIosTimer } from 'react-icons/io';
import { PiEqualizerDuotone } from "react-icons/pi";
import { LiaAccusoft } from "react-icons/lia";
import { GiTakeMyMoney } from "react-icons/gi";
import { RiEdgeNewFill } from "react-icons/ri";
import { TbReport } from "react-icons/tb";
import { RiFilePdf2Line } from "react-icons/ri";
import { LiaBalanceScaleLeftSolid } from "react-icons/lia";
import { VscFilePdf } from "react-icons/vsc";
import { MdOutlinePictureAsPdf } from "react-icons/md";
import { FaAccusoft } from "react-icons/fa";
import { MdEmojiTransportation } from "react-icons/md";
import { TbBrandBooking } from "react-icons/tb";
import { IoBookSharp } from "react-icons/io5";
import { FaRupeeSign } from "react-icons/fa";
import { MdOutlinePayments } from "react-icons/md";
import { PiInvoiceLight } from "react-icons/pi";
import { IoReceiptOutline } from "react-icons/io5";


export const ablSideBarItems = [
  {
    text: 'HOME',
    type: 'heading',
  },
  {
    text: 'Dashboard',
    href: '/ABLDashboardlayout',
    icon: MdOutlineDashboard,
    color: '#1a5f3a',
  },
  {
    text: 'ABL',
    type: 'heading',
  },
  {
    text: 'Chart Of Accounts',
    icon: FaUsers,
    color: '#1a5f3a',
    sub_menu: [
      {
        text: 'Equality',
        href: '/equality',
        icon: PiEqualizerDuotone,
        color: '#1a5f3a',
      },
      {
        text: 'Liabilities',
        href: '/ablLiabilities',
        icon: LiaAccusoft,
        color: '#1a5f3a',
      },
      { text: 'Assets',
        href: '/ablAssests',
        icon: FaGasPump,
        color: '#1a5f3a',
      },
      { 
        text: 'Expenses',
        href: '/ablExpense',
        icon: GiTakeMyMoney,  
        color: '#1a5f3a',
      },  
      {
        text: 'Revenue',
        href: '/ablRevenue',
        icon: RiEdgeNewFill,
        color: '#1a5f3a',
      },
    ],
  },
  {
    text: 'Transactions',
    type: 'heading',
  },
  {
    text: 'Transport',
    icon: MdEmojiTransportation ,
    color: '#1a5f3a',
    sub_menu: [
      {
        text: 'Booking Order',
        href: '/bookingorder',
        icon: TbBrandBooking,
        color: '#1a5f3a', 
      },
      {
        text: 'Consignment',
        href: '/consignment',
        icon: IoBookSharp,
        color: '#1a5f3a',
      },
      {
        text: 'Charges',
        href: '/charges',
        icon: FaRupeeSign ,
        color: '#1a5f3a',
      },
      {
        text: 'Bill Payment Invoices',
        href: '/billpaymentinvoices',
        icon: PiInvoiceLight  ,
        color: '#1a5f3a',
      },
      {
        text: 'Payment',
        href: '/paymentABL',
        icon: MdOutlinePayments,
        color: '#1a5f3a',
      },
      {
        text: 'Receipt',
        href: '/receipt',
        icon: IoReceiptOutline,
        color: '#1a5f3a',
      }
    ],
  },
  {
    text: 'REPORTS',
    type: 'heading',
  },
  {
    text: 'Reports',
    icon: VscFilePdf ,
    color: '#1a5f3a',
    sub_menu: [
      // {
      //   text: 'Financial Reports',
      //   href: '/abl/financial-reports',
      //   icon: FaFileInvoice,
      //   color: '#1a5f3a',
      // },
      // {
      //   text: 'Operational Reports',
      //   href: '/abl/operational-reports',
      //   icon: FaFileInvoice,
      //   color: '#1a5f3a',
      // },      
      {
        text: 'Booking Order Report',
        href: '/ablorderreport',
        icon: MdOutlinePictureAsPdf,
        color: '#1a5f3a',
      },
      
    ],
  },
  // {
  //   text: 'FLEET MANAGEMENT',
  //   type: 'heading',
  // },
  // {
  //   text: 'Fleet',
  //   icon: FaTruck,
  //   color: '#1a5f3a',
  //   sub_menu: [
  //     {
  //       text: 'Vehicles',
  //       href: '/abl/vehicles',
  //       icon: FaTruck,
  //       color: '#1a5f3a',
  //     },
  //     {
  //       text: 'Maintenance',
  //       href: '/abl/maintenance',
  //       icon: FaTools,
  //       color: '#1a5f3a',
  //     },
  //     {
  //       text: 'Fuel Tracking',
  //       href: '/abl/fuel',
  //       icon: FaGasPump,
  //       color: '#1a5f3a',
  //     },
  //   ],
  // },
  {
    text: 'Voucher',
    type: 'heading',
  },
  {
    text: 'Voucher',
    icon: FaAccusoft  ,
    color: '#1a5f3a',
    sub_menu: [
      {
        text: 'Voucher Entry',
        href: '/entryvoucher',
        icon: FaMapMarkerAlt,
        color: '#1a5f3a',
      },
      {
        text: 'Schedules',
        href: '/abl/schedules',
        icon: IoIosTimer,
        color: '#1a5f3a',
      },
      {
        text: 'Invoices',
        href: '/abl/invoices',
        icon: FaFileInvoice,
        color: '#1a5f3a',
      },
    ],
  },

  {
    text: 'Voucher Report',
    type: 'heading',
  },
  {
    text: 'Voucher Report',
    icon: TbReport ,
    color: '#1a5f3a',
    sub_menu: [
      {
        text: 'Gernal Ledger',
        href: '/entryvoucher/ledger',
        icon: RiFilePdf2Line,
        color: '#1a5f3a',
      },
      {
        text: 'Trial Balance',
        href: '/entryvoucher/trailbalance',
        icon: LiaBalanceScaleLeftSolid ,
        color: '#1a5f3a',
      },
      
    ],
  },
];