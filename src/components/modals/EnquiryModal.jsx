import React, { useState, useEffect } from "react";
import { X, Phone, Car, MapPin, Loader2, Save } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

// API
import { enquiryService } from "../../api/enquiryService";

const EnquiryModal = ({ isOpen, onClose, enquiry, onSuccess }) => {
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    mobile: "",
    registration_no: "",
    parking_no: "",
    status: "pending",
  });

  // Load Data on Edit
  useEffect(() => {
    if (isOpen) {
      if (enquiry) {
        setFormData({
          mobile: enquiry.mobile || "",
          registration_no: enquiry.registration_no || "",
          parking_no: enquiry.parking_no || "",
          status: enquiry.status || "pending",
        });
      } else {
        // Reset for Create
        setFormData({
          mobile: "",
          registration_no: "",
          parking_no: "",
          status: "pending",
        });
      }
    }
  }, [isOpen, enquiry]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.mobile) return toast.error("Mobile number is required");
    if (!formData.registration_no)
      return toast.error("Vehicle number is required");

    setLoading(true);
    try {
      if (enquiry) {
        await enquiryService.update(enquiry._id, formData);
        toast.success("Enquiry updated successfully");
      } else {
        await enquiryService.create(formData);
        toast.success("Enquiry created successfully");
      }
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || "Operation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 15 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            className="bg-white w-full max-w-md rounded-2xl shadow-2xl relative z-10 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-white">
              <div>
                <h3 className="text-lg font-bold text-slate-800">
                  {enquiry ? "Edit Enquiry" : "New Enquiry"}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  {enquiry
                    ? `ID: #${enquiry.id || "---"}`
                    : "Create a new customer enquiry"}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex flex-col">
              <div className="p-6 space-y-4">
                {/* Mobile */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-2">
                    Mobile Number
                  </label>
                  <div className="relative group">
                    <Phone className="absolute left-3 top-3 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors pointer-events-none" />
                    <input
                      type="text"
                      value={formData.mobile}
                      onChange={(e) =>
                        setFormData({ ...formData, mobile: e.target.value })
                      }
                      placeholder="e.g. 971501234567"
                      className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Vehicle No */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-2">
                    Vehicle Registration
                  </label>
                  <div className="relative group">
                    <Car className="absolute left-3 top-3 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors pointer-events-none" />
                    <input
                      type="text"
                      value={formData.registration_no}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          registration_no: e.target.value,
                        })
                      }
                      placeholder="e.g. A 12345"
                      className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Parking No */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-2">
                    Parking Number
                  </label>
                  <div className="relative group">
                    <MapPin className="absolute left-3 top-3 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors pointer-events-none" />
                    <input
                      type="text"
                      value={formData.parking_no}
                      onChange={(e) =>
                        setFormData({ ...formData, parking_no: e.target.value })
                      }
                      placeholder="e.g. B2-405"
                      className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Status (Only on Edit) */}
                {enquiry && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-2">
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) =>
                        setFormData({ ...formData, status: e.target.value })
                      }
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white cursor-pointer"
                    >
                      <option value="pending">Pending</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 rounded-xl hover:bg-white hover:border-slate-300 transition-all text-sm font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all text-sm font-bold disabled:opacity-70 flex justify-center items-center gap-2"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Save Enquiry
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default EnquiryModal;
