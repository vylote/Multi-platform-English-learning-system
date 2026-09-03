const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');

dayjs.extend(utc);
dayjs.extend(timezone);

const VN_TIMEZONE = 'Asia/Ho_Chi_Minh';

const formatVNDateTime = (value) => {
  if (!value) return null;
  return dayjs(value).tz(VN_TIMEZONE).format('YYYY-MM-DDTHH:mm:ssZ');
};

module.exports = { formatVNDateTime, VN_TIMEZONE };