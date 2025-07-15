import { useEffect, useState } from "react";

type Rutina = {
  id: number;
  nombre: string;
  tipo: string;
  ejercicios: string[]; // Los ejercicios pueden incluir URLs
  dias: string[];
};

type Progreso = {
  rutinaId: number;
  completado: boolean;
};

type Alumno = {
  id: number;
  nombre: string;
  email: string;
  rutinas?: Rutina[];
  progreso?: Progreso[];
};

const DIAS_SEMANA = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

export default function InstructorDashboard() {
  const usuario = JSON.parse(localStorage.getItem("usuario")!);
  const [alumnos, setAlumnos] = useState<Alumno[]>([]);
  const [alumnoId, setAlumnoId] = useState("");
  const [nombreRutina, setNombreRutina] = useState("");
  const [tipo, setTipo] = useState("Funcional");
  const [ejercicios, setEjercicios] = useState("");
  const [diasSeleccionados, setDiasSeleccionados] = useState<string[]>([]);

  const camposCompletos =
    alumnoId && nombreRutina && ejercicios && diasSeleccionados.length > 0;

  useEffect(() => {
    const cargarDatos = async () => {
      const alumnosRes = await fetch("http://localhost:4000/usuarios?rol=alumno");
      const alumnosData = await alumnosRes.json();

      const alumnosCompletos = await Promise.all(
        alumnosData.map(async (alumno: Alumno) => {
          const rutinasRes = await fetch(`http://localhost:4000/rutinas/${alumno.id}`);
          const progresoRes = await fetch(`http://localhost:4000/progreso/${alumno.id}`);
          const rutinas = await rutinasRes.json();
          const progreso = await progresoRes.json();
          return { ...alumno, rutinas, progreso };
        })
      );

      setAlumnos(alumnosCompletos);
    };

    cargarDatos();
  }, []);

  const toggleDia = (dia: string) => {
    setDiasSeleccionados((prev) =>
      prev.includes(dia) ? prev.filter((d) => d !== dia) : [...prev, dia]
    );
  };

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
        dias: diasSeleccionados,
      }),
    });

    setNombreRutina("");
    setEjercicios("");
    setDiasSeleccionados([]);
    alert("✅ Rutina asignada con éxito");
    window.location.reload();
  };

  const eliminarRutina = async (rutinaId: number) => {
    await fetch(`http://localhost:4000/rutinas/${rutinaId}`, {
      method: "DELETE",
    });
    alert("❌ Rutina eliminada");
    window.location.reload();
  };

  const obtenerEmbedYoutube = (url: string): string | null => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
    return match ? `https://www.youtube.com/embed/${match[1]}` : null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-tr from-gray-100 to-blue-100 p-6 flex justify-center">
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-2xl p-8 space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-800">
            👨‍🏫 Instructor: <span className="text-blue-600">{usuario.nombre}</span>
          </h2>
          <p className="text-gray-500 mt-1">Asignar rutina a alumno</p>
        </div>

        {/* Formulario */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <select
            value={alumnoId}
            onChange={(e) => setAlumnoId(e.target.value)}
            className="p-3 border rounded-xl shadow-sm"
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
            className="p-3 border rounded-xl shadow-sm"
          />

          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
            className="p-3 border rounded-xl shadow-sm"
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
            className="p-3 border rounded-xl shadow-sm h-28 col-span-1 md:col-span-2 resize-none"
          />

          <div className="col-span-1 md:col-span-2 space-x-2">
            <label className="font-semibold">Días:</label>
            {DIAS_SEMANA.map((dia) => (
              <button
                key={dia}
                onClick={() => toggleDia(dia)}
                className={`px-3 py-1 rounded-lg border ${
                  diasSeleccionados.includes(dia)
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-700"
                }`}
              >
                {dia}
              </button>
            ))}
          </div>

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

        {/* Rutinas */}
        <div>
          <h3 className="text-xl font-semibold text-gray-700 mt-6 mb-4">
            📋 Alumnos y sus rutinas
          </h3>

          {alumnos.map((alumno) => {
            const completadas = alumno.progreso?.filter((p) => p.completado).length || 0;
            const total = alumno.rutinas?.length || 0;

            return (
              <div key={alumno.id} className="mb-6 bg-gray-50 p-4 rounded-lg shadow-sm">
                <h4 className="text-md font-bold text-blue-700">
                  {alumno.nombre} ({alumno.email})
                </h4>

                {total > 0 && (
                  <p className="text-green-700 text-sm font-medium mt-1">
                    ✅ Progreso: {completadas} de {total} completadas (
                    {Math.round((completadas / total) * 100)}%)
                  </p>
                )}

                {alumno.rutinas && alumno.rutinas.length > 0 ? (
                  <ul className="mt-2 list-disc list-inside space-y-2 text-sm text-gray-700">
                    {alumno.rutinas.map((r) => {
                      const completado = alumno.progreso?.some(
                        (p) => p.rutinaId === r.id && p.completado
                      );
                      return (
                        <li key={r.id} className="ml-4">
                          <strong>{r.nombre}</strong> ({r.tipo}){" "}
                          <span className="text-xs text-purple-700">
                            [{r.dias.join(", ")}]
                          </span>
                          {completado && (
                            <span className="ml-2 text-green-600 font-semibold text-xs">
                              ✅ Completado
                            </span>
                          )}
                          <div className="mt-2 ml-2 space-y-2">
                            {r.ejercicios.map((e, i) => {
                              const embed = obtenerEmbedYoutube(e);
                              return embed ? (
                                <a
                                  key={i}
                                  href={e}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="block"
                                >
                                  <iframe
                                    src={embed}
                                    className="w-full max-w-sm h-48 rounded-xl shadow border"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                  />
                                </a>
                              ) : (
                                <p key={i} className="text-gray-600">
                                  {e}
                                </p>
                              );
                            })}
                          </div>
                          <button
                            className="mt-2 text-red-600 hover:underline text-xs"
                            onClick={() => eliminarRutina(r.id)}
                          >
                            Eliminar
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="text-gray-500 text-sm mt-1">Sin rutinas asignadas</p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
