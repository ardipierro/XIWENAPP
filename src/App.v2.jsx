import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { BaseLoading } from './components/base';

/**
 * XIWENAPP V2 - Main Application Router
 *
 * Architecture:
 * - React Router v7 with nested routes
 * - Lazy loading for all screens (code splitting)
 * - Suspense boundaries for loading states
 * - Protected routes by role
 * - Clean URL structure
 *
 * Route Structure:
 * /student/*        → Student screens
 * /teacher/*        → Teacher screens
 * /admin/*          → Admin screens
 * /login            → Auth screen
 */

// Lazy load screens (code splitting)
const LoginScreen = lazy(() => import('./screens/LoginScreen'));

// Student screens
const StudentLayout = lazy(() => import('./layouts/StudentLayout'));
const StudentDashboard = lazy(() => import('./screens/student/DashboardScreen'));
const StudentCourses = lazy(() => import('./screens/student/CoursesScreen'));
const StudentAssignments = lazy(() => import('./screens/student/AssignmentsScreen'));
const StudentClasses = lazy(() => import('./screens/student/ClassesScreen'));
const StudentGamification = lazy(() => import('./screens/student/GamificationScreen'));
const StudentCalendar = lazy(() => import('./screens/student/CalendarScreen'));

// Teacher screens
const TeacherLayout = lazy(() => import('./layouts/TeacherLayout'));
const TeacherDashboard = lazy(() => import('./screens/teacher/DashboardScreen'));
const TeacherCourses = lazy(() => import('./screens/teacher/CoursesScreen'));
const TeacherStudents = lazy(() => import('./screens/teacher/StudentsScreen'));
const TeacherClasses = lazy(() => import('./screens/teacher/ClassesScreen'));
const TeacherAssignments = lazy(() => import('./screens/teacher/AssignmentsScreen'));
const TeacherAnalytics = lazy(() => import('./screens/teacher/AnalyticsScreen'));
const TeacherCalendar = lazy(() => import('./screens/teacher/CalendarScreen'));

// Admin screens
const AdminLayout = lazy(() => import('./layouts/AdminLayout'));
const AdminDashboard = lazy(() => import('./screens/admin/DashboardScreen'));
const AdminUsers = lazy(() => import('./screens/admin/UsersScreen'));
const AdminCourses = lazy(() => import('./screens/admin/CoursesScreen'));
const AdminContent = lazy(() => import('./screens/admin/ContentScreen'));
const AdminAnalytics = lazy(() => import('./screens/admin/AnalyticsScreen'));
const AdminPayments = lazy(() => import('./screens/admin/PaymentsScreen'));
const AdminSettings = lazy(() => import('./screens/admin/SettingsScreen'));

// Loading fallback component
function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-primary dark:bg-primary-900">
      <BaseLoading message="Loading..." />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<LoginScreen />} />

              {/* Student routes */}
              <Route path="/student" element={<StudentLayout />}>
                <Route index element={<StudentDashboard />} />
                <Route path="courses" element={<StudentCourses />} />
                <Route path="assignments" element={<StudentAssignments />} />
                <Route path="classes" element={<StudentClasses />} />
                <Route path="gamification" element={<StudentGamification />} />
                <Route path="calendar" element={<StudentCalendar />} />
              </Route>

              {/* Teacher routes */}
              <Route path="/teacher" element={<TeacherLayout />}>
                <Route index element={<TeacherDashboard />} />
                <Route path="courses" element={<TeacherCourses />} />
                <Route path="students" element={<TeacherStudents />} />
                <Route path="classes" element={<TeacherClasses />} />
                <Route path="assignments" element={<TeacherAssignments />} />
                <Route path="analytics" element={<TeacherAnalytics />} />
                <Route path="calendar" element={<TeacherCalendar />} />
              </Route>

              {/* Admin routes */}
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="courses" element={<AdminCourses />} />
                <Route path="content" element={<AdminContent />} />
                <Route path="analytics" element={<AdminAnalytics />} />
                <Route path="payments" element={<AdminPayments />} />
                <Route path="settings" element={<AdminSettings />} />
              </Route>

              {/* Default redirect */}
              <Route path="/" element={<Navigate to="/student" replace />} />
              <Route path="*" element={<Navigate to="/student" replace />} />
            </Routes>
          </Suspense>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
