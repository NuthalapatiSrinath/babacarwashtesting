import React, { useState } from "react";
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
  pagination = { page: 1, limit: 10, total: 0, totalPages: 1 },
  onPageChange,
  onLimitChange,
  onSearch,
  actionButton,
  renderExpandedRow,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedRows, setExpandedRows] = useState([]);

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    if (onSearch) onSearch(value);
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
    for (let i = 1; i <= pagination.totalPages; i++) {
      if (
        i === 1 ||
        i === pagination.totalPages ||
        (i >= pagination.page - 1 && i <= pagination.page + 1)
      ) {
        pages.push(i);
      } else if (
        (i === pagination.page - 2 && i > 1) ||
        (i === pagination.page + 2 && i < pagination.totalPages)
      ) {
        pages.push("...");
      }
    }
    return [...new Set(pages)];
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col w-full">
      {/* HEADER */}
      <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">{title}</h2>
          <p className="text-sm text-slate-500 mt-1">
            Total {pagination.total} records found
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
              value={searchTerm}
              onChange={handleSearch}
              className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all w-full md:w-64"
            />
          </div>
          {actionButton}
        </div>
      </div>

      {/* TABLE WRAPPER — HORIZONTAL SCROLL (MOBILE) */}
      <div className="relative w-full">
        {/* Smooth mobile scroll + visible scrollbar */}
        <div
          className="
            overflow-x-auto
            overflow-y-hidden
            scrollbar-thin
            scrollbar-thumb-slate-300
            scrollbar-track-transparent
            -mx-4 sm:mx-0
          "
        >
          <AnimatePresence>
            {loading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center"
              >
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                  <span className="text-sm font-medium text-slate-600">
                    Loading Data...
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Wide table to trigger side-scroll */}
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-20">
              <tr>
                {columns.map((col, idx) => (
                  <th
                    key={idx}
                    className={`px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider ${
                      col.className || ""
                    }`}
                  >
                    {col.header}
                  </th>
                ))}

                {renderExpandedRow && <th className="px-6 py-4 w-10" />}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {data.length > 0
                ? data.map((row, rowIndex) => {
                    const isExpanded = expandedRows.includes(row._id || row.id);

                    return (
                      <React.Fragment key={row._id || row.id || rowIndex}>
                        <tr
                          className={`hover:bg-slate-50/80 transition ${
                            isExpanded ? "bg-slate-50" : ""
                          }`}
                        >
                          {columns.map((col, i) => (
                            <td
                              key={i}
                              className="px-6 py-4 text-sm text-slate-600 whitespace-nowrap"
                            >
                              {col.render ? col.render(row) : row[col.accessor]}
                            </td>
                          ))}

                          {renderExpandedRow && (
                            <td className="px-6 py-4 text-right whitespace-nowrap">
                              <button
                                onClick={() => toggleRow(row._id || row.id)}
                                className="p-1 rounded-full hover:bg-slate-200 text-slate-400 hover:text-indigo-600 transition"
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
                          <tr className="bg-slate-50/50">
                            <td
                              colSpan={columns.length + 1}
                              className="px-6 py-0"
                            >
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                              >
                                <div className="py-4 pl-4">
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
                        className="px-6 py-20 text-center text-slate-400"
                      >
                        <div className="flex flex-col items-center gap-2">
                          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-2">
                            <Inbox className="w-6 h-6" />
                          </div>
                          <p>No records found</p>
                        </div>
                      </td>
                    </tr>
                  )}
            </tbody>
          </table>
        </div>
      </div>

      {/* FOOTER / PAGINATION */}
      <div className="px-6 py-4 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-50/50">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <span>Show</span>

          <select
            value={pagination.limit}
            onChange={(e) => onLimitChange(Number(e.target.value))}
            className="bg-white border border-slate-300 rounded px-2 py-1 text-sm focus:outline-none focus:border-indigo-500"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>

          <span>entries</span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onPageChange(pagination.page - 1)}
            disabled={pagination.page === 1 || loading}
            className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {getPageNumbers().map((pageNum, idx) => (
            <button
              key={idx}
              onClick={() =>
                typeof pageNum === "number" && onPageChange(pageNum)
              }
              disabled={pageNum === "..." || loading}
              className={`min-w-[32px] h-8 rounded-lg text-sm font-medium transition-all ${
                pageNum === pagination.page
                  ? "bg-indigo-600 text-white shadow-md border border-transparent"
                  : pageNum === "..."
                  ? "bg-transparent text-slate-400 cursor-default"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-indigo-200 hover:text-indigo-600"
              }`}
            >
              {pageNum}
            </button>
          ))}

          <button
            onClick={() => onPageChange(pagination.page + 1)}
            disabled={pagination.page === pagination.totalPages || loading}
            className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default DataTable;
