import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Download,
  Search,
  Filter,
  User,
  DollarSign,
  CreditCard,
  Banknote,
  Landmark,
  AlertCircle,
  FileText,
  Edit2,
  Trash2,
  Eye,
  ShoppingBag,
  Plus,
} from "lucide-react";
import toast from "react-hot-toast";

// Components
import DataTable from "../../components/DataTable";
import ReceiptModal from "../../components/modals/ReceiptModal";
import ViewPaymentModal from "../../components/modals/ViewPaymentModal";
import OneWashModal from "../../components/modals/OneWashModal";
import DeleteModal from "../../components/modals/DeleteModal";
import RichDateRangePicker from "../../components/inputs/RichDateRangePicker";

// Redux
import { exportPayments } from "../../redux/slices/paymentSlice";
import { fetchWorkers } from "../../redux/slices/workerSlice";
import { fetchOneWash, deleteOneWash } from "../../redux/slices/oneWashSlice";

const OneWashPayments = () => {
  const dispatch = useDispatch();

  // Redux State
  const { oneWashJobs, stats, total, loading } = useSelector(
    (state) => state.oneWash
  );
  const { workers } = useSelector((state) => state.worker);

  // Dates Helper (Local Time)
  const getDateString = (dateObj) => {
    const local = new Date(dateObj);
    local.setMinutes(local.getMinutes() - local.getTimezoneOffset());
    return local.toISOString().split("T")[0];
  };

  const getToday = () => getDateString(new Date());
  const getYesterday = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return getDateString(d);
  };

  // Filters (Defaults to Yesterday -> Today)
  const [filters, setFilters] = useState({
    startDate: getYesterday(),
    endDate: getToday(),
    worker: "",
    status: "",
    service_type: "",
    mall: "",
    building: "",
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

  // --- MODAL STATES ---
  const [selectedReceipt, setSelectedReceipt] = useState(null); // For Receipt Download
  const [viewPayment, setViewPayment] = useState(null); // For "Eye" View Modal
  const [editJob, setEditJob] = useState(null); // For OneWashModal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [deleteJob, setDeleteJob] = useState(null); // For DeleteModal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    dispatch(fetchWorkers({ page: 1, limit: 1000, status: 1 }));
    fetchData(1, 50);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]);

  // Update pagination when total changes from Redux
  useEffect(() => {
    if (total !== pagination.total) {
      setPagination((prev) => ({
        ...prev,
        total: total,
        totalPages: Math.ceil(total / prev.limit) || 1,
      }));
    }
  }, [total, pagination.total, pagination.limit]);

  const fetchData = async (page = 1, limit = 50) => {
    try {
      const apiFilters = { ...filters };
      // Force End of Day
      if (apiFilters.endDate && apiFilters.endDate.length === 10) {
        apiFilters.endDate = `${apiFilters.endDate}T23:59:59`;
      }

      const result = await dispatch(
        fetchOneWash({
          page,
          limit,
          search: searchTerm,
          filters: apiFilters,
        })
      ).unwrap();

      setPagination({
        page,
        limit,
        total: result.total || 0,
        totalPages: Math.ceil((result.total || 0) / limit) || 1,
      });
    } catch (e) {
      toast.error("Failed to load payments");
    }
  };

  // Handlers
  const handleDateChange = (field, value) => {
    if (field === "clear") {
      setFilters((prev) => ({
        ...prev,
        startDate: getYesterday(),
        endDate: getToday(),
      }));
    } else {
      setFilters((prev) => ({ ...prev, [field]: value }));
    }
  };

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleSearch = () => fetchData(1, pagination.limit);

  const handleViewReceipt = (row) => {
    // Map all fields from the table to receipt format
    const receiptData = {
      id: row.id || "000000",
      createdAt: row.createdAt,
      vehicle: {
        registration_no: row.registration_no || "-",
        parking_no: row.parking_no || "-",
      },
      building: row.building || row.mall || { name: "-" },
      amount_paid: row.amount || 0,
      tip: row.tip_amount || 0,
      balance: row.balance || 0,
      payment_mode: row.payment_mode || "cash",
      status: row.status || "pending",
      settled: row.settled || "pending",
      worker: row.worker,
      service_type: row.service_type,
      mall: row.mall,
    };
    setSelectedReceipt(receiptData);
  };

  const handleViewDetails = (row) => {
    setViewPayment(row); // Opens the simple white modal
  };

  const handleEdit = (row) => {
    setEditJob(row);
    setIsEditModalOpen(true);
  };

  const handleAddNew = () => {
    setEditJob(null); // null means create mode
    setIsEditModalOpen(true);
  };

  const handleEditSuccess = () => {
    fetchData(pagination.page, pagination.limit);
  };

  const handleDelete = (row) => {
    setDeleteJob(row);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteJob) return;
    setIsDeleting(true);
    try {
      await dispatch(deleteOneWash(deleteJob._id)).unwrap();
      toast.success("Payment deleted successfully!");
      fetchData(pagination.page, pagination.limit);
      setIsDeleteModalOpen(false);
      setDeleteJob(null);
    } catch (error) {
      toast.error("Failed to delete payment");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExport = async () => {
    const toastId = toast.loading("Preparing download...");
    try {
      const exportParams = { search: searchTerm, ...filters };
      if (exportParams.endDate && exportParams.endDate.length === 10) {
        exportParams.endDate = `${exportParams.endDate}T23:59:59`;
      }
      const result = await dispatch(exportPayments(exportParams)).unwrap();
      const blob = result.blob;
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement("a");
      link.href = url;
      link.download = `onewash_payments_${getToday()}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Download started", { id: toastId });
    } catch (e) {
      toast.error("Export failed", { id: toastId });
    }
  };

  // --- COLUMNS ---
  const columns = [
    {
      header: "Id",
      accessor: "id",
      className: "w-12 text-center text-slate-500 font-mono text-xs",
      render: (row, idx) => (
        <span>{(pagination.page - 1) * pagination.limit + idx + 1}</span>
      ),
    },
    {
      header: "Date",
      accessor: "createdAt",
      className: "w-28",
      render: (row) => (
        <div className="flex flex-col">
          <span className="text-slate-700 font-medium text-sm">
            {new Date(row.createdAt).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
            })}
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
      header: "Vehicle",
      accessor: "registration_no",
      render: (row) => (
        <span className="font-bold text-slate-700 text-sm">
          {row.registration_no || "N/A"}
        </span>
      ),
    },
    {
      header: "Parking",
      accessor: "parking_no",
      render: (row) => (
        <span className="text-slate-600 text-sm font-mono">
          {row.parking_no || "-"}
        </span>
      ),
    },
    {
      header: "Amount",
      accessor: "amount",
      className: "text-right",
      render: (row) => (
        <span className="font-bold text-slate-800 text-sm">{row.amount}</span>
      ),
    },
    {
      header: "Tip",
      accessor: "tip_amount",
      className: "text-center",
      render: (row) => (
        <span className="text-slate-500 text-sm">{row.tip_amount || 0}</span>
      ),
    },
    {
      header: "Balance",
      accessor: "balance",
      className: "text-center",
      render: (row) => (
        <span className="text-slate-500 text-sm">{row.balance || 0}</span>
      ),
    },
    {
      header: "Mode",
      accessor: "payment_mode",
      className: "text-center",
      render: (row) => (
        <span className="text-xs font-bold uppercase text-slate-500">
          {row.payment_mode || "-"}
        </span>
      ),
    },
    {
      header: "Status",
      accessor: "status",
      className: "text-center w-24",
      render: (row) => {
        const s = (row.status || "").toUpperCase();
        return (
          <span
            className={`text-[10px] font-bold ${
              s === "COMPLETED" ? "text-emerald-500" : "text-amber-500"
            }`}
          >
            {s}
          </span>
        );
      },
    },
    {
      header: "Settle Status",
      accessor: "settled",
      className: "text-center w-24",
      render: (row) => {
        const s = (row.settled || "pending").toUpperCase();
        return (
          <span
            className={`text-[10px] font-bold ${
              s === "COMPLETED" ? "text-emerald-500" : "text-amber-500"
            }`}
          >
            {s}
          </span>
        );
      },
    },
    {
      header: "Worker",
      accessor: "worker.name",
      render: (row) => (
        <span
          className="text-xs font-bold text-slate-700 uppercase truncate max-w-[100px] block"
          title={row.worker?.name}
        >
          {row.worker?.name || "-"}
        </span>
      ),
    },
    {
      header: "Receipt",
      className: "text-center w-16",
      render: (row) => (
        <button
          onClick={() => handleViewReceipt(row)}
          className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 hover:text-indigo-600 transition-colors"
        >
          <FileText className="w-4 h-4 mx-auto" />
        </button>
      ),
    },
    {
      header: "Actions",
      className: "text-right w-24",
      render: (row) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => handleEdit(row)}
            className="p-1.5 hover:bg-slate-100 rounded text-slate-400 hover:text-indigo-500"
            title="Edit"
          >
            <Edit2 className="w-4 h-4" />
          </button>

          {/* VIEW BUTTON - Triggers ViewPaymentModal */}
          <button
            onClick={() => handleViewDetails(row)}
            className="p-1.5 hover:bg-slate-100 rounded text-slate-400 hover:text-blue-500"
            title="View"
          >
            <Eye className="w-4 h-4" />
          </button>

          <button
            onClick={() => handleDelete(row)}
            className="p-1.5 hover:bg-slate-100 rounded text-slate-400 hover:text-red-500"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-3 w-full">
      {/* Stats Bar */}
      <div className="bg-indigo-600 text-white p-4 rounded-xl shadow-lg mb-6 flex flex-col md:flex-row justify-between items-center gap-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 p-2 rounded-lg">
            <ShoppingBag className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-xs font-medium opacity-80 uppercase">
              Total Payments
            </p>
            <h2 className="text-2xl font-bold">
              {stats.totalAmount}{" "}
              <span className="text-sm font-normal opacity-70">AED</span>
            </h2>
          </div>
        </div>
        <div className="flex gap-6 text-sm font-medium bg-indigo-700/50 px-4 py-2 rounded-lg border border-indigo-500/30">
          <div className="flex items-center gap-2">
            <Banknote className="w-4 h-4 opacity-80" /> {stats.cash}
          </div>
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 opacity-80" /> {stats.card}
          </div>
          <div className="flex items-center gap-2">
            <Landmark className="w-4 h-4 opacity-80" /> {stats.bank}
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-4 flex flex-col xl:flex-row gap-4 items-end flex-shrink-0">
        <div className="w-full xl:w-auto">
          <RichDateRangePicker
            startDate={filters.startDate}
            endDate={filters.endDate}
            onChange={handleDateChange}
          />
        </div>

        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
          <div className="relative">
            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="w-full h-[50px] bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm outline-none cursor-pointer"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          <div className="relative">
            <select
              name="worker"
              value={filters.worker}
              onChange={handleFilterChange}
              className="w-full h-[50px] bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm outline-none cursor-pointer"
            >
              <option value="">All Workers</option>
              {workers.map((w) => (
                <option key={w._id} value={w._id}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>
          <div className="relative">
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="w-full h-[50px] bg-slate-50 border border-slate-200 rounded-xl pl-4 pr-10 text-sm outline-none focus:border-indigo-500"
            />
            <Search className="absolute right-4 top-3.5 w-5 h-5 text-slate-400" />
          </div>
        </div>

        <button
          onClick={handleSearch}
          className="h-[50px] px-8 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md transition-colors"
        >
          Search
        </button>
        <button
          onClick={handleAddNew}
          className="h-[50px] px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition-colors flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add New
        </button>
        <button
          onClick={handleExport}
          className="h-[50px] px-4 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 font-bold rounded-xl shadow-sm transition-colors"
        >
          <Download className="w-5 h-5" />
        </button>
      </div>

      {/* Data Table */}
      <div className="flex-1 min-h-0 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
        <DataTable
          columns={columns}
          data={oneWashJobs}
          loading={loading}
          pagination={pagination}
          onPageChange={(p) => fetchData(p, pagination.limit)}
          onLimitChange={(l) => fetchData(1, l)}
        />
      </div>

      {/* Receipt Download Modal */}
      <ReceiptModal
        isOpen={!!selectedReceipt}
        onClose={() => setSelectedReceipt(null)}
        data={selectedReceipt}
      />

      {/* View Info Modal (Eye Icon) */}
      <ViewPaymentModal
        isOpen={!!viewPayment}
        onClose={() => setViewPayment(null)}
        payment={viewPayment}
      />

      <OneWashModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditJob(null);
        }}
        job={editJob}
        onSuccess={handleEditSuccess}
      />

      <DeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeleteJob(null);
        }}
        onConfirm={confirmDelete}
        loading={isDeleting}
        title="Delete Payment?"
        message={`Are you sure you want to delete the payment for ${
          deleteJob?.registration_no || "this vehicle"
        }? This action cannot be undone.`}
      />
    </div>
  );
};

export default OneWashPayments;
