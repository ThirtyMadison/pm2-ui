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

    fetchApps();

    const intervalId = setInterval(() => {
      fetchApps();
    }, 5000);
    return () => clearInterval(intervalId);
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
  );

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
      <div className='grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-6'>
        {filteredGroupNames.map((groupName) => {
          const visibleApps = groupedApps[groupName].filter(toggleVisibility);
          if (visibleApps.length === 0) return null;

          return (
            <div
              key={groupName}
              className='bg-zinc-800 rounded-xl shadow-lg border border-zinc-700 overflow-hidden'
            >
              {/* Service Header */}
              <div className='p-6 border-b border-zinc-600'>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-3'>
                    <div className='p-2 bg-zinc-700 rounded-lg'>
                      <FontAwesomeIcon icon={faCube} className='h-6 text-blue-400' />
                    </div>
                    <div>
                      <h3 className='text-xl font-bold text-white'>{groupName}</h3>
                      <p className='text-zinc-400 text-sm'>
                        {visibleApps.length} instance{visibleApps.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  
                  {/* Group Actions */}
                  <div className='flex gap-2 flex-wrap'>
                    <button
                      className='p-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg transition-colors'
                      onClick={() => pm2AppAction(groupName, 'delete')}
                      title='Kill all instances'
                    >
                      <FontAwesomeIcon icon={faSkull} className='h-4 text-red-400' />
                    </button>
                  </div>
                </div>
              </div>

              {/* Instances */}
              <div className='p-6 space-y-4'>
                {visibleApps.map((app, index) => (
                  <div
                    key={app.instanceId}
                    className='bg-zinc-900 rounded-lg p-4 border border-zinc-600 hover:border-zinc-500 transition-colors'
                  >
                    {/* Instance Header */}
                    <div className='flex items-center justify-between mb-4'>
                      <div className='flex items-center gap-3'>
                        <div className={`w-3 h-3 rounded-full ${
                          app.status === 'online' ? 'bg-green-500' : 
                          app.status === 'error' ? 'bg-red-500' : 'bg-yellow-500'
                        }`}></div>
                        <div>
                          <span className='font-semibold text-zinc-200'>
                            {app.name}
                          </span>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        app.status === 'online' ? 'bg-green-900 text-green-300' :
                        app.status === 'error' ? 'bg-red-900 text-red-300' :
                        'bg-yellow-900 text-yellow-300'
                      }`}>
                        {app.status}
                      </span>
                    </div>

                    {/* Metrics Grid */}
                    <div className='grid grid-cols-2 gap-4 mb-4'>
                      <div className='flex items-center gap-3 p-3 bg-zinc-800 rounded-lg'>
                        <FontAwesomeIcon
                          icon={faMicrochip}
                          className={`h-4 ${getColorClass(app.cpu, {
                            green: 50,
                            yellow: 70,
                            orange: 85,
                          })}`}
                        />
                        <div>
                          <p className='text-zinc-400 text-xs'>CPU</p>
                          <p className='text-white font-semibold'>{app.cpu}%</p>
                        </div>
                      </div>
                      
                      <div className='flex items-center gap-3 p-3 bg-zinc-800 rounded-lg'>
                        <FontAwesomeIcon
                          icon={faMemory}
                          className={`h-4 ${getColorClass(app.memory, {
                            green: 50000000,
                            yellow: 10000000,
                            orange: 150000000,
                          })}`}
                        />
                        <div>
                          <p className='text-zinc-400 text-xs'>Memory</p>
                          <p className='text-white font-semibold'>
                            {(app.memory / (1024 * 1024)).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      
                      <div className='flex items-center gap-3 p-3 bg-zinc-800 rounded-lg'>
                        <FontAwesomeIcon icon={faClock} className='h-4 text-blue-400' />
                        <div>
                          <p className='text-zinc-400 text-xs'>Uptime</p>
                          <p className='text-white font-semibold'>{app.uptime || 'n/a'}</p>
                        </div>
                      </div>
                      
                    </div>

                    {/* Action Buttons */}
                    <div className='flex gap-2 flex-wrap'>
                      {app.status === 'online' ? (
                        <>
                          <button
                            className='flex-1 flex items-center justify-center gap-2 py-2 px-4 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors text-white text-sm font-medium'
                            onClick={() => pm2AppAction(app.name, 'reload')}
                          >
                            <FontAwesomeIcon icon={faSyncAlt} className='h-4' />
                            Reload
                          </button>
                          
                          <button
                            className='flex-1 flex items-center justify-center gap-2 py-2 px-4 bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors text-white text-sm font-medium'
                            onClick={() => pm2AppAction(app.name, 'restart')}
                          >
                            <FontAwesomeIcon icon={faRecycle} className='h-4' />
                            Restart
                          </button>
                          
                          <button
                            className='flex-1 flex items-center justify-center gap-2 py-2 px-4 bg-zinc-700 hover:bg-zinc-600 rounded-lg transition-colors text-white text-sm font-medium'
                            onClick={() => pm2AppAction(app.name, 'stop')}
                          >
                            <FontAwesomeIcon icon={faStop} className='h-4' />
                            Stop
                          </button>
                          
                          <Link
                            href={`/logs/${encodeURIComponent(app.name)}?index=${app.index || 0}`}
                            className='flex-1 flex items-center justify-center gap-2 py-2 px-4 bg-zinc-700 hover:bg-zinc-600 rounded-lg transition-colors text-white text-sm font-medium'
                          >
                            <FontAwesomeIcon icon={faTerminal} className='h-4' />
                            Logs
                          </Link>
                        </>
                      ) : (
                        <button
                          className='flex-1 flex items-center justify-center gap-2 py-2 px-4 bg-green-600 hover:bg-green-700 rounded-lg transition-colors text-white text-sm font-medium'
                          onClick={() => pm2AppAction(app.name, 'start')}
                        >
                          <FontAwesomeIcon icon={faPlayCircle} className='h-4' />
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
