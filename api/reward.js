import mongoose from 'mongoose';

// MongoDB Connection
if (!mongoose.connections[0].readyState) {
    mongoose.connect(process.env.MONGODB_URI);
}

// User Model එක හදනවා (දැනටමත් තියෙනවා නම් ඒකම ගන්නවා)
const UserSchema = new mongoose.Schema({
    phone: String,
    coins: { type: Number, default: 0 }
});

const User = mongoose.models.User || mongoose.model('User', UserSchema);

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });

    const { phone } = req.body;

    if (!phone) {
        return res.status(400).json({ success: false, message: "Phone number required" });
    }

    try {
        // 1. යූසර්ව හොයාගන්නවා (Phone number එක String එකක් විදිහටම චෙක් කරනවා)
        const user = await User.findOne({ phone: String(phone) });

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        // 2. කොයින් 1ක් එකතු කරනවා
        user.coins = (user.coins || 0) + 1;
        await user.save();

        // 3. සාර්ථකයි නම් අලුත් Balance එක යවනවා
        return res.status(200).json({ 
            success: true, 
            newBalance: user.coins 
        });

    } catch (error) {
        console.error("Reward Error Details:", error);
        return res.status(500).json({ success: false, message: "Database Error", error: error.message });
    }
}
