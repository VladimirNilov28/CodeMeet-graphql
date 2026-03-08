import React from 'react';

type FeedbackVariant = 'success' | 'error' | 'info';

type FeedbackBannerProps = {
  variant: FeedbackVariant;
  children: React.ReactNode;
  className?: string;
};

const variantClasses: Record<FeedbackVariant, string> = {
  success: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300',
  error: 'border-red-500/20 bg-red-500/10 text-red-300',
  info: 'border-indigo-500/20 bg-indigo-500/10 text-indigo-200',
};

const FeedbackBanner: React.FC<FeedbackBannerProps> = ({ variant, children, className = '' }) => {
  return (
    <div
      role="alert"
      className={`rounded-xl border px-4 py-3 text-sm backdrop-blur-sm ${variantClasses[variant]} ${className}`.trim()}
    >
      {children}
    </div>
  );
};

export default FeedbackBanner;