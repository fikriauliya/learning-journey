// Learning Journey App
let learningData = null;
let tooltip = null;

async function init() {
  try {
    const response = await fetch('data/learning.json');
    learningData = await response.json();
    
    renderStats();
    renderHeatmap();
    renderTopics();
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

function renderStats() {
  const totalTopics = learningData.topics.length;
  const startDate = new Date(learningData.started);
  const today = new Date();
  const totalDays = Math.max(1, Math.ceil((today - startDate) / (1000 * 60 * 60 * 24)) + 1);
  
  // Calculate streak
  const activityMap = new Map();
  learningData.activityLog.forEach(a => activityMap.set(a.date, a.count));
  
  let streak = 0;
  let checkDate = new Date();
  while (true) {
    const dateStr = checkDate.toISOString().split('T')[0];
    if (activityMap.has(dateStr)) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }
  
  document.getElementById('total-topics').textContent = totalTopics;
  document.getElementById('total-days').textContent = totalDays;
  document.getElementById('current-streak').textContent = streak;
}

function renderHeatmap() {
  const heatmap = document.getElementById('heatmap');
  const monthsContainer = document.getElementById('heatmap-months');
  
  // Build activity map
  const activityMap = new Map();
  learningData.activityLog.forEach(a => {
    activityMap.set(a.date, { count: a.count, topics: a.topics });
  });
  
  // Generate last 52 weeks (364 days)
  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - 363);
  
  // Adjust to start on Sunday
  const dayOfWeek = startDate.getDay();
  startDate.setDate(startDate.getDate() - dayOfWeek);
  
  // Track months for labels
  const months = [];
  let lastMonth = -1;
  
  // Generate cells
  const cells = [];
  const currentDate = new Date(startDate);
  
  while (currentDate <= today || cells.length % 7 !== 0) {
    const dateStr = currentDate.toISOString().split('T')[0];
    const activity = activityMap.get(dateStr);
    const count = activity ? activity.count : 0;
    const topics = activity ? activity.topics : [];
    
    // Track month changes
    if (currentDate.getMonth() !== lastMonth && cells.length < 365) {
      months.push({ index: Math.floor(cells.length / 7), name: currentDate.toLocaleDateString('en', { month: 'short' }) });
      lastMonth = currentDate.getMonth();
    }
    
    const level = count === 0 ? 0 : count === 1 ? 1 : count === 2 ? 2 : count <= 4 ? 3 : 4;
    const isFuture = currentDate > today;
    
    cells.push({
      date: dateStr,
      count,
      topics,
      level,
      isFuture
    });
    
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  // Render months
  monthsContainer.innerHTML = '';
  let currentWeek = 0;
  months.forEach((m, i) => {
    const span = document.createElement('span');
    span.textContent = m.name;
    span.style.marginLeft = i === 0 ? '0' : `${(m.index - currentWeek - 1) * 14}px`;
    currentWeek = m.index;
    monthsContainer.appendChild(span);
  });
  
  // Render cells
  heatmap.innerHTML = '';
  cells.forEach(cell => {
    const div = document.createElement('div');
    div.className = `heatmap-cell level-${cell.level}`;
    if (cell.isFuture) {
      div.style.opacity = '0.3';
    }
    
    div.addEventListener('mouseenter', (e) => {
      const date = new Date(cell.date).toLocaleDateString('en', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      });
      let content = `<strong>${cell.count} topic${cell.count !== 1 ? 's' : ''}</strong> on ${date}`;
      if (cell.topics.length > 0) {
        content += '<br>' + cell.topics.join(', ');
      }
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

function renderTopics() {
  const grid = document.getElementById('topics-grid');
  
  // Sort by date (newest first)
  const sortedTopics = [...learningData.topics].sort((a, b) => 
    new Date(b.date) - new Date(a.date)
  );
  
  grid.innerHTML = sortedTopics.map(topic => {
    const categoryClass = getCategoryClass(topic.category);
    const date = new Date(topic.date).toLocaleDateString('en', { 
      month: 'short', 
      day: 'numeric' 
    });
    
    return `
      <div class="topic-card">
        <div class="topic-header">
          <h3 class="topic-title">${topic.title}</h3>
          <span class="topic-date">${date}</span>
        </div>
        <span class="topic-category ${categoryClass}">${topic.category}</span>
        <p class="topic-why">${topic.why}</p>
        <div class="topic-concepts">
          ${topic.concepts.slice(0, 5).map(c => 
            `<span class="concept-tag">${c}</span>`
          ).join('')}
          ${topic.concepts.length > 5 ? 
            `<span class="concept-tag">+${topic.concepts.length - 5} more</span>` : ''}
        </div>
      </div>
    `;
  }).join('');
}

function renderNextTopics() {
  const grid = document.getElementById('next-grid');
  
  grid.innerHTML = learningData.suggestedNext.map(topic => {
    const categoryClass = getCategoryClass(topic.category);
    
    return `
      <div class="next-card">
        <span class="topic-category ${categoryClass}">${topic.category}</span>
        <h3 class="topic-title">${topic.title}</h3>
        <p class="topic-description">${topic.description}</p>
      </div>
    `;
  }).join('');
}

function getCategoryClass(category) {
  const map = {
    'Critical Thinking': 'critical',
    'Natural Science': 'natural',
    'Applied Science': 'applied',
    'Psychology': 'psychology'
  };
  return map[category] || 'critical';
}

function renderStartDate() {
  const startDate = new Date(learningData.started);
  document.getElementById('start-date').textContent = startDate.toLocaleDateString('en', {
    month: 'long',
    year: 'numeric'
  });
}

// Initialize
document.addEventListener('DOMContentLoaded', init);
