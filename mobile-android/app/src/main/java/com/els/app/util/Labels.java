package com.els.app.util;

public final class Labels {

    private Labels() { }

    public static String tier(String tier) {
        if (tier == null) return "Chưa xác định";
        switch (tier) {
            case "BEGINNER": return "Cơ bản (Beginner)";
            case "INTERMEDIATE": return "Trung cấp (Intermediate)";
            case "ADVANCED": return "Nâng cao (Advanced)";
            default: return tier;
        }
    }

    public static String difficulty(String d) {
        if (d == null) return "";
        switch (d) {
            case "BEGINNER": return "Cơ bản";
            case "INTERMEDIATE": return "Trung cấp";
            case "ADVANCED": return "Nâng cao";
            default: return d;
        }
    }

    public static String flashcardStatus(String s) {
        if (s == null) return "Mới";
        switch (s) {
            case "LEARNING": return "Đang học";
            case "MASTERED": return "Thành thạo";
            default: return "Mới";
        }
    }
}
