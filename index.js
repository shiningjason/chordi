const fetch = require('node-fetch')
const { json, send } = require('micro')
const { CHORDIFY_BOT_TELEGRAM_TOKEN } = process.env

const API_URL = `https://api.telegram.org/bot${CHORDIFY_BOT_TELEGRAM_TOKEN}`

function sendMessage(chatId, message) {
  return fetch(`${API_URL}/sendMessage`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      chat_id: chatId,
      text: message,
      parse_mode: 'Markdown'
    })
  })
}

module.exports = async (req, res) => {
  const { message } = await json(req)
  send(res, 200)
  if (!message) return

  const { chat, text } = message
  const matches = /^\/chordify(?:@\S+)*\s+(.*)/.exec(text)
  if (!matches) return

  const keyword = matches[1].trim()
  if (!keyword) return

  const response = await fetch(`https://chordify.now.sh/${encodeURIComponent(keyword)}`)
  const content = await response.json()
  if (response.status < 200 || response.status >= 300) {
    sendMessage(chat.id, content.message)
    return
  }

  const { name, artist, key, capo, tuning, chart } = content
  let result = `*${artist} - ${name}*\n\n`
  if (tuning) result += `*Tuning:* ${tuning.value}\n`
  if (capo) result += `*Capo:* ${capo}\n`
  if (key) result += `*Key:* ${key}\n`
  result += '\n```\n'
  result += chart
    .replace(/\r/g, '')
    .replace(/(\n)+/g, '\n')
    .replace(/\[ch\]/g, '')
    .replace(/\[\/ch\]/g, '')
  result += '\n```'
  sendMessage(chat.id, result)
}
