  import { forwardRef, useState } from "react";
  import { FiEye, FiEyeOff, FiLock } from "react-icons/fi";

  const PasswordInput = forwardRef(
    (
      {
        label,
        placeholder = "Enter Password",
        error,
        ...props
      },
      ref
    ) => {
      const [showPassword, setShowPassword] = useState(false);

      return (
        <div>
          <label className="block mb-2 font-semibold text-gray-700">
            {label}
          </label>

          <div className="relative">

            <FiLock
              className="absolute left-4 top-4 text-gray-400"
              size={20}
            />

            <input
              ref={ref}
              type={showPassword ? "text" : "password"}
              placeholder={placeholder}
              {...props}
              className={`w-full rounded-xl border py-3 pl-12 pr-12 outline-none transition-all duration-300 focus:ring-2 focus:ring-indigo-400 ${
                error
                  ? "border-red-500"
                  : "border-gray-300 focus:border-indigo-500"
              }`}
            />

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-4 text-gray-500 hover:text-indigo-600"
            >
              {showPassword ? (
                <FiEyeOff size={20} />
              ) : (
                <FiEye size={20} />
              )}
            </button>

          </div>

          {error && (
            <p className="text-red-500 text-sm mt-2">
              {error}
            </p>
          )}
        </div>
      );
    }
  );

  PasswordInput.displayName = "PasswordInput";

  export default PasswordInput;