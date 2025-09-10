import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import Login from "./pages/Login";

// Sayfaları import et
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
import Polygons from "./pages/Maps/Polygons";
import Heatmap from "./pages/Maps/Heatmap";
import Distribution from "./pages/Maps/Distribution";

// Devices
import ActiveDevices from "./pages/Devices/ActiveDevices";
import PassiveDevices from "./pages/Devices/PassiveDevices";
import UnusedDevices from "./pages/Devices/UnusedDevices";
import DeviceManagement from "./pages/Devices/DeviceManagement";

// Users
import Users from "./pages/Users/Users";
import NegativeUsers from "./pages/Users/NegativeUsers";

// Others
import Calls from "./pages/Calls";
import Supports from "./pages/Supports";
import Campaigns from "./pages/Management/Campaigns";
import Financial from "./pages/Management/Financial";
import Notifications from "./pages/Management/Notifications";
import Staff from "./pages/Management/Staff";
import Fraud from "./pages/Management/Fraud";
import Rentals from "./pages/Rentals";

function App() {
  const token = localStorage.getItem("token");

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route
          path="/panel/*"
          element={
            token ? (
              <MainLayout>
                <Routes>
                  <Route path="" element={<Dashboard />} />

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
                  <Route path="maps/heatmap" element={<Heatmap />} />
                  <Route path="maps/distribution" element={<Distribution />} />

                  {/* Devices */}
                  <Route path="devices/active" element={<ActiveDevices />} />
                  <Route path="devices/passive" element={<PassiveDevices />} />
                  <Route path="devices/unused" element={<UnusedDevices />} />
                  <Route path="devices/all" element={<DeviceManagement />} />

                  {/* Users */}
                  <Route path="users" element={<Users />} />
                  <Route path="users/negative" element={<NegativeUsers />} />

                  {/* Others */}
                  <Route path="calls" element={<Calls />} />
                  <Route path="supports" element={<Supports />} />
                  <Route path="management/campaigns" element={<Campaigns />} />
                  <Route path="management/financial" element={<Financial />} />
                  <Route path="management/notifications" element={<Notifications />} />
                  <Route path="management/staff" element={<Staff />} />
                  <Route path="management/fraud" element={<Fraud />} />
                  <Route path="rentals" element={<Rentals />} />
                </Routes>
              </MainLayout>
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        <Route path="*" element={<Navigate to={token ? "/panel" : "/login"} />} />
      </Routes>
    </Router>
  );
}

export default App;
