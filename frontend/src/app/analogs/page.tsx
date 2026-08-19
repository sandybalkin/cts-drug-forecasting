'use client';

import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import { Database, Search, Filter, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import { fetchAnalogsCatalog, fetchFormOptions } from '@/lib/api';
import { AnalogCatalogProduct } from '@/lib/types';

export default function AnalogsPage() {
  const [search, setSearch] = useState('');
  const [selectedTA, setSelectedTA] = useState<string>('All');
  const [options, setOptions] = useState<string[]>([]);
  
  const [analogs, setAnalogs] = useState<AnalogCatalogProduct[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const pageSize = 12;

  useEffect(() => {
    fetchFormOptions()
      .then((res) => setOptions(['All', ...res.therapeutic_areas]))
      .catch(() => setOptions(['All', 'Cardiology', 'Oncology', 'Neurology', 'Immunology']));
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchAnalogsCatalog(search, selectedTA)
      .then((res) => {
        setAnalogs(res.analogs);
        setTotalCount(res.total);
        setPage(1);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [search, selectedTA]);

  const totalPages = Math.ceil(analogs.length / pageSize) || 1;
  const paginated = analogs.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="flex-1 flex flex-col">
      <Header
        title={`Historical Analog Catalog (${totalCount} Products)`}
        subtitle="Explore all 150 benchmarked pharmaceutical launch profiles & 52-week curves"
        backHref="/"
      />

      <div className="p-8 max-w-7xl mx-auto w-full space-y-6">
        {/* Search & Filter Header Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search product ID, indication, active ingredient, MoA across 150 analogs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={selectedTA}
              onChange={(e) => setSelectedTA(e.target.value)}
              className="px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              {options.map((ta) => (
                <option key={ta} value={ta}>{ta}</option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 space-y-3 text-slate-500">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-semibold">Loading 150 historical analog profiles...</p>
          </div>
        ) : paginated.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-500">
            <Database className="w-10 h-10 mx-auto mb-2 text-slate-300" />
            <p className="text-sm font-bold text-slate-700">No analog products match your search</p>
            <p className="text-xs text-slate-400 mt-1">Try clearing filters or searching another keyword</p>
          </div>
        ) : (
          <>
            {/* Analogs 150 Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {paginated.map((item) => (
                <div key={item.product_id} className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4 hover:border-blue-400 transition-all flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 font-black flex items-center justify-center text-xs border border-blue-200/60 shadow-2xs">
                          {item.product_id}
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 text-sm">{item.product_id}</h4>
                          <span className="inline-block text-[11px] font-semibold text-blue-600">
                            {item.therapeutic_area}
                          </span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        {item.route_of_administration}
                      </span>
                    </div>

                    <div className="space-y-2 text-xs text-slate-600">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Indication:</span>
                        <span className="font-semibold text-slate-800 text-right">{item.indication}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Active Ingredient:</span>
                        <span className="font-semibold text-slate-800 text-right">{item.active_ingredient}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Class:</span>
                        <span className="font-medium text-slate-700 text-right max-w-[180px] truncate">{item.pharmacological_class}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Addressable Pop:</span>
                        <span className="font-mono font-bold text-slate-900">{Number(item.addressable_population).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Competition Index:</span>
                        <span className="font-semibold text-slate-800">{item.competition_level} / 10</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-emerald-600 font-semibold">
                    <span>Observed 52w Rx Vector Ready</span>
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium">
                Showing {((page - 1) * pageSize) + 1} - {Math.min(page * pageSize, analogs.length)} of {analogs.length} analogs
              </span>

              <div className="flex items-center gap-2">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                  className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-bold text-slate-800 px-2">
                  Page {page} of {totalPages}
                </span>
                <button
                  disabled={page === totalPages}
                  onClick={() => setPage(page + 1)}
                  className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
