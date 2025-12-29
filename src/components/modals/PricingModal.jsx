import React, { useState, useEffect } from "react";
import { X, Loader2, Building, ShoppingBag } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

// API
import { pricingService } from "../../api/pricingService";
import { mallService } from "../../api/mallService";

const PricingModal = ({ isOpen, onClose, pricing, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [malls, setMalls] = useState([]);

  // Form State
  const [formData, setFormData] = useState({
    service_type: "mobile",
    mall: "",
    // Sedan
    sedan_onetime: "",
    sedan_once: "",
    sedan_twice: "",
    sedan_thrice: "",
    sedan_daily: "",
    // SUV
    suv_onetime: "",
    suv_once: "",
    suv_twice: "",
    suv_thrice: "",
    suv_daily: "",
  });

  // Load Data
  useEffect(() => {
    if (isOpen) {
      const fetchMalls = async () => {
        try {
          // Fetch generic list of malls
          const res = await mallService.list(1, 1000);
          setMalls(res.data || []);
        } catch (e) {
          console.error(e);
        }
      };
      fetchMalls();

      if (pricing) {
        // Map nested backend data to flat form state
        const sedan = pricing.sedan || {};
        const suv = pricing["4x4"] || {};

        setFormData({
          service_type: pricing.service_type || "mobile",
          mall: pricing.mall?._id || pricing.mall || "",

          sedan_onetime: sedan.onetime || "",
          sedan_once: sedan.once || "",
          sedan_twice: sedan.twice || "",
          sedan_thrice: sedan.thrice || "",
          sedan_daily: sedan.daily || "",

          suv_onetime: suv.onetime || "",
          suv_once: suv.once || "",
          suv_twice: suv.twice || "",
          suv_thrice: suv.thrice || "",
          suv_daily: suv.daily || "",
        });
      } else {
        // Reset Form
        setFormData({
          service_type: "mobile",
          mall: "",
          sedan_onetime: "",
          sedan_once: "",
          sedan_twice: "",
          sedan_thrice: "",
          sedan_daily: "",
          suv_onetime: "",
          suv_once: "",
          suv_twice: "",
          suv_thrice: "",
          suv_daily: "",
        });
      }
    }
  }, [isOpen, pricing]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Construct Nested Payload
      const payload = {
        service_type: formData.service_type,
        ...(formData.service_type === "mall" && { mall: formData.mall }),

        sedan: {
          onetime: formData.sedan_onetime || null,
          once: formData.sedan_once || null,
          twice: formData.sedan_twice || null,
          thrice: formData.sedan_thrice || null,
          daily: formData.sedan_daily || null,
        },
        "4x4": {
          onetime: formData.suv_onetime || null,
          once: formData.suv_once || null,
          twice: formData.suv_twice || null,
          thrice: formData.suv_thrice || null,
          daily: formData.suv_daily || null,
        },
      };

      if (pricing) {
        await pricingService.update(pricing._id, payload);
        toast.success("Pricing updated");
      } else {
        await pricingService.create(payload);
        toast.success("Pricing created");
      }
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to save");
    } finally {
      setLoading(false);
    }
  };

  // --- Styles ---
  const sectionLabel =
    "block text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-3 mt-1 border-b border-slate-100 pb-1";
  const labelClass =
    "block text-[11px] font-bold text-slate-500 uppercase mb-1 ml-1";
  const inputGroupClass =
    "relative flex items-center bg-white border border-slate-300 rounded-lg px-2.5 py-2 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all";
  const inputClass =
    "w-full text-sm text-slate-800 outline-none placeholder:text-slate-300 font-bold";

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* 1. BACKDROP: No Blur = No Lag. Just simple opacity fade. */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/50" // Simple semi-transparent black
          />

          {/* 2. MODAL: Snappy Spring Animation */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 15 }}
            transition={{
              type: "spring",
              stiffness: 350,
              damping: 25,
              mass: 0.5,
            }}
            className="bg-white w-full max-w-2xl rounded-xl shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-white flex-shrink-0">
              <h3 className="text-lg font-bold text-slate-800">
                {pricing ? "Update Pricing" : "Add Pricing"}
              </h3>
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form
              onSubmit={handleSubmit}
              className="p-6 space-y-6 overflow-y-auto"
            >
              {/* Service Type & Mall */}
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className={labelClass}>Service Type</label>
                  <div className={inputGroupClass}>
                    <Building className="w-4 h-4 text-slate-400 mr-2" />
                    <select
                      name="service_type"
                      value={formData.service_type}
                      onChange={handleChange}
                      className={`${inputClass} bg-transparent cursor-pointer uppercase`}
                    >
                      <option value="mobile">Mobile</option>
                      <option value="mall">Mall</option>
                      <option value="residence">Residence</option>
                    </select>
                  </div>
                </div>

                {formData.service_type === "mall" && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <label className={labelClass}>Select Mall</label>
                    <div className={inputGroupClass}>
                      <ShoppingBag className="w-4 h-4 text-slate-400 mr-2" />
                      <select
                        name="mall"
                        value={formData.mall}
                        onChange={handleChange}
                        className={`${inputClass} bg-transparent cursor-pointer`}
                      >
                        <option value="">-- Select Mall --</option>
                        {malls.map((m) => (
                          <option key={m._id} value={m._id}>
                            {m.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Sedan Pricing */}
              <div>
                <h4 className={sectionLabel}>Sedan Pricing</h4>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  <div>
                    <label className={labelClass}>Onetime</label>
                    <input
                      type="number"
                      name="sedan_onetime"
                      value={formData.sedan_onetime}
                      onChange={handleChange}
                      className={inputGroupClass + " w-full text-sm font-bold"}
                      placeholder="0"
                    />
                  </div>

                  {formData.service_type === "residence" && (
                    <>
                      <div>
                        <label className={labelClass}>Once/Wk</label>
                        <input
                          type="number"
                          name="sedan_once"
                          value={formData.sedan_once}
                          onChange={handleChange}
                          className={
                            inputGroupClass + " w-full text-sm font-bold"
                          }
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Twice/Wk</label>
                        <input
                          type="number"
                          name="sedan_twice"
                          value={formData.sedan_twice}
                          onChange={handleChange}
                          className={
                            inputGroupClass + " w-full text-sm font-bold"
                          }
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Thrice/Wk</label>
                        <input
                          type="number"
                          name="sedan_thrice"
                          value={formData.sedan_thrice}
                          onChange={handleChange}
                          className={
                            inputGroupClass + " w-full text-sm font-bold"
                          }
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Daily</label>
                        <input
                          type="number"
                          name="sedan_daily"
                          value={formData.sedan_daily}
                          onChange={handleChange}
                          className={
                            inputGroupClass + " w-full text-sm font-bold"
                          }
                          placeholder="0"
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* SUV Pricing */}
              <div>
                <h4 className={sectionLabel}>4x4 (SUV) Pricing</h4>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  <div>
                    <label className={labelClass}>Onetime</label>
                    <input
                      type="number"
                      name="suv_onetime"
                      value={formData.suv_onetime}
                      onChange={handleChange}
                      className={inputGroupClass + " w-full text-sm font-bold"}
                      placeholder="0"
                    />
                  </div>

                  {formData.service_type === "residence" && (
                    <>
                      <div>
                        <label className={labelClass}>Once/Wk</label>
                        <input
                          type="number"
                          name="suv_once"
                          value={formData.suv_once}
                          onChange={handleChange}
                          className={
                            inputGroupClass + " w-full text-sm font-bold"
                          }
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Twice/Wk</label>
                        <input
                          type="number"
                          name="suv_twice"
                          value={formData.suv_twice}
                          onChange={handleChange}
                          className={
                            inputGroupClass + " w-full text-sm font-bold"
                          }
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Thrice/Wk</label>
                        <input
                          type="number"
                          name="suv_thrice"
                          value={formData.suv_thrice}
                          onChange={handleChange}
                          className={
                            inputGroupClass + " w-full text-sm font-bold"
                          }
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Daily</label>
                        <input
                          type="number"
                          name="suv_daily"
                          value={formData.suv_daily}
                          onChange={handleChange}
                          className={
                            inputGroupClass + " w-full text-sm font-bold"
                          }
                          placeholder="0"
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
            </form>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 flex-shrink-0">
              <button
                onClick={onClose}
                className="px-5 py-2.5 border border-slate-300 text-slate-600 font-bold rounded-lg hover:bg-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-8 py-2.5 bg-[#009ef7] text-white font-bold rounded-lg hover:bg-[#0095e8] transition-colors flex items-center gap-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Submit
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default PricingModal;
