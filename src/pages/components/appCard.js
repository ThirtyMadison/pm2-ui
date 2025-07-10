import {
  faClock,
  faCube,
  faFilter,
  faMemory,
  faMicrochip,
  faPlayCircle,
  faRecycle,
  faSkull,
  faStop,
  faSyncAlt,
  faTerminal
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Popover, Switch } from '@headlessui/react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { LOCAL_SERVICE_NAMES } from '../../utils/service';

const AppCard = () => {
  const [apps, setApps] = useState([]);
  const [groupedApps, setGroupedApps] = useState({});
  const [filter, setFilter] = useState('');
  const [showOnline, setShowOnline] = useState(true);
  const [showError, setShowError] = useState(true);
  const [showStopped, setShowStopped] = useState(true);
  const [engStatus, setEngStatus] = useState(null);
  const [loadingEngStatus, setLoadingEngStatus] = useState(true);

  const toggleVisibility = (app) => {
    return (
      (showOnline && app.status === 'online') ||
      (showError && app.status === 'error') ||
      (showStopped && app.status === 'stopped')
    );
  };

  // Function to get the service name for grouping
  const getServiceName = (appName) => {
    // Check if the app name includes any of the service names
    for (const serviceName of LOCAL_SERVICE_NAMES) {
      if (appName.toLowerCase().includes(serviceName.toLowerCase())) {
        return serviceName;
      }
    }
    // If no match found, return the original app name
    return appName;
  };

  // Function to get eng status for a service
  const getEngStatusForService = (serviceName) => {
    if (!engStatus || !engStatus.services) return null;
    console.log('Looking for service:', serviceName);
    console.log('Available services:', engStatus.services.map(s => s.name));
    const found = engStatus.services.find(service => 
      service.name === serviceName || 
      serviceName.includes(service.name) ||
      service.name.includes(serviceName)
    );
    console.log('Found service:', found);
    return found;
  };

  useEffect(() => {
    async function fetchApps() {
      const res = await fetch('/api/pm2/apps');
      const data = await res.json();

      const grouped = data.reduce((acc, app) => {
        const serviceName = getServiceName(app.name);
        if (!acc[serviceName]) acc[serviceName] = [];
        acc[serviceName].push(app);
        return acc;
      }, {});
      setApps(data);
      setGroupedApps(grouped);
    }

    async function fetchEngStatus() {
      try {
        setLoadingEngStatus(true);
        const res = await fetch('/api/engToolkit/status');
        const data = await res.json();
        if (data.success) {
          setEngStatus(data.data);
          console.log(data.data);
        }
      } catch (error) {
        console.error('Failed to fetch eng status:', error);
      } finally {
        setLoadingEngStatus(false);
      }
    }

    // Initial fetch
    fetchApps();
    fetchEngStatus();

    // Set up intervals
    const pm2IntervalId = setInterval(() => {
      fetchApps();
    }, 5000); // PM2 data every 5 seconds

    const engIntervalId = setInterval(() => {
      fetchEngStatus();
    }, 120000); // Eng status every 2 minutes (120 seconds)

    return () => {
      clearInterval(pm2IntervalId);
      clearInterval(engIntervalId);
    };
  }, []);

  if (apps.length === 0) {
    return (
      <div className='text-center text-white bg-zinc-700 p-3 rounded-md select-none cursor-default mt-4'>
        No processes running
      </div>
    );
  }

  const handleFilterChange = (event) => {
    setFilter(event.target.value.toLowerCase());
  };

  const filteredGroupNames = Object.keys(groupedApps).filter((groupName) =>
    groupName.toLowerCase().includes(filter)
  ).sort((a, b) => {
    // Put infrastructure services at the bottom
    const aIsInfra = ['pm2-logrotate', 'redis', 'rabbitmq', 'zookeeper', 'kafka'].includes(a);
    const bIsInfra = ['pm2-logrotate', 'redis', 'rabbitmq', 'zookeeper', 'kafka'].includes(b);
    
    if (aIsInfra && !bIsInfra) return 1; // a goes after b
    if (!aIsInfra && bIsInfra) return -1; // a goes before b
    return a.localeCompare(b); // alphabetical for same type
  });

  const pm2AppAction = async (appName, action) => {
    try {
      const response = await fetch('/api/pm2/actions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ appName, action }),
      });

      if (!response.ok) {
        throw new Error('PM2 action failed');
      }

      const result = await response.json();
      toast.success(result.message); // Display success toast
    } catch (error) {
      console.error('Error performing action on app:', error);
      toast.error('Error performing action on app'); // Display error toast
    }
  };

  function getColorClass(value, thresholds) {
    if (value < thresholds.green) return 'text-green-500';
    if (value < thresholds.yellow) return 'text-yellow-500';
    if (value < thresholds.orange) return 'text-orange-500';
    return 'text-red-500';
  }

  const StatusSwitch = ({ label, isEnabled, onToggle }) => {
    return (
      <Switch.Group
        as='div'
        className='flex items-center w-full justify-between'
      >
        <Switch.Label as='span' className='pr-20'>
          {label}
        </Switch.Label>
        <Switch
          checked={isEnabled}
          onChange={onToggle}
          className={`${
            isEnabled ? 'bg-blue-600' : 'bg-gray-400'
          } relative inline-flex items-center h-6 rounded-full w-11 gap-4`}
        >
          <span
            className={`${
              isEnabled ? 'translate-x-6' : 'translate-x-1'
            } inline-block w-4 h-4 transform bg-white rounded-full`}
          />
        </Switch>
      </Switch.Group>
    );
  };

  const getGroupBackgroundColor = (apps) => {
    let onlineCount = 0;
    let offlineCount = 0;

    apps.forEach((app) => {
      if (app.status === 'online') {
        onlineCount += 1;
      } else {
        offlineCount += 1;
      }
    });

    // Simplified - always use neutral background
    return 'bg-zinc-800';
  };

  return (
    <>
      {/* Header with filters */}
      <div className='flex flex-col sm:flex-row justify-between mb-6 text-zinc-100 gap-4'>
        <div className='flex items-center gap-4'>
          <Popover className='relative'>
            <Popover.Button className='flex items-center gap-2 text-gray-100 bg-zinc-700 hover:bg-zinc-600 p-3 rounded-lg transition-colors'>
              <FontAwesomeIcon icon={faFilter} />
              <span>Filters</span>
            </Popover.Button>
            <Popover.Panel className='absolute z-10 mt-2'>
              <div className='bg-zinc-800 rounded-lg shadow-xl p-4 text-gray-100 flex flex-col gap-3 min-w-[200px] border border-zinc-600'>
                <StatusSwitch
                  label='Online'
                  isEnabled={showOnline}
                  onToggle={() => setShowOnline(!showOnline)}
                />
                <StatusSwitch
                  label='Error'
                  isEnabled={showError}
                  onToggle={() => setShowError(!showError)}
                />
                <StatusSwitch
                  label='Stopped'
                  isEnabled={showStopped}
                  onToggle={() => setShowStopped(!showStopped)}
                />
              </div>
            </Popover.Panel>
          </Popover>
          
          <div className='flex-1 max-w-md'>
            <input
              type='text'
              placeholder='Search services...'
              className='text-white p-3 w-full rounded-lg shadow-lg bg-zinc-700 border border-zinc-600 focus:border-blue-500 focus:outline-none transition-colors'
              value={filter}
              onChange={handleFilterChange}
            />
          </div>
        </div>
      </div>

      {/* Service Groups Grid */}
      <div className='grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-4 pb-6'>
        {filteredGroupNames.map((groupName) => {
          const visibleApps = groupedApps[groupName].filter(toggleVisibility);
          if (visibleApps.length === 0) return null;

          return (
            <div
              key={groupName}
              className={`rounded-lg shadow-md border overflow-hidden ${
                (() => {
                  const engService = getEngStatusForService(groupName);
                  if (engService) {
                    if (engService.isInfrastructure) {
                      return 'bg-zinc-800 border-zinc-700'; // Neutral for infrastructure
                    }
                    if (engService.health === 'unhealthy') return 'bg-red-900 border-red-600';
                  }
                  return 'bg-zinc-800 border-zinc-700';
                })()
              }`}
            >
              {/* Service Header */}
              <div className='p-4 border-b border-zinc-600'>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-3'>
                    <div className='p-2 bg-zinc-700 rounded-lg'>
                      <FontAwesomeIcon icon={faCube} className='h-5 text-blue-400' />
                    </div>
                    <div>
                      <h3 className='text-lg font-semibold text-white'>{groupName}</h3>
                      <div className='flex items-center gap-3 text-sm'>
                        <p className='text-zinc-400'>
                          {visibleApps.length} instance{visibleApps.length !== 1 ? 's' : ''}
                        </p>
                        {loadingEngStatus ? (
                          <div className='flex items-center gap-2'>
                            <div className='animate-spin rounded-full h-3 w-3 border-b-2 border-blue-500'></div>
                            <span className='text-zinc-400 text-xs'>Loading...</span>
                          </div>
                        ) : (
                          (() => {
                            const engService = getEngStatusForService(groupName);
                            if (engService) {
                              if (engService.isInfrastructure) {
                                return (
                                  <span className='px-2 py-1 rounded text-xs font-medium bg-zinc-700 text-zinc-300'>
                                    Infrastructure
                                  </span>
                                );
                              }
                              return (
                                <span className={`px-2 py-1 rounded text-xs font-medium ${
                                  engService.health === 'healthy' ? 'bg-green-700 text-green-200' :
                                  engService.health === 'unhealthy' ? 'bg-red-700 text-red-200' :
                                  'bg-yellow-700 text-yellow-200'
                                }`}>
                                  {engService.health}
                                </span>
                              );
                            }
                            return null;
                          })()
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Eng Status Details - Simplified */}
                {!loadingEngStatus && (() => {
                  const engService = getEngStatusForService(groupName);
                  if (engService && !engService.isInfrastructure) {
                    return (
                      <div className='mt-3 p-2 bg-zinc-900 rounded border border-zinc-600'>
                        <div className='grid grid-cols-2 gap-2 text-xs'>
                          {engService.commitMessage && (
                            <div className='text-zinc-400 truncate' title={engService.commitMessage}>
                              <span className='text-zinc-500'>Commit:</span> {engService.commitMessage}
                            </div>
                          )}
                          
                          {engService.uptime && (
                            <div className='text-zinc-400'>
                              <span className='text-zinc-500'>Uptime:</span> {engService.uptime}
                            </div>
                          )}
                          
                          {/* Health Status - Simplified */}
                          <div className='col-span-2'>
                            <div className='flex gap-2 text-zinc-400'>
                              {engService.consumers && ['healthy', 'unhealthy'].includes(engService.consumers) && (
                                <span className={`px-1.5 py-0.5 rounded text-xs ${
                                  engService.consumers === 'healthy' ? 'bg-green-700 text-green-200' :
                                  'bg-red-700 text-red-200'
                                }`}>
                                  Consumers: {engService.consumers}
                                </span>
                              )}
                              
                              {engService.jobs && ['healthy', 'unhealthy'].includes(engService.jobs) && (
                                <span className={`px-1.5 py-0.5 rounded text-xs ${
                                  engService.jobs === 'healthy' ? 'bg-green-700 text-green-200' :
                                  'bg-red-700 text-red-200'
                                }`}>
                                  Jobs: {engService.jobs}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>

              {/* Instances */}
              <div className='p-4 space-y-3'>
                {visibleApps.map((app, index) => (
                  <div
                    key={app.instanceId}
                    className='bg-zinc-900 rounded border border-zinc-600 hover:border-zinc-500 transition-colors'
                  >
                    {/* Instance Header */}
                    <div className='flex items-center justify-between p-3 border-b border-zinc-700'>
                      <div className='flex items-center gap-2'>
                        <div className={`w-2 h-2 rounded-full ${
                          app.status === 'online' ? 'bg-green-500' : 
                          app.status === 'error' ? 'bg-red-500' : 'bg-yellow-500'
                        }`}></div>
                        <span className='font-medium text-zinc-200 text-sm'>
                          {app.name}
                        </span>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        app.status === 'online' ? 'bg-green-900 text-green-300' :
                        app.status === 'error' ? 'bg-red-900 text-red-300' :
                        'bg-yellow-900 text-yellow-300'
                      }`}>
                        {app.status}
                      </span>
                    </div>

                    {/* Metrics Grid - Simplified */}
                    <div className='grid grid-cols-3 gap-2 p-3'>
                      <div className='flex items-center gap-2 p-2 bg-zinc-800 rounded'>
                        <FontAwesomeIcon
                          icon={faMicrochip}
                          className={`h-3 ${getColorClass(app.cpu, {
                            green: 50,
                            yellow: 70,
                            orange: 85,
                          })}`}
                        />
                        <div className='text-xs'>
                          <p className='text-zinc-400'>CPU</p>
                          <p className='text-white font-medium'>{app.cpu}%</p>
                        </div>
                      </div>
                      
                      <div className='flex items-center gap-2 p-2 bg-zinc-800 rounded'>
                        <FontAwesomeIcon
                          icon={faMemory}
                          className={`h-3 ${getColorClass(app.memory, {
                            green: 50000000,
                            yellow: 10000000,
                            orange: 150000000,
                          })}`}
                        />
                        <div className='text-xs'>
                          <p className='text-zinc-400'>Memory</p>
                          <p className='text-white font-medium'>
                            {(app.memory / (1024 * 1024)).toFixed(1)} MB
                          </p>
                        </div>
                      </div>
                      
                      <div className='flex items-center gap-2 p-2 bg-zinc-800 rounded'>
                        <FontAwesomeIcon icon={faClock} className='h-3 text-blue-400' />
                        <div className='text-xs'>
                          <p className='text-zinc-400'>Uptime</p>
                          <p className='text-white font-medium'>{app.uptime || 'n/a'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons - Simplified */}
                    <div className='flex gap-1 p-3 pt-0'>
                      {app.status === 'online' ? (
                        <>
                          <button
                            className='flex-1 flex items-center justify-center gap-1 py-1.5 px-2 bg-blue-600 hover:bg-blue-700 rounded text-white text-xs font-medium'
                            onClick={() => pm2AppAction(app.name, 'reload')}
                          >
                            <FontAwesomeIcon icon={faSyncAlt} className='h-3' />
                            Reload
                          </button>
                          
                          <button
                            className='flex-1 flex items-center justify-center gap-1 py-1.5 px-2 bg-orange-600 hover:bg-orange-700 rounded text-white text-xs font-medium'
                            onClick={() => pm2AppAction(app.name, 'restart')}
                          >
                            <FontAwesomeIcon icon={faRecycle} className='h-3' />
                            Restart
                          </button>
                          
                          <button
                            className='flex-1 flex items-center justify-center gap-1 py-1.5 px-2 bg-zinc-700 hover:bg-zinc-600 rounded text-white text-xs font-medium'
                            onClick={() => pm2AppAction(app.name, 'stop')}
                          >
                            <FontAwesomeIcon icon={faStop} className='h-3' />
                            Stop
                          </button>
                          
                          <Link
                            href={`/logs/${encodeURIComponent(app.name)}?index=${app.index || 0}`}
                            className='flex-1 flex items-center justify-center gap-1 py-1.5 px-2 bg-zinc-700 hover:bg-zinc-600 rounded text-white text-xs font-medium'
                          >
                            <FontAwesomeIcon icon={faTerminal} className='h-3' />
                            Logs
                          </Link>
                        </>
                      ) : (
                        <button
                          className='flex-1 flex items-center justify-center gap-1 py-1.5 px-2 bg-green-600 hover:bg-green-700 rounded text-white text-xs font-medium'
                          onClick={() => pm2AppAction(app.name, 'start')}
                        >
                          <FontAwesomeIcon icon={faPlayCircle} className='h-3' />
                          Start
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
};

export default AppCard;
