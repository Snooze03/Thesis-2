import { useState, useEffect } from "react";
import { Album, Dumbbell, Clock, BotMessageSquare, Beef, User } from "lucide-react";
import { NavLink } from "react-router";
import clsx from "clsx";

const navItems = [
    { to: "/resources", icon: <Album /> },
    { to: "/workouts", icon: <Dumbbell /> },
    { to: "/chat", icon: <BotMessageSquare /> },
    { to: "/nutrition", icon: <Beef /> },
    { to: "/", icon: <User /> },
]

const Navbar = () => {
    const [showNavbar, setShowNavbar] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);

    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;
            setShowNavbar(currentScrollY < lastScrollY || currentScrollY <= 0);
            setLastScrollY(currentScrollY);
        };

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, [lastScrollY]);

    return (
        <>
            <nav className={clsx(
                "mx-auto fixed bottom-0 left-0 right-0 z-50 transition-transform duration-300",
                "px-3 py-3 mt-3 grid grid-cols-5 gap-3 place-items-center ring-2 ring-gray-200 rounded-md shadow-md text-sm bg-white",
                "block sm:hidden",
                {
                    "translate-y-0": showNavbar,
                    "translate-y-full": !showNavbar,
                }
            )}>
                {navItems.map(({ to, icon }, i) => (
                    <NavLink
                        key={i}
                        to={to}
                        className={({ isActive }) =>
                            clsx("flex gap-3 justify-center items-center size-5 max-2s:size-4", {
                                "text-primary": isActive,      // active color
                                "text-black": !isActive,    // inactive color
                            })
                        }
                    >
                        {icon}
                    </NavLink>
                ))}
            </nav >
        </>
    );
}

export { Navbar }