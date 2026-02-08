// Pure functions for heatmap logic — testable without DOM

export function formatDate(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function getLevel(count) {
  return count === 0 ? 0 : count === 1 ? 1 : count === 2 ? 2 : count <= 4 ? 3 : 4;
}

export function buildHeatmapCells(activityLog, today, daysBack = 90) {
  const activityMap = new Map();
  activityLog.forEach(a => {
    activityMap.set(a.date, { count: a.count, topics: a.topics, members: a.members || [] });
  });

  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - daysBack);
  const dayOfWeek = startDate.getDay();
  startDate.setDate(startDate.getDate() - dayOfWeek);

  const endDate = new Date(today);
  endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));

  const months = [];
  let lastMonth = -1;
  const cells = [];
  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    const dateStr = formatDate(currentDate);
    const activity = activityMap.get(dateStr);
    const count = activity ? activity.count : 0;
    const topics = activity ? activity.topics : [];
    const members = activity ? activity.members : [];

    if (currentDate.getMonth() !== lastMonth && cells.length < (daysBack + 14)) {
      months.push({
        index: Math.floor(cells.length / 7),
        name: currentDate.toLocaleDateString('en', { month: 'short' })
      });
      lastMonth = currentDate.getMonth();
    }

    const level = getLevel(count);
    const isFuture = currentDate > today;

    cells.push({ date: dateStr, count, topics, members, level, isFuture });
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return { cells, months, totalWeeks: Math.ceil(cells.length / 7) };
}

export function getCategoryClass(category) {
  const map = {
    'Critical Thinking': 'critical',
    'Natural Science': 'natural',
    'Applied Science': 'applied',
    'Technology': 'technology',
    'Science': 'science',
    'Mathematics': 'mathematics',
    'Psychology': 'psychology'
  };
  return map[category] || 'critical';
}
