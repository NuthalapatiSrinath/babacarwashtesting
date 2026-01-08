import React, { useState, useEffect, useRef } from "react";
import {
  User,
  Phone,
  Lock,
  Building,
  ShoppingBag,
  Loader2,
  ChevronDown,
  Check,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import { useDispatch } from "react-redux";
import { createWorker, updateWorker } from "../../redux/slices/workerSlice";
import { fetchBuildings } from "../../redux/slices/buildingSlice";
import { fetchMalls } from "../../redux/slices/mallSlice";
import ModalManager from "./ModalManager";

const WorkerModal = ({ isOpen, onClose, onSuccess, editData }) => {
  const dispatch = useDispatch();
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
      console.log(
        "👷 [WORKER MODAL] Modal opened",
        editData ? "for editing" : "for creating"
      );
      const loadOptions = async () => {
        setFetchingData(true);
        try {
          console.log(
            "📦 [WORKER MODAL] Fetching buildings and malls via Redux"
          );
          const [bRes, mRes] = await Promise.all([
            dispatch(
              fetchBuildings({ page: 1, limit: 1000, search: "" })
            ).unwrap(),
            dispatch(fetchMalls({ page: 1, limit: 1000, search: "" })).unwrap(),
          ]);
          setAllBuildings(bRes.data || []);
          setAllMalls(mRes.data || []);
          console.log(
            "✅ [WORKER MODAL] Options loaded:",
            bRes.data?.length,
            "buildings,",
            mRes.data?.length,
            "malls"
          );
        } catch (error) {
          console.error("❌ [WORKER MODAL] Failed to load options:", error);
          toast.error("Failed to load options");
        } finally {
          setFetchingData(false);
        }
      };
      loadOptions();

      if (editData) {
        console.log("📝 [WORKER MODAL] Edit data:", editData);
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
          password: editData.password || "",
          confirmPassword: editData.password || "",
          serviceType: sType,
        });
        setSelectedBuildings(existingBuildings);
        setSelectedMalls(existingMalls);
      } else {
        console.log("➕ [WORKER MODAL] Creating new worker");
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
  }, [isOpen, editData, dispatch]);

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

    console.log("💾 [WORKER MODAL] Submitting form:", formData);

    // Validation
    if (!formData.name || !formData.mobile) {
      console.warn("⚠️ [WORKER MODAL] Validation failed: Name/Mobile required");
      toast.error("Name and Mobile are required");
      return;
    }
    if (!editData && !formData.password) {
      console.warn("⚠️ [WORKER MODAL] Validation failed: Password required");
      toast.error("Password is required");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      console.warn("⚠️ [WORKER MODAL] Validation failed: Password mismatch");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: formData.name,
        mobile: formData.mobile,
      };
      if (formData.password) payload.password = formData.password;

      // Handle Service Type Logic
      if (formData.serviceType === "mall") {
        if (selectedMalls.length === 0) {
          console.warn(
            "⚠️ [WORKER MODAL] Validation failed: No malls selected"
          );
          throw new Error("Please select at least one Mall");
        }
        payload.malls = selectedMalls.map((m) => m._id);
        payload.buildings = []; // Clear buildings
      } else {
        if (selectedBuildings.length === 0) {
          console.warn(
            "⚠️ [WORKER MODAL] Validation failed: No buildings selected"
          );
          throw new Error("Please select at least one Building");
        }
        payload.buildings = selectedBuildings.map((b) => b._id);
        payload.malls = []; // Clear malls
      }

      if (editData) {
        console.log(
          "✏️ [WORKER MODAL] Updating worker via Redux:",
          editData._id
        );
        await dispatch(
          updateWorker({ id: editData._id, data: payload })
        ).unwrap();
        toast.success("Worker Updated");
        console.log("✅ [WORKER MODAL] Worker updated successfully");
      } else {
        console.log("➕ [WORKER MODAL] Creating worker via Redux");
        await dispatch(createWorker(payload)).unwrap();
        toast.success("Worker Created");
        console.log("✅ [WORKER MODAL] Worker created successfully");
      }
      onSuccess();
      onClose();
    } catch (error) {
      console.error("❌ [WORKER MODAL] Submit error:", error);
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
    <ModalManager
      isOpen={isOpen}
      onClose={onClose}
      title={editData ? "Edit Worker" : "Add New Worker"}
      pageName="WORKERS"
      modalType={editData ? "EDIT" : "CREATE"}
      size="lg"
    >
      {/* Form */}
      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Mobile <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Phone className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              value={formData.mobile}
              onChange={(e) =>
                setFormData({ ...formData, mobile: e.target.value })
              }
              className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-sm"
              placeholder="9876543210"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Name <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <User className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-sm"
              placeholder="Enter full name"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Password {!editData && <span className="text-red-500">*</span>}
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-sm"
              placeholder="Enter password"
            />
          </div>
        </div>

        <div>
          <label
            className={`block text-sm font-medium mb-2 ${
              isPasswordMismatch ? "text-red-500" : "text-slate-700"
            }`}
          >
            Confirm Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              value={formData.confirmPassword}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  confirmPassword: e.target.value,
                })
              }
              className={`w-full pl-10 pr-4 py-2.5 border rounded-lg outline-none transition-all text-sm ${
                isPasswordMismatch
                  ? "border-red-500 focus:ring-2 focus:ring-red-100"
                  : "border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              }`}
              placeholder="Re-enter password"
            />
          </div>
          {isPasswordMismatch && (
            <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
          )}
        </div>

        <hr className="border-dashed border-slate-200" />

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Service Type
          </label>
          <div className="relative">
            <select
              value={formData.serviceType}
              onChange={(e) =>
                setFormData({ ...formData, serviceType: e.target.value })
              }
              className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none appearance-none bg-slate-50 text-sm font-medium text-slate-700"
            >
              <option value="residence">Residence</option>
              <option value="mall">Mall</option>
            </select>
            <ChevronDown className="absolute right-4 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* --- MALL MULTI-SELECT --- */}
        {formData.serviceType === "mall" && (
          <div ref={mallDropdownRef}>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Assign Malls
            </label>
            <div
              onClick={() => setIsMallDropdownOpen(true)}
              className="w-full min-h-[50px] px-2 py-2 rounded-lg border border-slate-300 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent bg-white flex flex-wrap gap-2 items-center cursor-text"
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
                      removeSelection(m._id, selectedMalls, setSelectedMalls);
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
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Assign Buildings
            </label>
            <div
              onClick={() => setIsBuildingDropdownOpen(true)}
              className="w-full min-h-[50px] px-2 py-2 rounded-lg border border-slate-300 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent bg-white flex flex-wrap gap-2 items-center cursor-text"
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
                  selectedBuildings.length === 0 ? "Search buildings..." : ""
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
                        <Building className="w-4 h-4 text-gray-400" /> {b.name}
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

        {/* Footer Buttons */}
        <div className="flex justify-end pt-4 gap-3 border-t border-slate-100 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || isPasswordMismatch}
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-all shadow-lg shadow-indigo-600/20 flex items-center gap-2 disabled:opacity-70"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {editData ? "Save Changes" : "Create Worker"}
          </button>
        </div>
      </form>
    </ModalManager>
  );
};

export default WorkerModal;
