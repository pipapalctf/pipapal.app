import Logo from "@/components/logo";
import { Link } from "wouter";

export default function Footer() {
  return (
    <footer className="bg-secondary text-white py-10 mt-10">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center mb-4">
              <Logo variant="white" />
              <span className="ml-2 text-xl font-montserrat font-bold">PipaPal</span>
            </div>
            <p className="text-gray-300 text-sm">Making waste management sustainable and accessible for everyone.</p>
            <div className="mt-4 flex space-x-3">
              <a href="#" className="text-white hover:text-accent">
                <i className="fab fa-facebook-f"></i>
              </a>
              <a href="#" className="text-white hover:text-accent">
                <i className="fab fa-twitter"></i>
              </a>
              <a href="#" className="text-white hover:text-accent">
                <i className="fab fa-instagram"></i>
              </a>
              <a href="#" className="text-white hover:text-accent">
                <i className="fab fa-linkedin-in"></i>
              </a>
            </div>
          </div>
          
          <div>
            <h4 className="font-montserrat font-bold text-lg mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li><Link href="/" className="text-gray-300 hover:text-white transition-colors">Home</Link></li>
              <li><Link href="/schedule" className="text-gray-300 hover:text-white transition-colors">Schedule Collection</Link></li>
              <li><Link href="/ecotips" className="text-gray-300 hover:text-white transition-colors">EcoTips</Link></li>
              <li><Link href="/impact" className="text-gray-300 hover:text-white transition-colors">Impact Dashboard</Link></li>
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Community</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-montserrat font-bold text-lg mb-4">User Types</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Households</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Waste Collectors</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Recycling Centers</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Organizations</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-montserrat font-bold text-lg mb-4">Contact Us</h4>
            <ul className="space-y-2 text-gray-300">
              <li className="flex items-start">
                <i className="fas fa-map-marker-alt mt-1 mr-3"></i>
                <span>123 Green Street, Eco City, 10001</span>
              </li>
              <li className="flex items-start">
                <i className="fas fa-envelope mt-1 mr-3"></i>
                <span>contact@pipapal.com</span>
              </li>
              <li className="flex items-start">
                <i className="fas fa-phone mt-1 mr-3"></i>
                <span>+1 (555) 123-4567</span>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-700 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm">© {new Date().getFullYear()} PipaPal. All rights reserved.</p>
          <div className="mt-4 md:mt-0">
            <a href="#" className="text-gray-400 hover:text-white text-sm mx-2">Privacy Policy</a>
            <a href="#" className="text-gray-400 hover:text-white text-sm mx-2">Terms of Service</a>
            <a href="#" className="text-gray-400 hover:text-white text-sm mx-2">Cookie Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
