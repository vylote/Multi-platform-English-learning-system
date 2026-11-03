package com.els.app.ui.auth;

import android.os.Bundle;
import android.view.View;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;

import androidx.activity.EdgeToEdge;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;

import com.els.app.R;
import com.els.app.data.remote.api.LearningApiService;
import com.els.app.data.remote.dto.ApiModels;
import com.els.app.data.remote.dto.response.UserResponse;
import com.els.app.network.ApiCallback;
import com.els.app.network.RetrofitClient;
import com.els.app.ui.NavHelper;
import com.els.app.util.SessionManager;

/** Tương đương frontend-web/src/pages/OnboardingPage.jsx (2 bước khảo sát). */
public class OnboardingActivity extends AppCompatActivity {

    private String experience; // BEGINNER | EXPERIENCED

    private View layoutStep1;
    private View layoutStep2;
    private TextView tvStepLabel;
    private TextView tvQuestion;
    private ProgressBar progressLoading;

    private LearningApiService api;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        EdgeToEdge.enable(this);
        setContentView(R.layout.activity_onboarding);

        ViewCompat.setOnApplyWindowInsetsListener(findViewById(R.id.main), (v, insets) -> {
            Insets bars = insets.getInsets(WindowInsetsCompat.Type.systemBars());
            v.setPadding(bars.left, bars.top, bars.right, bars.bottom);
            return insets;
        });

        api = RetrofitClient.create(this, LearningApiService.class);

        layoutStep1 = findViewById(R.id.layoutStep1);
        layoutStep2 = findViewById(R.id.layoutStep2);
        tvStepLabel = findViewById(R.id.tvStepLabel);
        tvQuestion = findViewById(R.id.tvQuestion);
        progressLoading = findViewById(R.id.progressLoading);

        findViewById(R.id.btnBeginner).setOnClickListener(v -> chooseExperience("BEGINNER"));
        findViewById(R.id.btnExperienced).setOnClickListener(v -> chooseExperience("EXPERIENCED"));

        findViewById(R.id.btnPurposeCommunication).setOnClickListener(v -> submit("COMMUNICATION"));
        findViewById(R.id.btnPurposeCareer).setOnClickListener(v -> submit("CAREER"));
        findViewById(R.id.btnPurposeTravel).setOnClickListener(v -> submit("TRAVEL"));
        findViewById(R.id.btnPurposeHobby).setOnClickListener(v -> submit("HOBBY"));
        findViewById(R.id.btnSkipPurpose).setOnClickListener(v -> submit(null));
        findViewById(R.id.btnBackStep).setOnClickListener(v -> showStep(1));
    }

    private void chooseExperience(String level) {
        experience = level;
        showStep(2);
    }

    private void showStep(int step) {
        layoutStep1.setVisibility(step == 1 ? View.VISIBLE : View.GONE);
        layoutStep2.setVisibility(step == 2 ? View.VISIBLE : View.GONE);
        tvStepLabel.setText("Bước " + step + "/2");
        tvQuestion.setText(step == 1
                ? "Bạn đã biết tiếng Anh chưa?"
                : "Bạn học tiếng Anh để làm gì?");
    }

    private void submit(String purpose) {
        layoutStep2.setVisibility(View.GONE);
        progressLoading.setVisibility(View.VISIBLE);

        api.completeOnboarding(new ApiModels.OnboardingRequest(experience, purpose))
                .enqueue(new ApiCallback<UserResponse>() {
                    @Override
                    public void onSuccess(UserResponse user) {
                        // BEGINNER -> backend gán tier ngay -> vào Home
                        // EXPERIENCED -> tier = null -> NavHelper đưa sang Placement Test
                        new SessionManager(OnboardingActivity.this).saveUser(user);
                        NavHelper.routeAfterAuth(OnboardingActivity.this);
                    }

                    @Override
                    public void onError(String message) {
                        progressLoading.setVisibility(View.GONE);
                        layoutStep2.setVisibility(View.VISIBLE);
                        Toast.makeText(OnboardingActivity.this, message, Toast.LENGTH_LONG).show();
                    }
                });
    }
}
