import React, { useState, useEffect } from "react";
import { IoMdMoon } from "react-icons/io";
import { BsSun } from "react-icons/bs";

const DarkMode = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Apply dark mode by adding/removing class to the body
  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.body.style.backgroundColor = !isDarkMode ? "Black" : "#ffffff";
    document.body.classList.toggle("dark", !isDarkMode);
  };

  useEffect(() => {
    // Initialize dark mode based on user's system preference or previous selection
    const savedDarkMode = localStorage.getItem("darkMode") === "true";
    setIsDarkMode(savedDarkMode);
    document.body.style.backgroundColor = savedDarkMode ? "Black" : "#ffffff";
    document.body.classList.toggle("dark", savedDarkMode);
  }, []);

  useEffect(() => {
    // Save the current dark mode setting to localStorage
    localStorage.setItem("darkMode", isDarkMode.toString());
  }, [isDarkMode]);

  return (
    <button
      onClick={toggleDarkMode}
      className="flex items-center justify-center p-2 rounded-full transition-all duration-300 bg-gray-200 dark:bg-gray-700 shadow hover:shadow-lg"
    >
      {isDarkMode ? (
        <BsSun className="text-yellow-500 text-xl" />
      ) : (
        <IoMdMoon className="text-blue-900 text-xl" />
      )}
    </button>
  );
};

export default DarkMode;
