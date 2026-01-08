import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Plus, Edit2, Trash2, Phone } from "lucide-react";
import toast from "react-hot-toast";

// Components
import DataTable from "../../components/DataTable";
import SupervisorModal from "../../components/modals/SupervisorModal";
import DeleteModal from "../../components/modals/DeleteModal";

// Redux
import {
  fetchSupervisors,
  deleteSupervisor,
  setSelectedSupervisor,
  clearSelectedSupervisor,
  clearError,
} from "../../redux/slices/supervisorSlice";

const Supervisors = () => {
  // Redux State
  const dispatch = useDispatch();
  const { supervisors, loading, error, total, currentPage, totalPages } =
    useSelector((state) => state.supervisor);

  // Local UI State
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
    setPagination({ ...pagination, page: 1 });
  };

  const handlePageChange = (newPage) => {
    setPagination({ ...pagination, page: newPage });
  };

  const handleLimitChange = (newLimit) => {
    setPagination({ page: 1, limit: newLimit });
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
      header: "Actions",
      className: "text-right",
      render: (row) => (
        <div className="flex justify-end gap-2">
          <button
            onClick={() => handleEdit(row)}
            className="p-2 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-lg transition-colors"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDeleteAction(row)}
            className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  // --- THE EXPANDED ROW CONTENT (The "Below" Prop) ---
  const renderDetailsRow = (row) => {
    const isMall = !!row.mall;
    return (
      <div className="flex items-start gap-4 text-sm">
        <span className="font-bold text-slate-700 mt-1.5">
          {isMall ? "Mall:" : "Buildings:"}
        </span>
        <div className="flex flex-wrap gap-2">
          {isMall ? (
            <span className="bg-[#2a2e3e] text-white text-xs px-3 py-1.5 rounded-md font-medium tracking-wide shadow-sm">
              {row.mall?.name || "Unknown Mall"}
            </span>
          ) : row.buildings && row.buildings.length > 0 ? (
            row.buildings.map((b, i) => (
              <span
                key={i}
                className="bg-[#2a2e3e] text-white text-xs px-3 py-1.5 rounded-md font-medium tracking-wide shadow-sm"
              >
                {typeof b === "object" ? b.name : `ID: ${b}`}
              </span>
            ))
          ) : (
            <span className="text-slate-400 italic mt-1">
              No buildings assigned
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="p-3 w-full">
      {/* <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Supervisors</h1>
          <p className="text-slate-500 mt-1">Manage team assignments</p>
        </div>
      </div> */}

      {/* REUSABLE COMPONENT WITH EXPANDED ROW PROP */}
      <DataTable
        title="All Supervisors"
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
        onLimitChange={handleLimitChange}
        onSearch={handleSearch}
        // Pass the function here to render content below the row
        renderExpandedRow={renderDetailsRow}
        actionButton={
          <button
            onClick={handleAdd}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all shadow-lg shadow-indigo-600/20 active:scale-95"
          >
            <Plus className="w-4 h-4" /> Add Supervisor
          </button>
        }
      />

      <SupervisorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleModalSuccess}
        editData={useSelector((state) => state.supervisor.selectedSupervisor)}
      />

      <DeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        loading={deleteLoading}
        title="Delete Supervisor"
      />
    </div>
  );
};

export default Supervisors;
