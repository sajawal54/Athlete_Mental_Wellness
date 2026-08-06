import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import { FiMail, FiUser, FiCheckCircle } from "react-icons/fi";

import InputField from "../components/InputField";
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
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      is_counselor: false,
      terms: false,
    },
  });

  const password = watch("password");

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard");
    }
  }, [isAuthenticated]);

  const onSubmit = async (data) => {
    data.is_counselor = data.is_counselor === "true";
    delete data.confirmPassword;
    delete data.terms; // Backend ko terms ki zaroorat nahi hoti

    const result = await dispatch(registerUserThunk(data));

    if (registerUserThunk.fulfilled.match(result)) {
      toast.success("Registration Successful");
      navigate("/login");
    } else {
      toast.error("Registration Failed");
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-indigo-900 via-slate-900 to-black flex justify-center items-center p-6">
      <div className="grid lg:grid-cols-2 max-w-6xl w-full rounded-3xl overflow-hidden shadow-2xl bg-white">
        {/* LEFT */}
        <div className="hidden lg:flex bg-linear-to-br from-indigo-600 to-purple-700 text-white flex-col justify-center p-14">
          <h1 className="text-5xl font-bold">Athlete Mental Wellness</h1>
          <p className="mt-6 text-lg leading-8 opacity-90">
            Create your account and begin improving your mental wellness journey today.
          </p>
          <img
            className="mt-12"
            src="https://illustrations.popsy.co/white/remote-work.svg"
            alt="register"
          />
        </div>

        {/* RIGHT */}
        <div className="p-10">
          <h2 className="text-4xl font-bold">Create Account</h2>
          <p className="text-gray-500 mt-2 mb-8">
            Join the Athlete Wellness Platform
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="font-semibold">Username</label>
              <div className="relative mt-2">
                <FiUser className="absolute left-4 top-4 text-gray-400" />
                <input
                  {...register("username", {
                    required: "Username is required",
                  })}
                  className="w-full border rounded-xl py-3 pl-12 pr-4 outline-none focus:border-indigo-500"
                  placeholder="Enter Username"
                />
              </div>
              <p className="text-red-500 text-sm mt-1">{errors.username?.message}</p>
            </div>

            <div>
              <label className="font-semibold">Email</label>
              <div className="relative mt-2">
                <FiMail className="absolute left-4 top-4 text-gray-400" />
                <input
                  {...register("email", {
                    required: "Email is required",
                  })}
                  className="w-full border rounded-xl py-3 pl-12 pr-4 outline-none focus:border-indigo-500"
                  placeholder="Enter Email"
                />
              </div>
              <p className="text-red-500 text-sm mt-1">{errors.email?.message}</p>
            </div>

            <PasswordInput
              label="Password"
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
                required: "Confirm Password is required",
                validate: (value) =>
                  value === password || "Passwords do not match",
              })}
            />

            {/* ROLE */}
            <div>
              <label className="font-semibold block mb-3">Select Role</label>
              <div className="grid grid-cols-2 gap-4">
                <label className="border rounded-xl p-4 cursor-pointer hover:border-indigo-500">
                  <input
                    type="radio"
                    value="false"
                    {...register("is_counselor")}
                    className="mr-2"
                  />
                  Athlete
                </label>
                <label className="border rounded-xl p-4 cursor-pointer hover:border-indigo-500">
                  <input
                    type="radio"
                    value="true"
                    {...register("is_counselor")}
                    className="mr-2"
                  />
                  Counselor
                </label>
              </div>
            </div>

            {/* TERMS & CONDITIONS CHECKBOX */}
            <div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="terms"
                  {...register("terms", {
                    required: "You must accept the Terms & Conditions",
                  })}
                  className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
                <label htmlFor="terms" className="text-sm select-none cursor-pointer">
                  I agree to <span className="text-indigo-600 font-medium">Terms & Conditions</span>
                </label>
              </div>
              <p className="text-red-500 text-sm mt-1">{errors.terms?.message}</p>
            </div>

            <Button loading={loading} type="submit">
              Create Account
            </Button>
          </form>

          <div className="text-center mt-8">
            Already have an account?
            <Link to="/login" className="text-indigo-600 ml-2 font-semibold">
              Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;