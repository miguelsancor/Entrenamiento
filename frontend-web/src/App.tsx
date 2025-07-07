import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import AlumnoDashboard from "./pages/AlumnoDashboard";
import InstructorDashboard from "./pages/InstructorDashboard";

function App() {
  const usuario = localStorage.getItem("usuario");

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route
          path="/alumno-dashboard"
          element={usuario ? <AlumnoDashboard /> : <Navigate to="/" />}
        />
        <Route
          path="/instructor-dashboard"
          element={usuario ? <InstructorDashboard /> : <Navigate to="/" />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
