/* ========================================
   TalkFlow - 主脚本文件 v2
   完整业务逻辑：数据加载、盲盒抽取、筛选、话术引导、救急模式、话题实验室
   ======================================== */

(function () {
  'use strict';

  // ---------- DOM 引用 ----------
  var $ = function (sel) { return document.querySelector(sel); };
  var $$ = function (sel) { return document.querySelectorAll(sel); };

  var drawBtn = $('#drawBtn');
  var resultArea = $('#resultArea');
  var resultTitle = $('#resultTitle');
  var resultScene = $('#resultScene');
  var resultMood = $('#resultMood');
  var resultRelationship = $('#resultRelationship');
  var guideBtn = $('#guideBtn');
  var switchBtn = $('#switchBtn');
  var copyBtn = $('#copyBtn');
  var guideSection = $('#guideSection');
  var guideCards = $('#guideCards');
  var topicCountEl = $('#topic-count');

  var filterBtns = $$('.filter-btn');
  var filterReset = $('.filter-reset');

  var panicBtn = $('#panicBtn');
  var panicPanel = $('#panicPanel');
  var panicClose = $('#panicClose');
  var panicTopic = $('#panicTopic');
  var panicOpening = $('#panicOpening');
  var panicNewBtn = $('#panicNewBtn');

  var labSection = $('#labSection');
  var labTopicInput = $('#labTopicInput');
  var labOpeningInput = $('#labOpeningInput');
  var labSceneSelect = $('#labSceneSelect');
  var labRelationshipSelect = $('#labRelationshipSelect');
  var labMoodSelect = $('#labMoodSelect');
  var labSubmitBtn = $('#labSubmitBtn');
  var labMsg = $('#labMsg');
  var rankRedList = $('#rankRedList');
  var rankBlackList = $('#rankBlackList');

  var navBlindbox = $('.nav-blindbox');
  var navLab = $('.nav-lab');

  // ---------- 状态 ----------
  var topics = [];
  var selectedScene = '';
  var selectedRelationship = '';
  var selectedMood = '';
  var currentTopic = null;
  var rankRed = [];
  var rankBlack = [];

  // ---------- 工具函数 ----------
  function escapeHtml(str) {
    if (typeof str !== 'string') return '';
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function show(el) { if (el) el.classList.remove('hidden'); }
  function hide(el) { if (el) el.classList.add('hidden'); }

  function pickRandom(arr) {
    if (!arr || arr.length === 0) return null;
    return arr[Math.floor(Math.random() * arr.length)];
  }

  // ---------- 数据加载 ----------
  function loadData() {
    try {
      var xhr = new XMLHttpRequest();
      xhr.open('GET', 'data/topics.json', true);
      xhr.onload = function () {
        if (xhr.status === 200) {
          var data = JSON.parse(xhr.responseText);
          topics = data.topics || [];
          updateTopicCount();
        }
      };
      xhr.send();
    } catch (e) {
      console.error('TalkFlow: 数据加载失败', e);
    }
  }

  // ---------- 话题筛选 ----------
  function getFilteredTopics() {
    return topics.filter(function (t) {
      if (selectedScene && t.scene !== selectedScene) return false;
      if (selectedRelationship && t.relationship !== selectedRelationship) return false;
      if (selectedMood && t.mood !== selectedMood) return false;
      return true;
    });
  }

  function updateTopicCount() {
    var count = getFilteredTopics().length;
    topicCountEl.textContent = count;
  }

  // ---------- 筛选按钮交互 ----------
  function initFilters() {
    Array.prototype.forEach.call(filterBtns, function (btn) {
      btn.addEventListener('click', function () {
        var group = btn.parentElement.parentElement;
        var siblings = btn.parentElement.querySelectorAll('.filter-btn');
        var anyBtn = btn.parentElement.querySelector('.filter-btn-any');

        // 不限按钮逻辑：清除该维度所有筛选
        if (btn.classList.contains('filter-btn-any')) {
          Array.prototype.forEach.call(siblings, function (s) { s.classList.remove('active'); });
          btn.classList.add('active');
          if (group.classList.contains('filter-scene')) selectedScene = '';
          else if (group.classList.contains('filter-relationship')) selectedRelationship = '';
          else if (group.classList.contains('filter-mood')) selectedMood = '';
          updateTopicCount();
          return;
        }

        // 普通按钮：清除该行所有选中，激活当前按钮
        Array.prototype.forEach.call(siblings, function (s) { s.classList.remove('active'); });
        btn.classList.add('active');
        // 同步把不限按钮取消选中（如果存在）
        if (anyBtn) anyBtn.classList.remove('active');

        // 更新筛选值
        if (group.classList.contains('filter-scene')) {
          selectedScene = btn.getAttribute('data-value');
        } else if (group.classList.contains('filter-relationship')) {
          selectedRelationship = btn.getAttribute('data-value');
        } else if (group.classList.contains('filter-mood')) {
          selectedMood = btn.getAttribute('data-value');
        }

        updateTopicCount();
      });
    });

    filterReset.addEventListener('click', function () {
      Array.prototype.forEach.call(filterBtns, function (btn) { btn.classList.remove('active'); });
      selectedScene = '';
      selectedRelationship = '';
      selectedMood = '';
      updateTopicCount();
    });
  }

  // ---------- 盲盒抽取 ----------
  function drawTopic() {
    var pool = getFilteredTopics();
    // 精确匹配 - 三个维度都匹配
    if (pool.length > 0) {
      return pickRandom(pool);
    }
    // 放宽到两个维度
    var pool2 = topics.filter(function (t) {
      var match = 0;
      if (selectedScene && t.scene === selectedScene) match++;
      if (selectedRelationship && t.relationship === selectedRelationship) match++;
      if (selectedMood && t.mood === selectedMood) match++;
      return match >= 2;
    });
    if (pool2.length > 0) {
      return pickRandom(pool2);
    }
    // 放宽到一个维度
    var pool1 = topics.filter(function (t) {
      if (selectedScene && t.scene === selectedScene) return true;
      if (selectedRelationship && t.relationship === selectedRelationship) return true;
      if (selectedMood && t.mood === selectedMood) return true;
      return false;
    });
    if (pool1.length > 0) {
      return pickRandom(pool1);
    }
    // 完全随机
    return pickRandom(topics);
  }

  function showResult(topic) {
    if (!topic) return;
    currentTopic = topic;
    resultTitle.textContent = topic.topic;
    resultScene.textContent = topic.scene;
    resultMood.textContent = topic.mood;
    resultRelationship.textContent = topic.relationship;
    show(resultArea);
    hide(guideSection);
  }

  drawBtn.addEventListener('click', function () {
    drawBtn.classList.add('loading');
    setTimeout(function () {
      var topic = drawTopic();
      if (topic) {
        showResult(topic);
      }
      drawBtn.classList.remove('loading');
    }, 500);
  });

  // ---------- 换一个 ----------
  switchBtn.addEventListener('click', function () {
    var topic = drawTopic();
    if (topic) {
      showResult(topic);
    }
  });

  // ---------- 话术引导 ----------
  guideBtn.addEventListener('click', function () {
    if (!currentTopic) return;
    renderGuide(currentTopic);
    show(guideSection);
    guideSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  function renderGuide(topic) {
    var html = '';

    // 开场白
    html += '<div class=\"guide-card guide-card-opening\">';
    html += '<div class=\"guide-card-header\">🎤 开场白</div>';
    html += '<div class=\"guide-card-body\">' + escapeHtml(topic.opening) + '</div>';
    html += '</div>';

    // 心理学逻辑
    html += '<div class=\"guide-card guide-card-psychology\">';
    html += '<div class=\"guide-card-header\">🧠 为什么要聊这个</div>';
    html += '<div class=\"guide-card-body\">' + escapeHtml(topic.psychology) + '</div>';
    html += '</div>';

    // 后续延伸
    if (topic.followUp && topic.followUp.length > 0) {
      html += '<div class=\"guide-card guide-card-followup\">';
      html += '<div class=\"guide-card-header\">🔗 可能的后续延伸</div>';
      html += '<div class=\"guide-card-body\">';
      topic.followUp.forEach(function (item) {
        html += '<div class=\"followup-item\">';
        html += '<span class=\"followup-when\">▸ ' + escapeHtml(item.when) + '</span><br>';
        html += escapeHtml(item.response);
        html += '</div>';
      });
      html += '</div></div>';
    }

    guideCards.innerHTML = html;
  }

  // ---------- 复制文案 ----------
  copyBtn.addEventListener('click', function () {
    if (!currentTopic) return;
    var text = currentTopic.topic;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        copyBtn.textContent = '✅ 已复制';
        copyBtn.classList.add('copied');
        setTimeout(function () {
          copyBtn.textContent = '📋 复制文案';
          copyBtn.classList.remove('copied');
        }, 2000);
      }).catch(function () {
        fallbackCopy(text);
      });
    } else {
      fallbackCopy(text);
    }
  });

  function fallbackCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    copyBtn.textContent = '✅ 已复制';
    copyBtn.classList.add('copied');
    setTimeout(function () {
      copyBtn.textContent = '📋 复制文案';
      copyBtn.classList.remove('copied');
    }, 2000);
  }

  // ---------- 救急模式 ----------
  panicBtn.addEventListener('click', function () {
    var pool = getFilteredTopics();
    var t = pool.length > 0 ? pickRandom(pool) : pickRandom(topics);
    if (!t) return;
    panicTopic.textContent = t.topic;
    panicOpening.textContent = '💡 ' + t.opening;
    show(panicPanel);
  });

  panicClose.addEventListener('click', function () { hide(panicPanel); });
  panicNewBtn.addEventListener('click', function () {
    var pool = getFilteredTopics();
    var t = pool.length > 0 ? pickRandom(pool) : pickRandom(topics);
    if (!t) return;
    panicTopic.textContent = t.topic;
    panicOpening.textContent = '💡 ' + t.opening;
  });

  // ---------- 话题实验室 ----------
  labSubmitBtn.addEventListener('click', function () {
    var topic = labTopicInput.value.trim();
    var opening = labOpeningInput.value.trim();
    var scene = labSceneSelect.value;
    var rel = labRelationshipSelect.value;
    var mood = labMoodSelect.value;

    if (!topic || !scene || !rel || !mood) {
      labMsg.textContent = '⚠️ 请至少填写话题内容，并选择场景、关系和情绪。';
      labMsg.className = 'lab-msg';
      show(labMsg);
      return;
    }

    labMsg.textContent = '✅ 感谢贡献！话题已提交审核。';
    labMsg.className = 'lab-msg';
    show(labMsg);

    // 自动加入红榜
    rankRed.push({ topic: topic, opening: opening });
    renderRankLists();

    labTopicInput.value = '';
    labOpeningInput.value = '';
    labSceneSelect.value = '';
    labRelationshipSelect.value = '';
    labMoodSelect.value = '';

    setTimeout(function () { hide(labMsg); }, 3000);
  });

  function renderRankLists() {
    rankRedList.innerHTML = rankRed.map(function (r) {
      return '<div class=\"rank-item\">' + escapeHtml(r.topic) + '</div>';
    }).join('');
    rankBlackList.innerHTML = rankBlack.map(function (r) {
      return '<div class=\"rank-item\">' + escapeHtml(r.topic) + '</div>';
    }).join('');
  }

  // ---------- 页面导航 ----------
  navBlindbox.addEventListener('click', function (e) {
    e.preventDefault();
    hide(labSection);
    show($(".filter-section"));
    show($(".draw-section"));
    if (currentTopic) show(resultArea);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  navLab.addEventListener('click', function (e) {
    e.preventDefault();
    hide($(".filter-section"));
    hide($(".draw-section"));
    hide(resultArea);
    hide(guideSection);
    show(labSection);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // ---------- 页面点击关闭救急面板 ----------
  document.addEventListener('click', function (e) {
    if (!panicPanel.classList.contains('hidden')) {
      if (!panicPanel.contains(e.target) && e.target !== panicBtn) {
        hide(panicPanel);
      }
    }
  });

  // ---------- 初始化 ----------
  loadData();
  initFilters();
})();
