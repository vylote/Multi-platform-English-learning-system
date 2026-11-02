package com.els.app.ui.admin;

import android.os.Bundle;
import android.view.View;
import android.view.inputmethod.EditorInfo;
import android.widget.ArrayAdapter;
import android.widget.EditText;
import android.widget.AdapterView;
import android.widget.Spinner;
import android.widget.TextView;
import android.widget.Toast;

import androidx.activity.EdgeToEdge;
import androidx.appcompat.app.AlertDialog;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.els.app.R;
import com.els.app.data.remote.api.AdminApiService;
import com.els.app.data.remote.dto.ApiModels;
import com.els.app.network.ApiCallback;
import com.els.app.network.RetrofitClient;
import com.els.app.ui.common.RowAdapter;
import com.els.app.util.Labels;

import java.util.ArrayList;
import java.util.List;

/**
 * Tương đương AdminUsersPage.jsx: tìm kiếm, lọc theo vai trò / trình độ, phân trang, đổi vai trò.
 * GET /admin/users , GET /admin/roles , PUT /admin/users/{id}/role
 */
public class AdminUsersActivity extends AppCompatActivity {

    private static final int PAGE_SIZE = 10;
    private static final String[] ROLE_FILTER = {"ALL", "STUDENT", "ADMIN"};
    private static final String[] ROLE_LABEL = {"Mọi vai trò", "Học viên", "Quản trị"};
    private static final String[] TIER_FILTER = {"ALL", "BEGINNER", "INTERMEDIATE", "ADVANCED"};
    private static final String[] TIER_LABEL = {"Mọi trình độ", "Cơ bản", "Trung cấp", "Nâng cao"};

    private AdminApiService api;
    private RowAdapter adapter;
    private EditText edtSearch;
    private Spinner spinnerRole, spinnerTier;
    private View progress, tvEmpty;
    private TextView btnLoadMore;

    private int page = 1;
    private int totalPages = 1;
    private boolean loading = false;
    private boolean ignoreSpinnerEvents = true;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        EdgeToEdge.enable(this);
        setContentView(R.layout.activity_list_screen);

        ViewCompat.setOnApplyWindowInsetsListener(findViewById(R.id.main), (v, insets) -> {
            Insets bars = insets.getInsets(WindowInsetsCompat.Type.systemBars());
            v.setPadding(bars.left, bars.top, bars.right, bars.bottom);
            return insets;
        });

        api = RetrofitClient.create(this, AdminApiService.class);

        ((TextView) findViewById(R.id.tvTitle)).setText("Quản lý người dùng");
        findViewById(R.id.btnBack).setOnClickListener(v -> finish());
        findViewById(R.id.layoutFilters).setVisibility(View.VISIBLE);
        edtSearch = findViewById(R.id.edtSearch);
        edtSearch.setHint("Tìm theo tên đăng nhập hoặc email");
        spinnerRole = findViewById(R.id.spinnerA);
        spinnerTier = findViewById(R.id.spinnerB);
        spinnerRole.setVisibility(View.VISIBLE);
        spinnerTier.setVisibility(View.VISIBLE);
        spinnerRole.setAdapter(new ArrayAdapter<>(this, android.R.layout.simple_spinner_dropdown_item, ROLE_LABEL));
        spinnerTier.setAdapter(new ArrayAdapter<>(this, android.R.layout.simple_spinner_dropdown_item, TIER_LABEL));

        progress = findViewById(R.id.progressLoading);
        tvEmpty = findViewById(R.id.tvEmpty);
        btnLoadMore = findViewById(R.id.btnLoadMore);

        adapter = new RowAdapter(row -> showRoleDialog((ApiModels.AdminUserItem) row.payload));
        RecyclerView rv = findViewById(R.id.rvRows);
        rv.setLayoutManager(new LinearLayoutManager(this));
        rv.setAdapter(adapter);

        AdapterView.OnItemSelectedListener reload = new AdapterView.OnItemSelectedListener() {
            @Override
            public void onItemSelected(AdapterView<?> parent, View view, int position, long id) {
                if (ignoreSpinnerEvents) return;
                reload();
            }

            @Override
            public void onNothingSelected(AdapterView<?> parent) { }
        };
        spinnerRole.setOnItemSelectedListener(reload);
        spinnerTier.setOnItemSelectedListener(reload);

        edtSearch.setOnEditorActionListener((v, actionId, event) -> {
            if (actionId == EditorInfo.IME_ACTION_SEARCH) {
                reload();
                return true;
            }
            return false;
        });
        btnLoadMore.setOnClickListener(v -> load(page + 1));

        reload();
        // Spinner bắn sự kiện chọn lần đầu sau khi layout xong -> bỏ qua để khỏi gọi API 3 lần
        spinnerRole.post(() -> ignoreSpinnerEvents = false);
    }

    private void reload() {
        page = 1;
        adapter.setRows(new ArrayList<>());
        load(1);
    }

    private void load(int pageToLoad) {
        if (loading) return;
        loading = true;
        progress.setVisibility(View.VISIBLE);
        btnLoadMore.setVisibility(View.GONE);

        String search = edtSearch.getText().toString().trim();
        String role = ROLE_FILTER[spinnerRole.getSelectedItemPosition()];
        String tier = TIER_FILTER[spinnerTier.getSelectedItemPosition()];

        api.getUsers(search.isEmpty() ? null : search,
                        "ALL".equals(role) ? null : role,
                        "ALL".equals(tier) ? null : tier,
                        pageToLoad, PAGE_SIZE)
                .enqueue(new ApiCallback<ApiModels.AdminUserPage>() {
                    @Override
                    public void onSuccess(ApiModels.AdminUserPage result) {
                        loading = false;
                        progress.setVisibility(View.GONE);
                        page = pageToLoad;
                        totalPages = result.getPagination().getTotalPages();

                        List<RowAdapter.Row> rows = new ArrayList<>();
                        for (ApiModels.AdminUserItem u : result.getUsers()) {
                            rows.add(new RowAdapter.Row(
                                    u.getUsername(),
                                    u.getEmail() + "\nTrình độ: " + Labels.difficulty(u.getTier()),
                                    u.getRoleName() != null ? u.getRoleName() : u.getRoleCode(),
                                    u));
                        }
                        if (pageToLoad == 1) adapter.setRows(rows); else adapter.addRows(rows);

                        tvEmpty.setVisibility(adapter.size() == 0 ? View.VISIBLE : View.GONE);
                        btnLoadMore.setText("Tải thêm (trang " + page + "/" + totalPages + ")");
                        btnLoadMore.setVisibility(page < totalPages ? View.VISIBLE : View.GONE);
                    }

                    @Override
                    public void onError(String message) {
                        loading = false;
                        progress.setVisibility(View.GONE);
                        Toast.makeText(AdminUsersActivity.this, message, Toast.LENGTH_LONG).show();
                    }
                });
    }

    // ---------- Đổi vai trò ----------
    private void showRoleDialog(ApiModels.AdminUserItem user) {
        api.getRoles().enqueue(new ApiCallback<List<ApiModels.RoleDto>>() {
            @Override
            public void onSuccess(List<ApiModels.RoleDto> roles) {
                String[] names = new String[roles.size()];
                int checked = 0;
                for (int i = 0; i < roles.size(); i++) {
                    names[i] = roles.get(i).getName() + " (" + roles.get(i).getCode() + ")";
                    if (roles.get(i).getId() == user.getRoleId()) checked = i;
                }
                final int[] selected = {checked};

                new AlertDialog.Builder(AdminUsersActivity.this)
                        .setTitle("Vai trò của " + user.getUsername())
                        .setSingleChoiceItems(names, checked, (d, which) -> selected[0] = which)
                        .setPositiveButton("Lưu", (d, w) -> {
                            ApiModels.RoleDto target = roles.get(selected[0]);
                            if (target.getId() == user.getRoleId()) return;
                            updateRole(user, target);
                        })
                        .setNegativeButton("Hủy", null)
                        .show();
            }

            @Override
            public void onError(String message) {
                Toast.makeText(AdminUsersActivity.this, message, Toast.LENGTH_LONG).show();
            }
        });
    }

    private void updateRole(ApiModels.AdminUserItem user, ApiModels.RoleDto role) {
        api.updateUserRole(user.getId(), new ApiModels.UpdateUserRoleRequest(role.getId()))
                .enqueue(new ApiCallback<Object>() {
                    @Override
                    public void onSuccess(Object result) {
                        Toast.makeText(AdminUsersActivity.this,
                                "Đã cập nhật vai trò cho " + user.getUsername(), Toast.LENGTH_SHORT).show();
                        reload();
                    }

                    @Override
                    public void onError(String message) {
                        // VD: "Bạn không thể tự thu hồi quyền Quản trị viên..."
                        Toast.makeText(AdminUsersActivity.this, message, Toast.LENGTH_LONG).show();
                    }
                });
    }
}
