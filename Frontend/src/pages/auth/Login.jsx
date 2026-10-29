import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";
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

// Fixed id: repeated errors replace the toast instead of stacking
const showError = (message) => toast.error(message, { id: "login-error" });

export const Login = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [loginData, setLoginData] = useState({ email: "", password: "" });
    const [fieldErrors, setFieldErrors] = useState({});
    const [submitted, setSubmitted] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [credentialsInvalid, setCredentialsInvalid] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        const updatedData = { ...loginData, [name]: value };
        setLoginData(updatedData);
        setErrorMessage("");
        setCredentialsInvalid(false);

        if (submitted) {
            setFieldErrors(validateLogin(updatedData));
        } else if (fieldErrors[name]) {
            setFieldErrors((previous) => ({ ...previous, [name]: "" }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitted(true);
        setCredentialsInvalid(false);

        const errors = validateLogin(loginData);
        setFieldErrors(errors);

        if (Object.values(errors).some(Boolean)) {
            const message = errors.email || errors.password;
            setErrorMessage("Please correct the highlighted fields.");
            showError(message);
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
            toast.dismiss("login-error");
            toast.success("Signed in successfully!");

            if (user.role === "owner") {
                navigate("/owner/dashboard");
            } else if (user.role === "tenant") {
                navigate("/tenant/dashboard");
            } else {
                setErrorMessage("Invalid user role.");
                showError("Invalid user role.");
            }
        } catch (err) {
            const message =
                err?.response?.data?.message ||
                err?.response?.data?.error ||
                (err?.request && !err?.response
                    ? "Cannot reach the server. Please try again."
                    : err?.message) ||
                "Failed to sign in. Check your credentials.";

            if (err?.response?.status === 401) {
                setCredentialsInvalid(true);
            }

            setErrorMessage(message);
            showError(message);
        } finally {
            setLoading(false);
        }
    };

    const inputClass = (name) => {
        const hasError = Boolean(fieldErrors[name]) || credentialsInvalid;

        return `w-full min-w-0 rounded-xs border bg-[#f4f6f9] px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-gray-500 focus:ring-2 dark:bg-[#242424] dark:text-[#f5f5f5] dark:placeholder:text-[#aaa] ${hasError
                ? "border-red-500 focus:border-red-500 focus:ring-red-500/20 dark:border-red-500"
                : "border-black focus:border-slate-400 focus:ring-slate-900/10 dark:border-[#343434] dark:focus:border-yellow-400 dark:focus:ring-yellow-400/15"
            }`;
    };

    return (
        <main className="h-[calc(100dvh-146px)] min-h-0 w-full overflow-hidden bg-white p-0 text-black dark:bg-[#111111] dark:text-white">
            <div className="grid h-full min-h-0 w-full grid-cols-1 overflow-hidden lg:grid-cols-[1.03fr_0.97fr]">
                {/* Left visual panel */}
                <section
                    className="relative hidden h-full min-h-0 overflow-hidden bg-black bg-cover bg-center lg:block"
                    style={{ backgroundImage: "url('/login.jpg')" }}
                    aria-label="Welcome"
                >
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/5 to-black/5" />
                    <div className="absolute inset-y-0 left-8 w-[5px] bg-white/90 xl:left-10" />
                    <div className="absolute bottom-10 left-16 right-10 text-white xl:left-20">
                        <p className="mb-3 text-xs font-medium uppercase tracking-[0.28em] text-black/100">
                            RentGuard
                        </p>
                        <h2 className="max-w-lg font-serif text-amber-50 text-5xl leading-[0.98] tracking-tight xl:text-6xl">
                            Get
                            <br />
                            Everything
                            <br />
                            You Want
                        </h2>
                        <p className="mt-5 max-w-sm text-sm leading-6 text-white/80">
                            Manage your rental journey with clarity, confidence, and a simpler workflow.
                        </p>
                    </div>
                </section>

                <section className="flex h-full min-h-0 items-center justify-center overflow-hidden px-5 py-4 sm:px-10 lg:px-14 xl:px-20">
                    <div className="w-full max-w-md">
                        <header className="mb-4 text-center sm:mb-6">
                            <h1 className="font-serif text-3xl font-medium tracking-tight text-black dark:text-white sm:text-[42px]">
                                Welcome Back !
                            </h1>
                            <p className="mt-3 text-sm leading-6 text-gray-600 dark:text-gray-400">
                                Enter your email and password to access your account
                            </p>
                        </header>

                        <form onSubmit={handleSubmit} noValidate className="space-y-4 sm:space-y-5">
                            <div>
                                <label htmlFor="email" className="mb-2 block text-sm font-medium text-gray-900 dark:text-gray-100">
                                    Email
                                </label>
                                <input
                                    id="email"
                                    type="email"
                                    name="email"
                                    onChange={handleChange}
                                    value={loginData.email}
                                    required
                                    autoComplete="email"
                                    aria-invalid={Boolean(fieldErrors.email) || credentialsInvalid}
                                    aria-describedby={fieldErrors.email ? "email-error" : undefined}
                                    placeholder="Enter your email"
                                    className={inputClass("email")}
                                />
                                {fieldErrors.email && (
                                    <p id="email-error" className="mt-1.5 text-xs text-red-600">
                                        {fieldErrors.email}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label htmlFor="password" className="mb-2 block text-sm font-medium text-gray-900 dark:text-gray-100">
                                    Password
                                </label>
                                <div className="relative">
                                    <input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        name="password"
                                        onChange={handleChange}
                                        value={loginData.password}
                                        required
                                        maxLength={128}
                                        autoComplete="current-password"
                                        aria-invalid={Boolean(fieldErrors.password) || credentialsInvalid}
                                        aria-describedby={fieldErrors.password ? "password-error" : undefined}
                                        placeholder="Enter your password"
                                        className={`${inputClass("password")} pr-12`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword((shown) => !shown)}
                                        aria-label={showPassword ? "Hide password" : "Show password"}
                                        className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-white"
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                                {fieldErrors.password && (
                                    <p id="password-error" className="mt-1.5 text-xs text-red-600">
                                        {fieldErrors.password}
                                    </p>
                                )}
                            </div>

                            {errorMessage && (
                                <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                                    {errorMessage}
                                </p>
                            )}

                            <button
                                type="submit"
                                className="w-full rounded-xs bg-yellow-300 px-4 py-3.5 text-sm font-medium text-black transition hover:bg-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                                disabled={loading}
                            >
                                {loading ? "Signing in..." : "Sign In"}
                            </button>
                        </form>

                        <p className="mt-5 text-center text-sm text-gray-600 dark:text-gray-400 sm:mt-7">
                            Don&apos;t have an account?{" "}
                            <Link to="/signup" className="font-semibold text-black hover:underline dark:text-white">
                                Sign Up
                            </Link>
                        </p>
                    </div>
                </section>
            </div>
        </main>
    );
};