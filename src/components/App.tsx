import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import EnhancedBudgets from './EnhancedBudgets';
import { FinancialHealthPage } from './FinancialHealthWidget';
import { ReimbursementManagementPage } from './ReimbursementWidget';
import { Home, DollarSign, Heart, Receipt } from 'lucide-react';

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-100">
        {/* Navigation */}
        <nav className="bg-white shadow-lg">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center gap-2">
                <DollarSign className="w-8 h-8 text-blue-600" />
                <span className="text-xl font-bold">Couple Finance Manager</span>
              </div>
              <div className="flex gap-4">
                <Link
                  to="/"
                  className="px-4 py-2 rounded hover:bg-gray-100 flex items-center gap-2"
                >
                  <Home className="w-5 h-5" />
                  Home
                </Link>
                <Link
                  to="/budgets"
                  className="px-4 py-2 rounded hover:bg-gray-100 flex items-center gap-2"
                >
                  <DollarSign className="w-5 h-5" />
                  Budgets
                </Link>
                <Link
                  to="/reimbursements"
                  className="px-4 py-2 rounded hover:bg-gray-100 flex items-center gap-2"
                >
                  <Receipt className="w-5 h-5" />
                  Reimbursements
                </Link>
                <Link
                  to="/health"
                  className="px-4 py-2 rounded hover:bg-gray-100 flex items-center gap-2"
                >
                  <Heart className="w-5 h-5" />
                  Financial Health
                </Link>
              </div>
            </div>
          </div>
        </nav>

        {/* Routes */}
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/budgets" element={<EnhancedBudgets />} />
          <Route path="/reimbursements" element={<ReimbursementManagementPage />} />
          <Route path="/health" element={<FinancialHealthPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

function HomePage() {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="bg-white rounded-lg shadow p-8 mb-6">
        <h1 className="text-4xl font-bold mb-4">Welcome to Couple Finance Manager</h1>
        <p className="text-lg text-gray-600 mb-6">
          A comprehensive financial management application designed for couples to manage their finances together.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <FeatureCard
            icon={<DollarSign className="w-12 h-12 text-blue-600" />}
            title="Enhanced Budgets"
            description="Toggle between Weekly, Monthly, and Yearly views with automatic conversion and 'What's Left' calculation."
            link="/budgets"
          />
          <FeatureCard
            icon={<Receipt className="w-12 h-12 text-green-600" />}
            title="Reimbursement Tracking"
            description="Track expenses that get reimbursed (medical, transportation, etc.) with status monitoring."
            link="/reimbursements"
          />
          <FeatureCard
            icon={<Heart className="w-12 h-12 text-red-600" />}
            title="Financial Health"
            description="Overall wellness score (0-100) with personalized recommendations and trend tracking."
            link="/health"
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-8">
        <h2 className="text-2xl font-bold mb-4">🎉 What's New (November 2025)</h2>
        <ul className="space-y-3">
          <li className="flex items-start gap-3">
            <span className="text-green-600 font-bold">✓</span>
            <div>
              <strong>Budget Period Views:</strong> Toggle between Weekly, Monthly, and Yearly views with automatic conversion
            </div>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-green-600 font-bold">✓</span>
            <div>
              <strong>Reimbursement Tracking:</strong> Track expenses that get reimbursed (medical, transportation, etc.)
            </div>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-green-600 font-bold">✓</span>
            <div>
              <strong>Financial Health Score:</strong> Overall wellness score (0-100) with personalized recommendations
            </div>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-green-600 font-bold">✓</span>
            <div>
              <strong>Budget Templates:</strong> Quick setup with 50/30/20, Zero-Based, or your custom template
            </div>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-green-600 font-bold">✓</span>
            <div>
              <strong>Excel Import:</strong> Import your existing budget spreadsheet with one click
            </div>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-green-600 font-bold">✓</span>
            <div>
              <strong>"What's Left" Calculator:</strong> See exactly how much you have remaining after expenses
            </div>
          </li>
        </ul>
      </div>
    </div>
  );
}

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  link: string;
}

function FeatureCard({ icon, title, description, link }: FeatureCardProps) {
  return (
    <Link to={link} className="block">
      <div className="bg-gray-50 rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer">
        <div className="mb-4">{icon}</div>
        <h3 className="text-xl font-bold mb-2">{title}</h3>
        <p className="text-gray-600">{description}</p>
        <div className="mt-4 text-blue-600 font-medium">
          Learn more →
        </div>
      </div>
    </Link>
  );
}
