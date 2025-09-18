// src/pages/dashboards/IndividualDashboard.tsx

import React from 'react';
import { useAuth } from '../../../../shared/contexts/AuthContext';
import { SubscriptionPlan } from '../../../../shared/types/user.types';
import { useNavigate } from 'react-router-dom';

const IndividualDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const getSubscriptionDetails = () => {
    const plan = user?.subscription?.plan || SubscriptionPlan.FREE;
    
    switch (plan) {
      case SubscriptionPlan.FREE:
        return { name: 'Free', limit: 2, price: '$0', color: 'neutral' };
      case SubscriptionPlan.INDIVIDUAL_BASIC:
        return { name: 'Basic', limit: 10, price: '$9.99', color: 'blue' };
      case SubscriptionPlan.INDIVIDUAL_PRO:
        return { name: 'Pro', limit: 'Unlimited', price: '$19.99', color: 'purple' };
      default:
        return { name: 'Free', limit: 2, price: '$0', color: 'neutral' };
    }
  };

  const subscription = getSubscriptionDetails();
  const monthlyUsage = user?.stats?.monthlyUsage || 0;
  const usagePercentage = typeof subscription.limit === 'number' 
    ? (monthlyUsage / subscription.limit) * 100 
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-primary-50 pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Welcome Section */}
        <div className="mb-10 animate-slide-up">
          <h1 className="text-4xl font-display font-bold text-neutral-900 mb-3">
            Welcome back, {user?.firstName || 'Runner'}!
          </h1>
          <p className="text-lg text-neutral-600">
            Your running performance dashboard
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="card-luxury hover-lift animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 bg-gradient-to-br from-primary-400 to-primary-600 rounded-2xl flex items-center justify-center shadow-lg">
                <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                  <path fillRule="evenodd" d="M4 5a2 2 0 012-2 1 1 0 000 2H6a2 2 0 100 4h2a2 2 0 100-4h-.5a1 1 0 000-2H8a2 2 0 012 2v9a2 2 0 11-4 0V5z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="badge badge-primary">All Time</span>
            </div>
            <p className="text-sm font-medium text-neutral-500 mb-1">Total Analyses</p>
            <p className="text-3xl font-display font-bold text-neutral-900">
              {user?.stats?.totalAnalyses || 0}
            </p>
            <div className="mt-4 pt-4 border-t border-neutral-100">
              <div className="flex items-center text-sm">
                <svg className="w-4 h-4 text-green-500 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-green-600 font-medium">12%</span>
                <span className="text-neutral-500 ml-1">vs last month</span>
              </div>
            </div>
          </div>

          <div className="card-luxury hover-lift animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="badge badge-primary">This Month</span>
            </div>
            <p className="text-sm font-medium text-neutral-500 mb-1">Monthly Usage</p>
            <p className="text-3xl font-display font-bold text-neutral-900">
              {monthlyUsage}
              <span className="text-lg text-neutral-400 font-normal ml-1">
                / {subscription.limit}
              </span>
            </p>
            <div className="mt-4">
              <div className="w-full bg-neutral-100 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary-400 to-primary-600 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                />
              </div>
            </div>
          </div>

          <div className="card-luxury hover-lift animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                </svg>
              </div>
              <span className={`badge ${subscription.name === 'Pro' ? 'badge-luxury' : 'badge-primary'}`}>
                {subscription.name}
              </span>
            </div>
            <p className="text-sm font-medium text-neutral-500 mb-1">Subscription</p>
            <p className="text-3xl font-display font-bold text-neutral-900">
              {subscription.price}
              <span className="text-lg text-neutral-400 font-normal">/mo</span>
            </p>
            {subscription.name !== 'Pro' && (
              <div className="mt-4">
                <button className="text-sm font-medium text-primary-600 hover:text-primary-500 transition-colors">
                  Upgrade Plan →
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Upload Section */}
        <div className="card-luxury hover-lift mb-10 animate-slide-up" style={{ animationDelay: '0.4s' }}>
          <div className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary-400/20 to-primary-600/20 rounded-full blur-3xl"></div>
            <div className="relative flex items-center justify-between">
              <div className="flex-1">
                <h2 className="text-2xl font-display font-bold text-neutral-900 mb-3">
                  Ready to Analyze?
                </h2>
                <p className="text-neutral-600 mb-6 max-w-lg">
                  Upload your running video and get instant AI-powered biomechanical analysis 
                  with personalized recommendations.
                </p>
                <div className="flex items-center space-x-4">
                  <button className="btn-luxury group">
                    <span className="flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      Upload Video
                    </span>
                  </button>
                  <span className="text-sm text-neutral-500">
                    Supports MP4, MOV up to 500MB
                  </span>
                </div>
              </div>
              <div className="hidden lg:block">
                <div className="w-32 h-32 bg-gradient-to-br from-primary-400 to-primary-600 rounded-3xl flex items-center justify-center shadow-2xl animate-float">
                  <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Analyses */}
        <div className="card-luxury animate-slide-up" style={{ animationDelay: '0.5s' }}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-display font-bold text-neutral-900">Recent Analyses</h3>
            <button className="text-sm font-medium text-primary-600 hover:text-primary-500 transition-colors">
              View All →
            </button>
          </div>
          
          {/* Empty State */}
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gradient-to-br from-neutral-100 to-neutral-200 rounded-3xl mx-auto mb-6 flex items-center justify-center">
              <svg className="w-12 h-12 text-neutral-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm3 1h6v4H7V5zm6 6H7v2h6v-2z" clipRule="evenodd" />
              </svg>
            </div>
            <h4 className="text-lg font-semibold text-neutral-900 mb-2">No analyses yet</h4>
            <p className="text-neutral-600 mb-6">Upload your first video to see detailed insights here</p>
            <button 
              onClick={() => navigate('/upload')}
              className="btn-primary"
            >
              <span className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Upload Your First Video
              </span>
            </button>
          </div>

          {/* Sample Analysis Card (for when data exists) */}
          {/* <div className="space-y-4">
            <div className="group p-4 bg-gradient-to-br from-white to-neutral-50 rounded-xl border border-neutral-100 hover:shadow-md transition-all cursor-pointer">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-semibold text-neutral-900 mb-1">Morning Run Analysis</h4>
                  <p className="text-sm text-neutral-500 mb-3">Analyzed 2 hours ago</p>
                  <div className="flex items-center space-x-6">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-2">
                        <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs text-neutral-500">Form Score</p>
                        <p className="text-sm font-semibold text-neutral-900">85/100</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-2">
                        <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs text-neutral-500">Cadence</p>
                        <p className="text-sm font-semibold text-neutral-900">172 spm</p>
                      </div>
                    </div>
                  </div>
                </div>
                <svg className="w-5 h-5 text-neutral-400 group-hover:text-primary-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </div> */}
        </div>
      </div>
    </div>
  );
};

export default IndividualDashboard;