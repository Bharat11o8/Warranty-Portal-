interface RoleCardProps {
    icon: LucideIcon;
    title: string;
    selected: boolean;
    onClick: () => void;
    className?: string;
}

const RoleCard = ({ icon: Icon, title, selected, onClick, className = "" }: RoleCardProps) => {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`
        relative flex items-center gap-3 p-3 rounded-xl border-2 
        transition-all cursor-pointer w-full
        ${selected
                    ? 'border-blue-500 bg-blue-500/20 shadow-md shadow-blue-600/10'
                    : 'border-transparent bg-white/5 hover:bg-white/10'
                }
        ${className}
      `}
        >
            {/* Icon Container */}
            <div
                className={`
          h-10 w-10 rounded-lg flex items-center justify-center transition-all
          ${selected
                        ? 'bg-blue-500 shadow-sm'
                        : 'bg-white/10'
                    }
        `}
            >
                <Icon className={`h-5 w-5 ${selected ? 'text-white' : 'text-white/70'}`} />
            </div>

            {/* Title */}
            <span className={`font-bold text-sm uppercase tracking-wide ${selected ? 'text-white' : 'text-white/70'}`}>{title}</span>


        </button>
    );
};

export default RoleCard;
