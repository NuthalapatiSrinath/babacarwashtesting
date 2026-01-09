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
  Receipt,
  Wallet,
  Calendar,
} from "lucide-react";
import toast from "react-hot-toast";

// Components
import DataTable from "../../components/DataTable";
import ReceiptModal from "../../components/modals/ReceiptModal";
import ResidenceReceiptModal from "../../components/modals/ResidenceReceiptModal";
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

  const { payments, stats, loading } = useSelector(
    (state) => state.residencePayment
  );
  const { workers } = useSelector((state) => state.worker);

  // --- Dates Helper ---
  const getDateString = (dateObj) => {
    const local = new Date(dateObj);
    local.setMinutes(local.getMinutes() - local.getTimezoneOffset());
    return local.toISOString().split("T")[0];
  };

  const getToday = () => getDateString(new Date());

  const getLast10Days = () => {
    const d = new Date();
    d.setDate(d.getDate() - 10);
    return getDateString(d);
  };

  // --- Filters ---
  const [filters, setFilters] = useState({
    startDate: getLast10Days(),
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
  const [activeModal, setActiveModal] = useState(null);

  const [viewPayment, setViewPayment] = useState(null);
  const [deletePayment, setDeletePayment] = useState(null);
  const [editPayment, setEditPayment] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    dispatch(fetchWorkers({ page: 1, limit: 1000, status: 1 }));
    fetchData(1, 10);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        startDate: getLast10Days(),
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
    const docData = {
      id: row._id || row.id,
      createdAt: row.createdAt,
      vehicle: {
        registration_no: row.vehicle?.registration_no,
        parking_no: row.vehicle?.parking_no,
      },
      customer: row.customer,
      building: row.customer?.building,
      mall: row.mall,
      amount_paid: row.amount_paid,
      amount_charged: row.amount_charged,
      old_balance: row.old_balance,
      total_amount: row.total_amount,
      balance: row.balance,
      tip: row.tip_amount,
      payment_mode: row.payment_mode,
      status: row.status,
      settled: row.settled,
      worker: row.worker,
      service_type: "residence",
      billAmountDesc: row.createdAt
        ? `For the month of ${new Date(row.createdAt).toLocaleDateString(
            "en-US",
            { month: "long" }
          )}`
        : "",
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

  // --- RENDER EXPANDED ROW ---
  const renderExpandedRow = (row) => {
    const cust = row.customer || {};
    const vehicle = row.vehicle || {};
    const detailedVehicle =
      cust.vehicles?.find((v) => v._id === vehicle._id) || vehicle;

    return (
      <div className="bg-slate-50 p-4 border-t border-slate-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
          <div className="bg-white p-3 rounded border border-slate-200">
            <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
              Customer
            </span>
            <div className="font-bold text-slate-800">
              {cust.firstName || cust.lastName
                ? `${cust.firstName} ${cust.lastName}`
                : "Guest"}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              {cust.mobile || "-"}
            </div>
            {cust.email && (
              <div className="text-xs text-blue-500 mt-0.5">{cust.email}</div>
            )}
          </div>
          <div className="bg-white p-3 rounded border border-slate-200">
            <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
              Location
            </span>
            <div className="flex items-center gap-1.5 font-medium text-slate-700">
              <Building className="w-3.5 h-3.5" />
              {row.building?.name || cust.building?.name || "-"}
            </div>
            <div className="text-xs text-slate-500 mt-1 pl-5">
              Flat: {cust.flat_no || "-"}
            </div>
          </div>
          <div className="bg-white p-3 rounded border border-slate-200">
            <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
              Vehicle Details
            </span>
            <div className="flex justify-between">
              <span className="text-slate-500 text-xs">Type:</span>
              <span className="font-medium text-slate-700 capitalize">
                {detailedVehicle.vehicle_type || "Sedan"}
              </span>
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-slate-500 text-xs">Parking:</span>
              <span className="font-medium text-slate-700">
                {detailedVehicle.parking_no || "-"}
              </span>
            </div>
          </div>
          <div className="bg-white p-3 rounded border border-slate-200">
            <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
              Timestamps
            </span>
            <div className="flex justify-between">
              <span className="text-slate-500 text-xs">Created:</span>
              <span className="font-mono text-xs">
                {new Date(row.createdAt).toLocaleDateString()}
              </span>
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-slate-500 text-xs">Updated:</span>
              <span className="font-mono text-xs">
                {new Date(row.updatedAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // --- COLUMNS ---
  const columns = [
    {
      header: "#",
      accessor: "id",
      className: "w-12 text-center",
      render: (row, idx) => (
        <div className="flex justify-center">
          <span className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs font-mono border border-slate-200">
            {(pagination.page - 1) * pagination.limit + idx + 1}
          </span>
        </div>
      ),
    },
    {
      header: "Date",
      accessor: "createdAt",
      className: "w-28",
      render: (row) => {
        if (!row.createdAt) return null;
        return (
          <div className="flex flex-col">
            <span className="text-slate-700 font-bold text-xs">
              {new Date(row.createdAt).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
              })}
            </span>
            <span className="text-[10px] text-slate-400 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {new Date(row.createdAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        );
      },
    },
    {
      header: "Vehicle Info",
      accessor: "vehicle.registration_no",
      render: (row) => {
        const regNo = row.vehicle?.registration_no;
        if (!regNo) return null;
        return (
          <div className="flex flex-col gap-1">
            <span className="font-bold text-slate-700 text-xs bg-slate-100 px-2 py-1 rounded w-fit border border-slate-200">
              {regNo}
            </span>
            {row.vehicle?.parking_no && (
              <span className="text-[10px] text-slate-500 ml-1">
                Slot: {row.vehicle.parking_no}
              </span>
            )}
          </div>
        );
      },
    },
    // --- Helper for Numeric Columns: Show 0 but hide null/undefined ---
    {
      header: "Actual",
      accessor: "amount_charged",
      className: "text-right",
      render: (row) =>
        row.amount_charged !== undefined && row.amount_charged !== null ? (
          <span className="font-medium text-slate-600 text-xs">
            {row.amount_charged}
          </span>
        ) : null,
    },
    {
      header: "Last Bal",
      accessor: "old_balance",
      className: "text-right",
      render: (row) =>
        row.old_balance !== undefined && row.old_balance !== null ? (
          <span className="text-slate-400 text-xs">{row.old_balance}</span>
        ) : null,
    },
    {
      header: "Total",
      accessor: "total_amount",
      className: "text-right",
      render: (row) =>
        row.total_amount !== undefined && row.total_amount !== null ? (
          <span className="font-bold text-indigo-600 text-sm">
            {row.total_amount}
          </span>
        ) : null,
    },
    {
      header: "Paid",
      accessor: "amount_paid",
      className: "text-right",
      render: (row) =>
        row.amount_paid !== undefined && row.amount_paid !== null ? (
          <span className="font-bold text-emerald-600 text-sm">
            {row.amount_paid}
          </span>
        ) : null,
    },
    {
      header: "Balance",
      accessor: "balance",
      className: "text-right",
      render: (row) =>
        row.balance !== undefined && row.balance !== null ? (
          <span
            className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
              row.balance > 0
                ? "bg-rose-50 text-rose-600 border-rose-100"
                : "bg-slate-50 text-slate-400 border-slate-100"
            }`}
          >
            {row.balance}
          </span>
        ) : null,
    },
    {
      header: "Mode",
      accessor: "payment_mode",
      className: "text-center",
      render: (row) =>
        row.payment_mode ? (
          <span className="text-[10px] font-bold uppercase text-slate-500 bg-gray-50 border border-gray-200 px-1.5 py-0.5 rounded">
            {row.payment_mode}
          </span>
        ) : null,
    },
    {
      header: "Status",
      accessor: "status",
      className: "text-center w-24",
      render: (row) => {
        if (!row.status) return null;
        const s = row.status.toUpperCase();
        const isCompleted = s === "COMPLETED";
        return (
          <span
            className={`text-[10px] font-bold px-2 py-1 rounded-full border ${
              isCompleted
                ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                : "bg-amber-50 text-amber-600 border-amber-100"
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
      render: (row) => {
        if (!row.worker?.name) return null;
        return (
          <div className="flex items-center gap-1.5">
            <User className="w-3 h-3 text-slate-400" />
            <span
              className="text-xs font-semibold text-slate-700 truncate max-w-[80px]"
              title={row.worker.name}
            >
              {row.worker.name}
            </span>
          </div>
        );
      },
    },
    {
      header: "Invoice",
      className: "text-center w-16",
      render: (row) => (
        <button
          onClick={() => handleOpenDoc(row, "Invoice")}
          className="text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all p-1.5 rounded-lg"
          title="View Tax Invoice"
        >
          <Receipt className="w-4 h-4 mx-auto" />
        </button>
      ),
    },
    {
      header: "Receipt",
      className: "text-center w-16",
      render: (row) => (
        <button
          onClick={() => handleOpenDoc(row, "Receipt")}
          className="text-emerald-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all p-1.5 rounded-lg"
          title="View Receipt"
        >
          <FileText className="w-4 h-4 mx-auto" />
        </button>
      ),
    },
    {
      header: "Actions",
      className:
        "text-right w-24 sticky right-0 bg-white shadow-[-5px_0_10px_-5px_rgba(0,0,0,0.05)]",
      render: (row) => (
        <div className="flex items-center justify-end gap-1 px-2">
          <button
            onClick={() => handleViewDetails(row)}
            className="p-1.5 hover:bg-blue-50 rounded-lg text-slate-400 hover:text-blue-600 transition-colors"
            title="View Details"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleEdit(row)}
            className="p-1.5 hover:bg-indigo-50 rounded-lg text-slate-400 hover:text-indigo-600 transition-colors"
            title="Edit"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleDelete(row)}
            className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600 transition-colors"
            title="Delete"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    // FIX: Added 'p-6' padding to the main container to prevent sticking to edges
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6 font-sans">
      {/* --- HEADER --- */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-200">
              <Wallet className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-indigo-800 bg-clip-text text-transparent">
                Residence Payments
              </h1>
              <p className="text-sm text-slate-500 font-medium">
                Monthly recurring payments & invoices
              </p>
            </div>
          </div>

          <button
            onClick={handleExport}
            className="h-10 px-5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md hover:shadow-lg transition-all"
          >
            <Download className="w-4 h-4" /> Export Report
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-100 flex flex-col justify-center">
            <p className="text-xs font-bold text-indigo-500 uppercase tracking-wider mb-1">
              Total Revenue
            </p>
            <h3 className="text-2xl font-bold text-indigo-700">
              {stats.totalAmount || 0}{" "}
              <span className="text-sm font-normal text-indigo-400">AED</span>
            </h3>
          </div>

          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
              <Banknote className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">
                Cash
              </p>
              <p className="text-lg font-bold text-slate-700">
                {stats.cash || 0}
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">
                Card
              </p>
              <p className="text-lg font-bold text-slate-700">
                {stats.card || 0}
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
              <Landmark className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">
                Bank
              </p>
              <p className="text-lg font-bold text-slate-700">
                {stats.bank || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* --- FILTERS --- */}
      <div className="bg-white p-5 rounded-2xl shadow-md border border-slate-100 mb-6">
        <div className="flex flex-col xl:flex-row gap-4 items-end">
          <div className="w-full xl:w-auto min-w-[280px]">
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">
              Date Range
            </label>
            <RichDateRangePicker
              startDate={filters.startDate}
              endDate={filters.endDate}
              onChange={handleDateChange}
            />
          </div>

          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
            <div className="relative group">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">
                Payment Status
              </label>
              <select
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                className="w-full h-[42px] bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl px-4 text-sm text-slate-700 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all appearance-none cursor-pointer uppercase font-medium"
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
              </select>
              <Filter className="absolute right-3.5 top-[2.1rem] w-4 h-4 text-slate-400 pointer-events-none group-hover:text-indigo-500 transition-colors" />
            </div>

            <div className="relative group">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">
                Assigned Worker
              </label>
              <select
                name="worker"
                value={filters.worker}
                onChange={handleFilterChange}
                className="w-full h-[42px] bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl px-4 text-sm text-slate-700 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all appearance-none cursor-pointer font-medium"
              >
                <option value="">All Workers</option>
                {workers.map((w) => (
                  <option key={w._id} value={w._id}>
                    {w.name}
                  </option>
                ))}
              </select>
              <User className="absolute right-3.5 top-[2.1rem] w-4 h-4 text-slate-400 pointer-events-none group-hover:text-indigo-500 transition-colors" />
            </div>
          </div>

          <div className="w-full xl:w-64 relative">
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="w-full h-[42px] pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all"
              />
            </div>
          </div>

          <button
            onClick={handleSearch}
            className="h-[42px] px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md hover:shadow-xl transition-all flex items-center gap-2 active:scale-95"
          >
            <Search className="w-4 h-4" /> Search
          </button>
        </div>
      </div>

      {/* --- TABLE --- */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden flex flex-col flex-1">
        <DataTable
          columns={columns}
          data={payments}
          loading={loading}
          pagination={pagination}
          onPageChange={(p) => fetchData(p, pagination.limit)}
          onLimitChange={(l) => fetchData(1, l)}
          renderExpandedRow={renderExpandedRow}
        />
      </div>

      {/* --- MODALS --- */}
      <ResidenceReceiptModal
        isOpen={!!selectedRecord && activeModal === "invoice"}
        onClose={handleCloseModals}
        data={selectedRecord}
        type="Invoice"
      />

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
        message={`Are you sure you want to delete the payment?`}
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
