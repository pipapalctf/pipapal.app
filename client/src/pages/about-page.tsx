import React from "react";
import Navbar from "@/components/shared/navbar";
import Footer from "@/components/shared/footer";
import { Recycle, Globe, Users, Leaf, Award, Sprout } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow">
        {/* Hero section */}
        <section className="bg-secondary/10 py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-bold font-montserrat mb-4 text-secondary">
                About PipaPal
              </h1>
              <p className="text-lg text-gray-600 mb-6">
                Transforming waste management in Kenya through technology and community empowerment
              </p>
              <Separator className="w-24 h-1 bg-primary mx-auto" />
            </div>
          </div>
        </section>

        {/* Our story section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold font-montserrat mb-6 text-secondary">Our Story</h2>
                <p className="text-gray-600 mb-4">
                  PipaPal was founded in 2023 with a simple yet powerful vision: to revolutionize waste management 
                  in Kenya by connecting households with local waste collectors and recyclers through technology.
                </p>
                <p className="text-gray-600 mb-4">
                  Our founders witnessed firsthand the challenges faced by communities in managing waste 
                  effectively, from irregular collection schedules to limited recycling options. They saw 
                  an opportunity to create a platform that would not only address these issues but also 
                  promote environmental sustainability and create economic opportunities.
                </p>
                <p className="text-gray-600">
                  Today, PipaPal has grown into a comprehensive waste management platform that serves 
                  thousands of households, collectors, and recyclers across Kenya, driving positive 
                  environmental impact and fostering a circular economy approach to waste.
                </p>
              </div>
              <div className="relative">
                <div className="bg-primary/10 rounded-lg p-8 relative z-10">
                  <img
                    src="/assets/about-image.jpg"
                    alt="PipaPal team"
                    className="rounded-lg shadow-lg"
                    onError={(e) => {
                      e.currentTarget.src = "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80";
                    }}
                  />
                </div>
                <div className="absolute inset-0 bg-secondary/10 rounded-lg transform translate-x-4 translate-y-4"></div>
              </div>
            </div>
          </div>
        </section>

        {/* Mission and vision */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center mb-16">
              <h2 className="text-3xl font-bold font-montserrat mb-6 text-secondary">
                Our Mission & Vision
              </h2>
              <p className="text-lg text-gray-600">
                We're driven by a commitment to environmental sustainability and community development
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white p-8 rounded-lg shadow-md">
                <div className="bg-primary/10 p-4 rounded-full w-16 h-16 flex items-center justify-center mb-6">
                  <Globe className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-4 text-secondary">Our Mission</h3>
                <p className="text-gray-600">
                  To create a sustainable waste management ecosystem that empowers communities, 
                  reduces environmental impact, and promotes circular economy principles through 
                  innovative technology and education.
                </p>
              </div>
              
              <div className="bg-white p-8 rounded-lg shadow-md">
                <div className="bg-primary/10 p-4 rounded-full w-16 h-16 flex items-center justify-center mb-6">
                  <Sprout className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-4 text-secondary">Our Vision</h3>
                <p className="text-gray-600">
                  To be the leading waste management platform in East Africa, transforming how 
                  communities perceive and handle waste while contributing to a cleaner, healthier 
                  environment and sustainable economic growth.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Our values */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center mb-16">
              <h2 className="text-3xl font-bold font-montserrat mb-6 text-secondary">
                Our Core Values
              </h2>
              <p className="text-lg text-gray-600">
                The principles that guide everything we do at PipaPal
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                <div className="bg-primary/10 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                  <Leaf className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-secondary">Sustainability</h3>
                <p className="text-gray-600">
                  We prioritize environmental well-being in all our operations and decisions, 
                  seeking to minimize waste and maximize resource recovery.
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                <div className="bg-primary/10 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-secondary">Community</h3>
                <p className="text-gray-600">
                  We believe in the power of collaborative action, fostering connections between 
                  households, collectors, and recyclers to create a resilient waste management ecosystem.
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                <div className="bg-primary/10 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                  <Award className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-secondary">Integrity</h3>
                <p className="text-gray-600">
                  We operate with transparency, honesty, and accountability, building trust with 
                  all our stakeholders through ethical practices.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Impact section */}
        <section className="py-16 bg-primary/5">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center mb-16">
              <h2 className="text-3xl font-bold font-montserrat mb-6 text-secondary">
                Our Impact
              </h2>
              <p className="text-lg text-gray-600">
                The difference we're making together for Kenya's environment and communities
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="text-4xl font-bold text-primary mb-2">10K+</div>
                <p className="text-gray-600">Households Served</p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="text-4xl font-bold text-primary mb-2">500+</div>
                <p className="text-gray-600">Waste Collectors Employed</p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="text-4xl font-bold text-primary mb-2">2.5M</div>
                <p className="text-gray-600">Kg of Waste Collected</p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="text-4xl font-bold text-primary mb-2">65%</div>
                <p className="text-gray-600">Recycling Rate</p>
              </div>
            </div>
          </div>
        </section>

        {/* Call to action */}
        <section className="py-16 bg-secondary text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold font-montserrat mb-6">
              Join Us In Making A Difference
            </h2>
            <p className="text-lg text-gray-200 mb-8 max-w-2xl mx-auto">
              Whether you're a household looking for reliable waste collection, a collector seeking 
              opportunities, or a recycler wanting to source materials, PipaPal connects you to a 
              community committed to sustainable waste management.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/auth"
                className="bg-primary hover:bg-primary/90 text-white font-semibold py-3 px-6 rounded-md transition-colors"
              >
                Sign Up Now
              </a>
              <a
                href="/contact"
                className="bg-white hover:bg-gray-100 text-secondary font-semibold py-3 px-6 rounded-md transition-colors"
              >
                Contact Us
              </a>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}