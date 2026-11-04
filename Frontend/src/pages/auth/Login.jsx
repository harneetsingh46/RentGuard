import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";

export const Login = () => {
    const navigate = useNavigate();
    const { requestOtp, verifyOtp } = useAuth();

    const [contact, setContact] = useState("");
    const [otp, setOtp] = useState("");
    const [otpSent, setOtpSent] = useState(false);
    const [resendSeconds, setResendSeconds] = useState(0);
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    // Resend OTP countdown
    useEffect(() => {
        if (resendSeconds <= 0) return;

        const timer = setTimeout(() => {
            setResendSeconds((previous) => previous - 1);
        }, 1000);

        return () => clearTimeout(timer);
    }, [resendSeconds]);

    // Send OTP
    const handleRequestOtp = async (e) => {
        e.preventDefault();

        if (!contact.trim()) {
            setErrorMessage("Email or phone number is required.");
            return;
        }

        try {
            setLoading(true);
            setErrorMessage("");

            await requestOtp(contact.trim());

            setOtpSent(true);
            setOtp("");
            setResendSeconds(10);

            toast.success("OTP sent successfully!");
        } catch (error) {
            const message =
                error.response?.data?.message ||
                "Unable to send OTP. Please try again.";

            setErrorMessage(message);
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    // Verify OTP
    const handleVerifyOtp = async (e) => {
        e.preventDefault();

        if (!/^\d{6}$/.test(otp)) {
            setErrorMessage("Please enter a valid 6-digit OTP.");
            return;
        }

        try {
            setLoading(true);
            setErrorMessage("");

            const user = await verifyOtp(contact.trim(), otp);

            toast.success("Login successful!");

            if (user.role === "owner") {
                navigate("/owner/dashboard");
            } else if (user.role === "tenant") {
                navigate("/tenant/dashboard");
            } else {
                setErrorMessage("Invalid user role.");
            }
        } catch (error) {
            const message =
                error.response?.data?.message ||
                "OTP verification failed. Please try again.";

            setErrorMessage(message);
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    const inputClass =
        "w-full min-w-0 rounded-xs border border-black bg-[#f4f6f9] px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-gray-500 focus:border-slate-400 focus:ring-2 focus:ring-slate-900/10 dark:border-[#343434] dark:bg-[#242424] dark:text-[#f5f5f5] dark:placeholder:text-[#aaa] dark:focus:border-yellow-400";

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
                        <p className="mb-3 text-xs font-medium uppercase tracking-[0.28em]">
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

                {/* Login form */}
                <section className="flex h-full min-h-0 items-center justify-center overflow-y-auto px-5 py-4 sm:px-10 lg:px-14 xl:px-20">
                    <div className="w-full max-w-md">

                        <header className="mb-6 text-center">
                            <h1 className="font-serif text-3xl font-medium tracking-tight text-black dark:text-white sm:text-[42px]">
                                Welcome Back!
                            </h1>

                            <p className="mt-3 text-sm leading-6 text-gray-600 dark:text-gray-400">
                                Sign in securely using a one-time password.
                            </p>
                        </header>

                        <form
                            onSubmit={otpSent ? handleVerifyOtp : handleRequestOtp}
                            noValidate
                            className="space-y-5"
                        >
                            {/* Email or phone */}
                            <div>
                                <label
                                    htmlFor="contact"
                                    className="mb-2 block text-sm font-medium text-gray-900 dark:text-gray-100"
                                >
                                    Email 
                                </label>

                                <input
                                    id="contact"
                                    type="text"
                                    value={contact}
                                    onChange={(e) => {
                                        setContact(e.target.value);
                                        setErrorMessage("");
                                    }}
                                    disabled={otpSent || loading}
                                    required
                                    autoComplete="username"
                                    placeholder="Enter your email or phone"
                                    className={inputClass}
                                />
                            </div>

                            {/* OTP field */}
                            {otpSent && (
                                <div>
                                    <label
                                        htmlFor="otp"
                                        className="mb-2 block text-sm font-medium text-gray-900 dark:text-gray-100"
                                    >
                                        Enter 6-digit OTP
                                    </label>

                                    <input
                                        id="otp"
                                        type="text"
                                        inputMode="numeric"
                                        autoComplete="one-time-code"
                                        maxLength={6}
                                        value={otp}
                                        onChange={(e) => {
                                            setOtp(
                                                e.target.value
                                                    .replace(/\D/g, "")
                                                    .slice(0, 6)
                                            );
                                            setErrorMessage("");
                                        }}
                                        placeholder="Enter OTP"
                                        className={`${inputClass} text-center text-xl tracking-[0.5em]`}
                                    />

                                    <div className="mt-3 flex items-center justify-between text-xs">
                                        <button
                                            type="button"
                                            disabled={resendSeconds > 0 || loading}
                                            onClick={handleRequestOtp}
                                            className="font-semibold text-black hover:underline disabled:cursor-not-allowed disabled:text-gray-400 dark:text-yellow-300"
                                        >
                                            {resendSeconds > 0
                                                ? `Resend OTP in ${resendSeconds}s`
                                                : "Resend OTP"}
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => {
                                                setOtpSent(false);
                                                setOtp("");
                                                setErrorMessage("");
                                                setResendSeconds(0);
                                            }}
                                            className="text-gray-600 hover:underline dark:text-gray-400"
                                        >
                                            Change contact
                                        </button>
                                    </div>
                                </div>
                            )}

                            {errorMessage && (
                                <p
                                    role="alert"
                                    className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
                                >
                                    {errorMessage}
                                </p>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full rounded-xs bg-yellow-300 px-4 py-3.5 text-sm font-medium text-black transition hover:bg-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {loading
                                    ? "Please wait..."
                                    : otpSent
                                        ? "Verify OTP & Login"
                                        : "Send OTP"}
                            </button>
                        </form>

                        <p className="mt-7 text-center text-sm text-gray-600 dark:text-gray-400">
                            Don't have an account?{" "}
                            <Link
                                to="/signup"
                                className="font-semibold text-black hover:underline dark:text-white"
                            >
                                Sign Up
                            </Link>
                        </p>
                    </div>
                </section>
            </div>
        </main>
    );
};

export default Login;