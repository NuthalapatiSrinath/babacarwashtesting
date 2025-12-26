import React, { useState, useEffect } from "react";
import {
  X,
  Building,
  MapPin,
  Loader2,
  DollarSign,
  CreditCard,
  Calendar,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { buildingService } from "../../api/buildingService";
import { locationService } from "../../api/locationService";

const BuildingModal = ({ isOpen, onClose, onSuccess, editData }) => {
  const [loading, setLoading] = useState(false);
  const [fetchingLocations, setFetchingLocations] = useState(false);
  const [locations, setLocations] = useState([]);

  // Updated state to include new fields
  const [formData, setFormData] = useState({
    name: "",
    location_id: "",
    amount: 0,
    card_charges: 0,
    schedule_today: false,
  });

  // Fetch locations for dropdown
  useEffect(() => {
    if (isOpen) {
      console.log("[BuildingModal] Opened. Fetching locations...");
      const loadLocations = async () => {
        setFetchingLocations(true);
        try {
          const response = await locationService.list(1, 100);
          console.log(
            "[BuildingModal] Locations loaded:",
            response.data?.length
          );
          setLocations(response.data || []);
        } catch (error) {
          console.error("[BuildingModal] Failed to load locations:", error);
          toast.error("Failed to load locations");
        } finally {
          setFetchingLocations(false);
        }
      };
      loadLocations();

      // Populate form if editing
      if (editData) {
        console.log("[BuildingModal] Editing Mode. Data:", editData);
        setFormData({
          name: editData.name || "",
          location_id: editData.location_id?._id || editData.location_id || "",
          amount: editData.amount || 0,
          card_charges: editData.card_charges || 0,
          schedule_today: editData.schedule_today || false,
        });
      } else {
        console.log("[BuildingModal] Create Mode.");
        // Reset for new entry
        setFormData({
          name: "",
          location_id: "",
          amount: 0,
          card_charges: 0,
          schedule_today: false,
        });
      }
    }
  }, [isOpen, editData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("[BuildingModal] Submitting Form:", formData);

    if (!formData.name.trim() || !formData.location_id) {
      console.warn("[BuildingModal] Validation Failed: Name/Location empty");
      toast.error("Please fill in required fields (Name & Location)");
      return;
    }

    setLoading(true);
    try {
      if (editData) {
        console.log(`[BuildingModal] Updating ID: ${editData._id}`);
        await buildingService.update(editData._id, formData);
        toast.success("Building updated successfully");
      } else {
        console.log("[BuildingModal] Creating new building");
        await buildingService.create(formData);
        toast.success("Building created successfully");
      }
      onSuccess();
      onClose();
    } catch (error) {
      console.error("[BuildingModal] Submit Error:", error);
      toast.error(error.message || "Operation failed");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Optimized Backdrop: No blur, linear transition */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/60"
        />

        {/* Optimized Modal Content: Linear ease-out transition */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden relative z-10"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 sticky top-0 bg-white z-20">
            <h3 className="text-lg font-bold text-slate-800">
              {editData ? "Edit Building" : "Add New Building"}
            </h3>
            <button
              onClick={onClose}
              className="p-1 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Row 1: Name & Location */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Name */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Building Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Building className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-sm"
                    placeholder="Building Name"
                  />
                </div>
              </div>

              {/* Location */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Location <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MapPin className="h-4 w-4 text-slate-400" />
                  </div>
                  <select
                    value={formData.location_id}
                    onChange={(e) =>
                      setFormData({ ...formData, location_id: e.target.value })
                    }
                    disabled={fetchingLocations}
                    className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none appearance-none bg-white text-sm"
                  >
                    <option value="">Select Location</option>
                    {locations.map((loc) => (
                      <option key={loc._id} value={loc._id}>
                        {loc.address}
                      </option>
                    ))}
                  </select>
                  {fetchingLocations && (
                    <div className="absolute inset-y-0 right-8 flex items-center pointer-events-none">
                      <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Row 2: Amount & Card Charges */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Amount */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Amount
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <DollarSign className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="number"
                    min="0"
                    value={formData.amount}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        amount: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-sm"
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Card Charges */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Card Charges
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <CreditCard className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="number"
                    min="0"
                    value={formData.card_charges}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        card_charges: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-sm"
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>

            {/* Row 3: Schedule Today Toggle */}
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-700">
                    Schedule Today
                  </p>
                  <p className="text-xs text-slate-500">
                    Enable daily scheduling for this building
                  </p>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={formData.schedule_today}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      schedule_today: e.target.checked,
                    })
                  }
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>

            {/* Footer Buttons */}
            <div className="flex justify-end pt-4 gap-3 border-t border-slate-100">
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
                {editData ? "Save Changes" : "Create Building"}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default BuildingModal;
