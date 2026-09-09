import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../api/api";
import { getBackendTimezoneOffset } from "../../utils/timezone";

export const fetchStreakStatus = createAsyncThunk(
  "streak/fetchStatus",
  async () => {
    const response = await api.get("/streaks/status", {
      params: { timezone_offset: getBackendTimezoneOffset() },
    });
    return response.data?.result;
  }
);

export const fetchStreakWeek = createAsyncThunk(
  "streak/fetchWeek",
  async () => {
    const response = await api.get("/streaks/week", {
      params: { timezone_offset: getBackendTimezoneOffset() },
    });
    return response.data?.result; // [{ date, completed }, ...]
  }
);

const streakSlice = createSlice({
  name: "streak",
  initialState: {
    currentStreak: 0,
    completedToday: false,
    week: [], // [{ date, completed }]
    loaded: false,
  },
  reducers: {
    setStreak: (state, action) => {
      state.currentStreak = action.payload.currentStreak;
      state.completedToday = action.payload.completedToday;
      state.loaded = true;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchStreakStatus.fulfilled, (state, action) => {
        if (action.payload) {
          state.currentStreak = action.payload.currentStreak;
          state.completedToday = action.payload.completedToday;
        }
        state.loaded = true;
      })
      .addCase(fetchStreakWeek.fulfilled, (state, action) => {
        state.week = action.payload || [];
      });
  },
});

export const { setStreak } = streakSlice.actions;
export default streakSlice.reducer;