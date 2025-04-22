const express = require('express');
const geminiRouter = express.Router();
const axios = require('axios');

const DEVCONNECT_CHAT_BOT_API_URL = process.env.DEVCONNECT_CHAT_BOT_API_URL

geminiRouter.post('/chat', async (req, res) => {
  const { prompt } = req.body;

  try {
    const response = await axios.post(
      DEVCONNECT_CHAT_BOT_API_URL,
      {
        contents: [{ parts: [{ text: prompt }] }]
      },
      {
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );

    const reply = response.data.candidates?.[0]?.content?.parts?.[0]?.text;
    res.status(200).json({ reply });
  } catch (err) {
    console.error( err.response?.data || err.message);
    res.status(500).json({ message: "Failed to get response from Gemini" });
  }
});

module.exports = geminiRouter;
