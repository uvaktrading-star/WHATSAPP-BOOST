import mongoose from 'mongoose';

if (!mongoose.connections[0].readyState) {
    mongoose.connect(process.env.MONGODB_URI);
}

const GroupSchema = new mongoose.Schema({
    name: String,
    link: String,
    budget: Number,
    owner: String,
    tags: { type: [String], default: [] },
    type: { type: String, enum: ['group', 'channel'] }, // මේක අනිවාර්යයි
    joinedUsers: { type: [String], default: [] },
    createdAt: { type: Date, default: Date.now }
});

const Group = mongoose.models.Group || mongoose.model('Group', GroupSchema);

export default async function handler(req, res) {
    if (req.method !== 'GET') return res.status(405).send('Method not allowed');

    try {
        const { phone, page = 1, search = "", tab = "group" } = req.query; // 'tab' එකත් ගමු
        const limit = 10;
        const skip = (parseInt(page) - 1) * limit;

        // 1. මූලික ෆිල්ටර් (තමන්ගේ නොවන, ජොයින් නොවූ, සහ අදාළ ටැබ් එකට ගැලපෙන ඒවා)
        let query = {
            joinedUsers: { $ne: String(phone) },
            owner: { $ne: String(phone) },
            type: tab // 'group' හෝ 'channel' අනුව filter වෙනවා
        };

        // 2. සර්ච් එකක් තිබේ නම්
        if (search) {
            query.$and = [
                { joinedUsers: { $ne: String(phone) } },
                { owner: { $ne: String(phone) } },
                { type: tab },
                {
                    $or: [
                        { name: { $regex: search, $options: 'i' } },
                        { tags: { $in: [new RegExp(search, 'i')] } }
                    ]
                }
            ];
        }

        const links = await Group.find(query)
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
