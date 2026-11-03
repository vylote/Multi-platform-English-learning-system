package com.els.app.ui.common;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.els.app.R;

import java.util.ArrayList;
import java.util.List;

/** Adapter dùng chung cho mọi màn danh sách đơn giản (tiêu đề + mô tả + nhãn phải). */
public class RowAdapter extends RecyclerView.Adapter<RowAdapter.VH> {

    public static class Row {
        public final String title;
        public final String subtitle;
        public final String tag;
        public final Object payload;   // đối tượng gốc để xử lý khi bấm

        public Row(String title, String subtitle, String tag, Object payload) {
            this.title = title;
            this.subtitle = subtitle;
            this.tag = tag;
            this.payload = payload;
        }
    }

    public interface Listener {
        void onClick(Row row);
    }

    private final List<Row> rows = new ArrayList<>();
    private final Listener listener;

    public RowAdapter(Listener listener) {
        this.listener = listener;
    }

    public void setRows(List<Row> newRows) {
        rows.clear();
        rows.addAll(newRows);
        notifyDataSetChanged();
    }

    public void addRows(List<Row> more) {
        int start = rows.size();
        rows.addAll(more);
        notifyItemRangeInserted(start, more.size());
    }

    public int size() {
        return rows.size();
    }

    @NonNull
    @Override
    public VH onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        return new VH(LayoutInflater.from(parent.getContext())
                .inflate(R.layout.item_row, parent, false));
    }

    @Override
    public void onBindViewHolder(@NonNull VH h, int position) {
        Row r = rows.get(position);
        h.title.setText(r.title);
        h.sub.setText(r.subtitle);
        h.sub.setVisibility(r.subtitle == null || r.subtitle.isEmpty() ? View.GONE : View.VISIBLE);
        h.tag.setText(r.tag);
        h.itemView.setOnClickListener(v -> {
            if (listener != null) listener.onClick(r);
        });
    }

    @Override
    public int getItemCount() {
        return rows.size();
    }

    static class VH extends RecyclerView.ViewHolder {
        final TextView title, sub, tag;

        VH(@NonNull View v) {
            super(v);
            title = v.findViewById(R.id.tvRowTitle);
            sub = v.findViewById(R.id.tvRowSub);
            tag = v.findViewById(R.id.tvRowTag);
        }
    }
}
