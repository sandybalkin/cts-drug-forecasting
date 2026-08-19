'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { DEFAULT_PRODUCT_INPUTS, fetchFormOptions, runForecast } from '@/lib/api';
import { ProductInputs, FormOptions } from '@/lib/types';
import { 
  PlusCircle, 
  Sparkles, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle2, 
  Layers, 
  Sliders, 
  Building2, 
  FileCheck,
  AlertCircle,
  BarChart3
} from 'lucide-react';

export default function NewForecastPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [options, setOptions] = useState<FormOptions | null>(null);
  const [formData, setFormData] = useState<ProductInputs>(DEFAULT_PRODUCT_INPUTS);
  const [topK, setTopK] = useState(3);
  const [wAnalog, setWAnalog] = useState(0.10); // 10% Analog, 90% Bass

  useEffect(() => {
    fetchFormOptions()
      .then(setOptions)
      .catch(() => console.log('Using default options'));
  }, []);

  const handleChange = (field: keyof ProductInputs, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePreFill = () => {
    setFormData(DEFAULT_PRODUCT_INPUTS);
    setTopK(3);
    setWAnalog(0.10);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step < 5) {
      setStep(step + 1);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payload = {
        product_inputs: formData,
        top_k: topK,
        w_analog: wAnalog
      };
      
      const result = await runForecast(payload);
      
      const encodedData = encodeURIComponent(JSON.stringify(payload));
      
      sessionStorage.setItem('latest_forecast_payload', JSON.stringify(payload));
      sessionStorage.setItem('latest_forecast_result', JSON.stringify(result));
      
      router.push(`/forecast/results?data=${encodedData}`);
    } catch (err: any) {
      setError(err.message || 'Failed to generate forecast');
      setLoading(false);
    }
  };

  const sampleTherapeuticAreas = options?.therapeutic_areas || [
    'Cardiology', 'Oncology', 'Neurology', 'Endocrinology', 'Immunology', 'Infectious Disease', 'Gastroenterology', 'Respiratory', 'Hematology', 'Dermatology'
  ];

  const sampleIndications = options?.indications || [
    'Atrial Fibrillation', 'Hypertension', 'Type 2 Diabetes', 'Non-Small Cell Lung Cancer', 'Rheumatoid Arthritis', 'Major Depressive Disorder', 'Heart Failure', 'Plaque Psoriasis', 'Multiple Sclerosis'
  ];

  const sampleActiveIngredients = [
    'Apixaban', 'Pembrolizumab', 'Empagliflozin', 'Semaglutide', 'Adalimumab', 'Rivaroxaban', 'Dapagliflozin', 'Nivolumab', 'Sitagliptin', 'Metformin'
  ];

  const samplePharmClasses = options?.pharmacological_classes || [
    'Factor Xa Inhibitor', 'SGLT2 Inhibitor', 'PD-1 Inhibitor', 'GLP-1 Receptor Agonist', 'TNF Inhibitor', 'Statins', 'Beta Blocker', 'DPP-4 Inhibitor'
  ];

  const sampleMoAs = [
    'Directly inhibits Factor Xa, reducing thrombin generation',
    'Blocks PD-1 receptor boosting T-cell anti-tumor immunity',
    'Inhibits SGLT2 in renal tubules reducing glucose reabsorption',
    'GLP-1 receptor agonist enhancing insulin secretion',
    'Binds specifically to TNF-alpha blocking inflammatory cascade',
    'Inhibits HMG-CoA reductase lowering cholesterol synthesis'
  ];

  const sampleRoutes = options?.routes_of_administration || [
    'Oral', 'Injectable', 'Intravenous', 'Subcutaneous', 'Topical', 'Inhalation'
  ];

  const samplePopulations = options?.target_populations || [
    'Adult', 'Pediatric', 'Geriatric', 'All Ages'
  ];

  return (
    <div className="flex-1 flex flex-col">
      <Header
        title="Create New Launch Forecast"
        subtitle="Configure clinical, commercial, and methodology parameters"
        backHref="/"
      />

      <div className="p-8 max-w-4xl mx-auto w-full space-y-6">
        {/* Wizard Step Progress Header (5 Steps) */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between overflow-x-auto">
          {[
            { id: 1, label: '1. Identity' },
            { id: 2, label: '2. Access' },
            { id: 3, label: '3. Drivers' },
            { id: 4, label: '4. Hybrid Weights' },
            { id: 5, label: '5. Review & Run' },
          ].map((s) => (
            <div key={s.id} className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setStep(s.id)}
                className={`w-7 h-7 rounded-full font-bold text-xs flex items-center justify-center transition-all ${
                  step === s.id
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : step > s.id
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                {step > s.id ? <CheckCircle2 className="w-4 h-4" /> : s.id}
              </button>
              <span className={`text-xs font-semibold ${step === s.id ? 'text-slate-900' : 'text-slate-500'}`}>
                {s.label}
              </span>
              {s.id < 5 && <div className="w-6 h-px bg-slate-200 hidden sm:block mx-1" />}
            </div>
          ))}

          <button
            type="button"
            onClick={handlePreFill}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors shrink-0 ml-2"
          >
            <Sparkles className="w-3.5 h-3.5" /> Pre-fill Apixaban
          </button>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Wizard Form */}
        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl border border-slate-200/80 shadow-xs space-y-8">
          {/* STEP 1: Clinical & Product Metadata with Recommendation Dropdowns */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Step 1: Clinical & Product Identity</h3>
                <p className="text-xs text-slate-500">Select recommended feature dropdown classifications or enter candidate parameters</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Product Candidate ID</label>
                  <input
                    type="text"
                    value={formData.product_id}
                    onChange={(e) => handleChange('product_id', e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Product Candidate Name</label>
                  <input
                    type="text"
                    value={formData.product_name}
                    onChange={(e) => handleChange('product_name', e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                {/* Therapeutic Area Dropdown Recommendation */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                    <span>Therapeutic Area</span>
                    <span className="text-[10px] text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-200">Recommended Dropdown</span>
                  </label>
                  <select
                    value={formData.therapeutic_area}
                    onChange={(e) => handleChange('therapeutic_area', e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-medium shadow-xs"
                    required
                  >
                    {sampleTherapeuticAreas.map((ta) => (
                      <option key={ta} value={ta}>{ta}</option>
                    ))}
                  </select>
                </div>

                {/* Primary Indication Dropdown Recommendation */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                    <span>Primary Indication</span>
                    <span className="text-[10px] text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-200">Recommended Dropdown</span>
                  </label>
                  <select
                    value={formData.indication}
                    onChange={(e) => handleChange('indication', e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-medium shadow-xs"
                    required
                  >
                    {sampleIndications.map((ind) => (
                      <option key={ind} value={ind}>{ind}</option>
                    ))}
                  </select>
                </div>

                {/* Active Ingredient Dropdown Recommendation */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                    <span>Active Ingredient</span>
                    <span className="text-[10px] text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-200">Recommended Dropdown</span>
                  </label>
                  <select
                    value={formData.active_ingredient}
                    onChange={(e) => handleChange('active_ingredient', e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-medium shadow-xs"
                    required
                  >
                    {sampleActiveIngredients.map((ai) => (
                      <option key={ai} value={ai}>{ai}</option>
                    ))}
                  </select>
                </div>

                {/* Pharmacological Class Dropdown Recommendation */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                    <span>Pharmacological Class</span>
                    <span className="text-[10px] text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-200">Recommended Dropdown</span>
                  </label>
                  <select
                    value={formData.pharmacological_class}
                    onChange={(e) => handleChange('pharmacological_class', e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-medium shadow-xs"
                    required
                  >
                    {samplePharmClasses.map((pc) => (
                      <option key={pc} value={pc}>{pc}</option>
                    ))}
                  </select>
                </div>

                {/* Mechanism of Action (MoA) Dropdown Recommendation */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                    <span>Mechanism of Action (MoA)</span>
                    <span className="text-[10px] text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-200">Recommended Dropdown</span>
                  </label>
                  <select
                    value={formData.mechanism_of_action}
                    onChange={(e) => handleChange('mechanism_of_action', e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-medium shadow-xs"
                    required
                  >
                    {sampleMoAs.map((moa) => (
                      <option key={moa} value={moa}>{moa}</option>
                    ))}
                  </select>
                </div>

                {/* Route of Administration Dropdown Recommendation */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                    <span>Route of Administration</span>
                    <span className="text-[10px] text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-200">Recommended Dropdown</span>
                  </label>
                  <select
                    value={formData.route_of_administration}
                    onChange={(e) => handleChange('route_of_administration', e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-medium shadow-xs"
                    required
                  >
                    {sampleRoutes.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>

                {/* Target Population Dropdown Recommendation */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                    <span>Target Population</span>
                    <span className="text-[10px] text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-200">Recommended Dropdown</span>
                  </label>
                  <select
                    value={formData.target_population}
                    onChange={(e) => handleChange('target_population', e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-medium shadow-xs"
                    required
                  >
                    {samplePopulations.map((tp) => (
                      <option key={tp} value={tp}>{tp}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Market & Access Factors */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Step 2: Market Potential & Access Factors</h3>
                <p className="text-xs text-slate-500">Addressable population and market potential (M = Population × Penetration)</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Addressable Population</label>
                  <input
                    type="number"
                    value={formData.addressable_population}
                    onChange={(e) => handleChange('addressable_population', parseFloat(e.target.value) || 0)}
                    className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                    required
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Total diagnosed patient count in target market</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Estimated Peak Penetration Rate ({(formData.estimated_penetration * 100).toFixed(1)}%)
                  </label>
                  <input
                    type="range"
                    min="0.01"
                    max="1.0"
                    step="0.01"
                    value={formData.estimated_penetration}
                    onChange={(e) => handleChange('estimated_penetration', parseFloat(e.target.value))}
                    className="w-full accent-blue-600"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                    <span>1%</span>
                    <span className="font-bold text-blue-600">{(formData.estimated_penetration * 100).toFixed(1)}%</span>
                    <span>100%</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200/80 md:col-span-2 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-blue-950">Derived Market Potential (M)</p>
                    <p className="text-[11px] text-blue-700">M = Addressable Population × Estimated Penetration</p>
                  </div>
                  <div className="text-right font-mono font-black text-xl text-blue-600">
                    {Math.round(formData.addressable_population * formData.estimated_penetration).toLocaleString()} Rx
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Competition Level Index ({formData.competition_level} / 10)
                  </label>
                  <input
                    type="range"
                    min="1.0"
                    max="10.0"
                    step="0.1"
                    value={formData.competition_level}
                    onChange={(e) => handleChange('competition_level', parseFloat(e.target.value))}
                    className="w-full accent-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Relative Price Index ({formData.relative_price_index}x vs Market Avg)
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    value={formData.relative_price_index}
                    onChange={(e) => handleChange('relative_price_index', parseFloat(e.target.value) || 1.0)}
                    className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Market Access Level ({formData.market_access_level} / 10)
                  </label>
                  <input
                    type="range"
                    min="1.0"
                    max="10.0"
                    step="0.1"
                    value={formData.market_access_level}
                    onChange={(e) => handleChange('market_access_level', parseFloat(e.target.value))}
                    className="w-full accent-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Clinical Evidence Strength ({formData.clinical_evidence_strength} / 10)
                  </label>
                  <input
                    type="range"
                    min="1.0"
                    max="10.0"
                    step="0.1"
                    value={formData.clinical_evidence_strength}
                    onChange={(e) => handleChange('clinical_evidence_strength', parseFloat(e.target.value))}
                    className="w-full accent-blue-600"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Launch Drivers */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Step 3: Commercial & Launch Drivers</h3>
                <p className="text-xs text-slate-500">Variables driving Bass diffusion coefficients (p: Innovation, q: Imitation)</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="p-4 rounded-xl bg-purple-50/50 border border-purple-200/60 space-y-4">
                  <h4 className="font-bold text-xs text-purple-900 uppercase tracking-wider">Innovation Rate (p) Drivers</h4>
                  
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Marketing Awareness ({formData.marketing_awareness} / 10)
                    </label>
                    <input
                      type="range"
                      min="1.0"
                      max="10.0"
                      step="0.1"
                      value={formData.marketing_awareness}
                      onChange={(e) => handleChange('marketing_awareness', parseFloat(e.target.value))}
                      className="w-full accent-purple-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Launch Strength ({formData.launch_strength} / 10)
                    </label>
                    <input
                      type="range"
                      min="1.0"
                      max="10.0"
                      step="0.1"
                      value={formData.launch_strength}
                      onChange={(e) => handleChange('launch_strength', parseFloat(e.target.value))}
                      className="w-full accent-purple-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Physician Awareness ({formData.physician_awareness} / 10)
                    </label>
                    <input
                      type="range"
                      min="1.0"
                      max="10.0"
                      step="0.1"
                      value={formData.physician_awareness}
                      onChange={(e) => handleChange('physician_awareness', parseFloat(e.target.value))}
                      className="w-full accent-purple-600"
                    />
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-indigo-50/50 border border-indigo-200/60 space-y-4">
                  <h4 className="font-bold text-xs text-indigo-900 uppercase tracking-wider">Imitation Rate (q) Drivers</h4>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Treatment Familiarity ({formData.treatment_familiarity} / 10)
                    </label>
                    <input
                      type="range"
                      min="1.0"
                      max="10.0"
                      step="0.1"
                      value={formData.treatment_familiarity}
                      onChange={(e) => handleChange('treatment_familiarity', parseFloat(e.target.value))}
                      className="w-full accent-indigo-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Clinical Evidence Strength ({formData.clinical_evidence_strength} / 10)
                    </label>
                    <input
                      type="range"
                      min="1.0"
                      max="10.0"
                      step="0.1"
                      value={formData.clinical_evidence_strength}
                      onChange={(e) => handleChange('clinical_evidence_strength', parseFloat(e.target.value))}
                      className="w-full accent-indigo-600"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Hybrid Model Weights & Analog Selection */}
          {step === 4 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Step 4: Hybrid Weighting & Analog Selection</h3>
                <p className="text-xs text-slate-500">Configure weighting blend between Gower analogs and Bass diffusion model</p>
              </div>

              <div className="space-y-6">
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-slate-900 flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-blue-600" />
                      Top-K Historical Analogs
                    </label>
                    <span className="font-black text-blue-600 font-mono text-sm">{topK} Analogs</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    step="1"
                    value={topK}
                    onChange={(e) => setTopK(parseInt(e.target.value))}
                    className="w-full accent-blue-600"
                  />
                  <p className="text-[11px] text-slate-500">
                    Selects top {topK} products with highest Gower similarity scores out of 150 historical launch curves stored in PostgreSQL 17.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-slate-900 flex items-center gap-2">
                      <Layers className="w-4 h-4 text-indigo-600" />
                      Hybrid Forecast Curve Weighting
                    </label>
                    <span className="font-black text-indigo-600 font-mono text-sm">
                      {Math.round(wAnalog * 100)}% Analog / {Math.round((1 - wAnalog) * 100)}% Bass
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.0"
                    max="1.0"
                    step="0.05"
                    value={wAnalog}
                    onChange={(e) => setWAnalog(parseFloat(e.target.value))}
                    className="w-full accent-indigo-600"
                  />
                  <div className="flex justify-between text-[11px] text-slate-500 font-medium">
                    <span>100% Bass Diffusion</span>
                    <span className="font-bold text-indigo-700">Strict Constraint: Analog Weight + Bass Weight = 100%</span>
                    <span>100% Historical Analog</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: Review Candidate & Model Execution */}
          {step === 5 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Step 5: Review & Execute Forecast</h3>
                <p className="text-xs text-slate-500">Verify all candidate parameters before executing the 52-week hybrid launch engine</p>
              </div>

              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="text-slate-500 block text-[11px]">Product Candidate</span>
                    <span className="font-bold text-slate-900">{formData.product_name} ({formData.product_id})</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Therapeutic Area</span>
                    <span className="font-bold text-slate-900">{formData.therapeutic_area}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Indication</span>
                    <span className="font-bold text-slate-900">{formData.indication}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Addressable Population</span>
                    <span className="font-mono font-bold text-slate-900">{formData.addressable_population.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Peak Penetration</span>
                    <span className="font-mono font-bold text-blue-600">{(formData.estimated_penetration * 100).toFixed(1)}%</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Derived Market Potential (M)</span>
                    <span className="font-mono font-bold text-blue-600">{Math.round(formData.addressable_population * formData.estimated_penetration).toLocaleString()} Rx</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Top-K Analogs</span>
                    <span className="font-bold text-indigo-600">{topK} Analogs</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Hybrid Model Weight</span>
                    <span className="font-bold text-indigo-600">{Math.round(wAnalog * 100)}% Analog / {Math.round((1 - wAnalog) * 100)}% Bass</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Form Wizard Action Bar */}
          <div className="pt-6 border-t border-slate-200 flex items-center justify-between">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Previous Step
              </button>
            ) : <div />}

            {step < 5 ? (
              <button
                type="button"
                onClick={() => setStep(step + 1)}
                className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-500/20 transition-all"
              >
                Next Step <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-6 py-3 text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 rounded-xl shadow-lg shadow-blue-600/30 transition-all transform hover:-translate-y-0.5 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Running Forecasting Engine...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" /> Calculate 52-Week Forecast
                  </>
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
