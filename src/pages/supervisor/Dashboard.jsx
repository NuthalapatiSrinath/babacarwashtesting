import React, { useState, useEffect } from "react";
import { analyticsService } from "../../api/analyticsService";
import { supervisorService } from "../../api/supervisorService";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import DateRangePicker from "../../components/DateRangePicker";
import {
  Activity,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Briefcase,
  Users,
  Calendar,
  RefreshCw,
  Download,
  Loader2,
  CheckCircle,
  CreditCard,
  Banknote,
  Wallet,
  BarChart3,
  PieChart,
  ArrowUp,
  ArrowDown,
  Clock,
  MapPin,
  Phone,
  Building2,
  Star,
  Award,
  Target,
  Zap,
} from "lucide-react";
import { format, subDays, startOfDay, endOfDay } from "date-fns";

const SupervisorDashboard = () => {
  // Date range state - default to last 7 days
  const [dateRange, setDateRange] = useState({
    startDate: format(subDays(new Date(), 7), "yyyy-MM-dd"),
    endDate: format(new Date(), "yyyy-MM-dd"),
  });

  // Analytics data state
  const [analytics, setAnalytics] = useState({
    counts: {
      totalJobs: 0,
      totalAmount: 0,
      totalCash: 0,
      totalCard: 0,
      totalBank: 0,
      todaysJobs: 0,
      todaysAmount: 0,
      todaysCash: 0,
      todaysCard: 0,
      todaysBank: 0,
    },
    charts: {},
  });

  // Team data state
  const [teamData, setTeamData] = useState({
    workers: [],
    total: 0,
    active: 0,
    inactive: 0,
  });

  // Loading states
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch analytics data
  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const body = {
        startDate: new Date(dateRange.startDate).toISOString(),
        endDate: new Date(
          new Date(dateRange.endDate).setHours(23, 59, 59),
        ).toISOString(),
      };

      console.log("📊 [Dashboard] Fetching supervisor analytics", body);
      const response = await analyticsService.getSupervisorStats(body);
      console.log("✅ [Dashboard] Analytics received:", response.data);

      setAnalytics(
        response.data || {
          counts: {
            totalJobs: 0,
            totalAmount: 0,
            totalCash: 0,
            totalCard: 0,
            totalBank: 0,
            todaysJobs: 0,
            todaysAmount: 0,
            todaysCash: 0,
            todaysCard: 0,
            todaysBank: 0,
          },
          charts: {},
        },
      );
    } catch (error) {
      console.error("❌ Failed to fetch analytics:", error);
      toast.error("Failed to load analytics data");
    } finally {
      setLoading(false);
    }
  };

  // Fetch team data
  const fetchTeam = async () => {
    try {
      const response = await supervisorService.getTeam({
        pageNo: 0,
        pageSize: 1000,
        search: "",
      });

      const workers = response.data || [];
      setTeamData({
        workers,
        total: response.total || 0,
        active: workers.filter((w) => w.status === 1).length,
        inactive: workers.filter((w) => w.status === 2).length,
      });
    } catch (error) {
      console.error("❌ Failed to fetch team:", error);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchAnalytics();
    fetchTeam();
  }, [dateRange]);

  // Refresh handler
  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchAnalytics(), fetchTeam()]);
    setRefreshing(false);
    toast.success("Dashboard refreshed");
  };

  // Export handler
  const handleExport = () => {
    const csvContent = [
      ["Metric", "Total", "Today"],
      ["Jobs", analytics.counts.totalJobs, analytics.counts.todaysJobs],
      [
        "Amount (₹)",
        analytics.counts.totalAmount,
        analytics.counts.todaysAmount,
      ],
      ["Cash (₹)", analytics.counts.totalCash, analytics.counts.todaysCash],
      ["Card (₹)", analytics.counts.totalCard, analytics.counts.todaysCard],
      [
        "Bank Transfer (₹)",
        analytics.counts.totalBank,
        analytics.counts.todaysBank,
      ],
      ["", "", ""],
      ["Team Statistics", "", ""],
      ["Total Workers", teamData.total, ""],
      ["Active Workers", teamData.active, ""],
      ["Inactive Workers", teamData.inactive, ""],
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `supervisor_dashboard_${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    toast.success("Dashboard data exported");
  };

  // Calculate percentage change
  const getPercentageChange = (total, today) => {
    if (total === 0) return 0;
    const avgPerDay = total / 7; // Assuming 7-day range
    return avgPerDay > 0 ? ((today - avgPerDay) / avgPerDay) * 100 : 0;
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white shadow-lg">
        <div className="container mx-auto px-6 py-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
          >
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <Activity className="w-8 h-8" />
                Supervisor Dashboard
              </h1>
              <p className="text-blue-100 mt-1">
                Real-time overview of your team's performance and metrics
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className={`flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg hover:bg-white/30 transition-all ${
                  refreshing ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                <RefreshCw
                  className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
                />
                Refresh
              </button>
              <button
                onClick={handleExport}
                className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg hover:bg-white/30 transition-all"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>
          </motion.div>

          {/* Date Range Picker */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-6"
          >
            <DateRangePicker
              startDate={dateRange.startDate}
              endDate={dateRange.endDate}
              onChange={setDateRange}
              className="text-white"
            />
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8 space-y-8">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
          </div>
        ) : (
          <>
            {/* Overall Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              <StatCard
                title="Total Jobs"
                value={analytics.counts.totalJobs}
                subtitle={`${analytics.counts.todaysJobs} today`}
                icon={Briefcase}
                color="blue"
                trend={getPercentageChange(
                  analytics.counts.totalJobs,
                  analytics.counts.todaysJobs,
                )}
              />
              <StatCard
                title="Total Revenue"
                value={`₹${analytics.counts.totalAmount.toLocaleString()}`}
                subtitle={`₹${analytics.counts.todaysAmount.toLocaleString()} today`}
                icon={DollarSign}
                color="green"
                trend={getPercentageChange(
                  analytics.counts.totalAmount,
                  analytics.counts.todaysAmount,
                )}
              />
              <StatCard
                title="Cash Payments"
                value={`₹${analytics.counts.totalCash.toLocaleString()}`}
                subtitle={`₹${analytics.counts.todaysCash.toLocaleString()} today`}
                icon={Wallet}
                color="emerald"
                trend={getPercentageChange(
                  analytics.counts.totalCash,
                  analytics.counts.todaysCash,
                )}
              />
              <StatCard
                title="Card Payments"
                value={`₹${analytics.counts.totalCard.toLocaleString()}`}
                subtitle={`₹${analytics.counts.todaysCard.toLocaleString()} today`}
                icon={CreditCard}
                color="purple"
                trend={getPercentageChange(
                  analytics.counts.totalCard,
                  analytics.counts.todaysCard,
                )}
              />
              <StatCard
                title="Bank Transfers"
                value={`₹${analytics.counts.totalBank.toLocaleString()}`}
                subtitle={`₹${analytics.counts.todaysBank.toLocaleString()} today`}
                icon={Banknote}
                color="indigo"
                trend={getPercentageChange(
                  analytics.counts.totalBank,
                  analytics.counts.todaysBank,
                )}
              />
            </div>

            {/* Payment Distribution & Daily Performance */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Payment Distribution */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-6"
              >
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-blue-600" />
                  Payment Method Distribution
                </h3>
                <div className="space-y-4">
                  <PaymentBar
                    label="Cash"
                    amount={analytics.counts.totalCash}
                    total={analytics.counts.totalAmount}
                    color="emerald"
                    icon={Wallet}
                  />
                  <PaymentBar
                    label="Card"
                    amount={analytics.counts.totalCard}
                    total={analytics.counts.totalAmount}
                    color="purple"
                    icon={CreditCard}
                  />
                  <PaymentBar
                    label="Bank Transfer"
                    amount={analytics.counts.totalBank}
                    total={analytics.counts.totalAmount}
                    color="indigo"
                    icon={Banknote}
                  />
                </div>

                {/* Today's Breakdown */}
                <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                  <h4 className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-4">
                    Today's Breakdown
                  </h4>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-3">
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 mb-1">
                        Cash
                      </p>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">
                        ₹{analytics.counts.todaysCash.toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3">
                      <p className="text-xs text-purple-600 dark:text-purple-400 mb-1">
                        Card
                      </p>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">
                        ₹{analytics.counts.todaysCard.toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-3">
                      <p className="text-xs text-indigo-600 dark:text-indigo-400 mb-1">
                        Bank
                      </p>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">
                        ₹{analytics.counts.todaysBank.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Daily Performance Comparison */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-6"
              >
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                  Today vs Average Performance
                </h3>

                <div className="space-y-6">
                  <ComparisonMetric
                    label="Jobs Completed"
                    today={analytics.counts.todaysJobs}
                    average={Math.round(analytics.counts.totalJobs / 7)}
                    icon={Briefcase}
                  />
                  <ComparisonMetric
                    label="Revenue Generated"
                    today={analytics.counts.todaysAmount}
                    average={Math.round(analytics.counts.totalAmount / 7)}
                    icon={DollarSign}
                    isCurrency
                  />
                  <ComparisonMetric
                    label="Cash Collections"
                    today={analytics.counts.todaysCash}
                    average={Math.round(analytics.counts.totalCash / 7)}
                    icon={Wallet}
                    isCurrency
                  />
                  <ComparisonMetric
                    label="Digital Payments"
                    today={
                      analytics.counts.todaysCard + analytics.counts.todaysBank
                    }
                    average={Math.round(
                      (analytics.counts.totalCard +
                        analytics.counts.totalBank) /
                        7,
                    )}
                    icon={CreditCard}
                    isCurrency
                  />
                </div>
              </motion.div>
            </div>

            {/* Team Overview */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-6"
            >
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                Team Overview
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <TeamStatCard
                  label="Total Workers"
                  value={teamData.total}
                  icon={Users}
                  color="blue"
                />
                <TeamStatCard
                  label="Active Workers"
                  value={teamData.active}
                  icon={CheckCircle}
                  color="green"
                />
                <TeamStatCard
                  label="Inactive Workers"
                  value={teamData.inactive}
                  icon={Clock}
                  color="red"
                />
              </div>

              {/* Top Performers */}
              {teamData.workers.length > 0 && (
                <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
                  <h4 className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-4 flex items-center gap-2">
                    <Award className="w-4 h-4" />
                    Team Members
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {teamData.workers.slice(0, 6).map((worker, index) => (
                      <WorkerCard
                        key={worker._id}
                        worker={worker}
                        rank={index + 1}
                      />
                    ))}
                  </div>
                </div>
              )}
            </motion.div>

            {/* Performance Insights */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-slate-800 dark:to-slate-700 rounded-xl shadow-lg border border-blue-200 dark:border-slate-600 p-6"
            >
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                <Target className="w-5 h-5 text-blue-600" />
                Performance Insights
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <InsightCard
                  title="Average Jobs/Day"
                  value={Math.round(analytics.counts.totalJobs / 7)}
                  icon={Briefcase}
                  color="blue"
                />
                <InsightCard
                  title="Average Revenue/Day"
                  value={`₹${Math.round(analytics.counts.totalAmount / 7).toLocaleString()}`}
                  icon={DollarSign}
                  color="green"
                />
                <InsightCard
                  title="Jobs/Worker"
                  value={
                    teamData.active > 0
                      ? Math.round(
                          analytics.counts.todaysJobs / teamData.active,
                        )
                      : 0
                  }
                  icon={Users}
                  color="purple"
                />
                <InsightCard
                  title="Revenue/Worker"
                  value={`₹${teamData.active > 0 ? Math.round(analytics.counts.todaysAmount / teamData.active).toLocaleString() : 0}`}
                  icon={TrendingUp}
                  color="indigo"
                />
              </div>
            </motion.div>

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-6"
            >
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                <Zap className="w-5 h-5 text-blue-600" />
                Quick Actions
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <QuickActionButton
                  label="View Team"
                  icon={Users}
                  onClick={() => (window.location.href = "/supervisor/workers")}
                  color="blue"
                />
                <QuickActionButton
                  label="View Jobs"
                  icon={Briefcase}
                  onClick={() => (window.location.href = "/supervisor/washes")}
                  color="green"
                />
                <QuickActionButton
                  label="View Reports"
                  icon={BarChart3}
                  onClick={() => (window.location.href = "/supervisor/reports")}
                  color="purple"
                />
                <QuickActionButton
                  label="Export Data"
                  icon={Download}
                  onClick={handleExport}
                  color="indigo"
                />
              </div>
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
};

/* Stat Card Component */
const StatCard = ({ title, value, subtitle, icon: Icon, color, trend }) => {
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
    purple: {
      bg: "bg-purple-50 dark:bg-purple-900/20",
      text: "text-purple-600",
      border: "border-purple-200",
    },
    emerald: {
      bg: "bg-emerald-50 dark:bg-emerald-900/20",
      text: "text-emerald-600",
      border: "border-emerald-200",
    },
    indigo: {
      bg: "bg-indigo-50 dark:bg-indigo-900/20",
      text: "text-indigo-600",
      border: "border-indigo-200",
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
        {trend !== undefined && trend !== 0 && (
          <span
            className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${
              trend > 0
                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
            }`}
          >
            {trend > 0 ? (
              <ArrowUp className="w-3 h-3" />
            ) : (
              <ArrowDown className="w-3 h-3" />
            )}
            {Math.abs(Math.round(trend))}%
          </span>
        )}
      </div>
      <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
        {title}
      </h3>
      <p className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
        {value}
      </p>
      {subtitle && (
        <p className="text-xs text-slate-500 dark:text-slate-500">{subtitle}</p>
      )}
    </motion.div>
  );
};

/* Payment Bar Component */
const PaymentBar = ({ label, amount, total, color, icon: Icon }) => {
  const percentage = total > 0 ? (amount / total) * 100 : 0;

  const colorClasses = {
    emerald: "bg-emerald-500",
    purple: "bg-purple-500",
    indigo: "bg-indigo-500",
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-slate-600 dark:text-slate-400" />
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
            {label}
          </span>
        </div>
        <div className="text-right">
          <p className="text-sm font-bold text-slate-900 dark:text-white">
            ₹{amount.toLocaleString()}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-500">
            {percentage.toFixed(1)}%
          </p>
        </div>
      </div>
      <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className={`h-full ${colorClasses[color]}`}
        />
      </div>
    </div>
  );
};

/* Comparison Metric Component */
const ComparisonMetric = ({
  label,
  today,
  average,
  icon: Icon,
  isCurrency,
}) => {
  const difference = today - average;
  const percentageChange = average > 0 ? (difference / average) * 100 : 0;

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg">
          <Icon className="w-5 h-5 text-slate-600 dark:text-slate-400" />
        </div>
        <div>
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
            {label}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-slate-500 dark:text-slate-500">
              Today: {isCurrency ? "₹" : ""}
              {today.toLocaleString()}
            </span>
            <span className="text-xs text-slate-400">|</span>
            <span className="text-xs text-slate-500 dark:text-slate-500">
              Avg: {isCurrency ? "₹" : ""}
              {average.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
      {difference !== 0 && (
        <span
          className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
            difference > 0
              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
              : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
          }`}
        >
          {difference > 0 ? (
            <TrendingUp className="w-3 h-3" />
          ) : (
            <TrendingDown className="w-3 h-3" />
          )}
          {Math.abs(Math.round(percentageChange))}%
        </span>
      )}
    </div>
  );
};

/* Team Stat Card Component */
const TeamStatCard = ({ label, value, icon: Icon, color }) => {
  const colorClasses = {
    blue: {
      bg: "bg-blue-100 dark:bg-blue-900/30",
      text: "text-blue-600 dark:text-blue-400",
    },
    green: {
      bg: "bg-green-100 dark:bg-green-900/30",
      text: "text-green-600 dark:text-green-400",
    },
    red: {
      bg: "bg-red-100 dark:bg-red-900/30",
      text: "text-red-600 dark:text-red-400",
    },
  };

  const styles = colorClasses[color] || colorClasses.blue;

  return (
    <div className={`${styles.bg} rounded-lg p-4`}>
      <div className="flex items-center gap-3">
        <Icon className={`w-8 h-8 ${styles.text}`} />
        <div>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
            {label}
          </p>
          <p className={`text-2xl font-bold ${styles.text}`}>{value}</p>
        </div>
      </div>
    </div>
  );
};

/* Worker Card Component */
const WorkerCard = ({ worker, rank }) => {
  return (
    <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 border border-slate-200 dark:border-slate-600">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
          {worker.name?.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h5 className="font-semibold text-slate-900 dark:text-white truncate">
              {worker.name}
            </h5>
            {worker.status === 1 && (
              <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-1">
            <Phone className="w-3 h-3" />
            {worker.mobile}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                worker.service_type === "residence"
                  ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                  : "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
              }`}
            >
              {worker.service_type}
            </span>
            {worker.buildings?.length > 0 && (
              <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Building2 className="w-3 h-3" />
                {worker.buildings.length}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/* Insight Card Component */
const InsightCard = ({ title, value, icon: Icon, color }) => {
  const colorClasses = {
    blue: "text-blue-600",
    green: "text-green-600",
    purple: "text-purple-600",
    indigo: "text-indigo-600",
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
      <Icon className={`w-6 h-6 ${colorClasses[color]} mb-2`} />
      <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">{title}</p>
      <p className="text-xl font-bold text-slate-900 dark:text-white">
        {value}
      </p>
    </div>
  );
};

/* Quick Action Button Component */
const QuickActionButton = ({ label, icon: Icon, onClick, color }) => {
  const colorClasses = {
    blue: "bg-blue-600 hover:bg-blue-700",
    green: "bg-green-600 hover:bg-green-700",
    purple: "bg-purple-600 hover:bg-purple-700",
    indigo: "bg-indigo-600 hover:bg-indigo-700",
  };

  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-center gap-2 px-6 py-4 ${colorClasses[color]} text-white rounded-lg transition-colors font-medium`}
    >
      <Icon className="w-5 h-5" />
      {label}
    </button>
  );
};

export default SupervisorDashboard;
