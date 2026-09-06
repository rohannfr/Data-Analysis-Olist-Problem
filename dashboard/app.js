(function(){
  const D = OLIST_DATA;

  const INK = '#1C2430';
  const INK_SOFT = '#5B6472';
  const GOLD = '#B8842E';
  const GOLD_SOFT = '#E7D3A6';
  const RED = '#B3402F';
  const TEAL = '#2E6B5E';
  const LINE = '#DAD4C3';

  Chart.defaults.font.family = "'IBM Plex Mono', monospace";
  Chart.defaults.font.size = 11;
  Chart.defaults.color = INK_SOFT;
  Chart.defaults.borderColor = LINE;

  const fmtBRL = n => 'R$ ' + Number(n).toLocaleString('en-US', {maximumFractionDigits:0});
  const fmtBRLShort = n => {
    const v = Number(n);
    if (v >= 1000000) return 'R$ ' + (v/1000000).toFixed(1) + 'M';
    if (v >= 1000) return 'R$ ' + (v/1000).toFixed(0) + 'k';
    return 'R$ ' + v.toFixed(0);
  };
  const fmtNum = n => Number(n).toLocaleString('en-US');
  const fmtPct = n => n + '%';

  /* ---------------- KPI ledger ---------------- */
  const kpis = D.kpis;
  document.getElementById('mh-orders').textContent = fmtNum(kpis.delivered_orders) + ' DELIVERED ORDERS';
  const ledgerItems = [
    [fmtBRLShort(kpis.total_gmv), 'Total GMV analyzed'],
    [kpis.avg_review_score.toFixed(2) + ' / 5', 'Average review score'],
    [kpis.pct_late + '%', 'Orders delivered late'],
    [kpis.pct_1_2_star + '%', 'Share of 1–2 star reviews'],
    [fmtNum(kpis.unique_customers), 'Unique customers'],
  ];
  const ledgerEl = document.getElementById('kpi-ledger');
  ledgerItems.forEach(([num,label])=>{
    const div = document.createElement('div');
    div.className = 'cell';
    div.innerHTML = `<span class="num">${num}</span><span class="label">${label}</span>`;
    ledgerEl.appendChild(div);
  });

  /* ---------------- Hero cliff figure ---------------- */
  const q2b = D.q2_delay_buckets.filter(b=>b.avg_review!=null);
  const earlyPeak = Math.max(...q2b.filter(b=>b.delay_bucket.includes('early')).map(b=>b.avg_review));
  const latePeak = Math.min(...q2b.filter(b=>b.delay_bucket.includes('late')).map(b=>b.avg_review));
  document.getElementById('hero-early').textContent = earlyPeak.toFixed(1);
  document.getElementById('hero-late').textContent = latePeak.toFixed(1);
  document.getElementById('hero-tag').textContent =
    `late orders get a 1-star review ${D.q2_summary.ratio}× as often as on-time ones (${D.q2_summary.late_1star_pct}% vs ${D.q2_summary.on_time_1star_pct}%)`;

  /* ---------------- Findings text (data-driven) ---------------- */
  document.getElementById('q1-finding').innerHTML =
    `Revenue climbs steadily across the window, with a clear spike around Black Friday. Review scores don't follow the same line — they dip during that same volume spike, and again in early 2018 with no matching drop in orders. <b>Growth and satisfaction move independently</b> and need to be watched as two separate signals.`;

  document.getElementById('q2-finding').innerHTML =
    `This is a <b>cliff, not a gradient</b>. The average score holds between roughly ${earlyPeak.toFixed(1)} and the low end of the "early" range across every degree of earliness, then collapses to ~${latePeak.toFixed(1)} the moment a package is late at all. A late order draws a 1-star review at <b>${D.q2_summary.ratio}× the rate</b> of an on-time one (${D.q2_summary.late_1star_pct}% vs. ${D.q2_summary.on_time_1star_pct}%).`;

  document.getElementById('q3-finding').innerHTML =
    `Sellers based in São Paulo fulfill <b>${D.q3_summary.sp_seller_order_share}%</b> of all delivered orders, despite making up only ${D.q3_summary.sp_seller_base_share}% of the seller base and SP customers accounting for just ${D.q3_summary.sp_customer_share}% of volume. The knock-on effect lands hardest outside the Southeast — the Northeast's late rate runs nearly double the Southeast's, and North/Northeast customers pay the highest freight share of order value. This reads as a <b>network-design issue</b>, not a seller-by-seller one.`;

  const bedbath = D.q4_top_categories.find(c=>c.category==='bed_bath_table');
  document.getElementById('q4-finding').innerHTML =
    `Bulky, heavier categories underperform: <b>${bedbath?bedbath.category.replace(/_/g,' '):'bed & bath'}</b> — the largest category by volume — sits below the platform average of ${D.q4_platform_avg}, alongside furniture and computer accessories. Lighter, easier-to-ship categories like perfumery and toys cluster above it. The clearest outlier below is a product-level problem rather than a shipping one — see the weakest categories.`;

  document.getElementById('q5-finding').innerHTML =
    `Higher installment counts correlate with larger order values (r = ${D.q5_summary.corr_installments_value}) and a mild dip in review score. This looks like a byproduct of <b>what</b> gets bought in installments — bigger, bulkier, slower-shipping items — rather than financing friction on its own. Payment type barely moves the needle: every method averages within a tenth of a point of the others.`;

  document.getElementById('q6-finding').innerHTML =
    `Delivery timing alone accounts for <b>~${D.q6_summary.delivery_share_pct}%</b> of the model's predictive signal — the dominant driver by a wide margin. Order complexity (item and seller count) is a secondary contributor at ~${D.q6_summary.complexity_share_pct}%. Order value, payment approval time, and installments are <b>not meaningful drivers</b> — under a few percent combined, despite often being the intuitive first suspects.`;
  document.getElementById('q6-auc').textContent = D.q6_summary.auc.toFixed(2);

  document.getElementById('bonus-finding').innerHTML =
    `Of ${fmtNum(D.bonus.total_customers)} unique customers, only <b>${D.bonus.repeat_pct}%</b> (${fmtNum(D.bonus.repeat_customers)}) ever place a second order — but they spend nearly double over their lifetime (${fmtBRL(D.bonus.avg_ltv_repeat)} vs. ${fmtBRL(D.bonus.avg_ltv_onetime)}), contributing ${D.bonus.revenue_share_repeat}% of revenue from just ${D.bonus.repeat_pct}% of customers. A real opportunity — best pursued after delivery timing is fixed.`;
  document.getElementById('bonus-pct').textContent = D.bonus.repeat_pct + '%';
  document.getElementById('bonus-ltv').textContent = (D.bonus.avg_ltv_repeat/D.bonus.avg_ltv_onetime).toFixed(1) + '×';

  /* ---------------- Q4 weakest table ---------------- */
  const tbody = document.querySelector('#q4-table tbody');
  D.q4_weakest.forEach(row=>{
    const tr = document.createElement('tr');
    const sign = row.vs_platform < 0 ? 'neg' : 'pos';
    tr.innerHTML = `<td>${row.category.replace(/_/g,' ')}</td><td class="num">${fmtNum(row.n_orders)}</td><td class="num">${row.avg_review.toFixed(2)}</td><td class="num ${sign}">${row.vs_platform>0?'+':''}${row.vs_platform.toFixed(2)}</td>`;
    tbody.appendChild(tr);
  });

  /* ================= CHARTS ================= */

  // Hero cliff line chart
  new Chart(document.getElementById('chart-cliff'), {
    type: 'line',
    data: {
      labels: q2b.map(b=>b.delay_bucket.replace(' days','d').replace(' day','d')),
      datasets: [{
        data: q2b.map(b=>b.avg_review),
        borderColor: INK,
        backgroundColor: 'transparent',
        pointBackgroundColor: q2b.map(b=>b.delay_bucket.includes('late')?RED:GOLD),
        pointBorderColor: q2b.map(b=>b.delay_bucket.includes('late')?RED:GOLD),
        pointRadius: 5,
        borderWidth: 2,
        tension: 0.25,
      }]
    },
    options: {
      responsive:true, maintainAspectRatio:false,
      plugins:{ legend:{display:false},
        tooltip:{callbacks:{label:c=>'avg review '+c.parsed.y.toFixed(2)}} },
      scales:{
        y:{ min:1, max:5, grid:{color:LINE}, ticks:{stepSize:1} },
        x:{ grid:{display:false}, ticks:{maxRotation:40,minRotation:40} }
      }
    }
  });

  // Q1 combo
  new Chart(document.getElementById('chart-q1'), {
    data: {
      labels: D.q1_monthly.map(m=>m.purchase_month),
      datasets: [
        { type:'bar', label:'Revenue (R$)', data: D.q1_monthly.map(m=>m.revenue),
          backgroundColor: GOLD_SOFT, borderColor: GOLD, borderWidth:1, yAxisID:'y' },
        { type:'line', label:'Avg. review score', data: D.q1_monthly.map(m=>m.avg_review),
          borderColor: INK, backgroundColor:'transparent', borderWidth:2, pointRadius:2, yAxisID:'y1', tension:0.2 }
      ]
    },
    options:{
      responsive:true, maintainAspectRatio:false,
      interaction:{mode:'index', intersect:false},
      plugins:{ legend:{position:'top', labels:{boxWidth:10, font:{size:10.5}}} },
      scales:{
        y:{ position:'left', grid:{color:LINE}, ticks:{ callback:v=>'R$'+(v/1000).toFixed(0)+'k' } },
        y1:{ position:'right', min:3, max:5, grid:{display:false} },
        x:{ grid:{display:false}, ticks:{maxRotation:60,minRotation:60, autoSkip:true, maxTicksLimit:12} }
      }
    }
  });

  // Q2 one-star rate by bucket
  new Chart(document.getElementById('chart-q2'), {
    type:'bar',
    data:{
      labels: q2b.map(b=>b.delay_bucket),
      datasets:[{
        data: q2b.map(b=>b.one_star_rate),
        backgroundColor: q2b.map(b=>b.delay_bucket.includes('late')?RED:GOLD_SOFT),
        borderColor: q2b.map(b=>b.delay_bucket.includes('late')?RED:GOLD),
        borderWidth:1,
      }]
    },
    options:{
      responsive:true, maintainAspectRatio:false,
      plugins:{legend:{display:false}, tooltip:{callbacks:{label:c=>c.parsed.y+'% 1-star'}}},
      scales:{
        y:{ grid:{color:LINE}, ticks:{callback:v=>v+'%'} },
        x:{ grid:{display:false}, ticks:{maxRotation:40,minRotation:40} }
      }
    }
  });

  // Q3 region toggle chart
  const regionLabels = D.q3_region.map(r=>r.region);
  let q3Chart = new Chart(document.getElementById('chart-q3'), {
    type:'bar',
    data:{ labels: regionLabels, datasets:[{
      data: D.q3_region.map(r=>r.late_rate),
      backgroundColor: GOLD_SOFT, borderColor: GOLD, borderWidth:1,
    }]},
    options:{
      responsive:true, maintainAspectRatio:false,
      plugins:{legend:{display:false}, tooltip:{callbacks:{label:c=>c.parsed.y+'%'}}},
      scales:{ y:{grid:{color:LINE}, ticks:{callback:v=>v+'%'}}, x:{grid:{display:false}} }
    }
  });
  document.querySelectorAll('#q3-toggle button').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      document.querySelectorAll('#q3-toggle button').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      const metric = btn.dataset.metric;
      const isLate = metric === 'late_rate';
      q3Chart.data.datasets[0].data = D.q3_region.map(r=>r[metric]);
      q3Chart.data.datasets[0].backgroundColor = isLate ? GOLD_SOFT : '#DCEAE5';
      q3Chart.data.datasets[0].borderColor = isLate ? GOLD : TEAL;
      q3Chart.update();
      document.getElementById('q3-chart-title').textContent = isLate
        ? '% OF ORDERS DELIVERED LATE, BY CUSTOMER REGION'
        : 'FREIGHT COST AS % OF ORDER VALUE, BY CUSTOMER REGION';
    });
  });

  // Q4 horizontal bar top15 categories
  const q4sorted = [...D.q4_top_categories].sort((a,b)=>a.avg_review-b.avg_review);
  new Chart(document.getElementById('chart-q4'), {
    type:'bar',
    data:{
      labels: q4sorted.map(c=>c.category.replace(/_/g,' ')),
      datasets:[{
        data: q4sorted.map(c=>c.avg_review),
        backgroundColor: q4sorted.map(c=>c.avg_review < D.q4_platform_avg ? '#E7C9C2' : '#C9DDD6'),
        borderColor: q4sorted.map(c=>c.avg_review < D.q4_platform_avg ? RED : TEAL),
        borderWidth:1,
      }]
    },
    options:{
      indexAxis:'y',
      responsive:true, maintainAspectRatio:false,
      plugins:{
        legend:{display:false},
        tooltip:{callbacks:{label:c=>'avg review '+c.parsed.x.toFixed(2)}},
        annotation:undefined,
      },
      scales:{
        x:{ min:3.5, max:4.5, grid:{color:LINE} },
        y:{ grid:{display:false}, ticks:{font:{size:10.5}} }
      }
    },
    plugins: [{
      id:'platformLine',
      afterDraw(chart){
        const {ctx, chartArea, scales} = chart;
        const x = scales.x.getPixelForValue(D.q4_platform_avg);
        ctx.save();
        ctx.strokeStyle = INK;
        ctx.setLineDash([3,3]);
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(x, chartArea.top);
        ctx.lineTo(x, chartArea.bottom);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = INK_SOFT;
        ctx.font = "10px 'IBM Plex Mono'";
        ctx.fillText('platform avg '+D.q4_platform_avg, x+4, chartArea.top+10);
        ctx.restore();
      }
    }]
  });

  // Q5 installments combo
  const q5 = D.q5_installments.filter(d=>d.n_orders);
  new Chart(document.getElementById('chart-q5'), {
    data:{
      labels: q5.map(d=>d.install_bucket),
      datasets:[
        {type:'bar', label:'Avg. order value (R$)', data:q5.map(d=>d.avg_order_value), backgroundColor:GOLD_SOFT, borderColor:GOLD, borderWidth:1, yAxisID:'y'},
        {type:'line', label:'Avg. review score', data:q5.map(d=>d.avg_review), borderColor:INK, backgroundColor:'transparent', borderWidth:2, pointRadius:3, yAxisID:'y1'}
      ]
    },
    options:{
      responsive:true, maintainAspectRatio:false,
      plugins:{legend:{position:'top', labels:{boxWidth:10, font:{size:10}}}},
      scales:{
        y:{ position:'left', grid:{color:LINE}, ticks:{callback:v=>'R$'+v} },
        y1:{ position:'right', min:3.5, max:4.5, grid:{display:false} },
        x:{ grid:{display:false}, title:{display:true, text:'installments', font:{size:10}} }
      }
    }
  });

  // Q5b payment type
  new Chart(document.getElementById('chart-q5b'), {
    type:'bar',
    data:{
      labels: D.q5_paytype.map(p=>p.type.replace(/_/g,' ')),
      datasets:[{ data: D.q5_paytype.map(p=>p.avg_review), backgroundColor:'#DCEAE5', borderColor:TEAL, borderWidth:1 }]
    },
    options:{
      responsive:true, maintainAspectRatio:false,
      plugins:{legend:{display:false}},
      scales:{ y:{min:3.5,max:4.5, grid:{color:LINE}}, x:{grid:{display:false}} }
    }
  });

  // Q6 feature importance
  const q6 = [...D.q6_importances].sort((a,b)=>a.importance-b.importance);
  const deliveryFeats = ['delivery_delta_days','delivery_time_days'];
  new Chart(document.getElementById('chart-q6'), {
    type:'bar',
    data:{
      labels: q6.map(f=>f.feature.replace(/_/g,' ')),
      datasets:[{
        data: q6.map(f=>f.importance*100),
        backgroundColor: q6.map(f=>deliveryFeats.includes(f.feature)?GOLD_SOFT:'#E4E1D6'),
        borderColor: q6.map(f=>deliveryFeats.includes(f.feature)?GOLD:'#B7B09B'),
        borderWidth:1,
      }]
    },
    options:{
      indexAxis:'y',
      responsive:true, maintainAspectRatio:false,
      plugins:{legend:{display:false}, tooltip:{callbacks:{label:c=>c.parsed.x.toFixed(1)+'% of signal'}}},
      scales:{ x:{grid:{color:LINE}, ticks:{callback:v=>v+'%'}}, y:{grid:{display:false}, ticks:{font:{size:10.5}}} }
    }
  });

})();
