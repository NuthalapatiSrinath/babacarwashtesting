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

  pagination,
  onPageChange,
  onLimitChange,
  onSearch,

  actionButton,
  renderExpandedRow,
}) => {
  const isServer = !!(pagination && onPageChange);

  const [localPage, setLocalPage] = useState(1);
  const [localLimit, setLocalLimit] = useState(10);
  const [localSearch, setLocalSearch] = useState("");
  const [expandedRows, setExpandedRows] = useState([]);

  const handleSearch = (e) => {
    const value = e.target.value;

    if (isServer && onSearch) onSearch(value);
    else {
      setLocalSearch(value);
      setLocalPage(1);
    }
  };

  // CLIENT SEARCH
  const processed = useMemo(() => {
    if (!isServer && localSearch) {
      return data.filter((row) =>
        Object.values(row).some((v) =>
          String(v).toLowerCase().includes(localSearch.toLowerCase())
        )
      );
    }
    return data;
  }, [data, localSearch, isServer]);

  const limit = isServer ? pagination.limit : localLimit;
  const page = isServer ? pagination.page : localPage;
  const total = isServer ? pagination.total : processed.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  const rows = isServer
    ? data
    : processed.slice((page - 1) * limit, page * limit);

  const changePage = (p) => {
    if (p < 1 || p > totalPages) return;
    if (isServer) onPageChange(p);
    else setLocalPage(p);
  };

  const changeLimit = (l) => {
    if (isServer && onLimitChange) onLimitChange(l);
    else {
      setLocalLimit(l);
      setLocalPage(1);
    }
  };

  const pages = (() => {
    const list = [];
    if (totalPages <= 6) {
      for (let i = 1; i <= totalPages; i++) list.push(i);
    } else if (page <= 3) list.push(1, 2, 3, 4, "...", totalPages);
    else if (page >= totalPages - 2)
      list.push(
        1,
        "...",
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages
      );
    else list.push(1, "...", page - 1, page, page + 1, "...", totalPages);
    return list;
  })();

  return (
    <div className="flex flex-col w-full h-full min-h-[420px] bg-white rounded-2xl border border-slate-200 shadow-sm">
      {/* HEADER */}
      <div className="p-5 border-b flex flex-col md:flex-row justify-between gap-3 flex-shrink-0">
        <div>
          <h2 className="text-lg font-bold text-slate-800">{title}</h2>
          <p className="text-xs text-slate-500 mt-1">Found {total} records</p>
        </div>

        <div className="flex gap-3 items-center">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              placeholder="Search..."
              defaultValue={isServer ? "" : localSearch}
              onChange={handleSearch}
              className="pl-9 pr-3 py-2 bg-slate-50 border rounded-lg text-sm"
            />
          </div>

          {actionButton}
        </div>
      </div>

      {/* TABLE BODY — auto stretch + scroll */}
      <div className="flex-1 min-h-0 flex">
        <div className="flex-1 overflow-auto custom-scrollbar relative">
          {/* Loader */}
          <AnimatePresence>
            {loading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center z-20"
              >
                <div className="px-6 py-4 bg-white rounded-xl border shadow">
                  <Loader2 className="animate-spin w-6 h-6 text-indigo-600 mx-auto" />
                  <p className="text-xs mt-2 font-bold text-slate-600">
                    Loading…
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <table className="w-full">
            <thead className="sticky top-0 bg-slate-50 border-b z-10">
              <tr>
                {columns.map((c, i) => (
                  <th
                    key={i}
                    className={`px-6 py-3 text-xs font-bold uppercase text-slate-500 ${
                      c.className || ""
                    }`}
                  >
                    {c.header}
                  </th>
                ))}
                {renderExpandedRow && <th className="w-8" />}
              </tr>
            </thead>

            <tbody className="divide-y">
              {!loading && rows.length === 0 && (
                <tr>
                  <td
                    colSpan={columns.length + 1}
                    className="py-24 text-center text-slate-400"
                  >
                    <Inbox className="w-8 h-8 mx-auto mb-2" />
                    No records found
                  </td>
                </tr>
              )}

              {rows.map((row, i) => {
                const id = row._id || row.id || i;
                const expanded = expandedRows.includes(id);

                return (
                  <React.Fragment key={id}>
                    <tr className={expanded ? "bg-slate-50" : ""}>
                      {columns.map((c, j) => (
                        <td
                          key={j}
                          className={`px-6 py-3 text-sm ${c.className || ""}`}
                        >
                          {c.render ? c.render(row, i) : row[c.accessor]}
                        </td>
                      ))}

                      {renderExpandedRow && (
                        <td>
                          <button
                            onClick={() =>
                              setExpandedRows(
                                expanded
                                  ? expandedRows.filter((x) => x !== id)
                                  : [...expandedRows, id]
                              )
                            }
                            className="p-1 rounded-full hover:bg-slate-100"
                          >
                            {expanded ? <ChevronUp /> : <ChevronDown />}
                          </button>
                        </td>
                      )}
                    </tr>

                    {expanded && renderExpandedRow && (
                      <tr>
                        <td colSpan={columns.length + 1}>
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: "auto" }}
                          >
                            <div className="p-4 bg-slate-50 border-t">
                              {renderExpandedRow(row)}
                            </div>
                          </motion.div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* FOOTER — pinned, no gaps */}
      <div className="px-6 py-3 border-t flex flex-wrap gap-3 items-center justify-between flex-shrink-0">
        <div className="text-xs flex gap-2 items-center">
          Rows per page:
          <select
            value={limit}
            onChange={(e) => changeLimit(Number(e.target.value))}
            className="border px-2 py-1 rounded"
          >
            {[5, 10, 20, 50].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-1 items-center">
          <button
            disabled={page === 1}
            onClick={() => changePage(page - 1)}
            className="p-1.5 border rounded"
          >
            <ChevronLeft />
          </button>

          {pages.map((p, i) => (
            <button
              key={i}
              disabled={p === "..."}
              onClick={() => typeof p === "number" && changePage(p)}
              className={`min-w-[28px] h-7 border rounded text-xs ${
                p === page ? "bg-indigo-600 text-white" : ""
              }`}
            >
              {p}
            </button>
          ))}

          <button
            disabled={page === totalPages}
            onClick={() => changePage(page + 1)}
            className="p-1.5 border rounded"
          >
            <ChevronRight />
          </button>
        </div>
      </div>
    </div>
  );
};

export default DataTable;
