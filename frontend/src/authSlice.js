import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosClient from "./utils/axiosClient";

// Turns an axios error into one readable string.
// Backend errors arrive as { message }; no response at all means the server is unreachable.
const getErrorMessage = (error, fallback) => {
  if (error.response?.data?.message) return error.response.data.message;
  if (!error.response) return "Unable to reach the server. Please try again.";
  return fallback;
};

// 1. Register Thunk
export const registerUser = createAsyncThunk(
  "auth/register",
  async (userData, { rejectWithValue }) => {
    try {
      const response = await axiosClient.post("/user/register", userData);
      return response.data.user;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, "Registration failed"));
    }
  },
);

// 2. Login Thunk
export const loginUser = createAsyncThunk(
  "auth/login",
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await axiosClient.post("/user/login", credentials);
      return response.data.user;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, "Login failed"));
    }
  },
);

// 3. Check Auth Thunk
export const checkAuth = createAsyncThunk(
  "auth/checkAuth",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosClient.get("/user/check");
      // Never treat a response without a user as "logged in"
      if (!response.data?.user) {
        return rejectWithValue("Not authenticated");
      }
      return response.data.user;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, "Not authenticated"));
    }
  },
);

// 4. Logout Thunk
export const logoutUser = createAsyncThunk(
  "auth/logout",
  async (_, { rejectWithValue }) => {
    try {
      await axiosClient.post("/user/logout");
      return null;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, "Logout failed"));
    }
  },
);

// isLoading is ONLY for the initial session check (App.jsx shows a full-screen
// loader while it is true). Login, register and logout must not set it,
// otherwise App unmounts the form mid-request and the typed values are lost.
const initialState = {
  user: null,
  isAuthenticated: false,
  isLoading: true, // Starts true to wait for checkAuth on page load
  error: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // --- Check Auth Lifecycle ---
      .addCase(checkAuth.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(checkAuth.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload;
      })
      .addCase(checkAuth.rejected, (state) => {
        // Being logged out is normal here, so no error message is stored
        state.isLoading = false;
        state.isAuthenticated = false;
        state.user = null;
      })

      // --- Login Lifecycle ---
      .addCase(loginUser.pending, (state) => {
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isAuthenticated = !!action.payload;
        state.user = action.payload;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.error = action.payload || "Login failed";
        state.isAuthenticated = false;
        state.user = null;
      })

      // --- Register Lifecycle ---
      .addCase(registerUser.pending, (state) => {
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.isAuthenticated = !!action.payload;
        state.user = action.payload;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.error = action.payload || "Registration failed";
        state.isAuthenticated = false;
        state.user = null;
      })

      // --- Logout Lifecycle ---
      .addCase(logoutUser.pending, (state) => {
        state.error = null;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.isAuthenticated = false;
        state.user = null;
        state.error = null;
      })
      .addCase(logoutUser.rejected, (state, action) => {
        // The user asked to leave, so the local session is cleared either way
        state.error = action.payload || "Logout failed";
        state.isAuthenticated = false;
        state.user = null;
      });
  },
});

export const { clearError } = authSlice.actions;
export default authSlice.reducer;