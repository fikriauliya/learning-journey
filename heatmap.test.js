import { describe, test, expect } from 'bun:test';
import { formatDate, getLevel, buildHeatmapCells, getCategoryClass } from './heatmap.js';

describe('formatDate', () => {
  test('formats date as YYYY-MM-DD using local time', () => {
    const d = new Date(2026, 1, 7); // Feb 7 2026 local
    expect(formatDate(d)).toBe('2026-02-07');
  });

  test('pads single-digit month and day', () => {
    const d = new Date(2026, 0, 5); // Jan 5
    expect(formatDate(d)).toBe('2026-01-05');
  });

  test('does NOT use UTC (avoids timezone shift)', () => {
    // Midnight local time should stay on the same date
    const d = new Date(2026, 1, 8, 0, 0, 0); // Feb 8 midnight local
    expect(formatDate(d)).toBe('2026-02-08');
  });
});

describe('getLevel', () => {
  test('0 topics = level 0', () => expect(getLevel(0)).toBe(0));
  test('1 topic = level 1', () => expect(getLevel(1)).toBe(1));
  test('2 topics = level 2', () => expect(getLevel(2)).toBe(2));
  test('3-4 topics = level 3', () => {
    expect(getLevel(3)).toBe(3);
    expect(getLevel(4)).toBe(3);
  });
  test('5+ topics = level 4', () => {
    expect(getLevel(5)).toBe(4);
    expect(getLevel(10)).toBe(4);
  });
});

describe('buildHeatmapCells', () => {
  const activityLog = [
    { date: '2026-02-07', count: 5, topics: ['A', 'B', 'C', 'D', 'E'], members: ['levi'] },
    { date: '2026-02-08', count: 4, topics: ['X', 'Y', 'Z', 'W'], members: ['levi', 'yusuf'] },
  ];
  const today = new Date(2026, 1, 9); // Feb 9 2026

  test('cells span roughly daysBack + padding to complete weeks', () => {
    const { cells } = buildHeatmapCells(activityLog, today, 90);
    expect(cells.length % 7).toBe(0); // always complete weeks
    expect(cells.length).toBeGreaterThanOrEqual(90);
    expect(cells.length).toBeLessThanOrEqual(105); // max ~15 weeks
  });

  test('activity dates have correct counts', () => {
    const { cells } = buildHeatmapCells(activityLog, today, 90);
    const feb7 = cells.find(c => c.date === '2026-02-07');
    const feb8 = cells.find(c => c.date === '2026-02-08');
    expect(feb7).toBeDefined();
    expect(feb7.count).toBe(5);
    expect(feb7.level).toBe(4);
    expect(feb8).toBeDefined();
    expect(feb8.count).toBe(4);
    expect(feb8.level).toBe(3);
  });

  test('non-activity dates have count 0', () => {
    const { cells } = buildHeatmapCells(activityLog, today, 90);
    const jan1 = cells.find(c => c.date === '2026-01-01');
    expect(jan1).toBeDefined();
    expect(jan1.count).toBe(0);
    expect(jan1.level).toBe(0);
  });

  test('future dates are marked', () => {
    const { cells } = buildHeatmapCells(activityLog, today, 90);
    const futureCells = cells.filter(c => c.isFuture);
    const pastCells = cells.filter(c => !c.isFuture);
    expect(futureCells.length).toBeGreaterThan(0);
    expect(pastCells.length).toBeGreaterThan(0);
  });

  test('month labels are in chronological order', () => {
    const { months } = buildHeatmapCells(activityLog, today, 90);
    expect(months.length).toBeGreaterThanOrEqual(3);
    // Each month should have a higher index than the previous
    for (let i = 1; i < months.length; i++) {
      expect(months[i].index).toBeGreaterThan(months[i - 1].index);
    }
  });

  test('month label positions align with cells (Feb label column contains Feb dates)', () => {
    const { cells, months } = buildHeatmapCells(activityLog, today, 90);
    const febMonth = months.find(m => m.name === 'Feb');
    expect(febMonth).toBeDefined();

    // The cell at the start of Feb's column should be a Feb date
    const colStartIndex = febMonth.index * 7; // first cell in that column
    const cellAtFebCol = cells[colStartIndex];
    expect(cellAtFebCol.date.startsWith('2026-02')).toBe(true);
  });

  test('activity cells appear in the correct grid column for their month', () => {
    const { cells, months } = buildHeatmapCells(activityLog, today, 90);
    const feb7 = cells.findIndex(c => c.date === '2026-02-07');
    const feb7Col = Math.floor(feb7 / 7);

    const febMonth = months.find(m => m.name === 'Feb');
    // Feb 7 column should be >= Feb month label column
    expect(feb7Col).toBeGreaterThanOrEqual(febMonth.index);
  });
});

describe('getCategoryClass', () => {
  test('maps known categories', () => {
    expect(getCategoryClass('Critical Thinking')).toBe('critical');
    expect(getCategoryClass('Natural Science')).toBe('natural');
    expect(getCategoryClass('Technology')).toBe('technology');
  });

  test('unknown category defaults to critical', () => {
    expect(getCategoryClass('Unknown')).toBe('critical');
  });
});
