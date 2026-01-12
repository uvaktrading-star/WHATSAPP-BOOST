import mongoose from 'mongoose';

// MongoDB සම්බන්ධතාවය
if (!mongoose.connections[0].readyState) {
    mongoose.connect(process.env.MONGODB_URI);
}

// User Schema
const UserSchema = new mongoose.Schema({
    phone: { type: String, required: true },
    password: { type: String, required: true },
    coins: { type: Number, default: 100 }
});

const User = mongoose.models.User || mongoose.model('User', UserSchema);

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        const { phone, password, autoLogin } = req.body;

        // 1. මුලින්ම යූසර්ව හොයාගන්නවා
        const user = await User.findOne({ phone });

        if (!user) {
            return res.status(400).json({ 
                success: false, 
                message: "මෙම අංකය ලියාපදිංචි කර නැත!" 
            });
        }

        // 2. Dashboard එකෙන් එන Auto-Login එකක්ද බලනවා
        if (autoLogin) {
            return res.status(200).json({ 
                success: true, 
                coins: user.coins 
            });
        }

        // 3. සාමාන්‍ය Login එකක් නම් Password චෙක් කරනවා
        if (user.password !== password) {
            return res.status(400).json({ 
                success: false, 
                message: "මුරපදය (Password) වැරදියි!" 
            });
        }

        // 4. සාර්ථකයි නම් Coins ගාණ යවනවා
        return res.status(200).json({ 
            success: true, 
            message: "සාර්ථකව ඇතුළු විය!",
            coins: user.coins 
        });

    } catch (error) {
        console.error("Login Error:", error);
        return res.status(500).json({ 
            success: false, 
            message: "සර්වර් දෝෂයකි." 
        });
    }
}
