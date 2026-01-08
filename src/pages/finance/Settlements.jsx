import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  CheckCircle,
  Clock,
  DollarSign,
  Calendar,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import DataTable from "../../components/DataTable";
import {
  fetchSettlements,
  approveSettlement,
  setSelectedSettlement,
  clearSelectedSettlement,
} from "../../redux/slices/settlementSlice";

const Settlements = () => {
  const dispatch = useDispatch();
  const [showApproveModal, setShowApproveModal] = useState(false);

  const { settlements, total, loading, currentPage, totalPages, selectedSettlement } = useSelector(
    (state) => state.settlement
  );

  useEffect(() => {
    dispatch(fetchSettlements({ page: 1, limit: 50 }));
  }, [dispatch]);

  // --- APPROVE HANDLERS ---
  const handleApproveClick = (settlement) => {
    dispatch(setSelectedSettlement(settlement));
    setShowApproveModal(true);
  };

  const handleApproveConfirm = async () => {
    if (!selectedSettlement) return;

    try {
      await dispatch(approveSettlement(selectedSettlement._id)).unwrap();
      toast.success("Settlement Approved!");
      setShowApproveModal(false);
      dispatch(clearSelectedSettlement());
      dispatch(fetchSettlements({ page: currentPage, limit: 50 }));
    } catch (error) {
      console.error(error);
      toast.error("Failed to approve settlement");
    }
  };

  const handlePageChange = (page) => {
    dispatch(fetchSettlements({ page, limit: 50 }));
  };

  // --- TABLE COLUMNS ---
  const columns = [
    {
      key: "index",
      header: "#",
      render: (row, index) => (
        <div className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
          {(currentPage - 1) * 50 + index + 1}
        </div>
      ),
    },
    {
      key: "date",
      header: "Date",
      render: (row) => (
        <div className="flex flex-col">
          <div className="flex items-center gap-2 text-sm font-medium" style={{ color: 'var(--color-text)' }}>
            <Calendar className="w-4 h-4" style={{ color: 'var(--color-text-light)' }} />
            {new Date(row.createdAt).toLocaleDateString()}
          </div>
          <div className="text-xs ml-6" style={{ color: 'var(--color-text-light)' }}>
            {new Date(row.createdAt).toLocaleTimeString()}
          </div>
        </div>
      ),
    },
    {
      key: "supervisor",
      header: "Supervisor",
      render: (row) => (
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs"
            style={{
              backgroundColor: 'var(--color-primary-light)',
              color: 'var(--color-primary)',
            }}
          >
            {row.supervisor?.name?.charAt(0) || "U"}
          </div>
          <span className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>
            {row.supervisor?.name || "Unknown"}
          </span>
        </div>
      ),
    },
    {
      key: "amount",
      header: "Total Amount",
      render: (row) => (
        <div className="text-right">
          <span className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>
            {row.amount || 0}
          </span>
          <span className="text-xs ml-1" style={{ color: 'var(--color-text-light)' }}>
            AED
          </span>
        </div>
      ),
    },
    {
      key: "breakdown",
      header: "Breakdown",
      render: (row) => (
        <div className="flex justify-center gap-2 text-xs">
          <span
            className="px-2 py-1 rounded border font-medium"
            style={{
              backgroundColor: 'var(--color-success-light)',
              color: 'var(--color-success)',
              borderColor: 'var(--color-success-light)',
            }}
            title="Cash"
          >
            💵 {row.cash || 0}
          </span>
          <span
            className="px-2 py-1 rounded border font-medium"
            style={{
              backgroundColor: 'var(--color-primary-light)',
              color: 'var(--color-primary)',
              borderColor: 'var(--color-primary-light)',
            }}
            title="Card"
          >
            💳 {row.card || 0}
          </span>
          <span
            className="px-2 py-1 rounded border font-medium"
            style={{
              backgroundColor: '#f3e8ff',
              color: '#7c3aed',
              borderColor: '#e9d5ff',
            }}
            title="Bank"
          >
            🏦 {row.bank || 0}
          </span>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => (
        <div className="text-center">
          <span
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border"
            style={
              row.status === "completed"
                ? {
                    backgroundColor: 'var(--color-success-light)',
                    color: 'var(--color-success)',
                    borderColor: 'var(--color-success-light)',
                  }
                : {
                    backgroundColor: 'var(--color-warning-light)',
                    color: 'var(--color-warning)',
                    borderColor: 'var(--color-warning-light)',
                  }
            }
          >
            {row.status === "completed" ? (
              <CheckCircle className="w-3 h-3" />
            ) : (
              <Clock className="w-3 h-3" />
            )}
            {row.status || "Pending"}
          </span>
        </div>
      ),
    },
    {
      key: "action",
      header: "Action",
      render: (row) => (
        <div className="text-right">
          {row.status !== "completed" ? (
            <button
              onClick={() => handleApproveClick(row)}
              className="px-4 py-2 text-white text-xs font-bold rounded-lg shadow-sm transition-all active:scale-95"
              style={{
                backgroundColor: 'var(--color-primary)',
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = 'var(--color-primary-hover)')
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = 'var(--color-primary)')
              }
            >
              Approve
            </button>
          ) : (
            <span className="text-xs font-medium italic" style={{ color: 'var(--color-text-light)' }}>
              No actions
            </span>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="p-2 w-full">
      {/* DataTable */}
      <DataTable
        title="Settlements"
        columns={columns}
        data={settlements}
        loading={loading}
        pagination={{
          page: currentPage,
          limit: 50,
          total: total,
        }}
        onPageChange={handlePageChange}
        emptyMessage="No settlements found"
      />

      {/* Approve Modal */}
      {showApproveModal && selectedSettlement && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div
            className="rounded-xl shadow-2xl max-w-md w-full"
            style={{ backgroundColor: "var(--color-card)" }}
          >
            {/* Modal Header */}
            <div
              className="p-6 border-b flex items-center justify-between"
              style={{ borderColor: "var(--color-border)" }}
            >
              <h2
                className="text-xl font-bold flex items-center gap-2"
                style={{ color: "var(--color-text)" }}
              >
                <CheckCircle
                  className="w-6 h-6"
                  style={{ color: "var(--color-primary)" }}
                />
                Approve Settlement
              </h2>
              <button
                onClick={() => {
                  setShowApproveModal(false);
                  dispatch(clearSelectedSettlement());
                }}
                className="p-1 rounded-lg transition-colors"
                style={{ color: "var(--color-text-light)" }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = "var(--color-page)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = "transparent")
                }
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              <p style={{ color: "var(--color-text)" }}>
                Are you sure you want to approve this settlement?
              </p>

              <div
                className="p-4 rounded-lg"
                style={{ backgroundColor: "var(--color-page)" }}
              >
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span style={{ color: "var(--color-text-light)" }}>
                      Supervisor:
                    </span>
                    <span
                      className="font-semibold"
                      style={{ color: "var(--color-text)" }}
                    >
                      {selectedSettlement.supervisor?.name || "Unknown"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: "var(--color-text-light)" }}>
                      Total Amount:
                    </span>
                    <span
                      className="font-bold text-lg"
                      style={{ color: "var(--color-primary)" }}
                    >
                      {selectedSettlement.amount || 0} AED
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: "var(--color-text-light)" }}>
                      Cash:
                    </span>
                    <span
                      className="font-semibold"
                      style={{ color: "var(--color-success)" }}
                    >
                      {selectedSettlement.cash || 0} AED
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: "var(--color-text-light)" }}>
                      Card:
                    </span>
                    <span
                      className="font-semibold"
                      style={{ color: "var(--color-primary)" }}
                    >
                      {selectedSettlement.card || 0} AED
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: "var(--color-text-light)" }}>
                      Bank:
                    </span>
                    <span
                      className="font-semibold"
                      style={{ color: "var(--color-text)" }}
                    >
                      {selectedSettlement.bank || 0} AED
                    </span>
                  </div>
                </div>
              </div>

              <p
                className="text-sm"
                style={{ color: "var(--color-text-light)" }}
              >
                This action cannot be undone.
              </p>
            </div>

            {/* Modal Footer */}
            <div
              className="p-6 border-t flex gap-3 justify-end"
              style={{ borderColor: "var(--color-border)" }}
            >
              <button
                onClick={() => {
                  setShowApproveModal(false);
                  dispatch(clearSelectedSettlement());
                }}
                className="px-4 py-2 rounded-lg font-medium transition-colors"
                style={{
                  backgroundColor: "var(--color-page)",
                  color: "var(--color-text)",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor =
                    "var(--color-border)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = "var(--color-page)")
                }
              >
                Cancel
              </button>
              <button
                onClick={handleApproveConfirm}
                className="px-4 py-2 text-white rounded-lg font-medium transition-all"
                style={{
                  backgroundColor: "var(--color-success)",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = "#059669")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor =
                    "var(--color-success)")
                }
              >
                Approve Settlement
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settlements;
