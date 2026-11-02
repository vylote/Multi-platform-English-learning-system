package com.els.app.ui;

import android.app.Activity;
import android.content.Intent;

import com.els.app.ui.admin.AdminHomeActivity;
import com.els.app.ui.auth.HomeActivity;
import com.els.app.ui.auth.OnboardingActivity;
import com.els.app.ui.auth.QuizActivity;
import com.els.app.util.SessionManager;

/**
 * Điều hướng sau khi xác thực - tái hiện ProtectedRoute trong frontend-web/src/routes/AppRoutes.jsx
 *  - ADMIN                              -> AdminHome (như /admin/users ở web)
 *  - Đã có tier                         -> Home
 *  - Chưa khảo sát (experience == null) -> Onboarding
 *  - Đã khảo sát nhưng chưa có tier     -> Bài thi đầu vào (Placement Test)
 */
public final class NavHelper {

    private NavHelper() { }

    public static void routeAfterAuth(Activity activity) {
        SessionManager session = new SessionManager(activity);
        Intent intent;

        if ("ADMIN".equals(session.getRole())) {
            intent = new Intent(activity, AdminHomeActivity.class);
        } else if (session.getTier() != null) {
            intent = new Intent(activity, HomeActivity.class);
        } else if (session.getExperienceLevel() == null) {
            intent = new Intent(activity, OnboardingActivity.class);
        } else {
            intent = new Intent(activity, QuizActivity.class);
            intent.putExtra(QuizActivity.EXTRA_PLACEMENT, true);
        }

        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
        activity.startActivity(intent);
        activity.finish();
    }
}
