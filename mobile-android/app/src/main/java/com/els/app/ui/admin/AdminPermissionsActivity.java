package com.els.app.ui.admin;

import android.os.Bundle;
import android.view.View;
import android.widget.AdapterView;
import android.widget.ArrayAdapter;
import android.widget.CheckBox;
import android.widget.LinearLayout;
import android.widget.Spinner;
import android.widget.TextView;
import android.widget.Toast;

import androidx.activity.EdgeToEdge;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;

import com.els.app.R;
import com.els.app.data.remote.api.AdminApiService;
import com.els.app.data.remote.dto.ApiModels;
import com.els.app.network.ApiCallback;
import com.els.app.network.RetrofitClient;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Tương đương AdminPermissionsPage.jsx (ma trận vai trò x quyền).
 * GET /admin/role-permissions , PUT /admin/role-permissions/{roleId}  body { permissionIds: [...] }
 */
public class AdminPermissionsActivity extends AppCompatActivity {

    private AdminApiService api;
    private ApiModels.RolePermissionData data;
    private Spinner spinnerRole;
    private LinearLayout layoutRows;
    private View progress;

    // roleId -> tập permissionId đang tick (bản chỉnh sửa trên máy, chưa lưu)
    private final Map<Long, Set<Long>> working = new HashMap<>();
    private final Map<Long, CheckBox> checkBoxes = new HashMap<>();
    private ApiModels.RoleDto currentRole;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        EdgeToEdge.enable(this);
        setContentView(R.layout.activity_admin_form);

        ViewCompat.setOnApplyWindowInsetsListener(findViewById(R.id.main), (v, insets) -> {
            Insets bars = insets.getInsets(WindowInsetsCompat.Type.systemBars());
            v.setPadding(bars.left, bars.top, bars.right, bars.bottom);
            return insets;
        });

        api = RetrofitClient.create(this, AdminApiService.class);
        ((TextView) findViewById(R.id.tvTitle)).setText("Phân quyền vai trò");
        findViewById(R.id.btnBack).setOnClickListener(v -> finish());
        spinnerRole = findViewById(R.id.spinnerTop);
        spinnerRole.setVisibility(View.VISIBLE);
        layoutRows = findViewById(R.id.layoutRows);
        progress = findViewById(R.id.progressLoading);

        findViewById(R.id.btnSecondary).setOnClickListener(v -> load());   // "Khôi phục" = tải lại từ server
        findViewById(R.id.btnPrimary).setOnClickListener(v -> save());

        load();
    }

    private void load() {
        progress.setVisibility(View.VISIBLE);
        api.getRolePermissions().enqueue(new ApiCallback<ApiModels.RolePermissionData>() {
            @Override
            public void onSuccess(ApiModels.RolePermissionData result) {
                progress.setVisibility(View.GONE);
                data = result;
                working.clear();
                for (ApiModels.RoleDto r : data.getRoles()) {
                    List<Long> ids = data.getRolePermissions().get(String.valueOf(r.getId()));
                    working.put(r.getId(), new HashSet<>(ids == null ? new ArrayList<>() : ids));
                }

                List<String> names = new ArrayList<>();
                for (ApiModels.RoleDto r : data.getRoles()) names.add(r.getName() + " (" + r.getCode() + ")");
                spinnerRole.setAdapter(new ArrayAdapter<>(AdminPermissionsActivity.this,
                        android.R.layout.simple_spinner_dropdown_item, names));
                spinnerRole.setOnItemSelectedListener(new AdapterView.OnItemSelectedListener() {
                    @Override
                    public void onItemSelected(AdapterView<?> p, View v, int pos, long id) {
                        currentRole = data.getRoles().get(pos);
                        renderPermissions();
                    }

                    @Override
                    public void onNothingSelected(AdapterView<?> p) { }
                });
                if (!data.getRoles().isEmpty()) {
                    currentRole = data.getRoles().get(0);
                    renderPermissions();
                }
            }

            @Override
            public void onError(String message) {
                progress.setVisibility(View.GONE);
                Toast.makeText(AdminPermissionsActivity.this, message, Toast.LENGTH_LONG).show();
            }
        });
    }

    /** Vẽ danh sách quyền, gom theo nhóm (groupName), mỗi quyền 1 CheckBox. */
    private void renderPermissions() {
        layoutRows.removeAllViews();
        checkBoxes.clear();
        if (currentRole == null) return;

        Set<Long> granted = working.get(currentRole.getId());
        String lastGroup = null;
        float d = getResources().getDisplayMetrics().density;

        for (ApiModels.PermissionDto perm : data.getPermissions()) {
            if (!perm.getGroupName().equals(lastGroup)) {
                lastGroup = perm.getGroupName();
                TextView header = new TextView(this);
                header.setText(lastGroup);
                header.setTextSize(14);
                header.setTextColor(0xFF4F46E5);
                header.setPadding(0, (int) (16 * d), 0, (int) (4 * d));
                layoutRows.addView(header);
            }
            CheckBox cb = new CheckBox(this);
            cb.setText(perm.getName() + "\n" + perm.getCode());
            cb.setChecked(granted.contains(perm.getId()));
            cb.setOnCheckedChangeListener((b, checked) -> {
                if (checked) granted.add(perm.getId()); else granted.remove(perm.getId());
            });
            layoutRows.addView(cb);
            checkBoxes.put(perm.getId(), cb);
        }
    }

    private void save() {
        if (currentRole == null) return;
        List<Long> ids = new ArrayList<>(working.get(currentRole.getId()));
        api.updateRolePermissions(currentRole.getId(), new ApiModels.UpdateRolePermissionsRequest(ids))
                .enqueue(new ApiCallback<Object>() {
                    @Override
                    public void onSuccess(Object result) {
                        Toast.makeText(AdminPermissionsActivity.this,
                                "Đã lưu quyền cho vai trò " + currentRole.getCode(), Toast.LENGTH_SHORT).show();
                    }

                    @Override
                    public void onError(String message) {
                        Toast.makeText(AdminPermissionsActivity.this, message, Toast.LENGTH_LONG).show();
                    }
                });
    }
}
