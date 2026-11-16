
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";

const AdminLogin = () => {
    const navigate = useNavigate();
    const { adminLogin } = useAuth();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const inputClass =
        "w-full rounded-xs border border-black bg-[#f4f6f9] px-3 py-3 text-sm text-slate-900 outline-none transition placeholder:text-gray-500 focus:border-slate-400 focus:ring-2 focus:ring-slate-900/10 dark:border-[#343434] dark:bg-[#242424] dark:text-white dark:placeholder:text-[#aaa] dark:focus:border-yellow-400";

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!email.trim() || !password) {
            setErrorMessage("Email and password are required.");
            return;
        }

        try {
            setLoading(true);
            setErrorMessage("");

            const admin = await adminLogin(email.trim(), password);

            if (admin.role !== "admin") {
                throw new Error("Unauthorized account.");
            }

            toast.success("Admin login successful!");
            navigate("/admin/dashboard", { replace: true });
        } catch (error) {
            const message =
                error.response?.data?.message ||
                error.message ||
                "Unable to login. Please try again.";

            setErrorMessage(message);
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="fixed inset-0 flex h-[100dvh] w-full items-center justify-center overflow-hidden bg-[#f4f6f9] px-4 py-4 text-black dark:bg-[#111111] dark:text-white sm:px-6">

            <div className="w-full max-w-md">

                {/* HEADER */}
                <div className="mb-6 my-2 text-center sm:mb-8">
                    <h1 className="font-serif text-3xl font-medium tracking-tight sm:text-4xl">
                        Admin Portal
                    </h1>
                </div>

                {/* LOGIN CARD */}
                <div className="w-full border border-gray-200 bg-white p-5 shadow-sm dark:border-[#343434] dark:bg-[#1b1b1b] sm:p-8">

                    {/* CARD HEADER */}
                    <div className="mb-6 text-center">
                        <h2 className="text-xl font-semibold">
                            Welcome back!
                        </h2>

                        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                            Enter your administrator credentials.
                        </p>
                    </div>

                    {/* LOGIN FORM */}
                    <form onSubmit={handleSubmit} className="space-y-5">

                        {/* EMAIL */}
                        <div>
                            <label
                                htmlFor="admin-email"
                                className="mb-2 block text-sm font-medium"
                            >
                                Email address
                            </label>

                            <input
                                id="admin-email"
                                type="email"
                                autoComplete="username"
                                required
                                value={email}
                                onChange={(e) => {
                                    setEmail(e.target.value);
                                    setErrorMessage("");
                                }}
                                placeholder="Enter admin email"
                                className={inputClass}
                            />
                        </div>

                        {/* PASSWORD */}
                        <div>
                            <label
                                htmlFor="admin-password"
                                className="mb-2 block text-sm font-medium"
                            >
                                Password
                            </label>

                            <div className="relative">
                                <input
                                    id="admin-password"
                                    type={showPassword ? "text" : "password"}
                                    autoComplete="current-password"
                                    required
                                    value={password}
                                    onChange={(e) => {
                                        setPassword(e.target.value);
                                        setErrorMessage("");
                                    }}
                                    placeholder="Enter password"
                                    className={`${inputClass} pr-16`}
                                />

                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowPassword((previous) => !previous)
                                    }
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-600 hover:text-black dark:text-gray-400 dark:hover:text-white"
                                >
                                    {showPassword ? "Hide" : "Show"}
                                </button>
                            </div>
                        </div>

                        {/* ERROR MESSAGE */}
                        {errorMessage && (
                            <p
                                role="alert"
                                className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300"
                            >
                                {errorMessage}
                            </p>
                        )}

                        {/* SUBMIT BUTTON */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full rounded-xs bg-yellow-300 px-4 py-3.5 text-sm font-semibold text-black transition hover:bg-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {loading ? "Signing in..." : "Sign in as Admin"}
                        </button>

                    </form>
                </div>
            </div>
        </main>
    );
};

export default AdminLogin;
