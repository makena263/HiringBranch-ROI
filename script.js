var openSecs = { volume: true, cost: true, attrition: true, manager: false, funnel: false, revenue: false };

function toggleSec(id) {
  openSecs[id] = !openSecs[id];
  var f = document.getElementById('fields-' + id);
  var a = document.getElementById('arrow-' + id);
  f.style.display = openSecs[id] ? 'grid' : 'none';
  if (openSecs[id]) a.classList.add('open'); else a.classList.remove('open');
  calc();
}

function v(id) { var el = document.getElementById(id); return el ? parseFloat(el.value) || 0 : 0; }
function fmt(n) { return '$' + Math.round(n).toLocaleString(); }
function fmtN(n) { return Math.round(n).toLocaleString(); }

function calc() {
  var hires = v('hires') || 500;
  var intfPerHire = v('intf_per_hire') || 6;
  var intfMins = v('intf_mins') || 30;
  var recRate = v('rec_rate') || 45;
  var salary = v('salary') || 42000;
  var costPerHire = v('cost_per_hire') || 4500;
  var attrition = v('attrition') / 100;
  var absenteeism = v('absenteeism') / 100;
  var trainFail = v('train_fail') / 100;

  var totalIntf = hires * intfPerHire;
  var intfSaved = Math.round(totalIntf * 0.8);
  var hrsSaved = Math.round(intfSaved * intfMins / 60);
  var recCostSaved = Math.round(hrsSaved * recRate);

  var mgrActive = openSecs.manager;
  var interviewers = mgrActive ? v('interviewers') : 2;
  var mgrRate = mgrActive ? v('mgr_rate') : 75;
  var mgrHrsSaved = mgrActive ? Math.round(intfSaved * intfMins / 60 * (interviewers - 1)) : 0;
  var mgrCostSaved = mgrActive ? Math.round(mgrHrsSaved * mgrRate) : 0;
  var totalIntfCost = recCostSaved + mgrCostSaved;

  var turnoverN = Math.round(hires * attrition * 0.65);
  var turnoverSaved = Math.round(turnoverN * salary * 0.5);

  var absDays = Math.round(hires * absenteeism * 250 * 0.4);
  var absSaved = Math.round(absDays * (salary / 250));

  var trainSaved = Math.round(hires * trainFail * 0.6 * costPerHire * 0.4);

  var funnelSaved = 0, funnelActive = openSecs.funnel;
  if (funnelActive) {
    var stages = v('stages') || 4;
    var dropout = v('dropout') / 100;
    var resrcCost = v('resrc_cost') || 150;
    var dropPerStage = Math.round(hires * (1 / (1 - dropout) - 1));
    funnelSaved = Math.round(dropPerStage * stages * resrcCost * 0.5);
  }

  var revSaved = 0, rampSaved = 0, revActive = openSecs.revenue;
  if (revActive) {
    var revPerAgent = v('rev_per_agent');
    var rampWeeks = v('ramp_weeks') || 8;
    var dailyRev = v('daily_rev');
    if (revPerAgent > 0) revSaved = Math.round(hires * revPerAgent * 0.10);
    if (dailyRev > 0) rampSaved = Math.round(hires * rampWeeks * 5 * dailyRev * 0.3);
  }

  var total = totalIntfCost + turnoverSaved + absSaved + trainSaved + funnelSaved + revSaved + rampSaved;
  var totalHiringCost = hires * costPerHire;
  var mult = totalHiringCost > 0 ? (total / totalHiringCost).toFixed(1) + 'x' : '—';

  document.getElementById('r-intf').textContent = fmtN(intfSaved);
  document.getElementById('r-rec').textContent = fmtN(hrsSaved) + ' hrs';
  document.getElementById('r-intf-cost').textContent = fmt(totalIntfCost);
  document.getElementById('r-turnover').textContent = fmt(turnoverSaved);
  document.getElementById('r-absent').textContent = fmt(absSaved);
  document.getElementById('r-train').textContent = fmt(trainSaved);

  var mgrEl = document.getElementById('r-mgr');
  var mgrCard = document.getElementById('kpi-mgr');
  if (mgrActive) { mgrEl.textContent = fmt(mgrCostSaved); mgrCard.classList.remove('dim'); }
  else { mgrEl.textContent = 'Add optional'; mgrCard.classList.add('dim'); }

  var funnelEl = document.getElementById('r-funnel');
  var funnelCard = document.getElementById('kpi-funnel');
  if (funnelActive) { funnelEl.textContent = fmt(funnelSaved); funnelCard.classList.remove('dim'); }
  else { funnelEl.textContent = 'Add optional'; funnelCard.classList.add('dim'); }

  var revEl = document.getElementById('r-rev');
  var revCard = document.getElementById('kpi-rev');
  var rampEl = document.getElementById('r-ramp');
  var rampCard = document.getElementById('kpi-ramp');
  if (revActive) {
    revEl.textContent = revSaved > 0 ? fmt(revSaved) : 'Enter revenue above';
    revCard.classList.toggle('dim', revSaved === 0);
    rampEl.textContent = rampSaved > 0 ? fmt(rampSaved) : 'Enter daily revenue above';
    rampCard.classList.toggle('dim', rampSaved === 0);
  } else {
    revEl.textContent = 'Add optional'; revCard.classList.add('dim');
    rampEl.textContent = 'Add optional'; rampCard.classList.add('dim');
  }

  document.getElementById('r-total').textContent = fmt(total);
  document.getElementById('r-mult').textContent = mult;

  var activeOpt = [mgrActive, funnelActive, revActive].filter(Boolean).length;
  var pct = Math.round(60 + (activeOpt / 3) * 40);
  document.getElementById('cov-bar').style.width = pct + '%';
  var msgs = [
    'Using core levers only — add optional sections to refine',
    'Good coverage — one more section for maximum confidence',
    'Strong estimate — all optional sections active',
    'Full coverage — maximum confidence in this estimate'
  ];
  document.getElementById('cov-text').textContent = msgs[activeOpt];
}

['hires','applicants','intf_per_hire','intf_mins','rec_rate','salary','cost_per_hire',
 'interviewers','mgr_rate','stages','resrc_cost','rev_per_agent','ramp_weeks','daily_rev']
.forEach(function(id) { var el = document.getElementById(id); if (el) el.addEventListener('input', calc); });

['attrition','absenteeism','train_fail','dropout'].forEach(function(id) {
  var el = document.getElementById(id);
  if (!el) return;
  el.addEventListener('input', function() {
    var out = document.getElementById(id + '_v');
    if (out) out.textContent = this.value + '%';
    calc();
  });
});

calc();
