import React, { useState, useEffect } from "react";
import { X, MapPin, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { locationService } from "../../api/locationService";

const LocationModal = ({ isOpen, onClose, onSuccess, editData }) => {
  const [loading, setLoading] = useState(false);
  const [address, setAddress] = useState("");

  // Populate data when editing
  useEffect(() => {
    if (isOpen) {
      if (editData) {
        setAddress(editData.address || "");
      } else {
        setAddress(""); // Clear for new entry
      }
    }
  }, [editData, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!address.trim()) {
      toast.error("Address is required");
      return;
    }

    setLoading(true);
    try {
      if (editData) {
        // UPDATE Existing
        await locationService.update(editData._id, { address });
        toast.success("Location updated successfully");
      } else {
        // CREATE New
        await locationService.create({ address });
        toast.success("Location added successfully");
      }
      onSuccess(); // Refresh the table
      onClose(); // Close the modal
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Operation failed");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Optimized Backdrop: No blur, smooth transition */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/60"
        />

        {/* Optimized Content: Linear easing */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden relative z-10"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h3 className="text-lg font-bold text-slate-800">
              {editData ? "Edit Location" : "Add New Location"}
            </h3>
            <button
              onClick={onClose}
              className="p-1 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MapPin className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                  placeholder="Enter address here..."
                  autoFocus
                />
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex justify-end pt-2 gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-all shadow-lg shadow-indigo-600/20 flex items-center gap-2 disabled:opacity-70"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {editData ? "Save Changes" : "Create Location"}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default LocationModal;
