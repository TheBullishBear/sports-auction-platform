import React, { useState } from 'react';
import {
  UserPlus,
  Camera,
  Upload,
  CheckCircle2,
  Sparkles,
  Phone,
  Calendar,
  User,
  Shield,
  ArrowRight,
  Flame,
  Zap,
  Radio,
  FileCheck2,
  RotateCcw,
  Share2,
  Copy,
  Check,
} from 'lucide-react';
import { useAuction } from '../context/AuctionContext';
import { Player, PlayerRole } from '../types';

interface PlayerRegistrationProps {
  onNavigate?: (view: 'admin' | 'franchise' | 'public' | 'register') => void;
}

export const PlayerRegistration: React.FC<PlayerRegistrationProps> = ({ onNavigate }) => {
  const { snapshot, addNewPlayer, formatCurrency, isEffectiveAdmin } = useAuction();

  const minBasePrice = snapshot?.session.minBasePrice || 20000000;

  // Streamlined Form State (Per User Requirements)
  const [name, setName] = useState('');
  const [age, setAge] = useState<number | ''>(24);
  const [contactNumber, setContactNumber] = useState('');
  const [role, setRole] = useState<PlayerRole>('All-Rounder');
  const [battingStyle, setBattingStyle] = useState('Right-hand bat');
  const [bowlingStyle, setBowlingStyle] = useState('Right-arm fast-medium');
  const [avatarUrl, setAvatarUrl] = useState('');

  // UI feedback states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [registeredPlayer, setRegisteredPlayer] = useState<Player | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const handleCopyLink = () => {
    const url = typeof window !== 'undefined' ? `${window.location.origin}/#register` : 'http://localhost:4000/#register';
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Quick preset photos
  const sampleAvatars = [
    { label: 'Pro 1', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80' },
    { label: 'Pro 2', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80' },
    { label: 'Pro 3', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80' },
    { label: 'Pro 4', url: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=300&q=80' },
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      if (base64) setAvatarUrl(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Validation
    if (!name.trim()) {
      setErrorMsg('Full Name is required.');
      return;
    }
    if (!age || Number(age) < 14 || Number(age) > 55) {
      setErrorMsg('Please enter a valid age between 14 and 55 years.');
      return;
    }
    if (!contactNumber.trim() || contactNumber.trim().length < 8) {
      setErrorMsg('Please enter a valid contact phone number.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
        age: Number(age),
        contactNumber: contactNumber.trim(),
        country: 'India',
        isOverseas: false,
        role,
        basePrice: minBasePrice, // Automatically uses tournament common minimum base price
        avatarUrl: avatarUrl.trim() || undefined,
        stats: {
          matches: 0,
          battingStyle,
          bowlingStyle,
          highlights: `${role} • ${battingStyle}${bowlingStyle !== 'None' ? ` • ${bowlingStyle}` : ''}`,
        },
      };

      const res = await addNewPlayer(payload);
      if (res.success && res.player) {
        setRegisteredPlayer(res.player);
      } else {
        setErrorMsg(res.message || 'Failed to register player. Please try again.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected error occurred during registration.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setName('');
    setAge(24);
    setContactNumber('');
    setRole('All-Rounder');
    setBattingStyle('Right-hand bat');
    setBowlingStyle('Right-arm fast-medium');
    setAvatarUrl('');
    setRegisteredPlayer(null);
    setErrorMsg(null);
  };

  // SUCCESS CONFIRMATION SCREEN
  if (registeredPlayer) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 animate-fade-in">
        <div className="rounded-3xl bg-slate-900 border border-emerald-500/40 p-8 shadow-2xl relative overflow-hidden text-center">
          <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Success Check Badge */}
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/20 animate-bounce-subtle">
            <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
          </div>

          <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-mono font-black uppercase tracking-wider">
            Official Registration Verified
          </span>

          <h2 className="font-display font-black text-3xl text-white mt-3">
            Registration Confirmed!
          </h2>
          <p className="text-sm text-slate-300 mt-1 max-w-lg mx-auto">
            <strong>{registeredPlayer.name}</strong> has been enrolled into the official 2026 Premier League live auction pool.
          </p>

          {/* Official Auction Pass / Lot Ticket */}
          <div className="mt-8 max-w-lg mx-auto p-6 rounded-2xl bg-slate-950/90 border border-slate-800 shadow-xl text-left relative overflow-hidden">
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3.5">
                <img
                  src={registeredPlayer.avatarUrl}
                  alt={registeredPlayer.name}
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-emerald-400/60 shadow-md"
                />
                <div>
                  <h3 className="font-display font-black text-xl text-white">
                    {registeredPlayer.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold">
                      {registeredPlayer.role}
                    </span>
                    <span className="text-xs text-slate-400 font-bold">
                      {registeredPlayer.age} Years
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Auction Lot
                </span>
                <span className="font-display font-black text-2xl text-amber-400">
                  #{registeredPlayer.orderIndex}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 py-4 text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 block">
                  Base Price
                </span>
                <span className="font-mono font-black text-emerald-400 text-sm">
                  {formatCurrency(registeredPlayer.basePrice)}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 block">
                  Contact Number
                </span>
                <span className="font-mono font-bold text-white text-xs">
                  {registeredPlayer.contactNumber || 'On Record'}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 block">
                  Batting Style
                </span>
                <span className="font-semibold text-slate-300">
                  {registeredPlayer.stats.battingStyle || 'Right-hand bat'}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 block">
                  Bowling Style
                </span>
                <span className="font-semibold text-slate-300">
                  {registeredPlayer.stats.bowlingStyle || 'None'}
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400 font-mono">
              <span>Status: UPCOMING IN POOL</span>
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <Radio className="w-3 h-3 animate-pulse" /> Live Synced
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={handleResetForm}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs uppercase tracking-wider transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Register Another Player</span>
            </button>

            {onNavigate && isEffectiveAdmin && (
              <button
                onClick={() => onNavigate('public')}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-purple-600/25"
              >
                <span>View in Stadium Live Tracker</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            {onNavigate && isEffectiveAdmin && (
              <button
                onClick={() => onNavigate('admin')}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-amber-500/25"
              >
                <span>Auctioneer Desk</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`mx-auto px-4 lg:px-8 py-8 space-y-8 animate-fade-in ${isEffectiveAdmin ? 'max-w-7xl' : 'max-w-3xl'}`}>
      {/* Portal Header */}
      <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/30 border border-amber-500/30 shadow-2xl">
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-mono font-black uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Player Enrollment Open
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Season 2026 Official Lot Registry
              </span>
            </div>
            <h1 className="font-display font-black text-3xl sm:text-4xl text-white tracking-tight">
              PLAYER AUCTION REGISTRATION
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              Complete the player entry form to register into the tournament auction pool.
              Registered players are instantly synchronized to the Admin Console and live franchise bidding terminals.
            </p>
          </div>

          {/* Tournament Minimum Base Price Floor Indicator - VISIBLE ONLY FOR ADMIN */}
          {isEffectiveAdmin && (
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-right min-w-[200px]">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Tournament Base Price
              </span>
              <span className="font-display font-black text-2xl text-amber-400 block mt-0.5">
                {formatCurrency(minBasePrice)}
              </span>
              <span className="text-[11px] text-slate-400">
                Assigned Base Price for Pool
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Shareable Registration Link Banner - VISIBLE ONLY FOR ADMIN */}
      {isEffectiveAdmin && (
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-emerald-500/30 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl backdrop-blur-sm">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-bold text-sm text-white">
                  Share Registration Link
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono font-bold">
                  Direct Form Access
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Send this direct link to players via WhatsApp, Email, or QR code so they can self-register.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-emerald-300 truncate max-w-xs select-all">
              {typeof window !== 'undefined' ? `${window.location.origin}/#register` : 'http://localhost:4000/#register'}
            </div>
            <button
              type="button"
              onClick={handleCopyLink}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all shrink-0 shadow-md shadow-emerald-500/20 active:scale-95 cursor-pointer"
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Link</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Main Grid: Form & Admin Live Card Preview */}
      <div className={isEffectiveAdmin ? 'grid grid-cols-1 lg:grid-cols-12 gap-8 items-start' : 'w-full'}>
        {/* Form Container */}
        <div
          className={`${
            isEffectiveAdmin ? 'lg:col-span-7' : 'w-full'
          } bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6 backdrop-blur-md`}
        >
          {errorMsg && (
            <div className="p-4 rounded-2xl bg-rose-950/80 border border-rose-500 text-rose-200 text-xs flex items-center gap-2 shadow-lg animate-shake">
              <span className="font-bold">Error:</span> {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 1. Personal & Contact Information */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
                <User className="w-4 h-4 text-amber-400" />
                <h3 className="font-display font-bold text-sm uppercase tracking-wider text-white">
                  1. Player Details
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Player Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Rohan Sharma"
                    className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm font-semibold focus:outline-none focus:border-amber-400 placeholder:text-slate-500"
                  />
                </div>

                {/* Age */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-amber-400" />
                    <span>Age (Years) *</span>
                  </label>
                  <input
                    type="number"
                    required
                    min={14}
                    max={55}
                    value={age}
                    onChange={(e) => setAge(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="e.g. 24"
                    className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono text-sm font-bold focus:outline-none focus:border-amber-400"
                  />
                </div>

                {/* Contact Number */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-amber-400" />
                    <span>Contact Number *</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={contactNumber}
                    onChange={(e) => setContactNumber(e.target.value)}
                    placeholder="e.g. +91 98765 43210"
                    className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono text-sm font-bold focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>
            </div>

            {/* 2. Photo Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
                <Camera className="w-4 h-4 text-amber-400" />
                <h3 className="font-display font-bold text-sm uppercase tracking-wider text-white">
                  2. Player Photo
                </h3>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Photo (Upload File or Paste Image URL) *
                </label>

                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <input
                    type="text"
                    value={avatarUrl.startsWith('data:') ? 'Local file uploaded' : avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    placeholder="Paste image URL (https://...)"
                    className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-mono focus:outline-none focus:border-amber-400 truncate placeholder:text-slate-500"
                  />

                  {/* Local file upload button */}
                  <label className="cursor-pointer px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold flex items-center gap-2 shrink-0 transition-all">
                    <Upload className="w-4 h-4 text-amber-400" />
                    <span>Upload</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                  </label>
                </div>

                {/* Quick Avatar Presets */}
                <div className="mt-2.5 flex items-center gap-2">
                  <span className="text-[11px] text-slate-500">Quick Samples:</span>
                  {sampleAvatars.map((s, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setAvatarUrl(s.url)}
                      className="text-[11px] px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-300 font-mono transition-colors"
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 3. Role & Playing Skills */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
                <Flame className="w-4 h-4 text-amber-400" />
                <h3 className="font-display font-bold text-sm uppercase tracking-wider text-white">
                  3. Playing Role
                </h3>
              </div>

              {/* Primary Role Selector (Big Cards) */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Select Playing Role *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {(
                    [
                      { role: 'Batter', emoji: '🏏', desc: 'Top/Middle Order' },
                      { role: 'Bowler', emoji: '⚡', desc: 'Pace/Spin Attack' },
                      { role: 'All-Rounder', emoji: '⭐', desc: 'Dual Impact' },
                      { role: 'Wicketkeeper', emoji: '🧤', desc: 'Keeper-Batter' },
                    ] as const
                  ).map((item) => {
                    const isSelected = role === item.role;
                    return (
                      <button
                        key={item.role}
                        type="button"
                        onClick={() => setRole(item.role)}
                        className={`p-3.5 rounded-2xl border text-left transition-all ${
                          isSelected
                            ? 'bg-amber-500/20 border-amber-400 shadow-lg shadow-amber-500/10'
                            : 'bg-slate-800/60 border-slate-700 hover:border-slate-600 hover:bg-slate-800'
                        }`}
                      >
                        <div className="text-2xl mb-1">{item.emoji}</div>
                        <div
                          className={`font-display font-black text-xs uppercase tracking-wider ${
                            isSelected ? 'text-amber-300' : 'text-white'
                          }`}
                        >
                          {item.role}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{item.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                {/* Batting Style */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Batting Style
                  </label>
                  <select
                    value={battingStyle}
                    onChange={(e) => setBattingStyle(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-semibold focus:outline-none focus:border-amber-400"
                  >
                    <option value="Right-hand bat">Right-hand bat</option>
                    <option value="Left-hand bat">Left-hand bat</option>
                  </select>
                </div>

                {/* Bowling Style */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Bowling Style
                  </label>
                  <select
                    value={bowlingStyle}
                    onChange={(e) => setBowlingStyle(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-semibold focus:outline-none focus:border-amber-400"
                  >
                    <option value="Right-arm fast">Right-arm fast</option>
                    <option value="Right-arm fast-medium">Right-arm fast-medium</option>
                    <option value="Right-arm off-spin">Right-arm off-spin</option>
                    <option value="Right-arm leg-spin">Right-arm leg-spin</option>
                    <option value="Left-arm fast">Left-arm fast</option>
                    <option value="Left-arm orthodox spinner">Left-arm orthodox spinner</option>
                    <option value="None">None (Pure Batter / Keeper)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Submission CTA */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={handleResetForm}
                className="px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-xs font-bold transition-colors"
              >
                Reset Form
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 max-w-md py-3.5 px-6 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-display font-black text-sm uppercase tracking-wider transition-all shadow-xl shadow-amber-500/25 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <span>Registering into Pool...</span>
                ) : (
                  <>
                    <FileCheck2 className="w-5 h-5 fill-slate-950" />
                    <span>Complete Registration & Enter Pool</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Live Preview Card (5 cols) - VISIBLE ONLY FOR ADMIN */}
        {isEffectiveAdmin && (
          <div className="lg:col-span-5 sticky top-24 space-y-4">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs uppercase font-extrabold tracking-wider text-slate-400 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                Live Auction Card Preview
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                Updates in Real-Time
              </span>
            </div>

            <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl relative overflow-hidden backdrop-blur-xl">
              <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

              {/* Card Header */}
              <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-800 border-2 border-slate-700 flex items-center justify-center shrink-0 shadow-lg">
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt="Player Preview"
                        className="w-full h-full object-cover"
                        onError={() => setAvatarUrl('')}
                      />
                    ) : (
                      <User className="w-7 h-7 text-slate-500" />
                    )}
                  </div>

                  <div>
                    <h3 className="font-display font-black text-lg text-white">
                      {name || 'Player Name'}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold">
                        {role}
                      </span>
                      <span className="text-xs text-slate-400 font-bold">
                        {age ? `${age} Yrs` : 'Age: --'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block">
                    Status
                  </span>
                  <span className="text-[10px] font-bold text-emerald-400 uppercase font-mono">
                    Pending Reg
                  </span>
                </div>
              </div>

              {/* Card Key Metrics */}
              <div className="grid grid-cols-2 gap-3 py-4 border-b border-slate-800 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Base Price
                  </span>
                  <span className="font-mono font-black text-base text-amber-400">
                    {formatCurrency(minBasePrice)}
                  </span>
                  <span className="text-[9px] text-slate-500 block">Tournament Reserve</span>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Contact Number
                  </span>
                  <span className="font-mono text-slate-300 text-xs truncate block font-bold">
                    {contactNumber || 'Contact on file'}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Batting Style
                  </span>
                  <span className="text-slate-300 font-semibold">{battingStyle}</span>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Bowling Style
                  </span>
                  <span className="text-slate-300 font-semibold truncate block">
                    {bowlingStyle}
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-2 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                <span>PREMIER AUCTION • 2026 REGISTRY</span>
                <span className="text-emerald-400 flex items-center gap-1 font-bold">
                  <Shield className="w-3 h-3" /> OFFICIAL ENTRY
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
