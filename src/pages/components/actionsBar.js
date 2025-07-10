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
        <div className="flex gap-2">
            {(status === 'online' ? actions.online : actions.offline).map((actionBtn) => (
                <ActionButton
                    key={actionBtn.action}
                    icon={actionBtn.icon}
                    label={actionBtn.label}
                    variant={actionBtn.variant}
                    onClick={() => onAction(name, actionBtn.action)}
                />
            ))}

            {status === 'online' && index && (
                <Link
                    href={`/logs/${encodeURIComponent(name)}?index=${index}`}
                    className="flex-1 flex items-center justify-center gap-2 py-2 px-4 bg-zinc-700 hover:bg-zinc-600 rounded-lg transition-colors text-white text-sm font-medium"
                >
                    <FontAwesomeIcon icon={faTerminal} className="h-4"/>
                    Logs
                </Link>
            )}
        </div>
    );
};

export default ActionsBar;
