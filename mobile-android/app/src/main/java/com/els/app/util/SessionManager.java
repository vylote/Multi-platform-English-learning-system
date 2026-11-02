package com.els.app.util;

import android.content.Context;
import android.content.SharedPreferences;

import com.els.app.data.remote.dto.response.UserResponse;

/** Lưu thông tin phiên đăng nhập (tương đương Redux authSlice ở frontend-web). */
public class SessionManager {

    private final SharedPreferences prefs;

    public SessionManager(Context context) {
        prefs = context.getApplicationContext()
                .getSharedPreferences("SessionPrefs", Context.MODE_PRIVATE);
    }

    public void saveUser(UserResponse u) {
        prefs.edit()
                .putLong("id", u.getId())
                .putString("username", u.getUsername())
                .putString("email", u.getEmail())
                .putString("role", u.getRole())
                .putString("tier", u.getTier())
                .putString("experience_level", u.getExperienceLevel())
                .putString("learning_purpose", u.getLearningPurpose())
                .apply();
    }

    public boolean isLoggedIn() { return prefs.getLong("id", 0) > 0; }
    public String getUsername() { return prefs.getString("username", null); }
    public String getEmail() { return prefs.getString("email", null); }
    public String getRole() { return prefs.getString("role", null); }
    public String getTier() { return prefs.getString("tier", null); }
    public String getExperienceLevel() { return prefs.getString("experience_level", null); }
    public String getLearningPurpose() { return prefs.getString("learning_purpose", null); }

    public void clear() { prefs.edit().clear().apply(); }
}
