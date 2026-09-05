import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Mail, MapPin, Send } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'
import { useOrgInfo } from '@/hooks/useOrgInfo'
import { useState } from 'react'

const inquirySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  subject: z.string().min(5, 'Subject must be at least 5 characters'),
  message: z.string().min(20, 'Message must be at least 20 characters').max(1000),
})

type InquiryForm = z.infer<typeof inquirySchema>

const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5" aria-hidden="true">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
  </svg>
)
const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5" aria-hidden="true">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
  </svg>
)
const TwitterIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5" aria-hidden="true">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
)
const EmailIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5" aria-hidden="true">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
  </svg>
)

const socialLinks = [
  { icon: FacebookIcon, label: 'Facebook', href: 'https://www.facebook.com/AUSSOfficialPage', color: 'hover:bg-[#1877F2]' },
  { icon: InstagramIcon, label: 'Instagram', href: 'https://www.instagram.com/aussofficial_', color: 'hover:bg-[#E4405F]' },
  { icon: TwitterIcon, label: 'Twitter / X', href: 'https://www.x.com/asaaduofficial', color: 'hover:bg-[#1DA1F2]' },
  { icon: EmailIcon, label: 'Email', href: 'mailto:asaadu@adamson.edu.ph', color: 'hover:bg-[#EA4335]' },
]

export default function ContactPage() {
  const [loading, setLoading] = useState(false)
  const orgInfo = useOrgInfo()

  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm<InquiryForm>({
    resolver: zodResolver(inquirySchema),
  })

  const onSubmit = async (data: InquiryForm) => {
    setLoading(true)
    try {
      const { error } = await supabase.from('inquiries').insert({ ...data, status: 'unread' })
      if (error) throw error
      toast.success('Inquiry sent successfully! We\'ll get back to you soon.')
      reset()
    } catch {
      toast.error('Failed to send inquiry. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Build contact info from live org data, fall back to placeholder while loading
  const contactItems = [
    {
      icon: Mail,
      label: 'Email',
      value: orgInfo?.email || '—',
      href: orgInfo?.email ? `mailto:${orgInfo.email}` : null,
      color: 'bg-blue-500',
    },
    {
      icon: MapPin,
      label: 'Address',
      value: orgInfo?.address || '—',
      href: orgInfo?.address
        ? `https://maps.google.com/?q=${encodeURIComponent(orgInfo.address)}`
        : null,
      color: 'bg-red-500',
    },
  ]

  const mapSrc = orgInfo?.map_embed_url
    ? orgInfo.map_embed_url
    : 'https://maps.google.com/maps?q=Adamson+University,+900+San+Marcelino+St,+Ermita,+Manila,+Philippines&t=&z=17&ie=UTF8&iwloc=&output=embed'

  return (
    <div className="pt-20">
      {/* Hero */}
      <section className="relative py-24 overflow-hidden" style={{ background: 'linear-gradient(135deg, #0A1628 0%, #0056D2 100%)' }}>
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: `radial-gradient(circle, #fff 1px, transparent 1px)`, backgroundSize: '40px 40px' }}
        />
        <div className="relative max-w-4xl mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
            <Badge className="mb-4 bg-white/20 text-white border-white/30">Get in Touch</Badge>
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
              Contact
              <span className="block" style={{ color: '#F4C430' }}>AUSS</span>
            </h1>
            <p className="text-white/70 text-lg max-w-xl mx-auto">
              Reach out to us with any questions, concerns, or inquiries. We're here to help.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact Info */}
            <div>
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                <h2 className="text-3xl font-bold text-gray-900 mb-2">We'd Love to Hear From You</h2>
                <p className="text-gray-500 mb-8">
                  Whether you have a question about events, membership, or anything else, our team is ready to answer.
                </p>

                {/* Contact details */}
                <div className="space-y-4 mb-8">
                  {contactItems.map((item) => {
                    const Icon = item.icon
                    const content = (
                      <div key={item.label} className="flex items-start gap-4 p-4 bg-white rounded-xl border border-gray-100 hover:shadow-md transition-shadow">
                        <div className={`w-10 h-10 ${item.color} rounded-xl flex items-center justify-center shrink-0`}>
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">{item.label}</p>
                          <p className="text-gray-800 text-sm font-medium">{item.value}</p>
                        </div>
                      </div>
                    )
                    return item.href ? (
                      <a key={item.label} href={item.href} target="_blank" rel="noopener noreferrer">
                        {content}
                      </a>
                    ) : (
                      <div key={item.label}>{content}</div>
                    )
                  })}
                </div>

                {/* Social Media */}
                <div>
                  <h3 className="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wider">Follow Us</h3>
                  <div className="flex gap-3">
                    {socialLinks.map(({ icon: Icon, label, href, color }) => (
                      <a
                        key={label}
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={label}
                        className={`w-11 h-11 rounded-xl bg-gray-100 flex items-center justify-center text-gray-600 hover:text-white transition-all duration-200 ${color}`}
                      >
                        <Icon />
                      </a>
                    ))}
                  </div>
                </div>

                {/* Map */}
                <div className="mt-8 rounded-2xl overflow-hidden h-56 bg-gray-200 relative">
                  <iframe
                    title="Adamson University Location Map"
                    src={mapSrc}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    className="absolute inset-0 w-full h-full"
                  />
                </div>
              </motion.div>
            </div>

            {/* Inquiry Form */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="p-8 shadow-lg">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Mail className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Send an Inquiry</h2>
                    <p className="text-sm text-gray-500">We'll respond within 1-2 business days</p>
                  </div>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                  <div className="grid md:grid-cols-2 gap-4">
                    <Input
                      label="Full Name"
                      placeholder="Juan dela Cruz"
                      {...register('name')}
                      error={errors.name?.message}
                    />
                    <Input
                      label="Email Address"
                      type="email"
                      placeholder="juan@email.com"
                      {...register('email')}
                      error={errors.email?.message}
                    />
                  </div>

                  <Input
                    label="Subject"
                    placeholder="What is your inquiry about?"
                    {...register('subject')}
                    error={errors.subject?.message}
                  />

                  <Textarea
                    label="Message"
                    placeholder="Write your message here..."
                    rows={5}
                    maxLength={1000}
                    {...register('message')}
                    error={errors.message?.message}
                    value={watch('message') || ''}
                  />

                  <Button type="submit" size="lg" className="w-full" loading={loading}>
                    <Send className="w-4 h-4" />
                    Send Inquiry
                  </Button>
                </form>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  )
}
