import { createContext, useContext, useEffect, useState } from "react";
import apiClient from "../ApiClient/interceptor";

const AuthContext = createContext()

export const AuthProvider = ({children}) =>{
    const [user,setUser] = useState(null)
    const [loading,setLoading] = useState(true)

    const login = async (loginData)=>{
        try {
            setLoading(true)
            const response = await apiClient.post("/auth/login",loginData)
            setUser(response.data.data)
            return response.data.data
        } catch (error) {
            throw error;
        }finally{
            setLoading(false)
        }
    }
    const getUser = async () =>{
        try {
            const response = await apiClient.get("/auth/me")
            setUser(response.data.data)
        } catch (error) {
            throw error;
        } finally {
            setLoading(false)
        }
    }
    useEffect(()=>{
        getUser()
    },[])

    const isAuthenticated = !!user

    const value = {
        user,
        setUser,
        login,
        loading,
        isAuthenticated
    }
    return(
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    return context;
}