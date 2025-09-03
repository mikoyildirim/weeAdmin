import axios from "../api/axios";

const login = async (email, password) => {
  try {
    const response = await axios.post("/users/login", { email, password });
    const user = response.data.user || response.data;
    const token = response.data.token;

    // LocalStorage’a kaydet
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));

    return user;
  } catch (err) {
    throw err;
  }
};

const logout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
};

const getCurrentUser = () => {
  try {
    const user = JSON.parse(localStorage.getItem("user"));
    return user || null;
  } catch {
    return null;
  }
};

export default {
  login,
  logout,
  getCurrentUser,
};
