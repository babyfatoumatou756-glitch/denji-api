const express = require('express');
const axios = require('axios');
const mongoose = require('mongoose');
const app = express();
const PORT = process.env.PORT || 3000;

// --- CONFIGURATION ---
const GEMINI_KEY = process.env.GEMINI_KEY; 
const MON_NUMERO = "22395064497";
const MONGO_URI = "mongodb+srv://denji-api:denji1234@cluster0.czgcbse.mongodb.net/denjiDB?retryWrites=true&w=majority";

// TES URL DE STICKERS (REPRIS DE TON ANCIEN CODE)
const STICKER_MAITRE = "https://i.ibb.co/M55Bj6pV/temp.jpg"; 
const STICKER_INCONNU = "https://i.ibb.co/8ncS99Tf/temp.jpg";

mongoose.connect(MONGO_URI)
    .then(() => console.log("Mémoire de Denji OK !"))
    .catch(err => console.error("Erreur Mongo:", err));

const ChatSchema = new mongoose.Schema({
    sender: String,
    history: [{ role: String, parts: [{ text: String }] }]
});
const Chat = mongoose.model('ChatDenji', ChatSchema);

app.get('/', (req, res) => {
    res.send("<h1>Serveur Denji Actif !</h1><p>Tes URL d'images sont configurées.</p>");
});

app.get('/api/denji', async (req, res) => {
    const { text, sender } = req.query;
    if (!text || !sender) return res.json({ status: false, error: "Données manquantes" });
    if (!GEMINI_KEY) return res.json({ status: false, error: "Clé API non configurée sur Render" });

    try {
        const isOwner = sender.includes(MON_NUMERO);
        let userChat = await Chat.findOne({ sender }) || new Chat({ sender, history: [] });

        const systemPrompt = `Tu es Denji de Chainsaw Man. ${isOwner ? "Tu parles à ton Maître. Sois fidèle." : "Tu parles à un inconnu. Sois impoli."}`;

        const response = await axios.post(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`, {
            contents: [
                { role: "user", parts: [{ text: systemPrompt }] },
                ...userChat.history,
                { role: "user", parts: [{ text: text }] }
            ]
        });

        const reply = response.data.candidates[0].content.parts[0].text;
        const sticker = isOwner ? STICKER_MAITRE : STICKER_INCONNU;

        userChat.history.push({ role: "user", parts: [{ text: text }] }, { role: "model", parts: [{ text: reply }] });
        if (userChat.history.length > 10) userChat.history.shift();
        await userChat.save();

        res.json({ 
            status: true, 
            content: { 
                message: reply, 
                sticker: sticker 
            } 
        });
    } catch (e) {
        console.error("Erreur détaillée:", e.response ? e.response.data : e.message);
        res.json
