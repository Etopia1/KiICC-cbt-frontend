import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import SchoolRegister from './pages/SchoolRegister';
import StudentSignup from './pages/StudentSignup';
import TeacherSignup from './pages/TeacherSignup';
import VerifyEmail from './pages/VerifyEmail';
import ForgotPassword from './pages/ForgotPassword';
import VerifyOTP from './pages/VerifyOTP';
import ResetPassword from './pages/ResetPassword';
import PrivateRoute from './components/PrivateRoute';
// Removed AuthContext import
import AdminTeachers from './pages/AdminTeachers';
import AdminApprovals from './pages/AdminApprovals';
import AdminStudents from './pages/AdminStudents';
import AdminExams from './pages/AdminExams';
import AdminResults from './pages/AdminResults';
import AdminAnalytics from './pages/AdminAnalytics';
import PlaceholderPage from './pages/PlaceholderPage';
import TeacherDashboard from './pages/TeacherDashboard';
import TeacherAttendance from './pages/TeacherAttendance'; // Added by instruction
import TeacherAttendanceHistory from './pages/TeacherAttendanceHistory';
import TeacherTests from './pages/TeacherTests';
import CreateTest from './pages/CreateTest';
import ExamMonitor from './pages/ExamMonitor';
import TestPage from './pages/ExamPage';
import Teachers from './pages/Teachers';
import Students from './pages/Students';
import StaffAttendance from './pages/StaffAttendance';
import StudentDashboard from './pages/StudentDashboard';
import TeacherResults from './pages/TeacherResults';
import StudentRecordsSpreadsheet from './pages/StudentRecordsSpreadsheet';
import Subscription from './pages/Subscription';
import StaffCommunity from './pages/StaffCommunity';
import ResultTemplateManager from './pages/ResultTemplateManager';
import GradingDashboard from './pages/GradingDashboard';
import AdminSettings from './pages/AdminSettings';
import TeacherAnalytics from './pages/TeacherAnalytics';
import AdminActivityMonitor from './pages/AdminActivityMonitor';

import { Toaster } from 'react-hot-toast';

import { SocketProvider } from './context/SocketContext';

function App() {
  return (
    <Router>
      <SocketProvider>
        <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
        <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register-school" element={<SchoolRegister />} />
        <Route path="/signup/teacher" element={<TeacherSignup />} />
        <Route path="/signup/teacher/:token" element={<TeacherSignup />} />

        <Route path="/signup/student" element={<StudentSignup />} />
        <Route path="/signup/student/:schoolRefId" element={<StudentSignup />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/verify-otp" element={<VerifyOTP />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Admin Routes (Super Admin) */}
        <Route
          path="/admin"
          element={
            <PrivateRoute role="admin">
              <AdminDashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/school/dashboard"
          element={
            <PrivateRoute role="school_admin">
              <AdminDashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/school/approvals"
          element={
            <PrivateRoute role="school_admin">
              <AdminApprovals />
            </PrivateRoute>
          }
        />
        <Route
          path="/school/teachers"
          element={
            <PrivateRoute role="school_admin">
              <Teachers />
            </PrivateRoute>
          }
        />
        <Route
          path="/school/students"
          element={
            <PrivateRoute role="school_admin">
              <Students />
            </PrivateRoute>
          }
        />

        <Route
          path="/school/community"
          element={
            <PrivateRoute role="school_admin">
              <StaffCommunity />
            </PrivateRoute>
          }
        />
        <Route
          path="/school/activity"
          element={
            <PrivateRoute role="school_admin">
              <AdminActivityMonitor />
            </PrivateRoute>
          }
        />
        <Route
          path="/school/result-template"
          element={
            <PrivateRoute role="school_admin">
              <ResultTemplateManager />
            </PrivateRoute>
          }
        />
        <Route
          path="/school/exams"
          element={
            <PrivateRoute role="school_admin">
              <AdminExams />
            </PrivateRoute>
          }
        />
        <Route path="/school/results" element={<PrivateRoute role="school_admin"><AdminResults /></PrivateRoute>} />
        <Route path="/school/analytics" element={<PrivateRoute role="school_admin"><AdminAnalytics /></PrivateRoute>} />
        <Route
          path="/school/attendance"
          element={
            <PrivateRoute role="school_admin">
              <StaffAttendance isAdmin={true} />
            </PrivateRoute>
          }
        />
        <Route
          path="/school/settings"
          element={
            <PrivateRoute role="school_admin">
              <AdminSettings />
            </PrivateRoute>
          }
        />

        {/* Teacher Routes */}
        <Route
          path="/teacher/dashboard"
          element={
            <PrivateRoute role="teacher">
              <TeacherDashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/teacher/attendance"
          element={
            <PrivateRoute role="teacher">
              <TeacherAttendance />
            </PrivateRoute>
          }
        />
        <Route
          path="/teacher/attendance-history"
          element={
            <PrivateRoute role="teacher">
              <TeacherAttendanceHistory />
            </PrivateRoute>
          }
        />
        <Route
          path="/teacher/tests"
          element={
            <PrivateRoute role="teacher">
              <TeacherTests />
            </PrivateRoute>
          }
        />
        <Route
          path="/staff/attendance"
          element={
            <PrivateRoute role="teacher">
              <StaffAttendance />
            </PrivateRoute>
          }
        />
        <Route
          path="/teacher/tests/create"
          element={
            <PrivateRoute role="teacher">
              <CreateTest />
            </PrivateRoute>
          }
        />
        <Route
          path="/teacher/exam/:examId/monitor"
          element={
            <PrivateRoute role="teacher">
              <ExamMonitor />
            </PrivateRoute>
          }
        />
        <Route
          path="/teacher/results"
          element={
            <PrivateRoute role="teacher">
              <TeacherResults />
            </PrivateRoute>
          }
        />
        <Route
          path="/teacher/analytics"
          element={
            <PrivateRoute role="teacher">
              <TeacherAnalytics />
            </PrivateRoute>
          }
        />
        <Route
          path="/teacher/grading"
          element={
            <PrivateRoute role="teacher">
              <GradingDashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/teacher/student-records"
          element={
            <PrivateRoute role="teacher">
              <StudentRecordsSpreadsheet />
            </PrivateRoute>
          }
        />
        <Route
          path="/teacher/community"
          element={
            <PrivateRoute role="teacher">
              <StaffCommunity />
            </PrivateRoute>
          }
        />
        <Route
          path="/student/dashboard"
          element={
            <PrivateRoute role="student">
              <StudentDashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/exam/:examId"
          element={
            <PrivateRoute role="student">
              <TestPage />
            </PrivateRoute>
          }
        />
        <Route path="*" element={<Navigate to="/login" />} />
        <Route
          path="/school/settings"
          element={
            <PrivateRoute role="admin">
              <AdminSettings />
            </PrivateRoute>
          }
        />
      </Routes>
      </SocketProvider>
    </Router>
  );
}

export default App;
