import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import apiClient from "../ApiClient/interceptor";
import { useAuth } from "../context/AuthContext";

export const Login = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [loading, setLoading] = useState(false)
    const [errorMessage, setErrorMessage] = useState("")
    const [loginData, setLoginData] = useState({
        email: "",
        password: ""
    })
    const handleChange = (e) => {
        setLoginData({
            ...loginData,
            [e.target.name]: e.target.value
        })
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setErrorMessage("")
            setLoading(true)
            const user = await login(loginData)
            setLoginData({
                email: "",
                password: ""
            })
            const role = user.role;
            if (role === "owner") {
                navigate("/owner/dashboard");
            } else if (role === "tenant") {
                navigate("/tenant/dashboard");
            } else {
                setErrorMessage("Invalid user role.");
            }
        } catch (err) {
            setErrorMessage(
                err?.response?.data?.message ||
                err.message ||
                "Failed to sign in. Check your credentials."
            );
        } finally {
            setLoading(false);
        }
    }
    return (
        <div className="min-h-screen bg-[#b6b09576] py-5 flex items-center justify-center dark:text-white dark:bg-[#101010]">

            <form onSubmit={handleSubmit} className="w-full max-w-md rounded-xs bg-white p-8 shadow-lg dark:bg-[#1B1B1B] dark:border-[#373737]">

                {/* Heading */}
                <div className="mb-8 text-center">
                    <h1 className="text-3xl text-black dark:text-[#F1F0ED]">
                        Welcome Back !
                    </h1>

                    <p className="mt-2 text-sm text-[#9b9164] dark:text-[#A6A39E]">
                        Login to your owner/tenant account.
                    </p>
                </div>

                {/* Form fields */}
                <div className="space-y-5">

                    {/* Email */}
                    <div>
                        <label
                            htmlFor="email"
                            className="mb-2 block text-sm font-normal text-black dark:text-[#F1F0ED]"
                        >
                            Email address
                        </label>

                        <input
                            id="email"
                            type="email"
                            name="email"
                            onChange={handleChange}
                            value={loginData.email}
                            required
                            placeholder="Enter your email"
                            className="w-full rounded-lg border bg-[#b6b09576] border-[#b6b09576] px-4 py-3 text-slate-900 outline-none transition placeholder:text-gray-600 focus:border-black focus:ring-2 focus:ring-slate-900/20 dark:bg-[#111111] dark:border-[#373737] dark:text-[#F1F0ED] dark:placeholder:text-[#85827D]"
                        />
                    </div>

                    {/* Password */}
                    <div>
                        <label
                            htmlFor="password"
                            className="mb-2 block text-sm font-normal text-black dark:text-[#F1F0ED]"
                        >
                            Password
                        </label>

                        <input
                            id="password"
                            type="password"
                            name="password"
                            onChange={handleChange}
                            value={loginData.password}
                            required
                            placeholder="Enter your password"
                            className="w-full rounded-lg border bg-[#b6b09576] border-[#b6b09576] px-4 py-3 text-slate-900 outline-none transition placeholder:text-gray-600 focus:border-black focus:ring-2 focus:ring-slate-900/20 dark:bg-[#111111] dark:border-[#373737] dark:text-[#F1F0ED] dark:placeholder:text-[#85827D]"
                        />
                    </div>

                    {errorMessage && (
                        <p className="text-sm text-red-600 dark:text-[#FF8F86]">
                            {errorMessage}
                        </p>
                    )}

                    {/* Submit */}
                    <button
                        type="submit"
                        className="w-full rounded-lg bg-yellow-300 px-4 py-3 font-semibold text-black transition hover:bg-yellow-200 focus:outline-none focus:ring-2  focus:ring-offset-2 dark:bg-[#F7C744]"
                        disabled={loading}
                    >
                        {loading ? "Logging in..." : "Login"}
                    </button>

                </div>

                {/* Login link */}
                <p className="mt-6 text-center text-sm text-black dark:text-[#F1F0ED]">
                    Doesn't have an account? <Link to="/signup">Signup</Link>
                </p>

            </form>
        </div>
    );
};