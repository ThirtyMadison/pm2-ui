// pages/api/pm2/group-actions.js
import pm2 from 'pm2';

export default function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
        return;
    }

    const {groupName, action, groupApps} = req.body;
    if (!groupApps || !groupApps.length) {
        res.status(404).send(`No processes found for group ${groupName}`);
        return;
    }

    const validActions = ['restart', 'stop', 'start', 'delete'];
    if (!validActions.includes(action)) {
        res.status(400).send('Invalid action');
        return;
    }

    pm2.connect((err) => {
        if (err) {
            console.error('PM2 connect error:', err);
            res.status(500).send('Could not connect to PM2');
            return;
        }

        // Execute action for each process in the group
        let completedActions = 0;
        let errors = [];

        groupApps.forEach(app => {
            pm2[action](app.name, (err) => {
                completedActions++;

                if (err) {
                    errors.push(`Failed to ${action} ${app.name}: ${err.message}`);
                }

                // Check if all actions are completed
                if (completedActions === groupApps.length) {
                    pm2.disconnect();

                    if (errors.length > 0) {
                        res.status(500).json({
                            message: `Some actions failed for group ${groupName}`,
                            errors: errors
                        });
                    } else {
                        res.status(200).json({
                            message: `Successfully ${action}ed all processes in group ${groupName}`,
                            processCount: groupApps.length
                        });
                    }
                }
            });
        });
    });
}