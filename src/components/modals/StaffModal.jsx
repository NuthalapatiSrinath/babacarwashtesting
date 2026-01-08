import React, { useState, useEffect } from "react";
import {
  X,
  User,
  Hash,
  Map,
  Loader2,
  ChevronDown,
  Briefcase,
  Calendar,
  CreditCard,
  Globe,
  FileText,
  Upload,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { staffService } from "../../api/staffService";
import { siteService } from "../../api/siteService";

const StaffModal = ({ isOpen, onClose, onSuccess, editData }) => {
  const [loading, setLoading] = useState(false);
  const [fetchingSites, setFetchingSites] = useState(false);
  const [sites, setSites] = useState([]);

  // Document upload states
  const [uploadingDoc, setUploadingDoc] = useState({
    passport: false,
    visa: false,
    emiratesId: false,
  });

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    employeeCode: "",
    companyName: "",
    joiningDate: "",
    site: "",
    passportNumber: "",
    passportExpiry: "",
    passportDocument: "",
    visaExpiry: "",
    visaDocument: "",
    emiratesId: "",
    emiratesIdExpiry: "",
    emiratesIdDocument: "",
  });

  // Load Sites & Populate Data
  useEffect(() => {
    if (isOpen) {
      const loadSites = async () => {
        setFetchingSites(true);
        try {
          const response = await siteService.list(1, 1000);
          setSites(response.data || []);
        } catch (error) {
          toast.error("Failed to load sites");
        } finally {
          setFetchingSites(false);
        }
      };
      loadSites();

      if (editData) {
        setFormData({
          name: editData.name || "",
          employeeCode: editData.employeeCode || "",
          companyName: editData.companyName || "",
          joiningDate: editData.joiningDate
            ? editData.joiningDate.split("T")[0]
            : "",
          site:
            editData.site && typeof editData.site === "object"
              ? editData.site._id
              : editData.site || "",
          passportNumber: editData.passportNumber || "",
          passportExpiry: editData.passportExpiry
            ? editData.passportExpiry.split("T")[0]
            : "",
          passportDocument: editData.passportDocument || "",
          visaExpiry: editData.visaExpiry
            ? editData.visaExpiry.split("T")[0]
            : "",
          visaDocument: editData.visaDocument || "",
          emiratesId: editData.emiratesId || "",
          emiratesIdExpiry: editData.emiratesIdExpiry
            ? editData.emiratesIdExpiry.split("T")[0]
            : "",
          emiratesIdDocument: editData.emiratesIdDocument || "",
        });
      } else {
        setFormData({
          name: "",
          employeeCode: "",
          companyName: "",
          joiningDate: "",
          site: "",
          passportNumber: "",
          passportExpiry: "",
          passportDocument: "",
          visaExpiry: "",
          visaDocument: "",
          emiratesId: "",
          emiratesIdExpiry: "",
          emiratesIdDocument: "",
        });
      }
    }
  }, [isOpen, editData]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !formData.name ||
      !formData.employeeCode ||
      !formData.companyName ||
      !formData.site
    ) {
      toast.error("Name, Employee Code, Company Name and Site are required");
      return;
    }

    setLoading(true);
    try {
      if (editData) {
        await staffService.update(editData._id, formData);
        toast.success("Staff updated successfully");
      } else {
        await staffService.create(formData);
        toast.success("Staff created successfully");
      }
      onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
      const msg =
        error.response?.data?.message || error.message || "Operation failed";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDocumentUpload = async (docType) => {
    if (!editData?._id) {
      toast.error("Please save the staff first before uploading documents");
      return;
    }

    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".pdf";
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      if (!file.name.toLowerCase().endsWith(".pdf")) {
        toast.error("Only PDF files are allowed");
        return;
      }

      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) {
        toast.error("File size must be less than 10MB");
        return;
      }

      const docKey =
        docType === "Passport"
          ? "passport"
          : docType === "Visa"
          ? "visa"
          : "emiratesId";
      setUploadingDoc((prev) => ({ ...prev, [docKey]: true }));

      const toastId = toast.loading(`Uploading ${docType}...`);
      try {
        const response = await staffService.uploadDocument(
          editData._id,
          file,
          docType
        );
        toast.success(`${docType} uploaded successfully!`, { id: toastId });

        // Update formData with document info (the response contains fileName)
        const fieldName =
          docType === "Passport"
            ? "passportDocument"
            : docType === "Visa"
            ? "visaDocument"
            : "emiratesIdDocument";
        setFormData((prev) => ({
          ...prev,
          [fieldName]: {
            filename: response.fileName,
            data: "stored_in_db", // Placeholder since we don't need base64 in frontend
          },
        }));
      } catch (error) {
        console.error("Upload error:", error);
        toast.error(`Failed to upload ${docType}`, { id: toastId });
      } finally {
        setUploadingDoc((prev) => ({ ...prev, [docKey]: false }));
      }
    };
    input.click();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/50"
        />

        {/* Modal Content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="bg-white w-full max-w-lg rounded-lg shadow-2xl overflow-hidden relative z-10 flex flex-col"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-xl font-bold text-gray-800">
              {editData ? "Edit Staff" : "Add New Staff"}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form Body */}
          <div className="p-6 max-h-[70vh] overflow-y-auto">
            <form id="staffForm" onSubmit={handleSubmit} className="space-y-5">
              {/* Company Name */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1 ml-1">
                  Company Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Briefcase className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={formData.companyName}
                    onChange={(e) =>
                      setFormData({ ...formData, companyName: e.target.value })
                    }
                    className="w-full pl-9 pr-4 py-3 rounded-md border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-sm"
                    placeholder="e.g. Baba Car Wash"
                  />
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1 ml-1">
                  Employee Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full pl-9 pr-4 py-3 rounded-md border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-sm"
                    placeholder="Enter employee name"
                  />
                </div>
              </div>

              {/* Employee Code */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1 ml-1">
                  Employee Code <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Hash className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={formData.employeeCode}
                    onChange={(e) =>
                      setFormData({ ...formData, employeeCode: e.target.value })
                    }
                    className="w-full pl-9 pr-4 py-3 rounded-md border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-sm"
                    placeholder="e.g. EMP-001"
                  />
                </div>
              </div>

              {/* Joining Date */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1 ml-1">
                  Date of Joining
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="date"
                    value={formData.joiningDate}
                    onChange={(e) =>
                      setFormData({ ...formData, joiningDate: e.target.value })
                    }
                    className="w-full pl-9 pr-4 py-3 rounded-md border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-sm"
                  />
                </div>
              </div>

              {/* Site Selection */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1 ml-1">
                  Assigned Site <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Map className="h-4 w-4 text-gray-400" />
                  </div>
                  <select
                    value={formData.site}
                    onChange={(e) =>
                      setFormData({ ...formData, site: e.target.value })
                    }
                    disabled={fetchingSites}
                    className="w-full pl-9 pr-8 py-3 rounded-md border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none appearance-none bg-white text-sm"
                  >
                    <option value="">Select a Site</option>
                    {sites.map((site) => (
                      <option key={site._id} value={site._id}>
                        {site.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-3.5 w-4 h-4 text-gray-400 pointer-events-none" />

                  {fetchingSites && (
                    <div className="absolute right-8 top-3.5">
                      <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                    </div>
                  )}
                </div>
              </div>

              {/* Passport Number */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1 ml-1">
                  Passport Number
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Globe className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={formData.passportNumber}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        passportNumber: e.target.value,
                      })
                    }
                    className="w-full pl-9 pr-4 py-3 rounded-md border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-sm"
                    placeholder="e.g. A1234567"
                  />
                </div>
              </div>

              {/* Passport Expiry */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1 ml-1">
                  Passport Expiry Date
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="date"
                    value={formData.passportExpiry}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        passportExpiry: e.target.value,
                      })
                    }
                    className="w-full pl-9 pr-4 py-3 rounded-md border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-sm"
                  />
                </div>
              </div>

              {/* Visa Expiry */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1 ml-1">
                  Visa Expiry Date
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FileText className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="date"
                    value={formData.visaExpiry}
                    onChange={(e) =>
                      setFormData({ ...formData, visaExpiry: e.target.value })
                    }
                    className="w-full pl-9 pr-4 py-3 rounded-md border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-sm"
                  />
                </div>
              </div>

              {/* Emirates ID */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1 ml-1">
                  Emirates ID Number
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <CreditCard className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={formData.emiratesId}
                    onChange={(e) =>
                      setFormData({ ...formData, emiratesId: e.target.value })
                    }
                    className="w-full pl-9 pr-4 py-3 rounded-md border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-sm"
                    placeholder="e.g. 784-1234-1234567-1"
                  />
                </div>
              </div>

              {/* Emirates ID Expiry */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1 ml-1">
                  Emirates ID Expiry Date
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="date"
                    value={formData.emiratesIdExpiry}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        emiratesIdExpiry: e.target.value,
                      })
                    }
                    className="w-full pl-9 pr-4 py-3 rounded-md border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-sm"
                  />
                </div>
              </div>

              {/* Document Uploads - Only show when editing */}
              {editData && (
                <>
                  <div className="pt-4 border-t border-gray-200">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">
                      Document Uploads (PDF only)
                    </h4>
                  </div>

                  {/* Passport Document */}
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1 ml-1">
                      Passport Document
                    </label>
                    {formData.passportDocument &&
                      formData.passportDocument.filename && (
                        <div className="mb-2 text-xs text-green-600 flex items-center gap-1">
                          <FileText className="w-3 h-3" />
                          <span className="font-medium">
                            ✓ {formData.passportDocument.filename}
                          </span>
                        </div>
                      )}
                    <button
                      type="button"
                      onClick={() => handleDocumentUpload("Passport")}
                      disabled={uploadingDoc.passport}
                      className={`w-full px-4 py-3 rounded-md border-2 border-dashed flex items-center justify-center gap-2 text-sm font-medium transition-all ${
                        formData.passportDocument &&
                        formData.passportDocument.filename
                          ? "border-green-300 bg-green-50 text-green-700 hover:bg-green-100"
                          : "border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100"
                      }`}
                    >
                      {uploadingDoc.passport ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Uploading...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4" />
                          <span>
                            {formData.passportDocument &&
                            formData.passportDocument.filename
                              ? "Replace Passport PDF"
                              : "Upload Passport PDF"}
                          </span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Visa Document */}
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1 ml-1">
                      Visa Document
                    </label>
                    {formData.visaDocument &&
                      formData.visaDocument.filename && (
                        <div className="mb-2 text-xs text-green-600 flex items-center gap-1">
                          <FileText className="w-3 h-3" />
                          <span className="font-medium">
                            ✓ {formData.visaDocument.filename}
                          </span>
                        </div>
                      )}
                    <button
                      type="button"
                      onClick={() => handleDocumentUpload("Visa")}
                      disabled={uploadingDoc.visa}
                      className={`w-full px-4 py-3 rounded-md border-2 border-dashed flex items-center justify-center gap-2 text-sm font-medium transition-all ${
                        formData.visaDocument && formData.visaDocument.filename
                          ? "border-green-300 bg-green-50 text-green-700 hover:bg-green-100"
                          : "border-purple-300 bg-purple-50 text-purple-700 hover:bg-purple-100"
                      }`}
                    >
                      {uploadingDoc.visa ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Uploading...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4" />
                          <span>
                            {formData.visaDocument &&
                            formData.visaDocument.filename
                              ? "Replace Visa PDF"
                              : "Upload Visa PDF"}
                          </span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Emirates ID Document */}
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1 ml-1">
                      Emirates ID Document
                    </label>
                    {formData.emiratesIdDocument &&
                      formData.emiratesIdDocument.filename && (
                        <div className="mb-2 text-xs text-green-600 flex items-center gap-1">
                          <FileText className="w-3 h-3" />
                          <span className="font-medium">
                            ✓ {formData.emiratesIdDocument.filename}
                          </span>
                        </div>
                      )}
                    <button
                      type="button"
                      onClick={() => handleDocumentUpload("Emirates ID")}
                      disabled={uploadingDoc.emiratesId}
                      className={`w-full px-4 py-3 rounded-md border-2 border-dashed flex items-center justify-center gap-2 text-sm font-medium transition-all ${
                        formData.emiratesIdDocument &&
                        formData.emiratesIdDocument.filename
                          ? "border-green-300 bg-green-50 text-green-700 hover:bg-green-100"
                          : "border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                      }`}
                    >
                      {uploadingDoc.emiratesId ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Uploading...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4" />
                          <span>
                            {formData.emiratesIdDocument &&
                            formData.emiratesIdDocument.filename
                              ? "Replace Emirates ID PDF"
                              : "Upload Emirates ID PDF"}
                          </span>
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
            </form>
          </div>

          {/* Footer */}
          <div className="p-5 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-md border border-gray-300 bg-white text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="staffForm"
              disabled={loading}
              className="px-6 py-2.5 rounded-md bg-[#009ef7] hover:bg-[#0095e8] text-white text-sm font-bold shadow-sm flex items-center gap-2 transition-all disabled:opacity-60"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {editData ? "Save Changes" : "Create Staff"}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default StaffModal;
