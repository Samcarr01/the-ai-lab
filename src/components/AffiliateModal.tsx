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
        <Backdrop onClick={onClose}>
          <motion.div
            ref={modalRef}
            layoutId={`card-${tool.id}`}
            className="relative w-full max-w-4xl max-h-[90vh] bg-gradient-to-br from-purple-900 via-slate-800 to-slate-900 rounded-3xl shadow-2xl border border-purple-500/30 overflow-hidden will-change-transform transform-gpu smooth-animation"
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
            {/* Close Button */}
            <button
              ref={closeButtonRef}
              onClick={onClose}
              className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-black/20 hover:bg-black/40 text-white flex items-center justify-center transition-colors backdrop-blur-sm"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="p-8 border-b border-white/10">
              <div className="flex items-start space-x-6">
                <div className="w-20 h-20 bg-white rounded-2xl p-3 flex items-center justify-center flex-shrink-0">
                  {tool.image_url ? (
                    <img 
                      src={tool.image_url} 
                      alt={tool.title}
                      className="w-14 h-14 object-contain"
                    />
                  ) : (
                    <span className="text-3xl">{categoryInfo.emoji}</span>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <motion.h2 
                    layoutId={`title-${tool.id}`}
                    className="text-3xl md:text-4xl font-bold text-white mb-3"
                  >
                    {tool.title}
                  </motion.h2>
                  
                  <div className="flex items-center space-x-4 mb-4">
                    {tool.rating && (
                      <motion.div 
                        layoutId={`rating-${tool.id}`}
                        className="flex items-center space-x-1"
                      >
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < Math.floor(tool.rating!)
                                ? 'text-yellow-400 fill-current'
                                : 'text-gray-400'
                            }`}
                          />
                        ))}
                        <span className="text-gray-300 ml-2">
                          {tool.rating} out of 5
                        </span>
                      </motion.div>
                    )}
                    
                    <div className={`inline-flex items-center px-4 py-1 rounded-full text-sm font-semibold bg-gradient-to-r ${categoryInfo.color} text-white`}>
                      <span className="mr-2">{categoryInfo.emoji}</span>
                      {tool.category}
                    </div>
                  </div>
                  
                  {tool.price && (
                    <div className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                      {tool.price}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-8 overflow-y-auto max-h-[calc(90vh-300px)]">
              <motion.div
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
                className="space-y-8"
              >
                {/* Main Description */}
                <motion.div variants={contentRevealVariants}>
                  <h3 className="text-xl font-semibold text-purple-300 mb-4 flex items-center">
                    <span className="mr-3">✨</span>
                    Why We Love This Tool
                  </h3>
                  <motion.div 
                    layoutId={`description-${tool.id}`}
                    className="text-gray-200 text-base leading-relaxed"
                  >
                    {tool.description.split('\n\n').map((paragraph, index) => (
                      <p key={index} className="mb-4 last:mb-0">
                        {paragraph}
                      </p>
                    ))}
                  </motion.div>
                </motion.div>

                {/* Why We Love It */}
                {tool.why_we_love_it && tool.why_we_love_it.length > 0 && (
                  <motion.div variants={contentRevealVariants}>
                    <h4 className="text-lg font-semibold text-green-300 mb-3 flex items-center">
                      <span className="mr-2">💝</span>
                      What Makes It Special
                    </h4>
                    <ul className="space-y-2">
                      {tool.why_we_love_it.map((reason, index) => (
                        <li key={index} className="text-gray-200 text-sm flex items-start">
                          <span className="text-purple-400 mr-3 mt-1">•</span>
                          {reason}
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                )}

                {/* Standout Features */}
                {tool.standout_features && tool.standout_features.length > 0 && (
                  <motion.div variants={contentRevealVariants}>
                    <h4 className="text-lg font-semibold text-blue-300 mb-3 flex items-center">
                      <span className="mr-2">🚀</span>
                      Standout Features
                    </h4>
                    <ul className="space-y-2">
                      {tool.standout_features.map((feature, index) => (
                        <li key={index} className="text-gray-200 text-sm flex items-start">
                          <span className="text-blue-400 mr-3 mt-1">•</span>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                )}

                {/* Key Benefits */}
                {tool.key_benefits && tool.key_benefits.length > 0 && (
                  <motion.div variants={contentRevealVariants}>
                    <h4 className="text-lg font-semibold text-yellow-300 mb-3 flex items-center">
                      <span className="mr-2">💎</span>
                      Key Benefits
                    </h4>
                    <ul className="space-y-2">
                      {tool.key_benefits.map((benefit, index) => (
                        <li key={index} className="text-gray-200 text-sm flex items-start">
                          <span className="text-yellow-400 mr-3 mt-1">•</span>
                          {benefit}
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                )}
              </motion.div>
            </div>

            {/* Footer Actions */}
            <div className="p-8 border-t border-white/10 bg-gradient-to-r from-purple-900/50 to-slate-900/50">
              <div className="flex flex-col sm:flex-row gap-4">
                <motion.button
                  variants={ctaButtonVariants}
                  initial="hidden"
                  animate={["visible", "pulse"]}
                  className="flex-1 px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold rounded-xl text-lg transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center space-x-2"
                  onClick={() => {
                    if (tool.affiliate_url) {
                      window.open(tool.affiliate_url, '_blank')
                    }
                  }}
                >
                  <span>🚀 Get Started Now</span>
                  <ExternalLink className="w-5 h-5" />
                </motion.button>
                
                <button
                  onClick={onClose}
                  className="px-8 py-4 border border-slate-600 text-gray-300 hover:text-white hover:border-slate-500 rounded-xl text-lg transition-colors"
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