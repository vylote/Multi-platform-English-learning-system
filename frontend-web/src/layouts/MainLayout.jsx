import LeftSidebar from "../components/LeftSidebar";
import RightSidebar from "../components/RightSidebar";

export default function MainLayout({ children }) {
  return (
    <div className="h-screen w-full flex justify-center overflow-hidden bg-white dark:bg-gray-900 text-gray-900 dark:text-white transition-colors duration-300">
      <LeftSidebar />
      <main className="flex-1 min-w-0 max-w-[1056px] w-full h-full overflow-y-auto p-4 sm:p-6 md:p-8">
        {children}
      </main>
      <RightSidebar />
    </div>
  );
}