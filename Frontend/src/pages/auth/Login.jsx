import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const validateLogin = (values) => {
    const errors = {};
    const email = values.email.trim();

    if (!email) {
        errors.email = "Email address is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
        errors.email = "Enter a valid email address.";
    }

    if (!values.password) {
        errors.password = "Password is required.";
    } else if (values.password.length > 128) {
        errors.password = "Password cannot exceed 128 characters.";
    }

    return errors;
};

export const Login = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [loginData, setLoginData] = useState({ email: "", password: "" });
    const [fieldErrors, setFieldErrors] = useState({});
    const [submitted, setSubmitted] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        const updatedData = { ...loginData, [name]: value };
        setLoginData(updatedData);
        setErrorMessage("");

        if (submitted) {
            setFieldErrors(validateLogin(updatedData));
        } else if (fieldErrors[name]) {
            setFieldErrors((previous) => ({ ...previous, [name]: "" }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitted(true);
        const errors = validateLogin(loginData);
        setFieldErrors(errors);

        if (Object.values(errors).some(Boolean)) {
            setErrorMessage("Please correct the highlighted fields.");
            return;
        }

        try {
            setErrorMessage("");
            setLoading(true);
            const user = await login({
                email: loginData.email.trim(),
                password: loginData.password,
            });
            setLoginData({ email: "", password: "" });

            if (user.role === "owner") {
                navigate("/owner/dashboard");
            } else if (user.role === "tenant") {
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
    };

    const inputClass = (name) =>
        `w-full min-w-0 rounded-lg border bg-white border-[#5a574c76] px-3 py-3 text-slate-900 outline-none transition placeholder:text-gray-600 focus:border-black focus:ring-2 focus:ring-slate-900/20 sm:px-4 dark:bg-[#111111] dark:border-[#373737] dark:text-[#F1F0ED] dark:placeholder:text-[#85827D] ${
            fieldErrors[name] ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : ""
        }`;

    return (
        <main className="flex min-h-[calc(100dvh-145px)] w-full items-center justify-center bg-white bg-[url(/login.jpg)]  bg-cover bg-center px-4 py-6 dark:bg-[#101010] sm:px-6 lg:px-8">
            <form
                onSubmit={handleSubmit}
                noValidate
                className="w-full max-w-md rounded-2xs border border-black/5 bg-white p-5 shadow-xl dark:border-[#373737] dark:bg-[#1B1B1B] sm:p-7 md:p-8"
            >
                <div className="mb-5 text-center sm:mb-7">
                    <h1 className="text-2xl text-black dark:text-[#F1F0ED] sm:text-3xl">
                        Welcome Back!
                    </h1>
                    <p className="mt-2 text-sm text-yellow-600 dark:text-yellow-300">
                        Login to your owner/tenant account.
                    </p>
                </div>

                <div className="space-y-4">
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
                            autoComplete="email"
                            aria-invalid={Boolean(fieldErrors.email)}
                            aria-describedby={fieldErrors.email ? "email-error" : undefined}
                            placeholder="Enter your email"
                            className={inputClass("email")}
                        />
                        {fieldErrors.email && (
                            <p id="email-error" className="mt-1 text-xs text-red-600 dark:text-[#FF8F86]">
                                {fieldErrors.email}
                            </p>
                        )}
                    </div>

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
                            minLength={6}
                            maxLength={128}
                            autoComplete="current-password"
                            aria-invalid={Boolean(fieldErrors.password)}
                            aria-describedby={fieldErrors.password ? "password-error" : "password-help"}
                            placeholder="Enter your password"
                            className={inputClass("password")}
                        />
                        <p id="password-help" className="mt-1 text-xs text-gray-500 dark:text-[#85827D]">
                            Enter at least 6 characters.
                        </p>
                        {fieldErrors.password && (
                            <p id="password-error" className="mt-1 text-xs text-red-600 dark:text-[#FF8F86]">
                                {fieldErrors.password}
                            </p>
                        )}
                    </div>

                    {errorMessage && (
                        <p role="alert" className="text-sm text-red-600 dark:text-[#FF8F86]">
                            {errorMessage}
                        </p>
                    )}

                    <button
                        type="submit"
                        className="w-full rounded-lg bg-yellow-300 px-4 py-3 font-semibold text-black transition hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:bg-[#F7C744] disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={loading}
                    >
                        {loading ? "Logging in..." : "Login"}
                    </button>
                </div>

                <p className="mt-4 text-center text-sm text-black dark:text-[#F1F0ED]">
                    Doesn't have an account?{" "}
                    <Link to="/signup" className="font-medium">
                        Signup
                    </Link>
                </p>
            </form>
        </main>
    );
};
