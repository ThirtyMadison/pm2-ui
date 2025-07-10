import { spawn } from 'child_process';
import os from 'os';
import { LOCAL_SERVICE_NAMES } from '../../../utils/service.js';

export default function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
    return;
  }

  const cwd = process.env.SERVICES_DIR?.length ? `${os.homedir()}${process.env.SERVICES_DIR}` : process.env.HOME;
  const child = spawn('eng', ['local', 'status'], {
    stdio: ['pipe', 'pipe', 'pipe'],
    shell: true,
    cwd,
    env: {
      ...process.env,
      PATH: process.env.PATH,
      HOME: process.env.HOME,
      USER: process.env.USER,
      COLUMNS: '400',
    }
  });

  let stdout = '';
  let stderr = '';

  child.stdout.on('data', (data) => {
    stdout += data.toString();
  });

  child.stderr.on('data', (data) => {
    stderr += data.toString();
  });

  child.on('close', (code) => {
  
    if (code === 0) {
      // Parse the status output
      const parsedStatus = parseEngStatus(stdout);
      res.status(200).json({
        success: true,
        data: parsedStatus,
        rawOutput: stdout
      });
    } else {
      res.status(500).json({
        success: false,
        error: `Command failed with exit code ${code}`,
        stderr: stderr,
        rawOutput: stdout
      });
    }
  });

  child.on('error', (error) => {
    console.error('Error executing eng local status:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  });
}

function parseEngStatus(output) {
  const lines = output.split('\n');
  const services = [];
  
  // Skip the header lines and empty lines
  let dataLines = lines.filter(line => {
    const trimmed = line.trim();
    return trimmed.length > 0 && 
           !trimmed.startsWith('SERVICE') && 
           !trimmed.startsWith('---') &&
           !trimmed.startsWith('MESSAGE');
  });

  // Group lines by service (look for lines that start with a service name)
  const serviceGroups = [];
  let currentGroup = null;

  for (const line of dataLines) {
    const trimmedLine = line.trim();
    
    // Check if this is an infrastructure service
    const isInfrastructureService = ['redis', 'rabbitmq', 'zookeeper', 'kafka'].some(infra => 
      trimmedLine.startsWith(infra)
    );
    
    if (isInfrastructureService) {
      // Infrastructure services are on single lines
      // Look for uptime pattern that might be split across lines
      const uptimeMatch = trimmedLine.match(/(\d+ days?, \d+:\d+:\d+ hrs?)/);
      let uptime = uptimeMatch ? uptimeMatch[1] : '';
      
      // If uptime is incomplete, look for it in the next few lines
      if (!uptime && trimmedLine.includes('days')) {
        // Try to find the complete uptime pattern
        const uptimePattern = /(\d+ days?, \d+:\d+:\d+)/;
        const match = trimmedLine.match(uptimePattern);
        if (match) {
          uptime = match[1] + ' hrs';
        }
      }
      
      // Extract port - look for a 4-digit number that's likely a port
      const portMatch = trimmedLine.match(/\b(\d{4})\b/);
      const port = portMatch ? portMatch[1] : '';
      
      const serviceName = trimmedLine.split(/\s+/)[0];
      
      services.push({
        name: matchServiceName(serviceName),
        status: 'online',
        health: 'healthy',
        commitMessage: '',
        sha: '',
        consumers: '',
        jobs: '',
        uptime: uptime,
        port: port,
        url: '',
        details: [],
        isInfrastructure: true
      });
    } else {
      // For regular services, look for lines that start with a service name
      const serviceNameMatch = trimmedLine.match(/^([a-zA-Z][a-zA-Z0-9-]+)/);
      
      if (serviceNameMatch) {
        // This is a new service, save the previous group and start a new one
        if (currentGroup) {
          serviceGroups.push(currentGroup);
        }
        currentGroup = {
          serviceName: matchServiceName(serviceNameMatch[1]),
          lines: [trimmedLine]
        };
      } else if (currentGroup) {
        // This is a continuation line for the current service
        currentGroup.lines.push(trimmedLine);
      }
    }
  }
  
  // Add the last group
  if (currentGroup) {
    serviceGroups.push(currentGroup);
  }

  // Parse each service group
  for (const group of serviceGroups) {
    const allLines = group.lines.join(' ');
    
    // Find the SHA hash
    const shaMatch = allLines.match(/\b([a-f0-9]{7,8})\b/);
    
    if (shaMatch) {
      const sha = shaMatch[1];
      const shaIndex = allLines.indexOf(sha);
      
      // Extract everything after SHA
      const afterSha = allLines.substring(shaIndex + sha.length).trim();
      const afterShaParts = afterSha.split(/\s+/);
      
      // Parse the parts after SHA: HEALTH CONSUMERS JOBS UPTIME PORT URL
      const health = afterShaParts[0] || 'unknown';
      
      // Only set consumers/jobs if they are valid health values
      let consumers = '';
      let jobs = '';
      
      if (afterShaParts[1] && ['healthy', 'unhealthy'].includes(afterShaParts[1])) {
        consumers = afterShaParts[1];
      }
      
      if (afterShaParts[2] && ['healthy', 'unhealthy'].includes(afterShaParts[2])) {
        jobs = afterShaParts[2];
      }
      
      // Extract uptime - look for pattern like "0 days, 3:16:47 hrs"
      let uptime = '';
      let port = '';
      let url = '';
      
      // Find uptime pattern in the full line
      const uptimeMatch = allLines.match(/(\d+ days?, \d+:\d+:\d+ hrs?)/);
      if (uptimeMatch) {
        uptime = uptimeMatch[1];
      }
      
      // Extract port - look for a 4-digit number
      const portMatch = allLines.match(/\b(\d{4})\b/);
      if (portMatch) {
        port = portMatch[1];
      }
      
      // Extract URL - look for http/https links
      const urlMatch = allLines.match(/(https?:\/\/[^\s]+)/);
      if (urlMatch) {
        url = urlMatch[1];
      }
      
      // Extract commit message (everything between service name and SHA)
      const beforeSha = allLines.substring(group.serviceName.length, shaIndex).trim();
      
      // Determine status based on health
      let status = 'unknown';
      if (health === 'healthy') {
        status = 'online';
      } else if (health === 'unhealthy') {
        status = 'error';
      } else if (health === 'stopped' || health === 'offline') {
        status = 'stopped';
      }
      
      services.push({
        name: group.serviceName,
        status: status,
        health: health,
        consumers: consumers,
        jobs: jobs,
        commitMessage: beforeSha,
        sha: sha,
        uptime: uptime,
        port: port,
        url: url,
        details: [],
        isInfrastructure: false
      });
    }
  }

  return {
    services,
    summary: {
      total: services.length,
      online: services.filter(s => s.status === 'online').length,
      stopped: services.filter(s => s.status === 'stopped').length,
      error: services.filter(s => s.status === 'error').length,
      unknown: services.filter(s => s.status === 'unknown').length
    }
  };
}

// Function to match truncated service names to full names
function matchServiceName(truncatedName) {
  // Remove trailing dots and clean up
  const cleanName = truncatedName.replace(/…$/, '').replace(/…$/, '');
  
  // Find the best match
  for (const fullName of LOCAL_SERVICE_NAMES) {
    if (fullName.startsWith(cleanName)) {
      return fullName;
    }
  }
  
  // If no match found, return the original
  return truncatedName;
} 