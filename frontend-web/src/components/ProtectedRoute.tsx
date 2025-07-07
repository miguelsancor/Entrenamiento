import { Navigate } from "react-router-dom";

interface Props {
  children: JSX.Element;
}

export function ProtectedRoute({ children }: Props) {
  const usuario = localStorage.getItem("usuario");

  if (!usuario) {
    return <Navigate to="/" replace />;
  }

  return children;
}
