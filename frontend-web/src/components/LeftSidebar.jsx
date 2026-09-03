import { Link } from "react-router-dom"; // Dùng Link của react-router-dom thay cho thẻ <a>

export default function LeftSidebar() {
  const navItems = [
    { name: "Học", icon: "https://d35aaqx5ub95lt.cloudfront.net/vendor/784035717e2ff1d448c0f6cc4efc89fb.svg", path: "/learn" },
    { name: "Phát âm", icon: "https://d35aaqx5ub95lt.cloudfront.net/vendor/3b4928101472fce4e9edac920c1b3817.svg", path: "/characters" },
    { name: "Luyện tập", icon: "https://d35aaqx5ub95lt.cloudfront.net/vendor/5187f6694476a769d4a4e28149867e3e.svg", path: "/practice-hub" },
    { name: "Bảng xếp hạng", icon: "https://d35aaqx5ub95lt.cloudfront.net/vendor/ca9178510134b4b0893dbac30b6670aa.svg", path: "/leaderboard" },
    { name: "Nhiệm vụ", icon: "https://d35aaqx5ub95lt.cloudfront.net/vendor/7ef36bae3f9d68fc763d3451b5167836.svg", path: "/quests" },
    { name: "Cửa hàng", icon: "https://d35aaqx5ub95lt.cloudfront.net/vendor/0e58a94dda219766d98c7796b910beee.svg", path: "/shop" },
    { name: "Hồ sơ", icon: "//d3gq3s1iyyx31w.cloudfront.net/static/render/bg/BackgroundColor-1/Body-1/ClothingColor-1/Expression-1/EyeColor-1/FacialHair-0/FacialHairColor-1/Glasses-0/GlassesColor-1/Headwear-0/HeadwearColor-1/MainHair-58/MainHairColor-1/Nose%20Piercing-0/Piercings-0/SkinTone-15/Wrinkles-0/medium", path: "/profile" },
    { name: "Xem thêm", icon: "https://d35aaqx5ub95lt.cloudfront.net/vendor/7159c0b5d4250a5aea4f396d53f17f0c.svg", path: "#" },
  ];

  return (
    <aside className="w-[256px] h-screen sticky top-0 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex flex-col p-4 transition-colors duration-300 xl:flex hidden">
      {/* Logo */}
      <div className="mb-6 pl-4 pt-4">
        <img 
          src="https://d35aaqx5ub95lt.cloudfront.net/vendor/70a4be81077a8037698067f583816ff9.svg" 
          alt="Duolingo Logo" 
          className="h-9 dark:invert" /* invert giúp logo chữ Duolingo thành màu trắng khi ở dark mode */
        />
      </div>

      {/* Nav Links */}
      <nav className="flex flex-col gap-1">
        {navItems.map((item, index) => (
          <Link
            key={index}
            to={item.path}
            className="flex items-center gap-4 p-3 rounded-xl font-bold text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <img src={item.icon} alt={item.name} className="w-8 h-8 object-contain" />
            <span className="text-[15px] uppercase tracking-wide">{item.name}</span>
          </Link>
        ))}
      </nav>

      {/* Ad Box */}
      <div className="mt-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 rounded-2xl shadow-sm text-center">
        <img 
          src="https://d35aaqx5ub95lt.cloudfront.net/images/chess/sideBarAd/3549d5abe62aa4c972c692239ee8cc9c.svg" 
          alt="Quảng cáo" 
          className="w-full mb-3"
        />
        <p className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-1">Bạn muốn học cờ vua không?</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Có Duolingo, học gì cũng dễ!</p>
        <Link 
          to="/enroll/chess/ch"
          className="block w-full py-2.5 bg-[#58cc02] hover:bg-[#4cb001] text-white font-bold rounded-xl transition-colors uppercase text-sm tracking-wider"
        >
          Thử học cờ vua
        </Link>
      </div>
    </aside>
  );
}