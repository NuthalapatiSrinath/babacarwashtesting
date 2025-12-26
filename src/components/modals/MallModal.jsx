import React, { useState, useEffect } from "react";
import { X, ShoppingBag, DollarSign, CreditCard, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { mallService } from "../../api/mallService";

const MallModal = ({ isOpen, onClose, onSuccess, editData }) => {
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    amount: 0,
    card_charges: 0,
  });

  useEffect(() => {
    if (isOpen) {
      if (editData) {
        console.log("[MallModal] Editing:", editData);
        setFormData({
          name: editData.name || "",
          amount: editData.amount || 0,
          card_charges: editData.card_charges || 0,
        });
      } else {
        console.log("[MallModal] Creating New");
        setFormData({ name: "", amount: 0, card_charges: 0 });
      }
    }
  }, [isOpen, editData]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    console.log("[MallModal] Submitting:", formData);

    if (!formData.name.trim()) {
      toast.error("Mall name is required");
      return;
    }

    setLoading(true);
    try {
      if (editData) {
        await mallService.update(editData._id, formData);
        toast.success("Mall updated successfully");
      } else {
        await mallService.create(formData);
        toast.success("Mall created successfully");
      }
      onSuccess();
      onClose();
    } catch (error) {
      console.error("[MallModal] Error:", error);
      toast.error(error.message || "Operation failed");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Optimized Backdrop: No blur, smooth transition */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/60"
        />

        {/* Optimized Modal Content: Linear easing */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden relative z-10"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h3 className="text-lg font-bold text-slate-800">
              {editData ? "Edit Mall" : "Add New Mall"}
            </h3>
            <button
              onClick={onClose}
              className="p-1 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Name */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Mall Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <ShoppingBag className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                  placeholder="E.g. City Center Mall"
                  autoFocus
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Amount */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Amount
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <DollarSign className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="number"
                    min="0"
                    value={formData.amount}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        amount: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Card Charges */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Card Charges
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <CreditCard className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="number"
                    min="0"
                    value={formData.card_charges}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        card_charges: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end pt-4 gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-all shadow-lg shadow-indigo-600/20 flex items-center gap-2 disabled:opacity-70"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {editData ? "Save Changes" : "Create Mall"}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default MallModal;
