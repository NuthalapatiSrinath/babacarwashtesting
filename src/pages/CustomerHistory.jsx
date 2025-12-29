import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Download,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import toast from "react-hot-toast";

// Components
import DataTable from "../components/DataTable";
import RichDateRangePicker from "../components/inputs/RichDateRangePicker";

// API
import { customerService } from "../api/customerService";

const CustomerHistory = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);

  // Date Filters
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

  // --- Fetch Data ---
  const fetchData = async (page = 1, limit = 10) => {
    setLoading(true);
    try {
      // Send parameters exactly as your backend expects: startDate, endDate, search, status
      const res = await customerService.getHistory(
        id,
        page,
        limit,
        startDate,
        endDate
      );

      setData(res.data || []);
      setPagination({
        page: Number(page),
        limit: Number(limit),
        total: res.total || 0,
        totalPages: Math.ceil((res.total || 0) / Number(limit)) || 1,
      });
    } catch (e) {
      toast.error("Failed to load history");
    } finally {
      setLoading(false);
    }
  };

  // Initial Load
  useEffect(() => {
    fetchData(1, 10);
  }, [id]); // Reload if ID changes

  // --- Handlers ---

  // Updates state when User picks from RichDateRangePicker
  const handleDateChange = (field, value) => {
    if (field === "clear") {
      setStartDate("");
      setEndDate("");
    } else if (field === "startDate") {
      setStartDate(value);
    } else if (field === "endDate") {
      setEndDate(value);
    }
  };

  // Trigger API Call
  const handleSearch = () => {
    fetchData(1, pagination.limit);
  };

  const handleExport = async () => {
    try {
      const blob = await customerService.exportHistory(id, startDate, endDate);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `washes_report_${id}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      toast.success("Download started");
    } catch (e) {
      toast.error("Export failed");
    }
  };

  // --- Columns ---
  const columns = [
    {
      header: "Id",
      accessor: "scheduleId",
      className: "w-16 text-center",
      render: (row, idx) => (
        <span className="text-slate-500 text-xs font-mono">
          {row.scheduleId || (pagination.page - 1) * pagination.limit + idx + 1}
        </span>
      ),
    },
    {
      header: "Date",
      accessor: "assignedDate",
      render: (row) => (
        <span className="text-slate-700 text-sm whitespace-nowrap font-medium">
          {row.assignedDate
            ? new Date(row.assignedDate).toLocaleString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
              })
            : "-"}
        </span>
      ),
    },
    {
      header: "Status",
      accessor: "status",
      render: (row) => {
        const status = (row.status || "PENDING").toUpperCase();
        let colorClass = "text-amber-600 bg-amber-50 border-amber-100";
        if (status === "COMPLETED")
          colorClass = "text-emerald-600 bg-emerald-50 border-emerald-100";
        if (status === "CANCELLED")
          colorClass = "text-red-600 bg-red-50 border-red-100";

        return (
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded border ${colorClass}`}
          >
            {status}
          </span>
        );
      },
    },
    {
      header: "Vehicle No",
      accessor: "vehicle.registration_no",
      render: (row) => (
        <span className="text-slate-800 font-bold font-mono">
          {row.vehicle?.registration_no || "-"}
        </span>
      ),
    },
    {
      header: "Parking No",
      accessor: "vehicle.parking_no",
      render: (row) => (
        <span className="text-slate-600 text-sm">
          {row.vehicle?.parking_no || "-"}
        </span>
      ),
    },
    {
      header: "Building",
      accessor: "building.name",
      render: (row) => (
        <span className="text-slate-600 text-sm uppercase font-medium">
          {row.building?.name || "-"}
        </span>
      ),
    },
    {
      header: "Customer",
      accessor: "customer.mobile",
      render: (row) => (
        <span className="text-slate-700 font-mono text-sm">
          {row.customer?.mobile || "-"}
        </span>
      ),
    },
  ];

  return (
    <div className="flex flex-col h-screen bg-slate-50 font-sans">
      {/* 1. HEADER */}
      <div className="bg-[#009ef7] px-6 py-4 flex items-center justify-between text-white shadow-md flex-shrink-0 z-20">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-lg font-bold tracking-wide leading-tight">
              Washes Report
            </h1>
            <p className="text-xs text-blue-100 opacity-90">History Details</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExport}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            title="Download CSV"
          >
            <Download className="w-5 h-5" />
          </button>

          {/* Mini Pagination */}
          <div className="bg-white/20 px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-3 border border-white/10">
            <span>
              {(pagination.page - 1) * pagination.limit + 1} -{" "}
              {Math.min(pagination.page * pagination.limit, pagination.total)}{" "}
              of {pagination.total}
            </span>
            <div className="flex gap-1 pl-3 border-l border-white/30">
              <button
                disabled={pagination.page === 1}
                onClick={() => fetchData(pagination.page - 1, pagination.limit)}
                className="disabled:opacity-40 hover:text-white/80 transition-opacity"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={pagination.page === pagination.totalPages}
                onClick={() => fetchData(pagination.page + 1, pagination.limit)}
                className="disabled:opacity-40 hover:text-white/80 transition-opacity"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. MAIN CONTENT */}
      <div className="flex-1 overflow-auto p-6">
        {/* Filters Section */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm mb-6">
          <div className="flex flex-col md:flex-row items-end gap-4">
            {/* Custom Rich Calendar Component */}
            <RichDateRangePicker
              startDate={startDate}
              endDate={endDate}
              onChange={handleDateChange}
            />

            {/* Search Button */}
            <button
              onClick={handleSearch}
              className="w-full md:w-auto px-8 py-2.5 bg-[#009ef7] hover:bg-[#0095e8] text-white font-bold rounded-lg shadow-md transition-all flex items-center justify-center gap-2 h-[50px]"
            >
              <Search className="w-4 h-4" />
              Search
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden min-h-[500px] flex flex-col">
          <DataTable
            columns={columns}
            data={data}
            loading={loading}
            pagination={pagination}
            onPageChange={(p) => fetchData(p, pagination.limit)}
            onLimitChange={(l) => fetchData(1, l)}
          />
        </div>
      </div>
    </div>
  );
};

export default CustomerHistory;
