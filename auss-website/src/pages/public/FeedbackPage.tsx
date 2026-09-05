import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { MessageSquare, Send, EyeOff, Star } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { supabase } from '@/lib/supabase'

// ── Schema ────────────────────────────────────────────────────
// Personal fields are optional strings at field level.
// The refine() enforces them only when is_anonymous is false.
const feedbackSchema = z.object({
  name: z.string().optional(),
  email: z.string().optional(),
  course: z.string().optional(),
  year_level: z.string().optional(),
  student_number: z.string().optional(),
  category: z.string().optional(),
  rating: z.number().min(1).max(5).optional(),
  message: z.string().min(10, 'Message must be at least 10 characters').max(2000),
  is_anonymous: z.boolean(),
}).superRefine((data, ctx) => {
  if (!data.is_anonymous) {
    if (!data.name || data.name.trim().length < 2) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Full name is required', path: ['name'] })
    }
    if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Valid email is required', path: ['email'] })
    }
    if (!data.course) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Please select a course', path: ['course'] })
    }
    if (!data.year_level) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Please select a year level', path: ['year_level'] })
    }
    if (!data.student_number || data.student_number.trim().length < 1) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Student number is required', path: ['student_number'] })
    }
  }

  // Category is always required
  if (!data.category) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Please select a category', path: ['category'] })
  }
})

type FeedbackForm = z.infer<typeof feedbackSchema>

const categories = [
  'Suggestion',
  'Complaint',
  'Appreciation',
  'Program Feedback',
  'Officer Feedback',
  'Website Feedback',
  'Other',
]

const courses = [
  'BS Computer Engineering',
  'BS Computer Science',
  'BS Information Technology',
  'BS Business Administration',
  'BS Nursing',
  'BS Pharmacy',
  'BS Architecture',
  'BS Civil Engineering',
  'BS Electrical Engineering',
  'Other',
]

const yearLevels = ['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year', 'Graduate']

const MAX_LENGTH = 2000

export default function FeedbackPage() {
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [])
  const [loading, setLoading] = useState(false)
  const [messageLength, setMessageLength] = useState(0)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FeedbackForm>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: {
      is_anonymous: false,
      name: '',
      email: '',
      course: '',
      year_level: '',
      student_number: '',
      category: '',
      message: '',
    },
  })

  const isAnonymous = watch('is_anonymous') ?? false

  const onSubmit = async (data: FeedbackForm) => {
    setLoading(true)
    try {
      const { error } = await supabase.from('feedback').insert({
        name: data.is_anonymous ? null : (data.name?.trim() || null),
        email: data.is_anonymous ? null : (data.email?.trim() || null),
        course: data.is_anonymous ? null : (data.course || null),
        year_level: data.is_anonymous ? null : (data.year_level || null),
        student_number: data.is_anonymous ? null : (data.student_number?.trim() || null),
        category: data.category,
        rating: rating || null,
        message: data.message,
        is_anonymous: data.is_anonymous,
        status: 'unread',
      })

      if (error) {
        console.error('Feedback insert error:', error)
        throw error
      }

      toast.success('Feedback submitted! Thank you for your input.')
      reset({
        is_anonymous: false,
        name: '',
        email: '',
        course: '',
        year_level: '',
        student_number: '',
        category: '',
        message: '',
      })
      setRating(0)
      setMessageLength(0)
    } catch (err: any) {
      toast.error(err?.message || 'Failed to submit feedback. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="pt-20">
      {/* Hero */}
      <section
        className="relative py-24 overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0A1628 0%, #0056D2 100%)' }}
      >
        <div
          className="absolute inset-0 opacity-10"
          style={{ backgroundImage: `radial-gradient(circle, #fff 1px, transparent 1px)`, backgroundSize: '40px 40px' }}
        />
        <div className="relative max-w-4xl mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
            <Badge className="mb-4 bg-white/20 text-white border-white/30">Your Voice Matters</Badge>
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
              Share Your
              <span className="block" style={{ color: '#F4C430' }}>Feedback</span>
            </h1>
            <p className="text-white/70 text-lg max-w-xl mx-auto">
              Help us improve by sharing your thoughts, suggestions, and concerns. Every feedback counts.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-16 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="p-8 shadow-lg">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Student Feedback Form</h2>
                  <p className="text-sm text-gray-500">
                    Personal fields are required unless you submit anonymously
                  </p>
                </div>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>

                {/* ── Anonymous Toggle ── */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 border border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gray-200 flex items-center justify-center">
                      <EyeOff className="w-5 h-5 text-gray-500" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">Submit Anonymously</p>
                      <p className="text-xs text-gray-500">Your personal information will not be recorded</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={isAnonymous}
                    onClick={() => setValue('is_anonymous', !isAnonymous, { shouldValidate: true })}
                    className={`relative flex-shrink-0 w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/30 ${
                      isAnonymous ? 'bg-primary' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${
                        isAnonymous ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* ── Personal Info ── */}
                {!isAnonymous && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="grid md:grid-cols-2 gap-4"
                  >
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1.5">
                        Full Name <span className="text-red-500">*</span>
                      </label>
                      <Input
                        id="name"
                        placeholder="Juan dela Cruz"
                        {...register('name')}
                        error={errors.name?.message}
                      />
                    </div>

                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                        Email Address <span className="text-red-500">*</span>
                      </label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="juan@adamson.edu.ph"
                        {...register('email')}
                        error={errors.email?.message}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Course / Program <span className="text-red-500">*</span>
                      </label>
                      <Select onValueChange={v => setValue('course', v, { shouldValidate: true })}>
                        <SelectTrigger className={errors.course ? 'border-red-400' : ''}>
                          <SelectValue placeholder="Select course" />
                        </SelectTrigger>
                        <SelectContent>
                          {courses.map(c => (
                            <SelectItem key={c} value={c}>{c}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.course && (
                        <p className="mt-1.5 text-xs text-red-500">{errors.course.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Year Level <span className="text-red-500">*</span>
                      </label>
                      <Select onValueChange={v => setValue('year_level', v, { shouldValidate: true })}>
                        <SelectTrigger className={errors.year_level ? 'border-red-400' : ''}>
                          <SelectValue placeholder="Select year" />
                        </SelectTrigger>
                        <SelectContent>
                          {yearLevels.map(y => (
                            <SelectItem key={y} value={y}>{y}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.year_level && (
                        <p className="mt-1.5 text-xs text-red-500">{errors.year_level.message}</p>
                      )}
                    </div>

                    <div className="md:col-span-1">
                      <label htmlFor="student_number" className="block text-sm font-medium text-gray-700 mb-1.5">
                        Student Number <span className="text-red-500">*</span>
                      </label>
                      <Input
                        id="student_number"
                        placeholder="2020XXXXX"
                        {...register('student_number')}
                        error={errors.student_number?.message}
                      />
                    </div>
                  </motion.div>
                )}

                {/* ── Category ── */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <Select onValueChange={v => setValue('category', v, { shouldValidate: true })}>
                    <SelectTrigger className={errors.category ? 'border-red-400' : ''}>
                      <SelectValue placeholder="Select feedback category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.category && (
                    <p className="mt-1.5 text-xs text-red-500">{errors.category.message}</p>
                  )}
                </div>

                {/* ── Star Rating ── */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Overall Rating <span className="text-gray-400 font-normal">(Optional)</span>
                  </label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => { setRating(star); setValue('rating', star) }}
                        onMouseEnter={() => setHoveredRating(star)}
                        onMouseLeave={() => setHoveredRating(0)}
                        className="focus:outline-none"
                        aria-label={`Rate ${star} stars`}
                      >
                        <Star
                          className={`w-8 h-8 transition-colors ${
                            star <= (hoveredRating || rating)
                              ? 'text-secondary fill-secondary'
                              : 'text-gray-300'
                          }`}
                        />
                      </button>
                    ))}
                    {rating > 0 && (
                      <button
                        type="button"
                        onClick={() => { setRating(0); setValue('rating', undefined) }}
                        className="text-xs text-gray-400 hover:text-gray-600 ml-2 underline underline-offset-2"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>

                {/* ── Message with live character counter ── */}
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Message <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <textarea
                      id="message"
                      rows={6}
                      maxLength={MAX_LENGTH}
                      placeholder="Share your thoughts, suggestions, or concerns in detail..."
                      className={`flex w-full rounded-xl border bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400
                        transition-all duration-200 resize-none
                        focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary
                        hover:border-gray-300
                        ${errors.message ? 'border-red-400 focus:ring-red-400/30 focus:border-red-400' : 'border-gray-200'}`}
                      {...register('message', {
                        onChange: e => setMessageLength(e.target.value.length),
                      })}
                    />
                  </div>
                  <div className="flex items-center justify-between mt-1.5">
                    <div>
                      {errors.message ? (
                        <p className="text-xs text-red-500 flex items-center gap-1">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          {errors.message.message}
                        </p>
                      ) : messageLength > 0 && messageLength < 10 ? (
                        <p className="text-xs text-amber-500">
                          {10 - messageLength} more character{10 - messageLength !== 1 ? 's' : ''} needed
                        </p>
                      ) : (
                        <span />
                      )}
                    </div>
                    <p className={`text-xs font-medium tabular-nums ${
                      messageLength >= MAX_LENGTH
                        ? 'text-red-500'
                        : messageLength >= MAX_LENGTH * 0.9
                        ? 'text-orange-500'
                        : 'text-gray-400'
                    }`}>
                      {messageLength.toLocaleString()} / {MAX_LENGTH.toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* ── Submit ── */}
                <Button
                  type="submit"
                  size="lg"
                  className="w-full"
                  loading={loading}
                >
                  <Send className="w-4 h-4" />
                  Submit Feedback
                </Button>
              </form>
            </Card>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
