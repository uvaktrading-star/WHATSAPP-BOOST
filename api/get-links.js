import mongoose from 'mongoose';

if (!mongoose.connections[0].readyState) {
    mongoose.connect(process.env.MONGODB_URI);
}

// 1. Schema එකට verificationCode ෆීල්ඩ් එක එකතු කළා (Security එකට මේක අවශ්‍යයි)
const GroupSchema = new mongoose.Schema({
    name: String,
    link: String,
    budget: Number,
    owner: String,
    tags: { type: [String], default: [] },
    type: { type: String, enum: ['group', 'channel'] },
    verificationCode: String, // මෙතනටත් එකතු කළා
    joinedUsers: { type: [String], default: [] },
    createdAt: { type: Date, default: Date.now }
});

const Group = mongoose.models.Group || mongoose.model('Group', GroupSchema);

export default async function handler(req, res) {
    if (req.method !== 'GET') return res.status(405).send('Method not allowed');

    try {
        const { phone, page = 1, search = "", tab = "group" } = req.query;
        const limit = 10;
        const skip = (parseInt(page) - 1) * limit;

        // මූලික ෆිල්ටර්
        let query = {
            joinedUsers: { $ne: String(phone) },
            owner: { $ne: String(phone) },
            type: tab,
            budget: { $gt: 0 } // බජට් එක ඉවර වෙච්ච ලින්ක් පෙන්වන්න එපා
        };

        // සර්ච් එකක් තිබේ නම්
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { tags: { $in: [new RegExp(search, 'i')] } }
            ];
        }

        // 2. මෙතනදී .select('-verificationCode') දාලා තියෙන්නේ ආරක්ෂාවට. 
        // එතකොට Frontend එකට මේ කෝඩ් එක යන්නේ නැහැ.
        const links = await Group.find(query)
            .select('-verificationCode') 
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const totalLinks = await Group.countDocuments(query);
        const totalPages = Math.ceil(totalLinks / limit);

        res.json({ 
            success: true, 
            links, 
            totalPages, 
            currentPage: parseInt(page) 
        });

    } catch (err) {
        console.error("Fetch links error:", err);
        res.status(500).json({ success: false, message: "Error fetching links" });
    }
}
