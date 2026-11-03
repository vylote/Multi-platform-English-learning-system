package com.els.app.network;

import android.content.Context;
import android.content.SharedPreferences;

import androidx.annotation.NonNull;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import okhttp3.Cookie;
import okhttp3.CookieJar;
import okhttp3.HttpUrl;

/**
 * Lưu cookie "access_token" (httpOnly) mà backend set khi đăng nhập,
 * và tự gửi lại ở mọi request - giống hệt trình duyệt (withCredentials: true).
 */
public class PersistentCookieJar implements CookieJar {

    private final SharedPreferences prefs;

    public PersistentCookieJar(Context context) {
        prefs = context.getApplicationContext()
                .getSharedPreferences("CookiePrefs", Context.MODE_PRIVATE);
    }

    @Override
    public synchronized void saveFromResponse(@NonNull HttpUrl url, @NonNull List<Cookie> cookies) {
        SharedPreferences.Editor editor = prefs.edit();
        for (Cookie cookie : cookies) {
            if (cookie.expiresAt() < System.currentTimeMillis()) {
                // Server gửi cookie đã hết hạn (res.clearCookie khi logout) -> xóa luôn
                editor.remove(cookie.name());
            } else {
                editor.putString(cookie.name(), cookie.toString());
            }
        }
        editor.apply();
    }

    @NonNull
    @Override
    public synchronized List<Cookie> loadForRequest(@NonNull HttpUrl url) {
        List<Cookie> result = new ArrayList<>();
        long now = System.currentTimeMillis();
        for (Map.Entry<String, ?> entry : prefs.getAll().entrySet()) {
            Cookie cookie = Cookie.parse(url, String.valueOf(entry.getValue()));
            if (cookie != null && cookie.expiresAt() > now) {
                result.add(cookie);
            }
        }
        return result;
    }

    public synchronized void clear() {
        prefs.edit().clear().apply();
    }
}
