import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import BlogPostCard from '@/components/blog/BlogPostCard'
import { getBlogPosts } from '@/lib/cms'

// Next requires a literal here; it cannot statically read an imported const.
export const revalidate = 300

export default async function BlogPage() {
  const posts = await getBlogPosts()

  return (
    <>
      <Navbar />

      <main className="mx-auto w-full max-w-6xl px-4 py-10">
        <header className="mb-8 sm:mb-10">
          <h1 className="mb-3 text-3xl font-bold text-gray-900 sm:text-4xl">Blog</h1>
          <p className="max-w-2xl text-gray-600">
            Ratgeber und Hintergrundartikel rund um Inserate, Sicherheit und das Nachtleben in der Schweiz.
          </p>
        </header>

        {posts.length === 0 ? (
          <p className="rounded-lg border border-dashed border-gray-300 p-10 text-center text-gray-500">
            Zurzeit sind keine Artikel verfügbar.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map(post => (
              <BlogPostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </>
  )
}
