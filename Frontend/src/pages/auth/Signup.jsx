import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import apiClient from "../../ApiClient/interceptor.js";

const initialFormData = {
    username: "",
    email: "",
    password: "",
    phone: "",
};

const validateSignup = (values) => {
    const errors = {};
    const username = values.username.trim();
    const email = values.email.trim();
    const phoneDigits = values.phone.replace(/\D/g, "");

    if (!username) {
        errors.username = "Username is required.";
    } else if (username.length < 3) {
        errors.username = "Username must be at least 3 characters.";
    } else if (username.length > 30) {
        errors.username = "Username cannot exceed 30 characters.";
    }

    if (!email) {
        errors.email = "Email address is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
        errors.email = "Enter a valid email address.";
    }

    if (!values.password) {
        errors.password = "Password is required.";
    } else if (values.password.length < 6) {
        errors.password = "Password must be at least 6 characters.";
    } else if (values.password.length > 128) {
        errors.password = "Password cannot exceed 128 characters.";
    }

    // Accept common Indian formats: 9876543210, +91 9876543210, or 919876543210.
    if (!values.phone.trim()) {
        errors.phone = "Phone number is required.";
    } else if (
        !/^(?:\+?91[\s-]?)?[6-9]\d{9}$/.test(values.phone.trim()) &&
        !/^[6-9]\d{9}$/.test(phoneDigits)
    ) {
        errors.phone = "Enter a valid 10-digit Indian mobile number.";
    }

    return errors;
};

const Signup = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [formData, setFormData] = useState(initialFormData);
    const [fieldErrors, setFieldErrors] = useState({});
    const [submitted, setSubmitted] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        const updatedData = { ...formData, [name]: value };
        setFormData(updatedData);
        setErrorMessage("");

        // Validate fields as the user edits them after the first submit attempt.
        if (submitted) {
            setFieldErrors(validateSignup(updatedData));
        } else if (fieldErrors[name]) {
            setFieldErrors((previous) => ({ ...previous, [name]: "" }));
        }
    };

    const signup = async (values) => {
        try {
            setLoading(true);
            setErrorMessage("");
            await apiClient.post("/auth/register", {
                ...values,
                username: values.username.trim(),
                email: values.email.trim(),
                phone: values.phone.trim(),
            });
            setFormData(initialFormData);
            setFieldErrors({});
            navigate("/login");
        } catch (error) {
            setErrorMessage(
                error.response?.data?.message ||
                "Something went wrong. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitted(true);
        const errors = validateSignup(formData);
        setFieldErrors(errors);

        if (Object.values(errors).some(Boolean)) {
            setErrorMessage("Please correct the highlighted fields.");
            return;
        }

        await signup(formData);
    };

    const inputClass = (name) =>
        `w-full rounded border bg-white border-[#5a574c76] px-4 py-3 text-slate-900 outline-none transition placeholder:text-gray-600 focus:border-black focus:ring-2 focus:ring-slate-900/20 dark:bg-[#111111] dark:border-[#373737] dark:text-[#F1F0ED] dark:placeholder:text-[#85827D] ${
            fieldErrors[name] ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : ""
        }`;

    return (
        <div className="min-h-[calc(100dvh-150px)] w-full overflow-hidden bg-[#f3f3f3] px-3 py-3 flex items-center justify-center bg-[url(/signup.jpg)]  bg-cover bg-center dark:text-white dark:bg-[#101010]">
            <form onSubmit={handleSubmit} noValidate className="w-full max-w-xl rounded-2xs bg-white/70 backdrop-blur-xs  border-white/20 shadow-lg  p-5 shadow-2xl dark:bg-[#1B1B1B] dark:border-[#373737] sm:p-6">
                <div className="mb-5 text-center">
                    <h1 className="text-3xl text-black dark:text-[#F1F0ED]">OWNER REGISTRATION</h1>
                    <p className="mt-2 text-sm font-medium text-gray-900 dark:text-yellow-300">Set up your owner account.</p>
                </div>

                <div className="grid grid-cols-1 p-4 gap-x-7 gap-y-4 sm:grid-cols-2">
                    <div className="min-w-0">
                        <label htmlFor="username" className="mb-2 block text-sm font-medium  text-black dark:text-[#F1F0ED]">Username</label>
                        <input id="username" type="text" name="username" value={formData.username} onChange={handleChange} required minLength={3} maxLength={30} autoComplete="username" aria-invalid={Boolean(fieldErrors.username)} aria-describedby={fieldErrors.username ? "username-error" : undefined} placeholder="Enter your Username" className={inputClass("username")} />
                        {fieldErrors.username && <p id="username-error" className="mt-1 text-xs text-red-600 dark:text-[#FF8F86]">{fieldErrors.username}</p>}
                    </div>

                    <div className="min-w-0">
                        <label htmlFor="email" className="mb-2 block text-sm font-medium  text-black dark:text-[#F1F0ED]">Email address</label>
                        <input id="email" type="email" name="email" value={formData.email} onChange={handleChange} required autoComplete="email" aria-invalid={Boolean(fieldErrors.email)} aria-describedby={fieldErrors.email ? "email-error" : undefined} placeholder="Enter your email" className={inputClass("email")} />
                        {fieldErrors.email && <p id="email-error" className="mt-1 text-xs text-red-600 dark:text-[#FF8F86]">{fieldErrors.email}</p>}
                    </div>

                    <div className="min-w-0">
                        <label htmlFor="password" className="mb-2 block text-sm font-medium  text-black dark:text-[#F1F0ED]">Password</label>
                        <input id="password" type="password" name="password" value={formData.password} onChange={handleChange} required minLength={6} maxLength={128} autoComplete="new-password" aria-invalid={Boolean(fieldErrors.password)} aria-describedby={fieldErrors.password ? "password-error" : "password-help"} placeholder="Enter your password" className={inputClass("password")} />
                        <p id="password-help" className="mt-1 text-xs text-gray-700 dark:text-[#85827D]">Use strong password.</p>
                        {fieldErrors.password && <p id="password-error" className="mt-1 text-xs text-red-600 dark:text-[#FF8F86]">{fieldErrors.password}</p>}
                    </div>

                    <div className="min-w-0">
                        <label htmlFor="phone" className="mb-2 block text-sm font-medium  text-black dark:text-[#F1F0ED]">Phone</label>
                        <input id="phone" type="tel" name="phone" value={formData.phone} onChange={handleChange} required autoComplete="tel" inputMode="tel" aria-invalid={Boolean(fieldErrors.phone)} aria-describedby={fieldErrors.phone ? "phone-error" : "phone-help"} placeholder="Enter phone number" className={inputClass("phone")} />
                        <p id="phone-help" className="mt-1 text-xs text-gray-700 dark:text-[#85827D]">Indian mobile number (10 digits).</p>
                        {fieldErrors.phone && <p id="phone-error" className="mt-1 text-xs text-red-600 dark:text-[#FF8F86]">{fieldErrors.phone}</p>}
                    </div>
                </div>

                {errorMessage && <p role="alert" className="mt-4 text-sm font-medium text-red-600 dark:text-[#FF8F86]">{errorMessage}</p>}

                <button type="submit" className="mt-4 w-full rounded-lg bg-yellow-300 px-4 py-3 font-semibold text-black transition hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:bg-[#F7C744] disabled:cursor-not-allowed disabled:opacity-60" disabled={loading}>
                    {loading ? "Creating account..." : "Create owner account"}
                </button>

                <p className="mt-4 text-center text-sm font-medium text-black dark:text-[#F1F0ED]">
                    Already have an account? <Link to="/login" className="font-medium">Login</Link>
                </p>
            </form>
        </div>
    );
};

export default Signup;
