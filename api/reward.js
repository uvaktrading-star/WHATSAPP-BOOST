const mongoose = require('mongoose');
if (!mongoose.connections[0].readyState) mongoose.connect(process.env.MONGODB_URI);

const User = mongoose.models.User;

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Method not allowed');
    const { phone } = req.body;
    try {
        const user = await User.findOne({ phone });
        if (!user) return res.status(404).json({ success: false });

        user.coins += 10; // Join වුණාම 1 Coin දෙනවා
        await user.save();
        res.json({ success: true, newBalance: user.coins });
    } catch (e) { res.status(500).send(); }
}
