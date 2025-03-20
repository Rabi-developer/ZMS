  "use client";
  import React, { useState } from "react";
  import Link from "next/link";
  import { login } from "../apis/auth";
  import { FiMail, FiLock, FiUser } from "react-icons/fi";

  const SignIn: React.FC = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);

    const handleSignIn = async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);

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
      }
    };

    return (
      <div className="min-h-screen  bg-gradient-to-t from-[#22c1c3] via-[#3ab4c1] to-[#2d8efd] w-full
    flex items-center justify-center">
      <div className="grid grid-cols-2 gap-1 w-full ">

      
       <div className=" w-full px-6 py-8 ml-2 mt-20">
     <h1 className="text-4xl font-extrabold text-white mb-4 ml-10">
      Welcome In  <span className="border-b-2 "> ZMS</span>!
     </h1>
   
    <div className="space-y-3 mb-6">
      <div className="text-lg text-white font-semibold">
        <span role="img" aria-label="check-mark">✅</span> Discover seamless solutions for sales and purchases.
      </div>
      <div className="text-lg text-white font-semibold">
        <span role="img" aria-label="check-mark">✅</span> Unlock commission-based earnings for every deal.
      </div>
      <div className="text-lg text-white font-semibold">
        <span role="img" aria-label="check-mark">✅</span> Scale your business with the trusted ZMS platform.
      </div>
    </div>
    <div className="">
  <Link
    href="/"
    className="inline-block px-10 py-5 bg-[#0899b2] text-white  text-xl rounded-2xl shadow-lg hover:bg-[#0899b2] hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
  >
    Get Started
  </Link>
</div>

       </div>

        <div className="max-w-lg w-full bg-[#0899b2] ml-20 p-10  rounded-xl shadow-2xl shadow-t-2xl">
          <div className="text-center mb-8">
            <Link href="/">
              <h2 className="text-4xl font-bold text-white  ">
              Sign <span className="border-b-2 border-[#165863]">in</span>
              </h2>
            </Link>
            
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
    );
  };

  export default SignIn;
