export function validContactEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

export function readProfile(value: string, channel: 'facebook' | 'instagram') {
  try {
    const url = new URL(value)
    const allowed = channel === 'facebook' ? ['facebook.com', 'www.facebook.com', 'm.facebook.com'] : ['instagram.com', 'www.instagram.com']
    if (url.protocol !== 'https:' || url.username || url.password || url.port || !allowed.includes(url.hostname)) return null
    if (channel === 'facebook' && url.pathname === '/profile.php') {
      const id = url.searchParams.get('id')
      return id && /^[0-9]+$/.test(id) ? 'https://www.facebook.com/profile.php?id=' + id : null
    }
    return /^\/[\w.]+\/?$/.test(url.pathname) ? url.origin + url.pathname : null
  } catch {
    return null
  }
}
