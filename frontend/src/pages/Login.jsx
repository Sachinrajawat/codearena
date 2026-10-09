import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router";
import { loginUser, clearError } from "../authSlice";

const loginSchema = z.object({
  emailId: z.string().email("Please enter a valid email address"),
  // Login only needs a non-empty password; the strength rules apply at signup
  password: z.string().min(1, "Password is required"),
});

function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const dispatch = useDispatch();

  const { error } = useSelector((state) => state.auth);

  // Don't show an error left over from another page (for example a failed signup)
  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
  });

  const submittedData = async (data) => {
    // Failures are stored in Redux and shown in the red box above the form.
    // On success, isAuthenticated becomes true and App.jsx redirects to "/".
    await dispatch(loginUser(data));
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Welcome Back</h1>
          <p className="text-gray-500 mt-2">Login to your account</p>
        </div>

        {/* Global Backend Error Display */}
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(submittedData)} className="space-y-5">
          {/* Email */}
          <div>
            <label htmlFor="emailId" className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              id="emailId"
              type="email"
              placeholder="Enter your email"
              {...register("emailId")}
              className={`w-full px-4 py-3 rounded-lg border outline-none transition text-black
                ${
                  errors.emailId
                    ? "border-red-500 focus:ring-2 focus:ring-red-200"
                    : "border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                }
                placeholder:text-gray-300
              `}
            />
            {errors.emailId && (
              <p className="text-red-500 text-sm mt-1">{errors.emailId.message}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                {...register("password")}
                className={`w-full px-4 py-3 pr-20 rounded-lg border outline-none transition text-black
                  ${
                    errors.password
                      ? "border-red-500 focus:ring-2 focus:ring-red-200"
                      : "border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  }
                  placeholder:text-gray-300
                `}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-blue-600 hover:text-blue-800"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            {errors.password && (
              <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
            )}
          </div>

          {/* Forgot Password */}
          <div className="text-right">
            <button type="button" className="text-sm text-blue-600 hover:underline">
              Forgot Password?
            </button>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400
                       text-white font-semibold py-3 rounded-lg
                       transition duration-200 cursor-pointer"
          >
            {isSubmitting ? "Logging in..." : "Login"}
          </button>
        </form>

        {/* Signup */}
        <p className="text-center text-sm text-gray-500 mt-6">
          Don't have an account?{" "}
          <Link to="/signup" className="text-blue-600 font-medium hover:underline">
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Login;