import ActionsBar from "@/pages/components/actionsBar";
import AppInstance from "@/pages/components/appInstance";
import { LOCAL_SERVICE_NAMES } from '@/utils/service';
import {
    faFilter,
} from '@fortawesome/free-solid-svg-icons';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {Popover, Switch} from '@headlessui/react';
import {useEffect, useState} from 'react';
import {toast} from 'react-toastify';

const AppCard = () => {
    const [apps, setApps] = useState([]);
    const [groupedApps, setGroupedApps] = useState({});
    const [filter, setFilter] = useState('');
    const [showOnline, setShowOnline] = useState(true);
    const [showError, setShowError] = useState(true);
    const [showStopped, setShowStopped] = useState(true);
    const [engStatus, setEngStatus] = useState(null);
    const [loadingEngStatus, setLoadingEngStatus] = useState(true);
    const [initialLoad, setInitialLoad] = useState(true);
    const [previousEngStatus, setPreviousEngStatus] = useState(null);

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
        // console.log('Looking for service:', serviceName);
        // console.log('Available services:', engStatus.services.map(s => s.name));
        const found = engStatus.services.find(service =>
            service.name === serviceName ||
            serviceName.includes(service.name) ||
            service.name.includes(serviceName)
        );
        // console.log('Found service:', found);
        return found;
    };

    // Function to check for unhealthy services and show notifications
    const checkUnhealthyServices = (newEngStatus, previousEngStatus) => {
        if (!newEngStatus || !newEngStatus.services) return;

        // Collect all unhealthy services
        const unhealthyServices = [];

        newEngStatus.services.forEach(service => {
            if (service.isInfrastructure) return; // Skip infrastructure services

            const previousService = previousEngStatus?.services?.find(s => s.name === service.name);
            let hasChanges = false;

            // Check if service became unhealthy
            if (service.health === 'unhealthy' && (!previousService || previousService.health !== 'unhealthy')) {
                unhealthyServices.push(service.name);
                hasChanges = true;
            }

            // Check if consumers became unhealthy
            if (service.consumers === 'unhealthy' && (!previousService || previousService.consumers !== 'unhealthy')) {
                unhealthyServices.push(`${service.name} consumers`);
                hasChanges = true;
            }

            // Check if jobs became unhealthy
            if (service.jobs === 'unhealthy' && (!previousService || previousService.jobs !== 'unhealthy')) {
                unhealthyServices.push(`${service.name} jobs`);
                hasChanges = true;
            }
        });

        // Show single notification if there are unhealthy services
        if (unhealthyServices.length > 0) {
            toast.error(
                <div>
                    You have unhealthy services ({unhealthyServices.length})
                    <details style={{marginTop: '8px', fontSize: '12px'}}>
                        <summary style={{cursor: 'pointer', color: '#fca5a5'}}>Click to expand</summary>
                        <div style={{marginTop: '4px', paddingLeft: '8px'}}>
                            {unhealthyServices.map((service) => (
                                <div key={service} style={{marginBottom: '2px'}}>• {service}</div>
                            ))}
                        </div>
                    </details>
                </div>,
                {
                    position: "top-right",
                    autoClose: false, // Don't auto-close
                    hideProgressBar: true,
                    closeOnClick: false,
                    pauseOnHover: true,
                    draggable: true,
                    toastId: 'unhealthy-services', // Single notification ID
                }
            );
        }
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

            return grouped;
        }

        async function fetchEngStatus() {
            try {
                // Only show loading on initial load
                if (initialLoad) {
                    setLoadingEngStatus(true);
                }
                const res = await fetch('/api/engToolkit/status');
                const data = await res.json();
                if (data.success) {
                    // Store current state as previous before updating
                    const currentState = engStatus;
                    // Check for unhealthy services using current state as previous
                    checkUnhealthyServices(data.data, currentState);
                    setEngStatus(data.data);
                    //console.log(data.data);
                }
            } catch (error) {
                console.error('Failed to fetch eng status:', error);
            } finally {
                setLoadingEngStatus(false);
                setInitialLoad(false);
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

    const StatusSwitch = ({label, isEnabled, onToggle}) => {
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

    return (
        <>
            {/* Header with filters */}
            <div className='flex flex-col sm:flex-row justify-between mb-6 text-zinc-100 gap-4'>
                <div className='flex items-center gap-4'>
                    <Popover className='relative'>
                        <Popover.Button
                            className='flex items-center gap-2 text-gray-100 bg-zinc-700 hover:bg-zinc-600 p-3 rounded-lg transition-colors'>
                            <FontAwesomeIcon icon={faFilter}/>
                            <span>Filters</span>
                        </Popover.Button>
                        <Popover.Panel className='absolute z-10 mt-2'>
                            <div
                                className='bg-zinc-800 rounded-lg shadow-xl p-4 text-gray-100 flex flex-col gap-3 min-w-[200px] border border-zinc-600'>
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

                    const engService = getEngStatusForService(groupName);
                    let url = engService?.url;

                    // handle special case for launchpad
                    if (groupName === 'launchpad') {
                      url = 'http://nurx.com.localhost:3023';
                    } else if (!url?.length && engService?.port) {
                        url = `http://localhost:${engService?.port}/graphql`;
                    }

                    /*
                    <ServiceGroup
                            key={groupName}
                            groupName={groupName}
                            apps={visibleApps}
                            engService={getEngStatusForService(groupName)}
                            loadingEngStatus={loadingEngStatus}
                        />
                     */
                    return (
                        <div
                            key={groupName}
                            className={`rounded-lg shadow-md border overflow-hidden ${
                                (() => {
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
                                            <FontAwesomeIcon icon={faCube} className='h-5 text-blue-400'/>
                                        </div>
                                        <div>
                                            <h3 className='text-lg font-semibold text-white'>{groupName}</h3>
                                            <div className='flex items-center gap-3 text-sm'>
                                                <p className='text-zinc-400'>
                                                    {visibleApps.length} instance{visibleApps.length !== 1 ? 's' : ''}
                                                </p>
                                                {loadingEngStatus && initialLoad ? (
                                                    <div className='flex items-center gap-2'>
                                                        <div className='animate-spin rounded-full h-3 w-3 border-b-2 border-blue-500'></div>
                                                        <span className='text-zinc-400 text-xs'>Loading...</span>
                                                    </div>
                                                ) : (
                                                    (() => {
                                                        if (engService) {
                                                            if (engService.isInfrastructure) {
                                                                return (
                                                                    <span
                                                                        className='px-2 py-1 rounded text-xs font-medium bg-zinc-700 text-zinc-300'>
                                    Infrastructure
                                  </span>
                                                                );
                                                            }
                                                            return (
                                                                <span
                                                                    className={`px-2 py-1 rounded text-xs font-medium ${
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

                                    {/* Group Actions */}
                                    <div className='flex gap-4 items-center'>
                                        {getGroupStatus(visibleApps) === 'online' &&
                                            (<button
                                                className='p-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg transition-colors'
                                                onClick={() => pm2AppAction(groupName, 'delete')}
                                                title='Kill all instances'
                                            >
                                                <FontAwesomeIcon icon={faSkull} className='h-4 text-red-400'/>
                                            </button>)
                                        }

                                        <button
                                            className="p-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg transition-colors"
                                            onClick={() => toggleGroup(groupName)}>
                                            <FontAwesomeIcon
                                                icon={expandedGroups[groupName] ? faChevronUp : faChevronDown}
                                                className='h-4 text-zinc-400'
                                            />
                                        </button>
                                    </div>
                                </div>

                                {/* Eng Status Details - Simplified */}
                                {(!loadingEngStatus || !initialLoad) && (() => {
                                    if (engService && !engService.isInfrastructure) {
                                        return (
                                            <div className='mt-3 p-2 bg-zinc-900 rounded border border-zinc-600'>
                                                <div className='grid grid-cols-2 gap-2 text-xs'>
                                                    {engService.commitMessage && (
                                                        <div className='text-zinc-400 truncate'
                                                             title={engService.commitMessage}>
                                                            <span className='text-zinc-500'>Commit:</span> {engService.commitMessage}
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

                                <div className="mt-4">
                                    {/* Group Action Buttons */}
                                    <ActionsBar
                                        status={getGroupStatus(visibleApps)}
                                        name={groupName}
                                        onAction={pm2GroupAction}
                                        url={url}
                                    />
                                </div>
                            </div>

                            {/* Instances */}
                            {expandedGroups[groupName] &&
                                (
                                    <div className="p-4 space-y-3 bg-zinc-800">
                                        {visibleApps.map((app, index) => (
                                            <AppInstance
                                                key={app.instanceId}
                                                app={app}
                                                onAction={pm2AppAction}
                                                index={index}
                                            />
                                        ))}
                                    </div>)}
                        </div>
                    );
                })}
            </div>
        </>
    );
};

export default AppCard;
