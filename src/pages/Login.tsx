/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Zap, Eye, EyeOff, Mail, Lock, User as UserIcon } from "lucide-react";
import { toast } from "sonner";

export default function Login() {
  const { signIn, signUp, signInWithGoogle, user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      if (signInWithGoogle) {
        await signInWithGoogle();
      } else {
        throw new Error("Google Sign-In not initialized");
      }
    } catch (err: any) {
      toast.error(err.message || "Google Sign-In failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isRegister) {
        if (!name.trim()) {
          throw new Error("Full Name is required");
        }
        if (typeof signUp === "function") {
          await signUp(email, password, name, 'viewer');
        } else {
          throw new Error("Auth registration not initialized");
        }
      } else {
        if (typeof signIn === "function") {
          await signIn(email, password);
        } else {
          throw new Error("Auth system not initialized");
        }
      }
    } catch (err: any) {
      toast.error(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen skeuo-container flex items-center justify-center p-4">
      <div className="w-full max-w-md skeuo-card overflow-hidden">
        <div className="p-8 skeuo-bg flex flex-col items-center gap-4">
          <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center shadow-inner border border-indigo-700">
            <Zap className="text-white w-7 h-7 fill-current drop-shadow" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight" style={{textShadow: '0 1px 1px white'}}>
              Hirenest CRM
            </h1>
            <p className="text-slate-600 font-medium text-sm mt-1">
              AI-Native Staffing Operating System
            </p>
          </div>
        </div>

        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {isRegister && (
              <div className="space-y-2 animate-in slide-in-from-top-2 duration-200">
                <label className="text-sm font-medium text-slate-700 ml-1">
                  Full Name
                </label>
                <div className="relative group">
                  <UserIcon className="absolute left-3 top-3 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Gopal Krishna"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 ml-1">
                Email
              </label>
              <div className="relative group">
                <Mail className="absolute left-3 top-3 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between ml-1">
                <label className="text-sm font-medium text-slate-700">
                  Password
                </label>
                {!isRegister && (
                  <button
                    type="button"
                    onClick={() =>
                      toast.info(
                        "Please contact your administrator to reset password",
                      )
                    }
                    className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative group">
                <Lock className="absolute left-3 top-3 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-12 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-indigo-500 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 text-white py-3 rounded-xl font-semibold hover:bg-slate-800 focus:ring-4 focus:ring-indigo-500/10 transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                isRegister ? "Register Account" : "Sign In"
              )}
            </button>

            <div className="relative my-4 flex py-1 items-center">
              <div className="flex-grow border-t border-slate-200"></div>
              <span className="flex-shrink mx-3 text-[10px] text-slate-400 font-bold uppercase tracking-wider">or</span>
              <div className="flex-grow border-t border-slate-200"></div>
            </div>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 py-2.5 rounded-xl font-bold transition-all flex items-center justify-center gap-3 shadow-sm focus:ring-4 focus:ring-slate-100 text-xs"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12 5.04c1.74 0 3.3.6 4.53 1.77l3.39-3.39C17.86 1.54 15.11 1 12 1 7.24 1 3.21 3.73 1.29 7.7l3.96 3.07C6.18 7.56 8.83 5.04 12 5.04z"
                />
                <path
                  fill="#4285F4"
                  d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.51h6.46c-.28 1.48-1.12 2.73-2.38 3.58l3.69 2.87c2.16-1.99 3.42-4.92 3.42-8.6z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.25 14.77c-.24-.72-.38-1.49-.38-2.27s.14-1.55.38-2.27L1.29 7.16C.47 8.81 0 10.66 0 12.5s.47 3.69 1.29 5.34l3.96-3.07z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.69-2.87c-1.02.68-2.33 1.09-3.96 1.09-3.17 0-5.82-2.52-6.78-5.73L1.29 15.65C3.21 19.62 7.24 23 12 23z"
                />
              </svg>
              Continue with Google
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => setIsRegister(!isRegister)}
              className="text-xs text-indigo-600 hover:text-indigo-700 font-bold uppercase tracking-wider"
            >
              {isRegister ? "Already registered? Sign In" : "Need credentials? Register here"}
            </button>
          </div>

          <div className="mt-8 pt-8 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-400">
              Hirenest CRM - Built for IT Staffing & Global Talent Delivery
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
