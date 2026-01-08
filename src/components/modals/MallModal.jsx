import React, { useState, useEffect } from "react";
import { ShoppingBag, DollarSign, CreditCard, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { useDispatch } from "react-redux";
import { createMall, updateMall } from "../../redux/slices/mallSlice";
import ModalManager from "./ModalManager";

const MallModal = ({ isOpen, onClose, onSuccess, editData }) => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    amount: 0,
    card_charges: 0,
  });

  useEffect(() => {
    if (isOpen) {
      console.log(
        "🏬 [MALL MODAL] Modal opened",
        editData ? "for editing" : "for creating"
      );
      if (editData) {
        console.log("📝 [MALL MODAL] Edit data:", editData);
        setFormData({
          name: editData.name || "",
          amount: editData.amount || 0,
          card_charges: editData.card_charges || 0,
        });
      } else {
        console.log("➕ [MALL MODAL] Creating new mall");
        setFormData({ name: "", amount: 0, card_charges: 0 });
      }
    }
  }, [isOpen, editData]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    console.log("💾 [MALL MODAL] Submitting form:", formData);

    if (!formData.name.trim()) {
      console.warn("⚠️ [MALL MODAL] Validation failed: Name is empty");
      toast.error("Mall name is required");
      return;
    }

    setLoading(true);
    try {
      if (editData) {
        console.log("✏️ [MALL MODAL] Updating mall via Redux:", editData._id);
        await dispatch(
          updateMall({ id: editData._id, data: formData })
        ).unwrap();
        toast.success("Mall updated successfully");
        console.log("✅ [MALL MODAL] Mall updated successfully");
      } else {
        console.log("➕ [MALL MODAL] Creating mall via Redux");
        await dispatch(createMall(formData)).unwrap();
        toast.success("Mall created successfully");
        console.log("✅ [MALL MODAL] Mall created successfully");
      }
      onSuccess();
      onClose();
    } catch (error) {
      console.error("❌ [MALL MODAL] Submit error:", error);
      toast.error(error.message || "Operation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalManager
      isOpen={isOpen}
      onClose={onClose}
      title={editData ? "Edit Mall" : "Add New Mall"}
      pageName="MALLS"
      modalType={editData ? "EDIT" : "CREATE"}
      size="md"
    >
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
            <label className="text-sm font-medium text-slate-700">Amount</label>
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
    </ModalManager>
  );
};

export default MallModal;
