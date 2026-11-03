package com.els.app.ui.auth;

import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.KeyEvent;
import android.view.View;
import android.view.inputmethod.EditorInfo;
import android.widget.ImageButton;
import android.widget.TextView;
import android.widget.Toast;

import androidx.activity.EdgeToEdge;
import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.els.app.R;
import com.els.app.data.remote.api.LearningApiService;
import com.els.app.data.remote.dto.ApiModels;
import com.els.app.data.remote.dto.response.ApiResponse;
import com.els.app.network.ApiCallback;
import com.els.app.network.RetrofitClient;
import com.els.app.util.Speaker;
import com.google.android.material.bottomnavigation.BottomNavigationView;
import com.google.android.material.button.MaterialButton;
import com.google.android.material.textfield.TextInputEditText;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

import retrofit2.Call;

public class DictionaryActivity extends AppCompatActivity {

    private static final int MAX_RECENT_WORDS = 3;
    private static final long SEARCH_DELAY = 400L;

    private static final String PREF_NAME = "dictionary_preferences";
    private static final String KEY_RECENT_WORDS = "recent_words";

    // Views
    private TextInputEditText edtSearch;

    private View layoutRecent;
    private View cardResult;
    private View layoutNotFound;

    private TextView tvResultWord;
    private TextView tvResultPhonetic;
    private TextView tvResultMeaning;
    private TextView tvResultExample;
    private TextView tvResultSynonyms;

    private ImageButton btnBack;
    private ImageButton btnSpeak;
    private ImageButton btnSave;
    private MaterialButton btnAddToVocab;

    private RecyclerView rvRecentSearches;
    private BottomNavigationView bottomNav;

    // Data
    private final List<String> recentWords = new ArrayList<>();

    private RecentSearchAdapter recentSearchAdapter;

    private LearningApiService api;
    private Speaker speaker;

    private ApiModels.WordDto currentWord;

    private Call<ApiResponse<List<ApiModels.WordDto>>> currentCall;

    // Realtime search
    private final Handler searchHandler = new Handler(Looper.getMainLooper());

    private int searchRequestId = 0;

    private final Runnable searchRunnable = () -> {
        if (edtSearch == null || isFinishing() || isDestroyed()) {
            return;
        }

        String query = getSearchText();

        if (!query.isEmpty()) {
            performSearch(query);
        } else {
            cancelCurrentSearch();
            currentWord = null;
            showRecentState();
        }
    };

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        EdgeToEdge.enable(this);
        setContentView(R.layout.activity_dictionary);
        setupWindowInsets();

        initViews();

        api = RetrofitClient.create(
                this,
                LearningApiService.class
        );

        speaker = new Speaker(this);

        loadRecentSearches();
        setupRecentSearchList();
        setupListeners();
        setupBottomNav();

        showRecentState();
    }

    private void setupWindowInsets() {
        View mainView = findViewById(R.id.main);

        if (mainView == null) {
            return;
        }

        ViewCompat.setOnApplyWindowInsetsListener(
                mainView,
                (view, windowInsets) -> {

                    Insets systemBars = windowInsets.getInsets(
                            WindowInsetsCompat.Type.systemBars()
                    );

                    view.setPadding(
                            systemBars.left,
                            systemBars.top,
                            systemBars.right,
                            0
                    );

                    return windowInsets;
                }
        );
    }

    private void initViews() {
        btnBack = findViewById(R.id.btnBack);

        edtSearch = findViewById(R.id.edtSearch);

        layoutRecent = findViewById(R.id.layoutRecent);
        cardResult = findViewById(R.id.cardResult);
        layoutNotFound = findViewById(R.id.layoutNotFound);

        tvResultWord = findViewById(R.id.tvResultWord);
        tvResultPhonetic = findViewById(R.id.tvResultPhonetic);
        tvResultMeaning = findViewById(R.id.tvResultMeaning);
        tvResultExample = findViewById(R.id.tvResultExample);
        tvResultSynonyms = findViewById(R.id.tvResultSynonyms);

        btnSpeak = findViewById(R.id.btnSpeak);
        btnSave = findViewById(R.id.btnSave);
        btnAddToVocab = findViewById(R.id.btnAddToVocab);

        rvRecentSearches = findViewById(R.id.rvRecentSearches);
        bottomNav = findViewById(R.id.bottomNav);
    }

    // ---------------------------------------------------------
    // RECENT SEARCHES
    // ---------------------------------------------------------

    private void loadRecentSearches() {
        SharedPreferences preferences =
                getSharedPreferences(PREF_NAME, MODE_PRIVATE);

        String savedWords = preferences.getString(
                KEY_RECENT_WORDS,
                ""
        );

        recentWords.clear();

        if (savedWords == null || savedWords.trim().isEmpty()) {
            return;
        }

        String[] words = savedWords.split("\\|");

        for (String word : words) {
            if (word != null && !word.trim().isEmpty()) {
                recentWords.add(word.trim());

                if (recentWords.size() >= MAX_RECENT_WORDS) {
                    break;
                }
            }
        }
    }

    private void saveRecentSearches() {
        StringBuilder builder = new StringBuilder();

        for (String word : recentWords) {
            if (builder.length() > 0) {
                builder.append("|");
            }

            builder.append(word);
        }

        getSharedPreferences(PREF_NAME, MODE_PRIVATE)
                .edit()
                .putString(KEY_RECENT_WORDS, builder.toString())
                .apply();
    }

    private void setupRecentSearchList() {
        recentSearchAdapter = new RecentSearchAdapter(
                recentWords,
                word -> {
                    if (word == null || word.trim().isEmpty()) {
                        return;
                    }

                    edtSearch.setText(word);
                    edtSearch.setSelection(word.length());

                    searchHandler.removeCallbacks(searchRunnable);
                    performSearch(word);
                }
        );

        rvRecentSearches.setLayoutManager(
                new LinearLayoutManager(this)
        );

        rvRecentSearches.setAdapter(recentSearchAdapter);
    }

    private void addToRecentSearches(String word) {
        if (word == null || word.trim().isEmpty()) {
            return;
        }

        String normalizedWord = word.trim();

        for (int i = 0; i < recentWords.size(); i++) {
            if (recentWords.get(i).equalsIgnoreCase(normalizedWord)) {
                recentWords.remove(i);
                break;
            }
        }

        recentWords.add(0, normalizedWord);

        while (recentWords.size() > MAX_RECENT_WORDS) {
            recentWords.remove(recentWords.size() - 1);
        }

        saveRecentSearches();

        if (recentSearchAdapter != null) {
            recentSearchAdapter.updateData(recentWords);
        }
    }

    // ---------------------------------------------------------
    // SEARCH
    // ---------------------------------------------------------

    private void setupListeners() {

        btnBack.setOnClickListener(v -> finish());

        // Realtime search with debounce
        edtSearch.addTextChangedListener(new android.text.TextWatcher() {

            @Override
            public void beforeTextChanged(
                    CharSequence s,
                    int start,
                    int count,
                    int after
            ) {
            }

            @Override
            public void onTextChanged(
                    CharSequence s,
                    int start,
                    int before,
                    int count
            ) {
                searchHandler.removeCallbacks(searchRunnable);

                String query = s == null ? "" : s.toString().trim();

                if (query.isEmpty()) {
                    cancelCurrentSearch();
                    currentWord = null;
                    showRecentState();
                    return;
                }

                searchHandler.postDelayed(
                        searchRunnable,
                        SEARCH_DELAY
                );
            }

            @Override
            public void afterTextChanged(android.text.Editable s) {
            }
        });

        // Search when pressing the keyboard search button
        edtSearch.setOnEditorActionListener(
                (TextView v, int actionId, KeyEvent event) -> {

                    boolean isSearchAction =
                            actionId == EditorInfo.IME_ACTION_SEARCH
                                    || actionId == EditorInfo.IME_ACTION_DONE;

                    boolean isEnter =
                            event != null
                                    && event.getKeyCode() == KeyEvent.KEYCODE_ENTER
                                    && event.getAction() == KeyEvent.ACTION_DOWN;

                    if (isSearchAction || isEnter) {
                        searchHandler.removeCallbacks(searchRunnable);
                        performSearch(getSearchText());
                        return true;
                    }

                    return false;
                }
        );

        btnSpeak.setOnClickListener(v -> {
            String word = tvResultWord.getText().toString().trim();

            if (!word.isEmpty() && speaker != null) {
                speaker.speak(word);
            }
        });

        btnSave.setOnClickListener(v ->
                Toast.makeText(
                        this,
                        "Tính năng yêu thích sẽ bổ sung sau",
                        Toast.LENGTH_SHORT
                ).show()
        );

        // This feature has not been implemented yet
        if (btnAddToVocab != null) {
            btnAddToVocab.setVisibility(View.GONE);
        }
    }

    private String getSearchText() {
        if (edtSearch.getText() == null) {
            return "";
        }

        return edtSearch.getText()
                .toString()
                .trim();
    }

    private void cancelCurrentSearch() {
        searchRequestId++;

        if (currentCall != null) {
            currentCall.cancel();
            currentCall = null;
        }
    }

    private void performSearch(String rawQuery) {

        String query = rawQuery == null
                ? ""
                : rawQuery.trim();

        if (query.isEmpty()) {
            cancelCurrentSearch();
            currentWord = null;
            showRecentState();
            return;
        }

        // Invalidate previous request
        searchRequestId++;

        final int requestId = searchRequestId;

        if (currentCall != null) {
            currentCall.cancel();
            currentCall = null;
        }

        currentCall = api.searchWords(query);

        currentCall.enqueue(
                new ApiCallback<List<ApiModels.WordDto>>() {

                    @Override
                    public void onSuccess(
                            List<ApiModels.WordDto> results
                    ) {

                        if (requestId != searchRequestId
                                || isFinishing()
                                || isDestroyed()) {
                            return;
                        }

                        currentCall = null;

                        // No matching word
                        if (results == null || results.isEmpty()) {
                            currentWord = null;
                            showNotFoundState();
                            return;
                        }

                        ApiModels.WordDto firstWord = results.get(0);

                        if (firstWord == null
                                || firstWord.getWord() == null
                                || firstWord.getWord().trim().isEmpty()) {

                            currentWord = null;
                            showNotFoundState();
                            return;
                        }

                        currentWord = firstWord;

                        // Combine meanings if the API returns
                        // multiple rows for the same word
                        StringBuilder meanings = new StringBuilder();

                        for (ApiModels.WordDto item : results) {

                            if (item == null
                                    || item.getMeaningVi() == null
                                    || item.getMeaningVi().trim().isEmpty()) {
                                continue;
                            }

                            if (meanings.length() > 0) {
                                meanings.append("\n");
                            }

                            String partOfSpeech = item.getPartOfSpeech();

                            if (partOfSpeech != null
                                    && !partOfSpeech.trim().isEmpty()) {

                                meanings.append("(")
                                        .append(partOfSpeech.trim())
                                        .append(") ");
                            }

                            meanings.append(item.getMeaningVi().trim());
                        }

                        showWordResult(
                                currentWord,
                                meanings.toString()
                        );
                    }

                    @Override
                    public void onError(String message) {

                        if (requestId != searchRequestId
                                || isFinishing()
                                || isDestroyed()) {
                            return;
                        }

                        currentCall = null;
                        currentWord = null;

                        showNotFoundState();

                        Toast.makeText(
                                DictionaryActivity.this,
                                message == null
                                        ? "Không thể kết nối đến máy chủ"
                                        : message,
                                Toast.LENGTH_SHORT
                        ).show();
                    }
                }
        );
    }

    // ---------------------------------------------------------
    // DISPLAY SEARCH RESULT
    // ---------------------------------------------------------

    private void showWordResult(
            ApiModels.WordDto word,
            String meanings
    ) {

        if (word == null) {
            showNotFoundState();
            return;
        }

        String wordText = word.getWord() == null
                ? ""
                : word.getWord();

        tvResultWord.setText(wordText);

        String pronunciation = word.getPronunciation();

        if (pronunciation == null || pronunciation.trim().isEmpty()) {
            tvResultPhonetic.setText("");
        } else {
            tvResultPhonetic.setText(pronunciation);
        }

        if (meanings == null || meanings.trim().isEmpty()) {
            tvResultMeaning.setText("Chưa có nghĩa tiếng Việt.");
        } else {
            tvResultMeaning.setText(meanings);
        }

        // The current WordDto does not provide example
        // or synonym fields in the code shared so far.
        tvResultExample.setText("");
        tvResultSynonyms.setText("");

        addToRecentSearches(wordText);

        showResultState();
    }

    private void showRecentState() {
        layoutRecent.setVisibility(View.VISIBLE);
        cardResult.setVisibility(View.GONE);
        layoutNotFound.setVisibility(View.GONE);
    }

    private void showResultState() {
        layoutRecent.setVisibility(View.GONE);
        cardResult.setVisibility(View.VISIBLE);
        layoutNotFound.setVisibility(View.GONE);
    }

    private void showNotFoundState() {
        layoutRecent.setVisibility(View.GONE);
        cardResult.setVisibility(View.GONE);
        layoutNotFound.setVisibility(View.VISIBLE);
    }

    // ---------------------------------------------------------
    // BOTTOM NAVIGATION
    // ---------------------------------------------------------

    private void setupBottomNav() {

        bottomNav.setOnItemSelectedListener(item -> {

            int itemId = item.getItemId();

            if (itemId == R.id.nav_home) {
                // Replace this class with your existing HomeActivity import
                startActivity(new Intent(this, HomeActivity.class));
                finish();
                return true;

            } else if (itemId == R.id.nav_learn) {
                // Already on the learning section
                return true;

            } else if (itemId == R.id.nav_progress) {
                startActivity(new Intent(this, ProgressActivity.class));
                finish();
                return true;

            } else if (itemId == R.id.nav_profile) {
                startActivity(new Intent(this, ProfileActivity.class));
                finish();
                return true;
            }

            return false;
        });
    }

    // ---------------------------------------------------------
    // LIFECYCLE
    // ---------------------------------------------------------

    @Override
    protected void onDestroy() {
        searchHandler.removeCallbacksAndMessages(null);

        if (currentCall != null) {
            currentCall.cancel();
            currentCall = null;
        }

        if (speaker != null) {
            speaker.shutdown();
            speaker = null;
        }

        super.onDestroy();
    }
}
