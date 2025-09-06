'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Search, MapPin, Heart, MessageCircle, Star, ArrowRight, TrendingUp, Users } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface Listing {
  id: string
  title: string
  price: number | null
  location: any
  photos?: string[]
  category: string
  created_at: string
}

interface Stats {
  total_listings: number
  active_users: number
  categories: number
}

export default function HomePage() {
  const { user, loading: authLoading, error: authError, clearError } = useAuth()
  const [listings, setListings] = useState<Listing[]>([])
  const [stats, setStats] = useState<Stats>({ total_listings: 0, active_users: 0, categories: 12 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch latest listings
        const { data: listingsData, error: listingsError } = await supabase
          .from('listings')
          .select('id, title, price, location, photos, category, created_at')
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(8)

        if (listingsError) {
          console.error('Error fetching listings:', listingsError)
        } else if (listingsData) {
          // Transform the data to match our interface
          const transformedListings: Listing[] = listingsData.map((listing: any) => ({
            id: listing.id,
            title: listing.title,
            price: listing.price,
            location: typeof listing.location === 'string' ? listing.location : 'Location not specified',
            photos: listing.photos || [],
            category: listing.category,
            created_at: listing.created_at
          }))
          setListings(transformedListings)
        }

        // Fetch basic stats
        const { count } = await supabase
          .from('listings')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'active')

        setStats(prev => ({ ...prev, total_listings: count || 0 }))
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Clear auth error when component mounts
  useEffect(() => {
    if (authError) {
      // Auto-clear error after 5 seconds
      const timer = setTimeout(() => {
        clearError()
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [authError, clearError])

  const categories = [
    { name: 'Vehicles', icon: '🚗', count: '1.2k+', href: '/browse?category=vehicles' },
    { name: 'Real Estate', icon: '🏠', count: '850+', href: '/browse?category=real-estate' },
    { name: 'Electronics', icon: '💻', count: '2.1k+', href: '/browse?category=electronics' },
    { name: 'Fashion', icon: '👕', count: '1.8k+', href: '/browse?category=fashion' },
    { name: 'Home & Garden', icon: '🏡', count: '950+', href: '/browse?category=home-garden' },
    { name: 'Services', icon: '🔧', count: '1.5k+', href: '/browse?category=services' }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Auth Error Banner */}
      {authError && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                Authentication notice: {authError}
              </p>
            </div>
            <button
              onClick={clearError}
              className="ml-auto text-yellow-400 hover:text-yellow-600"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-indigo-600/10" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Discover Amazing
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                {" "}Deals
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Algeria's premier marketplace connecting buyers and sellers across the nation.
              Find everything you need, from cars to electronics, real estate to services.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/browse">
                <Button size="lg" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-3">
                  <Search className="w-5 h-5 mr-2" />
                  Browse Listings
                </Button>
              </Link>
              <Link href="/add-item">
                <Button size="lg" variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-50 px-8 py-3">
                  Post Your Ad
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-3xl font-bold text-gray-900">{stats.total_listings.toLocaleString()}+</h3>
              <p className="text-gray-600">Active Listings</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mx-auto mb-4">
                <Users className="w-8 h-8 text-indigo-600" />
              </div>
              <h3 className="text-3xl font-bold text-gray-900">{stats.active_users.toLocaleString()}+</h3>
              <p className="text-gray-600">Active Users</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mx-auto mb-4">
                <Star className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-3xl font-bold text-gray-900">{stats.categories}+</h3>
              <p className="text-gray-600">Categories</p>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Browse by Category
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Explore our diverse range of categories to find exactly what you're looking for
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((category) => (
              <Link
                key={category.name}
                href={category.href}
                className="group"
              >
                <Card className="h-full hover:shadow-lg transition-all duration-200 group-hover:scale-105">
                  <CardContent className="p-6 text-center">
                    <div className="text-4xl mb-3">{category.icon}</div>
                    <h3 className="font-semibold text-gray-900 mb-1">{category.name}</h3>
                    <p className="text-sm text-gray-500">{category.count}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Recent Listings */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-12">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Recent Listings
              </h2>
              <p className="text-gray-600">
                Discover the latest items added to our marketplace
              </p>
            </div>
            <Link href="/browse">
              <Button variant="outline" className="hidden md:flex">
                View All
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <div className="h-48 bg-gray-200 rounded-t-lg"></div>
                  <CardContent className="p-4">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {listings.map((listing) => (
                <Link key={listing.id} href={`/browse/${listing.id}`}>
                  <Card className="group hover:shadow-lg transition-all duration-200 hover:scale-105">
                    <div className="relative h-48 bg-gray-200 rounded-t-lg overflow-hidden">
                      {listing.photos && listing.photos.length > 0 ? (
                        <img
                          src={listing.photos[0]}
                          alt={listing.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-200"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <span className="text-4xl">📷</span>
                        </div>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                        {listing.title}
                      </h3>
                      <p className="text-lg font-bold text-blue-600 mb-2">
                        {listing.price && listing.price > 0 ? listing.price.toLocaleString() + ' DA' : 'Price on request'}
                      </p>
                      <div className="flex items-center text-sm text-gray-500">
                        <MapPin className="w-4 h-4 mr-1" />
                        {listing.location}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}

          <div className="text-center mt-8 md:hidden">
            <Link href="/browse">
              <Button variant="outline">
                View All Listings
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Why Choose MarketDZ?
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              We provide a safe, reliable, and user-friendly platform for all your buying and selling needs
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="text-center p-6">
              <div className="flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mx-auto mb-4">
                <Search className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Easy Search</h3>
              <p className="text-gray-600">
                Find exactly what you're looking for with our advanced search and filtering options
              </p>
            </Card>

            <Card className="text-center p-6">
              <div className="flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mx-auto mb-4">
                <Heart className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Save Favorites</h3>
              <p className="text-gray-600">
                Keep track of items you love and get notified when similar items are posted
              </p>
            </Card>

            <Card className="text-center p-6">
              <div className="flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mx-auto mb-4">
                <MessageCircle className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Direct Communication</h3>
              <p className="text-gray-600">
                Connect directly with buyers and sellers through our secure messaging system
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-indigo-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Start Trading?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of users who trust MarketDZ for their buying and selling needs
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {!user ? (
              <>
                <Link href="/signup">
                  <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-3">
                    Get Started Free
                  </Button>
                </Link>
                <Link href="/signin">
                  <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-blue-600 px-8 py-3">
                    Sign In
                  </Button>
                </Link>
              </>
            ) : (
              <Link href="/add-item">
                <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-3">
                  Post Your First Ad
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
