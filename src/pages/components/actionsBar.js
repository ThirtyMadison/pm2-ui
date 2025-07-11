import { FRONT_END_SERVICES } from '@/utils/service';
import { faExternalLink, faPlayCircle, faRecycle, faStop, faSyncAlt, faTerminal } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Link from 'next/link';
import ActionButton from './ActionButton';

const ActionsBar = ({
                        status,
                        name,
                        onAction,
                        url,
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
        <>
            <div className="flex gap-1 pb-3 pt-0 flex-wrap">
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

            <div>
                {!!url?.length && (
                    <Link 
                        href={url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="w-100 flex-1 flex items-center justify-center gap-1 py-1.5 px-2 bg-zinc-700 hover:bg-zinc-600 rounded text-white text-xs font-medium"
                    >
                        <FontAwesomeIcon icon={faExternalLink} className="h-3" />

                        {FRONT_END_SERVICES.includes(name) ? 'View Website' : 'GraphQL Playground'}
                    </Link>
                )}
            </div>
        </>
    );
};

export default ActionsBar;
