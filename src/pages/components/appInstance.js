// components/AppInstance.js
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {
    faChevronDown,
    faChevronUp,
    faClock,
    faMemory,
    faMicrochip,
} from '@fortawesome/free-solid-svg-icons';
import {useState} from 'react';
import ActionsBar from './actionsBar';

const AppInstance = ({app, onAction, index}) => {
    const [showActions, setShowActions] = useState(false);

    const getColorClass = (value, thresholds) => {
        if (value < thresholds.green) return 'text-green-500';
        if (value < thresholds.yellow) return 'text-yellow-500';
        if (value < thresholds.orange) return 'text-orange-500';
        return 'text-red-500';
    };

    return (
        <div
            className={`rounded border transition-colors ${app.status === 'online' ? 'border-zinc-600 hover:border-zinc-500 ' : 'border-red-600 hover:border-red-400'}`}>
            {/* Instance Header */}
            <div
                className={`flex items-center justify-between p-3 border-b  border-zinc-700 ${app.status === 'online' ? 'bg-zinc-800 ' : 'bg-red-900 '}`}>
                <div className='flex items-center gap-2'>
                    <div className={`w-2 h-2 rounded-full ${
                        app.status === 'online' ? 'bg-green-500' :
                            app.status === 'error' ? 'bg-red-500' : 'bg-yellow-500'
                    }`}></div>
                    <div>
                        <span className='font-medium text-zinc-200 text-sm'>
                            {app.name}
                        </span>
                    </div>
                </div>
                <div className='flex items-center gap-4'>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
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

            {/* Metrics Grid - Simplified */}
            <div className='grid grid-cols-3 gap-2 p-3'>
                <div className='flex items-center gap-2 p-2 bg-zinc-800 rounded-lg'>
                    <FontAwesomeIcon
                        icon={faMicrochip}
                        className={`h-3 ${getColorClass(app.cpu, {
                            green: 50,
                            yellow: 70,
                            orange: 85,
                        })}`}
                    />
                    <div className="text-xs">
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
                            {(app.memory / (1024 * 1024)).toFixed(2)} MB
                        </p>
                    </div>
                </div>

                <div className='flex items-center gap-2 p-2 bg-zinc-800 rounded'>
                    <FontAwesomeIcon icon={faClock} className='h-3 text-blue-400'/>
                    <div className='text-xs'>
                        <p className='text-zinc-400'>Uptime</p>
                        <p className='text-white font-medium'>{app.uptime || 'n/a'}</p>
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