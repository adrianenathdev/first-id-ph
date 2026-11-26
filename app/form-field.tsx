'use client'

import { cloneElement, useEffect, useId, useRef, useState, type ChangeEvent, type FormEvent, type ReactElement } from 'react'

type Control = HTMLInputElement | HTMLTextAreaElement
type Attributes = {
  id?: string
  'aria-describedby'?: string
  'aria-invalid'?: boolean
  onBlur?: (event: React.FocusEvent<Control>) => void
  onChange?: (event: ChangeEvent<Control>) => void
  onInvalid?: (event: FormEvent<Control>) => void
}

export default function FormField({ label, children, validate, recheckKey, hint }: {
  label: string
  children: ReactElement<Attributes>
  validate?: (value: string) => string | undefined
  recheckKey?: string
  hint?: string
}) {
  const fieldId = useId()
  const id = children.props.id ?? fieldId
  const feedbackId = `${fieldId}-feedback`
  const hintId = `${fieldId}-hint`
  const container = useRef<HTMLDivElement>(null)
  const checked = useRef(false)
  const [result, setResult] = useState<{ state: 'valid' | 'invalid'; message: string } | null>(null)

  function check(control: Control) {
    control.setCustomValidity('')
    const custom = control.value.trim() ? validate?.(control.value)
      : control.required && control.value ? 'Enter a value rather than spaces.' : undefined
    if (custom) control.setCustomValidity(custom)
    if (!checked.current) return
    if (!control.validity.valid) setResult({ state: 'invalid', message: control.validationMessage })
    else if (control.value.trim()) setResult({ state: 'valid', message: 'Format looks right' })
    else setResult(null)
  }

  useEffect(() => {
    const control = container.current?.querySelector('input, textarea') as Control | null
    const form = control?.form
    if (!control || !form) return
    const reset = () => {
      checked.current = false
      control.setCustomValidity('')
      setResult(null)
    }
    form.addEventListener('reset', reset)
    return () => form.removeEventListener('reset', reset)
  }, [])

  useEffect(() => {
    if (recheckKey === undefined || !checked.current) return
    const control = container.current?.querySelector('input, textarea') as Control | null
    if (control) check(control)
  }, [recheckKey])

  return <div ref={container} className="form-field" data-state={result?.state}>
    <label htmlFor={id}>{label}</label>
    {cloneElement(children, {
      id,
      'aria-describedby': [children.props['aria-describedby'], hint && hintId, result && feedbackId].filter(Boolean).join(' ') || undefined,
      'aria-invalid': result?.state === 'invalid' || undefined,
      onChange: (event: ChangeEvent<Control>) => {
        children.props.onChange?.(event)
        check(event.currentTarget)
      },
      onBlur: event => {
        children.props.onBlur?.(event)
        checked.current = true
        check(event.currentTarget)
      },
      onInvalid: event => {
        children.props.onInvalid?.(event)
        checked.current = true
        check(event.currentTarget)
      },
    })}
    {hint && <p className="field-example" id={hintId}>{hint}</p>}
    <p className="field-feedback" id={feedbackId} aria-live="polite">
      {result && <><span aria-hidden="true">{result.state === 'valid' ? '✓' : '!'}</span> {result.message}</>}
    </p>
  </div>
}
