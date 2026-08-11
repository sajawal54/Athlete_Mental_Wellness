import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { FiMail } from "react-icons/fi";
import toast from "react-hot-toast";

import Button from "../components/Button";
import { forgotPassword } from "../services/authService";

function ForgotPassword() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm();

  const onSubmit = async (data) => {
    try {
      const response = await forgotPassword(data.email);
      toast.success(
        response?.detail || response?.message || "Reset link sent to your email!"
      );
      reset(); // Resets input field after successful submit
    } catch (error) {
      console.error("Forgot Password Error:", error);
      toast.error(
        error.response?.data?.detail ||
          error.response?.data?.message ||
          "Something went wrong. Please try again."
      );
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-indigo-900 via-slate-900 to-black p-6">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl sm:p-10">
        <h1 className="text-3xl font-bold text-center text-slate-900">
          Forgot Password
        </h1>

        <p className="mt-3 text-center text-sm text-gray-500">
          Enter your registered email to receive a password reset link.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-6">
          <div>
            <label className="text-sm font-semibold text-gray-700">
              Email Address
            </label>

            <div className="relative mt-2">
              <FiMail
                className="absolute left-4 top-3.5 text-gray-400"
                size={20}
              />

              <input
                type="email"
                placeholder="Enter Email"
                className={`w-full rounded-xl border py-3 pl-12 pr-4 outline-none transition focus:ring-2 ${
                  errors.email
                    ? "border-red-500 focus:border-red-500 focus:ring-red-200"
                    : "border-gray-300 focus:border-indigo-500 focus:ring-indigo-300"
                }`}
                {...register("email", {
                  required: "Email is required",
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: "Enter a valid email address",
                  },
                })}
              />
            </div>

            {errors.email && (
              <p className="mt-2 text-xs font-medium text-red-500">
                {errors.email.message}
              </p>
            )}
          </div>

          <Button type="submit" loading={isSubmitting} className="w-full">
            Send Reset Link
          </Button>
        </form>

        <div className="mt-8 text-center">
          <Link
            to="/login"
            className="text-sm font-semibold text-indigo-600 transition hover:text-indigo-800 hover:underline"
          >
            ← Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;