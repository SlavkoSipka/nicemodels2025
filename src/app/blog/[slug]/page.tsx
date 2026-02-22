'use client'

import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import { Calendar, User, Clock, ArrowLeft, Tag, Share2 } from 'lucide-react'

// Template blog posts (isti kao u blog/page.tsx - kasnije iz database)
const BLOG_POSTS = [
  {
    id: 1,
    slug: 'how-to-create-perfect-profile',
    title: 'How to Create the Perfect Escort Profile',
    excerpt: 'Learn the best practices for creating an attractive and professional profile that stands out.',
    content: `
      <h2>Why Your Profile Matters</h2>
      <p>Your profile is your first impression and often the deciding factor for potential clients. A well-crafted profile can significantly increase your bookings and help you stand out in a competitive market.</p>
      
      <h2>Professional Photography</h2>
      <p>High-quality photos are essential. Invest in professional photography or learn proper lighting and angles. Your main photo should be clear, well-lit, and showcase your best features.</p>
      
      <h3>Photo Tips:</h3>
      <ul>
        <li>Use natural lighting when possible</li>
        <li>Include variety - full body shots, close-ups, different outfits</li>
        <li>Keep photos recent and accurate</li>
        <li>Maintain professionalism while being attractive</li>
      </ul>
      
      <h2>Writing Your Description</h2>
      <p>Your description should be engaging, honest, and highlight what makes you unique. Avoid clichés and be specific about your services and personality.</p>
      
      <h3>Description Best Practices:</h3>
      <ul>
        <li>Be authentic and genuine</li>
        <li>Clearly list your services</li>
        <li>Mention your languages and special skills</li>
        <li>Include your availability and working hours</li>
        <li>Proofread for grammar and spelling</li>
      </ul>
      
      <h2>Setting Your Rates</h2>
      <p>Research competitive rates in your area while valuing your time appropriately. Be transparent about your pricing structure and any additional costs.</p>
      
      <h2>Verification and Trust</h2>
      <p>Complete your verification process to build trust with potential clients. Verified profiles receive significantly more attention and bookings.</p>
      
      <h2>Regular Updates</h2>
      <p>Keep your profile fresh by updating photos, availability, and information regularly. Active profiles rank higher in search results.</p>
    `,
    category: 'Tips & Guides',
    author: 'NiceModels Team',
    date: '2026-02-10',
    image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1200',
    featured: true,
    readTime: '5 min read'
  },
  {
    id: 2,
    slug: 'safety-tips-for-escorts',
    title: 'Essential Safety Tips for Escorts',
    excerpt: 'Your safety is our priority. This comprehensive guide covers important safety measures.',
    content: `
      <h2>Client Screening</h2>
      <p>Always screen your clients before meeting. Request references, verify their identity, and trust your instincts.</p>
      
      <h2>Meeting Locations</h2>
      <p>Choose safe, public locations for initial meetings. For outcalls, research the location beforehand and let someone know where you'll be.</p>
      
      <h2>Emergency Protocols</h2>
      <p>Have an emergency contact and a safety plan. Keep your phone charged and accessible at all times.</p>
    `,
    category: 'Safety',
    author: 'Safety Expert',
    date: '2026-02-08',
    image: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=1200',
    featured: false,
    readTime: '7 min read'
  }
]

export default function BlogPostPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string

  const post = BLOG_POSTS.find(p => p.slug === slug)

  if (!post) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Post Not Found</h1>
            <Link href="/blog" className="text-pink-600 hover:underline">
              ← Back to Blog
            </Link>
          </div>
        </div>
      </>
    )
  }

  const relatedPosts = BLOG_POSTS.filter(p => p.id !== post.id && p.category === post.category).slice(0, 3)

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50">
        
        {/* Hero Image */}
        <div className="relative h-[400px] bg-gradient-to-br from-pink-100 to-rose-100">
          <Image
            src={post.image}
            alt={post.title}
            fill
            className="object-cover"
            sizes="100vw"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          
          {/* Back Button */}
          <div className="absolute top-8 left-4 max-w-7xl mx-auto w-full px-4">
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full text-gray-900 font-semibold hover:bg-white transition-all shadow-md"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Blog</span>
            </Link>
          </div>
        </div>

        {/* Article Content */}
        <div className="max-w-4xl mx-auto px-4 -mt-20 relative z-10">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 md:p-12 mb-12">
            
            {/* Category Badge */}
            <div className="inline-flex items-center gap-2 bg-pink-100 text-pink-700 px-4 py-2 rounded-full mb-6">
              <Tag className="w-4 h-4" />
              <span className="font-semibold text-sm">{post.category}</span>
            </div>

            {/* Title */}
            <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-6 leading-tight">
              {post.title}
            </h1>

            {/* Excerpt */}
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              {post.excerpt}
            </p>

            {/* Meta Info */}
            <div className="flex flex-wrap items-center gap-6 pb-8 mb-8 border-b border-gray-200">
              <div className="flex items-center gap-2 text-gray-600">
                <User className="w-5 h-5" />
                <span className="font-semibold">{post.author}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Calendar className="w-5 h-5" />
                <span>{new Date(post.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
              </div>
              <div className="flex items-center gap-2 text-pink-600 font-semibold">
                <Clock className="w-5 h-5" />
                <span>{post.readTime}</span>
              </div>
              <button className="ml-auto flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all">
                <Share2 className="w-4 h-4" />
                <span className="font-semibold text-sm">Share</span>
              </button>
            </div>

            {/* Content */}
            <div 
              className="prose prose-lg max-w-none
                prose-headings:font-bold prose-headings:text-gray-900
                prose-h2:text-3xl prose-h2:mt-8 prose-h2:mb-4
                prose-h3:text-2xl prose-h3:mt-6 prose-h3:mb-3
                prose-p:text-gray-700 prose-p:leading-relaxed prose-p:mb-4
                prose-ul:list-disc prose-ul:ml-6 prose-ul:mb-4
                prose-li:text-gray-700 prose-li:mb-2
                prose-a:text-pink-600 prose-a:no-underline hover:prose-a:underline"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />

            {/* Tags */}
            <div className="mt-12 pt-8 border-t border-gray-200">
              <div className="flex flex-wrap gap-2">
                <span className="text-gray-600 font-semibold">Tags:</span>
                <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">Profile Tips</span>
                <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">Marketing</span>
                <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">Success</span>
              </div>
            </div>
          </div>

          {/* Related Posts */}
          {relatedPosts.length > 0 && (
            <div className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Related Articles</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {relatedPosts.map(relatedPost => (
                  <Link
                    key={relatedPost.id}
                    href={`/blog/${relatedPost.slug}`}
                    className="group bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all"
                  >
                    <div className="relative h-40 bg-gradient-to-br from-pink-100 to-rose-100">
                      <Image
                        src={relatedPost.image}
                        alt={relatedPost.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 768px) 100vw, 33vw"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-pink-600 transition-colors">
                        {relatedPost.title}
                      </h3>
                      <p className="text-sm text-gray-600">{relatedPost.readTime}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* CTA */}
          <div className="bg-gradient-to-br from-pink-600 via-rose-500 to-pink-600 rounded-2xl p-8 text-center text-white shadow-xl mb-12">
            <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
            <p className="text-pink-100 mb-6 max-w-2xl mx-auto">
              Create your profile today and start connecting with clients across Switzerland.
            </p>
            <Link
              href="/register"
              className="inline-block px-8 py-4 bg-white text-pink-600 rounded-xl font-bold hover:bg-pink-50 transition-all shadow-md"
            >
              Create Account
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
