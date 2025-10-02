import { Settings, User, ChevronRight } from "lucide-react";
import { Button } from "./ui/Button";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { Link } from "react-router-dom";
import React from "react";
// Add framer-motion import
import { AnimatePresence, motion } from "framer-motion";

export function Header() {
  const [navOpen, setNavOpen] = React.useState(false);
  const navRef = React.useRef<HTMLDivElement>(null);

  // Show dropdown on hover, hide on mouse leave
  const handleMouseLeave = () => setNavOpen(false);

  return (
    <header className="sticky top-4 z-50 m-4 rounded-xl frosted">
      <div className="flex h-16 items-center justify-between px-6 rounded-lg">
        {/* Left side: logo and title */}
        <div className="flex items-center space-x-4">
          <Link to="/" className="flex items-center space-x-2">
            <img
              src={"/src/assets/strategus logga.webp"}
              alt="Strategus logga"
              className="h-12 w-18 rounded cursor-pointer"
            />
            <h1 className="text-xl font-semibold text-foreground">
              Demo plattform
            </h1>
          </Link>
        </div>

        {/* Center: navbar items */}
        <nav className="flex items-center space-x-4 justify-start flex-1">
          {/* Sidor dropdown */}
          <div
            className="relative ml-2"
            ref={navRef}
            onMouseEnter={() => setNavOpen(true)}
            onMouseLeave={handleMouseLeave}
          >
            <Button
              variant="ghost"
              className="flex items-center px-4 rounded-lg text-md"
              tabIndex={0}
            >
              Sidor
              <ChevronRight className="h-4 w-4" />
            </Button>
            <AnimatePresence>
              {navOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.98 }}
                  transition={{ duration: 0.18 }}
                  className="absolute left-0 top-full min-w-[220px] rounded-xl bg-primary/95"
                >
                  <Link
                    to="/personal"
                    className="flex items-center justify-between px-4 py-2 text-foreground hover:bg-accent rounded transition-colors"
                    onClick={() => setNavOpen(false)}
                  >
                    <div className="flex flex-col text-left">
                      <span>Personal</span>
                      <span className="text-xs text-muted-foreground">
                        Hantera personaldata
                      </span>
                    </div>
                    <ChevronRight className="h-4 w-4 ml-2 text-muted-foreground" />
                  </Link>
                  <Link
                    to="/kompensation"
                    className="flex items-center justify-between px-4 py-2 text-foreground hover:bg-accent rounded transition-colors"
                    onClick={() => setNavOpen(false)}
                  >
                    <div className="flex flex-col text-left">
                      <span>Kompensation</span>
                      <span className="text-xs text-muted-foreground">
                        Se och exportera kompensationsdata
                      </span>
                    </div>
                    <ChevronRight className="h-4 w-4 ml-2 text-muted-foreground" />
                  </Link>
                  <Link
                    to="/monthly"
                    className="flex items-center justify-between px-4 py-2 text-foreground hover:bg-accent rounded transition-colors"
                    onClick={() => setNavOpen(false)}
                  >
                    <div className="flex flex-col text-left">
                      <span>Månad-data</span>
                      <span className="text-xs text-muted-foreground">
                        Månatlig statistik och rapporter
                      </span>
                    </div>
                    <ChevronRight className="h-4 w-4 ml-2 text-muted-foreground" />
                  </Link>
                  <Link
                    to="/settings"
                    className="flex items-center justify-between px-4 py-2 text-foreground hover:bg-accent rounded transition-colors"
                    onClick={() => setNavOpen(false)}
                  >
                    <div className="flex flex-col text-left">
                      <span>Inställningar</span>
                      <span className="text-xs text-muted-foreground">
                        Konfigurera system och organisation
                      </span>
                    </div>
                    <ChevronRight className="h-4 w-4 ml-2 text-muted-foreground" />
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Hjälp link */}
          {/* <Link
            to="/help"
            className="flex items-center px-4 rounded-lg hover:bg-accent transition-colors"
          >
            Hjälp
            <ChevronRight className="h-4 w-4 ml-2" />
          </Link>

          <Link
            to="/about"
            className="flex items-center px-4 rounded-lg hover:bg-accent transition-colors"
          >
            Om oss
            <ChevronRight className="h-4 w-4 ml-2" />
          </Link> */}
        </nav>

        {/* Right side: user menu */}
        <div className="flex items-center space-x-4">
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
              <DropdownMenuItem asChild>
                <Link to="/settings" className="flex items-center">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Inställningar</span>
                </Link>
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
