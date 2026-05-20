import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function PrivateRoute({ children }) {
    const { usuario } = useAuth();

    if (!usuario) {
        return <Navigate to="/login" />;
    }

    return children;
}