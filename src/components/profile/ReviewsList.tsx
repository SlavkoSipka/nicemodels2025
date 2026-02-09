import { Star, ThumbsUp } from 'lucide-react'

interface ReviewsListProps {
  profileId: string
  rating: number
  totalReviews: number
}

export default function ReviewsList({ profileId, rating, totalReviews }: ReviewsListProps) {
  // Mock reviews - kasnije iz Supabase-a
  const reviews = [
    {
      id: '1',
      author: 'John D.',
      rating: 5,
      date: '2 days ago',
      comment: 'Amazing experience! Marina is very professional and friendly. Highly recommended!',
      helpful: 12,
    },
    {
      id: '2',
      author: 'Mike S.',
      rating: 5,
      date: '1 week ago',
      comment: 'Best GFE experience in Basel. She is exactly as described in her profile. Will definitely visit again.',
      helpful: 8,
    },
    {
      id: '3',
      author: 'David L.',
      rating: 4,
      date: '2 weeks ago',
      comment: 'Very nice lady, good service. Apartment is clean and discreet. Only minor issue was timing.',
      helpful: 5,
    },
  ]

  return (
    <div className="bg-white rounded-2xl shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Reviews</h2>
        <button className="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition font-semibold">
          Write Review
        </button>
      </div>

      {/* Rating Summary */}
      <div className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-xl p-6 mb-6">
        <div className="flex items-center gap-6">
          <div className="text-center">
            <div className="text-5xl font-bold text-gray-800">{rating}</div>
            <div className="flex items-center justify-center mt-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-5 h-5 ${
                    star <= Math.floor(rating)
                      ? 'text-yellow-400 fill-yellow-400'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <div className="text-sm text-gray-600 mt-1">{totalReviews} reviews</div>
          </div>

          <div className="flex-1">
            {[5, 4, 3, 2, 1].map((stars) => (
              <div key={stars} className="flex items-center gap-2 mb-2">
                <span className="text-sm text-gray-600 w-8">{stars}★</span>
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-yellow-400 h-2 rounded-full"
                    style={{
                      width: `${stars === 5 ? 85 : stars === 4 ? 12 : stars === 3 ? 2 : 1}%`,
                    }}
                  />
                </div>
                <span className="text-sm text-gray-600 w-8">
                  {stars === 5 ? 85 : stars === 4 ? 12 : stars === 3 ? 2 : 1}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-6">
        {reviews.map((review) => (
          <div key={review.id} className="border-b pb-6 last:border-0">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="font-semibold text-gray-800">{review.author}</div>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-4 h-4 ${
                          star <= review.rating
                            ? 'text-yellow-400 fill-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-gray-500">{review.date}</span>
                </div>
              </div>
            </div>
            <p className="text-gray-700 mb-3">{review.comment}</p>
            <button className="flex items-center text-sm text-gray-600 hover:text-pink-600 transition">
              <ThumbsUp className="w-4 h-4 mr-1" />
              Helpful ({review.helpful})
            </button>
          </div>
        ))}
      </div>

      {/* Load More */}
      <button className="w-full mt-6 py-3 border-2 border-gray-300 rounded-lg font-semibold text-gray-700 hover:border-pink-500 hover:text-pink-500 transition">
        Load More Reviews
      </button>
    </div>
  )
}

