import React, { useState, useEffect } from "react";
import { X, User, Hash, Map, Loader2, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { staffService } from "../../api/staffService";
import { siteService } from "../../api/siteService";

const StaffModal = ({ isOpen, onClose, onSuccess, editData }) => {
  const [loading, setLoading] = useState(false);
  const [fetchingSites, setFetchingSites] = useState(false);
  const [sites, setSites] = useState([]);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    employeeCode: "",
    site: "",
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
          site:
            editData.site && typeof editData.site === "object"
              ? editData.site._id
              : editData.site || "",
        });
      } else {
        setFormData({ name: "", employeeCode: "", site: "" });
      }
    }
  }, [isOpen, editData]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.employeeCode || !formData.site) {
      toast.error("All fields are required");
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
          <div className="p-6">
            <form id="staffForm" onSubmit={handleSubmit} className="space-y-5">
              {/* Name */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1 ml-1">
                  Full Name
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
                    placeholder="Enter staff name"
                  />
                </div>
              </div>

              {/* Employee Code */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1 ml-1">
                  Employee Code
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

              {/* Site Selection */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1 ml-1">
                  Assigned Site
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
