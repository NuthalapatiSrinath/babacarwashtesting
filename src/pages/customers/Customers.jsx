import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  UserPlus,
  Trash2,
  Archive,
  Edit2,
  MapPin,
  Download,
  UploadCloud,
  Loader2,
  FileSpreadsheet,
  Server,
  Search,
  Users,
  Car,
  Calendar,
  Hash,
  CreditCard,
  Building,
  Home,
  Briefcase,
} from "lucide-react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";

// Components
import DataTable from "../../components/DataTable";
import CustomerModal from "../../components/modals/CustomerModal";

// API
import { customerService } from "../../api/customerService";

const Customers = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [serverData, setServerData] = useState([]);
  const [activeTab, setActiveTab] = useState(1);

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 1,
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  // --- Fetch Data ---
  const fetchData = async (page = 1, limit = 50, search = "", status = 1) => {
    setLoading(true);
    try {
      const res = await customerService.list(page, limit, search, status);
      setServerData(res.data || []);
      setPagination({
        page: Number(page),
        limit: Number(limit),
        total: res.total || 0,
        totalPages: Math.ceil((res.total || 0) / Number(limit)) || 1,
      });
    } catch (e) {
      console.error("❌ [CUSTOMERS PAGE] Error:", e);
      toast.error("Failed to load customers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(1, pagination.limit, searchTerm, activeTab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // --- Flatten Data for Table ---
  const flattenedData = useMemo(() => {
    if (!serverData) return [];
    const rows = [];
    serverData.forEach((customer) => {
      if (customer.vehicles && customer.vehicles.length > 0) {
        customer.vehicles.forEach((vehicle) => {
          rows.push({
            ...vehicle,
            customer: customer,
            uniqueId: vehicle._id,
          });
        });
      } else {
        rows.push({
          customer: customer,
          uniqueId: customer._id,
          registration_no: "NO VEHICLE",
          status: customer.status,
        });
      }
    });
    return rows;
  }, [serverData]);

  // --- Handlers ---
  const handleTabChange = (status) => {
    setActiveTab(status);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleSearchEnter = (e) => {
    if (e.key === "Enter") {
      fetchData(1, pagination.limit, searchTerm, activeTab);
    }
  };

  const handleCreate = () => {
    setSelectedCustomer(null);
    setIsModalOpen(true);
  };

  const handleEdit = (customerData) => {
    const fullCustomer = serverData.find((c) => c._id === customerData._id);
    setSelectedCustomer(fullCustomer || customerData);
    setIsModalOpen(true);
  };

  const handleDelete = async (customerId) => {
    if (!window.confirm("Delete this customer? This removes all vehicles."))
      return;
    try {
      await customerService.delete(customerId);
      toast.success("Deleted");
      fetchData(pagination.page, pagination.limit, searchTerm, activeTab);
    } catch (e) {
      toast.error("Delete failed");
    }
  };

  const handleArchive = async (customerId) => {
    if (!window.confirm("Archive this customer?")) return;
    try {
      await customerService.archive(customerId);
      toast.success("Archived");
      fetchData(pagination.page, pagination.limit, searchTerm, activeTab);
    } catch (e) {
      toast.error("Archive failed");
    }
  };

  const handleToggleStatus = async (row) => {
    const newStatus = row.status === 1 ? 2 : 1;
    const action = newStatus === 1 ? "Activate" : "Deactivate";
    if (!window.confirm(`${action} this vehicle?`)) return;
    try {
      await customerService.toggleVehicle(row._id, row.status);
      toast.success(`Vehicle ${action}d`);
      fetchData(pagination.page, pagination.limit, searchTerm, activeTab);
    } catch (e) {
      toast.error("Status update failed");
    }
  };

  // --- Import / Export Handlers ---

  const handleImportClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    event.target.value = null; // Reset input

    const formData = new FormData();
    formData.append("file", file);

    setImportLoading(true);
    const toastId = toast.loading("Importing data...");

    try {
      console.log("📤 [FRONTEND] Uploading file:", file.name);
      const res = await customerService.importData(formData);
      console.log("📥 [FRONTEND] Import response:", res);

      if (res.success || res.statusCode === 200) {
        const summary = res.data || res;
        toast.success(
          `Import completed: ${summary.success || 0} success, ${
            summary.errors?.length || 0
          } errors`,
          { id: toastId, duration: 5000 }
        );

        // Show detailed errors if any
        if (summary.errors && summary.errors.length > 0) {
          console.error("❌ [FRONTEND] Import errors:", summary.errors);
          summary.errors.slice(0, 3).forEach((err, idx) => {
            toast.error(`${err.row || `Row ${idx + 1}`}: ${err.error}`, {
              duration: 8000,
            });
          });
        }

        fetchData(1, pagination.limit, searchTerm, activeTab);
      } else {
        toast.error(res.message || "Import failed", { id: toastId });
      }
    } catch (error) {
      console.error("💥 [FRONTEND] Import error:", error);
      const errorMsg =
        error.response?.data?.message ||
        error.message ||
        "Import failed. Check file format.";
      toast.error(errorMsg, { id: toastId, duration: 8000 });
    } finally {
      setImportLoading(false);
    }
  };

  const handleExportFrontendXLSX = async () => {
    const toastId = toast.loading("Fetching all records for Excel export...");
    try {
      const res = await customerService.list(1, 10000, searchTerm, activeTab);
      const allData = res.data || [];

      if (allData.length === 0) {
        toast.error("No data found to export", { id: toastId });
        return;
      }

      const rows = [];
      allData.forEach((customer) => {
        if (customer.vehicles && customer.vehicles.length > 0) {
          customer.vehicles.forEach((vehicle) => {
            rows.push({ ...vehicle, customer, uniqueId: vehicle._id });
          });
        } else {
          rows.push({
            customer,
            uniqueId: customer._id,
            registration_no: "NO VEHICLE",
            status: customer.status,
          });
        }
      });

      const excelData = rows.map((row) => ({
        "Customer Name": `${row.customer.firstName || ""} ${
          row.customer.lastName || ""
        }`.trim(),
        Mobile: row.customer.mobile || "",
        Email: row.customer.email || "",
        "Vehicle No": row.registration_no || "",
        "Parking No": row.parking_no || "",
        Building: row.customer.building?.name || "",
        Flat: row.customer.flat_no || "",
        Amount: row.amount || 0,
        Advance: row.advance || 0,
        Status: row.status === 1 ? "Active" : "Inactive",
        Cleaner: row.worker?.name || "Unassigned",
        Schedule: row.schedule_days?.map((d) => d.day).join(", ") || "",
        "Onboard Date": row.onboard_date
          ? new Date(row.onboard_date).toLocaleDateString()
          : "",
        "Start Date": row.start_date
          ? new Date(row.start_date).toLocaleDateString()
          : "",
      }));

      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Customers");
      const fileName = `All_Customers_${
        activeTab === 1 ? "Active" : "Inactive"
      }.xlsx`;
      XLSX.writeFile(workbook, fileName);

      toast.success(`Exported ${rows.length} records to Excel!`, {
        id: toastId,
      });
    } catch (e) {
      console.error(e);
      toast.error("Excel export failed", { id: toastId });
    }
  };

  const handleDownloadTemplate = () => {
    // Create sample data with the exact format expected by backend - SINGLE ROW ONLY
    const templateData = [
      {
        "Customer Name": "John Doe",
        Mobile: "9876543210",
        Email: "john@example.com",
        "Vehicle No": "KA01AB1234",
        "Parking No": "A101",
        Building: "Tower A",
        "Flat No": "101",
        Amount: 1500,
        Advance: 500,
        "Cleaner Name": "Ravi Kumar",
        "Schedule Type": "daily",
        "Schedule Days": "Mon,Wed,Fri",
        "Start Date": "2026-01-10",
      },
    ];

    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Customers");

    // Set column widths for better readability
    worksheet["!cols"] = [
      { wch: 20 }, // Customer Name
      { wch: 15 }, // Mobile
      { wch: 25 }, // Email
      { wch: 15 }, // Vehicle No
      { wch: 12 }, // Parking No
      { wch: 15 }, // Building
      { wch: 10 }, // Flat No
      { wch: 10 }, // Amount
      { wch: 10 }, // Advance
      { wch: 20 }, // Cleaner Name
      { wch: 15 }, // Schedule Type
      { wch: 25 }, // Schedule Days
      { wch: 15 }, // Start Date
    ];

    // Download file
    XLSX.writeFile(workbook, "Customer_Import_Template.xlsx");
    toast.success("Template downloaded! Fill it and import.");
  };

  const handleExportServerSide = async () => {
    const toastId = toast.loading("Requesting server export...");
    try {
      const blob = await customerService.exportData();
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `customers_server_export.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Server export downloaded", { id: toastId });
    } catch (error) {
      console.error(error);
      toast.error("Server export failed. Try Frontend Export.", {
        id: toastId,
      });
    }
  };

  // --- Helper for Date Formatting ---
  const formatDateForTable = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}/${month}/${day}`;
  };

  // --- Render Table Row ---
  const renderExpandedRow = (row) => {
    const c = row.customer;
    const workerName = row.worker?.name || "Unassigned";
    const schedule =
      row.schedule_days?.map((d) => d.day).join(",") || "No Schedule";

    return (
      <div className="bg-slate-50 p-5 rounded-lg border border-slate-200 ml-12 shadow-inner">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-5 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-100 to-indigo-200 flex items-center justify-center text-indigo-700 font-bold text-xl shadow-sm">
              {c.firstName?.[0]?.toUpperCase() || "U"}
            </div>
            <div>
              <h4 className="font-bold text-slate-800 text-lg">
                {c.firstName} {c.lastName}
              </h4>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-mono bg-slate-200 px-2 py-0.5 rounded">
                  ID: {c._id}
                </span>
                <span className="text-xs text-slate-500 flex items-center gap-1">
                  <Hash className="w-3 h-3" /> {c.customerCode || "N/A"}
                </span>
              </div>
            </div>
          </div>
          <div className="mt-3 md:mt-0 flex items-center gap-3">
            <button
              onClick={() => navigate(`/customers/${c._id}/history`)}
              className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-all shadow-sm flex items-center gap-2"
            >
              <Calendar className="w-4 h-4" /> Show History
            </button>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-700 font-bold border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 min-w-[100px]">Vehicle</th>
                  <th className="px-6 py-3 min-w-[120px]">Schedule</th>
                  <th className="px-6 py-3 min-w-[100px]">Amount</th>
                  <th className="px-6 py-3 min-w-[100px]">Advance</th>
                  <th className="px-6 py-3 min-w-[120px]">Onboard Date</th>
                  <th className="px-6 py-3 min-w-[120px]">Start Date</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-100">
                <tr>
                  <td className="px-6 py-4 font-mono font-medium text-slate-700">
                    {row.registration_no}
                  </td>
                  <td className="px-6 py-4 text-slate-700">{schedule}</td>
                  <td className="px-6 py-4 text-slate-700 font-medium">
                    {row.amount}
                  </td>
                  <td className="px-6 py-4 text-slate-700">
                    {row.advance || 0}
                  </td>
                  <td className="px-6 py-4 text-slate-700">
                    {formatDateForTable(row.onboard_date)}
                  </td>
                  <td className="px-6 py-4 text-slate-700">
                    {formatDateForTable(row.start_date)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-center px-6 py-4 bg-gray-50/50 border-t border-gray-200 gap-4">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 text-sm">Cleaner:</span>
              <span className="text-slate-700 text-sm uppercase">
                {workerName}
              </span>
            </div>
            {/* <button className="px-4 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded shadow-sm text-sm font-medium transition-all">
              Show Work
            </button> */}
          </div>
        </div>
      </div>
    );
  };

  const columns = [
    {
      header: "#",
      accessor: "uniqueId",
      className: "w-16 text-center",
      render: (row, idx) => (
        <div className="flex items-center justify-center">
          <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-gray-50 to-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs border border-slate-200">
            {(pagination.page - 1) * pagination.limit + idx + 1}
          </span>
        </div>
      ),
    },
    {
      header: "Customer",
      accessor: "customer.mobile",
      className: "min-w-[200px]",
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-md text-white font-bold text-xs">
            {row.customer.firstName?.[0] || "C"}
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-slate-800 text-sm">
              {row.customer.firstName} {row.customer.lastName}
            </span>
            <span className="text-xs text-slate-500 font-mono flex items-center gap-1">
              {row.customer.mobile}
            </span>
          </div>
        </div>
      ),
    },
    {
      header: "Vehicle Info",
      accessor: "registration_no",
      className: "min-w-[120px]",
      render: (row) => (
        <span className="bg-slate-100 px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wide text-slate-700 border border-slate-200 text-center shadow-sm">
          {row.registration_no}
        </span>
      ),
    },
    {
      header: "Parking No",
      accessor: "parking_no",
      className: "min-w-[100px]",
      render: (row) => (
        <span className="text-sm font-medium text-slate-600">
          {row.parking_no || "-"}
        </span>
      ),
    },
    {
      header: "Building",
      accessor: "customer.building",
      className: "min-w-[150px]",
      render: (row) => (
        <div className="flex items-center gap-1.5">
          <Building className="w-3.5 h-3.5 text-indigo-500" />
          <span
            className="text-slate-800 font-semibold text-xs truncate max-w-[140px]"
            title={row.customer.building?.name}
          >
            {row.customer.building?.name || "-"}
          </span>
        </div>
      ),
    },
    {
      header: "Flat No",
      accessor: "customer.flat_no",
      className: "min-w-[80px]",
      render: (row) => (
        <div className="flex items-center gap-1.5">
          <Home className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-sm text-slate-700">
            {row.customer.flat_no || "-"}
          </span>
        </div>
      ),
    },
    ...(activeTab === 2
      ? [
          {
            header: "Reason",
            accessor: "deactivateReason",
            render: (row) => (
              <span className="inline-flex items-center gap-1 text-red-600 text-[10px] font-bold bg-red-50 border border-red-100 px-2 py-1 rounded-full uppercase">
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                {row.deactivateReason || "Stopped"}
              </span>
            ),
          },
          {
            header: "Deactivate Date",
            accessor: "deactivateDate",
            render: (row) => (
              <div className="flex items-center gap-1 text-slate-500 text-xs">
                <Calendar className="w-3 h-3" />
                <span className="font-mono">
                  {row.deactivateDate
                    ? new Date(row.deactivateDate).toLocaleDateString()
                    : "-"}
                </span>
              </div>
            ),
          },
        ]
      : []),
    {
      header: "Actions",
      className:
        "text-right sticky right-0 bg-white shadow-[-10px_0_10px_-10px_rgba(0,0,0,0.1)] min-w-[140px]",
      render: (row) => (
        <div className="flex items-center justify-end gap-1.5 pr-2">
          <button
            onClick={() => handleEdit(row.customer)}
            className="p-2 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white border border-indigo-100 transition-all shadow-sm hover:shadow-md"
            title="Edit"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleArchive(row.customer._id)}
            className="p-2 rounded-lg bg-orange-50 text-orange-600 hover:bg-orange-500 hover:text-white border border-orange-100 transition-all shadow-sm hover:shadow-md"
            title="Archive"
          >
            <Archive className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleDelete(row.customer._id)}
            className="p-2 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white border border-rose-100 transition-all shadow-sm hover:shadow-md"
            title="Delete"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <div className="w-px h-6 bg-slate-200 mx-1"></div>
          <button
            onClick={() => handleToggleStatus(row)}
            className={`w-10 h-6 rounded-full p-1 flex items-center transition-all duration-300 shadow-inner ${
              row.status === 1
                ? "bg-gradient-to-r from-emerald-400 to-emerald-600 justify-end"
                : "bg-slate-200 justify-start"
            }`}
            title={row.status === 1 ? "Deactivate" : "Activate"}
          >
            <div className="w-4 h-4 bg-white rounded-full shadow-md transform transition-transform" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <input
        type="file"
        accept=".csv, .xlsx"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
      />

      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Customer Management
                </h1>
                <p className="text-sm text-gray-500 mt-0.5">
                  Manage customers, vehicles and subscriptions
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <div className="relative w-full max-w-md">
                <input
                  type="text"
                  placeholder="Search customers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={handleSearchEnter}
                  className="w-full h-11 bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-xl pl-11 pr-16 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 transition-all"
                />
                <Search className="absolute left-4 top-3 w-5 h-5 text-gray-400" />
                <button
                  onClick={() =>
                    fetchData(1, pagination.limit, searchTerm, activeTab)
                  }
                  className="absolute right-2 top-2 px-3 py-1 bg-white rounded-lg text-xs font-semibold text-indigo-600 border border-indigo-100 hover:bg-indigo-50 shadow-sm transition-all"
                >
                  Search
                </button>
              </div>

              <div className="flex p-1 bg-gray-100 rounded-xl">
                <button
                  onClick={() => handleTabChange(1)}
                  className={`px-4 py-2 text-xs font-bold rounded-lg transition-all shadow-sm ${
                    activeTab === 1
                      ? "bg-white text-indigo-600 shadow"
                      : "bg-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Active
                </button>
                <button
                  onClick={() => handleTabChange(2)}
                  className={`px-4 py-2 text-xs font-bold rounded-lg transition-all shadow-sm ${
                    activeTab === 2
                      ? "bg-white text-red-600 shadow"
                      : "bg-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Inactive
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 justify-end">
            <button
              onClick={handleDownloadTemplate}
              className="h-10 px-4 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-sm"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span className="hidden xl:inline">Template</span>
            </button>

            <button
              onClick={handleExportServerSide}
              className="h-10 px-4 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-sm"
            >
              <Server className="w-4 h-4" />
              <span className="hidden xl:inline">Server Export</span>
            </button>

            <button
              onClick={handleExportFrontendXLSX}
              className="h-10 px-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md hover:shadow-lg transition-all"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export</span>
            </button>

            <button
              onClick={handleImportClick}
              disabled={importLoading}
              className="h-10 px-4 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md hover:shadow-lg transition-all disabled:opacity-60"
            >
              {importLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <UploadCloud className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">Import</span>
            </button>

            <button
              onClick={handleCreate}
              className="h-10 px-5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg hover:shadow-xl transition-all active:scale-95"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add Customer</span>
            </button>
          </div>
        </div>

        {pagination.total > 0 && (
          <div className="mt-6 pt-4 border-t border-gray-100 flex items-center gap-6 overflow-x-auto">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              <span className="text-xs font-bold text-gray-500 uppercase">
                Total Records:
              </span>
              <span className="text-sm font-bold text-gray-800">
                {pagination.total}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
              <span className="text-xs font-bold text-gray-500 uppercase">
                Page:
              </span>
              <span className="text-sm font-bold text-gray-800">
                {pagination.page} / {pagination.totalPages}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <DataTable
          key={activeTab}
          columns={columns}
          data={flattenedData}
          loading={loading}
          pagination={pagination}
          onPageChange={(p) =>
            fetchData(p, pagination.limit, searchTerm, activeTab)
          }
          onLimitChange={(l) => fetchData(1, l, searchTerm, activeTab)}
          renderExpandedRow={renderExpandedRow}
        />
      </div>

      <CustomerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        customer={selectedCustomer}
        onSuccess={() =>
          fetchData(pagination.page, pagination.limit, searchTerm, activeTab)
        }
      />
    </div>
  );
};

export default Customers;
