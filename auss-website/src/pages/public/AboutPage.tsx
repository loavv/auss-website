import { useRef, useEffect, useState } from 'react'
import { motion, AnimatePresence, useInView } from 'framer-motion'
import { Users, Target, Star, BookOpen, Heart, Shield, Trophy, Globe, X, Tag, Calendar } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'
import { useOrgInfo } from '@/hooks/useOrgInfo'
import type { Officer, Achievement, OfficerCategory } from '@/types'

const coreValues = [
  { icon: BookOpen, title: 'Academic Excellence', desc: 'We strive for excellence in our studies and uphold a culture of continuous learning, growth, and intellectual development.' },
  { icon: Star, title: 'Leadership', desc: 'We develop responsible, capable, and purpose-driven scholars who lead by example and inspire positive change.' },
  { icon: Heart, title: 'Service', desc: 'We use our talents, opportunities, and resources to serve the university, our fellow scholars, and the wider community.' },
  { icon: Shield, title: 'Integrity', desc: 'We uphold honesty, accountability, respect, and ethical conduct in all our actions and responsibilities.' },
  { icon: Trophy, title: 'Scholarship', desc: 'We value the privilege of being scholars by embracing our responsibilities, supporting one another, and contributing meaningfully to the scholar community.' },
  { icon: Users, title: 'Engagement', desc: 'We foster an inclusive and active community where scholars connect, collaborate, participate, and grow together.' },
]

const timeline = [
  { year: '2003', title: 'The Beginning', desc: 'ASA-AdU was established to serve and represent academic scholars at Adamson University.' },
  { year: '2003–2025', title: '22 Years of Service', desc: 'ASA-AdU continued its commitment to supporting and building a strong scholar community.' },
  { year: '2026', title: 'The Birth of AUSS', desc: 'The Executive Council initiated and established the Adamson University Scholars\' Society (AUSS) as the official scholar organization of Adamson University.' },
  { year: 'Today', title: 'Continuing the Legacy', desc: 'AUSS carries forward ASA-AdU\'s legacy by promoting leadership, service, academic excellence, and scholar engagement.' },
]

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

function SectionRef({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6 }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export default function AboutPage() {
  const [officers, setOfficers] = useState<Officer[]>([])
  const [officerCategories, setOfficerCategories] = useState<OfficerCategory[]>([])
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null)
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null)
  const [selectedOfficer, setSelectedOfficer] = useState<Officer | null>(null)
  const orgInfo = useOrgInfo()

  // Scroll to a hash anchor after the page mounts (e.g. /about#achievements)
  useEffect(() => {
    const hash = window.location.hash
    if (!hash) return
    // Retry a few times to account for lazy-loaded content shifting layout
    let attempts = 0
    const tryScroll = () => {
      const el = document.querySelector(hash)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      } else if (attempts < 5) {
        attempts++
        setTimeout(tryScroll, 150)
      }
    }
    setTimeout(tryScroll, 100)
  }, [])

  const yearsActive = orgInfo?.established_year
    ? new Date().getFullYear() - orgInfo.established_year
    : null

  useEffect(() => {
    async function fetchAll() {
      const [offRes, achRes, catRes] = await Promise.all([
        supabase
          .from('officers')
          .select('*')
          .eq('is_active', true)
          .order('order', { ascending: true }),
        supabase
          .from('achievements')
          .select('*')
          .order('date', { ascending: false }),
        supabase
          .from('officer_categories')
          .select('*')
          .eq('is_active', true)
          .order('order', { ascending: true }),
      ])
      setOfficers(offRes.data || [])
      setAchievements(achRes.data || [])
      const cats = catRes.data || []
      setOfficerCategories(cats)
      // Default to first category if any exist
      if (cats.length > 0) setActiveCategoryId(cats[0].id)
    }
    fetchAll()
  }, [])

  return (
    <div className="pt-20">
      {/* ── Page Hero ── */}
      <section className="relative py-24 overflow-hidden" style={{ background: 'linear-gradient(135deg, #0A1628 0%, #0056D2 100%)' }}>
        <div className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `radial-gradient(circle, #ffffff 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
          }}
        />
        <div className="relative max-w-4xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <Badge className="mb-4 bg-white/20 text-white border-white/30">About AUSS</Badge>
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
              Our Story &amp;
              <span className="block" style={{ color: '#F4C430' }}>Our Identity</span>
            </h1>
            <p className="text-lg text-white/70 max-w-2xl mx-auto leading-relaxed">
              {orgInfo?.description ||
                "Get to know the Adamson University Scholars' Society (AUSS) — who we are, what we stand for, and the people who make it all possible."}
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── History ── */}
      <section id="history" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <SectionRef>
              <Badge className="mb-4">Our History</Badge>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                {yearsActive !== null
                  ? `${yearsActive} Year${yearsActive !== 1 ? 's' : ''} of Empowering Scholars`
                  : 'Years of Empowering Scholars'}
              </h2>
              <div className="space-y-4 text-gray-600 leading-relaxed">
                <p>
                  {orgInfo?.history ||
                    "Adamson University Scholars' Society (AUSS) is the official scholar organization of Adamson University, representing eligible scholars under the Office for Student Assistance and Scholarships (OSAS), including University-Funded, Corporate, and Government Scholars."}
                </p>
                <p>
                  Established in 2003 as the Academic Scholars Alliance of Adamson University (ASA-AdU), the organization has continued to uphold its commitment to fostering a strong and engaged scholar community. Today, as the Adamson University Scholars' Society (AUSS), it carries forward this legacy by promoting leadership, service, academic excellence, and meaningful student engagement, while providing scholars with opportunities to connect, collaborate, and contribute to the university community.
                </p>
                <p>
                  AUSS welcomes scholars under scholarship programs recognized by OSAS, with membership coverage subject to the scholarship programs offered and recognized by the office each semester.
                </p>
              </div>
            </SectionRef>
            {/* Timeline */}
            <SectionRef>
              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-px bg-gradient-to-b from-primary to-secondary" />
                <div className="space-y-8">
                  {timeline.map((item, i) => {
                    const isToday = item.year === 'Today'
                    const isSpan  = item.year.includes('–')
                    const dotBg   = isToday ? 'bg-secondary' : isSpan ? 'bg-blue-400' : 'bg-primary'
                    return (
                      <motion.div
                        key={item.year}
                        initial={{ opacity: 0, x: 30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.1 }}
                        className="relative pl-12"
                      >
                        <div className={`absolute left-0 w-8 h-8 rounded-full ${dotBg} text-white text-xs font-bold flex items-center justify-center shadow-lg ${isToday ? 'ring-4 ring-secondary/30' : ''}`}>
                          {isToday ? '★' : i + 1}
                        </div>
                        <div className={`rounded-xl p-4 ${isToday ? 'bg-secondary/10 border border-secondary/30' : 'bg-gray-50'}`}>
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isToday ? 'text-amber-700 bg-amber-100' : isSpan ? 'text-blue-700 bg-blue-100' : 'text-primary bg-primary/10'}`}>
                              {item.year}
                            </span>
                            <h4 className="font-bold text-gray-900 text-sm">{item.title}</h4>
                          </div>
                          <p className="text-xs text-gray-500">{item.desc}</p>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              </div>
            </SectionRef>
          </div>
        </div>
      </section>

      {/* ── Mission & Vision ── */}
      <section id="mission" className="py-24 bg-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <Badge className="mb-4">Our Purpose</Badge>
            <h2 className="text-4xl font-bold text-gray-900">Mission &amp; Vision</h2>
            <p className="text-gray-500 mt-3 max-w-xl mx-auto">
              Guided by a clear mission and vision, AUSS strives to be the leading academic organization for scholars at Adamson University.
            </p>
          </div>

          {/* Wall surface */}
          <div className="wall-surface px-8 py-16 md:px-16">
            <div className="grid md:grid-cols-2 gap-16 md:gap-24">

              {/* ── Mission — blue frame ── */}
              <div className="relative mt-6" style={{ transform: 'rotate(-1.5deg)' }}>
                <div className="frame-nail" aria-hidden />
                <div className="frame-wire" aria-hidden />
                <div className="picture-frame picture-frame-blue">
                  <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-white/40 rounded-tl-sm" aria-hidden />
                  <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-white/40 rounded-tr-sm" aria-hidden />
                  <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-white/40 rounded-bl-sm" aria-hidden />
                  <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-white/40 rounded-br-sm" aria-hidden />
                  <div className="picture-mat">
                    <div className="frame-paper">
                      <div className="pl-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-primary flex items-center justify-center mb-5 shadow-md">
                          <Target className="w-6 h-6 text-white" />
                        </div>
                        <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Mission</div>
                        <h3 className="text-2xl font-black text-primary mb-3 leading-tight" style={{ fontFamily: 'var(--font-display)' }}>
                          What We Do
                        </h3>
                        <div className="h-0.5 w-14 bg-gradient-to-r from-primary to-blue-300 rounded-full mb-4 opacity-60" />
                        <p className="text-sm text-gray-700 leading-relaxed">
                          {orgInfo?.mission || 'We are committed to empowering our scholars by promoting academic excellence, leadership, holistic development, and scholar welfare. Guided by the Vincentian values of excellence, accountability, and service, we aspire to develop individuals who use their knowledge and talents to create a positive impact within the University and beyond.'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="absolute inset-0 -z-10 translate-x-2 translate-y-3 bg-black/15 blur-md rounded-sm pointer-events-none" aria-hidden />
              </div>

              {/* ── Vision — gold frame ── */}
              <div className="relative mt-6" style={{ transform: 'rotate(1.5deg)' }}>
                <div className="frame-nail" aria-hidden />
                <div className="frame-wire" aria-hidden />
                <div className="picture-frame picture-frame-gold">
                  <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-white/40 rounded-tl-sm" aria-hidden />
                  <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-white/40 rounded-tr-sm" aria-hidden />
                  <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-white/40 rounded-bl-sm" aria-hidden />
                  <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-white/40 rounded-br-sm" aria-hidden />
                  <div className="picture-mat">
                    <div className="frame-paper">
                      <div className="pl-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-secondary flex items-center justify-center mb-5 shadow-md">
                          <Star className="w-6 h-6 text-white" />
                        </div>
                        <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Vision</div>
                        <h3 className="text-2xl font-black text-amber-700 mb-3 leading-tight" style={{ fontFamily: 'var(--font-display)' }}>
                          Where We're Headed
                        </h3>
                        <div className="h-0.5 w-14 bg-gradient-to-r from-amber-500 to-yellow-300 rounded-full mb-4 opacity-60" />
                        <p className="text-sm text-gray-700 leading-relaxed">
                          {orgInfo?.vision || 'To be a united and empowered community of scholars, cultivating leaders of excellence, integrity, and compassion who create meaningful impact within the University and beyond.'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="absolute inset-0 -z-10 translate-x-2 translate-y-3 bg-black/15 blur-md rounded-sm pointer-events-none" aria-hidden />
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* ── Core Values ── */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <Badge className="mb-4">What Guides Us</Badge>
            <h2 className="text-4xl font-bold text-gray-900">Core Values</h2>
            <p className="text-gray-500 mt-3 max-w-xl mx-auto">
              These principles define who we are and guide every action we take as an organization.
            </p>
          </div>
          {/* items-stretch so all ruled-paper cards grow to the same height */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch">
            {coreValues.map((value, i) => {
              const Icon = value.icon
              const isYellow = i % 2 === 1
              const iconGradient  = isYellow ? 'from-amber-400 to-secondary' : 'from-primary to-blue-400'
              const accentColor   = isYellow ? 'bg-yellow-400'               : 'bg-blue-400'
              const bulletColor   = isYellow ? 'bg-yellow-400'               : 'bg-blue-400'
              const tabColor      = isYellow ? 'bg-yellow-500'               : 'bg-blue-700'

              return (
                <div key={value.title} className={`notebook-card flex flex-col ${isYellow ? 'pinned-note-yellow' : ''}`}>
                  {/* Coloured tab strip at top */}
                  <div className={`${tabColor} h-2 rounded-t-[3px]`} aria-hidden />

                  {/* Content to the right of the binding strip */}
                  <div className="relative z-10 pl-[72px] pr-6 pt-5 pb-6 flex flex-col flex-1">
                    {/* Icon */}
                    <div className={`w-11 h-11 rounded-lg bg-gradient-to-br ${iconGradient} flex items-center justify-center mb-4 shadow-md shrink-0`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>

                    {/* Title */}
                    <h4 className="font-black text-gray-800 mb-2 leading-tight" style={{ fontFamily: 'var(--font-display)' }}>
                      {value.title}
                    </h4>

                    {/* Yellow/blue pencil underline */}
                    <div className={`h-0.5 w-10 rounded-full ${accentColor} opacity-60 mb-3`} />

                    {/* Description — flex-1 so cards stretch equally */}
                    <p className="text-xs text-gray-600 leading-relaxed flex-1">
                      {value.desc}
                    </p>

                    {/* Bullet dot at bottom-right as a decorative touch */}
                    <div className={`w-2 h-2 rounded-full ${bulletColor} mt-4 ml-auto opacity-40`} aria-hidden />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── Achievements ── */}
      <section id="achievements" className="py-24 relative overflow-hidden bg-white">
        {/* Line grid */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.06]"
          style={{
            backgroundImage: `linear-gradient(#0056D2 1px, transparent 1px), linear-gradient(90deg, #0056D2 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
          }}
          aria-hidden
        />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <Badge className="mb-4">Recognition</Badge>
            <h2 className="text-4xl font-bold text-gray-900">Our Achievements</h2>
            <p className="text-gray-500 mt-3 max-w-xl mx-auto">
              Awards and recognition that reflect our commitment to excellence.
            </p>
          </div>

          {achievements.length === 0 ? (
            <p className="text-gray-400 text-center py-12">No achievements added yet.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-14">
              {achievements.map((item, i) => {
                const isYellow    = i % 2 === 1
                const circleClass = isYellow ? 'award-circle-yellow' : 'award-circle-blue'
                const ribbonClass = isYellow ? 'award-ribbon-yellow' : 'award-ribbon-blue'
                const yearColor   = isYellow ? 'text-amber-600'  : 'text-primary'
                const dividerBg   = isYellow ? 'bg-yellow-400'   : 'bg-blue-400'

                return (
                  <div key={item.id} className="award-badge">
                    <div className={`award-circle ${circleClass}`}>
                      <Trophy className="w-8 h-8 text-white mb-1 shrink-0" />
                      <span className="text-white text-xs font-bold tracking-widest leading-none">
                        {new Date(item.date).getFullYear()}
                      </span>
                    </div>
                    <div className={`award-ribbon ${ribbonClass}`}>
                      <div className="award-ribbon-body" />
                    </div>
                    <div className="mt-4 px-2 w-full">
                      <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${yearColor}`}>
                        {item.awarded_by}
                      </p>
                      <div className={`h-0.5 w-8 rounded-full mx-auto mb-2 ${dividerBg}`} />
                      <h3 className="text-sm font-bold text-gray-900 leading-snug mb-3">
                        {item.title}
                      </h3>
                      <button
                        onClick={() => setSelectedAchievement(item)}
                        className="text-xs font-semibold underline underline-offset-2 transition-colors text-gray-400 hover:text-primary"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {/* ── Officers ── */}
      <section id="officers" className="py-24">
        {/* Wall surface */}
        <div className="wall-surface mx-2 md:mx-4 lg:mx-8 py-16 px-4 md:px-8">
          <div className="text-center mb-10">
            <Badge className="mb-4">Leadership</Badge>
            <h2 className="text-4xl font-bold text-gray-800">Meet Our Officers</h2>
            <p className="text-gray-500 mt-3 max-w-xl mx-auto">
              The dedicated individuals leading AUSS for Academic Year 2025–2026.
            </p>
          </div>

          {/* Category tab pills */}
          {officerCategories.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2 mb-12">
              {officerCategories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategoryId(cat.id)}
                  className={`px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                    activeCategoryId === cat.id
                      ? 'bg-primary text-white shadow-md shadow-primary/30'
                      : 'bg-white/80 text-gray-600 border border-gray-200 hover:border-primary hover:text-primary'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          )}

          {/* Officers display */}
          {(() => {
            const visibleOfficers = officerCategories.length > 0
              ? officers.filter(o => o.category_id === activeCategoryId)
              : officers

            const activeCategory = officerCategories.find(c => c.id === activeCategoryId)

            if (visibleOfficers.length === 0) {
              return <p className="text-gray-400 text-center py-12">No officers in this category yet.</p>
            }

            // Group by hierarchy_row
            const rowMap = new Map<number, typeof visibleOfficers>()
            visibleOfficers.forEach(o => {
              const row = o.hierarchy_row ?? 1
              if (!rowMap.has(row)) rowMap.set(row, [])
              rowMap.get(row)!.push(o)
            })
            const sortedRows = Array.from(rowMap.entries()).sort(([a], [b]) => a - b)

            return (
              <div className="space-y-10">
                {activeCategory?.description && (
                  <p className="text-center text-sm text-gray-500 -mt-4 mb-2">{activeCategory.description}</p>
                )}
                {sortedRows.map(([rowNum, rowOfficers], rowIdx) => {
                  // Split officers into chunks of max 3 per visual row
                  const chunks: (typeof rowOfficers)[] = []
                  for (let i = 0; i < rowOfficers.length; i += 3) {
                    chunks.push(rowOfficers.slice(i, i + 3))
                  }
                  return (
                  <div key={rowNum}>
                    {chunks.map((chunk, chunkIdx) => (
                    <div key={chunkIdx} className={`flex flex-wrap justify-center gap-x-6 gap-y-8 ${chunkIdx > 0 ? 'mt-8' : ''}`}>
                      {chunk.map((officer, i) => {
                        const tilts = [-1.5, 1, -0.8, 1.5, -1.2, 0.8, -1, 1.2]
                        const tilt  = tilts[i % tilts.length]
                        return (
                          <div
                            key={officer.id}
                            className="flex flex-col items-center cursor-pointer"
                            style={{ transform: `rotate(${tilt}deg)`, width: '150px', flexShrink: 0 }}
                            onClick={() => setSelectedOfficer(officer)}
                          >
                            <div className="w-full relative mt-6">
                              <div className="officer-nail" aria-hidden />
                              <div className="officer-wire" aria-hidden />
                              <div className="officer-frame">
                                <div className="officer-mat">
                                  {officer.avatar_url ? (
                                    <img
                                      src={officer.avatar_url}
                                      alt={officer.full_name}
                                      className="officer-photo"
                                      loading="lazy"
                                    />
                                  ) : (
                                    <div
                                      className="officer-photo flex items-center justify-center text-white font-bold text-3xl"
                                      style={{ background: 'linear-gradient(135deg, #0056D2 0%, #003A8C 100%)' }}
                                    >
                                      {getInitials(officer.full_name)}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="absolute inset-0 -z-10 translate-x-1.5 translate-y-2 bg-black/20 blur-md rounded-sm pointer-events-none" aria-hidden />
                            </div>
                            <div className="w-full mt-2 text-center officer-nametag">
                              <p className="text-xs font-black text-gray-800 leading-tight mt-1" style={{ fontFamily: 'var(--font-display)' }}>
                                {officer.full_name}
                              </p>
                              <p className="text-[10px] font-semibold text-primary mt-1 leading-tight">
                                {officer.position}
                              </p>
                              {officer.department && (
                                <p className="text-[10px] text-gray-400 mt-0.5 leading-tight">{officer.department}</p>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                    ))}
                    {rowIdx < sortedRows.length - 1 && (
                      <div className="mt-10 border-t border-dashed border-gray-300/60" aria-hidden />
                    )}
                  </div>
                  )
                })}
              </div>
            )
          })()}
        </div>
      </section>

      {/* Officer Modal */}
      <AnimatePresence>
        {selectedOfficer && (
          <OfficerModal officer={selectedOfficer} onClose={() => setSelectedOfficer(null)} />
        )}
      </AnimatePresence>

      {/* Achievement Detail Modal */}
      <AnimatePresence>
        {selectedAchievement && (
          <AchievementModal achievement={selectedAchievement} onClose={() => setSelectedAchievement(null)} />
        )}
      </AnimatePresence>
    </div>
  )
}

function OfficerModal({ officer, onClose }: { officer: Officer; onClose: () => void }) {
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
        className="relative bg-white rounded-2xl overflow-hidden max-w-sm w-full shadow-2xl"
      >
        {/* Large photo */}
        <div className="relative w-full aspect-square bg-gradient-to-br from-primary/20 to-primary/5">
          {officer.avatar_url ? (
            <img
              src={officer.avatar_url}
              alt={officer.full_name}
              className="w-full h-full object-cover object-top"
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center text-white text-6xl font-bold"
              style={{ background: 'linear-gradient(135deg, #0056D2 0%, #003A8C 100%)' }}
            >
              {getInitials(officer.full_name)}
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
          {/* Name overlay at bottom of photo */}
          <div className="absolute bottom-4 left-4 right-14">
            <p className="text-white font-bold text-xl leading-tight">{officer.full_name}</p>
            <p className="text-secondary text-sm font-semibold mt-0.5">{officer.position}</p>
          </div>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Details */}
        <div className="p-5 space-y-3">
          {officer.department && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="font-medium text-gray-700">Department:</span>
              {officer.department}
            </div>
          )}
          {officer.course && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="font-medium text-gray-700">Course:</span>
              {officer.course}
            </div>
          )}
          {officer.year_level && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="font-medium text-gray-700">Year Level:</span>
              {officer.year_level}
            </div>
          )}
          {officer.email && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="font-medium text-gray-700">Email:</span>
              <a href={`mailto:${officer.email}`} className="text-primary hover:underline truncate">
                {officer.email}
              </a>
            </div>
          )}
          {officer.bio && (
            <p className="text-sm text-gray-500 leading-relaxed pt-1 border-t border-gray-100">
              {officer.bio}
            </p>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

function AchievementModal({ achievement, onClose }: { achievement: Achievement; onClose: () => void }) {
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
        {/* Full-width banner image */}
        <div className="relative aspect-video bg-gradient-to-br from-primary/20 to-primary/5">
          {achievement.image_url ? (
            <img src={achievement.image_url} alt={achievement.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0A1628 0%, #0056D2 100%)' }}>
              <Trophy className="w-20 h-20 text-secondary/60" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
          <div className="absolute bottom-4 left-4">
            <span className="px-3 py-1 rounded-lg bg-secondary/90 text-navy text-xs font-semibold">
              {new Date(achievement.date).getFullYear()}
            </span>
          </div>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">{achievement.title}</h2>

          <div className="grid grid-cols-2 gap-4 mb-5">
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
              <Calendar className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <p className="text-xs text-gray-400">Date</p>
                <p className="text-sm font-semibold text-gray-900">
                  {new Date(achievement.date).toLocaleDateString('en-US', {
                    year: 'numeric', month: 'long', day: 'numeric',
                  })}
                </p>
              </div>
            </div>
            {achievement.category && (
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                <Tag className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <p className="text-xs text-gray-400">Category</p>
                  <p className="text-sm font-semibold text-gray-900">{achievement.category}</p>
                </div>
              </div>
            )}
          </div>

          {achievement.awarded_by && (
            <div className="mb-4 text-sm text-gray-500">
              <span className="font-medium text-gray-700">Awarded by:</span> {achievement.awarded_by}
            </div>
          )}

          {achievement.description && (
            <p className="text-gray-600 leading-relaxed">{achievement.description}</p>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}
