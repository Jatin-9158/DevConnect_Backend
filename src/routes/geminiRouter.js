const express = require('express');
const geminiRouter = express.Router();
const axios = require('axios');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

geminiRouter.post('/chat', async (req, res) => {
  const { prompt } = req.body;

  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
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
    console.error("Gemini Error:", err.response?.data || err.message);
    res.status(500).json({ message: "Failed to get response from Gemini" });
  }
});

module.exports = geminiRouter;
