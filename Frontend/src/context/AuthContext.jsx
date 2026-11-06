import { createContext, useContext, useEffect, useState } from "react";
import apiClient from "../ApiClient/interceptor";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Request OTP
    const requestOtp = async (contact) => {
        console.log("Requesting OTP for:", contact);
        const response = await apiClient.post("/auth/request-otp", {
            contact,
        });

        return response.data;
    };

    // Verify OTP and login
    const verifyOtp = async (contact, otp) => {
        const response = await apiClient.post("/auth/verify-otp", {
            contact,
            otp,
        });

        const loggedInUser = response.data.data;
        setUser(loggedInUser);

        return loggedInUser;
    };

    // Get currently logged-in user
    const getUser = async () => {
        try {
            const response = await apiClient.get("/auth/me");
            setUser(response.data.data);
        } catch (error) {
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    // Logout
    const logout = async () => {
        try {
            await apiClient.post("/auth/logout");
            setUser(null);
        } catch (error) {
            throw error;
        }
    };

    useEffect(() => {
        getUser();
    }, []);

    const isAuthenticated = !!user;

    const value = {
        user,
        setUser,
        requestOtp,
        verifyOtp,
        logout,
        loading,
        isAuthenticated,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);