import React, { useState, useEffect } from 'react';
import { 
  Calculator, RefreshCw, DollarSign, TrendingDown, Calendar, Info, AlertCircle,
  CheckCircle, Wallet, Landmark, Percent, Coins, Users, ShieldCheck, Clock
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  ReferenceLine 
} from 'recharts';
import { calculateContract, formatMoney, formatMillions, ContractData, CalculationResult, YearlyData } from './utils/calculations';
import { InfoTooltip } from './components/InfoTooltip';

const CustomLegend = (props: any) => {
  const { payload } = props;
  return (
    <div className="flex flex-wrap justify-center items-center gap-6 mt-4 select-none">
      {payload.map((entry: any, index: number) => (
        <div key={`item-${index}`} className="flex items-center gap-2 text-sm text-slate-600 font-medium">
          {entry.value === 'Contract Ends' ? (
            <div className="flex items-center justify-center w-8 h-4">
               <div className="w-full border-t-2 border-red-500 border-dashed" />
            </div>
          ) : (
            <div 
              className="w-3 h-3 rounded-[1px]" 
              style={{ backgroundColor: entry.color }} 
            />
          )}
          <span>{entry.value}</span>
        </div>
      ))}
    </div>
  );
};

const FundingDetailCard = ({ icon, title, tag, children }: { icon: React.ReactNode, title: string, tag: string, children?: React.ReactNode }) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
    <div className="flex justify-between items-start mb-3">
      <div className="flex items-center gap-3">
        {/* <div className="p-2 bg-slate-100 text-slate-600 rounded-lg">{icon}</div> */}
        <h5 className="font-bold text-slate-900 text-lg">{title}</h5>
      </div>
      <span className="text-[10px] font-semibold bg-slate-100 text-slate-500 px-2 py-1 rounded uppercase tracking-wide">{tag}</span>
    </div>
    <div className="text-sm text-slate-600 leading-relaxed">
      {children}
    </div>
  </div>
);

const FundingRules = () => {
  return (
    <div className="space-y-6 mt-8">
      <h3 className="text-xl font-bold text-slate-800 px-1">Funding & Escrow Rules</h3>
      
      {/* Timeline Card */}
      <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200">
        <h4 className="text-lg font-bold text-slate-800 mb-8">Funding Deadline Timeline</h4>
        <div className="relative border-l-2 border-blue-100 ml-3 space-y-10 pl-8 py-2">
          
          {/* Year 0 */}
          <div className="relative">
            <div className="absolute -left-[39px] top-1 w-5 h-5 rounded-full bg-blue-500 border-4 border-white shadow-sm box-content"></div>
            <span className="text-xs font-bold text-blue-600 tracking-wider uppercase mb-1 block">Year 0</span>
            <h5 className="font-bold text-slate-900 text-lg">Contract Execution</h5>
            <p className="text-sm text-slate-600 mt-1">Player and Club agree to deferred compensation terms.</p>
          </div>

          {/* Year 1 */}
          <div className="relative">
            <div className="absolute -left-[39px] top-1 w-5 h-5 rounded-full bg-blue-500 border-4 border-white shadow-sm box-content"></div>
            <span className="text-xs font-bold text-blue-600 tracking-wider uppercase mb-1 block">Year 1</span>
            <h5 className="font-bold text-slate-900 text-lg">Season Played</h5>
            <p className="text-sm text-slate-600 mt-1">The championship season in which the deferred compensation is earned.</p>
          </div>

          {/* Year 2 */}
          <div className="relative">
            <div className="absolute -left-[39px] top-1 w-5 h-5 rounded-full bg-blue-300 border-4 border-white shadow-sm box-content"></div>
            <span className="text-xs font-bold text-blue-500 tracking-wider uppercase mb-1 block">Year 2 (July 1)</span>
            <h5 className="font-bold text-slate-800 text-lg">First July 1</h5>
            <p className="text-sm text-slate-600 mt-1">First July 1st following the season earned. No funding required yet.</p>
          </div>

          {/* Year 3 */}
          <div className="relative">
            <div className="absolute -left-[39px] top-1 w-5 h-5 rounded-full bg-blue-600 border-4 border-white shadow-sm box-content"></div>
            <span className="text-xs font-bold text-blue-700 tracking-wider uppercase mb-1 block">Year 3 (Second July 1)</span>
            <h5 className="font-bold text-slate-900 text-lg">Funding Deadline</h5>
            <p className="text-sm text-slate-600 mt-1">The deferred obligation must be fully funded by the Club by this date.</p>
          </div>
        </div>
      </div>

      {/* Info Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-blue-50/50 p-6 rounded-xl border border-blue-100 hover:shadow-sm transition-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><Calendar size={20} /></div>
            <h4 className="font-bold text-slate-900 text-lg">The Deadline</h4>
          </div>
          <p className="text-sm text-slate-700 leading-relaxed">
            Funding must occur on or before the <strong>second July 1</strong> following the championship season in which the deferred compensation is earned.
          </p>
        </div>
        <div className="bg-green-50/50 p-6 rounded-xl border border-green-100 hover:shadow-sm transition-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-green-100 text-green-600 rounded-lg"><Wallet size={20} /></div>
            <h4 className="font-bold text-slate-900 text-lg">No Limits</h4>
          </div>
          <p className="text-sm text-slate-700 leading-relaxed">
            There are no limitations on either the amount of deferred compensation or the percentage of total compensation attributable to deferred compensation for which a Uniform Player’s Contract may provide.
          </p>
        </div>
      </div>

      {/* Detailed Rules List */}
      <div className="space-y-4">
        <FundingDetailCard 
          icon={<Landmark size={18} />} 
          title="Funding Requirement" 
          tag="Article XVI"
        >
          Deferred compensation obligations incurred in a Contract executed on or after September 30, 2002 must be fully funded by the Club. The funding amount must be equal to the present value of the total deferred compensation obligation.
        </FundingDetailCard>

        <FundingDetailCard 
          icon={<Percent size={18} />} 
          title="Calculation of Present Value" 
          tag="Article XVI"
        >
          Full funding of the present value of deferred compensation obligations means the Club must fund the current present value of the outstanding deferred payments, discounted by 5% annually. <br/><br/>
          <span className="text-slate-500 text-xs">Note: If the prime interest rate is 7% or higher, the parties may agree to amend this discount rate.</span>
        </FundingDetailCard>

        <FundingDetailCard 
          icon={<Coins size={18} />} 
          title="Nature of Funded Assets" 
          tag="Article XVI"
        >
          The amount funded must be maintained in the form of unencumbered assets comprising:
          <ul className="list-disc pl-5 mt-2 space-y-1 text-slate-600">
            <li>Cash</li>
            <li>Cash equivalents</li>
            <li>Registered and unrestricted readily marketable securities</li>
          </ul>
          <p className="mt-2">Unless the Club obtains the Parties' prior written authorization of an alternative form.</p>
        </FundingDetailCard>

        <FundingDetailCard 
          icon={<Users size={18} />} 
          title="Creditor Access" 
          tag="Article XVI"
        >
          Crucially, while the funds must be exclusively for the purpose of satisfying the deferred obligation, the agreement specifies that "such amount(s) funded are subject to the claims of the Club's general creditors." This differs from a bankruptcy-remote escrow.
        </FundingDetailCard>

        <div className="bg-amber-50 p-5 rounded-lg border border-amber-100">
          <div className="flex justify-between items-start mb-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-amber-100 text-amber-600 rounded-md"><ShieldCheck size={16} /></div>
              <h5 className="font-bold text-amber-900">Historical Deductible</h5>
            </div>
          </div>
          <p className="text-sm text-amber-800 leading-relaxed">
            For contracts executed before December 11, 2011, Clubs are entitled to an annual deductible amount of deferred compensation which need not be funded. This deductible is the lesser of $2,000,000 or the present value of the total deferred compensation obligations owed.
          </p>
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  // Default to a "Shohei Ohtani" style structure for initial state
  const [formData, setFormData] = useState<ContractData>({
    totalValue: 700000000,
    years: 10,
    deferralAmount: 680000000,
    deferralStartYear: 1, // Starts 1 year after contract ends
    payoutDuration: 10,
    interestRate: 4.43 // Approximate Federal Mid-Term Rate at time of Ohtani deal
  });

  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [results, setResults] = useState<CalculationResult | null>(null);

  useEffect(() => {
    // Only calculate if there are no blocking errors
    if (Object.keys(errors).length === 0) {
      const res = calculateContract(formData);
      setResults(res);
    }
  }, [formData, errors]);

  const validate = (name: string, value: number, currentData: ContractData) => {
    const newErrors = { ...errors };
    const dataToCheck = { ...currentData, [name]: value };

    // Clean up previous error for this field
    delete newErrors[name];

    // Specific Validations
    
    // 1. Total Value vs Deferral Amount Check
    if (name === 'totalValue' || name === 'deferralAmount') {
      if (dataToCheck.deferralAmount > dataToCheck.totalValue) {
        newErrors.deferralAmount = "Deferral cannot exceed Total Value";
      } else {
        delete newErrors.deferralAmount;
      }
    }

    // 2. Years check (Must be > 0 to avoid division by zero)
    if (name === 'years' && value < 1) {
      newErrors.years = "Contract length must be at least 1 year";
    } else {
      delete newErrors.years;
    }

    // 3. Payout Duration check (Must be > 0)
    if (name === 'payoutDuration' && value < 1) {
      newErrors.payoutDuration = "Payout must take at least 1 year";
    } else {
      delete newErrors.payoutDuration;
    }

    setErrors(newErrors);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Remove commas to parse the number
    let rawValue = value.replace(/,/g, '');
    
    // Prevent negative signs
    rawValue = rawValue.replace(/-/g, '');

    // Allow empty input to act as 0 (temporarily for UI) or handle partial edits
    if (rawValue === '') {
      const newData = { ...formData, [name]: 0 };
      setFormData(newData);
      validate(name, 0, formData);
      return;
    }

    // Only update if it's a valid number
    if (!isNaN(Number(rawValue))) {
      const numValue = parseFloat(rawValue);
      const newData = { ...formData, [name]: numValue };
      
      setFormData(newData);
      validate(name, numValue, formData);
    }
  };

  const loadScenario = (scenario: 'ohtani' | 'scherzer' | 'standard') => {
    setErrors({}); // Clear errors on load
    if (scenario === 'ohtani') {
      setFormData({
        totalValue: 700_000_000,
        years: 10,
        deferralAmount: 680_000_000,
        deferralStartYear: 1,
        payoutDuration: 10,
        interestRate: 4.43
      });
    } else if (scenario === 'scherzer') {
      // Modeled roughly after Scherzer's Nats deal: $210M, 7 years, $105M deferred
      setFormData({
        totalValue: 210_000_000,
        years: 7,
        deferralAmount: 105_000_000,
        deferralStartYear: 1,
        payoutDuration: 7,
        interestRate: 2.5 // Historic rate approx
      });
    } else {
      setFormData({
        totalValue: 100_000_000,
        years: 5,
        deferralAmount: 0,
        deferralStartYear: 1,
        payoutDuration: 5,
        interestRate: 4.5
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-12">
      {/* Header */}
      <header className="bg-slate-900 text-white pt-8 pb-12 shadow-lg">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center gap-3 mb-2">
            <Calculator className="w-8 h-8 text-blue-400" />
            <h1 className="text-2xl font-bold">MLB Deferred Contract Calculator</h1>
          </div>
          <p className="text-slate-400 max-w-2xl">
            Calculate the Competitive Balance Tax (Luxury Tax) implications of deferred money in MLB contracts 
            based on Article XXIII of the Collective Bargaining Agreement.
          </p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 -mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Inputs */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-slate-800">Contract Terms</h2>
                <div className="flex gap-2">
                  <button 
                    onClick={() => loadScenario('standard')}
                    className="text-xs bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded transition-colors"
                  >
                    Reset
                  </button>
                  <button 
                    onClick={() => loadScenario('ohtani')}
                    className="text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 px-2 py-1 rounded transition-colors border border-blue-200"
                  >
                    Load "The Ohtani"
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">
                    Total Contract Value ($)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 font-semibold text-lg">$</span>
                    <input 
                      type="text" 
                      name="totalValue"
                      value={formData.totalValue.toLocaleString()}
                      onChange={handleInputChange}
                      className={`w-full pl-8 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-mono text-lg font-medium bg-slate-700 text-white placeholder-slate-400 ${errors.totalValue ? 'border-red-500 focus:ring-red-500' : 'border-slate-600'}`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">
                      Length (Years)
                    </label>
                    <input 
                      type="number" 
                      name="years"
                      min="1"
                      value={formData.years}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-lg font-medium bg-slate-700 text-white placeholder-slate-400 ${errors.years ? 'border-red-500 focus:ring-red-500' : 'border-slate-600'}`}
                    />
                    {errors.years && <p className="text-red-500 text-xs mt-1">{errors.years}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1 flex items-center">
                      Interest Rate (%)
                      <InfoTooltip text="The Federal Mid-Term Rate (Imputed Loan Interest Rate) as defined in Article XXIII. Used to discount future payments." />
                    </label>
                    <input 
                      type="number" 
                      name="interestRate"
                      min="0"
                      step="0.01"
                      value={formData.interestRate}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-lg font-medium bg-slate-700 text-white placeholder-slate-400"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <h3 className="text-sm font-semibold text-slate-800 mb-3">Deferrals</h3>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-600 mb-1">
                      Total Amount Deferred ($)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 font-semibold text-lg">$</span>
                      <input 
                        type="text" 
                        name="deferralAmount"
                        value={formData.deferralAmount.toLocaleString()}
                        onChange={handleInputChange}
                        className={`w-full pl-8 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-mono text-lg font-medium bg-slate-700 text-white placeholder-slate-400 ${errors.deferralAmount ? 'border-red-500 focus:ring-red-500' : 'border-slate-600'}`}
                      />
                    </div>
                    {errors.deferralAmount ? (
                       <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                         <AlertCircle size={12} /> {errors.deferralAmount}
                       </p>
                    ) : (
                      <p className="text-xs text-slate-500 mt-1">
                        {formData.totalValue > 0 
                          ? ((formData.deferralAmount / formData.totalValue) * 100).toFixed(1) 
                          : 0}% of total contract
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-600 mb-1 flex items-center">
                        Delay (Years)
                        <InfoTooltip text="Years after the contract expires before deferred payments begin." />
                      </label>
                      <input 
                        type="number" 
                        name="deferralStartYear"
                        min="0"
                        value={formData.deferralStartYear}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-lg font-medium bg-slate-700 text-white placeholder-slate-400"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-600 mb-1">
                        Payout Period
                      </label>
                      <input 
                        type="number" 
                        name="payoutDuration"
                        min="1"
                        value={formData.payoutDuration}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-lg font-medium bg-slate-700 text-white placeholder-slate-400 ${errors.payoutDuration ? 'border-red-500 focus:ring-red-500' : 'border-slate-600'}`}
                      />
                      {errors.payoutDuration && <p className="text-red-500 text-xs mt-1">{errors.payoutDuration}</p>}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Methodology Card */}
            <div className="bg-blue-50 rounded-xl p-6 border border-blue-100 text-sm text-blue-900">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Info size={16} /> Calculation Methodology
              </h3>
              <p className="mb-2">
                The <strong>Competitive Balance Tax (CBT)</strong> hit is calculated by determining the Present Value (PV) of the deferred salary using the Federal Mid-Term Rate.
              </p>
              <p>
                According to the 2022-2026 Basic Agreement, deferred compensation is included in the Player's Salary in the year earned at its discounted present value.
              </p>
            </div>
          </div>

          {/* Right Column: Results */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Top Level Stats */}
            {results && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-slate-500">Nominal AAV</h3>
                    <DollarSign className="w-5 h-5 text-slate-300" />
                  </div>
                  <p className="text-3xl font-bold text-slate-900">{formatMillions(results.nominalAAV)}</p>
                  <p className="text-xs text-slate-500 mt-1">Actual dollars / years</p>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-blue-200 ring-4 ring-blue-50">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-bold text-blue-700">CBT AAV (Tax Hit)</h3>
                    <RefreshCw className="w-5 h-5 text-blue-500" />
                  </div>
                  <p className="text-3xl font-bold text-blue-600">{formatMillions(results.cbtAAV)}</p>
                  <p className="text-xs text-blue-400 mt-1">Discounted present value / years</p>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-slate-500">Total Present Value</h3>
                    <TrendingDown className="w-5 h-5 text-green-500" />
                  </div>
                  <p className="text-3xl font-bold text-slate-900">{formatMillions(results.totalPresentValue)}</p>
                  <p className="text-xs text-green-600 mt-1">
                    {results.effectiveDiscount.toFixed(1)}% discount on total value
                  </p>
                </div>
              </div>
            )}

            {/* Chart */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <h3 className="text-lg font-semibold text-slate-800 mb-6">Financial Timeline</h3>
              <div className="h-80 w-full">
                {results && (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart<YearlyData>
                      data={results.yearlyBreakdown}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis 
                        dataKey="label" 
                        tickFormatter={(val) => {
                          // Compact labels: "Year 1" -> "1", "Deferred 1" -> "D1"
                          if (val.startsWith('Year ')) return val.replace('Year ', '');
                          if (val.startsWith('Deferred ')) return val.replace('Deferred ', 'D');
                          return val;
                        }}
                        interval="preserveStartEnd" 
                        minTickGap={5}
                        tick={{fontSize: 11}}
                      />
                      <YAxis 
                        tickFormatter={(value) => `$${value / 1000000}M`}
                      />
                      <Tooltip 
                        formatter={(value: number) => formatMoney(value)}
                        labelStyle={{ color: '#1e293b', fontWeight: 'bold' }}
                      />
                      <Legend 
                        content={CustomLegend}
                        payload={[
                          { value: 'Cash Received', type: 'rect', color: '#94a3b8' },
                          { value: 'CBT Hit (Tax)', type: 'rect', color: '#3b82f6' },
                          { value: 'Contract Ends', type: 'line', color: 'red' }
                        ]}
                      />
                      <ReferenceLine x={`Year ${formData.years}`} stroke="red" strokeDasharray="3 3" />
                      <Bar<YearlyData>
                        dataKey="payoutReceived"
                        name="Cash Received"
                        fill="#94a3b8"
                        radius={[4, 4, 0, 0]}
                        animationDuration={1200}
                        animationEasing="ease-out"
                      />
                      <Bar<YearlyData>
                        dataKey="cbtValue"
                        name="CBT Hit (Tax)"
                        fill="#3b82f6"
                        radius={[4, 4, 0, 0]}
                        animationDuration={1200}
                        animationEasing="ease-out"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Detailed Table */}
            <div className="bg-white overflow-hidden rounded-xl shadow-sm border border-slate-200">
              <div className="px-6 py-4 border-b border-slate-100">
                <h3 className="font-semibold text-slate-800">Year-by-Year Breakdown</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3">Year</th>
                      <th className="px-6 py-3 text-right">Cash Salary</th>
                      <th className="px-6 py-3 text-right bg-blue-50/50 text-blue-800">CBT Hit</th>
                      <th className="px-6 py-3 text-right">Deferred Payout</th>
                      <th className="px-6 py-3 text-right">Annual Cash</th>
                      <th className="px-6 py-3 text-right font-bold">Cumulative Cash</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {results?.yearlyBreakdown.map((row) => (
                      <tr key={row.year} className="hover:bg-slate-50">
                        <td className="px-6 py-3 font-medium text-slate-700">{row.label}</td>
                        <td className="px-6 py-3 text-right text-slate-500">
                          {row.year <= formData.years ? formatMillions(row.cashPay) : '-'}
                        </td>
                        <td className="px-6 py-3 text-right font-medium bg-blue-50/30 text-blue-600">
                          {row.year <= formData.years ? formatMoney(row.cbtValue) : '-'}
                        </td>
                        <td className="px-6 py-3 text-right text-slate-500">
                          {row.year > formData.years && row.payoutReceived > 0 ? formatMillions(row.payoutReceived) : '-'}
                        </td>
                        <td className="px-6 py-3 text-right text-slate-800">
                          {formatMoney(row.payoutReceived)}
                        </td>
                        <td className="px-6 py-3 text-right font-bold text-emerald-600">
                          {formatMoney(row.cumulativeReceived)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Funding Rules Component */}
            <FundingRules />

          </div>
        </div>
      </main>
    </div>
  );
};

export default App;