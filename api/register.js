const mongoose = require('mongoose');

// MongoDB සම්බන්ධතාවය පරීක්ෂා කිරීම
if (!mongoose.connections[0].readyState) {
    mongoose.connect(process.env.MONGODB_URI);
}

// User Schema එක (Database එකේ දත්ත සේව් වෙන හැටි)
const UserSchema = new mongoose.Schema({
    phone: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    coins: { type: Number, default: 100 } // අලුත් යූසර් කෙනෙක්ට නොමිලේ කොයින් 100ක් දෙනවා
});

const User = mongoose.models.User || mongoose.model('User', UserSchema);

export default async function handler(req, res) {
    // POST රික්වෙස්ට් එකක් විතරයි බාර ගන්නේ
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        const { phone, password } = req.body;

        // 1. දැනටමත් මේ නම්බර් එකෙන් එකවුන්ට් එකක් තියෙනවද බලනවා
        const existingUser = await User.findOne({ phone });
        
        if (existingUser) {
            return res.status(400).json({ 
                success: false, 
                message: "මෙම අංකය දැනටමත් ලියාපදිංචි කර ඇත! කරුණාකර Login වන්න." 
            });
        }

        // 2. අලුත් යූසර් කෙනෙක්ව දත්ත ගබඩාවට එකතු කරනවා
        const newUser = new User({
            phone,
            password,
            coins: 0
        });

        await newUser.save();

        // 3. සාර්ථකයි නම් response එක යවනවා
        return res.status(200).json({ 
            success: true, 
            message: "ලියාපදිංචිය සාර්ථකයි!",
            coins: 100 
        });

    } catch (error) {
        console.error("Registration Error:", error);
        return res.status(500).json({ 
            success: false, 
            message: "සර්වර් එකේ දෝෂයකි. නැවත උත්සාහ කරන්න." 
        });
    }
}
