export default function SocialButtons() {
  return (
    <>
      <div className="flex items-center my-4">
        <div className="flex-1 border-b border-gray-200" />
        <span className="px-3 text-sm text-gray-400">hoặc</span>
        <div className="flex-1 border-b border-gray-200" />
      </div>

      <button
        type="button"
        className="w-full flex items-center justify-center gap-2 border border-gray-200 rounded-md py-2.5 mt-2 font-medium text-gray-700 hover:bg-gray-50 transition-colors"
      >
        {/* Logo Google (SVG inline, tránh phụ thuộc ảnh ngoài) */}
        <svg className="w-5 h-5" viewBox="0 0 48 48">
          <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.9 32.6 29.4 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 3l5.7-5.7C34.7 6.1 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z"/>
          <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.8 1.1 8 3l5.7-5.7C34.7 6.1 29.6 4 24 4c-7.5 0-14 4.2-17.7 10.7z"/>
          <path fill="#4CAF50" d="M24 44c5.4 0 10.4-2.1 14.1-5.5l-6.5-5.5c-2 1.4-4.6 2.3-7.6 2.3-5.4 0-9.9-3.4-11.5-8.2l-6.6 5.1C9.9 39.7 16.4 44 24 44z"/>
          <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4.2 5.6l6.5 5.5C39.9 37.3 44 31.5 44 24c0-1.3-.1-2.7-.4-3.5z"/>
        </svg>
        Google
      </button>

      <button
        type="button"
        className="w-full flex items-center justify-center gap-2 border border-gray-200 rounded-md py-2.5 mt-2 font-medium text-gray-700 hover:bg-gray-50 transition-colors"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#1877F2">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
        Facebook
      </button>
    </>
  );
}