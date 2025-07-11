// components/EngToolkitLogs.js
import {useEffect, useRef, useState} from 'react';

const EngToolkitLogs = ({logs, isLoading}) => {
    const containerRef = useRef(null);
    const [autoScroll, setAutoScroll] = useState(true);

    useEffect(() => {
        if (autoScroll && containerRef.current) {
            containerRef.current.scrollTop = containerRef.current.scrollHeight;
        }
    }, [logs, autoScroll]);

    const getLogTypeColor = (type) => {
        switch (type) {
            case 'stdout':
                return 'text-green-400';
            case 'stderr':
                return 'text-red-400';
            case 'error':
                return 'text-red-300';
            case 'info':
                return 'text-blue-400';
            default:
                return 'text-zinc-300';
        }
    };

    const toggleAutoScroll = () => {
        const newAutoScroll = !autoScroll;
        setAutoScroll(newAutoScroll);

        // If turning auto-scroll back on, immediately scroll to bottom
        if (newAutoScroll && containerRef.current) {
            containerRef.current.scrollTop = containerRef.current.scrollHeight;
        }
    };

    return (
        <div className="relative">
            <div
                ref={containerRef}
                className="bg-black border border-zinc-600 rounded-lg p-4 h-96 overflow-y-auto font-mono text-sm scroll-smooth"
            >
                {logs.map((log, index) => (
                    <div key={index} className="mb-1">
                        <span className="text-zinc-500 text-xs">
                            {log.timestamp.toLocaleTimeString()} [{log.type}]
                        </span>
                        <div className={`whitespace-pre-wrap ${getLogTypeColor(log.type)}`}>
                            {log.message}
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="animate-pulse">
                        <span className="text-yellow-400">● Running...</span>
                    </div>
                )}
            </div>
            <div className="absolute bottom-4 right-4 flex space-x-2">
                <button
                    onClick={toggleAutoScroll}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                        autoScroll
                            ? 'bg-blue-600 hover:bg-blue-700 text-white'
                            : 'bg-zinc-700 hover:bg-zinc-600 text-zinc-300'
                    }`}
                >
                    {autoScroll ? 'Auto-scroll ON' : 'Auto-scroll OFF'}
                </button>
            </div>
        </div>
    );
};

export default EngToolkitLogs;