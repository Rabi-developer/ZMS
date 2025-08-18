"use client";
import React, { useState } from "react";
import Link from "next/link";
import { login } from "../apis/auth";
import { FiMail, FiLock, FiUser, FiEye, FiEyeOff } from "react-icons/fi";

const SignIn: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // Map email to Username for the API request
      const response = await login({ Username: email, password });

      if (response.statusCode === 200) {
        // Save token and username to localStorage
        localStorage.setItem("token", response?.data?.token);
        localStorage.setItem("userName", response?.data?.userName);

        // Redirect to the home page
        window.location.href = "/";
      } else {
        setError(response.message || "Login failed. Please try again.");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#22c1c3] via-[#3ab4c1] to-[#2d8efd] w-full flex items-center justify-center p-4">
      <div className="w-full max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">

          
          {/* Left Side - Welcome Section */}
          <div className="w-full px-4 lg:px-8 py-8 order-2 lg:order-1">
            <div className="text-center lg:text-left">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-6 lg:mb-8">
                Welcome to <span className="border-b-4 border-white pb-1">ZMS</span>!
              </h1>
              
              <div className="space-y-4 mb-8 lg:mb-10">
                <div className="flex items-start space-x-3 text-base sm:text-lg text-white font-semibold">
                  <span className="text-2xl flex-shrink-0" role="img" aria-label="check-mark">✅</span>
                  <span>Discover seamless solutions for sales and purchases.</span>
                </div>
                <div className="flex items-start space-x-3 text-base sm:text-lg text-white font-semibold">
                  <span className="text-2xl flex-shrink-0" role="img" aria-label="check-mark">✅</span>
                  <span>Unlock commission-based earnings for every deal.</span>
                </div>
                <div className="flex items-start space-x-3 text-base sm:text-lg text-white font-semibold">
                  <span className="text-2xl flex-shrink-0" role="img" aria-label="check-mark">✅</span>
                  <span>Scale your business with the trusted ZMS platform.</span>
                </div>
              </div>
              
              <div className="hidden lg:block">
                <Link
                  href="/"
                  className="inline-block px-8 py-4 bg-[#0899b2] text-white text-lg font-semibold rounded-2xl shadow-lg hover:bg-[#0a8ca3] hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
                >
                  Learn More
                </Link>
              </div>
            </div>
          </div>

          {/* Right Side - Sign In Form */}
          <div className="w-full max-w-md mx-auto lg:max-w-lg order-1 lg:order-2">
            <div className="bg-[#0899b2] backdrop-blur-sm p-6 sm:p-8 lg:p-10 rounded-2xl shadow-2xl border border-white/10">
              {/* Header */}
              <div className="text-center mb-8">
                <Link href="/">
                  <h2 className="text-3xl sm:text-4xl font-bold text-white">
                    Sign <span className="border-b-2 border-[#165863]">In</span>
                  </h2>
                </Link>
                <p className="text-white/80 mt-2 text-sm sm:text-base">Welcome back! Please sign in to your account</p>
              </div>

          {error && (
            <p className="text-red-500 mb-4 text-center font-medium">{error}</p>
          )}

          <form onSubmit={handleSignIn} className="space-y-6">
            <div className="flex items-center space-x-4">
              <div className="w-full">
                <label className="block text-[#d1d1d1] font-semibold mb-2">Username</label>
                <input
                  type="text"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-4 rounded-full bg-"
                />
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="w-full">
                <label className="block text-[#d1d1d1] font-semibold mb-2">Password</label>
                <input
                  type="password"
                  placeholder="6+ Characters, 1 Capital letter"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-4 rounded-full"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <input
                  type="checkbox"
                  id="remember-me"
                  className="text-[#606fe6] accent-[#606fe6]"
                />
                <label htmlFor="remember-me" className="text-white ml-2">
                  Remember me
                </label>
              </div>
              <Link
                href="/forgot-password"
                className="text-[#165863] text-sm hover:text-[#0e7a90] transition duration-300"
              >
                Forgot Password?
              </Link>
            </div>

            <div>
              <button
                type="submit"
                className="w-full p-4 rounded-lg bg-[#165863] text-white hover:bg-[#06c0d4] focus:outline-none transition duration-300 flex items-center justify-center"
              >
                <FiUser className="mr-2" size={20} />
                Sign In
              </button>
            </div>

             </form>

          <div className="text-center text-white mt-6">
            <p className="text-sm">
              Don’t have an account?{" "}
              <Link href="/signup" className="text-[#165863] hover:text-[#0e7a90] transition duration-300">
                Sign Up
              </Link>
            </p>
          </div>
        </div>
        </div>
      </div>
      </div>
    </div>
    );
  };

  export default SignIn;
