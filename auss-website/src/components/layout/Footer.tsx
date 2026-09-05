import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, MapPin, ArrowUp } from 'lucide-react'
import { useOrgInfo } from '@/hooks/useOrgInfo'
import aussLogo from '@/assets/auss-logo.png'

const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4" aria-hidden="true">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
  </svg>
)
const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4" aria-hidden="true">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
  </svg>
)
const TwitterIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4" aria-hidden="true">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
)
const EmailIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4" aria-hidden="true">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
  </svg>
)

const footerLinks = {
  quickLinks: [
    { label: 'Home', href: '/' },
    { label: 'About Us', href: '/about' },
    { label: 'Events', href: '/events' },
    { label: 'Feedback', href: '/feedback' },
    { label: 'Contact', href: '/contact' },
  ],
}

const socialLinks = [
  { icon: FacebookIcon, href: 'https://www.facebook.com/AUSSOfficialPage', label: 'Facebook' },
  { icon: InstagramIcon, href: 'https://www.instagram.com/aussofficial_', label: 'Instagram' },
  { icon: TwitterIcon, href: 'https://www.x.com/asaaduofficial', label: 'Twitter / X' },
  { icon: EmailIcon, href: 'mailto:asaadu@adamson.edu.ph', label: 'Email' },
]

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

export default function Footer() {
  const orgInfo = useOrgInfo()
  return (
    <footer className="bg-navy text-white" role="contentinfo">
      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link to="/" className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full overflow-hidden shrink-0">
                <img src={aussLogo} alt="AUSS Logo" className="w-full h-full object-cover" />
              </div>
              <div>
                <div className="font-bold text-white">AUSS</div>
                <div className="text-xs text-white/50">Adamson University Scholars' Society</div>
              </div>
            </Link>
            <p className="text-white/60 text-sm leading-relaxed mb-6">
              The official organization for scholars at Adamson University, uniting university-funded, corporate, and government scholars under one community.
            </p>
            {/* Social Links */}
            <div className="flex gap-3">
              {socialLinks.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="w-9 h-9 rounded-lg bg-white/10 hover:bg-primary flex items-center justify-center transition-colors duration-200"
                >
                  <Icon />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div className="flex flex-col items-center text-center">
            <h3 className="font-bold text-white mb-4 text-sm uppercase tracking-wider">Quick Links</h3>
            <ul className="space-y-2.5">
              {footerLinks.quickLinks.map(link => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-white/60 hover:text-secondary text-sm transition-colors duration-200 flex items-center gap-2 group"
                  >
                    <span className="w-1 h-1 rounded-full bg-secondary/50 group-hover:bg-secondary transition-colors" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-bold text-white mb-4 text-sm uppercase tracking-wider">Contact Info</h3>
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                  <Mail className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-white/40 text-xs">Email</p>
                  <p className="text-white/80 text-sm">{orgInfo?.email || '—'}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                  <MapPin className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-white/40 text-xs">Address</p>
                  <p className="text-white/80 text-sm">{orgInfo?.address || '—'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-white/10 mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-white/40 text-sm">
            &copy; {new Date().getFullYear()} Adamson University Scholars' Society (AUSS). All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <Link to="/admin/login" className="text-white/40 hover:text-white/60 text-xs transition-colors">
              Admin Portal
            </Link>
            <button
              onClick={scrollToTop}
              className="w-8 h-8 rounded-lg bg-white/10 hover:bg-primary flex items-center justify-center transition-colors duration-200"
              aria-label="Back to top"
            >
              <ArrowUp className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Gold accent line */}
      <motion.div
        className="h-1 w-full"
        style={{ background: 'linear-gradient(90deg, #0056D2, #F4C430, #0056D2)' }}
        animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
      />
    </footer>
  )
}
