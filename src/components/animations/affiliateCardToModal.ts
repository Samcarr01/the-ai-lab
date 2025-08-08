import { Variants } from 'framer-motion'

// Check for reduced motion preference
const prefersReducedMotion = typeof window !== 'undefined' 
  ? window.matchMedia('(prefers-reduced-motion: reduce)').matches 
  : false

// Spring configuration for smooth morphing
export const springTransition = {
  type: 'spring' as const,
  damping: 30,
  stiffness: 300,
  mass: 0.8,
}

export const reducedMotionTransition = {
  duration: 0.2,
  ease: 'easeOut' as const,
}

// Card to Modal morph variants
export const cardToModalVariants: Variants = {
  card: {
    scale: 1,
    borderRadius: '1rem',
    transition: prefersReducedMotion ? reducedMotionTransition : springTransition,
  },
  modal: {
    scale: 1,
    borderRadius: '1.5rem',
    transition: prefersReducedMotion ? reducedMotionTransition : springTransition,
  },
}

// Content reveal animation with stagger
export const contentRevealVariants: Variants = {
  hidden: {
    opacity: 0,
    y: prefersReducedMotion ? 0 : 20,
    transition: prefersReducedMotion ? reducedMotionTransition : springTransition,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: prefersReducedMotion ? reducedMotionTransition : springTransition,
  },
}

export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: prefersReducedMotion ? 0 : 0.04, // 40ms stagger
      delayChildren: prefersReducedMotion ? 0 : 0.1,
    },
  },
}

// CTA button with gentle pulse
export const ctaButtonVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: prefersReducedMotion ? 1 : 0.9,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: prefersReducedMotion ? reducedMotionTransition : {
      ...springTransition,
      delay: 0.3,
    },
  },
  pulse: {
    scale: prefersReducedMotion ? 1 : [1, 1.05, 1],
    transition: {
      duration: 0.6,
      ease: 'easeInOut' as const,
      delay: 0.5,
    },
  },
}

// Backdrop variants
export const backdropVariants: Variants = {
  hidden: {
    opacity: 0,
    backdropFilter: 'blur(0px)',
    transition: { duration: 0.2 },
  },
  visible: {
    opacity: 1,
    backdropFilter: 'blur(12px)',
    transition: { duration: 0.3, ease: 'easeOut' },
  },
}

// Category info for consistent styling
export const getCategoryInfo = (category: string) => {
  const categoryMap: Record<string, { emoji: string; color: string }> = {
    'Business Planning': { emoji: '💼', color: 'from-blue-500 to-blue-600' },
    'Productivity': { emoji: '⚡', color: 'from-yellow-500 to-orange-500' },
    'Communication': { emoji: '💬', color: 'from-green-500 to-emerald-600' },
    'Automation': { emoji: '🤖', color: 'from-purple-500 to-violet-600' },
    'Marketing': { emoji: '📈', color: 'from-pink-500 to-rose-600' },
    'Design': { emoji: '🎨', color: 'from-indigo-500 to-purple-600' },
    'Development': { emoji: '💻', color: 'from-cyan-500 to-blue-600' },
    'Analysis': { emoji: '📊', color: 'from-red-500 to-pink-600' },
    'Research': { emoji: '🔍', color: 'from-slate-500 to-gray-600' },
  }
  
  return categoryMap[category] || { emoji: '🛠️', color: 'from-gray-500 to-slate-600' }
}