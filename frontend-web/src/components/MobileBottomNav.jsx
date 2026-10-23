import { Link, useLocation } from "react-router-dom";
import { Compass, Trophy, Layers, BookOpen, User } from "lucide-react";

export default function MobileBottomNav() {
  const location = useLocation();

  const navItems = [
    { name: "Học", path: "/learn", icon: Compass, color: "#58cc02" },
    { name: "Luyện đề", path: "/exams", icon: Trophy, color: "#1cb0f6" },
    { name: "Ôn tập", path: "/review", icon: Layers, color: "#ff9600" },
    { name: "Tra cứu", path: "/dictionary", icon: BookOpen, color: "#ce82ff" },
    { name: "Hồ sơ", path: "/profile", icon: User, color: "#00cd9c" },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-t-2 border-gray-200/80 dark:border-gray-800 flex items-center justify-around px-2 z-40 select-none">
      {navItems.map((item) => {
        const isActive = location.pathname.startsWith(item.path);
        const IconComponent = item.icon;

        return (
          <Link
            key={item.path}
            to={item.path}
            className={`flex flex-col items-center justify-center w-14 h-12 rounded-xl transition-all ${
              isActive
                ? "text-[#58cc02] scale-105"
                : "text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            <div
              className={`p-1 rounded-lg ${
                isActive ? "bg-[#58cc02]/15" : "bg-transparent"
              }`}
            >
              <IconComponent className="w-5 h-5 stroke-[2.5]" />
            </div>
            <span
              className={`text-[10px] font-black tracking-tight mt-0.5 ${
                isActive ? "text-[#58cc02]" : "text-gray-500 dark:text-gray-400"
              }`}
            >
              {item.name}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
