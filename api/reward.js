import mongoose from 'mongoose';

if (!mongoose.connections[0].readyState) {
    mongoose.connect(process.env.MONGODB_URI);
}

// Models නිර්වචනය (දැනටමත් තිබේ නම් ඒවා භාවිතා කරයි)
const User = mongoose.models.User || mongoose.model('User', new mongoose.Schema({
    phone: String,
    coins: { type: Number, default: 0 }
}));

const Group = mongoose.models.Group || mongoose.model('Group', new mongoose.Schema({
    name: String,
    link: String,
    budget: Number,
    owner: String
}));

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });

    const { phone, linkId } = req.body; // Frontend එකෙන් phone එකයි linkId එකයි එවනවා

    if (!phone || !linkId) {
        return res.status(400).json({ success: false, message: "Missing data" });
    }

    try {
        // 1. කොයින්ස් ගන්නා යූසර්ව සොයාගැනීම
        const user = await User.findOne({ phone: String(phone) });
        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        // 2. අදාළ ලින්ක් එක සොයාගැනීම
        const group = await Group.findById(linkId);
        
        if (group) {
            // Budget එකෙන් 1ක් අඩු කරනවා
            group.budget -= 1;

            if (group.budget <= 0) {
                // Budget එක 0 වුණොත් ලින්ක් එක DB එකෙන් මකනවා
                await Group.findByIdAndDelete(linkId);
            } else {
                // නැත්නම් ඉතිරි Budget එක සේව් කරනවා
                await group.save();
            }

            // 3. යූසර්ට reward කොයින් එක දෙනවා
            user.coins = (user.coins || 0) + 1;
            await user.save();

            return res.status(200).json({ 
                success: true, 
                newBalance: user.coins,
                message: "Reward added and budget updated"
            });
        } else {
            return res.status(404).json({ success: false, message: "Link expired or not found" });
        }

    } catch (error) {
        console.error("Reward Error:", error);
        return res.status(500).json({ success: false, message: "Server Error" });
    }
}
