"use client";

import { motion } from "framer-motion";
import { CheckCircle2, XCircle } from "lucide-react";

interface AttendanceSummaryProps {
  presentDays: number;
  absentDays: number;
}

export default function AttendanceSummary({
  presentDays,
  absentDays,
}: AttendanceSummaryProps) {
  const cards = [
    {
      label: "Present Days",
      value: presentDays,
      subtitle: `${presentDays} Present`,
      icon: CheckCircle2,

      bg: "bg-emerald-50",
      border: "border-emerald-200",

      iconBg: "bg-emerald-100",
      iconColor: "text-emerald-600",

      numberColor: "text-[#70153A]",
    },

    {
      label: "Absent Days",
      value: absentDays,
      subtitle: `${absentDays} Absent`,
      icon: XCircle,

      bg: "bg-rose-50",
      border: "border-rose-200",

      iconBg: "bg-rose-100",
      iconColor: "text-rose-600",

      numberColor: "text-[#70153A]",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
      {cards.map((card, index) => {
        const Icon = card.icon;

        return (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.4,
              delay: index * 0.1,
            }}
            whileHover={{
              y: -6,
              scale: 1.02,
            }}
            className={`
              ${card.bg}
              ${card.border}

              rounded-3xl
border
p-6
shadow-sm
min-h-[150px]
            `}
          >
            <div className="flex items-start justify-between">

              <div>

                <p className="uppercase tracking-[0.22em] text-xs text-slate-500">
                  {card.label}
                </p>

                <h2
                  className={`
                    mt-5
                    text-4xl
                    font-bold
                    ${card.numberColor}
                  `}
                >
                  {card.value}
                </h2>

                <p className="mt-5 text-lg font-medium text-slate-600">
                  {card.subtitle}
                </p>

              </div>

              <div
                className={`
                  ${card.iconBg}

                 h-16
w-16
rounded-2xl

                  flex
                  items-center
                  justify-center
                `}
              >
                <Icon
                  className={`${card.iconColor} h-8 w-8 `}
                />
              </div>

            </div>
          </motion.div>
        );
      })}
    </div>
  );
}