import { IoGitBranchSharp } from "react-icons/io5";
import { GoOrganization } from "react-icons/go";
import { MdPermDataSetting, MdGrade } from "react-icons/md";
import { TbBuildingBank } from "react-icons/tb";
import { FaRegFileArchive, FaWarehouse } from "react-icons/fa";
import { FaFileWaveform, FaPersonChalkboard } from "react-icons/fa6";
import { BsPersonWorkspace } from "react-icons/bs";
import { GoProjectSymlink } from "react-icons/go";
import { MdInventory2 } from "react-icons/md";
import { BiCategoryAlt } from "react-icons/bi";
import { MdOutlineProductionQuantityLimits } from "react-icons/md";
import { FaFolderOpen } from "react-icons/fa";
import { FaFolder } from "react-icons/fa";
import { GiReturnArrow } from "react-icons/gi";
import { CgShutterstock } from "react-icons/cg";
import { RiPresentationLine } from "react-icons/ri";
import { TbAdjustmentsCheck } from "react-icons/tb";  
import { SiAwsorganizations } from "react-icons/si";
import { FcNegativeDynamic } from "react-icons/fc";
import { CiGrid41 } from "react-icons/ci";
import { MdOutlineSettings } from "react-icons/md";
import { PiAddressBookFill } from "react-icons/pi";
import { FaPeopleRoof } from "react-icons/fa6";
import { GrWorkshop } from "react-icons/gr";
import { FaArrowsDownToPeople } from "react-icons/fa6";
import { FaIdeal } from "react-icons/fa";
import { LiaSellcast } from "react-icons/lia";
import { PiWebhooksLogoFill } from "react-icons/pi";
import { MdOutlineAccountBalance } from "react-icons/md";
import { RiAccountBoxLine } from "react-icons/ri";
import { MdOutlineAccountTree } from "react-icons/md";
import { AiOutlinePropertySafety } from "react-icons/ai";
import { CiCoinInsert } from "react-icons/ci";
import { FaCoins } from "react-icons/fa";
import { GrUserAdmin } from "react-icons/gr";
import { MdOutlineDevicesOther } from "react-icons/md";
import { CiInboxOut } from "react-icons/ci";
import { VscDebugStepOver } from "react-icons/vsc";
import { GoPackageDependents } from "react-icons/go";
import { GiStabbedNote } from "react-icons/gi";
import { FaCartFlatbedSuitcase } from "react-icons/fa6";
import { GiInauguration } from "react-icons/gi";
import { GiYarn } from "react-icons/gi";
import { PiYarnFill } from "react-icons/pi";
import { GiSoundWaves } from "react-icons/gi";
import { GiCardPickup } from "react-icons/gi";
import { SiThefinals } from "react-icons/si";
import { GiRolledCloth } from "react-icons/gi";
import { GiWaves } from "react-icons/gi";
import { RiExpandWidthFill } from "react-icons/ri";
import { FaPiedPiperSquare } from "react-icons/fa";
import { FaBoxesPacking } from "react-icons/fa6";
import { FaBuffer } from "react-icons/fa";
import { FaHouseSignal } from "react-icons/fa6";
import { LiaFileContractSolid } from "react-icons/lia";
import { RiContractLine } from "react-icons/ri";
import { MdOutlinePayments } from "react-icons/md";

export const sideBarItems = [
  //Home
  {
    text: "HOME", 
    type: "heading" 
  },
  {
    text: "Set-Up",
    icon: GoOrganization,
    color: "#33a4d8",
    sub_menu: [
      { 
        text: "Company", 
        href: "/organization",
        icon:  CiGrid41 , 
        color: "#33a4d8" 
      },
      { 
        text: "Branch", 
        href: "/branchs",
        icon: TbBuildingBank, 
        color: "#33a4d8" 
      },
      { 
        text: "Branch Setting", 
        href: "/branchs/settings",
        icon: MdOutlineSettings, 
        color: "#33a4d8" 
      },

      { 
        text: "Warehouse", 
        href: "/department",
        icon: FaWarehouse,
        color: "#33a4d8" 
      },
     
      { 
        text: "Address", 
        href: "/address",
        icon: PiAddressBookFill,
        color: "#33a4d8" 
      },
    
     
    ],
  },
  // Employee Menu
  {
    text: "Set Employee", 
    type: "heading" 
  },
  {
    text: "Employess",
    icon: CgShutterstock,
    color: '#33a4d8',
    sub_menu: [
      {
        text: "Employee", 
        href: "/employee", 
        icon: FaPersonChalkboard, 
        color: "#33a4d8" 
      },
      { 
        text: "Employee Management", 
        href: "/employeemanagement", 
        icon: BsPersonWorkspace, 
        color: "#33a4d8" 
      },
    ],
  },
  //ZMS COMPANY- Project Target
  {
    text: "ZMS COMPANY", 
    type: "heading" 
  },
  {
    text: "Project Target",
    href: "/projecttarget",
    icon: GoProjectSymlink,
    color: '#33a4d8',
  },

  //ACCOUNT
  {
    text: "Account", 
    type: "heading" 
  },
  {
    text: "Charts Of Accounts",
    icon:  MdOutlineAccountBalance,
    color: '#33a4d8',
    sub_menu: [
  {
    text: "Equality",
    href: "/capitalaccount",
    icon: RiAccountBoxLine,
    color: '#33a4d8',
  },
  {
    text: "Liabilities",
    href: "/liabilities",
    icon: MdOutlineAccountTree,
    color: '#33a4d8',
  },
  {
    text: "Assests",
    href: "/assets",
    icon:  FaCoins,
    color: '#33a4d8',
  },
  {
    text: "Expense",
    href: "/expense",
    icon:  GrUserAdmin,
    color: '#33a4d8',
  },
  {
    text: "Revenue",
    href: "/revenue",
    icon:  GoPackageDependents,
    color: '#33a4d8',
  },
   // {
  //   text: "Property & Assests",
  //   href: "/property&assests",
  //   icon: AiOutlinePropertySafety,
  //   color: '#33a4d8',
  // },
  // {
  //   text: "Sales & Services",
  //   href: "/sales&services",
  //   icon:  CiCoinInsert,
  //   color: '#33a4d8',
  // },
  // {
  //   text: "Other Incomes",
  //   href: "/otherincomes",
  //   icon:  CiInboxOut ,
  //   color: '#33a4d8',
  // },
  ]},

//DEAL-LINK
  {
    text: "Contacts", 
    type: "heading" 
  },
  {
    text: "DealLink",
    icon:  FaIdeal,
    color: '#33a4d8',
    sub_menu: [
  {
    text: "Seller",
    href: "/saller",
    icon: LiaSellcast,
    color: '#33a4d8',
  },
  {
    text: "Buyer",
    href: "/buyer",
    icon: PiWebhooksLogoFill,
    color: '#33a4d8',
  },
  ]},

//Contract
{
  text: "Contracts", 
  type: "heading" 
},
{
  text: "Contract",
  icon:  LiaFileContractSolid,
  color: '#33a4d8',
  sub_menu: [
{
  text: "Contract",
  href: "/contract",
  icon: RiContractLine,
  color: '#33a4d8',
},
{
  text: "Dispatch Note",
  href: "/dispatchnote",
  icon: PiWebhooksLogoFill,
  color: '#33a4d8',
},
{
  text: "Inspection Note",
  href: "/inspectionnote",
  icon: TbAdjustmentsCheck,
  color: '#33a4d8',
},
{
  text: "Invoice",
  href: "/invoice",
  icon: RiPresentationLine,
  color: '#33a4d8',
},
{
  text: "Payment",
  href: "/payment",
  icon: MdOutlinePayments,
  color: '#33a4d8',
},
]},

//Commission Invoice
{
  text: "Commission Invoice", 
  type: "heading"
},
{
  text: "Commission ",
  icon: FaRegFileArchive,
  color: '#33a4d8',   
  sub_menu: [
    {
      text: "Commission Invoice",
      href: "/commisioninvoice",  
      icon: GiStabbedNote,
      color: '#33a4d8',
    },
    // {
    //   text: "Commission Invoice Form",
    //   href: "/commisioninvoice/create",
    //   icon: GiSoundWaves, 
    //   color: '#33a4d8',
    // },
]},
























































































































































































  // Al-Nasir Enterprise Sale-and-purchase Company
  //ZMS COMPANY- Project Target
//   {
//     text: "Al-Nasir Enterprise", 
//     type: "heading" 
//   },
//   {
//     text: "Project Target",
//     href: "/",
//     icon: GoProjectSymlink,
//     color: '#33a4d8',
//   },
// // Contact Company
//   {
//     text: "Contacts",
//     icon: FaPeopleRoof,
//     color: '#33a4d8',
//     sub_menu: [
//       { 
//         text: "Supplier", 
//         href: "/supplier", 
//         icon: FaArrowsDownToPeople, 
//         color: "#33a4d8" 
//       },
//       {
//         text: "Customer", 
//         href: "/customer", 
//         icon: GrWorkshop, 
//         color: "#33a4d8" 
//       },
     
//     ],
//   },
  
//   {
//     text: "Inventory",
//     href: "",
//     icon: MdInventory2,
//     color: '#33a4d8',
//     sub_menu: [
//       {
//         text: "Category",
//         href: "/",
//         icon: BiCategoryAlt,
//         color: '#33a4d8',
//       },
//       {
//         text: "Product",
//         href: "",
//         icon: MdOutlineProductionQuantityLimits,
//         color: '#33a4d8',
//         sub_menu: [
//           {
//             text: "New",
//             href: "",
//             icon: FaFolderOpen,  
//             color: '#33a4d8',
//           },
//           {
//             text: "Old",
//             href: "",
//             icon: FaFolder,  
//             color: '#33a4d8',
//           },
//           {
//             text: "Return",
//             href: "",
//             icon: GiReturnArrow,  
//             color: '#33a4d8',
//           },
//         ],
//       },
//       {
//         text: "Stock",
//         href: "",
//         icon: CgShutterstock,
//         color: '#33a4d8',
//         sub_menu: [
//           {
//             text: "Stock Adjacement",
//             href: "",
//             icon: TbAdjustmentsCheck,
//             color: '#33a4d8',
//           },
//           {
//             text: "Stock Representation",
//             href: "",
//             icon: RiPresentationLine,
//             color: '#33a4d8',
//           },
//         ],
//       },
      
//     ],
//   },
//   {
//     text: "Login",
//     href: "",
//     icon: CgShutterstock,
//     color: '#33a4d8',
//     sub_menu: [
//       {
//         text: "Singin",
//         href: "/singin",
//         icon: TbAdjustmentsCheck,
//         color: '#33a4d8',
//       },
//       {
//         text: "Sinup",
//         href: "/signup",
//         icon: RiPresentationLine,
//         color: '#33a4d8',
//       },
//     ],
//   },
];
