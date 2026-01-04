import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { User, LogOut, History, LogIn } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const UserMenu = () => {
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="w-10 h-10 rounded-full bg-muted/30 animate-pulse" />
    );
  }

  if (!user) {
    return (
      <Button
        onClick={() => navigate("/")}
        variant="outline"
        className="border-gold/30 text-gold hover:bg-gold/10"
      >
        <LogIn className="w-4 h-4 mr-2" />
        Entrar
      </Button>
    );
  }

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="w-10 h-10 p-0 rounded-full gradient-gold"
        >
          <User className="w-5 h-5 text-primary-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 glass-card border-border/30">
        <div className="px-3 py-2">
          <p className="text-sm font-medium text-foreground truncate">
            {user.email}
          </p>
        </div>
        <DropdownMenuSeparator className="bg-border/30" />
        <DropdownMenuItem
          onClick={() => navigate("/historico")}
          className="cursor-pointer"
        >
          <History className="w-4 h-4 mr-2" />
          Histórico de Jogos
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-border/30" />
        <DropdownMenuItem
          onClick={handleSignOut}
          className="cursor-pointer text-destructive focus:text-destructive"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
