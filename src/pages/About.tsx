import React from 'react';
import { Crown, Users, Award, Heart, Sparkles, Clock } from 'lucide-react';

const About = () => {
  const milestones = [
    { year: '2009', title: 'Foundation', description: 'Swati Jewellers established with a vision of excellence' },
    { year: '2015', title: 'Expansion', description: 'Opened our flagship showroom in the heart of the city' },
    { year: '2020', title: 'Recognition', description: 'Awarded "Best Jewelry Store" by the Gold & Silver Association' },
    { year: '2022', title: 'Digital Era', description: 'Launched online presence and modern payment systems' },
    { year: '2025', title: 'Legacy Continues', description: 'Over a decade of trust, serving thousands of happy customers' }
  ];

  const values = [
    {
      icon: Crown,
      title: 'Premium Quality',
      description: 'We use only the finest gold and certified diamonds, ensuring every piece meets international standards.',
    },
    {
      icon: Heart,
      title: 'Customer First',
      description: 'Your satisfaction is our priority. We build relationships that last generations.',
    },
    {
      icon: Award,
      title: 'Expert Craftsmanship',
      description: 'Our master jewelers bring decades of experience to create timeless masterpieces.',
    },
    {
      icon: Users,
      title: 'Family Tradition',
      description: 'A family business that understands the importance of family heirlooms and traditions.',
    },
  ];

  return (
    <div className="min-h-screen pt-20">

      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-black via-gray-900 to-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="flex items-center justify-center space-x-4 mb-6">
              <Sparkles className="h-12 w-12 text-yellow-400 animate-pulse" />
              <div className="h-px bg-gradient-to-r from-transparent via-yellow-400 to-transparent w-24"></div>
              <Crown className="h-12 w-12 text-yellow-400" />
              <div className="h-px bg-gradient-to-r from-transparent via-yellow-400 to-transparent w-24"></div>
              <Sparkles className="h-12 w-12 text-yellow-400 animate-pulse" />
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              <span className="bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-500 bg-clip-text text-transparent">
                Our Story
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 max-w-4xl mx-auto leading-relaxed">
              Over a decade of excellence, trust, and timeless beauty. Discover the legacy that makes Swati Jewellers a name synonymous with premium jewelry.
            </p>
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-8">
                A Legacy of <span className="text-yellow-500">Excellence</span>
              </h2>
              <div className="space-y-6 text-lg text-gray-700 leading-relaxed">
                <p>
                  In 2009, with a small workshop and a big dream, Swati Jewellers was born. What started as a humble beginning has grown into one of the most trusted names in premium jewelry.
                </p>
                <p>
                  Our founder's vision was simple yet powerful: to create jewelry that not only adorns but also tells stories, celebrates moments, and becomes part of family heritage for generations to come.
                </p>
                <p>
                  Today, as we complete over a decade of service, we remain committed to the same principles that started our journey - uncompromising quality, authentic craftsmanship, and treating every customer like family.
                </p>
                <p>
                  Every piece that leaves our store carries with it the promise of excellence, the assurance of authenticity, and the blessing of countless happy memories yet to be made.
                </p>
              </div>
            </div>

            <div className="relative">
              <div className="aspect-square rounded-2xl overflow-hidden shadow-2xl bg-gradient-to-br from-yellow-50 to-yellow-100">
                <img
                  src="/src/Images/WhatsApp Image 2025-06-21 at 19.42.26.jpeg"
                  alt="Swati Jewellers Heritage"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback to a beautiful jewelry-themed gradient background
                    (e.target as HTMLImageElement).style.display = 'none';
                    (e.target as HTMLImageElement).parentElement!.innerHTML = `
                      <div class="w-full h-full flex items-center justify-center bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600">
                        <div class="text-center text-white p-8">
                          <svg class="w-32 h-32 mx-auto mb-4 opacity-90" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5zm0 18c-3.86-.96-7-5.54-7-10V8.3l7-3.11 7 3.11V10c0 4.46-3.14 9.04-7 10z"/>
                            <circle cx="12" cy="12" r="3"/>
                          </svg>
                          <h3 class="text-2xl font-bold">Swati Jewellers</h3>
                          <p class="text-sm mt-2 opacity-90">Premium Gold & Diamond Jewelry</p>
                        </div>
                      </div>
                    `;
                  }}
                />
              </div>
              <div className="absolute -bottom-6 -right-6 bg-gradient-to-br from-yellow-400 to-yellow-500 p-8 rounded-2xl shadow-xl">
                <div className="text-center text-black">
                  <div className="text-3xl font-bold mb-2">15+</div>
                  <div className="text-sm font-semibold">Years of Trust</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Our <span className="text-yellow-500">Journey</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Milestones that shaped our legacy and built the trust of thousands
            </p>
          </div>

          <div className="relative">
            <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-1 bg-gradient-to-b from-yellow-400 to-yellow-600"></div>
            <div className="space-y-12">
              {milestones.map((milestone, index) => (
                <div
                  key={index}
                  className={`flex items-center ${index % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'}`}
                >
                  <div className={`lg:w-1/2 ${index % 2 === 0 ? 'lg:pr-12 lg:text-right' : 'lg:pl-12 lg:text-left'}`}>
                    <div className="bg-white p-8 rounded-2xl shadow-xl border-l-4 border-yellow-400 hover:shadow-2xl transition-shadow duration-300">
                      <div className="flex items-center space-x-4 mb-4">
                        <Clock className="h-6 w-6 text-yellow-500" />
                        <span className="text-2xl font-bold text-yellow-600">{milestone.year}</span>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{milestone.title}</h3>
                      <p className="text-gray-700">{milestone.description}</p>
                    </div>
                  </div>
                  <div className="lg:w-1/2 flex justify-center">
                    <div className="w-4 h-4 bg-yellow-400 rounded-full border-4 border-white shadow-lg z-10"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Our <span className="text-yellow-500">Values</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              The principles that guide every decision and every piece we create
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            {values.map((value, index) => (
              <div
                key={index}
                className="group p-8 bg-gradient-to-br from-gray-50 to-white rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:scale-105 border border-gray-100 hover:border-yellow-200"
              >
                <div className="flex items-start space-x-6">
                  <div className="flex-shrink-0">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-2xl group-hover:scale-110 transition-transform duration-300 shadow-lg">
                      <value.icon className="h-8 w-8 text-white" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-4 group-hover:text-yellow-600 transition-colors duration-300">
                      {value.title}
                    </h3>
                    <p className="text-gray-700 leading-relaxed">{value.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-black via-gray-900 to-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Become Part of Our <span className="text-yellow-400">Legacy</span>
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
            Join thousands of satisfied customers who have made Swati Jewellers their trusted partner for life's most precious moments.
          </p>
          <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-6">
            <a
              href="/products"
              className="inline-flex items-center justify-center space-x-3 bg-gradient-to-r from-yellow-500 to-yellow-400 text-black font-bold py-4 px-8 rounded-xl hover:from-yellow-400 hover:to-yellow-300 transition-all duration-300 transform hover:scale-105 shadow-2xl"
            >
              <Crown className="h-5 w-5" />
              <span className="text-lg">Explore Collection</span>
            </a>
            <a
              href="/contact"
              className="inline-flex items-center justify-center space-x-3 border-2 border-yellow-400 text-yellow-400 font-bold py-4 px-8 rounded-xl hover:bg-yellow-400 hover:text-black transition-all duration-300 transform hover:scale-105"
            >
              <span className="text-lg">Visit Us Today</span>
            </a>
          </div>
        </div>
      </section>

    </div>
  );
};

export default About;

