import { useRef, useState } from 'react';
import { LOCAL_SERVICE_NAMES } from '@/utils/service';
import EngToolkitLogs from "./engToolkitLogs";

const EngToolkitToolbar = () => {
    const [selectedAction, setSelectedAction] = useState('');
    const [selectedServices, setSelectedServices] = useState([]);
    const [flags, setFlags] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [logs, setLogs] = useState([]);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const eventSourceRef = useRef(null);
    const [currentPid, setCurrentPid] = useState(null);

    const actions = [
        { value: 'download-db', label: 'Download DB', description: 'Download database dumps' },
        { value: 'setup', label: 'Setup', description: 'Set up local development environment' },
        { value: 'pull-latest', label: 'Pull Latest', description: 'Pull latest code from GitHub' },
        { value: 'update-env-files', label: 'Update Env Files', description: 'Update .env files with latest vars' },
        { value: 'build', label: 'Build', description: 'Install dependencies and build services' },
        { value: 'migrate', label: 'Migrate', description: 'Run database migrations' },
        { value: 'refresh-env', label: 'Refresh Env', description: 'Fetch latest code, build and migrate' },
        { value: 'start', label: 'Start', description: 'Start all services' }
    ];

    const handleServiceToggle = (service) => {
        setSelectedServices(prev =>
            prev.includes(service)
                ? prev.filter(s => s !== service)
                : [...prev, service]
        );
    };

    const handleFlagChange = (flag, value) => {
        setFlags(prev => ({ ...prev, [flag]: value }));
    };

    const handleMultiSelectToggle = (flag, service) => {
        setFlags(prev => {
            const currentArray = prev[flag] || [];
            const newArray = currentArray.includes(service)
                ? currentArray.filter(s => s !== service)
                : [...currentArray, service];

            return { ...prev, [flag]: newArray.length > 0 ? newArray : undefined };
        });
    };

    const addLog = (type, message, timestamp = new Date()) => {
        setLogs(prev => [...prev, { type, message, timestamp }]);
    };

    const handleExecute = async () => {
        if (!selectedAction) {
            setError('Please select an action');
            return;
        }

        setIsLoading(true);
        setError(null);
        setResult(null);
        setLogs([]);

        try {
            // Close any existing EventSource
            if (eventSourceRef.current) {
                eventSourceRef.current.close();
            }

            // Create request body
            const requestBody = {
                action: selectedAction,
                services: selectedServices,
                flags: flags
            };

            // Create EventSource with POST data
            const response = await fetch('/api/engToolkit/actions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        try {
                            const data = JSON.parse(line.slice(6));
                            handleStreamMessage(data);
                        } catch (e) {
                            console.error('Error parsing SSE data:', e);
                        }
                    }
                }
            }
        } catch (err) {
            setError('Failed to execute command: ' + err.message);
            setIsLoading(false);
        }
    };

    const handleStreamMessage = (data) => {
        switch (data.type) {
            case 'start':
                addLog('info', data.message);
                break;
            case 'stdout':
                addLog('stdout', data.data);
                break;
            case 'stderr':
                addLog('stderr', data.data);
                break;
            case 'end':
                addLog('info', data.message);
                setResult({
                    success: data.success,
                    message: data.message,
                    code: data.code
                });
                setIsLoading(false);
                break;
            case 'error':
                addLog('error', data.error);
                setError(data.error);
                setIsLoading(false);
                break;
            case 'pid':
                setCurrentPid(data.pid);
                break;
        }
    };

    const stopExecution = async () => {
        if (currentPid) {
            try {
                const response = await fetch('/api/engToolkit/stop', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ pid: currentPid })
                });

                if (!response.ok) {
                    addLog('error', `Failed to stop process`);
                }

                setCurrentPid(null);
            } catch (error) {
                addLog('error', `Failed to stop process: ${error.message}`);
            }
        }

        if (eventSourceRef.current) {
            eventSourceRef.current.close();
            eventSourceRef.current = null;
        }

        setIsLoading(false);
        addLog('info', 'Execution stopped by user');
    };

    const clearAll = () => {
        setSelectedAction('');
        setSelectedServices([]);
        setFlags({});
        setResult(null);
        setError(null);
        setLogs([]);
        setCurrentPid(null);

        if (eventSourceRef.current) {
            eventSourceRef.current.close();
            eventSourceRef.current = null;
        }
        setIsLoading(false);
    };

    const getLogTypeColor = (type) => {
        switch (type) {
            case 'stdout': return 'text-green-400';
            case 'stderr': return 'text-red-400';
            case 'error': return 'text-red-300';
            case 'info': return 'text-blue-400';
            default: return 'text-zinc-300';
        }
    };

    return (
        <div className="bg-zinc-800 rounded-xl shadow-lg border border-zinc-700 p-6 my-6">
            <h2 className="text-2xl font-bold text-white mb-6">Eng Toolkit</h2>

            {/* Action Selection */}
            <div className="mb-6">
                <label className="block text-sm font-medium text-zinc-200 mb-2">
                    Select Action
                </label>
                <select
                    value={selectedAction}
                    onChange={(e) => setSelectedAction(e.target.value)}
                    className="w-full p-3 bg-zinc-700 border border-zinc-600 rounded-lg text-white focus:border-blue-500 focus:outline-none transition-colors"
                    disabled={isLoading}
                >
                    <option value="">Choose an action...</option>
                    {actions.map(action => (
                        <option key={action.value} value={action.value}>
                            {action.label} - {action.description}
                        </option>
                    ))}
                </select>
            </div>

            {/* Services Selection - Only for download-db */}
            {selectedAction === 'download-db' && (
                <div className="mb-6">
                    <label className="block text-sm font-medium text-zinc-200 mb-2">
                        Select Services (Required)
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-60 overflow-y-auto border border-zinc-600 rounded-lg p-3 bg-zinc-900">
                        {LOCAL_SERVICE_NAMES.map(service => (
                            <label key={service} className="flex items-center space-x-2 cursor-pointer hover:bg-zinc-800 p-2 rounded transition-colors">
                                <input
                                    type="checkbox"
                                    checked={selectedServices.includes(service)}
                                    onChange={() => handleServiceToggle(service)}
                                    className="rounded border-zinc-600 text-blue-600 focus:ring-blue-500 focus:ring-offset-0 bg-zinc-700"
                                    disabled={isLoading}
                                />
                                <span className="text-sm text-zinc-300">{service}</span>
                            </label>
                        ))}
                    </div>
                    <div className="mt-2 text-sm text-zinc-400">
                        Selected: {selectedServices.length} services
                    </div>
                </div>
            )}

            {/* Flags */}
            <div className="mb-6">
                <label className="block text-sm font-medium text-zinc-200 mb-2">
                    Options
                </label>
                <div className="grid grid-cols-1 gap-4">
                    {/* Boolean flags */}
                    {selectedAction === 'setup' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <label className="flex items-center space-x-2 cursor-pointer p-3 bg-zinc-900 rounded-lg hover:bg-zinc-800 transition-colors">
                                <input
                                    type="checkbox"
                                    checked={flags.skipDb || false}
                                    onChange={(e) => handleFlagChange('skipDb', e.target.checked)}
                                    className="rounded border-zinc-600 text-blue-600 focus:ring-blue-500 focus:ring-offset-0 bg-zinc-700"
                                    disabled={isLoading}
                                />
                                <span className="text-sm text-zinc-300">Skip DB creation and seeding</span>
                            </label>
                            <label className="flex items-center space-x-2 cursor-pointer p-3 bg-zinc-900 rounded-lg hover:bg-zinc-800 transition-colors">
                                <input
                                    type="checkbox"
                                    checked={flags.skipDbDumps || false}
                                    onChange={(e) => handleFlagChange('skipDbDumps', e.target.checked)}
                                    className="rounded border-zinc-600 text-blue-600 focus:ring-blue-500 focus:ring-offset-0 bg-zinc-700"
                                    disabled={isLoading}
                                />
                                <span className="text-sm text-zinc-300">Skip platform and doctor-api demo dump download</span>
                            </label>
                        </div>
                    )}

                    {selectedAction === 'download-db' && (
                        <label className="flex items-center space-x-2 cursor-pointer p-3 bg-zinc-900 rounded-lg hover:bg-zinc-800 transition-colors">
                            <input
                                type="checkbox"
                                checked={flags.noParallel || false}
                                onChange={(e) => handleFlagChange('noParallel', e.target.checked)}
                                className="rounded border-zinc-600 text-blue-600 focus:ring-blue-500 focus:ring-offset-0 bg-zinc-700"
                                disabled={isLoading}
                            />
                            <span className="text-sm text-zinc-300">Run with one process only</span>
                        </label>
                    )}

                    {/* Service-specific flags - Multi-select */}
                    {['setup', 'pull-latest', 'update-env-files', 'build', 'migrate', 'refresh-env', 'start'].includes(selectedAction) && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Only Services */}
                            <div>
                                <label className="block text-sm font-medium text-zinc-200 mb-2">
                                    Only Services
                                </label>
                                <div className="max-h-48 overflow-y-auto border border-zinc-600 rounded-lg p-3 bg-zinc-900">
                                    {LOCAL_SERVICE_NAMES.map(service => (
                                        <label key={`only-${service}`} className="flex items-center space-x-2 cursor-pointer hover:bg-zinc-800 p-1 rounded transition-colors">
                                            <input
                                                type="checkbox"
                                                checked={(flags.only || []).includes(service)}
                                                onChange={() => handleMultiSelectToggle('only', service)}
                                                className="rounded border-zinc-600 text-blue-600 focus:ring-blue-500 focus:ring-offset-0 bg-zinc-700"
                                                disabled={isLoading}
                                            />
                                            <span className="text-sm text-zinc-300">{service}</span>
                                        </label>
                                    ))}
                                </div>
                                <div className="mt-2 text-sm text-zinc-400">
                                    Selected: {(flags.only || []).length} services
                                </div>
                            </div>

                            {/* Exclude Services */}
                            <div>
                                <label className="block text-sm font-medium text-zinc-200 mb-2">
                                    Exclude Services
                                </label>
                                <div className="max-h-48 overflow-y-auto border border-zinc-600 rounded-lg p-3 bg-zinc-900">
                                    {LOCAL_SERVICE_NAMES.map(service => (
                                        <label key={`exclude-${service}`} className="flex items-center space-x-2 cursor-pointer hover:bg-zinc-800 p-1 rounded transition-colors">
                                            <input
                                                type="checkbox"
                                                checked={(flags.exclude || []).includes(service)}
                                                onChange={() => handleMultiSelectToggle('exclude', service)}
                                                className="rounded border-zinc-600 text-blue-600 focus:ring-blue-500 focus:ring-offset-0 bg-zinc-700"
                                                disabled={isLoading}
                                            />
                                            <span className="text-sm text-zinc-300">{service}</span>
                                        </label>
                                    ))}
                                </div>
                                <div className="mt-2 text-sm text-zinc-400">
                                    Selected: {(flags.exclude || []).length} services
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-4 mb-6">
                <button
                    onClick={handleExecute}
                    disabled={isLoading}
                    className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                        isLoading
                            ? 'bg-zinc-600 cursor-not-allowed text-zinc-400'
                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                >
                    {isLoading ? 'Executing...' : 'Execute Command'}
                </button>
                {isLoading && (
                    <button
                        onClick={stopExecution}
                        className="px-6 py-3 rounded-lg font-medium bg-red-600 hover:bg-red-700 text-white transition-colors"
                    >
                        Stop
                    </button>
                )}
                <button
                    onClick={clearAll}
                    className="px-6 py-3 rounded-lg font-medium bg-zinc-700 hover:bg-zinc-600 text-white transition-colors"
                    disabled={isLoading}
                >
                    Clear All
                </button>
            </div>

            {/* Real-time Logs */}
            {logs.length > 0 && (
                <div className="mb-6">
                    <label className="block text-sm font-medium text-zinc-200 mb-2">
                        Command Output
                    </label>
                    <EngToolkitLogs logs={logs} isLoading={isLoading} />
                </div>
            )}

            {/* Results */}
            {error && (
                <div className="bg-red-900 border border-red-600 rounded-lg p-4 mb-4">
                    <div className="flex">
                        <div className="text-red-300">
                            <strong>Error:</strong> {error}
                        </div>
                    </div>
                </div>
            )}

            {result && (
                <div className={`${result.success ? 'bg-green-900 border-green-600' : 'bg-red-900 border-red-600'} border rounded-lg p-4`}>
                    <div className="mb-2">
                        <strong className={result.success ? 'text-green-300' : 'text-red-300'}>
                            {result.success ? 'Success:' : 'Failed:'}
                        </strong>
                        <span className="text-zinc-200 ml-2">{result.message}</span>
                    </div>
                    {result.code !== undefined && (
                        <div className="text-sm text-zinc-400">
                            Exit code: {result.code}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default EngToolkitToolbar;