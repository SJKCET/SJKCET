import React, { useState, useEffect, useMemo } from 'react';
import Papa from 'papaparse';
import { 
  Search, 
  Filter, 
  CheckCircle2, 
  XCircle, 
  ChevronDown, 
  BarChart3, 
  Table as TableIcon,
  LayoutDashboard,
  GraduationCap,
  Users,
  Calendar
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { StudentWorkRecord, SheetType } from './types';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const SKOR_1_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQdEUyl3TWqo4uSrwJrfXH8ggkJSzZDto4_o_bFu1Cynwh9F8VyJsRN2HsaYoFxeg/pub?output=csv&gid=2012769033";
const SKOR_2_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQdEUyl3TWqo4uSrwJrfXH8ggkJSzZDto4_o_bFu1Cynwh9F8VyJsRN2HsaYoFxeg/pub?output=csv&gid=762769879";

export default function App() {
  const [activeSheet, setActiveSheet] = useState<SheetType>('SKOR 1.0');
  const [data, setData] = useState<StudentWorkRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSubject, setSelectedSubject] = useState<string>("All");
  const [selectedClass, setSelectedClass] = useState<string>("All");
  const [viewMode, setViewMode] = useState<'dashboard' | 'table'>('dashboard');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const url = activeSheet === 'SKOR 1.0' ? SKOR_1_URL : SKOR_2_URL;
      
      Papa.parse(url, {
        download: true,
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          // Filter out the placeholder rows (SUBJEK 1, SUBJEK 2, etc.)
          const filteredData = (results.data as StudentWorkRecord[]).filter(row => 
            row.SUBJEK && !row.SUBJEK.startsWith("SUBJEK") && row.SUBJEK !== "-"
          );
          setData(filteredData);
          setLoading(false);
        },
        error: (error) => {
          console.error("Error parsing CSV:", error);
          setLoading(false);
        }
      });
    };

    fetchData();
  }, [activeSheet]);

  const subjects = useMemo(() => ["All", ...new Set(data.map(r => r.SUBJEK.replace(/\n/g, ' ')))], [data]);
  const classes = useMemo(() => ["All", ...new Set(data.map(r => r.KELAS))], [data]);

  const filteredData = useMemo(() => {
    return data.filter(row => {
      const matchesSearch = 
        row.SUBJEK.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row["GURU SUBJEK"].toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.KELAS.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesSubject = selectedSubject === "All" || row.SUBJEK.replace(/\n/g, ' ') === selectedSubject;
      const matchesClass = selectedClass === "All" || row.KELAS === selectedClass;

      return matchesSearch && matchesSubject && matchesClass;
    });
  }, [data, searchTerm, selectedSubject, selectedClass]);

  const stats = useMemo(() => {
    const total = data.length;
    const checked = data.filter(r => r["TELAH DIHANTAR / DISEMAK"].includes("TELAH")).length;
    const unchecked = total - checked;
    const completionRate = total > 0 ? (checked / total) * 100 : 0;

    return { total, checked, unchecked, completionRate };
  }, [data]);

  const subjectStats = useMemo(() => {
    const counts: Record<string, { total: number, checked: number }> = {};
    data.forEach(r => {
      const sub = r.SUBJEK.replace(/\n/g, ' ').split(' ').pop() || r.SUBJEK; // Get the Malay name usually
      if (!counts[sub]) counts[sub] = { total: 0, checked: 0 };
      counts[sub].total++;
      if (r["TELAH DIHANTAR / DISEMAK"].includes("TELAH")) counts[sub].checked++;
    });

    return Object.entries(counts).map(([name, val]) => ({
      name,
      total: val.total,
      checked: val.checked,
      rate: (val.checked / val.total) * 100
    })).sort((a, b) => b.total - a.total);
  }, [data]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600 font-medium animate-pulse">Memuatkan data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5] text-gray-900 font-sans">
      {/* Sidebar / Top Nav */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-600 p-2 rounded-lg">
                <GraduationCap className="text-white w-6 h-6" />
              </div>
              <h1 className="text-xl font-bold tracking-tight text-gray-900 hidden sm:block">
                Penyemakan Hasil Kerja Murid
              </h1>
              <h1 className="text-xl font-bold tracking-tight text-gray-900 sm:hidden">
                PHKM Dashboard
              </h1>
            </div>
            
            <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-xl">
              {(['SKOR 1.0', 'SKOR 2.0'] as SheetType[]).map((sheet) => (
                <button
                  key={sheet}
                  onClick={() => setActiveSheet(sheet)}
                  className={cn(
                    "px-4 py-1.5 text-sm font-medium rounded-lg transition-all",
                    activeSheet === sheet 
                      ? "bg-white text-indigo-600 shadow-sm" 
                      : "text-gray-500 hover:text-gray-700"
                  )}
                >
                  {sheet}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* View Toggle & Filters */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-gray-200 shadow-sm">
            <button
              onClick={() => setViewMode('dashboard')}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                viewMode === 'dashboard' ? "bg-indigo-50 text-indigo-600" : "text-gray-500 hover:bg-gray-50"
              )}
            >
              <LayoutDashboard size={18} />
              Dashboard
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                viewMode === 'table' ? "bg-indigo-50 text-indigo-600" : "text-gray-500 hover:bg-gray-50"
              )}
            >
              <TableIcon size={18} />
              Senarai Penuh
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:flex-none">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Cari subjek, guru, kelas..."
                className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full md:w-64 shadow-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex items-center gap-2">
              <select
                className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
              >
                {subjects.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <select
                className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
              >
                {classes.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
        </div>

        {viewMode === 'dashboard' ? (
          <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard 
                title="Jumlah Rekod" 
                value={stats.total} 
                icon={<Users className="text-blue-600" />} 
                color="blue"
              />
              <StatCard 
                title="Telah Disemak" 
                value={stats.checked} 
                icon={<CheckCircle2 className="text-emerald-600" />} 
                color="emerald"
                subtitle={`${stats.completionRate.toFixed(1)}% Selesai`}
              />
              <StatCard 
                title="Belum Disemak" 
                value={stats.unchecked} 
                icon={<XCircle className="text-rose-600" />} 
                color="rose"
              />
              <StatCard 
                title="Kadar Penyemakan" 
                value={`${stats.completionRate.toFixed(0)}%`} 
                icon={<BarChart3 className="text-amber-600" />} 
                color="amber"
              />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                  <BarChart3 size={20} className="text-indigo-600" />
                  Statistik Mengikut Subjek
                </h3>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={subjectStats} layout="vertical" margin={{ left: 40, right: 40 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                      <XAxis type="number" hide />
                      <YAxis 
                        dataKey="name" 
                        type="category" 
                        axisLine={false} 
                        tickLine={false}
                        width={120}
                        tick={{ fontSize: 12, fill: '#6b7280' }}
                      />
                      <Tooltip 
                        cursor={{ fill: '#f9fafb' }}
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      />
                      <Bar dataKey="total" fill="#e2e8f0" radius={[0, 4, 4, 0]} barSize={20} name="Jumlah" />
                      <Bar dataKey="checked" fill="#4f46e5" radius={[0, 4, 4, 0]} barSize={20} name="Disemak" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col">
                <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                  <CheckCircle2 size={20} className="text-emerald-600" />
                  Status Keseluruhan
                </h3>
                <div className="flex-1 flex flex-col items-center justify-center">
                  <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Disemak', value: stats.checked },
                            { name: 'Belum', value: stats.unchecked }
                          ]}
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          <Cell fill="#10b981" />
                          <Cell fill="#f43f5e" />
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="grid grid-cols-2 gap-8 mt-4 w-full px-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-emerald-600">{stats.checked}</p>
                      <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Disemak</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-rose-600">{stats.unchecked}</p>
                      <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Belum</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Table View */
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-bottom border-gray-200">
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Subjek</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Kelas</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Guru</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Penyelia</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tarikh</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Skor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredData.map((row, idx) => (
                    <tr key={idx} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900 whitespace-pre-line">
                          {row.SUBJEK}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {row.KELAS}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600 whitespace-pre-line">
                          {row["GURU SUBJEK"]}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-xs text-gray-500 whitespace-pre-line">
                          {row["PENYELIAAN OLEH"]}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {row["TELAH DIHANTAR / DISEMAK"].includes("TELAH") ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                            <CheckCircle2 size={12} />
                            Disemak
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800">
                            <XCircle size={12} />
                            Belum
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-500 flex items-center gap-1">
                          <Calendar size={14} />
                          {row["TARIKH PENYEMAKAN"]}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={cn(
                          "text-sm font-bold",
                          parseInt(row["JUMLAH SKOR"]) > 0 ? "text-indigo-600" : "text-gray-300"
                        )}>
                          {row["JUMLAH SKOR"] || "0"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredData.length === 0 && (
              <div className="p-12 text-center">
                <p className="text-gray-500">Tiada data dijumpai untuk kriteria carian anda.</p>
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="bg-white border-t border-gray-200 py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-sm text-gray-500">
            © 2026 Sistem Penyemakan Hasil Kerja Murid. Data dikemaskini secara automatik dari Google Sheets.
          </p>
        </div>
      </footer>
    </div>
  );
}

function StatCard({ title, value, icon, color, subtitle }: { 
  title: string, 
  value: string | number, 
  icon: React.ReactNode, 
  color: 'blue' | 'emerald' | 'rose' | 'amber',
  subtitle?: string
}) {
  const colors = {
    blue: 'bg-blue-50 border-blue-100',
    emerald: 'bg-emerald-50 border-emerald-100',
    rose: 'bg-rose-50 border-rose-100',
    amber: 'bg-amber-50 border-amber-100'
  };

  return (
    <div className={cn("p-6 rounded-2xl border shadow-sm transition-transform hover:scale-[1.02]", colors[color])}>
      <div className="flex justify-between items-start mb-4">
        <div className="p-2 bg-white rounded-lg shadow-sm">
          {icon}
        </div>
      </div>
      <div>
        <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-1">{title}</h4>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-gray-900">{value}</span>
          {subtitle && <span className="text-xs font-medium text-gray-500">{subtitle}</span>}
        </div>
      </div>
    </div>
  );
}
