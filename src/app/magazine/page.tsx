import Link from 'next/link'
import Image from 'next/image'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { excerptOf, getMagazinePosts, leadImageOf, MAGAZINE_PATH, REVALIDATE_SECONDS } from '@/lib/cms'

export const revalidate = REVALIDATE_SECONDS

function formatDate(value: string | null): string {
  if (!value) return ''
  return new Date(value).toLocaleDateString('de-CH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export default async function MagazinePage() {
  const posts = await getMagazinePosts()

  return (
    <>
      <Navbar />

      <main className="mx-auto w-full max-w-4xl px-4 py-10">
        <header className="mb-10">
          <h1 className="mb-3 text-3xl font-bold text-gray-900 sm:text-4xl">Magazin</h1>
          <p className="text-gray-600">
            Ratgeber und Hintergrundartikel rund um Escort, Clubs und das Nachtleben in der Schweiz.
          </p>
        </header>

        {posts.length === 0 ? (
          <p className="rounded-lg border border-dashed border-gray-300 p-10 text-center text-gray-500">
            Zurzeit sind keine Artikel verfügbar.
          </p>
        ) : (
          <div className="space-y-8">
            {posts.map(post => {
              const image = leadImageOf(post)
              return (
                <article key={post.id} className="border-b border-gray-100 pb-8 last:border-0">
                  <Link href={`${MAGAZINE_PATH}/${post.slug}`} className="group block sm:flex sm:gap-5">
                    {image ? (
                      <Image
                        src={image}
                        alt=""
                        width={320}
                        height={180}
                        className="mb-3 w-full rounded-lg object-cover sm:mb-0 sm:w-56 sm:shrink-0"
                      />
                    ) : null}

                    <div>
                      <h2 className="mb-2 text-xl font-semibold text-gray-900 group-hover:text-rose-600">
                        {post.title}
                      </h2>
                      <p className="mb-2 text-gray-600">{excerptOf(post)}</p>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-gray-400">
                        {post.published_at ? (
                          <time dateTime={post.published_at}>{formatDate(post.published_at)}</time>
                        ) : null}
                        {(post.tags ?? []).slice(0, 3).map(tag => (
                          <span key={tag} className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </Link>
                </article>
              )
            })}
          </div>
        )}
      </main>

      <Footer />
    </>
  )
}
