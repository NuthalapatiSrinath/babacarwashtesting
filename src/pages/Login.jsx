import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, EyeOff, Lock, Phone, ArrowRight } from "lucide-react";
import toast from "react-hot-toast";
import { authService } from "../api/authService"; // Import the service

const Login = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Changed 'mobile' to 'number' to match API Payload
  const [formData, setFormData] = useState({ number: "", password: "" });

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // --- REAL API CALL ---
      const response = await authService.login(
        formData.number,
        formData.password
      );

      if (response.statusCode === 200) {
        // 1. Save Token & User Info
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("user", JSON.stringify(response.data)); // Save name, role, id
        localStorage.setItem("isAuthenticated", "true");

        // 2. Success Toast
        toast.success(`Welcome back, ${response.data.name}!`, {
          style: {
            border: "1px solid var(--color-success)",
            padding: "16px",
            color: "var(--color-success)",
            background: "var(--color-card)",
          },
          iconTheme: {
            primary: "var(--color-success)",
            secondary: "var(--color-text-inverse)",
          },
        });

        // 3. Redirect
        navigate("/");
      } else {
        // Handle API logical errors (if 200 but success=false)
        throw new Error(response.message || "Login Failed");
      }
    } catch (error) {
      console.error("Login Error:", error);
      toast.error(error.message || "Invalid Credentials", {
        style: {
          border: "1px solid var(--color-danger)",
          color: "var(--color-danger)",
          background: "var(--color-card)",
        },
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleNumberChange = (e) => {
    const value = e.target.value.replace(/\D/g, ""); // Numbers only
    if (value.length <= 10) setFormData({ ...formData, number: value });
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-grad-start via-grad-mid to-grad-end relative overflow-hidden transition-colors duration-300">
      {/* Background Blobs */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blob rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2"></div>
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blob rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2"></div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-4xl bg-card/80 backdrop-blur-xl rounded-3xl shadow-card overflow-hidden flex flex-col md:flex-row border border-border relative z-10 mx-4"
      >
        {/* LEFT SIDE: Brand */}
        <div className="w-full md:w-1/2 bg-gradient-to-br from-primary to-primary-hover p-12 flex flex-col justify-between text-text-inverse relative">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>

          <div className="relative z-10">
            <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mb-8 shadow-inner border border-white/20">
              <img
                src="/logo-icon.png"
                className="w-12 h-12 object-contain"
                alt="Logo"
              />
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight mb-2 text-text-inverse">
              Baba Car Wash
            </h1>
            <p className="text-primary-light font-medium text-lg">
              Admin Control Center
            </p>
          </div>

          <div className="relative z-10 mt-12">
            <p className="text-sm text-primary-light/80 leading-relaxed">
              "Streamline your operations, manage bookings, and track finances
              efficiently."
            </p>
          </div>
        </div>

        {/* RIGHT SIDE: Form */}
        <div className="w-full md:w-1/2 p-10 md:p-14 flex flex-col justify-center bg-card">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-text-main">Sign In</h2>
            <p className="text-text-sub mt-2">Access your admin dashboard.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            {/* Mobile Number Input */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-text-sub uppercase tracking-wider">
                Mobile Number
              </label>
              <div className="relative">
                <Phone className="absolute left-4 top-3.5 w-5 h-5 text-text-muted" />
                <input
                  type="tel"
                  value={formData.number}
                  onChange={handleNumberChange}
                  className="w-full bg-input-bg border border-input-border rounded-xl pl-12 pr-4 py-3.5 text-text-main focus:bg-card focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium placeholder:text-text-muted font-mono"
                  placeholder="9494197969"
                  required
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-text-sub uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-3.5 w-5 h-5 text-text-muted" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="w-full bg-input-bg border border-input-border rounded-xl pl-12 pr-12 py-3.5 text-text-main focus:bg-card focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium placeholder:text-text-muted"
                  placeholder="Enter Password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-3.5 text-text-muted hover:text-primary transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || formData.number.length < 10}
              className="w-full bg-primary hover:bg-primary-hover text-text-inverse font-bold py-4 rounded-xl shadow-lg shadow-primary/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed mt-4"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Login <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
