import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faRecycle, faStop, faPlayCircle, faTerminal, faHammer} from '@fortawesome/free-solid-svg-icons';
import Link from 'next/link';
import ActionButton from './actionButton';

const ActionsBar = ({
                        status,
                        name,
                        onAction,
                        index,
                        isGroup = false,
                        isLoading = false
                    }) => {
    const actions = {
        online: [
            ...(isGroup ? [
                {
                    icon: faHammer,
                    label: 'Build',
                    variant: 'blue',
                    action: 'build',
                    isLoading
                }
            ] : []),
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
            ...(isGroup ? [
                {
                    icon: faHammer,
                    label: 'Build',
                    variant: 'blue',
                    action: 'build',
                    isLoading
                }
            ] : []),
            {
                icon: faPlayCircle,
                label: 'Start',
                variant: 'green',
                action: 'start'
            }
        ]
    };

    return (
        <div className="flex gap-1 py-3 pt-0">
            {status === 'online' && index !== undefined && (
                <Link
                    href={`/logs/${encodeURIComponent(name)}?index=${index}`}
                    className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 bg-blue-600 hover:bg-blue-700 rounded text-white text-xs font-medium"
                >
                    <FontAwesomeIcon icon={faTerminal} className="h-3"/>
                    Logs
                </Link>
            )}

            {(status === 'online' ? actions.online : actions.offline).map((actionBtn) => (
                <ActionButton
                    key={actionBtn.action}
                    icon={actionBtn.icon}
                    label={actionBtn.label}
                    variant={actionBtn.variant}
                    onClick={() => onAction(name, actionBtn.action)}
                    disabled={actionBtn.isLoading}
                />
            ))}
        </div>
    );
};

export default ActionsBar;