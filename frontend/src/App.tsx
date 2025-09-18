// frontend/src/App.tsx

import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '../shared/contexts/AuthContext';
import ProtectedRoute from '../shared/components/ProtectedRoute';
import HomeRedirect from '../shared/components/HomeRedirect';
import Navbar from '../shared/components/Navbar';
import LoadingSpinner from '../shared/components/LoadingSpinner';
import { AccountType } from '../shared/types/user.types';


// Lazy load pages for better performance
const LoginPage = lazy(() => import('../shared/pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('../shared/pages/auth/RegisterPage'));
const ChangePasswordPage = lazy(() => import('../shared/pages/auth/ChangePasswordPage'));
const IndividualDashboard = lazy(() => import('../apps/athlete/src/pages/IndividualDashboard'));
const CoachDashboard = lazy(() => import('../apps/coach/src/pages/CoachDashboard'));
const AthleteDashboard = lazy(() => import('../apps/athlete/src/pages/AthleteDashboard'));
const AdminDashboard = lazy(() => import('../apps/admin/src/pages/AdminDashboard'));
const VideoUploadPage = lazy(() => import('../shared/pages/upload/VideoUploadPage'));

function App() {
  return (

  

    <AuthProvider>
      <div className="min-h-screen bg-white">
        <Suspense fallback={<LoadingSpinner fullScreen />}>
          <Routes>
            {/* Auth Routes - No Navbar */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            
            {/* Protected Routes with Navbar */}
            <Route
              path="/*"
              element={
                <>
                  <Navbar />
                  <Suspense fallback={<LoadingSpinner fullScreen />}>
                    <Routes>
                      {/* Change Password Route */}
                      <Route
                        path="/change-password"
                        element={
                          <ProtectedRoute requirePasswordChange={true}>
                            <ChangePasswordPage />
                          </ProtectedRoute>
                        }
                      />

                      {/* Individual Dashboard */}
                      <Route
                        path="/dashboard"
                        element={
                          <ProtectedRoute allowedAccountTypes={[AccountType.INDIVIDUAL]}>
                            <IndividualDashboard />
                          </ProtectedRoute>
                        }
                      />

                      {/* Coach Dashboard */}
                      <Route
                        path="/coach"
                        element={
                          <ProtectedRoute allowedAccountTypes={[AccountType.COACH]}>
                            <CoachDashboard />
                          </ProtectedRoute>
                        }
                      />
                      
                      <Route
                        path="/coach/athletes"
                        element={
                          <ProtectedRoute allowedAccountTypes={[AccountType.COACH]}>
                            <CoachDashboard />
                          </ProtectedRoute>
                        }
                      />

                      {/* Admin Dashboard */}
                      <Route
                        path="/admin"
                        element={
                          <ProtectedRoute allowedAccountTypes={[AccountType.ADMIN]}>
                            <AdminDashboard />
                          </ProtectedRoute>
                        }
                      />

                      {/* Limited Athlete Dashboard */}
                      <Route
                        path="/athlete"
                        element={
                          <ProtectedRoute allowedAccountTypes={[AccountType.ATHLETE_LIMITED]}>
                            <AthleteDashboard />
                          </ProtectedRoute>
                        }
                      />

                      {/* Video Upload Route */}
                      <Route
                        path="/upload"
                        element={
                          <ProtectedRoute allowedAccountTypes={[AccountType.INDIVIDUAL, AccountType.COACH]}>
                            <VideoUploadPage />
                          </ProtectedRoute>
                        }
                      />

                      {/* Analyses Route */}
                      <Route
                        path="/analyses"
                        element={
                          <ProtectedRoute>
                            <div className="pt-24 pb-12">
                              <div className="max-w-7xl mx-auto px-4 py-8">
                                <div className="card-luxury text-center py-16">
                                  <div className="w-24 h-24 bg-gradient-to-br from-primary-100 to-primary-200 rounded-3xl mx-auto mb-6 flex items-center justify-center">
                                    <svg className="w-12 h-12 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm3 1h6v4H7V5zm6 6H7v2h6v-2z" clipRule="evenodd" />
                                    </svg>
                                  </div>
                                  <h2 className="text-2xl font-display font-bold text-neutral-900 mb-2">Analyses</h2>
                                  <p className="text-neutral-600">Your analysis history will appear here.</p>
                                </div>
                              </div>
                            </div>
                          </ProtectedRoute>
                        }
                      />
                      
                      {/* Profile Route */}
                      <Route
                        path="/profile"
                        element={
                          <ProtectedRoute>
                            <div className="pt-24 pb-12">
                              <div className="max-w-7xl mx-auto px-4 py-8">
                                <div className="card-luxury text-center py-16">
                                  <div className="w-24 h-24 bg-gradient-to-br from-purple-100 to-purple-200 rounded-3xl mx-auto mb-6 flex items-center justify-center">
                                    <svg className="w-12 h-12 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                    </svg>
                                  </div>
                                  <h2 className="text-2xl font-display font-bold text-neutral-900 mb-2">Profile</h2>
                                  <p className="text-neutral-600">Your profile settings will be available here.</p>
                                </div>
                              </div>
                            </div>
                          </ProtectedRoute>
                        }
                      />
                      
                      {/* Settings Route */}
                      <Route
                        path="/settings"
                        element={
                          <ProtectedRoute>
                            <div className="pt-24 pb-12">
                              <div className="max-w-7xl mx-auto px-4 py-8">
                                <div className="card-luxury text-center py-16">
                                  <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-blue-200 rounded-3xl mx-auto mb-6 flex items-center justify-center">
                                    <svg className="w-12 h-12 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                                    </svg>
                                  </div>
                                  <h2 className="text-2xl font-display font-bold text-neutral-900 mb-2">Settings</h2>
                                  <p className="text-neutral-600">Account settings and preferences will be available here.</p>
                                </div>
                              </div>
                            </div>
                          </ProtectedRoute>
                        }
                      />

                      {/* Home Route */}
                      <Route path="/" element={<HomeRedirect />} />

                      {/* Catch all */}
                      <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                  </Suspense>
                </>
              }
            />
          </Routes>
        </Suspense>
      </div>
    </AuthProvider>
  );
}

export default App;