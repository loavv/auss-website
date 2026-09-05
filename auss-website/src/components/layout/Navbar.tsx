import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, ShieldCheck } from 'lucide-react'
import { cn } from '@/lib/utils'
import aussLogo from '@/assets/auss-logo.png'

const navLinks = [
  { label: 'Home', href: '/' },
  { label: 'About', href: '/about' },
  { label: 'Events', href: '/events' },
  { label: 'Feedback', href: '/feedback' },
  { label: 'Contact', href: '/contact' },
]

// Only the home page has a dark hero behind the navbar
const DARK_HERO_PAGES = ['/']

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()

  const isHeroPage = DARK_HERO_PAGES.includes(location.pathname)

  // Navbar is "transparent mode" only when on hero page AND not yet scrolled
  const isTransparent = isHeroPage && !scrolled

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    // Re-check on mount in case page loads already scrolled
    setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Reset scroll state when navigating to a new page
  useEffect(() => {
    setMobileOpen(false)
    setScrolled(window.scrollY > 20)
  }, [location.pathname])

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-500',
          isTransparent
            ? 'bg-transparent'
            : 'bg-white/95 backdrop-blur-xl shadow-lg border-b border-gray-100'
        )}
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-18 py-3">

            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 group" aria-label="AUSS Home">
              <div className="w-10 h-10 rounded-full overflow-hidden shrink-0">
                <img src={aussLogo} alt="AUSS Logo" className="w-full h-full object-cover" />
              </div>
              <div className="flex flex-col">
                <span className={cn(
                  'font-bold text-sm leading-none transition-colors duration-300',
                  isTransparent ? 'text-white' : 'text-primary'
                )}>
                  AUSS
                </span>
                <span className={cn(
                  'text-xs leading-none mt-0.5 transition-colors duration-300 hidden sm:block',
                  isTransparent ? 'text-white/70' : 'text-gray-500'
                )}>
                  Adamson University Scholars' Society
                </span>
              </div>
            </Link>

            {/* Desktop Nav Links */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => {
                const isActive = location.pathname === link.href
                return (
                  <Link
                    key={link.href}
                    to={link.href}
                    className={cn(
                      'relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                      isTransparent
                        ? isActive
                          ? 'text-white bg-white/20'
                          : 'text-white/80 hover:text-white hover:bg-white/10'
                        : isActive
                          ? 'text-primary bg-primary/5'
                          : 'text-gray-600 hover:text-primary hover:bg-gray-50'
                    )}
                  >
                    {link.label}
                    {isActive && (
                      <motion.div
                        layoutId="navbar-indicator"
                        className={cn(
                          'absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 w-4 rounded-full',
                          isTransparent ? 'bg-white' : 'bg-primary'
                        )}
                      />
                    )}
                  </Link>
                )
              })}
            </div>

            {/* Admin Portal Button */}
            <div className="hidden md:flex items-center gap-3">
              <Link
                to="/admin/login"
                title="Admin Portal"
                className={cn(
                  'w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200',
                  isTransparent
                    ? 'bg-white/20 backdrop-blur-sm border border-white/30 text-white hover:bg-white/30'
                    : 'bg-primary/10 text-primary hover:bg-primary hover:text-white shadow-sm'
                )}
              >
                <ShieldCheck className="w-5 h-5" />
              </Link>
            </div>

            {/* Mobile Hamburger */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className={cn(
                'md:hidden p-2 rounded-lg transition-colors',
                isTransparent
                  ? 'text-white hover:bg-white/10'
                  : 'text-gray-700 hover:bg-gray-100'
              )}
              aria-label="Toggle mobile menu"
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="fixed top-[72px] left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-b border-gray-100 shadow-xl"
          >
            <div className="max-w-7xl mx-auto px-4 py-4">
              <div className="flex flex-col gap-1">
                {navLinks.map((link, i) => {
                  const isActive = location.pathname === link.href
                  return (
                    <motion.div
                      key={link.href}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <Link
                        to={link.href}
                        className={cn(
                          'flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-colors',
                          isActive
                            ? 'bg-primary/10 text-primary font-semibold'
                            : 'text-gray-700 hover:bg-gray-50 hover:text-primary'
                        )}
                      >
                        {link.label}
                      </Link>
                    </motion.div>
                  )
                })}
                <div className="pt-2 border-t border-gray-100 mt-2">
                  <Link
                    to="/admin/login"
                    title="Admin Portal"
                    className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all duration-200 mx-auto"
                  >
                    <ShieldCheck className="w-5 h-5" />
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile menu backdrop */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-30 md:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>
    </>
  )
}
