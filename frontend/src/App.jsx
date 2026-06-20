import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AuthLayout from "./layouts/AuthLayout"; // Adjust path if you saved it elsewhere

import Dashboard from "./pages/Dashboard";
import DailyIntelligence from "./pages/DailyIntelligence";
import WeeklyIntelligence from "./pages/WeeklyIntelligence";
import SharePage from "./pages/SharePage";
//import SharedInsight from "./pages/SharedInsight";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* The AuthLayout acts as a global gateway wrapper for all routes */}
        <Route element={<AuthLayout />}>
          <Route
            path="/"
            element={<Dashboard />}
          />

          <Route
            path="/daily-intelligence"
            element={<DailyIntelligence />}
          />

          <Route
            path="/weekly-intelligence"
            element={<WeeklyIntelligence />}
          />

          <Route path="/share/:shareSlug" element={<SharePage />} />

          
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;