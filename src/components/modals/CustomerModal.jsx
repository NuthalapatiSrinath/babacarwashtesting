import React, { useState, useEffect } from "react";
import {
  X,
  User,
  UserPlus,
  Phone,
  MapPin,
  Home,
  Car,
  Loader2,
  Save,
  DollarSign,
  Briefcase,
  Clock,
  Calendar,
  Mail,
  Plus,
  Trash2,
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

  // Data States
  const [locations, setLocations] = useState([]);
  const [allBuildings, setAllBuildings] = useState([]);
  const [filteredBuildings, setFilteredBuildings] = useState([]);

  const [allWorkers, setAllWorkers] = useState([]);
  const [filteredWorkers, setFilteredWorkers] = useState([]);

  // Empty Vehicle Template
  const vehicleTemplate = {
    registration_no: "",
    parking_no: "",
    vehicle_type: "sedan",
    amount: "",
    worker: "",
    schedule_type: "daily",
    start_date: new Date().toISOString().split("T")[0],
    onboard_date: new Date().toISOString().split("T")[0],
    advance_amount: "",
  };

  // Form State
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    mobile: "",
    email: "",
    location: "",
    building: "",
    flat_no: "",
    vehicles: [vehicleTemplate], // Start with one vehicle
  });

  // 1. Load Initial Data
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
          setAllBuildings(buildRes.data || []);
          const validWorkers = (workRes.data || []).filter(
            (w) => !w.role || w.role === "worker" || w.role === "supervisor"
          );
          setAllWorkers(validWorkers);
        } catch (error) {
          console.error("Failed to load options", error);
          toast.error("Failed to load dropdown data");
        }
      };
      loadDependencies();
      populateForm();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, customer]);

  // 2. Filter Buildings when Location Changes
  useEffect(() => {
    if (formData.location && allBuildings.length > 0) {
      const filtered = allBuildings.filter((b) => {
        const rawLoc = b.location || b.location_id;
        const bLocId =
          rawLoc && typeof rawLoc === "object" ? rawLoc._id : rawLoc;
        return String(bLocId) === String(formData.location);
      });
      setFilteredBuildings(filtered);
    } else {
      setFilteredBuildings([]);
    }
  }, [formData.location, allBuildings]);

  // 3. Filter Workers when Building Changes
  useEffect(() => {
    if (formData.building && allWorkers.length > 0) {
      const relevantWorkers = allWorkers.filter((worker) => {
        return worker.buildings?.some((b) => {
          const bId = typeof b === "object" ? b._id : b;
          return String(bId) === String(formData.building);
        });
      });
      setFilteredWorkers(relevantWorkers);
    } else {
      setFilteredWorkers([]);
    }
  }, [formData.building, allWorkers]);

  // 4. Populate Form
  const populateForm = () => {
    if (customer) {
      const locId = customer.location?._id || customer.location || "";
      const buildId = customer.building?._id || customer.building || "";

      // Ensure at least one vehicle exists
      const vehicles =
        customer.vehicles && customer.vehicles.length > 0
          ? customer.vehicles.map((v) => ({
              _id: v._id,
              registration_no: v.registration_no || "",
              parking_no: v.parking_no || "",
              vehicle_type: v.vehicle_type || "sedan",
              amount: v.amount || "",
              worker: v.worker?._id || v.worker || "",
              schedule_type: v.schedule_type || "daily",
              start_date: v.start_date
                ? new Date(v.start_date).toISOString().split("T")[0]
                : "",
              onboard_date: v.onboard_date
                ? new Date(v.onboard_date).toISOString().split("T")[0]
                : "",
              advance_amount: v.advance_amount || "",
            }))
          : [vehicleTemplate];

      setFormData({
        firstName: customer.firstName || "",
        lastName: customer.lastName || "",
        mobile: customer.mobile || "",
        email: customer.email || "",
        location: locId,
        building: buildId,
        flat_no: customer.flat_no || "",
        vehicles: vehicles,
      });
    } else {
      setFormData({
        firstName: "",
        lastName: "",
        mobile: "",
        email: "",
        location: "",
        building: "",
        flat_no: "",
        vehicles: [vehicleTemplate],
      });
    }
  };

  // --- Handlers ---

  const handleBasicChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      // If location changes, clear building
      if (name === "location") {
        return { ...prev, [name]: value, building: "" };
      }
      return { ...prev, [name]: value };
    });
  };

  // Handle changes for a specific vehicle index
  const handleVehicleChange = (index, e) => {
    const { name, value } = e.target;
    const updatedVehicles = [...formData.vehicles];
    updatedVehicles[index] = { ...updatedVehicles[index], [name]: value };
    setFormData({ ...formData, vehicles: updatedVehicles });
  };

  const handleAddVehicle = () => {
    setFormData({
      ...formData,
      vehicles: [...formData.vehicles, vehicleTemplate],
    });
  };

  const handleRemoveVehicle = (index) => {
    const updatedVehicles = formData.vehicles.filter((_, i) => i !== index);
    setFormData({ ...formData, vehicles: updatedVehicles });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (customer) {
        await customerService.update(customer._id, formData);
        toast.success("Customer updated successfully");
      } else {
        await customerService.create(formData);
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
    "block text-[11px] font-bold text-slate-500 uppercase mb-1.5 tracking-wide";
  const inputClass =
    "w-full text-sm font-semibold text-slate-700 outline-none bg-transparent placeholder:text-slate-400";
  const wrapperClass =
    "flex items-center bg-white border border-slate-200 rounded-lg px-3 py-2.5 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all shadow-sm";

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          />

          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl relative z-10 flex flex-col max-h-[95vh] overflow-hidden border border-slate-100"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-20">
              <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                {customer ? (
                  <User className="w-5 h-5 text-indigo-600" />
                ) : (
                  <UserPlus className="w-5 h-5 text-indigo-600" />
                )}
                {customer ? "Edit Customer" : "Create Customer"}
              </h3>
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Form */}
            <form
              onSubmit={handleSubmit}
              className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50"
            >
              {/* --- 1. Personal Details --- */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2 pb-2 border-b border-slate-100">
                  <User className="w-4 h-4 text-blue-500" /> Personal Details
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                  <div>
                    <label className={labelClass}>First Name</label>
                    <div className={wrapperClass}>
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
                  <div>
                    <label className={labelClass}>Email</label>
                    <div className={wrapperClass}>
                      <Mail className="w-4 h-4 text-slate-400 mr-2" />
                      <input
                        name="email"
                        value={formData.email}
                        onChange={handleBasicChange}
                        className={inputClass}
                        placeholder="john@example.com"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* --- 2. Address --- */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2 pb-2 border-b border-slate-100">
                  <MapPin className="w-4 h-4 text-purple-500" /> Address
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div>
                    <label className={labelClass}>Location</label>
                    <div className={wrapperClass}>
                      <select
                        name="location"
                        value={formData.location}
                        onChange={handleBasicChange}
                        className={`${inputClass} cursor-pointer`}
                      >
                        <option value="">Select Location</option>
                        {locations.map((l) => (
                          <option key={l._id} value={l._id}>
                            {l.name || l.address}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Building</label>
                    <div
                      className={`${wrapperClass} ${
                        !formData.location ? "opacity-50" : ""
                      }`}
                    >
                      <select
                        name="building"
                        value={formData.building}
                        onChange={handleBasicChange}
                        className={`${inputClass} cursor-pointer`}
                        disabled={!formData.location}
                      >
                        <option value="">Select Building</option>
                        {filteredBuildings.map((b) => (
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

              {/* --- 3. Vehicles (Dynamic Array) --- */}
              {formData.vehicles.map((vehicle, index) => (
                <div
                  key={index}
                  className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative"
                >
                  <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100">
                    <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                      <Car className="w-4 h-4 text-indigo-600" /> Vehicle{" "}
                      {index + 1}
                    </h4>
                    {index > 0 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveVehicle(index)}
                        className="text-red-500 hover:text-red-700 text-xs font-bold flex items-center gap-1 bg-red-50 px-2 py-1 rounded-md"
                      >
                        <Trash2 className="w-3 h-3" /> Remove
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                    {/* Row 1 */}
                    <div>
                      <label className={labelClass}>Registration No</label>
                      <div className={wrapperClass}>
                        <input
                          name="registration_no"
                          value={vehicle.registration_no}
                          onChange={(e) => handleVehicleChange(index, e)}
                          className={`${inputClass} uppercase`}
                          placeholder="DXB 12345"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className={labelClass}>Parking No</label>
                      <div className={wrapperClass}>
                        <input
                          name="parking_no"
                          value={vehicle.parking_no}
                          onChange={(e) => handleVehicleChange(index, e)}
                          className={inputClass}
                          placeholder="B1-20"
                        />
                      </div>
                    </div>
                    <div>
                      <label className={labelClass}>Type</label>
                      <div className={wrapperClass}>
                        <select
                          name="vehicle_type"
                          value={vehicle.vehicle_type}
                          onChange={(e) => handleVehicleChange(index, e)}
                          className={`${inputClass} cursor-pointer`}
                        >
                          <option value="sedan">Sedan</option>
                          <option value="suv">SUV / 4x4</option>
                          <option value="bike">Bike</option>
                          <option value="hatchback">Hatchback</option>
                          <option value="xuv">XUV</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className={labelClass}>Amount</label>
                      <div className={wrapperClass}>
                        <DollarSign className="w-4 h-4 text-emerald-500 mr-1" />
                        <input
                          type="number"
                          name="amount"
                          value={vehicle.amount}
                          onChange={(e) => handleVehicleChange(index, e)}
                          className={inputClass}
                          placeholder="0.00"
                        />
                      </div>
                    </div>

                    {/* Row 2 */}
                    <div>
                      <label className={labelClass}>Advance Amount</label>
                      <div className={wrapperClass}>
                        <DollarSign className="w-4 h-4 text-emerald-500 mr-1" />
                        <input
                          type="number"
                          name="advance_amount"
                          value={vehicle.advance_amount}
                          onChange={(e) => handleVehicleChange(index, e)}
                          className={inputClass}
                          placeholder="0.00"
                        />
                      </div>
                    </div>

                    <div>
                      <label className={labelClass}>Worker</label>
                      <div
                        className={`${wrapperClass} ${
                          !formData.building ? "opacity-50" : ""
                        }`}
                      >
                        <Briefcase className="w-4 h-4 text-slate-400 mr-2" />
                        <select
                          name="worker"
                          value={vehicle.worker}
                          onChange={(e) => handleVehicleChange(index, e)}
                          className={`${inputClass} cursor-pointer`}
                          disabled={!formData.building}
                        >
                          <option value="">
                            {formData.building
                              ? "Assign Worker"
                              : "Select Building First"}
                          </option>
                          {filteredWorkers.map((w) => (
                            <option key={w._id} value={w._id}>
                              {w.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className={labelClass}>Start Date</label>
                      <div className={wrapperClass}>
                        <input
                          type="date"
                          name="start_date"
                          value={vehicle.start_date}
                          onChange={(e) => handleVehicleChange(index, e)}
                          className={`${inputClass} cursor-pointer`}
                        />
                      </div>
                    </div>
                    <div>
                      <label className={labelClass}>Onboard Date</label>
                      <div className={wrapperClass}>
                        <input
                          type="date"
                          name="onboard_date"
                          value={vehicle.onboard_date}
                          onChange={(e) => handleVehicleChange(index, e)}
                          className={`${inputClass} cursor-pointer`}
                        />
                      </div>
                    </div>

                    {/* Row 3 - Full Width Schedule */}
                    <div className="md:col-span-4">
                      <label className={labelClass}>Schedule Type</label>
                      <div className={wrapperClass}>
                        <Clock className="w-4 h-4 text-slate-400 mr-2" />
                        <select
                          name="schedule_type"
                          value={vehicle.schedule_type}
                          onChange={(e) => handleVehicleChange(index, e)}
                          className={`${inputClass} cursor-pointer`}
                        >
                          <option value="daily">Daily</option>
                          <option value="weekly">Weekly</option>
                          <option value="onetime">One Time</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </form>

            {/* Footer */}
            <div className="p-4 bg-white border-t border-slate-100 flex justify-between items-center sticky bottom-0 z-20">
              <button
                type="button"
                onClick={handleAddVehicle}
                className="px-4 py-2.5 bg-white border border-slate-300 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-colors flex items-center gap-2 text-sm shadow-sm"
              >
                <Plus className="w-4 h-4" /> Add Vehicle
              </button>

              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="px-5 py-2.5 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="px-8 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all flex items-center gap-2 shadow-lg shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm active:scale-95"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Save Customer
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default CustomerModal;
