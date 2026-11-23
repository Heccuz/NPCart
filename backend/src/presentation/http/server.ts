import 'dotenv/config'
import express from 'express'

const app = express()
app.use(express.json())

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'npcart-api' })
})

const port = Number(process.env.PORT ?? 4000)
app.listen(port, () => {
  console.log(`[api] NPCart API escuchando en http://localhost:${port}`)
})
