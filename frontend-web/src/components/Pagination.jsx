export default function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;

  const maxButtons = 7;
  let start = Math.max(1, page - 3);
  let end = Math.min(totalPages, start + maxButtons - 1);
  if (end - start < maxButtons - 1) start = Math.max(1, end - maxButtons + 1);

  const pages = [];
  for (let i = start; i <= end; i++) pages.push(i);

  const baseBtn = "min-w-[38px] h-[38px] flex items-center justify-center rounded-lg text-sm font-medium border transition-colors";
  const idleBtn = `${baseBtn} border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800`;

  return (
    <nav className="flex items-center justify-center gap-2 mt-8" aria-label="Phân trang">
      <button onClick={() => onChange(page - 1)} disabled={page === 1} className={`${idleBtn} disabled:opacity-40 disabled:pointer-events-none`}>«</button>

      {start > 1 && (
        <>
          <button onClick={() => onChange(1)} className={idleBtn}>1</button>
          {start > 2 && <span className="px-1 text-gray-400">…</span>}
        </>
      )}

      {pages.map((p) => (
        <button
          key={p}
          onClick={() => onChange(p)}
          className={p === page ? `${baseBtn} bg-[#58cc02] border-[#58cc02] text-white` : idleBtn}
        >
          {p}
        </button>
      ))}

      {end < totalPages && (
        <>
          {end < totalPages - 1 && <span className="px-1 text-gray-400">…</span>}
          <button onClick={() => onChange(totalPages)} className={idleBtn}>{totalPages}</button>
        </>
      )}

      <button onClick={() => onChange(page + 1)} disabled={page === totalPages} className={`${idleBtn} disabled:opacity-40 disabled:pointer-events-none`}>»</button>
    </nav>
  );
}