export type Usuario = {
    id: number;
    nombre: string;
    email: string;
    nivel: string;
    rol: "alumno" | "instructor";
    suscripcion: boolean;
  };
  