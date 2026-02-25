import PublicNavbar from "@/components/shared/public-navbar";
import Footer from "@/components/shared/footer";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPolicyPage() {
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
              <h1 className="text-3xl font-bold text-center mb-6">Privacy Policy</h1>
              <p className="text-sm text-muted-foreground text-center mb-6">
                Last Updated: February 25, 2026
              </p>
              <Separator className="mb-6" />
              
              <div className="space-y-6">
                <section>
                  <h2 className="text-xl font-semibold mb-3">1. Introduction and Kenya Data Protection Act 2019 Compliance</h2>
                  <p className="text-gray-700 mb-3">
                    PipaPal ("we", "our", or "us") is committed to protecting your privacy and ensuring the security of your personal data in compliance with the <strong>Kenya Data Protection Act, 2019</strong> (hereinafter referred to as "DPA 2019") and all subsidiary regulations issued by the Office of the Data Protection Commissioner (ODPC).
                  </p>
                  <p className="text-gray-700 mb-3">
                    This Privacy Policy explains how we collect, process, store, disclose, and safeguard your personal data when you use our waste management platform and services. We are committed to the principles of lawfulness, fairness, transparency, purpose limitation, data minimisation, accuracy, storage limitation, integrity, confidentiality, and accountability as set out in the DPA 2019.
                  </p>
                  <p className="text-gray-700">
                    By accessing or using PipaPal, you acknowledge that you have read, understood, and agree to be bound by this Privacy Policy. If you do not agree with the terms of this Privacy Policy, please do not access or use the platform.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold mb-3">2. Data Controller Information</h2>
                  <p className="text-gray-700 mb-3">
                    For the purposes of the DPA 2019, the Data Controller responsible for your personal data is:
                  </p>
                  <div className="bg-gray-50 p-4 rounded-lg mb-3">
                    <p className="text-gray-700"><strong>Data Controller:</strong> PipaPal Limited</p>
                    <p className="text-gray-700"><strong>Registered Address:</strong> Nairobi, Kenya</p>
                    <p className="text-gray-700"><strong>Email:</strong> privacy@pipapal.app</p>
                    <p className="text-gray-700"><strong>Phone:</strong> +254-116407400</p>
                    <p className="text-gray-700"><strong>Data Protection Officer:</strong> dpo@pipapal.app</p>
                  </div>
                  <p className="text-gray-700">
                    PipaPal is registered with the Office of the Data Protection Commissioner (ODPC) as a Data Controller in accordance with Section 18 of the DPA 2019.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold mb-3">3. Personal Data We Collect</h2>
                  <h3 className="text-lg font-medium mb-2">3.1 Information You Provide Directly</h3>
                  <p className="text-gray-700 mb-3">
                    We collect personal data that you voluntarily provide when you register on our platform or use our services, including:
                  </p>
                  <ul className="list-disc pl-6 mb-4 text-gray-700">
                    <li>Full name</li>
                    <li>Email address</li>
                    <li>Phone number (including M-Pesa registered number)</li>
                    <li>Physical address and location coordinates</li>
                    <li>National ID or registration details (for collectors and recyclers)</li>
                    <li>User role (Household, Collector, Recycler, Organization)</li>
                    <li>Account credentials</li>
                    <li>Profile photograph</li>
                    <li>Organization details (for organization accounts)</li>
                    <li>Payment information and M-Pesa transaction details</li>
                  </ul>
                  
                  <h3 className="text-lg font-medium mb-2">3.2 Automatically Collected Information</h3>
                  <p className="text-gray-700 mb-3">
                    When you access or use our platform, we automatically collect:
                  </p>
                  <ul className="list-disc pl-6 mb-4 text-gray-700">
                    <li>Device and browser information (type, version, operating system)</li>
                    <li>IP address</li>
                    <li>Usage patterns, interactions, and navigation data</li>
                    <li>Time spent on pages and features used</li>
                    <li>Referring website addresses</li>
                    <li>Crash reports and performance data</li>
                  </ul>
                  
                  <h3 className="text-lg font-medium mb-2">3.3 Location Data</h3>
                  <p className="text-gray-700 mb-3">
                    With your explicit consent, we collect and process precise location data through GPS, Wi-Fi, IP address, or other location-tracking technologies. This data is essential for providing waste collection scheduling, route optimization, and connecting you with nearby service providers.
                  </p>

                  <h3 className="text-lg font-medium mb-2">3.4 M-Pesa Payment Data</h3>
                  <p className="text-gray-700">
                    When you use M-Pesa for payments on our platform, we process payment-related data including your M-Pesa phone number, transaction IDs, payment amounts, and transaction timestamps. We do not store your M-Pesa PIN or sensitive financial credentials. All M-Pesa transactions are processed through Safaricom's secure Daraja API, and we retain only the minimum transaction records necessary for service delivery, dispute resolution, and regulatory compliance.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold mb-3">4. Lawful Basis for Processing</h2>
                  <p className="text-gray-700 mb-3">
                    In accordance with Section 30 of the DPA 2019, we process your personal data on the following lawful bases:
                  </p>
                  <ul className="list-disc pl-6 mb-4 text-gray-700">
                    <li><strong>Consent (Section 32):</strong> Where you have given clear, informed, and freely given consent for specific processing activities, such as location tracking, marketing communications, and sharing data with third parties.</li>
                    <li><strong>Performance of a Contract (Section 30(b)):</strong> Processing necessary to fulfil our contractual obligations to you, including waste collection scheduling, payment processing, and service delivery.</li>
                    <li><strong>Legitimate Interest (Section 30(f)):</strong> Processing necessary for our legitimate interests, such as improving our platform, preventing fraud, ensuring platform security, and conducting analytics—provided these interests do not override your fundamental rights and freedoms.</li>
                    <li><strong>Legal Obligation (Section 30(c)):</strong> Processing required to comply with applicable Kenyan laws and regulations, including tax obligations, environmental regulations (NEMA), and county government waste management bylaws.</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl font-semibold mb-3">5. How We Use Your Personal Data</h2>
                  <p className="text-gray-700 mb-3">
                    We use your personal data for the following purposes:
                  </p>
                  <ul className="list-disc pl-6 mb-4 text-gray-700">
                    <li>Facilitating waste collection scheduling, tracking, and management</li>
                    <li>Connecting households with waste collectors and recyclers</li>
                    <li>Processing transactions and M-Pesa payments</li>
                    <li>Providing environmental impact metrics and sustainability reports</li>
                    <li>Tracking progress and awarding badges for sustainable actions</li>
                    <li>Communicating about your account, service updates, and eco-tips</li>
                    <li>Improving platform functionality, features, and user experience</li>
                    <li>Monitoring usage patterns and analysing trends for service improvement</li>
                    <li>Preventing fraudulent activities and enforcing our terms of use</li>
                    <li>Complying with legal and regulatory obligations</li>
                    <li>Generating anonymised and aggregated environmental impact reports</li>
                    <li>Route optimization for waste collectors</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl font-semibold mb-3">6. Information Sharing and Disclosure</h2>
                  <p className="text-gray-700 mb-3">
                    We may share your personal data in the following circumstances, in compliance with the DPA 2019:
                  </p>
                  <ul className="list-disc pl-6 mb-4 text-gray-700">
                    <li><strong>Between Platform Users:</strong> To facilitate waste collection services, we share relevant information (such as name, phone number, and location) between households, collectors, and recyclers as necessary for service delivery.</li>
                    <li><strong>Payment Processors:</strong> Transaction data is shared with Safaricom (M-Pesa) for payment processing purposes only.</li>
                    <li><strong>Service Providers:</strong> We may share your information with third-party vendors and contractors who perform services on our behalf, subject to strict data processing agreements in accordance with the DPA 2019.</li>
                    <li><strong>Government and Regulatory Bodies:</strong> We may disclose data to the National Environment Management Authority (NEMA), county governments, the Kenya Revenue Authority (KRA), or other regulatory bodies as required by law.</li>
                    <li><strong>Business Transfers:</strong> In the event of a merger, acquisition, or sale of assets, your personal data may be transferred, subject to the provisions of the DPA 2019.</li>
                    <li><strong>Legal Requirements:</strong> We may disclose your information where required by Kenyan law, court order, or to protect our legitimate rights, privacy, safety, or property.</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl font-semibold mb-3">7. Cross-Border Data Transfers</h2>
                  <p className="text-gray-700 mb-3">
                    In accordance with Section 48 of the DPA 2019, we may transfer your personal data outside Kenya only where:
                  </p>
                  <ul className="list-disc pl-6 mb-4 text-gray-700">
                    <li>The recipient country or organisation has adequate data protection safeguards as determined by the ODPC</li>
                    <li>Appropriate safeguards are in place, such as standard contractual clauses, binding corporate rules, or certification mechanisms approved by the ODPC</li>
                    <li>You have provided explicit and informed consent to the transfer after being informed of the risks</li>
                    <li>The transfer is necessary for the performance of a contract between you and PipaPal</li>
                  </ul>
                  <p className="text-gray-700">
                    Some of our service providers (such as cloud hosting and analytics services) may process data in jurisdictions outside Kenya. We ensure that all such transfers comply with the DPA 2019 and that your data receives an equivalent level of protection.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold mb-3">8. Data Subject Rights Under the DPA 2019</h2>
                  <p className="text-gray-700 mb-3">
                    Under the Kenya Data Protection Act 2019, you have the following rights regarding your personal data:
                  </p>
                  <ul className="list-disc pl-6 mb-4 text-gray-700">
                    <li><strong>Right of Access (Section 26(a)):</strong> You have the right to be informed of the use of your personal data and to access the personal data we hold about you, including obtaining a copy of such data.</li>
                    <li><strong>Right to Rectification (Section 26(c)):</strong> You have the right to request correction of inaccurate, misleading, or incomplete personal data.</li>
                    <li><strong>Right to Erasure (Section 26(d)):</strong> You have the right to request deletion of your personal data where it is no longer necessary for the purpose for which it was collected, subject to legal retention requirements.</li>
                    <li><strong>Right to Restriction of Processing:</strong> You have the right to request that we restrict the processing of your personal data in certain circumstances.</li>
                    <li><strong>Right to Data Portability (Section 26(f)):</strong> You have the right to receive your personal data in a structured, commonly used, and machine-readable format and to transmit that data to another data controller.</li>
                    <li><strong>Right to Object (Section 26(e)):</strong> You have the right to object to the processing of your personal data, including processing for direct marketing purposes.</li>
                    <li><strong>Right to Withdraw Consent:</strong> Where processing is based on your consent, you have the right to withdraw consent at any time without affecting the lawfulness of processing based on consent before its withdrawal.</li>
                    <li><strong>Right Not to Be Subject to Automated Decision-Making (Section 35):</strong> You have the right not to be subject to decisions based solely on automated processing, including profiling, which produces legal effects or significantly affects you.</li>
                  </ul>
                  <p className="text-gray-700 mb-3">
                    To exercise any of these rights, please contact our Data Protection Officer at <strong>dpo@pipapal.app</strong>. We will respond to your request within 30 days as required by the DPA 2019.
                  </p>
                  <p className="text-gray-700">
                    If you are not satisfied with our response, you have the right to lodge a complaint with the Office of the Data Protection Commissioner (ODPC).
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold mb-3">9. Automated Decision-Making and Profiling</h2>
                  <p className="text-gray-700 mb-3">
                    In accordance with Section 35 of the DPA 2019, we disclose that PipaPal may use automated processes in the following areas:
                  </p>
                  <ul className="list-disc pl-6 mb-4 text-gray-700">
                    <li><strong>Route Optimization:</strong> Automated algorithms to determine optimal waste collection routes based on location data, collection schedules, and traffic patterns.</li>
                    <li><strong>Service Matching:</strong> Automated matching of households with available collectors and recyclers based on location, service area, and availability.</li>
                    <li><strong>Environmental Impact Calculations:</strong> Automated computation of environmental impact metrics, eco-scores, and badge awards.</li>
                    <li><strong>Fraud Detection:</strong> Automated monitoring for unusual account activity or suspicious transactions.</li>
                  </ul>
                  <p className="text-gray-700">
                    None of these automated processes produce legal effects or make decisions that significantly affect your rights without human oversight. You have the right to request human review of any automated decision and to express your point of view on such decisions.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold mb-3">10. Data Retention</h2>
                  <p className="text-gray-700 mb-3">
                    We retain your personal data only for as long as necessary to fulfil the purposes for which it was collected, in accordance with the DPA 2019 principle of storage limitation. Our retention periods are as follows:
                  </p>
                  <ul className="list-disc pl-6 mb-4 text-gray-700">
                    <li><strong>Account Data:</strong> Retained for the duration of your active account and for 2 years after account deletion, unless longer retention is required by law.</li>
                    <li><strong>Transaction and Payment Records:</strong> Retained for 7 years in accordance with Kenya Revenue Authority (KRA) tax requirements and the Kenya Companies Act.</li>
                    <li><strong>Collection History:</strong> Retained for 3 years for service improvement, dispute resolution, and environmental impact reporting.</li>
                    <li><strong>Location Data:</strong> Real-time location data is retained for 90 days; aggregated location analytics are retained for 2 years.</li>
                    <li><strong>Communication Records:</strong> Chat messages and notifications are retained for 1 year after the related service is completed.</li>
                    <li><strong>Consent Records:</strong> Records of your consent are retained for the duration of your account and for 5 years thereafter to demonstrate compliance with the DPA 2019.</li>
                  </ul>
                  <p className="text-gray-700">
                    Upon expiry of the retention period, personal data is securely deleted or anonymised so that it can no longer be associated with you.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold mb-3">11. Data Security</h2>
                  <p className="text-gray-700 mb-3">
                    In compliance with Section 41 of the DPA 2019, we implement appropriate technical and organisational measures to protect your personal data against unauthorised or unlawful processing and against accidental loss, destruction, or damage. These measures include:
                  </p>
                  <ul className="list-disc pl-6 mb-4 text-gray-700">
                    <li>Encryption of personal data in transit (TLS/SSL) and at rest</li>
                    <li>Secure authentication mechanisms including password hashing</li>
                    <li>Regular security assessments and vulnerability testing</li>
                    <li>Access controls and role-based permissions for staff</li>
                    <li>Staff training on data protection and security practices</li>
                    <li>Incident response procedures for data breaches</li>
                  </ul>
                  <p className="text-gray-700">
                    While we strive to protect your personal data, no method of electronic transmission or storage is 100% secure. We cannot guarantee absolute security but are committed to maintaining the highest standards of data protection.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold mb-3">12. Data Breach Notification</h2>
                  <p className="text-gray-700 mb-3">
                    In accordance with Section 43 of the DPA 2019, in the event of a personal data breach that is likely to result in a risk to the rights and freedoms of data subjects, we will:
                  </p>
                  <ul className="list-disc pl-6 mb-4 text-gray-700">
                    <li>Notify the Office of the Data Protection Commissioner (ODPC) within 72 hours of becoming aware of the breach</li>
                    <li>Notify affected data subjects without undue delay where the breach is likely to result in a high risk to their rights and freedoms</li>
                    <li>Document all breaches, including the facts, effects, and remedial actions taken</li>
                    <li>Provide information on the nature of the breach, categories of data affected, approximate number of individuals affected, likely consequences, and measures taken to address the breach</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl font-semibold mb-3">13. Data Protection Impact Assessment</h2>
                  <p className="text-gray-700">
                    In accordance with Section 31 of the DPA 2019, PipaPal conducts Data Protection Impact Assessments (DPIAs) prior to implementing any new processing activities that are likely to result in a high risk to the rights and freedoms of data subjects. This includes assessments for location tracking features, new payment integrations, automated decision-making processes, and any large-scale processing of personal data. DPIA results are documented and made available to the ODPC upon request.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold mb-3">14. Cookie Policy</h2>
                  <p className="text-gray-700 mb-3">
                    PipaPal uses cookies and similar tracking technologies to enhance your experience on our platform. Cookies are small data files stored on your device that help us:
                  </p>
                  <ul className="list-disc pl-6 mb-4 text-gray-700">
                    <li><strong>Essential Cookies:</strong> Required for the platform to function properly, including authentication, session management, and security features. These cookies cannot be disabled.</li>
                    <li><strong>Analytics Cookies:</strong> Used to understand how users interact with our platform, helping us improve functionality and user experience. These are only set with your consent.</li>
                    <li><strong>Preference Cookies:</strong> Store your preferences such as language settings, theme preferences, and notification settings.</li>
                  </ul>
                  <p className="text-gray-700">
                    You can manage cookie preferences through your browser settings. Please note that disabling essential cookies may affect the functionality of the platform. We do not use cookies for third-party advertising purposes.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold mb-3">15. Children's Data</h2>
                  <p className="text-gray-700 mb-3">
                    PipaPal is intended for users aged 18 years and above. We do not knowingly collect, process, or store personal data from individuals under the age of 18. In accordance with Section 33 of the DPA 2019, which provides special protections for children's data:
                  </p>
                  <ul className="list-disc pl-6 mb-4 text-gray-700">
                    <li>Users must confirm that they are at least 18 years old during registration</li>
                    <li>If we discover that we have inadvertently collected personal data from a minor, we will promptly delete such data</li>
                    <li>Parents or guardians who believe their child has provided personal data to PipaPal should contact us immediately at dpo@pipapal.app</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl font-semibold mb-3">16. Third-Party Links and Services</h2>
                  <p className="text-gray-700">
                    Our platform may contain links to third-party websites, services, and applications (including Safaricom M-Pesa, Google Maps, and social media platforms) that are not operated by us. We have no control over the content, privacy policies, or practices of these third-party services. We encourage you to review the privacy policies of any third-party services before providing your personal data. PipaPal is not responsible for the data practices of third-party services.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold mb-3">17. Changes to This Privacy Policy</h2>
                  <p className="text-gray-700">
                    We may update this Privacy Policy from time to time to reflect changes in our practices, legal requirements, or regulatory guidance from the ODPC. The updated version will be indicated by the "Last Updated" date at the top of this page. We will notify you of material changes through the platform, email, or SMS notification. Your continued use of PipaPal after any changes constitutes acceptance of the updated Privacy Policy. We recommend reviewing this policy periodically.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold mb-3">18. Complaints and the Office of the Data Protection Commissioner</h2>
                  <p className="text-gray-700 mb-3">
                    If you believe that your data protection rights have been violated or that we have not handled your personal data in accordance with the DPA 2019, you have the right to lodge a complaint with:
                  </p>
                  <div className="bg-gray-50 p-4 rounded-lg mb-3">
                    <p className="text-gray-700"><strong>Office of the Data Protection Commissioner (ODPC)</strong></p>
                    <p className="text-gray-700"><strong>Physical Address:</strong> Immaculate Conception Catholic Church, 5th Floor, Nairobi, Kenya</p>
                    <p className="text-gray-700"><strong>Email:</strong> complaints@odpc.go.ke</p>
                    <p className="text-gray-700"><strong>Website:</strong> www.odpc.go.ke</p>
                    <p className="text-gray-700"><strong>Phone:</strong> +254-20-2737200</p>
                  </div>
                  <p className="text-gray-700">
                    We encourage you to contact us first at dpo@pipapal.app so that we may attempt to resolve your concern before you escalate to the ODPC.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold mb-3">19. Contact Us</h2>
                  <p className="text-gray-700 mb-3">
                    If you have any questions, concerns, or requests regarding this Privacy Policy, your personal data, or our data protection practices, please contact us:
                  </p>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-700"><strong>PipaPal Limited</strong></p>
                    <p className="text-gray-700"><strong>Data Protection Officer:</strong> dpo@pipapal.app</p>
                    <p className="text-gray-700"><strong>General Privacy Enquiries:</strong> privacy@pipapal.app</p>
                    <p className="text-gray-700"><strong>Phone:</strong> +254-116407400</p>
                    <p className="text-gray-700"><strong>Website:</strong> pipapal.app</p>
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