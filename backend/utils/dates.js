// Helper to get past 7 days' date strings in server's local time (YYYY-MM-DD)
function getPast7DaysStrings() {
    const dates = [];
    for (let i = 0; i < 7; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        dates.push(`${y}-${m}-${day}`);
    }
    return dates;
}

// Helper to get lesson week boundaries (MM/DD - MM/DD) based on weekly lesson day cycle (e.g. Wednesday)
function getLessonWeekBoundaries() {
    const validDayIndex = 1; // Fixed to Monday for standard calendar week

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Midnight local time
    
    const currentDayIndex = today.getDay(); // Sunday=0, Monday=1, ...
    
    // Calculate the start date (most recent lessonDay <= today)
    let daysToSubtract = currentDayIndex - validDayIndex;
    if (daysToSubtract < 0) {
        daysToSubtract += 7; // Go back to previous week's lessonDay
    }
    
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - daysToSubtract);
    
    // The end date is 6 days after start date
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    
    return { startDate, endDate };
}

// Helper to get all YYYY-MM-DD date strings in a range [start, end]
function getDatesInRange(start, end) {
    const dates = [];
    const curr = new Date(start);
    while (curr <= end) {
        const y = curr.getFullYear();
        const m = String(curr.getMonth() + 1).padStart(2, '0');
        const d = String(curr.getDate()).padStart(2, '0');
        dates.push(`${y}-${m}-${d}`);
        curr.setDate(curr.getDate() + 1);
    }
    return dates;
}

// Helper to format date as MM/DD
function formatMonthDay(date) {
    const m = date.getMonth() + 1;
    const d = date.getDate();
    return `${m}/${d}`;
}

module.exports = {
    getPast7DaysStrings,
    getLessonWeekBoundaries,
    getDatesInRange,
    formatMonthDay
};
