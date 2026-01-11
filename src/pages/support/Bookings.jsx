import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  UserPlus,
  Trash2,
  CheckCircle,
  User,
  Loader2,
  Calendar,
  Clock,
  Car,
  MapPin,
  Package,
} from "lucide-react";
import toast from "react-hot-toast";

// Components
import DataTable from "../../components/DataTable";
import AssignWorkerModal from "../../components/modals/AssignWorkerModal";

// Redux
import {
  fetchBookings,
  acceptBooking,
  deleteBooking,
  setSelectedBooking,
  clearSelectedBooking,
  clearError,
} from "../../redux/slices/bookingSlice";

const Bookings = () => {
  // Redux State
  const dispatch = useDispatch();
  const { bookings, loading, error, total, currentPage, totalPages } =
    useSelector((state) => state.booking);

  // Local UI State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentSearch, setCurrentSearch] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
  });

  // Fetch data on mount and when pagination/search changes
  useEffect(() => {
    dispatch(
      fetchBookings({
        page: pagination.page,
        limit: pagination.limit,
        search: currentSearch,
      })
    );
  }, [dispatch, pagination.page, pagination.limit, currentSearch]);

  // Handle errors from Redux
  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  // --- Handlers ---
  const handleSearch = (term) => {
    setCurrentSearch(term);
    setPagination({ ...pagination, page: 1 });
  };

  const handlePageChange = (newPage) => {
    setPagination({ ...pagination, page: newPage });
  };

  const handleLimitChange = (newLimit) => {
    setPagination({ page: 1, limit: newLimit });
  };

  const handleOpenAssign = (booking) => {
    dispatch(setSelectedBooking(booking));
    setIsModalOpen(true);
  };

  const handleAccept = async (booking) => {
    if (!window.confirm("Accept booking? This will create a Job.")) return;
    try {
      await dispatch(acceptBooking(booking._id)).unwrap();
      toast.success("Booking Accepted");
    } catch (error) {
      toast.error(error || "Failed to accept");
    }
  };

  const handleDelete = async (booking) => {
    if (!window.confirm("Delete this booking?")) return;
    try {
      await dispatch(deleteBooking(booking._id)).unwrap();
      toast.success("Deleted");
    } catch (error) {
      toast.error(error || "Delete failed");
    }
  };

  const handleModalSuccess = () => {
    setIsModalOpen(false);
    dispatch(clearSelectedBooking());
    dispatch(
      fetchBookings({
        page: pagination.page,
        limit: pagination.limit,
        search: currentSearch,
      })
    );
  };

  // --- Columns with Enriched CSS ---
  const columns = [
    {
      header: "#",
      accessor: "id",
      className: "w-16 text-center",
      render: (row, idx) => (
        <div className="flex items-center justify-center">
          <span
            className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs"
            style={{
              background: "#2563eb", // Blue-600
              color: "#ffffff",
            }}
          >
            {row.id || (currentPage - 1) * pagination.limit + idx + 1}
          </span>
        </div>
      ),
    },
    {
      header: "Customer",
      accessor: "customer",
      render: (row) => (
        <span
          className="font-semibold text-sm"
          style={{ color: "#111827" }} // Gray-900
        >
          {row.customer?.mobile || ""}
        </span>
      ),
    },
    {
      header: "Date & Time",
      accessor: "date",
      render: (row) => {
        const dateObj = row.date ? new Date(row.date) : null;
        const timeStr =
          row.time ||
          (dateObj &&
            dateObj.toLocaleTimeString("en-US", {
              hour: "numeric",
              minute: "2-digit",
              hour12: true,
            }));

        return (
          <div className="flex flex-col gap-1">
            {dateObj && (
              <div className="flex items-center gap-1.5">
                <Calendar
                  className="w-3.5 h-3.5"
                  style={{ color: "#2563eb" }} // Blue-600
                />
                <span
                  className="text-sm font-medium"
                  style={{ color: "#111827" }} // Gray-900
                >
                  {dateObj.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
            )}
            {timeStr && (
              <div className="flex items-center gap-1.5">
                <Clock
                  className="w-3.5 h-3.5"
                  style={{ color: "#2563eb" }} // Blue-600
                />
                <span
                  className="text-xs"
                  style={{ color: "#6b7280" }} // Gray-500
                >
                  {timeStr}
                </span>
              </div>
            )}
          </div>
        );
      },
    },
    {
      header: "Worker",
      accessor: "worker",
      render: (row) => (
        <div className="flex items-center gap-2">
          {row.worker ? (
            <>
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: "#16a34a" }} // Green-600
              >
                <span
                  className="font-bold text-xs"
                  style={{ color: "#ffffff" }}
                >
                  {row.worker.name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <span
                className="font-semibold text-sm"
                style={{ color: "#111827" }} // Gray-900
              >
                {row.worker.name}
              </span>
            </>
          ) : (
            <>
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: "#f3f4f6" }} // Gray-100
              >
                <User
                  className="w-4 h-4"
                  style={{ color: "#9ca3af" }} // Gray-400
                />
              </div>
              <span
                className="italic text-sm"
                style={{ color: "#9ca3af" }} // Gray-400
              >
                Unassigned
              </span>
            </>
          )}
        </div>
      ),
    },
    {
      header: "Location",
      accessor: "premise",
      render: (row) => {
        let premiseName = null;
        if (row.service_type === "mall" && row.mall) {
          premiseName = row.mall.name;
        } else {
          premiseName =
            row.address ||
            row.customer?.location ||
            row.customer?.building ||
            row.customer?.city;
        }

        return premiseName ? (
          <div className="flex items-start gap-2 max-w-[250px]">
            <MapPin
              className="w-4 h-4 mt-0.5 flex-shrink-0"
              style={{ color: "#dc2626" }} // Red-600
            />
            <span
              className="text-sm leading-tight break-words whitespace-normal"
              style={{ color: "#4b5563" }} // Gray-600
            >
              {premiseName}
            </span>
          </div>
        ) : null;
      },
    },
    {
      header: "Service Type",
      accessor: "service_type",
      render: (row) => {
        const service = (row.service_type || "residence").toLowerCase();

        return (
          <div className="flex items-center gap-2">
            <Package
              className="w-3.5 h-3.5"
              style={{ color: "#2563eb" }} // Blue-600
            />
            <span
              className="px-2.5 py-1 rounded-full text-xs font-semibold border capitalize"
              style={{
                background: "#eff6ff", // Blue-50
                color: "#1e40af", // Blue-800
                borderColor: "#bfdbfe", // Blue-200
              }}
            >
              {service}
            </span>
          </div>
        );
      },
    },
    {
      header: "Vehicle",
      accessor: "vehicle",
      render: (row) => {
        if (typeof row.vehicle === "string")
          return (
            <span
              className="text-xs italic"
              style={{ color: "#9ca3af" }} // Gray-400
            >
              Unknown
            </span>
          );

        const v = row.vehicle || {};
        const vType =
          v.type ||
          v.vehicleType ||
          v.vehicle_type ||
          v.bodyType ||
          v.model ||
          "-";
        const regNo = v.registration_no || "-";

        return (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <Car
                className="w-4 h-4"
                style={{ color: "#9ca3af" }} // Gray-400
              />
              <span
                className="text-sm font-medium capitalize"
                style={{ color: "#111827" }} // Gray-900
              >
                {vType}
              </span>
            </div>
            <div className="flex items-center">
              <span
                className="text-xs font-mono font-bold px-2 py-0.5 rounded border"
                style={{
                  color: "#111827", // Gray-900
                  background: "#f3f4f6", // Gray-100
                  borderColor: "#e5e7eb", // Gray-200
                }}
              >
                {regNo}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      header: "Status",
      accessor: "status",
      render: (row) => {
        const status = (row.status || "PENDING").toUpperCase();

        let badgeStyle = {
          background: "#eff6ff", // Blue-50
          color: "#1e40af", // Blue-800
          borderColor: "#2563eb", // Blue-600
        };
        let dotStyle = { background: "#2563eb" };
        if (status === "ACCEPTED" || status === "COMPLETED") {
          badgeStyle = {
            background: "#f0fdf4", // Green-50
            color: "#16a34a", // Green-600
            borderColor: "#16a34a",
          };
          dotStyle = { background: "#16a34a" };
        }

        return (
          <div className="flex items-center gap-2">
            <span
              className="w-2 h-2 rounded-full animate-pulse"
              style={dotStyle}
            />
            <span
              className="px-3 py-1.5 rounded-lg text-xs font-bold border tracking-wide whitespace-nowrap"
              style={badgeStyle}
            >
              {status}
            </span>
          </div>
        );
      },
    },
    {
      header: "Actions",
      className: "sticky right-0 w-[200px]",
      render: (row) => (
        <div
          className="flex items-center justify-end gap-2 pr-4"
          style={{
            background: "#ffffff",
            boxShadow: "-10px 0 10px -10px rgba(0,0,0,0.1)",
          }}
        >
          <button
            onClick={() => handleOpenAssign(row)}
            className="group p-2 rounded-lg transition-all shadow-sm hover:shadow"
            style={{
              background: "#eff6ff", // Blue-50
              color: "#2563eb", // Blue-600
            }}
            title="Assign Worker"
          >
            <UserPlus className="w-4 h-4 group-hover:scale-110 transition-transform" />
          </button>

          {row.status !== "accepted" && (
            <button
              onClick={() => handleAccept(row)}
              className="group p-2 rounded-lg transition-all shadow-sm hover:shadow"
              style={{
                background: "#f0fdf4", // Green-50
                color: "#16a34a", // Green-600
              }}
              title="Accept"
            >
              <CheckCircle className="w-4 h-4 group-hover:scale-110 transition-transform" />
            </button>
          )}

          <button
            onClick={() => handleDelete(row)}
            className="group p-2 rounded-lg transition-all shadow-sm hover:shadow"
            style={{
              background: "#fef2f2", // Red-50
              color: "#dc2626", // Red-600
            }}
            title="Delete"
          >
            <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="w-full h-full flex flex-col p-2">
      <DataTable
        columns={columns}
        data={bookings}
        loading={loading}
        pagination={{
          page: currentPage,
          limit: pagination.limit,
          total: total,
          totalPages: totalPages,
        }}
        onPageChange={handlePageChange}
        onLimitChange={handleLimitChange}
        onSearch={handleSearch}
        searchPlaceholder="Search by customer, vehicle, or location..."
      />

      <AssignWorkerModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          dispatch(clearSelectedBooking());
        }}
        booking={useSelector((state) => state.booking.selectedBooking)}
        onSuccess={handleModalSuccess}
      />
    </div>
  );
};

export default Bookings;
