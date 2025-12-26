import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { Suspense, useState, useEffect } from "react";
import MainLayout from "./layouts/MainLayout";
import Login from "./pages/Login";
import { routes } from "./routes";

// --- Loading Screen Component ---
const LoadingScreen = () => (
  <div className="fixed inset-0 bg-white flex flex-col items-center justify-center z-[9999]">
    <div className="relative">
      <div className="w-24 h-24 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
      <div className="absolute inset-0 flex items-center justify-center animate-pulse">
        <img
          src="/logo-icon.png"
          className="w-10 h-10 object-contain"
          alt="Loading..."
        />
      </div>
    </div>
    <p className="mt-4 text-slate-500 font-medium text-sm tracking-widest uppercase animate-pulse">
      Loading Baba Car Wash...
    </p>
  </div>
);

// --- Protected Route Wrapper ---
const ProtectedRoute = () => {
  // Check for the actual token used by your AuthService
  const token = localStorage.getItem("token");

  // If no token, redirect to Login
  return token ? <Outlet /> : <Navigate to="/login" replace />;
};

// --- Public Route Wrapper (Optional: prevents logged-in users from seeing login) ---
const PublicRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  // If user is already logged in, send them to dashboard
  if (token) {
    return <Navigate to="/" replace />;
  }
  return children;
};

function App() {
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    // Simulate initial app loading checks (e.g., verify token validity)
    const timer = setTimeout(() => setAppReady(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  if (!appReady) return <LoadingScreen />;

  return (
    <BrowserRouter>
      {/* --- MASTER TOASTER CONFIGURATION --- */}
      <Toaster
        position="top-right"
        reverseOrder={false}
        gutter={8}
        toastOptions={{
          // Default duration: 2 seconds (Fast disappear)
          duration: 2000,

          // Default Style (Modern & Clean)
          style: {
            background: "#1e293b", // Slate-800
            color: "#fff",
            border: "1px solid rgba(255,255,255,0.1)",
            padding: "12px 20px",
            borderRadius: "8px",
            fontSize: "14px",
            fontWeight: "500",
            boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.3)",
          },

          // Success Configuration
          success: {
            duration: 2000,
            iconTheme: { primary: "#10B981", secondary: "#fff" }, // Emerald Green
            style: {
              borderLeft: "4px solid #10B981",
            },
          },

          // Error Configuration
          error: {
            duration: 3000, // Errors stay slightly longer
            iconTheme: { primary: "#EF4444", secondary: "#fff" }, // Red
            style: {
              borderLeft: "4px solid #EF4444",
            },
          },
        }}
      />

      <Routes>
        {/* Login Route (Public but guarded) */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />

        {/* Protected Application Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<MainLayout />}>
            {/* Dashboard Default Route */}
            <Route
              index
              element={
                <Suspense fallback={<LoadingScreen />}>
                  {routes.find((r) => r.path === "/")?.component}
                </Suspense>
              }
            />

            {/* Dynamic Routes from routes.js */}
            {routes.map((route) => (
              <Route
                key={route.path}
                path={route.path}
                element={
                  <Suspense fallback={<LoadingScreen />}>
                    {route.component}
                  </Suspense>
                }
              />
            ))}
          </Route>
        </Route>

        {/* Fallback Route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
