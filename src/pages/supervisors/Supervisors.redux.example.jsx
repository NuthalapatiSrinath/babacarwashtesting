// EXAMPLE: Using Redux for Supervisors Management
// This file shows how to use the supervisorSlice instead of local state

import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Plus, Edit2, Trash2, Phone } from "lucide-react";
import toast from "react-hot-toast";

// Components
import DataTable from "../../components/DataTable";
import SupervisorModal from "../../components/modals/SupervisorModal";
import DeleteModal from "../../components/modals/DeleteModal";

// Redux Actions
import {
  fetchSupervisors,
  deleteSupervisor,
  setSelectedSupervisor,
  clearSelectedSupervisor,
  clearError,
} from "../../redux/slices/supervisorSlice";

const SupervisorsWithRedux = () => {
  // Redux State
  const dispatch = useDispatch();
  const {
    supervisors,
    loading,
    error,
    total,
    currentPage,
    totalPages,
    selectedSupervisor,
  } = useSelector((state) => state.supervisor);

  // Local UI State (for modals and search)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [supervisorToDelete, setSupervisorToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [currentSearch, setCurrentSearch] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
  });

  // Fetch data on mount and when pagination/search changes
  useEffect(() => {
    dispatch(
      fetchSupervisors({
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

  // Handlers
  const handleAdd = () => {
    dispatch(clearSelectedSupervisor());
    setIsModalOpen(true);
  };

  const handleEdit = (supervisor) => {
    dispatch(setSelectedSupervisor(supervisor));
    setIsModalOpen(true);
  };

  const handleDeleteAction = (supervisor) => {
    setSupervisorToDelete(supervisor);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    setDeleteLoading(true);
    try {
      await dispatch(deleteSupervisor(supervisorToDelete._id)).unwrap();
      toast.success("Deleted successfully");
      setIsDeleteModalOpen(false);
    } catch (error) {
      toast.error(error || "Delete failed");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleSearch = (searchValue) => {
    setCurrentSearch(searchValue);
    setPagination({ ...pagination, page: 1 }); // Reset to page 1 on search
  };

  const handlePageChange = (newPage) => {
    setPagination({ ...pagination, page: newPage });
  };

  const handleModalSuccess = () => {
    setIsModalOpen(false);
    dispatch(
      fetchSupervisors({
        page: pagination.page,
        limit: pagination.limit,
        search: currentSearch,
      })
    );
  };

  // Columns Configuration
  const columns = [
    {
      header: "Id",
      accessor: "id",
      className: "w-16",
      render: (row, idx) => (
        <span className="text-slate-400 font-mono">#{row.id || idx + 1}</span>
      ),
    },
    {
      header: "Service Type",
      accessor: "role",
      render: (row) => (
        <span className="font-semibold text-slate-700 text-sm">
          {row.mall ? "MALL" : "RESIDENCE"}
        </span>
      ),
    },
    {
      header: "Name",
      accessor: "name",
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-bold">
            {row.name?.charAt(0).toUpperCase()}
          </div>
          <span className="font-medium text-slate-800">{row.name}</span>
        </div>
      ),
    },
    {
      header: "Mobile",
      accessor: "number",
      render: (row) => (
        <div className="flex items-center gap-2 text-slate-600 text-sm">
          <Phone className="w-3.5 h-3.5" />
          {row.number}
        </div>
      ),
    },
    {
      header: "Mall/Building",
      accessor: "assignment",
      render: (row) => {
        if (row.mall) {
          return (
            <span className="text-xs text-slate-500">
              {typeof row.mall === "object" ? row.mall.name : "Mall"}
            </span>
          );
        }
        if (row.buildings?.length > 0) {
          return (
            <div className="flex flex-wrap gap-1">
              {row.buildings.slice(0, 2).map((b, i) => (
                <span
                  key={i}
                  className="bg-blue-50 text-blue-600 text-xs px-2 py-0.5 rounded"
                >
                  {typeof b === "object" ? b.name : "Building"}
                </span>
              ))}
              {row.buildings.length > 2 && (
                <span className="text-xs text-slate-400">
                  +{row.buildings.length - 2} more
                </span>
              )}
            </div>
          );
        }
        return <span className="text-xs text-slate-400">-</span>;
      },
    },
    {
      header: "Actions",
      className: "text-right",
      render: (row) => (
        <div className="flex gap-2 justify-end">
          <button
            onClick={() => handleEdit(row)}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Edit"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDeleteAction(row)}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">
              Supervisors Management
            </h1>
            <p className="text-slate-500 mt-1">
              Manage supervisors for residences and malls
            </p>
          </div>
          <button
            onClick={handleAdd}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-lg"
          >
            <Plus className="w-5 h-5" />
            Add Supervisor
          </button>
        </div>

        {/* Data Table */}
        <DataTable
          columns={columns}
          data={supervisors}
          loading={loading}
          pagination={{
            page: currentPage,
            limit: pagination.limit,
            total: total,
            totalPages: totalPages,
          }}
          onPageChange={handlePageChange}
          onSearch={handleSearch}
          searchPlaceholder="Search by name or mobile..."
        />

        {/* Modals */}
        <SupervisorModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={handleModalSuccess}
          editData={selectedSupervisor}
        />

        <DeleteModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={confirmDelete}
          loading={deleteLoading}
          title="Delete Supervisor"
          message={`Are you sure you want to delete "${supervisorToDelete?.name}"? This action cannot be undone.`}
        />
      </div>
    </div>
  );
};

export default SupervisorsWithRedux;
