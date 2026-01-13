import React, { useState, useEffect, useRef } from "react";
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
  FileText,
  Briefcase,
  Calendar,
  CreditCard,
  Globe,
  Loader2,
  Users,
  AlertCircle,
  Eye,
} from "lucide-react";
import toast from "react-hot-toast";
import * as XLSX from "xlsx"; // ✅ Required for Frontend Template

// Components
import DataTable from "../../components/DataTable";
import StaffModal from "../../components/modals/StaffModal";
import DeleteModal from "../../components/modals/DeleteModal";
import DocumentViewModal from "../../components/modals/DocumentViewModal";
import DocumentPreviewModal from "../../components/modals/DocumentPreviewModal";

// API
import { staffService } from "../../api/staffService";

const Staff = () => {
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [data, setData] = useState([]);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [staffToDelete, setStaffToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [isDocumentModalOpen, setIsDocumentModalOpen] = useState(false);
  const [staffForDocuments, setStaffForDocuments] = useState(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewDocument, setPreviewDocument] = useState({
    url: "",
    title: "",
  });

  const [currentSearch, setCurrentSearch] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 1,
  });

  // --- SAFE HELPERS ---
  const safeDate = (dateVal) => {
    if (!dateVal) return "-";
    try {
      const date = new Date(dateVal);
      return isNaN(date.getTime())
        ? "-"
        : date.toLocaleDateString("en-US", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          });
    } catch {
      return "-";
    }
  };
  const safeString = (val) => val || "-";
  const isExpiringSoon = (dateVal) => {
    if (!dateVal) return false;
    const days = Math.ceil((new Date(dateVal) - new Date()) / 86400000);
    return days > 0 && days <= 30;
  };
  const isExpired = (dateVal) => dateVal && new Date(dateVal) < new Date();

  // --- Fetch Data ---
  const fetchData = async (page = 1, limit = 10, search = "") => {
    setLoading(true);
    setCurrentSearch(search);
    try {
      const res = await staffService.list(page, limit, search);
      setData(Array.isArray(res.data) ? res.data : []);
      setPagination({
        page,
        limit,
        total: res.total || 0,
        totalPages: Math.ceil((res.total || 0) / limit) || 1,
      });
    } catch (e) {
      if (e.response?.status === 403) toast.error("Access Denied");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(pagination.page, pagination.limit);
  }, []);

  // --- Handlers ---
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

  const confirmDelete = async () => {
    setDeleteLoading(true);
    try {
      await staffService.delete(staffToDelete._id);
      toast.success("Deleted successfully");
      setIsDeleteModalOpen(false);
      fetchData(pagination.page, pagination.limit, currentSearch);
    } catch (error) {
      if (
        error.response?.status === 400 &&
        error.response?.data?.message?.includes("reason")
      ) {
        const reason = prompt("Admin requires a reason:");
        if (reason) {
          try {
            await staffService.delete(staffToDelete._id, reason);
            toast.success("Deleted successfully");
            setIsDeleteModalOpen(false);
            fetchData(pagination.page, pagination.limit, currentSearch);
          } catch (e) {
            toast.error("Delete failed");
          }
        }
      } else {
        toast.error("Delete failed");
      }
    } finally {
      setDeleteLoading(false);
    }
  };

  // ✅ FRONTEND-ONLY TEMPLATE GENERATION
  const handleDownloadTemplate = () => {
    const dummyData = [
      {
        "Employee Code": "EMP001",
        Name: "John Doe",
        Company: "Baba Car Wash",
        "Joining Date (YYYY-MM-DD)": "2024-01-01",
        "Passport Number": "A1234567",
        "Passport Expiry (YYYY-MM-DD)": "2030-01-01",
        "Passport Document URL": "https://example.com/doc.pdf",
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
      link.setAttribute("download", `staff_export.xlsx`);
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
      toast.success(`Imported ${res.results.success} records`, { id: toastId });
      fetchData(1, pagination.limit);
    } catch {
      toast.error("Import Failed", { id: toastId });
    } finally {
      setImportLoading(false);
    }
  };

  // --- DOCUMENTS ---
  const handleDocumentUpload = (id, name, type) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".pdf";
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const tId = toast.loading("Uploading...");
      try {
        await staffService.uploadDocument(id, file, type);
        toast.success("Uploaded", { id: tId });
        fetchData(pagination.page, pagination.limit, currentSearch);
      } catch {
        toast.error("Upload Failed", { id: tId });
      }
    };
    input.click();
  };

  const handleDocumentDelete = async (id, type) => {
    if (!confirm(`Delete ${type}?`)) return;
    const tId = toast.loading("Deleting...");
    try {
      await staffService.deleteDocument(id, type);
      toast.success("Deleted", { id: tId });
      fetchData(pagination.page, pagination.limit, currentSearch);
    } catch {
      toast.error("Delete Failed", { id: tId });
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

  // --- COLUMNS ---
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
            {r.employeeCode}
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
      header: "Passport",
      render: (r) => (
        <div className="flex flex-col gap-1 text-xs">
          <div className="flex items-center gap-1">
            <Globe className="w-3.5 h-3.5 text-blue-500" />
            <span className="font-mono">{safeString(r.passportNumber)}</span>
          </div>
          {r.passportExpiry && (
            <div
              className={`flex items-center gap-1 ${
                isExpired(r.passportExpiry) ? "text-red-600" : "text-gray-500"
              }`}
            >
              <Calendar className="w-3 h-3" />
              Exp: {safeDate(r.passportExpiry)}
            </div>
          )}
        </div>
      ),
    },
    {
      header: "Visa",
      render: (r) => (
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${
            isExpired(r.visaExpiry)
              ? "bg-red-50 text-red-700"
              : "bg-gray-50 text-gray-700"
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span className="text-xs font-medium">{safeDate(r.visaExpiry)}</span>
        </div>
      ),
    },
    {
      header: "Emirates ID",
      render: (r) => (
        <div className="flex flex-col gap-1 text-xs">
          <div className="flex items-center gap-1">
            <CreditCard className="w-3.5 h-3.5 text-teal-500" />
            <span className="font-mono">{safeString(r.emiratesId)}</span>
          </div>
          {r.emiratesIdExpiry && (
            <div
              className={`flex items-center gap-1 ${
                isExpired(r.emiratesIdExpiry) ? "text-red-600" : "text-gray-500"
              }`}
            >
              <Calendar className="w-3 h-3" />
              Exp: {safeDate(r.emiratesIdExpiry)}
            </div>
          )}
        </div>
      ),
    },
    {
      header: "Passport Doc",
      className: "text-center min-w-[150px]",
      render: (r) => (
        <div className="flex flex-col gap-1">
          {r.passportDocument?.filename && (
            <div className="flex items-center gap-1 mb-1">
              <button
                onClick={() => handleDocumentView(r._id, "Passport", r.name)}
                className="text-xs text-green-600 font-medium hover:underline truncate px-2 text-left flex-1"
              >
                ✓ {r.passportDocument.filename}
              </button>
              <button
                onClick={() => handleDocumentDelete(r._id, "Passport")}
                className="text-red-500 hover:text-red-700 p-1"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          )}
          <button
            onClick={() => handleDocumentUpload(r._id, r.name, "Passport")}
            className={`w-full px-3 py-2 rounded-lg flex items-center justify-center gap-2 font-medium text-xs ${
              r.passportDocument?.filename
                ? "bg-green-50 text-green-600"
                : "bg-blue-50 text-blue-600"
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>{r.passportDocument?.filename ? "Replace" : "Upload"}</span>
          </button>
        </div>
      ),
    },
    {
      header: "Visa Doc",
      className: "text-center min-w-[150px]",
      render: (r) => (
        <div className="flex flex-col gap-1">
          {r.visaDocument?.filename && (
            <div className="flex items-center gap-1 mb-1">
              <button
                onClick={() => handleDocumentView(r._id, "Visa", r.name)}
                className="text-xs text-green-600 font-medium hover:underline truncate px-2 text-left flex-1"
              >
                ✓ {r.visaDocument.filename}
              </button>
              <button
                onClick={() => handleDocumentDelete(r._id, "Visa")}
                className="text-red-500 hover:text-red-700 p-1"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          )}
          <button
            onClick={() => handleDocumentUpload(r._id, r.name, "Visa")}
            className={`w-full px-3 py-2 rounded-lg flex items-center justify-center gap-2 font-medium text-xs ${
              r.visaDocument?.filename
                ? "bg-green-50 text-green-600"
                : "bg-purple-50 text-purple-600"
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>{r.visaDocument?.filename ? "Replace" : "Upload"}</span>
          </button>
        </div>
      ),
    },
    {
      header: "E-ID Doc",
      className: "text-center min-w-[150px]",
      render: (r) => (
        <div className="flex flex-col gap-1">
          {r.emiratesIdDocument?.filename && (
            <div className="flex items-center gap-1 mb-1">
              <button
                onClick={() => handleDocumentView(r._id, "Emirates ID", r.name)}
                className="text-xs text-green-600 font-medium hover:underline truncate px-2 text-left flex-1"
              >
                ✓ {r.emiratesIdDocument.filename}
              </button>
              <button
                onClick={() => handleDocumentDelete(r._id, "Emirates ID")}
                className="text-red-500 hover:text-red-700 p-1"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          )}
          <button
            onClick={() => handleDocumentUpload(r._id, r.name, "Emirates ID")}
            className={`w-full px-3 py-2 rounded-lg flex items-center justify-center gap-2 font-medium text-xs ${
              r.emiratesIdDocument?.filename
                ? "bg-green-50 text-green-600"
                : "bg-teal-50 text-teal-600"
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>{r.emiratesIdDocument?.filename ? "Replace" : "Upload"}</span>
          </button>
        </div>
      ),
    },
    {
      header: "Actions",
      className:
        "text-right sticky right-0 bg-white shadow-[-10px_0_10px_-10px_rgba(0,0,0,0.1)] min-w-[120px]",
      render: (r) => (
        <div className="flex justify-end gap-1.5 pr-2">
          <button
            onClick={() => handleViewAllDocuments(r)}
            className="p-2 hover:bg-indigo-50 text-indigo-600 rounded-lg"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleEdit(r)}
            className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDeleteAction(r)}
            className="p-2 hover:bg-red-50 text-red-600 rounded-lg"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <input
        type="file"
        accept=".xlsx"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Header */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Staff Management
                </h1>
                <p className="text-sm text-gray-500">Manage employee records</p>
              </div>
            </div>
            <div className="relative max-w-md">
              <input
                type="text"
                placeholder="Search..."
                value={currentSearch}
                onChange={(e) => setCurrentSearch(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" &&
                  fetchData(1, pagination.limit, currentSearch)
                }
                className="w-full h-12 bg-gray-50 border border-gray-200 rounded-xl pl-12 pr-4 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
              />
              <Search className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleDownloadTemplate}
              className="h-11 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold flex items-center gap-2"
            >
              <FileSpreadsheet className="w-4 h-4" /> Template
            </button>
            <button
              onClick={handleExportServerSide}
              className="h-11 px-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg"
            >
              <Download className="w-4 h-4" /> Export
            </button>
            <button
              onClick={() => fileInputRef.current.click()}
              disabled={importLoading}
              className="h-11 px-4 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg"
            >
              {importLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <UploadCloud className="w-4 h-4" />
              )}{" "}
              Import
            </button>
            <button
              onClick={handleAdd}
              className="h-11 px-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold flex items-center gap-2 shadow-xl"
            >
              <Plus className="w-5 h-5" /> Add Staff
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <DataTable
          columns={columns}
          data={data}
          loading={loading}
          pagination={pagination}
          onPageChange={(p) => fetchData(p, pagination.limit, currentSearch)}
          onLimitChange={(l) => fetchData(1, l, currentSearch)}
        />
      </div>

      <StaffModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() =>
          fetchData(pagination.page, pagination.limit, currentSearch)
        }
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
      />
      <DocumentPreviewModal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        documentUrl={previewDocument.url}
        title={previewDocument.title}
      />
    </div>
  );
};

export default Staff;
