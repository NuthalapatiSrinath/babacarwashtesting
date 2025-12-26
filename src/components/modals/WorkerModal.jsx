import React, { useState, useEffect, useRef } from "react";
import {
  X,
  User,
  Phone,
  Lock,
  Building,
  ShoppingBag,
  Loader2,
  ChevronDown,
  Check,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { workerService } from "../../api/workerService";
import { buildingService } from "../../api/buildingService";
import { mallService } from "../../api/mallService";

const WorkerModal = ({ isOpen, onClose, onSuccess, editData }) => {
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(false);

  // Data Options
  const [allBuildings, setAllBuildings] = useState([]);
  const [allMalls, setAllMalls] = useState([]);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    mobile: "", // Changed from 'number' to 'mobile' to match backend
    password: "",
    confirmPassword: "",
    serviceType: "residence", // 'residence' or 'mall'
  });

  // Multi-Select States
  const [selectedBuildings, setSelectedBuildings] = useState([]);
  const [selectedMalls, setSelectedMalls] = useState([]);

  // Dropdown UI States
  const [buildingSearch, setBuildingSearch] = useState("");
  const [isBuildingDropdownOpen, setIsBuildingDropdownOpen] = useState(false);
  const buildingDropdownRef = useRef(null);

  const [mallSearch, setMallSearch] = useState("");
  const [isMallDropdownOpen, setIsMallDropdownOpen] = useState(false);
  const mallDropdownRef = useRef(null);

  // --- 1. Load Data ---
  useEffect(() => {
    if (isOpen) {
      const loadOptions = async () => {
        setFetchingData(true);
        try {
          const [bRes, mRes] = await Promise.all([
            buildingService.list(1, 1000),
            mallService.list(1, 1000),
          ]);
          setAllBuildings(bRes.data || []);
          setAllMalls(mRes.data || []);
        } catch (error) {
          toast.error("Failed to load options");
        } finally {
          setFetchingData(false);
        }
      };
      loadOptions();

      if (editData) {
        // Populate for Edit
        // Determine service type based on assignments.
        // If assigned to malls, default to mall view. Else residence.
        const sType =
          editData.malls && editData.malls.length > 0 ? "mall" : "residence";

        // Populate Buildings
        const existingBuildings = Array.isArray(editData.buildings)
          ? editData.buildings.map((b) =>
              typeof b === "object" ? b : { _id: b, name: "Loading..." }
            )
          : [];

        // Populate Malls
        const existingMalls = Array.isArray(editData.malls)
          ? editData.malls.map((m) =>
              typeof m === "object" ? m : { _id: m, name: "Loading..." }
            )
          : [];

        setFormData({
          name: editData.name || "",
          mobile: editData.mobile || "",
          password: "",
          confirmPassword: "",
          serviceType: sType,
        });
        setSelectedBuildings(existingBuildings);
        setSelectedMalls(existingMalls);
      } else {
        // Reset for New
        setFormData({
          name: "",
          mobile: "",
          password: "",
          confirmPassword: "",
          serviceType: "residence",
        });
        setSelectedBuildings([]);
        setSelectedMalls([]);
      }
    }
  }, [isOpen, editData]);

  // --- 2. Multi-Select Logic (Generic) ---
  const toggleSelection = (item, list, setList, searchSetter) => {
    const exists = list.find((i) => i._id === item._id);
    if (exists) {
      setList(list.filter((i) => i._id !== item._id));
    } else {
      setList([...list, item]);
    }
    searchSetter("");
  };

  const removeSelection = (id, list, setList) => {
    setList(list.filter((i) => i._id !== id));
  };

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        buildingDropdownRef.current &&
        !buildingDropdownRef.current.contains(event.target)
      ) {
        setIsBuildingDropdownOpen(false);
      }
      if (
        mallDropdownRef.current &&
        !mallDropdownRef.current.contains(event.target)
      ) {
        setIsMallDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredBuildings = allBuildings.filter((b) =>
    b.name.toLowerCase().includes(buildingSearch.toLowerCase())
  );
  const filteredMalls = allMalls.filter((m) =>
    m.name.toLowerCase().includes(mallSearch.toLowerCase())
  );

  // --- 3. Submit ---
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.name || !formData.mobile) {
      toast.error("Name and Mobile are required");
      return;
    }
    if (!editData && !formData.password) {
      toast.error("Password is required");
      return;
    }
    if (formData.password !== formData.confirmPassword) return;

    setLoading(true);
    try {
      const payload = {
        name: formData.name,
        mobile: formData.mobile,
      };
      if (formData.password) payload.password = formData.password;

      // Handle Service Type Logic
      if (formData.serviceType === "mall") {
        if (selectedMalls.length === 0)
          throw new Error("Please select at least one Mall");
        payload.malls = selectedMalls.map((m) => m._id);
        payload.buildings = []; // Clear buildings
      } else {
        if (selectedBuildings.length === 0)
          throw new Error("Please select at least one Building");
        payload.buildings = selectedBuildings.map((b) => b._id);
        payload.malls = []; // Clear malls
      }

      if (editData) {
        await workerService.update(editData._id, payload);
        toast.success("Worker Updated");
      } else {
        await workerService.create(payload);
        toast.success("Worker Created");
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

  const isPasswordMismatch =
    formData.password &&
    formData.confirmPassword &&
    formData.password !== formData.confirmPassword;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/50"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="bg-white w-full max-w-xl rounded-lg shadow-2xl overflow-hidden relative z-10 flex flex-col max-h-[90vh]"
        >
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-xl font-bold text-gray-800">
              {editData ? "Edit Worker" : "Create Worker"}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 overflow-y-auto custom-scrollbar">
            <form id="workerForm" onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1 ml-1">
                  Mobile
                </label>
                <input
                  type="text"
                  value={formData.mobile}
                  onChange={(e) =>
                    setFormData({ ...formData, mobile: e.target.value })
                  }
                  className="w-full px-4 py-3 rounded-md border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-sm"
                  placeholder="9876543210"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1 ml-1">
                  Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-4 py-3 rounded-md border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-sm"
                  placeholder="Enter full name"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1 ml-1">
                  Password
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="w-full px-4 py-3 rounded-md border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-sm"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label
                  className={`block text-xs font-medium mb-1 ml-1 ${
                    isPasswordMismatch ? "text-red-500" : "text-gray-500"
                  }`}
                >
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      confirmPassword: e.target.value,
                    })
                  }
                  className={`w-full px-4 py-3 rounded-md border outline-none transition-all text-sm ${
                    isPasswordMismatch
                      ? "border-red-500 focus:ring-2 focus:ring-red-100"
                      : "border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  }`}
                  placeholder="••••••••"
                />
                {isPasswordMismatch && (
                  <p className="text-xs text-red-500 mt-1">
                    Passwords do not match
                  </p>
                )}
              </div>

              <hr className="border-dashed border-gray-200" />

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1 ml-1">
                  Service Type
                </label>
                <div className="relative">
                  <select
                    value={formData.serviceType}
                    onChange={(e) =>
                      setFormData({ ...formData, serviceType: e.target.value })
                    }
                    className="w-full px-4 py-3 rounded-md border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none appearance-none bg-gray-50 text-sm font-medium text-gray-700"
                  >
                    <option value="residence">Residence</option>
                    <option value="mall">Mall</option>
                  </select>
                  <ChevronDown className="absolute right-4 top-3.5 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* --- MALL MULTI-SELECT --- */}
              {formData.serviceType === "mall" && (
                <div ref={mallDropdownRef}>
                  <label className="block text-xs font-medium text-gray-500 mb-1 ml-1">
                    Assign Malls
                  </label>
                  <div
                    onClick={() => setIsMallDropdownOpen(true)}
                    className="w-full min-h-[50px] px-2 py-2 rounded-md border border-gray-300 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 bg-white flex flex-wrap gap-2 items-center cursor-text"
                  >
                    {selectedMalls.map((m) => (
                      <span
                        key={m._id}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-gray-200 text-gray-700"
                      >
                        {m.name}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeSelection(
                              m._id,
                              selectedMalls,
                              setSelectedMalls
                            );
                          }}
                          className="hover:bg-gray-300 rounded-full p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                    <input
                      type="text"
                      className="flex-1 min-w-[120px] outline-none text-sm bg-transparent h-full ml-1"
                      placeholder={
                        selectedMalls.length === 0 ? "Search malls..." : ""
                      }
                      value={mallSearch}
                      onChange={(e) => {
                        setMallSearch(e.target.value);
                        setIsMallDropdownOpen(true);
                      }}
                    />
                  </div>
                  {isMallDropdownOpen && (
                    <div className="absolute w-[calc(100%-3rem)] mt-1 bg-white border border-gray-200 rounded-md shadow-xl max-h-48 overflow-y-auto z-50">
                      {filteredMalls.map((m) => {
                        const isSelected = selectedMalls.find(
                          (sm) => sm._id === m._id
                        );
                        return (
                          <div
                            key={m._id}
                            onClick={() =>
                              toggleSelection(
                                m,
                                selectedMalls,
                                setSelectedMalls,
                                setMallSearch
                              )
                            }
                            className={`px-4 py-2.5 text-sm cursor-pointer flex items-center justify-between hover:bg-blue-50 ${
                              isSelected
                                ? "bg-blue-50 text-blue-600"
                                : "text-gray-700"
                            }`}
                          >
                            <span className="flex items-center gap-2">
                              <ShoppingBag className="w-4 h-4 text-gray-400" />{" "}
                              {m.name}
                            </span>
                            {isSelected && (
                              <Check className="w-4 h-4 text-blue-600" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* --- BUILDING MULTI-SELECT --- */}
              {formData.serviceType === "residence" && (
                <div ref={buildingDropdownRef}>
                  <label className="block text-xs font-medium text-gray-500 mb-1 ml-1">
                    Assign Buildings
                  </label>
                  <div
                    onClick={() => setIsBuildingDropdownOpen(true)}
                    className="w-full min-h-[50px] px-2 py-2 rounded-md border border-gray-300 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 bg-white flex flex-wrap gap-2 items-center cursor-text"
                  >
                    {selectedBuildings.map((b) => (
                      <span
                        key={b._id}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-gray-200 text-gray-700"
                      >
                        {b.name}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeSelection(
                              b._id,
                              selectedBuildings,
                              setSelectedBuildings
                            );
                          }}
                          className="hover:bg-gray-300 rounded-full p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                    <input
                      type="text"
                      className="flex-1 min-w-[120px] outline-none text-sm bg-transparent h-full ml-1"
                      placeholder={
                        selectedBuildings.length === 0
                          ? "Search buildings..."
                          : ""
                      }
                      value={buildingSearch}
                      onChange={(e) => {
                        setBuildingSearch(e.target.value);
                        setIsBuildingDropdownOpen(true);
                      }}
                    />
                  </div>
                  {isBuildingDropdownOpen && (
                    <div className="absolute w-[calc(100%-3rem)] mt-1 bg-white border border-gray-200 rounded-md shadow-xl max-h-48 overflow-y-auto z-50">
                      {filteredBuildings.map((b) => {
                        const isSelected = selectedBuildings.find(
                          (sb) => sb._id === b._id
                        );
                        return (
                          <div
                            key={b._id}
                            onClick={() =>
                              toggleSelection(
                                b,
                                selectedBuildings,
                                setSelectedBuildings,
                                setBuildingSearch
                              )
                            }
                            className={`px-4 py-2.5 text-sm cursor-pointer flex items-center justify-between hover:bg-blue-50 ${
                              isSelected
                                ? "bg-blue-50 text-blue-600"
                                : "text-gray-700"
                            }`}
                          >
                            <span className="flex items-center gap-2">
                              <Building className="w-4 h-4 text-gray-400" />{" "}
                              {b.name}
                            </span>
                            {isSelected && (
                              <Check className="w-4 h-4 text-blue-600" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </form>
          </div>

          <div className="p-5 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-md border border-gray-300 bg-white text-gray-700 text-sm font-medium hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="workerForm"
              disabled={loading || isPasswordMismatch}
              className="px-6 py-2.5 rounded-md bg-[#009ef7] hover:bg-[#0095e8] text-white text-sm font-bold shadow-sm flex items-center gap-2 transition-all disabled:opacity-60"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />} Submit
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default WorkerModal;
