import React, { useState, useEffect } from "react";
import {
  X,
  User,
  Phone,
  MapPin,
  Home,
  Car,
  Loader2,
  Save,
  Calendar,
  DollarSign,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

// API
import { customerService } from "../../api/customerService";
import { locationService } from "../../api/locationService";
import { buildingService } from "../../api/buildingService";
import { workerService } from "../../api/workerService";

const CustomerModal = ({ isOpen, onClose, customer, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [locations, setLocations] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [workers, setWorkers] = useState([]);

  // Form State
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    mobile: "",
    location: "",
    building: "",
    flat_no: "",
    // Vehicle Info (Simplified for single vehicle add/edit context)
    vehicle: {
      registration_no: "",
      parking_no: "",
      vehicle_type: "sedan",
      amount: "",
      worker: "",
      schedule_type: "daily", // or weekly
      start_date: "",
      onboard_date: "", // Added onboard_date
      advance_amount: "",
    },
  });

  // Load Dropdown Data & Pre-fill Form
  useEffect(() => {
    if (isOpen) {
      const loadDependencies = async () => {
        try {
          const [locRes, buildRes, workRes] = await Promise.all([
            locationService.list(1, 1000),
            buildingService.list(1, 1000),
            workerService.list(1, 1000),
          ]);
          setLocations(locRes.data || []);
          setBuildings(buildRes.data || []);
          setWorkers((workRes.data || []).filter((w) => w.role === "worker")); // Filter for workers only if needed
        } catch (error) {
          console.error("Failed to load options", error);
          toast.error("Failed to load dropdown data");
        }
      };
      loadDependencies();

      // Pre-fill if Editing
      if (customer) {
        const v = customer.vehicles?.[0] || {}; // Edit first vehicle logic for now.
        // Note: For multiple vehicles, a more complex UI would be needed.

        setFormData({
          firstName: customer.firstName || "",
          lastName: customer.lastName || "",
          mobile: customer.mobile || "",
          location: customer.location?._id || customer.location || "", // Handle populated or ID
          building: customer.building?._id || customer.building || "", // Handle populated or ID
          flat_no: customer.flat_no || "",
          vehicle: {
            _id: v._id, // Keep ID for updates
            registration_no: v.registration_no || "",
            parking_no: v.parking_no || "",
            vehicle_type: v.vehicle_type || "sedan",
            amount: v.amount || "",
            worker: v.worker?._id || v.worker || "", // Handle populated or ID
            schedule_type: v.schedule_type || "daily",
            start_date: v.start_date ? v.start_date.split("T")[0] : "", // Format date for input
            onboard_date: v.onboard_date ? v.onboard_date.split("T")[0] : "", // Format date for input
            advance_amount: v.advance_amount || "",
          },
        });
      } else {
        // Reset Form for New Customer
        setFormData({
          firstName: "",
          lastName: "",
          mobile: "",
          location: "",
          building: "",
          flat_no: "",
          vehicle: {
            registration_no: "",
            parking_no: "",
            vehicle_type: "sedan",
            amount: "",
            worker: "",
            schedule_type: "daily",
            start_date: "",
            onboard_date: "",
            advance_amount: "",
          },
        });
      }
    }
  }, [isOpen, customer]);

  // Handlers
  const handleBasicChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleVehicleChange = (e) => {
    setFormData({
      ...formData,
      vehicle: { ...formData.vehicle, [e.target.name]: e.target.value },
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Backend expects 'vehicles' array
      const payload = {
        ...formData,
        vehicles: [formData.vehicle], // Wrap in array
      };

      if (customer) {
        await customerService.update(customer._id, payload);
        toast.success("Customer updated successfully");
      } else {
        await customerService.create(payload);
        toast.success("Customer created successfully");
      }
      onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Operation failed");
    } finally {
      setLoading(false);
    }
  };

  // Styles
  const labelClass =
    "block text-xs font-bold text-slate-500 uppercase mb-1 ml-1";
  const inputClass =
    "w-full text-sm text-slate-700 outline-none bg-transparent placeholder:text-slate-400 font-medium";
  const wrapperClass =
    "flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all";

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />

          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl relative z-10 flex flex-col max-h-[90vh] overflow-hidden"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-white">
              <h3 className="text-lg font-bold text-slate-800">
                {customer ? "Edit Customer" : "New Customer"}
              </h3>
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Form */}
            <form
              onSubmit={handleSubmit}
              className="flex-1 overflow-y-auto p-6 space-y-8"
            >
              {/* 1. Personal Info */}
              <div>
                <h4 className="text-sm font-bold text-slate-800 mb-4 border-l-4 border-blue-500 pl-3">
                  Personal Details
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div>
                    <label className={labelClass}>First Name</label>
                    <div className={wrapperClass}>
                      <User className="w-4 h-4 text-slate-400 mr-2" />
                      <input
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleBasicChange}
                        className={inputClass}
                        placeholder="John"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Last Name</label>
                    <div className={wrapperClass}>
                      <User className="w-4 h-4 text-slate-400 mr-2" />
                      <input
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleBasicChange}
                        className={inputClass}
                        placeholder="Doe"
                      />
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Mobile</label>
                    <div className={wrapperClass}>
                      <Phone className="w-4 h-4 text-slate-400 mr-2" />
                      <input
                        name="mobile"
                        value={formData.mobile}
                        onChange={handleBasicChange}
                        className={inputClass}
                        placeholder="971500000000"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Location Info */}
              <div>
                <h4 className="text-sm font-bold text-slate-800 mb-4 border-l-4 border-purple-500 pl-3">
                  Address
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div>
                    <label className={labelClass}>Location</label>
                    <div className={wrapperClass}>
                      <MapPin className="w-4 h-4 text-slate-400 mr-2" />
                      <select
                        name="location"
                        value={formData.location}
                        onChange={handleBasicChange}
                        className={`${inputClass} cursor-pointer`}
                      >
                        <option value="">Select Location</option>
                        {locations.map((l) => (
                          <option key={l._id} value={l._id}>
                            {l.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Building</label>
                    <div className={wrapperClass}>
                      <Home className="w-4 h-4 text-slate-400 mr-2" />
                      <select
                        name="building"
                        value={formData.building}
                        onChange={handleBasicChange}
                        className={`${inputClass} cursor-pointer`}
                      >
                        <option value="">Select Building</option>
                        {buildings.map((b) => (
                          <option key={b._id} value={b._id}>
                            {b.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Flat No</label>
                    <div className={wrapperClass}>
                      <Home className="w-4 h-4 text-slate-400 mr-2" />
                      <input
                        name="flat_no"
                        value={formData.flat_no}
                        onChange={handleBasicChange}
                        className={inputClass}
                        placeholder="101"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Vehicle Info */}
              <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
                <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <Car className="w-5 h-5 text-indigo-600" />
                  Vehicle Details
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                  <div>
                    <label className={labelClass}>Plate No</label>
                    <input
                      name="registration_no"
                      value={formData.vehicle.registration_no}
                      onChange={handleVehicleChange}
                      className="w-full p-2.5 rounded-lg border text-sm font-bold uppercase focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="DXB 12345"
                      required
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Type</label>
                    <select
                      name="vehicle_type"
                      value={formData.vehicle.vehicle_type}
                      onChange={handleVehicleChange}
                      className="w-full p-2.5 rounded-lg border text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
                    >
                      <option value="sedan">Sedan</option>
                      <option value="suv">SUV / 4x4</option>
                      <option value="bike">Bike</option>
                      <option value="hatchback">Hatchback</option>
                      <option value="xuv">XUV</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Parking No</label>
                    <input
                      name="parking_no"
                      value={formData.vehicle.parking_no}
                      onChange={handleVehicleChange}
                      className="w-full p-2.5 rounded-lg border text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="B1-20"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Amount</label>
                    <input
                      type="number"
                      name="amount"
                      value={formData.vehicle.amount}
                      onChange={handleVehicleChange}
                      className="w-full p-2.5 rounded-lg border text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Advance Amount</label>
                    <input
                      type="number"
                      name="advance_amount"
                      value={formData.vehicle.advance_amount}
                      onChange={handleVehicleChange}
                      className="w-full p-2.5 rounded-lg border text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Worker</label>
                    <select
                      name="worker"
                      value={formData.vehicle.worker}
                      onChange={handleVehicleChange}
                      className="w-full p-2.5 rounded-lg border text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
                    >
                      <option value="">Assign Worker</option>
                      {workers.map((w) => (
                        <option key={w._id} value={w._id}>
                          {w.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Start Date</label>
                    <input
                      type="date"
                      name="start_date"
                      value={formData.vehicle.start_date}
                      onChange={handleVehicleChange}
                      className="w-full p-2.5 rounded-lg border text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Onboard Date</label>
                    <input
                      type="date"
                      name="onboard_date"
                      value={formData.vehicle.onboard_date}
                      onChange={handleVehicleChange}
                      className="w-full p-2.5 rounded-lg border text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Schedule Type</label>
                    <select
                      name="schedule_type"
                      value={formData.vehicle.schedule_type}
                      onChange={handleVehicleChange}
                      className="w-full p-2.5 rounded-lg border text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="onetime">One Time</option>
                    </select>
                  </div>
                </div>
              </div>
            </form>

            {/* Footer */}
            <div className="p-4 bg-white border-t border-slate-100 flex justify-end gap-3">
              <button
                onClick={onClose}
                className="px-5 py-2.5 border border-slate-300 text-slate-600 font-bold rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-8 py-2.5 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-lg shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Save Customer
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default CustomerModal;
