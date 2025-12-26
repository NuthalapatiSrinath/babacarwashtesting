import {
  LayoutDashboard,
  MapPin,
  Building2,
  ShoppingBag,
  LocateFixed,
  Droplets,
  DollarSign,
  FileText,
  Receipt,
  Wallet,
  Tags,
  HelpCircle,
  Briefcase,
  Users,
  ClipboardCheck,
  UserCheck,
} from "lucide-react";

// Page Imports
import Dashboard from "./pages/Dashboard";
import Locations from "./pages/Locations";
import Buildings from "./pages/Buildings";
import Malls from "./pages/Malls";
import Sites from "./pages/Sites";
import Supervisors from "./pages/Supervisors";
import Workers from "./pages/Workers";
import Staff from "./pages/Staff";
import Attendance from "./pages/Attendance";
import PlaceholderPage from "./pages/PlaceholderPage";

export const routes = [
  // --- OVERVIEW ---
  {
    path: "/",
    title: "Dashboard Overview",
    component: <Dashboard />,
    icon: LayoutDashboard,
  },

  // --- MANAGEMENT ---
  {
    path: "/locations",
    component: <Locations />,
  },
  {
    path: "/buildings",
    component: <Buildings />,
  },
  {
    path: "/malls",
    component: <Malls />,
  },
  {
    path: "/sites",
    component: <Sites />,
  },

  // --- WORKERS SECTION (Flattened) ---
  // The Sidebar handles the grouping visual.
  // The Router just needs to know the paths exist.
  {
    path: "/workers/list",
    title: "Workers",
    component: <Workers />,
    icon: UserCheck,
  },
  {
    path: "/workers/staff",
    title: "Staff",
    component: <Staff />,
    icon: Users,
  },
  {
    path: "/workers/attendance",
    title: "Attendance",
    component: <Attendance />,
    icon: ClipboardCheck,
  },

  {
    path: "/supervisors",
    component: <Supervisors />,
  },
  {
    path: "/customers",
    title: "Customer Database",
    component: <PlaceholderPage title="Customers" />,
    icon: Users,
  },

  // --- WASHES ---
  {
    path: "/washes/onewash",
    title: "One Wash Service",
    component: <PlaceholderPage title="One Wash" />,
    icon: Droplets,
  },
  {
    path: "/washes/residence",
    title: "Residence Service",
    component: <PlaceholderPage title="Residence" />,
    icon: Droplets,
  },

  // --- FINANCE ---
  {
    path: "/payments",
    title: "Payment Transactions",
    component: <PlaceholderPage title="Payments" />,
    icon: DollarSign,
  },
  {
    path: "/work-records",
    title: "Work Records",
    component: <PlaceholderPage title="Work Records" />,
    icon: FileText,
  },
  {
    path: "/collection-sheet",
    title: "Collection Sheet",
    component: <PlaceholderPage title="Collection Sheet" />,
    icon: Receipt,
  },
  {
    path: "/settlements",
    title: "Settlements",
    component: <PlaceholderPage title="Settlements" />,
    icon: Wallet,
  },
  {
    path: "/pricing",
    title: "Pricing Configuration",
    component: <PlaceholderPage title="Pricing" />,
    icon: Tags,
  },

  // --- SUPPORT ---
  {
    path: "/enquiry",
    title: "Enquiries",
    component: <PlaceholderPage title="Enquiry" />,
    icon: HelpCircle,
  },
  {
    path: "/settings",
    title: "Settings",
    component: <PlaceholderPage title="Settings" />,
  },
];
