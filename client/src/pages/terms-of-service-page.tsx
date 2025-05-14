import { PublicLayout } from "@/components/layouts/public-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

export default function TermsOfServicePage() {
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
            <h1 className="text-3xl font-bold text-center mb-6">Terms of Service</h1>
            <p className="text-sm text-muted-foreground text-center mb-6">
              Last Updated: May 14, 2025
            </p>
            <Separator className="mb-6" />
            
            <div className="space-y-6">
              <section>
                <h2 className="text-xl font-semibold mb-3">1. Agreement to Terms</h2>
                <p className="text-gray-700">
                  These Terms of Service ("Terms") govern your access to and use of the PipaPal waste management platform, services, and mobile application (collectively, the "Service"). By accessing or using the Service, you agree to be bound by these Terms. If you disagree with any part of the Terms, you may not access the Service.
                </p>
              </section>
              
              <section>
                <h2 className="text-xl font-semibold mb-3">2. Definitions</h2>
                <ul className="list-disc pl-6 mb-4 text-gray-700">
                  <li><strong>"PipaPal"</strong> or <strong>"we"</strong> refers to the company operating the waste management platform.</li>
                  <li><strong>"User"</strong>, <strong>"you"</strong>, or <strong>"your"</strong> refers to individuals or entities using our Service.</li>
                  <li><strong>"Household"</strong> refers to residential users who schedule waste collection.</li>
                  <li><strong>"Collector"</strong> refers to waste collection service providers registered on the platform.</li>
                  <li><strong>"Recycler"</strong> refers to recycling facilities registered on the platform.</li>
                  <li><strong>"Organization"</strong> refers to business entities registered as waste generators.</li>
                </ul>
              </section>
              
              <section>
                <h2 className="text-xl font-semibold mb-3">3. User Accounts</h2>
                
                <h3 className="text-lg font-medium mb-2">3.1 Account Creation</h3>
                <p className="text-gray-700 mb-3">
                  To use certain features of the Service, you must register for an account. You must provide accurate, current, and complete information and keep your account information updated. You are responsible for maintaining the confidentiality of your account credentials.
                </p>
                
                <h3 className="text-lg font-medium mb-2">3.2 Account Types</h3>
                <p className="text-gray-700 mb-3">
                  The Service offers different account types based on user roles (Household, Collector, Recycler, Organization). Each role has specific permissions, responsibilities, and features. You must select the appropriate account type that accurately reflects your role in the waste management ecosystem.
                </p>
                
                <h3 className="text-lg font-medium mb-2">3.3 Account Security</h3>
                <p className="text-gray-700 mb-3">
                  You are responsible for all activities that occur under your account. Notify us immediately of any unauthorized use of your account or any other breach of security. We will not be liable for any loss or damage arising from your failure to maintain account security.
                </p>
              </section>
              
              <section>
                <h2 className="text-xl font-semibold mb-3">4. Service Description</h2>
                <p className="text-gray-700 mb-3">
                  PipaPal is a waste management platform that connects households and organizations with waste collectors and recyclers. The Service facilitates:
                </p>
                <ul className="list-disc pl-6 mb-4 text-gray-700">
                  <li>Scheduling waste collection pickups</li>
                  <li>Tracking waste collection status</li>
                  <li>Monitoring environmental impact of waste management</li>
                  <li>Providing educational content on sustainable waste practices</li>
                  <li>Connecting users with recycling centers</li>
                  <li>Tracking waste collection history and statistics</li>
                </ul>
              </section>
              
              <section>
                <h2 className="text-xl font-semibold mb-3">5. User Responsibilities</h2>
                
                <h3 className="text-lg font-medium mb-2">5.1 General Responsibilities</h3>
                <p className="text-gray-700 mb-3">
                  All users are responsible for:
                </p>
                <ul className="list-disc pl-6 mb-4 text-gray-700">
                  <li>Providing accurate and truthful information</li>
                  <li>Using the Service in compliance with applicable laws and regulations</li>
                  <li>Respecting the rights of other users</li>
                  <li>Protecting their account credentials</li>
                  <li>Not engaging in fraudulent, deceptive, or harmful activities</li>
                </ul>
                
                <h3 className="text-lg font-medium mb-2">5.2 Household/Organization Responsibilities</h3>
                <p className="text-gray-700 mb-3">
                  Households and Organizations are responsible for:
                </p>
                <ul className="list-disc pl-6 mb-4 text-gray-700">
                  <li>Accurately describing waste types and quantities when scheduling collection</li>
                  <li>Ensuring waste is properly sorted and prepared as specified</li>
                  <li>Being available at the scheduled collection time or providing clear access instructions</li>
                  <li>Paying for services as agreed</li>
                </ul>
                
                <h3 className="text-lg font-medium mb-2">5.3 Collector Responsibilities</h3>
                <p className="text-gray-700 mb-3">
                  Waste Collectors are responsible for:
                </p>
                <ul className="list-disc pl-6 mb-4 text-gray-700">
                  <li>Providing accurate information about service areas and capabilities</li>
                  <li>Adhering to scheduled pickup times or providing timely notification of changes</li>
                  <li>Collecting waste in accordance with environmental regulations</li>
                  <li>Properly handling and transporting collected waste</li>
                  <li>Maintaining necessary licenses and permits for waste collection</li>
                </ul>
                
                <h3 className="text-lg font-medium mb-2">5.4 Recycler Responsibilities</h3>
                <p className="text-gray-700 mb-3">
                  Recyclers are responsible for:
                </p>
                <ul className="list-disc pl-6 mb-4 text-gray-700">
                  <li>Providing accurate information about accepted materials and capacity</li>
                  <li>Processing received materials in accordance with environmental regulations</li>
                  <li>Maintaining necessary licenses and permits for recycling operations</li>
                </ul>
              </section>
              
              <section>
                <h2 className="text-xl font-semibold mb-3">6. Payment Terms</h2>
                <p className="text-gray-700 mb-3">
                  When applicable, payment for waste collection services is processed through our platform. By using the payment features of the Service:
                </p>
                <ul className="list-disc pl-6 mb-4 text-gray-700">
                  <li>You agree to pay all fees and charges associated with your account based on the rates specified</li>
                  <li>You authorize us to charge the payment method associated with your account</li>
                  <li>You are responsible for any taxes applicable to your use of the Service</li>
                  <li>You understand that rates may vary based on waste type, quantity, location, and special handling requirements</li>
                </ul>
              </section>
              
              <section>
                <h2 className="text-xl font-semibold mb-3">7. Intellectual Property</h2>
                <p className="text-gray-700 mb-3">
                  The Service and its original content, features, and functionality are owned by PipaPal and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws. You may not reproduce, distribute, modify, create derivative works of, publicly display, or exploit any portion of our Service without prior written consent.
                </p>
              </section>
              
              <section>
                <h2 className="text-xl font-semibold mb-3">8. User Content</h2>
                <p className="text-gray-700 mb-3">
                  Our Service allows you to post, link, store, share, and otherwise make available certain information, text, graphics, or other material. By providing User Content, you:
                </p>
                <ul className="list-disc pl-6 mb-4 text-gray-700">
                  <li>Grant us a non-exclusive, royalty-free, transferable, sublicensable, worldwide license to use, store, display, reproduce, and distribute your User Content in connection with the Service</li>
                  <li>Represent and warrant that you own or have the necessary rights to your User Content</li>
                  <li>Agree that your User Content will not violate the rights of any third party or any law or regulation</li>
                </ul>
              </section>
              
              <section>
                <h2 className="text-xl font-semibold mb-3">9. Prohibited Activities</h2>
                <p className="text-gray-700 mb-3">
                  You may not engage in any of the following prohibited activities:
                </p>
                <ul className="list-disc pl-6 mb-4 text-gray-700">
                  <li>Using the Service for any illegal purpose or in violation of any laws</li>
                  <li>Violating any regulations, rules, or procedures established for the Service</li>
                  <li>Impersonating another person or entity</li>
                  <li>Harassing, threatening, or intimidating other users</li>
                  <li>Attempting to obtain unauthorized access to parts of the Service</li>
                  <li>Interfering with or disrupting the Service or its servers</li>
                  <li>Attempting to reverse engineer any code or algorithm used by the Service</li>
                  <li>Uploading or transmitting viruses or malicious code</li>
                </ul>
              </section>
              
              <section>
                <h2 className="text-xl font-semibold mb-3">10. Limitation of Liability</h2>
                <p className="text-gray-700 mb-3">
                  To the maximum extent permitted by law:
                </p>
                <ul className="list-disc pl-6 mb-4 text-gray-700">
                  <li>PipaPal shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use or inability to use the Service</li>
                  <li>Our liability is limited to the amount you paid to us in the 12 months preceding the event giving rise to liability</li>
                  <li>We do not guarantee the continuous, uninterrupted, or secure access to the Service</li>
                </ul>
              </section>
              
              <section>
                <h2 className="text-xl font-semibold mb-3">11. Indemnification</h2>
                <p className="text-gray-700">
                  You agree to indemnify, defend, and hold harmless PipaPal, its affiliates, officers, directors, employees, and agents from any claims, liabilities, damages, losses, costs, or expenses, including reasonable attorneys' fees, arising out of or in any way connected with your access to or use of the Service or your violation of these Terms.
                </p>
              </section>
              
              <section>
                <h2 className="text-xl font-semibold mb-3">12. Term and Termination</h2>
                <p className="text-gray-700 mb-3">
                  These Terms shall remain in full force and effect while you use the Service. We may terminate or suspend your account immediately, without prior notice or liability, for any reason, including if you breach the Terms. Upon termination, your right to use the Service will immediately cease.
                </p>
              </section>
              
              <section>
                <h2 className="text-xl font-semibold mb-3">13. Changes to Terms</h2>
                <p className="text-gray-700">
                  We reserve the right to modify or replace these Terms at any time. We will provide notice of changes by updating the "Last Updated" date at the top of these Terms. Your continued use of the Service after any such changes constitute your acceptance of the new Terms.
                </p>
              </section>
              
              <section>
                <h2 className="text-xl font-semibold mb-3">14. Governing Law</h2>
                <p className="text-gray-700">
                  These Terms shall be governed by and construed in accordance with the laws of Kenya, without regard to its conflict of law provisions. Any disputes arising from these Terms shall be subject to the exclusive jurisdiction of the courts of Kenya.
                </p>
              </section>
              
              <section>
                <h2 className="text-xl font-semibold mb-3">15. Contact Us</h2>
                <p className="text-gray-700">
                  If you have any questions about these Terms, please contact us at:
                </p>
                <div className="mt-3">
                  <p className="text-gray-700"><strong>Email:</strong> legal@pipapal.app</p>
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