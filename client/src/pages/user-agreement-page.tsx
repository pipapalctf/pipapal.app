import PublicNavbar from "@/components/shared/public-navbar";
import Footer from "@/components/shared/footer";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

export default function UserAgreementPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <PublicNavbar />

      <main className="flex-grow pb-24">
        <div className="container mx-auto py-8 px-4 mb-8">
          <div className="mb-6 mt-4">
            <Link href="/" className="flex items-center text-primary hover:underline">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Home
            </Link>
          </div>

          <Card className="max-w-4xl mx-auto shadow-md">
            <CardContent className="pt-6">
              <h1 className="text-3xl font-bold text-center mb-6">User Agreement</h1>
              <p className="text-sm text-muted-foreground text-center mb-6">
                Last Updated: February 25, 2026
              </p>
              <Separator className="mb-6" />

              <div className="space-y-6">
                <section>
                  <h2 className="text-xl font-semibold mb-3">1. Platform Usage Agreement</h2>
                  <p className="text-gray-700 mb-3">
                    This User Agreement ("Agreement") is a legally binding contract between you ("User", "you", or "your") and PipaPal Limited ("PipaPal", "we", "our", or "us"), a company registered under the laws of the Republic of Kenya. By creating an account and using the PipaPal platform, you agree to be bound by the terms of this Agreement.
                  </p>
                  <p className="text-gray-700 mb-3">
                    PipaPal provides a digital platform that connects households, waste collectors, recyclers, and organizations for the purpose of facilitating sustainable waste management services across Kenya. This Agreement governs your use of the platform, including all features, tools, and services made available through the PipaPal website and mobile applications.
                  </p>
                  <p className="text-gray-700">
                    By accessing or using the platform, you represent that you are at least 18 years of age and have the legal capacity to enter into this Agreement. If you are using the platform on behalf of an organization, you represent that you have the authority to bind that organization to this Agreement.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold mb-3">2. Role-Specific Obligations</h2>

                  <h3 className="text-lg font-medium mb-2">2.1 Household Users</h3>
                  <p className="text-gray-700 mb-3">As a Household user, you agree to:</p>
                  <ul className="list-disc pl-6 mb-4 text-gray-700">
                    <li>Provide accurate information about waste types and quantities when scheduling pickups</li>
                    <li>Properly segregate waste as instructed by the platform guidelines</li>
                    <li>Ensure waste is accessible and ready for collection at the scheduled time</li>
                    <li>Treat waste collectors with respect and dignity</li>
                    <li>Make timely payments for waste collection services as agreed</li>
                    <li>Comply with local county government waste management bylaws</li>
                  </ul>

                  <h3 className="text-lg font-medium mb-2">2.2 Waste Collectors</h3>
                  <p className="text-gray-700 mb-3">As a Waste Collector, you agree to:</p>
                  <ul className="list-disc pl-6 mb-4 text-gray-700">
                    <li>Hold and maintain all necessary licenses and permits required by Kenyan law and relevant county governments for waste collection activities</li>
                    <li>Arrive at scheduled collection points on time or communicate delays promptly</li>
                    <li>Handle waste safely and in compliance with applicable environmental and health regulations</li>
                    <li>Maintain accurate records of collections and deliveries</li>
                    <li>Dispose of or deliver collected waste only to authorized recycling centers or disposal facilities</li>
                    <li>Comply with the National Environment Management Authority (NEMA) regulations</li>
                  </ul>

                  <h3 className="text-lg font-medium mb-2">2.3 Recyclers</h3>
                  <p className="text-gray-700 mb-3">As a Recycler, you agree to:</p>
                  <ul className="list-disc pl-6 mb-4 text-gray-700">
                    <li>Hold valid NEMA licenses for recycling operations</li>
                    <li>Accurately represent your material processing capabilities and capacity</li>
                    <li>Process materials in an environmentally responsible manner</li>
                    <li>Provide accurate pricing for recyclable materials</li>
                    <li>Maintain proper documentation for materials received and processed</li>
                    <li>Comply with all applicable environmental standards and regulations</li>
                  </ul>

                  <h3 className="text-lg font-medium mb-2">2.4 Organizations</h3>
                  <p className="text-gray-700 mb-3">As an Organization, you agree to:</p>
                  <ul className="list-disc pl-6 mb-4 text-gray-700">
                    <li>Provide accurate organizational details including registration information</li>
                    <li>Designate authorized representatives to manage the organization's account</li>
                    <li>Ensure compliance with corporate waste management obligations under Kenyan law</li>
                    <li>Facilitate proper waste segregation within the organization</li>
                    <li>Make timely payments for waste management services</li>
                    <li>Cooperate with waste audits and environmental assessments as required</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl font-semibold mb-3">3. Data Processing Agreement</h2>
                  <p className="text-gray-700 mb-3">
                    In accordance with the Kenya Data Protection Act, 2019 ("DPA 2019"), you acknowledge and agree to the following data processing terms:
                  </p>
                  <ul className="list-disc pl-6 mb-4 text-gray-700">
                    <li><strong>Data Controller:</strong> PipaPal Limited acts as the data controller for personal data collected through the platform, as defined under Section 2 of the DPA 2019.</li>
                    <li><strong>Lawful Basis:</strong> We process your personal data based on your consent, the performance of this Agreement, compliance with legal obligations, and our legitimate interests in providing waste management services.</li>
                    <li><strong>Purpose Limitation:</strong> Your personal data will be processed only for the purposes specified in our <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a> and this Agreement, in compliance with Section 25 of the DPA 2019.</li>
                    <li><strong>Data Minimization:</strong> We collect only the personal data that is necessary for the provision of our services.</li>
                    <li><strong>Data Security:</strong> We implement appropriate technical and organizational measures to protect your personal data against unauthorized access, loss, destruction, or damage, as required by Section 41 of the DPA 2019.</li>
                    <li><strong>Data Subject Rights:</strong> You have the right to access, rectify, erase, restrict processing of, and port your personal data, and to object to processing, as provided under the DPA 2019.</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl font-semibold mb-3">4. Consent Management</h2>
                  <p className="text-gray-700 mb-3">
                    Your consent is important to us. Under the DPA 2019, you have the right to manage your consent preferences at any time:
                  </p>
                  <ul className="list-disc pl-6 mb-4 text-gray-700">
                    <li><strong>Withdrawing Consent:</strong> You may withdraw your consent for data processing at any time by contacting us at privacy@pipapal.app or through your account settings. Withdrawal of consent does not affect the lawfulness of processing carried out before the withdrawal.</li>
                    <li><strong>Selective Consent:</strong> You may provide or withdraw consent for specific types of data processing, such as marketing communications, location tracking, or analytics.</li>
                    <li><strong>Consequences of Withdrawal:</strong> Please note that withdrawing consent for essential data processing may limit or prevent your ability to use certain features of the platform. We will inform you of any such consequences before processing your withdrawal request.</li>
                    <li><strong>Consent Records:</strong> We maintain records of your consent in compliance with the DPA 2019, including the date, scope, and manner in which consent was given or withdrawn.</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl font-semibold mb-3">5. Service Level Expectations</h2>
                  <p className="text-gray-700 mb-3">
                    PipaPal strives to provide reliable and efficient waste management services. However, you acknowledge that:
                  </p>
                  <ul className="list-disc pl-6 mb-4 text-gray-700">
                    <li>The platform is provided on an "as-is" and "as-available" basis</li>
                    <li>Service availability may be affected by factors beyond our control, including weather, traffic, or infrastructure disruptions</li>
                    <li>We may need to perform scheduled maintenance, during which the platform may be temporarily unavailable</li>
                    <li>Response times for waste collection may vary depending on location, demand, and collector availability</li>
                    <li>We will use reasonable efforts to notify you of any service disruptions or schedule changes</li>
                    <li>Environmental or public health emergencies may affect service delivery timelines</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl font-semibold mb-3">6. Communication Preferences and Consent</h2>
                  <p className="text-gray-700 mb-3">
                    By using the platform, you consent to receiving the following types of communications:
                  </p>
                  <ul className="list-disc pl-6 mb-4 text-gray-700">
                    <li><strong>Service Communications:</strong> Notifications related to your waste collection schedules, account updates, and service delivery (required for platform use)</li>
                    <li><strong>Transactional Communications:</strong> Payment confirmations, receipts, and billing notifications via SMS, email, or in-app notifications</li>
                    <li><strong>Promotional Communications:</strong> Eco-tips, sustainability updates, and promotional offers (you may opt out at any time through your account settings)</li>
                    <li><strong>Platform Updates:</strong> Notifications about changes to our terms, policies, or platform features</li>
                  </ul>
                  <p className="text-gray-700">
                    You may manage your communication preferences through your account settings or by contacting us at support@pipapal.app. Please note that opting out of service and transactional communications may affect your ability to use the platform.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold mb-3">7. Location Data Usage Agreement</h2>
                  <p className="text-gray-700 mb-3">
                    The PipaPal platform uses location data to provide waste management services. By using the platform, you acknowledge and agree that:
                  </p>
                  <ul className="list-disc pl-6 mb-4 text-gray-700">
                    <li><strong>Collection Purpose:</strong> Location data is collected to facilitate waste pickup scheduling, route optimization for collectors, and to connect you with nearby recycling centers and services</li>
                    <li><strong>GPS and Device Location:</strong> With your explicit consent, we may access your device's GPS to determine your precise location for service delivery purposes</li>
                    <li><strong>Address Information:</strong> Your registered address and pickup locations are stored to coordinate collection services</li>
                    <li><strong>Collector Tracking:</strong> During active collection routes, collector location may be shared with relevant household users to provide estimated arrival times</li>
                    <li><strong>Data Retention:</strong> Location data associated with completed collections is retained for service improvement and dispute resolution purposes, in accordance with our data retention policy</li>
                    <li><strong>Opt-Out:</strong> You may disable location services through your device settings at any time, though this may limit certain platform features</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl font-semibold mb-3">8. M-Pesa Payment Authorization</h2>
                  <p className="text-gray-700 mb-3">
                    PipaPal integrates with Safaricom's M-Pesa mobile money service for payment processing. By using M-Pesa payments on the platform, you agree to the following:
                  </p>
                  <ul className="list-disc pl-6 mb-4 text-gray-700">
                    <li><strong>Payment Authorization:</strong> You authorize PipaPal to initiate M-Pesa payment requests (STK Push) to your registered M-Pesa phone number for waste collection and related services</li>
                    <li><strong>Transaction Records:</strong> PipaPal will maintain records of all M-Pesa transactions processed through the platform, including transaction IDs, amounts, and timestamps</li>
                    <li><strong>Safaricom Terms:</strong> M-Pesa transactions are additionally subject to Safaricom's M-Pesa terms and conditions. PipaPal is not responsible for M-Pesa service disruptions caused by Safaricom</li>
                    <li><strong>Refunds:</strong> Refund requests for M-Pesa payments will be processed in accordance with our refund policy and may take up to 7 business days to reflect in your M-Pesa account</li>
                    <li><strong>Transaction Limits:</strong> M-Pesa transactions are subject to Safaricom's daily and per-transaction limits</li>
                    <li><strong>Payment Data Security:</strong> We do not store your M-Pesa PIN. Payment processing is handled securely through Safaricom's APIs in compliance with applicable payment processing regulations</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl font-semibold mb-3">9. Dispute Resolution</h2>
                  <p className="text-gray-700 mb-3">
                    In the event of any dispute arising out of or in connection with this Agreement, the parties agree to the following resolution mechanism:
                  </p>
                  <ul className="list-disc pl-6 mb-4 text-gray-700">
                    <li><strong>Internal Resolution:</strong> You are encouraged to first contact our support team at support@pipapal.app or through the in-app chat feature. We will endeavor to resolve complaints within 14 business days</li>
                    <li><strong>Mediation:</strong> If the dispute cannot be resolved internally, either party may refer the matter to mediation under the Mediation Act (No. 4 of 2020) of Kenya</li>
                    <li><strong>Arbitration:</strong> If mediation is unsuccessful, the dispute shall be referred to and finally resolved by arbitration under the Arbitration Act (Cap. 49) of Kenya, administered by the Nairobi Centre for International Arbitration (NCIA)</li>
                    <li><strong>Data Protection Complaints:</strong> For disputes related to data protection, you have the right to lodge a complaint with the Office of the Data Protection Commissioner (ODPC) at complaints@odpc.go.ke</li>
                    <li><strong>Consumer Rights:</strong> Nothing in this dispute resolution clause limits your rights under the Consumer Protection Act, 2012 of Kenya</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl font-semibold mb-3">10. Agreement Modification</h2>
                  <p className="text-gray-700 mb-3">
                    PipaPal reserves the right to modify this Agreement at any time. Any modifications will be subject to the following procedures:
                  </p>
                  <ul className="list-disc pl-6 mb-4 text-gray-700">
                    <li><strong>Notice:</strong> We will provide at least 30 days' notice before any material changes to this Agreement take effect, via email, in-app notification, or by posting the updated Agreement on the platform</li>
                    <li><strong>Consent:</strong> For changes that affect your data processing rights under the DPA 2019, we will seek your explicit consent before the changes take effect</li>
                    <li><strong>Review Period:</strong> You will have a reasonable period to review and accept or reject the modified terms</li>
                    <li><strong>Right to Terminate:</strong> If you do not agree to the modified terms, you may terminate your account and this Agreement by providing written notice before the changes take effect</li>
                    <li><strong>Continued Use:</strong> Your continued use of the platform after the effective date of the modified terms constitutes your acceptance of the changes</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl font-semibold mb-3">11. Governing Law</h2>
                  <p className="text-gray-700 mb-3">
                    This Agreement shall be governed by and construed in accordance with the laws of the Republic of Kenya, including but not limited to:
                  </p>
                  <ul className="list-disc pl-6 mb-4 text-gray-700">
                    <li>The Data Protection Act, 2019</li>
                    <li>The Environmental Management and Co-ordination Act (EMCA), 1999</li>
                    <li>The Consumer Protection Act, 2012</li>
                    <li>The National Payment System Act, 2011</li>
                    <li>Relevant county government waste management bylaws</li>
                    <li>The Computer Misuse and Cybercrimes Act, 2018</li>
                  </ul>
                  <p className="text-gray-700">
                    Any legal proceedings arising out of or in connection with this Agreement shall be subject to the exclusive jurisdiction of the courts of the Republic of Kenya.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold mb-3">12. Contact Us</h2>
                  <p className="text-gray-700 mb-3">
                    If you have any questions about this User Agreement, please contact us:
                  </p>
                  <div className="mt-3">
                    <p className="text-gray-700"><strong>PipaPal Limited</strong></p>
                    <p className="text-gray-700"><strong>Email:</strong> support@pipapal.app</p>
                    <p className="text-gray-700"><strong>Data Protection Officer:</strong> privacy@pipapal.app</p>
                    <p className="text-gray-700"><strong>Phone:</strong> +254-116407400</p>
                    <p className="text-gray-700"><strong>Website:</strong> pipapal.app</p>
                  </div>
                  <div className="mt-4">
                    <p className="text-gray-700 text-sm">
                      <strong>Office of the Data Protection Commissioner (ODPC)</strong><br />
                      Email: complaints@odpc.go.ke<br />
                      Website: www.odpc.go.ke
                    </p>
                  </div>
                </section>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}