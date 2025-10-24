"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Link from "next/link";

interface Insight {
  id: number;
  icon: string;
  value: string;
  label: string;
}

const KeyDataInsight = () => {
  const { t } = useTranslation("common"); // ✅ Use correct namespace
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 300);
    return () => clearTimeout(timer);
  }, []);

  const insights: Insight[] = [
    { id: 1, icon: "🌾", value: "65%", label: t("keyData.insights.cropYield") },
    { id: 2, icon: "💧", value: "42%", label: t("keyData.insights.irrigation") },
    { id: 3, icon: "🚜", value: "28%", label: t("keyData.insights.fertilizer") },
    { id: 4, icon: "🌍", value: "15%", label: t("keyData.insights.trade") },
    { id: 5, icon: "📊", value: "78%", label: t("keyData.insights.dataCoverage") },
    { id: 6, icon: "🌱", value: "60%", label: t("keyData.insights.smartFarming") },
  ];

  return (
    <section className="py-20 bg-green-200 relative overflow-hidden">
      <div className="text-center max-w-3xl mx-auto mb-12 px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-[var(--medium-green)] mb-3">
          {t("keyData.title")}
        </h2>
        <p className="text-gray-700 text-lg">{t("keyData.subtitle")}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-[90%] mx-auto">
        {insights.map((insight, index) => (
          <motion.div
            key={insight.id}
            initial={{ opacity: 0, y: 30 }}
            animate={isVisible ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: index * 0.2 }}
            className={`p-6 rounded-2xl shadow-lg text-center transform transition-all duration-500 hover:scale-105 ${
              index % 2 === 0
                ? "bg-[var(--medium-green)] text-white"
                : "bg-[var(--yellow)] text-[var(--dark-green)]"
            }`}
          >
            <div className="text-4xl mb-3">{insight.icon}</div>
            <h3 className="text-3xl font-extrabold">{insight.value}</h3>
            <p className="mt-1 text-md font-medium">{insight.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="text-center mt-14">
        <Link
          href="/country-data"
          className="inline-block px-8 py-3 font-semibold text-white bg-[var(--medium-green)] rounded-full shadow-md hover:bg-[var(--olive-green)] hover:scale-105 transform transition-all duration-300"
        >
          {t("keyData.cta")}
        </Link>
      </div>

      <div className="absolute top-0 left-0 w-full h-2 bg-[var(--yellow)]"></div>
    </section>
  );
};

export default KeyDataInsight;
