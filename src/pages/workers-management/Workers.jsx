import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Edit2,
  Trash2,
  Phone,
  Briefcase,
  ShoppingBag,
  Eye,
  Calendar,
} from "lucide-react";
import toast from "react-hot-toast";

// Components
import DataTable from "../../components/DataTable";
import WorkerModal from "../../components/modals/WorkerModal";
import DeleteModal from "../../components/modals/DeleteModal";

// API
import { workerService } from "../../api/workerService";

const Workers = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [activeTab, setActiveTab] = useState("active"); // "active" or "inactive"

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [workerToDelete, setWorkerToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Pagination & Search State
  const [currentSearch, setCurrentSearch] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 1,
  });

  // --- Fetch Data ---
  const fetchData = async (
    page = 1,
    limit = 10,
    search = "",
    status = undefined
  ) => {
    setLoading(true);
    setCurrentSearch(search);
    try {
      // Use status from activeTab if not provided
      const fetchStatus =
        status !== undefined ? status : activeTab === "active" ? 1 : 2;

      console.log("🔍 [WORKERS] Fetching:", {
        page,
        limit,
        search,
        status: fetchStatus,
      });

      const response = await workerService.list(
        page,
        limit,
        search,
        fetchStatus
      );

      const records = response.data || [];
      const totalRecords = response.total || 0;

      console.log(
        "✅ [WORKERS] Fetched:",
        records.length,
        "records, total:",
        totalRecords
      );

      setData(records);
      setPagination({
        page,
        limit,
        total: totalRecords,
        totalPages: Math.ceil(totalRecords / limit) || 1,
      });
    } catch (error) {
      console.error("❌ [WORKERS] Error:", error);
      toast.error("Failed to load workers");
    } finally {
      setLoading(false);
    }
  };

  // Initial Load
  useEffect(() => {
    const status = activeTab === "active" ? 1 : 2;
    fetchData(pagination.page, pagination.limit, currentSearch, status);
  }, [activeTab]);

  // --- Handlers ---
  const handleAdd = () => {
    setSelectedWorker(null);
    setIsModalOpen(true);
  };

  const handleEdit = (w) => {
    setSelectedWorker(w);
    setIsModalOpen(true);
  };

  const handleDeleteAction = (w) => {
    setWorkerToDelete(w);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    setDeleteLoading(true);
    try {
      await workerService.delete(workerToDelete._id);
      toast.success("Deleted successfully");
      setIsDeleteModalOpen(false);
      const status = activeTab === "active" ? 1 : 2;
      fetchData(pagination.page, pagination.limit, currentSearch, status);
    } catch (error) {
      const msg = error.response?.data?.message || "Delete failed";
      toast.error(msg);
    } finally {
      setDeleteLoading(false);
    }
  };

  const toggleStatus = async (worker) => {
    try {
      const newStatus = worker.status === 1 ? 2 : 1;
      await workerService.update(worker._id, { status: newStatus });
      toast.success(`Worker ${newStatus === 1 ? "Activated" : "Deactivated"}`);
      const status = activeTab === "active" ? 1 : 2;
      fetchData(pagination.page, pagination.limit, currentSearch, status);
    } catch (error) {
      toast.error("Status update failed");
    }
  };

  // Navigation handlers
  const handleViewPayments = (worker) => {
    navigate(`/workers/${worker._id}/payments`, { state: { worker } });
  };

  const handleViewWashedCars = (worker) => {
    navigate(`/workers/${worker._id}/washed-cars`, { state: { worker } });
  };

  const handleViewHistory = (worker) => {
    navigate(`/workers/${worker._id}/history`, { state: { worker } });
  };

  const handleViewCustomers = (worker) => {
    navigate(`/workers/${worker._id}/customers`, { state: { worker } });
  };

  // Format date helper
  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-GB");
  };

  // --- Columns ---
  const columns = [
    {
      header: "Id",
      accessor: "id",
      className: "w-16",
      render: (row, idx) => (
        <span className="text-slate-400 font-mono">#{row.id}</span>
      ),
    },
    {
      header: "Name",
      accessor: "name",
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-xs font-bold border border-blue-100">
            {row.name?.charAt(0).toUpperCase()}
          </div>
          <span className="font-medium text-slate-800">{row.name}</span>
        </div>
      ),
    },
    {
      header: "Mobile",
      accessor: "mobile",
      render: (row) => (
        <div className="flex items-center gap-2 text-slate-600 text-sm font-mono">
          <Phone className="w-3.5 h-3.5 text-slate-400" />
          {row.mobile}
        </div>
      ),
    },
    {
      header: "Start Date",
      accessor: "createdAt",
      render: (row) => (
        <div className="flex items-center gap-2 text-slate-600 text-sm">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          {formatDate(row.createdAt)}
        </div>
      ),
    },
    {
      header: "Payments",
      className: "text-center",
      render: (row) => (
        <button
          onClick={() => handleViewPayments(row)}
          className="p-1.5 hover:bg-green-50 text-slate-400 hover:text-green-600 rounded transition-colors"
          title="View Payments"
        >
          <Eye className="w-4 h-4" />
        </button>
      ),
    },
    {
      header: "Washed Cars",
      className: "text-center",
      render: (row) => (
        <button
          onClick={() => handleViewWashedCars(row)}
          className="p-1.5 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded transition-colors"
          title="View Washed Cars"
        >
          <Eye className="w-4 h-4" />
        </button>
      ),
    },
    {
      header: "History",
      className: "text-center",
      render: (row) => (
        <button
          onClick={() => handleViewHistory(row)}
          className="p-1.5 hover:bg-purple-50 text-slate-400 hover:text-purple-600 rounded transition-colors"
          title="View History"
        >
          <Eye className="w-4 h-4" />
        </button>
      ),
    },
    {
      header: "Customers",
      className: "text-center",
      render: (row) => (
        <button
          onClick={() => handleViewCustomers(row)}
          className="p-1.5 hover:bg-orange-50 text-slate-400 hover:text-orange-600 rounded transition-colors"
          title="View Customers"
        >
          <Eye className="w-4 h-4" />
        </button>
      ),
    },
    {
      header: "Status",
      accessor: "status",
      render: (row) => (
        <div
          onClick={() => toggleStatus(row)}
          className={`w-9 h-5 rounded-full relative cursor-pointer transition-colors ${
            row.status === 1 ? "bg-blue-500" : "bg-slate-300"
          }`}
        >
          <div
            className={`absolute top-1 w-3 h-3 bg-white rounded-full shadow-sm transition-all ${
              row.status === 1 ? "left-5" : "left-1"
            }`}
          ></div>
        </div>
      ),
    },
    {
      header: "Actions",
      className: "text-right",
      render: (row) => (
        <div className="flex justify-end items-center gap-2">
          <button
            onClick={() => handleEdit(row)}
            className="p-1.5 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded transition-colors"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDeleteAction(row)}
            className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  // Expanded Row (Assignments)
  const renderDetailsRow = (row) => {
    const buildings = row.buildings || [];
    const malls = row.malls || [];
    const hasAssignments = buildings.length > 0 || malls.length > 0;

    return (
      <div className="flex items-start gap-4 text-sm py-1">
        <span className="font-bold text-slate-700 mt-1.5">Assigned To:</span>
        <div className="flex flex-wrap gap-2">
          {hasAssignments ? (
            <>
              {malls.map((m, i) => (
                <span
                  key={`m-${i}`}
                  className="bg-[#2a2e3e] text-white text-xs px-3 py-1.5 rounded-md font-medium tracking-wide shadow-sm flex items-center gap-1"
                >
                  <ShoppingBag className="w-3 h-3 opacity-70" />{" "}
                  {typeof m === "object" ? m.name : `Mall ${m}`}
                </span>
              ))}
              {buildings.map((b, i) => (
                <span
                  key={`b-${i}`}
                  className="bg-[#2a2e3e] text-white text-xs px-3 py-1.5 rounded-md font-medium tracking-wide shadow-sm flex items-center gap-1"
                >
                  <Briefcase className="w-3 h-3 opacity-70" />{" "}
                  {typeof b === "object" ? b.name : `Bldg ${b}`}
                </span>
              ))}
            </>
          ) : (
            <span className="text-slate-400 italic mt-1 px-2">
              No active assignments
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="p-3 w-full">
      {/* Tabs for Active/Inactive */}
      <div className="mb-4 flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab("active")}
          className={`px-6 py-3 font-medium text-sm transition-all ${
            activeTab === "active"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Active Workers
        </button>
        <button
          onClick={() => setActiveTab("inactive")}
          className={`px-6 py-3 font-medium text-sm transition-all ${
            activeTab === "inactive"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Inactive Workers
        </button>
      </div>

      <DataTable
        title={`${activeTab === "active" ? "Active" : "Inactive"} Workers`}
        columns={columns}
        data={data}
        loading={loading}
        pagination={pagination}
        // Pagination Events
        onPageChange={(p) => {
          const status = activeTab === "active" ? 1 : 2;
          fetchData(p, pagination.limit, currentSearch, status);
        }}
        onLimitChange={(l) => {
          const status = activeTab === "active" ? 1 : 2;
          fetchData(1, l, currentSearch, status);
        }}
        onSearch={(term) => {
          const status = activeTab === "active" ? 1 : 2;
          fetchData(1, pagination.limit, term, status);
        }}
        renderExpandedRow={renderDetailsRow}
        actionButton={
          <button
            onClick={handleAdd}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all shadow-lg shadow-indigo-600/20 active:scale-95"
          >
            <Plus className="w-4 h-4" /> Add Worker
          </button>
        }
      />

      <WorkerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          const status = activeTab === "active" ? 1 : 2;
          fetchData(pagination.page, pagination.limit, currentSearch, status);
        }}
        editData={selectedWorker}
      />

      <DeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        loading={deleteLoading}
        title="Delete Worker"
      />
    </div>
  );
};

export default Workers;
