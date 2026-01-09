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
  User,
  Calendar,
} from "lucide-react";
import toast from "react-hot-toast";

// Components
import DataTable from "../../components/DataTable";
import EnquiryModal from "../../components/modals/EnquiryModal";
import EnquiryFilterBar from "../../components/filters/EnquiryFilterBar";
import DeleteModal from "../../components/modals/DeleteModal";
// Note: Added DeleteModal import assuming it exists based on other files

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

  // For Delete Modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [enquiryToDelete, setEnquiryToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

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

  const openDeleteModal = (row) => {
    setEnquiryToDelete(row);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!enquiryToDelete) return;
    setDeleteLoading(true);
    try {
      await dispatch(deleteEnquiry(enquiryToDelete._id)).unwrap();
      toast.success("Enquiry deleted successfully");
      setIsDeleteModalOpen(false);
    } catch (error) {
      toast.error(error || "Delete failed");
    } finally {
      setDeleteLoading(false);
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

  // --- Columns with Rich CSS ---
  const columns = [
    {
      header: "#",
      accessor: "id",
      className: "w-16 text-center",
      render: (row, idx) => (
        <div className="flex justify-center">
          <span className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-xs font-mono border border-indigo-100">
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
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
              <Calendar className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-slate-700">
                {dateObj.toLocaleDateString()}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {dateObj.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      header: "Customer Mobile",
      accessor: "mobile",
      render: (row) => (
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
            <Phone className="w-3.5 h-3.5" />
          </div>
          <span className="font-semibold text-sm font-mono text-slate-700">
            {row.mobile || "---"}
          </span>
        </div>
      ),
    },
    {
      header: "Vehicle Details",
      accessor: "registration_no",
      render: (row) => (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Car className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs font-bold uppercase tracking-wide bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
              {row.registration_no || "N/A"}
            </span>
          </div>
          {row.parking_no && (
            <span className="text-[10px] text-slate-400 pl-6">
              Parking:{" "}
              <span className="font-mono text-slate-600">{row.parking_no}</span>
            </span>
          )}
        </div>
      ),
    },
    {
      header: "Worker",
      accessor: "worker",
      render: (row) => {
        const hasWorker = row.worker?.name || row.worker;
        return hasWorker ? (
          <div className="flex items-center gap-2">
            <User className="w-3.5 h-3.5 text-purple-500" />
            <span className="text-sm font-medium text-purple-700">
              {row.worker?.name || row.worker}
            </span>
          </div>
        ) : (
          <span className="text-xs italic text-slate-400 bg-slate-50 px-2 py-1 rounded">
            Unassigned
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
            classes: "bg-emerald-50 text-emerald-600 border-emerald-100",
            icon: CheckCircle,
            label: "Completed",
          },
          cancelled: {
            classes: "bg-red-50 text-red-600 border-red-100",
            icon: XCircle,
            label: "Cancelled",
          },
          pending: {
            classes: "bg-blue-50 text-blue-600 border-blue-100",
            icon: Clock,
            label: "Pending",
          },
        };

        const config = statusConfig[status] || statusConfig.pending;
        const Icon = config.icon;

        return (
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-bold uppercase w-fit ${config.classes}`}
          >
            <Icon className="w-3 h-3" />
            {config.label}
          </div>
        );
      },
    },
    {
      header: "Actions",
      className:
        "text-right w-24 sticky right-0 bg-white shadow-[-5px_0_10px_-5px_rgba(0,0,0,0.05)]",
      render: (row) => (
        <div className="flex justify-end gap-1.5 pr-2">
          <button
            onClick={() => handleEdit(row)}
            className="p-2 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 rounded-lg transition-all"
            title="Edit"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => openDeleteModal(row)}
            className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg transition-all"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6 font-sans">
      {/* --- TABLE SECTION --- */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        {/* Integrated Filter Bar Area */}
        <div className="border-b border-gray-100 bg-slate-50/50 p-4">
          <EnquiryFilterBar
            onFilterApply={handleFilterApply}
            loading={loading}
          />
        </div>

        <DataTable
          title="Enquiries"
          columns={columns}
          data={filteredData}
          loading={loading}
          // Pagination props
          pagination={{
            page: currentPage,
            limit: pagination.limit,
            total: total,
            totalPages: totalPages,
          }}
          onPageChange={handlePageChange}
          onLimitChange={handleLimitChange}
          // Search & Action Button
          onSearch={handleClientSearch}
          searchPlaceholder="Search mobile, vehicle..."
          actionButton={
            <button
              onClick={handleCreate}
              className="h-10 px-5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all active:scale-95 whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              New Enquiry
            </button>
          }
        />
      </div>

      {/* --- MODALS --- */}
      <EnquiryModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          dispatch(clearSelectedEnquiry());
        }}
        enquiry={useSelector((state) => state.enquiry.selectedEnquiry)}
        onSuccess={handleModalSuccess}
      />

      {/* Added generic DeleteModal to match style consistency */}
      <DeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        loading={deleteLoading}
        title="Delete Enquiry"
        message="Are you sure you want to delete this enquiry?"
      />
    </div>
  );
};

export default Enquiry;
