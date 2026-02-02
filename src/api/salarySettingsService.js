import axiosInstance from "./axiosInstance";

const API_BASE = "/salary";

export const salarySettingsService = {
  /**
   * Get salary configuration settings
   * @returns {Promise} Configuration object
   */
  async getSettings() {
    try {
      const response = await axiosInstance.get(`${API_BASE}/settings`);
      return response.data;
    } catch (error) {
      console.error("Error fetching salary settings:", error);
      throw error;
    }
  },

  /**
   * Save salary configuration settings
   * @param {Object} config - Configuration object
   * @returns {Promise} Saved configuration
   */
  async saveSettings(config) {
    try {
      const response = await axiosInstance.post(`${API_BASE}/settings`, config);
      return response.data;
    } catch (error) {
      console.error("Error saving salary settings:", error);
      throw error;
    }
  },

  /**
   * Update specific salary configuration category
   * @param {string} category - Category name (e.g., 'carWashDayDuty')
   * @param {Object} data - Updated data for the category
   * @returns {Promise} Updated configuration
   */
  async updateCategory(category, data) {
    try {
      const response = await axiosInstance.patch(
        `${API_BASE}/settings/${category}`,
        data,
      );
      return response.data;
    } catch (error) {
      console.error(`Error updating ${category}:`, error);
      throw error;
    }
  },

  /**
   * Get specific category settings
   * @param {string} category - Category name
   * @returns {Promise} Category configuration
   */
  async getCategorySettings(category) {
    try {
      const response = await axiosInstance.get(
        `${API_BASE}/settings/${category}`,
      );
      return response.data;
    } catch (error) {
      console.error(`Error fetching ${category} settings:`, error);
      throw error;
    }
  },

  /**
   * Reset settings to default values
   * @returns {Promise} Default configuration
   */
  async resetToDefaults() {
    try {
      const response = await axiosInstance.post(`${API_BASE}/settings/reset`);
      return response.data;
    } catch (error) {
      console.error("Error resetting to defaults:", error);
      throw error;
    }
  },

  /**
   * Get default configuration values
   * @returns {Object} Default configuration
   */
  getDefaultConfig() {
    return {
      carWashDayDuty: {
        applicableBuildings: ["Ubora Towers", "Marina Plaza"],
        ratePerCar: 1.4,
        incentiveLessThan1000: 100,
        incentiveMoreThan1000: 200,
      },
      carWashNightDuty: {
        ratePerCar: 1.35,
        incentiveLessThan1000: 100,
        incentiveMoreThan1000: 200,
      },
      etisalatSim: {
        monthlyBill: 52.5,
        companyPays: 26.25,
        employeeDeduction: 26.25,
      },
      mallEmployees: {
        carWashRate: 3.0,
        monthlyVehiclesRate: 1.35,
        fixedExtraPayment: 200,
        absentMoreThan1DayDeduction: 25,
        sundayAbsentDeduction: 50,
        sickLeavePayment: 13.33,
      },
      constructionCamp: {
        helper: {
          baseSalary: 1000,
          overtimeRate: 4.0,
        },
        mason: {
          baseSalary: 1200,
          overtimeRate: 4.5,
        },
        standardWorkingDays: 30,
        normalWorkingHours: 8,
        actualWorkingHours: 10,
        noDutyPayment: 18.33,
        holidayPayment: 18.33,
        sickLeavePayment: 13.33,
        absentDeduction: 25,
        monthlyIncentive: 100,
      },
      outsideCamp: {
        helper: 5.0,
        carpenter: 5.5,
        steelFixer: 5.5,
        painter: 5.5,
        mason: 6.0,
        scaffolder: 6.0,
        electrician: 6.0,
        plumber: 6.0,
      },
    };
  },

  /**
   * Calculate salary based on employee type and data
   * @param {string} employeeType - Type of employee (carWashDay, carWashNight, mall, constructionCamp, outsideCamp)
   * @param {Object} employeeData - Employee-specific data (cars washed, hours worked, etc.)
   * @param {Object} config - Salary configuration settings
   * @returns {Object} Calculated salary breakdown
   */
  calculateSalary(employeeType, employeeData, config) {
    let calculation = {
      basicSalary: 0,
      extraWorkOt: 0,
      extraPaymentIncentive: 0,
      totalDebit: 0,
      breakdown: {},
    };

    switch (employeeType) {
      case "carWashDay":
        const dayRate = config.carWashDayDuty.ratePerCar;
        calculation.basicSalary = employeeData.totalCars * dayRate;

        if (employeeData.totalCars < 1000) {
          calculation.extraPaymentIncentive =
            config.carWashDayDuty.incentiveLessThan1000;
        } else {
          calculation.extraPaymentIncentive =
            config.carWashDayDuty.incentiveMoreThan1000;
        }

        calculation.totalDebit =
          calculation.basicSalary + calculation.extraPaymentIncentive;
        calculation.breakdown = {
          totalCars: employeeData.totalCars,
          ratePerCar: dayRate,
          incentive: calculation.extraPaymentIncentive,
        };
        break;

      case "carWashNight":
        const nightRate = config.carWashNightDuty.ratePerCar;
        calculation.basicSalary = employeeData.totalCars * nightRate;

        if (employeeData.totalCars < 1000) {
          calculation.extraPaymentIncentive =
            config.carWashNightDuty.incentiveLessThan1000;
        } else {
          calculation.extraPaymentIncentive =
            config.carWashNightDuty.incentiveMoreThan1000;
        }

        calculation.totalDebit =
          calculation.basicSalary + calculation.extraPaymentIncentive;
        calculation.breakdown = {
          totalCars: employeeData.totalCars,
          ratePerCar: nightRate,
          incentive: calculation.extraPaymentIncentive,
        };
        break;

      case "mall":
        const carWashIncome =
          employeeData.carWashCount * config.mallEmployees.carWashRate;
        const monthlyVehiclesIncome =
          employeeData.monthlyVehicles *
          config.mallEmployees.monthlyVehiclesRate;
        calculation.basicSalary = carWashIncome + monthlyVehiclesIncome;

        // Calculate prorated extra payment based on days worked
        const daysWorked = employeeData.daysWorked || 30;
        calculation.extraPaymentIncentive =
          (config.mallEmployees.fixedExtraPayment / 30) * daysWorked;

        calculation.totalDebit =
          calculation.basicSalary + calculation.extraPaymentIncentive;
        calculation.breakdown = {
          carWashCount: employeeData.carWashCount,
          monthlyVehicles: employeeData.monthlyVehicles,
          daysWorked: daysWorked,
          carWashIncome: carWashIncome.toFixed(2),
          monthlyVehiclesIncome: monthlyVehiclesIncome.toFixed(2),
          extraPayment: calculation.extraPaymentIncentive.toFixed(2),
        };
        break;

      case "constructionCamp":
        const role = employeeData.role || "helper"; // helper or mason
        const roleConfig = config.constructionCamp[role];
        const daysPresent = employeeData.daysPresent || 0;

        // Basic salary calculation
        calculation.basicSalary =
          (roleConfig.baseSalary /
            config.constructionCamp.standardWorkingDays) *
          daysPresent;

        // Overtime calculation
        const overtimeHours =
          config.constructionCamp.actualWorkingHours -
          config.constructionCamp.normalWorkingHours;
        calculation.extraWorkOt =
          overtimeHours * roleConfig.overtimeRate * daysPresent;

        // Monthly incentive if full attendance
        if (
          daysPresent >= config.constructionCamp.standardWorkingDays &&
          employeeData.absentDays === 0
        ) {
          calculation.extraPaymentIncentive =
            config.constructionCamp.monthlyIncentive;
        }

        calculation.totalDebit =
          calculation.basicSalary +
          calculation.extraWorkOt +
          calculation.extraPaymentIncentive;
        calculation.breakdown = {
          role: role,
          baseSalary: roleConfig.baseSalary,
          daysPresent: daysPresent,
          overtimeHours: overtimeHours,
          overtimeRate: roleConfig.overtimeRate,
          incentive: calculation.extraPaymentIncentive,
        };
        break;

      case "outsideCamp":
        const position = employeeData.position || "helper";
        const hourlyRate = config.outsideCamp[position];
        const totalHours = employeeData.totalHours || 0;

        calculation.basicSalary = totalHours * hourlyRate;
        calculation.totalDebit = calculation.basicSalary;
        calculation.breakdown = {
          position: position,
          hourlyRate: hourlyRate,
          totalHours: totalHours,
        };
        break;

      default:
        console.error("Unknown employee type:", employeeType);
    }

    return calculation;
  },
};
