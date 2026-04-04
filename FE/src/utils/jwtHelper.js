import { jwtDecode } from "jwt-decode";

export const getRoleFromToken = (token) => {
    if (!token) return "USER";
    
    try {
        const decoded = jwtDecode(token);
        return decoded?.role || decoded?.roles || "USER";
    } catch (error) {
        return "USER";
    }
};