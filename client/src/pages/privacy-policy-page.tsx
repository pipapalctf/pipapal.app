import { PublicLayout } from "@/components/layouts/public-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPolicyPage() {
  return (
    <PublicLayout>
      <div className="container mx-auto py-8 px-4">
        <div className="mb-6">
          <Link href="/" className="flex items-center text-primary hover:underline">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Home
          </Link>
        </div>
        
        <Card className="max-w-4xl mx-auto shadow-md">
          <CardContent className="pt-6">
            <h1 className="text-3xl font-bold text-center mb-6">Privacy Policy</h1>
            <p className="text-sm text-muted-foreground text-center mb-6">
              Last Updated: May 14, 2025
            </p>
            <Separator className="mb-6" />
            
            <div className="space-y-6">
              <section>
                <h2 className="text-xl font-semibold mb-3">1. Introduction</h2>
                <p className="text-gray-700">
                  PipaPal ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our waste management platform and services. Please read this privacy policy carefully. If you do not agree with the terms of this privacy policy, please do not access the platform.
                </p>
              </section>
              
              <section>
                <h2 className="text-xl font-semibold mb-3">2. Information We Collect</h2>
                <h3 className="text-lg font-medium mb-2">2.1 Personal Information</h3>
                <p className="text-gray-700 mb-3">
                  We may collect personal information that you voluntarily provide to us when you register on our platform, including:
                </p>
                <ul className="list-disc pl-6 mb-4 text-gray-700">
                  <li>Full name</li>
                  <li>Email address</li>
                  <li>Phone number</li>
                  <li>Physical address</li>
                  <li>User role (Household, Collector, Recycler, Organization)</li>
                  <li>Account credentials</li>
                  <li>Profile information</li>
                </ul>
                
                <h3 className="text-lg font-medium mb-2">2.2 Usage Information</h3>
                <p className="text-gray-700 mb-3">
                  We automatically collect certain information when you visit, use, or navigate our platform, including:
                </p>
                <ul className="list-disc pl-6 mb-4 text-gray-700">
                  <li>Device and browser information</li>
                  <li>IP address</li>
                  <li>Usage patterns and interactions</li>
                  <li>Time spent on pages</li>
                  <li>Pages visited</li>
                  <li>Referring website addresses</li>
                </ul>
                
                <h3 className="text-lg font-medium mb-2">2.3 Location Data</h3>
                <p className="text-gray-700">
                  With your consent, we may collect and process information about your precise location to provide waste collection services. This information may be collected through GPS, IP address, or other location-tracking technologies.
                </p>
              </section>
              
              <section>
                <h2 className="text-xl font-semibold mb-3">3. How We Use Your Information</h2>
                <p className="text-gray-700 mb-3">
                  We use your information for various purposes, including to:
                </p>
                <ul className="list-disc pl-6 mb-4 text-gray-700">
                  <li>Facilitate waste collection scheduling and management</li>
                  <li>Connect households with waste collectors and recyclers</li>
                  <li>Process your transactions and payments</li>
                  <li>Provide you with environmental impact metrics</li>
                  <li>Track your progress and award badges for sustainable actions</li>
                  <li>Communicate with you about your account, service updates, and promotions</li>
                  <li>Improve our platform's functionality and user experience</li>
                  <li>Monitor usage patterns and analyze trends</li>
                  <li>Prevent fraudulent activities and enforce our terms of use</li>
                </ul>
              </section>
              
              <section>
                <h2 className="text-xl font-semibold mb-3">4. Information Sharing and Disclosure</h2>
                <p className="text-gray-700 mb-3">
                  We may share your information in the following situations:
                </p>
                <ul className="list-disc pl-6 mb-4 text-gray-700">
                  <li><strong>Between Users:</strong> To facilitate waste collection services, we share relevant information between households, collectors, and recyclers as needed for service delivery.</li>
                  <li><strong>Service Providers:</strong> We may share your information with third-party vendors, service providers, and other contractors who perform services on our behalf.</li>
                  <li><strong>Business Transfers:</strong> We may share or transfer your information in connection with a merger, acquisition, reorganization, or sale of assets.</li>
                  <li><strong>Legal Requirements:</strong> We may disclose your information where required by law or to protect our rights, privacy, safety, or property.</li>
                </ul>
              </section>
              
              <section>
                <h2 className="text-xl font-semibold mb-3">5. Data Security</h2>
                <p className="text-gray-700">
                  We implement appropriate technical and organizational measures to protect your personal information from unauthorized access, disclosure, alteration, or destruction. However, no electronic transmission or storage technology is completely secure, and we cannot guarantee the absolute security of your data.
                </p>
              </section>
              
              <section>
                <h2 className="text-xl font-semibold mb-3">6. Your Privacy Rights</h2>
                <p className="text-gray-700 mb-3">
                  Depending on your location, you may have certain rights regarding your personal information, including:
                </p>
                <ul className="list-disc pl-6 mb-4 text-gray-700">
                  <li>The right to access the personal information we hold about you</li>
                  <li>The right to request correction of inaccurate information</li>
                  <li>The right to request deletion of your personal information</li>
                  <li>The right to restrict or object to processing of your personal information</li>
                  <li>The right to data portability</li>
                  <li>The right to withdraw consent at any time</li>
                </ul>
                <p className="text-gray-700">
                  To exercise these rights, please contact us at privacy@pipapal.app.
                </p>
              </section>
              
              <section>
                <h2 className="text-xl font-semibold mb-3">7. Children's Privacy</h2>
                <p className="text-gray-700">
                  Our platform is not intended for individuals under the age of 18. We do not knowingly collect personal information from children. If you are a parent or guardian and believe that your child has provided us with personal information, please contact us immediately.
                </p>
              </section>
              
              <section>
                <h2 className="text-xl font-semibold mb-3">8. Third-Party Links</h2>
                <p className="text-gray-700">
                  Our platform may contain links to third-party websites and services that are not operated by us. We have no control over the content, privacy policies, or practices of any third-party sites or services. We encourage you to review the privacy policies of these third parties.
                </p>
              </section>
              
              <section>
                <h2 className="text-xl font-semibold mb-3">9. Changes to This Privacy Policy</h2>
                <p className="text-gray-700">
                  We may update our Privacy Policy from time to time. The updated version will be indicated by the "Last Updated" date at the top of this page. We will notify you of any changes by posting the new Privacy Policy on this page or via email. You are advised to review this Privacy Policy periodically for any changes.
                </p>
              </section>
              
              <section>
                <h2 className="text-xl font-semibold mb-3">10. Contact Us</h2>
                <p className="text-gray-700">
                  If you have any questions or concerns about our Privacy Policy or our data practices, please contact us at:
                </p>
                <div className="mt-3">
                  <p className="text-gray-700"><strong>Email:</strong> privacy@pipapal.app</p>
                  <p className="text-gray-700"><strong>Phone:</strong> +254-116407400</p>
                  <p className="text-gray-700"><strong>Website:</strong> pipapal.app</p>
                </div>
              </section>
            </div>
          </CardContent>
        </Card>
      </div>
    </PublicLayout>
  );
}