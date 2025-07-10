import { execSync } from 'child_process';

export default function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
    return;
  }

  const { action, services = [], flags = {} } = req.body;

  const validActions = [
    'download-db',
    'setup', 
    'pull-latest',
    'update-env-files',
    'build',
    'migrate',
    'refresh-env',
    'start'
  ];

  if (!validActions.includes(action)) {
    res.status(400).json({ 
      success: false, 
      message: 'Invalid action',
      validActions 
    });
    return;
  }

  try {
    // Build the command string
    let command = `eng local ${action}`;
    
    // Add services for download-db command
    if (action === 'download-db' && services.length > 0) {
      command += ` ${services.join(' ')}`;
    }
    
    // Add optional flags
    const flagMappings = {
      'skipDb': '--skip-db',
      'skipDbDumps': '--skip-db-dumps',
      'noParallel': '--no-parallel',
      'only': '--only',
      'exclude': '--exclude'
    };
    
    Object.entries(flags).forEach(([key, value]) => {
      if (flagMappings[key]) {
        if (key === 'only' || key === 'exclude') {
          // These flags take a service name as argument
          if (value && typeof value === 'string') {
            command += ` ${flagMappings[key]} ${value}`;
          }
        } else if (value === true) {
          // Boolean flags
          command += ` ${flagMappings[key]}`;
        }
      }
    });

    console.log('Executing command:', command);
    
    const result = execSync(command, { 
      encoding: 'utf8',
      timeout: 300000 // 5 minute timeout for longer operations
    });
    
    res.status(200).json({ 
      success: true, 
      message: `Successfully executed: ${command}`,
      output: result 
    });
  } catch (error) {
    console.error('Error executing eng local command:', error);
    res.status(500).json({ 
      success: false, 
      message: `Failed to execute: eng local ${action}`,
      error: error.message 
    });
  }
}