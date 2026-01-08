import React, { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Plus,
  Trash2,
  Edit2,
  CheckCircle,
  Clock,
  XCircle,
  Phone,
  Car,
} from "lucide-react";
import toast from "react-hot-toast";

// Components
import DataTable from "../../components/DataTable";
import EnquiryModal from "../../components/modals/EnquiryModal";
import EnquiryFilterBar from "../../components/filters/EnquiryFilterBar";

// Redux
import {
  fetchEnquiries,
  deleteEnquiry,
  setSelectedEnquiry,
  clearSelectedEnquiry,
  clearError,
} from "../../redux/slices/enquirySlice";

const Enquiry = () => {
  // Redux State
  const dispatch = useDispatch();
  const { enquiries, loading, error, total, currentPage, totalPages } =
    useSelector((state) => state.enquiry);

  // Local UI State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [clientSearchTerm, setClientSearchTerm] = useState("");
  const [activeFilters, setActiveFilters] = useState({});
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
  });

  // Fetch data on mount and when pagination/filters change
  useEffect(() => {
    dispatch(
      fetchEnquiries({
        page: pagination.page,
        limit: pagination.limit,
        filters: activeFilters,
      })
    );
  }, [dispatch, pagination.page, pagination.limit, activeFilters]);

  // Handle errors from Redux
  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  // --- Client-Side Search ---
  const filteredData = useMemo(() => {
    if (!clientSearchTerm) return enquiries;
    const lowerTerm = clientSearchTerm.toLowerCase();
    return enquiries.filter(
      (row) =>
        row.mobile?.toLowerCase().includes(lowerTerm) ||
        row.registration_no?.toLowerCase().includes(lowerTerm) ||
        row.parking_no?.toLowerCase().includes(lowerTerm)
    );
  }, [enquiries, clientSearchTerm]);

  // --- Handlers ---
  const handleClientSearch = (term) => setClientSearchTerm(term);

  const handleFilterApply = (newFilters) => {
    setActiveFilters(newFilters);
    setPagination({ ...pagination, page: 1 });
  };

  const handlePageChange = (newPage) => {
    setPagination({ ...pagination, page: newPage });
  };

  const handleLimitChange = (newLimit) => {
    setPagination({ page: 1, limit: newLimit });
  };

  const handleCreate = () => {
    dispatch(clearSelectedEnquiry());
    setIsModalOpen(true);
  };

  const handleEdit = (row) => {
    dispatch(setSelectedEnquiry(row));
    setIsModalOpen(true);
  };

  const handleDelete = async (row) => {
    if (!window.confirm("Delete this enquiry?")) return;
    try {
      await dispatch(deleteEnquiry(row._id)).unwrap();
      toast.success("Deleted");
    } catch (error) {
      toast.error(error || "Delete failed");
    }
  };

  const handleModalSuccess = () => {
    setIsModalOpen(false);
    dispatch(clearSelectedEnquiry());
    dispatch(
      fetchEnquiries({
        page: pagination.page,
        limit: pagination.limit,
        filters: activeFilters,
      })
    );
  };

  // --- Columns with Enhanced CSS ---
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
            {(currentPage - 1) * pagination.limit + idx + 1}
          </span>
        </div>
      ),
    },
    {
      header: "Date & Time",
      accessor: "createdAt",
      render: (row) => {
        const dateObj = new Date(row.createdAt);
        return (
          <div className="flex flex-col gap-0.5">
            <span
              className="text-sm font-medium"
              style={{ color: "var(--color-text-main)" }}
            >
              {dateObj.toLocaleDateString()}
            </span>
            <span
              className="text-xs"
              style={{ color: "var(--color-text-muted)" }}
            >
              {dateObj.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        );
      },
    },
    {
      header: "Customer Mobile",
      accessor: "mobile",
      render: (row) => (
        <div className="flex items-center gap-2">
          <Phone
            className="w-4 h-4"
            style={{ color: "var(--color-primary)" }}
          />
          <span
            className="font-semibold text-sm font-mono"
            style={{ color: "var(--color-text-main)" }}
          >
            {row.mobile || "---"}
          </span>
        </div>
      ),
    },
    {
      header: "Vehicle No",
      accessor: "registration_no",
      render: (row) => (
        <div className="flex items-center gap-2">
          <Car
            className="w-4 h-4"
            style={{ color: "var(--color-text-muted)" }}
          />
          <span
            className="px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wide font-mono border"
            style={{
              background: "var(--color-input-bg)",
              color: "var(--color-text-main)",
              borderColor: "var(--color-border)",
            }}
          >
            {row.registration_no || "---"}
          </span>
        </div>
      ),
    },
    {
      header: "Parking",
      accessor: "parking_no",
      render: (row) => (
        <span className="text-sm" style={{ color: "var(--color-text-sub)" }}>
          {row.parking_no || "-"}
        </span>
      ),
    },
    {
      header: "Worker",
      accessor: "worker",
      render: (row) => {
        const hasWorker = row.worker?.name || row.worker;
        return hasWorker ? (
          <span
            className="text-sm font-medium"
            style={{ color: "var(--color-primary)" }}
          >
            {row.worker?.name || row.worker}
          </span>
        ) : (
          <span
            className="text-sm italic"
            style={{ color: "var(--color-text-muted)" }}
          >
            System
          </span>
        );
      },
    },
    {
      header: "Status",
      accessor: "status",
      render: (row) => {
        const status = (row.status || "pending").toLowerCase();

        const statusConfig = {
          completed: {
            bg: "var(--color-success-bg)",
            text: "var(--color-success)",
            border: "var(--color-success)",
            icon: CheckCircle,
            label: "Completed",
          },
          cancelled: {
            bg: "var(--color-danger-bg)",
            text: "var(--color-danger)",
            border: "var(--color-danger)",
            icon: XCircle,
            label: "Cancelled",
          },
          pending: {
            bg: "var(--color-primary-light)",
            text: "var(--color-primary-text)",
            border: "var(--color-primary)",
            icon: Clock,
            label: "Pending",
          },
        };

        const config = statusConfig[status] || statusConfig.pending;
        const Icon = config.icon;

        return (
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-bold uppercase w-fit"
            style={{
              background: config.bg,
              color: config.text,
              borderColor: config.border,
            }}
          >
            <Icon className="w-3 h-3" />
            {config.label}
          </div>
        );
      },
    },
    {
      header: "Actions",
      className: "sticky right-0 w-[120px]",
      render: (row) => (
        <div
          className="flex items-center justify-end gap-2 pr-4"
          style={{
            background: "var(--color-card)",
            boxShadow: "-10px 0 10px -10px var(--shadow-color)",
          }}
        >
          <button
            onClick={() => handleEdit(row)}
            className="p-2 rounded-lg border transition-all shadow-sm hover:shadow"
            style={{
              background: "var(--color-primary-light)",
              color: "var(--color-primary)",
              borderColor: "var(--color-border)",
            }}
            title="Edit"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDelete(row)}
            className="p-2 rounded-lg border transition-all shadow-sm hover:shadow"
            style={{
              background: "var(--color-danger-bg)",
              color: "var(--color-danger)",
              borderColor: "var(--color-border)",
            }}
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="w-full h-full flex flex-col p-2">
      {/* Filter Bar */}
      <div className="mb-3 flex-shrink-0">
        <EnquiryFilterBar onFilterApply={handleFilterApply} loading={loading} />
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={filteredData}
        loading={loading}
        pagination={{
          page: currentPage,
          limit: pagination.limit,
          total: total,
          totalPages: totalPages,
        }}
        onPageChange={handlePageChange}
        onLimitChange={handleLimitChange}
        onSearch={handleClientSearch}
        searchPlaceholder="Search by mobile, vehicle, or parking..."
        actionButton={
          <button
            onClick={handleCreate}
            className="px-4 py-2.5 rounded-lg font-bold text-sm flex items-center gap-2 shadow-md transition-all"
            style={{
              background: "var(--color-primary)",
              color: "var(--color-text-inverse)",
            }}
          >
            <Plus className="w-4 h-4" />
            New Enquiry
          </button>
        }
      />

      {/* Modal */}
      <EnquiryModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          dispatch(clearSelectedEnquiry());
        }}
        enquiry={useSelector((state) => state.enquiry.selectedEnquiry)}
        onSuccess={handleModalSuccess}
      />
    </div>
  );
};

export default Enquiry;
