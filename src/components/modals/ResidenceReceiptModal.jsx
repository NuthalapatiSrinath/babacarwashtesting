import React, { useRef, useState, useEffect } from "react";
import { Download, Edit2, Check, Loader2, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import html2canvas from "html2canvas";
import toast from "react-hot-toast";

const ResidenceReceiptModal = ({ isOpen, onClose, data, type = "Receipt" }) => {
  const contentRef = useRef(null);
  const [downloading, setDownloading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [localData, setLocalData] = useState(null);

  // Helper to format the Long Backend ID into a short Receipt Number
  const formatId = (rawId) => {
    if (!rawId) return "000000";
    if (rawId.length < 10) return rawId;
    return rawId.slice(-6).toUpperCase();
  };

  useEffect(() => {
    if (data) {
      setLocalData({
        displayId: formatId(data.id || data._id),
        originalId: data.id || data._id,
        date: data.createdAt ? new Date(data.createdAt) : new Date(),
        carNo: data.vehicle?.registration_no || "-",
        parkingNo: data.vehicle?.parking_no || "-",
        building: data.building?.name || data.customer?.building?.name || "-",
        billAmountDesc:
          data.billAmountDesc ||
          `For the month of ${
            data.createdAt
              ? new Date(data.createdAt).toLocaleDateString("en-US", {
                  month: "long",
                })
              : "Current Month"
          }`,
        amount: data.amount_paid || 0,
        vat: "-",
        total: data.amount_paid || 0,
        tip: data.tip || 0,
        balance: data.balance || 0,
        receiver: data.worker?.name || "Admin",
        paymentMode: (data.payment_mode || "cash").toUpperCase(),
        status: (data.status || "Completed").toUpperCase(),
        // Extra fields for Invoice
        customerName: data.customer?.name || "Valued Customer",
        customerPhone: data.customer?.phone || "-",
      });
    }
  }, [data, isOpen]);

  if (!isOpen || !localData) return null;

  const handleDownload = async () => {
    if (!contentRef.current) return;

    if (isEditing) setIsEditing(false);
    // Wait for inputs to revert to text before capturing
    await new Promise((resolve) => setTimeout(resolve, 300));

    setDownloading(true);
    try {
      const isInvoice = type === "Invoice";

      const canvas = await html2canvas(contentRef.current, {
        scale: 2, // High resolution
        useCORS: true,
        backgroundColor: "#ffffff",
        windowWidth: 1200, // Simulate desktop view
        width: isInvoice ? 794 : 800, // A4 Width vs Receipt Width
        onclone: (clonedDoc) => {
          const el = clonedDoc.getElementById("capture-content");
          if (el) {
            el.style.width = isInvoice ? "794px" : "800px";
            el.style.maxWidth = "none";
            el.style.display = "block";
            el.style.padding = "40px";
            el.style.height = "auto";
          }
        },
      });

      const image = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = image;
      link.download = `${type}_${localData.displayId}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(`${type} downloaded!`);
    } catch (error) {
      console.error("Download failed:", error);
      toast.error("Download failed");
    } finally {
      setDownloading(false);
    }
  };

  const handleChange = (key, value) => {
    setLocalData((prev) => ({ ...prev, [key]: value }));
  };

  // --- LAYOUT 1: RECEIPT (Vertical) ---
  const renderReceiptLayout = () => (
    <div className="flex flex-col items-center">
      {/* Header */}
      <div className="flex flex-col items-center mb-6 text-center">
        <div className="w-20 h-20 mb-2">
          <img
            src="/carwash.jpeg"
            alt="Logo"
            className="w-full h-full object-contain"
          />
        </div>
        <h1 className="text-xl font-bold uppercase tracking-wide">
          BABA CAR WASHING AND CLEANING L.L.C.
        </h1>
        <p className="text-sm text-slate-500">PO Box 126297, Dubai - UAE</p>
        <p className="text-sm text-slate-500">Mob: 055 241 1075</p>
        <p className="text-sm text-slate-600 font-bold mt-1">
          TRN: 105021812000003
        </p>
      </div>

      {/* Title */}
      <div className="text-center mb-6">
        <span className="font-bold uppercase text-lg tracking-widest text-slate-800">
          {localData.paymentMode.includes("CARD")
            ? "CARD RECEIPT"
            : "CASH RECEIPT"}
        </span>
      </div>

      <div className="border-t-2 border-dashed border-slate-300 w-full mb-6"></div>

      {/* Meta Data */}
      <div className="flex justify-between items-end mb-6 text-base w-full">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-900">No:</span>
          {isEditing ? (
            <input
              value={localData.displayId}
              onChange={(e) => handleChange("displayId", e.target.value)}
              className="font-bold text-red-600 text-xl w-32 border-b border-indigo-300 outline-none"
            />
          ) : (
            <span className="text-red-600 font-bold text-xl">
              {localData.displayId}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-900">Date:</span>
          <span>
            {localData.date.toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "2-digit",
              year: "2-digit",
            })}
          </span>
        </div>
      </div>

      {/* Data Rows */}
      <div className="space-y-4 text-sm md:text-base font-medium w-full">
        <ReceiptRow
          label="Car No"
          value={localData.carNo}
          isEditing={isEditing}
          onChange={(v) => handleChange("carNo", v)}
        />
        <ReceiptRow
          label="Parking No"
          value={localData.parkingNo}
          isEditing={isEditing}
          onChange={(v) => handleChange("parkingNo", v)}
        />
        <ReceiptRow
          label="Office / Residence Building"
          value={localData.building}
          isEditing={isEditing}
          onChange={(v) => handleChange("building", v)}
          isUppercase
        />
        <ReceiptRow
          label="Bill Amount"
          value={localData.billAmountDesc}
          isEditing={isEditing}
          onChange={(v) => handleChange("billAmountDesc", v)}
        />
        <ReceiptRow
          label="VAT 5%"
          value={localData.vat}
          isEditing={isEditing}
          onChange={(v) => handleChange("vat", v)}
        />
        <div className="pt-2">
          <ReceiptRow
            label="Total AED"
            value={`${localData.total} د.إ`}
            isEditing={isEditing}
            onChange={(v) => handleChange("total", v)}
          />
        </div>
        <ReceiptRow
          label="Tip"
          value={`${localData.tip} د.إ`}
          isEditing={isEditing}
          onChange={(v) => handleChange("tip", v)}
        />
        <ReceiptRow
          label="Balance"
          value={`${localData.balance} د.إ`}
          isEditing={isEditing}
          onChange={(v) => handleChange("balance", v)}
        />
        <ReceiptRow
          label="Payment Mode"
          value={localData.paymentMode}
          isEditing={isEditing}
          onChange={(v) => handleChange("paymentMode", v)}
        />

        {/* Receiver */}
        <div className="pt-6 w-full">
          <div className="flex items-end justify-between w-full">
            <span className="font-bold text-slate-900 shrink-0 w-32 pb-1">
              Receiver:
            </span>
            <div className="flex-1 border-b-2 border-dotted border-slate-400 mb-1 ml-2 relative">
              {isEditing ? (
                <input
                  value={localData.receiver}
                  onChange={(e) => handleChange("receiver", e.target.value)}
                  className="w-full text-center bg-transparent outline-none font-medium uppercase text-indigo-700"
                />
              ) : (
                <div className="text-center w-full pb-1 uppercase">
                  {localData.receiver}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // --- LAYOUT 2: INVOICE (A4 Style) ---
  const renderInvoiceLayout = () => (
    <div className="flex flex-col w-full text-slate-800 font-sans">
      {/* Invoice Header */}
      <div className="text-center mb-8">
        <div className="w-24 h-24 mx-auto mb-2">
          <img
            src="/carwash.jpeg"
            alt="Logo"
            className="w-full h-full object-contain"
          />
        </div>
        <h1 className="font-bold text-xl uppercase mb-2">
          BABA CAR WASHING AND CLEANING L.L.C.
        </h1>
        <div className="text-sm font-medium text-slate-600 space-y-1">
          <p>Mobile: 055 241 1075</p>
          <p>TRN: 105021812000003</p>
        </div>
      </div>

      {/* Info Grid */}
      <div className="flex justify-between items-start mb-8 text-sm">
        <div className="space-y-2">
          <div className="flex gap-2">
            <span className="font-bold w-24">Issued To:</span>
            <span>
              {localData.customerPhone !== "-"
                ? localData.customerPhone
                : localData.carNo}
            </span>
          </div>
          <div className="flex gap-2">
            <span className="font-bold w-24">Car No:</span>
            <span>{localData.carNo}</span>
          </div>
          <div className="flex gap-2">
            <span className="font-bold w-24">Parking No:</span>
            <span>{localData.parkingNo}</span>
          </div>
          <div className="flex gap-2">
            <span className="font-bold w-24">Building Name:</span>
            <span>{localData.building}</span>
          </div>
        </div>

        <div className="text-right space-y-2">
          <div className="flex gap-2 justify-end">
            <span className="font-bold">Invoice No:</span>
            <span>INV/{localData.displayId}</span>
          </div>
          <div className="flex gap-2 justify-end">
            <span className="font-bold">Date:</span>
            <span>{localData.date.toLocaleDateString("en-GB")}</span>
          </div>
          <div className="flex gap-2 justify-end">
            <span className="font-bold">Due Date:</span>
            <span>{localData.date.toLocaleDateString("en-GB")}</span>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="w-full mb-8 border-b border-gray-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#e8e6e1] text-slate-800">
              <th className="py-3 px-4 text-left font-bold w-[40%]">
                Description
              </th>
              <th className="py-3 px-4 text-center font-bold">Unit Price</th>
              <th className="py-3 px-4 text-center font-bold">Quantity</th>
              <th className="py-3 px-4 text-right font-bold">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            <tr>
              <td className="py-4 px-4 font-medium text-slate-700">
                CAR WASH PAYMENT
              </td>
              <td className="py-4 px-4 text-center text-slate-600">1</td>
              <td className="py-4 px-4 text-center text-slate-600">
                {localData.amount}
              </td>
              <td className="py-4 px-4 text-right font-bold text-slate-800">
                {localData.amount}
              </td>
            </tr>
          </tbody>
          <tfoot>
            <tr className="bg-[#e8e6e1]">
              <td
                colSpan="3"
                className="py-3 px-4 text-right font-bold text-slate-800"
              >
                Total
              </td>
              <td className="py-3 px-4 text-right font-bold text-slate-900">
                {localData.amount}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* System Gen Msg */}
      <div className="text-center text-xs font-bold uppercase text-slate-700 mb-8 tracking-wide">
        THIS IS SYSTEM GENERATED INVOICE
      </div>

      {/* Bank Details */}
      <div className="mb-8 text-xs">
        <h3 className="text-red-500 font-bold text-sm mb-3">Bank Details</h3>
        <div className="grid grid-cols-[100px_1fr] gap-y-1 gap-x-4 text-slate-700">
          <span className="font-bold">Bank Address:</span>{" "}
          <span>Ummhurair Dubai UAE</span>
          <span className="font-bold">Swift Code:</span> <span>NRAKAEAK</span>
          <span className="font-bold">Bank Name:</span>{" "}
          <span>Rak Bank(The name is National Bank of Ras Alkhaimah)</span>
          <span className="font-bold">Bank Account:</span>{" "}
          <span>0033422488061</span>
          <span className="font-bold">Account Name:</span>{" "}
          <span>Baba car washing and cleaning</span>
          <span className="font-bold">IBAN No:</span>{" "}
          <span>AE46 0400 0000 3342 2488 061</span>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center space-y-2 mt-auto">
        <p className="text-[10px] text-slate-500 max-w-lg mx-auto leading-relaxed">
          Please mention your vehicle number and building name in the payment
          reciept and send an email to +971552411075 or
          customerregistration@babagroup.ae once the payment done
        </p>
        <p className="font-bold text-sm text-slate-800 pt-2">
          THANK YOU FOR CHOOSING BABA CAR WASH
        </p>
      </div>
    </div>
  );

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] overflow-y-auto bg-black/60 backdrop-blur-sm">
        <div className="flex min-h-full items-center justify-center p-4 py-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`w-full flex flex-col items-center ${
              type === "Invoice" ? "max-w-[794px]" : "max-w-xl"
            }`}
          >
            {/* --- PAPER CONTAINER --- */}
            <div
              id="capture-content"
              ref={contentRef}
              className={`bg-white shadow-2xl relative text-slate-900 font-sans ${
                type === "Invoice"
                  ? "p-12 min-h-[1123px]"
                  : "p-8 w-full max-w-[800px]"
              }`}
            >
              {type === "Invoice"
                ? renderInvoiceLayout()
                : renderReceiptLayout()}
            </div>

            {/* Buttons */}
            <div className="flex gap-3 mt-6 pb-6">
              <button
                onClick={onClose}
                className="px-6 py-2 bg-white text-slate-700 font-bold rounded-lg shadow hover:bg-slate-50 transition-colors flex items-center gap-2"
              >
                <X className="w-4 h-4" /> Close
              </button>

              {/* Edit button enables manual corrections before download */}
              {type !== "Invoice" && (
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className={`px-6 py-2 font-bold rounded-lg shadow transition-colors flex items-center gap-2 ${
                    isEditing
                      ? "bg-emerald-600 text-white hover:bg-emerald-700"
                      : "bg-blue-600 text-white hover:bg-blue-700"
                  }`}
                >
                  {isEditing ? (
                    <>
                      <Check className="w-4 h-4" /> Done
                    </>
                  ) : (
                    <>
                      <Edit2 className="w-4 h-4" /> Edit
                    </>
                  )}
                </button>
              )}

              <button
                onClick={handleDownload}
                disabled={downloading}
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-lg transition-colors flex items-center gap-2"
              >
                {downloading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                Download {type}
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
};

// --- HELPER COMPONENT FOR RECEIPT ROWS ---
const ReceiptRow = ({ label, value, isEditing, onChange, isUppercase }) => (
  <div className="flex items-end justify-between w-full">
    <span className="font-bold text-slate-900 shrink-0 w-36 md:w-48 pb-1">
      {label}:
    </span>
    <div className="flex-1 border-b-2 border-dotted border-slate-400 mb-1 relative ml-2">
      {isEditing ? (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full text-center bg-transparent outline-none border-none p-0 pb-1 focus:ring-0 text-indigo-700 font-bold ${
            isUppercase ? "uppercase" : ""
          }`}
        />
      ) : (
        <div
          className={`text-center w-full pb-1 leading-relaxed ${
            isUppercase ? "uppercase" : ""
          }`}
        >
          {value || "-"}
        </div>
      )}
    </div>
  </div>
);

export default ResidenceReceiptModal;
