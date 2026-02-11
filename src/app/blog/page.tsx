'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import Navbar from '@/components/layout/Navbar'
import { Calendar, User, Tag, ArrowRight, TrendingUp } from 'lucide-react'

// Template blog posts (kasnije iz database)
const BLOG_POSTS = [
  {
    id: 1,
    slug: 'how-to-create-perfect-profile',
    title: 'How to Create the Perfect Escort Profile',
    excerpt: 'Learn the best practices for creating an attractive and professional profile that stands out. From photos to descriptions, we cover everything you need to know.',
    content: '',
    category: 'Tips & Guides',
    author: 'NiceModels Team',
    date: '2026-02-10',
    image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800',
    featured: true,
    readTime: '5 min read'
  },
  {
    id: 2,
    slug: 'safety-tips-for-escorts',
    title: 'Essential Safety Tips for Escorts',
    excerpt: 'Your safety is our priority. This comprehensive guide covers important safety measures, client screening, and emergency protocols.',
    content: '',
    category: 'Safety',
    author: 'Safety Expert',
    date: '2026-02-08',
    image: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=800',
    featured: false,
    readTime: '7 min read'
  },
  {
    id: 3,
    slug: 'understanding-swiss-escort-laws',
    title: 'Understanding Swiss Escort Industry Regulations',
    excerpt: 'A detailed overview of the legal framework surrounding escort services in Switzerland. Know your rights and obligations.',
    content: '',
    category: 'Legal',
    author: 'Legal Advisor',
    date: '2026-02-05',
    image: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800',
    featured: false,
    readTime: '10 min read'
  },
  {
    id: 4,
    slug: 'maximizing-your-online-presence',
    title: 'Maximizing Your Online Presence',
    excerpt: 'Discover strategies to increase your visibility on NiceModels.ch and attract more clients through smart profile optimization.',
    content: '',
    category: 'Marketing',
    author: 'Marketing Team',
    date: '2026-02-03',
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800',
    featured: false,
    readTime: '6 min read'
  },
  {
    id: 5,
    slug: 'photography-tips-for-models',
    title: 'Professional Photography Tips for Your Profile',
    excerpt: 'High-quality photos are crucial for success. Learn about lighting, angles, poses, and editing techniques that work.',
    content: '',
    category: 'Tips & Guides',
    author: 'Photo Expert',
    date: '2026-01-30',
    image: 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=800',
    featured: false,
    readTime: '8 min read'
  },
  {
    id: 6,
    slug: 'building-client-relationships',
    title: 'Building Long-Term Client Relationships',
    excerpt: 'How to maintain professionalism while building a loyal client base. Communication tips and best practices for repeat bookings.',
    content: '',
    category: 'Business',
    author: 'Business Coach',
    date: '2026-01-28',
    image: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?w=800',
    featured: false,
    readTime: '5 min read'
  }
]

const CATEGORIES = ['All', 'Tips & Guides', 'Safety', 'Legal', 'Marketing', 'Business']

export default function BlogPage() {
  const [selectedCategory, setSelectedCategory] = useState('All')

  const filteredPosts = selectedCategory === 'All' 
    ? BLOG_POSTS 
    : BLOG_POSTS.filter(post => post.category === selectedCategory)

  const featuredPost = BLOG_POSTS.find(post => post.featured)
  const regularPosts = filteredPosts.filter(post => !post.featured)

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50">
        
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-pink-600 via-rose-500 to-pink-600 text-white py-16">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center">
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-4">
                <TrendingUp className="w-4 h-4" />
                <span className="text-sm font-semibold">Latest Updates & Insights</span>
              </div>
              <h1 className="text-5xl font-black mb-4">NiceModels Blog</h1>
              <p className="text-xl text-pink-100 max-w-2xl mx-auto">
                Tips, guides, and industry insights to help you succeed
              </p>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-12">
          
          {/* Category Filter */}
          <div className="mb-8 flex flex-wrap gap-3 justify-center">
            {CATEGORIES.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-6 py-2 rounded-full font-semibold transition-all ${
                  selectedCategory === category
                    ? 'bg-gradient-to-r from-pink-600 to-rose-600 text-white shadow-md'
                    : 'bg-white text-gray-700 hover:bg-pink-50 border border-gray-200'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Featured Post */}
          {featuredPost && selectedCategory === 'All' && (
            <div className="mb-12">
              <div className="flex items-center gap-2 mb-4">
                <div className="bg-pink-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                  Featured
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Latest Article</h2>
              </div>
              
              <Link
                href={`/blog/${featuredPost.slug}`}
                className="group block bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-all"
              >
                <div className="grid grid-cols-1 lg:grid-cols-2">
                  {/* Image */}
                  <div className="relative h-64 lg:h-auto bg-gradient-to-br from-pink-100 to-rose-100">
                    <Image
                      src={featuredPost.image}
                      alt={featuredPost.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 1024px) 100vw, 50vw"
                    />
                    <div className="absolute top-4 left-4 bg-pink-600 text-white px-3 py-1 rounded-full text-xs font-bold">
                      {featuredPost.category}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-8 flex flex-col justify-between">
                    <div>
                      <h3 className="text-3xl font-bold text-gray-900 mb-4 group-hover:text-pink-600 transition-colors">
                        {featuredPost.title}
                      </h3>
                      <p className="text-gray-600 text-lg leading-relaxed mb-6">
                        {featuredPost.excerpt}
                      </p>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          <span>{featuredPost.author}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(featuredPost.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        </div>
                        <span className="text-pink-600 font-semibold">{featuredPost.readTime}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-pink-600 font-bold group-hover:gap-3 transition-all">
                        <span>Read More</span>
                        <ArrowRight className="w-5 h-5" />
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          )}

          {/* Blog Posts Grid */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {selectedCategory === 'All' ? 'All Articles' : `${selectedCategory} Articles`}
            </h2>
            
            {regularPosts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {regularPosts.map(post => (
                  <Link
                    key={post.id}
                    href={`/blog/${post.slug}`}
                    className="group bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all"
                  >
                    {/* Image */}
                    <div className="relative h-48 bg-gradient-to-br from-pink-100 to-rose-100">
                      <Image
                        src={post.image}
                        alt={post.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                      <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full">
                        <span className="text-xs font-bold text-pink-600">{post.category}</span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                      <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-pink-600 transition-colors line-clamp-2">
                        {post.title}
                      </h3>
                      <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                        {post.excerpt}
                      </p>
                      
                      <div className="flex items-center justify-between text-xs text-gray-600 pt-4 border-t border-gray-100">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3 h-3" />
                          <span>{new Date(post.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                        </div>
                        <span className="text-pink-600 font-semibold">{post.readTime}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
                <p className="text-gray-600">No articles found in this category.</p>
              </div>
            )}
          </div>

          {/* Newsletter CTA */}
          <div className="mt-16 bg-gradient-to-br from-pink-600 via-rose-500 to-pink-600 rounded-2xl p-8 text-center text-white shadow-xl">
            <h2 className="text-3xl font-bold mb-4">Stay Updated</h2>
            <p className="text-pink-100 mb-6 max-w-2xl mx-auto">
              Subscribe to our newsletter and get the latest tips, guides, and industry insights delivered to your inbox.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 rounded-lg text-gray-900 focus:ring-2 focus:ring-white focus:outline-none"
              />
              <button className="px-6 py-3 bg-white text-pink-600 rounded-lg font-bold hover:bg-pink-50 transition-all shadow-md">
                Subscribe
              </button>
            </div>
            <p className="text-xs text-pink-200 mt-4">
              No spam. Unsubscribe anytime.
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
