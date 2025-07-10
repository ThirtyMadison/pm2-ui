import { spawn } from 'child_process';
import os from 'os';

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

  // Set up Server-Sent Events
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control'
  });

  // Build the command arguments
  const args = ['local', action];
  
  // Add services for download-db command
  if (action === 'download-db' && services.length > 0) {
    args.push(...services);
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
          args.push(flagMappings[key], value);
        }
      } else if (value === true) {
        // Boolean flags
        args.push(flagMappings[key]);
      }
    }
  });

  const cwd = `${os.homedir()}${process.env.SERVICES_DIR}`;
  
  // Build the full command - try to find eng command first
  const fullCommand = `eng ${args.join(' ')}`;
  
  console.log('Executing command:', fullCommand);
  console.log('Working directory:', cwd);
  console.log('Environment PATH:', process.env.PATH);

  // Send initial message
  res.write(`data: ${JSON.stringify({ 
    type: 'start', 
    message: `Starting command: eng ${args.join(' ')}`,
    workingDirectory: cwd
  })}\n\n`);

  // Send debug info
  res.write(`data: ${JSON.stringify({ 
    type: 'info', 
    data: `Searching for eng command...\n`
  })}\n\n`);

  // Spawn the process with proper context - use zsh to run the command
  const child = spawn('zsh', ['-c', fullCommand], {
    stdio: ['pipe', 'pipe', 'pipe'],
    shell: true,
    cwd,
    env: {
      ...process.env,
      // Preserve important environment variables
      PATH: process.env.PATH,
      HOME: process.env.HOME,
      USER: process.env.USER,
    }
  });

  // Handle stdout
  child.stdout.on('data', (data) => {
    const output = data.toString();
    res.write(`data: ${JSON.stringify({ 
      type: 'stdout', 
      data: output 
    })}\n\n`);
  });

  // Handle stderr
  child.stderr.on('data', (data) => {
    const output = data.toString();
    res.write(`data: ${JSON.stringify({ 
      type: 'stderr', 
      data: output 
    })}\n\n`);
  });

  // Handle process completion
  child.on('close', (code) => {
    console.log(`Command exited with code ${code}`);
    res.write(`data: ${JSON.stringify({ 
      type: 'end', 
      code: code,
      success: code === 0,
      message: code === 0 ? 'Command completed successfully' : `Command failed with exit code ${code}`
    })}\n\n`);
    res.end();
  });

  // Handle errors
  child.on('error', (error) => {
    console.error('Error executing command:', error);
    res.write(`data: ${JSON.stringify({ 
      type: 'error', 
      error: error.message 
    })}\n\n`);
    res.end();
  });

  // Handle client disconnect
  req.on('close', () => {
    console.log('Client disconnected, killing process');
    child.kill();
  });
}