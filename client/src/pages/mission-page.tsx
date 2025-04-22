import React from "react";
import PublicNavbar from "@/components/shared/public-navbar";
import Footer from "@/components/shared/footer";
import { Recycle, Target, GanttChart, Globe, LineChart, Leaf } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export default function MissionPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <PublicNavbar />
      
      <main className="flex-grow">
        {/* Hero section */}
        <section className="bg-secondary/10 py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-bold font-montserrat mb-4 text-secondary">
                Our Mission
              </h1>
              <p className="text-lg text-gray-600 mb-6">
                Creating a sustainable future through innovative waste management
              </p>
              <Separator className="w-24 h-1 bg-primary mx-auto" />
            </div>
          </div>
        </section>

        {/* Mission statement */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="bg-white p-8 rounded-lg shadow-md border border-gray-100">
                <div className="bg-primary/10 p-4 rounded-full w-16 h-16 flex items-center justify-center mb-6 mx-auto">
                  <Target className="h-8 w-8 text-primary" />
                </div>
                <h2 className="text-2xl font-bold font-montserrat mb-6 text-center text-secondary">
                  Our Mission Statement
                </h2>
                <p className="text-lg text-gray-600 text-center mb-8">
                  "To create a sustainable waste management ecosystem that empowers communities,
                  reduces environmental impact, and promotes circular economy principles through
                  innovative technology and education."
                </p>
                <Separator className="mb-8" />
                <p className="text-gray-700">
                  At PipaPal, we're committed to transforming waste management in Kenya through a 
                  multi-faceted approach that connects key stakeholders, leverages technology, and 
                  promotes environmental education. We believe that effective waste management is 
                  not just about collection and disposal but about creating a circular economy that 
                  maximizes resource recovery and minimizes environmental impact.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Mission pillars */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center mb-16">
              <h2 className="text-3xl font-bold font-montserrat mb-6 text-secondary">
                Our Mission Pillars
              </h2>
              <p className="text-lg text-gray-600">
                The key focus areas that drive our mission forward
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white p-8 rounded-lg shadow-md h-full">
                <div className="bg-primary/10 p-4 rounded-full w-16 h-16 flex items-center justify-center mb-6">
                  <Recycle className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-4 text-secondary">Sustainable Waste Management</h3>
                <p className="text-gray-600">
                  We're committed to increasing recycling rates, reducing landfill waste, and 
                  promoting proper waste segregation. Our platform enables efficient waste collection 
                  and tracking, ensuring that more waste is diverted from landfills and properly processed.
                </p>
              </div>
              
              <div className="bg-white p-8 rounded-lg shadow-md h-full">
                <div className="bg-primary/10 p-4 rounded-full w-16 h-16 flex items-center justify-center mb-6">
                  <Globe className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-4 text-secondary">Community Empowerment</h3>
                <p className="text-gray-600">
                  We believe in empowering local communities through education, economic opportunities, 
                  and active participation in waste management. By connecting households with local collectors 
                  and recyclers, we create jobs and foster environmental stewardship at the community level.
                </p>
              </div>
              
              <div className="bg-white p-8 rounded-lg shadow-md h-full">
                <div className="bg-primary/10 p-4 rounded-full w-16 h-16 flex items-center justify-center mb-6">
                  <LineChart className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-4 text-secondary">Environmental Impact</h3>
                <p className="text-gray-600">
                  We're dedicated to making a measurable difference in Kenya's environment through reduced 
                  pollution, conservation of natural resources, and promotion of circular economy principles. 
                  Our impact tracking tools help visualize and quantify these environmental benefits.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Strategic objectives */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center mb-16">
              <h2 className="text-3xl font-bold font-montserrat mb-6 text-secondary">
                Strategic Objectives
              </h2>
              <p className="text-lg text-gray-600">
                The targets we've set to achieve our mission
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                <div className="flex items-center mb-4">
                  <div className="bg-primary/10 p-2 rounded-full w-10 h-10 flex items-center justify-center mr-4">
                    <span className="font-bold text-primary">1</span>
                  </div>
                  <h3 className="text-xl font-semibold text-secondary">Expand Service Coverage</h3>
                </div>
                <p className="text-gray-600 ml-14">
                  Increase our presence across all counties in Kenya, ensuring that waste collection 
                  services are accessible to both urban and rural communities.
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                <div className="flex items-center mb-4">
                  <div className="bg-primary/10 p-2 rounded-full w-10 h-10 flex items-center justify-center mr-4">
                    <span className="font-bold text-primary">2</span>
                  </div>
                  <h3 className="text-xl font-semibold text-secondary">Enhance Technology</h3>
                </div>
                <p className="text-gray-600 ml-14">
                  Continuously improve our platform to provide a seamless experience for all users, 
                  incorporating features that drive efficiency, transparency, and impact tracking.
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                <div className="flex items-center mb-4">
                  <div className="bg-primary/10 p-2 rounded-full w-10 h-10 flex items-center justify-center mr-4">
                    <span className="font-bold text-primary">3</span>
                  </div>
                  <h3 className="text-xl font-semibold text-secondary">Promote Recycling</h3>
                </div>
                <p className="text-gray-600 ml-14">
                  Increase recycling rates across all waste types by connecting collectors with recyclers 
                  and educating households on proper waste segregation.
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                <div className="flex items-center mb-4">
                  <div className="bg-primary/10 p-2 rounded-full w-10 h-10 flex items-center justify-center mr-4">
                    <span className="font-bold text-primary">4</span>
                  </div>
                  <h3 className="text-xl font-semibold text-secondary">Build Partnerships</h3>
                </div>
                <p className="text-gray-600 ml-14">
                  Collaborate with government entities, NGOs, private sector organizations, and community 
                  groups to create a robust waste management ecosystem.
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                <div className="flex items-center mb-4">
                  <div className="bg-primary/10 p-2 rounded-full w-10 h-10 flex items-center justify-center mr-4">
                    <span className="font-bold text-primary">5</span>
                  </div>
                  <h3 className="text-xl font-semibold text-secondary">Environmental Education</h3>
                </div>
                <p className="text-gray-600 ml-14">
                  Provide educational resources and initiatives that promote environmental awareness 
                  and sustainable waste management practices.
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                <div className="flex items-center mb-4">
                  <div className="bg-primary/10 p-2 rounded-full w-10 h-10 flex items-center justify-center mr-4">
                    <span className="font-bold text-primary">6</span>
                  </div>
                  <h3 className="text-xl font-semibold text-secondary">Economic Development</h3>
                </div>
                <p className="text-gray-600 ml-14">
                  Create sustainable employment opportunities in the waste management sector, 
                  particularly for collectors and recyclers in underserved communities.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Our commitment */}
        <section className="py-16 bg-primary/5">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-3xl font-bold font-montserrat mb-8 text-center text-secondary">
                Our Commitment
              </h2>
              
              <div className="bg-white p-8 rounded-lg shadow-md">
                <div className="flex items-center justify-center mb-6">
                  <Leaf className="h-12 w-12 text-primary" />
                </div>
                <p className="text-gray-700 text-lg text-center">
                  We are dedicated to making a tangible difference in Kenya's environment and communities. 
                  By working together with all stakeholders, we believe we can create a more sustainable 
                  future where waste is properly managed, resources are conserved, and communities thrive. 
                  This is not just our mission—it's our commitment to Kenya and future generations.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Call to action */}
        <section className="py-16 bg-secondary text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold font-montserrat mb-6">
              Join Our Mission
            </h2>
            <p className="text-lg text-gray-200 mb-8 max-w-2xl mx-auto">
              Whether you're a household, collector, recycler, or organization, you can be part 
              of our mission to transform waste management in Kenya. Together, we can create a 
              cleaner, healthier environment for all.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/auth"
                className="bg-primary hover:bg-primary/90 text-white font-semibold py-3 px-6 rounded-md transition-colors"
              >
                Sign Up Now
              </a>
              <a
                href="https://wa.me/254116407400"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white hover:bg-gray-100 text-secondary font-semibold py-3 px-6 rounded-md transition-colors"
              >
                Partner With Us (WhatsApp)
              </a>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}