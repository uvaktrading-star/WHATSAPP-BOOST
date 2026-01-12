import mongoose from 'mongoose';

if (!mongoose.connections[0].readyState) {
    mongoose.connect(process.env.MONGODB_URI);
}

const GroupSchema = new mongoose.Schema({
    name: { type: String, required: true },
    link: { type: String, required: true },
    budget: { type: Number, required: true },
    owner: { type: String, required: true },
    tags: { type: [String], default: [] },
    type: { type: String, enum: ['group', 'channel'], required: true }, // 'group' හෝ 'channel' පමණි
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
        const { name, link, budget, phone, tags } = req.body;

        if (!name || !link || !budget || !phone) {
            return res.status(400).json({ success: false, message: "සියලුම තොරතුරු ඇතුළත් කරන්න!" });
        }

        // --- Link Validation Logic ---
        let linkType = '';
        const isWhatsappGroup = link.includes('chat.whatsapp.com/');
        const isWhatsappChannel = link.includes('whatsapp.com/channel/');

        if (isWhatsappGroup) {
            linkType = 'group';
        } else if (isWhatsappChannel) {
            linkType = 'channel';
        } else {
            // වැරදි ලින්ක් එකක් නම් මෙතනින් නවත්වනවා
            return res.status(400).json({ 
                success: false, 
                message: "වලංගු නොවන ලින්ක් එකකි. කරුණාකර නිවැරදි WhatsApp Group හෝ Channel ලින්ක් එකක් ලබා දෙන්න." 
            });
        }

        const user = await User.findOne({ phone: String(phone) });
        if (!user) return res.status(404).json({ success: false, message: "User not found!" });

        if (user.coins < budget) {
            return res.status(400).json({ success: false, message: "ඔබ සතුව ප්‍රමාණවත් Coins නොමැත!" });
        }

        let tagsArray = tags ? tags.split(',').map(tag => tag.trim().toLowerCase()) : [];

        // කොයින්ස් අඩු කිරීම
        user.coins -= budget;
        await user.save();

        // ඩේටාබේස් එකට සේව් කිරීම
        const newGroup = new Group({
            name,
            link,
            budget,
            owner: phone,
            tags: tagsArray,
            type: linkType, // මෙතනට 'group' හෝ 'channel' යනවා
            joinedUsers: [] 
        });
        await newGroup.save();

        return res.status(200).json({ 
            success: true, 
            message: `${linkType === 'group' ? 'Group' : 'Channel'} එක සාර්ථකව ඇතුළත් කළා!`,
            newBalance: user.coins 
        });

    } catch (error) {
        console.error("Add Link Error:", error);
        return res.status(500).json({ success: false, message: "Server Error!" });
    }
}
