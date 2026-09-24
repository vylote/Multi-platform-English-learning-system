import { Link } from "react-router-dom";

export default function LeftSidebar() {
  const navItems = [
    { name: "Học", icon: "https://d35aaqx5ub95lt.cloudfront.net/vendor/784035717e2ff1d448c0f6cc4efc89fb.svg", path: "/learn" },
    { name: "Luyện đề", icon: "https://d35aaqx5ub95lt.cloudfront.net/vendor/5187f6694476a769d4a4e28149867e3e.svg", path: "/exams" },
    { name: "Ôn tập", icon: "https://d35aaqx5ub95lt.cloudfront.net/vendor/ca9178510134b4b0893dbac30b6670aa.svg", path: "/review" },
    { name: "Tra cứu", icon: "https://d35aaqx5ub95lt.cloudfront.net/vendor/3b4928101472fce4e9edac920c1b3817.svg", path: "/dictionary" },
    { name: "Hồ sơ", icon: "//d3gq3s1iyyx31w.cloudfront.net/static/render/bg/BackgroundColor-1/Body-1/ClothingColor-1/Expression-1/EyeColor-1/FacialHair-0/FacialHairColor-1/Glasses-0/GlassesColor-1/Headwear-0/HeadwearColor-1/MainHair-58/MainHairColor-1/Nose%20Piercing-0/Piercings-0/SkinTone-15/Wrinkles-0/medium", path: "/profile" },
    { name: "Xem thêm", icon: "https://d35aaqx5ub95lt.cloudfront.net/vendor/7159c0b5d4250a5aea4f396d53f17f0c.svg", path: "#" },
  ];

  return (
    <aside className="w-[256px] h-screen sticky top-0 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex flex-col p-4 transition-colors duration-300 xl:flex hidden">
      <div className="mb-6 pl-4 pt-4">
        <img
          src="https://d35aaqx5ub95lt.cloudfront.net/vendor/70a4be81077a8037698067f583816ff9.svg"
          alt="Logo"
          className="h-9 dark:invert"
        />
      </div>

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
    </aside>
  );
}