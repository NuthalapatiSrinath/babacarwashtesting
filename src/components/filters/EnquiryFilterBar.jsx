import React, { useState, useEffect, useRef } from "react";
import {
  Search,
  Calendar,
  User,
  Tag,
  Loader2,
  RotateCcw,
  Filter,
  ChevronDown,
} from "lucide-react";
import toast from "react-hot-toast";

// API
import { workerService } from "../../api/workerService";

const EnquiryFilterBar = ({ onFilterApply, loading }) => {
  const [workers, setWorkers] = useState([]);
  const [workersLoading, setWorkersLoading] = useState(true);

  // Refs for programmatic date opening
  const startDateRef = useRef(null);
  const endDateRef = useRef(null);

  // Filter States
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedWorker, setSelectedWorker] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");

  // --- Fetch All Workers ---
  useEffect(() => {
    const fetchWorkers = async () => {
      try {
        const response = await workerService.list(1, 1000); // Fetch all
        const workerList = response.data || [];
        setWorkers(workerList);
      } catch (error) {
        console.error("Failed to load workers", error);
        toast.error("Could not load worker list");
      } finally {
        setWorkersLoading(false);
      }
    };
    fetchWorkers();
  }, []);

  // --- Handlers ---
  const handleApply = () => {
    onFilterApply({
      startDate: startDate || null,
      endDate: endDate || null,
      worker: selectedWorker || null,
      status: selectedStatus || null,
    });
  };

  const handleReset = () => {
    setStartDate("");
    setEndDate("");
    setSelectedWorker("");
    setSelectedStatus("");
    onFilterApply({});
  };

  // --- Helper to open calendar on container click ---
  const openCalendar = (ref) => {
    if (ref.current) {
      try {
        ref.current.showPicker(); // Modern browser API
      } catch (e) {
        ref.current.focus(); // Fallback
      }
    }
  };

  // --- CSS Class Constants ---
  const containerClass =
    "bg-white p-5 rounded-2xl border border-slate-200 shadow-sm mb-6 transition-all hover:shadow-md";
  const headerClass =
    "flex items-center gap-2 mb-5 pb-3 border-b border-slate-100";
  const labelClass =
    "text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1";

  // Advanced Input Wrapper: Neumorphic feel with focus rings
  const inputWrapperClass =
    "group relative flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 transition-all duration-200 hover:bg-white hover:border-indigo-300 focus-within:bg-white focus-within:ring-4 focus-within:ring-indigo-500/10 focus-within:border-indigo-500 cursor-pointer";

  // Icon styling
  const iconClass =
    "w-4 h-4 text-slate-400 group-hover:text-indigo-500 group-focus-within:text-indigo-600 transition-colors mr-3";

  // The actual input field (clean, transparent, full width)
  const fieldClass =
    "w-full bg-transparent text-sm font-medium text-slate-700 placeholder:text-slate-400 outline-none cursor-pointer";

  return (
    <div className={containerClass}>
      {/* Header Section */}
      <div className={headerClass}>
        <div className="p-1.5 bg-indigo-50 rounded-lg text-indigo-600">
          <Filter className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-800">Filter Enquiries</h3>
          <p className="text-xs text-slate-400 font-medium">
            Refine your search results
          </p>
        </div>
      </div>

      {/* Grid Layout: Stacks on mobile, 4 columns on large screens */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 items-end">
        {/* 1. Date Range (Merged Visual Group) */}
        <div className="sm:col-span-2 lg:col-span-1 flex gap-2">
          {/* From Date */}
          <div className="flex-1 min-w-0">
            <label className={labelClass}>From</label>
            <div
              className={inputWrapperClass}
              onClick={() => openCalendar(startDateRef)}
            >
              <Calendar className={iconClass} />
              <input
                ref={startDateRef}
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={`${fieldClass} appearance-none`}
                // Inline style to hide default calendar icon so we use our Lucide icon
                style={{ colorScheme: "light" }}
              />
            </div>
          </div>

          {/* To Date */}
          <div className="flex-1 min-w-0">
            <label className={labelClass}>To</label>
            <div
              className={inputWrapperClass}
              onClick={() => openCalendar(endDateRef)}
            >
              <Calendar className={iconClass} />
              <input
                ref={endDateRef}
                type="date"
                value={endDate}
                min={startDate}
                onChange={(e) => setEndDate(e.target.value)}
                className={`${fieldClass} appearance-none`}
                style={{ colorScheme: "light" }}
              />
            </div>
          </div>
        </div>

        {/* 2. Worker Select */}
        <div className="min-w-0">
          <label className={labelClass}>Worker</label>
          <div className={inputWrapperClass}>
            {workersLoading ? (
              <Loader2 className="w-4 h-4 text-indigo-500 animate-spin mr-3" />
            ) : (
              <User className={iconClass} />
            )}
            <select
              value={selectedWorker}
              onChange={(e) => setSelectedWorker(e.target.value)}
              disabled={workersLoading}
              className={`${fieldClass} appearance-none`}
            >
              <option value="">All Workers</option>
              {workers.map((w) => (
                <option key={w._id} value={w._id}>
                  {w.name}
                </option>
              ))}
            </select>
            {/* Custom Dropdown Arrow */}
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 pointer-events-none group-hover:text-slate-600" />
          </div>
        </div>

        {/* 3. Status Select */}
        <div className="min-w-0">
          <label className={labelClass}>Status</label>
          <div className={inputWrapperClass}>
            <Tag className={iconClass} />
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className={`${fieldClass} appearance-none`}
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 pointer-events-none group-hover:text-slate-600" />
          </div>
        </div>

        {/* 4. Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleReset}
            className="px-4 py-2.5 h-[46px] rounded-xl border border-slate-200 text-slate-500 font-semibold text-sm hover:bg-slate-50 hover:text-slate-700 hover:border-slate-300 transition-all active:scale-95 flex items-center justify-center gap-2"
            title="Reset Filters"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={handleApply}
            disabled={loading}
            className="flex-1 px-6 py-2.5 h-[46px] bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all active:scale-95 disabled:opacity-70 disabled:shadow-none flex items-center justify-center gap-2"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
};

export default EnquiryFilterBar;
