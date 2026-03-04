'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { Calendar, User, ArrowRight, Clock } from 'lucide-react'

const BLOG_POSTS = [
  {
    id: 1,
    slug: 'how-to-create-perfect-profile',
    title: 'How to Create the Perfect Escort Profile',
    excerpt: 'Learn the best practices for creating an attractive and professional profile that stands out. From photos to descriptions, we cover everything you need to know.',
    category: 'Tips & Guides',
    author: 'NiceModels Team',
    date: '2026-02-10',
    image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800',
    featured: true,
    readTime: '5 min',
  },
  {
    id: 2,
    slug: 'safety-tips-for-escorts',
    title: 'Essential Safety Tips for Escorts',
    excerpt: 'Your safety is our priority. This comprehensive guide covers important safety measures, client screening, and emergency protocols.',
    category: 'Safety',
    author: 'Safety Expert',
    date: '2026-02-08',
    image: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=800',
    featured: false,
    readTime: '7 min',
  },
  {
    id: 3,
    slug: 'understanding-swiss-escort-laws',
    title: 'Understanding Swiss Escort Industry Regulations',
    excerpt: 'A detailed overview of the legal framework surrounding escort services in Switzerland. Know your rights and obligations.',
    category: 'Legal',
    author: 'Legal Advisor',
    date: '2026-02-05',
    image: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800',
    featured: false,
    readTime: '10 min',
  },
  {
    id: 4,
    slug: 'maximizing-your-online-presence',
    title: 'Maximizing Your Online Presence',
    excerpt: 'Discover strategies to increase your visibility on NiceModels.ch and attract more clients through smart profile optimization.',
    category: 'Marketing',
    author: 'Marketing Team',
    date: '2026-02-03',
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800',
    featured: false,
    readTime: '6 min',
  },
  {
    id: 5,
    slug: 'photography-tips-for-models',
    title: 'Professional Photography Tips for Your Profile',
    excerpt: 'High-quality photos are crucial for success. Learn about lighting, angles, poses, and editing techniques that work.',
    category: 'Tips & Guides',
    author: 'Photo Expert',
    date: '2026-01-30',
    image: 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=800',
    featured: false,
    readTime: '8 min',
  },
  {
    id: 6,
    slug: 'building-client-relationships',
    title: 'Building Long-Term Client Relationships',
    excerpt: 'How to maintain professionalism while building a loyal client base. Communication tips and best practices for repeat bookings.',
    category: 'Business',
    author: 'Business Coach',
    date: '2026-01-28',
    image: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?w=800',
    featured: false,
    readTime: '5 min',
  },
]

const CATEGORIES = ['All', 'Tips & Guides', 'Safety', 'Legal', 'Marketing', 'Business']

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export default function BlogPage() {
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [email, setEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)

  const filteredPosts =
    selectedCategory === 'All'
      ? BLOG_POSTS
      : BLOG_POSTS.filter((p) => p.category === selectedCategory)

  const featuredPost = BLOG_POSTS.find((p) => p.featured)
  const regularPosts = filteredPosts.filter((p) => !p.featured)

  return (
    <>
      <Navbar />
      <div className="min-h-screen" style={{ background: 'linear-gradient(to bottom, #BE185D 0px, #BE185D 370px, #1f2126 370px)' }}>

        {/* ── Header ── */}
        <div style={{ borderBottom: '1px solid rgba(255,255,255,0.15)' }}>
          <div className="max-w-7xl mx-auto px-4 py-12">
            <p className="text-xs font-semibold uppercase tracking-widest text-white/60 mb-3">
              Blog
            </p>
            <h1 className="text-4xl sm:text-5xl font-bold text-white leading-tight max-w-2xl">
              Stories, guides &amp; insights
            </h1>
            <p className="mt-3 text-white/70 text-lg max-w-xl">
              Tips and industry knowledge for models, agencies and curious readers.
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4">

          {/* ── Category tabs ── */}
          <div className="flex items-center gap-1 py-5 border-b border-white/15 overflow-x-auto scrollbar-hide">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === cat
                    ? 'bg-white text-gray-900'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* ── Featured post ── */}
          {featuredPost && selectedCategory === 'All' && (
            <div className="py-10 border-b border-white/15">
              <p className="text-xs font-semibold uppercase tracking-widest text-white/50 mb-5">
                Featured
              </p>
              <Link
                href={`/blog/${featuredPost.slug}`}
                className="group grid grid-cols-1 lg:grid-cols-2 gap-0 rounded-xl overflow-hidden border border-gray-200 hover:border-gray-300 transition-colors"
              >
                {/* Image */}
                <div className="relative h-64 lg:h-auto min-h-[280px] bg-gray-100">
                  <Image
                    src={featuredPost.image}
                    alt={featuredPost.title}
                    fill
                    className="object-cover group-hover:scale-[1.02] transition-transform duration-500"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                  />
                  <span className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm text-xs font-semibold text-gray-700 px-3 py-1 rounded-full">
                    {featuredPost.category}
                  </span>
                </div>

                {/* Text */}
                <div className="flex flex-col justify-between p-8 bg-white">
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-snug group-hover:text-brand transition-colors mb-4">
                      {featuredPost.title}
                    </h2>
                    <p className="text-gray-500 leading-relaxed">
                      {featuredPost.excerpt}
                    </p>
                  </div>
                  <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
                    <div className="flex items-center gap-4 text-sm text-gray-400">
                      <span className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5" />
                        {featuredPost.author}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        {formatDate(featuredPost.date)}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        {featuredPost.readTime}
                      </span>
                    </div>
                    <span className="flex items-center gap-1 text-sm font-semibold text-brand group-hover:gap-2 transition-all">
                      Read <ArrowRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              </Link>
            </div>
          )}

          {/* ── Posts grid ── */}
          <div className="py-10">
            {regularPosts.length > 0 ? (
              <>
                <p className="text-xs font-semibold uppercase tracking-widest text-white/50 mb-7">
                  {selectedCategory === 'All' ? 'Latest articles' : selectedCategory}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {regularPosts.map((post) => (
                    <Link
                      key={post.id}
                      href={`/blog/${post.slug}`}
                      className="group flex flex-col"
                    >
                      {/* Image */}
                      <div className="relative aspect-[16/9] rounded-lg overflow-hidden bg-gray-100 mb-4">
                        <Image
                          src={post.image}
                          alt={post.title}
                          fill
                          className="object-cover group-hover:scale-[1.03] transition-transform duration-500"
                          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        />
                      </div>

                      {/* Meta */}
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-xs font-semibold text-brand uppercase tracking-wide">
                          {post.category}
                        </span>
                        <span className="text-gray-300">·</span>
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {post.readTime}
                        </span>
                      </div>

                      {/* Title */}
                      <h3 className="text-base font-semibold text-white group-hover:text-white/80 transition-colors leading-snug mb-2">
                        {post.title}
                      </h3>

                      {/* Excerpt */}
                      <p className="text-sm text-white/60 line-clamp-2 flex-1 mb-4">
                        {post.excerpt}
                      </p>

                      {/* Author + date */}
                      <div className="flex items-center gap-2 text-xs text-white/50 mt-auto">
                        <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                          <User className="w-3 h-3 text-white/50" />
                        </div>
                        <span>{post.author}</span>
                        <span className="text-white/30">·</span>
                        <span>{new Date(post.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </>
            ) : (
              <div className="py-16 text-center">
                <p className="text-gray-500">No articles in this category yet.</p>
              </div>
            )}
          </div>

          {/* ── Newsletter ── */}
          <div className="my-10 rounded-xl border border-gray-200 bg-gray-50 px-8 py-10 flex flex-col sm:flex-row items-center gap-8">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2">Newsletter</p>
              <h3 className="text-xl font-bold text-gray-900 mb-1">Stay in the loop</h3>
              <p className="text-sm text-gray-500">
                Get the latest guides and news delivered to your inbox. No spam — unsubscribe anytime.
              </p>
            </div>
            <div className="flex-shrink-0 w-full sm:w-auto">
              {subscribed ? (
                <p className="text-sm font-medium text-emerald-600">You're subscribed ✓</p>
              ) : (
                <form
                  onSubmit={(e) => { e.preventDefault(); setSubscribed(true) }}
                  className="flex gap-2"
                >
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-56 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand focus:border-brand transition-colors"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-gray-900 hover:bg-gray-700 text-white text-sm font-semibold rounded-lg transition-colors whitespace-nowrap"
                  >
                    Subscribe
                  </button>
                </form>
              )}
            </div>
          </div>

        </div>
      </div>
      <Footer />
    </>
  )
}
