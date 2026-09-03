import LeftSidebar from "./LeftSidebar";
import RightSidebar from "./RightSidebar";

export default function MainLayout({ children }) {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white flex justify-center transition-colors duration-300">
      {/* Sidebar trái (Menu) */}
      <LeftSidebar />

      {/* Nội dung chính ở giữa (Co giãn theo màn hình nhưng max width là 1056px) */}
      <main className="flex-1 max-w-[1056px] w-full p-4 sm:p-6 md:p-8">
        {children}
      </main>

      {/* Sidebar phải (Thống kê) */}
      <RightSidebar />
    </div>
  );
}