import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { FiUser } from "react-icons/fi";
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
  } = useForm();

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard");
    }
  }, [isAuthenticated]);

  const onSubmit = async (data) => {
    const result = await dispatch(loginUserThunk(data));

    if (loginUserThunk.fulfilled.match(result)) {
      toast.success("Welcome Back!");
      navigate("/dashboard");
    } else {
      // Single error message fallback
      const errorMsg = result.payload?.non_field_errors?.[0] || result.payload?.detail || "Invalid Credentials";
      toast.error(errorMsg);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-indigo-900 via-slate-900 to-black flex items-center justify-center p-6">
      <div className="grid lg:grid-cols-2 bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden w-full max-w-6xl">
        {/* LEFT */}
        <div className="hidden lg:flex flex-col justify-center p-14 text-white bg-linear-to-br from-indigo-600 to-purple-700">
          <h1 className="text-5xl font-bold mb-6">Athlete Mental Wellness</h1>
          <p className="text-lg leading-8 opacity-90">
            Helping athletes improve their mental health, manage stress, connect
            with counselors, and track their emotional wellness.
          </p>
          <div className="mt-12">
            <img
              src="https://illustrations.popsy.co/white/work-from-home.svg"
              alt="illustration"
              className="w-full"
            />
          </div>
        </div>

        {/* RIGHT */}
        <div className="bg-white p-10 md:p-14">
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold text-gray-800">Welcome Back</h2>
            <p className="text-gray-500 mt-3">Login to continue your journey</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="font-semibold text-gray-700">Email</label>
              <div className="relative mt-2">
                <FiUser
                  className="absolute left-4 top-4 text-gray-400"
                  size={20}
                />
                <input
                  {...register("email", {
                    required: "Email is required",
                  })}
                  placeholder="Enter Email"
                  className="w-full rounded-xl border border-gray-300 py-3 pl-12 pr-4 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-300 outline-none"
                />
              </div>
              <p className="text-red-500 text-sm mt-1">
                {errors.email?.message}
              </p>
            </div>

            <div>
              <PasswordInput
                label="Password"
                placeholder="Enter Password"
                error={errors.password?.message}
                {...register("password", {
                  required: "Password is required",
                })}
              />
            </div>

            <div className="flex justify-between items-center">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                Remember Me
              </label>

              <Link
                to="/forgot-password"
                className="text-indigo-600 hover:underline"
              >
                Forgot Password?
              </Link>
            </div>

            <Button type="submit" loading={loading}>
              Login
            </Button>
          </form>

          <div className="text-center mt-8">
            <p className="text-gray-600">
              Don't have an account?
              <Link
                to="/register"
                className="ml-2 font-semibold text-indigo-600 hover:underline"
              >
                Register
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;