import mongoose from 'mongoose';

if (!mongoose.connections[0].readyState) {
    mongoose.connect(process.env.MONGODB_URI);
}

const Group = mongoose.models.Group || mongoose.model('Group', new mongoose.Schema({
    name: String, link: String, budget: Number, owner: String, createdAt: Date
}));

export default async function handler(req, res) {
    const { phone, action, id } = req.query;

    try {
        // ලින්ක් එකක් මැකීම (Delete Action)
        if (req.method === 'DELETE' || action === 'delete') {
            const targetId = id || req.body.id;
            await Group.findByIdAndDelete(targetId);
            return res.status(200).json({ success: true, message: "Link deleted!" });
        }

        // යූසර්ගේ ලින්ක්ස් ටික ලබාගැනීම (GET Action)
        if (req.method === 'GET') {
            const links = await Group.find({ owner: String(phone) }).sort({ createdAt: -1 });
            return res.status(200).json({ success: true, links });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error" });
    }
}
