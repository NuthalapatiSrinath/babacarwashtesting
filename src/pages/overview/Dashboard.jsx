import React, { useState, useEffect } from "react";
import { analyticsService } from "../../api/analyticsService";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ComposedChart,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Briefcase,
  Users,
  Car,
  CheckCircle,
  Clock,
  XCircle,
  Building,
  Activity,
  Calendar,
  ArrowUp,
  ArrowDown,
  Award,
  Target,
  Zap,
  BarChart3,
  PieChart as PieChartIcon,
  Download,
  RefreshCw,
  Filter,
  Eye,
  EyeOff,
  Sparkles,
  Package,
  Home,
  ShoppingBag,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import RichDateRangePicker from "../../components/inputs/RichDateRangePicker";
import CustomDropdown from "../../components/ui/CustomDropdown";
import DataTable from "../../components/DataTable";

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: "",
    endDate: "",
  });

  // State for all analytics data
  const [adminStats, setAdminStats] = useState(null);
  const [charts, setCharts] = useState(null);
  const [revenueTrends, setRevenueTrends] = useState([]);
  const [topWorkers, setTopWorkers] = useState([]);
  const [performanceHighlights, setPerformanceHighlights] = useState(null);
  const [serviceDistribution, setServiceDistribution] = useState([]);
  const [buildingAnalytics, setBuildingAnalytics] = useState([]);
  const [comparativeData, setComparativeData] = useState(null);

  // UI State
  const [selectedPeriod, setSelectedPeriod] = useState("all");
  const [showAdvancedCharts, setShowAdvancedCharts] = useState(true);

  // Fetch all dashboard data
  const fetchDashboardData = async (showLoader = true) => {
    if (showLoader) setLoading(true);
    else setRefreshing(true);

    try {
      const filters = dateRange.startDate && dateRange.endDate ? dateRange : {};

      // ✅ NEW: Single API call instead of 7 separate calls - SUPER FAST!
      const response = await analyticsService.getDashboardAll({
        ...filters,
        limit: 10,
      });
      const data = response.data;

      // Set all data from unified response
      if (data.adminStats) {
        setAdminStats(data.adminStats);
      }

      if (data.charts) {
        setCharts(data.charts);
      }

      if (data.revenueTrends) {
        setRevenueTrends(data.revenueTrends);
      }

      if (data.topWorkers) {
        console.log("✅ Top Workers Data:", data.topWorkers);
        setTopWorkers(data.topWorkers);
      }

      if (data.serviceDistribution) {
        console.log(
          "📊 Service Distribution received:",
          data.serviceDistribution,
        );
        setServiceDistribution(data.serviceDistribution);
      }

      if (data.buildingAnalytics) {
        console.log("✅ Building Analytics Data:", data.buildingAnalytics);
        // Normalize building data to ensure buildingName field exists
        const normalizedBuildings = data.buildingAnalytics.map((building) => ({
          ...building,
          buildingName:
            building.buildingName ||
            building.building_name ||
            building.name ||
            building.buildingId ||
            "Unknown Building",
        }));
        setBuildingAnalytics(normalizedBuildings);
      }

      if (data.comparativeData) {
        setComparativeData(data.comparativeData);
      }

      // Calculate performance highlights from unified data
      if (data.adminStats) {
        const stats = data.adminStats;

        console.log("📊 Admin Stats received:", stats);
        console.log("📊 Performance data:", stats.performance);

        // Use new performance object from backend if available
        if (stats.performance) {
          setPerformanceHighlights({
            avgJobsPerWorker: stats.performance.avgJobsPerWorker || 0,
            completionRate: stats.performance.completionRate || 0,
            avgRevenuePerJob: stats.performance.avgRevenuePerJob,
            collectionRate: stats.performance.collectionRate || 0,
            activeWorkersPercent:
              stats.performance.activeWorkersPercentage || 0,
            totalCustomerVehicles: stats.performance.totalVehicles || 0,
          });
          console.log("✅ Performance highlights set:", {
            avgJobsPerWorker: stats.performance.avgJobsPerWorker,
            completionRate: stats.performance.completionRate,
          });
        } else {
          // Fallback to calculating from old structure
          const workers = data.topWorkers || [];
          setPerformanceHighlights({
            avgJobsPerWorker:
              workers.length > 0
                ? Math.round(stats.jobs.total / stats.workers.active)
                : 0,
            completionRate:
              stats.jobs.total > 0
                ? Math.round((stats.jobs.completed / stats.jobs.total) * 100)
                : 0,
            avgRevenuePerJob: stats.payments.averagePerJob || null,
            collectionRate: stats.payments.collectionRate || 0,
            activeWorkersPercent:
              stats.workers.total > 0
                ? Math.round((stats.workers.active / stats.workers.total) * 100)
                : 0,
            totalCustomerVehicles: stats.customers.vehicles || 0,
          });
        }
      }

      if (!showLoader) {
        toast.success("Dashboard refreshed successfully");
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleDateRangeChange = (field, value) => {
    setDateRange((prev) => ({ ...prev, [field]: value }));
  };

  const handleApplyFilter = () => {
    if (dateRange.startDate && dateRange.endDate) {
      fetchDashboardData();
    } else {
      toast.error("Please select both start and end dates");
    }
  };

  const handleClearFilter = () => {
    setDateRange({ startDate: "", endDate: "" });
    setTimeout(() => fetchDashboardData(), 100);
  };

  const handleRefresh = () => {
    fetchDashboardData(false);
  };

  // Quick date filters
  const handleQuickFilter = (period) => {
    const endDate = new Date();
    let startDate = new Date();

    switch (period) {
      case "today":
        startDate.setHours(0, 0, 0, 0);
        break;
      case "week":
        // Exactly 7 days ago
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "month":
        // Exactly 30 days ago (not 1 calendar month)
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        break;
      case "quarter":
        // Exactly 90 days ago (not 3 calendar months)
        startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
        break;
      case "year":
        // Exactly 365 days ago
        startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        handleClearFilter();
        setSelectedPeriod("all");
        return;
    }

    console.log(`📅 ${period} filter:`, {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      daysDiff: Math.round((endDate - startDate) / (24 * 60 * 60 * 1000)),
    });

    setDateRange({
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    });
    setSelectedPeriod(period);
    setTimeout(() => fetchDashboardData(), 100);
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  // Format number with commas
  const formatNumber = (num) => {
    return new Intl.NumberFormat("en-IN").format(num || 0);
  };

  // Colors for charts
  const COLORS = {
    primary: "#6366f1",
    secondary: "#8b5cf6",
    success: "#10b981",
    warning: "#f59e0b",
    danger: "#ef4444",
    info: "#06b6d4",
    pink: "#ec4899",
    teal: "#14b8a6",
  };

  const CHART_COLORS = [
    "#6366f1",
    "#8b5cf6",
    "#ec4899",
    "#f59e0b",
    "#10b981",
    "#06b6d4",
    "#14b8a6",
    "#f43f5e",
  ];

  // Service type icons
  const SERVICE_ICONS = {
    residence: Home,
    commercial: Building,
    mall: ShoppingBag,
    onewash: Package,
  };

  // Animated Stat Card Component
  const StatCard = ({
    title,
    value,
    subtitle,
    icon: Icon,
    trend,
    trendValue,
    color,
    delay = 0,
  }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -5, scale: 1.02 }}
      className="group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-slate-200 overflow-hidden"
    >
      {/* Gradient Background */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}
      ></div>

      <div className="relative p-6">
        <div className="flex items-center justify-between mb-4">
          <div
            className={`p-3 rounded-xl bg-gradient-to-br ${color} shadow-lg group-hover:scale-110 transition-transform duration-300`}
          >
            <Icon className="w-6 h-6 text-white" />
          </div>
          {trend && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: delay + 0.3, type: "spring" }}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold shadow-md ${
                trend === "up"
                  ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white"
                  : "bg-gradient-to-r from-red-500 to-rose-500 text-white"
              }`}
            >
              {trend === "up" ? (
                <ArrowUp className="w-3 h-3" />
              ) : (
                <ArrowDown className="w-3 h-3" />
              )}
              {trendValue}%
            </motion.div>
          )}
        </div>
        <div>
          <h3 className="text-slate-600 text-sm font-semibold mb-2 uppercase tracking-wide">
            {title}
          </h3>
          {loading ? (
            <div className="h-9 bg-slate-200 rounded-lg animate-pulse"></div>
          ) : (
            <>
              <p className="text-3xl font-bold text-slate-900 mb-1 bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text">
                {value}
              </p>
              {subtitle && (
                <p className="text-xs text-slate-500 font-medium">{subtitle}</p>
              )}
            </>
          )}
        </div>
      </div>
    </motion.div>
  );

  // Top Worker Row Component
  const TopWorkerRow = ({ worker, index }) => {
    const medals = ["🥇", "🥈", "🥉"];

    // Extract worker name with fallbacks
    const workerName =
      worker.name ||
      worker.workerName ||
      worker.worker?.name ||
      worker.workerId ||
      "Unknown Worker";
    const workerPhone =
      worker.phone ||
      worker.mobile ||
      worker.phoneNumber ||
      worker.worker?.phone ||
      "N/A";

    return (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.1 }}
        className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-50 to-white rounded-xl hover:from-indigo-50 hover:to-purple-50 transition-all duration-300 border border-slate-100 hover:border-indigo-200 group"
      >
        <div className="flex items-center gap-4 flex-1">
          <div
            className={`flex items-center justify-center w-12 h-12 rounded-xl font-bold text-lg shadow-md transition-transform group-hover:scale-110 ${
              index === 0
                ? "bg-gradient-to-br from-yellow-400 to-yellow-500 text-white"
                : index === 1
                  ? "bg-gradient-to-br from-slate-300 to-slate-400 text-white"
                  : index === 2
                    ? "bg-gradient-to-br from-orange-400 to-orange-500 text-white"
                    : "bg-gradient-to-br from-indigo-400 to-indigo-500 text-white"
            }`}
          >
            {index < 3 ? medals[index] : index + 1}
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-slate-900 text-lg group-hover:text-indigo-600 transition-colors">
              {workerName}
            </h4>
            <p className="text-sm text-slate-500 font-medium">{workerPhone}</p>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="text-sm text-slate-500 font-medium">Jobs</p>
            <p className="text-xl font-bold text-slate-900">
              {formatNumber(worker.totalJobs)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-slate-500 font-medium">Revenue</p>
            <p className="text-xl font-bold text-emerald-600">
              {formatCurrency(worker.totalRevenue)}
            </p>
          </div>
        </div>
      </motion.div>
    );
  };

  if (loading && !adminStats) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="inline-block"
          >
            <Loader2 className="w-16 h-16 text-indigo-600" />
          </motion.div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mt-4 text-slate-600 font-semibold text-lg"
          >
            Loading dashboard...
          </motion.p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50 p-6">
      <div className="max-w-[1920px] mx-auto space-y-6">
        {/* Header with Actions */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
        >
          <div>
            <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2 flex items-center gap-3">
              <Sparkles className="w-10 h-10 text-indigo-600" />
              Dashboard
            </h1>
            <p className="text-slate-600 font-medium text-lg">
              Complete analytics and insights for your business
            </p>
          </div>

          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowAdvancedCharts(!showAdvancedCharts)}
              className={`px-4 py-2.5 rounded-xl font-semibold text-sm shadow-md transition-all flex items-center gap-2 ${
                showAdvancedCharts
                  ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700"
                  : "bg-white text-slate-700 hover:bg-slate-50 border border-slate-200"
              }`}
            >
              {showAdvancedCharts ? (
                <Eye className="w-4 h-4" />
              ) : (
                <EyeOff className="w-4 h-4" />
              )}
              {showAdvancedCharts ? "Hide" : "Show"} Charts
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleRefresh}
              disabled={refreshing}
              className="px-4 py-2.5 rounded-xl font-semibold text-sm bg-white text-slate-700 hover:bg-slate-50 shadow-md transition-all flex items-center gap-2 border border-slate-200 disabled:opacity-50"
            >
              <RefreshCw
                className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
              />
              Refresh
            </motion.button>
          </div>
        </motion.div>

        {/* Filters Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-xl p-6 border border-slate-200"
        >
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-bold text-slate-900">
              Filters & Date Range
            </h2>
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap gap-2 mb-4">
            {[
              { label: "All Time", value: "all" },
              { label: "Today", value: "today" },
              { label: "Last 7 Days", value: "week" },
              { label: "Last 30 Days", value: "month" },
              { label: "Last Quarter", value: "quarter" },
              { label: "Last Year", value: "year" },
            ].map((period) => (
              <motion.button
                key={period.value}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleQuickFilter(period.value)}
                className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                  selectedPeriod === period.value
                    ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {period.label}
              </motion.button>
            ))}
          </div>

          {/* Custom Date Range */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <div className="lg:col-span-3">
              <RichDateRangePicker
                startDate={dateRange.startDate}
                endDate={dateRange.endDate}
                onChange={(field, value) => handleDateRangeChange(field, value)}
              />
            </div>
            <div className="flex gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleApplyFilter}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all font-semibold shadow-lg hover:shadow-xl"
              >
                Apply
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleClearFilter}
                className="px-6 py-3 bg-slate-200 text-slate-700 rounded-xl hover:bg-slate-300 transition-all font-semibold"
              >
                Clear
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Comparative Stats - Period Over Period */}
        {comparativeData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-6 h-6 text-indigo-600" />
              <h2 className="text-2xl font-bold text-slate-900">
                Performance Comparison
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Today vs Yesterday */}
              <motion.div
                whileHover={{ scale: 1.02, y: -5 }}
                className="relative bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-xl p-6 text-white overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
                <div className="relative">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Today vs Yesterday
                  </h3>
                  <div className="space-y-4">
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                      <p className="text-sm opacity-90 mb-1">Jobs</p>
                      <div className="flex items-center justify-between">
                        <p className="text-2xl font-bold">
                          {comparativeData.daily.today.jobs}
                        </p>
                        <span
                          className={`flex items-center gap-1 text-sm font-bold px-2 py-1 rounded-lg ${
                            comparativeData.daily.change.jobs >= 0
                              ? "bg-green-500/30"
                              : "bg-red-500/30"
                          }`}
                        >
                          {comparativeData.daily.change.jobs >= 0 ? (
                            <ArrowUp className="w-4 h-4" />
                          ) : (
                            <ArrowDown className="w-4 h-4" />
                          )}
                          {Math.abs(
                            comparativeData.daily.change.jobsPercentage,
                          )}
                          %
                        </span>
                      </div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                      <p className="text-sm opacity-90 mb-1">Revenue</p>
                      <div className="flex items-center justify-between">
                        <p className="text-2xl font-bold">
                          {formatCurrency(comparativeData.daily.today.revenue)}
                        </p>
                        <span
                          className={`flex items-center gap-1 text-sm font-bold px-2 py-1 rounded-lg ${
                            comparativeData.daily.change.revenue >= 0
                              ? "bg-green-500/30"
                              : "bg-red-500/30"
                          }`}
                        >
                          {comparativeData.daily.change.revenue >= 0 ? (
                            <ArrowUp className="w-4 h-4" />
                          ) : (
                            <ArrowDown className="w-4 h-4" />
                          )}
                          {Math.abs(
                            comparativeData.daily.change.revenuePercentage,
                          )}
                          %
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* This Week vs Last Week */}
              <motion.div
                whileHover={{ scale: 1.02, y: -5 }}
                className="relative bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-xl p-6 text-white overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
                <div className="relative">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    This Week vs Last Week
                  </h3>
                  <div className="space-y-4">
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                      <p className="text-sm opacity-90 mb-1">Jobs</p>
                      <div className="flex items-center justify-between">
                        <p className="text-2xl font-bold">
                          {comparativeData.weekly.thisWeek.jobs}
                        </p>
                        <span
                          className={`flex items-center gap-1 text-sm font-bold px-2 py-1 rounded-lg ${
                            comparativeData.weekly.change.jobs >= 0
                              ? "bg-green-500/30"
                              : "bg-red-500/30"
                          }`}
                        >
                          {comparativeData.weekly.change.jobs >= 0 ? (
                            <ArrowUp className="w-4 h-4" />
                          ) : (
                            <ArrowDown className="w-4 h-4" />
                          )}
                          {Math.abs(
                            comparativeData.weekly.change.jobsPercentage,
                          )}
                          %
                        </span>
                      </div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                      <p className="text-sm opacity-90 mb-1">Revenue</p>
                      <div className="flex items-center justify-between">
                        <p className="text-2xl font-bold">
                          {formatCurrency(
                            comparativeData.weekly.thisWeek.revenue,
                          )}
                        </p>
                        <span
                          className={`flex items-center gap-1 text-sm font-bold px-2 py-1 rounded-lg ${
                            comparativeData.weekly.change.revenue >= 0
                              ? "bg-green-500/30"
                              : "bg-red-500/30"
                          }`}
                        >
                          {comparativeData.weekly.change.revenue >= 0 ? (
                            <ArrowUp className="w-4 h-4" />
                          ) : (
                            <ArrowDown className="w-4 h-4" />
                          )}
                          {Math.abs(
                            comparativeData.weekly.change.revenuePercentage,
                          )}
                          %
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* This Month vs Last Month */}
              <motion.div
                whileHover={{ scale: 1.02, y: -5 }}
                className="relative bg-gradient-to-br from-pink-500 to-pink-600 rounded-2xl shadow-xl p-6 text-white overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
                <div className="relative">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    This Month vs Last Month
                  </h3>
                  <div className="space-y-4">
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                      <p className="text-sm opacity-90 mb-1">Jobs</p>
                      <div className="flex items-center justify-between">
                        <p className="text-2xl font-bold">
                          {comparativeData.monthly.thisMonth.jobs}
                        </p>
                        <span
                          className={`flex items-center gap-1 text-sm font-bold px-2 py-1 rounded-lg ${
                            comparativeData.monthly.change.jobs >= 0
                              ? "bg-green-500/30"
                              : "bg-red-500/30"
                          }`}
                        >
                          {comparativeData.monthly.change.jobs >= 0 ? (
                            <ArrowUp className="w-4 h-4" />
                          ) : (
                            <ArrowDown className="w-4 h-4" />
                          )}
                          {Math.abs(
                            comparativeData.monthly.change.jobsPercentage,
                          )}
                          %
                        </span>
                      </div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                      <p className="text-sm opacity-90 mb-1">Revenue</p>
                      <div className="flex items-center justify-between">
                        <p className="text-2xl font-bold">
                          {formatCurrency(
                            comparativeData.monthly.thisMonth.revenue,
                          )}
                        </p>
                        <span
                          className={`flex items-center gap-1 text-sm font-bold px-2 py-1 rounded-lg ${
                            comparativeData.monthly.change.revenue >= 0
                              ? "bg-green-500/30"
                              : "bg-red-500/30"
                          }`}
                        >
                          {comparativeData.monthly.change.revenue >= 0 ? (
                            <ArrowUp className="w-4 h-4" />
                          ) : (
                            <ArrowDown className="w-4 h-4" />
                          )}
                          {Math.abs(
                            comparativeData.monthly.change.revenuePercentage,
                          )}
                          %
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* Main Stats Grid */}
        {adminStats && (
          <>
            {/* Financial Overview */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex items-center gap-2 mb-4">
                <DollarSign className="w-6 h-6 text-green-600" />
                <h2 className="text-2xl font-bold text-slate-900">
                  Financial Overview
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                  title="Total Revenue"
                  value={formatCurrency(adminStats.payments.total)}
                  subtitle={`${formatNumber(adminStats.payments.count)} transactions`}
                  icon={DollarSign}
                  color="from-green-500 to-emerald-600"
                  delay={0}
                />
                <StatCard
                  title="Collected"
                  value={formatCurrency(adminStats.payments.collected)}
                  subtitle={`${adminStats.payments.collectionRate.toFixed(1)}% collection rate`}
                  icon={CheckCircle}
                  trend="up"
                  trendValue={adminStats.payments.collectionRate.toFixed(1)}
                  color="from-blue-500 to-blue-600"
                  delay={0.1}
                />
                <StatCard
                  title="Pending"
                  value={formatCurrency(adminStats.payments.pending)}
                  subtitle="Awaiting payment"
                  icon={Clock}
                  color="from-yellow-500 to-orange-500"
                  delay={0.2}
                />
                <StatCard
                  title="Overdue"
                  value={formatCurrency(adminStats.payments.overdue)}
                  subtitle="Requires attention"
                  icon={XCircle}
                  color="from-red-500 to-rose-600"
                  delay={0.3}
                />
              </div>
            </motion.div>

            {/* Jobs & Services */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className="flex items-center gap-2 mb-4">
                <Briefcase className="w-6 h-6 text-indigo-600" />
                <h2 className="text-2xl font-bold text-slate-900">
                  Jobs & Services
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                  title="Total Jobs"
                  value={formatNumber(adminStats.jobs.total)}
                  subtitle={`${adminStats.jobs.completionRate.toFixed(1)}% completion rate`}
                  icon={Briefcase}
                  color="from-indigo-500 to-indigo-600"
                  delay={0}
                />
                <StatCard
                  title="Completed"
                  value={formatNumber(adminStats.jobs.completed)}
                  subtitle="Successfully finished"
                  icon={CheckCircle}
                  trend="up"
                  trendValue={adminStats.jobs.completionRate.toFixed(1)}
                  color="from-green-500 to-emerald-600"
                  delay={0.1}
                />
                <StatCard
                  title="Pending"
                  value={formatNumber(adminStats.jobs.pending)}
                  subtitle="In progress"
                  icon={Clock}
                  color="from-yellow-500 to-orange-500"
                  delay={0.2}
                />
                <StatCard
                  title="Cancelled"
                  value={formatNumber(adminStats.jobs.cancelled)}
                  subtitle="Not completed"
                  icon={XCircle}
                  color="from-red-500 to-rose-600"
                  delay={0.3}
                />
              </div>
            </motion.div>

            {/* Customers & Resources */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-6 h-6 text-purple-600" />
                <h2 className="text-2xl font-bold text-slate-900">
                  Customers & Resources
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                  title="Total Customers"
                  value={formatNumber(adminStats.customers.total)}
                  subtitle={`${formatNumber(adminStats.customers.active)} active`}
                  icon={Users}
                  color="from-purple-500 to-purple-600"
                  delay={0}
                />
                <StatCard
                  title="Vehicles"
                  value={formatNumber(adminStats.customers.vehicles)}
                  subtitle="Registered vehicles"
                  icon={Car}
                  color="from-pink-500 to-pink-600"
                  delay={0.1}
                />
                <StatCard
                  title="Total Workers"
                  value={formatNumber(adminStats.workers.total)}
                  subtitle={`${formatNumber(adminStats.workers.active)} active`}
                  icon={Users}
                  color="from-cyan-500 to-cyan-600"
                  delay={0.2}
                />
                <StatCard
                  title="Buildings"
                  value={formatNumber(adminStats.buildings.total)}
                  subtitle="Service locations"
                  icon={Building}
                  color="from-orange-500 to-orange-600"
                  delay={0.3}
                />
              </div>
            </motion.div>
          </>
        )}

        {/* Charts Section */}
        <AnimatePresence>
          {showAdvancedCharts && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* Revenue & Service Distribution Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue Trends */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 }}
                  className="bg-white rounded-2xl shadow-xl p-6 border border-slate-200"
                >
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-green-600" />
                      Revenue Trends
                    </h3>
                    <Zap className="w-5 h-5 text-yellow-500" />
                  </div>
                  <ResponsiveContainer width="100%" height={320}>
                    <AreaChart data={revenueTrends}>
                      <defs>
                        <linearGradient
                          id="colorRevenue"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor={COLORS.primary}
                            stopOpacity={0.8}
                          />
                          <stop
                            offset="95%"
                            stopColor={COLORS.primary}
                            stopOpacity={0.1}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
                      <YAxis stroke="#94a3b8" fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#fff",
                          border: "1px solid #e2e8f0",
                          borderRadius: "12px",
                          boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
                        }}
                        formatter={(value) => formatCurrency(value)}
                      />
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke={COLORS.primary}
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorRevenue)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </motion.div>

                {/* Service Distribution */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 }}
                  className="bg-white rounded-2xl shadow-xl p-6 border border-slate-200"
                >
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                      <PieChartIcon className="w-5 h-5 text-purple-600" />
                      Service Distribution
                    </h3>
                    <Target className="w-5 h-5 text-pink-500" />
                  </div>
                  <ResponsiveContainer width="100%" height={320}>
                    <PieChart>
                      <Pie
                        data={serviceDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(entry) =>
                          `${entry.serviceType}: ${entry.count}`
                        }
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {serviceDistribution.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={CHART_COLORS[index % CHART_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#fff",
                          border: "1px solid #e2e8f0",
                          borderRadius: "12px",
                          boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </motion.div>
              </div>

              {/* Monthly Jobs Overview - Residence & OneWash */}
              {charts && charts.residence && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                  className="bg-white rounded-2xl shadow-xl p-6 border border-slate-200 col-span-2"
                >
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-indigo-600" />
                      Monthly Jobs Overview
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Residence Jobs */}
                    <div>
                      <h4 className="text-sm font-semibold text-slate-600 mb-3 flex items-center gap-2">
                        <Home className="w-4 h-4" />
                        Residence Jobs
                      </h4>
                      <ResponsiveContainer width="100%" height={300}>
                        <ComposedChart
                          data={charts.residence.jobs.labels.map(
                            (label, index) => ({
                              month: label,
                              completed: charts.residence.jobs.completed[index],
                              pending: charts.residence.jobs.pending[index],
                              total:
                                charts.residence.jobs.completed[index] +
                                charts.residence.jobs.pending[index],
                            }),
                          )}
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#f0f0f0"
                          />
                          <XAxis
                            dataKey="month"
                            stroke="#94a3b8"
                            fontSize={11}
                          />
                          <YAxis stroke="#94a3b8" fontSize={11} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "#fff",
                              border: "1px solid #e2e8f0",
                              borderRadius: "12px",
                              boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
                            }}
                          />
                          <Legend />
                          <Bar
                            dataKey="completed"
                            fill={COLORS.success}
                            radius={[8, 8, 0, 0]}
                          />
                          <Bar
                            dataKey="pending"
                            fill={COLORS.warning}
                            radius={[8, 8, 0, 0]}
                          />
                          <Line
                            type="monotone"
                            dataKey="total"
                            stroke={COLORS.primary}
                            strokeWidth={2}
                          />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>

                    {/* OneWash Jobs */}
                    {charts.onewash && (
                      <div>
                        <h4 className="text-sm font-semibold text-slate-600 mb-3 flex items-center gap-2">
                          <Package className="w-4 h-4" />
                          OneWash Jobs
                        </h4>
                        <ResponsiveContainer width="100%" height={300}>
                          <ComposedChart
                            data={charts.onewash.jobs.labels.map(
                              (label, index) => ({
                                month: label,
                                completed: charts.onewash.jobs.completed[index],
                                pending: charts.onewash.jobs.pending[index],
                                total:
                                  charts.onewash.jobs.completed[index] +
                                  charts.onewash.jobs.pending[index],
                              }),
                            )}
                          >
                            <CartesianGrid
                              strokeDasharray="3 3"
                              stroke="#f0f0f0"
                            />
                            <XAxis
                              dataKey="month"
                              stroke="#94a3b8"
                              fontSize={11}
                            />
                            <YAxis stroke="#94a3b8" fontSize={11} />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: "#fff",
                                border: "1px solid #e2e8f0",
                                borderRadius: "12px",
                                boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
                              }}
                            />
                            <Legend />
                            <Bar
                              dataKey="completed"
                              fill="#10b981"
                              radius={[8, 8, 0, 0]}
                            />
                            <Bar
                              dataKey="pending"
                              fill="#f59e0b"
                              radius={[8, 8, 0, 0]}
                            />
                            <Line
                              type="monotone"
                              dataKey="total"
                              stroke="#8b5cf6"
                              strokeWidth={2}
                            />
                          </ComposedChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Building Performance */}
              {buildingAnalytics.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9 }}
                  className="bg-white rounded-2xl shadow-xl p-6 border border-slate-200"
                >
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                      <Building className="w-5 h-5 text-orange-600" />
                      Top Buildings Performance
                    </h3>
                  </div>
                  <ResponsiveContainer width="100%" height={380}>
                    <BarChart data={buildingAnalytics.slice(0, 10)}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis
                        dataKey="buildingName"
                        stroke="#94a3b8"
                        fontSize={11}
                        angle={-35}
                        textAnchor="end"
                        height={120}
                      />
                      <YAxis stroke="#94a3b8" fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#fff",
                          border: "1px solid #e2e8f0",
                          borderRadius: "12px",
                          boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
                        }}
                      />
                      <Legend />
                      <Bar
                        dataKey="totalJobs"
                        fill={COLORS.primary}
                        radius={[8, 8, 0, 0]}
                        name="Total Jobs"
                      />
                      <Bar
                        dataKey="completedJobs"
                        fill={COLORS.success}
                        radius={[8, 8, 0, 0]}
                        name="Completed"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Top Workers */}
        {topWorkers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0 }}
            className="bg-white rounded-2xl shadow-xl p-6 border border-slate-200"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Award className="w-5 h-5 text-yellow-500" />
                Top Performing Workers
              </h3>
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Trophy className="w-4 h-4" />
                <span className="font-semibold">Top 10</span>
              </div>
            </div>
            <div className="space-y-3">
              {topWorkers.map((worker, index) => (
                <TopWorkerRow
                  key={worker.workerId}
                  worker={worker}
                  index={index}
                />
              ))}
            </div>
          </motion.div>
        )}

        {/* Performance Highlights */}
        {performanceHighlights && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1 }}
            className="bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 rounded-2xl shadow-xl p-8 text-white"
          >
            <div className="flex items-center gap-3 mb-8">
              <Sparkles className="w-7 h-7" />
              <h3 className="text-2xl font-bold">Performance Highlights</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Completion Rate */}
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-white/20 rounded-lg">
                    <Target className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm opacity-90">Completion Rate</p>
                    <p className="text-3xl font-bold">
                      {performanceHighlights.completionRate}%
                    </p>
                  </div>
                </div>
                <p className="text-sm opacity-75">
                  Jobs successfully completed
                </p>
              </motion.div>

              {/* Jobs per Worker */}
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-white/20 rounded-lg">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm opacity-90">Jobs per Worker</p>
                    <p className="text-3xl font-bold">
                      {performanceHighlights.avgJobsPerWorker
                        ? Math.round(performanceHighlights.avgJobsPerWorker)
                        : 0}
                    </p>
                  </div>
                </div>
                <p className="text-sm opacity-75">
                  Average workload distribution
                </p>
              </motion.div>

              {/* Active Workers */}
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-white/20 rounded-lg">
                    <Zap className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm opacity-90">Active Workers</p>
                    <p className="text-3xl font-bold">
                      {performanceHighlights.activeWorkersPercent}%
                    </p>
                  </div>
                </div>
                <p className="text-sm opacity-75">Currently active workforce</p>
              </motion.div>

              {/* Total Vehicles */}
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-white/20 rounded-lg">
                    <Car className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm opacity-90">Total Vehicles</p>
                    <p className="text-3xl font-bold">
                      {formatNumber(
                        performanceHighlights.totalCustomerVehicles,
                      )}
                    </p>
                  </div>
                </div>
                <p className="text-sm opacity-75">
                  Registered customer vehicles
                </p>
              </motion.div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

// Trophy icon component (since lucide-react might not have it)
const Trophy = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
    <path d="M4 22h16" />
    <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
    <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
  </svg>
);

export default Dashboard;
