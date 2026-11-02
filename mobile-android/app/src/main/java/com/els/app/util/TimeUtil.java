package com.els.app.util;

import java.util.TimeZone;

public final class TimeUtil {

    private TimeUtil() { }

    /**
     * Số phút lệch so với UTC (UTC+7 -> 420).
     * Tương đương getBackendTimezoneOffset() trong frontend-web/src/utils/timezone.js
     * Backend dùng giá trị này để tính "ngày hôm nay" cho streak.
     */
    public static int offsetMinutes() {
        return TimeZone.getDefault().getOffset(System.currentTimeMillis()) / 60000;
    }
}
