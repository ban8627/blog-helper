/* 글자 수 계산 (화면 코드와 분리). 브라우저에서는 window.TextCounter, Node에서는 module.exports */
(function (root) {
  'use strict';

  // 폭 없는 문자: 어느 쪽에도 세지 않음
  var ZERO_WIDTH = /[\u200B\u200C\u200D\u2060\uFEFF]/g;
  // 줄바꿈: \r\n, \r, \n, 줄·문단 구분자
  var LINE_BREAK = /\r\n|[\r\n\u2028\u2029]/g;
  // 공백 제외에서 뺄 문자: 일반 공백류 + NBSP 등 (\s는 NBSP·전각 공백을 포함)
  var WHITESPACE = /\s/;

  var segmenter = null;
  try {
    if (typeof Intl !== 'undefined' && typeof Intl.Segmenter === 'function') {
      segmenter = new Intl.Segmenter('ko', { granularity: 'grapheme' });
    }
  } catch (e) {
    segmenter = null;
  }

  function graphemes(text) {
    if (segmenter) {
      var out = [];
      var it = segmenter.segment(text)[Symbol.iterator]();
      for (var s = it.next(); !s.done; s = it.next()) out.push(s.value.segment);
      return out;
    }
    return Array.from(text);
  }

  // ZWJ(U+200D)는 조합 이모지를 잇는 문자라 글자 나누기 전에는 지우지 않는다.
  function count(input) {
    var text = String(input == null ? '' : input);
    var withSpaces = 0;
    var withoutSpaces = 0;

    var units = graphemes(text);
    for (var i = 0; i < units.length; i++) {
      var g = units[i];
      if (/^(\r\n|[\r\n\u2028\u2029])$/.test(g)) continue; // 줄바꿈
      var visible = g.replace(ZERO_WIDTH, '');
      if (visible === '') continue; // 폭 없는 문자만으로 된 덩어리
      withSpaces += 1;
      if (!WHITESPACE.test(visible)) withoutSpaces += 1;
    }

    var cleaned = text.replace(ZERO_WIDTH, '');
    var words = cleaned.split(/\s+/).filter(function (w) { return w !== ''; }).length;
    var lines = cleaned.split(LINE_BREAK).filter(function (l) { return l.trim() !== ''; }).length;

    return { withSpaces: withSpaces, withoutSpaces: withoutSpaces, words: words, lines: lines };
  }

  var GOAL_MIN = 1;
  var GOAL_MAX = 100000;

  // 목표 글자 수 검사: 1 이상 100,000 이하 정수(쉼표 허용)
  function parseGoal(raw) {
    var s = String(raw == null ? '' : raw).trim().replace(/,/g, '');
    if (s === '') return { ok: false, reason: '목표 글자 수를 입력해 주세요.' };
    if (!/^[0-9]+$/.test(s)) {
      if (/^-/.test(s)) return { ok: false, reason: '목표는 1 이상이어야 합니다.' };
      if (/^[0-9]*\.[0-9]+$/.test(s)) return { ok: false, reason: '목표는 소수점 없이 정수로 입력해 주세요.' };
      return { ok: false, reason: '목표는 숫자로만 입력해 주세요.' };
    }
    var n = Number(s);
    if (n < GOAL_MIN) return { ok: false, reason: '목표는 1 이상이어야 합니다.' };
    if (n > GOAL_MAX) return { ok: false, reason: '목표는 100,000자 이하로 입력해 주세요.' };
    return { ok: true, value: n };
  }

  function progress(current, goal) {
    var remaining = goal - current;
    return {
      percent: Math.min(100, Math.floor((current / goal) * 100)),
      remaining: remaining > 0 ? remaining : 0,
      over: remaining < 0 ? -remaining : 0,
      achieved: current >= goal
    };
  }

  function summary(c) {
    var f = function (n) { return n.toLocaleString('ko-KR'); };
    return '공백 포함 ' + f(c.withSpaces) + '자 · 공백 제외 ' + f(c.withoutSpaces) + '자';
  }

  var api = { count: count, parseGoal: parseGoal, progress: progress, summary: summary,
    GOAL_MIN: GOAL_MIN, GOAL_MAX: GOAL_MAX, usesSegmenter: !!segmenter };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.TextCounter = api;
})(this);
