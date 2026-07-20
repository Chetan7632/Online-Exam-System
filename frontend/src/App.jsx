import React, { useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

// Components
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import StudentDashboard from './pages/StudentDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import ExamDetails from './pages/ExamDetails';
import TakeExam from './pages/TakeExam';
import ExamResults from './pages/ExamResults';
import CreateExam from './pages/CreateExam';
import EditExam from './pages/EditExam';
import Profile from './pages/Profile';
import ForgotPassword from './pages/ForgotPassword';
import Home from './pages/Home';

// Home redirect helper to route logged-in users to their correct workspace
const HomeRedirect = () => {
  const { user } = useContext(AuthContext);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return user.role === 'teacher' 
    ? <Navigate to="/teacher-dashboard" replace /> 
    : <Navigate to="/student-dashboard" replace />;
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <Navbar />
          <div style={{ flex: 1 }}>
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />

              {/* Guarded Routes - Students */}
              <Route
                path="/student-dashboard"
                element={
                  <ProtectedRoute allowedRoles={['student']}>
                    <StudentDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/exam/:id"
                element={
                  <ProtectedRoute allowedRoles={['student']}>
                    <ExamDetails />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/exam/:id/take"
                element={
                  <ProtectedRoute allowedRoles={['student']}>
                    <TakeExam />
                  </ProtectedRoute>
                }
              />

              {/* Guarded Routes - Teachers */}
              <Route
                path="/teacher-dashboard"
                element={
                  <ProtectedRoute allowedRoles={['teacher']}>
                    <TeacherDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/create-exam"
                element={
                  <ProtectedRoute allowedRoles={['teacher']}>
                    <CreateExam />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/edit-exam/:id"
                element={
                  <ProtectedRoute allowedRoles={['teacher']}>
                    <EditExam />
                  </ProtectedRoute>
                }
              />

              {/* Guarded Routes - Shared/Results */}
              <Route
                path="/exam-result/:attemptId"
                element={
                  <ProtectedRoute allowedRoles={['student', 'teacher']}>
                    <ExamResults />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/profile"
                element={
                  <ProtectedRoute allowedRoles={['student', 'teacher']}>
                    <Profile />
                  </ProtectedRoute>
                }
              />

              {/* Root Handler */}
              <Route path="/" element={<Home />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </div>
      </BrowserRouter>
    </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
