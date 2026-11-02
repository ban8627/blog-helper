(function () {
  'use strict';
  var T = window.TextCounter;
  var $ = function (id) { return document.getElementById(id); };

  var text = $('text');
  var goalInput = $('goal');
  var goalError = $('goal-error');
  var progressBox = $('progress-box');
  var bar = document.querySelector('.bar');
  var barFill = $('bar-fill');
  var progressText = $('progress-text');
  var copyBtn = $('copy');
  var copyStatus = $('copy-status');
  var manual = $('manual');
  var manualText = $('manual-text');

  var fmt = function (n) { return n.toLocaleString('ko-KR'); };
  var last = T.count('');
  var scheduled = false;

  function basis() {
    var checked = document.querySelector('input[name="basis"]:checked');
    return checked ? checked.value : 'without';
  }

  function render() {
    scheduled = false;
    last = T.count(text.value);
    $('with').textContent = fmt(last.withSpaces);
    $('without').textContent = fmt(last.withoutSpaces);
    $('words').textContent = fmt(last.words);
    $('lines').textContent = fmt(last.lines);
    renderGoal();
    // 숫자가 바뀌면 이전 복사 안내는 지운다
    copyStatus.textContent = '';
    manual.hidden = true;
  }

  function renderGoal() {
    var g = T.parseGoal(goalInput.value);
    document.querySelectorAll('.presets button').forEach(function (b) {
      b.setAttribute('aria-pressed', String(g.ok && Number(b.dataset.goal) === g.value));
    });
    if (!g.ok) {
      goalError.textContent = g.reason;
      goalError.hidden = false;
      goalInput.setAttribute('aria-invalid', 'true');
      progressBox.hidden = true; // 잘못된 목표로 이전 진행률을 보여 주지 않음
      return;
    }
    goalError.hidden = true;
    goalInput.removeAttribute('aria-invalid');
    progressBox.hidden = false;

    var current = basis() === 'with' ? last.withSpaces : last.withoutSpaces;
    var label = basis() === 'with' ? '공백 포함' : '공백 제외';
    var p = T.progress(current, g.value);
    barFill.style.width = p.percent + '%';
    bar.setAttribute('aria-valuenow', String(p.percent));
    progressBox.classList.toggle('done', p.achieved);
    if (!p.achieved) {
      progressText.textContent = label + ' ' + fmt(g.value) + '자까지 ' + fmt(p.remaining) + '자 남았습니다. (' + p.percent + '%)';
    } else if (p.over === 0) {
      progressText.textContent = '목표 달성! ' + label + ' ' + fmt(g.value) + '자를 딱 맞췄습니다.';
    } else {
      progressText.textContent = '목표 달성! ' + label + ' ' + fmt(g.value) + '자보다 ' + fmt(p.over) + '자 더 썼습니다.';
    }
  }

  function schedule() {
    if (scheduled) return;
    scheduled = true;
    window.requestAnimationFrame(render);
  }

  text.addEventListener('input', schedule);
  goalInput.addEventListener('input', function () { renderGoal(); });
  document.querySelectorAll('input[name="basis"]').forEach(function (r) {
    r.addEventListener('change', renderGoal);
  });
  document.querySelectorAll('.presets button').forEach(function (b) {
    b.addEventListener('click', function () {
      goalInput.value = Number(b.dataset.goal).toLocaleString('ko-KR');
      renderGoal();
    });
  });

  $('clear').addEventListener('click', function () {
    text.value = '';
    render();
    text.focus();
  });

  function showManual(summary) {
    manualText.value = summary;
    manual.hidden = false;
    manualText.focus();
    manualText.select();
  }

  copyBtn.addEventListener('click', function () {
    var summary = T.summary(T.count(text.value));
    manual.hidden = true;
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(summary).then(function () {
        copyStatus.textContent = '복사했습니다: ' + summary;
      }, function () { showManual(summary); });
    } else {
      showManual(summary);
    }
  });

  render();
})();
