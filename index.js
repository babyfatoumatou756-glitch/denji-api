const express = require('express');
const axios = require('axios');
const mongoose = require('mongoose');
const app = express();

const PORT = process.env.PORT || 3000;
const GEMINI_KEY = process.env.GEMINI_KEY; 
const MON_NUMERO = "22395064497";
const MONGO_URI = "mongodb+srv://denji-api:denji1234@cluster0.czgcbse.mongodb.net/denjiDB?retryWrites=true&w=majority";

const STICKER_MAITRE = "https://i.ibb.co/M55Bj6pV/temp.jpg"; 
const STICKER_INCONNU = "https://i.ibb.co/8ncS99Tf/temp.jpg";

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
    if (!GEMINI_KEY) return res.json({ status: false, error: "Clé API manquante dans Environment Render" });

    try {
        const isOwner = sender.includes(MON_NUMERO);
        let userChat = await Chat.findOne({ sender }) || new Chat({ sender, history: [] });

        const systemPrompt = `Tu es Denji de Chainsaw Man. ${isOwner ? "Parle à ton Maître avec loyauté." : "Sois vulgaire et impoli."}`;
        
        // J'AI CHANGÉ L'ADRESSE ICI (v1 au lieu de v1beta)
        const response = await axios.post(`https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`, {
            contents: [
                { role: "user", parts: [{ text: systemPrompt + " Ma question est : " + text }] }
            ]
        });

        if (!response.data.candidates || !response.data.candidates[0].content) {
            throw new Error("Réponse vide de Google");
        }

        const reply = response.data.candidates[0].content.parts[0].text;

        userChat.history.push({ role: "user", parts: [{ text: text }] }, { role: "model", parts: [{ text: reply }] });
        if (userChat.history.length > 10) userChat.history.shift();
        await userChat.save();

        res.json({ 
            status: true, 
            content: { 
                message: reply, 
                sticker: isOwner ? STICKER_MAITRE : STICKER_INCONNU 
            } 
        });

    } catch (e) {
        console.error("Détail Erreur:", e.response ? e.response.data : e.message);
        res.json({ 
            status: false, 
            error: "Erreur API", 
            message: e.response ? "Problème d'adresse Google" : e.message 
        });
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Serveur en ligne sur le port ${PORT}`);
});
