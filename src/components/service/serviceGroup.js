import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faChevronDown, faChevronUp, faCube, faSkull} from '@fortawesome/free-solid-svg-icons';
import ActionsBar from '../actions/actionsBar';
import ServiceInstance from './serviceInstance';
import {useState, useEffect, useRef} from 'react';
import {toast} from 'react-toastify';
import {useCommandExecution} from "@/hooks/useCommandExecution";

const ServiceGroup = ({
                          groupName,
                          apps,
                          engService,
                          loadingEngStatus
                      }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const isFirstRender = useRef(true);

    const {
        isLoading,
        logs,
        executeCommand,
    } = useCommandExecution();

    useEffect(() => {
        let toastId = null;

        if (isLoading) {
            toastId = toast.loading(`Building ${groupName}`, {
                closeButton: true,
                closeOnClick: false,
                draggable: false,
                autoClose: false,
                position: "top-right"
            });
        } else if (toastId) {
            toast.dismiss(toastId);
        }

        return () => {
            if (toastId) {
                toast.dismiss(toastId);
            }
        };
    }, [groupName, isLoading]);

    useEffect(() => {
        if (isFirstRender.current) {
            setIsExpanded(getGroupStatus(apps) === 'online');
            isFirstRender.current = false;
        }
    }, [apps]);

    useEffect(() => {
        console.log(logs);
    }, [logs]);

    const getGroupStatus = (apps) => {
        return apps.some(app => app.status === 'online') ? 'online' : 'offline';
    };

    const onGroupAction = async (groupName, action, groupApps) => {
        try {
            let result;

            if (action === 'build') {
                const requestBody = {
                    action: 'build',
                    flags: {
                        only: [groupName]
                    }
                };

                result = await executeCommand('/api/engToolkit/actions', requestBody);

                if (!result || !result.success) {
                    throw new Error(`${groupName} build failed: ${result.message || 'Unknown error'}`);
                }

                result.message = `${groupName} has been built successfully.`;
            } else {
                const response = await fetch('/api/pm2/group-actions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({groupName, action, groupApps}),
                });

                if (!response.ok) {
                    throw new Error('PM2 group action failed');
                }

                result = await response.json();
            }

            toast.success(result.message);
        } catch (error) {
            console.error('Error performing group action:', error);
            toast.error(error.message || 'Error performing group action');
        }
    };

    return (
        <div
            className={`rounded-lg shadow-md border overflow-hidden flex flex-col ${
                (() => {
                    if (isLoading) {
                        return 'animate-bg-pulse';
                    }

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
                                    {apps.length} instance{apps.length !== 1 ? 's' : ''}
                                </p>
                                {loadingEngStatus ? (
                                    <div className='flex items-center gap-2'>
                                        <div
                                            className='animate-spin rounded-full h-3 w-3 border-b-2 border-blue-500'></div>
                                        <span className='text-zinc-400 text-xs'>Loading...</span>
                                    </div>
                                ) : (
                                    engService && (
                                        engService.isInfrastructure ? (
                                            <span
                                                className='px-2 py-1 rounded text-xs font-medium bg-zinc-700 text-zinc-300'>
                                                Infrastructure
                                            </span>
                                        ) : (
                                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                                                engService.health === 'healthy' ? 'bg-green-700 text-green-200' :
                                                    engService.health === 'unhealthy' ? 'bg-red-700 text-red-200' :
                                                        'bg-yellow-700 text-yellow-200'
                                            }`}>
                                                {engService.health}
                                            </span>
                                        )
                                    )
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Group Actions */}
                    <div className='flex gap-4 items-center'>
                        {getGroupStatus(apps) === 'online' && (
                            <button
                                className='p-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg transition-colors'
                                onClick={() => onGroupAction(groupName, 'delete', apps)}
                                title='Kill all instances'
                            >
                                <FontAwesomeIcon icon={faSkull} className='h-4 text-red-400'/>
                            </button>
                        )}

                        <button
                            className="p-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg transition-colors"
                            onClick={() => setIsExpanded(!isExpanded)}>
                            <FontAwesomeIcon
                                icon={isExpanded ? faChevronUp : faChevronDown}
                                className='h-4 text-zinc-400'
                            />
                        </button>
                    </div>
                </div>

                {/* Eng Status Details */}
                {!loadingEngStatus && engService && !engService.isInfrastructure && (
                    <div className='mt-3 p-2 bg-zinc-900 rounded border border-zinc-600'>
                        <div className='grid grid-cols-2 gap-2 text-xs'>
                            {engService.commitMessage && (
                                <div className='text-zinc-400 truncate' title={engService.commitMessage}>
                                    <span className='text-zinc-500'>Commit:</span> {engService.commitMessage}
                                </div>
                            )}

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
                )}

                <div className="mt-4">
                    <ActionsBar
                        status={getGroupStatus(apps)}
                        name={groupName}
                        onAction={(name, action) => onGroupAction(groupName, action, apps)}
                        isGroup
                        isLoading={isLoading}
                    />
                </div>
            </div>

            {/* Instances */}
            {isExpanded && (
                <div className={`p-4 space-y-3 flex-1 ${isLoading ? 'animate-bg-pulse' : 'bg-zinc-800'}`}>
                    {apps.map((app, index) => (
                        <ServiceInstance
                            key={app.instanceId}
                            app={app}
                            index={index}
                            isLoading={isLoading}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default ServiceGroup;