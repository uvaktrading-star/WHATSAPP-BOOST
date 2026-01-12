import mongoose from 'mongoose';

if (!mongoose.connections[0].readyState) {
    mongoose.connect(process.env.MONGODB_URI);
}

const Group = mongoose.models.Group || mongoose.model('Group', new mongoose.Schema({
    name: String,
    link: String,
    budget: Number,
    owner: String,
    joinedUsers: { type: [String], default: [] },
    createdAt: { type: Date, default: Date.now }
}));

export default async function handler(req, res) {
    if (req.method !== 'GET') return res.status(405).send('Method not allowed');

    try {
        const { phone } = req.query;

        let query = {};
        
        if (phone) {
            query = { 
                $and: [
                    // 1. තමන් දැනටමත් ජොයින් වෙලා නැති ලින්ක්ස් වෙන්න ඕනේ
                    { joinedUsers: { $ne: String(phone) } },
                    
                    // 2. තමන් අයිතිකාරයා (Owner) නොවන ලින්ක්ස් වෙන්න ඕනේ
                    { owner: { $ne: String(phone) } }
                ]
            };
        }

        const links = await Group.find(query).sort({ createdAt: -1 });

        res.json({ success: true, links });
    } catch (err) {
        console.error("Fetch links error:", err);
        res.status(500).json({ success: false, message: "Error fetching links" });
    }
}
