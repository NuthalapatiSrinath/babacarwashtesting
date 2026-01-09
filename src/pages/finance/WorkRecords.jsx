import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Download,
  ChevronDown,
  Loader2,
  FileSpreadsheet,
  Layers,
  Calendar,
  Filter,
} from "lucide-react";
import toast from "react-hot-toast";
import { downloadWorkRecordsStatement } from "../../redux/slices/workRecordsSlice";

const WorkRecords = () => {
  const dispatch = useDispatch();

  // Redux State
  const { downloading } = useSelector((state) => state.workRecords);

  // Default to Current Date
  const today = new Date();
  const [filters, setFilters] = useState({
    serviceType: "onewash", // Default
    month: today.getMonth() + 1, // Keep UI 1-12
    year: today.getFullYear(),
  });

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleDownload = async () => {
    const toastId = toast.loading(
      `Generating ${filters.serviceType} report...`
    );

    try {
      // 1. Dispatch Redux Thunk
      const result = await dispatch(
        downloadWorkRecordsStatement({
          serviceType: filters.serviceType,
          month: filters.month,
          year: filters.year,
        })
      ).unwrap();
      const blob = result.blob;

      // 2. Check if file is valid (sometimes empty blobs return on error)
      if (blob.size < 100) {
        console.warn("File size is very small, might be empty.");
      }

      // 3. Create Download Link
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement("a");
      link.href = url;
      // Filename: Statement_residence_2025_12.xlsx
      link.download = `Statement_${filters.serviceType}_${filters.year}_${filters.month}.xlsx`;
      document.body.appendChild(link);
      link.click();

      // Cleanup
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success("Download successful!", { id: toastId });
    } catch (error) {
      console.error("Download Error:", error);
      toast.error("Failed to download file. Check if data exists.", {
        id: toastId,
      });
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
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-lg shadow-indigo-200">
            <FileSpreadsheet className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-indigo-800 bg-clip-text text-transparent">
              Work Records
            </h1>
            <p className="text-slate-500 font-medium mt-1">
              Generate and download monthly work statements
            </p>
          </div>
        </div>
      </div>

      {/* --- FILTER CARD --- */}
      <div className="max-w-7xl mx-auto bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden relative">
        {/* Top Decorative Line */}
        <div className="h-1.5 w-full bg-gradient-to-r from-indigo-400 via-blue-500 to-cyan-500"></div>

        <div className="p-6 md:p-8">
          <div className="flex items-center gap-2 mb-6 text-slate-400 text-xs font-bold uppercase tracking-wider">
            <Filter className="w-4 h-4" /> Statement Parameters
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-end">
            {/* Service Type */}
            <div className="relative group">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block ml-1">
                Service Type
              </label>
              <div className="relative">
                <select
                  name="serviceType"
                  value={filters.serviceType}
                  onChange={handleFilterChange}
                  className="w-full h-12 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-medium rounded-xl pl-11 pr-8 appearance-none outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 transition-all cursor-pointer shadow-sm"
                >
                  <option value="onewash">Onewash</option>
                  <option value="residence">Residence</option>
                </select>
                <Layers className="absolute left-3.5 top-3.5 w-5 h-5 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                <ChevronDown className="absolute right-3 top-4 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Month */}
            <div className="relative group">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block ml-1">
                Month
              </label>
              <div className="relative">
                <select
                  name="month"
                  value={filters.month}
                  onChange={handleFilterChange}
                  className="w-full h-12 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-medium rounded-xl pl-11 pr-8 appearance-none outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 transition-all cursor-pointer shadow-sm"
                >
                  {months.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
                <Calendar className="absolute left-3.5 top-3.5 w-5 h-5 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                <ChevronDown className="absolute right-3 top-4 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Year */}
            <div className="relative group">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block ml-1">
                Year
              </label>
              <div className="relative">
                <select
                  name="year"
                  value={filters.year}
                  onChange={handleFilterChange}
                  className="w-full h-12 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-medium rounded-xl pl-11 pr-8 appearance-none outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 transition-all cursor-pointer shadow-sm"
                >
                  {years.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
                <Calendar className="absolute left-3.5 top-3.5 w-5 h-5 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                <ChevronDown className="absolute right-3 top-4 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Download Button */}
            <div>
              <button
                onClick={handleDownload}
                disabled={downloading}
                className="w-full h-12 bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl shadow-indigo-200 hover:shadow-indigo-200 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {downloading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Download className="w-5 h-5" />
                )}
                <span>{downloading ? "Processing..." : "Download Report"}</span>
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
        <h3 className="text-xl font-bold text-slate-700">Ready to Export</h3>
        <p className="text-slate-500 mt-2 max-w-sm">
          Select the service type, month, and year from the panel above to
          generate and download the work records statement.
        </p>
      </div>
    </div>
  );
};

export default WorkRecords;
