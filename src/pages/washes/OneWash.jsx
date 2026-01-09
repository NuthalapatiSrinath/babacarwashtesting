import React, { useState, useEffect } from "react";
import {
  Plus,
  Trash2,
  Edit2,
  Download,
  Search,
  MapPin,
  User,
  Filter,
  CreditCard,
  Banknote,
  Car,
  Calendar,
  Briefcase,
  DollarSign,
  Layers,
} from "lucide-react";
import toast from "react-hot-toast";

import DataTable from "../../components/DataTable";
import OneWashModal from "../../components/modals/OneWashModal";
import RichDateRangePicker from "../../components/inputs/RichDateRangePicker";

import { oneWashService } from "../../api/oneWashService";
import { workerService } from "../../api/workerService";

const OneWash = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);

  const [stats, setStats] = useState({
    totalAmount: 0,
    totalJobs: 0,
    cash: 0,
    card: 0,
    bank: 0,
  });

  const [workers, setWorkers] = useState([]);

  // -----------------------------
  // DATE HELPERS (Local Time Safe)
  // -----------------------------
  // Helper to format date as YYYY-MM-DD in LOCAL time
  const formatDateLocal = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const getToday = () => formatDateLocal(new Date());

  const getLast3Days = () => {
    const d = new Date();
    d.setDate(d.getDate() - 3);
    return formatDateLocal(d);
  };

  // DEFAULT DATES: Last 3 days ➜ Today
  const [filters, setFilters] = useState({
    startDate: getLast3Days(),
    endDate: getToday(),
    service_type: "",
    worker: "",
  });

  const [searchTerm, setSearchTerm] = useState("");

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 1,
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);

  // --------------------------------
  // LOAD WORKERS + INITIAL DATA
  // --------------------------------
  useEffect(() => {
    const loadWorkers = async () => {
      try {
        const res = await workerService.list(1, 1000);
        setWorkers(res.data || []);
      } catch (e) {
        console.error(e);
      }
    };

    loadWorkers();
    fetchData(1, 50);
  }, []);

  // --------------------------------
  // FETCH DATA
  // --------------------------------
  const fetchData = async (page = 1, limit = 50) => {
    setLoading(true);

    try {
      // --- FIX: ADJUST END DATE TO INCLUDE FULL DAY ---
      const apiFilters = { ...filters };
      if (apiFilters.endDate) {
        // Appending time ensures we get records up to the very end of that day
        apiFilters.endDate = `${apiFilters.endDate}T23:59:59`;
      }

      const res = await oneWashService.list(
        page,
        limit,
        searchTerm,
        apiFilters // Pass the adjusted filters
      );

      setData(res.data || []);

      if (res.counts) setStats(res.counts);

      const total =
        res.total !== undefined ? res.total : res.data ? res.data.length : 0;

      setPagination({
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      });
    } catch (e) {
      console.error(e);
      toast.error("Failed to load jobs");
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------
  // FILTER HANDLERS
  // --------------------------------
  const handleDateChange = (field, value) => {
    if (field === "clear") {
      setFilters((prev) => ({
        ...prev,
        startDate: getLast3Days(),
        endDate: getToday(),
      }));
    } else {
      setFilters((prev) => ({ ...prev, [field]: value }));
    }
  };

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const applyFilters = () => {
    fetchData(1, pagination.limit);
  };

  // --------------------------------
  // CRUD
  // --------------------------------
  const handleCreate = () => {
    setSelectedJob(null);
    setIsModalOpen(true);
  };

  const handleEdit = (row) => {
    setSelectedJob(row);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this job record?")) return;

    try {
      await oneWashService.delete(id);
      toast.success("Deleted successfully");
      fetchData(pagination.page, pagination.limit);
    } catch {
      toast.error("Delete failed");
    }
  };

  const handleExport = async () => {
    try {
      // Apply the same date fix for export
      const exportFilters = { ...filters };
      if (exportFilters.endDate) {
        exportFilters.endDate = `${exportFilters.endDate}T23:59:59`;
      }

      const blob = await oneWashService.exportData({
        ...exportFilters,
        search: searchTerm,
      });

      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement("a");

      link.href = url;
      link.setAttribute("download", "onewash_report.xlsx");
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);

      toast.success("Download started");
    } catch {
      toast.error("Export failed");
    }
  };

  // --------------------------------
  // TABLE COLUMNS
  // --------------------------------
  const columns = [
    {
      header: "ID",
      accessor: "id",
      className: "w-16 text-center",
      render: (row) => (
        <div className="flex justify-center">
          <span className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs font-mono border border-slate-200">
            #{row.id}
          </span>
        </div>
      ),
    },
    {
      header: "Date",
      accessor: "createdAt",
      className: "w-32",
      render: (row) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
            <Calendar className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-slate-700 font-bold text-xs">
              {new Date(row.createdAt).toLocaleDateString()}
            </span>
            <span className="text-[10px] text-slate-400 font-medium">
              {new Date(row.createdAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        </div>
      ),
    },
    {
      header: "Vehicle Info",
      accessor: "registration_no",
      render: (row) => (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Car className="w-3.5 h-3.5 text-slate-400" />
            <span className="bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-xs font-bold uppercase text-slate-700 tracking-wide w-fit">
              {row.registration_no}
            </span>
          </div>
          {row.parking_no && (
            <span className="text-[10px] text-slate-500 pl-6">
              Parking: <span className="font-bold">{row.parking_no}</span>
            </span>
          )}
        </div>
      ),
    },
    {
      header: "Location",
      accessor: "service_type",
      render: (row) => (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 mb-0.5">
            <MapPin
              className={`w-3 h-3 ${
                row.service_type === "mall"
                  ? "text-purple-500"
                  : "text-orange-500"
              }`}
            />
            <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">
              {row.service_type}
            </span>
          </div>
          <span className="text-sm font-bold text-slate-700 truncate max-w-[140px]">
            {row.service_type === "mall"
              ? row.mall?.name || "-"
              : row.building?.name || "-"}
          </span>
        </div>
      ),
    },
    {
      header: "Assigned Worker",
      accessor: "worker",
      render: (row) => (
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-100 to-indigo-200 flex items-center justify-center text-indigo-700 text-xs font-bold border border-indigo-200">
            {row.worker?.name?.[0] || "U"}
          </div>
          <span className="text-sm text-slate-700 font-medium">
            {row.worker?.name || (
              <span className="text-slate-400 italic text-xs">Unassigned</span>
            )}
          </span>
        </div>
      ),
    },
    {
      header: "Amount",
      accessor: "amount",
      className: "text-right",
      render: (row) => (
        <div className="flex flex-col items-end">
          <span className="font-bold text-slate-800 text-sm flex items-center gap-1">
            {row.amount} <span className="text-[10px] text-slate-400">AED</span>
          </span>
          <div className="flex items-center gap-1 mt-0.5">
            {row.payment_mode === "cash" && (
              <Banknote className="w-3 h-3 text-emerald-500" />
            )}
            {row.payment_mode === "card" && (
              <CreditCard className="w-3 h-3 text-blue-500" />
            )}
            <span className="text-[10px] text-slate-500 uppercase font-bold">
              {row.payment_mode}
            </span>
          </div>
        </div>
      ),
    },
    {
      header: "Status",
      accessor: "status",
      className: "w-24 text-center",
      render: (row) => (
        <span
          className={`inline-flex items-center justify-center px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide border ${
            row.status === "completed"
              ? "bg-emerald-50 text-emerald-700 border-emerald-100"
              : "bg-amber-50 text-amber-700 border-amber-100"
          }`}
        >
          {row.status}
        </span>
      ),
    },
    {
      header: "Actions",
      className:
        "text-right w-24 sticky right-0 bg-white shadow-[-5px_0_10px_-5px_rgba(0,0,0,0.05)]",
      render: (row) => (
        <div className="flex justify-end gap-1.5 pr-2">
          <button
            onClick={() => handleEdit(row)}
            className="p-2 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 rounded-lg transition-all"
            title="Edit"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDelete(row._id)}
            className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg transition-all"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6 font-sans">
      {/* --- HEADER SECTION --- */}
      <div className="mb-6 flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-200">
              <Layers className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-indigo-800 bg-clip-text text-transparent">
                One Wash Jobs
              </h1>
              <p className="text-sm text-slate-500 font-medium">
                Manage daily washing records
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 text-xs font-medium text-slate-600 mt-1">
            <div className="bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm flex items-center gap-2">
              <Briefcase className="w-3.5 h-3.5 text-indigo-500" />
              <span>
                Total: <b className="text-slate-800">{stats.totalJobs}</b>
              </span>
            </div>
            <div className="bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm flex items-center gap-2">
              <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
              <span>
                Revenue:{" "}
                <b className="text-emerald-700">{stats.totalAmount} AED</b>
              </span>
            </div>
            <div className="bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm flex items-center gap-2">
              <Banknote className="w-3.5 h-3.5 text-slate-400" />
              <span>
                Cash: <b>{stats.cash}</b>
              </span>
            </div>
            <div className="bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm flex items-center gap-2">
              <CreditCard className="w-3.5 h-3.5 text-blue-400" />
              <span>
                Card: <b>{stats.card}</b>
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExport}
            className="h-11 px-5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-bold text-sm shadow-sm transition-all flex items-center gap-2"
          >
            <Download className="w-4 h-4 text-slate-500" /> Export
          </button>
          <button
            onClick={handleCreate}
            className="h-11 px-6 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-200 hover:shadow-indigo-300 transition-all active:scale-95 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> New Job
          </button>
        </div>
      </div>

      {/* --- FILTERS & TABLE CONTAINER --- */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden flex flex-col">
        {/* Filters Bar */}
        <div className="p-4 border-b border-gray-100 bg-slate-50/50 flex flex-col xl:flex-row gap-4 items-end">
          <div className="w-full xl:w-auto">
            <span className="text-xs font-bold text-slate-500 uppercase mb-1.5 block ml-1">
              Date Range
            </span>
            <RichDateRangePicker
              startDate={filters.startDate}
              endDate={filters.endDate}
              onChange={handleDateChange}
            />
          </div>

          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
            <div className="relative">
              <span className="text-xs font-bold text-slate-500 uppercase mb-1.5 block ml-1">
                Service Type
              </span>
              <div className="relative">
                <select
                  name="service_type"
                  value={filters.service_type}
                  onChange={handleFilterChange}
                  className="w-full h-[42px] bg-white border border-slate-200 rounded-lg px-4 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 appearance-none cursor-pointer font-medium text-slate-700"
                >
                  <option value="">All Services</option>
                  <option value="mall">Mall</option>
                  <option value="residence">Residence</option>
                </select>
                <Filter className="absolute right-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            <div className="relative">
              <span className="text-xs font-bold text-slate-500 uppercase mb-1.5 block ml-1">
                Worker
              </span>
              <div className="relative">
                <select
                  name="worker"
                  value={filters.worker}
                  onChange={handleFilterChange}
                  className="w-full h-[42px] bg-white border border-slate-200 rounded-lg px-4 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 appearance-none cursor-pointer font-medium text-slate-700"
                >
                  <option value="">All Workers</option>
                  {workers.map((w) => (
                    <option key={w._id} value={w._id}>
                      {w.name}
                    </option>
                  ))}
                </select>
                <User className="absolute right-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="flex-1 w-full">
            <span className="text-xs font-bold text-slate-500 uppercase mb-1.5 block ml-1">
              Search
            </span>
            <div className="relative h-[42px]">
              <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search Plate No..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && fetchData(1, pagination.limit)
                }
                className="w-full h-full pl-10 pr-4 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 font-medium"
              />
            </div>
          </div>

          <button
            onClick={applyFilters}
            className="h-[42px] px-6 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
          >
            <Search className="w-4 h-4" /> Apply
          </button>
        </div>

        {/* Data Table */}
        <DataTable
          columns={columns}
          data={data}
          loading={loading}
          pagination={pagination}
          onPageChange={(p) => fetchData(p, pagination.limit)}
          onLimitChange={(l) => fetchData(1, l)}
        />
      </div>

      <OneWashModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        job={selectedJob}
        onSuccess={() => fetchData(pagination.page, pagination.limit)}
      />
    </div>
  );
};

export default OneWash;
