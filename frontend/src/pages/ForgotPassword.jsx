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

        formState: { errors, isSubmitting }

    } = useForm();

    const onSubmit = async (data) => {

        try {

            const response = await forgotPassword(data);

            toast.success(response.detail);

        }

        catch (error) {

            toast.error(

                error.response?.data?.detail ||

                "Something went wrong."

            );

        }

    };

    return (

        <div className="min-h-screen bg-linear-to-br from-indigo-900 via-slate-900 to-black flex items-center justify-center p-6">

            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-10">

                <h1 className="text-3xl font-bold text-center">

                    Forgot Password

                </h1>

                <p className="text-gray-500 mt-3 text-center">

                    Enter your registered email to receive a password reset link.

                </p>

                <form

                    onSubmit={handleSubmit(onSubmit)}

                    className="mt-8 space-y-6"

                >

                    <div>

                        <label className="font-semibold">

                            Email Address

                        </label>

                        <div className="relative mt-2">

                            <FiMail
                                className="absolute left-4 top-4 text-gray-400"
                                size={20}
                            />

                            <input

                                type="email"

                                placeholder="Enter Email"

                                className="w-full border rounded-xl py-3 pl-12 pr-4 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-300"

                                {...register("email", {

                                    required: "Email is required",

                                    pattern: {

                                        value:

                                            /^[^\s@]+@[^\s@]+\.[^\s@]+$/,

                                        message: "Enter a valid email"

                                    }

                                })}

                            />

                        </div>

                        <p className="text-red-500 text-sm mt-2">

                            {errors.email?.message}

                        </p>

                    </div>

                    <Button

                        type="submit"

                        loading={isSubmitting}

                    >

                        Send Reset Link

                    </Button>

                </form>

                <div className="text-center mt-8">

                    <Link

                        to="/login"

                        className="text-indigo-600 hover:underline"

                    >

                        ← Back to Login

                    </Link>

                </div>

            </div>

        </div>

    );

}

export default ForgotPassword;