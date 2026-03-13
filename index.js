const express = require('express');
const axios = require('axios');
const mongoose = require('mongoose');
const app = express();
const PORT = process.env.PORT || 3000;

// --- CONFIGURATION ---
const GEMINI_KEY = "AIzaSyAQwPv-g4W-s5iWYAaxtoJ5gjzI2lBC94o";
const MON_NUMERO = "22395064497";
const MONGO_URI = "mongodb+srv://denji-api:denji1234@cluster0.czgcbse.mongodb.net/denjiDB?retryWrites=true&w=majority";

// URL DES STICKERS (Tu peux changer ces liens par d'autres images .webp)
const STICKER_MAITRE = "https://telegra.ph/file/79966607e33528b148f34.png"; // Denji content
const STICKER_INCONNU = "https://telegra.ph/file/0c975191986927d2c3e41.png"; // Denji énervé

mongoose.connect(MONGO_URI).then(() => console.log("Mémoire de Denji OK !"));

const ChatSchema = new mongoose.Schema({
    sender: String,
    history: [{ role: String, parts: [{ text: String }] }]
});
const Chat = mongoose.model('ChatDenji', ChatSchema);

// --- CETTE PARTIE RÉPARE LE "NOT FOUND" ---
app.get('/', (req, res) => {
    res.send("<h1>Serveur Denji Actif !</h1><p>Pour tester, ajoute <b>/api/denji?text=Salut&sender=123</b> à la fin de l'URL.</p>");
});

// --- L'API DENJI ---
app.get('/api/denji', async (req, res) => {
    const { text, sender } = req.query;
    if (!text || !sender) return res.json({ status: false, error: "Données manquantes" });

    try {
        const isOwner = sender.includes(MON_NUMERO);
        let userChat = await Chat.findOne({ sender }) || new Chat({ sender, history: [] });

        const systemPrompt = `Tu es Denji de Chainsaw Man. ${isOwner ? "Tu parles à ton Maître. Sois fidèle." : "Tu parles à un inconnu. Sois impoli."}`;

        const response = await axios.post(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`, {
            contents: [{ role: "user", parts: [{ text: systemPrompt }]}, ...userChat.history, { role: "user", parts: [{ text: text }]}]
        });

        const reply = response.data.candidates[0].content.parts[0].text;
        const sticker = isOwner ? STICKER_MAITRE : STICKER_INCONNU;

        // Sauvegarde mémoire
        userChat.history.push({ role: "user", parts: [{ text: text }] }, { role: "model", parts: [{ text: reply }] });
        if (userChat.history.length > 10) userChat.history.shift();
        await userChat.save();

        // Envoi de la réponse JSON
        res.json({ 
            status: true, 
            content: { 
                message: reply, 
                sticker: sticker 
            } 
        });
    } catch (e) {
        res.json({ status: false, error: "Erreur Gemini" });
    }
});

app.listen(PORT, () => console.log("Prêt !"));
