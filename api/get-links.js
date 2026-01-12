import mongoose from 'mongoose';

if (!mongoose.connections[0].readyState) {
    mongoose.connect(process.env.MONGODB_URI);
}

// Schema එකට tags ඇතුළත් කරමු
const GroupSchema = new mongoose.Schema({
    name: String,
    link: String,
    budget: Number,
    owner: String,
    tags: { type: [String], default: [] },
    joinedUsers: { type: [String], default: [] },
    createdAt: { type: Date, default: Date.now }
});

const Group = mongoose.models.Group || mongoose.model('Group', GroupSchema);

export default async function handler(req, res) {
    if (req.method !== 'GET') return res.status(405).send('Method not allowed');

    try {
        const { phone, page = 1, search = "" } = req.query;
        const limit = 10; // එක පිටුවක පෙන්වන උපරිම ලින්ක් ගණන
        const skip = (parseInt(page) - 1) * limit;

        // මූලික Query එක: තමන් ජොයින් වුණු හෝ තමන්ගේම ලින්ක්ස් අයින් කරනවා
        let query = {
            joinedUsers: { $ne: String(phone) },
            owner: { $ne: String(phone) }
        };

        // Search එකක් තිබේ නම් නම හෝ Tags අනුව ෆිල්ටර් කරනවා
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { tags: { $in: [new RegExp(search, 'i')] } }
            ];
        }

        // Pagination සහ Sorting සහිතව ලින්ක්ස් ලබා ගැනීම
        const links = await Group.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        // මුළු ලින්ක්ස් ගණන (පිටු ගණන හැදීමට)
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
