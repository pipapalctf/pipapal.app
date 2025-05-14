import React from 'react';
import { Link } from 'wouter';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-muted py-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between">
          <div className="mb-6 md:mb-0">
            <h3 className="font-bold text-lg mb-4">PipaPal</h3>
            <p className="text-muted-foreground max-w-md">
              Your Waste Buddy - Connecting households with waste collectors and recyclers
              to promote environmental sustainability across Kenya.
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
            <div>
              <h4 className="font-medium mb-3">Company</h4>
              <ul className="space-y-2">
                <li><Link href="/about" className="text-muted-foreground hover:text-foreground transition-colors">About</Link></li>
                <li><Link href="/mission" className="text-muted-foreground hover:text-foreground transition-colors">Our Mission</Link></li>
                <li><Link href="/contact" className="text-muted-foreground hover:text-foreground transition-colors">Contact</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-3">Services</h4>
              <ul className="space-y-2">
                <li><Link href="/collections"><a className="text-muted-foreground hover:text-foreground transition-colors">Waste Collection</a></Link></li>
                <li><Link href="/recycling-centers"><a className="text-muted-foreground hover:text-foreground transition-colors">Recycling Centers</a></Link></li>
                <li><Link href="/eco-tips"><a className="text-muted-foreground hover:text-foreground transition-colors">EcoTips</a></Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-3">Connect</h4>
              <ul className="space-y-2">
                <li><a href="mailto:info@pipapal.app" className="text-muted-foreground hover:text-foreground transition-colors">info@pipapal.app</a></li>
                <li><a href="https://wa.me/254116407400" className="text-muted-foreground hover:text-foreground transition-colors">WhatsApp: +254-116407400</a></li>
                <li><a href="https://pipapal.app" className="text-muted-foreground hover:text-foreground transition-colors">pipapal.app</a></li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="border-t border-border mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-muted-foreground mb-4 md:mb-0">
            &copy; {currentYear} PipaPal. All rights reserved.
          </p>
          <div className="flex space-x-4">
            <Link href="/privacy"><a className="text-sm text-muted-foreground hover:text-foreground transition-colors">Privacy Policy</a></Link>
            <Link href="/terms"><a className="text-sm text-muted-foreground hover:text-foreground transition-colors">Terms of Service</a></Link>
          </div>
        </div>
      </div>
    </footer>
  );
}