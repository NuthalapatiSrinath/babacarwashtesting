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
              background: "var(--color-primary)",
              color: "var(--color-text-inverse)",
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
          style={{ color: "var(--color-text-main)" }}
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
                  style={{ color: "var(--color-primary)" }}
                />
                <span
                  className="text-sm font-medium"
                  style={{ color: "var(--color-text-main)" }}
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
                  style={{ color: "var(--color-primary)" }}
                />
                <span
                  className="text-xs"
                  style={{ color: "var(--color-text-sub)" }}
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
                style={{ background: "var(--color-success)" }}
              >
                <span
                  className="font-bold text-xs"
                  style={{ color: "var(--color-text-inverse)" }}
                >
                  {row.worker.name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <span
                className="font-semibold text-sm"
                style={{ color: "var(--color-text-main)" }}
              >
                {row.worker.name}
              </span>
            </>
          ) : (
            <>
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: "var(--color-input-bg)" }}
              >
                <User
                  className="w-4 h-4"
                  style={{ color: "var(--color-text-muted)" }}
                />
              </div>
              <span
                className="italic text-sm"
                style={{ color: "var(--color-text-muted)" }}
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
              style={{ color: "var(--color-danger)" }}
            />
            <span
              className="text-sm leading-tight break-words whitespace-normal"
              style={{ color: "var(--color-text-sub)" }}
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
              style={{ color: "var(--color-primary)" }}
            />
            <span
              className="px-2.5 py-1 rounded-full text-xs font-semibold border capitalize"
              style={{
                background: "var(--color-primary-light)",
                color: "var(--color-primary-text)",
                borderColor: "var(--color-border)",
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
              style={{ color: "var(--color-text-muted)" }}
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
                style={{ color: "var(--color-text-muted)" }}
              />
              <span
                className="text-sm font-medium capitalize"
                style={{ color: "var(--color-text-main)" }}
              >
                {vType}
              </span>
            </div>
            <div className="flex items-center">
              <span
                className="text-xs font-mono font-bold px-2 py-0.5 rounded border"
                style={{
                  color: "var(--color-text-main)",
                  background: "var(--color-input-bg)",
                  borderColor: "var(--color-border)",
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
          background: "var(--color-primary-light)",
          color: "var(--color-primary-text)",
          borderColor: "var(--color-primary)",
        };
        let dotStyle = { background: "var(--color-primary)" };
        if (status === "ACCEPTED" || status === "COMPLETED") {
          badgeStyle = {
            background: "var(--color-success-bg)",
            color: "var(--color-success)",
            borderColor: "var(--color-success)",
          };
          dotStyle = { background: "var(--color-success)" };
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
            background: "var(--color-card)",
            boxShadow: "-10px 0 10px -10px var(--shadow-color)",
          }}
        >
          <button
            onClick={() => handleOpenAssign(row)}
            className="group p-2 rounded-lg transition-all shadow-sm hover:shadow"
            style={{
              background: "var(--color-primary-light)",
              color: "var(--color-primary)",
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
                background: "var(--color-success-bg)",
                color: "var(--color-success)",
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
              background: "var(--color-danger-bg)",
              color: "var(--color-danger)",
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
