import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/login";
import ProtectedRoute from "./components/ProtectedRoute";
import DashboardLayout from "./components/DasboardLayout";
import Orders from "./pages/Orders";
import StaffManagement from "./pages/StaffManagement";
import MenuManagement from "./pages/menuManagement";
import Dashboard from "./pages/Dashboard";
import Customers from "./pages/customers/Customers";
import Reports from "./pages/Reports";
import Tables from "./pages/Table"



export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/dashboard/staff" element={<StaffManagement />} />
          <Route path="/dashboard/menu" element={<MenuManagement />} />
          <Route path="/dashboard/customers" element={<Customers />} />
          <Route path="/dashboard/orders" element={<Orders />} />
          <Route path="/dashboard/reports" element={<Reports />} />
          <Route path="/dashboard/tables" element={<Tables />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
