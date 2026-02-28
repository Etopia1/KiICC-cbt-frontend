import React from 'react';
import AdminLayout from '../components/AdminLayout';
import { Settings, Shield, Bell, Lock, Globe, Database } from 'lucide-react';

const AdminSettings = () => {
    return (
        <AdminLayout>
            <div className="p-8 max-w-6xl mx-auto animate-fade-in">
                <div className="flex flex-col gap-1 mb-8">
                    <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">Institutional Protocol Settings</h1>
                    <p className="text-slate-500 text-sm font-medium">Configure core behavioral heuristics and security parameters for the CBT node.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Sidebar Nav */}
                    <div className="space-y-2">
                        <SettingsItem icon={Globe} label="General Environment" active />
                        <SettingsItem icon={Shield} label="Security Heuristics" />
                        <SettingsItem icon={Bell} label="Notification Signals" />
                        <SettingsItem icon={Lock} label="Access Control" />
                        <SettingsItem icon={Database} label="Data Repository" />
                    </div>

                    {/* Main Settings Panel */}
                    <div className="md:col-span-2 space-y-8">
                        <section className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm space-y-6">
                            <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight border-b border-slate-50 pb-4">General Configuration</h3>
                            
                            <div className="space-y-4">
                                <InputGroup label="Institution Name" value="Etopia Academy" />
                                <InputGroup label="System Access URL" value="https://edu-cbt-pro.vercel.app" />
                                <div className="grid grid-cols-2 gap-4">
                                    <InputGroup label="Current Academic Session" value="2025/2026" />
                                    <InputGroup label="Current Term" value="1st Term" />
                                </div>
                            </div>

                            <div className="pt-4 flex justify-end">
                                <button className="px-8 py-3 bg-[#1A120B] text-[#D4AF37] font-black text-xs uppercase tracking-widest rounded-xl hover:bg-black transition-all shadow-xl shadow-[#1a120b]/20">
                                    Update Protocols
                                </button>
                            </div>
                        </section>

                        <section className="bg-rose-50 rounded-3xl p-8 border border-rose-100 space-y-4">
                            <h3 className="text-sm font-black text-rose-900 uppercase tracking-widest flex items-center gap-2">
                                <Shield size={16} className="text-rose-600" />
                                Danger Zone
                            </h3>
                            <p className="text-rose-700/60 text-xs font-medium">Critical system operations. Initialization of these protocols may lead to irreversible data loss within the node.</p>
                            <button className="px-6 py-3 border-2 border-rose-200 text-rose-600 font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-rose-100 transition-all">
                                Factory Protocol Reset
                            </button>
                        </section>
                    </div>
                </div>
            </div>
            
            <style>{`
                .animate-fade-in { animation: fadeIn 0.4s ease-out; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
        </AdminLayout>
    );
};

const SettingsItem = ({ icon: Icon, label, active }) => (
    <button className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all ${
        active 
        ? 'bg-[#1A120B] text-[#D4AF37] shadow-xl shadow-[#1a120b]/10' 
        : 'hover:bg-slate-50 text-slate-400'
    }`}>
        <Icon size={20} />
        <span className="text-sm font-black uppercase tracking-tight italic">{label}</span>
    </button>
);

const InputGroup = ({ label, value }) => (
    <div className="space-y-2">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{label}</label>
        <input 
            type="text" 
            defaultValue={value}
            className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20 focus:border-[#D4AF37]/30 transition-all"
        />
    </div>
);

export default AdminSettings;
