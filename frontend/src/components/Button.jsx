function Button({
  children,
  type = "button",
  onClick,
  loading = false,
  className = "",
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={loading}
      className={`w-full rounded-xl bg-indigo-600 py-3 text-white font-semibold transition-all duration-300 hover:bg-indigo-700 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-70 ${className}`}
    >
      {loading ? "Please wait..." : children}
    </button>
  );
}

export default Button;