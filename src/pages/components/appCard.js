import {
    faFilter,
} from '@fortawesome/free-solid-svg-icons';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {Popover, Switch} from '@headlessui/react';
import {useEffect, useState} from 'react';
import {LOCAL_SERVICE_NAMES} from '@/utils/service';
import ServiceGroup from "@/pages/components/service/serviceGroup";

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

        return engStatus.services.find(service =>
            service.name === serviceName ||
            serviceName.includes(service.name) ||
            service.name.includes(serviceName)
        );
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
                setLoadingEngStatus(true);
                const res = await fetch('/api/engToolkit/status');
                const data = await res.json();
                if (data.success) {
                    setEngStatus(data.data);
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

                    return (
                        <ServiceGroup
                            key={groupName}
                            groupName={groupName}
                            apps={visibleApps}
                            engService={getEngStatusForService(groupName)}
                            loadingEngStatus={loadingEngStatus}
                        />
                    );
                })}
            </div>
        </>
    );
};

export default AppCard;
