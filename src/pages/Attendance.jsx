import React, { useState, useEffect } from "react";
import {
  Search,
  Calendar,
  Download,
  User,
  Users, // <--- Added Users here
  MapPin,
  Building,
  ShoppingBag,
  Filter,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";

// Components
import DataTable from "../components/DataTable";

// APIs
import { attendanceService } from "../api/attendanceService";
import { mallService } from "../api/mallService";
import { siteService } from "../api/siteService";
import { buildingService } from "../api/buildingService";

const Attendance = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);

  // --- Filter States ---
  const today = new Date().toISOString().split("T")[0];
  const [dateRange, setDateRange] = useState({ start: today, end: today });

  // Tabs: 'all', 'residence', 'mall', 'site'
  const [activePremise, setActivePremise] = useState("all");

  // Dropdown Selections
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [selectedMall, setSelectedMall] = useState("");
  const [selectedSite, setSelectedSite] = useState("");
  const [selectedBuilding, setSelectedBuilding] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // Options Data (Populated on Load)
  const [employees, setEmployees] = useState([]);
  const [malls, setMalls] = useState([]);
  const [sites, setSites] = useState([]);
  const [buildings, setBuildings] = useState([]);

  // --- 1. Load Filter Options ---
  useEffect(() => {
    const loadFilters = async () => {
      try {
        const [orgRes, mallsRes, sitesRes, bldgsRes] = await Promise.all([
          attendanceService.getOrgList(),
          mallService.list(1, 1000),
          siteService.list(1, 1000),
          buildingService.list(1, 1000),
        ]);

        // Handle response structure { statusCode: 200, data: [...] }
        setEmployees(orgRes.data || []);
        setMalls(mallsRes.data || []);
        setSites(sitesRes.data || []);
        setBuildings(bldgsRes.data || []);
      } catch (error) {
        console.error("Failed to load filter options", error);
      }
    };
    loadFilters();
  }, []);

  // --- 2. Fetch Attendance Data ---
  const fetchData = async () => {
    setLoading(true);
    try {
      const params = {
        startDate: dateRange.start,
        endDate: dateRange.end,
        search: searchTerm,
      };

      // Employee Filter
      if (selectedEmployee) params.worker = selectedEmployee;

      // Premise Logic
      if (activePremise !== "all") {
        params.premise = activePremise;

        if (activePremise === "mall" && selectedMall)
          params.mall = [selectedMall];
        if (activePremise === "site" && selectedSite)
          params.site = selectedSite;
        if (activePremise === "residence" && selectedBuilding)
          params.building = [selectedBuilding];
      }

      const response = await attendanceService.list(params);
      setData(response.data || []);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load attendance records");
    } finally {
      setLoading(false);
    }
  };

  // Trigger fetch when filters change
  useEffect(() => {
    fetchData();
  }, [
    dateRange,
    activePremise,
    selectedEmployee,
    selectedMall,
    selectedSite,
    selectedBuilding,
  ]);

  // Handle Search on Enter
  const handleSearchSubmit = (e) => {
    if (e.key === "Enter") fetchData();
  };

  // --- 3. Handlers ---

  const handleStatusToggle = async (row, statusType) => {
    // statusType: 'P' (Present) or 'A' (Absent)
    const isPresent = statusType === "P";

    // Don't update if status is already same
    if (row.present === isPresent) return;

    // 1. Optimistic Update
    const originalData = [...data];
    const updatedData = data.map((item) =>
      item._id === row._id
        ? { ...item, present: isPresent, type: isPresent ? "" : "AB" }
        : item
    );
    setData(updatedData);

    try {
      // 2. API Call
      await attendanceService.update({
        ids: [row._id],
        present: isPresent,
        type: isPresent ? "" : "AB",
        notes: row.notes,
      });
      toast.success(isPresent ? "Marked Present" : "Marked Absent");
    } catch (error) {
      toast.error("Update failed");
      setData(originalData); // Revert on error
    }
  };

  const handleNoteBlur = async (row, newNote) => {
    if (row.notes === newNote) return;
    try {
      await attendanceService.update({
        ids: [row._id],
        present: row.present,
        type: row.type,
        notes: newNote,
      });
      toast.success("Note saved");
    } catch (error) {
      toast.error("Failed to save note");
    }
  };

  const handleExport = async () => {
    try {
      toast.loading("Exporting...");
      const params = {
        startDate: dateRange.start,
        endDate: dateRange.end,
        premise: activePremise !== "all" ? activePremise : undefined,
        worker: selectedEmployee || undefined,
      };

      if (activePremise === "mall" && selectedMall)
        params.mall = [selectedMall];
      if (activePremise === "site" && selectedSite) params.site = selectedSite;
      if (activePremise === "residence" && selectedBuilding)
        params.building = [selectedBuilding];

      const blob = await attendanceService.exportData(params);

      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `Attendance_${dateRange.start}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      toast.dismiss();
      toast.success("Export successful");
    } catch (error) {
      console.error(error);
      toast.dismiss();
      toast.error("Export failed");
    }
  };

  // --- Columns Configuration ---
  const columns = [
    {
      header: "Date",
      accessor: "date",
      className: "w-32",
      render: (row) => (
        <div className="flex items-center gap-2 text-slate-600 text-xs font-medium">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          {new Date(row.date).toLocaleDateString()}
        </div>
      ),
    },
    {
      header: "Employee Details",
      accessor: "worker",
      render: (row) => {
        const person = row.worker || row.staff || {};
        const isWorker = !!row.worker;
        return (
          <div className="flex flex-col">
            <span className="font-semibold text-slate-800 text-sm">
              {person.name || "Unknown"}
            </span>
            <div className="flex items-center gap-2 mt-1">
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded border uppercase font-bold tracking-wide ${
                  isWorker
                    ? "bg-blue-50 text-blue-600 border-blue-100"
                    : "bg-purple-50 text-purple-600 border-purple-100"
                }`}
              >
                {isWorker ? "Worker" : "Staff"}
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                {person.mobile || person.employeeCode || "No ID"}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      header: "Attendance",
      accessor: "present",
      className: "w-40",
      render: (row) => (
        <div className="flex bg-slate-100 p-1 rounded-lg w-fit shadow-inner gap-1">
          <button
            onClick={() => handleStatusToggle(row, "P")}
            className={`w-8 h-8 rounded-md flex items-center justify-center text-sm font-bold transition-all duration-200 ${
              row.present
                ? "bg-green-500 text-white shadow-md scale-105"
                : "text-slate-400 hover:text-slate-600 hover:bg-slate-200"
            }`}
            title="Mark Present"
          >
            P
          </button>

          <button
            onClick={() => handleStatusToggle(row, "A")}
            className={`w-8 h-8 rounded-md flex items-center justify-center text-sm font-bold transition-all duration-200 ${
              !row.present
                ? "bg-red-500 text-white shadow-md scale-105"
                : "text-slate-400 hover:text-slate-600 hover:bg-slate-200"
            }`}
            title="Mark Absent"
          >
            A
          </button>
        </div>
      ),
    },
    {
      header: "Remark / Notes",
      accessor: "notes",
      render: (row) => (
        <div className="relative group">
          <input
            type="text"
            defaultValue={row.notes || ""}
            onBlur={(e) => handleNoteBlur(row, e.target.value)}
            placeholder="Add note..."
            className="w-full bg-transparent border-b border-transparent group-hover:border-slate-200 focus:border-blue-500 px-2 py-1 text-sm outline-none transition-all text-slate-600 placeholder:text-slate-300"
          />
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto min-h-screen font-sans bg-slate-50/30">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Attendance</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage daily logs for Workers and Staff
          </p>
        </div>
        <button
          onClick={handleExport}
          className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm transition-all active:scale-95"
        >
          <Download className="w-4 h-4 text-green-600" />
          <span>Export Excel</span>
        </button>
      </div>

      {/* Filter Control Panel */}
      <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 mb-6 space-y-5">
        {/* Row 1: Premise Tabs & Date */}
        <div className="flex flex-col lg:flex-row gap-5 justify-between">
          <div className="flex p-1 bg-slate-100 rounded-lg w-fit">
            {[
              { id: "all", label: "All", icon: Users },
              { id: "residence", label: "Residence", icon: Building },
              { id: "mall", label: "Mall", icon: ShoppingBag },
              { id: "site", label: "Site", icon: MapPin },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActivePremise(tab.id);
                  setSelectedMall("");
                  setSelectedSite("");
                  setSelectedBuilding("");
                }}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center gap-2 ${
                  activePremise === tab.id
                    ? "bg-white text-blue-600 shadow-sm ring-1 ring-black/5"
                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                }`}
              >
                <tab.icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2 shadow-sm">
            <Calendar className="w-4 h-4 text-slate-400" />
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) =>
                setDateRange({ ...dateRange, start: e.target.value })
              }
              className="bg-transparent text-sm text-slate-700 outline-none w-32 cursor-pointer"
            />
            <span className="text-slate-300 text-xs">to</span>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) =>
                setDateRange({ ...dateRange, end: e.target.value })
              }
              className="bg-transparent text-sm text-slate-700 outline-none w-32 cursor-pointer"
            />
          </div>
        </div>

        {/* Row 2: Dynamic Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-slate-100">
          {/* Global Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleSearchSubmit}
              className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
            />
          </div>

          {/* Employee Specific Filter */}
          <div className="relative">
            <User className="absolute left-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
            <select
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
              className="w-full pl-9 pr-8 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none appearance-none bg-white cursor-pointer"
            >
              <option value="">All Employees</option>
              {employees.map((emp) => (
                <option key={emp._id} value={emp._id}>
                  {emp.name} ({emp.mobile || emp.employeeCode})
                </option>
              ))}
            </select>
          </div>

          {/* Conditional Dropdowns */}
          {activePremise === "mall" && (
            <div className="relative animate-in fade-in slide-in-from-left-2">
              <ShoppingBag className="absolute left-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
              <select
                value={selectedMall}
                onChange={(e) => setSelectedMall(e.target.value)}
                className="w-full pl-9 pr-8 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-100 outline-none appearance-none bg-white cursor-pointer"
              >
                <option value="">All Malls</option>
                {malls.map((m) => (
                  <option key={m._id} value={m._id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {activePremise === "site" && (
            <div className="relative animate-in fade-in slide-in-from-left-2">
              <MapPin className="absolute left-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
              <select
                value={selectedSite}
                onChange={(e) => setSelectedSite(e.target.value)}
                className="w-full pl-9 pr-8 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-100 outline-none appearance-none bg-white cursor-pointer"
              >
                <option value="">All Sites</option>
                {sites.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {activePremise === "residence" && (
            <div className="relative animate-in fade-in slide-in-from-left-2">
              <Building className="absolute left-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
              <select
                value={selectedBuilding}
                onChange={(e) => setSelectedBuilding(e.target.value)}
                className="w-full pl-9 pr-8 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-100 outline-none appearance-none bg-white cursor-pointer"
              >
                <option value="">All Buildings</option>
                {buildings.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={fetchData}
            className="bg-slate-800 hover:bg-slate-900 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm flex items-center justify-center gap-2"
          >
            <Filter className="w-4 h-4" /> Filter
          </button>
        </div>
      </div>

      {/* --- Data Table --- */}
      <DataTable
        title="Attendance Records"
        columns={columns}
        data={data}
        loading={loading}
        pagination={{
          page: 1,
          limit: data.length > 0 ? data.length : 10,
          total: data.length,
          totalPages: 1,
        }}
        onPageChange={() => {}}
        onLimitChange={() => {}}
      />
    </div>
  );
};

export default Attendance;
