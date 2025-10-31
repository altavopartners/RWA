// components/Contact.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Phone, Mail, MapPin, Send, CheckCircle } from "lucide-react";
import Footer from "@/components/Footer";

export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send message');
      }

      setIsSubmitted(true);

      // Reset form after 3 seconds
      setTimeout(() => {
        setFormData({ name: "", phone: "", email: "", message: "" });
        setIsSubmitted(false);
      }, 3000);
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50 dark:from-[#0C171B] dark:via-[#1a2930] dark:to-[#0C171B] pt-16">
        {/* Hero Section */}
        <section className="relative py-20 overflow-hidden">
          {/* Decorative Elements */}
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <div className="absolute top-20 left-10 w-72 h-72 bg-[#88CEDC] rounded-full blur-3xl" />
            <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#88CEDC] rounded-full blur-3xl" />
          </div>

          <div className="relative z-10 container mx-auto px-6 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#88CEDC]/10 border border-[#88CEDC]/30 mb-6">
              <div className="w-2 h-2 rounded-full bg-[#88CEDC]" />
              <span className="text-[#88CEDC] font-medium">Contact us</span>
            </div>

            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
              Have questions? ready to help!
            </h1>

            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              Looking to tokenize your exports or ready to buy? Our expert team offers personalized guidance and 
              market expertise tailored to you.
            </p>
          </div>
        </section>

        {/* Contact Section */}
        <section className="pb-20">
          <div className="container mx-auto px-6">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
              {/* Contact Information Card */}
              <div className="lg:col-span-2">
                <Card className="relative h-full overflow-hidden bg-gradient-to-br from-[#486C7A] via-[#265663] to-[#0C171B] border-none">
                  {/* Background Image with Overlay */}
                  <div className="absolute inset-0">
                    <img
                      src="/assets/contact-bg.jpg"
                      alt="Contact Background"
                      className="w-full h-full object-cover opacity-30"
                    />
                    <div className="absolute inset-0 bg-gradient-to-br from-[#486C7A]/90 via-[#265663]/90 to-[#0C171B]/90" />
                  </div>

                  {/* Content */}
                  <div className="relative z-10 p-8 md:p-10 text-white h-full flex flex-col justify-between">
                    <div>
                      <h2 className="text-3xl font-bold mb-4">Contact information</h2>
                      <p className="text-white/80 mb-12 leading-relaxed">
                        Ready to tokenize your products or connect with African producers? We're here to help!
                      </p>
                    </div>

                    <div className="space-y-6">
                      {/* Phone */}
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                          <Phone className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="text-white/60 text-sm mb-1">Phone</p>
                          <p className="text-lg font-medium">+1 0239 0310 1122</p>
                        </div>
                      </div>

                      {/* Email */}
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                          <Mail className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="text-white/60 text-sm mb-1">Email</p>
                          <p className="text-lg font-medium">support@hexport.com</p>
                        </div>
                      </div>

                      {/* Location */}
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                          <MapPin className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="text-white/60 text-sm mb-1">Location</p>
                          <p className="text-lg font-medium">Tunis, Tunisia</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Contact Form */}
              <div className="lg:col-span-3">
                <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 p-8 md:p-10">
                  {isSubmitted ? (
                    <div className="flex flex-col items-center justify-center py-12">
                      <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center mb-6">
                        <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                        Message Sent Successfully!
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 text-center">
                        Thank you for reaching out. We'll get back to you soon.
                      </p>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                      {/* Name and Phone Row */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <Input
                            type="text"
                            name="name"
                            placeholder="Name*"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            className="w-full px-6 py-6 bg-transparent border-2 border-gray-300 dark:border-gray-600 rounded-xl 
                                     focus:border-[#88CEDC] dark:focus:border-[#88CEDC] focus:ring-0 
                                     text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400
                                     transition-all"
                          />
                        </div>
                        <div>
                          <Input
                            type="tel"
                            name="phone"
                            placeholder="Phone number*"
                            value={formData.phone}
                            onChange={handleChange}
                            required
                            className="w-full px-6 py-6 bg-transparent border-2 border-gray-300 dark:border-gray-600 rounded-xl 
                                     focus:border-[#88CEDC] dark:focus:border-[#88CEDC] focus:ring-0 
                                     text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400
                                     transition-all"
                          />
                        </div>
                      </div>

                      {/* Email */}
                      <div>
                        <Input
                          type="email"
                          name="email"
                          placeholder="Email address*"
                          value={formData.email}
                          onChange={handleChange}
                          required
                          className="w-full px-6 py-6 bg-transparent border-2 border-gray-300 dark:border-gray-600 rounded-xl 
                                   focus:border-[#88CEDC] dark:focus:border-[#88CEDC] focus:ring-0 
                                   text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400
                                   transition-all"
                        />
                      </div>

                      {/* Message */}
                      <div>
                        <Textarea
                          name="message"
                          placeholder="Write here your message"
                          value={formData.message}
                          onChange={handleChange}
                          required
                          rows={6}
                          className="w-full px-6 py-6 bg-transparent border-2 border-gray-300 dark:border-gray-600 rounded-xl 
                                   focus:border-[#88CEDC] dark:focus:border-[#88CEDC] focus:ring-0 
                                   text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400
                                   transition-all resize-none"
                        />
                      </div>

                      {/* Submit Button */}
                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full md:w-auto bg-gradient-to-r from-[#88CEDC] to-[#5BA8B8] hover:from-[#7BC0CF] hover:to-[#4A97A7] 
                                 text-white font-semibold px-10 py-6 text-lg rounded-xl shadow-lg hover:shadow-xl 
                                 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSubmitting ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <Send className="w-5 h-5 mr-2" />
                            Send message
                          </>
                        )}
                      </Button>
                    </form>
                  )}
                </Card>
              </div>
            </div>
          </div>
        </section>
      </div>

      <Footer />
    </>
  );
}