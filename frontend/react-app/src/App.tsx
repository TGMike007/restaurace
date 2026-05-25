import { JSX } from 'react';
import MainLayout from './layouts/MainLayout';
import HomePage from './pages/HomePage';
import UsersPage from './pages/UsersPage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import MenuPage from './pages/MenuPage';
import OrdersPage from './pages/OrdersPage';
import ReservationsPage from './pages/ReservationsPage';
import ShiftsPage from './pages/ShiftsPage';
import DaysPage from './pages/DaysPage';
import CustomersPage from './pages/CustomersPage';
import ProtectedRoute from './components/ProtectedRoute';
import { Routes, Route, Navigate } from 'react-router-dom';
import TablesPage from './pages/TablesPage';



function App(): JSX.Element {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>

        {/* Veřejné */}
        <Route index element={<HomePage />} />
        <Route path="login" element={<LoginPage />} />

        {/* Všichni přihlášení */}
        <Route path="dashboard" element={
          <ProtectedRoute allowedRoles={['cisnik', 'vedouci', 'admin']}>
            <DashboardPage />
          </ProtectedRoute>
        } />
        <Route path="menu" element={
          <ProtectedRoute allowedRoles={['cisnik', 'vedouci', 'admin']}>
            <MenuPage />
          </ProtectedRoute>
        } />
        <Route path="orders" element={
          <ProtectedRoute allowedRoles={['cisnik', 'vedouci', 'admin']}>
            <OrdersPage />
          </ProtectedRoute>
        } />
        <Route path="reservations" element={
          <ProtectedRoute allowedRoles={['cisnik', 'vedouci', 'admin']}>
            <ReservationsPage />
          </ProtectedRoute>
        } />
        <Route path="shifts" element={
          <ProtectedRoute allowedRoles={['cisnik', 'vedouci', 'admin']}>
            <ShiftsPage />
          </ProtectedRoute>
        } />
        <Route path="customers" element={
          <ProtectedRoute allowedRoles={['cisnik', 'vedouci', 'admin']}>
            <CustomersPage />
          </ProtectedRoute>
        } />
        <Route path="tables" element={
          <ProtectedRoute allowedRoles={['cisnik', 'vedouci', 'admin']}>
            <TablesPage />
          </ProtectedRoute>
        } />

        {/* Pouze vedoucí a admin */}
        <Route path="days" element={
          <ProtectedRoute allowedRoles={['vedouci', 'admin']}>
            <DaysPage />
          </ProtectedRoute>
        } />
        <Route path="reports" element={<Navigate to="/days" replace />} />

        {/* Pouze admin */}
        <Route path="users" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <UsersPage />
          </ProtectedRoute>
        } />
        

      </Route>
    </Routes>
  );
}

export default App;