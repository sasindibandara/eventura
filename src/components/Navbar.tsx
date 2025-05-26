import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAuth } from "@/context/AuthContext";
import NotificationDropdown from "./NotificationDropdown";

const Navbar = () => {
  const { authState, logout } = useAuth();
  const { isAuthenticated, user } = authState;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link to="/" className="text-eventura-800 font-bold text-black text-xl flex items-center gap-2">
                <img src="/public/ABSS.jpg" alt="Eventura Logo" className="h-6 w-6 rounded-full object-cover" />
                Eventura
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link
                to="/"
                className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
              >
                Home
              </Link>
              {isAuthenticated && (
                <Link
                  to="/dashboard"
                  className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  Dashboard
                </Link>
              )}
              {authState.user?.role === "PROVIDER" && (
                <Link
                  to="/ongoing-work"
                  className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  Ongoing Work
                </Link>
              )}
            </div>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            <div className="flex items-center gap-4">
              <NotificationDropdown />
            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-700">
                  Hello, {user?.firstName}
                </span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <span className="sr-only">Open user menu</span>
                      <div className="h-8 w-8 rounded-full bg-eventura-100 flex items-center justify-center text-eventura-700">
                        {user?.firstName.charAt(0)}
                        {user?.lastName.charAt(0)}
                      </div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link to="/dashboard">Dashboard</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/profile">Profile</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={logout}>
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <div className="flex space-x-4">
                <Button variant="ghost" asChild>
                  <Link to="/login">Login</Link>
                </Button>
                <Button asChild>
                  <Link to="/register">Sign Up</Link>
                </Button>
              </div>
            )}
            </div>
          </div>
          <div className="flex items-center sm:hidden">
            <button
              type="button"
              className="bg-white p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-eventura-500"
              aria-controls="mobile-menu"
              aria-expanded="false"
              onClick={toggleMobileMenu}
            >
              <span className="sr-only">Open main menu</span>
              <svg
                className={`${mobileMenuOpen ? "hidden" : "block"} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
              <svg
                className={`${mobileMenuOpen ? "block" : "hidden"} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div
        className={`${
          mobileMenuOpen ? "block" : "hidden"
        } sm:hidden`}
        id="mobile-menu"
      >
        <div className="pt-2 pb-3 space-y-1">
          <Link
            to="/"
            className="bg-eventura-50 border-eventura-500 text-eventura-700 block pl-3 pr-4 py-2 border-l-4 text-base font-medium"
          >
            Home
          </Link>
          {isAuthenticated && (
            <Link
              to="/dashboard"
              className="border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800 block pl-3 pr-4 py-2 border-l-4 text-base font-medium"
            >
              Dashboard
            </Link>
          )}
        </div>
        <div className="pt-4 pb-3 border-t border-gray-200">
          {isAuthenticated ? (
            <div className="flex items-center px-4">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-full bg-eventura-100 flex items-center justify-center text-eventura-700">
                  {user?.firstName.charAt(0)}
                  {user?.lastName.charAt(0)}
                </div>
              </div>
              <div className="ml-3">
                <div className="text-base font-medium text-gray-800">
                  {user?.firstName} {user?.lastName}
                </div>
                <div className="text-sm font-medium text-gray-500">
                  {user?.email}
                </div>
              </div>
            </div>
            ) : null}
            <div className="mt-3 space-y-1">
              {isAuthenticated ? (
                <>
                  <Link
                    to="/dashboard"
                    className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/profile"
                    className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                  >
                    Profile
                  </Link>
                  <button
                    onClick={logout}
                    className="block w-full text-left px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <div className="flex flex-col space-y-2 px-4 py-2">
                  <Button variant="outline" asChild className="justify-center">
                    <Link to="/login">Login</Link>
                  </Button>
                  <Button asChild className="justify-center">
                    <Link to="/register">Sign Up</Link>
                  </Button>
                </div>
              )}
            </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
