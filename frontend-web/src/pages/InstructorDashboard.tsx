import { useEffect, useState } from "react";

export default function InstructorDashboard() {
  const usuario = JSON.parse(localStorage.getItem("usuario")!);
  const [alumnos, setAlumnos] = useState<any[]>([]);
  const [alumnoId, setAlumnoId] = useState("");
  const [nombreRutina, setNombreRutina] = useState("");
  const [tipo, setTipo] = useState("Funcional");
  const [ejercicios, setEjercicios] = useState("");

  useEffect(() => {
    fetch("http://localhost:4000/usuarios?rol=alumno")
      .then((res) => res.json())
      .then(setAlumnos);
  }, []);

  const camposCompletos = alumnoId && nombreRutina && ejercicios;

  const asignarRutina = async () => {
    if (!camposCompletos) return;

    await fetch("http://localhost:4000/rutinas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nombre: nombreRutina,
        tipo,
        ejercicios: ejercicios.split(",").map((e) => e.trim()),
        usuarioId: parseInt(alumnoId),
      }),
    });

    setNombreRutina("");
    setEjercicios("");
    alert("✅ Rutina asignada con éxito");
  };

  return (
    <div className="min-h-screen bg-gradient-to-tr from-gray-100 to-blue-100 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-3xl w-full space-y-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-800">👨‍🏫 Instructor: <span className="text-blue-600">{usuario.nombre}</span></h2>
          <p className="text-gray-500 mt-2">Asignar rutina a alumno</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <select
            value={alumnoId}
            onChange={(e) => setAlumnoId(e.target.value)}
            className="p-3 border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="">Selecciona un alumno</option>
            {alumnos.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nombre} ({a.email})
              </option>
            ))}
          </select>

          <input
            type="text"
            placeholder="Nombre de la rutina"
            value={nombreRutina}
            onChange={(e) => setNombreRutina(e.target.value)}
            className="p-3 border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />

          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
            className="p-3 border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="Funcional">Funcional</option>
            <option value="Fuerza">Fuerza</option>
            <option value="Cardio">Cardio</option>
            <option value="Hipertrofia">Hipertrofia</option>
            <option value="Carrera">Carrera</option>
          </select>

          <textarea
            placeholder="Ejercicios separados por coma"
            value={ejercicios}
            onChange={(e) => setEjercicios(e.target.value)}
            className="p-3 border rounded-xl shadow-sm col-span-1 md:col-span-2 resize-none h-28 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />

          <button
            onClick={asignarRutina}
            disabled={!camposCompletos}
            className={`w-full md:col-span-2 py-3 rounded-xl font-bold text-white transition 
              ${!camposCompletos
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-black hover:bg-gray-800 cursor-pointer"}`}
          >
            Asignar rutina
          </button>
        </div>
      </div>
    </div>
  );
}
