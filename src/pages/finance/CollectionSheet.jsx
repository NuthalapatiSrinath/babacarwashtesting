import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Download,
  Layers,
  Calendar,
  ChevronDown,
  FileSpreadsheet,
  Building,
  User,
  Loader2,
  Filter,
} from "lucide-react";
import toast from "react-hot-toast";

// Redux
import { fetchBuildings } from "../../redux/slices/buildingSlice";
import { fetchWorkers } from "../../redux/slices/workerSlice";
import { downloadCollectionSheet } from "../../redux/slices/collectionSheetSlice";

const CollectionSheet = () => {
  const dispatch = useDispatch();

  // Redux State
  const { buildings, loading: buildingsLoading } = useSelector(
    (state) => state.building
  );
  const { workers, loading: workersLoading } = useSelector(
    (state) => state.worker
  );
  const { downloading } = useSelector((state) => state.collectionSheet);

  // Filters
  const today = new Date();
  const [filters, setFilters] = useState({
    serviceType: "residence", // Default per screenshot
    building: "all",
    worker: "all",
    month: today.getMonth() + 1, // UI uses 1-12
    year: today.getFullYear(),
  });

  // Load Dropdown Data on Mount
  useEffect(() => {
    dispatch(fetchBuildings({ page: 1, limit: 1000 }));
    dispatch(fetchWorkers({ page: 1, limit: 1000, status: 1 }));
  }, [dispatch]);

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleDownload = async () => {
    const toastId = toast.loading("Generating Collection Sheet...");

    try {
      const result = await dispatch(downloadCollectionSheet(filters)).unwrap();
      const blob = result.blob;

      // Check for empty file
      if (blob.size < 100) {
        toast.error("File appears empty. Check if data exists.", {
          id: toastId,
        });
      }

      // Download Logic
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement("a");
      link.href = url;
      // Filename: Collection_Residence_Dec_2025.xlsx
      link.download = `Collection_${filters.serviceType}_${filters.month}_${filters.year}.xlsx`;
      document.body.appendChild(link);
      link.click();

      // Cleanup
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success("Download successful!", { id: toastId });
    } catch (error) {
      console.error("Download Error:", error);
      toast.error("Failed to download sheet.", { id: toastId });
    }
  };

  // --- STATIC OPTIONS ---
  const months = [
    { value: 1, label: "January" },
    { value: 2, label: "February" },
    { value: 3, label: "March" },
    { value: 4, label: "April" },
    { value: 5, label: "May" },
    { value: 6, label: "June" },
    { value: 7, label: "July" },
    { value: 8, label: "August" },
    { value: 9, label: "September" },
    { value: 10, label: "October" },
    { value: 11, label: "November" },
    { value: 12, label: "December" },
  ];

  const years = [2024, 2025, 2026, 2027];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6 font-sans">
      {/* --- HEADER --- */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-200">
            <FileSpreadsheet className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-emerald-800 bg-clip-text text-transparent">
              Collection Sheet
            </h1>
            <p className="text-slate-500 font-medium mt-1">
              Generate and download monthly financial reports
            </p>
          </div>
        </div>
      </div>

      {/* --- FILTER CARD --- */}
      <div className="max-w-7xl mx-auto bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden relative">
        {/* Top Decorative Line */}
        <div className="h-1.5 w-full bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-500"></div>

        <div className="p-6 md:p-8">
          <div className="flex items-center gap-2 mb-6 text-slate-400 text-xs font-bold uppercase tracking-wider">
            <Filter className="w-4 h-4" /> Report Parameters
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 items-end">
            {/* 1. Service Type */}
            <div className="relative group md:col-span-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block ml-1">
                Service Type
              </label>
              <div className="relative">
                <select
                  name="serviceType"
                  value={filters.serviceType}
                  onChange={handleFilterChange}
                  className="w-full h-12 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-medium rounded-xl pl-11 pr-8 appearance-none outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50 transition-all cursor-pointer shadow-sm"
                >
                  <option value="residence">Residence</option>
                  <option value="onewash">One Wash</option>
                </select>
                <Layers className="absolute left-3.5 top-3.5 w-5 h-5 text-slate-400 group-hover:text-emerald-500 transition-colors" />
                <ChevronDown className="absolute right-3 top-4 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* 2. Select Buildings */}
            <div className="relative group md:col-span-1 xl:col-span-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block ml-1">
                Building
              </label>
              <div className="relative">
                <select
                  name="building"
                  value={filters.building}
                  onChange={handleFilterChange}
                  className="w-full h-12 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-medium rounded-xl pl-11 pr-8 appearance-none outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50 transition-all cursor-pointer shadow-sm"
                >
                  <option value="all">All Buildings</option>
                  {buildings.map((b) => (
                    <option key={b._id} value={b._id}>
                      {b.name}
                    </option>
                  ))}
                </select>
                <Building className="absolute left-3.5 top-3.5 w-5 h-5 text-slate-400 group-hover:text-emerald-500 transition-colors" />
                <ChevronDown className="absolute right-3 top-4 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* 3. Select Workers */}
            <div className="relative group md:col-span-1 xl:col-span-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block ml-1">
                Worker
              </label>
              <div className="relative">
                <select
                  name="worker"
                  value={filters.worker}
                  onChange={handleFilterChange}
                  className="w-full h-12 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-medium rounded-xl pl-11 pr-8 appearance-none outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50 transition-all cursor-pointer shadow-sm"
                >
                  <option value="all">All Workers</option>
                  {workers.map((w) => (
                    <option key={w._id} value={w._id}>
                      {w.name}
                    </option>
                  ))}
                </select>
                <User className="absolute left-3.5 top-3.5 w-5 h-5 text-slate-400 group-hover:text-emerald-500 transition-colors" />
                <ChevronDown className="absolute right-3 top-4 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* 4. Select Month */}
            <div className="relative group md:col-span-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block ml-1">
                Month
              </label>
              <div className="relative">
                <select
                  name="month"
                  value={filters.month}
                  onChange={handleFilterChange}
                  className="w-full h-12 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-medium rounded-xl pl-11 pr-8 appearance-none outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50 transition-all cursor-pointer shadow-sm"
                >
                  {months.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
                <Calendar className="absolute left-3.5 top-3.5 w-5 h-5 text-slate-400 group-hover:text-emerald-500 transition-colors" />
                <ChevronDown className="absolute right-3 top-4 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* 5. Select Year */}
            <div className="relative group md:col-span-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block ml-1">
                Year
              </label>
              <div className="relative">
                <select
                  name="year"
                  value={filters.year}
                  onChange={handleFilterChange}
                  className="w-full h-12 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-medium rounded-xl pl-11 pr-8 appearance-none outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50 transition-all cursor-pointer shadow-sm"
                >
                  {years.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
                <Calendar className="absolute left-3.5 top-3.5 w-5 h-5 text-slate-400 group-hover:text-emerald-500 transition-colors" />
                <ChevronDown className="absolute right-3 top-4 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* 6. Download Button */}
            <div className="md:col-span-1">
              <button
                onClick={handleDownload}
                disabled={downloading}
                className="w-full h-12 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl shadow-emerald-200 hover:shadow-emerald-200 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {downloading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Download className="w-5 h-5" />
                )}
                <span>{downloading ? "Processing..." : "Download"}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* --- EMPTY STATE ILLUSTRATION --- */}
      <div className="max-w-7xl mx-auto mt-16 flex flex-col items-center justify-center text-center opacity-70">
        <div className="w-32 h-32 rounded-full bg-white border-4 border-slate-100 flex items-center justify-center mb-6 shadow-sm">
          <div className="w-24 h-24 rounded-full bg-slate-50 flex items-center justify-center">
            <FileSpreadsheet className="w-10 h-10 text-slate-300" />
          </div>
        </div>
        <h3 className="text-xl font-bold text-slate-700">
          Ready to Generate Report
        </h3>
        <p className="text-slate-500 mt-2 max-w-sm">
          Select your desired parameters from the filters above and click the
          download button to generate the collection sheet Excel file.
        </p>
      </div>
    </div>
  );
};

export default CollectionSheet;
