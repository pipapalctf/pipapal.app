import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import Logo from "@/components/logo";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";

export default function PublicNavbar() {
  const [, setLocation] = useLocation();
  const { user, isLoading } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [location] = useLocation();

  // Handle scroll effect for navbar
  useEffect(() => {
    const handleScroll = () => {
      const offset = window.scrollY;
      if (offset > 80) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Redirect to dashboard if user is already logged in
  useEffect(() => {
    if (user && !isLoading) {
      setLocation("/dashboard");
    }
  }, [user, isLoading, setLocation]);

  return (
    <>
      <header className={`fixed top-0 left-0 right-0 w-full px-4 md:px-8 border-b border-gray-100 shadow-xl bg-white z-50 transition-all duration-300 ${scrolled ? 'py-3' : 'py-5'}`}>
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center">
            <Link href="/">
              <div className="flex items-center cursor-pointer">
                <Logo size={scrolled ? "sm" : "md"} />
                <div className="ml-2">
                  <span className={`font-montserrat font-bold text-secondary transition-all duration-300 ${scrolled ? 'text-xl' : 'text-2xl'}`}>
                    PipaPal
                  </span>
                  <span className={`hidden md:inline-block ml-2 text-primary text-xs transition-all duration-300 ${scrolled ? 'opacity-0' : 'opacity-100'}`}>
                    Your Waste Buddy
                  </span>
                </div>
              </div>
            </Link>
          </div>

          <div className="hidden md:flex items-center space-x-6">
            <Link href="/" className={`transition-colors font-medium ${location === '/' ? 'text-primary' : 'text-secondary hover:text-primary'}`}>
              Home
            </Link>
            <Link href="/about" className={`transition-colors font-medium ${location === '/about' ? 'text-primary' : 'text-secondary hover:text-primary'}`}>
              About Us
            </Link>
            <Link href="/mission" className={`transition-colors font-medium ${location === '/mission' ? 'text-primary' : 'text-secondary hover:text-primary'}`}>
              Our Mission
            </Link>
          </div>
          
          <div className="flex items-center space-x-4">
            <Link href="/auth">
              <Button variant="outline" size={scrolled ? "sm" : "default"}>
                Log in
              </Button>
            </Link>
            <Link href="/auth">
              <Button size={scrolled ? "sm" : "default"}>
                Sign up
              </Button>
            </Link>
          </div>
        </div>
      </header>
      {/* Spacer to prevent content from hiding under fixed header */}
      <div className="h-28"></div>
    </>
  );
}