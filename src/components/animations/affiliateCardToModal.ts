import { Variants } from 'framer-motion'

// Check for reduced motion preference
const prefersReducedMotion = typeof window !== 'undefined' 
  ? window.matchMedia('(prefers-reduced-motion: reduce)').matches 
  : false

// Ultra-smooth spring configuration for instant, buttery animations
export const springTransition = {
  type: 'spring' as const,
  damping: 50,
  stiffness: 800,
  mass: 0.4,
  velocity: 0,
}

export const reducedMotionTransition = {
  duration: 0.1,
  ease: [0.23, 1, 0.32, 1] as const, // Custom bezier for smoothness
}

// Card to Modal morph variants - removed borderRadius to prevent override
export const cardToModalVariants: Variants = {
  card: {
    scale: 1,
    transition: prefersReducedMotion ? reducedMotionTransition : springTransition,
  },
  modal: {
    scale: 1,
    transition: prefersReducedMotion ? reducedMotionTransition : springTransition,
  },
}

// Ultra-smooth content reveal with minimal movement
export const contentRevealVariants: Variants = {
  hidden: {
    opacity: 0,
    y: prefersReducedMotion ? 0 : 5,
    transition: {
      duration: 0.1,
      ease: [0.23, 1, 0.32, 1] as const,
    },
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.15,
      ease: [0.23, 1, 0.32, 1] as const,
    },
  },
}

export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: prefersReducedMotion ? 0 : 0.01, // 10ms stagger (ultra-fast)
      delayChildren: prefersReducedMotion ? 0 : 0.02, // Minimal delay
    },
  },
}

// Ultra-smooth CTA button
export const ctaButtonVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: prefersReducedMotion ? 1 : 0.98,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.15,
      ease: [0.23, 1, 0.32, 1] as const,
      delay: 0.05, // Instant response
    },
  },
  pulse: {
    scale: prefersReducedMotion ? 1 : [1, 1.01, 1],
    transition: {
      duration: 0.3,
      ease: [0.23, 1, 0.32, 1] as const,
      delay: 0.1,
    },
  },
}

// Instant backdrop for immediate response
export const backdropVariants: Variants = {
  hidden: {
    opacity: 0,
    backdropFilter: 'blur(0px)',
    transition: { duration: 0.05 },
  },
  visible: {
    opacity: 1,
    backdropFilter: 'blur(12px)',
    transition: { 
      duration: 0.1, 
      ease: [0.23, 1, 0.32, 1] as const,
    },
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