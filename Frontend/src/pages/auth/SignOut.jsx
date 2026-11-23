import { useEffect } from 'react'
import { useAuth } from "../../context/AuthContext.jsx"
import { useNavigate } from 'react-router-dom';
import apiClient from '../../ApiClient/interceptor.js';

const SignOut = () => {
    const { setUser } = useAuth();
    const navigate = useNavigate();
    const signout = async () => {
        try {
            await apiClient.post("/auth/logout")
            setUser(null)
            navigate("/")
        } catch (error) {
            console.error("Logout failed:", error);
        }
    }
    useEffect(() => {
        signout()
    }, [])
    return (
        <div className="flex min-h-screen items-center justify-center">
                <p className="font-medium">Signing out...</p>
            </div>
    )
}

export default SignOut