import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext'
import api from '../services/api'

const BadgeContext = createContext({ badges: {}, refetch: () => {} })

export function BadgeProvider({ children }) {
  const { isAuthenticated } = useAuth()
  const location = useLocation()
  const [badges, setBadges] = useState({})

  const refetch = useCallback(async () => {
    if (!isAuthenticated) return
    try {
      const desde = localStorage.getItem('notif_seen_at') ?? ''
      const url = desde
        ? `/notificaciones/badges?desde=${encodeURIComponent(desde)}`
        : '/notificaciones/badges'
      const { data } = await api.get(url)
      setBadges(data)
    } catch {}
  }, [isAuthenticated])

  // Refresca en cada cambio de ruta
  useEffect(() => { refetch() }, [refetch, location.pathname])

  // Polling cada 60 segundos
  useEffect(() => {
    if (!isAuthenticated) return
    const id = setInterval(refetch, 60_000)
    return () => clearInterval(id)
  }, [refetch, isAuthenticated])

  return (
    <BadgeContext.Provider value={{ badges, refetch }}>
      {children}
    </BadgeContext.Provider>
  )
}

export const useBadges = () => useContext(BadgeContext)
