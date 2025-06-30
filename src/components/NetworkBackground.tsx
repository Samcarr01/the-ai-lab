'use client'

import { useEffect, useRef } from 'react'

interface Orb {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  opacity: number
  hue: number
}

interface GradientBackgroundProps {
  className?: string
}

export default function GradientBackground({ className = '' }: GradientBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const orbsRef = useRef<Orb[]>([])
  const animationFrameRef = useRef<number | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    const updateCanvasSize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    
    updateCanvasSize()
    window.addEventListener('resize', updateCanvasSize)

    // Initialize orbs
    const initOrbs = () => {
      const orbCount = 3 // Fewer, larger orbs for elegance
      orbsRef.current = []
      
      for (let i = 0; i < orbCount; i++) {
        orbsRef.current.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.3, // Slower movement
          vy: (Math.random() - 0.5) * 0.3,
          size: Math.random() * 300 + 200, // Large orbs
          opacity: Math.random() * 0.1 + 0.05, // Very subtle
          hue: Math.random() * 60 + 260 // Purple to blue range
        })
      }
    }

    initOrbs()

    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      const orbs = orbsRef.current

      // Update and draw orbs
      orbs.forEach((orb) => {
        // Update position
        orb.x += orb.vx
        orb.y += orb.vy

        // Bounce off edges
        if (orb.x < -orb.size/2 || orb.x > canvas.width + orb.size/2) orb.vx *= -1
        if (orb.y < -orb.size/2 || orb.y > canvas.height + orb.size/2) orb.vy *= -1

        // Create gradient
        const gradient = ctx.createRadialGradient(
          orb.x, orb.y, 0,
          orb.x, orb.y, orb.size
        )
        gradient.addColorStop(0, `hsla(${orb.hue}, 60%, 70%, ${orb.opacity})`)
        gradient.addColorStop(0.7, `hsla(${orb.hue}, 60%, 50%, ${orb.opacity * 0.3})`)
        gradient.addColorStop(1, `hsla(${orb.hue}, 60%, 30%, 0)`)

        // Draw orb
        ctx.beginPath()
        ctx.arc(orb.x, orb.y, orb.size, 0, Math.PI * 2)
        ctx.fillStyle = gradient
        ctx.fill()
      })

      animationFrameRef.current = requestAnimationFrame(animate)
    }

    animate()

    // Cleanup
    return () => {
      window.removeEventListener('resize', updateCanvasSize)
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 pointer-events-none z-0 ${className}`}
      style={{
        background: 'transparent'
      }}
    />
  )
}