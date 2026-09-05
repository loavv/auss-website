import { useRef, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence, useScroll, useTransform, useInView } from 'framer-motion'
import { ArrowRight, ChevronDown, Calendar, Megaphone, Users, Star, Trophy, BookOpen, Target, Building2, Briefcase, Landmark, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import AnimatedCounter from '@/components/shared/AnimatedCounter'
import { supabase } from '@/lib/supabase'
import { useOrgInfo } from '@/hooks/useOrgInfo'
import type { Announcement, Event, Achievement } from '@/types'
import aussLogo from '@/assets/auss-logo.png'

const stats = [
  { label: 'Scholars Served', value: 2000, suffix: '+', icon: Users, color: 'text-blue-450' },
  { label: 'Events Held', value: 100, suffix: '+', icon: Calendar, color: 'text-purple-450' },
  { label: 'Years of Excellence', value: 23, suffix: '', icon: Star, color: 'text-green-450' },
]

const pillars = [
  {
    abbr: 'UFSA',
    name: 'University-Funded Scholars Alliance',
    icon: Building2,
    scholarships: [
      'Entrance Scholarship',
      'Academic Scholarship',
      'AdU Elite Scholarship',
      'Kristal Mae Padasas Scholarship',
      'Congregation of the Mission (CM) Scholar',
      'Congregation of the Mission Fr. Leandro',
      'Montañana Education Access Program (CM L.E.A.P)',
      'Scholarship Assistance for Education Students (SAES) Program',
    ],
  },
  {
    abbr: 'ACS',
    name: 'Association of Corporate Scholars',
    icon: Briefcase,
    scholarships: [
      'Alexander Athos Scholarship',
      'GT Foundation / ZMT Scholar',
      'LCCK Foundation Inc.',
      'Megaworld Foundation',
      'Miramar Development Corporation',
      'Shearwater Health Advisors Inc.',
      'Simplicio Gamboa Scholarship',
      'Arthaland',
      'Ar. Ramon E. Tubilla Scholarship',
      'Moirasia Foundation',
    ],
  },
  {
    abbr: 'AGS',
    name: 'Alliance of Government Scholars',
    icon: Landmark,
    scholarships: [
      'DOST Scholarship',
      'CHED Tertiary Education Subsidy',
      'CHED Tulong Dunong Program',
    ],
  },
]

function FloatingBlob({ className, delay = 0 }: { className: string; delay?: number }) {
  return (
    <motion.div
      className={`absolute rounded-full blur-3xl pointer-events-none ${className}`}
      animate={{
        scale: [1, 1.25, 0.95, 1.1, 1],
        x: [0, 45, -20, 30, 0],
        y: [0, -30, 25, -15, 0],
      }}
      transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay }}
    />
  )
}

function SectionHeader({ badge, title, subtitle, light = false }: {
  badge: string; title: string; subtitle?: string; light?: boolean
}) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-100px' })
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6 }}
      className="text-center mb-12"
    >
      <Badge variant={light ? 'outline' : 'default'} className={`mb-4 ${light ? 'border-white/30 text-white bg-white/10' : ''}`}>
        {badge}
      </Badge>
      <h2 className={`text-3xl md:text-4xl lg:text-5xl font-bold mb-4 ${light ? 'text-white' : 'text-gray-900'}`}>
        {title}
      </h2>
      {subtitle && (
        <p className={`text-lg max-w-2xl mx-auto ${light ? 'text-white/70' : 'text-gray-500'}`}>
          {subtitle}
        </p>
      )}
    </motion.div>
  )
}

export default function HomePage() {
  const heroRef = useRef(null)
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const heroY = useTransform(scrollYProgress, [0, 1], ['0%', '30%'])
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0])

  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [featuredEvents, setFeaturedEvents] = useState<Event[]>([])
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null)
  const [showAllAnnouncements, setShowAllAnnouncements] = useState(false)
  const orgInfo = useOrgInfo()

  useEffect(() => {
    async function fetchAll() {
      const [annRes, evRes, achRes] = await Promise.all([
        supabase
          .from('announcements')
          .select('*')
          .eq('status', 'published')
          .order('created_at', { ascending: false }),
        supabase
          .from('events')
          .select('*')
          .eq('status', 'upcoming')
          .gte('date', new Date().toISOString().split('T')[0])
          .order('date', { ascending: true })
          .limit(3),
        supabase
          .from('achievements')
          .select('*')
          .order('date', { ascending: false })
          .limit(20),
      ])
      setAnnouncements(annRes.data || [])
      setFeaturedEvents(evRes.data || [])
      setAchievements(achRes.data || [])
    }
    fetchAll()
  }, [])

  return (
    <div className="overflow-hidden">
      {/* ═══════════════ HERO ═══════════════ */}
      <section
        ref={heroRef}
        className="relative min-h-screen flex items-center justify-center overflow-hidden gradient-hero-animated"
      >
        {/* Animated blobs */}
        <motion.div style={{ y: heroY }} className="absolute inset-0 pointer-events-none">
          <FloatingBlob className="w-[520px] h-[520px] bg-primary opacity-25 -top-24 -left-32" delay={0} />
          <FloatingBlob className="w-[420px] h-[420px] bg-secondary opacity-30 bottom-10 -right-24" delay={3} />
          <FloatingBlob className="w-[300px] h-[300px] bg-blue-400 opacity-20 top-1/2 left-1/3" delay={6} />
          <FloatingBlob className="w-[250px] h-[250px] bg-amber-300 opacity-15 top-1/4 right-1/4" delay={2} />
        </motion.div>

        {/* Subtle grid */}
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage: `linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />

        {/* Diagonal shimmer bar */}
        <motion.div
          className="absolute inset-0 pointer-events-none overflow-hidden"
          aria-hidden
        >
          <motion.div
            className="absolute w-[200%] h-full opacity-[0.06]"
            style={{
              background: 'linear-gradient(105deg, transparent 40%, #F4C430 50%, transparent 60%)',
            }}
            animate={{ x: ['-100%', '50%'] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'linear', repeatDelay: 3 }}
          />
        </motion.div>

        <motion.div
          style={{ opacity: heroOpacity }}
          className="relative z-10 max-w-5xl mx-auto px-4 text-center"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.5, rotate: -10 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 0.8, delay: 0.1, type: 'spring' }}
            className="w-28 h-28 mx-auto mb-8 rounded-full overflow-hidden shadow-2xl glow-blue border-4 border-white/20"
          >
            <img src={aussLogo} alt="AUSS Logo" className="w-full h-full object-contain bg-white" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight text-shadow"
          >
            {orgInfo?.name || "Adamson University Scholars' Society"}
            <span className="block text-2xl md:text-3xl lg:text-4xl font-medium text-white/70 mt-2">
              {orgInfo?.tagline || 'AUSS'}
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="text-lg md:text-xl text-white/70 max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            {orgInfo?.description ||
              'Empowering scholars through academic excellence, leadership development, and meaningful community engagement. Guided by Vincentian values.'}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="flex flex-wrap items-center justify-center gap-4"
          >
            <Link to="/events">
              <Button size="lg" variant="secondary" className="group">
                <Calendar className="w-4 h-4" />
                Explore Events
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link to="/about">
              <Button size="lg" variant="glass">
                Learn About Us
              </Button>
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
            className="absolute -bottom-20 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/40"
          >
            <span className="text-xs font-medium tracking-widest uppercase">Scroll</span>
            <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
              <ChevronDown className="w-5 h-5" />
            </motion.div>
          </motion.div>
        </motion.div>
      </section>

      {/* ═══════════════ STATS — notebook cards ═══════════════ */}
      <section className="py-20 bg-white relative overflow-hidden">
        <div
          className="absolute inset-x-0 top-0 h-1 gradient-accent-animated"
          aria-hidden
        />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-10">
            {stats.map((stat, i) => {
              const Icon = stat.icon
              const iconGradients = [
                'from-primary to-blue-400',
                'from-secondary to-amber-400',
                'from-primary-dark to-primary',
              ]
              const inkColors = ['text-primary', 'text-amber-600', 'text-primary-dark']
              const subColors = ['text-blue-400', 'text-amber-400', 'text-blue-600']
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 40, rotate: -1 }}
                  whileInView={{ opacity: 1, y: 0, rotate: i === 1 ? 0.5 : i === 2 ? -0.8 : -1 }}
                  whileHover={{ y: -6, rotate: 0, transition: { duration: 0.2 } }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.55, delay: i * 0.12, type: 'spring', stiffness: 120 }}
                  className="notebook-card"
                  style={{ transform: `rotate(${i === 1 ? '0.5deg' : i === 2 ? '-0.8deg' : '-1deg'})` }}
                >
                  {/* Content sits to the right of the binding strip */}
                  <div className="relative z-10 pl-[72px] pr-6 pt-6 pb-8 text-left">

                    {/* Icon */}
                    <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${iconGradients[i]} flex items-center justify-center mb-5 shadow-md`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>

                    {/* Big number — handwriting-style bold */}
                    <div className={`text-5xl font-black leading-none mb-1 ${inkColors[i]}`}
                      style={{ fontFamily: 'var(--font-display)' }}>
                      <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                    </div>

                    {/* Label on a ruled line */}
                    <div className={`text-sm font-semibold tracking-wide mt-3 ${subColors[i]}`}>
                      {stat.label}
                    </div>

                    {/* Decorative pencil-underline */}
                    <div className={`mt-2 h-0.5 w-16 rounded-full bg-gradient-to-r ${iconGradients[i]} opacity-50`} />
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════ ANNOUNCEMENTS — bulletin board ═══════════════ */}
      <section className="py-24 bg-stone-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Section header above the board */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="flex items-end justify-between mb-8"
          >
            <div>
              <Badge className="mb-3">Latest Updates</Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Announcements</h2>
            </div>
            {announcements.length > 3 && (
              <Button variant="ghost" size="sm" onClick={() => setShowAllAnnouncements(true)}>
                View All <ArrowRight className="w-4 h-4" />
              </Button>
            )}
          </motion.div>

          {/* The cork board */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bulletin-board p-8 md:p-10"
          >
            {announcements.length === 0 ? (
              <p className="text-amber-200/70 text-center py-12 font-medium">No announcements pinned yet.</p>
            ) : (
              <div className="grid md:grid-cols-3 gap-10">
                {announcements.slice(0, 3).map((item, i) => {
                  // alternate blue / yellow / blue
                  const noteClass = i === 1 ? 'pinned-note-yellow' : 'pinned-note-blue'
                  const rotations = ['-rotate-1', 'rotate-1', '-rotate-[0.5deg]']
                  const hoverRotations = ['hover:rotate-0', 'hover:rotate-0', 'hover:rotate-0']
                  const labelColors = i === 1
                    ? 'bg-amber-500 text-white'
                    : 'bg-primary text-white'
                  const iconBg = i === 1 ? 'bg-amber-100' : 'bg-blue-100'
                  const iconColor = i === 1 ? 'text-amber-600' : 'text-primary'
                  const titleHover = i === 1 ? 'group-hover:text-amber-700' : 'group-hover:text-primary'

                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 40 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: i * 0.12, type: 'spring', stiffness: 110 }}
                      className={`group relative pt-6 ${rotations[i]} cursor-default`}
                    >
                      {/* Push pin */}
                      <div className="push-pin" aria-hidden />

                      {/* Note paper */}
                      <div className={`pinned-note ${noteClass} p-6`}>
                        {/* Top row: icon + category + date */}
                        <div className="flex items-center gap-3 mb-4">
                          <div className={`w-9 h-9 rounded-lg ${iconBg} flex items-center justify-center shrink-0`}>
                            <Megaphone className={`w-4 h-4 ${iconColor}`} />
                          </div>
                          <div>
                            <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${labelColors}`}>
                              {item.category}
                            </span>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {new Date(item.created_at).toLocaleDateString('en-US', {
                                year: 'numeric', month: 'long', day: 'numeric',
                              })}
                            </p>
                          </div>
                        </div>

                        {/* Title */}
                        <h3 className={`font-bold text-gray-800 mb-2 text-sm leading-snug transition-colors ${titleHover}`}>
                          {item.title}
                        </h3>

                        {/* Content */}
                        <p className="text-xs text-gray-600 leading-relaxed line-clamp-4">
                          {item.content}
                        </p>

                        {/* Read More */}
                        <button
                          onClick={() => setSelectedAnnouncement(item)}
                          className={`mt-4 text-xs font-semibold flex items-center gap-1 transition-colors ${
                            i === 1
                              ? 'text-amber-600 hover:text-amber-800'
                              : 'text-primary hover:text-primary-dark'
                          }`}
                        >
                          Read more <ArrowRight className="w-3 h-3" />
                        </button>

                        {/* Torn-edge bottom effect */}
                        <div
                          className="absolute bottom-0 left-0 right-0 h-3 pointer-events-none opacity-20"
                          style={{
                            background: 'repeating-linear-gradient(90deg, transparent 0px, transparent 6px, rgba(0,0,0,0.15) 6px, rgba(0,0,0,0.15) 7px)',
                          }}
                          aria-hidden
                        />
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </motion.div>

        </div>
      </section>

      {/* ── Single announcement paper modal ── */}
      <AnimatePresence>
        {selectedAnnouncement && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedAnnouncement(null)}
          >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

            {/* Paper sheet */}
            <motion.div
              initial={{ scale: 0.88, y: 30, rotate: -2 }}
              animate={{ scale: 1, y: 0, rotate: 0 }}
              exit={{ scale: 0.88, y: 30, rotate: 2, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 22 }}
              onClick={e => e.stopPropagation()}
              className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto"
              style={{
                background: '#fffef5',
                backgroundImage: `repeating-linear-gradient(transparent, transparent 27px, #c5d8f0 27px, #c5d8f0 28px)`,
                backgroundPosition: '0 48px',
                borderRadius: '3px 8px 8px 3px',
                boxShadow: '4px 6px 24px rgba(0,0,0,0.35), 1px 1px 0 rgba(255,255,255,0.5) inset',
              }}
            >
              {/* Red margin line */}
              <div className="absolute top-0 bottom-0 left-14 w-px bg-red-300/70 pointer-events-none" aria-hidden />

              {/* Push pin at top-center */}
              <div className="push-pin" style={{ top: '-10px', left: '50%', position: 'absolute' }} aria-hidden />

              {/* Close button */}
              <button
                onClick={() => setSelectedAnnouncement(null)}
                className="absolute top-3 right-3 w-7 h-7 rounded-full bg-gray-200/80 hover:bg-gray-300 flex items-center justify-center transition-colors z-10"
                aria-label="Close"
              >
                <X className="w-3.5 h-3.5 text-gray-600" />
              </button>

              {/* Content — padded past the margin line */}
              <div className="pl-16 pr-6 pt-10 pb-8">
                {/* Category + date */}
                <div className="flex items-center gap-2 mb-5">
                  <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold bg-primary text-white">
                    {selectedAnnouncement.category}
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(selectedAnnouncement.created_at).toLocaleDateString('en-US', {
                      year: 'numeric', month: 'long', day: 'numeric',
                    })}
                  </span>
                </div>

                {/* Title — handwritten-bold look */}
                <h2
                  className="text-xl font-black text-gray-800 mb-5 leading-snug"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  {selectedAnnouncement.title}
                </h2>

                {/* Pencil underline */}
                <div className="h-0.5 w-20 rounded-full bg-gradient-to-r from-primary to-blue-400 opacity-50 mb-5" />

                {/* Full content */}
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {selectedAnnouncement.content}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── All announcements modal — bulletin board ── */}
      <AnimatePresence>
        {showAllAnnouncements && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={() => setShowAllAnnouncements(false)}
          >
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
            <motion.div
              initial={{ scale: 0.95, y: 24 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 24 }}
              onClick={e => e.stopPropagation()}
              className="relative w-full max-w-5xl max-h-[90vh] flex flex-col rounded-xl overflow-hidden shadow-2xl"
              style={{ background: '#5C3A1E' }}
            >
              {/* ── Wooden frame top bar ── */}
              <div
                className="shrink-0 flex items-center justify-between px-6 py-3"
                style={{
                  background: 'linear-gradient(180deg, #7a4a28 0%, #5C3A1E 100%)',
                  borderBottom: '4px solid #3d2410',
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-900/60 flex items-center justify-center">
                    <Megaphone className="w-4 h-4 text-amber-200" />
                  </div>
                  <div>
                    <h2 className="font-bold text-amber-100 text-base leading-tight">Bulletin Board</h2>
                    <p className="text-xs text-amber-300/70">
                      {announcements.length} announcement{announcements.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAllAnnouncements(false)}
                  className="w-8 h-8 rounded-full bg-amber-900/60 hover:bg-amber-800/80 flex items-center justify-center transition-colors"
                  aria-label="Close"
                >
                  <X className="w-4 h-4 text-amber-200" />
                </button>
              </div>

              {/* ── Cork board scrollable area ── */}
              <div
                className="overflow-y-auto"
                style={{ scrollbarColor: '#a16207 #5C3A1E' }}
              >
                {/* Cork texture layer */}
                <div
                  className="min-h-full p-10 pt-12"
                  style={{
                    background: `
                      radial-gradient(ellipse 3px 2px at 8%  14%, rgba(255,255,255,0.07) 0%, transparent 100%),
                      radial-gradient(ellipse 2px 3px at 29% 38%, rgba(0,0,0,0.11) 0%, transparent 100%),
                      radial-gradient(ellipse 4px 2px at 52%  6%, rgba(255,255,255,0.05) 0%, transparent 100%),
                      radial-gradient(ellipse 2px 4px at 74% 57%, rgba(0,0,0,0.09) 0%, transparent 100%),
                      radial-gradient(ellipse 3px 2px at 89% 25%, rgba(255,255,255,0.06) 0%, transparent 100%),
                      radial-gradient(ellipse 2px 3px at 18% 71%, rgba(0,0,0,0.08) 0%, transparent 100%),
                      radial-gradient(ellipse 4px 2px at 44% 85%, rgba(255,255,255,0.04) 0%, transparent 100%),
                      radial-gradient(ellipse 2px 4px at 63% 30%, rgba(0,0,0,0.10) 0%, transparent 100%),
                      repeating-linear-gradient(92deg, transparent 0px, rgba(0,0,0,0.035) 1px, transparent 2px, transparent 18px),
                      repeating-linear-gradient(88deg, transparent 0px, rgba(255,255,255,0.025) 1px, transparent 3px, transparent 24px),
                      #8B5E3C
                    `,
                  }}
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
                    {announcements.map((item, i) => {
                      const noteVariants = [
                        { note: 'pinned-note-blue', label: 'bg-primary text-white', icon: 'text-primary', iconBg: 'bg-blue-100', titleHover: 'group-hover:text-primary', readMore: 'text-primary hover:text-primary-dark' },
                        { note: 'pinned-note-yellow', label: 'bg-amber-500 text-white', icon: 'text-amber-600', iconBg: 'bg-amber-100', titleHover: 'group-hover:text-amber-700', readMore: 'text-amber-600 hover:text-amber-800' },
                        { note: 'pinned-note', label: 'bg-primary text-white', icon: 'text-primary', iconBg: 'bg-blue-50', titleHover: 'group-hover:text-primary', readMore: 'text-primary hover:text-primary-dark' },
                      ]
                      const v = noteVariants[i % 3]
                      const tilts = ['-rotate-1', 'rotate-1', '-rotate-[0.5deg]', 'rotate-[0.8deg]', '-rotate-[1.2deg]', 'rotate-[0.4deg]']
                      const tilt = tilts[i % tilts.length]

                      return (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, y: 30 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.4, delay: Math.min(i * 0.06, 0.5), type: 'spring', stiffness: 120 }}
                          className={`group relative pt-6 ${tilt}`}
                        >
                          {/* Push pin */}
                          <div className="push-pin" aria-hidden />

                          {/* Note paper */}
                          <div className={`pinned-note ${v.note} p-5`}>
                            {/* Icon + category + date */}
                            <div className="flex items-center gap-3 mb-4">
                              <div className={`w-9 h-9 rounded-lg ${v.iconBg} flex items-center justify-center shrink-0`}>
                                <Megaphone className={`w-4 h-4 ${v.icon}`} />
                              </div>
                              <div>
                                <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${v.label}`}>
                                  {item.category}
                                </span>
                                <p className="text-xs text-gray-400 mt-0.5">
                                  {new Date(item.created_at).toLocaleDateString('en-US', {
                                    year: 'numeric', month: 'long', day: 'numeric',
                                  })}
                                </p>
                              </div>
                            </div>

                            {/* Title */}
                            <h3 className={`font-bold text-gray-800 mb-2 text-sm leading-snug transition-colors ${v.titleHover}`}>
                              {item.title}
                            </h3>

                            {/* Content */}
                            <p className="text-xs text-gray-600 leading-relaxed line-clamp-4">
                              {item.content}
                            </p>

                            {/* Read more */}
                            <button
                              onClick={() => { setShowAllAnnouncements(false); setSelectedAnnouncement(item) }}
                              className={`mt-4 text-xs font-semibold flex items-center gap-1 transition-colors ${v.readMore}`}
                            >
                              Read more <ArrowRight className="w-3 h-3" />
                            </button>

                            {/* Torn-edge bottom */}
                            <div
                              className="absolute bottom-0 left-0 right-0 h-3 pointer-events-none opacity-20"
                              style={{
                                background: 'repeating-linear-gradient(90deg, transparent 0px, transparent 6px, rgba(0,0,0,0.15) 6px, rgba(0,0,0,0.15) 7px)',
                              }}
                              aria-hidden
                            />
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* ── Wooden frame bottom bar ── */}
              <div
                className="shrink-0 h-3"
                style={{ background: 'linear-gradient(0deg, #7a4a28 0%, #5C3A1E 100%)', borderTop: '4px solid #3d2410' }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════════════ MISSION & VISION ═══════════════ */}
      <section className="py-24 bg-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            badge="Who We Are"
            title="Our Purpose & Direction"
            subtitle="Guided by a clear mission and vision, AUSS strives to be the leading academic organization for scholars at Adamson University."
          />

          {/* Wall surface */}
          <div className="wall-surface px-8 py-16 md:px-16">
            <div className="grid md:grid-cols-2 gap-16 md:gap-24">

              {/* ── Mission — blue frame ── */}
              <motion.div
                initial={{ opacity: 0, x: -60, rotate: -2 }}
                whileInView={{ opacity: 1, x: 0, rotate: -1.5 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, type: 'spring', stiffness: 90 }}
                className="relative mt-6"
              >
                {/* Nail */}
                <div className="frame-nail" aria-hidden />
                {/* Wire */}
                <div className="frame-wire" aria-hidden />

                <div className="picture-frame picture-frame-blue">
                  {/* Frame corner ornaments */}
                  <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-white/40 rounded-tl-sm" aria-hidden />
                  <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-white/40 rounded-tr-sm" aria-hidden />
                  <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-white/40 rounded-bl-sm" aria-hidden />
                  <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-white/40 rounded-br-sm" aria-hidden />

                  <div className="picture-mat">
                    <div className="frame-paper">

                      <div className="pl-8">
                        {/* Icon */}
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-primary flex items-center justify-center mb-5 shadow-md">
                          <Target className="w-6 h-6 text-white" />
                        </div>
                        {/* Title */}
                        <h3
                          className="text-2xl font-black text-primary mb-3 leading-tight"
                          style={{ fontFamily: 'var(--font-display)' }}
                        >
                          Our Mission
                        </h3>
                        <div className="h-0.5 w-14 bg-gradient-to-r from-primary to-blue-300 rounded-full mb-4 opacity-60" />
                        {/* Content */}
                        <p className="text-sm text-gray-700 leading-relaxed">
                          {orgInfo?.mission ||
                            'We are committed to empowering our scholars by promoting academic excellence, leadership, holistic development, and scholar welfare. Guided by the Vincentian values of excellence, accountability, and service, we aspire to develop individuals who use their knowledge and talents to create a positive impact within the University and beyond.'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Shadow on wall */}
                <div className="absolute inset-0 -z-10 translate-x-2 translate-y-3 bg-black/15 blur-md rounded-sm pointer-events-none" aria-hidden />
              </motion.div>

              {/* ── Vision — gold frame ── */}
              <motion.div
                initial={{ opacity: 0, x: 60, rotate: 2 }}
                whileInView={{ opacity: 1, x: 0, rotate: 1.5 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, type: 'spring', stiffness: 90, delay: 0.1 }}
                className="relative mt-6"
              >
                {/* Nail */}
                <div className="frame-nail" aria-hidden />
                {/* Wire */}
                <div className="frame-wire" aria-hidden />

                <div className="picture-frame picture-frame-gold">
                  {/* Frame corner ornaments */}
                  <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-white/40 rounded-tl-sm" aria-hidden />
                  <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-white/40 rounded-tr-sm" aria-hidden />
                  <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-white/40 rounded-bl-sm" aria-hidden />
                  <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-white/40 rounded-br-sm" aria-hidden />

                  <div className="picture-mat">
                    <div className="frame-paper">

                      <div className="pl-8">
                        {/* Icon */}
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-secondary flex items-center justify-center mb-5 shadow-md">
                          <Star className="w-6 h-6 text-white" />
                        </div>
                        {/* Title */}
                        <h3
                          className="text-2xl font-black text-amber-700 mb-3 leading-tight"
                          style={{ fontFamily: 'var(--font-display)' }}
                        >
                          Our Vision
                        </h3>
                        <div className="h-0.5 w-14 bg-gradient-to-r from-amber-500 to-yellow-300 rounded-full mb-4 opacity-60" />
                        {/* Content */}
                        <p className="text-sm text-gray-700 leading-relaxed">
                          {orgInfo?.vision ||
                            'To be a united and empowered community of scholars, cultivating leaders of excellence, integrity, and compassion who create meaningful impact within the University and beyond.'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Shadow on wall */}
                <div className="absolute inset-0 -z-10 translate-x-2 translate-y-3 bg-black/15 blur-md rounded-sm pointer-events-none" aria-hidden />
              </motion.div>

            </div>
          </div>

          <div className="text-center mt-10">
            <Link to="/about">
              <Button variant="outline" size="lg">
                Learn More About Us
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════ THREE FOUNDING PILLARS ═══════════════ */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            badge="Our Foundation"
            title="Three Founding Pillars"
            subtitle="AUSS is built upon three distinct pillars representing the different scholarship communities within Adamson University."
          />
          {/* items-stretch so all folder bodies grow to the same height */}
          <div className="grid md:grid-cols-3 gap-10 items-stretch">
            {pillars.map((pillar, i) => {
              const Icon = pillar.icon
              return (
                <motion.div
                  key={pillar.abbr}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.15 }}
                  className="folder-blue relative pt-5 flex flex-col"
                >
                  {/* Folder tab — same blue for all */}
                  <div className="folder-tab">
                    <span className="text-[10px] font-bold text-white px-2 leading-none flex items-center h-full">
                      {pillar.abbr}
                    </span>
                  </div>

                  {/* Folder body — flex-1 so it fills the row height */}
                  <div className="folder-body flex flex-col flex-1">
                    {/* Yellow accent stripe at the top of the body */}
                    <div className="absolute top-0 left-0 right-0 h-1 rounded-t-none" style={{ background: 'linear-gradient(90deg, #eab308 0%, #facc15 60%, #eab308 100%)' }} aria-hidden />

                    {/* Header row */}
                    <div className="flex items-center gap-3 mb-3">
                      {/* Icon box: blue bg with yellow ring */}
                      <div className="w-10 h-10 rounded-lg bg-blue-700 flex items-center justify-center shrink-0 shadow-sm">
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        {/* Abbr in blue */}
                        <div className="text-xl font-black leading-none text-blue-700">
                          {pillar.abbr}
                        </div>
                        <p className="text-xs text-gray-500 font-medium leading-snug mt-1">
                          {pillar.name}
                        </p>
                      </div>
                    </div>

                    {/* Inner crease divider — blue-to-yellow gradient */}
                    <div className="h-px mb-3 shadow-sm" style={{ background: 'linear-gradient(90deg, #3b82f6, #eab308)' }} />

                    {/* White paper sheet — flex-1 so it stretches to fill */}
                    <div className="folder-paper flex-1">
                      <ul className="space-y-1.5">
                        {pillar.scholarships.map((s) => (
                          <li key={s} className="flex items-start gap-2 text-xs text-gray-600">
                            <span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 bg-yellow-400" />
                            {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════ FEATURED EVENTS ═══════════════ */}
      <section className="py-24 bg-white relative overflow-hidden">
        {/* Line grid */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.06]"
          style={{
            backgroundImage: `linear-gradient(#0056D2 1px, transparent 1px), linear-gradient(90deg, #0056D2 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
          }}
          aria-hidden
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex items-end justify-between mb-12">
            <div>
              <Badge className="mb-3">What's Happening</Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Upcoming Events</h2>
              <p className="text-gray-500 mt-2 max-w-xl">
                Stay connected with the latest events and activities organized by AUSS.
              </p>
            </div>
            <Link to="/events" className="hidden md:block">
              <Button variant="ghost" size="sm">View All <ArrowRight className="w-4 h-4" /></Button>
            </Link>
          </div>

          {featuredEvents.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">Stay Tuned!</h3>
              <p className="text-gray-400 text-sm max-w-xs mx-auto">
                Exciting events are coming soon. Check back later for upcoming AUSS activities and programs.
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-6">
              {featuredEvents.map((event, i) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="group"
                >
                  <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 h-full flex flex-col">
                    <div className="relative aspect-video overflow-hidden bg-gradient-to-br from-primary/10 to-primary/5">
                      {event.banner_url ? (
                        <img
                          src={event.banner_url}
                          alt={event.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Calendar className="w-12 h-12 text-primary/25" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                      <div className="absolute top-3 left-3 flex gap-2">
                        <Badge className="text-xs bg-primary/90 text-white border-0">{event.category}</Badge>
                        {event.registration_status === 'open' && (
                          <Badge className="text-xs bg-emerald-500/90 text-white border-0">Open</Badge>
                        )}
                      </div>
                    </div>
                    <div className="p-5 flex-1 flex flex-col">
                      <h3 className="font-bold text-gray-900 mb-2 group-hover:text-primary transition-colors line-clamp-2">
                        {event.title}
                      </h3>
                      <div className="flex items-center gap-1 text-gray-500 text-xs mb-4 flex-1">
                        <Calendar className="w-3 h-3 shrink-0" />
                        {new Date(event.date).toLocaleDateString('en-US', {
                          year: 'numeric', month: 'long', day: 'numeric',
                        })}
                      </div>
                      <div className="pt-3 border-t border-gray-100">
                        <Link to="/events">
                          <Button size="sm" variant="outline" className="w-full">
                            View Details <ArrowRight className="w-3 h-3" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}

          <div className="text-center mt-10 md:hidden">
            <Link to="/events">
              <Button variant="outline">View All Events <ArrowRight className="w-4 h-4" /></Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════ ACHIEVEMENTS ═══════════════ */}
      <section className="py-24 bg-white relative overflow-hidden">
        {/* Line grid */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.06]"
          style={{
            backgroundImage: `linear-gradient(#0056D2 1px, transparent 1px), linear-gradient(90deg, #0056D2 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
          }}
          aria-hidden
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex items-end justify-between mb-12">
            <div>
              <Badge className="mb-4">Recognition</Badge>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
                Our Achievements
              </h2>
              <p className="text-lg text-gray-500 max-w-2xl">
                AUSS has been recognized for its outstanding contributions to academic excellence and student leadership.
              </p>
            </div>
            <Link to="/about#achievements" className="hidden md:block shrink-0 mb-1">
              <Button variant="ghost" size="sm">View All <ArrowRight className="w-4 h-4" /></Button>
            </Link>
          </div>

          {achievements.length === 0 ? (
            <p className="text-gray-400 text-center py-12">No achievements added yet.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-12">
              {achievements.slice(0, 8).map((item, i) => {
                const isYellow = i % 2 === 1
                const circleClass  = isYellow ? 'award-circle-yellow' : 'award-circle-blue'
                const ribbonClass  = isYellow ? 'award-ribbon-yellow' : 'award-ribbon-blue'
                const yearColor    = isYellow ? 'text-amber-600'      : 'text-primary'
                const dividerColor = isYellow ? 'bg-amber-400'        : 'bg-blue-500'

                return (
                  <div key={item.id} className="award-badge">
                    {/* Circle medal */}
                    <div className={`award-circle ${circleClass}`}>
                      <Trophy className="w-8 h-8 text-white mb-1 shrink-0" />
                      <span className="text-white text-xs font-bold tracking-widest leading-none">
                        {new Date(item.date).getFullYear()}
                      </span>
                    </div>

                    {/* Ribbon */}
                    <div className={`award-ribbon ${ribbonClass}`}>
                      <div className="award-ribbon-body" />
                    </div>

                    {/* Text below ribbon */}
                    <div className="mt-4 px-2">
                      <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${yearColor}`}>
                        {item.awarded_by}
                      </p>
                      <div className={`h-0.5 w-8 rounded-full mx-auto mb-2 ${dividerColor}`} />
                      <h3 className="text-sm font-bold text-gray-900 leading-snug">
                        {item.title}
                      </h3>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          <div className="text-center mt-10 md:hidden">
            <Link to="/about#achievements">
              <Button variant="outline">View All Achievements <ArrowRight className="w-4 h-4" /></Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════ CTA ═══════════════ */}
      <section className="py-24 relative overflow-hidden">
        {/* Animated gradient background */}
        <div className="absolute inset-0 gradient-accent-animated opacity-[0.08]" aria-hidden />
        {/* Gold glow bottom-right */}
        <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-secondary blur-3xl opacity-10 pointer-events-none" aria-hidden />
        {/* Blue glow top-left */}
        <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full bg-primary blur-3xl opacity-10 pointer-events-none" aria-hidden />
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              Get Involved
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Have something to say?
              <span className="block gradient-text">We'd love to hear from you.</span>
            </h2>
            <p className="text-lg text-gray-500 mb-10 max-w-2xl mx-auto">
              Share your suggestions, feedback, or concerns. AUSS values every voice in our scholar community.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link to="/feedback">
                <Button size="xl" variant="gradient">Submit Feedback <ArrowRight className="w-5 h-5" /></Button>
              </Link>
              <Link to="/contact">
                <Button size="xl" variant="outline">Contact Us</Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

    </div>
  )
}

