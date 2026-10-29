import { useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";
import {
  Users,
  Search,
  UserCheck,
  UserCog,
  Crown,
  GraduationCap,
  Calendar,
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Sparkles,
  X,
  Check,
} from "lucide-react";

import api from "../api/api";
import AdminLayout from "../layouts/AdminLayout";

const TIER_META = {
  BEGINNER: { label: "Cơ bản", color: "#58cc02" },
  INTERMEDIATE: { label: "Trung cấp", color: "#1cb0f6" },
  ADVANCED: { label: "Nâng cao", color: "#ce82ff" },
};

export default function AdminUsersPage() {
  const currentAdmin = useSelector((state) => state.auth.user);

  // Danh sách users & phân trang
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [stats, setStats] = useState({ totalUsers: 0, totalStudents: 0, totalAdmins: 0, newUsersWeek: 0 });
  const [loading, setLoading] = useState(true);

  // Bộ lọc
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [tierFilter, setTierFilter] = useState("ALL");

  // Danh sách Roles hệ thống để phân quyền
  const [roles, setRoles] = useState([]);

  // Modal phân quyền
  const [selectedUserForRole, setSelectedUserForRole] = useState(null);
  const [newRoleId, setNewRoleId] = useState("");
  const [updatingRole, setUpdatingRole] = useState(false);

  // 1. Tải danh sách Roles hệ thống
  useEffect(() => {
    api
      .get("/admin/roles")
      .then((res) => setRoles(res.data?.result || []))
      .catch((err) => console.error("Không thể tải danh sách vai trò: ", err));
  }, []);

  // 2. Tải thống kê người dùng
  const fetchStats = useCallback(() => {
    api
      .get("/admin/users/stats")
      .then((res) => setStats(res.data?.result || {}))
      .catch((err) => console.error("Không thể tải thống kê: ", err));
  }, []);

  // 3. Tải danh sách người dùng kèm bộ lọc
  const fetchUsers = useCallback(
    (pageToLoad = 1) => {
      setLoading(true);
      api
        .get("/admin/users", {
          params: {
            page: pageToLoad,
            limit: 10,
            search: search.trim() || undefined,
            role: roleFilter !== "ALL" ? roleFilter : undefined,
            tier: tierFilter !== "ALL" ? tierFilter : undefined,
          },
        })
        .then((res) => {
          const result = res.data?.result;
          setUsers(result?.users || []);
          if (result?.pagination) {
            setPagination(result.pagination);
          }
        })
        .catch((err) => {
          toast.error(err.response?.data?.message || "Không thể tải danh sách người dùng.");
        })
        .finally(() => setLoading(false));
    },
    [search, roleFilter, tierFilter]
  );

  useEffect(() => {
    fetchStats();
    fetchUsers(1);
  }, [fetchStats, fetchUsers]);

  // Xử lý tìm kiếm khi Submit form
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchUsers(1);
  };

  // Mở modal phân quyền
  const handleOpenRoleModal = (user) => {
    setSelectedUserForRole(user);
    setNewRoleId(user.role_id?.toString() || "");
  };

  // Đóng modal phân quyền
  const handleCloseRoleModal = () => {
    setSelectedUserForRole(null);
    setNewRoleId("");
    setUpdatingRole(false);
  };

  // Lưu phân quyền vai trò
  const handleSaveUserRole = async () => {
    if (!selectedUserForRole || !newRoleId) return;

    if (
      Number(selectedUserForRole.id) === Number(currentAdmin?.id) &&
      roles.find((r) => r.id.toString() === newRoleId.toString())?.code !== "ADMIN"
    ) {
      toast.error("Bạn không thể tự thu hồi quyền Quản trị viên của chính mình.");
      return;
    }

    setUpdatingRole(true);
    try {
      await api.put(`/admin/users/${selectedUserForRole.id}/role`, {
        role_id: parseInt(newRoleId, 10),
      });

      toast.success(`Đã cập nhật vai trò cho người dùng ${selectedUserForRole.username}!`);
      handleCloseRoleModal();

      // Cập nhật lại danh sách và thống kê
      fetchUsers(pagination.page);
      fetchStats();
    } catch (err) {
      toast.error(err.response?.data?.message || "Cập nhật vai trò thất bại.");
      setUpdatingRole(false);
    }
  };

  return (
    <AdminLayout>
      <div className="flex flex-col gap-6 text-left">
        {/* ============ 1. HEADER TITLE & QUICK ACTIONS ============ */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-950 dark:text-white tracking-tight flex items-center gap-2.5">
              <Users className="w-8 h-8 text-purple-600 dark:text-purple-400" />
              <span>Quản lý người dùng & Phân quyền</span>
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1 font-medium">
              Xem danh sách tài khoản, kiểm tra tiến độ học tập và quản lý quyền hạn thành viên.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              fetchStats();
              fetchUsers(pagination.page);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white dark:bg-gray-800 border-2 border-[#d5cdbd] dark:border-gray-700 hover:border-purple-600 dark:hover:border-purple-500 text-gray-700 dark:text-gray-200 text-xs font-black uppercase tracking-wider transition-all shadow-2xs active:scale-95 cursor-pointer self-start sm:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Làm mới</span>
          </button>
        </div>

        {/* ============ 2. STATS OVERVIEW CARDS (4 CARDS) ============ */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Card 1: Tổng người dùng */}
          <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#18232c] border-2 border-[#d5cdbd] dark:border-gray-700 shadow-2xs">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/15 text-purple-700 dark:text-purple-400 flex items-center justify-center mb-2 font-black">
              <Users className="w-5 h-5" />
            </div>
            <p className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">
              {stats.totalUsers}
            </p>
            <p className="text-xs font-black uppercase tracking-wider text-gray-500 dark:text-gray-400 mt-0.5">
              Tổng tài khoản
            </p>
          </div>

          {/* Card 2: Học viên */}
          <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#18232c] border-2 border-[#d5cdbd] dark:border-gray-700 shadow-2xs">
            <div className="w-10 h-10 rounded-2xl bg-[#58cc02]/15 text-[#58cc02] flex items-center justify-center mb-2 font-black">
              <UserCheck className="w-5 h-5" />
            </div>
            <p className="text-2xl sm:text-3xl font-black text-[#58cc02]">
              {stats.totalStudents}
            </p>
            <p className="text-xs font-black uppercase tracking-wider text-gray-500 dark:text-gray-400 mt-0.5">
              Học viên (Student)
            </p>
          </div>

          {/* Card 3: Quản trị viên */}
          <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#18232c] border-2 border-[#d5cdbd] dark:border-gray-700 shadow-2xs">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-2 font-black">
              <Crown className="w-5 h-5 text-amber-500" />
            </div>
            <p className="text-2xl sm:text-3xl font-black text-purple-600 dark:text-purple-400">
              {stats.totalAdmins}
            </p>
            <p className="text-xs font-black uppercase tracking-wider text-gray-500 dark:text-gray-400 mt-0.5">
              Quản trị viên (Admin)
            </p>
          </div>

          {/* Card 4: Người dùng mới 7 ngày qua */}
          <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#18232c] border-2 border-[#d5cdbd] dark:border-gray-700 shadow-2xs">
            <div className="w-10 h-10 rounded-2xl bg-orange-500/15 text-orange-600 dark:text-orange-400 flex items-center justify-center mb-2 font-black">
              <Calendar className="w-5 h-5" />
            </div>
            <p className="text-2xl sm:text-3xl font-black text-orange-500">
              +{stats.newUsersWeek}
            </p>
            <p className="text-xs font-black uppercase tracking-wider text-gray-500 dark:text-gray-400 mt-0.5">
              Mới trong 7 ngày
            </p>
          </div>
        </div>

        {/* ============ 3. FILTER & SEARCH BAR ============ */}
        <div className="p-4 rounded-3xl bg-white dark:bg-[#18232c] border-2 border-[#d5cdbd] dark:border-gray-700 shadow-2xs">
          <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                placeholder="Tìm theo Tên đăng nhập hoặc Email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl border-2 border-[#d5cdbd] dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 text-xs sm:text-sm font-bold outline-none focus:border-purple-600 transition-all"
              />
            </div>

            {/* Role Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400 hidden sm:inline" />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-3.5 py-2.5 rounded-2xl border-2 border-[#d5cdbd] dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-xs sm:text-sm font-bold outline-none focus:border-purple-600 transition-all cursor-pointer"
              >
                <option value="ALL">Tất cả vai trò</option>
                <option value="STUDENT">Học viên (STUDENT)</option>
                <option value="ADMIN">Quản trị viên (ADMIN)</option>
              </select>

              {/* Tier Filter */}
              <select
                value={tierFilter}
                onChange={(e) => setTierFilter(e.target.value)}
                className="px-3.5 py-2.5 rounded-2xl border-2 border-[#d5cdbd] dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-xs sm:text-sm font-bold outline-none focus:border-purple-600 transition-all cursor-pointer"
              >
                <option value="ALL">Tất cả trình độ</option>
                <option value="BEGINNER">Cơ bản (Beginner)</option>
                <option value="INTERMEDIATE">Trung cấp (Intermediate)</option>
                <option value="ADVANCED">Nâng cao (Advanced)</option>
              </select>

              <button
                type="submit"
                className="px-4 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-black text-xs sm:text-sm uppercase tracking-wider transition-all shadow-xs cursor-pointer active:scale-95 shrink-0"
              >
                Tìm
              </button>
            </div>
          </form>
        </div>

        {/* ============ 4. USER DATA TABLE ============ */}
        <div className="rounded-3xl border-2 border-[#d5cdbd] dark:border-gray-700 bg-white dark:bg-[#18232c] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-[#d5cdbd] dark:border-gray-700 bg-gray-50/75 dark:bg-gray-800/60 text-[11px] font-black uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  <th className="py-3.5 px-4 sm:px-6">ID</th>
                  <th className="py-3.5 px-4 sm:px-6">Người dùng</th>
                  <th className="py-3.5 px-4">Vai trò (Role)</th>
                  <th className="py-3.5 px-4">Trình độ (Tier)</th>
                  <th className="py-3.5 px-4">Ngày đăng ký</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Phân quyền</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-xs sm:text-sm font-bold">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="py-12 text-center text-gray-400 font-semibold">
                      <div className="w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                      <span>Đang tải dữ liệu người dùng...</span>
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-12 text-center text-gray-400 font-semibold">
                      Không tìm thấy người dùng nào phù hợp với bộ lọc.
                    </td>
                  </tr>
                ) : (
                  users.map((u) => {
                    const isSelf = Number(u.id) === Number(currentAdmin?.id);
                    const isAdmin = u.role_code === "ADMIN";
                    const tierMeta = u.tier ? TIER_META[u.tier] : null;

                    return (
                      <tr
                        key={u.id}
                        className="hover:bg-purple-500/5 dark:hover:bg-purple-500/10 transition-colors"
                      >
                        {/* ID */}
                        <td className="py-3.5 px-4 sm:px-6 text-gray-400 font-mono text-xs">
                          #{u.id}
                        </td>

                        {/* Người dùng: Avatar + Username + Email */}
                        <td className="py-3.5 px-4 sm:px-6">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-sm shrink-0 shadow-xs ${
                                isAdmin
                                  ? "bg-gradient-to-br from-purple-600 to-purple-800"
                                  : "bg-gradient-to-br from-[#58cc02] to-[#46a302]"
                              }`}
                            >
                              {u.username?.[0]?.toUpperCase() || "U"}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="font-black text-gray-950 dark:text-white truncate">
                                  {u.username}
                                </span>
                                {isSelf && (
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                                    Bạn
                                  </span>
                                )}
                              </div>
                              <span className="text-xs text-gray-500 dark:text-gray-400 block truncate">
                                {u.email}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Vai trò (Role Badge) */}
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider border ${
                              isAdmin
                                ? "bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30"
                                : "bg-[#58cc02]/15 text-[#1c7400] dark:text-[#58cc02] border-[#58cc02]/30"
                            }`}
                          >
                            {isAdmin ? (
                              <Crown className="w-3.5 h-3.5 text-amber-500" />
                            ) : (
                              <GraduationCap className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            )}
                            <span>{u.role_name || u.role_code}</span>
                          </span>
                        </td>

                        {/* Trình độ (Tier) */}
                        <td className="py-3.5 px-4">
                          {tierMeta ? (
                            <span
                              className="px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider inline-block"
                              style={{
                                backgroundColor: `${tierMeta.color}15`,
                                color: tierMeta.color,
                                border: `1px solid ${tierMeta.color}35`,
                              }}
                            >
                              {tierMeta.label}
                            </span>
                          ) : (
                            <span className="text-gray-400 text-xs font-semibold">Chưa test</span>
                          )}
                        </td>

                        {/* Ngày tạo */}
                        <td className="py-3.5 px-4 text-xs text-gray-500 dark:text-gray-400 font-medium whitespace-nowrap">
                          {u.created_at
                            ? new Date(u.created_at).toLocaleDateString("vi-VN", {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                              })
                            : "–"}
                        </td>

                        {/* Hành động: Phân quyền / Đổi vai trò */}
                        <td className="py-3.5 px-4 sm:px-6 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleOpenRoleModal(u)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-black text-xs uppercase tracking-wider bg-gray-100 hover:bg-purple-600 dark:bg-gray-800 dark:hover:bg-purple-600 text-gray-700 hover:text-white dark:text-gray-200 dark:hover:text-white border border-[#d5cdbd] dark:border-gray-700 hover:border-purple-600 transition-all cursor-pointer shadow-2xs active:scale-95"
                          >
                            <UserCog className="w-3.5 h-3.5" />
                            <span>Đổi vai trò</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* ============ PAGINATION ============ */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-t-2 border-[#d5cdbd] dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/40 text-xs font-bold text-gray-500 dark:text-gray-400">
              <span>
                Trang {pagination.page} / {pagination.totalPages} (Tổng cộng {pagination.total} người dùng)
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={pagination.page <= 1}
                  onClick={() => fetchUsers(pagination.page - 1)}
                  className="p-1.5 rounded-xl border border-[#d5cdbd] dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => fetchUsers(pagination.page + 1)}
                  className="p-1.5 rounded-xl border border-[#d5cdbd] dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ============ 5. ROLE ASSIGNMENT MODAL ============ */}
        {selectedUserForRole && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn"
            onClick={handleCloseRoleModal}
          >
            <div
              className="relative max-w-md w-full rounded-3xl border-2 border-[#d5cdbd] dark:border-gray-700 bg-white dark:bg-[#18232c] p-6 shadow-2xl text-left"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                type="button"
                onClick={handleCloseRoleModal}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center justify-center text-gray-500 dark:text-gray-300 font-black text-sm cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Modal Header */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/15 text-purple-700 dark:text-purple-400 flex items-center justify-center shrink-0">
                  <UserCog className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-gray-900 dark:text-white leading-tight">
                    Phân quyền vai trò
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Thay đổi quyền hạn cho tài khoản{" "}
                    <strong className="text-gray-900 dark:text-white">
                      {selectedUserForRole.username}
                    </strong>
                  </p>
                </div>
              </div>

              {/* Current User Info Box */}
              <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 mb-4 text-xs font-bold text-gray-600 dark:text-gray-300 space-y-1">
                <div>
                  <span className="text-gray-400">ID tài khoản:</span> #{selectedUserForRole.id}
                </div>
                <div>
                  <span className="text-gray-400">Email:</span> {selectedUserForRole.email}
                </div>
                <div>
                  <span className="text-gray-400">Vai trò hiện tại:</span>{" "}
                  <span className="text-purple-600 dark:text-purple-400 font-black">
                    {selectedUserForRole.role_name} ({selectedUserForRole.role_code})
                  </span>
                </div>
              </div>

              {/* Self-Demote Warning */}
              {Number(selectedUserForRole.id) === Number(currentAdmin?.id) && (
                <div className="flex items-start gap-2 p-3 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-400 text-xs font-bold mb-4">
                  <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    Đây là tài khoản của bạn. Để bảo mật hệ thống, bạn không thể thu hồi quyền ADMIN của chính mình.
                  </span>
                </div>
              )}

              {/* Roles Selection List */}
              <div className="mb-5">
                <label className="block text-xs font-black uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
                  Chọn vai trò mới:
                </label>

                <div className="space-y-2">
                  {roles.map((r) => {
                    const isSelected = newRoleId.toString() === r.id.toString();
                    return (
                      <div
                        key={r.id}
                        onClick={() => setNewRoleId(r.id.toString())}
                        className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? "bg-purple-500/10 border-purple-600 dark:border-purple-500 text-purple-700 dark:text-purple-300 shadow-xs"
                            : "bg-white dark:bg-gray-800 border-[#d5cdbd] dark:border-gray-700 hover:border-purple-400 text-gray-800 dark:text-gray-200"
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-black text-sm">{r.name}</span>
                            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                              {r.code}
                            </span>
                          </div>
                          {r.description && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 font-normal">
                              {r.description}
                            </p>
                          )}
                        </div>

                        {isSelected && (
                          <div className="w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center shrink-0">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2.5">
                <button
                  type="button"
                  onClick={handleCloseRoleModal}
                  className="flex-1 py-3 rounded-2xl border-2 border-[#d5cdbd] dark:border-gray-700 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 font-black text-xs uppercase tracking-wider transition-all cursor-pointer text-gray-700 dark:text-gray-300 active:scale-95"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  disabled={updatingRole || newRoleId === selectedUserForRole.role_id?.toString()}
                  onClick={handleSaveUserRole}
                  className="flex-1 py-3 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-black text-xs uppercase tracking-wider shadow-md shadow-purple-600/30 transition-all cursor-pointer active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {updatingRole ? "Đang lưu..." : "Lưu vai trò"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
