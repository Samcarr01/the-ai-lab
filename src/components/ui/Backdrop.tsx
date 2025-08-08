'use client'

import { motion } from 'framer-motion'
import { backdropVariants } from '../animations/affiliateCardToModal'

interface BackdropProps {
  onClick: () => void
  children: React.ReactNode
  className?: string
}

export const Backdrop: React.FC<BackdropProps> = ({ onClick, children, className }) => {
  return (
    <motion.div
      className={`fixed inset-0 z-50 flex items-center justify-center ${className || 'p-4'}`}
      style={{
        background: 'radial-gradient(ellipse at center, rgba(168, 85, 247, 0.1) 0%, rgba(0, 0, 0, 0.6) 100%)',
      }}
      variants={backdropVariants}
      initial="hidden"
      animate="visible"
      exit="hidden"
      onClick={onClick}
    >
      {children}
    </motion.div>
  )
}