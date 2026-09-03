package com.els.app.network;

import android.content.Context;
import android.content.SharedPreferences;

import androidx.annotation.NonNull;

import com.els.app.BuildConfig;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import okhttp3.Cookie;
import okhttp3.CookieJar;
import okhttp3.HttpUrl;
import okhttp3.OkHttpClient;
import okhttp3.logging.HttpLoggingInterceptor;
import retrofit2.Retrofit;
import retrofit2.converter.gson.GsonConverterFactory;

public class RetrofitClient {
    private RetrofitClient() {
        /* This utility class should not be instantiated */
    }

    // IP đặc biệt kết nối từ máy ảo Android về máy tính cài Server Node.js
    private static final String BASE_URL = BuildConfig.BASE_URL;

    private static Retrofit retrofit = null;

    public static Retrofit getClient(Context context) {
        if (retrofit == null) {
            HttpLoggingInterceptor logging = new HttpLoggingInterceptor();
            //TODO: debug on dev mode
            logging.setLevel(HttpLoggingInterceptor.Level.BODY);

            // Xử lý tự động duy trì Cookie an toàn
            OkHttpClient okHttpClient = new OkHttpClient.Builder()
                    .addInterceptor(logging)
                    .cookieJar(new CookieJar() {
                        private final SharedPreferences sharedPreferences =
                                context.getSharedPreferences("CookiePrefs", Context.MODE_PRIVATE);

                        @Override
                        public void saveFromResponse(@NonNull HttpUrl url, @NonNull List<Cookie> cookies) {
                            Set<String> cookieStrings = new HashSet<>();
                            for (Cookie cookie : cookies) {
                                cookieStrings.add(cookie.toString());
                            }
                            sharedPreferences.edit().putStringSet("session_cookies", cookieStrings).apply();
                        }

                        @NonNull
                        @Override
                        public List<Cookie> loadForRequest(@NonNull HttpUrl url) {
                            List<Cookie> cookies = new ArrayList<>();
                            Set<String> cookieStrings = sharedPreferences.getStringSet("session_cookies", new HashSet<>());
                            for (String cookieString : cookieStrings) {
                                Cookie cookie = Cookie.parse(url, cookieString);
                                if (cookie != null) {
                                    cookies.add(cookie);
                                }
                            }
                            return cookies;
                        }
                    })
                    .build();

            retrofit = new Retrofit.Builder()
                    .baseUrl(BASE_URL)
                    .client(okHttpClient)
                    .addConverterFactory(GsonConverterFactory.create())
                    .build();
        }
        return retrofit;
    }
}
