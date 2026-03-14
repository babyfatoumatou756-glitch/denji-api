const express = require('express');
const axios = require('axios');
const mongoose = require('mongoose');
const app = express();

// Render donne le port automatiquement via process.env.PORT
const PORT = process.env.PORT || 3000;

const GEMINI_KEY = process.env.GEMINI_KEY; 
const MON_NUMERO = "22395064497";
const MONGO_URI = "mongodb+srv://denji-api:denji1234@cluster0.czgcbse.mongodb.net/denjiDB?retryWrites=true&w=majority";

const STICKER_MAITRE = "https://i.ibb.co/M55Bj6pV/temp.jpg"; 
const STICKER_INCONNU = "https://i.ibb.co/8ncS99Tf/temp.jpg";

// Connexion sans options obsolètes pour éviter les warnings
mongoose.connect(MONGO_URI)
    .then(() => console.log("Mémoire OK"))
    .catch(err => console.log("Erreur Mongo:", err.message));

const Chat = mongoose.model('ChatDenji', new mongoose.Schema({
    sender: String,
    history: [{ role: String, parts: [{ text: String }] }]
}));

app.get('/', (req, res) => res.send("Denji est vivant !"));

app.get('/api/denji', async (req, res) => {
    const { text, sender } = req.query;
    if (!text || !sender) return res.json({ status: false, error: "Manque text ou sender" });
    if (!GEMINI_KEY) return res.json({ status: false, error: "Clé API manquante sur Render" });

    try {
        const isOwner = sender.includes(MON_NUMERO);
        let userChat = await Chat.findOne({ sender }) || new Chat({ sender, history: [] });

        const response = await axios.post(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`, {
            contents: [
                { role: "user", parts: [{ text: `Tu es Denji. ${isOwner ? "Parle à ton Maître." : "Sois impoli."}` }] },
                ...userChat.history,
                { role: "user", parts: [{ text: text }] }
            ]
        });

        const reply = response.data.candidates[0].content.parts[0].text;
        userChat.history.push({ role: "user", parts: [{ text: text }] }, { role: "model", parts: [{ text: reply }] });
        if (userChat.history.length > 10) userChat.history.shift();
        await userChat.save();

        res.json({ status: true, content: { message: reply, sticker: isOwner ? STICKER_MAITRE : STICKER_INCONNU } });
    } catch (e) {
        res.json({ status: false, error: "Erreur" });
    }
});

// IMPORTANT : On écoute sur 0.0.0.0 pour Render
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Serveur en ligne sur le port ${PORT}`);
});
