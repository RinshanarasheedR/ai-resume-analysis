import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ResumeBuilder from './pages/ResumeBuilder';
import ATSChecker from './pages/ATSChecker';
import Aptitude from './pages/Aptitude';
import Technical from './pages/Technical';
import MockInterview from './pages/MockInterview';
import LearningResources from './pages/LearningResources';
import AdminPanel from './pages/AdminPanel';
import Profile from './pages/Profile';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            <Route path="/" element={<Layout />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="resume-builder" element={<ResumeBuilder />} />
              <Route path="ats-checker" element={<ATSChecker />} />
              <Route path="aptitude" element={<Aptitude />} />
              <Route path="technical" element={<Technical />} />
              <Route path="mock-interview" element={<MockInterview />} />
              <Route path="learning-resources" element={<LearningResources />} />
              <Route path="admin" element={<AdminPanel />} />
              <Route path="profile" element={<Profile />} />
            </Route>
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
