import React, { useState, useEffect, useMemo } from "react";
import { X, User, MapPin, Loader2, Building, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

// APIs
import { bookingService } from "../../api/bookingService";
import { attendanceService } from "../../api/attendanceService";
import { locationService } from "../../api/locationService";
import { buildingService } from "../../api/buildingService";

const AssignWorkerModal = ({ isOpen, onClose, booking, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);

  // Data Lists
  const [workers, setWorkers] = useState([]);
  const [locations, setLocations] = useState([]);
  const [allBuildings, setAllBuildings] = useState([]);

  // Form State
  const [formData, setFormData] = useState({
    worker: "",
    location: "",
    building: "",
  });

  // --- Load Data ---
  useEffect(() => {
    if (isOpen) {
      setDataLoading(true);

      // Pre-fill form
      setFormData({
        worker: booking?.worker?._id || "",
        location: booking?.customer?.location || "",
        building: booking?.customer?.building || "",
      });

      const loadData = async () => {
        try {
          // Fetch all data in parallel
          const [workersRes, locRes, buildRes] = await Promise.all([
            attendanceService.getOrgList(),
            locationService.list(1, 1000),
            buildingService.list(1, 1000),
          ]);

          // 1. Workers
          const workerList = (workersRes.data || []).filter(
            (u) => u.role === "worker" || !u.role
          );
          setWorkers(workerList);

          // 2. Locations (Handle {data: []} vs [])
          const rawLocs = locRes.data || locRes;
          const locList = Array.isArray(rawLocs) ? rawLocs : rawLocs.data || [];
          setLocations(locList);

          // 3. Buildings
          const rawBuilds = buildRes.data || buildRes;
          const buildList = Array.isArray(rawBuilds)
            ? rawBuilds
            : rawBuilds.data || [];
          setAllBuildings(buildList);
        } catch (error) {
          console.error("Failed to load dropdowns", error);
          toast.error("Could not load options");
        } finally {
          setDataLoading(false);
        }
      };
      loadData();
    }
  }, [isOpen, booking]);

  // --- Cascading Filter ---
  const filteredBuildings = useMemo(() => {
    if (!formData.location) return [];

    return allBuildings.filter((b) => {
      // Check ID or Populated Object
      const bLocId = b.location_id || b.location?._id || b.location;
      return bLocId === formData.location;
    });
  }, [formData.location, allBuildings]);

  // --- Handlers ---
  const handleLocationChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      location: e.target.value,
      building: "",
    }));
  };

  const handleSubmit = async () => {
    if (!formData.worker) return toast.error("Please select a worker");

    if (booking?.service_type === "residence") {
      if (!formData.location) return toast.error("Location is required");
      if (!formData.building) return toast.error("Building is required");
    }

    setLoading(true);
    try {
      await bookingService.assignWorker(booking._id, formData);
      toast.success("Worker assigned successfully");
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || "Assignment failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop (No Blur = Smooth) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/50"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 15 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            className="bg-white w-full max-w-md rounded-2xl shadow-2xl relative z-10 flex flex-col overflow-hidden max-h-[90vh]"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-white">
              <div>
                <h3 className="text-lg font-bold text-slate-800">
                  Assign Worker
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Booking #{booking?.id || "---"}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-5 overflow-y-auto">
              {dataLoading ? (
                <div className="py-10 flex flex-col items-center justify-center text-slate-400 gap-2">
                  <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                  <span className="text-sm">Loading options...</span>
                </div>
              ) : (
                <>
                  {/* Worker Select */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-2">
                      Worker
                    </label>
                    <div className="relative group">
                      <User className="absolute left-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
                      <select
                        value={formData.worker}
                        onChange={(e) =>
                          setFormData({ ...formData, worker: e.target.value })
                        }
                        className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-sm text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none bg-white cursor-pointer hover:border-slate-300 transition-colors appearance-none"
                      >
                        <option value="" className="text-slate-400 bg-white">
                          Select Worker
                        </option>
                        {workers.map((w) => (
                          <option
                            key={w._id}
                            value={w._id}
                            className="text-slate-800 bg-white"
                          >
                            {w.name} ({w.mobile})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Residence Details */}
                  {booking?.service_type === "residence" && (
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-4">
                      <div className="flex items-center gap-2 text-indigo-600 text-xs font-bold uppercase tracking-wide">
                        <AlertCircle className="w-4 h-4" />
                        Residence Details
                      </div>

                      {/* Location Select */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                          Location
                        </label>
                        <div className="relative group">
                          <MapPin className="absolute left-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
                          <select
                            value={formData.location}
                            onChange={handleLocationChange}
                            className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none bg-white cursor-pointer appearance-none"
                          >
                            <option
                              value=""
                              className="text-slate-400 bg-white"
                            >
                              Select Location
                            </option>
                            {locations.length > 0 ? (
                              locations.map((loc) => (
                                <option
                                  key={loc._id}
                                  value={loc._id}
                                  className="text-slate-800 bg-white"
                                >
                                  {loc.name}
                                </option>
                              ))
                            ) : (
                              <option value="" disabled className="bg-white">
                                No locations found
                              </option>
                            )}
                          </select>
                        </div>
                      </div>

                      {/* Building Select */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                          Building
                        </label>
                        <div className="relative group">
                          <Building className="absolute left-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
                          <select
                            value={formData.building}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                building: e.target.value,
                              })
                            }
                            disabled={!formData.location}
                            className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none bg-white disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed transition-colors cursor-pointer appearance-none"
                          >
                            <option
                              value=""
                              className="text-slate-400 bg-white"
                            >
                              {formData.location
                                ? "Select Building"
                                : "Select Location First"}
                            </option>
                            {filteredBuildings.length > 0 ? (
                              filteredBuildings.map((b) => (
                                <option
                                  key={b._id}
                                  value={b._id}
                                  className="text-slate-800 bg-white"
                                >
                                  {b.name}
                                </option>
                              ))
                            ) : (
                              <option value="" disabled className="bg-white">
                                {locations.length > 0
                                  ? "No buildings here"
                                  : "Loading..."}
                              </option>
                            )}
                          </select>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 rounded-xl hover:bg-white font-bold text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading || dataLoading}
                className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-bold text-sm flex justify-center items-center gap-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Confirm
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default AssignWorkerModal;
