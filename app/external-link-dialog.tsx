'use client'

import { useEffect, useRef, useState } from 'react'

type Destination = { address: string; host: string; label: string }

export default function ExternalLinkDialog() {
  const dialog = useRef<HTMLDialogElement>(null)
  const cancel = useRef<HTMLButtonElement>(null)
  const source = useRef<HTMLAnchorElement>(null)
  const [destination, setDestination] = useState<Destination>()

  useEffect(() => {
    function previewLink(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return
      const link = event.target instanceof Element ? event.target.closest('a[href]') : null
      if (!(link instanceof HTMLAnchorElement) || link.hasAttribute('download') || link.hasAttribute('data-confirmed-external-link')) return

      const address = new URL(link.href, window.location.href)
      if (!['http:', 'https:'].includes(address.protocol) || address.origin === window.location.origin) return
      event.preventDefault()
      source.current = link
      setDestination({
        address: address.href,
        host: address.host,
        label: (link.getAttribute('aria-label') || link.textContent || '').trim(),
      })
    }

    document.addEventListener('click', previewLink)
    return () => document.removeEventListener('click', previewLink)
  }, [])

  useEffect(() => {
    if (!destination || !dialog.current) return
    if (!dialog.current.open) dialog.current.showModal()
    cancel.current?.focus()
  }, [destination])

  return <dialog className="site-dialog" ref={dialog} aria-labelledby="external-link-title" aria-describedby="external-link-description" onClose={() => {
    source.current?.focus()
    source.current = null
    setDestination(undefined)
  }}>
    {destination && <div className="dialog-content">
      <div className="dialog-heading">
        <h2 id="external-link-title">Visit {destination.host}?</h2>
        <button type="button" className="icon-button" aria-label="Close link preview" onClick={() => dialog.current?.close()}>×</button>
      </div>
      <p id="external-link-description">This external website will open in a new tab.</p>
      <div className="external-link-destination">
        {destination.label && <strong>{destination.label}</strong>}
        <p>{destination.address}</p>
      </div>
      <div className="dialog-actions">
        <button ref={cancel} type="button" className="button button-outline" onClick={() => dialog.current?.close()}>Stay here</button>
        <a className="button button-primary" href={destination.address} target="_blank" rel="noopener noreferrer"
          data-confirmed-external-link="" onClick={() => dialog.current?.close()}>Continue to website <span aria-hidden="true">↗</span></a>
      </div>
    </div>}
  </dialog>
}
