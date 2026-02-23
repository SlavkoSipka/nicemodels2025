'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { Calendar, User, Clock, ArrowLeft } from 'lucide-react'

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
    readTime: '5 min',
  },
  {
    id: 2,
    slug: 'safety-tips-for-escorts',
    title: 'Essential Safety Tips for Escorts',
    excerpt: 'Your safety is our priority. This comprehensive guide covers important safety measures, client screening, and emergency protocols.',
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
    readTime: '7 min',
  },
  {
    id: 3,
    slug: 'understanding-swiss-escort-laws',
    title: 'Understanding Swiss Escort Industry Regulations',
    excerpt: 'A detailed overview of the legal framework surrounding escort services in Switzerland.',
    content: `
      <h2>Legal Framework</h2>
      <p>Switzerland has a clear and regulated approach to the escort industry. Understanding these rules protects both service providers and clients.</p>
      <h2>Registration</h2>
      <p>In many cantons, registration with local authorities may be required. Always check the regulations in your specific region.</p>
    `,
    category: 'Legal',
    author: 'Legal Advisor',
    date: '2026-02-05',
    image: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=1200',
    featured: false,
    readTime: '10 min',
  },
  {
    id: 4,
    slug: 'maximizing-your-online-presence',
    title: 'Maximizing Your Online Presence',
    excerpt: 'Discover strategies to increase your visibility on NiceModels.ch and attract more clients.',
    content: `
      <h2>Profile Optimization</h2>
      <p>A well-optimized profile ranks higher in search results and gets more views. Focus on completeness and keyword-rich descriptions.</p>
      <h2>Consistency</h2>
      <p>Update your profile regularly. Active profiles are prioritized in our discovery algorithm.</p>
    `,
    category: 'Marketing',
    author: 'Marketing Team',
    date: '2026-02-03',
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200',
    featured: false,
    readTime: '6 min',
  },
  {
    id: 5,
    slug: 'photography-tips-for-models',
    title: 'Professional Photography Tips for Your Profile',
    excerpt: 'High-quality photos are crucial for success. Learn about lighting, angles, and editing.',
    content: `
      <h2>Lighting is Everything</h2>
      <p>Good lighting transforms an average photo into a great one. Natural window light is your best friend.</p>
      <h2>Angles and Composition</h2>
      <p>Experiment with different angles to find your most flattering perspective. Rule of thirds applies to portrait photography too.</p>
    `,
    category: 'Tips & Guides',
    author: 'Photo Expert',
    date: '2026-01-30',
    image: 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=1200',
    featured: false,
    readTime: '8 min',
  },
  {
    id: 6,
    slug: 'building-client-relationships',
    title: 'Building Long-Term Client Relationships',
    excerpt: 'How to maintain professionalism while building a loyal client base.',
    content: `
      <h2>Communication</h2>
      <p>Clear, prompt, and professional communication builds trust and keeps clients coming back.</p>
      <h2>Consistency</h2>
      <p>Deliver a consistent experience every time. Reliability is one of the most valued traits.</p>
    `,
    category: 'Business',
    author: 'Business Coach',
    date: '2026-01-28',
    image: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?w=1200',
    featured: false,
    readTime: '5 min',
  },
]

export default function BlogPostPage() {
  const params = useParams()
  const slug = params.slug as string
  const [email, setEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)
  const post = BLOG_POSTS.find((p) => p.slug === slug)

  if (!post) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4">
          <p className="text-gray-500 text-sm">Article not found.</p>
          <Link href="/blog" className="text-sm font-medium text-brand hover:underline flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" /> Back to Blog
          </Link>
        </div>
        <Footer />
      </>
    )
  }

  const relatedPosts = BLOG_POSTS.filter(
    (p) => p.id !== post.id && p.category === post.category
  ).slice(0, 3)

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-white">

        {/* ── Hero image ── */}
        <div className="relative w-full aspect-[21/9] max-h-[480px] bg-gray-100 overflow-hidden">
          <Image
            src={post.image}
            alt={post.title}
            fill
            className="object-cover"
            sizes="100vw"
            priority
          />
        </div>

        {/* ── Article ── */}
        <div className="max-w-3xl mx-auto px-4 py-12">

          {/* Category label */}
          <p className="text-xs font-semibold uppercase tracking-widest text-brand mb-4">
            {post.category}
          </p>

          {/* Title */}
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight mb-4">
            {post.title}
          </h1>

          {/* Excerpt */}
          <p className="text-lg text-gray-500 leading-relaxed mb-8">
            {post.excerpt}
          </p>

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-5 pb-8 mb-8 border-b border-gray-100 text-sm text-gray-400">
            <span className="flex items-center gap-1.5">
              <User className="w-4 h-4" />
              {post.author}
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              {new Date(post.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              {post.readTime} read
            </span>
          </div>

          {/* Content */}
          <div
            className="
              prose prose-gray max-w-none
              prose-headings:font-semibold prose-headings:text-gray-900 prose-headings:tracking-tight
              prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4
              prose-h3:text-lg prose-h3:mt-6 prose-h3:mb-3
              prose-p:text-gray-600 prose-p:leading-relaxed prose-p:mb-5
              prose-ul:pl-5 prose-ul:space-y-1
              prose-li:text-gray-600
              prose-a:text-brand prose-a:no-underline hover:prose-a:underline
            "
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          {/* Tags */}
          <div className="flex flex-wrap items-center gap-2 mt-12 pt-8 border-t border-gray-100">
            <span className="text-xs text-gray-400 font-medium uppercase tracking-wider mr-1">Tags</span>
            {[post.category, 'Switzerland', 'Guide'].map((tag) => (
              <span key={tag} className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* ── Related posts ── */}
        {relatedPosts.length > 0 && (
          <div className="border-t border-gray-100 bg-gray-50">
            <div className="max-w-3xl mx-auto px-4 py-12">
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-7">
                Related articles
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {relatedPosts.map((rel) => (
                  <Link
                    key={rel.id}
                    href={`/blog/${rel.slug}`}
                    className="group flex flex-col"
                  >
                    <div className="relative aspect-[16/9] rounded-lg overflow-hidden bg-gray-200 mb-3">
                      <Image
                        src={rel.image}
                        alt={rel.title}
                        fill
                        className="object-cover group-hover:scale-[1.03] transition-transform duration-500"
                        sizes="(max-width: 640px) 100vw, 33vw"
                      />
                    </div>
                    <p className="text-xs font-semibold text-brand uppercase tracking-wide mb-1">{rel.category}</p>
                    <h3 className="text-sm font-semibold text-gray-900 group-hover:text-brand transition-colors leading-snug line-clamp-2 mb-2">
                      {rel.title}
                    </h3>
                    <span className="text-xs text-gray-400 mt-auto flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {rel.readTime}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Newsletter ── */}
        <div className="max-w-7xl mx-auto px-4">
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
