import mongoose from 'mongoose';

// MongoDB Connection
const MONGODB_URI = "mongodb+srv://whatsapp-boost:akashkavindu12345@cluster0.ykghuog.mongodb.net/zanta_boost?retryWrites=true&w=majority";

const userSchema = new mongoose.Schema({
    phone: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    coins: { type: Number, default: 100 }
});

const User = mongoose.models.User || mongoose.model('User', userSchema);

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Method not allowed');

    try {
        if (mongoose.connection.readyState !== 1) {
            await mongoose.connect(MONGODB_URI);
        }

        const { phone, password } = req.body;
        let user = await User.findOne({ phone });

        if (!user) {
            // Register New User
            user = new User({ phone, password });
            await user.save();
            return res.status(200).json({ success: true, message: "Registered!", coins: user.coins });
        } else {
            // Login Existing User
            if (user.password === password) {
                return res.status(200).json({ success: true, message: "Logged In!", coins: user.coins });
            } else {
                return res.status(401).json({ success: false, message: "Incorrect Password!" });
            }
        }
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}