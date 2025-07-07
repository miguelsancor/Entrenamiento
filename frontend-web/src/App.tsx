import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import AlumnoDashboard from "./pages/AlumnoDashboard";
import InstructorDashboard from "./pages/InstructorDashboard";
import { ProtectedRoute } from "./components/ProtectedRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />

        <Route
          path="/alumno-dashboard"
          element={
            <ProtectedRoute>
              <AlumnoDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/instructor-dashboard"
          element={
            <ProtectedRoute>
              <InstructorDashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
