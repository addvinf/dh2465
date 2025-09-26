import { Settings, User, Bell } from "lucide-react";
import { Button } from "../components/ui/button";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import myImage from "../assets/loggademo.png";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { Link } from "react-router-dom";

export function Header() {
  return (
    <header className="border-border bg-card bg-gray-100 rounded-lg">
      <div className="flex h-16 items-center justify-between px-6 rounded-lg">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Link to="/">
              <img
                src={myImage}
                alt="Strategus logga"
                className="h-10 w-10 rounded cursor-pointer"
              />
            </Link>
            <div>
              <h1 className="text-xl font-semibold text-foreground">
                Demo plattform
              </h1>
              {/* <p className="text-sm text-muted-foreground">
                Strategus lönebeskedsystem
              </p> */}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {/* Bell for later */}
          {/* <Button variant="ghost" size="sm" className="relative">
            <Bell className="h-4 w-4" />
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-xs text-primary-foreground flex items-center justify-center">
              3
            </span>
          </Button> */}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    ER
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-56 bg-card border-border rounded-lg"
              align="end"
            >
              <div className="flex items-center justify-start gap-2 p-2">
                <div className="flex flex-col space-y-1 leading-none">
                  <p className="font-medium text-sm">Edvin Ramström</p>
                  <p className="w-[200px] truncate text-xs text-muted-foreground">
                    Utvecklare, KTH
                  </p>
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() =>
                  alert("Profil-funktionen kommer att utvecklas senare")
                }
              >
                <User className="mr-2 h-4 w-4" />
                <span>Profil</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  alert("Inställningar-funktionen kommer att utvecklas senare")
                }
              >
                <Settings className="mr-2 h-4 w-4" />
                <span>Inställningar</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() =>
                  alert("Logga ut-funktionen kommer att utvecklas senare")
                }
              >
                Logga ut
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
