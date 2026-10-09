import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosClient from './utils/axiosClient';

// Thunk to fetch problems from the backend
export const fetchAllProblems = createAsyncThunk(
  'problems/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosClient.get('/problem/getAllProblem');
      // Safely return the array
      return response.data?.problems || response.data || [];
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch problems');
    }
  }
);

const problemSlice = createSlice({
  name: 'problems',
  initialState: {
    problemsList: [],
    isLoading: false,
    error: null,
    // This flag is the magic key that tells our components if they need to fetch or not
    hasFetchedOnce: false, 
  },
  reducers: {
    // We will dispatch this from AdminDelete to instantly update the UI
    removeProblemLocally: (state, action) => {
      state.problemsList = state.problemsList.filter(
        (problem) => problem._id !== action.payload
      );
    },
    // We will dispatch this from CreateProblem to instantly add it to the list
    addProblemLocally: (state, action) => {
      state.problemsList.push(action.payload);
    },
    updateProblemLocally: (state, action) => {
      const index = state.problemsList.findIndex(
        (problem) => problem._id === action.payload._id
      );
      if (index !== -1) {
        state.problemsList[index] = action.payload;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllProblems.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAllProblems.fulfilled, (state, action) => {
        state.isLoading = false;
        state.problemsList = action.payload;
        state.hasFetchedOnce = true;
      })
      .addCase(fetchAllProblems.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { removeProblemLocally, addProblemLocally, updateProblemLocally } = problemSlice.actions;
export default problemSlice.reducer;