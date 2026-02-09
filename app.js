// Family Learning Journey App
let learningData = null;
let tooltip = null;
let activeMember = 'levi';

async function init() {
  try {
    const response = await fetch('data/learning.json');
    learningData = await response.json();
    
    renderHeatmap();
    renderMemberTabs();
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

function renderMemberTabs() {
  const tabs = document.getElementById('member-tabs');
  
  let html = '';
  learningData.members.forEach(member => {
    html += `<div class="member-tab ${activeMember === member.id ? 'active' : ''}" data-member="${member.id}">
      <span class="emoji">${member.emoji}</span>${member.name}
    </div>`;
  });
  
  tabs.innerHTML = html;
  
  // Add click handlers
  tabs.querySelectorAll('.member-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      activeMember = tab.dataset.member;
      renderMemberTabs();
      renderTimeline();
      renderNextTopics();
    });
  });
}

function renderHeatmap() {
  const heatmap = document.getElementById('heatmap');
  const monthsContainer = document.getElementById('heatmap-months');
  
  const activityMap = new Map();
  learningData.activityLog.forEach(a => {
    activityMap.set(a.date, { count: a.count, topics: a.topics, members: a.members || [] });
  });
  
  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - 90);
  
  const dayOfWeek = startDate.getDay();
  startDate.setDate(startDate.getDate() - dayOfWeek);
  
  const months = [];
  let lastMonth = -1;
  const cells = [];
  const currentDate = new Date(startDate);
  
  const endDate = new Date(today);
  endDate.setDate(endDate.getDate() + (6 - endDate.getDay())); // pad to end of week
  
  while (currentDate <= endDate) {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth()+1).padStart(2,'0')}-${String(currentDate.getDate()).padStart(2,'0')}`;
    const activity = activityMap.get(dateStr);
    const count = activity ? activity.count : 0;
    const topics = activity ? activity.topics : [];
    const members = activity ? activity.members : [];
    
    if (currentDate.getMonth() !== lastMonth && cells.length < 365) {
      months.push({ index: Math.floor(cells.length / 7), name: currentDate.toLocaleDateString('en', { month: 'short' }) });
      lastMonth = currentDate.getMonth();
    }
    
    const level = count === 0 ? 0 : count === 1 ? 1 : count === 2 ? 2 : count <= 4 ? 3 : 4;
    const isFuture = currentDate > today;
    
    cells.push({ date: dateStr, count, topics, members, level, isFuture });
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  const totalWeeks = Math.ceil(cells.length / 7);
  monthsContainer.style.gridTemplateColumns = `repeat(${totalWeeks}, 1fr)`;
  monthsContainer.style.gap = '3px';
  monthsContainer.innerHTML = '';
  months.forEach((m, i) => {
    const span = document.createElement('span');
    span.textContent = m.name;
    span.style.gridColumnStart = m.index + 1;
    monthsContainer.appendChild(span);
  });
  
  heatmap.innerHTML = '';
  cells.forEach(cell => {
    const div = document.createElement('div');
    div.className = `heatmap-cell level-${cell.level}`;
    if (cell.isFuture) div.style.opacity = '0.3';
    
    const tooltipContent = () => {
      const date = new Date(cell.date).toLocaleDateString('en', { 
        weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
      });
      let content = `<strong>${cell.count} topic${cell.count !== 1 ? 's' : ''}</strong> on ${date}`;
      if (cell.topics.length > 0) content += '<br>' + cell.topics.slice(0, 3).join(', ');
      if (cell.members.length > 0) {
        const memberNames = cell.members.map(m => {
          const member = learningData.members.find(mem => mem.id === m);
          return member ? member.emoji + member.name : m;
        }).join(', ');
        content += '<br><em>' + memberNames + '</em>';
      }
      return content;
    };

    div.addEventListener('mouseenter', (e) => showTooltip(e, tooltipContent()));
    
    div.addEventListener('mousemove', (e) => {
      tooltip.style.left = e.pageX + 10 + 'px';
      tooltip.style.top = e.pageY + 10 + 'px';
    });
    
    div.addEventListener('mouseleave', hideTooltip);

    // Touch support
    div.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      showTooltip({ pageX: touch.pageX, pageY: touch.pageY - 40 }, tooltipContent());
      setTimeout(hideTooltip, 2000);
    }, { passive: false });
    heatmap.appendChild(div);
  });
}

function renderTimeline() {
  const timeline = document.getElementById('timeline');
  
  let topics = [...learningData.topics];
  
  // Filter by active member
  topics = topics.filter(t => t.member === activeMember);
  
  // Sort by date (newest first)
  topics.sort((a, b) => new Date(b.date) - new Date(a.date));
  
  timeline.innerHTML = topics.map(topic => {
    const categoryClass = getCategoryClass(topic.category);
    const date = new Date(topic.date).toLocaleDateString('en', { 
      month: 'short', day: 'numeric' 
    });
    
    return `
      <div class="timeline-item member-${topic.member}">
        <span class="timeline-date">${date}</span>
        <span class="timeline-title">${topic.title}</span>
        <span class="timeline-category ${categoryClass}">${topic.category}</span>
      </div>
    `;
  }).join('');
}

function renderNextTopics() {
  const list = document.getElementById('next-list');
  
  let suggestions = [...learningData.suggestedNext];
  
  // Filter by active member
  suggestions = suggestions.filter(s => s.member === activeMember);
  
  list.innerHTML = suggestions.map(topic => {
    return `
      <div class="next-item member-${topic.member}">
        <span class="next-title">${topic.title}</span>
        <span>— ${topic.description.split('.')[0]}</span>
      </div>
    `;
  }).join('');
}

function getCategoryClass(category) {
  const map = {
    'Critical Thinking': 'critical',
    'Natural Science': 'natural',
    'Applied Science': 'applied',
    'Technology': 'technology',
    'Science': 'science',
    'Mathematics': 'mathematics',
    'Psychology': 'psychology',
    'Sports Science': 'sports'
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
