import React, { useEffect, useState } from "react";
import {
  DollarSign,
  Calendar,
  TrendingUp,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { servicesRepository } from "../lib/repositories/servicesRepository";
import { useAuth } from "../hooks/useAuth";

type RevenueStats = {
  current: {
    weekly: number;
    monthly: number;
    yearly: number;
  };
  previous: {
    weekly: number;
    monthly: number;
    yearly: number;
  };
};

type MonthlyRevenue = {
  month: string;
  total: number;
};

export const AdminRevenuePage: React.FC = () => {
  const { user } = useAuth();

  const [stats, setStats] = useState<RevenueStats>({
    current: {
      weekly: 0,
      monthly: 0,
      yearly: 0,
    },
    previous: {
      weekly: 0,
      monthly: 0,
      yearly: 0,
    },
  });

  const [monthlyRevenue, setMonthlyRevenue] = useState<MonthlyRevenue[]>([]);
  const [animateBars, setAnimateBars] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());

  useEffect(() => {
    if (user?.role === "admin") {
      loadRevenue();
    }
  }, [user]);

  useEffect(() => {
    if (user?.role === "admin") {
      loadMonthlyRevenueForYear(selectedYear);
    }
  }, [selectedYear]);

  const loadMonthlyRevenueForYear = async (year: number) => {
    try {
      setAnimateBars(false);

      const result = await servicesRepository.listServices("", {}, 1, 10000);
      const data = result.items;

      const monthlyMap: Record<number, number> = {
        0: 0,
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0,
        6: 0,
        7: 0,
        8: 0,
        9: 0,
        10: 0,
        11: 0,
      };

      data.forEach((record) => {
        const d = new Date(record.date);
        const amount = record.total || 0;

        if (d.getFullYear() === year) {
          monthlyMap[d.getMonth()] += amount;
        }
      });

      const monthNames = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];

      setMonthlyRevenue(
        monthNames.map((name, index) => ({
          month: name,
          total: monthlyMap[index],
        }))
      );

      setTimeout(() => setAnimateBars(true), 0);
    } catch (err) {
      console.error("Failed to load monthly revenue", err);
    }
  };

  const loadRevenue = async () => {
    try {
      setLoading(true);
      setAnimateBars(false);

      const result = await servicesRepository.listServices("", {}, 1, 10000);
      const data = result.items;

      const now = new Date();
      const year = now.getFullYear();

      // Current week
      const startOfCurrentWeek = new Date(now);
      startOfCurrentWeek.setDate(now.getDate() - now.getDay());
      const startOfPreviousWeek = new Date(startOfCurrentWeek);
      startOfPreviousWeek.setDate(startOfPreviousWeek.getDate() - 7);

      // Current month
      const startOfCurrentMonth = new Date(year, now.getMonth(), 1);
      const startOfPreviousMonth = new Date(year, now.getMonth() - 1, 1);

      // Current year
      const startOfCurrentYear = new Date(year, 0, 1);
      const startOfPreviousYear = new Date(year - 1, 0, 1);
      const endOfPreviousYear = new Date(year, 0, 0);

      let currentWeekly = 0;
      let currentMonthly = 0;
      let currentYearly = 0;
      let previousWeekly = 0;
      let previousMonthly = 0;
      let previousYearly = 0;

      const monthlyMap: Record<number, number> = {
        0: 0,
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0,
        6: 0,
        7: 0,
        8: 0,
        9: 0,
        10: 0,
        11: 0,
      };

      data.forEach((record) => {
        const d = new Date(record.date);
        const amount = record.total || 0;

        // Current period
        if (d >= startOfCurrentWeek) currentWeekly += amount;
        if (d >= startOfCurrentMonth) currentMonthly += amount;
        if (d >= startOfCurrentYear) currentYearly += amount;

        // Previous period
        if (d >= startOfPreviousWeek && d < startOfCurrentWeek)
          previousWeekly += amount;
        if (d >= startOfPreviousMonth && d < startOfCurrentMonth)
          previousMonthly += amount;
        if (d >= startOfPreviousYear && d < startOfCurrentYear)
          previousYearly += amount;

        // Monthly breakdown for current year
        if (d.getFullYear() === year) {
          monthlyMap[d.getMonth()] += amount;
        }
      });

      setStats({
        current: {
          weekly: currentWeekly,
          monthly: currentMonthly,
          yearly: currentYearly,
        },
        previous: {
          weekly: previousWeekly,
          monthly: previousMonthly,
          yearly: previousYearly,
        },
      });

      const monthNames = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];

      setMonthlyRevenue(
        monthNames.map((name, index) => ({
          month: name,
          total: monthlyMap[index],
        }))
      );
    } catch (err) {
      console.error("Failed to load revenue stats", err);
    } finally {
      setLoading(false);

      setTimeout(() => setAnimateBars(true), 0);
    }
  };

  if (user?.role !== "admin") {
    return (
      <div className="text-center py-20 text-gray-500">
        🚫 You do not have access to this section
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin h-10 w-10 border-b-2 border-blue-600 rounded-full" />
      </div>
    );
  }

  const maxMonthly = Math.max(...monthlyRevenue.map((m) => m.total), 1);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Revenue Statistics
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Overview of your business performance
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <RevenueCard
          title="This Week"
          current={stats.current.weekly}
          previous={stats.previous.weekly}
          icon={<Calendar className="w-6 h-6 text-blue-500" />}
          period="week"
        />
        <RevenueCard
          title="This Month"
          current={stats.current.monthly}
          previous={stats.previous.monthly}
          icon={<TrendingUp className="w-6 h-6 text-green-500" />}
          period="month"
        />
        <RevenueCard
          title="This Year"
          current={stats.current.yearly}
          previous={stats.previous.yearly}
          icon={<DollarSign className="w-6 h-6 text-orange-500" />}
          period="year"
        />
      </div>

      {/* Monthly Revenue Chart */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Monthly Revenue
          </h2>
          <div className="flex gap-3">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {Array.from({ length: 31 }, (_, i) => 2020 + i).map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {[
                "January",
                "February",
                "March",
                "April",
                "May",
                "June",
                "July",
                "August",
                "September",
                "October",
                "November",
                "December",
              ].map((m, idx) => (
                <option key={idx} value={idx}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-end gap-3 h-52">
          {monthlyRevenue.map((m, index) => (
            <div key={m.month} className="flex-1 flex flex-col items-center">
              <div className="w-full h-full bg-slate-700/30 rounded-md flex items-end justify-center">
                <div
                  className="w-8 bg-blue-500 dark:bg-blue-400 rounded-t-md transition-[height] duration-700 ease-out"
                  style={{
                    height:
                      animateBars && maxMonthly > 0
                        ? `${Math.max((m.total / maxMonthly) * 100, 2)}%`
                        : "0%",
                    transitionDelay: `${index * 80}ms`,
                  }}
                  title={`€${m.total.toFixed(2)}`}
                />
              </div>

              <span className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                {m.month}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const RevenueCard = ({
  title,
  current,
  previous,
  icon,
  period,
}: {
  title: string;
  current: number;
  previous: number;
  icon: React.ReactNode;
  period: string;
}) => {
  const change = previous > 0 ? ((current - previous) / previous) * 100 : 0;
  const isPositive = change >= 0;

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-200 dark:border-slate-700">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gray-100 dark:bg-slate-700 rounded-lg">
            {icon}
          </div>
          <h3 className="text-sm text-gray-600 dark:text-gray-400">{title}</h3>
        </div>
      </div>

      <div className="mb-4">
        <p className="text-3xl font-bold text-gray-900 dark:text-white">
          €{current.toFixed(2)}
        </p>
      </div>

      <div className="space-y-2 pt-3 border-t border-gray-200 dark:border-slate-700">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">
            Previous {period}:
          </span>
          <span className="text-gray-900 dark:text-white font-medium">
            €{previous.toFixed(2)}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-gray-600 dark:text-gray-400 text-sm">
            Change:
          </span>
          <div
            className={`flex items-center space-x-1 px-2 py-1 rounded ${
              isPositive
                ? "bg-green-100 dark:bg-green-900/20"
                : "bg-red-100 dark:bg-red-900/20"
            }`}
          >
            {isPositive ? (
              <ArrowUp
                className={`w-4 h-4 text-green-600 dark:text-green-400`}
              />
            ) : (
              <ArrowDown className={`w-4 h-4 text-red-600 dark:text-red-400`} />
            )}
            <span
              className={`text-sm font-medium ${
                isPositive
                  ? "text-green-600 dark:text-green-400"
                  : "text-red-600 dark:text-red-400"
              }`}
            >
              {Math.abs(change).toFixed(1)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
