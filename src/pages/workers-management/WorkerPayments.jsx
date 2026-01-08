import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  Search,
  Filter,
  Check,
  Eye,
  Trash2,
  Banknote,
  CreditCard,
  Landmark,
} from "lucide-react";
import toast from "react-hot-toast";
import { paymentService } from "../../api/paymentService";
import { mallService } from "../../api/mallService";
import RichDateRangePicker from "../../components/inputs/RichDateRangePicker";
import DeleteModal from "../../components/modals/DeleteModal";

const WorkerPayments = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const worker = location.state?.worker || {};

  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState([]);
  const [malls, setMalls] = useState([]);

  // Stats State
  const [stats, setStats] = useState({
    totalPayments: 0,
    cashAmount: 0,
    cardAmount: 0,
    bankAmount: 0,
  });

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [mallFilter, setMallFilter] = useState("");

  // Date helper functions
  const getDateString = (dateObj) => {
    const local = new Date(dateObj);
    local.setMinutes(local.getMinutes() - local.getTimezoneOffset());
    return local.toISOString().split("T")[0];
  };

  const getToday = () => getDateString(new Date());
  const getFirstDayOfMonth = () => {
    const d = new Date();
    d.setDate(1);
    return getDateString(d);
  };

  const [dateRange, setDateRange] = useState({
    startDate: getFirstDayOfMonth(),
    endDate: getToday(),
  });

  // Modal states
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [isPaymentInfoOpen, setIsPaymentInfoOpen] = useState(false);
  const [viewPayment, setViewPayment] = useState(null);
  const [settleLoading, setSettleLoading] = useState(false);

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 1,
  });

  useEffect(() => {
    if (id) {
      loadMalls();
      fetchPayments();
    }
  }, [id]);

  const loadMalls = async () => {
    try {
      const res = await mallService.list(1, 1000);
      setMalls(res.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchPayments = async (page = 1, limit = 50) => {
    setLoading(true);
    try {
      console.log("🔍 [WORKER PAYMENTS] Fetching for worker:", id);

      const params = {
        onewash: "true",
        worker: id,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        ...(statusFilter ? { status: statusFilter } : {}),
        ...(mallFilter ? { mall: mallFilter } : {}),
        ...(searchTerm ? { search: searchTerm } : {}),
        pageNo: page - 1,
        pageSize: limit,
      };

      const response = await paymentService.list(
        page,
        limit,
        searchTerm,
        params
      );
      const paymentData = response.data || [];

      console.log(
        "✅ [WORKER PAYMENTS] Fetched:",
        paymentData.length,
        "payments"
      );
      setPayments(paymentData);
      calculateStats(paymentData);

      setPagination({
        page,
        limit,
        total: response.total || 0,
        totalPages: Math.ceil((response.total || 0) / limit) || 1,
      });
    } catch (error) {
      console.error("❌ [WORKER PAYMENTS] Error:", error);
      toast.error("Failed to load payments");
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data) => {
    const totalPayments = data.length;

    // Sum amounts by payment mode
    const cashAmount = data
      .filter((p) => p.payment_mode?.toLowerCase() === "cash")
      .reduce((sum, p) => sum + (p.amount_charged || p.amount || 0), 0);

    const cardAmount = data
      .filter((p) => p.payment_mode?.toLowerCase() === "card")
      .reduce((sum, p) => sum + (p.amount_charged || p.amount || 0), 0);

    const bankAmount = data
      .filter((p) => p.payment_mode?.toLowerCase() === "bank")
      .reduce((sum, p) => sum + (p.amount_charged || p.amount || 0), 0);

    setStats({
      totalPayments,
      cashAmount,
      cardAmount,
      bankAmount,
    });
  };

  const handleDateChange = (field, value) => {
    if (field === "clear") {
      setDateRange({
        startDate: getFirstDayOfMonth(),
        endDate: getToday(),
      });
    } else {
      setDateRange((prev) => ({ ...prev, [field]: value }));
    }
  };

  const handleSearch = () => {
    fetchPayments(1, pagination.limit);
  };

  const handleSettle = async (payment) => {
    const amount = payment.amount_charged || payment.amount || 0;
    if (!window.confirm(`Settle this payment of ₹${amount}?`)) {
      return;
    }

    setSettleLoading(true);
    try {
      await paymentService.settlePayment({
        paymentIds: [payment._id],
      });

      toast.success("Payment settled successfully");
      fetchPayments(pagination.page, pagination.limit);
    } catch (error) {
      console.error("Settle error:", error);
      toast.error(error.response?.data?.message || "Failed to settle payment");
    } finally {
      setSettleLoading(false);
    }
  };

  const handleView = (payment) => {
    setViewPayment(payment);
    setIsPaymentInfoOpen(true);
  };

  const handleDeleteClick = (payment) => {
    setPaymentToDelete(payment);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!paymentToDelete) return;

    setDeleteLoading(true);
    try {
      // await paymentService.delete(paymentToDelete._id);
      toast.success("Payment deleted successfully");
      setIsDeleteModalOpen(false);
      fetchPayments();
    } catch (error) {
      toast.error("Failed to delete payment");
    } finally {
      setDeleteLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    const day = date.toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
    });
    const time = date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
    return `${day}, ${time}`;
  };

  const formatDateOnly = (dateStr) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate("/workers/list")}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Back to Workers</span>
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
              Worker Payments
            </h1>
            {worker.name && (
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                {worker.name} {worker.mobile && `• ${worker.mobile}`}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="bg-blue-600 text-white rounded-lg shadow-lg p-4 mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-semibold">Total Payments</span>
          <span className="text-2xl font-bold">{stats.totalPayments}</span>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Banknote className="w-5 h-5" />
            <span className="text-xl font-bold">{stats.cashAmount}</span>
          </div>
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            <span className="text-xl font-bold">{stats.cardAmount}</span>
          </div>
          <div className="flex items-center gap-2">
            <Landmark className="w-5 h-5" />
            <span className="text-xl font-bold">{stats.bankAmount}</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          {/* Date Range */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Choose date
            </label>
            <RichDateRangePicker
              startDate={dateRange.startDate}
              endDate={dateRange.endDate}
              onChange={handleDateChange}
            />
          </div>

          {/* Search */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search vehicle, parking no..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-[50px] pl-10 pr-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Status Filter */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Select Status
            </label>
            <div className="relative">
              <Filter className="absolute left-3 top-3.5 w-4 h-4 text-gray-400 pointer-events-none" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full h-[50px] pl-10 pr-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm appearance-none cursor-pointer uppercase"
              >
                <option value="">All</option>
                <option value="completed">COMPLETED</option>
                <option value="pending">PENDING</option>
              </select>
            </div>
          </div>

          {/* Mall Filter */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Mall
            </label>
            <div className="relative">
              <Filter className="absolute left-3 top-3.5 w-4 h-4 text-gray-400 pointer-events-none" />
              <select
                value={mallFilter}
                onChange={(e) => setMallFilter(e.target.value)}
                className="w-full h-[50px] pl-10 pr-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm appearance-none cursor-pointer"
              >
                <option value="">All</option>
                {malls.map((mall) => (
                  <option key={mall._id} value={mall._id}>
                    {mall.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            onClick={handleSearch}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            Search
          </button>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : payments.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No payments found matching your filters
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                    Id
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                    Vehicle No
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                    Parking No
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                    Payment Mode
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                    Settle Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                    Worker
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {payments.map((payment, index) => {
                  const pageIndex =
                    (pagination.page - 1) * pagination.limit + index + 1;
                  // Use API settled field directly
                  const isSettled =
                    payment.settled?.toLowerCase() === "completed";

                  return (
                    <tr key={payment._id || index} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-800">
                        {pageIndex}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-800 whitespace-nowrap">
                        {formatDate(payment.completedDate || payment.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-800 font-medium">
                        {payment.amount_charged || payment.amount || 0}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-800">
                        {payment.vehicle?.registration_no || "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-800">
                        {payment.vehicle?.parking_no || "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-800 lowercase">
                        {payment.payment_mode || "-"}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`font-bold uppercase text-xs ${
                            payment.status?.toLowerCase() === "completed"
                              ? "text-green-600"
                              : "text-yellow-600"
                          }`}
                        >
                          {payment.status || "PENDING"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`font-bold uppercase text-xs ${
                            isSettled ? "text-green-600" : "text-yellow-600"
                          }`}
                        >
                          {isSettled ? "SETTLED" : "PENDING"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-800 uppercase truncate max-w-[120px]">
                        {worker.name || "N/A"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          {!isSettled && (
                            <button
                              onClick={() => handleSettle(payment)}
                              className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors"
                              title="Settle Payment"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleView(payment)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(payment)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      <DeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        loading={deleteLoading}
        title="Delete Payment"
        message="Are you sure you want to delete this payment record? This action cannot be undone."
      />

      {/* Payment Info Modal */}
      {isPaymentInfoOpen && viewPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-gray-800 mb-4">
              Payment Info
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Payment Generated</span>
                <span className="font-medium text-gray-800">
                  {formatDateOnly(viewPayment.createdAt)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Payment Received</span>
                <span className="font-medium text-gray-800">
                  {viewPayment.collectedDate
                    ? formatDateOnly(viewPayment.collectedDate)
                    : "-"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Payment Settled</span>
                <span className="font-medium text-gray-800">
                  {viewPayment.settledDate
                    ? formatDateOnly(viewPayment.settledDate)
                    : "-"}
                </span>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setIsPaymentInfoOpen(false)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkerPayments;
