import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import Logo from "@/components/logo";
import { Button } from "@/components/ui/button";
import {
  CalendarClock,
  ChevronRight,
  Leaf,
  BarChart3,
  Recycle,
  Award,
  Check,
  Gift
} from "lucide-react";
// Import directly using relative path to attached_assets
import pipapalLogo from "../.././../attached_assets/pipapal-logo.png";
// Import image assets
import dashboardImg from "../assets/dashboard-updated.png";
import landingFormImg from "../assets/landing-form.png";
import landingHeroImg from "../assets/landing-hero.png";

export default function LandingPage() {
  const [, setLocation] = useLocation();
  const { user, isLoading } = useAuth();
  const [scrolled, setScrolled] = useState(false);

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
    <div className="min-h-screen flex flex-col bg-white">
      {/* Navbar */}
      <header className={`fixed top-0 left-0 right-0 w-full px-4 md:px-8 border-b border-gray-100 shadow-xl bg-white z-50 transition-all duration-300 ${scrolled ? 'py-3' : 'py-5'}`}>
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center">
            <img 
              src={pipapalLogo} 
              alt="PipaPal Logo" 
              className={`transition-all duration-300 ${scrolled ? 'h-10' : 'h-12'} w-auto`} 
            />
            <div className="ml-2">
              <span className={`font-montserrat font-bold text-secondary transition-all duration-300 ${scrolled ? 'text-xl' : 'text-2xl'}`}>
                PipaPal
              </span>
              <span className={`hidden md:inline-block ml-2 text-primary text-xs transition-all duration-300 ${scrolled ? 'opacity-0' : 'opacity-100'}`}>
                Your Waste Buddy
              </span>
            </div>
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

      {/* Hero Section */}
      <section 
        className="w-full py-16 md:py-24" 
        style={{
          backgroundImage: `url(${landingHeroImg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}>
        <div className="container mx-auto px-4 md:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl font-montserrat font-bold text-secondary mb-2">
                Waste Management <span className="text-primary">Simplified</span>
              </h1>
              <h2 className="text-lg md:text-xl text-primary font-medium mb-4">
                PipaPal - Your Waste Buddy
              </h2>
              <p className="text-lg md:text-xl text-gray-700 mb-8">
                PipaPal connects households with waste collectors to make recycling easier and 
                track your environmental impact in real-time.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/auth">
                  <Button size="lg" className="w-full sm:w-auto">
                    Get Started
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  Learn More
                </Button>
              </div>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <div className="flex items-center text-sm text-gray-600">
                  <Check className="mr-2 h-4 w-4 text-primary" />
                  Free Collection Bags
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Check className="mr-2 h-4 w-4 text-primary" />
                  Reward Points
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Check className="mr-2 h-4 w-4 text-primary" />
                  Real-time Tracking
                </div>
              </div>
            </div>
            <div className="hidden md:block">
              <div className="relative">
                <div className="absolute -top-6 -left-6 w-24 h-24 bg-primary/20 rounded-lg"></div>
                <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-primary/30 rounded-lg"></div>
                <div className="relative bg-white rounded-xl shadow-lg p-4 z-10">
                  <img 
                    src={landingFormImg}
                    alt="PipaPal Platform Interface" 
                    className="rounded-lg w-full h-auto object-contain"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="w-full py-16 bg-white">
        <div className="container mx-auto px-4 md:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-montserrat font-bold text-secondary mb-4">
              How PipaPal Works
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Our platform streamlines waste management while helping you track your environmental impact
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-gray-50 rounded-xl p-6 transition-all hover:shadow-md">
              <div className="mb-6 flex justify-center">
                <img src="/images/waste-schedule.svg" alt="Schedule Waste Pickup" className="h-48 w-auto" />
              </div>
              <h3 className="text-xl font-bold text-secondary mb-2">Schedule Pickups</h3>
              <p className="text-gray-600">
                Choose your preferred time and waste types for collection with just a few clicks
              </p>
            </div>
            
            <div className="bg-gray-50 rounded-xl p-6 transition-all hover:shadow-md">
              <div className="mb-6 flex justify-center">
                <img src="/images/recycling-bins.svg" alt="Track Collections" className="h-48 w-auto" />
              </div>
              <h3 className="text-xl font-bold text-secondary mb-2">Track Collections</h3>
              <p className="text-gray-600">
                Follow your waste journey in real-time with status updates and collection confirmations
              </p>
            </div>
            
            <div className="bg-gray-50 rounded-xl p-6 transition-all hover:shadow-md">
              <div className="mb-6 flex justify-center">
                <img src="/images/eco-impact.svg" alt="Measure Impact" className="h-48 w-auto" />
              </div>
              <h3 className="text-xl font-bold text-secondary mb-2">Measure Impact</h3>
              <p className="text-gray-600">
                See your environmental contribution with detailed metrics on waste diverted and CO₂ reduced
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="w-full py-16 bg-gray-50">
        <div className="container mx-auto px-4 md:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-montserrat font-bold text-secondary mb-4">
              Benefits of Using PipaPal
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Join thousands of households making a difference with our comprehensive waste management solution
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-12">
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="flex mb-4">
                <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-1 mr-3">
                  <Leaf className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-secondary">Environmental Impact</h3>
              </div>
              <div className="mb-4">
                <img src={dashboardImg} alt="PipaPal Dashboard" className="w-full h-auto rounded-lg" />
              </div>
              <p className="text-gray-600">
                Track your contribution to reducing landfill waste, CO₂ emissions, and conserving natural resources. Our detailed impact dashboard helps you see the difference you're making.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="flex mb-4">
                <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-1 mr-3">
                  <Award className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-secondary">Rewards Program</h3>
              </div>
              <div className="mb-4">
                <img src="/images/rewards-badges.svg" alt="Rewards Program" className="w-full h-auto rounded-lg" />
              </div>
              <p className="text-gray-600">
                Earn points for every collection scheduled based on waste type. Points can be redeemed for eco-friendly products or donated to environmental causes.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="flex mb-4">
                <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-1 mr-3">
                  <CalendarClock className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-secondary">Convenient Scheduling</h3>
              </div>
              <div className="mb-4">
                <img src="/images/waste-schedule.svg" alt="Convenient Scheduling" className="w-full h-auto rounded-lg" />
              </div>
              <p className="text-gray-600">
                Choose collection times that work for you with our flexible scheduling system. Receive reminders and real-time updates on your collection status.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="flex mb-4">
                <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-1 mr-3">
                  <Recycle className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-secondary">Educational Resources</h3>
              </div>
              <div className="mb-4">
                <img src="/images/eco-tips-illustration.svg" alt="Educational Resources" className="w-full h-auto rounded-lg" />
              </div>
              <p className="text-gray-600">
                Access our AI-powered EcoTips learning center to discover better waste management practices and sustainability tips tailored to your household.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section 
        className="w-full py-24 relative" 
        style={{
          backgroundImage: `url('/images/eco-cta-bg.svg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="container mx-auto px-4 md:px-8 text-center relative z-10">
          <div className="bg-white/80 backdrop-blur-sm max-w-3xl mx-auto p-8 rounded-2xl shadow-lg">
            <h2 className="text-3xl md:text-4xl font-montserrat font-bold text-secondary mb-4">
              Ready to Make a Difference?
            </h2>
            <p className="text-lg text-gray-700 max-w-2xl mx-auto mb-8">
              Join PipaPal today and start your journey towards more sustainable waste management
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4 mb-6">
              <Link href="/auth">
                <Button size="lg" className="px-8 w-full sm:w-auto">
                  Get Started Now
                  <ChevronRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="#features">
                <Button variant="outline" size="lg" className="px-8 w-full sm:w-auto">
                  Learn More
                </Button>
              </Link>
            </div>
            <div className="flex items-center justify-center mt-6">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-100 mr-3">
                <Gift className="h-5 w-5 text-primary" />
              </div>
              <p className="text-gray-700">
                New users receive free compostable trash bags with their first collection
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full py-12 bg-gray-900 text-gray-300">
        <div className="container mx-auto px-4 md:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center mb-4">
                <Logo variant="white" size="md" />
                <span className="ml-2 text-2xl font-montserrat font-bold text-white">PipaPal</span>
              </div>
              <p className="text-gray-400">
                Your Waste Buddy - Connecting households with waste collectors for a greener future.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-bold text-white mb-4">Company</h3>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-primary transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Our Mission</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Contact</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-bold text-white mb-4">Services</h3>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-primary transition-colors">Waste Collection</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Recycling</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Impact Tracking</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Educational Resources</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-bold text-white mb-4">Connect</h3>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-primary transition-colors">Twitter</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Facebook</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Instagram</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">LinkedIn</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-500 text-sm">
              &copy; {new Date().getFullYear()} PipaPal. All rights reserved.
            </p>
            <div className="flex space-x-4 mt-4 md:mt-0">
              <a href="#" className="text-gray-500 text-sm hover:text-primary transition-colors">Privacy Policy</a>
              <a href="#" className="text-gray-500 text-sm hover:text-primary transition-colors">Terms of Service</a>
              <a href="#" className="text-gray-500 text-sm hover:text-primary transition-colors">Cookie Policy</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}