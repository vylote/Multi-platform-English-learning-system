import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../store/slice/authSlice'; 

export const store = configureStore({
  reducer: {
    auth: authReducer, 
  },
});