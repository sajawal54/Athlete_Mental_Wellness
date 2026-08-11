import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm, useWatch } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import { FiMail, FiUser } from "react-icons/fi";

import PasswordInput from "../components/PasswordInput";
import Button from "../components/Button";

import { registerUserThunk } from "../redux/slices/authSlice";

function Register() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { loading, isAuthenticated } = useSelector((state) => state.auth);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm({
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      is_counselor: "false",
      terms: false,
    },
  });

  // useWatch is React Compiler friendly and avoids
  // the incompatible-library warning caused by watch().
  const password = useWatch({
    control,
    name: "password",
  });

  const selectedRole = useWatch({
    control,
    name: "is_counselor",
  });

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, navigate]);

  const onSubmit = async (formData) => {
    // Clone data to avoid mutating React Hook Form's data object.
    const payload = {
      ...formData,
      is_counselor: formData.is_counselor === "true",
    };

    delete payload.confirmPassword;
    delete payload.terms;

    const result = await dispatch(registerUserThunk(payload));

    if (registerUserThunk.fulfilled.match(result)) {
      toast.success("Registration successful!");
      navigate("/login");
    } else {
      const errorMessage =
        result.payload?.detail ||
        result.payload?.message ||
        "Registration failed. Please try again.";

      toast.error(errorMessage);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-indigo-900 via-slate-900 to-black flex justify-center items-center p-6">
      <div className="grid lg:grid-cols-2 max-w-6xl w-full rounded-3xl overflow-hidden shadow-2xl bg-white">
        {/* LEFT SIDE */}
        <div className="hidden lg:flex bg-linear-to-br from-indigo-600 to-purple-700 text-white flex-col justify-center p-14">
          <h1 className="text-5xl font-bold">Athlete Mental Wellness</h1>

          <p className="mt-6 text-lg leading-8 opacity-90">
            Create your account and begin improving your mental wellness journey
            today.
          </p>

          <img
            className="mt-12 w-full max-w-sm mx-auto"
            src="https://illustrations.popsy.co/white/remote-work.svg"
            alt="Register illustration"
          />
        </div>

        {/* RIGHT SIDE */}
        <div className="p-10">
          <h2 className="text-4xl font-bold">Create Account</h2>

          <p className="text-gray-500 mt-2 mb-8">
            Join the Athlete Wellness Platform
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* USERNAME */}
            <div>
              <label className="font-semibold block mb-2">Username</label>

              <div className="relative">
                <FiUser className="absolute left-4 top-4 text-gray-400 z-10" />

                <input
                  {...register("username", {
                    required: "Username is required",
                    minLength: {
                      value: 3,
                      message: "Username must be at least 3 characters",
                    },
                  })}
                  className="w-full border rounded-xl py-3 pl-12 pr-4 outline-none focus:border-indigo-500 transition-colors"
                  placeholder="Enter Username"
                />
              </div>

              {errors.username && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.username.message}
                </p>
              )}
            </div>

            {/* EMAIL */}
            <div>
              <label className="font-semibold block mb-2">Email</label>

              <div className="relative">
                <FiMail className="absolute left-4 top-4 text-gray-400 z-10" />

                <input
                  type="email"
                  {...register("email", {
                    required: "Email is required",
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: "Invalid email address",
                    },
                  })}
                  className="w-full border rounded-xl py-3 pl-12 pr-4 outline-none focus:border-indigo-500 transition-colors"
                  placeholder="Enter Email"
                />
              </div>

              {errors.email && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* PASSWORD */}
            <PasswordInput
              label="Password"
              error={errors.password?.message}
              {...register("password", {
                required: "Password is required",
                minLength: {
                  value: 8,
                  message: "Minimum 8 characters required",
                },
              })}
            />

            {/* CONFIRM PASSWORD */}
            <PasswordInput
              label="Confirm Password"
              error={errors.confirmPassword?.message}
              {...register("confirmPassword", {
                required: "Confirm Password is required",
                validate: (value) =>
                  value === password || "Passwords do not match",
              })}
            />

            {/* ROLE SELECTION */}
            <div>
              <label className="font-semibold block mb-3">Select Role</label>

              <div className="grid grid-cols-2 gap-4">
                <label
                  className={`border rounded-xl p-4 cursor-pointer transition-all flex items-center ${
                    selectedRole === "false"
                      ? "border-indigo-600 bg-indigo-50/50 text-indigo-900 font-medium"
                      : "border-gray-200 hover:border-indigo-400"
                  }`}
                >
                  <input
                    type="radio"
                    value="false"
                    {...register("is_counselor")}
                    className="mr-2 accent-indigo-600"
                  />
                  Athlete
                </label>

                <label
                  className={`border rounded-xl p-4 cursor-pointer transition-all flex items-center ${
                    selectedRole === "true"
                      ? "border-indigo-600 bg-indigo-50/50 text-indigo-900 font-medium"
                      : "border-gray-200 hover:border-indigo-400"
                  }`}
                >
                  <input
                    type="radio"
                    value="true"
                    {...register("is_counselor")}
                    className="mr-2 accent-indigo-600"
                  />
                  Counselor
                </label>
              </div>
            </div>

            {/* TERMS & CONDITIONS */}
            <div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="terms"
                  {...register("terms", {
                    required: "You must accept the Terms & Conditions",
                  })}
                  className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer accent-indigo-600"
                />

                <label
                  htmlFor="terms"
                  className="text-sm select-none cursor-pointer"
                >
                  I agree to{" "}
                  <span className="text-indigo-600 font-medium">
                    Terms & Conditions
                  </span>
                </label>
              </div>

              {errors.terms && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.terms.message}
                </p>
              )}
            </div>

            {/* SUBMIT BUTTON */}
            <Button loading={loading} type="submit">
              Create Account
            </Button>
          </form>

          <div className="text-center mt-8 text-sm text-gray-600">
            Already have an account?
            <Link
              to="/login"
              className="text-indigo-600 ml-2 font-semibold hover:underline"
            >
              Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;
