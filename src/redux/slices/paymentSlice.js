import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { paymentService } from "../../api/paymentService";

// Async thunk for fetching payments
export const fetchPayments = createAsyncThunk(
  "payment/fetchPayments",
  async (
    { page = 1, limit = 50, search = "", filters = {} },
    { rejectWithValue }
  ) => {
    try {
      const response = await paymentService.list(page, limit, search, filters);
      return { ...response, currentPage: page };
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Async thunk for exporting payments
export const exportPayments = createAsyncThunk(
  "payment/exportPayments",
  async (filters, { rejectWithValue }) => {
    try {
      const blob = await paymentService.exportData(filters);
      return { blob, filters };
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Async thunk for approving/updating payment
export const approvePayment = createAsyncThunk(
  "payment/approvePayment",
  async ({ id, data }, { rejectWithValue }) => {
    console.log("🔵 [PAYMENT SLICE] Approve Payment Called:", { id, data });
    try {
      const response = await paymentService.updatePayment(id, data);
      console.log("✅ [PAYMENT SLICE] Approve Payment Success:", response);
      return { id, ...response };
    } catch (error) {
      console.error("❌ [PAYMENT SLICE] Approve Payment Error:", error);
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Async thunk for deleting payment
export const deletePayment = createAsyncThunk(
  "payment/deletePayment",
  async (id, { rejectWithValue }) => {
    console.log("🔵 [PAYMENT SLICE] Delete Payment Called:", { id });
    try {
      const response = await paymentService.deletePayment(id);
      console.log("✅ [PAYMENT SLICE] Delete Payment Success:", response);
      return id;
    } catch (error) {
      console.error("❌ [PAYMENT SLICE] Delete Payment Error:", error);
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const paymentSlice = createSlice({
  name: "payment",
  initialState: {
    payments: [],
    stats: {
      totalAmount: 0,
      totalJobs: 0,
      cash: 0,
      card: 0,
      bank: 0,
    },
    total: 0,
    currentPage: 1,
    loading: false,
    exporting: false,
    error: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Payments
      .addCase(fetchPayments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPayments.fulfilled, (state, action) => {
        state.loading = false;
        state.payments = action.payload.data || [];
        state.stats = action.payload.counts || state.stats;
        state.total = action.payload.total || 0;
        state.currentPage = action.payload.currentPage;
      })
      .addCase(fetchPayments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch payments";
      })
      // Export Payments
      .addCase(exportPayments.pending, (state) => {
        state.exporting = true;
        state.error = null;
      })
      .addCase(exportPayments.fulfilled, (state) => {
        state.exporting = false;
      })
      .addCase(exportPayments.rejected, (state, action) => {
        state.exporting = false;
        state.error = action.payload || "Failed to export payments";
      })
      // Approve Payment
      .addCase(approvePayment.fulfilled, (state, action) => {
        const index = state.payments.findIndex(
          (p) => p._id === action.payload.id
        );
        if (index !== -1 && action.payload.data) {
          state.payments[index] = {
            ...state.payments[index],
            ...action.payload.data,
          };
        }
      })
      .addCase(approvePayment.rejected, (state, action) => {
        state.error = action.payload || "Failed to approve payment";
      })
      // Delete Payment
      .addCase(deletePayment.fulfilled, (state, action) => {
        state.payments = state.payments.filter((p) => p._id !== action.payload);
        state.total = Math.max(0, state.total - 1);
      })
      .addCase(deletePayment.rejected, (state, action) => {
        state.error = action.payload || "Failed to delete payment";
      });
  },
});

export const { clearError } = paymentSlice.actions;
export default paymentSlice.reducer;
