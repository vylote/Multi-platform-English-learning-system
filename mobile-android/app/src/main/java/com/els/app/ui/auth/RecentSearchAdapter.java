package com.els.app.ui.auth;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.els.app.R;

import java.util.List;

public class RecentSearchAdapter extends RecyclerView.Adapter<RecentSearchAdapter.RecentViewHolder> {

    public interface OnRecentWordClickListener {
        void onRecentWordClick(String word);
    }

    private List<String> recentWords;
    private OnRecentWordClickListener listener;

    public RecentSearchAdapter(List<String> recentWords, OnRecentWordClickListener listener) {
        this.recentWords = recentWords;
        this.listener = listener;
    }

    @NonNull
    @Override
    public RecentViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext())
                .inflate(R.layout.item_recent_search, parent, false);
        return new RecentViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull RecentViewHolder holder, int position) {
        String word = recentWords.get(position);
        holder.tvRecentWord.setText(word);

        holder.itemView.setOnClickListener(v -> {
            if (listener != null) {
                listener.onRecentWordClick(word);
            }
        });
    }

    @Override
    public int getItemCount() {
        return recentWords.size();
    }

    public void updateData(List<String> newWords) {
        this.recentWords = newWords;
        notifyDataSetChanged();
    }

    static class RecentViewHolder extends RecyclerView.ViewHolder {
        TextView tvRecentWord;

        RecentViewHolder(@NonNull View itemView) {
            super(itemView);
            tvRecentWord = itemView.findViewById(R.id.tvRecentWord);
        }
    }
}