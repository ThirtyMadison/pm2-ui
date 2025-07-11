import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const BUTTON_VARIANTS = {
    blue: 'bg-blue-600 hover:bg-blue-700',
    orange: 'bg-orange-600 hover:bg-orange-700',
    zinc: 'bg-zinc-700 hover:bg-zinc-600',
    green: 'bg-green-600 hover:bg-green-700',
};

const ActionButton = ({
                          icon,
                          label,
                          onClick,
                          variant = 'blue',
                          className = '',
                          disabled = false,
                      }) => {
    const baseStyles = 'flex-1 flex items-center justify-center gap-1 py-1.5 px-2 bg-blue-600 hover:bg-blue-700 rounded text-white text-xs font-medium';
    const variantStyles = BUTTON_VARIANTS[variant] || BUTTON_VARIANTS.blue;

    return (
        <button
            className={`${baseStyles} ${variantStyles} ${className}`}
            onClick={onClick}
            disabled={disabled}
        >
            {icon && <FontAwesomeIcon icon={icon} className="h-3" />}
            {label}
        </button>
    );
};

export default ActionButton;
