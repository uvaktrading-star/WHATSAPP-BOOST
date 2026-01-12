import mongoose from 'mongoose';

if (!mongoose.connections[0].readyState) {
    mongoose.connect(process.env.MONGODB_URI);
}

// User Model
const User = mongoose.models.User || mongoose.model('User', new mongoose.Schema({
    phone: String,
    coins: { type: Number, default: 0 }
}));

// Group Model
const Group = mongoose.models.Group || mongoose.model('Group', new mongoose.Schema({
    name: String,
    link: String,
    budget: Number,
    owner: String,
    verificationCode: String,
    joinedUsers: { type: [String], default: [] }
}));

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });

    // 1. Frontend එකෙන් එවන දත්ත ලබා ගැනීම
    const { phone, linkId, userCode, isAdReward } = req.body; 

    try {
        // --- AD REWARD LOGIC (Smart Link සඳහා) ---
        if (isAdReward) {
            if (!phone) return res.status(400).json({ success: false, message: "Phone number required" });
            
            const user = await User.findOne({ phone: String(phone) });
            if (!user) return res.status(404).json({ success: false, message: "User not found" });

            user.coins = (user.coins || 0) + 1;
            await user.save();

            return res.status(200).json({ 
                success: true, 
                newBalance: user.coins,
                message: "Ad reward success!"
            });
        }

        // --- GROUP JOIN LOGIC (පරණ විදියටම) ---
        if (!phone || !linkId || !userCode) {
            return res.status(400).json({ success: false, message: "දත්ත අසම්පූර්ණයි!" });
        }

        // 2. අදාළ ලින්ක් එක සොයාගැනීම
        const group = await Group.findById(linkId);
        if (!group) {
            return res.status(404).json({ success: false, message: "මෙම ලින්ක් එක දැන් වලංගු නැත!" });
        }

        // 3. Verification Code එක චෙක් කිරීම
        if (group.verificationCode.trim().toLowerCase() !== userCode.trim().toLowerCase()) {
            return res.status(400).json({ 
                success: false, 
                message: "වැරදි මුරපදයක්! කරුණාකර නැවත උත්සාහ කරන්න." 
            });
        }

        // 4. Security Check
        if (group.joinedUsers && group.joinedUsers.includes(String(phone))) {
            return res.status(400).json({ success: false, message: "ඔබ දැනටමත් මෙයට සම්බන්ධ වී කොයින් ලබාගෙන ඇත!" });
        }

        // 5. කොයින්ස් ගන්නා යූසර්ව සොයාගැනීම
        const user = await User.findOne({ phone: String(phone) });
        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        // 6. Reward එක දෙනවා සහ Budget එක අඩු කරනවා
        group.budget -= 1;
        
        if (!group.joinedUsers) group.joinedUsers = [];
        group.joinedUsers.push(String(phone));

        // 7. Budget එක 0 වුණොත් මකනවා, නැත්නම් Save කරනවා
        if (group.budget <= 0) {
            await Group.findByIdAndDelete(linkId);
        } else {
            await group.save();
        }

        // 8. යූසර්ගේ Balance එකට +1 Coin එකතු කරනවා
        user.coins = (user.coins || 0) + 1;
        await user.save();

        return res.status(200).json({ 
            success: true, 
            newBalance: user.coins,
            message: "සාර්ථකයි! ඔබට කොයින් 1ක් එකතු වුණා."
        });

    } catch (error) {
        console.error("Reward Error:", error);
        return res.status(500).json({ success: false, message: "Server Error" });
    }
}
