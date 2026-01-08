import React, { useState, useEffect } from "react";
import { Palette, Save, RotateCcw } from "lucide-react";
import toast from "react-hot-toast";

const Settings = () => {
  const [colors, setColors] = useState({
    primary: "#3b82f6",
    emerald: "#10b981",
    indigo: "#6366f1",
    purple: "#a855f7",
    teal: "#14b8a6",
    amber: "#f59e0b",
    rose: "#f43f5e",
    success: "#10b981",
    danger: "#ef4444",
    warning: "#f59e0b",
  });

  // Load saved colors from localStorage
  useEffect(() => {
    const savedColors = localStorage.getItem("themeColors");
    if (savedColors) {
      setColors(JSON.parse(savedColors));
      applyColors(JSON.parse(savedColors));
    }
  }, []);

  const applyColors = (colorSet) => {
    const root = document.documentElement;
    root.style.setProperty("--color-primary", colorSet.primary);
    root.style.setProperty("--color-emerald", colorSet.emerald);
    root.style.setProperty("--color-indigo", colorSet.indigo);
    root.style.setProperty("--color-purple", colorSet.purple);
    root.style.setProperty("--color-teal", colorSet.teal);
    root.style.setProperty("--color-amber", colorSet.amber);
    root.style.setProperty("--color-rose", colorSet.rose);
    root.style.setProperty("--color-success", colorSet.success);
    root.style.setProperty("--color-danger", colorSet.danger);
    root.style.setProperty("--color-warning", colorSet.warning);
  };

  const handleColorChange = (key, value) => {
    const newColors = { ...colors, [key]: value };
    setColors(newColors);
    applyColors(newColors);
  };

  const handleSave = () => {
    localStorage.setItem("themeColors", JSON.stringify(colors));
    toast.success("Theme colors saved successfully!");
  };

  const handleReset = () => {
    const defaultColors = {
      primary: "#3b82f6",
      emerald: "#10b981",
      indigo: "#6366f1",
      purple: "#a855f7",
      teal: "#14b8a6",
      amber: "#f59e0b",
      rose: "#f43f5e",
      success: "#10b981",
      danger: "#ef4444",
      warning: "#f59e0b",
    };
    setColors(defaultColors);
    applyColors(defaultColors);
    localStorage.removeItem("themeColors");
    toast.success("Theme reset to defaults!");
  };

  const colorOptions = [
    { key: "primary", label: "Primary (Blue)", desc: "Main brand color" },
    {
      key: "emerald",
      label: "Emerald (Green)",
      desc: "Success & positive actions",
    },
    { key: "indigo", label: "Indigo", desc: "Secondary accent" },
    { key: "purple", label: "Purple", desc: "Tertiary accent" },
    { key: "teal", label: "Teal", desc: "Info & highlights" },
    { key: "amber", label: "Amber", desc: "Warnings & alerts" },
    { key: "rose", label: "Rose (Red)", desc: "Errors & danger" },
    { key: "success", label: "Success", desc: "Success messages" },
    { key: "danger", label: "Danger", desc: "Error messages" },
    { key: "warning", label: "Warning", desc: "Warning messages" },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <Palette className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Theme Settings
            </h1>
            <p className="text-sm text-slate-600">
              Customize your application colors
            </p>
          </div>
        </div>
      </div>

      {/* Color Configuration */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">
          Color Palette
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {colorOptions.map((option) => (
            <div
              key={option.key}
              className="flex items-center gap-4 p-4 border border-slate-200 rounded-xl hover:border-slate-300 transition-colors"
            >
              <input
                type="color"
                value={colors[option.key]}
                onChange={(e) => handleColorChange(option.key, e.target.value)}
                className="w-12 h-12 rounded-lg cursor-pointer border-2 border-slate-300"
              />
              <div className="flex-1">
                <h3 className="font-semibold text-slate-900 text-sm">
                  {option.label}
                </h3>
                <p className="text-xs text-slate-500">{option.desc}</p>
                <p className="text-xs font-mono text-slate-400 mt-1">
                  {colors[option.key]}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleSave}
            className="flex-1 h-11 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-xl font-semibold flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all"
          >
            <Save className="w-4 h-4" />
            Save Colors
          </button>
          <button
            onClick={handleReset}
            className="h-11 px-6 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>
        </div>
      </div>

      {/* Preview Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">
          Color Preview
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {Object.entries(colors).map(([key, value]) => (
            <div key={key} className="flex flex-col items-center gap-2">
              <div
                className="w-16 h-16 rounded-xl shadow-md"
                style={{ backgroundColor: value }}
              />
              <p className="text-xs font-medium text-slate-700 capitalize">
                {key}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Settings;
