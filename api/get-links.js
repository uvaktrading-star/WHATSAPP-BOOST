const mongoose = require('mongoose');

if (!mongoose.connections[0].readyState) {
    mongoose.connect(process.env.MONGODB_URI);
}

const GroupSchema = new mongoose.Schema({
    name: String,
    link: String,
    budget: Number,
    owner: String,
    createdAt: { type: Date, default: Date.now }
});

const Group = mongoose.models.Group || mongoose.model('Group', GroupSchema);

export default async function handler(req, res) {
    if (req.method !== 'GET') return res.status(405).send('Method not allowed');

    try {
        // අලුතින්ම ඇඩ් කරපු ලින්ක් උඩට එන විදිහට ගන්නවා
        const links = await Group.find().sort({ createdAt: -1 });
        res.json({ success: true, links });
    } catch (err) {
        res.status(500).json({ success: false, message: "Error fetching links" });
    }
}
