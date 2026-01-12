import mongoose from 'mongoose';

if (!mongoose.connections[0].readyState) {
    mongoose.connect(process.env.MONGODB_URI);
}

// Group Schema එක (joinedUsers එකත් එක්කම මෙතන තියෙන්න ඕනේ)
const GroupSchema = new mongoose.Schema({
    name: String,
    link: String,
    budget: Number,
    owner: String,
    joinedUsers: { type: [String], default: [] }, // මේක අනිවාර්යයෙන්ම ඕනේ
    createdAt: { type: Date, default: Date.now }
});

const Group = mongoose.models.Group || mongoose.model('Group', GroupSchema);

export default async function handler(req, res) {
    if (req.method !== 'GET') return res.status(405).send('Method not allowed');

    try {
        // Frontend එකෙන් query එකක් විදිහට එවපු phone number එක ගන්නවා
        const { phone } = req.query;

        let query = {};
        if (phone) {
            // යූසර් දැනටමත් ජොයින් වෙලා නැති ($ne = Not Equal) ලින්ක්ස් විතරක් හොයනවා
            query = { joinedUsers: { $ne: String(phone) } };
        }

        const links = await Group.find(query).sort({ createdAt: -1 });

        res.json({ success: true, links });
    } catch (err) {
        console.error("Fetch links error:", err);
        res.status(500).json({ success: false, message: "Error fetching links" });
    }
}
