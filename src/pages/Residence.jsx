import React, { useState, useEffect } from "react";
import {
  Plus,
  Trash2,
  Edit2,
  Download,
  Search,
  Car,
  MapPin,
  Calendar,
  User,
  Filter,
} from "lucide-react";
import toast from "react-hot-toast";

// Components
import DataTable from "../components/DataTable";
import JobModal from "../components/modals/JobModal";
import RichDateRangePicker from "../components/inputs/RichDateRangePicker";

// API
import { jobService } from "../api/jobService";
import { workerService } from "../api/workerService";

const Residence = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);

  // Dropdown Data
  const [workers, setWorkers] = useState([]);

  // Filters
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    worker: "",
    status: "",
  });

  const [searchTerm, setSearchTerm] = useState("");

  // Pagination
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);

  // --- Initial Load ---
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
    fetchData(1, 10);
  }, []);

  // --- Fetch Data ---
  const fetchData = async (page = 1, limit = 10) => {
    setLoading(true);
    try {
      const res = await jobService.list(page, limit, searchTerm, filters);

      setData(res.data || []);

      const totalCount = res.total || 0;
      setPagination({
        page: page,
        limit: limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit) || 1,
      });
    } catch (e) {
      toast.error("Failed to load jobs");
    } finally {
      setLoading(false);
    }
  };

  // --- Handlers ---
  const handleDateChange = (field, value) => {
    if (field === "clear") {
      setFilters((prev) => ({ ...prev, startDate: "", endDate: "" }));
    } else {
      setFilters((prev) => ({ ...prev, [field]: value }));
    }
  };

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleSearch = () => {
    fetchData(1, pagination.limit);
  };

  const handleCreate = () => {
    setSelectedJob(null);
    setIsModalOpen(true);
  };

  const handleEdit = (row) => {
    setSelectedJob(row);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this job?")) return;
    try {
      await jobService.delete(id);
      toast.success("Job deleted");
      fetchData(pagination.page, pagination.limit);
    } catch (e) {
      toast.error("Delete failed");
    }
  };

  const handleExport = async () => {
    try {
      const blob = await jobService.exportData({
        ...filters,
        search: searchTerm,
      });
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "residence_jobs.xlsx");
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
      header: "ID",
      accessor: "id",
      className: "w-16 text-center text-xs font-mono text-slate-400",
      render: (row) => <span>#{row.id || row.scheduleId}</span>,
    },
    {
      header: "Date",
      accessor: "assignedDate",
      className: "w-28",
      render: (row) => (
        <div className="flex flex-col">
          <span className="text-slate-700 font-medium text-sm">
            {row.assignedDate
              ? new Date(row.assignedDate).toLocaleDateString()
              : "-"}
          </span>
          <span className="text-[10px] text-slate-400">Assigned</span>
        </div>
      ),
    },
    {
      header: "Customer / Vehicle",
      accessor: "vehicle",
      render: (row) => (
        <div className="flex flex-col gap-1">
          <span className="font-bold text-slate-700 text-sm truncate max-w-[150px]">
            {row.customer?.firstName} {row.customer?.lastName}
          </span>
          <div className="flex items-center gap-2">
            <span className="bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-xs font-bold uppercase text-slate-600 tracking-wide flex items-center gap-1">
              <Car className="w-3 h-3" />
              {row.vehicle?.registration_no || "N/A"}
            </span>
            {row.vehicle?.parking_no && (
              <span className="text-[10px] text-slate-500 font-mono">
                {row.vehicle.parking_no}
              </span>
            )}
          </div>
        </div>
      ),
    },
    {
      header: "Location",
      accessor: "building",
      render: (row) => (
        <div className="flex flex-col">
          <span className="text-sm font-medium text-slate-700">
            {row.building?.name || "-"}
          </span>
          <div className="flex items-center gap-1 mt-0.5">
            <MapPin className="w-3 h-3 text-slate-400" />
            <span className="text-[10px] text-slate-500 truncate max-w-[120px]">
              {row.location?.name || row.location?.address || "-"}
            </span>
          </div>
        </div>
      ),
    },
    {
      header: "Worker",
      accessor: "worker",
      render: (row) => (
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-orange-50 flex items-center justify-center text-orange-600 text-xs font-bold border border-orange-100">
            {row.worker?.name?.[0] || "U"}
          </div>
          <span className="text-sm text-slate-600 font-medium">
            {row.worker?.name || "Unassigned"}
          </span>
        </div>
      ),
    },
    {
      header: "Status",
      accessor: "status",
      className: "w-24 text-center",
      render: (row) => {
        const s = (row.status || "pending").toLowerCase();
        let color = "bg-slate-100 text-slate-600";
        if (s === "completed")
          color = "bg-emerald-50 text-emerald-700 border border-emerald-100";
        if (s === "pending")
          color = "bg-amber-50 text-amber-700 border border-amber-100";
        if (s === "cancelled")
          color = "bg-red-50 text-red-700 border border-red-100";

        return (
          <span
            className={`inline-flex items-center justify-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${color}`}
          >
            {s}
          </span>
        );
      },
    },
    {
      header: "Actions",
      className: "text-right w-20",
      render: (row) => (
        <div className="flex justify-end gap-1">
          <button
            onClick={() => handleEdit(row)}
            className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-indigo-600 rounded transition-colors"
            title="Edit"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDelete(row._id)}
            className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-red-600 rounded transition-colors"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 w-full h-[calc(100vh-80px)] flex flex-col font-sans">
      {/* Header */}
      <div className="mb-6 flex flex-col xl:flex-row xl:items-center justify-between gap-4 flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Residence Jobs</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage recurring wash schedules and tasks
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm"
          >
            <Download className="w-4 h-4" /> Export
          </button>
          <button
            onClick={handleCreate}
            className="px-5 py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Schedule Job
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-4 flex flex-col xl:flex-row gap-4 items-end">
        <div className="w-full xl:w-auto">
          <RichDateRangePicker
            startDate={filters.startDate}
            endDate={filters.endDate}
            onChange={handleDateChange}
          />
        </div>

        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
          <div className="relative">
            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="w-full h-[50px] bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm text-slate-700 outline-none focus:border-indigo-500 appearance-none cursor-pointer uppercase"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <Filter className="absolute right-4 top-4 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>

          <div className="relative">
            <select
              name="worker"
              value={filters.worker}
              onChange={handleFilterChange}
              className="w-full h-[50px] bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm text-slate-700 outline-none focus:border-indigo-500 appearance-none cursor-pointer"
            >
              <option value="">All Workers</option>
              {workers.map((w) => (
                <option key={w._id} value={w._id}>
                  {w.name}
                </option>
              ))}
            </select>
            <User className="absolute right-4 top-4 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
        </div>

        <div className="flex-1 w-full relative h-[50px]">
          <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search Vehicle / Parking..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="w-full h-full pl-12 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500 transition-all"
          />
        </div>

        <button
          onClick={handleSearch}
          className="h-[50px] px-8 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center gap-2"
        >
          Search
        </button>
      </div>

      {/* Table */}
      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
        <DataTable
          columns={columns}
          data={data}
          loading={loading}
          pagination={pagination}
          onPageChange={(p) => fetchData(p, pagination.limit)}
          onLimitChange={(l) => fetchData(1, l)}
        />
      </div>

      <JobModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        job={selectedJob}
        onSuccess={() => fetchData(pagination.page, pagination.limit)}
      />
    </div>
  );
};

export default Residence;
