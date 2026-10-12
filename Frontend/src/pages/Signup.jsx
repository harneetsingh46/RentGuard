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
        <div className=" bg-[#f3f3f3] py-10 flex items-center justify-center bg-[url(/signup.jpg)] bg-cover bg-top   dark:text-white dark:bg-[#101010]">

            <form onSubmit={handleSubmit} className="w-full shadow-2xl max-w-md rounded-2xs bg-white p-8 shadow-lg dark:bg-[#1B1B1B] dark:border-[#373737] ">

                {/* Heading */}
                <div className="mb-8 text-center">
                    <h1 className="text-3xl text-black dark:text-[#F1F0ED]">
                        OWNER REGISTRATION
                    </h1>

                    <p className="mt-2 text-sm text-yellow-500 dark:text-yellow-300">
                        Set up your owner account.
                    </p>
                </div>

                {/* Form fields */}
                <div className="space-y-5 grid grid-cols-2">

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
                            className="w-full  rounded border bg-white border-[#5a574c76] px-4 py-3 text-slate-900 outline-none transition placeholder:text-gray-600 focus:border-black focus:ring-2 focus:ring-slate-900/20 dark:bg-[#111111] dark:border-[#373737] dark:text-[#F1F0ED] dark:placeholder:text-[#85827D] "
                        />
                    </div>

                    {/* Email */}
                    <div>
                        <label
                            htmlFor="email"
                            className="mb-2 mx-2 block text-sm font-normal text-black dark:text-[#F1F0ED]"
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
                            className="w-full mx-2 rounded border  bg-white border-[#5a574c76] px-4 py-3 text-slate-900 outline-none transition placeholder:text-gray-600 p-1 focus:border-black focus:ring-2 focus:ring-slate-900/20 dark:bg-[#111111] dark:border-[#373737] dark:text-[#F1F0ED] dark:placeholder:text-[#85827D] "
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
                            className="w-full  rounded border bg-white border-[#5a574c76] px-4 py-3 text-slate-900 outline-none transition placeholder:text-gray-600 focus:border-black focus:ring-2 focus:ring-slate-900/20 dark:bg-[#111111] dark:border-[#373737] dark:text-[#F1F0ED] dark:placeholder:text-[#85827D] "
                        />
                    </div>

                    {/* Phone */}
                    <div>
                        <label
                            htmlFor="phone"
                            className="mb-2 mx-2 block text-sm font-normal text-black dark:text-[#F1F0ED]"
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
                            placeholder="Enter phone number"
                            className="w-full mx-2 rounded border bg-white border-[#5a574c76] px-4 py-3 text-slate-900 outline-none transition placeholder:text-gray-600 focus:border-black focus:ring-2 focus:ring-slate-900/20 dark:bg-[#111111] dark:border-[#373737] dark:text-[#F1F0ED] dark:placeholder:text-[#85827D] "
                        />
                    </div>
                    
                    {errorMessage && (
                        <p className="text-sm text-red-600 dark:text-[#FF8F86]">
                            {errorMessage}
                        </p>
                    )}
                </div>
                {/* Submit */}
                    <button
                        type="submit"
                        className="w-full rounded-lg bg-yellow-300 px-4 py-3 font-semibold text-black transition hover:bg-yellow-200 focus:outline-none focus:ring-2  focus:ring-offset-2 dark:bg-[#F7C744]"
                        disabled={loading}
                    >
                        {loading ? "Creating account...." : "Create owner account"}
                    </button>

                {/* Login link */}
                <p className="mt-6 text-center text-sm text-black dark:text-[#F1F0ED]">
                    Already have an account? <Link to="/login">Login</Link>
                </p>

            </form>
        </div>
    )
}

export default Signup
