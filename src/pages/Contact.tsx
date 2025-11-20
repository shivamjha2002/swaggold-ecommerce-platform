import React, { useState } from 'react';
import { MapPin, Phone, Mail, Clock, MessageCircle, Send, Star } from 'lucide-react';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Message sent successfully! We will get back to you soon.');
    setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const contactInfo = [
    {
      icon: MapPin,
      title: 'Visit Our Showroom',
      details: [
        'Swati Jewellers',
        'Vidyapati Chowk Benipatti',
        'Jewelry District, Madhubani - 847223',
        'Bihar, India'
      ]
    },
    {
      icon: Phone,
      title: 'Call Us',
      details: ['+91 8210161393', '+91 6209810892', 'Landline: 062-71223516']
    },
    {
      icon: Mail,
      title: 'Email Us',
      details: ['info@swatijewellers.com', 'sales@swatijewellers.com', 'support@swatijewellers.com']
    },
    {
      icon: Clock,
      title: 'Business Hours',
      details: [
        'Monday - Saturday: 10:00 AM - 8:00 PM',
        'Sunday: 11:00 AM - 6:00 PM',
        'Festival Days: 10:00 AM - 9:00 PM'
      ]
    }
  ];

  const reviews = [
    {
      name: 'Rajesh Kumar',
      rating: 5,
      comment: 'Excellent quality jewelry and outstanding customer service. Highly recommended!',
      date: '2 weeks ago'
    },
    {
      name: 'Priya Sharma',
      rating: 5,
      comment: 'Beautiful designs and authentic gold. The staff is very helpful and knowledgeable.',
      date: '1 month ago'
    },
    {
      name: 'Amit Singh',
      rating: 5,
      comment: 'Best jewelry store in the city. Great collection and reasonable prices.',
      date: '3 weeks ago'
    }
  ];

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
      />
    ));
  };

  return (
    <div className="min-h-screen pt-20">
      <section className="py-16 bg-gradient-to-r from-black via-gray-900 to-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            <span className="bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-500 bg-clip-text text-transparent">
              Get in Touch
            </span>
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Visit our showroom, call us, or send a message. We're here to help you find the perfect jewelry for your special moments.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-4 gap-8 mb-16">
          {contactInfo.map((info, index) => (
            <div
              key={index}
              className="bg-white p-8 rounded-2xl shadow-xl text-center group hover:shadow-2xl transition-all duration-500 transform hover:scale-105"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-2xl mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <info.icon className="h-8 w-8 text-white" />
              </div>

              <h3 className="text-xl font-bold text-gray-900 mb-4 group-hover:text-yellow-600 transition-colors duration-300">
                {info.title}
              </h3>

              <div className="space-y-2">
                {info.details.map((detail, detailIndex) => (
                  <p key={detailIndex} className="text-gray-600 text-sm leading-relaxed">
                    {detail}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-16">
          {/* Contact Form */}
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-8 py-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Send us a Message</h2>
              <p className="text-gray-600 mt-2">Fill out the form below and we'll get back to you within 24 hours.</p>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name *</label>
                  <input
                    type="text"
                    name="name"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all duration-300 shadow-sm"
                    placeholder="Your full name"
                    value={formData.name}
                    onChange={handleInputChange}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address *</label>
                  <input
                    type="email"
                    name="email"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all duration-300 shadow-sm"
                    placeholder="your@email.com"
                    value={formData.email}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
                  <input
                    type="tel"
                    name="phone"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all duration-300 shadow-sm"
                    placeholder="+91 98765 43210"
                    value={formData.phone}
                    onChange={handleInputChange}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Subject *</label>
                  <input
                    type="text"
                    name="subject"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all duration-300 shadow-sm"
                    placeholder="What can we help you with?"
                    value={formData.subject}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Message *</label>
                <textarea
                  name="message"
                  required
                  rows={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all duration-300 resize-none shadow-sm"
                  placeholder="Tell us about your requirements, questions, or how we can help you..."
                  value={formData.message}
                  onChange={handleInputChange}
                ></textarea>
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center space-x-3 bg-gradient-to-r from-yellow-500 to-yellow-400 text-black font-bold py-4 px-8 rounded-xl hover:from-yellow-400 hover:to-yellow-300 transition-all duration-300 transform hover:scale-105 shadow-xl"
              >
                <Send className="h-5 w-5" />
                <span>Send Message</span>
              </button>
            </form>
          </div>

          {/* Map and Additional Info */}
          <div className="space-y-8">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
                <h3 className="text-xl font-bold text-gray-900">Find Our Showroom</h3>
              </div>

              <div className="aspect-video bg-gray-200 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <MapPin className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-sm">Interactive Google Maps would be integrated here</p>
                  <p className="text-xs text-gray-400 mt-2">
                    Swati Jewellers, Vidyapati Chowk, Benipatti, Madhubani, Bihar - 847223
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-green-500 to-green-400 rounded-2xl p-8 text-white shadow-xl">
              <div className="flex items-center space-x-4 mb-4">
                <MessageCircle className="h-12 w-12" />
                <div>
                  <h3 className="text-xl font-bold">WhatsApp Us</h3>
                  <p className="opacity-90">Get instant assistance</p>
                </div>
              </div>

              <p className="mb-6 opacity-90">
                For quick queries, product information, or immediate assistance, reach out to us on WhatsApp. We're here to help!
              </p>

              <a
                href="https://wa.me/919876543210"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-3 bg-white text-green-600 font-bold py-3 px-6 rounded-xl hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                <MessageCircle className="h-5 w-5" />
                <span>Chat on WhatsApp</span>
              </a>
            </div>

            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
                <h3 className="text-xl font-bold text-gray-900">What Our Customers Say</h3>
              </div>

              <div className="p-6 space-y-6">
                {reviews.map((review, index) => (
                  <div key={index} className="border-b border-gray-100 last:border-0 pb-6 last:pb-0">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-semibold text-gray-900">{review.name}</h4>
                        <div className="flex items-center space-x-1 mt-1">{renderStars(review.rating)}</div>
                      </div>
                      <span className="text-sm text-gray-500">{review.date}</span>
                    </div>

                    <p className="text-gray-700 leading-relaxed">{review.comment}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
