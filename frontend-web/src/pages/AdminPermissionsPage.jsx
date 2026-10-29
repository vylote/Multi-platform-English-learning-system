import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import {
  KeyRound,
  Crown,
  Users,
  Check,
  RotateCw,
  AlertTriangle,
  BookOpen,
  Layers,
  GraduationCap,
  Settings,
  Save,
  CheckCircle2,
  Lock,
} from "lucide-react";

import api from "../api/api";
import AdminLayout from "../layouts/AdminLayout";

const GROUP_ICONS = {
  DICTIONARY: <BookOpen className="w-4 h-4 text-purple-600 dark:text-purple-400" />,
  LEARNING: <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />,
  TESTING: <GraduationCap className="w-4 h-4 text-sky-600 dark:text-sky-400" />,
  SYSTEM: <Settings className="w-4 h-4 text-amber-600 dark:text-amber-400" />,
};

export default function AdminPermissionsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [groups, setGroups] = useState([]);

  // Server state mapping: { [roleId]: [permId1, permId2] }
  const [initialRolePerms, setInitialRolePerms] = useState({});
  // Local editable state mapping: { [roleId]: Set([permId1, permId2]) }
  const [currentRolePerms, setCurrentRolePerms] = useState({});

  // Role đang được chọn để cấu hình quyền
  const [selectedRoleId, setSelectedRoleId] = useState(null);

  useEffect(() => {
    fetchPermissionsData();
  }, []);

  const fetchPermissionsData = async () => {
    try {
      setLoading(true);
      const res = await api.get("/admin/role-permissions");
      const data = res.data?.result || {};

      setRoles(data.roles || []);
      setPermissions(data.permissions || []);
      setGroups(data.groups || []);

      const map = data.rolePermissions || {};
      setInitialRolePerms(map);

      // Convert arrays to Sets for fast toggle operations
      const setsMap = {};
      for (const [rId, pIds] of Object.entries(map)) {
        setsMap[rId] = new Set(pIds);
      }
      setCurrentRolePerms(setsMap);

      if (data.roles?.length > 0 && !selectedRoleId) {
        setSelectedRoleId(data.roles[0].id);
      }
    } catch (err) {
      toast.error("Không thể tải ma trận phân quyền.");
    } finally {
      setLoading(false);
    }
  };

  const selectedRole = roles.find((r) => r.id === selectedRoleId);
  const activeSet = currentRolePerms[selectedRoleId] || new Set();
  const originalList = initialRolePerms[selectedRoleId] || [];

  // Kiểm tra vai trò hiện tại có thay đổi chưa lưu không
  const hasChanges = (() => {
    if (!selectedRoleId) return false;
    const origSet = new Set(originalList);
    if (activeSet.size !== origSet.size) return true;
    for (const id of activeSet) {
      if (!origSet.has(id)) return true;
    }
    return false;
  })();

  // Toggle 1 permission cho role hiện tại
  const handleTogglePermission = (permId) => {
    if (!selectedRoleId) return;

    setCurrentRolePerms((prev) => {
      const prevSet = prev[selectedRoleId] || new Set();
      const newSet = new Set(prevSet);

      if (newSet.has(permId)) {
        newSet.delete(permId);
      } else {
        newSet.add(permId);
      }

      return {
        ...prev,
        [selectedRoleId]: newSet,
      };
    });
  };

  // Chọn tất cả quyền cho vai trò hiện tại
  const handleSelectAll = () => {
    if (!selectedRoleId) return;
    const allIds = new Set(permissions.map((p) => p.id));
    setCurrentRolePerms((prev) => ({
      ...prev,
      [selectedRoleId]: allIds,
    }));
  };

  // Bỏ chọn tất cả quyền cho vai trò hiện tại
  const handleDeselectAll = () => {
    if (!selectedRoleId) return;
    setCurrentRolePerms((prev) => ({
      ...prev,
      [selectedRoleId]: new Set(),
    }));
  };

  // Khôi phục lại trạng thái ban đầu của vai trò hiện tại
  const handleResetCurrent = () => {
    if (!selectedRoleId) return;
    setCurrentRolePerms((prev) => ({
      ...prev,
      [selectedRoleId]: new Set(originalList),
    }));
    toast.success("Đã hoàn tác thay đổi về cấu hình ban đầu.");
  };

  // Lưu phân quyền cho vai trò hiện tại
  const handleSave = async () => {
    if (!selectedRoleId) return;

    // Cảnh báo nếu hạ hết quyền của ADMIN
    if (selectedRole?.code === "ADMIN" && activeSet.size === 0) {
      toast.error("Vai trò ADMIN cần giữ lại các quyền quản trị cơ bản.");
      return;
    }

    try {
      setSaving(true);
      const permIds = Array.from(activeSet);

      await api.put(`/admin/role-permissions/${selectedRoleId}`, {
        permissionIds: permIds,
      });

      toast.success(
        `Cập nhật phân quyền cho vai trò "${selectedRole?.name}" thành công!`,
      );

      // Cập nhật lại initial state
      setInitialRolePerms((prev) => ({
        ...prev,
        [selectedRoleId]: permIds,
      }));
    } catch (err) {
      const msg =
        err.response?.data?.message || "Lỗi khi lưu phân quyền vai trò.";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="flex flex-col gap-6 pb-12">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-950 dark:text-white tracking-tight flex items-center gap-2.5">
              <KeyRound className="w-8 h-8 text-purple-600 dark:text-purple-400" />
              <span>Quản lý Phân quyền Vai trò</span>
            </h1>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
              Cấu hình quyền hạn chi tiết (Role Permissions) cho từng vai trò trong hệ thống. Thay đổi tự động xóa cache Redis và có hiệu lực ngay lập tức.
            </p>
          </div>

          {/* NÚT LƯU TRÊN HEADER KHI CÓ THAY ĐỔI */}
          {hasChanges && (
            <div className="flex items-center gap-2 shrink-0 animate-in fade-in">
              <button
                type="button"
                onClick={handleResetCurrent}
                disabled={saving}
                className="px-4 py-2.5 rounded-2xl border-2 border-[#d5cdbd] dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-black text-xs uppercase tracking-wider hover:bg-black/5 transition-all cursor-pointer"
              >
                Hoàn tác
              </button>

              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-b from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white font-black text-xs uppercase tracking-wider shadow-md shadow-purple-600/30 border-b-4 border-purple-900 active:translate-y-0.5 active:border-b-2 transition-all cursor-pointer disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <RotateCw className="w-4 h-4 animate-spin" />
                    <span>Đang lưu...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Lưu thay đổi</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* 1. TABS CHỌN VAI TRÒ ĐỂ CẤU HÌNH */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {roles.map((role) => {
            const isSelected = role.id === selectedRoleId;
            const roleGrantedCount = currentRolePerms[role.id]?.size || 0;
            const roleHasUnsaved = (() => {
              const cur = currentRolePerms[role.id] || new Set();
              const orig = new Set(initialRolePerms[role.id] || []);
              if (cur.size !== orig.size) return true;
              for (const id of cur) {
                if (!orig.has(id)) return true;
              }
              return false;
            })();

            return (
              <button
                key={role.id}
                type="button"
                onClick={() => setSelectedRoleId(role.id)}
                className={`relative p-4 rounded-3xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                  isSelected
                    ? "bg-purple-500/15 border-purple-600 shadow-md shadow-purple-600/15"
                    : "bg-[#f4efe4] dark:bg-[#18232c] border-[#d5cdbd] dark:border-gray-800 hover:border-purple-400"
                }`}
              >
                {roleHasUnsaved && (
                  <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500 text-white shadow-xs animate-pulse">
                    Chưa lưu
                  </span>
                )}

                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 ${
                      isSelected
                        ? "bg-purple-600 text-white shadow-sm"
                        : "bg-white dark:bg-gray-800 text-purple-600 border border-[#d5cdbd] dark:border-gray-700"
                    }`}
                  >
                    {role.code === "ADMIN" ? (
                      <Crown className={`w-5 h-5 ${isSelected ? "text-amber-300" : "text-amber-500"}`} />
                    ) : role.code === "STUDENT" ? (
                      <GraduationCap className={`w-5 h-5 ${isSelected ? "text-emerald-200" : "text-emerald-500"}`} />
                    ) : (
                      <Users className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-gray-950 dark:text-white">
                      {role.name}
                    </h3>
                    <span className="font-mono text-[11px] font-bold text-purple-700 dark:text-purple-400">
                      {role.code}
                    </span>
                  </div>
                </div>

                <p className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
                  {role.description || "Chưa có mô tả chi tiết"}
                </p>

                <div className="flex items-center justify-between pt-2 border-t border-[#d5cdbd]/60 dark:border-gray-800 text-[11px] font-black">
                  <span className="text-gray-500">Quyền kích hoạt:</span>
                  <span className="px-2 py-0.5 rounded-md bg-purple-600/15 text-purple-700 dark:text-purple-400 font-mono">
                    {roleGrantedCount} / {permissions.length} quyền
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* 2. KHUNG DANH SÁCH QUYỀN HẠN CỦA VAI TRÒ ĐANG CHỌN */}
        {selectedRole && (
          <div className="rounded-3xl border-2 border-[#d5cdbd] dark:border-gray-800 bg-[#f4efe4] dark:bg-[#18232c] p-5 sm:p-7 shadow-lg flex flex-col gap-6">
            {/* Thanh điều khiển phụ: Chọn tất cả / Bỏ chọn tất cả */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#d5cdbd] dark:border-gray-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center font-black text-xs">
                  {selectedRole.code[0]}
                </div>
                <div>
                  <h2 className="text-base font-black text-gray-950 dark:text-white">
                    Cấu hình quyền cho: {selectedRole.name} ({selectedRole.code})
                  </h2>
                  <p className="text-xs text-gray-500">
                    Bật hoặc tắt các quyền hạn nghiệp vụ bên dưới
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="px-3 py-1.5 rounded-xl border border-[#d5cdbd] dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-purple-600 text-xs font-black text-gray-700 dark:text-gray-300 transition-colors cursor-pointer"
                >
                  Chọn tất cả
                </button>
                <button
                  type="button"
                  onClick={handleDeselectAll}
                  className="px-3 py-1.5 rounded-xl border border-[#d5cdbd] dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-rose-500 text-xs font-black text-gray-700 dark:text-gray-300 hover:text-rose-600 transition-colors cursor-pointer"
                >
                  Bỏ chọn tất cả
                </button>
              </div>
            </div>

            {/* DANH SÁCH QUYỀN THEO TỪNG NHÓM (GROUPS) */}
            <div className="space-y-6">
              {groups.map((group) => {
                const groupPerms = permissions.filter(
                  (p) => p.groupKey === group.key,
                );
                if (groupPerms.length === 0) return null;

                const enabledInGroup = groupPerms.filter((p) =>
                  activeSet.has(p.id),
                ).length;

                return (
                  <div
                    key={group.key}
                    className="rounded-2xl border border-[#d5cdbd] dark:border-gray-800 bg-white dark:bg-gray-900 p-4 sm:p-5"
                  >
                    {/* Tiêu đề nhóm */}
                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#d5cdbd]/60 dark:border-gray-800">
                      <div className="flex items-center gap-2.5">
                        <div className="p-1.5 rounded-xl bg-purple-500/10">
                          {GROUP_ICONS[group.key] || (
                            <Layers className="w-4 h-4 text-purple-600" />
                          )}
                        </div>
                        <h3 className="text-sm font-black text-gray-950 dark:text-white">
                          {group.name}
                        </h3>
                      </div>

                      <span className="text-[11px] font-black text-purple-700 dark:text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-md">
                        {enabledInGroup} / {groupPerms.length} quyền
                      </span>
                    </div>

                    {/* Danh sách các quyền trong nhóm */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {groupPerms.map((perm) => {
                        const isChecked = activeSet.has(perm.id);

                        return (
                          <div
                            key={perm.id}
                            onClick={() => handleTogglePermission(perm.id)}
                            className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between gap-3 select-none ${
                              isChecked
                                ? "bg-purple-500/10 border-purple-500/60 shadow-2xs"
                                : "bg-gray-50 dark:bg-gray-800/40 border-[#d5cdbd]/60 dark:border-gray-800 hover:border-gray-400 dark:hover:border-gray-700 opacity-75"
                            }`}
                          >
                            <div className="flex flex-col min-w-0 pr-2">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-black text-gray-950 dark:text-white truncate">
                                  {perm.name}
                                </span>
                                <span className="font-mono text-[10px] font-bold text-gray-500 dark:text-gray-400 bg-black/5 dark:bg-white/5 px-1.5 py-0.5 rounded">
                                  {perm.code}
                                </span>
                              </div>
                              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">
                                {perm.description}
                              </p>
                            </div>

                            {/* TOGGLE SWITCH 3D */}
                            <div
                              className={`w-12 h-6 rounded-full p-1 transition-colors flex items-center shrink-0 ${
                                isChecked
                                  ? "bg-purple-600 justify-end"
                                  : "bg-gray-300 dark:bg-gray-700 justify-start"
                              }`}
                            >
                              <div className="w-4 h-4 rounded-full bg-white shadow-md transform transition-transform" />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* CHÂN KHUNG CẤU HÌNH: NÚT LƯU THAY ĐỔI */}
            <div className="pt-4 border-t border-[#d5cdbd] dark:border-gray-800 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
                {hasChanges ? (
                  <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1.5 font-black">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Có thay đổi chưa được lưu cho vai trò {selectedRole.name}.</span>
                  </span>
                ) : (
                  <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 font-black">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Phân quyền vai trò đang đồng bộ với cơ sở dữ liệu.</span>
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3">
                {hasChanges && (
                  <button
                    type="button"
                    onClick={handleResetCurrent}
                    disabled={saving}
                    className="px-4 py-2.5 rounded-2xl border-2 border-[#d5cdbd] dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-black text-xs uppercase tracking-wider hover:bg-black/5 transition-all cursor-pointer"
                  >
                    Hoàn tác
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving || !hasChanges}
                  className="inline-flex items-center justify-center gap-2.5 px-7 py-3 rounded-2xl bg-gradient-to-b from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white font-black text-xs uppercase tracking-wider shadow-md shadow-purple-600/30 border-b-4 border-purple-900 active:translate-y-0.5 active:border-b-2 transition-all cursor-pointer disabled:opacity-40"
                >
                  {saving ? (
                    <>
                      <RotateCw className="w-4 h-4 animate-spin" />
                      <span>Đang cập nhật phân quyền...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Lưu thay đổi phân quyền</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
