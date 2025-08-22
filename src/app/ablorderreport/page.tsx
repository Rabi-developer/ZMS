"use client";
import React from "react";
import MainLayout from "@/components/MainLayout/MainLayout";
import BookingOrderReportExport from "@/components/ablsoftware/Maintance/common/BookingOrderReportExport";

const BookingOrderReportPage = () => {
  return (
    <MainLayout activeInterface="ABL">
      <div className="container mx-auto p-4">
        <div className="mb-4">
          <h1 className="text-2xl font-semibold text-gray-800">Booking Order Report</h1>
          <p className="text-sm text-gray-500">Download PDF/Excel with date range, month and column selection.</p>
        </div>
        <BookingOrderReportExport />
      </div>
    </MainLayout>
  );
};

export default BookingOrderReportPage;
