import React, { useState, useEffect } from "react";
import {
  Save,
  Loader2,
  DollarSign,
  Users,
  Building,
  Wrench,
  RotateCcw,
} from "lucide-react";
import toast from "react-hot-toast";
import { salarySettingsService } from "../../api/salarySettingsService";

const SalarySettings = () => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // State for all salary configuration settings
  const [config, setConfig] = useState(
    salarySettingsService.getDefaultConfig(),
  );

  // Load settings from backend API
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const apiSettings = await salarySettingsService.getSettings();
      setConfig(apiSettings);
    } catch (error) {
      console.error("Error loading settings:", error);
      toast.error("Failed to load settings from backend");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await salarySettingsService.saveSettings(config);
      toast.success("Settings saved successfully!");

      // Refresh to get latest data from backend
      if (response.data) {
        setConfig(response.data);
      }
    } catch (error) {
      toast.error("Failed to save settings");
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (
      window.confirm(
        "Are you sure you want to reset all settings to default values?",
      )
    ) {
      try {
        const response = await salarySettingsService.resetToDefaults();
        setConfig(response.data);
        toast.success("Settings reset to defaults");
      } catch (error) {
        toast.error("Failed to reset settings");
        console.error(error);
      }
    }
  };

  const updateField = (category, field, value) => {
    setConfig((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: parseFloat(value) || 0,
      },
    }));
  };

  const updateNestedField = (category, subcategory, field, value) => {
    setConfig((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [subcategory]: {
          ...prev[category][subcategory],
          [field]: parseFloat(value) || 0,
        },
      },
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-slate-600 font-semibold">
            Loading salary settings...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white shadow-sm rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
                <DollarSign className="w-8 h-8 text-indigo-600" />
                Salary Configuration Settings
              </h1>
              <p className="text-slate-600 mt-2">
                Manage all salary calculation rules, rates, and deductions for
                different employee types
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleReset}
                className="flex items-center gap-2 px-4 py-3 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors font-semibold"
              >
                <RotateCcw className="w-5 h-5" />
                Reset to Defaults
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 font-semibold"
              >
                {saving ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Save className="w-5 h-5" />
                )}
                Save Settings
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 1. CAR WASH EMPLOYEES - DAY DUTY */}
          <div className="bg-white shadow-sm rounded-lg p-6">
            <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              Car Wash - Day Duty
            </h2>
            <div className="space-y-4">
              <div className="bg-blue-50 p-3 rounded-md">
                <p className="text-sm font-semibold text-blue-800">
                  Applicable Buildings:
                </p>
                <p className="text-sm text-blue-700">
                  {config.carWashDayDuty.applicableBuildings.join(", ")}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Rate Per Car (AED)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={config.carWashDayDuty.ratePerCar}
                  onChange={(e) =>
                    updateField("carWashDayDuty", "ratePerCar", e.target.value)
                  }
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Incentive (Less than 1000 cars) - AED
                </label>
                <input
                  type="number"
                  value={config.carWashDayDuty.incentiveLessThan1000}
                  onChange={(e) =>
                    updateField(
                      "carWashDayDuty",
                      "incentiveLessThan1000",
                      e.target.value,
                    )
                  }
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Incentive (More than 1000 cars) - AED
                </label>
                <input
                  type="number"
                  value={config.carWashDayDuty.incentiveMoreThan1000}
                  onChange={(e) =>
                    updateField(
                      "carWashDayDuty",
                      "incentiveMoreThan1000",
                      e.target.value,
                    )
                  }
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* 2. CAR WASH EMPLOYEES - NIGHT DUTY */}
          <div className="bg-white shadow-sm rounded-lg p-6">
            <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600" />
              Car Wash - Night Duty
            </h2>
            <div className="space-y-4">
              <div className="bg-indigo-50 p-3 rounded-md">
                <p className="text-sm font-semibold text-indigo-800">
                  Applicable:
                </p>
                <p className="text-sm text-indigo-700">
                  All residential buildings (except Ubora Towers & Marina Plaza)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Rate Per Car (AED)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={config.carWashNightDuty.ratePerCar}
                  onChange={(e) =>
                    updateField(
                      "carWashNightDuty",
                      "ratePerCar",
                      e.target.value,
                    )
                  }
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Incentive (Less than 1000 cars) - AED
                </label>
                <input
                  type="number"
                  value={config.carWashNightDuty.incentiveLessThan1000}
                  onChange={(e) =>
                    updateField(
                      "carWashNightDuty",
                      "incentiveLessThan1000",
                      e.target.value,
                    )
                  }
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Incentive (More than 1000 cars) - AED
                </label>
                <input
                  type="number"
                  value={config.carWashNightDuty.incentiveMoreThan1000}
                  onChange={(e) =>
                    updateField(
                      "carWashNightDuty",
                      "incentiveMoreThan1000",
                      e.target.value,
                    )
                  }
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* 3. ETISALAT SIM BILL */}
          <div className="bg-white shadow-sm rounded-lg p-6">
            <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              Etisalat SIM Bill Deduction
            </h2>
            <div className="space-y-4">
              <div className="bg-green-50 p-3 rounded-md">
                <p className="text-sm font-semibold text-green-800">
                  Applies to all cleaners
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Monthly Bill (AED)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={config.etisalatSim.monthlyBill}
                  onChange={(e) =>
                    updateField("etisalatSim", "monthlyBill", e.target.value)
                  }
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Company Pays (AED)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={config.etisalatSim.companyPays}
                  onChange={(e) =>
                    updateField("etisalatSim", "companyPays", e.target.value)
                  }
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Employee Deduction (AED)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={config.etisalatSim.employeeDeduction}
                  onChange={(e) =>
                    updateField(
                      "etisalatSim",
                      "employeeDeduction",
                      e.target.value,
                    )
                  }
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* 4. MALL EMPLOYEES */}
          <div className="bg-white shadow-sm rounded-lg p-6">
            <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Building className="w-5 h-5 text-purple-600" />
              Mall Employees
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Car Wash Rate (AED)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={config.mallEmployees.carWashRate}
                    onChange={(e) =>
                      updateField(
                        "mallEmployees",
                        "carWashRate",
                        e.target.value,
                      )
                    }
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Monthly Vehicles Rate
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={config.mallEmployees.monthlyVehiclesRate}
                    onChange={(e) =>
                      updateField(
                        "mallEmployees",
                        "monthlyVehiclesRate",
                        e.target.value,
                      )
                    }
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Fixed Extra Payment (AED)
                </label>
                <input
                  type="number"
                  value={config.mallEmployees.fixedExtraPayment}
                  onChange={(e) =>
                    updateField(
                      "mallEmployees",
                      "fixedExtraPayment",
                      e.target.value,
                    )
                  }
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Absent Deduction (AED)
                  </label>
                  <input
                    type="number"
                    value={config.mallEmployees.absentMoreThan1DayDeduction}
                    onChange={(e) =>
                      updateField(
                        "mallEmployees",
                        "absentMoreThan1DayDeduction",
                        e.target.value,
                      )
                    }
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Sunday Absent (AED)
                  </label>
                  <input
                    type="number"
                    value={config.mallEmployees.sundayAbsentDeduction}
                    onChange={(e) =>
                      updateField(
                        "mallEmployees",
                        "sundayAbsentDeduction",
                        e.target.value,
                      )
                    }
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Sick Leave Payment (AED/day)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={config.mallEmployees.sickLeavePayment}
                  onChange={(e) =>
                    updateField(
                      "mallEmployees",
                      "sickLeavePayment",
                      e.target.value,
                    )
                  }
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* 5. CONSTRUCTION CAMP EMPLOYEES */}
          <div className="bg-white shadow-sm rounded-lg p-6 lg:col-span-2">
            <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Wrench className="w-5 h-5 text-orange-600" />
              Construction Camp Employees
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Helper */}
              <div className="border border-slate-200 rounded-lg p-4">
                <h3 className="font-bold text-slate-700 mb-3">Helper</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Base Salary (AED)
                    </label>
                    <input
                      type="number"
                      value={config.constructionCamp.helper.baseSalary}
                      onChange={(e) =>
                        updateNestedField(
                          "constructionCamp",
                          "helper",
                          "baseSalary",
                          e.target.value,
                        )
                      }
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      OT Rate (AED/hour)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={config.constructionCamp.helper.overtimeRate}
                      onChange={(e) =>
                        updateNestedField(
                          "constructionCamp",
                          "helper",
                          "overtimeRate",
                          e.target.value,
                        )
                      }
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* Mason */}
              <div className="border border-slate-200 rounded-lg p-4">
                <h3 className="font-bold text-slate-700 mb-3">Mason</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Base Salary (AED)
                    </label>
                    <input
                      type="number"
                      value={config.constructionCamp.mason.baseSalary}
                      onChange={(e) =>
                        updateNestedField(
                          "constructionCamp",
                          "mason",
                          "baseSalary",
                          e.target.value,
                        )
                      }
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      OT Rate (AED/hour)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={config.constructionCamp.mason.overtimeRate}
                      onChange={(e) =>
                        updateNestedField(
                          "constructionCamp",
                          "mason",
                          "overtimeRate",
                          e.target.value,
                        )
                      }
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* General Settings */}
              <div className="border border-slate-200 rounded-lg p-4">
                <h3 className="font-bold text-slate-700 mb-3">General</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Working Days
                    </label>
                    <input
                      type="number"
                      value={config.constructionCamp.standardWorkingDays}
                      onChange={(e) =>
                        updateField(
                          "constructionCamp",
                          "standardWorkingDays",
                          e.target.value,
                        )
                      }
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Normal Hours/Day
                    </label>
                    <input
                      type="number"
                      value={config.constructionCamp.normalWorkingHours}
                      onChange={(e) =>
                        updateField(
                          "constructionCamp",
                          "normalWorkingHours",
                          e.target.value,
                        )
                      }
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* Payments & Deductions */}
              <div className="border border-slate-200 rounded-lg p-4">
                <h3 className="font-bold text-slate-700 mb-3">Payments</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      No Duty (AED/day)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={config.constructionCamp.noDutyPayment}
                      onChange={(e) =>
                        updateField(
                          "constructionCamp",
                          "noDutyPayment",
                          e.target.value,
                        )
                      }
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Holiday (AED/day)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={config.constructionCamp.holidayPayment}
                      onChange={(e) =>
                        updateField(
                          "constructionCamp",
                          "holidayPayment",
                          e.target.value,
                        )
                      }
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>

              <div className="border border-slate-200 rounded-lg p-4">
                <h3 className="font-bold text-slate-700 mb-3">Deductions</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Absent (AED/day)
                    </label>
                    <input
                      type="number"
                      value={config.constructionCamp.absentDeduction}
                      onChange={(e) =>
                        updateField(
                          "constructionCamp",
                          "absentDeduction",
                          e.target.value,
                        )
                      }
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Sick Leave (AED/day)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={config.constructionCamp.sickLeavePayment}
                      onChange={(e) =>
                        updateField(
                          "constructionCamp",
                          "sickLeavePayment",
                          e.target.value,
                        )
                      }
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>

              <div className="border border-slate-200 rounded-lg p-4">
                <h3 className="font-bold text-slate-700 mb-3">Incentive</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Monthly Incentive (AED)
                    </label>
                    <input
                      type="number"
                      value={config.constructionCamp.monthlyIncentive}
                      onChange={(e) =>
                        updateField(
                          "constructionCamp",
                          "monthlyIncentive",
                          e.target.value,
                        )
                      }
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      If present full month
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 6. OUTSIDE CAMP EMPLOYEES (HOURLY) */}
          <div className="bg-white shadow-sm rounded-lg p-6 lg:col-span-2">
            <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-red-600" />
              Outside Camp Employees (Hourly Basis)
            </h2>
            <div className="bg-red-50 p-3 rounded-md mb-4">
              <p className="text-sm font-semibold text-red-800">
                Note: No holidays, no off-day payment, no extra benefits
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Helper (AED/hour)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={config.outsideCamp.helper}
                  onChange={(e) =>
                    updateField("outsideCamp", "helper", e.target.value)
                  }
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Carpenter (AED/hour)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={config.outsideCamp.carpenter}
                  onChange={(e) =>
                    updateField("outsideCamp", "carpenter", e.target.value)
                  }
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Steel Fixer (AED/hour)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={config.outsideCamp.steelFixer}
                  onChange={(e) =>
                    updateField("outsideCamp", "steelFixer", e.target.value)
                  }
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Painter (AED/hour)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={config.outsideCamp.painter}
                  onChange={(e) =>
                    updateField("outsideCamp", "painter", e.target.value)
                  }
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Mason (AED/hour)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={config.outsideCamp.mason}
                  onChange={(e) =>
                    updateField("outsideCamp", "mason", e.target.value)
                  }
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Scaffolder (AED/hour)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={config.outsideCamp.scaffolder}
                  onChange={(e) =>
                    updateField("outsideCamp", "scaffolder", e.target.value)
                  }
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Electrician (AED/hour)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={config.outsideCamp.electrician}
                  onChange={(e) =>
                    updateField("outsideCamp", "electrician", e.target.value)
                  }
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Plumber (AED/hour)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={config.outsideCamp.plumber}
                  onChange={(e) =>
                    updateField("outsideCamp", "plumber", e.target.value)
                  }
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Save Button */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-8 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 font-semibold text-lg shadow-lg"
          >
            {saving ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <Save className="w-6 h-6" />
            )}
            Save All Settings
          </button>
        </div>
      </div>
    </div>
  );
};

export default SalarySettings;
