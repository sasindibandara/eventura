import { useEffect } from "react";
import Navbar from "@/components/Navbar";
// import Hero from "@/components/Hero"; // Remove the old Hero import
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
// import { Input } from "@/components/ui/input"; // Input no longer needed for this hero style
import { CalendarDays, Clock,  Search, Users, ArrowRight } from 'lucide-react'; // Import icons used in the hero section

const Index = () => {
  useEffect(() => {
    document.title = "Eventura - Connect with Event Professionals";
  }, []);

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      
      {/* Hero Section from HomePage component */}


      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className=" rounded-2xl text-white" >
        <div className="m-4 p-8 rounded-2xl bg-[url('/ABSS.jpg')] text-white bg-black bg-cover bg-center bg-no-repeat">
          <div className="max-w-xl mb-16">
            <h1 className="text-5xl font-bold leading-tight">Your Event, Perfectly Planned.</h1>
            <p className="mt-4 text-white">
              Your one-stop platform for event planning and service management.
              Connect with professional vendors and create unforgettable events.
            </p>
          </div>
          <div className="mt-8 flex ju gap-4">
            <Link
                to="/register"
                className="px-6 py-3 bg-white text-purple-900 rounded-full font-medium hover:bg-purple-50 transition-all shadow-sm"
            >
              Get Started
            </Link>
            {/*<Link
                to="/learn-more"
                className="px-6 py-3 border border-white rounded-full text-white hover:bg-purple-800 transition-all"
            >
              Learn More
            </Link>*/}
          </div>
        </div>
      </div>
      </div>

      {/* The rest of the original Index.tsx content (CTA and simplified Footer) remains below */}

     
    </div>
  );
};

export default Index;
