import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import apiClient from "../../ApiClient/interceptor.js";

const initialOwnerData = {
    username: "",
    email: "",
    phone: "",
};

const initialTenantData = {
    fullName: "",
    email: "",
    phone: "",
    aadhaarNumber: "",
    address: "",
};

// Normalize Indian mobile numbers to exactly 10 digits.
const normalizePhone = (value) => {
    const digits = (value || "").replace(/\D/g, "");
    if (digits.length === 12 && digits.startsWith("91")) {
        return digits.slice(2);
    }
    return digits;
};

// Normalize Aadhaar to exactly 12 digits
const normalizeAadhaar = (value) => {
    return (value || "").replace(/\D/g, "");
};

const validateOwnerSignup = (values) => {
    const errors = {};
    const username = values.username.trim();
    const email = values.email.trim().toLowerCase();
    const phone = normalizePhone(values.phone);

    if (!username) {
        errors.username = "Username is required.";
    } else if (username.length < 3 || username.length > 30) {
        errors.username = "Username must be between 3 and 30 characters.";
    }

    if (!email) {
        errors.email = "Email address is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
        errors.email = "Enter a valid email address.";
    }

    if (!values.phone.trim()) {
        errors.phone = "Phone number is required.";
    } else if (!/^[6-9]\d{9}$/.test(phone)) {
        errors.phone = "Enter a valid 10-digit Indian mobile number.";
    }

    return errors;
};

const validateTenantSignup = (values) => {
    const errors = {};
    const fullName = values.fullName.trim();
    const email = values.email.trim().toLowerCase();
    const phone = normalizePhone(values.phone);
    const aadhaar = normalizeAadhaar(values.aadhaarNumber);

    if (!fullName) {
        errors.fullName = "Full name is required.";
    } else if (fullName.length < 3) {
        errors.fullName = "Full name must be at least 3 characters.";
    }

    if (!email) {
        errors.email = "Email address is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
        errors.email = "Enter a valid email address.";
    }

    if (!values.phone.trim()) {
        errors.phone = "Phone number is required.";
    } else if (!/^[6-9]\d{9}$/.test(phone)) {
        errors.phone = "Enter a valid 10-digit Indian mobile number.";
    }

    if (!values.aadhaarNumber.trim()) {
        errors.aadhaarNumber = "Aadhaar number is required.";
    } else if (aadhaar.length !== 12) {
        errors.aadhaarNumber = "Aadhaar number must be exactly 12 numeric digits.";
    }

    return errors;
};

const Signup = () => {
    const navigate = useNavigate();

    const [role, setRole] = useState("owner"); // "owner" | "tenant"
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [ownerData, setOwnerData] = useState(initialOwnerData);
    const [tenantData, setTenantData] = useState(initialTenantData);
    const [fieldErrors, setFieldErrors] = useState({});
    const [submitted, setSubmitted] = useState(false);

    const handleOwnerChange = (e) => {
        const { name, value } = e.target;
        const updated = { ...ownerData, [name]: value };
        setOwnerData(updated);
        setErrorMessage("");

        if (submitted) {
            setFieldErrors(validateOwnerSignup(updated));
        } else if (fieldErrors[name]) {
            setFieldErrors((prev) => ({ ...prev, [name]: "" }));
        }
    };

    const handleTenantChange = (e) => {
        const { name, value } = e.target;
        let formattedValue = value;
        if (name === "aadhaarNumber") {
            // Keep numeric digits up to 12
            formattedValue = value.replace(/\D/g, "").slice(0, 12);
        }
        const updated = { ...tenantData, [name]: formattedValue };
        setTenantData(updated);
        setErrorMessage("");

        if (submitted) {
            setFieldErrors(validateTenantSignup(updated));
        } else if (fieldErrors[name]) {
            setFieldErrors((prev) => ({ ...prev, [name]: "" }));
        }
    };

    const handleRoleSwitch = (selectedRole) => {
        if (role === selectedRole) return;
        setRole(selectedRole);
        setErrorMessage("");
        setFieldErrors({});
        setSubmitted(false);
    };

    const handleOwnerSubmit = async () => {
        const errors = validateOwnerSignup(ownerData);
        setFieldErrors(errors);

        if (Object.values(errors).some(Boolean)) {
            setErrorMessage("Please correct the highlighted fields.");
            return;
        }

        try {
            setLoading(true);
            setErrorMessage("");

            await apiClient.post("/user/register", {
                username: ownerData.username.trim().toLowerCase(),
                email: ownerData.email.trim().toLowerCase(),
                phone: normalizePhone(ownerData.phone),
            });

            setOwnerData(initialOwnerData);
            setFieldErrors({});
            setSubmitted(false);

            navigate("/login", {
                replace: true,
                state: {
                    message: "Owner account created successfully. Please log in using your email OTP.",
                },
            });
        } catch (error) {
            setErrorMessage(
                error.response?.data?.message || "Something went wrong. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    const handleTenantSubmit = async () => {
        const errors = validateTenantSignup(tenantData);
        setFieldErrors(errors);

        if (Object.values(errors).some(Boolean)) {
            setErrorMessage("Please correct the highlighted fields.");
            return;
        }

        try {
            setLoading(true);
            setErrorMessage("");

            await apiClient.post("/tenant/register-self", {
                fullName: tenantData.fullName.trim(),
                email: tenantData.email.trim().toLowerCase(),
                phone: normalizePhone(tenantData.phone),
                aadhaarNumber: normalizeAadhaar(tenantData.aadhaarNumber),
                address: tenantData.address.trim(),
            });

            setTenantData(initialTenantData);
            setFieldErrors({});
            setSubmitted(false);

            navigate("/login", {
                replace: true,
                state: {
                    message: "Tenant account created successfully! Please log in using your email OTP to browse rental listings.",
                },
            });
        } catch (error) {
            setErrorMessage(
                error.response?.data?.message || "Something went wrong. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitted(true);
        if (role === "owner") {
            await handleOwnerSubmit();
        } else {
            await handleTenantSubmit();
        }
    };

    const inputClass = (name) =>
        `w-full rounded border bg-white border-[#5a574c76] px-4 py-3 text-slate-900 outline-none transition placeholder:text-gray-600 focus:border-black focus:ring-2 focus:ring-slate-900/20 dark:bg-[#111111] dark:border-[#373737] dark:text-[#F1F0ED] dark:placeholder:text-[#85827D] ${
            fieldErrors[name]
                ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                : ""
        }`;

    return (
        <div className="min-h-[calc(100dvh-150px)] w-full overflow-hidden bg-[#f3f3f3] px-3 py-6 flex items-center justify-center bg-[url(/signup.jpg)] bg-cover bg-center dark:text-white dark:bg-[#101010]">
            <form
                onSubmit={handleSubmit}
                noValidate
                className="w-full max-w-xl rounded-2xs bg-white/40 backdrop-blur-xs border border-white/10 shadow-lg p-5 shadow-2xl dark:bg-[#1B1B1B] dark:border-[#373737] sm:p-6"
            >
                {/* Heading */}
                <div className="mb-4 text-center">
                    <h1 className="text-3xl font-semibold tracking-tight text-black dark:text-[#F1F0ED]">
                        CREATE AN ACCOUNT
                    </h1>
                    <p className="mt-1 text-sm font-medium text-gray-900 dark:text-yellow-300">
                        {role === "owner" ? "Register as a Property Owner" : "Register as a Tenant"}
                    </p>
                </div>

                {/* Role Switcher */}
                <div className="mb-4 grid grid-cols-2 rounded-lg bg-black/10 p-1 dark:bg-black/40">
                    <button
                        type="button"
                        onClick={() => handleRoleSwitch("owner")}
                        className={`rounded-md py-2 text-sm font-semibold transition ${
                            role === "owner"
                                ? "bg-white text-black shadow dark:bg-neutral-800 dark:text-yellow-400"
                                : "text-gray-700 hover:text-black dark:text-neutral-400 dark:hover:text-white"
                        }`}
                    >
                        Property Owner
                    </button>
                    <button
                        type="button"
                        onClick={() => handleRoleSwitch("tenant")}
                        className={`rounded-md py-2 text-sm font-semibold transition ${
                            role === "tenant"
                                ? "bg-white text-black shadow dark:bg-neutral-800 dark:text-yellow-400"
                                : "text-gray-700 hover:text-black dark:text-neutral-400 dark:hover:text-white"
                        }`}
                    >
                        Tenant
                    </button>
                </div>

                {/* OWNER FORM FIELDS */}
                {role === "owner" && (
                    <div className="flex flex-col gap-3">
                        {/* Username */}
                        <div className="min-w-0">
                            <label
                                htmlFor="username"
                                className="mb-1 block text-sm font-medium text-black dark:text-[#F1F0ED]"
                            >
                                Username
                            </label>
                            <input
                                id="username"
                                type="text"
                                name="username"
                                value={ownerData.username}
                                onChange={handleOwnerChange}
                                required
                                minLength={3}
                                maxLength={30}
                                autoComplete="username"
                                placeholder="Enter your username"
                                className={inputClass("username")}
                            />
                            {fieldErrors.username && (
                                <p className="mt-1 text-xs text-red-600 dark:text-[#FF8F86]">
                                    {fieldErrors.username}
                                </p>
                            )}
                        </div>

                        {/* Email */}
                        <div className="min-w-0">
                            <label
                                htmlFor="email"
                                className="mb-1 block text-sm font-medium text-black dark:text-[#F1F0ED]"
                            >
                                Email address
                            </label>
                            <input
                                id="email"
                                type="email"
                                name="email"
                                value={ownerData.email}
                                onChange={handleOwnerChange}
                                required
                                autoComplete="email"
                                placeholder="Enter your email"
                                className={inputClass("email")}
                            />
                            {fieldErrors.email && (
                                <p className="mt-1 text-xs text-red-600 dark:text-[#FF8F86]">
                                    {fieldErrors.email}
                                </p>
                            )}
                        </div>

                        {/* Phone */}
                        <div className="min-w-0">
                            <label
                                htmlFor="phone"
                                className="mb-1 block text-sm font-medium text-black dark:text-[#F1F0ED]"
                            >
                                Phone
                            </label>
                            <input
                                id="phone"
                                type="tel"
                                name="phone"
                                value={ownerData.phone}
                                onChange={handleOwnerChange}
                                required
                                autoComplete="tel"
                                inputMode="tel"
                                placeholder="Enter 10-digit mobile number"
                                className={inputClass("phone")}
                            />
                            <p className="mt-1 text-xs text-gray-700 dark:text-[#85827D]">
                                10-digit Indian mobile number (with or without +91).
                            </p>
                            {fieldErrors.phone && (
                                <p className="mt-1 text-xs text-red-600 dark:text-[#FF8F86]">
                                    {fieldErrors.phone}
                                </p>
                            )}
                        </div>
                    </div>
                )}

                {/* TENANT FORM FIELDS */}
                {role === "tenant" && (
                    <div className="flex flex-col gap-3">
                        {/* Full Name */}
                        <div className="min-w-0">
                            <label
                                htmlFor="fullName"
                                className="mb-1 block text-sm font-medium text-black dark:text-[#F1F0ED]"
                            >
                                Full Name
                            </label>
                            <input
                                id="fullName"
                                type="text"
                                name="fullName"
                                value={tenantData.fullName}
                                onChange={handleTenantChange}
                                required
                                placeholder="e.g. Rahul Sharma"
                                className={inputClass("fullName")}
                            />
                            {fieldErrors.fullName && (
                                <p className="mt-1 text-xs text-red-600 dark:text-[#FF8F86]">
                                    {fieldErrors.fullName}
                                </p>
                            )}
                        </div>

                        {/* Email */}
                        <div className="min-w-0">
                            <label
                                htmlFor="tenantEmail"
                                className="mb-1 block text-sm font-medium text-black dark:text-[#F1F0ED]"
                            >
                                Email address
                            </label>
                            <input
                                id="tenantEmail"
                                type="email"
                                name="email"
                                value={tenantData.email}
                                onChange={handleTenantChange}
                                required
                                autoComplete="email"
                                placeholder="e.g. rahul@example.com"
                                className={inputClass("email")}
                            />
                            {fieldErrors.email && (
                                <p className="mt-1 text-xs text-red-600 dark:text-[#FF8F86]">
                                    {fieldErrors.email}
                                </p>
                            )}
                        </div>

                        {/* Phone */}
                        <div className="min-w-0">
                            <label
                                htmlFor="tenantPhone"
                                className="mb-1 block text-sm font-medium text-black dark:text-[#F1F0ED]"
                            >
                                Phone Number
                            </label>
                            <input
                                id="tenantPhone"
                                type="tel"
                                name="phone"
                                value={tenantData.phone}
                                onChange={handleTenantChange}
                                required
                                autoComplete="tel"
                                inputMode="tel"
                                placeholder="10-digit mobile number"
                                className={inputClass("phone")}
                            />
                            {fieldErrors.phone && (
                                <p className="mt-1 text-xs text-red-600 dark:text-[#FF8F86]">
                                    {fieldErrors.phone}
                                </p>
                            )}
                        </div>

                        {/* Aadhaar Number */}
                        <div className="min-w-0">
                            <label
                                htmlFor="aadhaarNumber"
                                className="mb-1 block text-sm font-medium text-black dark:text-[#F1F0ED]"
                            >
                                Aadhaar Number
                            </label>
                            <input
                                id="aadhaarNumber"
                                type="text"
                                name="aadhaarNumber"
                                value={tenantData.aadhaarNumber}
                                onChange={handleTenantChange}
                                required
                                maxLength={12}
                                inputMode="numeric"
                                placeholder="12-digit Aadhaar number"
                                className={inputClass("aadhaarNumber")}
                            />
                            <p className="mt-1 text-xs text-gray-700 dark:text-[#85827D]">
                                12 numeric digits. Always masked and protected securely.
                            </p>
                            {fieldErrors.aadhaarNumber && (
                                <p className="mt-1 text-xs text-red-600 dark:text-[#FF8F86]">
                                    {fieldErrors.aadhaarNumber}
                                </p>
                            )}
                        </div>

                        {/* Current Address (Optional) */}
                        <div className="min-w-0">
                            <label
                                htmlFor="address"
                                className="mb-1 block text-sm font-medium text-black dark:text-[#F1F0ED]"
                            >
                                Current Address <span className="text-xs text-gray-500 font-normal">(optional)</span>
                            </label>
                            <input
                                id="address"
                                type="text"
                                name="address"
                                value={tenantData.address}
                                onChange={handleTenantChange}
                                placeholder="Current address / city"
                                className={inputClass("address")}
                            />
                        </div>
                    </div>
                )}

                {/* Server / form error */}
                {errorMessage && (
                    <p
                        role="alert"
                        className="mt-4 text-sm font-medium text-red-600 dark:text-[#FF8F86]"
                    >
                        {errorMessage}
                    </p>
                )}

                {/* Submit */}
                <button
                    type="submit"
                    disabled={loading}
                    className="mt-5 w-full rounded-lg bg-yellow-300 px-4 py-3 font-semibold text-black transition hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:bg-[#F7C744] disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {loading
                        ? "Creating account..."
                        : role === "owner"
                        ? "Create owner account"
                        : "Register as Tenant"}
                </button>

                {/* Login link */}
                <p className="mt-4 text-center text-sm font-medium text-black dark:text-[#F1F0ED]">
                    Already have an account?{" "}
                    <Link
                        to="/login"
                        className="font-semibold hover:underline"
                    >
                        Login
                    </Link>
                </p>
            </form>
        </div>
    );
};

export default Signup;
