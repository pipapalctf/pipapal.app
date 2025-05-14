import { Link } from "wouter";
import Footer from "@/components/shared/footer";
import PublicNavbar from "@/components/shared/public-navbar";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Award,
  Building2,
  CalendarClock,
  Check,
  ChevronRight,
  Factory, 
  Gift,
  Home,
  Leaf,
  BarChart3,
  Recycle,
  Truck
} from "lucide-react";
// Import directly using relative path to attached_assets
import pipapalLogo from "../.././../attached_assets/pipapal-logo.png";
import dashboardImage from "../.././../attached_assets/image_1745314618027.png";

export default function LandingPage() {

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <PublicNavbar />

      {/* Hero Section */}
      <section className="w-full py-16 md:py-24 bg-gradient-to-br from-primary/10 to-primary/5">
        <div className="container mx-auto px-4 md:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl font-montserrat font-bold text-secondary mb-4">
                Waste Management <span className="text-primary">Simplified</span>
              </h1>
              <p className="text-lg md:text-xl text-gray-700 mb-8">
                PipaPal connects households with waste collectors to make recycling easier and 
                track your environmental impact in real-time.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/auth?tab=register">
                  <Button size="lg" className="w-full sm:w-auto">
                    Get Started
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <a 
                  href="#user-types" 
                  onClick={(e) => {
                    e.preventDefault();
                    const element = document.getElementById('user-types');
                    if (element) {
                      const offsetTop = element.getBoundingClientRect().top + window.pageYOffset;
                      window.scrollTo({
                        top: offsetTop,
                        behavior: 'smooth'
                      });
                    }
                  }}
                >
                  <Button variant="outline" size="lg" className="w-full sm:w-auto">
                    Learn More
                  </Button>
                </a>
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
                <div className="absolute -top-8 -left-8 w-32 h-32 bg-primary/20 rounded-lg"></div>
                <div className="absolute -bottom-8 -right-8 w-40 h-40 bg-primary/30 rounded-lg"></div>
                <div className="relative bg-white rounded-xl shadow-2xl p-2 md:p-3 z-10 md:w-[100%] border border-gray-100">
                  <div className="overflow-hidden rounded-lg">
                    <img 
                      src={dashboardImage} 
                      alt="PipaPal Dashboard Preview" 
                      className="rounded-lg w-full h-auto object-cover shadow-sm hover:scale-[1.02] transition-transform duration-300"
                    />
                  </div>
                  <div className="absolute -bottom-3 -right-3 w-20 h-20 bg-primary/10 rounded-full blur-xl"></div>
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
                <img src="/images/waste-schedule.svg" alt="Schedule Waste Pickup" className="h-36 w-auto" />
              </div>
              <h3 className="text-xl font-bold text-secondary mb-2">Schedule Pickups</h3>
              <p className="text-gray-600">
                Choose your preferred time and waste types for collection with just a few clicks
              </p>
            </div>
            
            <div className="bg-gray-50 rounded-xl p-6 transition-all hover:shadow-md">
              <div className="mb-6 flex justify-center">
                <img src="/images/recycling-bins.svg" alt="Track Collections" className="h-36 w-auto" />
              </div>
              <h3 className="text-xl font-bold text-secondary mb-2">Track Collections</h3>
              <p className="text-gray-600">
                Follow your waste journey in real-time with status updates and collection confirmations
              </p>
            </div>
            
            <div className="bg-gray-50 rounded-xl p-6 transition-all hover:shadow-md">
              <div className="mb-6 flex justify-center">
                <img src="/images/eco-impact.svg" alt="Measure Impact" className="h-36 w-auto" />
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
              <div className="mb-4 flex justify-center">
                <img src="/images/eco-impact.svg" alt="Environmental Impact" className="h-32 w-auto rounded-lg" />
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
              <div className="mb-4 flex justify-center">
                <img src="/images/rewards-badges.svg" alt="Rewards Program" className="h-32 w-auto rounded-lg" />
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
              <div className="mb-4 flex justify-center">
                <img src="/images/waste-schedule.svg" alt="Convenient Scheduling" className="h-32 w-auto rounded-lg" />
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
              <div className="mb-4 flex justify-center">
                <img src="/images/eco-tips-illustration.svg" alt="Educational Resources" className="h-32 w-auto rounded-lg" />
              </div>
              <p className="text-gray-600">
                Access our AI-powered EcoTips learning center to discover better waste management practices and sustainability tips tailored to your household.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* User Types Section */}
      <section className="w-full py-16 bg-white" id="user-types">
        <div className="container mx-auto px-4 md:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-montserrat font-bold text-secondary mb-4">
              PipaPal for Everyone
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Our platform is designed to serve all stakeholders in the waste management ecosystem
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Household/Individual Card */}
            <div className="bg-gradient-to-br from-primary/5 to-primary/10 p-6 rounded-xl shadow-sm">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0 mr-4">
                  <Home className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-2xl font-bold text-secondary">For Households</h3>
              </div>
              <p className="text-gray-700 mb-6">
                Manage your household waste efficiently while tracking your environmental impact. Schedule pickups at your convenience and earn rewards for your sustainable choices.
              </p>
              <ul className="space-y-2 mb-6">
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-primary mr-2" />
                  <span>Easy scheduling of waste collections</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-primary mr-2" />
                  <span>Track your environmental impact</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-primary mr-2" />
                  <span>Earn rewards for sustainable practices</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-primary mr-2" />
                  <span>Learn from personalized eco-tips</span>
                </li>
              </ul>
              <Link href="/auth?tab=register">
                <Button className="w-full" variant="outline">
                  Register as a Household
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>

            {/* Collector Card */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl shadow-sm">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-blue-200 rounded-full flex items-center justify-center flex-shrink-0 mr-4">
                  <Truck className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold text-secondary">For Collectors</h3>
              </div>
              <p className="text-gray-700 mb-6">
                Optimize your collection routes and grow your customer base. Manage all your pickups efficiently through our dedicated collector dashboard.
              </p>
              <ul className="space-y-2 mb-6">
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-blue-600 mr-2" />
                  <span>Manage all scheduled collections</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-blue-600 mr-2" />
                  <span>Send real-time status updates</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-blue-600 mr-2" />
                  <span>Optimize route planning</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-blue-600 mr-2" />
                  <span>Track your environmental impact metrics</span>
                </li>
              </ul>
              <Link href="/auth?tab=register">
                <Button className="w-full bg-blue-600 hover:bg-blue-700">
                  Register as a Collector
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>

            {/* Recycler Card */}
            <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-6 rounded-xl shadow-sm">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-amber-200 rounded-full flex items-center justify-center flex-shrink-0 mr-4">
                  <Factory className="h-6 w-6 text-amber-600" />
                </div>
                <h3 className="text-2xl font-bold text-secondary">For Recyclers</h3>
              </div>
              <p className="text-gray-700 mb-6">
                Connect with waste collectors to source the materials you need. Specify material interests and track your positive environmental impact.
              </p>
              <ul className="space-y-2 mb-6">
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-amber-600 mr-2" />
                  <span>Specify materials of interest</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-amber-600 mr-2" />
                  <span>Connect with local waste collectors</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-amber-600 mr-2" />
                  <span>Measure your environmental contribution</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-amber-600 mr-2" />
                  <span>Access detailed analytics</span>
                </li>
              </ul>
              <Link href="/auth?tab=register">
                <Button className="w-full bg-amber-600 hover:bg-amber-700">
                  Register as a Recycler
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>

            {/* Organization Card */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl shadow-sm">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-purple-200 rounded-full flex items-center justify-center flex-shrink-0 mr-4">
                  <Building2 className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="text-2xl font-bold text-secondary">For Organizations</h3>
              </div>
              <p className="text-gray-700 mb-6">
                Manage waste for multiple locations while tracking organization-wide sustainability metrics. Get comprehensive reports for CSR initiatives.
              </p>
              <ul className="space-y-2 mb-6">
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-purple-600 mr-2" />
                  <span>Manage waste across multiple locations</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-purple-600 mr-2" />
                  <span>Track organization-wide impact metrics</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-purple-600 mr-2" />
                  <span>Generate sustainability reports</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-purple-600 mr-2" />
                  <span>Support corporate sustainability goals</span>
                </li>
              </ul>
              <Link href="/auth?tab=register">
                <Button className="w-full bg-purple-600 hover:bg-purple-700">
                  Register as an Organization
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
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
              <Link href="/auth?tab=register">
                <Button size="lg" className="px-8 w-full sm:w-auto">
                  Get Started Now
                  <ChevronRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <a 
                href="#user-types" 
                onClick={(e) => {
                  e.preventDefault();
                  const element = document.getElementById('user-types');
                  if (element) {
                    const offsetTop = element.getBoundingClientRect().top + window.pageYOffset;
                    window.scrollTo({
                      top: offsetTop,
                      behavior: 'smooth'
                    });
                  }
                }}
              >
                <Button variant="outline" size="lg" className="px-8 w-full sm:w-auto">
                  Learn More
                </Button>
              </a>
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
      <Footer />
    </div>
  );
}