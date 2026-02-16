import React, { useState, useEffect } from "react";
import { supervisorService } from "../../api/supervisorService";
import { workerService } from "../../api/workerService";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Eye,
  Phone,
  MapPin,
  Building2,
  ShoppingBag,
  CheckCircle,
  XCircle,
  Loader2,
  Users,
  Download,
  RefreshCw,
  History,
  Calendar,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import DataTable from "../../components/DataTable";
import DateRangePicker from "../../components/DateRangePicker";


const SupervisorWorkers = () => {
  const navigate = useNavigate();
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [total, setTotal] = useState(0);

  // History Modal State
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyLimit, setHistoryLimit] = useState(10);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 7))
      .toISOString()
      .split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    fetchTeam();
  }, [page, limit, search, statusFilter]);

  const fetchTeam = async () => {
    try {
      setLoading(true);
      const params = {
        pageNo: page - 1,
        pageSize: limit,
        search: search || "",
      };

      if (statusFilter) {
        params.status = statusFilter;
      }

      const response = await supervisorService.getTeam(params);
      setWorkers(response.data || []);
      setTotal(response.total || 0);
    } catch (error) {
      console.error("❌ Failed to fetch team:", error);
      setWorkers([]);
      setTotal(0);
      toast.error("Failed to load team members");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchTeam();
    setRefreshing(false);
    toast.success("Team list refreshed");
  };

  const handleExportCSV = () => {
    const csvData = [
      ["ID", "Name", "Mobile", "Service Type", "Buildings", "Status", "Deactivate Reason"],
      ...workers.map((w) => [
        w.id || "",
        w.name || "",
        w.mobile || "",
        w.service_type || "",
        w.buildings?.length || 0,
        w.status === 1 ? "Active" : w.status === 2 ? "Inactive" : "Unknown",
        w.deactivateReason || "",
      ]),
    ];

    const csv = csvData.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `team-${new Date().getTime()}.csv`;
    a.click();
    toast.success("Team list exported");
  };

  const handleViewHistory = async (worker) => {
    setSelectedWorker(worker);
    setShowHistoryModal(true);
    await fetchWorkerHistory(worker._id);
  };

  const fetchWorkerHistory = async (workerId) => {
    try {
      setHistoryLoading(true);
      const params = {
        pageNo: historyPage - 1,
        pageSize: historyLimit,
        search: "",
        startDate: new Date(dateRange.startDate).toISOString(),
        endDate: new Date(new Date(dateRange.endDate).setHours(23, 59, 59)).toISOString(),
        service_type: selectedWorker?.service_type || "residence",
      };

      const response = await workerService.getHistory(workerId, params);
      setHistory(response.data || []);
      setHistoryTotal(response.total || 0);
    } catch (error) {
      console.error("❌ Failed to fetch worker history:", error);
      setHistory([]);
      setHistoryTotal(0);
      toast.error("Failed to load worker history");
    } finally {
      setHistoryLoading(false);
    }
  };

  const columns = [
    {
      header: "ID",
      accessor: "id",
      render: (row) => (
        <span className="font-mono text-sm text-slate-600">{row.id || "N/A"}</span>
      ),
    },
    {
      header: "Name",
      accessor: "name",
      render: (row) => (
        <div>
          <p className="font-semibold text-slate-900 dark:text-white">{row.name}</p>
          <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
            <Phone className="w-3 h-3" />
            {row.mobile}
          </p>
        </div>
      ),
    },
    {
      header: "Service Type",
      accessor: "service_type",
      render: (row) => (
        <span
          className={`px-3 py-1 rounded-full text-xs font-bold ${
            row.service_type === "residence"
              ? "bg-blue-100 text-blue-700"
              : "bg-purple-100 text-purple-700"
          }`}
        >
          {row.service_type || "N/A"}
        </span>
      ),
    },
    {
      header: "Buildings",
      accessor: "buildings",
      render: (row) => (
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Building2 className="w-4 h-4" />
          <span>{row.buildings?.length || 0}</span>
        </div>
      ),
    },
    {
      header: "Status",
      accessor: "status",
      render: (row) => {
        const statusConfig = {
          1: { label: "Active", className: "bg-green-100 text-green-700", icon: CheckCircle },
          2: { label: "Inactive", className: "bg-red-100 text-red-700", icon: XCircle },
        };
        const config = statusConfig[row.status] || statusConfig[2];
        const Icon = config.icon;

        return (
          <div>
            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${config.className}`}>
              <Icon className="w-3 h-3" />
              {config.label}
            </span>
            {row.status === 2 && row.deactivateReason && (
              <p className="text-xs text-slate-500 mt-1">Reason: {row.deactivateReason}</p>
            )}
          </div>
        );
      },
    },
    {
      header: "Actions",
      accessor: "_id",
      render: (row) => (
        <div className="flex gap-2">
          <button
            onClick={() => handleViewHistory(row)}
            className="px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-sm font-medium flex items-center gap-1 transition-colors"
          >
            <History className="w-4 h-4" />
            History
          </button>
          <button
            onClick={() => navigate(`/workers/${row._id}`)}
            className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg text-sm font-medium flex items-center gap-1 transition-colors"
          >
            <Eye className="w-4 h-4" />
            View
          </button>
        </div>
      ),
    },
  ];

  const historyColumns = [
    {
      header: "Date",
      accessor: "date",
      render: (row) => (
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="w-4 h-4 text-blue-600" />
          <span>{row.date ? new Date(row.date).toLocaleDateString() : "N/A"}</span>
        </div>
      ),
    },
    {
      header: "Customer",
      accessor: "customer",
      render: (row) => (
        <div>
          <p className="font-medium text-slate-900 dark:text-white">{row.customer?.name || "N/A"}</p>
          <p className="text-xs text-slate-500">{row.customer?.mobile || ""}</p>
        </div>
      ),
    },
    {
      header: "Building",
      accessor: "building",
      render: (row) => (
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-slate-500" />
          <span className="text-sm">{row.building?.name || "N/A"}</span>
        </div>
      ),
    },
    {
      header: "Amount",
      accessor: "amount",
      render: (row) => (
        <span className="font-bold text-green-600">
          ₹{(row.total_amount || 0).toLocaleString()}
        </span>
      ),
    },
    {
      header: "Payment Method",
      accessor: "payment_mode",
      render: (row) => (
        <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded text-xs font-medium capitalize">
          {row.payment_mode || "N/A"}
        </span>
      ),
    },
  ];

  if (loading && page === 1) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Loader2 className="w-16 h-16 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-slate-600 font-medium">Loading Team Members...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold flex items-center gap-3">
              <Users className="w-10 h-10" />
              My Team
            </h1>
            <p className="text-blue-100 mt-2 text-sm md:text-base">
              Manage and monitor workers assigned to your supervision
            </p>
          </div>

          <div className="flex gap-2 flex-wrap">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleRefresh}
              disabled={refreshing}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg font-semibold flex items-center gap-2 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleExportCSV}
              className="px-4 py-2 bg-white text-blue-600 hover:bg-blue-50 rounded-lg font-semibold flex items-center gap-2 transition-all shadow-lg"
            >
              <Download className="w-4 h-4" />
              Export
            </motion.button>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Workers"
          value={total}
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Active Workers"
          value={workers.filter((w) => w.status === 1).length}
          icon={CheckCircle}
          color="green"
        />
        <StatCard
          title="Inactive Workers"
          value={workers.filter((w) => w.status === 2).length}
          icon={XCircle}
          color="red"
        />
        <StatCard
          title="Residence Service"
          value={workers.filter((w) => w.service_type === "residence").length}
          icon={Building2}
          color="purple"
        />
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-lg">
        <div className="flex gap-4">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
          >
            <option value="">All Status</option>
            <option value="1">Active Only</option>
            <option value="2">Inactive Only</option>
          </select>
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        title="Team Members"
        columns={columns}
        data={workers}
        loading={loading}
        pagination={{
          page,
          limit,
          total,
        }}
        onPageChange={setPage}
        onLimitChange={(newLimit) => {
          setLimit(newLimit);
          setPage(1);
        }}
        onSearch={(value) => {
          setSearch(value);
          setPage(1);
        }}
        actionButton={
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </button>
        }
      />

      {/* History Modal */}
      <AnimatePresence>
        {showHistoryModal && selectedWorker && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowHistoryModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-slate-800 rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-6 text-white">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-bold mb-1">
                      {selectedWorker.name}'s History
                    </h2>
                    <p className="text-blue-100 text-sm">
                      View all jobs completed by this worker
                    </p>
                  </div>
                  <button
                    onClick={() => setShowHistoryModal(false)}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {/* Date Range Picker */}
                <div className="mt-4">
                  <DateRangePicker
                    startDate={dateRange.startDate}
                    endDate={dateRange.endDate}
                    onChange={(newRange) => {
                      setDateRange(newRange);
                      if (selectedWorker) {
                        fetchWorkerHistory(selectedWorker._id);
                      }
                    }}
                    className="text-white"
                  />
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-6">
                <DataTable
                  title={`Total Jobs: ${historyTotal}`}
                  columns={historyColumns}
                  data={history}
                  loading={historyLoading}
                  pagination={{
                    page: historyPage,
                    limit: historyLimit,
                    total: historyTotal,
                  }}
                  onPageChange={setHistoryPage}
                  onLimitChange={(newLimit) => {
                    setHistoryLimit(newLimit);
                    setHistoryPage(1);
                  }}
                  hideSearch={true}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* Stat Card Component */
const StatCard = ({ title, value, icon: Icon, color }) => {
  const colorClasses = {
    blue: {
      bg: "bg-blue-50 dark:bg-blue-900/20",
      text: "text-blue-600",
      border: "border-blue-200",
    },
    green: {
      bg: "bg-green-50 dark:bg-green-900/20",
      text: "text-green-600",
      border: "border-green-200",
    },
    red: {
      bg: "bg-red-50 dark:bg-red-900/20",
      text: "text-red-600",
      border: "border-red-200",
    },
    purple: {
      bg: "bg-purple-50 dark:bg-purple-900/20",
      text: "text-purple-600",
      border: "border-purple-200",
    },
  };

  const styles = colorClasses[color] || colorClasses.blue;

  return (
    <motion.div
      whileHover={{ y: -4, boxShadow: "0 10px 30px rgba(0,0,0,0.1)" }}
      className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 transition-all"
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-lg ${styles.bg} border ${styles.border}`}>
          <Icon className={`w-6 h-6 ${styles.text}`} />
        </div>
      </div>
      <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
        {title}
      </h3>
      <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
    </motion.div>
  );
};

export default SupervisorWorkers;
