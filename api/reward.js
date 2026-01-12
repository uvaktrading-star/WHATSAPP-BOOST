import mongoose from 'mongoose';

if (!mongoose.connections[0].readyState) {
    mongoose.connect(process.env.MONGODB_URI);
}

// User Model
const User = mongoose.models.User || mongoose.model('User', new mongoose.Schema({
    phone: String,
    coins: { type: Number, default: 0 }
}));

// Group Model (මෙතන joinedUsers එක අනිවාර්යයෙන්ම තියෙන්න ඕනේ)
const Group = mongoose.models.Group || mongoose.model('Group', new mongoose.Schema({
    name: String,
    link: String,
    budget: Number,
    owner: String,
    joinedUsers: { type: [String], default: [] } // ජොයින් වුණු අයගේ ලිස්ට් එක
}));

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });

    const { phone, linkId } = req.body;

    if (!phone || !linkId) {
        return res.status(400).json({ success: false, message: "Missing data" });
    }

    try {
        // 1. අදාළ ලින්ක් එක සොයාගැනීම
        const group = await Group.findById(linkId);
        if (!group) {
            return res.status(404).json({ success: false, message: "Link expired or not found" });
        }

        // 2. යූසර් දැනටමත් මේ ගෲප් එකට ජොයින් වෙලාද කියලා බලනවා (Security Check)
        if (group.joinedUsers && group.joinedUsers.includes(String(phone))) {
            return res.status(400).json({ success: false, message: "You have already joined this group!" });
        }

        // 3. කොයින්ස් ගන්නා යූසර්ව සොයාගැනීම
        const user = await User.findOne({ phone: String(phone) });
        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        // 4. Reward එක දෙනවා සහ Budget එක අඩු කරනවා
        group.budget -= 1;
        
        // යූසර්ගේ පෝන් නම්බර් එක joinedUsers array එකට එකතු කරනවා
        if (!group.joinedUsers) group.joinedUsers = [];
        group.joinedUsers.push(String(phone));

        // 5. Budget එක 0 වුණොත් ලින්ක් එක මකනවා, නැත්නම් Save කරනවා
        if (group.budget <= 0) {
            await Group.findByIdAndDelete(linkId);
        } else {
            await group.save();
        }

        // 6. යූසර්ගේ Balance එක අප්ඩේට් කරනවා
        user.coins = (user.coins || 0) + 1;
        await user.save();

        return res.status(200).json({ 
            success: true, 
            newBalance: user.coins,
            message: "Reward added and user tracked"
        });

    } catch (error) {
        console.error("Reward Error:", error);
        return res.status(500).json({ success: false, message: "Server Error" });
    }
}
