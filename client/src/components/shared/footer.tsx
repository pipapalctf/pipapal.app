import Logo from "@/components/logo";
import { Link } from "wouter";

export default function Footer() {
  return (
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
              <li><Link href="/about" className="hover:text-primary transition-colors">About Us</Link></li>
              <li><Link href="/mission" className="hover:text-primary transition-colors">Our Mission</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">Careers</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">Contact</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-bold text-white mb-4">Services</h3>
            <ul className="space-y-2">
              <li><Link href="/schedule-pickup" className="hover:text-primary transition-colors">Waste Collection</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">Recycling</Link></li>
              <li><Link href="/impact" className="hover:text-primary transition-colors">Impact Tracking</Link></li>
              <li><Link href="/ecotips" className="hover:text-primary transition-colors">Educational Resources</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-bold text-white mb-4">Connect</h3>
            <ul className="space-y-2">
              <li><Link href="#" className="hover:text-primary transition-colors">Twitter</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">Facebook</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">Instagram</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">LinkedIn</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-500 text-sm">
            &copy; {new Date().getFullYear()} PipaPal. All rights reserved.
          </p>
          <div className="flex space-x-4 mt-4 md:mt-0">
            <Link href="/about" className="text-gray-500 text-sm hover:text-primary transition-colors">About Us</Link>
            <Link href="/mission" className="text-gray-500 text-sm hover:text-primary transition-colors">Our Mission</Link>
            <Link href="#" className="text-gray-500 text-sm hover:text-primary transition-colors">Privacy Policy</Link>
            <Link href="#" className="text-gray-500 text-sm hover:text-primary transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
