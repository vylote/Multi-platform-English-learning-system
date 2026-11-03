package com.els.app.util;

import android.app.Activity;
import android.content.Intent;
import android.widget.Toast;

import com.els.app.data.local.database.AppDatabase;
import com.els.app.data.remote.api.AuthApiService;
import com.els.app.network.ApiCallback;
import com.els.app.network.RetrofitClient;
import com.els.app.ui.auth.LoginActivity;

/** Đăng xuất dùng chung cho Profile (học viên) và AdminHome (quản trị). */
public final class LogoutHelper {

    private LogoutHelper() { }

    public static void logout(Activity activity) {
        RetrofitClient.create(activity, AuthApiService.class).logout()
                .enqueue(new ApiCallback<Object>() {
                    @Override public void onSuccess(Object result) { finish(activity); }
                    @Override public void onError(String message) { finish(activity); }
                });
    }

    private static void finish(Activity activity) {
        RetrofitClient.clearSession();
        new SessionManager(activity).clear();
        new Thread(() -> AppDatabase.getDatabase(activity).userDao().clearUserData()).start();

        Toast.makeText(activity, "Đã đăng xuất", Toast.LENGTH_SHORT).show();
        Intent intent = new Intent(activity, LoginActivity.class);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
        activity.startActivity(intent);
        activity.finish();
    }
}
