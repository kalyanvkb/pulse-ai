import {
  BrowserRouter,
  Routes,
  Route
} from "react-router-dom";

import Dashboard from "./pages/Dashboard";
import DailyIntelligence from "./pages/DailyIntelligence";
import WeeklyIntelligence from "./pages/WeeklyIntelligence";

function App() {

  return (
    <BrowserRouter>

      <Routes>

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

      </Routes>

    </BrowserRouter>
  );
}

export default App;