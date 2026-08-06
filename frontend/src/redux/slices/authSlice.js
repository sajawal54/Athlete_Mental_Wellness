import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

import {
  loginUser,
  registerUser,
  forgotPassword,
  resetPassword,
} from "../../services/authService";

const token = localStorage.getItem("accessToken");

const initialState = {
  token: token || null,
  isAuthenticated: !!token,
  loading: false,
  error: null,
  success: null,
};

// ================= REGISTER =================

export const registerUserThunk = createAsyncThunk(
  "auth/register",
  async (userData, thunkAPI) => {
    try {
      return await registerUser(userData);
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data || { detail: "Registration Failed" }
      );
    }
  }
);

// ================= LOGIN =================

export const loginUserThunk = createAsyncThunk(
  "auth/login",
  async (userData, thunkAPI) => {
    try {
      const data = await loginUser(userData);

      localStorage.setItem("accessToken", data.access);
      localStorage.setItem("refreshToken", data.refresh);

      return data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data || { detail: "Login Failed" }
      );
    }
  }
);

// ================= FORGOT PASSWORD =================

export const forgotPasswordThunk = createAsyncThunk(
  "auth/forgot-password",
  async (email, thunkAPI) => {
    try {
      return await forgotPassword(email);
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data || { detail: "Request Failed" }
      );
    }
  }
);

// ================= RESET PASSWORD =================

export const resetPasswordThunk = createAsyncThunk(
  "auth/reset-password",
  async (data, thunkAPI) => {
    try {
      return await resetPassword(data);
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data || { detail: "Reset Failed" }
      );
    }
  }
);

// ================= SLICE =================

const authSlice = createSlice({
  name: "auth",

  initialState,

  reducers: {
    logout: (state) => {
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
      state.success = null;

      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
    },

    clearError: (state) => {
      state.error = null;
    },

    clearSuccess: (state) => {
      state.success = null;
    },
  },

  extraReducers: (builder) => {
    builder

      // ================= REGISTER =================

      .addCase(registerUserThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(registerUserThunk.fulfilled, (state) => {
        state.loading = false;
        state.success = "Registration Successful";
      })

      .addCase(registerUserThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ================= LOGIN =================

      .addCase(loginUserThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(loginUserThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload.access;
        state.isAuthenticated = true;
      })

      .addCase(loginUserThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ================= FORGOT =================

      .addCase(forgotPasswordThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(forgotPasswordThunk.fulfilled, (state) => {
        state.loading = false;
        state.success = "Password reset email sent";
      })

      .addCase(forgotPasswordThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ================= RESET =================

      .addCase(resetPasswordThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(resetPasswordThunk.fulfilled, (state) => {
        state.loading = false;
        state.success = "Password reset successful";
      })

      .addCase(resetPasswordThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const {
  logout,
  clearError,
  clearSuccess,
} = authSlice.actions;

export default authSlice.reducer;