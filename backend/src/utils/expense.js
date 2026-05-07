const MONTHS = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar']
const MONTH_ORDER = `array_position(ARRAY['Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar'],month)`
const MONTH_TO_NUM = `CASE month WHEN 'Jan' THEN 1 WHEN 'Feb' THEN 2 WHEN 'Mar' THEN 3 WHEN 'Apr' THEN 4 WHEN 'May' THEN 5 WHEN 'Jun' THEN 6 WHEN 'Jul' THEN 7 WHEN 'Aug' THEN 8 WHEN 'Sep' THEN 9 WHEN 'Oct' THEN 10 WHEN 'Nov' THEN 11 WHEN 'Dec' THEN 12 END`

function parseExpenseAmount(value) {
  if (value === undefined || value === null || value === '') return 0
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null
}

function buildExpenseWhere(queryParams) {
  const { fy, start_date, end_date } = queryParams
  if (start_date && end_date) {
    return {
      where: `WHERE make_date(year, ${MONTH_TO_NUM}, 1) BETWEEN $1::date AND $2::date`,
      params: [start_date, end_date],
      label: `${start_date} to ${end_date}`,
    }
  }

  const fyVal = fy || '2024-25'
  const [startYear] = fyVal.split('-').map(Number)
  return {
    where: `WHERE (month=ANY($1) AND year=$2) OR (month=ANY($3) AND year=$4)`,
    params: [['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'], startYear, ['Jan', 'Feb', 'Mar'], startYear + 1],
    label: fyVal,
  }
}

module.exports = {
  MONTHS,
  MONTH_ORDER,
  parseExpenseAmount,
  buildExpenseWhere,
}
