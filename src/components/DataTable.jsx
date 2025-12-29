import React, { useState, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Search,
  Loader2,
  Inbox,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const DataTable = ({
  title = "Data List",
  columns = [],
  data = [],
  loading = false,
  // Server-Side Props (Optional)
  pagination: serverPagination,
  onPageChange: serverOnPageChange,
  onLimitChange: serverOnLimitChange,
  onSearch: serverOnSearch,
  actionButton,
  renderExpandedRow,
}) => {
  // --- CLIENT-SIDE STATE (Fallback) ---
  const [clientPage, setClientPage] = useState(1);
  const [clientLimit, setClientLimit] = useState(10);
  const [clientSearch, setClientSearch] = useState("");
  const [expandedRows, setExpandedRows] = useState([]);

  // Detect Mode
  const isServerSide = !!(serverPagination && serverOnPageChange);

  // --- 1. SEARCH LOGIC ---
  const handleSearch = (e) => {
    const value = e.target.value;
    if (isServerSide && serverOnSearch) {
      serverOnSearch(value);
    } else {
      setClientSearch(value);
      setClientPage(1);
    }
  };

  // --- 2. DATA PROCESSING ---
  const processedData = useMemo(() => {
    let processed = data;
    // Client Filter
    if (!isServerSide && clientSearch) {
      processed = processed.filter((row) =>
        Object.values(row).some((val) =>
          String(val).toLowerCase().includes(clientSearch.toLowerCase())
        )
      );
    }
    return processed;
  }, [data, clientSearch, isServerSide]);

  // --- 3. PAGINATION CALCULATIONS ---
  const currentLimit = isServerSide ? serverPagination.limit : clientLimit;
  const currentPage = isServerSide ? serverPagination.page : clientPage;
  const totalRecords = isServerSide
    ? serverPagination.total
    : processedData.length;
  const totalPages = Math.ceil(totalRecords / currentLimit) || 1;

  // Determine Visible Rows
  const visibleRows = isServerSide
    ? data
    : processedData.slice(
        (currentPage - 1) * currentLimit,
        currentPage * currentLimit
      );

  // --- 4. HANDLERS ---
  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    if (isServerSide) {
      serverOnPageChange(newPage);
    } else {
      setClientPage(newPage);
    }
  };

  const handleLimitChange = (newLimit) => {
    if (isServerSide && serverOnLimitChange) {
      serverOnLimitChange(newLimit);
    } else {
      setClientLimit(newLimit);
      setClientPage(1);
    }
  };

  const toggleRow = (id) => {
    if (expandedRows.includes(id)) {
      setExpandedRows(expandedRows.filter((rowId) => rowId !== id));
    } else {
      setExpandedRows([...expandedRows, id]);
    }
  };

  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 4) pages.push(1, 2, 3, 4, 5, "...", totalPages);
      else if (currentPage >= totalPages - 3)
        pages.push(
          1,
          "...",
          totalPages - 4,
          totalPages - 3,
          totalPages - 2,
          totalPages - 1,
          totalPages
        );
      else
        pages.push(
          1,
          "...",
          currentPage - 1,
          currentPage,
          currentPage + 1,
          "...",
          totalPages
        );
    }
    return pages;
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col w-full h-full min-h-[500px] overflow-hidden">
      {/* HEADER */}
      <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white z-20 flex-shrink-0">
        <div>
          <h2 className="text-lg font-bold text-slate-800">{title}</h2>
          <p className="text-xs text-slate-500 mt-1">
            Found {totalRecords} records
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative group w-full sm:w-auto">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
            </div>
            <input
              type="text"
              placeholder="Search..."
              defaultValue={isServerSide ? "" : clientSearch}
              onChange={handleSearch}
              className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all w-full md:w-64"
            />
          </div>
          {actionButton}
        </div>
      </div>

      {/* TABLE BODY */}
      <div className="flex-1 overflow-hidden relative w-full">
        <div className="absolute inset-0 overflow-auto custom-scrollbar">
          <AnimatePresence>
            {loading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-white/80 backdrop-blur-[2px] z-30 flex items-center justify-center min-h-[300px]"
              >
                <div className="flex flex-col items-center gap-3 bg-white px-6 py-4 rounded-xl shadow-lg border border-slate-100">
                  <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
                  <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                    Loading...
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10 shadow-sm">
              <tr>
                {columns.map((col, idx) => (
                  <th
                    key={idx}
                    className={`px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider bg-slate-50 whitespace-nowrap ${
                      col.className || ""
                    }`}
                  >
                    {col.header}
                  </th>
                ))}
                {renderExpandedRow && (
                  <th className="px-6 py-4 w-10 bg-slate-50" />
                )}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {visibleRows.length > 0
                ? visibleRows.map((row, rowIndex) => {
                    const rowId = row.uniqueId || row._id || row.id || rowIndex;
                    const isExpanded = expandedRows.includes(rowId);
                    return (
                      <React.Fragment key={rowId}>
                        <tr
                          className={`hover:bg-slate-50/80 transition-colors duration-150 group ${
                            isExpanded ? "bg-slate-50" : "bg-white"
                          }`}
                        >
                          {columns.map((col, i) => (
                            <td
                              key={i}
                              className={`px-6 py-4 text-sm text-slate-600 ${
                                col.className || ""
                              }`}
                            >
                              <div
                                className="max-w-[200px] truncate"
                                title={
                                  typeof row[col.accessor] === "string"
                                    ? row[col.accessor]
                                    : ""
                                }
                              >
                                {col.render
                                  ? col.render(row, rowIndex)
                                  : row[col.accessor]}
                              </div>
                            </td>
                          ))}
                          {renderExpandedRow && (
                            <td className="px-6 py-4 text-right whitespace-nowrap">
                              <button
                                onClick={() => toggleRow(rowId)}
                                className={`p-1.5 rounded-full transition-all ${
                                  isExpanded
                                    ? "bg-indigo-100 text-indigo-600"
                                    : "hover:bg-slate-100 text-slate-400 hover:text-slate-600"
                                }`}
                              >
                                {isExpanded ? (
                                  <ChevronUp className="w-4 h-4" />
                                ) : (
                                  <ChevronDown className="w-4 h-4" />
                                )}
                              </button>
                            </td>
                          )}
                        </tr>
                        {isExpanded && renderExpandedRow && (
                          <tr className="bg-slate-50/30">
                            <td
                              colSpan={columns.length + 1}
                              className="px-0 py-0 border-b border-slate-100"
                            >
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                              >
                                <div className="p-4">
                                  {renderExpandedRow(row)}
                                </div>
                              </motion.div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                : !loading && (
                    <tr>
                      <td
                        colSpan={columns.length + (renderExpandedRow ? 1 : 0)}
                        className="px-6 py-24 text-center text-slate-400"
                      >
                        <div className="flex flex-col items-center justify-center gap-3">
                          <Inbox className="w-8 h-8 text-slate-300" />
                          <p className="text-sm font-medium">
                            No records found
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
            </tbody>
          </table>
        </div>
      </div>

      {/* FOOTER */}
      <div className="px-6 py-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white z-20 flex-shrink-0">
        <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
          <span>Rows per page:</span>
          <select
            value={currentLimit}
            onChange={(e) => handleLimitChange(Number(e.target.value))}
            className="bg-slate-50 border border-slate-200 rounded-md px-2 py-1 text-xs focus:outline-none focus:border-indigo-500 cursor-pointer text-slate-700"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1 || loading}
            className="p-1.5 rounded-md border border-slate-200 hover:bg-slate-50 text-slate-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-1 mx-2">
            {getPageNumbers().map((pageNum, idx) => (
              <button
                key={idx}
                onClick={() =>
                  typeof pageNum === "number" && handlePageChange(pageNum)
                }
                disabled={pageNum === "..." || loading}
                className={`min-w-[28px] h-7 rounded-md text-xs font-bold transition-all border ${
                  pageNum === currentPage
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                    : "bg-white border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-600"
                }`}
              >
                {pageNum}
              </button>
            ))}
          </div>
          <button
            onClick={() =>
              handlePageChange(Math.min(totalPages, currentPage + 1))
            }
            disabled={currentPage === totalPages || loading}
            className="p-1.5 rounded-md border border-slate-200 hover:bg-slate-50 text-slate-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default DataTable;
