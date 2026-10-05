
import React from "react"

const Signup = () => {
    return (
        <div className="min-h-screen bg-slate-100 px-4 flex items-center justify-center">

            <form className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">

                {/* Heading */}
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-bold text-slate-900">
                        Create an account
                    </h1>

                    <p className="mt-2 text-sm text-slate-500">
                        Sign up to get started with RentGuard
                    </p>
                </div>

                {/* Form fields */}
                <div className="space-y-5">

                    {/* Username */}
                    <div>
                        <label
                            htmlFor="name"
                            className="mb-2 block text-sm font-medium text-slate-700"
                        >
                            Username
                        </label>

                        <input
                            id="name"
                            type="text"
                            name="name"
                            required
                            placeholder="Enter your username"
                            className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/20"
                        />
                    </div>

                    {/* Email */}
                    <div>
                        <label
                            htmlFor="email"
                            className="mb-2 block text-sm font-medium text-slate-700"
                        >
                            Email
                        </label>

                        <input
                            id="email"
                            type="email"
                            name="email"
                            required
                            placeholder="Enter your email"
                            className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/20"
                        />
                    </div>

                    {/* Password */}
                    <div>
                        <label
                            htmlFor="password"
                            className="mb-2 block text-sm font-medium text-slate-700"
                        >
                            Password
                        </label>

                        <input
                            id="password"
                            type="password"
                            name="password"
                            required
                            placeholder="Enter your password"
                            className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/20"
                        />
                    </div>

                    {/* Phone */}
                    <div>
                        <label
                            htmlFor="phone"
                            className="mb-2 block text-sm font-medium text-slate-700"
                        >
                            Phone
                        </label>

                        <input
                            id="phone"
                            type="tel"
                            name="phone"
                            required
                            placeholder="Enter your phone number"
                            className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/20"
                        />
                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        className="w-full rounded-lg bg-slate-900 px-4 py-3 font-semibold text-white transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2"
                    >
                        Create account
                    </button>

                </div>

                {/* Login link */}
                <p className="mt-6 text-center text-sm text-slate-500">
                    Already have an account?{" "}
                    <a
                        href="#"
                        className="font-semibold text-slate-900 hover:underline"
                    >
                        Sign in
                    </a>
                </p>

            </form>
        </div>
    )
}

export default Signup
