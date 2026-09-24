import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import AuthLayout from "../layouts/AuthLayout";
import { useDispatch } from "react-redux";
import { updateUser } from "../store/slice/authSlice";

export default function OnboardingPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [experience, setExperience] = useState(null); // 'BEGINNER' | 'EXPERIENCED'
  const [submitting, setSubmitting] = useState(false);

  const handleSelectExperience = (level) => {
    setExperience(level);
    setStep(2);
  };

  const dispatch = useDispatch();

  const handleSubmitPurpose = async (purpose = null) => {
    setSubmitting(true);
    try {
      // Gửi data Onboarding lên Backend
      const response = await api.post("/onboarding/complete-info", {
        experience_level: experience,
        learning_purpose: purpose,
      });

      // 1. Cập nhật Redux ngay lập tức bằng dữ liệu BE trả về
      // response.data.result chính là updatedUser từ backend
      if (response.data?.result) {
        dispatch(updateUser(response.data.result));
      } else {
        // Hoặc update cứng (mock) nếu Backend chưa kịp trả data về
        dispatch(
          updateUser({ tier: experience === "BEGINNER" ? "BEGINNER" : null }),
        );
      }

      if (experience === "BEGINNER") {
        // Vào thẳng Learning Path
        navigate("/learn");
      } else {
        // Chuyển hướng sang làm Placement Test
        navigate("/placement-test");
      }
    } catch (error) {
      console.error("Lỗi lưu thông tin onboarding:", error);
    } finally {
      setSubmitting(false);
    }
  };

  if (step === 1) {
    return (
      <AuthLayout>
        <h1 className="text-2xl font-bold text-center mb-6 text-gray-900 dark:text-white">
          Bạn đã biết tiếng Anh chưa?
        </h1>
        <div className="space-y-3">
          <button
            onClick={() => handleSelectExperience("BEGINNER")}
            className="w-full p-4 text-left border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:border-[#58cc02] hover:bg-[#58cc02]/5 dark:hover:bg-[#58cc02]/10 transition-colors font-bold text-gray-700 dark:text-gray-200"
          >
            Mới bắt đầu
          </button>
          <button
            onClick={() => handleSelectExperience("EXPERIENCED")}
            className="w-full p-4 text-left border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:border-[#58cc02] hover:bg-[#58cc02]/5 dark:hover:bg-[#58cc02]/10 transition-colors font-bold text-gray-700 dark:text-gray-200"
          >
            Đã biết ít nhiều
          </button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout onBack={() => setStep(1)}>
      <h1 className="text-2xl font-bold text-center mb-6 text-gray-900 dark:text-white">
        Bạn học tiếng Anh để làm gì?
      </h1>
      <div className="space-y-3 mb-6">
        {[
          { id: "COMMUNICATION", label: "Giao tiếp hàng ngày" },
          { id: "CAREER", label: "Công việc & Sự nghiệp" },
          { id: "TRAVEL", label: "Du lịch" },
          { id: "HOBBY", label: "Sở thích cá nhân" },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => handleSubmitPurpose(item.id)}
            disabled={submitting}
            className="w-full p-4 text-left border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:border-[#58cc02] hover:bg-[#58cc02]/5 dark:hover:bg-[#58cc02]/10 transition-colors font-bold text-gray-700 dark:text-gray-200 disabled:opacity-50"
          >
            {item.label}
          </button>
        ))}
      </div>

      <button
        onClick={() => handleSubmitPurpose(null)} // Bỏ qua
        disabled={submitting}
        className="w-full py-3 rounded-xl font-bold text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
      >
        Bỏ qua
      </button>
    </AuthLayout>
  );
}
