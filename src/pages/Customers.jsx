import React, { useState, useEffect, useMemo } from "react";
import {
  UserPlus,
  Trash2,
  Archive,
  Edit2,
  Phone,
  Car,
  MapPin,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

// Components
import DataTable from "../components/DataTable";
import CustomerModal from "../components/modals/CustomerModal";

// API
import { customerService } from "../api/customerService";

const Customers = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [serverData, setServerData] = useState([]); // Stores full API response
  const [activeTab, setActiveTab] = useState(1); // 1 = Active, 2 = Inactive

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

  const [searchTerm, setSearchTerm] = useState("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  // --- Fetch Data ---
  const fetchData = async (page = 1, limit = 10, search = "", status = 1) => {
    setLoading(true);
    try {
      const res = await customerService.list(page, limit, search, status);
      setServerData(res.data || []);
      setPagination({
        page: Number(page),
        limit: Number(limit),
        total: res.total || 0,
        totalPages: Math.ceil((res.total || 0) / Number(limit)) || 1,
      });
    } catch (e) {
      toast.error("Failed to load customers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(1, 10, "", activeTab);
  }, [activeTab]);

  // --- Flatten Data for Table ---
  // This converts the nested Customer -> Vehicles structure into a flat list of Vehicles
  // so each vehicle gets its own row in the table.
  const flattenedData = useMemo(() => {
    if (!serverData) return [];
    const rows = [];
    serverData.forEach((customer) => {
      if (customer.vehicles && customer.vehicles.length > 0) {
        customer.vehicles.forEach((vehicle) => {
          rows.push({
            ...vehicle,
            // Attach the parent customer object to the row for Actions
            customer: customer,
            // Use vehicle ID as unique key for the row
            uniqueId: vehicle._id,
          });
        });
      } else {
        // Handle case where customer exists but has no active vehicles (rare if filtered by status)
        // We still want to show the customer so they can be edited/deleted
        rows.push({
          customer: customer,
          uniqueId: customer._id,
          registration_no: "NO VEHICLE",
          status: customer.status, // Fallback status
        });
      }
    });
    return rows;
  }, [serverData]);

  // --- Handlers ---
  const handleTabChange = (status) => {
    setActiveTab(status);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleSearch = (term) => {
    setSearchTerm(term);
    fetchData(1, pagination.limit, term, activeTab);
  };

  // Open Modal for Create
  const handleCreate = () => {
    setSelectedCustomer(null);
    setIsModalOpen(true);
  };

  // Open Modal for Edit
  const handleEdit = (customerData) => {
    // 1. Find the full customer object from our serverData to ensure we have all fields
    // (In case the flattened row data is missing deep nested props)
    const fullCustomer = serverData.find((c) => c._id === customerData._id);

    // 2. Set it to state
    setSelectedCustomer(fullCustomer || customerData);

    // 3. Open the modal
    setIsModalOpen(true);
  };

  const handleDelete = async (customerId) => {
    if (!window.confirm("Delete this customer? This removes all vehicles."))
      return;
    try {
      await customerService.delete(customerId);
      toast.success("Deleted");
      fetchData(pagination.page, pagination.limit, searchTerm, activeTab);
    } catch (e) {
      toast.error("Delete failed");
    }
  };

  const handleToggleStatus = async (row) => {
    // Determine action based on current status
    const newStatus = row.status === 1 ? 2 : 1;
    const action = newStatus === 1 ? "Activate" : "Deactivate";

    if (!window.confirm(`${action} this vehicle?`)) return;

    try {
      await customerService.toggleVehicle(row._id, row.status);
      toast.success(`Vehicle ${action}d`);
      fetchData(pagination.page, pagination.limit, searchTerm, activeTab);
    } catch (e) {
      toast.error("Status update failed");
    }
  };

  const handleArchive = async (customerId) => {
    if (!window.confirm("Archive this customer?")) return;
    try {
      await customerService.archive(customerId);
      toast.success("Archived");
      fetchData(pagination.page, pagination.limit, searchTerm, activeTab);
    } catch (e) {
      toast.error("Archive failed");
    }
  };

  // --- Expanded Row Renderer (Grey Box Details) ---
  const renderExpandedRow = (row) => {
    const c = row.customer;
    const workerName = row.worker?.name || "Unassigned";

    const onboardDate = row.onboard_date
      ? new Date(row.onboard_date).toLocaleDateString()
      : "-";
    const startDate = row.start_date
      ? new Date(row.start_date).toLocaleDateString()
      : "-";
    const schedule =
      row.schedule_days?.map((d) => d.day).join(", ") || "No Schedule";

    return (
      <div className="bg-slate-50 p-5 rounded-lg border border-slate-200 ml-12 shadow-inner">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-5 border-b border-slate-200 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-lg">
              {c.firstName?.[0]?.toUpperCase() || "U"}
            </div>
            <div>
              <h4 className="font-bold text-slate-800 text-base">
                {c.firstName} {c.lastName}
              </h4>
              <p className="text-xs text-slate-500 font-mono">ID: {c._id}</p>
            </div>
          </div>

          <div className="mt-3 md:mt-0 flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase">
                Cleaner:
              </span>
              <span className="bg-white border border-slate-300 px-3 py-1 rounded-md text-sm font-semibold text-slate-700 shadow-sm">
                {workerName}
              </span>
            </div>
            {/* Show Work Button */}
            <button
              onClick={() => navigate(`/customers/${c._id}/history`)}
              className="px-4 py-1.5 bg-white border border-slate-300 rounded-md text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
            >
              Show Work
            </button>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white p-3 rounded border border-slate-200">
            <span className="block text-[10px] text-slate-400 uppercase font-bold mb-1">
              Vehicle
            </span>
            <span className="font-mono font-bold text-slate-800">
              {row.registration_no}
            </span>
          </div>
          <div className="bg-white p-3 rounded border border-slate-200">
            <span className="block text-[10px] text-slate-400 uppercase font-bold mb-1">
              Schedule
            </span>
            <span className="font-medium text-slate-700 text-sm">
              {schedule}
            </span>
          </div>
          <div className="bg-white p-3 rounded border border-slate-200">
            <span className="block text-[10px] text-slate-400 uppercase font-bold mb-1">
              Amount
            </span>
            <span className="font-bold text-emerald-600 text-sm">
              {row.amount || 0} AED
            </span>
          </div>
          <div className="bg-white p-3 rounded border border-slate-200">
            <span className="block text-[10px] text-slate-400 uppercase font-bold mb-1">
              Onboard Date
            </span>
            <span className="font-medium text-slate-700 text-sm">
              {onboardDate}
            </span>
          </div>
          <div className="bg-white p-3 rounded border border-slate-200">
            <span className="block text-[10px] text-slate-400 uppercase font-bold mb-1">
              Start Date
            </span>
            <span className="font-medium text-slate-700 text-sm">
              {startDate}
            </span>
          </div>
        </div>
      </div>
    );
  };

  // --- Columns Configuration ---
  const columns = [
    {
      header: "#",
      accessor: "uniqueId",
      className: "w-12 text-center",
      render: (row, idx) => (
        <span className="text-slate-400 text-xs font-mono">
          {(pagination.page - 1) * pagination.limit + idx + 1}
        </span>
      ),
    },
    {
      header: "Mobile",
      accessor: "customer.mobile",
      render: (row) => (
        <div className="flex flex-col">
          <span className="font-mono text-slate-700 font-medium">
            {row.customer.mobile}
          </span>
          <span className="text-[10px] text-slate-400 font-bold">
            {row.customer.firstName}
          </span>
        </div>
      ),
    },
    {
      header: "Vehicle",
      accessor: "registration_no",
      render: (row) => (
        <span className="bg-slate-100 px-2 py-1 rounded text-xs font-bold uppercase tracking-wide text-slate-700 border border-slate-200">
          {row.registration_no}
        </span>
      ),
    },
    {
      header: "Flat",
      accessor: "customer.flat_no",
      render: (row) => (
        <span className="text-slate-600 text-sm font-medium">
          {row.customer.flat_no || "-"}
        </span>
      ),
    },
    {
      header: "Parking",
      accessor: "parking_no",
      render: (row) => (
        <span className="text-slate-600 text-sm">{row.parking_no || "-"}</span>
      ),
    },
    {
      header: "Building",
      accessor: "customer.building",
      render: (row) => (
        <div className="flex flex-col">
          <span className="text-slate-700 font-medium text-sm truncate max-w-[150px]">
            {row.customer.building?.name || "-"}
          </span>
          {row.customer.building?.location_id && (
            <span className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1">
              <MapPin className="w-3 h-3" />{" "}
              {row.customer.building.location_id.address}
            </span>
          )}
        </div>
      ),
    },
    // Inactive Tab specific columns
    ...(activeTab === 2
      ? [
          {
            header: "Reason",
            accessor: "deactivateReason",
            render: (row) => (
              <span className="text-red-600 text-[10px] font-bold bg-red-50 border border-red-100 px-2 py-1 rounded uppercase">
                {row.deactivateReason || "Stopped"}
              </span>
            ),
          },
          {
            header: "Deactivate Date",
            accessor: "deactivateDate",
            render: (row) => (
              <span className="text-slate-500 text-xs font-mono">
                {row.deactivateDate
                  ? new Date(row.deactivateDate).toLocaleDateString()
                  : "-"}
              </span>
            ),
          },
        ]
      : []),
    {
      header: "Actions",
      className: "text-right",
      render: (row) => (
        <div className="flex items-center justify-end gap-2">
          {/* EDIT BUTTON - Explicitly rendered */}
          <button
            onClick={() => handleEdit(row.customer)}
            className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-100 transition-colors"
            title="Edit Customer"
          >
            <Edit2 className="w-4 h-4" />
          </button>

          {/* Archive Button */}
          <button
            onClick={() => handleArchive(row.customer._id)}
            className="p-1.5 rounded-lg bg-orange-50 text-orange-600 hover:bg-orange-100 border border-orange-100 transition-colors"
            title="Archive"
          >
            <Archive className="w-4 h-4" />
          </button>

          {/* Delete Button */}
          <button
            onClick={() => handleDelete(row.customer._id)}
            className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 border border-red-100 transition-colors"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          {/* Toggle Switch */}
          <div className="pl-2 border-l border-slate-200 ml-1">
            <button
              onClick={() => handleToggleStatus(row)}
              className={`w-9 h-5 rounded-full p-1 flex items-center transition-colors duration-300 shadow-inner ${
                row.status === 1
                  ? "bg-emerald-500 justify-end"
                  : "bg-slate-300 justify-start"
              }`}
              title={
                row.status === 1 ? "Deactivate Vehicle" : "Activate Vehicle"
              }
            >
              <div className="w-3.5 h-3.5 bg-white rounded-full shadow-sm" />
            </button>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 w-full h-[calc(100vh-80px)] flex flex-col font-sans">
      {/* Header & Tabs */}
      <div className="mb-0 flex-shrink-0">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-slate-800">Customers</h1>
          <button
            onClick={handleCreate}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-md"
          >
            <UserPlus className="w-4 h-4" /> New Customer
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200">
          <button
            onClick={() => handleTabChange(1)}
            className={`px-8 py-3 text-sm font-bold border-b-2 transition-all ${
              activeTab === 1
                ? "border-sky-500 text-sky-600 bg-sky-50/50"
                : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"
            }`}
          >
            Active
          </button>
          <button
            onClick={() => handleTabChange(2)}
            className={`px-8 py-3 text-sm font-bold border-b-2 transition-all ${
              activeTab === 2
                ? "border-sky-500 text-sky-600 bg-sky-50/50"
                : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"
            }`}
          >
            In Active
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 bg-white shadow-sm border border-t-0 border-slate-200 overflow-hidden flex flex-col rounded-b-xl">
        <DataTable
          key={activeTab}
          columns={columns}
          data={flattenedData}
          loading={loading}
          pagination={pagination}
          onPageChange={(p) =>
            fetchData(p, pagination.limit, searchTerm, activeTab)
          }
          onLimitChange={(l) => fetchData(1, l, searchTerm, activeTab)}
          onSearch={handleSearch}
          renderExpandedRow={renderExpandedRow}
        />
      </div>

      {/* Modal */}
      <CustomerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        customer={selectedCustomer}
        onSuccess={() =>
          fetchData(pagination.page, pagination.limit, searchTerm, activeTab)
        }
      />
    </div>
  );
};

export default Customers;
