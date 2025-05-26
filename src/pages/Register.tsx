import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AuthForm from "@/components/AuthForm";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";

const Register = () => {
  const navigate = useNavigate();
  const { authState } = useAuth();
  const { isAuthenticated } = authState;

  useEffect(() => {
    document.title = "Register | Eventura";
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, navigate]);

  const handleSuccess = () => {
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
        <div className="relative flex w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-xl">
          {/* Left Section */}
          <div className="relative hidden w-1/2 flex-col items-center justify-center bg-gradient-to-br from-[#5A67D8] to-[#4A55A2] p-10 text-white lg:flex">
            {/* Add background pattern/image here if needed */}
            {/* Abstract video loop background */}
            <video
              autoPlay
              loop
              muted
              playsInline
              className="absolute inset-0 w-full h-full object-cover opacity-50"
            >
              {/* Replace with your video source */}
              {/* <source src="/path/to/your/abstract-video.mp4" type="video/mp4" /> */}
              {/* Add other source types for broader browser support */}
            </video>
            <div className="z-10 text-center space-y-4">
              <p className="text-lg font-semibold">You can easily</p>
              <h2 className="text-4xl font-bold leading-tight">Speed up your work<br />with our Web App</h2>
            </div>
            {/* Optional: Add partner icons/text here */}
            {/* <div className="absolute bottom-10 left-10 z-10 text-sm text-gray-300">
              Our partners:
              <div className="flex gap-4 mt-2">
                <span>Discord</span>
                <span>Instagram</span>
                <span>Spotify</span>
                <span>YouTube</span>
                <span>TikTok</span>
              </div>
            </div> */}
          </div>

          {/* Right Section (Register Form) */}
          <div className="w-full lg:w-1/2 p-8 space-y-6">
            <div className="text-center">
              <h2 className="text-3xl font-bold tracking-tight text-gray-900">
                Get Started Now
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                Please register to create your account.
              </p>
            </div>

            <AuthForm type="register" onSuccess={handleSuccess} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
