const mongoose = require('mongoose');

// DB Connection
if (!mongoose.connections[0].readyState) {
    mongoose.connect(process.env.MONGODB_URI);
}

// Group Schema (දත්ත ගබඩා වන හැටි)
const GroupSchema = new mongoose.Schema({
    name: { type: String, required: true },
    link: { type: String, required: true },
    budget: { type: Number, required: true },
    owner: { type: String, required: true }, // ලින්ක් එක දැම්ම කෙනාගේ phone number එක
    clicks: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
});

const Group = mongoose.models.Group || mongoose.model('Group', GroupSchema);
const User = mongoose.models.User || mongoose.model('User', new mongoose.Schema({
    phone: String,
    coins: Number
}));

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });

    try {
        const { name, link, budget, phone } = req.body;

        // 1. යූසර්ව හොයාගන්න
        const user = await User.findOne({ phone });
        if (!user) return res.status(404).json({ success: false, message: "User not found!" });

        // 2. කොයින්ස් මදිද බලන්න
        if (user.coins < budget) {
            return res.status(400).json({ success: false, message: "ඔබ සතුව ප්‍රමාණවත් Coins නොමැත!" });
        }

        // 3. යූසර්ගේ කොයින්ස් අඩු කරන්න
        user.coins -= budget;
        await user.save();

        // 4. අලුත් ලින්ක් එක DB එකට සේව් කරන්න
        const newGroup = new Group({
            name,
            link,
            budget,
            owner: phone
        });
        await newGroup.save();

        return res.status(200).json({ success: true, message: "Group එක සාර්ථකව ඇතුළත් කළා!" });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: "Server Error!" });
    }
}
