import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../store/slice/authSlice'; 
import streakReducer from "./slice/streakSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer, 
    streak: streakReducer,
  },
});