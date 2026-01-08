import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Download,
  Search,
  Filter,
  User,
  Building,
  Banknote,
  CreditCard,
  Landmark,
  FileText,
  Edit2,
  Trash2,
  Eye,
  Receipt, // Icon for Invoice
} from "lucide-react";
import toast from "react-hot-toast";

// Components
import DataTable from "../../components/DataTable";
import ReceiptModal from "../../components/modals/ReceiptModal"; // For RECEIPTS
import ResidenceReceiptModal from "../../components/modals/ResidenceReceiptModal"; // For INVOICES
import ViewPaymentModal from "../../components/modals/ViewPaymentModal";
import DeleteModal from "../../components/modals/DeleteModal";
import PaymentModal from "../../components/modals/PaymentModal";
import RichDateRangePicker from "../../components/inputs/RichDateRangePicker";

// Redux
import {
  fetchResidencePayments,
  deleteResidencePayment,
} from "../../redux/slices/residencePaymentSlice";
import { fetchWorkers } from "../../redux/slices/workerSlice";
import { exportPayments } from "../../redux/slices/paymentSlice";

const ResidencePayments = () => {
  const dispatch = useDispatch();

  // Redux State
  const { payments, stats, loading } = useSelector(
    (state) => state.residencePayment
  );
  const { workers } = useSelector((state) => state.worker);

  // Dates Helper
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

  // Filters
  const [filters, setFilters] = useState({
    startDate: getYesterday(),
    endDate: getToday(),
    worker: "",
    status: "",
    onewash: "false",
    building: "",
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

  // Modal States
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [activeModal, setActiveModal] = useState(null); // 'invoice' | 'receipt' | null

  const [viewPayment, setViewPayment] = useState(null);
  const [deletePayment, setDeletePayment] = useState(null);
  const [editPayment, setEditPayment] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    dispatch(fetchWorkers({ page: 1, limit: 1000, status: 1 }));
    fetchData(1, 10);
  }, [dispatch]);

  const fetchData = async (page = 1, limit = 10) => {
    try {
      const apiFilters = { ...filters };
      if (apiFilters.endDate && apiFilters.endDate.length === 10) {
        apiFilters.endDate = `${apiFilters.endDate}T23:59:59`;
      }

      const result = await dispatch(
        fetchResidencePayments({
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

  // --- OPEN MODAL HANDLER ---
  const handleOpenDoc = (row, type) => {
    console.log(`🔵 Opening ${type} for row:`, row);

    // Map table row to the format expected by the Modals
    const docData = {
      id: row._id || row.id || "000000",
      createdAt: row.createdAt,
      vehicle: {
        registration_no: row.vehicle?.registration_no || "-",
        parking_no: row.vehicle?.parking_no || "-",
      },
      customer: row.customer || { name: "Valued Customer", phone: "-" },
      building: row.customer?.building || { name: "-" },
      mall: row.mall,
      amount_paid: row.amount_paid || 0,
      amount_charged: row.amount_charged || 0,
      old_balance: row.old_balance || 0,
      total_amount: row.total_amount || 0,
      balance: row.balance || 0,
      tip: row.tip_amount || 0,
      payment_mode: row.payment_mode || "cash",
      status: row.status || "pending",
      settled: row.settled || "pending",
      worker: row.worker,
      service_type: "residence",
      billAmountDesc: `For the month of ${new Date(
        row.createdAt
      ).toLocaleDateString("en-US", { month: "long" })}`,
    };

    setSelectedRecord(docData);

    if (type === "Invoice") {
      setActiveModal("invoice");
    } else {
      setActiveModal("receipt");
    }
  };

  const handleCloseModals = () => {
    setActiveModal(null);
    setSelectedRecord(null);
  };

  const handleViewDetails = (row) => setViewPayment(row);
  const handleEdit = (row) => setEditPayment(row);

  const handleDelete = (row) => {
    setDeletePayment(row);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletePayment) return;
    setIsDeleting(true);
    try {
      await dispatch(deleteResidencePayment(deletePayment._id)).unwrap();
      toast.success("Payment deleted successfully!");
      fetchData(pagination.page, pagination.limit);
      setIsDeleteModalOpen(false);
      setDeletePayment(null);
    } catch (error) {
      toast.error("Failed to delete payment");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExport = async () => {
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
      link.download = `residence_payments_${getToday()}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Download started");
    } catch (e) {
      toast.error("Export failed");
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
      accessor: "vehicle.registration_no",
      render: (row) => (
        <span className="font-bold text-slate-700 text-sm">
          {row.vehicle?.registration_no || "N/A"}
        </span>
      ),
    },
    {
      header: "Parking",
      accessor: "vehicle.parking_no",
      render: (row) => (
        <span className="text-slate-600 text-sm font-mono">
          {row.vehicle?.parking_no || "-"}
        </span>
      ),
    },
    {
      header: "Actual Amount",
      accessor: "amount_charged",
      className: "text-right",
      render: (row) => (
        <span className="font-bold text-slate-800 text-sm">
          {row.amount_charged}
        </span>
      ),
    },
    {
      header: "Last Month",
      accessor: "old_balance",
      className: "text-right",
      render: (row) => (
        <span className="text-slate-500 text-sm">{row.old_balance || 0}</span>
      ),
    },
    {
      header: "Total",
      accessor: "total_amount",
      className: "text-right",
      render: (row) => (
        <span className="font-bold text-indigo-600 text-sm">
          {row.total_amount || 0}
        </span>
      ),
    },
    {
      header: "Paid",
      accessor: "amount_paid",
      className: "text-right",
      render: (row) => (
        <span className="font-bold text-emerald-600 text-sm">
          {row.amount_paid || 0}
        </span>
      ),
    },
    {
      header: "Balance",
      accessor: "balance",
      className: "text-right",
      render: (row) => (
        <span
          className={`text-sm font-bold ${
            row.balance > 0 ? "text-red-500" : "text-slate-400"
          }`}
        >
          {row.balance || 0}
        </span>
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
    // --- INVOICE BUTTON (Uses ResidenceReceiptModal with Type=Invoice) ---
    {
      header: "Invoice",
      className: "text-center w-16",
      render: (row) => (
        <button
          onClick={() => handleOpenDoc(row, "Invoice")}
          className="text-slate-400 hover:text-indigo-600 transition-colors p-2"
          title="View Tax Invoice"
        >
          <Receipt className="w-4 h-4 mx-auto" />
        </button>
      ),
    },
    // --- RECEIPT BUTTON (Uses ReceiptModal) ---
    {
      header: "Receipt",
      className: "text-center w-16",
      render: (row) => (
        <button
          onClick={() => handleOpenDoc(row, "Receipt")}
          className="text-slate-400 hover:text-emerald-600 transition-colors p-2"
          title="View Receipt"
        >
          <FileText className="w-4 h-4 mx-auto" />
        </button>
      ),
    },
    {
      header: "Actions",
      className: "text-right w-20",
      render: (row) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => handleViewDetails(row)}
            className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-blue-500"
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>
      ),
    },
    {
      header: "Modify",
      className: "text-right w-16",
      render: (row) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => handleEdit(row)}
            className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-indigo-600"
            title="Edit"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDelete(row)}
            className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-red-500"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 w-full flex flex-col font-sans">
      {/* Stats Bar */}
      <div className="bg-indigo-600 text-white p-4 rounded-xl shadow-lg mb-6 flex flex-col md:flex-row justify-between items-center gap-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 p-2 rounded-lg">
            <Building className="w-6 h-6 text-white" />
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
            <Filter className="absolute right-4 top-4 w-4 h-4 text-slate-400 pointer-events-none" />
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
            <User className="absolute right-4 top-4 w-4 h-4 text-slate-400 pointer-events-none" />
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
          onClick={handleExport}
          className="h-[50px] px-4 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 font-bold rounded-xl shadow-sm transition-colors"
        >
          <Download className="w-5 h-5" />
        </button>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <DataTable
          columns={columns}
          data={payments}
          loading={loading}
          pagination={pagination}
          onPageChange={(p) => fetchData(p, pagination.limit)}
          onLimitChange={(l) => fetchData(1, l)}
        />
      </div>

      {/* --- INVOICE MODAL (Uses ResidenceReceiptModal with Type=Invoice) --- */}
      <ResidenceReceiptModal
        isOpen={!!selectedRecord && activeModal === "invoice"}
        onClose={handleCloseModals}
        data={selectedRecord}
        type="Invoice"
      />

      {/* --- RECEIPT MODAL (Uses ReceiptModal) --- */}
      <ReceiptModal
        isOpen={!!selectedRecord && activeModal === "receipt"}
        onClose={handleCloseModals}
        data={selectedRecord}
      />

      <ViewPaymentModal
        isOpen={!!viewPayment}
        onClose={() => setViewPayment(null)}
        payment={viewPayment}
      />

      <DeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeletePayment(null);
        }}
        onConfirm={confirmDelete}
        loading={isDeleting}
        title="Delete Payment?"
        message={`Are you sure you want to delete the payment for ${
          deletePayment?.vehicle?.registration_no || "this vehicle"
        }? This action cannot be undone.`}
      />

      <PaymentModal
        isOpen={!!editPayment}
        onClose={() => setEditPayment(null)}
        payment={editPayment}
        onSuccess={() => {
          fetchData(pagination.page, pagination.limit);
          setEditPayment(null);
        }}
      />
    </div>
  );
};

export default ResidencePayments;
