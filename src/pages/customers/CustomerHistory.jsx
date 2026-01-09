import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Download,
  Search,
  ChevronLeft,
  ChevronRight,
  History,
  Calendar,
  Car,
  MapPin,
  Building,
  CheckCircle2,
  XCircle,
  Clock,
  LayoutDashboard,
} from "lucide-react";
import toast from "react-hot-toast";

import DataTable from "../../components/DataTable";
import RichDateRangePicker from "../../components/inputs/RichDateRangePicker";

import { customerService } from "../../api/customerService";

const CustomerHistory = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50, // <--- Default to 50 as requested
    total: 0,
    totalPages: 1,
  });

  // <--- Logic preserved: Default limit to 50
  const fetchData = async (page = 1, limit = 50) => {
    setLoading(true);
    try {
      console.log("🔄 Fetching customer history:", {
        id,
        page,
        limit,
        startDate,
        endDate,
      });
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
      console.error("❌ Failed to load history:", e);
      toast.error("Failed to load history");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(1, 50);
  }, [id]);

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

  const handleSearch = () => {
    fetchData(1, pagination.limit);
  };

  const handleExport = async () => {
    const toastId = toast.loading("Preparing download...");
    try {
      const blob = await customerService.exportHistory(id, startDate, endDate);

      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `washes_report_${id}_${new Date().toISOString().split("T")[0]}.xlsx`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success("Download started", { id: toastId });
    } catch (e) {
      console.error("Export error:", e);
      toast.error("Export failed", { id: toastId });
    }
  };

  const columns = [
    {
      header: "Id",
      accessor: "scheduleId",
      className: "w-16 text-center",
      render: (row, idx) => (
        <div className="flex justify-center">
          <span className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs font-mono border border-slate-200">
            {row.scheduleId ||
              (pagination.page - 1) * pagination.limit + idx + 1}
          </span>
        </div>
      ),
    },
    {
      header: "Date & Time",
      accessor: "assignedDate",
      render: (row) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
            <Calendar className="w-4 h-4" />
          </div>
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
        </div>
      ),
    },
    {
      header: "Status",
      accessor: "status",
      render: (row) => {
        const status = (row.status || "PENDING").toUpperCase();
        let colorClass = "text-amber-700 bg-amber-50 border-amber-100";
        let Icon = Clock;

        if (status === "COMPLETED") {
          colorClass = "text-emerald-700 bg-emerald-50 border-emerald-100";
          Icon = CheckCircle2;
        }
        if (status === "CANCELLED") {
          colorClass = "text-rose-700 bg-rose-50 border-rose-100";
          Icon = XCircle;
        }

        return (
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${colorClass}`}
          >
            <Icon className="w-3.5 h-3.5" />
            {status}
          </span>
        );
      },
    },
    {
      header: "Vehicle Info",
      accessor: "vehicle.registration_no",
      render: (row) => (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Car className="w-3.5 h-3.5 text-blue-500" />
            <span className="text-slate-800 font-bold font-mono text-xs bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
              {row.vehicle?.registration_no || "-"}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500 ml-0.5">
            <span className="font-medium">P:</span>
            <span>{row.vehicle?.parking_no || "-"}</span>
          </div>
        </div>
      ),
    },
    {
      header: "Building / Location",
      accessor: "building.name",
      render: (row) => (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
            <Building className="w-3.5 h-3.5 text-indigo-500" />
            <span>{row.building?.name || "-"}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
            <MapPin className="w-3 h-3" />
            <span
              className="truncate max-w-[150px]"
              title={row.location?.address}
            >
              {row.location?.address || "-"}
            </span>
          </div>
        </div>
      ),
    },
    {
      header: "Customer",
      accessor: "customer.mobile",
      render: (row) => (
        <span className="text-slate-600 font-mono text-sm bg-slate-50 px-2 py-1 rounded border border-slate-100">
          {row.customer?.mobile || "-"}
        </span>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6 font-sans">
      {/* HEADER SECTION */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          {/* Title & Back Button */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 flex items-center justify-center transition-all shadow-sm"
              title="Go Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-200">
                <History className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-indigo-800 bg-clip-text text-transparent">
                  Washes Report
                </h1>
                <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span>History Details</span>
                </div>
              </div>
            </div>
          </div>

          {/* Actions: Export & Pagination Controls */}
          <div className="flex flex-wrap items-center gap-3 justify-end">
            {/* Pagination Controls */}
            <div className="flex items-center bg-slate-100 rounded-xl p-1 border border-slate-200">
              <div className="px-3 text-xs font-bold text-slate-500 uppercase">
                {pagination.total} Records
              </div>
              <div className="w-px h-4 bg-slate-300 mx-1"></div>
              <button
                disabled={pagination.page === 1}
                onClick={() => fetchData(pagination.page - 1, pagination.limit)}
                className="p-1.5 hover:bg-white rounded-lg text-slate-500 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-mono font-medium px-2 text-slate-700">
                {pagination.page}/{pagination.totalPages}
              </span>
              <button
                disabled={pagination.page === pagination.totalPages}
                onClick={() => fetchData(pagination.page + 1, pagination.limit)}
                className="p-1.5 hover:bg-white rounded-lg text-slate-500 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={handleExport}
              className="h-10 px-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md hover:shadow-lg transition-all"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* SEARCH SECTION */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm mb-6">
        <div className="flex flex-col md:flex-row items-end gap-4">
          <div className="w-full md:flex-1">
            <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase ml-1">
              Filter by Date Range
            </label>
            <RichDateRangePicker
              startDate={startDate}
              endDate={endDate}
              onChange={handleDateChange}
              className="w-full"
            />
          </div>

          <button
            onClick={handleSearch}
            className="w-full md:w-auto h-[42px] px-6 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-bold rounded-xl shadow-md hover:shadow-xl transition-all flex items-center justify-center gap-2 active:scale-95"
          >
            <Search className="w-4 h-4" />
            <span>Search</span>
          </button>
        </div>
      </div>

      {/* TABLE SECTION */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden flex flex-col flex-1">
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
  );
};

export default CustomerHistory;
