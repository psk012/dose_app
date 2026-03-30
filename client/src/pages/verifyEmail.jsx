import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { verifyEmail } from "../api/api";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState("loading"); // loading, success, error
  const [message, setMessage] = useState("Verifying your email...");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("No verification token provided. Invalid link.");
      return;
    }

    verifyEmail(token)
      .then((res) => {
        setStatus("success");
        setMessage(res.message || "Email verified successfully!");
      })
      .catch((err) => {
        setStatus("error");
        setMessage(err.message || "Failed to verify email. The link may have expired.");
      });
  }, [token]);

  return (
    <div className="min-h-screen bg-[#FDF9F1] flex flex-col items-center justify-center p-6 text-center">
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-[#E8DFD8] max-w-md w-full">
        {status === "loading" && (
          <div className="flex flex-col items-center">
            <Loader2 className="h-12 w-12 text-[#B49E92] animate-spin mb-4" />
            <h2 className="text-2xl font-serif text-[#4A3B32]">Verifying Email</h2>
            <p className="text-[#8C7A6B] mt-2">{message}</p>
          </div>
        )}

        {status === "success" && (
          <div className="flex flex-col items-center">
            <CheckCircle className="h-12 w-12 text-[#8DB584] mb-4" />
            <h2 className="text-2xl font-serif text-[#4A3B32]">Account Verified!</h2>
            <p className="text-[#8C7A6B] mt-2">{message}</p>
            <Link
              to="/login"
              className="mt-6 inline-flex items-center justify-center w-full bg-[#F5E6E6] text-[#4A3B32] font-medium py-3 rounded-full hover:bg-[#EBD6D6] transition-colors"
            >
              Go to Login
            </Link>
          </div>
        )}

        {status === "error" && (
          <div className="flex flex-col items-center">
            <XCircle className="h-12 w-12 text-[#D98A8A] mb-4" />
            <h2 className="text-2xl font-serif text-[#4A3B32]">Verification Failed</h2>
            <p className="text-[#8C7A6B] mt-2">{message}</p>
            <Link
              to="/signup"
              className="mt-6 inline-flex items-center justify-center w-full bg-[#F5E6E6] text-[#4A3B32] font-medium py-3 rounded-full hover:bg-[#EBD6D6] transition-colors"
            >
              Return to Signup
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
