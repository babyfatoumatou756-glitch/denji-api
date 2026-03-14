const express = require('express');
const axios = require('axios');
const mongoose = require('mongoose');

const app = express();

const PORT = process.env.PORT || 3000;
const GEMINI_KEY = process.env.GEMINI_KEY;
const MON_NUMERO = "22395064497";

// ⚠️ Idéalement mets ça dans ENV plus tard
const MONGO_URI =
"mongodb+srv://denji-api:denji1234@cluster0.czgcbse.mongodb.net/denjiDB?retryWrites=true&w=majority";

// ===== MongoDB =====
mongoose.connect(MONGO_URI)
.then(() => console.log("✅ Mongo connecté"))
.catch(() => console.log("❌ Mongo Down"));


// ===== Route test =====
app.get('/', (req, res) => {
    res.send("Denji est vivant !");
});


// ===== API DENJI =====
app.get('/api/denji', async (req, res) => {

    const { text, sender } = req.query;

    if (!text || !sender) {
        return res.json({
            status: false,
            message: "Infos manquantes"
        });
    }

    try {

        const isOwner = sender.includes(MON_NUMERO);

        // ✅ URL GEMINI STABLE (IMPORTANT)
        const response = await axios({
            method: "POST",
            url: `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_KEY}`,
            headers: {
                "Content-Type": "application/json"
            },
            data: {
                contents: [
                    {
                        role: "user",
                        parts: [
                            {
                                text: `Tu es Denji de Chainsaw Man. ${
                                    isOwner ? "Salut Maître." : "Sois sec."
                                } Réponds brièvement à : ${text}`
                            }
                        ]
                    }
                ],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 200
                }
            }
        });

        // ✅ récupération sécurisée réponse
        const reply =
            response?.data?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!reply) {
            throw new Error("Réponse Gemini vide");
        }

        res.json({
            status: true,
            content: {
                message: reply,
                sticker: isOwner
                    ? "https://i.ibb.co/M55Bj6pV/temp.jpg"
                    : "https://i.ibb.co/8ncS99Tf/temp.jpg"
            }
        });

    } catch (e) {

        console.log(
            "🔥 ERREUR GEMINI:",
            e.response?.data || e.message
        );

        res.json({
            status: false,
            message: "Erreur de communication avec l'IA"
        });
    }
});


// ===== Lancement serveur =====
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Serveur lancé sur ${PORT}`);
});
