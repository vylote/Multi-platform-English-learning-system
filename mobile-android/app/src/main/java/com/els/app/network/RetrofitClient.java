package com.els.app.network;

import android.content.Context;
import android.content.Intent;

import androidx.annotation.NonNull;

import com.els.app.BuildConfig;
import com.els.app.ui.auth.LoginActivity;
import com.els.app.util.SessionManager;

import java.io.IOException;
import java.util.concurrent.TimeUnit;

import okhttp3.Interceptor;
import okhttp3.OkHttpClient;
import okhttp3.Response;
import okhttp3.logging.HttpLoggingInterceptor;
import retrofit2.Retrofit;
import retrofit2.converter.gson.GsonConverterFactory;

public class RetrofitClient {

    private RetrofitClient() {
        /* utility class */
    }

    private static Retrofit retrofit = null;
    private static PersistentCookieJar cookieJar = null;

    public static synchronized Retrofit getClient(Context context) {
        if (retrofit == null) {
            Context app = context.getApplicationContext();
            cookieJar = new PersistentCookieJar(app);

            HttpLoggingInterceptor logging = new HttpLoggingInterceptor();
            logging.setLevel(BuildConfig.DEBUG
                    ? HttpLoggingInterceptor.Level.BODY
                    : HttpLoggingInterceptor.Level.NONE);

            OkHttpClient okHttpClient = new OkHttpClient.Builder()
                    .connectTimeout(15, TimeUnit.SECONDS)
                    .readTimeout(30, TimeUnit.SECONDS)
                    .cookieJar(cookieJar)
                    .addInterceptor(new UnauthorizedInterceptor(app))
                    .addInterceptor(logging)
                    .build();

            retrofit = new Retrofit.Builder()
                    .baseUrl(BuildConfig.BASE_URL)
                    .client(okHttpClient)
                    .addConverterFactory(GsonConverterFactory.create())
                    .build();
        }
        return retrofit;
    }

    /** Tiện: RetrofitClient.create(this, LearningApiService.class) */
    public static <T> T create(Context context, Class<T> service) {
        return getClient(context).create(service);
    }

    /** Xóa cookie phiên (gọi khi đăng xuất / bị 401) */
    public static synchronized void clearSession() {
        if (cookieJar != null) cookieJar.clear();
    }

    /**
     * Giống axios interceptor trong frontend-web/src/api/api.js:
     * 401 (token hết hạn / bị revoke trong Redis) -> xóa phiên và quay về Login.
     * Bỏ qua các endpoint /auth/* (401 ở login nghĩa là sai mật khẩu).
     */
    private static class UnauthorizedInterceptor implements Interceptor {
        private final Context appContext;
        private long lastRedirectAt = 0;

        UnauthorizedInterceptor(Context appContext) {
            this.appContext = appContext;
        }

        @NonNull
        @Override
        public Response intercept(@NonNull Chain chain) throws IOException {
            Response response = chain.proceed(chain.request());
            String path = chain.request().url().encodedPath();

            if (response.code() == 401 && !path.contains("/auth/")) {
                long now = System.currentTimeMillis();
                if (now - lastRedirectAt > 3000) {
                    lastRedirectAt = now;
                    clearSession();
                    new SessionManager(appContext).clear();

                    Intent intent = new Intent(appContext, LoginActivity.class);
                    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
                    appContext.startActivity(intent);
                }
            }
            return response;
        }
    }
}
