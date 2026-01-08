import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { workRecordsService } from "../../api/workRecordsService";

// Async thunk for downloading work records statement
export const downloadWorkRecordsStatement = createAsyncThunk(
  "workRecords/downloadStatement",
  async ({ serviceType, month, year }, { rejectWithValue }) => {
    try {
      const blob = await workRecordsService.downloadStatement(
        serviceType,
        month,
        year
      );
      return { blob, serviceType, month, year };
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const workRecordsSlice = createSlice({
  name: "workRecords",
  initialState: {
    workRecords: [],
    downloading: false,
    loading: false,
    error: null,
    lastDownload: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(downloadWorkRecordsStatement.pending, (state) => {
        state.downloading = true;
        state.error = null;
      })
      .addCase(downloadWorkRecordsStatement.fulfilled, (state, action) => {
        state.downloading = false;
        state.lastDownload = new Date().toISOString();
      })
      .addCase(downloadWorkRecordsStatement.rejected, (state, action) => {
        state.downloading = false;
        state.error =
          action.payload || "Failed to download work records statement";
      });
  },
});

export const { clearError } = workRecordsSlice.actions;
export default workRecordsSlice.reducer;
