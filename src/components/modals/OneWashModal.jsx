import React, { useState, useEffect } from "react";
import {
  X,
  Save,
  Loader2,
  Building,
  Car,
  CreditCard,
  User,
  MapPin,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

// API
import { oneWashService } from "../../api/oneWashService";
import { workerService } from "../../api/workerService";
import { mallService } from "../../api/mallService";
import { buildingService } from "../../api/buildingService";

const OneWashModal = ({ isOpen, onClose, job, onSuccess }) => {
  const [loading, setLoading] = useState(false);

  // Dropdown Data
  const [workers, setWorkers] = useState([]);
  const [malls, setMalls] = useState([]);
  const [buildings, setBuildings] = useState([]);

  const [formData, setFormData] = useState({
    service_type: "mall",
    worker: "",
    mall: "",
    building: "",
    registration_no: "",
    parking_no: "",
    amount: "",
    payment_mode: "cash",
    status: "pending",
  });

  // Load Dependencies
  useEffect(() => {
    if (isOpen) {
      const fetchData = async () => {
        try {
          const [wRes, mRes, bRes] = await Promise.all([
            workerService.list(1, 1000),
            mallService.list(1, 1000),
            buildingService.list(1, 1000),
          ]);
          setWorkers(wRes.data || []);
          setMalls(mRes.data || []);
          setBuildings(bRes.data || []);
        } catch (e) {
          console.error(e);
        }
      };
      fetchData();

      // Pre-fill if editing
      if (job) {
        setFormData({
          service_type: job.service_type || "mall",
          worker: job.worker?._id || job.worker || "",
          mall: job.mall?._id || job.mall || "",
          building: job.building?._id || job.building || "",
          registration_no: job.registration_no || "",
          parking_no: job.parking_no || "",
          amount: job.amount || "",
          payment_mode: job.payment_mode || "cash",
          status: job.status || "pending",
        });
      } else {
        // Reset
        setFormData({
          service_type: "mall",
          worker: "",
          mall: "",
          building: "",
          registration_no: "",
          parking_no: "",
          amount: "",
          payment_mode: "cash",
          status: "pending",
        });
      }
    }
  }, [isOpen, job]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      // Clear conflicting fields if type changes
      if (name === "service_type") {
        return { ...prev, [name]: value, mall: "", building: "" };
      }
      return { ...prev, [name]: value };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (job) {
        await oneWashService.update(job._id, formData);
        toast.success("Job updated successfully");
      } else {
        await oneWashService.create(formData);
        toast.success("Job created successfully");
      }
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || "Operation failed");
    } finally {
      setLoading(false);
    }
  };

  // Styles
  const labelClass =
    "block text-xs font-bold text-slate-500 uppercase mb-1 ml-1";
  const inputClass =
    "w-full text-sm font-medium bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all";

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* 1. BACKDROP: Removed blur for performance */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60" // Pure opacity is much faster than blur
          />

          {/* 2. MODAL: Optimized Spring Physics */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{
              type: "spring",
              stiffness: 350,
              damping: 25,
              mass: 0.5, // Lower mass makes it snappier
            }}
            className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl relative z-10 flex flex-col max-h-[90vh] overflow-hidden"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-white">
              <h3 className="text-lg font-bold text-slate-800">
                {job ? "Edit Job" : "New One Wash Job"}
              </h3>
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form
              onSubmit={handleSubmit}
              className="p-6 space-y-6 overflow-y-auto flex-1"
            >
              {/* Type Selection */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Service Type</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <select
                      name="service_type"
                      value={formData.service_type}
                      onChange={handleChange}
                      className={`${inputClass} pl-9 cursor-pointer`}
                    >
                      <option value="mall">Mall</option>
                      <option value="residence">Residence</option>
                    </select>
                  </div>
                </div>

                {/* Dynamic Location Field */}
                <div>
                  <label className={labelClass}>
                    {formData.service_type === "mall"
                      ? "Select Mall"
                      : "Select Building"}
                  </label>
                  <div className="relative">
                    <Building className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <select
                      name={
                        formData.service_type === "mall" ? "mall" : "building"
                      }
                      value={
                        formData.service_type === "mall"
                          ? formData.mall
                          : formData.building
                      }
                      onChange={handleChange}
                      className={`${inputClass} pl-9 cursor-pointer`}
                    >
                      <option value="">-- Select --</option>
                      {(formData.service_type === "mall"
                        ? malls
                        : buildings
                      ).map((item) => (
                        <option key={item._id} value={item._id}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Vehicle & Payment Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Car Plate No</label>
                  <div className="relative">
                    <Car className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                      name="registration_no"
                      value={formData.registration_no}
                      onChange={handleChange}
                      className={`${inputClass} pl-9 font-bold uppercase`}
                      placeholder="DXB 1234"
                    />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Parking No</label>
                  <input
                    name="parking_no"
                    value={formData.parking_no}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="B1-20"
                  />
                </div>
                <div>
                  <label className={labelClass}>Amount (AED)</label>
                  <input
                    type="number"
                    name="amount"
                    value={formData.amount}
                    onChange={handleChange}
                    className={`${inputClass} font-bold text-emerald-600`}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className={labelClass}>Payment Mode</label>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <select
                      name="payment_mode"
                      value={formData.payment_mode}
                      onChange={handleChange}
                      className={`${inputClass} pl-9`}
                    >
                      <option value="cash">Cash</option>
                      <option value="card">Card</option>
                      <option value="bank transfer">Bank Transfer</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Worker & Status */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Assign Worker</label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <select
                      name="worker"
                      value={formData.worker}
                      onChange={handleChange}
                      className={`${inputClass} pl-9 cursor-pointer`}
                    >
                      <option value="">Select Worker</option>
                      {workers.map((w) => (
                        <option key={w._id} value={w._id}>
                          {w.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Job Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className={`${inputClass} uppercase font-bold text-xs`}
                  >
                    <option value="pending">Pending</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>
            </form>

            <div className="p-4 bg-white border-t border-slate-100 flex justify-end gap-3">
              <button
                onClick={onClose}
                className="px-5 py-2.5 border border-slate-300 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-8 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-lg shadow-indigo-200"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />} Save
                Job
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default OneWashModal;
