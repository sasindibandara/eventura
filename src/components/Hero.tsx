import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Hero = () => {
  return (
    <div className="relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1611974789855-9c2a0a7236ad?ixlib=rb-4.0.3&auto=format&fit=crop&w=1350&q=80')] bg-cover bg-center opacity-50"></div>
      <div className="absolute inset-0">
        <svg className="absolute right-0 top-0 h-full w-48 text-white transform translate-x-1/2" fill="currentColor" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <polygon points="50,0 100,0 50,100 0,100" />
        </svg>
      </div>
      <div className="relative pt-16 pb-20 sm:pt-24 sm:pb-28 lg:pt-32 lg:pb-36">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="sm:text-center lg:text-left rounded-3xl bg-white bg-opacity-10 p-6 shadow-lg">
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl">
              <span className="block xl:inline">Follow the</span>{" "}
              <span className="block text-blue-400 xl:inline">top traders</span>
            </h1>
            <p className="mt-3 text-base text-gray-200 sm:mx-auto sm:mt-5 sm:max-w-xl sm:text-lg md:mt-5 md:text-xl lg:mx-0">
              See which stocks and assets they buy and sell in real time.
            </p>
            <div className="mt-8 sm:flex sm:justify-center lg:justify-start">
              <div className="rounded-md shadow">
                <Button asChild size="lg" className="w-full sm:w-auto bg-blue-500 hover:bg-blue-600 text-white">
                  <Link to="/signup">Sign up →</Link>
                </Button>
              </div>
              <div className="mt-3 sm:mt-0 sm:ml-3">
                <Button asChild variant="outline" size="lg" className="w-full sm:w-auto bg-white/10 text-white border-white/20 hover:bg-white/20">
                  <Link to="/app">Open app →</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0">
        <div className="wave">
          <svg data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none" className="h-20 w-full opacity-10">
            <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" className="fill-white"></path>
          </svg>
        </div>
      </div>
    </div>
  );
};

export default Hero;