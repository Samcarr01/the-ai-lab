'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

interface AdminContextType {
  adminViewMode: 'admin' | 'free'
  toggleAdminView: () => void
  getEffectiveUser: (user: any) => any
}

const AdminContext = createContext<AdminContextType | undefined>(undefined)

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [adminViewMode, setAdminViewMode] = useState<'admin' | 'free'>('admin')

  useEffect(() => {
    // Load admin view mode preference from localStorage
    const savedMode = localStorage.getItem('adminViewMode') as 'admin' | 'free'
    if (savedMode) {
      setAdminViewMode(savedMode)
    }
  }, [])

  const toggleAdminView = () => {
    const newMode = adminViewMode === 'admin' ? 'free' : 'admin'
    setAdminViewMode(newMode)
    localStorage.setItem('adminViewMode', newMode)
  }

  const getEffectiveUser = (user: any) => {
    // Only apply toggle for admin user
    if (user && user.email === 'samcarr1232@gmail.com' && adminViewMode === 'free') {
      return { ...user, is_pro: false, email: 'test@user.com' } // Simulate free user
    }
    return user
  }

  return (
    <AdminContext.Provider value={{ adminViewMode, toggleAdminView, getEffectiveUser }}>
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