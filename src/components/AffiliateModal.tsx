'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, Star, ExternalLink } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { AffiliateModalProps } from '@/types/affiliate'
import { Backdrop } from './ui/Backdrop'
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock'
import {
  cardToModalVariants,
  contentRevealVariants,
  staggerContainer,
  ctaButtonVariants,
  getCategoryInfo
} from './animations/affiliateCardToModal'

export const AffiliateModal: React.FC<AffiliateModalProps> = ({ 
  tool, 
  isOpen, 
  onClose 
}) => {
  const modalRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  
  useBodyScrollLock(isOpen)

  // Focus management
  useEffect(() => {
    if (isOpen && closeButtonRef.current) {
      closeButtonRef.current.focus()
    }
  }, [isOpen])

  // Keyboard event handler
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!tool) return null

  const categoryInfo = getCategoryInfo(tool.category)

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <Backdrop onClick={onClose} className="p-0 sm:p-4">
          <motion.div
            ref={modalRef}
            layoutId={`card-${tool.id}`}
            className="relative w-full h-full sm:w-full sm:max-w-4xl sm:h-auto sm:max-h-[90vh] bg-gradient-to-br from-purple-900 via-slate-800 to-slate-900 rounded-none sm:rounded-3xl shadow-2xl border-0 sm:border sm:border-purple-500/30 overflow-hidden will-change-transform transform-gpu smooth-animation flex flex-col"
            style={{ borderRadius: window.innerWidth < 640 ? '0' : '1.5rem' }}
            variants={cardToModalVariants}
            initial="card"
            animate="modal"
            exit="card"
            transition={{
              type: 'spring',
              damping: 60,
              stiffness: 900,
              mass: 0.3,
              velocity: 0
            }}
            onClick={(e) => e.stopPropagation()}
          >

            {/* Header */}
            <div className="p-4 sm:p-8 border-b border-white/10 flex-shrink-0">
              <div className="flex items-start space-x-4 sm:space-x-6">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white rounded-2xl p-2 sm:p-3 flex items-center justify-center flex-shrink-0">
                  {tool.image_url ? (
                    <img 
                      src={tool.image_url} 
                      alt={tool.title}
                      className="w-12 h-12 sm:w-14 sm:h-14 object-contain"
                    />
                  ) : (
                    <span className="text-2xl sm:text-3xl">{categoryInfo.emoji}</span>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <motion.h2 
                    layoutId={`title-${tool.id}`}
                    className="text-xl sm:text-3xl md:text-4xl font-bold text-white mb-2 sm:mb-3"
                  >
                    {tool.title}
                  </motion.h2>
                  
                  <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 mb-3 sm:mb-4">
                    {tool.rating && (
                      <motion.div 
                        layoutId={`rating-${tool.id}`}
                        className="flex items-center space-x-1"
                      >
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3 h-3 sm:w-4 sm:h-4 ${
                              i < Math.floor(tool.rating!)
                                ? 'text-yellow-400 fill-current'
                                : 'text-gray-400'
                            }`}
                          />
                        ))}
                        <span className="text-gray-300 ml-2 text-sm sm:text-base">
                          {tool.rating} out of 5
                        </span>
                      </motion.div>
                    )}
                    
                    <div className={`inline-flex items-center px-3 py-1 sm:px-4 sm:py-1 rounded-full text-xs sm:text-sm font-semibold bg-gradient-to-r ${categoryInfo.color} text-white`}>
                      <span className="mr-2">{categoryInfo.emoji}</span>
                      {tool.category}
                    </div>
                  </div>
                  
                  {tool.price && (
                    <div className="text-2xl sm:text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                      {tool.price}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-8">
              <motion.div
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
                className="space-y-4 sm:space-y-8"
              >
                {/* Main Description */}
                <motion.div variants={contentRevealVariants}>
                  <h3 className="text-lg sm:text-xl font-semibold text-purple-300 mb-3 sm:mb-4 flex items-center">
                    <span className="mr-2 sm:mr-3">✨</span>
                    Why We Love This Tool
                  </h3>
                  <motion.div 
                    layoutId={`description-${tool.id}`}
                    className="text-gray-200 text-sm sm:text-base leading-relaxed"
                  >
                    {tool.description.split('\n\n').slice(0, 2).map((paragraph, index) => (
                      <p key={index} className="mb-3 sm:mb-4 last:mb-0">
                        {paragraph}
                      </p>
                    ))}
                  </motion.div>
                </motion.div>

                {/* Why We Love It */}
                {tool.why_we_love_it && tool.why_we_love_it.length > 0 && (
                  <motion.div variants={contentRevealVariants}>
                    <h4 className="text-base sm:text-lg font-semibold text-green-300 mb-2 sm:mb-3 flex items-center">
                      <span className="mr-2">💝</span>
                      What Makes It Special
                    </h4>
                    <ul className="space-y-1 sm:space-y-2">
                      {tool.why_we_love_it.slice(0, 3).map((reason, index) => (
                        <li key={index} className="text-gray-200 text-xs sm:text-sm flex items-start">
                          <span className="text-purple-400 mr-2 sm:mr-3 mt-1">•</span>
                          <span className="flex-1">{reason}</span>
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                )}

                {/* Key Benefits */}
                {tool.key_benefits && tool.key_benefits.length > 0 && (
                  <motion.div variants={contentRevealVariants}>
                    <h4 className="text-base sm:text-lg font-semibold text-yellow-300 mb-2 sm:mb-3 flex items-center">
                      <span className="mr-2">💎</span>
                      Key Benefits
                    </h4>
                    <ul className="space-y-1 sm:space-y-2">
                      {tool.key_benefits.slice(0, 3).map((benefit, index) => (
                        <li key={index} className="text-gray-200 text-xs sm:text-sm flex items-start">
                          <span className="text-yellow-400 mr-2 sm:mr-3 mt-1">•</span>
                          <span className="flex-1">{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                )}
              </motion.div>
            </div>

            {/* Footer Actions */}
            <div className="flex-shrink-0 p-4 sm:p-8 border-t border-white/10 bg-gradient-to-r from-purple-900/50 to-slate-900/50">
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <motion.button
                  variants={ctaButtonVariants}
                  initial="hidden"
                  animate={["visible", "pulse"]}
                  className="flex-1 px-6 py-3 sm:px-8 sm:py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold rounded-xl text-base sm:text-lg transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center space-x-2 mobile-touch-target"
                  onClick={() => {
                    if (tool.affiliate_url) {
                      window.open(tool.affiliate_url, '_blank')
                    }
                  }}
                >
                  <span>🚀 Get Started Now</span>
                  <ExternalLink className="w-4 h-4 sm:w-5 sm:h-5" />
                </motion.button>
                
                <button
                  onClick={onClose}
                  className="px-6 py-3 sm:px-8 sm:py-4 border border-slate-600 text-gray-300 hover:text-white hover:border-slate-500 rounded-xl text-base sm:text-lg transition-colors mobile-touch-target"
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        </Backdrop>
      )}
    </AnimatePresence>
  )
}