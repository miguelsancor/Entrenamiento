import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Usuario } from "../types/Usuario";

export default function Login() {
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [nivel, setNivel] = useState("Básico");
  const [rol, setRol] = useState("alumno");

  const navigate = useNavigate();

  const registrar = async () => {
    try {
      const res = await fetch("http://34.75.5.236:4000/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, email, nivel, rol }),
      });

      const data: Usuario = await res.json();
      localStorage.setItem("usuario", JSON.stringify(data));

      if (rol === "alumno") navigate("/alumno-dashboard");
      else navigate("/instructor-dashboard");
    } catch (err) {
      console.error("Error al registrar:", err);
    }
  };

  const ingresar = async () => {
    try {
      const res = await fetch("http://34.75.5.236:4000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, rol }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        alert(errorData.error || "Error al iniciar sesión");
        return;
      }

      const data: Usuario = await res.json();
      localStorage.setItem("usuario", JSON.stringify(data));

      if (data.rol === "alumno") navigate("/alumno-dashboard");
      else navigate("/instructor-dashboard");
    } catch (err) {
      console.error("Error al iniciar sesión:", err);
      alert("No se pudo conectar con el servidor");
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>🏋️ Bienvenido al sistema</h2>

        <div style={styles.inputGroup}>
          <input
            type="text"
            placeholder="Nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            style={styles.input}
          />
          <input
            type="email"
            placeholder="Correo"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={styles.input}
          />
          <select
            value={nivel}
            onChange={(e) => setNivel(e.target.value)}
            style={styles.select}
          >
            <option value="Básico">Básico</option>
            <option value="Intermedio">Intermedio</option>
            <option value="Avanzado">Avanzado</option>
          </select>
          <select
            value={rol}
            onChange={(e) => setRol(e.target.value)}
            style={styles.select}
          >
            <option value="alumno">Alumno</option>
            <option value="instructor">Instructor</option>
          </select>
        </div>

        <div style={styles.buttonGroup}>
          <button style={{ ...styles.button, backgroundColor: "#2563eb" }} onClick={registrar}>
            Registrarse
          </button>
          <button style={styles.button} onClick={ingresar}>
            Ingresar
          </button>
        </div>
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    height: "100vh",
    width: "100vw",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "linear-gradient(135deg, #0f172a, #1e293b)", // Fondo oscuro azulado
  },
  card: {
    backgroundColor: "#1f2937", // Gris oscuro
    padding: "2.5rem",
    borderRadius: "1rem",
    boxShadow: "0 0 20px rgba(0,0,0,0.4)",
    width: "100%",
    maxWidth: "400px",
    color: "#fff",
  },
  title: {
    marginBottom: "1.8rem",
    fontSize: "1.7rem",
    fontWeight: "bold",
    textAlign: "center",
  },
  inputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
    marginBottom: "1.5rem",
  },
  input: {
    width: "100%",
    padding: "0.75rem",
    border: "1px solid #4b5563",
    borderRadius: "0.5rem",
    backgroundColor: "#111827",
    color: "#f9fafb",
    fontSize: "1rem",
  },
  select: {
    padding: "0.75rem",
    borderRadius: "0.5rem",
    border: "1px solid #4b5563",
    backgroundColor: "#111827",
    color: "#f9fafb",
    fontSize: "1rem",
  },
  buttonGroup: {
    display: "flex",
    justifyContent: "space-between",
    marginTop: "1rem",
  },
  button: {
    flex: 1,
    padding: "0.75rem",
    margin: "0 0.25rem",
    border: "none",
    borderRadius: "0.5rem",
    backgroundColor: "#10b981", // Verde Tailwind
    color: "#fff",
    fontWeight: "bold",
    cursor: "pointer",
    fontSize: "1rem",
  },
};
