import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { FiMail } from "react-icons/fi";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";

import PasswordInput from "../components/PasswordInput";
import Button from "../components/Button";

import { loginUserThunk } from "../redux/slices/authSlice";

function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { loading, isAuthenticated } = useSelector((state) => state.auth);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Extract clean DRF error messages
  const getErrorMessage = (payload) => {
    if (!payload) {
      return "Invalid credentials. Please try again.";
    }

    if (typeof payload === "string") {
      return payload;
    }

    if (
      Array.isArray(payload?.non_field_errors) &&
      payload.non_field_errors.length > 0
    ) {
      return payload.non_field_errors[0];
    }

    if (payload?.detail) {
      return payload.detail;
    }

    if (payload?.email) {
      return Array.isArray(payload.email) ? payload.email[0] : payload.email;
    }

    if (payload?.password) {
      return Array.isArray(payload.password)
        ? payload.password[0]
        : payload.password;
    }

    return "Login failed. Please check your credentials.";
  };

  const onSubmit = async (data) => {
    const result = await dispatch(loginUserThunk(data));

    if (loginUserThunk.fulfilled.match(result)) {
      toast.success("Welcome Back!");
      navigate("/dashboard");
    } else {
      const errorMsg = getErrorMessage(result.payload);
      toast.error(errorMsg);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-indigo-900 via-slate-900 to-black p-4 sm:p-6">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl bg-white/10 shadow-2xl backdrop-blur-xl lg:grid-cols-2">
        {/* LEFT PANEL */}
        <div className="hidden flex-col justify-between bg-linear-to-br from-indigo-600 via-indigo-700 to-purple-800 p-10 text-white lg:flex lg:p-14">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">
              Athlete Mental Wellness
            </h1>

            <p className="mt-6 text-base leading-relaxed opacity-90">
              Helping athletes improve their mental health, manage stress,
              connect with counselors, and track their emotional wellness.
            </p>
          </div>

          <div className="mt-8 flex items-center justify-center">
            <img
              src="https://illustrations.popsy.co/white/work-from-home.svg"
              alt="Mental Wellness Illustration"
              className="max-h-72 w-auto object-contain"
            />
          </div>
        </div>

        {/* RIGHT PANEL - FORM */}
        <div className="bg-white p-8 sm:p-12 md:p-14 dark:bg-slate-900">
          <div className="mb-8 text-center lg:text-left">
            <h2 className="text-3xl font-extrabold text-slate-800 dark:text-white sm:text-4xl">
              Welcome Back
            </h2>

            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Login to continue your wellness journey
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* EMAIL FIELD */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Email Address
              </label>

              <div className="relative mt-2">
                <FiMail
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  size={18}
                />

                <input
                  type="email"
                  {...register("email", {
                    required: "Email is required",
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: "Invalid email address",
                    },
                  })}
                  placeholder="Enter email"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-200 dark:border-slate-800 dark:bg-slate-950 dark:text-white dark:focus:border-indigo-500 dark:focus:ring-indigo-900/40"
                />
              </div>

              {errors.email && (
                <p className="mt-1.5 text-xs font-semibold text-red-500">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* PASSWORD FIELD */}
            <div>
              <PasswordInput
                label="Password"
                placeholder="Enter password"
                error={errors.password?.message}
                {...register("password", {
                  required: "Password is required",
                })}
              />
            </div>

            {/* REMEMBER & FORGOT */}
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <label className="flex cursor-pointer items-center gap-2 font-medium text-slate-600 dark:text-slate-400">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                Remember Me
              </label>

              <Link
                to="/forgot-password"
                className="font-semibold text-indigo-600 hover:text-indigo-700 hover:underline dark:text-indigo-400"
              >
                Forgot Password?
              </Link>
            </div>

            {/* SUBMIT BUTTON */}
            <Button type="submit" loading={loading} className="w-full">
              Login
            </Button>
          </form>

          {/* REGISTER LINK */}
          <div className="mt-8 text-center text-sm text-slate-600 dark:text-slate-400">
            <span>Don't have an account?</span>

            <Link
              to="/register"
              className="ml-2 font-bold text-indigo-600 hover:underline dark:text-indigo-400"
            >
              Register
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
