import { useEffect, useState } from "react";

type Rutina = {
  id: number;
  nombre: string;
  tipo: string;
  ejercicios: string[];
};

export default function AlumnoDashboard() {
  const usuario = JSON.parse(localStorage.getItem("usuario")!);
  const [rutinas, setRutinas] = useState<Rutina[]>([]);

  useEffect(() => {
    fetch(`http://localhost:4000/rutinas/${usuario.id}`)
      .then((res) => res.json())
      .then((data) =>
        setRutinas(
          data.map((r: any) => ({
            ...r,
            ejercicios: Array.isArray(r.ejercicios)
              ? r.ejercicios
              : r.ejercicios.split(",").map((e: string) => e.trim()),
          }))
        )
      )
      .catch((err) => {
        console.error("Error al obtener rutinas:", err);
      });
  }, [usuario.id]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-100 px-6 py-10 flex flex-col items-center font-sans">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        Bienvenido, {usuario.nombre}
      </h2>

      <section className="w-full max-w-3xl bg-white rounded-xl shadow-md p-6">
        <h3 className="text-xl font-semibold text-gray-700 mb-4">
          🏋️‍♀️ Tus Rutinas Asignadas
        </h3>

        {rutinas.length === 0 ? (
          <p className="text-gray-500">Aún no tienes rutinas asignadas.</p>
        ) : (
          rutinas.map((r) => (
            <div
              key={r.id}
              className="border rounded-lg mb-4 p-4 shadow-sm bg-gray-50"
            >
              <h4 className="text-lg font-semibold text-orange-600">
                {r.nombre} ({r.tipo})
              </h4>
              <ul className="list-disc list-inside mt-2 space-y-1 text-sm text-gray-700">
                {r.ejercicios.map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
            </div>
          ))
        )}
      </section>
    </div>
  );
}
