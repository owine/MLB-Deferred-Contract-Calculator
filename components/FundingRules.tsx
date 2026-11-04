import React from 'react';
import { Calendar, Wallet, Landmark, Percent, Coins, Users, ShieldCheck } from 'lucide-react';

// Article XVI funding rules (static copy, moved from App.tsx).
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

export const FundingRules = () => {
  return (
    <div className="space-y-6 mt-8">
      <h3 className="text-xl font-bold text-slate-800 px-1">Funding Rules (Article XVI)</h3>
      
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
          <span className="text-slate-500 text-xs">Note: if the prime rate at J.P. Morgan Chase Bank on the preceding November 1 is 7% or higher, the Parties shall meet and confer and may, with due notice to the Clubs, amend this discount rate effective the next July 1.</span>
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
          The funds must be used exclusively to satisfy the deferred obligation, yet Article XVI specifies that "such amount(s) funded are subject to the claims of the Club's general creditors."
        </FundingDetailCard>

        <div className="bg-amber-50 p-5 rounded-lg border border-amber-100">
          <div className="flex justify-between items-start mb-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-amber-100 text-amber-600 rounded-md"><ShieldCheck size={16} /></div>
              <h5 className="font-bold text-amber-900">Historical Deductible</h5>
            </div>
          </div>
          <p className="text-sm text-amber-800 leading-relaxed">
            For contracts executed before December 11, 2011, Clubs are entitled to an annual deductible amount of deferred compensation which need not be funded. This deductible is the lesser of $2,000,000 or the present value of the total deferred compensation owed under those contracts, and it applies to the aggregate of a Club's contracts from each Basic Agreement period, not to any one contract.
          </p>
        </div>
      </div>
    </div>
  );
};
