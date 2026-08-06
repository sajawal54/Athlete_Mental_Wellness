import { useForm } from "react-hook-form";
import { useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";

import PasswordInput from "../components/PasswordInput";
import Button from "../components/Button";

import { resetPassword } from "../services/authService";

function ResetPassword() {
  const navigate = useNavigate();

  const [searchParams] = useSearchParams();

  const uid = searchParams.get("uid");

  const token = searchParams.get("token");

  const {
    register,

    handleSubmit,

    watch,

    formState: { errors, isSubmitting },
  } = useForm();

  const password = watch("password");

  const onSubmit = async (data) => {
    try {
      await resetPassword({
        uid,

        token,

        new_password: data.password,
      });

      toast.success("Password changed successfully.");

      navigate("/login");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Reset password failed.");
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-indigo-900 via-slate-900 to-black flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-10">
        <h1 className="text-3xl font-bold text-center">Reset Password</h1>

        <p className="text-gray-500 mt-3 text-center">
          Enter your new password below.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-8">
          <PasswordInput
            label="New Password"
            error={errors.password?.message}
            {...register("password", {
              required: "Password is required",

              minLength: {
                value: 8,

                message: "Minimum 8 characters",
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
      </div>
    </div>
  );
}

export default ResetPassword;
