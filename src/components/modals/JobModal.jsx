import React, { useState, useEffect } from "react";
import { X, Save, Loader2, User, Car, Calendar, Briefcase } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

// API
import { jobService } from "../../api/jobService";
import { customerService } from "../../api/customerService";
import { workerService } from "../../api/workerService";

const JobModal = ({ isOpen, onClose, job, onSuccess }) => {
  const [loading, setLoading] = useState(false);

  // Dropdown Data
  const [workers, setWorkers] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [availableVehicles, setAvailableVehicles] = useState([]);

  const [formData, setFormData] = useState({
    customer: "",
    vehicle: "",
    worker: "",
    assignedDate: "",
    status: "pending",
    rejectionReason: "",
  });

  // 1. Load Initial Data (Workers & Customers)
  useEffect(() => {
    if (isOpen) {
      const loadData = async () => {
        try {
          const [wRes, cRes] = await Promise.all([
            workerService.list(1, 1000),
            customerService.list(1, 1000), // Fetching all customers for dropdown
          ]);
          setWorkers(wRes.data || []);
          setCustomers(cRes.data || []);
        } catch (e) {
          console.error("Failed to load options", e);
        }
      };
      loadData();

      // Pre-fill if editing
      if (job) {
        // If editing, we need to populate vehicles based on the existing customer
        const selectedCustomer = job.customer;
        // The backend 'list' usually populates customer, so we check if it's an object or ID
        const customerId = selectedCustomer?._id || selectedCustomer;

        // Find full customer object to get vehicles
        // (Note: In a real app with pagination, you might need to fetch the specific customer details if not in list)
        // For now, we rely on the list or the job object having the populated customer with vehicles.
        const vehicles = selectedCustomer?.vehicles || [];
        setAvailableVehicles(vehicles);

        setFormData({
          customer: customerId || "",
          vehicle: job.vehicle?._id || job.vehicle || "", // Backend sends populated vehicle or ID
          worker: job.worker?._id || job.worker || "",
          assignedDate: job.assignedDate
            ? new Date(job.assignedDate).toISOString().split("T")[0]
            : "",
          status: job.status || "pending",
          rejectionReason: job.rejectionReason || "",
        });
      } else {
        // Reset
        setFormData({
          customer: "",
          vehicle: "",
          worker: "",
          assignedDate: "",
          status: "pending",
          rejectionReason: "",
        });
        setAvailableVehicles([]);
      }
    }
  }, [isOpen, job]);

  // 2. Handle Customer Change -> Update Vehicles
  const handleCustomerChange = (e) => {
    const customerId = e.target.value;
    const selectedCus = customers.find((c) => c._id === customerId);

    setFormData((prev) => ({
      ...prev,
      customer: customerId,
      vehicle: "", // Reset vehicle when customer changes
    }));

    setAvailableVehicles(selectedCus?.vehicles || []);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate rejection reason when status is cancelled
    if (formData.status === "cancelled" && !formData.rejectionReason?.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }

    setLoading(true);
    try {
      if (job) {
        await jobService.update(job._id, formData);
        toast.success("Job updated");
      } else {
        await jobService.create(formData);
        toast.success("Job scheduled");
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
          {/* Backdrop (No Blur for Performance) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{
              type: "spring",
              stiffness: 350,
              damping: 25,
              mass: 0.5,
            }}
            className="bg-white w-full max-w-lg rounded-2xl shadow-2xl relative z-10 flex flex-col max-h-[90vh] overflow-hidden"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-white">
              <h3 className="text-lg font-bold text-slate-800">
                {job ? "Edit Job" : "Schedule New Job"}
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
              className="p-6 space-y-5 overflow-y-auto flex-1"
            >
              {/* Customer Selection */}
              <div>
                <label className={labelClass}>Customer</label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <select
                    name="customer"
                    value={formData.customer}
                    onChange={handleCustomerChange}
                    className={`${inputClass} pl-9 cursor-pointer`}
                  >
                    <option value="">Select Customer</option>
                    {customers.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.firstName} {c.lastName} ({c.mobile})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Vehicle Selection */}
              <div>
                <label className={labelClass}>Vehicle</label>
                <div className="relative">
                  <Car className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <select
                    name="vehicle"
                    value={formData.vehicle}
                    onChange={handleChange}
                    className={`${inputClass} pl-9 cursor-pointer`}
                    disabled={!formData.customer}
                  >
                    <option value="">Select Vehicle</option>
                    {availableVehicles.map((v) => (
                      <option key={v._id} value={v._id}>
                        {v.registration_no} - {v.parking_no}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Worker & Date Row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Assign Worker</label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
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
                  <label className={labelClass}>Assigned Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                      type="date"
                      name="assignedDate"
                      value={formData.assignedDate}
                      onChange={handleChange}
                      className={`${inputClass} pl-9 cursor-pointer`}
                    />
                  </div>
                </div>
              </div>

              {/* Status */}
              <div>
                <label className={labelClass}>Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className={`${inputClass} font-bold text-xs uppercase`}
                >
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Rejected</option>
                </select>
              </div>

              {/* Rejection Reason - Only show when status is cancelled/rejected */}
              {formData.status === "cancelled" && (
                <div>
                  <label className={labelClass}>Rejection Reason *</label>
                  <textarea
                    name="rejectionReason"
                    value={formData.rejectionReason}
                    onChange={handleChange}
                    placeholder="Please provide a reason for rejection..."
                    rows={3}
                    className={`${inputClass} resize-none`}
                    required
                  />
                </div>
              )}
            </form>

            {/* Footer */}
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
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}{" "}
                {job ? "Update" : "Schedule"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default JobModal;
