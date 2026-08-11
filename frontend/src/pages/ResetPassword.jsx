import { useForm, useWatch } from "react-hook-form";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { FiAlertCircle } from "react-icons/fi";

import PasswordInput from "../components/PasswordInput";
import Button from "../components/Button";

import { resetPassword } from "../services/authService";

function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const uid = searchParams.get("uid");
  const token = searchParams.get("token");

  const isLinkInvalid = !uid || !token;

  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  // useWatch is React Compiler friendly and avoids
  // the incompatible-library warning caused by watch().
  const password = useWatch({
    control,
    name: "password",
  });

  const onSubmit = async (data) => {
    if (isLinkInvalid) {
      toast.error("Invalid reset link. Please request a new one.");
      return;
    }

    try {
      await resetPassword({
        uid,
        token,
        new_password: data.password,
      });

      toast.success("Password changed successfully.");
      navigate("/login");
    } catch (error) {
      const responseData = error.response?.data;

      // Handle different DRF error response formats.
      let errorMessage = "Reset password failed. Please try again.";

      if (typeof responseData === "string") {
        errorMessage = responseData;
      } else if (responseData?.detail) {
        errorMessage = responseData.detail;
      } else if (responseData?.non_field_errors?.[0]) {
        errorMessage = responseData.non_field_errors[0];
      } else if (responseData?.new_password?.[0]) {
        errorMessage = responseData.new_password[0];
      }

      toast.error(errorMessage);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-indigo-900 via-slate-900 to-black flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-10">
        <h1 className="text-3xl font-bold text-center text-gray-900">
          Reset Password
        </h1>

        <p className="text-gray-500 mt-3 text-center text-sm">
          Enter your new password below to regain access to your account.
        </p>

        {isLinkInvalid ? (
          <div className="mt-8 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-red-700">
            <FiAlertCircle className="w-5 h-5 mt-0.5 shrink-0 text-red-500" />

            <div className="text-sm">
              <p className="font-semibold">Invalid or missing reset token</p>

              <p className="mt-1">
                This reset link is incomplete or broken. Please request a new
                password reset link.
              </p>

              <Link
                to="/forgot-password"
                className="mt-3 inline-block font-semibold text-indigo-600 hover:underline"
              >
                Request new link &rarr;
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-8">
            <PasswordInput
              label="New Password"
              error={errors.password?.message}
              {...register("password", {
                required: "Password is required",
                minLength: {
                  value: 8,
                  message: "Minimum 8 characters required",
                },
              })}
            />

            <PasswordInput
              label="Confirm Password"
              error={errors.confirmPassword?.message}
              {...register("confirmPassword", {
                required: "Confirm your password",
                validate: (value) =>
                  value === password || "Passwords do not match",
              })}
            />

            <Button type="submit" loading={isSubmitting}>
              Reset Password
            </Button>
          </form>
        )}

        <div className="text-center mt-8 text-sm text-gray-600">
          Remembered your password?
          <Link
            to="/login"
            className="text-indigo-600 ml-2 font-semibold hover:underline"
          >
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}

export default ResetPassword;
