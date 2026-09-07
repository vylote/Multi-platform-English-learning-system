package com.els.app.ui.auth;

import android.content.Intent;
import android.os.Bundle;
import android.view.KeyEvent;
import android.view.inputmethod.EditorInfo;
import android.widget.ImageButton;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Toast;

import androidx.activity.EdgeToEdge;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.els.app.R;
import com.google.android.material.bottomnavigation.BottomNavigationView;
import com.google.android.material.button.MaterialButton;
import com.google.android.material.textfield.TextInputEditText;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class DictionaryActivity extends AppCompatActivity {

    // Số lượng từ tối đa lưu trong "Tra cứu gần đây"
    private static final int MAX_RECENT_WORDS = 3;

    // ===== Model tạm cho 1 mục từ điển =====
    private static class DictionaryEntry {
        String word;
        String phonetic;
        String meaning;
        String example;
        String synonyms;

        DictionaryEntry(String word, String phonetic, String meaning, String example, String synonyms) {
            this.word = word;
            this.phonetic = phonetic;
            this.meaning = meaning;
            this.example = example;
            this.synonyms = synonyms;
        }
    }

    private ImageButton btnBack;
    private TextInputEditText edtSearch;

    private LinearLayout layoutRecent;
    private androidx.cardview.widget.CardView cardResult;
    private LinearLayout layoutNotFound;

    private TextView tvResultWord;
    private TextView tvResultPhonetic;
    private TextView tvResultMeaning;
    private TextView tvResultExample;
    private TextView tvResultSynonyms;
    private ImageButton btnSpeak;
    private ImageButton btnSave;
    private MaterialButton btnAddToVocab;

    private RecyclerView rvRecentSearches;
    private RecentSearchAdapter recentSearchAdapter;
    private List<String> recentWords = new ArrayList<>();

    private BottomNavigationView bottomNav;

    // TODO: Thay bằng gọi API / Repository tra từ điển thật
    private Map<String, DictionaryEntry> fakeDictionary = new HashMap<>();

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        EdgeToEdge.enable(this);
        setContentView(R.layout.activity_dictionary);

        ViewCompat.setOnApplyWindowInsetsListener(findViewById(R.id.main), (v, insets) -> {
            Insets systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars());
            v.setPadding(systemBars.left, systemBars.top, systemBars.right, 0);
            return insets;
        });

        initViews();
        loadFakeDictionary();
        setupRecentSearchList();
        setupListeners();
        setupBottomNav();
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

    private void loadFakeDictionary() {
        // TODO: Thay bằng gọi API / Repository tra từ điển thật
        fakeDictionary.put("serendipity", new DictionaryEntry(
                "Serendipity", "/ˌser.ənˈdɪp.ə.ti/ • danh từ",
                "Sự tình cờ may mắn; khả năng tìm thấy điều tốt đẹp một cách ngẫu nhiên.",
                "\"Meeting you here was pure serendipity.\"",
                "fluke, chance, luck"));

        fakeDictionary.put("ambitious", new DictionaryEntry(
                "Ambitious", "/æmˈbɪʃ.əs/ • tính từ",
                "Đầy tham vọng, khao khát thành công.",
                "\"She is ambitious about her career.\"",
                "driven, aspiring"));

        fakeDictionary.put("resilient", new DictionaryEntry(
                "Resilient", "/rɪˈzɪl.i.ənt/ • tính từ",
                "Kiên cường, có khả năng phục hồi nhanh sau khó khăn.",
                "\"He remained resilient despite the setbacks.\"",
                "tough, adaptable"));

        fakeDictionary.put("diligent", new DictionaryEntry(
                "Diligent", "/ˈdɪl.ɪ.dʒənt/ • tính từ",
                "Chăm chỉ, cần cù, chịu khó.",
                "\"She is a diligent student who never misses class.\"",
                "hardworking, industrious"));

        fakeDictionary.put("eloquent", new DictionaryEntry(
                "Eloquent", "/ˈel.ə.kwənt/ • tính từ",
                "Có tài hùng biện, ăn nói lưu loát và thuyết phục.",
                "\"He gave an eloquent speech at the ceremony.\"",
                "articulate, fluent"));

        fakeDictionary.put("curious", new DictionaryEntry(
                "Curious", "/ˈkjʊər.i.əs/ • tính từ",
                "Tò mò, ham tìm hiểu.",
                "\"The curious child asked many questions.\"",
                "inquisitive, interested"));
    }

    private void setupRecentSearchList() {
        // TODO: lấy danh sách tra cứu gần đây thật từ SharedPreferences / Room DB
        recentWords.add("Serendipity");
        recentWords.add("Ambitious");
        recentWords.add("Resilient");

        recentSearchAdapter = new RecentSearchAdapter(recentWords, word -> {
            edtSearch.setText(word);
            performSearch(word);
        });

        rvRecentSearches.setLayoutManager(new LinearLayoutManager(this));
        rvRecentSearches.setAdapter(recentSearchAdapter);
    }

    private void setupListeners() {
        btnBack.setOnClickListener(v -> finish());

        edtSearch.setOnEditorActionListener((v, actionId, event) -> {
            if (actionId == EditorInfo.IME_ACTION_SEARCH
                    || (event != null && event.getKeyCode() == KeyEvent.KEYCODE_ENTER)) {
                performSearch(edtSearch.getText() != null ? edtSearch.getText().toString() : "");
                return true;
            }
            return false;
        });

        btnSpeak.setOnClickListener(v -> {
            // TODO: tích hợp TextToSpeech để phát âm từ đang hiển thị
            Toast.makeText(this, "Phát âm: " + tvResultWord.getText(), Toast.LENGTH_SHORT).show();
        });

        btnSave.setOnClickListener(v -> {
            // TODO: lưu/bỏ lưu từ vào danh sách yêu thích
            Toast.makeText(this, "Đã lưu vào yêu thích", Toast.LENGTH_SHORT).show();
        });

        btnAddToVocab.setOnClickListener(v -> {
            // TODO: thêm từ hiện tại vào bộ flashcard từ vựng của người dùng
            Toast.makeText(this, "Đã thêm vào bộ từ vựng", Toast.LENGTH_SHORT).show();
        });
    }

    private void performSearch(String rawQuery) {
        String query = rawQuery == null ? "" : rawQuery.trim().toLowerCase();

        if (query.isEmpty()) {
            showRecentState();
            return;
        }

        DictionaryEntry entry = fakeDictionary.get(query);
        if (entry != null) {
            showResultState(entry);
        } else {
            showNotFoundState();
        }
    }

    private void showRecentState() {
        layoutRecent.setVisibility(android.view.View.VISIBLE);
        cardResult.setVisibility(android.view.View.GONE);
        layoutNotFound.setVisibility(android.view.View.GONE);
    }

    private void showResultState(DictionaryEntry entry) {
        tvResultWord.setText(entry.word);
        tvResultPhonetic.setText(entry.phonetic);
        tvResultMeaning.setText(entry.meaning);
        tvResultExample.setText(entry.example);
        tvResultSynonyms.setText(entry.synonyms);

        addToRecentSearches(entry.word);

        layoutRecent.setVisibility(android.view.View.GONE);
        cardResult.setVisibility(android.view.View.VISIBLE);
        layoutNotFound.setVisibility(android.view.View.GONE);
    }

    private void showNotFoundState() {
        layoutRecent.setVisibility(android.view.View.GONE);
        cardResult.setVisibility(android.view.View.GONE);
        layoutNotFound.setVisibility(android.view.View.VISIBLE);
    }

    /** Thêm từ vào đầu danh sách "Tra cứu gần đây", giới hạn tối đa MAX_RECENT_WORDS từ */
    private void addToRecentSearches(String word) {
        recentWords.remove(word);
        recentWords.add(0, word);

        while (recentWords.size() > MAX_RECENT_WORDS) {
            recentWords.remove(recentWords.size() - 1);
        }

        recentSearchAdapter.updateData(recentWords);
        // TODO: lưu lại danh sách này vào SharedPreferences / Room DB
    }

    private void setupBottomNav() {
        bottomNav.setSelectedItemId(R.id.nav_learn);

        bottomNav.setOnItemSelectedListener(item -> {
            int id = item.getItemId();
            if (id == R.id.nav_home) {
                navigateTo(HomeActivity.class);
                return true;
            } else if (id == R.id.nav_learn) {
                return true;
            } else if (id == R.id.nav_progress) {
                navigateTo(ProgressActivity.class);
                return true;
            } else if (id == R.id.nav_profile) {
                navigateTo(ProfileActivity.class);
                return true;
            }
            return false;
        });
    }

    private void navigateTo(Class<?> targetActivity) {
        Intent intent = new Intent(this, targetActivity);
        startActivity(intent);
        overridePendingTransition(0, 0);
    }
}