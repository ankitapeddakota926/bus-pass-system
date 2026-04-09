import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import BusLoader from './components/BusLoader';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import UserDashboard from './pages/UserDashboard';
import AdminDashboard from './pages/AdminDashboard';
import VerifyPass from './pages/VerifyPass';
import AnnouncementBanner from './components/AnnouncementBanner';
import { AuthContext } from './context/AuthContext';
import './index.css';

function App() {
  const { loading } = useContext(AuthContext);

  if (loading) return <BusLoader fullScreen message="Starting TransitPass" />;

  return (
    <Router>
      <div className="app-container">
        <Navbar />
        <AnnouncementBanner />
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />
            <Route path="/register" element={<Register />} />
            <Route path="/user-dashboard" element={<UserDashboard />} />
            <Route path="/admin-dashboard" element={<AdminDashboard />} />
            <Route path="/verify/:passId" element={<VerifyPass />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
