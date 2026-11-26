import { sendEmail } from '../lib/server/email.mjs'

const [recipient, ...extra] = process.argv.slice(2)
if (extra.length || !recipient || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient)) {
  console.error('Usage: npm run email:test -- you@example.com')
  process.exitCode = 1
} else {
  try {
    const { provider, id } = await sendEmail({
      to: recipient,
      subject: 'First ID PH email test',
      text: 'This is a test of the First ID PH transactional email configuration.',
    })
    console.log(`Accepted by ${provider}. Message ID: ${id}`)
  } catch (error) {
    console.error(error.message)
    process.exitCode = 1
  }
}
