import React from 'react';
import { Shield, Lock, Eye, UserCheck, FileText, Mail } from 'lucide-react';

const PrivacyPolicy = () => {
    return (
        <div className="min-h-screen pt-20 bg-gradient-to-br from-gray-50 to-gray-100">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Header */}
                <div className="text-center mb-12">
                    <div className="flex items-center justify-center mb-6">
                        <Shield className="h-16 w-16 text-yellow-500" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                        Privacy Policy
                    </h1>
                    <p className="text-lg text-gray-600">
                        Last updated: November 20, 2025
                    </p>
                </div>

                {/* Content */}
                <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 space-y-8">
                    {/* Introduction */}
                    <section>
                        <div className="flex items-center space-x-3 mb-4">
                            <FileText className="h-6 w-6 text-yellow-500" />
                            <h2 className="text-2xl font-bold text-gray-900">Introduction</h2>
                        </div>
                        <p className="text-gray-700 leading-relaxed">
                            At Swati Jewellers, we are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website or make a purchase from us.
                        </p>
                    </section>

                    {/* Information We Collect */}
                    <section>
                        <div className="flex items-center space-x-3 mb-4">
                            <Eye className="h-6 w-6 text-yellow-500" />
                            <h2 className="text-2xl font-bold text-gray-900">Information We Collect</h2>
                        </div>
                        <div className="space-y-4 text-gray-700">
                            <div>
                                <h3 className="font-semibold text-gray-900 mb-2">Personal Information</h3>
                                <ul className="list-disc list-inside space-y-2 ml-4">
                                    <li>Name and contact information (email, phone number, address)</li>
                                    <li>Payment information (processed securely through Razorpay)</li>
                                    <li>Order history and preferences</li>
                                    <li>Account credentials (username and encrypted password)</li>
                                </ul>
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900 mb-2">Automatically Collected Information</h3>
                                <ul className="list-disc list-inside space-y-2 ml-4">
                                    <li>IP address and browser type</li>
                                    <li>Device information and operating system</li>
                                    <li>Pages visited and time spent on our website</li>
                                    <li>Referring website addresses</li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    {/* How We Use Your Information */}
                    <section>
                        <div className="flex items-center space-x-3 mb-4">
                            <UserCheck className="h-6 w-6 text-yellow-500" />
                            <h2 className="text-2xl font-bold text-gray-900">How We Use Your Information</h2>
                        </div>
                        <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                            <li>Process and fulfill your orders</li>
                            <li>Communicate with you about your orders and account</li>
                            <li>Send promotional emails (with your consent)</li>
                            <li>Improve our website and customer service</li>
                            <li>Prevent fraud and enhance security</li>
                            <li>Comply with legal obligations</li>
                            <li>Maintain Khata (credit ledger) records for authorized customers</li>
                        </ul>
                    </section>

                    {/* Payment Security */}
                    <section>
                        <div className="flex items-center space-x-3 mb-4">
                            <Lock className="h-6 w-6 text-yellow-500" />
                            <h2 className="text-2xl font-bold text-gray-900">Payment Security</h2>
                        </div>
                        <p className="text-gray-700 leading-relaxed">
                            We use Razorpay, a PCI-DSS compliant payment gateway, to process all online payments. We do not store your complete credit card or debit card information on our servers. All payment information is encrypted and transmitted securely using industry-standard SSL/TLS protocols.
                        </p>
                    </section>

                    {/* Data Protection */}
                    <section>
                        <div className="flex items-center space-x-3 mb-4">
                            <Shield className="h-6 w-6 text-yellow-500" />
                            <h2 className="text-2xl font-bold text-gray-900">Data Protection</h2>
                        </div>
                        <div className="space-y-4 text-gray-700">
                            <p className="leading-relaxed">
                                We implement appropriate technical and organizational security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. These measures include:
                            </p>
                            <ul className="list-disc list-inside space-y-2 ml-4">
                                <li>Encrypted data transmission (HTTPS/SSL)</li>
                                <li>Secure password storage with bcrypt hashing</li>
                                <li>Regular security audits and updates</li>
                                <li>Access controls and authentication</li>
                                <li>Secure database storage with MongoDB</li>
                                <li>Rate limiting to prevent abuse</li>
                            </ul>
                        </div>
                    </section>

                    {/* Information Sharing */}
                    <section>
                        <div className="flex items-center space-x-3 mb-4">
                            <UserCheck className="h-6 w-6 text-yellow-500" />
                            <h2 className="text-2xl font-bold text-gray-900">Information Sharing</h2>
                        </div>
                        <p className="text-gray-700 leading-relaxed mb-4">
                            We do not sell, trade, or rent your personal information to third parties. We may share your information only in the following circumstances:
                        </p>
                        <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                            <li><strong>Service Providers:</strong> Payment processors (Razorpay), shipping companies, and email service providers</li>
                            <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
                            <li><strong>Business Transfers:</strong> In the event of a merger, acquisition, or sale of assets</li>
                        </ul>
                    </section>

                    {/* Your Rights */}
                    <section>
                        <div className="flex items-center space-x-3 mb-4">
                            <FileText className="h-6 w-6 text-yellow-500" />
                            <h2 className="text-2xl font-bold text-gray-900">Your Rights</h2>
                        </div>
                        <p className="text-gray-700 leading-relaxed mb-4">
                            You have the following rights regarding your personal information:
                        </p>
                        <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                            <li><strong>Access:</strong> Request a copy of your personal data</li>
                            <li><strong>Correction:</strong> Update or correct inaccurate information</li>
                            <li><strong>Deletion:</strong> Request deletion of your personal data (subject to legal obligations)</li>
                            <li><strong>Opt-out:</strong> Unsubscribe from marketing communications</li>
                            <li><strong>Data Portability:</strong> Request your data in a portable format</li>
                        </ul>
                    </section>

                    {/* Cookies */}
                    <section>
                        <div className="flex items-center space-x-3 mb-4">
                            <Eye className="h-6 w-6 text-yellow-500" />
                            <h2 className="text-2xl font-bold text-gray-900">Cookies and Tracking</h2>
                        </div>
                        <p className="text-gray-700 leading-relaxed">
                            We use cookies and similar tracking technologies to enhance your browsing experience, analyze website traffic, and personalize content. You can control cookie preferences through your browser settings. However, disabling cookies may affect the functionality of our website.
                        </p>
                    </section>

                    {/* Children's Privacy */}
                    <section>
                        <div className="flex items-center space-x-3 mb-4">
                            <Shield className="h-6 w-6 text-yellow-500" />
                            <h2 className="text-2xl font-bold text-gray-900">Children's Privacy</h2>
                        </div>
                        <p className="text-gray-700 leading-relaxed">
                            Our website is not intended for children under the age of 18. We do not knowingly collect personal information from children. If you believe we have inadvertently collected information from a child, please contact us immediately.
                        </p>
                    </section>

                    {/* Changes to Privacy Policy */}
                    <section>
                        <div className="flex items-center space-x-3 mb-4">
                            <FileText className="h-6 w-6 text-yellow-500" />
                            <h2 className="text-2xl font-bold text-gray-900">Changes to This Policy</h2>
                        </div>
                        <p className="text-gray-700 leading-relaxed">
                            We may update this Privacy Policy from time to time to reflect changes in our practices or legal requirements. We will notify you of any material changes by posting the updated policy on our website with a new "Last Updated" date.
                        </p>
                    </section>

                    {/* Contact Information */}
                    <section className="bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-xl p-6 border border-yellow-200">
                        <div className="flex items-center space-x-3 mb-4">
                            <Mail className="h-6 w-6 text-yellow-600" />
                            <h2 className="text-2xl font-bold text-gray-900">Contact Us</h2>
                        </div>
                        <p className="text-gray-700 leading-relaxed mb-4">
                            If you have any questions, concerns, or requests regarding this Privacy Policy or your personal information, please contact us:
                        </p>
                        <div className="space-y-2 text-gray-700">
                            <p><strong>Swati Jewellers</strong></p>
                            <p>Email: privacy@swatijewellers.com</p>
                            <p>Phone: +91 98765 43210</p>
                            <p>Address: [Your Store Address]</p>
                        </div>
                    </section>

                    {/* Consent */}
                    <section className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                        <p className="text-gray-700 leading-relaxed">
                            By using our website and services, you consent to the collection, use, and disclosure of your information as described in this Privacy Policy. If you do not agree with this policy, please do not use our website or services.
                        </p>
                    </section>
                </div>

                {/* Footer Links */}
                <div className="mt-8 text-center">
                    <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-600">
                        <a href="/contact" className="hover:text-yellow-600 transition-colors">
                            Contact Us
                        </a>
                        <a href="/about" className="hover:text-yellow-600 transition-colors">
                            About Us
                        </a>
                        <a href="/" className="hover:text-yellow-600 transition-colors">
                            Back to Home
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PrivacyPolicy;
