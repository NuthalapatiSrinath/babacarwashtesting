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
  Server,
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
import * as XLSX from "xlsx";

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

  // Pagination & Search
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
      if (isNaN(date.getTime())) return "-";
      return date.toLocaleDateString("en-US", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch (e) {
      return "-";
    }
  };

  const safeString = (val) => {
    return val || "-";
  };

  // Check if date is expiring soon (within 30 days)
  const isExpiringSoon = (dateVal) => {
    if (!dateVal) return false;
    try {
      const date = new Date(dateVal);
      const today = new Date();
      const daysDiff = Math.ceil((date - today) / (1000 * 60 * 60 * 24));
      return daysDiff > 0 && daysDiff <= 30;
    } catch (e) {
      return false;
    }
  };

  // Check if date is expired
  const isExpired = (dateVal) => {
    if (!dateVal) return false;
    try {
      const date = new Date(dateVal);
      const today = new Date();
      return date < today;
    } catch (e) {
      return false;
    }
  };

  // --- Fetch Data ---
  const fetchData = async (page = 1, limit = 10, search = "") => {
    setLoading(true);
    setCurrentSearch(search);
    try {
      const response = await staffService.list(page, limit, search);
      setData(Array.isArray(response.data) ? response.data : []);
      setPagination({
        page,
        limit,
        total: response.total || 0,
        totalPages: Math.ceil((response.total || 0) / limit) || 1,
      });
    } catch (error) {
      console.error("Staff load error:", error);
      setData([]);
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
      const msg = error.response?.data?.message || "Delete failed";
      toast.error(msg);
    } finally {
      setDeleteLoading(false);
    }
  };

  // --- 1. FRONTEND EXCEL EXPORT (XLSX) ---
  const handleExportFrontendXLSX = async () => {
    const toastId = toast.loading("Fetching data...");
    try {
      const res = await staffService.list(1, 10000, currentSearch);
      const allData = Array.isArray(res.data) ? res.data : [];

      if (allData.length === 0) {
        toast.error("No data to export", { id: toastId });
        return;
      }

      const excelData = allData.map((row, idx) => ({
        "S. No": idx + 1,
        "Company Name": row.companyName || "Nil",
        "Employee Name": row.name || "Unknown",
        "Employee Code": row.employeeCode || "Nil",
        "Date of Join": safeDate(row.joiningDate),
        "Working Site": row.site
          ? typeof row.site === "object"
            ? row.site.name
            : row.site
          : "Unassigned",
        "Passport No": row.passportNumber || "Nil",
        "Passport Expiry": safeDate(row.passportExpiry),
        "Visa Expiry": safeDate(row.visaExpiry),
        "E ID": row.emiratesId || "Nil",
        "E ID Expiry": safeDate(row.emiratesIdExpiry),
      }));

      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Staff List");
      XLSX.writeFile(workbook, "Staff_List.xlsx");
      toast.success("Export successful!", { id: toastId });
    } catch (e) {
      toast.error("Export failed", { id: toastId });
    }
  };

  // --- 2. SERVER EXPORT (XLSX) ---
  const handleExportServerSide = async () => {
    const toastId = toast.loading("Requesting Excel file...");
    try {
      const blob = await staffService.exportData();
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "staff_server_export.xlsx");
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Downloaded", { id: toastId });
    } catch (error) {
      toast.error("Server export failed", { id: toastId });
    }
  };

  // --- 3. DOWNLOAD TEMPLATE (XLSX) - FROM BACKEND ---
  const handleDownloadTemplate = async () => {
    const toastId = toast.loading("Downloading template...");
    try {
      const blob = await staffService.downloadTemplate();
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "staff-import-template.xlsx");
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Template downloaded!", { id: toastId });
    } catch (e) {
      console.error(e);
      toast.error("Failed to download template", { id: toastId });
    }
  };

  // --- 4. IMPORT (XLSX) ---
  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    event.target.value = null;

    const formData = new FormData();
    formData.append("file", file);

    setImportLoading(true);
    const toastId = toast.loading("Importing...");
    try {
      await staffService.importData(formData);
      toast.success("Import successful!", { id: toastId });
      fetchData(1, pagination.limit);
    } catch (error) {
      toast.error("Import failed", { id: toastId });
    } finally {
      setImportLoading(false);
    }
  };

  // --- 5. DOCUMENT UPLOAD HANDLER ---
  const handleDocumentUpload = (staffId, staffName, docType) => {
    // Create a file input for this specific document
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".pdf"; // Only PDF files allowed
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      // Validate file type
      if (!file.name.toLowerCase().endsWith(".pdf")) {
        toast.error("Only PDF files are allowed");
        return;
      }

      // Validate file size (max 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        toast.error("File size must be less than 10MB");
        return;
      }

      const toastId = toast.loading(`Uploading ${docType}...`);
      try {
        const response = await staffService.uploadDocument(
          staffId,
          file,
          docType
        );
        toast.success(`${docType} uploaded successfully!`, { id: toastId });
        fetchData(pagination.page, pagination.limit, currentSearch);
      } catch (error) {
        console.error("Upload error:", error);
        toast.error(`Failed to upload ${docType}`, { id: toastId });
      }
    };
    input.click();
  };

  // --- 6. DOCUMENT DELETE HANDLER ---
  const handleDocumentDelete = async (staffId, docType) => {
    if (!confirm(`Are you sure you want to delete this ${docType}?`)) {
      return;
    }

    const toastId = toast.loading(`Deleting ${docType}...`);
    try {
      await staffService.deleteDocument(staffId, docType);
      toast.success(`${docType} deleted successfully!`, { id: toastId });
      fetchData(pagination.page, pagination.limit, currentSearch);
    } catch (error) {
      console.error("Delete error:", error);
      toast.error(`Failed to delete ${docType}`, { id: toastId });
    }
  };
  const handleDocumentView = (staffId, docType, staffName) => {
    const staff = data.find((s) => s._id === staffId);

    if (!staff) {
      toast.error("Staff not found");
      return;
    }

    let documentUrl = null;

    if (docType === "Passport") {
      documentUrl = staff.passportDocument?.url;
    } else if (docType === "Visa") {
      documentUrl = staff.visaDocument?.url;
    } else if (docType === "Emirates ID") {
      documentUrl = staff.emiratesIdDocument?.url;
    }

    if (!documentUrl) {
      toast.error("Document not available");
      return;
    }

    // IMPORTANT: ensure inline (no fl_attachment)
    const inlineUrl = documentUrl.replace("/fl_attachment/", "/");

    setPreviewDocument({
      url: inlineUrl,
      title: `${staffName} - ${docType}`,
    });

    setIsPreviewModalOpen(true);
  };

  // --- 8. VIEW ALL DOCUMENTS HANDLER ---
  const handleViewAllDocuments = (staff) => {
    setStaffForDocuments(staff);
    setIsDocumentModalOpen(true);
  };
  const columns = [
    {
      header: "#",
      accessor: "id",
      className: "w-16 text-center",
      render: (row, idx) => (
        <div className="flex items-center justify-center">
          <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center text-indigo-600 font-bold text-xs">
            {(pagination.page - 1) * pagination.limit + idx + 1}
          </span>
        </div>
      ),
    },
    {
      header: "Company",
      accessor: "companyName",
      className: "min-w-[160px]",
      render: (row) => (
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm">
            <Briefcase className="w-4 h-4 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-gray-800">
              {safeString(row.companyName)}
            </span>
          </div>
        </div>
      ),
    },
    {
      header: "Employee Details",
      accessor: "name",
      className: "min-w-[200px]",
      render: (row) => (
        <div className="flex flex-col py-1">
          <span className="font-bold text-sm text-gray-900">
            {safeString(row.name)}
          </span>
          <div className="flex items-center gap-1.5 mt-0.5">
            <Hash className="w-3 h-3 text-gray-400" />
            <span className="text-xs text-gray-500 font-mono">
              {safeString(row.employeeCode)}
            </span>
          </div>
        </div>
      ),
    },
    {
      header: "Joining Date",
      accessor: "joiningDate",
      className: "min-w-[130px]",
      render: (row) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
            <Calendar className="w-3.5 h-3.5 text-green-600" />
          </div>
          <span className="text-xs text-gray-700 font-medium">
            {safeDate(row.joiningDate)}
          </span>
        </div>
      ),
    },
    {
      header: "Site",
      accessor: "site",
      className: "min-w-[150px]",
      render: (row) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
            <Map className="w-3.5 h-3.5 text-purple-600" />
          </div>
          <span className="text-xs text-gray-700 font-medium">
            {row.site
              ? typeof row.site === "object"
                ? row.site.name || "Unknown"
                : row.site
              : "Unassigned"}
          </span>
        </div>
      ),
    },
    {
      header: "Passport",
      accessor: "passportNumber",
      className: "min-w-[200px]",
      render: (row) => {
        const expired = isExpired(row.passportExpiry);
        const expiring = isExpiringSoon(row.passportExpiry);

        return (
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <Globe className="w-3.5 h-3.5 text-blue-500" />
              <span className="text-xs font-mono text-gray-700">
                {safeString(row.passportNumber)}
              </span>
            </div>
            {row.passportExpiry && (
              <div
                className={`flex items-center gap-1 text-xs ${
                  expired
                    ? "text-red-600"
                    : expiring
                    ? "text-amber-600"
                    : "text-gray-500"
                }`}
              >
                <Calendar className="w-3 h-3" />
                <span className="font-medium">
                  Exp: {safeDate(row.passportExpiry)}
                </span>
                {(expired || expiring) && <AlertCircle className="w-3 h-3" />}
              </div>
            )}
          </div>
        );
      },
    },
    {
      header: "Visa",
      accessor: "visaExpiry",
      className: "min-w-[140px]",
      render: (row) => {
        const expired = isExpired(row.visaExpiry);
        const expiring = isExpiringSoon(row.visaExpiry);

        return (
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${
              expired ? "bg-red-50" : expiring ? "bg-amber-50" : "bg-gray-50"
            }`}
          >
            <FileText
              className={`w-3.5 h-3.5 ${
                expired
                  ? "text-red-600"
                  : expiring
                  ? "text-amber-600"
                  : "text-gray-500"
              }`}
            />
            <span
              className={`text-xs font-medium ${
                expired
                  ? "text-red-700"
                  : expiring
                  ? "text-amber-700"
                  : "text-gray-700"
              }`}
            >
              {safeDate(row.visaExpiry)}
            </span>
            {(expired || expiring) && <AlertCircle className="w-3 h-3" />}
          </div>
        );
      },
    },
    {
      header: "Emirates ID",
      accessor: "emiratesId",
      className: "min-w-[220px]",
      render: (row) => {
        const expired = isExpired(row.emiratesIdExpiry);
        const expiring = isExpiringSoon(row.emiratesIdExpiry);

        return (
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <CreditCard className="w-3.5 h-3.5 text-teal-500" />
              <span className="text-xs font-mono text-gray-700">
                {safeString(row.emiratesId)}
              </span>
            </div>
            {row.emiratesIdExpiry && (
              <div
                className={`flex items-center gap-1 text-xs ${
                  expired
                    ? "text-red-600"
                    : expiring
                    ? "text-amber-600"
                    : "text-gray-500"
                }`}
              >
                <Calendar className="w-3 h-3" />
                <span className="font-medium">
                  Exp: {safeDate(row.emiratesIdExpiry)}
                </span>
                {(expired || expiring) && <AlertCircle className="w-3 h-3" />}
              </div>
            )}
          </div>
        );
      },
    },
    {
      header: "Passport Upload",
      className: "min-w-[150px] text-center",
      render: (row) => {
        const hasDocument =
          row.passportDocument && row.passportDocument.filename;
        const fileName = hasDocument ? row.passportDocument.filename : null;

        return (
          <div className="flex flex-col gap-1">
            {hasDocument && (
              <div className="flex items-center gap-1 mb-1">
                <button
                  onClick={() =>
                    handleDocumentView(row._id, "Passport", row.name)
                  }
                  className="text-xs text-green-600 font-medium hover:underline truncate px-2 cursor-pointer flex-1 text-left"
                  title={`Click to view: ${fileName}`}
                >
                  ✓ {fileName}
                </button>
                <button
                  onClick={() => handleDocumentDelete(row._id, "Passport")}
                  className="text-red-500 hover:text-red-700 p-1"
                  title="Delete document"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            )}
            <button
              className={`w-full px-3 py-2 rounded-lg transition-all shadow-sm hover:shadow flex items-center justify-center gap-2 font-medium text-xs ${
                hasDocument
                  ? "bg-gradient-to-br from-green-50 to-green-100 text-green-600 hover:from-green-100 hover:to-green-200"
                  : "bg-gradient-to-br from-blue-50 to-blue-100 text-blue-600 hover:from-blue-100 hover:to-blue-200"
              }`}
              title={hasDocument ? "Replace Passport" : "Upload Passport"}
              onClick={() =>
                handleDocumentUpload(row._id, row.name, "Passport")
              }
            >
              <Globe className="w-4 h-4" />
              <span>{hasDocument ? "Replace" : "Upload"}</span>
            </button>
          </div>
        );
      },
    },
    {
      header: "Visa Upload",
      className: "min-w-[150px] text-center",
      render: (row) => {
        const hasDocument = row.visaDocument && row.visaDocument.filename;
        const fileName = hasDocument ? row.visaDocument.filename : null;

        return (
          <div className="flex flex-col gap-1">
            {hasDocument && (
              <div className="flex items-center gap-1 mb-1">
                <button
                  onClick={() => handleDocumentView(row._id, "Visa", row.name)}
                  className="text-xs text-green-600 font-medium hover:underline truncate px-2 cursor-pointer flex-1 text-left"
                  title={`Click to view: ${fileName}`}
                >
                  ✓ {fileName}
                </button>
                <button
                  onClick={() => handleDocumentDelete(row._id, "Visa")}
                  className="text-red-500 hover:text-red-700 p-1"
                  title="Delete document"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            )}
            <button
              className={`w-full px-3 py-2 rounded-lg transition-all shadow-sm hover:shadow flex items-center justify-center gap-2 font-medium text-xs ${
                hasDocument
                  ? "bg-gradient-to-br from-green-50 to-green-100 text-green-600 hover:from-green-100 hover:to-green-200"
                  : "bg-gradient-to-br from-purple-50 to-purple-100 text-purple-600 hover:from-purple-100 hover:to-purple-200"
              }`}
              title={hasDocument ? "Replace Visa" : "Upload Visa"}
              onClick={() => handleDocumentUpload(row._id, row.name, "Visa")}
            >
              <FileText className="w-4 h-4" />
              <span>{hasDocument ? "Replace" : "Upload"}</span>
            </button>
          </div>
        );
      },
    },
    {
      header: "E-ID Upload",
      className: "min-w-[150px] text-center",
      render: (row) => {
        const hasDocument =
          row.emiratesIdDocument && row.emiratesIdDocument.filename;
        const fileName = hasDocument ? row.emiratesIdDocument.filename : null;

        return (
          <div className="flex flex-col gap-1">
            {hasDocument && (
              <div className="flex items-center gap-1 mb-1">
                <button
                  onClick={() =>
                    handleDocumentView(row._id, "Emirates ID", row.name)
                  }
                  className="text-xs text-green-600 font-medium hover:underline truncate px-2 cursor-pointer flex-1 text-left"
                  title={`Click to view: ${fileName}`}
                >
                  ✓ {fileName}
                </button>
                <button
                  onClick={() => handleDocumentDelete(row._id, "Emirates ID")}
                  className="text-red-500 hover:text-red-700 p-1"
                  title="Delete document"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            )}
            <button
              className={`w-full px-3 py-2 rounded-lg transition-all shadow-sm hover:shadow flex items-center justify-center gap-2 font-medium text-xs ${
                hasDocument
                  ? "bg-gradient-to-br from-green-50 to-green-100 text-green-600 hover:from-green-100 hover:to-green-200"
                  : "bg-gradient-to-br from-emerald-50 to-emerald-100 text-emerald-600 hover:from-emerald-100 hover:to-emerald-200"
              }`}
              title={hasDocument ? "Replace Emirates ID" : "Upload Emirates ID"}
              onClick={() =>
                handleDocumentUpload(row._id, row.name, "Emirates ID")
              }
            >
              <CreditCard className="w-4 h-4" />
              <span>{hasDocument ? "Replace" : "Upload"}</span>
            </button>
          </div>
        );
      },
    },
    {
      header: "Actions",
      className:
        "text-right sticky right-0 bg-white shadow-[-10px_0_10px_-10px_rgba(0,0,0,0.1)] min-w-[120px]",
      render: (row) => (
        <div className="flex justify-end items-center gap-1.5 pr-2">
          <button
            onClick={() => handleViewAllDocuments(row)}
            className="p-2 hover:bg-indigo-50 text-gray-400 hover:text-indigo-600 rounded-lg transition-all hover:shadow-sm"
            title="View Documents"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleEdit(row)}
            className="p-2 hover:bg-blue-50 text-gray-400 hover:text-blue-600 rounded-lg transition-all hover:shadow-sm"
            title="Edit Staff"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDeleteAction(row)}
            className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-lg transition-all hover:shadow-sm"
            title="Delete Staff"
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

      {/* Header Section */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          {/* Title & Search */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Staff Management
                </h1>
                <p className="text-sm text-gray-500 mt-0.5">
                  Manage employee records and documents
                </p>
              </div>
            </div>

            <div className="relative max-w-md">
              <input
                type="text"
                placeholder="Search by name, code, passport, or Emirates ID..."
                value={currentSearch}
                onChange={(e) => setCurrentSearch(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" &&
                  fetchData(1, pagination.limit, currentSearch)
                }
                className="w-full h-12 bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-xl pl-12 pr-4 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 transition-all"
              />
              <Search className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
              {currentSearch && (
                <button
                  onClick={() => {
                    setCurrentSearch("");
                    fetchData(1, pagination.limit, "");
                  }}
                  className="absolute right-3 top-3 px-2 py-1 text-xs text-gray-500 hover:text-gray-700 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleDownloadTemplate}
              className="h-11 px-4 bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-700 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-sm hover:shadow"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span className="hidden sm:inline">Template</span>
            </button>

            <button
              onClick={handleExportServerSide}
              className="h-11 px-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg hover:shadow-xl transition-all"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export</span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={importLoading}
              className="h-11 px-4 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white rounded-xl text-xs font-bold flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all"
            >
              {importLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <UploadCloud className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">Import</span>
            </button>

            <button
              onClick={handleAdd}
              className="h-11 px-5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl text-sm font-bold flex items-center gap-2 shadow-xl hover:shadow-2xl transition-all active:scale-95"
            >
              <Plus className="w-5 h-5" />
              <span>Add Staff</span>
            </button>
          </div>
        </div>

        {/* Stats Summary */}
        {data.length > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-100">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100">
                <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-blue-600 font-medium">
                    Total Staff
                  </p>
                  <p className="text-xl font-bold text-blue-900">
                    {pagination.total}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-br from-green-50 to-green-100">
                <div className="w-10 h-10 rounded-lg bg-green-500 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-green-600 font-medium">
                    Current Page
                  </p>
                  <p className="text-xl font-bold text-green-900">
                    {pagination.page}/{pagination.totalPages}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100">
                <div className="w-10 h-10 rounded-lg bg-purple-500 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-purple-600 font-medium">
                    Per Page
                  </p>
                  <p className="text-xl font-bold text-purple-900">
                    {pagination.limit}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-br from-amber-50 to-amber-100">
                <div className="w-10 h-10 rounded-lg bg-amber-500 flex items-center justify-center">
                  <Briefcase className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-amber-600 font-medium">Showing</p>
                  <p className="text-xl font-bold text-amber-900">
                    {data.length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Table Section */}
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
        message={`Are you sure you want to delete "${staffToDelete?.name}"?`}
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
