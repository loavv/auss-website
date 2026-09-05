import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, MapPin, Clock, ExternalLink, Search } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import CountdownTimer from '@/components/shared/CountdownTimer'
import { supabase } from '@/lib/supabase'
import type { Event } from '@/types'

const categories = ['All', 'Foundation', 'Academic', 'Community', 'Leadership', 'Recognition']

const statusColors: Record<string, string> = {
  upcoming: 'bg-blue-100 text-blue-700',
  ongoing: 'bg-emerald-100 text-emerald-700',
  completed: 'bg-gray-100 text-gray-600',
  cancelled: 'bg-red-100 text-red-600',
}

const regStatusConfig: Record<string, { label: string; variant: 'success' | 'warning' | 'danger' | 'default' }> = {
  open: { label: 'Registration Open', variant: 'success' },
  closed: { label: 'Registration Closed', variant: 'danger' },
  coming_soon: { label: 'Registration Soon', variant: 'warning' },
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [tab, setTab] = useState('upcoming')
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)

  useEffect(() => {
    async function fetchEvents() {
      const { data } = await supabase
        .from('events')
        .select('*')
        .order('date', { ascending: true })
      setEvents(data || [])
      setLoading(false)
    }
    fetchEvents()
  }, [])

  // Compare using date strings (YYYY-MM-DD) so timezone differences don't shift the boundary
  const todayStr = new Date().toISOString().slice(0, 10)

  const filtered = events.filter(e => {
    const isPast = e.date < todayStr || e.status === 'completed' || e.status === 'cancelled'
    const matchTab = tab === 'upcoming' ? !isPast : isPast
    const matchSearch = e.title.toLowerCase().includes(search.toLowerCase()) ||
      e.venue.toLowerCase().includes(search.toLowerCase())
    const matchCategory = category === 'All' || e.category === category
    return matchTab && matchSearch && matchCategory
  })

  return (
    <div className="pt-20">
      {/* Hero */}
      <section className="relative py-24 overflow-hidden" style={{ background: 'linear-gradient(135deg, #0A1628 0%, #0056D2 100%)' }}>
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: `radial-gradient(circle, #fff 1px, transparent 1px)`, backgroundSize: '40px 40px' }}
        />
        <div className="relative max-w-4xl mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
            <Badge className="mb-4 bg-white/20 text-white border-white/30">Stay Updated</Badge>
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
              Events &amp;
              <span className="block" style={{ color: '#F4C430' }}>Programs</span>
            </h1>
            <p className="text-white/70 text-lg max-w-xl mx-auto">
              Discover upcoming events, programs, and activities organized by AUSS.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-16 bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="flex-1 max-w-md">
              <Input
                placeholder="Search events..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                icon={<Search className="w-4 h-4" />}
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                    category === cat
                      ? 'bg-primary text-white shadow-sm'
                      : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={tab} onValueChange={setTab} className="mb-8">
            <TabsList>
              <TabsTrigger value="upcoming">Upcoming Events</TabsTrigger>
              <TabsTrigger value="past">Past Events</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Events Grid */}
          <AnimatePresence mode="wait">
            {loading ? (
              <div className="flex justify-center py-24">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filtered.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-24"
              >
                <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-400 mb-2">
                  {tab === 'upcoming' ? 'No upcoming events' : 'No past events'}
                </h3>
                <p className="text-gray-400">
                  {tab === 'upcoming' ? 'Check back soon for new events.' : 'Try adjusting your filters.'}
                </p>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {filtered.map((event, i) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    index={i}
                    onSelect={() => setSelectedEvent(event)}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* Event Detail Modal */}
      <AnimatePresence>
        {selectedEvent && (
          <EventModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />
        )}
      </AnimatePresence>
    </div>
  )
}

function EventCard({ event, index, onSelect }: {
  event: Event
  index: number
  onSelect: () => void
}) {
  const reg = regStatusConfig[event.registration_status]
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      className="group"
    >
      <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 h-full flex flex-col">
        {/* Banner */}
        <div className="relative aspect-video overflow-hidden bg-gradient-to-br from-primary/20 to-primary/5">
          {event.banner_url ? (
            <img
              src={event.banner_url}
              alt={event.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Calendar className="w-12 h-12 text-primary/30" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
          <div className="absolute top-3 left-3 flex gap-2">
            <span className="px-2 py-1 rounded-lg bg-primary/90 text-white text-xs font-semibold">
              {event.category}
            </span>
            {event.is_featured && (
              <span className="px-2 py-1 rounded-lg bg-secondary/90 text-navy text-xs font-semibold">
                Featured
              </span>
            )}
          </div>
          <div className="absolute bottom-3 left-3">
            <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${statusColors[event.status]}`}>
              {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 flex-1 flex flex-col">
          <h3 className="font-bold text-gray-900 mb-2 group-hover:text-primary transition-colors line-clamp-2">
            {event.title}
          </h3>
          <div className="space-y-1.5 mb-4">
            <div className="flex items-center gap-2 text-gray-500 text-xs">
              <Calendar className="w-3.5 h-3.5 text-primary shrink-0" />
              <span>{new Date(event.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              {event.time && <span className="text-gray-400">· {event.time}</span>}
            </div>
            <div className="flex items-center gap-2 text-gray-500 text-xs">
              <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
              <span className="line-clamp-1">{event.venue}</span>
            </div>
          </div>

          {/* Countdown for upcoming events (only when date is in the future) */}
          {(event.status === 'upcoming' || event.status === 'ongoing') && event.date >= new Date().toISOString().slice(0, 10) && (
            <div className="mb-4">
              <CountdownTimer targetDate={event.date} />
            </div>
          )}

          <div className="mt-auto flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="flex-1"
              onClick={onSelect}
            >
              View Details
            </Button>
            {event.registration_status === 'open' && event.registration_link && (
              <a href={event.registration_link} target="_blank" rel="noopener noreferrer" className="flex-1">
                <Button size="sm" className="w-full gap-1">
                  Register
                  <ExternalLink className="w-3 h-3" />
                </Button>
              </a>
            )}
            {event.registration_status === 'closed' && (
              <Button size="sm" disabled className="flex-1">
                Registration Closed
              </Button>
            )}
            {event.registration_status === 'coming_soon' && (
              <Button size="sm" variant="secondary" disabled className="flex-1 text-xs">
                Opens Soon
              </Button>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  )
}

function EventModal({ event, onClose }: { event: Event; onClose: () => void }) {
  const reg = regStatusConfig[event.registration_status]

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={e => e.stopPropagation()}
        className="relative bg-white rounded-2xl overflow-hidden max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
      >
        {/* Banner */}
        <div className="relative aspect-video bg-gradient-to-br from-primary/20 to-primary/5">
          {event.banner_url ? (
            <img src={event.banner_url} alt={event.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Calendar className="w-16 h-16 text-primary/30" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
          <div className="absolute bottom-4 left-4">
            <span className="px-3 py-1 rounded-lg bg-primary/90 text-white text-sm font-semibold">
              {event.category}
            </span>
          </div>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition-colors"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">{event.title}</h2>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
              <Calendar className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <p className="text-xs text-gray-400">Date & Time</p>
                <p className="text-sm font-semibold text-gray-900">
                  {new Date(event.date).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
                {event.time && <p className="text-xs text-gray-500">{event.time}</p>}
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
              <MapPin className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <p className="text-xs text-gray-400">Venue</p>
                <p className="text-sm font-semibold text-gray-900">{event.venue}</p>
              </div>
            </div>
          </div>

          {event.organizer && (
            <div className="flex items-center gap-2 mb-4 text-sm text-gray-500">
              <span className="font-medium text-gray-700">Organized by:</span> {event.organizer}
            </div>
          )}

          <p className="text-gray-600 leading-relaxed mb-6">{event.description}</p>

          {(event.status === 'upcoming' || event.status === 'ongoing') && event.date >= new Date().toISOString().slice(0, 10) && (
            <div className="mb-6">
              <p className="text-sm font-medium text-gray-700 mb-3">Event Countdown</p>
              <CountdownTimer targetDate={event.date} large />
            </div>
          )}

          {/* Registration */}
          <div className="border-t pt-6">
            <p className="text-sm font-semibold text-gray-700 mb-3">Registration Status</p>
            <Badge variant={reg.variant} className="mb-4">
              {reg.label}
            </Badge>
            {event.registration_deadline && (
              <p className="text-xs text-gray-500 mb-4 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Registration deadline: {new Date(event.registration_deadline).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            )}
            {event.registration_status === 'open' && event.registration_link && (
              <a href={event.registration_link} target="_blank" rel="noopener noreferrer">
                <Button size="lg" className="w-full">
                  Register Now
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </a>
            )}
            {event.registration_status === 'closed' && (
              <Button size="lg" disabled className="w-full">
                Registration Closed
              </Button>
            )}
            {event.registration_status === 'coming_soon' && (
              <Button size="lg" variant="secondary" disabled className="w-full">
                Registration Opens Soon
              </Button>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
