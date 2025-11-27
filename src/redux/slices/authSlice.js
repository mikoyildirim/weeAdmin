import { createSlice } from "@reduxjs/toolkit";

const authSlice = createSlice({
    name: "user",
    initialState: {
        accessToken: null,
        user: null, // persist edilmeyecek
    },
    reducers: {
        login(state, action) {
            state.accessToken = action.payload.token;
            state.user = action.payload.user;
        },
        setUser(state, action) {
            state.user = action.payload;
        },
        updateAccessToken(state, action) {
            state.accessToken = action.payload;
        },
        logout(state) {
            state.accessToken = null;
            state.user = null;
        },
    },
});

export const { login, setUser, logout, updateAccessToken } = authSlice.actions;
export default authSlice.reducer;
