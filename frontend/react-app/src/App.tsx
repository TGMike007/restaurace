import { Routes, Route } from 'react-router-dom';
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




function App(): JSX.Element {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<HomePage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="menu" element={<MenuPage />} />
        <Route path="orders" element={<OrdersPage />} />
        <Route path="reservations" element={<ReservationsPage />} />
        <Route path="shifts" element={<ShiftsPage />} />
        <Route path="days" element={<DaysPage />} />
        <Route path="customers" element={<CustomersPage />} />

        {/* Sem přidávej další stránky */}
      </Route>
    </Routes>
  );
}

export default App;