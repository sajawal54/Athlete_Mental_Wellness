import { forwardRef, useState } from "react";
import { FiEye, FiEyeOff, FiLock } from "react-icons/fi";

const PasswordInput = forwardRef(
  (
    {
      label,
      placeholder = "Enter Password",
      error,
      className = "",
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false);

    return (
      <div className="w-full">
        {label && (
          <label className="block mb-2 text-xs font-semibold text-gray-700 dark:text-gray-300">
            {label}
          </label>
        )}

        <div className="relative flex items-center">
          <FiLock
            className="absolute left-4 text-gray-400 pointer-events-none"
            size={18}
          />

          <input
            ref={ref}
            type={showPassword ? "text" : "password"}
            placeholder={placeholder}
            {...props}
            className={`w-full rounded-xl border py-3 pl-11 pr-11 text-xs font-medium outline-none transition-all duration-200 focus:ring-2 ${
              error
                ? "border-red-500 focus:ring-red-200"
                : "border-gray-300 focus:border-indigo-500 focus:ring-indigo-100 dark:border-gray-700 dark:bg-slate-800 dark:text-white"
            } ${className}`}
          />

          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-4 text-gray-400 hover:text-indigo-600 transition-colors focus:outline-none"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
          </button>
        </div>

        {error && (
          <p className="text-red-500 text-xs mt-1.5 font-medium">
            {error}
          </p>
        )}
      </div>
    );
  }
);

PasswordInput.displayName = "PasswordInput";

export default PasswordInput;