export default function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
        return;
    }

    const { pid } = req.body;
    if (!pid) {
        res.status(400).json({ success: false, message: 'No process ID provided' });
        return;
    }

    try {
        process.kill(pid);
        res.status(200).json({ success: true, message: 'Process terminated' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}
