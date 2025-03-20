"use client";
import React, { useState } from "react";
import Link from "next/link";
import { FiMail, FiUser, FiLock, FiShield } from "react-icons/fi";
import { signup } from "../apis/auth";

const SignUp: React.FC = () => {
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    const userData = {
      firstName,
      middleName,
      lastName,
      email,
      userName,
      password,
    };

    try {
      const response = await signup(userData);
      if (response) {
        setSuccess("Account created successfully! You can now log in.");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-[#165263] flex items-center justify-center w-[100%]">
      <div className="w-[90%] m-11 bg-[#f1f5f9] p-8 rounded-2xl shadow-xl">
        <div className="text-center mb-8">
          <Link href="/">
            <h2 className="text-4xl font-bold text-[#0899b2] hover:text-[#06c0d4] transition duration-300">
             ZMS
            </h2>
          </Link>
          
        </div>

        {error && (
          <p className="text-red-500 mb-4 text-center font-medium">{error}</p>
        )}
        {success && (
          <p className="text-green-500 mb-4 text-center font-medium">{success}</p>
        )}

        <form onSubmit={handleSignUp} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-center space-x-4">
            <FiUser className="text-[#06c0d4]" size={24} />
            <div className="w-full">
              <label className="block text-[#808080] font-semibold mb-2">First Name</label>
              <input
                type="text"
                placeholder="Enter your first name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full p-4 rounded-lg bg-white border border-[#606fe6] text-black placeholder-[#06c0d4] focus:ring-2 focus:ring-[#606fe6] outline-none"
              />
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <FiUser className="text-[#06c0d4]" size={24} />
            <div className="w-full">
              <label className="block text-[#808080] font-semibold mb-2">Middle Name</label>
              <input
                type="text"
                placeholder="Enter your middle name"
                value={middleName}
                onChange={(e) => setMiddleName(e.target.value)}
                className="w-full p-4 rounded-lg bg-white border border-[#06c0d4] text-black placeholder-[#06c0d4] focus:ring-2 focus:ring-[#06c0d4] outline-none"
              />
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <FiUser className="text-[#06c0d4]" size={24} />
            <div className="w-full">
              <label className="block text-[#808080] font-semibold mb-2">Last Name</label>
              <input
                type="text"
                placeholder="Enter your last name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full p-4 rounded-lg bg-white border border-[#06c0d4] text-black placeholder-[#06c0d4] focus:ring-2 focus:ring-[#06c0d4] outline-none"
              />
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <FiMail className="text-[#06c0d4]" size={24} />
            <div className="w-full">
              <label className="block text-[#808080] font-semibold mb-2">Email</label>
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-4 rounded-lg bg-white border border-[#06c0d4] text-black placeholder-[#06c0d4] focus:ring-2 focus:ring-[#06c0d4] outline-none"
              />
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <FiUser className="text-[#06c0d4]" size={24} />
            <div className="w-full">
              <label className="block text-[#808080] font-semibold mb-2">Username</label>
              <input
                type="text"
                placeholder="Enter your username"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="w-full p-4 rounded-lg bg-white border border-[#06c0d4] text-black placeholder-[#06c0d4] focus:ring-2 focus:ring-[#06c0d4] outline-none"
              />
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <FiLock className="text-[#06c0d4]" size={24} />
            <div className="w-full">
              <label className="block text-[#808080] font-semibold mb-2">Password</label>
              <input
                type="password"
                placeholder="6+ Characters, 1 Capital letter"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-4 rounded-lg bg-white border border-[#06c0d4] text-black placeholder-[#06c0d4] focus:ring-2 focus:ring-[#06c0d4] outline-none"
              />
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <FiShield className="text-[#06c0d4]" size={24} />
            <div className="w-full">
              <label className="block text-[#808080] font-semibold mb-2">Confirm Password</label>
              <input
                type="password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full p-4 rounded-lg bg-white border border-[#06c0d4] text-black placeholder-[#06c0d4] focus:ring-2 focus:ring-[#06c0d4] outline-none"
              />
            </div>
          </div>

          <div className="col-span-2">
            <button
              type="submit"
              className="w-full p-4 rounded-lg bg-[#06c0d4] text-white hover:bg-[#0899b2] focus:outline-none transition duration-300"
            >
              Sign Up
            </button>
          </div>
        </form>

        <div className="text-center text-black mt-6">
          <p className="text-sm">
            Already have an account?{" "}
            <Link href="/signin" className="text-[#06c0d4] hover:text-[#0899b2] transition duration-300">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
