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
    joinedUsers: { type: [String], default: [] }
}));

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });

    const { phone, linkId, startTime } = req.body; // startTime එක frontend එකෙන් එවනවා නම් වඩාත් ආරක්ෂිතයි

    if (!phone || !linkId) {
        return res.status(400).json({ success: false, message: "Missing data" });
    }

    try {
        // 1. අදාළ ලින්ක් එක සොයාගැනීම
        const group = await Group.findById(linkId);
        if (!group) {
            return res.status(404).json({ success: false, message: "Link expired or not found" });
        }

        // 2. Security Check: යූසර් දැනටමත් මේ ගෲප් එකට ජොයින් වෙලාද?
        if (group.joinedUsers && group.joinedUsers.includes(String(phone))) {
            return res.status(400).json({ success: false, message: "You have already joined this group!" });
        }

        // 3. කොයින්ස් ගන්නා යූසර්ව සොයාගැනීම
        const user = await User.findOne({ phone: String(phone) });
        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        // 4. (Optional) Time Verification
        // මෙතනදී ඇත්තටම සර්වර් එකේ logic එකෙන් යූසර්ව track කරන්න පුළුවන්. 
        // දැනට අපි frontend එකේ තත්පර 10 delay එක විශ්වාස කරලා reward එක දෙනවා.

        // 5. Reward එක දෙනවා සහ Budget එක අඩු කරනවා
        group.budget -= 1;
        
        // යූසර්ගේ පෝන් නම්බර් එක joinedUsers array එකට එකතු කරනවා
        if (!group.joinedUsers) group.joinedUsers = [];
        group.joinedUsers.push(String(phone));

        // 6. Budget එක 0 වුණොත් ලින්ක් එක මකනවා, නැත්නම් Save කරනවා
        if (group.budget <= 0) {
            await Group.findByIdAndDelete(linkId);
        } else {
            await group.save();
        }

        // 7. යූසර්ගේ Balance එක අප්ඩේට් කරනවා (+1 Coin)
        user.coins = (user.coins || 0) + 1;
        await user.save();

        return res.status(200).json({ 
            success: true, 
            newBalance: user.coins,
            message: "Success! 1 Coin added to your account."
        });

    } catch (error) {
        console.error("Reward Error:", error);
        return res.status(500).json({ success: false, message: "Server Error" });
    }
}
