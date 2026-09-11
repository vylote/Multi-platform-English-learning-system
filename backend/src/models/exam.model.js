class Exam {
  constructor({ id, topic_id, title, duration, question_count }) {
    this.id = id;
    this.topic_id = topic_id;
    this.title = title;
    this.duration = duration; // phút
    this.question_count = Number(question_count) || 0;
  }

  toJSON() {
    return {
      id: this.id,
      topic_id: this.topic_id,
      title: this.title,
      duration: this.duration,
      question_count: this.question_count,
    };
  }
}

// Câu hỏi trả về khi LÀM BÀI - ẨN correct_option
class ExamQuestionSafe {
  constructor({ id, question_text, option_a, option_b, option_c, option_d }) {
    this.id = id;
    this.question_text = question_text;
    this.option_a = option_a;
    this.option_b = option_b;
    this.option_c = option_c;
    this.option_d = option_d;
  }

  toJSON() {
    return {
      id: this.id,
      question_text: this.question_text,
      option_a: this.option_a,
      option_b: this.option_b,
      option_c: this.option_c,
      option_d: this.option_d,
    };
  }
}

// Item review sau khi NỘP BÀI - hiển thị đủ đáp án đúng/sai để đối chiếu
class ExamReviewItem {
  constructor({ question_id, question_text, option_a, option_b, option_c, option_d, correct_option, selected_option }) {
    this.question_id = question_id;
    this.question_text = question_text;
    this.option_a = option_a;
    this.option_b = option_b;
    this.option_c = option_c;
    this.option_d = option_d;
    this.correct_option = correct_option;
    this.selected_option = selected_option || null;
    this.is_correct = this.selected_option === this.correct_option;
  }

  toJSON() {
    return {
      question_id: this.question_id,
      question_text: this.question_text,
      option_a: this.option_a,
      option_b: this.option_b,
      option_c: this.option_c,
      option_d: this.option_d,
      correct_option: this.correct_option,
      selected_option: this.selected_option,
      is_correct: this.is_correct,
    };
  }
}

class ExamResultDetail {
  constructor({ score, correct_count, total_questions, time_spent, review }) {
    this.score = score;
    this.correct_count = correct_count;
    this.total_questions = total_questions;
    this.time_spent = time_spent; // giây
    this.review = review; // ExamReviewItem[]
  }

  toJSON() {
    return {
      score: this.score,
      correct_count: this.correct_count,
      total_questions: this.total_questions,
      time_spent: this.time_spent,
      review: this.review.map((r) => r.toJSON()),
    };
  }
}

module.exports = { Exam, ExamQuestionSafe, ExamReviewItem, ExamResultDetail };