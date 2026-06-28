import React from 'react';
import { useStore } from '../store/index.js';
import { AlertTriangle, Activity, CheckCircle2, Users } from 'lucide-react';

export default function StatsBar() {
  const { getStats } = useStore();
  const stats = getStats();

  const cards = [
    {
      title: "Issues Raised",
      value: stats.total.toLocaleString(),
      change: stats.total > 0 ? "Real-time" : "0.0%",
      bgColor: "bg-[#FEE2E2]",
      borderColor: "border-[#DC2626]/10",
      textColor: "text-[#DC2626]",
      iconColor: "text-[#DC2626] bg-white border-[#DC2626]/20",
      icon: AlertTriangle,
    },
    {
      title: "Pending Action",
      value: stats.pending.toLocaleString(),
      change: "Awaiting",
      bgColor: "bg-[#FEF3C7]",
      borderColor: "border-[#D97706]/10",
      textColor: "text-[#D97706]",
      iconColor: "text-[#D97706] bg-white border-[#D97706]/20",
      icon: Activity,
    },
    {
      title: "Issues Resolved",
      value: stats.resolved.toLocaleString(),
      change: stats.total > 0 ? `${Math.round((stats.resolved / stats.total) * 100)}% Rate` : "0% Rate",
      bgColor: "bg-[#DCFCE7]",
      borderColor: "border-[#16A34A]/10",
      textColor: "text-[#16A34A]",
      iconColor: "text-[#16A34A] bg-white border-[#16A34A]/20",
      icon: CheckCircle2,
    },
    {
      title: "Active Citizens",
      value: (stats.activeCitizens || 0).toLocaleString(),
      change: "Real-time",
      bgColor: "bg-[#DBEAFE]",
      borderColor: "border-[#2563EB]/10",
      textColor: "text-[#2563EB]",
      iconColor: "text-[#2563EB] bg-white border-[#2563EB]/20",
      icon: Users,
    }
  ];

  return (
    <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 px-4 md:px-8 py-4 max-w-7xl mx-auto">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className={`${card.bgColor} ${card.borderColor} p-5 rounded-2xl border shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between h-[175px]`}
          >
            {/* Top row: Icon and Trend badge */}
            <div className="flex items-center justify-between w-full">
              <div className={`p-2.5 rounded-xl border ${card.iconColor} flex items-center justify-center`}>
                <Icon className="w-4 h-4 stroke-[2.2]" />
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border bg-white ${card.textColor} ${card.borderColor}`}>
                {card.change}
              </span>
            </div>

            {/* Bottom column: Centered and enlarged Big number and label */}
            <div className="text-center mt-2 flex flex-col items-center justify-center flex-1">
              <div className={`text-5xl sm:text-6xl font-extrabold tracking-tight leading-none ${card.textColor}`}>
                {card.value}
              </div>
              <div className={`text-[11px] font-semibold mt-2 uppercase tracking-wider ${card.textColor} opacity-80`}>
                {card.title}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
