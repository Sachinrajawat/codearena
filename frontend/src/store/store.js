import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../authSlice"; 
import problemReducer from "../problemSlice";

const store = configureStore({
  reducer: {
    auth: authReducer,
    problems: problemReducer,
    // As you build more features, you will add more slices here
    // problem: problemReducer, 
  },
});

export default store;