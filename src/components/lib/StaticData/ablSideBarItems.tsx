import { FaTruck, FaMapMarkerAlt, FaGasPump, FaUsers, FaFileInvoice, FaTools } from 'react-icons/fa';
import {  MdOutlineDashboard, MdPayment } from 'react-icons/md';
import { GiRoad } from 'react-icons/gi';
import { IoIosTimer } from 'react-icons/io';
import { PiEqualizerDuotone } from "react-icons/pi";
import { LiaAccusoft } from "react-icons/lia";
import { GiTakeMyMoney } from "react-icons/gi";
import { RiEdgeNewFill } from "react-icons/ri";

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
    icon: FaFileInvoice,
    color: '#1a5f3a',
    sub_menu: [
      {
        text: 'Booking Order',
        href: '/bookingorder',
        icon: FaFileInvoice,
        color: '#1a5f3a',
      },
      {
        text: 'Consignment',
        href: '/consignment',
        icon: FaFileInvoice,
        color: '#1a5f3a',
      },
      {
        text: 'Charges',
        href: '/charges',
        icon: FaFileInvoice,
        color: '#1a5f3a',
      },
      {
        text: 'Bill Payment Invoices',
        href: '/billpaymentinvoices',
        icon: FaFileInvoice,
        color: '#1a5f3a',
      },
      {
        text: 'Payment',
        href: '/paymentABL',
        icon: MdPayment,
        color: '#1a5f3a',
      },
      {
        text: 'Receipt',
        href: '/receipt',
        icon: FaFileInvoice,
        color: '#1a5f3a',
      }
    ],
  },
  {
    text: 'Reports',
    type: 'heading',
  },
  {
    text: 'Reports',
    icon: FaFileInvoice,
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
      // {
      //   text: 'Custom Reports',
      //   href: '/abl/custom-reports',
      //   icon: FaFileInvoice,
      //   color: '#1a5f3a',
      // },
      {
        text: 'Booking Order Report',
        href: '/ablorderreport',
        icon: FaFileInvoice,
        color: '#1a5f3a',
      },
    ],
  },
  {
    text: 'FLEET MANAGEMENT',
    type: 'heading',
  },
  {
    text: 'Fleet',
    icon: FaTruck,
    color: '#1a5f3a',
    sub_menu: [
      {
        text: 'Vehicles',
        href: '/abl/vehicles',
        icon: FaTruck,
        color: '#1a5f3a',
      },
      {
        text: 'Maintenance',
        href: '/abl/maintenance',
        icon: FaTools,
        color: '#1a5f3a',
      },
      {
        text: 'Fuel Tracking',
        href: '/abl/fuel',
        icon: FaGasPump,
        color: '#1a5f3a',
      },
    ],
  },
  {
    text: 'DELIVERY',
    type: 'heading',
  },
  {
    text: 'Delivery Management',
    icon: GiRoad,
    color: '#1a5f3a',
    sub_menu: [
      {
        text: 'Routes',
        href: '/abl/routes',
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
];