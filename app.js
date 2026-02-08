// Learning Journey App
let learningData = null;
let tooltip = null;

async function init() {
  try {
    const response = await fetch('data/learning.json');
    learningData = await response.json();
    
    renderHeatmap();
    renderTimeline();
    renderNextTopics();
    renderStartDate();
    
    createTooltip();
  } catch (error) {
    console.error('Failed to load learning data:', error);
  }
}

function createTooltip() {
  tooltip = document.createElement('div');
  tooltip.className = 'tooltip';
  tooltip.style.display = 'none';
  document.body.appendChild(tooltip);
}

function showTooltip(e, content) {
  tooltip.innerHTML = content;
  tooltip.style.display = 'block';
  tooltip.style.left = e.pageX + 10 + 'px';
  tooltip.style.top = e.pageY + 10 + 'px';
}

function hideTooltip() {
  tooltip.style.display = 'none';
}

function renderHeatmap() {
  const heatmap = document.getElementById('heatmap');
  const monthsContainer = document.getElementById('heatmap-months');
  
  const activityMap = new Map();
  learningData.activityLog.forEach(a => {
    activityMap.set(a.date, { count: a.count, topics: a.topics });
  });
  
  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - 363);
  
  const dayOfWeek = startDate.getDay();
  startDate.setDate(startDate.getDate() - dayOfWeek);
  
  const months = [];
  let lastMonth = -1;
  const cells = [];
  const currentDate = new Date(startDate);
  
  while (currentDate <= today || cells.length % 7 !== 0) {
    const dateStr = currentDate.toISOString().split('T')[0];
    const activity = activityMap.get(dateStr);
    const count = activity ? activity.count : 0;
    const topics = activity ? activity.topics : [];
    
    if (currentDate.getMonth() !== lastMonth && cells.length < 365) {
      months.push({ index: Math.floor(cells.length / 7), name: currentDate.toLocaleDateString('en', { month: 'short' }) });
      lastMonth = currentDate.getMonth();
    }
    
    const level = count === 0 ? 0 : count === 1 ? 1 : count === 2 ? 2 : count <= 4 ? 3 : 4;
    const isFuture = currentDate > today;
    
    cells.push({ date: dateStr, count, topics, level, isFuture });
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  monthsContainer.innerHTML = '';
  let currentWeek = 0;
  months.forEach((m, i) => {
    const span = document.createElement('span');
    span.textContent = m.name;
    span.style.marginLeft = i === 0 ? '0' : `${(m.index - currentWeek - 1) * 9}px`;
    currentWeek = m.index;
    monthsContainer.appendChild(span);
  });
  
  heatmap.innerHTML = '';
  cells.forEach(cell => {
    const div = document.createElement('div');
    div.className = `heatmap-cell level-${cell.level}`;
    if (cell.isFuture) div.style.opacity = '0.3';
    
    div.addEventListener('mouseenter', (e) => {
      const date = new Date(cell.date).toLocaleDateString('en', { 
        weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
      });
      let content = `<strong>${cell.count} topic${cell.count !== 1 ? 's' : ''}</strong> on ${date}`;
      if (cell.topics.length > 0) content += '<br>' + cell.topics.slice(0, 3).join(', ');
      showTooltip(e, content);
    });
    
    div.addEventListener('mousemove', (e) => {
      tooltip.style.left = e.pageX + 10 + 'px';
      tooltip.style.top = e.pageY + 10 + 'px';
    });
    
    div.addEventListener('mouseleave', hideTooltip);
    heatmap.appendChild(div);
  });
}

function renderTimeline() {
  const timeline = document.getElementById('timeline');
  
  const sortedTopics = [...learningData.topics].sort((a, b) => 
    new Date(b.date) - new Date(a.date)
  );
  
  timeline.innerHTML = sortedTopics.map(topic => {
    const categoryClass = getCategoryClass(topic.category);
    const date = new Date(topic.date).toLocaleDateString('en', { 
      month: 'short', day: 'numeric' 
    });
    
    return `
      <div class="timeline-item">
        <span class="timeline-date">${date}</span>
        <span class="timeline-title">${topic.title}</span>
        <span class="timeline-category ${categoryClass}">${topic.category}</span>
      </div>
    `;
  }).join('');
}

function renderNextTopics() {
  const list = document.getElementById('next-list');
  
  list.innerHTML = learningData.suggestedNext.map(topic => `
    <div class="next-item">
      <span class="next-title">${topic.title}</span>
      <span>— ${topic.description.split('.')[0]}</span>
    </div>
  `).join('');
}

function getCategoryClass(category) {
  const map = {
    'Critical Thinking': 'critical',
    'Natural Science': 'natural',
    'Applied Science': 'applied'
  };
  return map[category] || 'critical';
}

function renderStartDate() {
  const startDate = new Date(learningData.started);
  document.getElementById('start-date').textContent = startDate.toLocaleDateString('en', {
    month: 'long', year: 'numeric'
  });
}

document.addEventListener('DOMContentLoaded', init);
