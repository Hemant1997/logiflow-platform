import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";

function LoginPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
    if (apiError) setApiError("");
  };

  const validate = () => {
    const next = {};
    if (!formData.email.trim()) {
      next.email = "Enter your email";
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      next.email = "Enter a valid email address";
    }
    if (!formData.password) {
      next.password = "Enter your password";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setApiError("");
    try {
      const res = await axiosInstance.post("/api/auth/login", {
        email: formData.email,
        password: formData.password,
      });
      localStorage.setItem("token", res.data.token);
      navigate("/dashboard");
    } catch (err) {
      if (err.response?.status === 401) {
        setApiError("Check your email and password and try again.");
      } else {
        setApiError("Couldn't reach the server. Try again in a moment.");
      }
    } finally {
      setLoading(false);
    }
  };

  const inputBase =
    "w-full rounded-lg bg-[#0e1720] border border-white/10 px-3 py-2.5 text-[#edf2f4] text-[0.95rem] focus:outline-none focus:border-[#35d0a6] focus:ring-2 focus:ring-[#35d0a6]/20 transition-colors";

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2 bg-[#0e1720] text-[#edf2f4] font-sans">
      {/* Hero panel */}
      <aside
        className="relative hidden md:flex items-end p-12 border-r border-white/5 overflow-hidden"
        aria-hidden="true"
      >
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
            maskImage:
              "radial-gradient(circle at 30% 70%, black 0%, transparent 75%)",
          }}
        />
        <div className="relative z-10 max-w-[380px]">
          <div className="flex items-center gap-2">
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#35d0a6"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M1 3h15v13H1z" />
              <path d="M16 8h4l3 3v5h-7V8z" />
              <circle cx="5.5" cy="18.5" r="2.5" />
              <circle cx="18.5" cy="18.5" r="2.5" />
            </svg>
            <span className="font-mono font-medium text-lg tracking-[0.12em] text-[#35d0a6]">
              LOGIFLOW
            </span>
          </div>
          <p className="mt-5 mb-10 text-2xl leading-snug max-w-[20ch]">
            Track every shipment, from dock to doorstep.
          </p>
          <div className="pt-4 border-t border-white/10">
            <svg viewBox="0 0 320 40" className="w-full h-10 overflow-visible">
              <line
                x1="10"
                y1="20"
                x2="310"
                y2="20"
                stroke="rgba(126,147,160,0.4)"
                strokeWidth="1.5"
                strokeDasharray="4 5"
              />
              <circle cx="10" cy="20" r="4" fill="#35d0a6" stroke="#35d0a6" />
              <circle cx="310" cy="20" r="4" fill="#f2a93c" stroke="#f2a93c" />
              <circle r="5" fill="#35d0a6">
                <animateMotion
                  dur="3.5s"
                  repeatCount="indefinite"
                  path="M10,20 L310,20"
                />
              </circle>
            </svg>
            <div className="flex justify-between text-xs text-[#7e93a0] mt-2">
              <span>Warehouse</span>
              <span>Delivered</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Form panel */}
      <main className="flex items-center justify-center p-8">
        <form
          onSubmit={handleSubmit}
          noValidate
          className="w-full max-w-[380px] bg-[#16212c] border border-white/5 rounded-xl p-9 px-8"
        >
          <h1 className="text-2xl font-medium m-0">Sign in</h1>
          <p className="text-[#7e93a0] text-sm mt-1 mb-7">
            Access your shipments and orders
          </p>

          {apiError && (
            <div
              role="alert"
              className="bg-red-500/10 border border-red-500/40 text-red-300 text-sm px-3 py-2.5 rounded-lg mb-5"
            >
              {apiError}
            </div>
          )}

          <label className="block mb-5 text-sm">
            <span className="block mb-1.5 text-[#b7c4cb]">Email</span>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              autoComplete="email"
              className={`${inputBase} ${
                errors.email ? "border-red-400 focus:border-red-400" : ""
              }`}
            />
            {errors.email && (
              <small className="block mt-1.5 text-red-300 text-xs">
                {errors.email}
              </small>
            )}
          </label>

          <label className="block mb-5 text-sm">
            <span className="block mb-1.5 text-[#b7c4cb]">Password</span>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                autoComplete="current-password"
                className={`${inputBase} pr-14 ${
                  errors.password ? "border-red-400 focus:border-red-400" : ""
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#7e93a0] hover:text-[#35d0a6] bg-transparent border-none cursor-pointer"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            {errors.password && (
              <small className="block mt-1.5 text-red-300 text-xs">
                {errors.password}
              </small>
            )}
          </label>

          <div className="flex justify-between items-center text-sm mb-6">
            <label className="flex items-center gap-1.5 text-[#b7c4cb]">
              <input type="checkbox" className="accent-[#35d0a6]" />
              <span>Remember me</span>
            </label>
            <Link
              to="/forgot-password"
              className="text-[#7e93a0] hover:text-[#35d0a6] no-underline"
            >
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full min-h-[42px] rounded-lg bg-[#35d0a6] text-[#0e1720] font-medium text-[0.95rem] flex items-center justify-center hover:bg-[#2bb992] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed transition-all"
          >
            {loading ? (
              <span className="w-4 h-4 rounded-full border-2 border-[#0e1720]/30 border-t-[#0e1720] animate-spin" />
            ) : (
              "Sign in"
            )}
          </button>

          <p className="text-center mt-6 text-sm text-[#7e93a0]">
            New to LogiFlow?{" "}
            <Link
              to="/register"
              className="text-[#35d0a6] font-medium hover:underline"
            >
              Create an account
            </Link>
          </p>
        </form>
      </main>
    </div>
  );
}

export default LoginPage;