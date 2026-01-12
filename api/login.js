const mongoose = require('mongoose');

// MongoDB සම්බන්ධතාවය පරීක්ෂා කිරීම
if (!mongoose.connections[0].readyState) {
    mongoose.connect(process.env.MONGODB_URI);
}

// User Schema එක (Register එකේ තියෙන එකම වෙන්න ඕනේ)
const UserSchema = new mongoose.Schema({
    phone: { type: String, required: true },
    password: { type: String, required: true },
    coins: { type: Number, default: 100 }
});

const User = mongoose.models.User || mongoose.model('User', UserSchema);

export default async function handler(req, res) {
    // POST රික්වෙස්ට් එකක් විතරයි බාර ගන්නේ
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        const { phone, password } = req.body;

        // 1. මේ නම්බර් එකෙන් යූසර් කෙනෙක් ඉන්නවද බලනවා
        const user = await User.findOne({ phone });

        if (!user) {
            return res.status(400).json({ 
                success: false, 
                message: "මෙම අංකය ලියාපදිංචි කර නැත! කරුණාකර Register වන්න." 
            });
        }

        // 2. Password එක ගැලපෙනවද බලනවා
        if (user.password !== password) {
            return res.status(400).json({ 
                success: false, 
                message: "මුරපදය (Password) වැරදියි!" 
            });
        }

        // 3. ලොගින් එක සාර්ථකයි නම් Coins ගාණත් එක්කම response එක යවනවා
        return res.status(200).json({ 
            success: true, 
            message: "සාර්ථකව ඇතුළු විය!",
            coins: user.coins 
        });

    } catch (error) {
        console.error("Login Error:", error);
        return res.status(500).json({ 
            success: false, 
            message: "සර්වර් එකේ දෝෂයකි. නැවත උත්සාහ කරන්න." 
        });
    }
}
