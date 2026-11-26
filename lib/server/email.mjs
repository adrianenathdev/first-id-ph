const providers = {
  resend: {
    url: 'https://api.resend.com/emails',
    keyName: 'RESEND_API_KEY',
    headers: key => ({ Authorization: `Bearer ${key}` }),
    payload: ({ email, name, to, subject, text }) => ({
      from: `${name} <${email}>`, to: [to], subject, text,
    }),
    messageId: result => result.id,
  },
  brevo: {
    url: 'https://api.brevo.com/v3/smtp/email',
    keyName: 'BREVO_API_KEY',
    headers: key => ({ 'api-key': key }),
    payload: ({ email, name, to, subject, text }) => ({
      sender: { email, name }, to: [{ email: to }], subject, textContent: text,
    }),
    messageId: result => result.messageId,
  },
}

export async function sendEmail({ to, subject, text }) {
  const providerName = process.env.EMAIL_PROVIDER?.trim()
  if (!Object.hasOwn(providers, providerName ?? '')) {
    throw new Error('Set EMAIL_PROVIDER to resend or brevo.')
  }
  const provider = providers[providerName]
  const key = process.env[provider.keyName]?.trim()
  const email = process.env.EMAIL_FROM_ADDRESS?.trim()
  const name = process.env.EMAIL_FROM_NAME?.trim() || 'First ID PH'
  if (!key || !email) {
    throw new Error(`Set ${provider.keyName} and EMAIL_FROM_ADDRESS for ${providerName}.`)
  }

  const response = await fetch(provider.url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...provider.headers(key) },
    body: JSON.stringify(provider.payload({ email, name, to, subject, text })),
    signal: AbortSignal.timeout(10000),
  })
  if (!response.ok) throw new Error(`${providerName} rejected the email (HTTP ${response.status}).`)
  const id = provider.messageId(await response.json())
  if (typeof id !== 'string' || !id) throw new Error(`${providerName} returned no message ID.`)
  return { provider: providerName, id }
}
