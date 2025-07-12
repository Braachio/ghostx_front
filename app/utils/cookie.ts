// utils/cookie.ts
import Cookies from 'js-cookie'

export const setConsentCookie = (value: 'essential' | 'all') => {
  Cookies.set('cookie_consent', value, { expires: 365 })
}

export const getConsentCookie = (): 'essential' | 'all' | null => {
  const value = Cookies.get('cookie_consent')
  if (value === 'essential' || value === 'all') return value
  return null
}
