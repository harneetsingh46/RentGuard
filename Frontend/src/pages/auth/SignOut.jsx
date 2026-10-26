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
        <div>Signing out...</div>
    )
}

export default SignOut