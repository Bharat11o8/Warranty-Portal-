import { Link, useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const Header = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card/80 backdrop-blur-lg">
      <nav className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center space-x-2">
          {/* <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary-glow" /> */}
          {/* <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Enroll Product Warranty
          </span> */}
        </Link>

        <div className="flex items-center gap-4">
          <Link to="/">
            <Button variant="ghost" size="sm">
              Home Page
            </Button>
          </Link>

          {user ? (
            <>
              <Link to="/warranty">
                <Button variant="ghost" size="sm">
                  Warranty
                </Button>
              </Link>
              <Link to="/terms">
                <Button variant="ghost" size="sm">
                  T&C
                </Button>
              </Link>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost" size="sm">
                  Login
                </Button>
              </Link>
              <Link to="/register">
                <Button variant="default" size="sm">
                  Register
                </Button>
              </Link>
              <Link to="/terms">
                <Button variant="ghost" size="sm">
                  T&C
                </Button>
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
};

export default Header;
