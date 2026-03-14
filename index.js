const express = require('express');
const axios = require('axios');
const mongoose = require('mongoose');
const app = express();

const PORT = process.env.PORT || 3000;
const GEMINI_KEY = process.env.GEMINI_KEY; 
const MON_NUMERO = "22395064497";
const MONGO_URI = "mongodb+srv://denji-api:denji1234@cluster0.czgcbse.mongodb.net/denjiDB?retryWrites=true&w=majority";

mongoose.connect(MONGO_URI).catch(() => console.log("Mongo Down"));

app.get('/', (req, res) => res.send("Denji est vivant !"));

app.get('/api/denji', async (req, res) => {
    const { text, sender } = req.query;
    if (!text || !sender) return res.json({ status: false, error: "Infos manquantes" });

    try {
        const isOwner = sender.includes(MON_NUMERO);
        
        // LA LIGNE CORRIGÉE (v1 et gemini-1.5-flash)
        const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`;
        
        const response = await axios.post(url, {
            contents: [{ 
                role: "user", 
                parts: [{ text: `Tu es Denji de Chainsaw Man. ${isOwner ? "Salut Maître." : "Sois sec."} Réponds brièvement à : ${text}` }] 
            }]
        });

        if (response.data && response.data.candidates) {
            const reply = response.data.candidates[0].content.parts[0].text;
            res.json({ 
                status: true, 
                content: { 
                    message: reply, 
                    sticker: isOwner ? "https://i.ibb.co/M55Bj6pV/temp.jpg" : "https://i.ibb.co/8ncS99Tf/temp.jpg" 
                } 
            });
        } else {
            throw new Error("Format de réponse inconnu");
        }

    } catch (e) {
        console.log("ERREUR BRUTE :", e.response ? JSON.stringify(e.response.data) : e.message);
        res.json({ status: false, message: "Erreur de connexion à Google" });
    }
});

app.listen(PORT, '0.0.0.0');
