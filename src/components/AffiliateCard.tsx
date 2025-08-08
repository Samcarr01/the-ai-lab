'use client'

import { motion } from 'framer-motion'
import { Star } from 'lucide-react'
import { AffiliateCardProps } from '@/types/affiliate'
import { cardToModalVariants, getCategoryInfo } from './animations/affiliateCardToModal'

export const AffiliateCard: React.FC<AffiliateCardProps> = ({ 
  tool, 
  onExpand, 
  isExpanded,
  index,
  isFeatured = false
}) => {
  const categoryInfo = getCategoryInfo(tool.category)

  return (
    <motion.div
      layoutId={`card-${tool.id}`}
      className={`group relative h-[380px] cursor-pointer transition-all duration-300 ${
        isExpanded ? 'pointer-events-none' : 'hover:scale-105 hover:shadow-2xl'
      }`}
      variants={cardToModalVariants}
      onClick={() => !isExpanded && onExpand(tool)}
      whileHover={!isExpanded ? { y: -8 } : {}}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
    >
      <div 
        className={`w-full h-full rounded-2xl overflow-hidden shadow-xl transition-all duration-500 ${
          isFeatured 
            ? 'bg-gradient-to-br from-yellow-400/20 via-purple-800 to-purple-900 border-2 border-yellow-400/40' 
            : 'bg-gradient-to-br from-purple-800 via-purple-900 to-slate-800 border border-purple-500/30'
        }`}
      >
        {/* Featured Badge */}
        {isFeatured && (
          <div className="absolute top-3 right-3 z-10">
            <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
              <Star className="w-5 h-5 text-white fill-current" />
            </div>
          </div>
        )}

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-purple-900/30 via-transparent to-transparent" />

        <div className="relative p-6 h-full flex flex-col justify-between">
          {/* Top Section */}
          <div className="text-center flex-1 flex flex-col">
            {/* Tool Image/Icon */}
            <div className="mb-4 flex justify-center">
              <div className="w-16 h-16 rounded-xl bg-white/95 shadow-lg p-2 flex items-center justify-center backdrop-blur-sm">
                {tool.image_url ? (
                  <img 
                    src={tool.image_url} 
                    alt={tool.title}
                    className="w-12 h-12 object-contain"
                  />
                ) : (
                  <div className="w-12 h-12 flex items-center justify-center text-2xl">
                    {categoryInfo.emoji}
                  </div>
                )}
              </div>
            </div>

            {/* Title */}
            <motion.h3 
              layoutId={`title-${tool.id}`}
              className="text-lg font-bold text-white mb-2 leading-tight line-clamp-2"
            >
              {tool.title}
            </motion.h3>

            {/* Rating */}
            {tool.rating && (
              <motion.div 
                layoutId={`rating-${tool.id}`}
                className="flex items-center justify-center mb-3"
              >
                <div className="flex items-center space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3 h-3 ${
                        i < Math.floor(tool.rating!)
                          ? 'text-yellow-400 fill-current'
                          : 'text-gray-400'
                      }`}
                    />
                  ))}
                  <span className="text-sm text-gray-300 ml-2">
                    {tool.rating}
                  </span>
                </div>
              </motion.div>
            )}

            {/* Category */}
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold mb-3 bg-gradient-to-r ${categoryInfo.color} text-white shadow-md`}>
              <span className="mr-1">{categoryInfo.emoji}</span>
              {tool.category}
            </div>

            {/* Description Preview */}
            <motion.p 
              layoutId={`description-${tool.id}`}
              className="text-gray-300 text-xs leading-relaxed mb-4 line-clamp-3 flex-1"
            >
              {tool.description.length > 120 
                ? `${tool.description.slice(0, 120)}...` 
                : tool.description
              }
            </motion.p>
          </div>

          {/* Bottom Section */}
          <div className="space-y-2">
            {/* Price */}
            {tool.price && (
              <div className="text-center">
                <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  {tool.price}
                </span>
              </div>
            )}
            
            {/* CTA Button */}
            <button 
              className="w-full px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold rounded-xl text-sm transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
              onClick={(e) => {
                e.stopPropagation()
                if (tool.affiliate_url) {
                  window.open(tool.affiliate_url, '_blank')
                }
              }}
            >
              🚀 Try Now
            </button>
            
            {/* Expand Hint */}
            <button className="w-full text-gray-400 hover:text-white text-xs transition-colors py-1">
              👆 Click for full details
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}