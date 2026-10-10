import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import apiClient from "../ApiClient/interceptor.js"

const Signup = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false)
    const [errorMessage, setErrorMessage] = useState("")
    const [formData, setFormData] = useState({
        username: "",
        email: "",
        password: "",
        phone: ""
    })
    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        })
    }
    const signup = async (formData) => {
        try {
            setLoading(true)
            setErrorMessage("")
            const response = await apiClient.post("/auth/register", formData)
            console.log(response)
            setFormData({
                username: "",
                email: "",
                password: "",
                phone: ""
            })
            navigate("/login")
        } catch (error) {
            setErrorMessage(
                error.response?.data?.message || "Something went wrong. Please try again."
            )
        } finally {
            setLoading(false)
        }
    }
    const handleSubmit = async (e) => {
        e.preventDefault();
        await signup(formData)
    }
    return (
        <div className="min-h-screen bg-[#b6b09576] py-5 flex items-center justify-center dark:text-white dark:bg-[#101010]">

            <form onSubmit={handleSubmit} className="w-full max-w-md rounded-xs bg-white p-8 shadow-lg dark:bg-[#1B1B1B] dark:border-[#373737]">

                {/* Heading */}
                <div className="mb-8 text-center">
                    <h1 className="text-3xl text-black dark:text-[#F1F0ED]">
                        OWNER REGISTRATION
                    </h1>

                    <p className="mt-2 text-sm text-[#9b9164] dark:text-[#A6A39E]">
                        Set up your owner account.
                    </p>
                </div>

                {/* Form fields */}
                <div className="space-y-5">

                    {/* Username */}
                    <div>
                        <label
                            htmlFor="username"
                            className="mb-2 block text-sm font-normal text-black dark:text-[#F1F0ED]"
                        >
                            Username
                        </label>

                        <input
                            id="username"
                            type="text"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            required
                            placeholder="Enter your Username"
                            className="w-full rounded-lg border bg-[#b6b09576] border-[#b6b09576] px-4 py-3 text-slate-900 outline-none transition placeholder:text-gray-600 focus:border-black focus:ring-2 focus:ring-slate-900/20 dark:bg-[#111111] dark:border-[#373737] dark:text-[#F1F0ED] dark:placeholder:text-[#85827D]"
                        />
                    </div>

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
                            value={formData.email}
                            onChange={handleChange}
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
                            value={formData.password}
                            onChange={handleChange}
                            required
                            placeholder="Enter your password"
                            className="w-full rounded-lg border bg-[#b6b09576] border-[#b6b09576] px-4 py-3 text-slate-900 outline-none transition placeholder:text-gray-600 focus:border-black focus:ring-2 focus:ring-slate-900/20 dark:bg-[#111111] dark:border-[#373737] dark:text-[#F1F0ED] dark:placeholder:text-[#85827D]"
                        />
                    </div>

                    {/* Phone */}
                    <div>
                        <label
                            htmlFor="phone"
                            className="mb-2 block text-sm font-normal text-black dark:text-[#F1F0ED]"
                        >
                            Phone
                        </label>

                        <input
                            id="phone"
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            required
                            placeholder="Enter your phone number"
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
                        {loading ? "Creating account...." : "Create owner account"}
                    </button>

                </div>

                {/* Login link */}
                <p className="mt-6 text-center text-sm text-black dark:text-[#F1F0ED]">
                    Already have an account? <Link to="/login">Login</Link>
                </p>

            </form>
        </div>
    )
}

export default Signup
