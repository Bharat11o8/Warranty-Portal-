import { Button } from "@/components/ui/button";
import { User } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const HelpPopover = ({ onNavigate }: { onNavigate?: (module: string) => void }) => {
    const navigate = useNavigate();

    const handleClick = () => {
        if (onNavigate) {
            onNavigate('profile');
        } else {
            navigate('/profile');
        }
    };

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={handleClick}
            className="relative rounded-full h-10 w-10 bg-orange-50 text-orange-600 hover:bg-orange-100 transition-all border border-orange-100"
            title="My Profile"
        >
            <User className="h-5 w-5" />
        </Button>
    );
};
