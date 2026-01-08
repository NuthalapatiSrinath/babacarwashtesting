import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  FileText,
  Calendar,
  MapPin,
  Building2,
  Car,
  DollarSign,
  CreditCard,
  User,
} from "lucide-react";
import toast from "react-hot-toast";
import { workerService } from "../../api/workerService";
import RichDateRangePicker from "../../components/inputs/RichDateRangePicker";

const WorkerHistory = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const worker = location.state?.worker || {};

  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState([]);

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

  useEffect(() => {
    if (id) {
      fetchHistory();
    }
  }, [id]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const params = {
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      };
      const response = await workerService.payments(id, params);
      console.log("Worker History Response:", response.data[0]); // Debug: Check first record structure
      setHistory(response.data || []);
    } catch (error) {
      console.error("Error fetching worker history:", error);
      toast.error("Failed to load history");
    } finally {
      setLoading(false);
    }
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
    fetchHistory();
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
    <div className="p-4 sm:p-6 bg-gray-50 min-h-screen">
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
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800 flex items-center gap-2">
              <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
              Work History
            </h1>
            {worker.name && (
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                {worker.name} {worker.mobile && `• ${worker.mobile}`}
              </p>
            )}
          </div>
          <div className="text-sm sm:text-base text-gray-700 bg-white px-4 py-2 rounded-lg border border-gray-200 shadow-sm">
            <span className="font-bold text-blue-600">{history.length}</span>{" "}
            <span className="text-gray-600">Records</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date Range
            </label>
            <RichDateRangePicker
              startDate={dateRange.startDate}
              endDate={dateRange.endDate}
              onChange={handleDateChange}
            />
          </div>
          <button
            onClick={handleSearch}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            Search
          </button>
        </div>
      </div>

      {/* History Table */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        </div>
      ) : history.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No work history found</p>
          <p className="text-gray-400 text-sm mt-2">
            Try adjusting the date range
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    #
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Vehicle
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Parking
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Building/Mall
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Payment
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {history.map((record, index) => (
                  <tr
                    key={record._id || index}
                    className="hover:bg-blue-50 transition-colors"
                  >
                    <td className="px-4 py-3 text-sm text-gray-500 font-mono">
                      {index + 1}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-800 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {formatDateOnly(
                            record.completedDate || record.createdAt
                          )}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(
                            record.completedDate || record.createdAt
                          ).toLocaleTimeString("en-US", {
                            hour: "numeric",
                            minute: "2-digit",
                            hour12: true,
                          })}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-800">
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {record.customer
                            ? `${record.customer.firstName || ""} ${
                                record.customer.lastName || ""
                              }`.trim() ||
                              record.customer.mobile ||
                              "-"
                            : "-"}
                        </span>
                        <span className="text-xs text-gray-500">
                          {record.customer?.mobile || ""}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className="font-mono font-semibold text-gray-800 bg-gray-100 px-2 py-1 rounded">
                        {record.vehicle?.registration_no || "-"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 font-mono">
                      {record.vehicle?.parking_no || "-"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {record.location?.name || "-"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {record.building?.name || record.mall?.name || "-"}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className="font-bold text-green-700">
                        ₹{record.amount_charged || record.amount || 0}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className="capitalize text-gray-700 bg-gray-100 px-2 py-1 rounded text-xs font-medium">
                        {record.payment_mode || "-"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold uppercase ${
                          record.status?.toLowerCase() === "completed"
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {record.status || "PENDING"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkerHistory;
