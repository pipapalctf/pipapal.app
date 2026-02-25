import PublicNavbar from "@/components/shared/public-navbar";
import Footer from "@/components/shared/footer";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

export default function TermsOfServicePage() {
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
              <h1 className="text-3xl font-bold text-center mb-6">Terms of Service</h1>
              <p className="text-sm text-muted-foreground text-center mb-6">
                Last Updated: February 25, 2026
              </p>
              <Separator className="mb-6" />
              
              <div className="space-y-6">
                <section>
                  <h2 className="text-xl font-semibold mb-3">1. Agreement to Terms</h2>
                  <p className="text-gray-700 mb-3">
                    These Terms of Service ("Terms") govern your access to and use of the PipaPal waste management platform, services, and mobile application (collectively, the "Service"). By accessing or using the Service, you agree to be bound by these Terms and all applicable laws and regulations of the Republic of Kenya, including the Data Protection Act, 2019 (the "DPA 2019"), the Environmental Management and Co-ordination Act (EMCA), 1999, and all applicable county government waste management bylaws.
                  </p>
                  <p className="text-gray-700">
                    If you disagree with any part of the Terms, you may not access the Service. These Terms constitute a legally binding agreement between you and PipaPal under the Laws of Kenya.
                  </p>
                </section>
                
                <section>
                  <h2 className="text-xl font-semibold mb-3">2. Definitions</h2>
                  <ul className="list-disc pl-6 mb-4 text-gray-700">
                    <li><strong>"PipaPal"</strong> or <strong>"we"</strong> refers to the company operating the waste management platform, acting as Data Controller under the DPA 2019.</li>
                    <li><strong>"User"</strong>, <strong>"you"</strong>, or <strong>"your"</strong> refers to individuals or entities using our Service, including Data Subjects under the DPA 2019.</li>
                    <li><strong>"Household"</strong> refers to residential users who schedule waste collection.</li>
                    <li><strong>"Collector"</strong> refers to waste collection service providers registered on the platform.</li>
                    <li><strong>"Recycler"</strong> refers to recycling facilities registered on the platform.</li>
                    <li><strong>"Organization"</strong> refers to business entities registered as waste generators.</li>
                    <li><strong>"Personal Data"</strong> has the meaning ascribed to it under Section 2 of the DPA 2019.</li>
                    <li><strong>"NEMA"</strong> refers to the National Environment Management Authority of Kenya.</li>
                    <li><strong>"ODPC"</strong> refers to the Office of the Data Protection Commissioner of Kenya.</li>
                  </ul>
                </section>
                
                <section>
                  <h2 className="text-xl font-semibold mb-3">3. Eligibility</h2>
                  <p className="text-gray-700 mb-3">
                    You must be at least 18 years of age to use this Service. By using the Service, you represent and warrant that you are at least 18 years old and have the legal capacity to enter into a binding agreement under the Laws of Kenya. PipaPal does not knowingly collect or process personal data from individuals under the age of 18, in compliance with the DPA 2019 provisions on the processing of children's data.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold mb-3">4. User Accounts</h2>
                  
                  <h3 className="text-lg font-medium mb-2">4.1 Account Creation</h3>
                  <p className="text-gray-700 mb-3">
                    To use certain features of the Service, you must register for an account. You must provide accurate, current, and complete information and keep your account information updated. You are responsible for maintaining the confidentiality of your account credentials. All personal data provided during registration will be processed in accordance with our Privacy Policy and the DPA 2019.
                  </p>
                  
                  <h3 className="text-lg font-medium mb-2">4.2 Account Types</h3>
                  <p className="text-gray-700 mb-3">
                    The Service offers different account types based on user roles (Household, Collector, Recycler, Organization). Each role has specific permissions, responsibilities, and features. You must select the appropriate account type that accurately reflects your role in the waste management ecosystem.
                  </p>
                  
                  <h3 className="text-lg font-medium mb-2">4.3 Account Security</h3>
                  <p className="text-gray-700 mb-3">
                    You are responsible for all activities that occur under your account. Notify us immediately of any unauthorized use of your account or any other breach of security. We implement appropriate technical and organizational measures to protect your account data as required under the DPA 2019.
                  </p>
                </section>
                
                <section>
                  <h2 className="text-xl font-semibold mb-3">5. Service Description</h2>
                  <p className="text-gray-700 mb-3">
                    PipaPal is a waste management platform that connects households and organizations with waste collectors and recyclers within the Republic of Kenya. The Service facilitates:
                  </p>
                  <ul className="list-disc pl-6 mb-4 text-gray-700">
                    <li>Scheduling waste collection pickups</li>
                    <li>Tracking waste collection status</li>
                    <li>Monitoring environmental impact of waste management</li>
                    <li>Providing educational content on sustainable waste practices</li>
                    <li>Connecting users with recycling centers</li>
                    <li>Tracking waste collection history and statistics</li>
                    <li>Processing payments via M-Pesa and other payment methods</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl font-semibold mb-3">6. Data Processing Consent and Rights</h2>

                  <h3 className="text-lg font-medium mb-2">6.1 Consent for Data Processing</h3>
                  <p className="text-gray-700 mb-3">
                    By using the Service and accepting these Terms, you consent to the collection, processing, and storage of your personal data as described in our Privacy Policy. This consent is provided in accordance with Section 32 of the DPA 2019. The lawful bases for processing your data include your explicit consent, the performance of our contract with you, compliance with legal obligations, and our legitimate interests in providing the Service.
                  </p>

                  <h3 className="text-lg font-medium mb-2">6.2 Right to Withdraw Consent</h3>
                  <p className="text-gray-700 mb-3">
                    You have the right to withdraw your consent to data processing at any time, in accordance with Section 32(4) of the DPA 2019. Withdrawal of consent does not affect the lawfulness of processing based on consent before its withdrawal. You may withdraw consent by contacting us at privacy@pipapal.app or through the account settings in the platform. Please note that withdrawal of consent may limit your ability to use certain features of the Service.
                  </p>

                  <h3 className="text-lg font-medium mb-2">6.3 Your Data Rights Under the DPA 2019</h3>
                  <p className="text-gray-700 mb-3">
                    As a data subject under the DPA 2019, you have the following rights:
                  </p>
                  <ul className="list-disc pl-6 mb-4 text-gray-700">
                    <li><strong>Right of Access:</strong> You may request access to your personal data held by PipaPal (Section 26(a)).</li>
                    <li><strong>Right to Rectification:</strong> You may request correction of inaccurate or incomplete personal data (Section 26(c)).</li>
                    <li><strong>Right to Erasure:</strong> You may request deletion of your personal data, subject to legal retention requirements (Section 26(d)).</li>
                    <li><strong>Right to Restriction:</strong> You may request the restriction of processing of your personal data in certain circumstances.</li>
                    <li><strong>Right to Data Portability:</strong> You may request a copy of your personal data in a structured, commonly used, and machine-readable format.</li>
                    <li><strong>Right to Object:</strong> You may object to the processing of your personal data for direct marketing or other purposes (Section 26(g)).</li>
                    <li><strong>Right Not to be Subject to Automated Decision-Making:</strong> You have the right not to be subject to decisions based solely on automated processing, including profiling (Section 35).</li>
                  </ul>
                  <p className="text-gray-700">
                    To exercise any of these rights, please contact our Data Protection Officer at dpo@pipapal.app. We will respond to your request within 30 days as required by the DPA 2019.
                  </p>
                </section>
                
                <section>
                  <h2 className="text-xl font-semibold mb-3">7. User Responsibilities</h2>
                  
                  <h3 className="text-lg font-medium mb-2">7.1 General Responsibilities</h3>
                  <p className="text-gray-700 mb-3">
                    All users are responsible for:
                  </p>
                  <ul className="list-disc pl-6 mb-4 text-gray-700">
                    <li>Providing accurate and truthful information</li>
                    <li>Using the Service in compliance with the Laws of Kenya, including environmental and data protection laws</li>
                    <li>Respecting the rights of other users</li>
                    <li>Protecting their account credentials</li>
                    <li>Not engaging in fraudulent, deceptive, or harmful activities</li>
                    <li>Complying with applicable county government waste management bylaws</li>
                  </ul>
                  
                  <h3 className="text-lg font-medium mb-2">7.2 Household/Organization Responsibilities</h3>
                  <p className="text-gray-700 mb-3">
                    Households and Organizations are responsible for:
                  </p>
                  <ul className="list-disc pl-6 mb-4 text-gray-700">
                    <li>Accurately describing waste types and quantities when scheduling collection</li>
                    <li>Ensuring waste is properly sorted and prepared as specified</li>
                    <li>Being available at the scheduled collection time or providing clear access instructions</li>
                    <li>Paying for services as agreed</li>
                    <li>Segregating hazardous waste in accordance with NEMA regulations</li>
                  </ul>
                  
                  <h3 className="text-lg font-medium mb-2">7.3 Collector Responsibilities</h3>
                  <p className="text-gray-700 mb-3">
                    Waste Collectors are responsible for:
                  </p>
                  <ul className="list-disc pl-6 mb-4 text-gray-700">
                    <li>Providing accurate information about service areas and capabilities</li>
                    <li>Adhering to scheduled pickup times or providing timely notification of changes</li>
                    <li>Collecting waste in accordance with NEMA environmental regulations and county government bylaws</li>
                    <li>Properly handling and transporting collected waste to approved disposal or recycling facilities</li>
                    <li>Maintaining necessary licenses and permits for waste collection as required by NEMA and the relevant county government</li>
                    <li>Complying with the Environmental Management and Co-ordination (Waste Management) Regulations, 2006</li>
                  </ul>
                  
                  <h3 className="text-lg font-medium mb-2">7.4 Recycler Responsibilities</h3>
                  <p className="text-gray-700 mb-3">
                    Recyclers are responsible for:
                  </p>
                  <ul className="list-disc pl-6 mb-4 text-gray-700">
                    <li>Providing accurate information about accepted materials and capacity</li>
                    <li>Processing received materials in accordance with NEMA regulations and applicable environmental laws</li>
                    <li>Maintaining necessary licenses and permits for recycling operations as required by NEMA</li>
                    <li>Maintaining proper records of materials received and processed</li>
                    <li>Complying with the Environmental Management and Co-ordination Act (EMCA), 1999</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl font-semibold mb-3">8. Environmental Compliance</h2>
                  <p className="text-gray-700 mb-3">
                    All users of the Service must comply with applicable environmental laws and regulations, including but not limited to:
                  </p>
                  <ul className="list-disc pl-6 mb-4 text-gray-700">
                    <li>The Environmental Management and Co-ordination Act (EMCA), 1999 and its amendments</li>
                    <li>The Environmental Management and Co-ordination (Waste Management) Regulations, 2006</li>
                    <li>National Environment Management Authority (NEMA) guidelines and directives</li>
                    <li>Applicable county government waste management bylaws and regulations</li>
                    <li>The Sustainable Waste Management Act, 2022 (where applicable)</li>
                  </ul>
                  <p className="text-gray-700 mb-3">
                    PipaPal operates as a technology platform facilitating waste management services. Collectors and Recyclers are independently responsible for obtaining and maintaining all licenses, permits, and approvals required by NEMA and their respective county governments to carry out waste collection and recycling activities.
                  </p>
                  <p className="text-gray-700">
                    PipaPal reserves the right to suspend or terminate accounts of users found to be in violation of environmental laws and regulations or who fail to maintain required permits and licenses.
                  </p>
                </section>
                
                <section>
                  <h2 className="text-xl font-semibold mb-3">9. Payment Terms and M-Pesa Integration</h2>

                  <h3 className="text-lg font-medium mb-2">9.1 Payment Methods</h3>
                  <p className="text-gray-700 mb-3">
                    PipaPal primarily processes payments through Safaricom's M-Pesa mobile money platform. By using the payment features of the Service, you agree to the following:
                  </p>
                  <ul className="list-disc pl-6 mb-4 text-gray-700">
                    <li>You authorize PipaPal to initiate M-Pesa STK Push requests to your registered mobile phone number for payment processing</li>
                    <li>You acknowledge that M-Pesa transactions are subject to Safaricom's terms and conditions</li>
                    <li>You are responsible for ensuring sufficient funds in your M-Pesa account before initiating a transaction</li>
                    <li>Transaction fees charged by Safaricom for M-Pesa transactions are your responsibility unless otherwise stated</li>
                  </ul>

                  <h3 className="text-lg font-medium mb-2">9.2 Payment Processing</h3>
                  <p className="text-gray-700 mb-3">
                    Payment for waste collection services is facilitated through our platform. By using the Service:
                  </p>
                  <ul className="list-disc pl-6 mb-4 text-gray-700">
                    <li>You agree to pay all fees and charges associated with services rendered at the rates specified at the time of booking</li>
                    <li>Prices are quoted in Kenya Shillings (KES)</li>
                    <li>PipaPal may charge a service fee for facilitating transactions</li>
                    <li>You are responsible for any applicable taxes, including VAT as required under Kenyan tax law</li>
                    <li>Rates may vary based on waste type, quantity, location, and special handling requirements</li>
                  </ul>

                  <h3 className="text-lg font-medium mb-2">9.3 Refunds and Disputes</h3>
                  <p className="text-gray-700 mb-3">
                    Refund requests for failed or incomplete services must be submitted within 7 days of the scheduled service. PipaPal will review refund requests and process approved refunds to your M-Pesa account within 14 business days. Disputes regarding payments should be directed to support@pipapal.app.
                  </p>

                  <h3 className="text-lg font-medium mb-2">9.4 M-Pesa Data Processing</h3>
                  <p className="text-gray-700">
                    When processing M-Pesa payments, PipaPal collects and processes your M-Pesa phone number, transaction reference numbers, and payment amounts. This data is processed in accordance with the DPA 2019, Safaricom's data protection policies, and the Central Bank of Kenya's regulations on mobile money services.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold mb-3">10. Intellectual Property</h2>
                  <p className="text-gray-700 mb-3">
                    The Service and its original content, features, and functionality are owned by PipaPal and are protected by the Laws of Kenya, including the Kenya Copyright Act, the Trade Marks Act, and other applicable intellectual property laws. You may not reproduce, distribute, modify, create derivative works of, publicly display, or exploit any portion of our Service without prior written consent.
                  </p>
                </section>
                
                <section>
                  <h2 className="text-xl font-semibold mb-3">11. User Content</h2>
                  <p className="text-gray-700 mb-3">
                    Our Service allows you to post, link, store, share, and otherwise make available certain information, text, graphics, or other material. By providing User Content, you:
                  </p>
                  <ul className="list-disc pl-6 mb-4 text-gray-700">
                    <li>Grant us a non-exclusive, royalty-free, transferable, sublicensable license to use, store, display, reproduce, and distribute your User Content in connection with the Service within the Republic of Kenya and as necessary for the provision of the Service</li>
                    <li>Represent and warrant that you own or have the necessary rights to your User Content</li>
                    <li>Agree that your User Content will not violate the rights of any third party or any law or regulation of the Republic of Kenya</li>
                    <li>Acknowledge that any personal data contained in User Content will be processed in accordance with the DPA 2019</li>
                  </ul>
                </section>
                
                <section>
                  <h2 className="text-xl font-semibold mb-3">12. Prohibited Activities</h2>
                  <p className="text-gray-700 mb-3">
                    You may not engage in any of the following prohibited activities:
                  </p>
                  <ul className="list-disc pl-6 mb-4 text-gray-700">
                    <li>Using the Service for any illegal purpose or in violation of the Laws of Kenya</li>
                    <li>Violating any regulations, rules, or procedures established for the Service</li>
                    <li>Impersonating another person or entity</li>
                    <li>Harassing, threatening, or intimidating other users</li>
                    <li>Attempting to obtain unauthorized access to parts of the Service or other users' personal data</li>
                    <li>Interfering with or disrupting the Service or its servers</li>
                    <li>Attempting to reverse engineer any code or algorithm used by the Service</li>
                    <li>Uploading or transmitting viruses or malicious code</li>
                    <li>Illegal dumping or improper disposal of waste in violation of NEMA regulations</li>
                    <li>Using the platform to facilitate the transport or disposal of prohibited or hazardous waste without proper authorization</li>
                    <li>Misrepresenting the nature, type, or quantity of waste for collection</li>
                  </ul>
                </section>
                
                <section>
                  <h2 className="text-xl font-semibold mb-3">13. Limitation of Liability</h2>
                  <p className="text-gray-700 mb-3">
                    To the maximum extent permitted under the Laws of Kenya:
                  </p>
                  <ul className="list-disc pl-6 mb-4 text-gray-700">
                    <li>PipaPal shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use or inability to use the Service</li>
                    <li>Our aggregate liability to you for all claims arising from or relating to these Terms or the Service shall not exceed the total amount you paid to us in the 12 months preceding the event giving rise to liability</li>
                    <li>We do not guarantee the continuous, uninterrupted, or secure access to the Service</li>
                    <li>PipaPal is not responsible for the actions or omissions of third-party service providers, including Collectors, Recyclers, and payment providers such as Safaricom (M-Pesa)</li>
                    <li>PipaPal shall not be liable for any environmental damage caused by the actions of Collectors, Recyclers, or other users in violation of NEMA regulations or applicable county bylaws</li>
                  </ul>
                  <p className="text-gray-700">
                    Nothing in these Terms excludes or limits liability that cannot be excluded or limited under the Laws of Kenya, including liability for fraud, gross negligence, or willful misconduct.
                  </p>
                </section>
                
                <section>
                  <h2 className="text-xl font-semibold mb-3">14. Indemnification</h2>
                  <p className="text-gray-700">
                    You agree to indemnify, defend, and hold harmless PipaPal, its affiliates, officers, directors, employees, and agents from any claims, liabilities, damages, losses, costs, or expenses, including reasonable attorneys' fees, arising out of or in any way connected with your access to or use of the Service, your violation of these Terms, your violation of any environmental law or regulation including NEMA requirements, or your violation of any data protection obligations under the DPA 2019.
                  </p>
                </section>
                
                <section>
                  <h2 className="text-xl font-semibold mb-3">15. Term and Termination</h2>
                  <p className="text-gray-700 mb-3">
                    These Terms shall remain in full force and effect while you use the Service. We may terminate or suspend your account immediately, without prior notice or liability, for any reason, including if you breach the Terms or applicable Kenyan laws. Upon termination:
                  </p>
                  <ul className="list-disc pl-6 mb-4 text-gray-700">
                    <li>Your right to use the Service will immediately cease</li>
                    <li>We will retain your personal data only as required by law or for our legitimate interests, in accordance with the DPA 2019</li>
                    <li>You may request deletion of your personal data by contacting dpo@pipapal.app, subject to our legal retention obligations</li>
                    <li>Any outstanding payment obligations will survive termination</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl font-semibold mb-3">16. Dispute Resolution</h2>

                  <h3 className="text-lg font-medium mb-2">16.1 Informal Resolution</h3>
                  <p className="text-gray-700 mb-3">
                    Before initiating any formal dispute resolution proceedings, you agree to first attempt to resolve any dispute or claim arising out of or relating to these Terms or the Service through informal negotiation by contacting us at legal@pipapal.app. We will endeavour to resolve the dispute within 30 days.
                  </p>

                  <h3 className="text-lg font-medium mb-2">16.2 Mediation</h3>
                  <p className="text-gray-700 mb-3">
                    If the dispute cannot be resolved informally, either party may refer the matter to mediation administered by the Chartered Institute of Arbitrators (Kenya Branch) or another mutually agreed-upon mediation body in Nairobi, Kenya.
                  </p>

                  <h3 className="text-lg font-medium mb-2">16.3 Arbitration</h3>
                  <p className="text-gray-700 mb-3">
                    If mediation is unsuccessful, the dispute shall be referred to and finally resolved by arbitration under the Arbitration Act, 1995 (Laws of Kenya). The arbitration shall be conducted in Nairobi, Kenya, in English.
                  </p>

                  <h3 className="text-lg font-medium mb-2">16.4 Data Protection Complaints</h3>
                  <p className="text-gray-700">
                    For disputes related to the processing of your personal data, you have the right to lodge a complaint with the Office of the Data Protection Commissioner (ODPC) in accordance with the DPA 2019. The ODPC can be reached at complaints@odpc.go.ke.
                  </p>
                </section>
                
                <section>
                  <h2 className="text-xl font-semibold mb-3">17. Changes to Terms</h2>
                  <p className="text-gray-700 mb-3">
                    We reserve the right to modify or replace these Terms at any time. We will provide notice of material changes by:
                  </p>
                  <ul className="list-disc pl-6 mb-4 text-gray-700">
                    <li>Updating the "Last Updated" date at the top of these Terms</li>
                    <li>Sending a notification to your registered email address or phone number</li>
                    <li>Displaying a prominent notice on the platform</li>
                  </ul>
                  <p className="text-gray-700">
                    Where changes materially affect the processing of your personal data, we will seek your renewed consent as required by the DPA 2019. Your continued use of the Service after any such changes constitutes your acceptance of the new Terms.
                  </p>
                </section>
                
                <section>
                  <h2 className="text-xl font-semibold mb-3">18. Governing Law</h2>
                  <p className="text-gray-700 mb-3">
                    These Terms shall be governed by and construed in accordance with the Laws of Kenya, including but not limited to:
                  </p>
                  <ul className="list-disc pl-6 mb-4 text-gray-700">
                    <li>The Data Protection Act, 2019</li>
                    <li>The Environmental Management and Co-ordination Act (EMCA), 1999</li>
                    <li>The Consumer Protection Act, 2012</li>
                    <li>The Kenya Information and Communications Act, 1998</li>
                    <li>Applicable county government bylaws and regulations</li>
                  </ul>
                  <p className="text-gray-700">
                    Any disputes arising from these Terms that are not resolved through the dispute resolution mechanisms above shall be subject to the exclusive jurisdiction of the courts of the Republic of Kenya.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold mb-3">19. Severability</h2>
                  <p className="text-gray-700">
                    If any provision of these Terms is held to be invalid or unenforceable under the Laws of Kenya, the remaining provisions shall continue in full force and effect. The invalid or unenforceable provision shall be modified to the minimum extent necessary to make it valid and enforceable while preserving its original intent.
                  </p>
                </section>
                
                <section>
                  <h2 className="text-xl font-semibold mb-3">20. Contact Us</h2>
                  <p className="text-gray-700 mb-3">
                    If you have any questions about these Terms, please contact us at:
                  </p>
                  <div className="mt-3 space-y-1">
                    <p className="text-gray-700"><strong>General Inquiries:</strong> legal@pipapal.app</p>
                    <p className="text-gray-700"><strong>Data Protection Officer:</strong> dpo@pipapal.app</p>
                    <p className="text-gray-700"><strong>Support:</strong> support@pipapal.app</p>
                    <p className="text-gray-700"><strong>Phone:</strong> +254-116407400</p>
                    <p className="text-gray-700"><strong>Website:</strong> pipapal.app</p>
                  </div>
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <p className="text-gray-700 text-sm">
                      <strong>Office of the Data Protection Commissioner (ODPC)</strong><br />
                      For data protection complaints or inquiries:<br />
                      Website: <a href="https://www.odpc.go.ke" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">www.odpc.go.ke</a><br />
                      Email: complaints@odpc.go.ke
                    </p>
                  </div>
                  <div className="mt-3 p-4 bg-gray-50 rounded-lg">
                    <p className="text-gray-700 text-sm">
                      <strong>National Environment Management Authority (NEMA)</strong><br />
                      For environmental compliance inquiries:<br />
                      Website: <a href="https://www.nema.go.ke" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">www.nema.go.ke</a>
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