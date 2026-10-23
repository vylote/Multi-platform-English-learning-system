import LeftSidebar from "../components/LeftSidebar";
import RightSidebar from "../components/RightSidebar";
import MobileBottomNav from "../components/MobileBottomNav";

export default function MainLayout({ children }) {
  return (
    <div className="h-screen w-full flex bg-[#ede8dc] dark:bg-gray-900 text-gray-900 dark:text-white transition-colors duration-300 overflow-hidden">
      {/* 1. Left Sidebar: Docked to the left edge */}
      <LeftSidebar />

      {/* 2. Main Content Area: Expands smoothly across the middle space */}
      <main className="flex-1 min-w-0 h-full overflow-y-auto px-4 sm:px-6 lg:px-8 py-5 pb-24 md:pb-6 scrollbar-thin">
        <div className="w-full max-w-[1060px] mx-auto">
          {children}
        </div>
      </main>

      {/* 3. Right Sidebar: Docked to the right edge */}
      <RightSidebar />

      {/* Mobile Bottom Navigation Bar (Screens < 768px) */}
      <MobileBottomNav />
    </div>
  );
}