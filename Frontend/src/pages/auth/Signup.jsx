import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import apiClient from "../../ApiClient/interceptor.js";

const initialOwnerData = {
    username: "",
    email: "",
    phone: "",
    aadhaarNumber: "",
    panNumber: "",
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
    const aadhaar = normalizeAadhaar(values.aadhaarNumber);
    const pan = (values.panNumber || "").trim().toUpperCase();

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

    if (!values.aadhaarNumber.trim()) {
        errors.aadhaarNumber = "Aadhaar number is required.";
    } else if (!/^\d{12}$/.test(aadhaar)) {
        errors.aadhaarNumber = "Enter a valid 12-digit Aadhaar number.";
    }

    if (!pan) {
        errors.panNumber = "PAN number is required.";
    } else if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(pan)) {
        errors.panNumber = "Enter a valid PAN (e.g. ABCDE1234F).";
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
        let formattedValue = value;
        if (name === "aadhaarNumber") {
            formattedValue = value.replace(/\D/g, "").slice(0, 12);
        } else if (name === "panNumber") {
            formattedValue = value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10);
        }
        const updated = { ...ownerData, [name]: formattedValue };
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
            formattedValue = value.replace(/\\D/g, "").slice(0, 12);
        } else if (name === "panNumber") {
            formattedValue = value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10);
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
                aadhaarNumber: normalizeAadhaar(ownerData.aadhaarNumber),
                panNumber: ownerData.panNumber.trim().toUpperCase(),
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
        `w-full min-w-0 rounded border bg-white border-[#5a574c76] px-3 py-2 text-sm text-slate-900 outline-none transition placeholder:text-gray-600 focus:border-black focus:ring-2 focus:ring-slate-900/20 dark:bg-[#111111] dark:border-[#373737] dark:text-[#F1F0ED] dark:placeholder:text-[#85827D] ${
            fieldErrors[name]
                ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                : ""
        }`;

    const fieldLabelClass = "mb-1 block text-xs font-medium text-black dark:text-[#F1F0ED]";
    const fieldErrorClass = "mt-1 text-[11px] leading-tight text-red-600 dark:text-[#FF8F86]";

    return (
        <main className="h-[calc(100svh-72px)] min-h-0 w-full overflow-hidden bg-[#f3f3f3] bg-[url(/signup.jpg)] bg-cover bg-center px-3 py-2 text-slate-900 dark:bg-[#101010] dark:text-white sm:px-5 sm:py-3">
            <div className="mx-auto flex h-full w-full max-w-4xl items-center justify-center">
                <form
                    onSubmit={handleSubmit}
                    noValidate
                    className="w-full max-h-full overflow-hidden rounded-xl border border-white/20 bg-white/55 p-3 shadow-xl backdrop-blur-md dark:border-[#373737] dark:bg-[#1B1B1B]/95 sm:p-5 lg:p-6"
                >
                    <div className="mb-2 text-center sm:mb-3">
                        <h1 className="text-xl font-semibold tracking-tight text-black dark:text-[#F1F0ED] sm:text-2xl lg:text-3xl">
                            CREATE AN ACCOUNT
                        </h1>
                        <p className="mt-0.5 text-xs font-medium text-gray-900 dark:text-yellow-300 sm:text-sm">
                            {role === "owner" ? "Register as a Property Owner" : "Register as a Tenant"}
                        </p>
                    </div>

                    <div className="mb-2 grid grid-cols-2 gap-1 rounded-sm bg-black/10 p-1 dark:bg-black/40 sm:mb-3">
                        <button
                            type="button"
                            onClick={() => handleRoleSwitch("owner")}
                            className={`rounded-md py-1.5 text-xs font-semibold transition sm:py-2 sm:text-sm ${
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
                            className={`rounded-md py-1.5 text-xs font-semibold transition sm:py-2 sm:text-sm ${
                                role === "tenant"
                                    ? "bg-white text-black shadow dark:bg-neutral-800 dark:text-yellow-400"
                                    : "text-gray-700 hover:text-black dark:text-neutral-400 dark:hover:text-white"
                            }`}
                        >
                            Tenant
                        </button>
                    </div>

                    {role === "owner" ? (
                        <div className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2 sm:gap-y-3">
                            <div className="min-w-0">
                                <label htmlFor="username" className={fieldLabelClass}>Username</label>
                                <input
                                    id="username" type="text" name="username"
                                    value={ownerData.username} onChange={handleOwnerChange}
                                    required minLength={3} maxLength={30} autoComplete="username"
                                    placeholder="Enter your username" className={inputClass("username")}
                                />
                                {fieldErrors.username && <p className={fieldErrorClass}>{fieldErrors.username}</p>}
                            </div>
                            <div className="min-w-0">
                                <label htmlFor="email" className={fieldLabelClass}>Email address</label>
                                <input
                                    id="email" type="email" name="email"
                                    value={ownerData.email} onChange={handleOwnerChange}
                                    required autoComplete="email" placeholder="Enter your email"
                                    className={inputClass("email")}
                                />
                                {fieldErrors.email && <p className={fieldErrorClass}>{fieldErrors.email}</p>}
                            </div>
                            <div className="min-w-0">
                                <label htmlFor="phone" className={fieldLabelClass}>Phone</label>
                                <input
                                    id="phone" type="tel" name="phone"
                                    value={ownerData.phone} onChange={handleOwnerChange}
                                    required autoComplete="tel" inputMode="tel"
                                    placeholder="10-digit mobile number" className={inputClass("phone")}
                                />
                                {fieldErrors.phone && <p className={fieldErrorClass}>{fieldErrors.phone}</p>}
                            </div>
                            <div className="min-w-0">
                                <label htmlFor="ownerAadhaar" className={fieldLabelClass}>Aadhaar Number</label>
                                <input
                                    id="ownerAadhaar" type="text" name="aadhaarNumber"
                                    value={ownerData.aadhaarNumber} onChange={handleOwnerChange}
                                    required maxLength={12} inputMode="numeric" autoComplete="off"
                                    placeholder="12-digit Aadhaar number" className={inputClass("aadhaarNumber")}
                                />
                                {fieldErrors.aadhaarNumber && <p className={fieldErrorClass}>{fieldErrors.aadhaarNumber}</p>}
                            </div>
                            <div className="min-w-0 sm:col-span-2">
                                <label htmlFor="ownerPan" className={fieldLabelClass}>PAN Number</label>
                                <input
                                    id="ownerPan" type="text" name="panNumber"
                                    value={ownerData.panNumber} onChange={handleOwnerChange}
                                    required maxLength={10} autoComplete="off"
                                    placeholder="ABCDE1234F" className={inputClass("panNumber")}
                                />
                                {fieldErrors.panNumber && <p className={fieldErrorClass}>{fieldErrors.panNumber}</p>}
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2 sm:gap-y-3">
                            <div className="min-w-0">
                                <label htmlFor="fullName" className={fieldLabelClass}>Full Name</label>
                                <input
                                    id="fullName" type="text" name="fullName"
                                    value={tenantData.fullName} onChange={handleTenantChange}
                                    required placeholder="e.g. Rahul Sharma" className={inputClass("fullName")}
                                />
                                {fieldErrors.fullName && <p className={fieldErrorClass}>{fieldErrors.fullName}</p>}
                            </div>
                            <div className="min-w-0">
                                <label htmlFor="tenantEmail" className={fieldLabelClass}>Email address</label>
                                <input
                                    id="tenantEmail" type="email" name="email"
                                    value={tenantData.email} onChange={handleTenantChange}
                                    required autoComplete="email" placeholder="e.g. rahul@example.com"
                                    className={inputClass("email")}
                                />
                                {fieldErrors.email && <p className={fieldErrorClass}>{fieldErrors.email}</p>}
                            </div>
                            <div className="min-w-0">
                                <label htmlFor="tenantPhone" className={fieldLabelClass}>Phone Number</label>
                                <input
                                    id="tenantPhone" type="tel" name="phone"
                                    value={tenantData.phone} onChange={handleTenantChange}
                                    required autoComplete="tel" inputMode="tel"
                                    placeholder="10-digit mobile number" className={inputClass("phone")}
                                />
                                {fieldErrors.phone && <p className={fieldErrorClass}>{fieldErrors.phone}</p>}
                            </div>
                            <div className="min-w-0">
                                <label htmlFor="aadhaarNumber" className={fieldLabelClass}>Aadhaar Number</label>
                                <input
                                    id="aadhaarNumber" type="text" name="aadhaarNumber"
                                    value={tenantData.aadhaarNumber} onChange={handleTenantChange}
                                    required maxLength={12} inputMode="numeric"
                                    placeholder="12-digit Aadhaar number" className={inputClass("aadhaarNumber")}
                                />
                                <p className="mt-1 text-[10px] leading-tight text-gray-700 dark:text-[#85827D]">
                                    12 numeric digits. Always masked and protected securely.
                                </p>
                                {fieldErrors.aadhaarNumber && <p className={fieldErrorClass}>{fieldErrors.aadhaarNumber}</p>}
                            </div>
                            <div className="min-w-0 sm:col-span-2">
                                <label htmlFor="address" className={fieldLabelClass}>
                                    Current Address <span className="font-normal text-gray-500">(optional)</span>
                                </label>
                                <input
                                    id="address" type="text" name="address"
                                    value={tenantData.address} onChange={handleTenantChange}
                                    placeholder="Current address / city" className={inputClass("address")}
                                />
                            </div>
                        </div>
                    )}

                    {errorMessage && (
                        <p role="alert" className="mt-2 text-xs font-medium text-red-600 dark:text-[#FF8F86]">
                            {errorMessage}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="mt-3 w-full rounded-sm bg-yellow-300 px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:bg-[#F7C744] disabled:cursor-not-allowed disabled:opacity-60 sm:mt-4 sm:py-3"
                    >
                        {loading
                            ? "Creating account..."
                            : role === "owner"
                            ? "Create owner account"
                            : "Register as Tenant"}
                    </button>

                    <p className="mt-2 text-center text-xs font-medium text-black dark:text-[#F1F0ED] sm:mt-3 sm:text-sm">
                        Already have an account?{" "}
                        <Link to="/login" className="font-semibold hover:underline">Login</Link>
                    </p>
                </form>
            </div>
        </main>
    );
};

export default Signup;
