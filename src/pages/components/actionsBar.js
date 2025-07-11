import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faSyncAlt, faRecycle, faStop, faPlayCircle, faTerminal} from '@fortawesome/free-solid-svg-icons';
import Link from 'next/link';
import ActionButton from './ActionButton';

const ActionsBar = ({
                        status,
                        name,
                        onAction,
                        index,
                    }) => {
    const actions = {
        online: [
            {
                icon: faSyncAlt,
                label: 'Reload',
                variant: 'blue',
                action: 'reload'
            },
            {
                icon: faRecycle,
                label: 'Restart',
                variant: 'orange',
                action: 'restart'
            },
            {
                icon: faStop,
                label: 'Stop',
                variant: 'zinc',
                action: 'stop'
            }
        ],
        offline: [
            {
                icon: faPlayCircle,
                label: 'Start',
                variant: 'green',
                action: 'start'
            }
        ]
    };

    return (
        <div className="flex gap-1 p-3 pt-0">
            {(status === 'online' ? actions.online : actions.offline).map((actionBtn) => (
                <ActionButton
                    key={actionBtn.action}
                    icon={actionBtn.icon}
                    label={actionBtn.label}
                    variant={actionBtn.variant}
                    onClick={() => onAction(name, actionBtn.action)}
                />
            ))}

            {status === 'online' && index !== undefined && (
                <Link
                    href={`/logs/${encodeURIComponent(name)}?index=${index}`}
                    className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 bg-blue-600 hover:bg-blue-700 rounded text-white text-xs font-medium"
                >
                    <FontAwesomeIcon icon={faTerminal} className="h-3"/>
                    Logs
                </Link>
            )}
        </div>
    );
};

export default ActionsBar;
