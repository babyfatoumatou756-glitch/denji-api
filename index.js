const express = require('express');
const axios = require('axios');
const mongoose = require('mongoose');
const app = express();

const PORT = process.env.PORT || 3000;
const GEMINI_KEY = process.env.GEMINI_KEY; 
const MON_NUMERO = "22395064497";
const MONGO_URI = "mongodb+srv://denji-api:denji1234@cluster0.czgcbse.mongodb.net/denjiDB?retryWrites=true&w=majority";

mongoose.connect(MONGO_URI).catch(err => console.log("Mongo Error"));

const Chat = mongoose.model('ChatDenji', new mongoose.Schema({
    sender: String,
    history: [{ role: String, parts: [{ text: String }] }]
}));

app.get('/', (req, res) => res.send("Denji est vivant !"));

app.get('/api/denji', async (req, res) => {
    const { text, sender } = req.query;
    if (!text || !sender) return res.json({ status: false, error: "Infos manquantes" });

    try {
        const isOwner = sender.includes(MON_NUMERO);
        // ON UTILISE L'URL LA PLUS STABLE POSSIBLE ICI
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_KEY}`;
        
        const response = await axios.post(url, {
            contents: [{ role: "user", parts: [{ text: `Tu es Denji. ${isOwner ? "Salut Maître." : "Sois sec."} Réponds à : ${text}` }] }]
        });

        const reply = response.data.candidates[0].content.parts[0].text;

        res.json({ 
            status: true, 
            content: { message: reply, sticker: isOwner ? "https://i.ibb.co/M55Bj6pV/temp.jpg" : "https://i.ibb.co/8ncS99Tf/temp.jpg" } 
        });

    } catch (e) {
        // Cette ligne va nous donner la VRAIE réponse de Google dans les logs
        console.log("ERREUR BRUTE GOOGLE :", e.response ? JSON.stringify(e.response.data) : e.message);
        res.json({ status: false, message: "Erreur de communication avec l'IA" });
    }
});

app.listen(PORT, '0.0.0.0');
