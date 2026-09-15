import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../api/axios";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const savedEmail = localStorage.getItem("rememberedEmail");
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const cleanEmail = email.trim();
      const response = await axiosInstance.post("/auth/login", {
        email: cleanEmail,
        password,
      });
      const { token, user } = response.data;

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      if (rememberMe) {
        localStorage.setItem("rememberedEmail", cleanEmail);
      } else {
        localStorage.removeItem("rememberedEmail");
      }

      navigate("/dashboard");
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          "Login gagal. Cek email dan password kamu."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[#09090b] p-4 overflow-hidden font-sans">
      <div className="absolute top-12 right-12 md:right-1/4 h-24 w-24 md:h-40 md:w-40 rounded-full bg-linear-to-tr from-cyan-600 to-cyan-500 opacity-90 blur-xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 md:left-1/4 h-24 w-24 md:h-40 md:w-40 rounded-full bg-linear-to-tr from-zinc-600 to-emerald-200 opacity-90 blur-xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-md rounded-2xl border border-white/20 bg-white/10 p-8 shadow-2xl backdrop-blur-md">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-wide text-white">Login</h1>
          <p className="mt-2 text-xs font-light text-gray-300">
            Masukan email dan password untuk masuk ke sistem restoran
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          {error && (
            <div className="rounded-lg bg-rose-500/20 p-3 text-xs text-rose-300 border border-rose-500/30">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-300">Email</label>
            <Input
              type="email"
              placeholder="admin@restaurant.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-11 rounded-lg border border-gray-600/60 bg-black/40 text-white placeholder:text-gray-500 focus-visible:ring-1 focus-visible:ring-rose-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-300">Password</label>
            <Input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="h-11 rounded-lg border border-gray-600/60 bg-black/40 text-white placeholder:text-gray-500 focus-visible:ring-1 focus-visible:ring-rose-500"
            />
          </div>

          <div className="flex items-center justify-between text-xs text-gray-400">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-gray-600 bg-black/40 text-blue-500 accent-rose-500 cursor-pointer"
              />
              <span className="text-gray-300">Remember Me</span>
            </label>
            <button
              type="button"
              onClick={() => alert("Silakan hubungi Administrator Utama untuk reset password.")}
              className="text-blue-400 hover:underline bg-transparent border-none p-0 cursor-pointer text-xs"
            >
              Lupa kata sandi?
            </button>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-11 rounded-lg bg-blue-500 hover:bg-blue-600 font-semibold text-white transition-all shadow-lg shadow-blue-500/25 cursor-pointer"
          >
            {loading ? "Memproses..." : "Login"}
          </Button>
        </form>
      </div>
    </div>
  );
}