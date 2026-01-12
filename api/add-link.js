import mongoose from 'mongoose';

// DB Connection
if (!mongoose.connections[0].readyState) {
    mongoose.connect(process.env.MONGODB_URI);
}

// Group Schema
const GroupSchema = new mongoose.Schema({
    name: { type: String, required: true },
    link: { type: String, required: true },
    budget: { type: Number, required: true },
    owner: { type: String, required: true },
    tags: { type: [String], default: [] }, // Tags එකතු කළා
    joinedUsers: { type: [String], default: [] },
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
        const { name, link, budget, phone, tags } = req.body; // Frontend එකෙන් tags එවනවා

        // 1. දත්ත තිබේදැයි බැලීම
        if (!name || !link || !budget || !phone) {
            return res.status(400).json({ success: false, message: "සියලුම තොරතුරු ඇතුළත් කරන්න!" });
        }

        // 2. යූසර්ව හොයාගන්න
        const user = await User.findOne({ phone: String(phone) });
        if (!user) return res.status(404).json({ success: false, message: "User not found!" });

        // 3. කොයින්ස් මදිද බලන්න
        if (user.coins < budget) {
            return res.status(400).json({ success: false, message: "ඔබ සතුව ප්‍රමාණවත් Coins නොමැත!" });
        }

        // 4. Tags සැකසීම (Comma වලින් වෙන් කර එවනවා නම් array එකක් කරනවා)
        let tagsArray = [];
        if (tags) {
            tagsArray = tags.split(',').map(tag => tag.trim().toLowerCase());
        }

        // 5. යූසර්ගේ කොයින්ස් අඩු කර සේව් කිරීම
        user.coins -= budget;
        await user.save();

        // 6. අලුත් ලින්ක් එක DB එකට සේව් කරන්න
        const newGroup = new Group({
            name,
            link,
            budget,
            owner: phone,
            tags: tagsArray, // Tags මෙතනදී සේව් වෙනවා
            joinedUsers: [] 
        });
        await newGroup.save();

        return res.status(200).json({ 
            success: true, 
            message: "සාර්ථකව ඇතුළත් කළා!",
            newBalance: user.coins 
        });

    } catch (error) {
        console.error("Add Link Error:", error);
        return res.status(500).json({ success: false, message: "Server Error!" });
    }
}
