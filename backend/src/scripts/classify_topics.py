"""
Script phân loại từ vựng theo chủ đề học tập (Topic) bằng zero-shot classification
dựa trên sentence embedding đa ngôn ngữ (miễn phí, chạy local, không cần API trả phí).

Yêu cầu:
    pip install sentence-transformers psycopg2-binary python-dotenv wordfreq --break-system-packages

Cách dùng:
    python classify_topics.py --limit 5000 --threshold 0.5 --dry-run   # xem thử, chưa ghi DB
    python classify_topics.py --limit 5000 --threshold 0.5             # ghi thật vào DB

Chiến lược:
    1. Chỉ lấy TỪ ĐƠN (không có khoảng trắng/gạch nối), độ dài 3-15 ký tự, chưa có topic_id,
       VÀ đủ phổ biến trong tiếng Anh thực tế (lọc bằng wordfreq) -> tránh phân loại từ cổ/hiếm/rác.
    2. Với mỗi TOPIC, viết vài từ khóa/mô tả tiếng Việt đại diện (seed) -> encode thành vector.
    3. Encode meaning_vi của từng từ ứng viên -> so cosine similarity với từng topic.
    4. Nếu similarity cao nhất VƯỢT NGƯỠNG (threshold) -> gán topic đó.
       Nếu KHÔNG -> để topic_id = NULL (không ép gán sai, thà bỏ trống còn hơn gán nhầm).
    5. Các case gần ngưỡng (threshold đến threshold+0.15) được xuất ra CSV để review thủ công.
"""

import argparse
import csv
import os
import json
import psycopg2
from dotenv import load_dotenv
from sentence_transformers import SentenceTransformer, util
from wordfreq import word_frequency

load_dotenv()

MIN_WORD_FREQUENCY = 1e-6  # ngưỡng tần suất tối thiểu

# ==========================================================================
# ĐỌC CHỦ ĐỀ TỪ FILE JSON
# ==========================================================================
# Lấy đường dẫn tuyệt đối của thư mục chứa script hiện tại
script_dir = os.path.dirname(__file__)
json_path = os.path.join(script_dir, 'topic_config.json')

# Đọc và nạp dữ liệu vào biến TOPIC_SEEDS
try:
    with open(json_path, 'r', encoding='utf-8') as f:
        TOPIC_SEEDS = json.load(f)
except FileNotFoundError:
    print(f"Lỗi: Không tìm thấy file cấu hình tại {json_path}")
    exit(1)


def fetch_candidate_words(conn, limit, last_id):
    """Sử dụng con trỏ last_id để trượt qua các từ đã xử lý (tránh lặp vô tận)"""
    sql = """
        SELECT id, word, meaning_vi
        FROM words
        WHERE topic_id IS NULL
          AND id > %s
          AND word ~ '^[A-Za-z]+$'
          AND length(word) BETWEEN 3 AND 15
        ORDER BY id
        LIMIT 20000; -- Lấy dư ra một chút để bù cho lượng bị lọc bởi wordfreq
    """
    with conn.cursor() as cur:
        cur.execute(sql, (last_id,))
        all_rows = cur.fetchall()

    if not all_rows:
        return [], last_id

    filtered = []
    highest_id = last_id
    
    for row in all_rows:
        highest_id = max(highest_id, row[0])
        if word_frequency(row[1].lower(), "en") >= MIN_WORD_FREQUENCY:
            filtered.append(row)
            if len(filtered) == limit:
                # Đã gom đủ 5000 từ phổ biến, chốt mức ID tại đây để mẻ sau lấy tiếp
                highest_id = row[0]
                break

    return filtered, highest_id


def get_or_create_topic_ids(conn, topic_seeds_dict):
    """Đảm bảo topic tồn tại và cập nhật luôn cả cột description vào Database."""
    result = {}
    with conn.cursor() as cur:
        for title, description in topic_seeds_dict.items():
            cur.execute("SELECT id FROM topics WHERE LOWER(title) = LOWER(%s) LIMIT 1", (title,))
            row = cur.fetchone()
            if row:
                result[title] = row[0]
                # Nếu topic đã có, tiện thể cập nhật luôn description cho mới
                cur.execute("UPDATE topics SET description = %s WHERE id = %s", (description, row[0]))
            else:
                # Nếu topic chưa có, tạo mới với đầy đủ cả title và description
                cur.execute("INSERT INTO topics (title, description) VALUES (%s, %s) RETURNING id", (title, description))
                result[title] = cur.fetchone()[0]
        conn.commit()
    return result


def classify(model, topic_titles, topic_seed_texts, candidates, threshold):
    """Trả về list (word_id, word, topic_title hoặc None, similarity_score) cho từng ứng viên."""
    topic_embeddings = model.encode(topic_seed_texts, convert_to_tensor=True)

    # Chỉ dùng nghĩa tiếng Việt để encode - đồng ngôn ngữ với topic seeds (thuần Việt)
    # giúp cosine similarity phản ánh đúng ngữ nghĩa hơn, tránh bị pha loãng bởi từ tiếng Anh
    word_texts = [meaning for (_id, word, meaning) in candidates]
    word_embeddings = model.encode(word_texts, convert_to_tensor=True, batch_size=64, show_progress_bar=True)

    cosine_scores = util.cos_sim(word_embeddings, topic_embeddings)

    results = []
    for i, (word_id, word, meaning) in enumerate(candidates):
        scores = cosine_scores[i]
        best_idx = int(scores.argmax())
        best_score = float(scores[best_idx])
        assigned_topic = topic_titles[best_idx] if best_score >= threshold else None
        results.append((word_id, word, assigned_topic, best_score))
    return results


def export_borderline_to_csv(results, low, high, filename="borderline_review.csv"):
    """Xuất case gần ngưỡng ra CSV (ghi nối tiếp 'a' để lưu dữ liệu của tất cả các mẻ)."""
    borderline = [r for r in results if r[2] is not None and low <= r[3] < high]
    if not borderline:
        return
    
    # Kiểm tra xem file đã tồn tại chưa để quyết định có in dòng Tiêu đề (Header) hay không
    file_exists = os.path.isfile(filename)
    
    with open(filename, "a", newline="", encoding="utf-8-sig") as f:
        writer = csv.writer(f)
        if not file_exists:
            writer.writerow(["word", "assigned_topic", "score"])
        for word_id, word, topic, score in borderline:
            writer.writerow([word, topic, round(score, 3)])


def apply_updates(conn, results):
    """Cập nhật trực tiếp cột topic_id vào bảng words."""
    updated = 0
    with conn.cursor() as cur:
        for word_id, word, topic_id, score in results:
            if topic_id is None:
                continue
            cur.execute("UPDATE words SET topic_id = %s WHERE id = %s", (topic_id, word_id))
            updated += 1
        conn.commit()
    return updated


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--limit", type=int, default=5000, help="Số từ ứng viên tối đa mỗi mẻ")
    parser.add_argument("--threshold", type=float, default=0.48, help="Ngưỡng similarity tối thiểu")
    parser.add_argument("--dry-run", action="store_true", help="Chỉ chạy 1 mẻ để xem thử, không ghi DB")
    args = parser.parse_args()

    print("Đang tải model embedding đa ngôn ngữ...")
    model = SentenceTransformer("paraphrase-multilingual-MiniLM-L12-v2")

    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        print("Lỗi: Không tìm thấy DATABASE_URL trong file .env!")
        return
    conn = psycopg2.connect(db_url)

    # 1. ĐỌC FILE CẤU HÌNH JSON
    script_dir = os.path.dirname(__file__)
    json_path = os.path.join(script_dir, 'topic_config.json')
    try:
        with open(json_path, 'r', encoding='utf-8') as f:
            TOPIC_SEEDS = json.load(f)
    except FileNotFoundError:
        print(f"Lỗi: Không tìm thấy {json_path}")
        return

    topic_titles = list(TOPIC_SEEDS.keys())
    topic_seed_texts = list(TOPIC_SEEDS.values())

    if not args.dry_run:
        print("\nĐảm bảo các chủ đề đã tồn tại trong bảng topics...")
        topic_id_map = get_or_create_topic_ids(conn, TOPIC_SEEDS)

    if os.path.exists("borderline_review.csv"):
        os.remove("borderline_review.csv")
    
    # KHỞI TẠO BỘ ĐẾM THỐNG KÊ TỔNG VÀ CON TRỞ ID
    total_processed = 0
    total_classified = 0
    last_id = 0  # <--- Bắt đầu quét từ ID số 0

    print(f"\n🚀 BẮT ĐẦU CHẠY TỰ ĐỘNG THEO MẺ (Mỗi mẻ {args.limit} từ)...\n")

    # 3. VÒNG LẶP XỬ LÝ TỪNG CỤC
    while True:
        # Truyền last_id vào và nhận lại highest_id
        candidates, highest_id = fetch_candidate_words(conn, args.limit, last_id)
        batch_size = len(candidates)
        
        if batch_size == 0:
            print("\n✅ Đã duyệt hết toàn bộ kho từ vựng hợp lệ trong Database!")
            break
            
        total_processed += batch_size
        print(f"-> Đang xử lý mẻ {batch_size} từ (Tổng số đã duyệt: {total_processed})...")
        
        results = classify(model, topic_titles, topic_seed_texts, candidates, args.threshold)
        
        classified = [r for r in results if r[2] is not None]
        total_classified += len(classified)

        export_borderline_to_csv(results, low=args.threshold, high=args.threshold + 0.15)

        # Nếu là chạy thử, in ra 1 mẻ rồi ngắt luôn vòng lặp để tránh lặp vô tận
        if args.dry_run:
            print(f"   [DRY RUN] Mẻ này gán được {len(classified)}/{batch_size} từ.")
            print("Ví dụ 10 kết quả đầu:")
            for word_id, word, topic, score in results[:10]:
                status = topic if topic else "(không gán)"
                print(f"  {word:15s} -> {status:20s} (score={score:.3f})")
            print("\n[DRY RUN] Đã ngắt. Bỏ cờ --dry-run để hệ thống cày hết kho từ vựng.")
            break

        final_results = [
            (word_id, word, topic_id_map[topic] if topic else None, score)
            for (word_id, word, topic, score) in results
        ]

        updated = apply_updates(conn, final_results)
        print(f"   Đã ghi {updated} từ vào DB thành công.")

        last_id = highest_id

    # 4. BẢNG TỔNG KẾT TỶ LỆ THẤT THOÁT
    if total_processed > 0 and not args.dry_run:
        success_rate = (total_classified / total_processed) * 100
        loss_rate = 100 - success_rate
        print("\n================ TỔNG KẾT ================")
        print(f"Tổng số từ vựng đủ điều kiện đã đưa vào phân tích: {total_processed}")
        print(f"Số từ được gán chủ đề thành công: {total_classified} ({success_rate:.2f}%)")
        print(f"Số từ thất thoát (chấp nhận bỏ trống): {total_processed - total_classified} ({loss_rate:.2f}%)")
        print("==========================================")

    conn.close()

if __name__ == "__main__":
    main()