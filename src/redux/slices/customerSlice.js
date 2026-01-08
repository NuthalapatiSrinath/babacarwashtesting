import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { customerService } from "../../api/customerService";

// Async Thunks
export const fetchCustomers = createAsyncThunk(
  "customer/fetchCustomers",
  async (
    { page = 1, limit = 10, search = "", status = 1 },
    { rejectWithValue }
  ) => {
    console.log("👥 [CUSTOMER SLICE] Fetch Customers API Call:", {
      page,
      limit,
      search,
      status,
    });
    try {
      const response = await customerService.list(page, limit, search, status);
      console.log("✅ [CUSTOMER SLICE] Fetch Customers Success:", response);
      return response;
    } catch (error) {
      console.error("❌ [CUSTOMER SLICE] Fetch Customers Error:", error);
      return rejectWithValue(error);
    }
  }
);

export const createCustomer = createAsyncThunk(
  "customer/createCustomer",
  async (data, { rejectWithValue }) => {
    console.log("➕ [CUSTOMER SLICE] Create Customer API Call:", data);
    try {
      const response = await customerService.create(data);
      console.log("✅ [CUSTOMER SLICE] Create Customer Success:", response);
      return response;
    } catch (error) {
      console.error("❌ [CUSTOMER SLICE] Create Customer Error:", error);
      return rejectWithValue(error);
    }
  }
);

export const updateCustomer = createAsyncThunk(
  "customer/updateCustomer",
  async ({ id, data }, { rejectWithValue }) => {
    console.log("✏️ [CUSTOMER SLICE] Update Customer API Call:", { id, data });
    try {
      const response = await customerService.update(id, data);
      console.log("✅ [CUSTOMER SLICE] Update Customer Success:", response);
      return response;
    } catch (error) {
      console.error("❌ [CUSTOMER SLICE] Update Customer Error:", error);
      return rejectWithValue(error);
    }
  }
);

export const deleteCustomer = createAsyncThunk(
  "customer/deleteCustomer",
  async (id, { rejectWithValue }) => {
    console.log("🗑️ [CUSTOMER SLICE] Delete Customer API Call:", id);
    try {
      const response = await customerService.delete(id);
      console.log("✅ [CUSTOMER SLICE] Delete Customer Success:", response);
      return response;
    } catch (error) {
      console.error("❌ [CUSTOMER SLICE] Delete Customer Error:", error);
      return rejectWithValue(error);
    }
  }
);

export const toggleVehicle = createAsyncThunk(
  "customer/toggleVehicle",
  async ({ vehicleId, currentStatus, reason }, { rejectWithValue }) => {
    console.log("🚗 [CUSTOMER SLICE] Toggle Vehicle API Call:", {
      vehicleId,
      currentStatus,
      reason,
    });
    try {
      const response = await customerService.toggleVehicle(
        vehicleId,
        currentStatus,
        reason
      );
      console.log("✅ [CUSTOMER SLICE] Toggle Vehicle Success:", response);
      return response;
    } catch (error) {
      console.error("❌ [CUSTOMER SLICE] Toggle Vehicle Error:", error);
      return rejectWithValue(error);
    }
  }
);

export const archiveCustomer = createAsyncThunk(
  "customer/archiveCustomer",
  async (id, { rejectWithValue }) => {
    console.log("📦 [CUSTOMER SLICE] Archive Customer API Call:", id);
    try {
      const response = await customerService.archive(id);
      console.log("✅ [CUSTOMER SLICE] Archive Customer Success:", response);
      return response;
    } catch (error) {
      console.error("❌ [CUSTOMER SLICE] Archive Customer Error:", error);
      return rejectWithValue(error);
    }
  }
);

export const fetchCustomerHistory = createAsyncThunk(
  "customer/fetchCustomerHistory",
  async (
    { id, page = 1, limit = 10, startDate = "", endDate = "" },
    { rejectWithValue }
  ) => {
    console.log("📜 [CUSTOMER SLICE] Fetch Customer History API Call:", {
      id,
      page,
      limit,
      startDate,
      endDate,
    });
    try {
      const response = await customerService.getHistory(
        id,
        page,
        limit,
        startDate,
        endDate
      );
      console.log(
        "✅ [CUSTOMER SLICE] Fetch Customer History Success:",
        response
      );
      return response;
    } catch (error) {
      console.error("❌ [CUSTOMER SLICE] Fetch Customer History Error:", error);
      return rejectWithValue(error);
    }
  }
);

export const exportCustomerHistory = createAsyncThunk(
  "customer/exportCustomerHistory",
  async ({ id, startDate = "", endDate = "" }, { rejectWithValue }) => {
    console.log("📤 [CUSTOMER SLICE] Export Customer History API Call:", {
      id,
      startDate,
      endDate,
    });
    try {
      const response = await customerService.exportHistory(
        id,
        startDate,
        endDate
      );
      console.log("✅ [CUSTOMER SLICE] Export Customer History Success");
      return response;
    } catch (error) {
      console.error(
        "❌ [CUSTOMER SLICE] Export Customer History Error:",
        error
      );
      return rejectWithValue(error);
    }
  }
);

export const exportCustomers = createAsyncThunk(
  "customer/exportCustomers",
  async (_, { rejectWithValue }) => {
    console.log("📤 [CUSTOMER SLICE] Export Customers API Call");
    try {
      const response = await customerService.exportData();
      console.log("✅ [CUSTOMER SLICE] Export Customers Success");
      return response;
    } catch (error) {
      console.error("❌ [CUSTOMER SLICE] Export Customers Error:", error);
      return rejectWithValue(error);
    }
  }
);

export const importCustomers = createAsyncThunk(
  "customer/importCustomers",
  async (formData, { rejectWithValue }) => {
    console.log("📥 [CUSTOMER SLICE] Import Customers API Call");
    try {
      const response = await customerService.importData(formData);
      console.log("✅ [CUSTOMER SLICE] Import Customers Success:", response);
      return response;
    } catch (error) {
      console.error("❌ [CUSTOMER SLICE] Import Customers Error:", error);
      return rejectWithValue(error);
    }
  }
);

const customerSlice = createSlice({
  name: "customer",
  initialState: {
    customers: [],
    history: [],
    pagination: {
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 1,
    },
    loading: false,
    error: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch Customers
    builder
      .addCase(fetchCustomers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCustomers.fulfilled, (state, action) => {
        state.loading = false;
        state.customers = action.payload.data || [];
        state.pagination = {
          page: action.payload.page || 1,
          limit: action.payload.limit || 10,
          total: action.payload.total || 0,
          totalPages: Math.ceil(
            (action.payload.total || 0) / (action.payload.limit || 10)
          ),
        };
      })
      .addCase(fetchCustomers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Create Customer
    builder
      .addCase(createCustomer.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createCustomer.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(createCustomer.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Update Customer
    builder
      .addCase(updateCustomer.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateCustomer.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(updateCustomer.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Delete Customer
    builder
      .addCase(deleteCustomer.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteCustomer.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(deleteCustomer.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Fetch Customer History
    builder
      .addCase(fetchCustomerHistory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCustomerHistory.fulfilled, (state, action) => {
        state.loading = false;
        state.history = action.payload.data || [];
      })
      .addCase(fetchCustomerHistory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError } = customerSlice.actions;
export default customerSlice.reducer;
