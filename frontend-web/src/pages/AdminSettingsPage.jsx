import { useState, useEffect, useMemo } from "react";
import toast from "react-hot-toast";
import {
  SlidersHorizontal,
  RotateCw,
  RotateCcw,
  Save,
  CheckCircle2,
  AlertTriangle,
  GraduationCap,
  Sparkles,
  Shield,
  Clock,
  BookOpen,
  Info,
  Check,
} from "lucide-react";

import api from "../api/api";
import AdminLayout from "../layouts/AdminLayout";

// Metadata hiển thị chi tiết cho từng nhóm cấu hình
const GROUP_META = {
  LEARNING: {
    title: "Học tập & Lộ trình",
    desc: "Cấu hình định lượng bài học, mục tiêu flashcard và trọng số tính độ thành thạo (Mastery).",
    icon: GraduationCap,
    badgeColor: "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30",
  },
  PLACEMENT: {
    title: "Xếp lớp đầu vào",
    desc: "Tiêu chuẩn phân loại trình độ (Beginner / Intermediate / Advanced) sau bài kiểm tra.",
    icon: BookOpen,
    badgeColor: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
  },
  EXAM: {
    title: "Thi cử & Chống gian lận",
    desc: "Khoảng đệm độ trễ mạng và các tham số bảo vệ tính trung thực khi nộp bài thi.",
    icon: Clock,
    badgeColor: "bg-amber-500/15 text-amber-800 dark:text-amber-400 border-amber-500/30",
  },
  SYSTEM: {
    title: "Công tắc Hệ thống",
    desc: "Bật/tắt chế độ bảo trì toàn hệ thống hoặc tạm khóa đăng ký thành viên mới.",
    icon: Shield,
    badgeColor: "bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30",
  },
  AI: {
    title: "Trí tuệ Nhân tạo (AI)",
    desc: "Kích hoạt hoặc vô hiệu hóa động cơ sinh câu hỏi tự động qua mô hình LLM Groq/XAI.",
    icon: Sparkles,
    badgeColor: "bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-500/30",
  },
};

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);

  // Dữ liệu gốc từ server (để so sánh thay đổi)
  const [originalSettings, setOriginalSettings] = useState({});
  // Form draft chỉnh sửa
  const [formValues, setFormValues] = useState({});
  // Danh sách metadata từng setting
  const [settingsList, setSettingsList] = useState([]);
  // Tab nhóm hiện tại ('ALL' | 'LEARNING' | 'PLACEMENT' | 'EXAM' | 'SYSTEM' | 'AI')
  const [activeTab, setActiveTab] = useState("ALL");
  // Modal xác nhận reset
  const [showResetModal, setShowResetModal] = useState(false);

  // Tải cấu hình từ API
  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await api.get("/admin/settings");
      const data = res.data?.result || {};
      const list = data.settings || [];

      const initialMap = {};
      list.forEach((item) => {
        initialMap[item.key] = item.value;
      });

      setSettingsList(list);
      setOriginalSettings(initialMap);
      setFormValues(initialMap);
    } catch (err) {
      console.error("Lỗi khi tải cấu hình:", err);
      toast.error(err.response?.data?.message || "Không thể tải cấu hình hệ thống.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  // Đếm số lượng thay đổi chưa lưu
  const changedKeys = useMemo(() => {
    const changed = [];
    Object.keys(formValues).forEach((key) => {
      if (String(formValues[key]) !== String(originalSettings[key])) {
        changed.push(key);
      }
    });
    return changed;
  }, [formValues, originalSettings]);

  const hasChanges = changedKeys.length > 0;

  // Cập nhật giá trị một setting trong draft
  const handleChange = (key, value) => {
    setFormValues((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // Hoàn tác các thay đổi chưa lưu
  const handleUndo = () => {
    setFormValues({ ...originalSettings });
    toast.success("Đã hoàn tác toàn bộ thay đổi chưa lưu.");
  };

  // Lưu cấu hình lên Server
  const handleSave = async () => {
    if (!hasChanges) return;

    try {
      setSaving(true);
      const payload = {};
      changedKeys.forEach((key) => {
        payload[key] = formValues[key];
      });

      const res = await api.put("/admin/settings", { settings: payload });
      const data = res.data?.result || {};
      const list = data.settings || [];

      const newMap = {};
      list.forEach((item) => {
        newMap[item.key] = item.value;
      });

      setSettingsList(list);
      setOriginalSettings(newMap);
      setFormValues(newMap);

      toast.success(
        res.data?.message || `Cập nhật thành công ${changedKeys.length} cấu hình hệ thống!`,
      );
    } catch (err) {
      console.error("Lỗi lưu cấu hình:", err);
      toast.error(err.response?.data?.message || "Lỗi khi lưu cấu hình.");
    } finally {
      setSaving(false);
    }
  };

  // Khôi phục về mặc định
  const handleResetDefaults = async () => {
    try {
      setResetting(true);
      const res = await api.post("/admin/settings/reset");
      const data = res.data?.result || {};
      const list = data.settings || [];

      const newMap = {};
      list.forEach((item) => {
        newMap[item.key] = item.value;
      });

      setSettingsList(list);
      setOriginalSettings(newMap);
      setFormValues(newMap);
      setShowResetModal(false);

      toast.success("Đã khôi phục toàn bộ cấu hình về giá trị mặc định chuẩn!");
    } catch (err) {
      console.error("Lỗi khôi phục cấu hình:", err);
      toast.error(err.response?.data?.message || "Lỗi khi khôi phục cấu hình.");
    } finally {
      setResetting(false);
    }
  };

  // Lọc settings theo tab
  const filteredSettings = useMemo(() => {
    if (activeTab === "ALL") return settingsList;
    return settingsList.filter((s) => s.groupName === activeTab);
  }, [settingsList, activeTab]);

  // Gom nhóm danh sách đã lọc
  const groupedList = useMemo(() => {
    const groups = {};
    filteredSettings.forEach((item) => {
      if (!groups[item.groupName]) {
        groups[item.groupName] = [];
      }
      groups[item.groupName].push(item);
    });
    return groups;
  }, [filteredSettings]);

  // Tính trực quan tỉ lệ trọng số Mastery (Vocab + Exam + Lesson)
  const masteryWeights = useMemo(() => {
    const v = parseFloat(formValues["learning.vocab_weight"]) || 0;
    const e = parseFloat(formValues["learning.exam_weight"]) || 0;
    const l = parseFloat(formValues["learning.lesson_weight"]) || 0;
    const sum = v + e + l;
    return {
      vocab: v,
      exam: e,
      lesson: l,
      sum: Math.round(sum * 100) / 100,
      isValid: Math.abs(sum - 1.0) < 0.01,
    };
  }, [formValues]);

  return (
    <AdminLayout>
      <div className="flex flex-col gap-6 pb-16 w-full max-w-7xl mx-auto">
        {/* ============ HEADER ============ */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-950 dark:text-white tracking-tight flex items-center gap-2.5">
              <SlidersHorizontal className="w-8 h-8 text-purple-600 dark:text-purple-400" />
              <span>Cấu hình Hệ thống & Thông số</span>
            </h1>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1 font-medium">
              Điều chỉnh các thông số vận hành, trọng số thuật toán học tập và các công tắc On/Off toàn hệ thống.
            </p>
          </div>

          {/* QUICK ACTION BUTTONS TRÊN HEADER */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={fetchSettings}
              disabled={loading || saving}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-2xl border-2 border-[#d5cdbd] dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-black text-xs uppercase tracking-wider hover:bg-black/5 dark:hover:bg-white/5 transition-all cursor-pointer shadow-2xs active:scale-95 disabled:opacity-50"
              title="Tải lại từ máy chủ"
            >
              <RotateCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Làm mới</span>
            </button>

            <button
              type="button"
              onClick={() => setShowResetModal(true)}
              disabled={loading || saving}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-2xl border-2 border-rose-300 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 font-black text-xs uppercase tracking-wider hover:bg-rose-100 dark:hover:bg-rose-950/50 transition-all cursor-pointer shadow-2xs active:scale-95 disabled:opacity-50"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Khôi phục chuẩn</span>
            </button>

            {hasChanges && (
              <div className="flex items-center gap-2 animate-in fade-in">
                <button
                  type="button"
                  onClick={handleUndo}
                  disabled={saving}
                  className="px-3.5 py-2.5 rounded-2xl border-2 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-black text-xs uppercase tracking-wider hover:bg-black/5 transition-all cursor-pointer shadow-2xs"
                >
                  Hoàn tác
                </button>

                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-black text-xs uppercase tracking-wider shadow-md shadow-purple-600/30 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  <Save className={`w-3.5 h-3.5 ${saving ? "animate-spin" : ""}`} />
                  <span>Lưu ({changedKeys.length})</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* THÔNG BÁO CÓ THAY ĐỔI CHƯA LƯU */}
        {hasChanges && (
          <div className="p-4 rounded-3xl bg-amber-500/10 border-2 border-amber-500/30 flex items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
              <p className="text-xs sm:text-sm font-bold text-amber-900 dark:text-amber-300">
                Bạn đang có <span className="font-black underline">{changedKeys.length}</span> thông số đã chỉnh sửa chưa lưu lên máy chủ.
              </p>
            </div>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black text-xs uppercase tracking-wider shadow-xs transition-all cursor-pointer shrink-0"
            >
              Lưu ngay
            </button>
          </div>
        )}

        {/* ============ 2-COLUMN BODY LAYOUT (SUB-MENU IN BODY) ============ */}
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* CỘT TRÁI: DỌC SUB-MENU DANH MỤC CẤU HÌNH (STICKY) */}
          <aside className="w-full lg:w-72 xl:w-80 shrink-0 flex flex-col gap-3 lg:sticky lg:top-4">
            <div className="p-3.5 sm:p-4 rounded-3xl bg-white dark:bg-[#18232c] border-2 border-[#d5cdbd] dark:border-gray-700 shadow-2xs flex flex-col gap-2">
              <div className="flex items-center justify-between px-2 pt-1 pb-2 border-b border-[#e4ded0] dark:border-gray-700/60">
                <span className="text-xs font-black uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>Menu cấu hình</span>
                </span>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-700 dark:text-purple-400">
                  {settingsList.length} mục
                </span>
              </div>

              {/* Nút "TẤT CẢ CẤU HÌNH" */}
              <button
                type="button"
                onClick={() => setActiveTab("ALL")}
                className={`w-full flex items-center justify-between p-3 rounded-2xl font-black text-xs tracking-tight transition-all cursor-pointer border-2 text-left ${
                  activeTab === "ALL"
                    ? "bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-600/30 active:scale-[0.98]"
                    : "bg-[#faf7f0] dark:bg-gray-800/60 border-transparent hover:border-purple-400/50 text-gray-800 dark:text-gray-200"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                      activeTab === "ALL"
                        ? "bg-white/20 text-white"
                        : "bg-purple-500/15 text-purple-600 dark:text-purple-400"
                    }`}
                  >
                    <SlidersHorizontal className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-black text-xs uppercase tracking-wider">Tất cả cấu hình</div>
                    <div
                      className={`text-[10px] font-medium lowercase ${
                        activeTab === "ALL"
                          ? "text-purple-100"
                          : "text-gray-500 dark:text-gray-400"
                      }`}
                    >
                      hiển thị toàn bộ nhóm
                    </div>
                  </div>
                </div>

                <span
                  className={`text-[11px] font-black px-2 py-0.5 rounded-full ${
                    activeTab === "ALL"
                      ? "bg-white/20 text-white"
                      : "bg-[#e4ded0] dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                  }`}
                >
                  {settingsList.length}
                </span>
              </button>

              {/* CÁC NÚT TỪNG NHÓM */}
              {Object.entries(GROUP_META).map(([grpKey, meta]) => {
                const count = settingsList.filter((s) => s.groupName === grpKey).length;
                const Icon = meta.icon;
                const isActive = activeTab === grpKey;

                return (
                  <button
                    key={grpKey}
                    type="button"
                    onClick={() => setActiveTab(grpKey)}
                    className={`w-full flex items-center justify-between p-3 rounded-2xl font-black text-xs tracking-tight transition-all cursor-pointer border-2 text-left ${
                      isActive
                        ? "bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-600/30 active:scale-[0.98]"
                        : "bg-[#faf7f0] dark:bg-gray-800/60 border-transparent hover:border-purple-400/50 text-gray-800 dark:text-gray-200"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                          isActive
                            ? "bg-white/20 text-white"
                            : "bg-purple-500/15 text-purple-600 dark:text-purple-400"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-black text-xs truncate">{meta.title}</div>
                        <div
                          className={`text-[10px] font-medium truncate ${
                            isActive
                              ? "text-purple-100"
                              : "text-gray-500 dark:text-gray-400"
                          }`}
                        >
                          {meta.desc}
                        </div>
                      </div>
                    </div>

                    <span
                      className={`text-[11px] font-black px-2 py-0.5 rounded-full shrink-0 ${
                        isActive
                          ? "bg-white/20 text-white"
                          : "bg-[#e4ded0] dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* QUICK STATUS CARD: TÓM TẮT TRẠNG THÁI TOÀN HỆ THỐNG */}
            <div className="p-4 rounded-3xl bg-white dark:bg-[#18232c] border-2 border-[#d5cdbd] dark:border-gray-700 shadow-2xs flex flex-col gap-3">
              <span className="text-[11px] font-black uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                <span>Trạng thái nhanh</span>
              </span>

              <div className="flex flex-col gap-2 text-xs font-bold">
                <div className="flex items-center justify-between p-2 rounded-xl bg-[#faf7f0] dark:bg-gray-800/60">
                  <span className="text-gray-700 dark:text-gray-300">Bảo trì:</span>
                  <span
                    className={`font-black px-2 py-0.5 rounded-md text-[11px] ${
                      formValues["system.maintenance_mode"]
                        ? "bg-rose-500/20 text-rose-700 dark:text-rose-400"
                        : "bg-emerald-500/20 text-emerald-700 dark:text-emerald-400"
                    }`}
                  >
                    {formValues["system.maintenance_mode"] ? "Đang bật" : "Bình thường"}
                  </span>
                </div>

                <div className="flex items-center justify-between p-2 rounded-xl bg-[#faf7f0] dark:bg-gray-800/60">
                  <span className="text-gray-700 dark:text-gray-300">Mở đăng ký:</span>
                  <span
                    className={`font-black px-2 py-0.5 rounded-md text-[11px] ${
                      formValues["system.allow_registration"]
                        ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-400"
                        : "bg-rose-500/20 text-rose-700 dark:text-rose-400"
                    }`}
                  >
                    {formValues["system.allow_registration"] ? "Đang mở" : "Tạm khóa"}
                  </span>
                </div>

                <div className="flex items-center justify-between p-2 rounded-xl bg-[#faf7f0] dark:bg-gray-800/60">
                  <span className="text-gray-700 dark:text-gray-300">AI Sinh đề:</span>
                  <span
                    className={`font-black px-2 py-0.5 rounded-md text-[11px] ${
                      formValues["ai.enable_generation"]
                        ? "bg-purple-500/20 text-purple-700 dark:text-purple-400"
                        : "bg-gray-500/20 text-gray-700 dark:text-gray-400"
                    }`}
                  >
                    {formValues["ai.enable_generation"] ? "Hoạt động" : "Vô hiệu"}
                  </span>
                </div>
              </div>
            </div>
          </aside>

          {/* CỘT PHẢI: NỘI DUNG CHI TIẾT CÁC THÔNG SỐ */}
          <main className="flex-1 w-full min-w-0 flex flex-col gap-6">
            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3">
                <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-xs font-black uppercase tracking-wider text-gray-500">
                  Đang tải danh sách cấu hình hệ thống...
                </p>
              </div>
            ) : Object.keys(groupedList).length === 0 ? (
              <div className="py-16 text-center text-gray-500 font-bold">
                Không tìm thấy thông số nào trong nhóm này.
              </div>
            ) : (
              <div className="flex flex-col gap-8">
                {Object.entries(groupedList).map(([grpKey, items]) => {
                  const meta = GROUP_META[grpKey] || {
                    title: grpKey,
                    desc: "",
                    icon: SlidersHorizontal,
                    badgeColor: "bg-gray-500/15 text-gray-700 border-gray-500/30",
                  };
                  const GroupIcon = meta.icon;

                  return (
                    <div
                      key={grpKey}
                      className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#18232c] border-2 border-[#d5cdbd] dark:border-gray-700 shadow-2xs flex flex-col gap-5 transition-all"
                    >
                      {/* GROUP HEADER */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[#e4ded0] dark:border-gray-700/60">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-purple-500/15 text-purple-700 dark:text-purple-400 flex items-center justify-center font-black shrink-0">
                            <GroupIcon className="w-5 h-5" />
                          </div>
                          <div>
                            <h2 className="text-lg font-black text-gray-950 dark:text-white tracking-tight">
                              {meta.title}
                            </h2>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5 font-medium">
                              {meta.desc}
                            </p>
                          </div>
                        </div>

                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border self-start sm:self-auto ${meta.badgeColor}`}
                        >
                          <span>{items.length} THÔNG SỐ</span>
                        </span>
                      </div>

                      {/* SPECIAL WIDGET: THANH TRỰC QUAN TRỌNG SỐ CHO NHÓM LEARNING */}
                      {grpKey === "LEARNING" && (
                        <div className="p-4 rounded-2xl bg-[#f4efe4] dark:bg-gray-800/60 border border-[#d5cdbd] dark:border-gray-700 flex flex-col gap-2.5">
                          <div className="flex items-center justify-between text-xs font-black">
                            <span className="text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
                              <Info className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                              <span>Tổng phân bổ Trọng số Độ thành thạo (Mastery)</span>
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-lg text-xs font-black ${
                                masteryWeights.isValid
                                  ? "bg-emerald-500/20 text-emerald-800 dark:text-emerald-400"
                                  : "bg-rose-500/20 text-rose-800 dark:text-rose-400"
                              }`}
                            >
                              Tổng: {Math.round(masteryWeights.sum * 100)}%{" "}
                              {masteryWeights.isValid ? "✓ Chuẩn (100%)" : "⚠️ Cần bằng 100%"}
                            </span>
                          </div>

                          {/* PROGRESS BAR 3 MÀU */}
                          <div className="w-full h-3.5 rounded-full bg-[#d5cdbd] dark:bg-gray-700 overflow-hidden flex">
                            <div
                              style={{
                                width: `${Math.max(0, Math.min(100, (masteryWeights.vocab / (masteryWeights.sum || 1)) * 100))}%`,
                              }}
                              className="h-full bg-blue-500 transition-all duration-300"
                              title={`Từ vựng: ${Math.round(masteryWeights.vocab * 100)}%`}
                            />
                            <div
                              style={{
                                width: `${Math.max(0, Math.min(100, (masteryWeights.exam / (masteryWeights.sum || 1)) * 100))}%`,
                              }}
                              className="h-full bg-purple-500 transition-all duration-300"
                              title={`Bài thi: ${Math.round(masteryWeights.exam * 100)}%`}
                            />
                            <div
                              style={{
                                width: `${Math.max(0, Math.min(100, (masteryWeights.lesson / (masteryWeights.sum || 1)) * 100))}%`,
                              }}
                              className="h-full bg-emerald-500 transition-all duration-300"
                              title={`Bài học: ${Math.round(masteryWeights.lesson * 100)}%`}
                            />
                          </div>

                          <div className="flex items-center gap-4 text-[11px] font-bold text-gray-600 dark:text-gray-400 flex-wrap">
                            <span className="flex items-center gap-1.5">
                              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />
                              Từ vựng ({Math.round(masteryWeights.vocab * 100)}%)
                            </span>
                            <span className="flex items-center gap-1.5">
                              <span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block" />
                              Bài thi ({Math.round(masteryWeights.exam * 100)}%)
                            </span>
                            <span className="flex items-center gap-1.5">
                              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                              Bài thực hành ({Math.round(masteryWeights.lesson * 100)}%)
                            </span>
                          </div>
                        </div>
                      )}

                      {/* LIST CỦA TỪNG SETTING ITEM TRONG GROUP */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {items.map((item) => {
                          const currentValue = formValues[item.key] ?? item.value;
                          const isModified =
                            String(currentValue) !== String(originalSettings[item.key]);

                          return (
                            <div
                              key={item.key}
                              className={`p-4 rounded-2xl border-2 transition-all flex flex-col justify-between gap-3 ${
                                isModified
                                  ? "bg-purple-50/50 dark:bg-purple-950/20 border-purple-400 dark:border-purple-600/70 shadow-xs"
                                  : "bg-[#faf7f0] dark:bg-gray-800/40 border-[#e4ded0] dark:border-gray-700/80 hover:border-[#d5cdbd] dark:hover:border-gray-600"
                              }`}
                            >
                              {/* LABEL & DESC */}
                              <div>
                                <div className="flex items-center justify-between gap-2 mb-1">
                                  <h3 className="text-sm font-black text-gray-950 dark:text-white leading-snug">
                                    {item.label}
                                  </h3>
                                  {isModified && (
                                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-600 text-white shrink-0 animate-pulse">
                                      Đã sửa
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-gray-600 dark:text-gray-400 font-medium leading-relaxed">
                                  {item.description}
                                </p>
                              </div>

                              {/* CONTROL INTERFACE DỰA THEO DATA_TYPE */}
                              <div className="pt-2 border-t border-[#e4ded0] dark:border-gray-700/60 flex items-center justify-between gap-3">
                                <span className="text-[11px] font-mono text-gray-600 dark:text-gray-400 select-all truncate">
                                  {item.key}
                                </span>

                                {/* --- BOOLEAN TOGGLE --- */}
                                {item.dataType === "boolean" ? (
                                  <div className="flex items-center gap-2.5 shrink-0">
                                    <span
                                      className={`text-xs font-black ${
                                        currentValue
                                          ? "text-emerald-700 dark:text-emerald-400"
                                          : "text-gray-600 dark:text-gray-400"
                                      }`}
                                    >
                                      {currentValue ? "Đang bật" : "Đang tắt"}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => handleChange(item.key, !currentValue)}
                                      className={`relative inline-flex h-7 w-13 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                                        currentValue ? "bg-emerald-600" : "bg-gray-300 dark:bg-gray-700"
                                      }`}
                                    >
                                      <span
                                        className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                                          currentValue ? "translate-x-6" : "translate-x-0"
                                        }`}
                                      />
                                    </button>
                                  </div>
                                ) : item.dataType === "number" ? (
                                  /* --- NUMBER INPUT --- */
                                  <div className="flex items-center gap-1.5 shrink-0">
                                    <input
                                      type="number"
                                      step={
                                        item.key.includes("weight") || item.key.includes("max")
                                          ? "0.05"
                                          : "1"
                                      }
                                      value={currentValue}
                                      onChange={(e) =>
                                        handleChange(item.key, parseFloat(e.target.value) || 0)
                                      }
                                      className="w-24 px-3 py-1.5 rounded-xl border-2 border-[#d5cdbd] dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-black text-right text-sm focus:outline-hidden focus:border-purple-600 transition-all"
                                    />
                                    {item.key.includes("threshold") && (
                                      <span className="text-xs font-black text-gray-600 dark:text-gray-400">
                                        %
                                      </span>
                                    )}
                                    {item.key.includes("seconds") && (
                                      <span className="text-xs font-black text-gray-600 dark:text-gray-400">
                                        giây
                                      </span>
                                    )}
                                    {item.key.includes("lesson") && !item.key.includes("weight") && (
                                      <span className="text-xs font-black text-gray-600 dark:text-gray-400">
                                        mục
                                      </span>
                                    )}
                                    {item.key.includes("target") && (
                                      <span className="text-xs font-black text-gray-600 dark:text-gray-400">
                                        từ
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  /* --- TEXT INPUT --- */
                                  <input
                                    type="text"
                                    value={currentValue}
                                    onChange={(e) => handleChange(item.key, e.target.value)}
                                    className="w-48 px-3 py-1.5 rounded-xl border-2 border-[#d5cdbd] dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-medium text-xs focus:outline-hidden focus:border-purple-600 transition-all"
                                  />
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </main>
        </div>

        {/* ============ FLOATING ACTION BAR KHI CÓ THAY ĐỔI ============ */}
        {hasChanges && (
          <div className="fixed bottom-6 right-6 z-40 bg-gray-900/90 dark:bg-purple-950/90 backdrop-blur-md text-white px-5 py-3.5 rounded-3xl shadow-2xl border border-white/10 flex items-center gap-4 animate-in slide-in-from-bottom-5">
            <div className="flex items-center gap-2 text-xs font-black">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping inline-block" />
              <span>Có {changedKeys.length} thay đổi chưa lưu</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleUndo}
                disabled={saving}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-black uppercase tracking-wider transition-all cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-black uppercase tracking-wider shadow-md transition-all cursor-pointer active:scale-95 disabled:opacity-50"
              >
                <Save className={`w-3.5 h-3.5 ${saving ? "animate-spin" : ""}`} />
                <span>Lưu ngay</span>
              </button>
            </div>
          </div>
        )}

        {/* ============ MODAL XÁC NHẬN RESET TO DEFAULTS ============ */}
        {showResetModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
            <div className="w-full max-w-md rounded-3xl bg-white dark:bg-gray-900 border-2 border-[#d5cdbd] dark:border-gray-700 p-6 shadow-2xl flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center font-black shrink-0">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-gray-950 dark:text-white">
                    Khôi phục cấu hình chuẩn?
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Thao tác này sẽ thiết lập lại toàn bộ {settingsList.length} thông số về giá trị mặc định ban đầu của hệ thống.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#faf7f0] dark:bg-gray-800 text-xs font-medium text-gray-700 dark:text-gray-300 border border-[#e4ded0] dark:border-gray-700/60 leading-relaxed">
                • Trọng số học tập sẽ về: Từ vựng (50%), Bài thi (25%), Bài học (25%).<br />
                • Ngưỡng mở khóa: 60%.<br />
                • Mốc xếp lớp: Beginner &lt; 5.0, Intermediate &lt; 8.0.<br />
                • Chế độ bảo trì sẽ được tắt (Tất cả học viên truy cập bình thường).
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowResetModal(false)}
                  disabled={resetting}
                  className="px-4 py-2.5 rounded-2xl border-2 border-[#d5cdbd] dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-black text-xs uppercase tracking-wider hover:bg-black/5 transition-all cursor-pointer"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  onClick={handleResetDefaults}
                  disabled={resetting}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs uppercase tracking-wider shadow-md shadow-rose-600/30 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  <RotateCcw className={`w-4 h-4 ${resetting ? "animate-spin" : ""}`} />
                  <span>{resetting ? "Đang khôi phục..." : "Xác nhận khôi phục"}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
