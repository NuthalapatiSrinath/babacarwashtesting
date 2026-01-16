import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  Hash,
  Map,
  Download,
  UploadCloud,
  FileSpreadsheet,
  Search,
  Briefcase,
  Users,
  Eye,
  Filter,
  CreditCard,
  FileText,
  Globe,
  Loader2,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";
import DataTable from "../../components/DataTable";
import StaffModal from "../../components/modals/StaffModal";
import DeleteModal from "../../components/modals/DeleteModal";
import DocumentViewModal from "../../components/modals/DocumentViewModal";
import DocumentPreviewModal from "../../components/modals/DocumentPreviewModal";
import ViewStaffModal from "../../components/modals/ViewStaffModal";
import CustomDropdown from "../../components/ui/CustomDropdown";
import { staffService } from "../../api/staffService";

const Staff = () => {
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [data, setData] = useState([]);

  // Filters
  const [currentSearch, setCurrentSearch] = useState("");
  const [selectedCompany, setSelectedCompany] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [staffToDelete, setStaffToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [isDocumentModalOpen, setIsDocumentModalOpen] = useState(false);
  const [staffForDocuments, setStaffForDocuments] = useState(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [staffToView, setStaffToView] = useState(null);

  const [previewDocument, setPreviewDocument] = useState({
    url: "",
    title: "",
  });

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 1,
  });

  const safeString = (val) => (val ? String(val) : "-");
  const isExpired = (dateVal) => dateVal && new Date(dateVal) < new Date();

  const getStatus = (staff) => {
    const hasExpired =
      isExpired(staff.passportExpiry) ||
      isExpired(staff.visaExpiry) ||
      isExpired(staff.emiratesIdExpiry);
    return hasExpired ? "Expired" : "Valid";
  };

  const fetchData = async (page = 1, limit = 50, search = "") => {
    setLoading(true);
    try {
      const res = await staffService.list(page, limit, search);
      // ✅ FIX: Show ALL backend data directly. No filtering/deduplication here.
      const rawData = Array.isArray(res.data) ? res.data : [];

      setData(rawData);
      setPagination({
        page,
        limit,
        total: res.total || rawData.length,
        totalPages: Math.ceil((res.total || rawData.length) / limit) || 1,
      });
    } catch (e) {
      if (e.response?.status === 403) toast.error("Access Denied");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(pagination.page, pagination.limit);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- FILTER LOGIC ---
  const uniqueCompanies = useMemo(() => {
    const companies = data.map((item) => item.companyName).filter(Boolean);
    return [...new Set(companies)].sort();
  }, [data]);

  const companyOptions = useMemo(() => {
    const options = [{ value: "", label: "All Companies" }];
    uniqueCompanies.forEach((c) => options.push({ value: c, label: c }));
    return options;
  }, [uniqueCompanies]);

  const statusOptions = [
    { value: "", label: "All Status" },
    { value: "Valid", label: "Valid" },
    { value: "Expired", label: "Expired" },
  ];

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      if (selectedCompany && item.companyName !== selectedCompany) return false;
      if (selectedStatus) {
        const status = getStatus(item);
        if (status !== selectedStatus) return false;
      }
      if (currentSearch) {
        const lowerSearch = currentSearch.toLowerCase();
        const name = (item.name || "").toLowerCase();
        const code = (item.employeeCode || "").toLowerCase();
        const comp = (item.companyName || "").toLowerCase();
        const site = (item.site?.name || item.site || "").toLowerCase();

        return (
          name.includes(lowerSearch) ||
          code.includes(lowerSearch) ||
          comp.includes(lowerSearch) ||
          site.includes(lowerSearch)
        );
      }
      return true;
    });
  }, [data, selectedCompany, selectedStatus, currentSearch]);

  // --- ACTIONS ---
  const handleAdd = () => {
    setSelectedStaff(null);
    setIsModalOpen(true);
  };
  const handleEdit = (staff) => {
    setSelectedStaff(staff);
    setIsModalOpen(true);
  };
  const handleDeleteAction = (staff) => {
    setStaffToDelete(staff);
    setIsDeleteModalOpen(true);
  };
  const handleViewDetails = (staff) => {
    setStaffToView(staff);
    setIsViewModalOpen(true);
  };

  const confirmDelete = async () => {
    setDeleteLoading(true);
    try {
      await staffService.delete(staffToDelete._id);
      toast.success("Deleted successfully");
      setIsDeleteModalOpen(false);
      fetchData(pagination.page, pagination.limit, "");
    } catch (error) {
      toast.error("Delete failed");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleDownloadTemplate = () => {
    const dummyData = [
      {
        "Employee Code": "EMP001",
        Name: "John Doe",
        Company: "Baba Car Wash",
        Site: "Downtown Dubai",
        "Joining Date (YYYY-MM-DD)": "2024-01-01",
        "Passport Number": "A1234567",
        "Passport Expiry (YYYY-MM-DD)": "2030-01-01",
        "Passport Document URL": "",
        "Visa Expiry (YYYY-MM-DD)": "2026-01-01",
        "Visa Document URL": "",
        "Emirates ID": "784-1234-1234567-1",
        "Emirates ID Expiry (YYYY-MM-DD)": "2026-01-01",
        "Emirates ID Document URL": "",
      },
    ];
    const worksheet = XLSX.utils.json_to_sheet(dummyData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Template");
    XLSX.writeFile(workbook, "Staff_Import_Template.xlsx");
    toast.success("Template Downloaded");
  };

  const handleExportServerSide = async () => {
    const toastId = toast.loading("Exporting...");
    try {
      const blob = await staffService.exportData();
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `staff_export_${Date.now()}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Done", { id: toastId });
    } catch {
      toast.error("Export Failed", { id: toastId });
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = null;
    setImportLoading(true);
    const toastId = toast.loading("Importing...");
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await staffService.importData(formData);
      const successCount = res.results?.success || 0;
      toast.success(`Imported ${successCount} records`, { id: toastId });
      fetchData(1, pagination.limit);
    } catch {
      toast.error("Import Failed", { id: toastId });
    } finally {
      setImportLoading(false);
    }
  };

  const handleDocumentView = (id, type, name) => {
    const url = staffService.getDocumentUrl(id, type);
    setPreviewDocument({ url, title: `${name} - ${type}` });
    setIsPreviewModalOpen(true);
  };

  const handleViewAllDocuments = (staff) => {
    setStaffForDocuments(staff);
    setIsDocumentModalOpen(true);
  };

  const columns = [
    {
      header: "#",
      render: (r, i) => (pagination.page - 1) * pagination.limit + i + 1,
      className: "text-center w-12 text-gray-500 font-bold",
    },
    {
      header: "Company",
      accessor: "companyName",
      render: (r) => (
        <div className="flex items-center gap-2">
          <Briefcase className="w-4 h-4 text-blue-500" />
          <span className="font-semibold text-sm">
            {safeString(r.companyName)}
          </span>
        </div>
      ),
    },
    {
      header: "Employee",
      render: (r) => (
        <div>
          <div className="font-bold text-sm text-gray-900">{r.name}</div>
          <div className="text-xs text-gray-500 flex items-center gap-1">
            <Hash className="w-3 h-3" />
            {r.employeeCode || "-"}
          </div>
        </div>
      ),
    },
    {
      header: "Site",
      render: (r) => (
        <div className="flex items-center gap-2">
          <Map className="w-3.5 h-3.5 text-purple-600" />
          <span className="text-xs text-gray-700 font-medium">
            {r.site?.name || r.site || "-"}
          </span>
        </div>
      ),
    },
    {
      header: "Documents",
      render: (r) => (
        <div className="flex items-center gap-2">
          <div
            className={`flex items-center gap-1 px-2 py-1 rounded-md border text-[10px] font-bold ${
              r.passportDocument?.filename
                ? "bg-green-50 border-green-100 text-green-700"
                : "bg-gray-50 border-gray-100 text-gray-400"
            }`}
          >
            <Globe className="w-3 h-3" />
            {r.passportDocument?.filename ? "PP" : "-"}
          </div>
          <div
            className={`flex items-center gap-1 px-2 py-1 rounded-md border text-[10px] font-bold ${
              r.visaDocument?.filename
                ? "bg-blue-50 border-blue-100 text-blue-700"
                : "bg-gray-50 border-gray-100 text-gray-400"
            }`}
          >
            <FileText className="w-3 h-3" />
            {r.visaDocument?.filename ? "VISA" : "-"}
          </div>
          <div
            className={`flex items-center gap-1 px-2 py-1 rounded-md border text-[10px] font-bold ${
              r.emiratesIdDocument?.filename
                ? "bg-purple-50 border-purple-100 text-purple-700"
                : "bg-gray-50 border-gray-100 text-gray-400"
            }`}
          >
            <CreditCard className="w-3 h-3" />
            {r.emiratesIdDocument?.filename ? "EID" : "-"}
          </div>
        </div>
      ),
    },
    {
      header: "Expiry Status",
      render: (r) => {
        const pExp = isExpired(r.passportExpiry);
        const vExp = isExpired(r.visaExpiry);
        const eExp = isExpired(r.emiratesIdExpiry);
        if (pExp || vExp || eExp)
          return (
            <div className="flex items-center gap-1 text-red-600 font-bold text-xs bg-red-50 px-2 py-1 rounded-full w-fit">
              <AlertCircle className="w-3 h-3" /> Expired
            </div>
          );
        return (
          <div className="flex items-center gap-1 text-emerald-600 font-bold text-xs bg-emerald-50 px-2 py-1 rounded-full w-fit">
            <CheckCircle className="w-3 h-3" /> Valid
          </div>
        );
      },
    },
    {
      header: "Actions",
      className:
        "text-right sticky right-0 bg-white shadow-[-10px_0_10px_-10px_rgba(0,0,0,0.1)] min-w-[140px]",
      render: (r) => (
        <div className="flex justify-end gap-1.5 pr-2">
          <button
            onClick={() => handleViewDetails(r)}
            className="p-2 hover:bg-teal-50 text-teal-600 rounded-lg transition-all"
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleViewAllDocuments(r)}
            className="p-2 hover:bg-indigo-50 text-indigo-600 rounded-lg transition-all"
            title="Manage Documents"
          >
            <UploadCloud className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleEdit(r)}
            className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition-all"
            title="Edit"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDeleteAction(r)}
            className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-all"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6 font-sans">
      <input
        type="file"
        accept=".xlsx"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
      />

      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-200">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-indigo-800 bg-clip-text text-transparent">
                  Staff Management
                </h1>
                <p className="text-sm text-slate-500 font-medium">
                  Manage records
                </p>
              </div>
            </div>
            <div className="flex flex-col md:flex-row gap-4 items-end w-full max-w-4xl">
              <div className="relative flex-1 w-full">
                <span className="text-xs font-bold text-slate-500 uppercase mb-1.5 block ml-1">
                  Search
                </span>
                <div className="relative h-11">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Name, Code, Site..."
                    value={currentSearch}
                    onChange={(e) => setCurrentSearch(e.target.value)}
                    className="w-full h-full pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 font-medium transition-all"
                  />
                </div>
              </div>
              <div className="w-full md:w-64">
                <CustomDropdown
                  label="Company"
                  value={selectedCompany}
                  onChange={setSelectedCompany}
                  options={companyOptions}
                  icon={Briefcase}
                  placeholder="All Companies"
                />
              </div>
              <div className="w-full md:w-48">
                <CustomDropdown
                  label="Status"
                  value={selectedStatus}
                  onChange={setSelectedStatus}
                  options={statusOptions}
                  icon={Filter}
                  placeholder="All Status"
                />
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 justify-end self-start lg:self-center">
            <button
              onClick={handleDownloadTemplate}
              className="h-11 px-4 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-bold text-xs flex items-center gap-2 shadow-sm transition-all"
            >
              <FileSpreadsheet className="w-4 h-4 text-green-600" /> Template
            </button>
            <button
              onClick={handleExportServerSide}
              className="h-11 px-4 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-bold text-xs flex items-center gap-2 shadow-sm transition-all"
            >
              <Download className="w-4 h-4 text-slate-500" /> Export
            </button>
            <button
              onClick={() => fileInputRef.current.click()}
              disabled={importLoading}
              className="h-11 px-4 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-bold text-xs flex items-center gap-2 shadow-sm transition-all disabled:opacity-60"
            >
              {importLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <UploadCloud className="w-4 h-4 text-blue-500" />
              )}{" "}
              Import
            </button>
            <button
              onClick={handleAdd}
              className="h-11 px-5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-200 hover:shadow-indigo-300 transition-all active:scale-95 flex items-center gap-2"
            >
              <Plus className="w-5 h-5" /> Add Staff
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        {/* ✅ FIXED: No more double header manually added here. */}

        <DataTable
          columns={columns}
          data={filteredData}
          loading={loading}
          pagination={{ ...pagination, total: filteredData.length }}
          onPageChange={(p) => fetchData(p, pagination.limit, currentSearch)}
          onLimitChange={(l) => fetchData(1, l, currentSearch)}
          hideSearch={true}
        />
      </div>

      <StaffModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => fetchData(pagination.page, pagination.limit, "")}
        editData={selectedStaff}
      />
      <DeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        loading={deleteLoading}
        title="Delete Staff"
        message={`Delete ${staffToDelete?.name}?`}
      />
      <DocumentViewModal
        isOpen={isDocumentModalOpen}
        onClose={() => setIsDocumentModalOpen(false)}
        staff={staffForDocuments}
        getDocumentUrl={staffService.getDocumentUrl}
        onViewDocument={handleDocumentView}
        onSuccess={() => fetchData(pagination.page, pagination.limit, "")}
      />
      <DocumentPreviewModal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        documentUrl={previewDocument.url}
        title={previewDocument.title}
      />
      <ViewStaffModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        staff={staffToView}
      />
    </div>
  );
};

export default Staff;
