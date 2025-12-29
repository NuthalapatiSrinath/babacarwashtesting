import React, { useState, useEffect } from "react";
import {
  Save,
  Settings as SettingsIcon,
  Phone,
  Loader2,
  Info,
} from "lucide-react";
import toast from "react-hot-toast";

// API
import { configurationService } from "../api/configurationService";

const Settings = () => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    contactNumber: "",
  });

  // --- Fetch Data on Mount ---
  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      try {
        const response = await configurationService.fetch();
        if (response.data) {
          setFormData({
            contactNumber: response.data.contactNumber || "",
          });
        }
      } catch (error) {
        toast.error("Failed to load settings");
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  // --- Handlers ---
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.contactNumber) {
      toast.error("Contact number is required");
      return;
    }

    setSaving(true);
    try {
      await configurationService.update(formData);
      toast.success("Settings updated successfully");
    } catch (error) {
      console.error(error);
      toast.error("Failed to update settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto min-h-screen font-sans">
      {/* Header */}
      <div className="mb-8 flex items-center gap-3">
        <div className="p-3 bg-indigo-50 rounded-xl">
          <SettingsIcon className="w-8 h-8 text-indigo-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">System Settings</h1>
          <p className="text-slate-500 text-sm">
            Manage global application configurations
          </p>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      ) : (
        <div className="grid gap-6">
          {/* General Configuration Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <h2 className="font-semibold text-slate-800 flex items-center gap-2">
                <Info className="w-4 h-4 text-slate-400" /> General Information
              </h2>
            </div>

            <div className="p-6">
              <form
                id="settingsForm"
                onSubmit={handleSubmit}
                className="space-y-6"
              >
                {/* Contact Number Field */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Support Contact Number
                  </label>
                  <div className="relative max-w-md">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone className="h-4 w-4 text-slate-400" />
                    </div>
                    <input
                      type="text"
                      value={formData.contactNumber}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          contactNumber: e.target.value,
                        })
                      }
                      placeholder="+91 98765 43210"
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all text-slate-700"
                    />
                  </div>
                  <p className="mt-2 text-xs text-slate-400">
                    This number will be displayed to users for support
                    inquiries.
                  </p>
                </div>
              </form>
            </div>

            {/* Footer / Actions */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                form="settingsForm"
                disabled={saving}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm shadow-indigo-200 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" /> Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
