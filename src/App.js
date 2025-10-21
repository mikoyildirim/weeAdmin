// src/App.js
import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { loadUserFromStorage } from "./store/userSlice";

import MainLayout from "./layouts/MainLayout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";

// Reports
import RentalsReport from "./pages/Reports/RentalsReport";
import WeePuanReport from "./pages/Reports/WeePuanReport";
import TransactionsReport from "./pages/Reports/TransactionsReport";
import StaffReport from "./pages/Reports/StaffReport";

// Maps
import ActiveMap from "./pages/Maps/ActiveMap";
import PassiveMap from "./pages/Maps/PassiveMap";
import LostMap from "./pages/Maps/LostMap";
import Polygons from "./pages/Maps/Polygons/Polygons";
import PolygonCreate from "./pages/Maps/Polygons/PolygonCreate";
import PolygonUpdate from "./pages/Maps/Polygons/PolygonUpdate";
import Heatmap from "./pages/Maps/Heatmap";
import Distribution from "./pages/Maps/Distribution";

// Devices
import ActiveDevices from "./pages/Devices/ActiveDevices";
import PassiveDevices from "./pages/Devices/PassiveDevices";
import UnusedDevices from "./pages/Devices/UnusedDevices";
import DeviceManagement from "./pages/Devices/DeviceManagement";
import DeviceDetail from "./pages/Devices/Detail/DeviceDetail";
import DeviceUpdate from "./pages/Devices/Update/DeviceUpdate";
import DeviceCreate from "./pages/Devices/Create/DeviceCreate";

// Users
import Users from "./pages/Users/Users";
import NegativeUsers from "./pages/Users/NegativeUsers";
import ShowRental from "./pages/Users/ShowRental/ShowRental";

// Others
import Calls from "./pages/Calls";
import Supports from "./pages/Supports";
import Campaigns from "./pages/Management/Campaigns/Campaigns";
import Financial from "./pages/Management/Financial";
import Notifications from "./pages/Management/Notifications";
import Staff from "./pages/Management/Staff/Staff";
import StaffCreate from "./pages/Management/Staff/Create/StaffCreate";
import StaffUpdate from "./pages/Management/Staff/Update/StaffUpdate";
import Fraud from "./pages/Management/Fraud";
import Rentals from "./pages/Rentals";


function App() {
  const token = useSelector((state) => state.user.token);
  const user = useSelector((state) => state.user.user);
  return (
    <Router>
      <Routes>
        {/* Login */}
        <Route path="/login" element={!token ? <Login /> : <Navigate to={user?.permissions.management ? "/panel/dashboard" : "/panel/maps/active"} />} />

        {/* Panel ve nested routes */}
        <Route path="/panel/*" element={token ? <MainLayout /> : <Navigate to="/login" />}>
          {/* /panel → /panel/dashboard yönlendirme */}

          <Route index element={<Navigate to={user?.permissions.management ? "dashboard" : "maps/active"} replace />} />

          {/* Dashboard */}
          <Route path="dashboard" element={<Dashboard />} />

          {/* Reports */}
          <Route path="reports/rentals" element={<RentalsReport />} />
          <Route path="reports/weepuan" element={<WeePuanReport />} />
          <Route path="reports/transactions" element={<TransactionsReport />} />
          <Route path="reports/staff" element={<StaffReport />} />

          {/* Maps */}
          <Route path="maps/active" element={<ActiveMap />} />
          <Route path="maps/passive" element={<PassiveMap />} />
          <Route path="maps/lost" element={<LostMap />} />
          <Route path="maps/polygons" element={<Polygons />} />
          <Route path="maps/polygons/createpolygon" element={<PolygonCreate />} />
          <Route path="maps/polygons/updatepolygon/:id" element={<PolygonUpdate />} />
          <Route path="maps/heatmap" element={<Heatmap />} />
          <Route path="maps/distribution" element={<Distribution />} />

          {/* Devices */}
          <Route path="devices/active" element={<ActiveDevices />} />
          <Route path="devices/passive" element={<PassiveDevices />} />
          <Route path="devices/unused" element={<UnusedDevices />} />
          <Route path="devices/all" element={<DeviceManagement />} />
          <Route path="devices/detail/:id" element={<DeviceDetail />} />
          <Route path="devices/update/:id" element={<DeviceUpdate />} />
          <Route path="devices/create" element={<DeviceCreate />} />

          {/* Users */}
          <Route path="users" element={<Users />} />
          <Route path="users/negative" element={<NegativeUsers />} />
          <Route path="users/showRental/:id" element={<ShowRental />} />
          {/* Others */}
          <Route path="calls" element={<Calls />} />
          <Route path="supports" element={<Supports />} />
          <Route path="management/campaigns/campaigns" element={<Campaigns />} />
          <Route path="management/financial" element={<Financial />} />
          <Route path="management/notifications" element={<Notifications />} />
          <Route path="management/staff" element={<Staff />} />
          <Route path="management/staff/create" element={<StaffCreate />} />
          <Route path="management/staff/update/:id" element={<StaffUpdate />} />
          <Route path="management/fraud" element={<Fraud />} />
          <Route path="rentals" element={<Rentals />} />

        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to={token ? user?.permissions.management ? "/panel/dashboard" : "/panel/maps/active" : "/login"} />} />
      </Routes>
    </Router>
  );
}

export default App;
