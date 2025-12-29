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
} from "lucide-react";
import toast from "react-hot-toast";

import DataTable from "../components/DataTable";
import OneWashModal from "../components/modals/OneWashModal";
import RichDateRangePicker from "../components/inputs/RichDateRangePicker";

import { oneWashService } from "../api/oneWashService";
import { workerService } from "../api/workerService";

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

  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    service_type: "",
    worker: "",
  });

  const [searchTerm, setSearchTerm] = useState("");

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
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
    fetchData(1, 10);
  }, []);

  // --------------------------------
  // FETCH DATA (SERVER PAGINATION)
  // --------------------------------
  const fetchData = async (page = 1, limit = 10) => {
    setLoading(true);

    try {
      const res = await oneWashService.list(page, limit, searchTerm, filters);

      console.log("ONEWASH API RESPONSE", res);

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
      setFilters((prev) => ({ ...prev, startDate: "", endDate: "" }));
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
  // CRUD HANDLERS
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
      const blob = await oneWashService.exportData({
        ...filters,
        search: searchTerm,
      });

      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement("a");

      link.href = url;
      link.setAttribute("download", "onewash_report.xlsx");
      document.body.appendChild(link);
      link.click();
      link.remove();

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
      className: "w-16 text-center text-xs font-mono text-slate-400",
      render: (row) => <span>#{row.id}</span>,
    },
    {
      header: "Date",
      accessor: "createdAt",
      className: "w-28",
      render: (row) => (
        <div className="flex flex-col">
          <span className="text-slate-700 font-medium text-sm">
            {new Date(row.createdAt).toLocaleDateString()}
          </span>
          <span className="text-[10px] text-slate-400">
            {new Date(row.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
      ),
    },
    {
      header: "Vehicle Info",
      accessor: "registration_no",
      render: (row) => (
        <div className="flex flex-col gap-1">
          <span className="bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-xs font-bold uppercase text-slate-700 tracking-wide">
            {row.registration_no}
          </span>

          {row.parking_no && (
            <span className="text-[10px] text-slate-500">
              Parking: <b>{row.parking_no}</b>
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
            <MapPin className="w-3 h-3 text-orange-500" />
            <span className="text-xs font-bold uppercase text-slate-500">
              {row.service_type}
            </span>
          </div>

          <span className="text-sm font-medium text-slate-700 truncate max-w-[140px]">
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
          <div className="w-6 h-6 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 text-xs font-bold">
            {row.worker?.name?.[0] || "U"}
          </div>
          <span className="text-sm text-slate-600 font-medium">
            {row.worker?.name || "Unassigned"}
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
          <span className="font-bold text-slate-800 text-sm">
            {row.amount} AED
          </span>

          <div className="flex items-center gap-1 mt-0.5">
            {row.payment_mode === "cash" && (
              <Banknote className="w-3 h-3 text-emerald-500" />
            )}
            {row.payment_mode === "card" && (
              <CreditCard className="w-3 h-3 text-blue-500" />
            )}

            <span className="text-[10px] text-slate-400 uppercase font-bold">
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
          className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${
            row.status === "completed"
              ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
              : "bg-amber-50 text-amber-700 border border-amber-100"
          }`}
        >
          {row.status}
        </span>
      ),
    },
    {
      header: "Actions",
      className: "text-right w-20",
      render: (row) => (
        <div className="flex justify-end gap-1">
          <button
            onClick={() => handleEdit(row)}
            className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-indigo-600 rounded"
          >
            <Edit2 className="w-4 h-4" />
          </button>

          <button
            onClick={() => handleDelete(row._id)}
            className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-red-600 rounded"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 w-full h-[calc(100vh-80px)] flex flex-col font-sans">
      {/* FILTER BAR */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-4 flex flex-col xl:flex-row gap-4 items-end">
        {/* Date Range */}
        <div className="w-full xl:w-auto">
          <RichDateRangePicker
            startDate={filters.startDate}
            endDate={filters.endDate}
            onChange={handleDateChange}
          />
        </div>

        {/* Dropdown Filters */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
          <div className="relative">
            <select
              name="service_type"
              value={filters.service_type}
              onChange={handleFilterChange}
              className="w-full h-[50px] bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm"
            >
              <option value="">All Services</option>
              <option value="mall">Mall</option>
              <option value="residence">Residence</option>
            </select>
            <Filter className="absolute right-4 top-4 w-4 h-4 text-slate-400" />
          </div>

          <div className="relative">
            <select
              name="worker"
              value={filters.worker}
              onChange={handleFilterChange}
              className="w-full h-[50px] bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm"
            >
              <option value="">All Workers</option>
              {workers.map((w) => (
                <option key={w._id} value={w._id}>
                  {w.name}
                </option>
              ))}
            </select>
            <User className="absolute right-4 top-4 w-4 h-4 text-slate-400" />
          </div>
        </div>

        {/* Search input */}
        <div className="flex-1 w-full relative h-[50px]">
          <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search Plate No..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) =>
              e.key === "Enter" && fetchData(1, pagination.limit)
            }
            className="w-full h-full pl-12 pr-4 bg-slate-50 border border-slate-200 rounded-xl"
          />
        </div>

        {/* Apply */}
        <button
          onClick={applyFilters}
          className="h-[50px] px-8 bg-indigo-600 text-white rounded-xl font-bold"
        >
          Search
        </button>
      </div>

      {/* TABLE */}
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
