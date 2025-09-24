<script>
  // Whop Integration
  const urlParams = new URLSearchParams(window.location.search);
  const whopUser = urlParams.get('whop_user');

  if (!whopUser) {
    alert("❌ Access denied. Please purchase access at https://whop.com/moneteer/");
    window.location.href = "https://whop.com/moneteer/";
    return;
  }
  // Optional: Store in localStorage for session persistence
  localStorage.setItem('whop_user', whopUser);

  // Optional: Show user ID in console for debugging
  console.log("Whop User ID:", whopUser);
</script>
let chartInstances = {};

function fmt(n, currency = 'USD', decimals = 0){
  const currencySymbols = {
    'USD': '$', 'EUR': '€', 'GBP': '£', 'CAD': 'C$', 'AUD': 'A$'
  };
  const symbol = currencySymbols[currency] || '$';
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(Math.round(n * Math.pow(10, decimals)) / Math.pow(10, decimals));
  return symbol + formatted;
}

function calculateCustomerLifetimeValue(avgValue, churnRate, variableCostPct) {
  const monthlyMargin = avgValue * (1 - variableCostPct/100);
  const lifetimeMonths = 1 / (churnRate/100);
  return monthlyMargin * lifetimeMonths;
}

function generateFinancialProjections(data) {
  let projections = {
    months: [],
    customers: [],
    revenue: [],
    variableCosts: [],
    fixedCosts: [],
    marketingCosts: [],
    grossProfit: [],
    netProfit: [],
    cumulativeCash: [],
    newCustomers: []
  };

  let currentCustomers = data.monthlyCustomers;
  let cumulativeCash = -data.fundingAmount; // Start with funding received
  
  for(let month = 1; month <= 36; month++) {
    // Customer growth model with realistic constraints
    let growthRate = month <= 6 ? 0.15 : month <= 12 ? 0.12 : month <= 24 ? 0.08 : 0.05;
    let newCustomers = Math.round(data.marketingBudget / data.cac);
    let churnedCustomers = Math.round(currentCustomers * (data.churnRate/100));
    currentCustomers = Math.max(0, currentCustomers - churnedCustomers + newCustomers);
    
    // Financial calculations
    let revenue = currentCustomers * data.avgCustomerValue;
    let variableCosts = revenue * (data.variableCosts/100);
    let fixedCosts = data.fixedCosts;
    let marketingCosts = data.marketingBudget;
    let grossProfit = revenue - variableCosts;
    let netProfit = grossProfit - fixedCosts - marketingCosts;
    
    cumulativeCash += netProfit;
    
    projections.months.push(`M${month}`);
    projections.customers.push(currentCustomers);
    projections.revenue.push(revenue);
    projections.variableCosts.push(variableCosts);
    projections.fixedCosts.push(fixedCosts);
    projections.marketingCosts.push(marketingCosts);
    projections.grossProfit.push(grossProfit);
    projections.netProfit.push(netProfit);
    projections.cumulativeCash.push(cumulativeCash);
    projections.newCustomers.push(newCustomers);
  }
  
  return projections;
}

function createChart(canvasId, config) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return null;
  
  // Destroy existing chart if it exists
  if (chartInstances[canvasId]) {
    chartInstances[canvasId].destroy();
  }
  
  chartInstances[canvasId] = new Chart(canvas, config);
  return chartInstances[canvasId];
}

function generateInvestorPlan(){
  try {
    // Collect all input data
    const data = {
      company: document.getElementById('company').value || 'Your Company',
      industry: document.getElementById('industry').value,
      businessModel: document.getElementById('businessModel').value,
      fundingStage: document.getElementById('fundingStage').value,
      tamSize: Number(document.getElementById('tamSize').value) || 0,
      samSize: Number(document.getElementById('samSize').value) || 0,
      somSize: Number(document.getElementById('somSize').value) || 0,
      marketGrowth: Number(document.getElementById('marketGrowth').value) || 0,
      monthlyCustomers: Number(document.getElementById('monthlyCustomers').value) || 0,
      avgCustomerValue: Number(document.getElementById('avgCustomerValue').value) || 0,
      cac: Number(document.getElementById('cac').value) || 0,
      churnRate: Number(document.getElementById('churnRate').value) || 0,
      variableCosts: Number(document.getElementById('variableCosts').value) || 0,
      fixedCosts: Number(document.getElementById('fixedCosts').value) || 0,
      marketingBudget: Number(document.getElementById('marketingBudget').value) || 0,
      teamSize: Number(document.getElementById('teamSize').value) || 0,
      fundingAmount: Number(document.getElementById('fundingAmount').value) || 0,
      valuation: Number(document.getElementById('valuation').value) || 0,
      currency: document.getElementById('currency').value,
      companyStage: document.getElementById('companyStage').value
    };

    // Calculate key metrics
    const ltv = calculateCustomerLifetimeValue(data.avgCustomerValue, data.churnRate, data.variableCosts);
    const ltvCacRatio = data.cac > 0 ? ltv / data.cac : 0;
    const monthlyRevenue = data.monthlyCustomers * data.avgCustomerValue;
    const grossMargin = (1 - data.variableCosts/100) * 100;
    const paybackPeriod = data.cac > 0 ? data.cac / (data.avgCustomerValue * (grossMargin/100)) : 0;
    
    // Generate 3-year projections
    const projections = generateFinancialProjections(data);

    let html = `
    <div style="text-align:center;margin-bottom:40px;">
      <h1 style="margin:0;color:var(--accent);font-size:32px;">${data.company}</h1>
      <h2 style="margin:8px 0;color:var(--muted);font-weight:400;">Investor Presentation & Business Plan</h2>
      <div style="background:linear-gradient(135deg,#1e293b,#475569);color:white;padding:20px;border-radius:12px;margin:20px 0;">
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:20px;">
          <div><div style="font-size:24px;font-weight:700;">${fmt(data.fundingAmount, data.currency)}</div><div style="font-size:12px;opacity:0.8;">Funding Requested</div></div>
          <div><div style="font-size:24px;font-weight:700;">${data.fundingStage}</div><div style="font-size:12px;opacity:0.8;">Funding Stage</div></div>
          <div><div style="font-size:24px;font-weight:700;">${data.industry}</div><div style="font-size:12px;opacity:0.8;">Industry</div></div>
          <div><div style="font-size:24px;font-weight:700;">${data.companyStage}</div><div style="font-size:12px;opacity:0.8;">Company Stage</div></div>
        </div>
      </div>
    </div>

    <div class="tabs">
      <div class="tab active" onclick="showTab('executive')">Executive Summary</div>
      <div class="tab" onclick="showTab('market')">Market Analysis</div>
      <div class="tab" onclick="showTab('financial')">Financial Model</div>
      <div class="tab" onclick="showTab('strategy')">Strategy & Execution</div>
      <div class="tab" onclick="showTab('team')">Team & Funding</div>
    </div>

    <div id="executive" class="tab-content active">
      <h2 class="section-title">Executive Summary</h2>
      
      <div class="alert alert-info">
        <strong>Investment Highlights:</strong> ${data.company} is seeking ${fmt(data.fundingAmount, data.currency)} in ${data.fundingStage} funding to accelerate growth in the ${fmt(data.samSize, data.currency)}M ${data.industry.toLowerCase()} market, with strong unit economics (LTV/CAC: ${ltvCacRatio.toFixed(1)}x) and clear path to profitability.
      </div>

      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-value">${fmt(data.tamSize, data.currency)}M</div>
          <div class="metric-label">Total Market (TAM)</div>
        </div>
        <div class="metric-card">
          <div class="metric-value">${ltvCacRatio.toFixed(1)}x</div>
          <div class="metric-label">LTV/CAC Ratio</div>
        </div>
        <div class="metric-card">
          <div class="metric-value">${grossMargin.toFixed(1)}%</div>
          <div class="metric-label">Gross Margin</div>
        </div>
        <div class="metric-card">
          <div class="metric-value">${paybackPeriod.toFixed(1)} mo</div>
          <div class="metric-label">Payback Period</div>
        </div>
      </div>

      <div style="background:#f8fafc;padding:20px;border-radius:10px;margin:20px 0;">
        <h3 style="margin-top:0;color:var(--accent);">Problem & Solution</h3>
        <div contenteditable="true" class="edit-hint">
          <strong>Problem:</strong> [Describe the specific problem your target customers face - be specific about pain points, current solutions' limitations, and market gaps]<br><br>
          <strong>Solution:</strong> [Explain your unique solution and why it's 10x better than alternatives - focus on key differentiators and unique value proposition]
        </div>
      </div>

      <div style="background:#f8fafc;padding:20px;border-radius:10px;margin:20px 0;">
        <h3 style="margin-top:0;color:var(--accent);">Business Model & Revenue Streams</h3>
        <div contenteditable="true">
          <strong>Primary Revenue Model:</strong> ${data.businessModel} with average customer value of ${fmt(data.avgCustomerValue, data.currency)}<br>
          <strong>Revenue Streams:</strong> [Detail your monetization strategy - subscription fees, transaction fees, advertising, etc.]<br>
          <strong>Pricing Strategy:</strong> [Explain your pricing model and how it compares to competitors]
        </div>
      </div>
    </div>

    <div id="market" class="tab-content">
      <h2 class="section-title">Market Analysis & Opportunity</h2>
      
      <div class="market-sizing">
        <h3 style="margin-top:0;">Market Size & Growth</h3>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:20px;text-align:center;">
          <div><div style="font-size:28px;font-weight:700;">${fmt(data.tamSize, data.currency)}M</div><div>Total Addressable Market (TAM)</div></div>
          <div><div style="font-size:28px;font-weight:700;">${fmt(data.samSize, data.currency)}M</div><div>Serviceable Addressable Market (SAM)</div></div>
          <div><div style="font-size:28px;font-weight:700;">${fmt(data.somSize, data.currency)}M</div><div>Serviceable Obtainable Market (SOM)</div></div>
        </div>
        <p style="margin-top:20px;text-align:center;">Market growing at <strong>${data.marketGrowth}% annually</strong> driven by digital transformation and changing consumer behavior.</p>
      </div>

      <h3 class="subsection">Target Customer Segments</h3>
      <div contenteditable="true" style="background:#f8fafc;padding:16px;border-radius:8px;">
        <strong>Primary Segment:</strong> [Define your ideal customer profile - demographics, psychographics, behaviors, needs]<br>
        <strong>Secondary Segment:</strong> [Additional customer segments you plan to target]<br>
        <strong>Customer Validation:</strong> [Include survey data, interviews, pilot results, or early customer feedback]
      </div>

      <h3 class="subsection">Competitive Landscape</h3>
      <div class="competitive-grid">
        <div class="competitor-card">
          <h4 style="margin-top:0;color:var(--accent);">Direct Competitors</h4>
          <div contenteditable="true">
            [List 2-3 direct competitors, their strengths, weaknesses, and market position]
          </div>
        </div>
        <div class="competitor-card">
          <h4 style="margin-top:0;color:var(--accent);">Indirect Competitors</h4>
          <div contenteditable="true">
            [Alternative solutions customers use today, substitute products/services]
          </div>
        </div>
        <div class="competitor-card">
          <h4 style="margin-top:0;color:var(--accent);">Competitive Advantages</h4>
          <div contenteditable="true">
            [Your unique differentiators, barriers to entry you'll create, defensible moat]
          </div>
        </div>
      </div>

      <div class="validation-evidence">
        <h4 style="margin-top:0;color:var(--success);">Market Validation Evidence</h4>
        <div contenteditable="true">
          <strong>Traction Metrics:</strong> [Current customers, revenue, growth rate, key partnerships]<br>
          <strong>Customer Feedback:</strong> [Testimonials, case studies, NPS scores, retention rates]<br>
          <strong>Market Indicators:</strong> [Industry trends, regulatory changes, technology shifts supporting your thesis]
        </div>
      </div>
    </div>

    <div id="financial" class="tab-content">
      <h2 class="section-title">Financial Model & Projections</h2>
      
      <h3 class="subsection">Unit Economics & Key Metrics</h3>
      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-value">${fmt(ltv, data.currency)}</div>
          <div class="metric-label">Customer Lifetime Value (LTV)</div>
        </div>
        <div class="metric-card">
          <div class="metric-value">${fmt(data.cac, data.currency)}</div>
          <div class="metric-label">Customer Acquisition Cost (CAC)</div>
        </div>
        <div class="metric-card">
          <div class="metric-value">${ltvCacRatio.toFixed(1)}x</div>
          <div class="metric-label">LTV/CAC Ratio</div>
        </div>
        <div class="metric-card">
          <div class="metric-value">${data.churnRate}%</div>
          <div class="metric-label">Monthly Churn Rate</div>
        </div>
      </div>

      <div class="scenario-table">
        <h3 class="subsection">3-Year Revenue Projections</h3>
        <table>
          <thead>
            <tr><th>Metric</th><th>Year 1</th><th>Year 2</th><th>Year 3</th></tr>
          </thead>
          <tbody>
            <tr><td><strong>Monthly Customers (End of Year)</strong></td><td>${projections.customers[11].toLocaleString()}</td><td>${projections.customers[23].toLocaleString()}</td><td>${projections.customers[35].toLocaleString()}</td></tr>
            <tr><td><strong>Annual Revenue</strong></td><td>${fmt(projections.revenue.slice(0,12).reduce((a,b) => a+b, 0), data.currency)}</td><td>${fmt(projections.revenue.slice(12,24).reduce((a,b) => a+b, 0), data.currency)}</td><td>${fmt(projections.revenue.slice(24,36).reduce((a,b) => a+b, 0), data.currency)}</td></tr>
            <tr><td><strong>Gross Profit</strong></td><td>${fmt(projections.grossProfit.slice(0,12).reduce((a,b) => a+b, 0), data.currency)}</td><td>${fmt(projections.grossProfit.slice(12,24).reduce((a,b) => a+b, 0), data.currency)}</td><td>${fmt(projections.grossProfit.slice(24,36).reduce((a,b) => a+b, 0), data.currency)}</td></tr>
            <tr><td><strong>Net Profit</strong></td><td>${fmt(projections.netProfit.slice(0,12).reduce((a,b) => a+b, 0), data.currency)}</td><td>${fmt(projections.netProfit.slice(12,24).reduce((a,b) => a+b, 0), data.currency)}</td><td>${fmt(projections.netProfit.slice(24,36).reduce((a,b) => a+b, 0), data.currency)}</td></tr>
          </tbody>
        </table>
      </div>

      <div class="charts-grid">
        <div><canvas id="revenueChart"></canvas></div>
        <div><canvas id="customerChart"></canvas></div>
        <div><canvas id="profitChart"></canvas></div>
        <div><canvas id="cashflowChart"></canvas></div>
      </div>

      <h3 class="subsection">Scenario Analysis</h3>
      <div class="scenario-table">
        <table>
          <thead style="background:var(--accent);color:white;">
            <tr><th>Scenario</th><th>Revenue (Year 2)</th><th>Customers (Year 2)</th><th>Break-even Month</th><th>Probability</th></tr>
          </thead>
          <tbody>
            <tr style="background:#f0fdf4;"><td><strong>Conservative (70% of base)</strong></td><td>${fmt(projections.revenue.slice(12,24).reduce((a,b) => a+b, 0) * 0.7, data.currency)}</td><td>${Math.round(projections.customers[23] * 0.7).toLocaleString()}</td><td>18-24</td><td>60%</td></tr>
            <tr style="background:#fffbeb;"><td><strong>Base Case</strong></td><td>${fmt(projections.revenue.slice(12,24).reduce((a,b) => a+b, 0), data.currency)}</td><td>${projections.customers[23].toLocaleString()}</td><td>12-18</td><td>30%</td></tr>
            <tr style="background:#ecfdf5;"><td><strong>Optimistic (150% of base)</strong></td><td>${fmt(projections.revenue.slice(12,24).reduce((a,b) => a+b, 0) * 1.5, data.currency)}</td><td>${Math.round(projections.customers[23] * 1.5).toLocaleString()}</td><td>8-12</td><td>10%</td></tr>
          </tbody>
        </table>
      </div>

      <div class="alert alert-warning">
        <strong>Key Assumptions:</strong> Growth rates based on ${data.marketGrowth}% market growth, ${data.churnRate}% monthly churn, and ${fmt(data.cac, data.currency)} CAC. Monitor these metrics closely and adjust model quarterly based on actual performance.
      </div>
    </div>

    <div id="strategy" class="tab-content">
      <h2 class="section-title">Strategy & Execution Plan</h2>
      
      <h3 class="subsection">Go-to-Market Strategy</h3>
      <div style="background:#f8fafc;padding:20px;border-radius:10px;margin:20px 0;">
        <div contenteditable="true">
          <strong>Customer Acquisition Channels:</strong><br>
          • Digital Marketing: ${Math.round((data.marketingBudget * 0.4)/1000)}k/month on paid acquisition<br>
          • Content Marketing: SEO, social media, thought leadership<br>
          • Partnerships: Strategic alliances and referral programs<br>
          • Sales Team: Direct outreach and relationship building<br><br>
          
          <strong>Launch Strategy:</strong><br>
          [Detail your market entry approach, pilot programs, beta testing, and scale-up plan]<br><br>
          
          <strong>Customer Success & Retention:</strong><br>
          [Explain onboarding process, support systems, and retention strategies to minimize ${data.churnRate}% churn rate]
        </div>
      </div>

      <h3 class="subsection">Product Development Roadmap</h3>
      <div class="funding-timeline">
        <div class="milestone">
          <div class="milestone-date">Q1 2024</div>
          <div class="milestone-desc">Core Product Enhancement</div>
        </div>
        <div class="milestone">
          <div class="milestone-date">Q2 2024</div>
          <div class="milestone-desc">Market Expansion</div>
        </div>
        <div class="milestone">
          <div class="milestone-date">Q3 2024</div>
          <div class="milestone-desc">Platform Scaling</div>
        </div>
        <div class="milestone">
          <div class="milestone-date">Q4 2024</div>
          <div class="milestone-desc">Series A Preparation</div>
        </div>
      </div>

      <div contenteditable="true" style="background:#f8fafc;padding:16px;border-radius:8px;margin:20px 0;">
        <strong>Key Product Milestones:</strong><br>
        [List specific product features, integrations, or capabilities you'll develop with funding]<br><br>
        <strong>Technology Stack & Scalability:</strong><br>
        [Describe your technical architecture and how it supports growth to ${projections.customers[35].toLocaleString()} customers]
      </div>

      <h3 class="subsection">Risk Analysis & Mitigation</h3>
      <div class="risk-matrix">
        <div class="risk-item risk-high">
          <strong>High Risk:</strong><br>
          <div contenteditable="true">Customer acquisition costs exceed ${fmt(data.cac, data.currency)} target - Mitigation: Diversify channels, optimize conversion</div>
        </div>
        <div class="risk-item risk-medium">
          <strong>Medium Risk:</strong><br>
          <div contenteditable="true">Competitive pressure from established players - Mitigation: Strong differentiation, customer loyalty programs</div>
        </div>
        <div class="risk-item risk-low">
          <strong>Low Risk:</strong><br>
          <div contenteditable="true">Regulatory changes in ${data.industry} - Mitigation: Monitor compliance, legal advisory</div>
        </div>
      </div>

      <h3 class="subsection">Operating Plan & Key Metrics</h3>
      <div style="background:#f8fafc;padding:20px;border-radius:10px;">
        <div contenteditable="true">
          <strong>Key Performance Indicators (KPIs):</strong><br>
          • Monthly Recurring Revenue (MRR) Growth: Target 15-20%<br>
          • Customer Acquisition Cost (CAC): Maintain under ${fmt(data.cac, data.currency)}<br>
          • Customer Lifetime Value (LTV): Improve to ${fmt(ltv * 1.3, data.currency)}+<br>
          • Monthly Active Users: Growth and engagement metrics<br>
          • Net Promoter Score (NPS): Target 50+<br><br>
          
          <strong>Operational Excellence:</strong><br>
          [Describe quality control, customer support, and operational processes that ensure scalability]
        </div>
      </div>
    </div>

    <div id="team" class="tab-content">
      <h2 class="section-title">Team & Funding</h2>
      
      <h3 class="subsection">Leadership Team</h3>
      <div class="team-grid">
        <div class="team-member">
          <div contenteditable="true">
            <strong>CEO/Founder</strong><br>
            [Name & Background]<br>
            <small>[Previous experience, expertise, achievements relevant to this venture]</small>
          </div>
        </div>
        <div class="team-member">
          <div contenteditable="true">
            <strong>CTO/Co-Founder</strong><br>
            [Name & Background]<br>
            <small>[Technical expertise, previous roles, key accomplishments]</small>
          </div>
        </div>
        <div class="team-member">
          <div contenteditable="true">
            <strong>VP Marketing</strong><br>
            [Name & Background]<br>
            <small>[Marketing experience, growth expertise, relevant industry knowledge]</small>
          </div>
        </div>
      </div>

      <h3 class="subsection">Use of Funds</h3>
      <div style="background:#f8fafc;padding:20px;border-radius:10px;margin:20px 0;">
        <table>
          <thead>
            <tr><th>Category</th><th>Amount</th><th>Percentage</th><th>Purpose</th></tr>
          </thead>
          <tbody>
            <tr><td><strong>Product Development</strong></td><td>${fmt(data.fundingAmount * 0.35, data.currency)}</td><td>35%</td><td>Engineering team, platform enhancement</td></tr>
            <tr><td><strong>Marketing & Sales</strong></td><td>${fmt(data.fundingAmount * 0.30, data.currency)}</td><td>30%</td><td>Customer acquisition, brand building</td></tr>
            <tr><td><strong>Operations & Infrastructure</strong></td><td>${fmt(data.fundingAmount * 0.20, data.currency)}</td><td>20%</td><td>Technology infrastructure, operational scaling</td></tr>
            <tr><td><strong>Working Capital</strong></td><td>${fmt(data.fundingAmount * 0.10, data.currency)}</td><td>10%</td><td>General operations, contingency fund</td></tr>
            <tr><td><strong>Legal & Professional</strong></td><td>${fmt(data.fundingAmount * 0.05, data.currency)}</td><td>5%</td><td>Legal, accounting, advisory services</td></tr>
          </tbody>
        </table>
      </div>

      <h3 class="subsection">Investment Terms & Valuation</h3>
      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-value">${fmt(data.valuation, data.currency)}</div>
          <div class="metric-label">Pre-Money Valuation</div>
        </div>
        <div class="metric-card">
          <div class="metric-value">${fmt(data.fundingAmount, data.currency)}</div>
          <div class="metric-label">Investment Amount</div>
        </div>
        <div class="metric-card">
          <div class="metric-value">${((data.fundingAmount / (data.valuation + data.fundingAmount)) * 100).toFixed(1)}%</div>
          <div class="metric-label">Equity Offered</div>
        </div>
        <div class="metric-card">
          <div class="metric-value">18-24mo</div>
          <div class="metric-label">Runway Provided</div>
        </div>
      </div>

      <h3 class="subsection">Growth Milestones & Next Funding</h3>
      <div contenteditable="true" style="background:#ecfdf5;padding:20px;border-radius:10px;border:1px solid #bbf7d0;">
        <strong>12-Month Milestones:</strong><br>
        • Reach ${(projections.customers[11]).toLocaleString()} monthly active customers<br>
        • Achieve ${fmt(projections.revenue.slice(0,12).reduce((a,b) => a+b, 0), data.currency)} in annual recurring revenue<br>
        • Launch in 2 additional markets<br>
        • Build team to 15+ employees<br><br>
        
        <strong>Series A Planning (18-24 months):</strong><br>
        • Target: ${fmt(data.fundingAmount * 4, data.currency)} raise at ${fmt(data.valuation * 3, data.currency)} valuation<br>
        • Metrics: ${fmt(projections.revenue.slice(12,24).reduce((a,b) => a+b, 0), data.currency)}+ ARR, positive unit economics<br>
        • Use case: International expansion, product diversification
      </div>

      <h3 class="subsection">Exit Strategy & Returns</h3>
      <div style="background:#f8fafc;padding:20px;border-radius:10px;">
        <div contenteditable="true">
          <strong>Potential Exit Scenarios:</strong><br>
          • Strategic Acquisition: Industry consolidation by larger ${data.industry.toLowerCase()} companies<br>
          • IPO Path: Target ${fmt(data.valuation * 20, data.currency)}+ valuation in 5-7 years<br>
          • Private Equity: Management buyout or growth capital exit<br><br>
          
          <strong>Comparable Exits:</strong><br>
          [List 2-3 similar companies in your industry that had successful exits, their valuations and multiples]<br><br>
          
          <strong>Investor Returns Potential:</strong><br>
          Conservative: 5-10x return | Target: 10-20x return | Optimistic: 20x+ return
        </div>
      </div>
    </div>

    <div style="margin-top:40px;padding:20px;background:#f8fafc;border-radius:10px;text-align:center;">
      <h3 style="color:var(--accent);margin-top:0;">Ready to Partner With Us?</h3>
      <p style="margin-bottom:20px;">Join us in building the future of ${data.industry.toLowerCase()}. Contact us to discuss this investment opportunity.</p>
      <div contenteditable="true">
        <strong>Contact Information:</strong><br>
        Email: [founder@${data.company.toLowerCase().replace(/\s+/g, '')}.com]<br>
        Phone: [+1 (555) 123-4567]<br>
        LinkedIn: [linkedin.com/in/founder-name]
      </div>
    </div>
    
    <!-- Brand Footer -->
    <div style="text-align:center;margin:40px 0 0 0;font-size:14px;color:#6b7280; border-top:1px solid #e5e7eb; padding-top:20px;">
      <p>Generated with <strong>Advanced Business Plan Generator</strong> by <a href="https://moneteer.gumroad.com" target="_blank" style="color:#3b82f6;text-decoration:underline;">Moneteer</a></p>
      <p>Connect: <a href="mailto:moneteer808@gmail.com" style="color:#3b82f6;text-decoration:underline;">moneteer808@gmail.com</a></p>
    </div>
    `;

    document.getElementById('output').innerHTML = html;
    document.getElementById('output').style.display = 'block';
    document.getElementById('pageTitle').innerText = data.company + ' — Investor-Ready Business Plan';

    // Generate charts after a short delay to ensure DOM is ready
    setTimeout(() => {
      createFinancialCharts(projections, data.currency);
    }, 100);

  } catch(error) {
    console.error('Error generating plan:', error);
    alert('Error generating investor plan: ' + error.message);
  }
}

function createFinancialCharts(projections, currency) {
  // Revenue Growth Chart
  createChart('revenueChart', {
    type: 'line',
    data: {
      labels: projections.months.slice(0, 24), // Show 2 years
      datasets: [{
        label: 'Monthly Revenue',
        data: projections.revenue.slice(0, 24),
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true
      }]
    },
    options: {
      responsive: true,
      plugins: {
        title: { display: true, text: '24-Month Revenue Projection' }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function(value) {
              return fmt(value, currency);
            }
          }
        }
      }
    }
  });

  // Customer Growth Chart
  createChart('customerChart', {
    type: 'bar',
    data: {
      labels: projections.months.slice(0, 24),
      datasets: [
        {
          label: 'Total Customers',
          data: projections.customers.slice(0, 24),
          backgroundColor: '#10b981',
          yAxisID: 'y'
        },
        {
          label: 'New Customers',
          data: projections.newCustomers.slice(0, 24),
          backgroundColor: '#f59e0b',
          yAxisID: 'y1'
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        title: { display: true, text: 'Customer Growth & Acquisition' }
      },
      scales: {
        y: {
          type: 'linear',
          display: true,
          position: 'left'
        },
        y1: {
          type: 'linear',
          display: true,
          position: 'right',
          grid: { drawOnChartArea: false }
        }
      }
    }
  });

  // Profit & Loss Chart
  createChart('profitChart', {
    type: 'bar',
    data: {
      labels: projections.months.slice(0, 24),
      datasets: [
        {
          label: 'Revenue',
          data: projections.revenue.slice(0, 24),
          backgroundColor: '#3b82f6'
        },
        {
          label: 'Costs',
          data: projections.revenue.slice(0, 24).map((rev, i) => 
            projections.variableCosts[i] + projections.fixedCosts[i] + projections.marketingCosts[i]
          ),
          backgroundColor: '#ef4444'
        },
        {
          label: 'Net Profit',
          data: projections.netProfit.slice(0, 24),
          backgroundColor: '#10b981'
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        title: { display: true, text: 'Monthly P&L Breakdown' }
      },
      scales: {
        y: {
          ticks: {
            callback: function(value) {
              return fmt(value, currency);
            }
          }
        }
      }
    }
  });

  // Cash Flow Chart
  createChart('cashflowChart', {
    type: 'line',
    data: {
      labels: projections.months.slice(0, 24),
      datasets: [{
        label: 'Cumulative Cash Flow',
        data: projections.cumulativeCash.slice(0, 24),
        borderColor: '#8b5cf6',
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        tension: 0.4,
        fill: true
      }]
    },
    options: {
      responsive: true,
      plugins: {
        title: { display: true, text: 'Cumulative Cash Flow' }
      },
      scales: {
        y: {
          ticks: {
            callback: function(value) {
              return fmt(value, currency);
            }
          }
        }
      }
    }
  });
}

function showTab(tabName) {
  // Hide all tab contents
  const tabContents = document.querySelectorAll('.tab-content');
  tabContents.forEach(content => {
    content.classList.remove('active');
  });
  
  // Remove active class from all tabs
  const tabs = document.querySelectorAll('.tab');
  tabs.forEach(tab => {
    tab.classList.remove('active');
  });
  
  // Show selected tab content
  document.getElementById(tabName).classList.add('active');
  
  // Add active class to clicked tab
  event.target.classList.add('active');
}

function exportPlan() {
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  if (isMobile) {
    saveAsPDF();
  } else {
    printAsPDF();
  }
}

function saveAsPDF() {
  const { jsPDF } = window.jspdf;
  const element = document.getElementById('output');
  if (!element) {
    alert("Please generate plan first.");
    return;
  }

  const companyName = document.getElementById('company').value || 'Business';
  const today = new Date().toISOString().split('T')[0];

  // Store original states
  const tabContents = document.querySelectorAll('.tab-content');
  const tabsContainer = document.querySelector('.tabs');
  const originalDisplays = [];
  
  // Show all tab contents for PDF
  tabContents.forEach(tab => {
    originalDisplays.push(tab.style.display);
    tab.style.display = 'block';
  });
  
  // Hide tabs UI
  if (tabsContainer) tabsContainer.style.display = 'none';

  // Re-render charts
  const data = {
    monthlyCustomers: Number(document.getElementById('monthlyCustomers').value) || 0,
    avgCustomerValue: Number(document.getElementById('avgCustomerValue').value) || 0,
    cac: Number(document.getElementById('cac').value) || 0,
    churnRate: Number(document.getElementById('churnRate').value) || 0,
    variableCosts: Number(document.getElementById('variableCosts').value) || 0,
    fixedCosts: Number(document.getElementById('fixedCosts').value) || 0,
    marketingBudget: Number(document.getElementById('marketingBudget').value) || 0,
    fundingAmount: Number(document.getElementById('fundingAmount').value) || 0
  };
  const projections = generateFinancialProjections(data);
  createFinancialCharts(projections, document.getElementById('currency').value);

  // Wait for charts to render
  setTimeout(() => {
    // Convert charts to images
    const canvases = element.querySelectorAll('canvas');
    const canvasReplacements = [];
    
    canvases.forEach(canvas => {
      if (chartInstances[canvas.id]) {
        const img = document.createElement('img');
        img.src = chartInstances[canvas.id].toBase64Image();
        img.style.width = '100%';
        img.style.height = 'auto';
        img.className = 'chart-image-pdf';
        canvas.parentNode.insertBefore(img, canvas);
        canvasReplacements.push({ canvas, img });
        canvas.style.display = 'none';
      }
    });

    // Add PDF-specific styling
    const tempStyle = document.createElement('style');
    tempStyle.innerHTML = `
      body, html {
        margin: 0;
        padding: 0;
        background: white;
        width: 210mm;
      }
      #output {
        width: 190mm !important;
        margin: 0 auto;
        padding: 10mm 0 !important;
        font-family: Arial, sans-serif !important;
        font-size: 10pt !important;
        line-height: 1.4 !important;
        color: #000 !important;
        background: white !important;
      }
      .tabs, .button, #pageTitle, .card { 
        display: none !important; 
      }
      h1 { 
        font-size: 18pt !important; 
        margin-bottom: 5mm !important;
        color: #000 !important;
        text-align: center;
      }
      h2 { 
        font-size: 14pt !important; 
        margin: 8mm 0 3mm 0 !important;
        color: #000 !important;
      }
      h3 {
        font-size: 12pt !important;
        margin: 5mm 0 2mm 0 !important;
        color: #000 !important;
      }
      .section-title {
        font-size: 16pt !important;
        margin: 10mm 0 4mm 0 !important;
        padding-bottom: 2mm !important;
        color: #000 !important;
        border-bottom: 1pt solid #ccc !important;
      }
      .subsection { 
        font-size: 11pt !important; 
        margin: 4mm 0 2mm 0 !important; 
        color: #000 !important;
      }
      table {
        font-size: 9pt !important;
        width: 100% !important;
        border-collapse: collapse;
        margin: 3mm 0 5mm 0 !important;
      }
      th, td {
        padding: 2mm !important;
        border: 0.5pt solid #000 !important;
      }
      th {
        background: #f0f0f0 !important;
        font-weight: bold !important;
      }
      .metrics-grid, .competitive-grid, .team-grid {
        grid-template-columns: repeat(2, 1fr) !important;
        gap: 3mm !important;
        margin: 3mm 0 5mm 0 !important;
      }
      .risk-matrix {
        grid-template-columns: 1fr !important;
        gap: 2mm !important;
      }
      .metric-card, .competitor-card, .team-member, .risk-item {
        padding: 3mm !important;
        font-size: 9pt !important;
        border: 0.5pt solid #ccc !important;
      }
      .metric-value {
        font-size: 14pt !important;
      }
      .charts-grid {
        grid-template-columns: 1fr !important;
        gap: 5mm !important;
        margin: 5mm 0 !important;
      }
      canvas, .chart-image-pdf {
        height: 60mm !important;
        width: 100% !important;
      }
      [contenteditable="true"] {
        font-size: 10pt !important;
        line-height: 1.4 !important;
        color: #000 !important;
        background: transparent !important;
        border: none !important;
        outline: none !important;
        padding: 2mm !important;
        margin: 2mm 0 !important;
      }
      .edit-hint {
        font-size: 9pt !important;
        color: #666 !important;
        font-style: italic !important;
      }
      .alert {
        border: 0.5pt solid #ccc !important;
        background: #f9f9f9 !important;
        box-shadow: none !important;
        font-size: 9pt !important;
        padding: 3mm !important;
        margin: 3mm 0 !important;
      }
      .market-sizing {
        background: #f0f0f0 !important;
        color: #000 !important;
        padding: 3mm !important;
        font-size: 10pt !important;
        margin: 3mm 0 5mm 0 !important;
      }
      .funding-timeline {
        padding: 2mm !important;
        margin: 3mm 0 5mm 0 !important;
      }
      .milestone {
        font-size: 9pt !important;
      }
      .validation-evidence {
        background: #f0f0f0 !important;
        border: 0.5pt solid #ccc !important;
        padding: 3mm !important;
        margin: 3mm 0 5mm 0 !important;
      }
      .scenario-table {
        margin: 3mm 0 5mm 0 !important;
      }
    `;
    document.head.appendChild(tempStyle);

    // Generate PDF
    html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight
    }).then(canvas => {
      const imgData = canvas.toDataURL('image/jpeg', 0.9);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`${companyName} Business Plan - ${today}.pdf`);

      // Cleanup - restore original state
      tabContents.forEach((tab, i) => {
        tab.style.display = originalDisplays[i];
      });
      
      if (tabsContainer) tabsContainer.style.display = 'flex';
      
      canvasReplacements.forEach(replacement => {
        if (replacement.img.parentNode) {
          replacement.img.parentNode.removeChild(replacement.img);
        }
        replacement.canvas.style.display = '';
      });
      
      if (tempStyle.parentNode) {
        tempStyle.parentNode.removeChild(tempStyle);
      }
      
      // Reactivate first tab
      showTab('executive');
    }).catch(error => {
      console.error("PDF generation error:", error);
      alert("Error generating PDF. Please try again.");
      
      // Cleanup on error too
      tabContents.forEach((tab, i) => {
        tab.style.display = originalDisplays[i];
      });
      
      if (tabsContainer) tabsContainer.style.display = 'flex';
      
      canvasReplacements.forEach(replacement => {
        if (replacement.img.parentNode) {
          replacement.img.parentNode.removeChild(replacement.img);
        }
        replacement.canvas.style.display = '';
      });
      
      if (tempStyle.parentNode) {
        tempStyle.parentNode.removeChild(tempStyle);
      }
      
      showTab('executive');
    });
  }, 1000);
}

function printAsPDF() {
  const companyName = document.getElementById('company').value || 'Business';
  const today = new Date().toLocaleDateString('en-CA');

  // Store original states
  const tabContents = document.querySelectorAll('.tab-content');
  const tabsContainer = document.querySelector('.tabs');
  const originalDisplays = [];
  
  // Show all tab contents for print
  tabContents.forEach(tab => {
    originalDisplays.push(tab.style.display);
    tab.style.display = 'block';
  });
  
  // Hide tabs UI
  if (tabsContainer) tabsContainer.style.display = 'none';

  // Re-render charts
  const data = {
    monthlyCustomers: Number(document.getElementById('monthlyCustomers').value) || 0,
    avgCustomerValue: Number(document.getElementById('avgCustomerValue').value) || 0,
    cac: Number(document.getElementById('cac').value) || 0,
    churnRate: Number(document.getElementById('churnRate').value) || 0,
    variableCosts: Number(document.getElementById('variableCosts').value) || 0,
    fixedCosts: Number(document.getElementById('fixedCosts').value) || 0,
    marketingBudget: Number(document.getElementById('marketingBudget').value) || 0,
    fundingAmount: Number(document.getElementById('fundingAmount').value) || 0
  };
  const projections = generateFinancialProjections(data);
  createFinancialCharts(projections, document.getElementById('currency').value);

  // Wait for charts to render
  setTimeout(() => {
    // Convert charts to images
    const canvases = document.querySelectorAll('canvas');
    const canvasReplacements = [];
    
    canvases.forEach(canvas => {
      if (chartInstances[canvas.id]) {
        const img = document.createElement('img');
        img.src = chartInstances[canvas.id].toBase64Image();
        img.style.width = '100%';
        img.style.height = 'auto';
        canvas.parentNode.insertBefore(img, canvas);
        canvasReplacements.push({ canvas, img });
        canvas.style.display = 'none';
      }
    });

    // Add print styles
    const style = document.createElement('style');
    style.innerHTML = `
      @media print {
        body, html {
          margin: 0;
          padding: 0;
          width: 100%;
          background: white;
          font-family: Arial, sans-serif !important;
          font-size: 10pt !important;
          line-height: 1.4 !important;
          color: #000 !important;
        }
        .card, #pageTitle, .button, .tabs { 
          display: none !important; 
        }
        .plan { 
          padding: 0 !important; 
          background: white; 
          box-shadow: none; 
          border: none; 
          width: 100% !important;
        }
        h1 { 
          font-size: 18pt !important; 
          margin-bottom: 5mm !important;
          color: #000 !important;
          text-align: center;
        }
        h2 { 
          font-size: 14pt !important; 
          margin: 8mm 0 3mm 0 !important;
          color: #000 !important;
        }
        h3 {
          font-size: 12pt !important;
          margin: 5mm 0 2mm 0 !important;
          color: #000 !important;
        }
        .section-title {
          font-size: 16pt !important;
          margin: 10mm 0 4mm 0 !important;
          padding-bottom: 2mm !important;
          color: #000 !important;
          border-bottom: 1pt solid #ccc !important;
        }
        .subsection { 
          font-size: 11pt !important; 
          margin: 4mm 0 2mm 0 !important; 
          color: #000 !important;
        }
        table {
          font-size: 9pt !important;
          width: 100% !important;
          border-collapse: collapse;
          margin: 3mm 0 5mm 0 !important;
        }
        th, td {
          padding: 2mm !important;
          border: 0.5pt solid #000 !important;
        }
        th {
          background: #f0f0f0 !important;
          font-weight: bold !important;
        }
        .metrics-grid, .competitive-grid, .team-grid {
          grid-template-columns: repeat(2, 1fr) !important;
          gap: 3mm !important;
          margin: 3mm 0 5mm 0 !important;
        }
        .risk-matrix {
          grid-template-columns: 1fr !important;
          gap: 2mm !important;
        }
        .metric-card, .competitor-card, .team-member, .risk-item {
          padding: 3mm !important;
          font-size: 9pt !important;
          border: 0.5pt solid #ccc !important;
        }
        .metric-value {
          font-size: 14pt !important;
        }
        .charts-grid {
          grid-template-columns: 1fr !important;
          gap: 5mm !important;
          margin: 5mm 0 !important;
        }
        canvas, img {
          height: 60mm !important;
          width: 100% !important;
        }
        [contenteditable="true"] {
          font-size: 10pt !important;
          line-height: 1.4 !important;
          color: #000 !important;
          background: transparent !important;
          border: none !important;
          outline: none !important;
          padding: 2mm !important;
          margin: 2mm 0 !important;
        }
        .edit-hint {
          font-size: 9pt !important;
          color: #666 !important;
          font-style: italic !important;
        }
        .alert {
          border: 0.5pt solid #ccc !important;
          background: #f9f9f9 !important;
          box-shadow: none !important;
          font-size: 9pt !important;
          padding: 3mm !important;
          margin: 3mm 0 !important;
        }
        .market-sizing {
          background: #f0f0f0 !important;
          color: #000 !important;
          padding: 3mm !important;
          font-size: 10pt !important;
          margin: 3mm 0 5mm 0 !important;
        }
        .funding-timeline {
          padding: 2mm !important;
          margin: 3mm 0 5mm 0 !important;
        }
        .milestone {
          font-size: 9pt !important;
        }
        .validation-evidence {
          background: #f0f0f0 !important;
          border: 0.5pt solid #ccc !important;
          padding: 3mm !important;
          margin: 3mm 0 5mm 0 !important;
        }
        .scenario-table {
          margin: 3mm 0 5mm 0 !important;
        }
      }
      @page { 
        margin: 15mm; 
      }
    `;
    document.head.appendChild(style);

    // Add timestamp
    const timestamp = document.createElement('div');
    timestamp.style.cssText = 'text-align: center; font-size: 8pt; color: #666; margin: 5mm 0;';
    timestamp.textContent = `Printed on ${new Date().toLocaleString()} — ${companyName} Business Plan`;
    document.getElementById('output').appendChild(timestamp);

    window.print();

    // Clean up after printing
    setTimeout(() => {
      // Restore original tab displays
      tabContents.forEach((tab, i) => {
        tab.style.display = originalDisplays[i];
      });
      
      // Show tabs UI again
      if (tabsContainer) tabsContainer.style.display = 'flex';
      
      // Remove print style
      if (style.parentNode) {
        style.parentNode.removeChild(style);
      }
      
      // Remove chart images and show canvases again
      canvasReplacements.forEach(replacement => {
        if (replacement.img.parentNode) {
          replacement.img.parentNode.removeChild(replacement.img);
        }
        replacement.canvas.style.display = '';
      });
      
      // Remove timestamp
      if (timestamp.parentNode) {
        timestamp.parentNode.removeChild(timestamp);
      }
      
      // Reactivate first tab
      showTab('executive');
    }, 500);
  }, 1000);
}

// Initialize with first generation
document.addEventListener('DOMContentLoaded', function() {
  // Auto-generate on page load for demonstration
  setTimeout(() => generateInvestorPlan(), 500);
});
</script>
