import { createSlice } from "@reduxjs/toolkit";

export const authSlice = createSlice({
  name: "auth",
  initialState: {
    email: '',
    token: ''
  },
  reducers: {
    login:  {
      reducer(state, action) {
        state.email = action.payload.email;
        state.token = action.payload.token;
      },
      prepare(email, token) {
        return {
          payload: {
            email, 
            token
          }
        }
      }
    },
    logout: (state) => {
      state.email = '';
      state.token = '';
    }
  }
});

export const { login, logout } = authSlice.actions;

export const selectEmail = state => state.auth.email;

export const selectToken = state => state.auth.token;

export default authSlice.reducer;