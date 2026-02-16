import React, { useState, useEffect } from "react";
import { oneWashService } from "../../api/oneWashService";
import {
  Search,
  Calendar,
  DollarSign,
  User,
  Car,
  MapPin,
  CheckCircle,
  Clock,
  XCircle,
  Loader2,
  Filter,
  Download,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Eye,
  Edit,
  AlertCircle,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  Target,
  Zap,
  Award,
  Percent,
  CreditCard,
  Banknote,
  Wallet,
  FileText,
  Grid,
  List,
} from "lucide-react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  ComposedChart,
} from "recharts";

const SupervisorWashes = () => {
  const [washes, setWashes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [serviceFilter, setServiceFilter] = useState("all");
  const [dateRange, setDateRange] = useState({
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
  });
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState("table");
  const [selectedWash, setSelectedWash] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [comparisonPeriod, setComparisonPeriod] = useState("today");

  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    pending: 0,
    cancelled: 0,
    totalRevenue: 0,
    cashPayments: 0,
    cardPayments: 0,
    bankPayments: 0,
    avgRevenue: 0,
  });

  // Date presets
  const datePresets = [
    { label: "Today", value: "today" },
    { label: "Yesterday", value: "yesterday" },
    { label: "Last 7 Days", value: "last7days" },
    { label: "Last 30 Days", value: "last30days" },
    { label: "This Month", value: "thismonth" },
  ];

  useEffect(() => {
    fetchWashes();
  }, [dateRange]);

  const fetchWashes = async () => {
    try {
      setLoading(true);
      // Backend automatically filters washes based on supervisor's workers
      const response = await oneWashService.list({
        pageNo: 0,
        pageSize: 1000,
        search: "",
      });

      const washesData = response.data || [];
      setWashes(washesData);
      calculateStats(washesData);
    } catch (error) {
      console.error("❌ Failed to fetch washes:", error);
      setWashes([]);
      toast.error("Failed to load washes");
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (washesData) => {
    const completed = washesData.filter((w) => w.status === "completed");
    const pending = washesData.filter((w) => w.status === "pending");
    const cancelled = washesData.filter((w) => w.status === "cancelled");

    const totalRevenue = completed.reduce(
      (sum, w) => sum + (w.total_amount || 0),
      0,
    );
    const cashPayments = completed
      .filter((w) => w.payment_mode === "cash")
      .reduce((sum, w) => sum + (w.total_amount || 0), 0);
    const cardPayments = completed
      .filter((w) => w.payment_mode === "card")
      .reduce((sum, w) => sum + (w.total_amount || 0), 0);
    const bankPayments = completed
      .filter((w) => w.payment_mode === "bank")
      .reduce((sum, w) => sum + (w.total_amount || 0), 0);

    setStats({
      total: washesData.length,
      completed: completed.length,
      pending: pending.length,
      cancelled: cancelled.length,
      totalRevenue,
      cashPayments,
      cardPayments,
      bankPayments,
      avgRevenue:
        completed.length > 0 ? Math.round(totalRevenue / completed.length) : 0,
    });
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchWashes();
    setRefreshing(false);
    toast.success("Washes refreshed");
  };

  const handleDatePreset = (preset) => {
    const today = new Date();
    let startDate, endDate;

    switch (preset) {
      case "today":
        startDate = endDate = today.toISOString().split("T")[0];
        break;
      case "yesterday":
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        startDate = endDate = yesterday.toISOString().split("T")[0];
        break;
      case "last7days":
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        startDate = sevenDaysAgo.toISOString().split("T")[0];
        endDate = today.toISOString().split("T")[0];
        break;
      case "last30days":
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        startDate = thirtyDaysAgo.toISOString().split("T")[0];
        endDate = today.toISOString().split("T")[0];
        break;
      case "thismonth":
        startDate = new Date(today.getFullYear(), today.getMonth(), 1)
          .toISOString()
          .split("T")[0];
        endDate = today.toISOString().split("T")[0];
        break;
      default:
        return;
    }

    setDateRange({ startDate, endDate });
    setComparisonPeriod(preset);
  };

  const handleExportCSV = () => {
    const csvData = [
      [
        "Date",
        "Customer",
        "Mobile",
        "Car Number",
        "Worker",
        "Service",
        "Amount",
        "Payment",
        "Status",
      ],
      ...filteredWashes.map((w) => [
        w.createdAt ? format(new Date(w.createdAt), "dd/MM/yyyy") : "N/A",
        w.customer?.name || "N/A",
        w.customer?.mobile || "N/A",
        w.car_number || "N/A",
        w.worker?.name || "N/A",
        w.service_type || "N/A",
        w.total_amount || 0,
        w.payment_mode || "N/A",
        w.status || "N/A",
      ]),
    ];

    const csv = csvData.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `washes-${new Date().getTime()}.csv`;
    a.click();
    toast.success("Washes exported successfully");
  };

  const filteredWashes = washes.filter((wash) => {
    const matchesSearch =
      wash.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      wash.customer?.mobile?.includes(searchTerm) ||
      wash.car_number?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || wash.status === statusFilter;
    const matchesPayment =
      paymentFilter === "all" || wash.payment_mode === paymentFilter;
    const matchesService =
      serviceFilter === "all" || wash.service_type === serviceFilter;

    return matchesSearch && matchesStatus && matchesPayment && matchesService;
  });

  // Mock trend data (replace with real data)
  const revenueData = [
    { name: "Mon", revenue: 3200, jobs: 12 },
    { name: "Tue", revenue: 4100, jobs: 15 },
    { name: "Wed", revenue: 4800, jobs: 18 },
    { name: "Thu", revenue: 3700, jobs: 14 },
    { name: "Fri", revenue: 5500, jobs: 20 },
    { name: "Sat", revenue: 4600, jobs: 17 },
    { name: "Sun", revenue: 4200, jobs: 16 },
  ];

  const statusDistribution = [
    { name: "Completed", value: stats.completed, color: "#10b981" },
    { name: "Pending", value: stats.pending, color: "#f59e0b" },
    { name: "Cancelled", value: stats.cancelled, color: "#ef4444" },
  ];

  const paymentDistribution = [
    { name: "Cash", value: stats.cashPayments, color: "#10b981" },
    { name: "Card", value: stats.cardPayments, color: "#3b82f6" },
    { name: "Bank", value: stats.bankPayments, color: "#8b5cf6" },
  ];

  const COLORS = {
    completed: "#10b981",
    pending: "#f59e0b",
    cancelled: "#ef4444",
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Loader2 className="w-16 h-16 animate-spin text-primary mx-auto mb-4" />
          <p className="text-text-muted font-medium">Loading Washes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold flex items-center gap-3">
              <Car className="w-10 h-10" />
              Washes Overview
            </h1>
            <p className="text-green-100 mt-2 text-sm md:text-base">
              Track and manage all wash jobs from your team
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
              <RefreshCw
                className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
              />
              Refresh
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg font-semibold flex items-center gap-2 transition-all"
            >
              <Filter className="w-4 h-4" />
              Filters
              {showFilters ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleExportCSV}
              className="px-4 py-2 bg-white text-green-600 hover:bg-green-50 rounded-lg font-semibold flex items-center gap-2 transition-all shadow-lg"
            >
              <Download className="w-4 h-4" />
              Export
            </motion.button>
          </div>
        </div>

        {/* Date Presets */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-6 pt-6 border-t border-white/20"
            >
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 mb-4">
                {datePresets.map((preset) => (
                  <button
                    key={preset.value}
                    onClick={() => handleDatePreset(preset.value)}
                    className={`px-3 py-2 rounded-lg font-medium text-sm transition-all ${
                      comparisonPeriod === preset.value
                        ? "bg-white text-green-600 shadow-lg"
                        : "bg-white/10 hover:bg-white/20"
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              <div className="flex flex-col md:flex-row gap-3">
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-2">
                    From Date
                  </label>
                  <input
                    type="date"
                    value={dateRange.startDate}
                    onChange={(e) =>
                      setDateRange({ ...dateRange, startDate: e.target.value })
                    }
                    className="px-4 py-2 rounded-lg bg-white/20 backdrop-blur-sm border border-white/30 text-white w-full"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-2">
                    To Date
                  </label>
                  <input
                    type="date"
                    value={dateRange.endDate}
                    onChange={(e) =>
                      setDateRange({ ...dateRange, endDate: e.target.value })
                    }
                    className="px-4 py-2 rounded-lg bg-white/20 backdrop-blur-sm border border-white/30 text-white w-full"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Washes"
          value={stats.total}
          icon={Car}
          color="blue"
          trend={{ value: 12.5, isPositive: true }}
        />
        <StatCard
          title="Completed"
          value={stats.completed}
          icon={CheckCircle}
          color="green"
          subtitle={`${stats.total > 0 ? ((stats.completed / stats.total) * 100).toFixed(1) : 0}% completion rate`}
        />
        <StatCard
          title="Pending"
          value={stats.pending}
          icon={Clock}
          color="yellow"
          subtitle="In progress"
        />
        <StatCard
          title="Total Revenue"
          value={`₹${stats.totalRevenue.toLocaleString()}`}
          icon={DollarSign}
          color="purple"
          trend={{ value: 8.2, isPositive: true }}
        />
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Cash Payments"
          value={`₹${stats.cashPayments.toLocaleString()}`}
          percentage={
            stats.totalRevenue > 0
              ? ((stats.cashPayments / stats.totalRevenue) * 100).toFixed(1)
              : 0
          }
          icon={Banknote}
          color="emerald"
        />
        <MetricCard
          title="Card Payments"
          value={`₹${stats.cardPayments.toLocaleString()}`}
          percentage={
            stats.totalRevenue > 0
              ? ((stats.cardPayments / stats.totalRevenue) * 100).toFixed(1)
              : 0
          }
          icon={CreditCard}
          color="blue"
        />
        <MetricCard
          title="Bank Transfers"
          value={`₹${stats.bankPayments.toLocaleString()}`}
          percentage={
            stats.totalRevenue > 0
              ? ((stats.bankPayments / stats.totalRevenue) * 100).toFixed(1)
              : 0
          }
          icon={Wallet}
          color="purple"
        />
        <MetricCard
          title="Avg Revenue/Wash"
          value={`₹${stats.avgRevenue}`}
          percentage={100}
          icon={Target}
          color="indigo"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-lg">
          <h3 className="text-lg font-bold text-text-main mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-green-600" />
            Revenue Trend (Last 7 Days)
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <ComposedChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip />
              <Legend />
              <Bar
                dataKey="revenue"
                fill="#10b981"
                name="Revenue (₹)"
                radius={[8, 8, 0, 0]}
              />
              <Line
                type="monotone"
                dataKey="jobs"
                stroke="#3b82f6"
                strokeWidth={2}
                name="Jobs"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Status Distribution */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-lg">
          <h3 className="text-lg font-bold text-text-main mb-4 flex items-center gap-2">
            <PieChartIcon className="w-5 h-5 text-green-600" />
            Status Distribution
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={statusDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => `${entry.name}: ${entry.value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {statusDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Payment Distribution */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-lg">
        <h3 className="text-lg font-bold text-text-main mb-4 flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-green-600" />
          Payment Method Distribution
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={paymentDistribution} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis type="number" stroke="#6b7280" />
            <YAxis
              dataKey="name"
              type="category"
              stroke="#6b7280"
              width={100}
            />
            <Tooltip />
            <Legend />
            <Bar
              dataKey="value"
              fill="#10b981"
              name="Amount (₹)"
              radius={[0, 8, 8, 0]}
            >
              {paymentDistribution.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Filters & Search */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-lg">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by customer, mobile, or car number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:border-green-500 focus:ring-2 focus:ring-green-500/20 outline-none"
            />
          </div>

          {/* Filters */}
          <div className="flex gap-3 flex-wrap">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:border-green-500 outline-none"
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="cancelled">Cancelled</option>
            </select>

            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:border-green-500 outline-none"
            >
              <option value="all">All Payments</option>
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="bank">Bank</option>
            </select>

            <select
              value={serviceFilter}
              onChange={(e) => setServiceFilter(e.target.value)}
              className="px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:border-green-500 outline-none"
            >
              <option value="all">All Services</option>
              <option value="residence">Residence</option>
              <option value="commercial">Commercial</option>
            </select>

            <div className="flex gap-1 bg-slate-100 dark:bg-slate-700 rounded-lg p-1">
              <button
                onClick={() => setViewMode("table")}
                className={`p-2 rounded transition-all ${
                  viewMode === "table"
                    ? "bg-white dark:bg-slate-600 shadow"
                    : "hover:bg-slate-200 dark:hover:bg-slate-600"
                }`}
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded transition-all ${
                  viewMode === "grid"
                    ? "bg-white dark:bg-slate-600 shadow"
                    : "hover:bg-slate-200 dark:hover:bg-slate-600"
                }`}
              >
                <Grid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="flex justify-between items-center px-2">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Showing <span className="font-bold">{filteredWashes.length}</span> of{" "}
          <span className="font-bold">{washes.length}</span> washes
        </p>
      </div>

      {/* Washes Display */}
      {filteredWashes.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl">
          <Car className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 text-lg font-medium">No washes found</p>
          <p className="text-slate-400 text-sm mt-2">
            Try adjusting your filters
          </p>
        </div>
      ) : viewMode === "table" ? (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="text-left p-4 font-semibold text-slate-700 dark:text-slate-300">
                    Date
                  </th>
                  <th className="text-left p-4 font-semibold text-slate-700 dark:text-slate-300">
                    Customer
                  </th>
                  <th className="text-left p-4 font-semibold text-slate-700 dark:text-slate-300">
                    Car Number
                  </th>
                  <th className="text-left p-4 font-semibold text-slate-700 dark:text-slate-300">
                    Worker
                  </th>
                  <th className="text-left p-4 font-semibold text-slate-700 dark:text-slate-300">
                    Service
                  </th>
                  <th className="text-left p-4 font-semibold text-slate-700 dark:text-slate-300">
                    Amount
                  </th>
                  <th className="text-left p-4 font-semibold text-slate-700 dark:text-slate-300">
                    Payment
                  </th>
                  <th className="text-left p-4 font-semibold text-slate-700 dark:text-slate-300">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredWashes.map((wash) => (
                  <WashRow key={wash._id} wash={wash} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredWashes.map((wash) => (
            <WashCard key={wash._id} wash={wash} />
          ))}
        </div>
      )}
    </div>
  );
};

/* Stat Card Component */
const StatCard = ({ title, value, icon: Icon, color, trend, subtitle }) => {
  const colorClasses = {
    blue: {
      bg: "bg-blue-50",
      text: "text-blue-600",
      border: "border-blue-200",
    },
    green: {
      bg: "bg-green-50",
      text: "text-green-600",
      border: "border-green-200",
    },
    yellow: {
      bg: "bg-yellow-50",
      text: "text-yellow-600",
      border: "border-yellow-200",
    },
    purple: {
      bg: "bg-purple-50",
      text: "text-purple-600",
      border: "border-purple-200",
    },
  };

  const styles = colorClasses[color] || colorClasses.blue;

  return (
    <motion.div
      whileHover={{ y: -4, boxShadow: "0 10px 30px rgba(0,0,0,0.1)" }}
      className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6"
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-lg ${styles.bg} border ${styles.border}`}>
          <Icon className={`w-6 h-6 ${styles.text}`} />
        </div>
        {trend && (
          <div
            className={`flex items-center gap-1 text-sm font-semibold ${trend.isPositive ? "text-green-600" : "text-red-600"}`}
          >
            {trend.isPositive ? (
              <TrendingUp className="w-4 h-4" />
            ) : (
              <TrendingDown className="w-4 h-4" />
            )}
            {trend.value}%
          </div>
        )}
      </div>
      <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
        {title}
      </h3>
      <p className="text-2xl font-bold text-slate-900 dark:text-white">
        {value}
      </p>
      {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
    </motion.div>
  );
};

/* Metric Card */
const MetricCard = ({ title, value, percentage, icon: Icon, color }) => {
  const colorClasses = {
    emerald: "text-emerald-600 bg-emerald-50",
    blue: "text-blue-600 bg-blue-50",
    purple: "text-purple-600 bg-purple-50",
    indigo: "text-indigo-600 bg-indigo-50",
  };

  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        <span className="text-sm font-semibold text-slate-600">
          {percentage}%
        </span>
      </div>
      <h4 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
        {title}
      </h4>
      <p className="text-xl font-bold text-slate-900 dark:text-white">
        {value}
      </p>
      <div className="mt-2 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-green-500 to-emerald-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

/* Wash Row Component */
const WashRow = ({ wash }) => {
  const statusConfig = {
    completed: {
      label: "Completed",
      icon: CheckCircle,
      className: "bg-green-50 text-green-600",
    },
    pending: {
      label: "Pending",
      icon: Clock,
      className: "bg-yellow-50 text-yellow-600",
    },
    cancelled: {
      label: "Cancelled",
      icon: XCircle,
      className: "bg-red-50 text-red-600",
    },
  };

  const status = statusConfig[wash.status] || statusConfig.pending;
  const StatusIcon = status.icon;

  return (
    <tr className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
      <td className="p-4">
        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
          <Calendar className="w-4 h-4" />
          {wash.createdAt
            ? format(new Date(wash.createdAt), "dd MMM yyyy")
            : "N/A"}
        </div>
      </td>
      <td className="p-4">
        <div>
          <p className="font-medium text-slate-900 dark:text-white">
            {wash.customer?.name || "N/A"}
          </p>
          <p className="text-xs text-slate-500">
            {wash.customer?.mobile || ""}
          </p>
        </div>
      </td>
      <td className="p-4">
        <span className="font-mono text-sm font-bold text-slate-900 dark:text-white">
          {wash.car_number || "N/A"}
        </span>
      </td>
      <td className="p-4">
        <span className="text-sm text-slate-600 dark:text-slate-400">
          {wash.worker?.name || "N/A"}
        </span>
      </td>
      <td className="p-4">
        <span className="px-3 py-1 bg-green-50 text-green-600 text-xs font-medium rounded-full">
          {wash.service_type || "N/A"}
        </span>
      </td>
      <td className="p-4">
        <span className="font-bold text-slate-900 dark:text-white">
          ₹{(wash.total_amount || 0).toLocaleString()}
        </span>
      </td>
      <td className="p-4">
        <span className="text-sm text-slate-600 dark:text-slate-400 capitalize">
          {wash.payment_mode || "N/A"}
        </span>
      </td>
      <td className="p-4">
        <div
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${status.className}`}
        >
          <StatusIcon className="w-3 h-3" />
          {status.label}
        </div>
      </td>
    </tr>
  );
};

/* Wash Card Component */
const WashCard = ({ wash }) => {
  const statusConfig = {
    completed: {
      label: "Completed",
      icon: CheckCircle,
      className: "bg-green-50 text-green-600 border-green-200",
    },
    pending: {
      label: "Pending",
      icon: Clock,
      className: "bg-yellow-50 text-yellow-600 border-yellow-200",
    },
    cancelled: {
      label: "Cancelled",
      icon: XCircle,
      className: "bg-red-50 text-red-600 border-red-200",
    },
  };

  const status = statusConfig[wash.status] || statusConfig.pending;
  const StatusIcon = status.icon;

  return (
    <motion.div
      whileHover={{ y: -4, boxShadow: "0 15px 40px rgba(0,0,0,0.15)" }}
      className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5"
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <h4 className="font-bold text-slate-900 dark:text-white">
            {wash.customer?.name || "N/A"}
          </h4>
          <p className="text-sm text-slate-500">
            {wash.customer?.mobile || ""}
          </p>
        </div>
        <div
          className={`px-3 py-1 rounded-full border text-xs font-bold flex items-center gap-1 ${status.className}`}
        >
          <StatusIcon className="w-3 h-3" />
          {status.label}
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
          <Car className="w-4 h-4" />
          <span className="font-mono font-bold">
            {wash.car_number || "N/A"}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
          <User className="w-4 h-4" />
          <span>Worker: {wash.worker?.name || "N/A"}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
          <Calendar className="w-4 h-4" />
          <span>
            {wash.createdAt
              ? format(new Date(wash.createdAt), "dd MMM yyyy")
              : "N/A"}
          </span>
        </div>
      </div>

      <div className="pt-4 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
        <span className="text-2xl font-bold text-green-600">
          ₹{(wash.total_amount || 0).toLocaleString()}
        </span>
        <span className="text-sm text-slate-500 capitalize">
          {wash.payment_mode || "N/A"}
        </span>
      </div>
    </motion.div>
  );
};

export default SupervisorWashes;
