import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/api";
import MainLayout from "../layouts/MainLayout";
import Pagination from "../components/Pagination";

export default function ExamListPage() {
  const { topicId } = useParams();
  const navigate = useNavigate();

  const [exams, setExams] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  
  // Khởi tạo là true để cover luôn hiệu ứng loading của lần truy cập đầu tiên
  const [loading, setLoading] = useState(true); 
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    
    // Đã xóa setLoading(true) ở đây để tránh lỗi "cascading renders" của React

    api
      .get(`/exams`, {
        params: { topic_id: topicId, page, pageSize: 12 },
        signal: controller.signal,
      })
      .then((res) => {
        const result = res.data?.result || {};
        
        // KỸ THUẬT FALLBACK: Dự phòng mọi cách đặt tên field trong PageResponse
        const dataList = result.data || result.items || result.exams || result.content || [];
        const totalPgs = result.totalPages || result.total_pages || result.totalPage || 1;
        const currPage = result.currentPage || result.current_page || result.page || page;

        setExams(Array.isArray(dataList) ? dataList : []);
        setTotalPages(totalPgs);
        setPage(currPage);
      })
      .catch((error) => {
        if (error.code === "ERR_CANCELED") return;
        setLoadError(error.response?.data?.message || "Không thể tải danh sách đề thi.");
        setExams([]);
      })
      .finally(() => {
        setLoading(false);
      });

    return () => controller.abort();
  }, [topicId, page]);

  return (
    <MainLayout>
      <div className="py-6">
        <div className="mb-8">
          <button 
            onClick={() => navigate('/learn')}
            className="text-sm font-semibold text-gray-500 hover:text-gray-900 dark:hover:text-white mb-2"
          >
            ← Quay lại danh sách Chủ đề
          </button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Danh sách đề thi
          </h1>
        </div>

        {loadError && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-xl mb-6 text-sm">
            {loadError}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-20 text-gray-400 dark:text-gray-500">
            Đang tải dữ liệu...
          </div>
        ) : exams.length === 0 ? (
          <div className="text-center py-20 text-gray-500 dark:text-gray-400 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl">
            Chủ đề này hiện chưa có đề thi nào.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {exams.map((exam) => (
                <div 
                  key={exam.id}
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 flex flex-col justify-between min-h-[170px] hover:shadow-[0_6px_18px_rgba(0,0,0,0.06)] dark:hover:shadow-black/30 transition-shadow cursor-pointer group"
                  onClick={() => navigate(`/learn/exams/${exam.id}`)}
                >
                  <div>
                    <h2 className="text-base font-bold text-gray-900 dark:text-white mb-2 line-clamp-2 group-hover:text-[#007bff] transition-colors">
                      {exam.title}
                    </h2>
                    
                    <div className="text-[0.85rem] text-gray-500 dark:text-gray-400 mb-2 space-y-1">
                      <div>⏰ {exam.duration} phút</div>
                      <div>{exam.question_count ? `${exam.question_count} câu hỏi` : "Đang cập nhật câu hỏi"}</div>
                    </div>

                    <div className="flex flex-wrap gap-1 mt-3">
                      <span className="inline-block bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded px-2 py-1 text-[0.7rem] font-medium">
                        IELTS Academic
                      </span>
                    </div>
                  </div>

                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/learn/exams/${exam.id}`);
                    }}
                    className="mt-4 w-full py-2 rounded-lg border border-[#007bff] text-[#007bff] font-semibold text-sm hover:bg-[#007bff] hover:text-white transition-colors"
                  >
                    Chi tiết
                  </button>
                </div>
              ))}
            </div>

            <Pagination 
              page={page} 
              totalPages={totalPages} 
              onChange={(newPage) => {
                // Xử lý state loading ngay tại sự kiện click để tuân thủ luật của React
                setLoading(true); 
                setPage(newPage);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }} 
            />
          </>
        )}
      </div>
    </MainLayout>
  );
}