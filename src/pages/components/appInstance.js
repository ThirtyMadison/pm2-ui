// components/AppInstance.js
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faChevronDown,
    faChevronUp,
    faClock,
    faMemory,
    faMicrochip,
} from '@fortawesome/free-solid-svg-icons';
import { useState } from 'react';
import ActionsBar from './actionsBar';

const AppInstance = ({ app, onAction, index }) => {
    const [showActions, setShowActions] = useState(false);

    const getColorClass = (value, thresholds) => {
        if (value < thresholds.green) return 'text-green-500';
        if (value < thresholds.yellow) return 'text-yellow-500';
        if (value < thresholds.orange) return 'text-orange-500';
        return 'text-red-500';
    };

    return (
        <div className='bg-zinc-900 rounded-lg p-4 border border-zinc-600 hover:border-zinc-500 transition-colors'>
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
                <div className='flex items-center gap-4'>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        app.status === 'online' ? 'bg-green-900 text-green-300' :
                        app.status === 'error' ? 'bg-red-900 text-red-300' :
                        'bg-yellow-900 text-yellow-300'
                    }`}>
                        {app.status}
                    </span>
                    <button
                        onClick={() => setShowActions(!showActions)}
                        className="p-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg transition-colors"
                    >
                        <FontAwesomeIcon
                            icon={showActions ? faChevronUp : faChevronDown}
                            className="h-4 text-zinc-400"
                        />
                    </button>
                </div>
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
                    <FontAwesomeIcon icon={faClock} className='h-4 text-blue-400'/>
                    <div>
                        <p className='text-zinc-400 text-xs'>Uptime</p>
                        <p className='text-white font-semibold'>{app.uptime || 'n/a'}</p>
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            {showActions && (
                <div className="mt-4">
                    <ActionsBar
                        status={app.status}
                        name={app.name}
                        index={index}
                        onAction={onAction}
                    />
                </div>
            )}
        </div>
    );
};

export default AppInstance;