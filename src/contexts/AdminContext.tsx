'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

type AdminViewMode = 'admin' | 'free' | 'pro' | 'ultra'

interface AdminContextType {
  adminViewMode: AdminViewMode
  setAdminViewMode: (mode: AdminViewMode) => void
  getEffectiveUser: (user: any) => any
}

const AdminContext = createContext<AdminContextType | undefined>(undefined)

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [adminViewMode, setAdminViewModeState] = useState<AdminViewMode>('admin')

  useEffect(() => {
    // Load admin view mode preference from localStorage
    if (typeof window !== 'undefined') {
      const savedMode = localStorage.getItem('adminViewMode') as AdminViewMode
      if (savedMode && ['admin', 'free', 'pro', 'ultra'].includes(savedMode)) {
        setAdminViewModeState(savedMode)
      }
    }
  }, [])

  const setAdminViewMode = (mode: AdminViewMode) => {
    setAdminViewModeState(mode)
    if (typeof window !== 'undefined') {
      localStorage.setItem('adminViewMode', mode)
    }
  }

  const getEffectiveUser = (user: any) => {
    // Only apply toggle for admin user
    if (user && user.email === 'samcarr1232@gmail.com' && adminViewMode !== 'admin') {
      // Simulate different user tiers
      if (adminViewMode === 'free') {
        return { 
          ...user, 
          is_pro: false, 
          user_tier: 'free', 
          email: 'test-free@example.com' 
        }
      } else if (adminViewMode === 'pro') {
        return { 
          ...user, 
          is_pro: true, 
          user_tier: 'pro', 
          email: 'test-pro@example.com' 
        }
      } else if (adminViewMode === 'ultra') {
        return { 
          ...user, 
          is_pro: true, 
          user_tier: 'ultra', 
          email: 'test-ultra@example.com' 
        }
      }
    }
    return user
  }

  return (
    <AdminContext.Provider value={{ adminViewMode, setAdminViewMode, getEffectiveUser }}>
      {children}
    </AdminContext.Provider>
  )
}

export function useAdmin() {
  const context = useContext(AdminContext)
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider')
  }
  return context
}