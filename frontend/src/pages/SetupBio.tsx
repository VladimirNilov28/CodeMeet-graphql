import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

type BioForm = {
  primaryLanguage: string;
  experienceLevel: string;
  lookFor: string;
  preferredOs: string;
  codingStyle: string;
  city: string;
};

type BioErrors = Partial<Record<keyof BioForm, string>>;

const defaultBio: BioForm = {
  primaryLanguage: '',
  experienceLevel: '',
  lookFor: '',
  preferredOs: '',
  codingStyle: '',
  city: '',
};

const primaryLanguageOptions = ['TypeScript', 'JavaScript', 'Java', 'Python', 'C#', 'Go', 'Rust', 'Kotlin'];
const experienceLevelOptions = ['Beginner', 'Junior', 'Mid', 'Senior', 'Lead'];
const lookForOptions = ['Pair Programming', 'Hackathon Teammate', 'Long-term Project', 'Mentor', 'Mentee', 'Code Review Partner'];
const preferredOsOptions = ['Windows', 'Linux', 'macOS', 'WSL'];
const codingStyleOptions = ['Clean Code', 'Pragmatic', 'TDD', 'Fast Prototyping', 'Architecture-first', 'Functional'];

const splitCsv = (value: string): string[] =>
  value
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);

const toCsv = (values: string[]): string => values.join(', ');

const calculateCompletion = (bio: BioForm): number => {
  const fields: (keyof BioForm)[] = ['primaryLanguage', 'experienceLevel', 'lookFor', 'preferredOs', 'codingStyle', 'city'];
  const filled = fields.filter((field) => bio[field].trim().length > 0).length;
  return Math.round((filled / fields.length) * 100);
};

const SetupBio: React.FC = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState<BioForm>(defaultBio);
  const [errors, setErrors] = useState<BioErrors>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const completion = calculateCompletion(form);
  const ringSize = 120;
  const stroke = 10;
  const radius = (ringSize - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - completion / 100);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token || token === 'undefined' || token === 'null') {
      navigate('/login');
      return;
    }

    const preloadBio = async () => {
      try {
        const res = await api.get('/me/bio');
        setForm({
          primaryLanguage: res.data?.primaryLanguage || '',
          experienceLevel: res.data?.experienceLevel || '',
          lookFor: res.data?.lookFor || '',
          preferredOs: res.data?.preferredOs || '',
          codingStyle: res.data?.codingStyle || '',
          city: res.data?.city || '',
        });
      } catch {
        // No existing bio yet is fine; keep defaults.
      } finally {
        setLoading(false);
      }
    };

    preloadBio();
  }, [navigate]);

  const onChange = (field: keyof BioForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const onMultiSelectChange = (field: keyof BioForm, selectedOptions: HTMLOptionsCollection) => {
    const values = Array.from(selectedOptions)
      .filter((option) => option.selected)
      .map((option) => option.value);

    onChange(field, toCsv(values));
  };

  const validateField = (field: keyof BioForm, value: string): string => {
    const trimmed = value.trim();

    if (!trimmed) {
      return 'This field is required.';
    }

    if (field === 'experienceLevel') {
      if (!experienceLevelOptions.includes(trimmed)) {
        return 'Select a valid experience level.';
      }
      return '';
    }

    if (field === 'city') {
      if (trimmed.length < 2) {
        return 'City must be at least 2 characters.';
      }
      if (trimmed.length > 40) {
        return 'City must be at most 40 characters.';
      }
      if (!/^[a-zA-ZÀ-ž\s'-]+$/.test(trimmed)) {
        return 'City can only contain letters, spaces, apostrophes, and hyphens.';
      }
      return '';
    }

    const selectedCount = splitCsv(trimmed).length;
    if (selectedCount === 0) {
      return 'Please select at least one option.';
    }
    if (selectedCount > 3) {
      return 'Please choose up to 3 options.';
    }

    return '';
  };

  const validateForm = (): boolean => {
    const nextErrors: BioErrors = {};
    const fields: (keyof BioForm)[] = ['primaryLanguage', 'experienceLevel', 'lookFor', 'preferredOs', 'codingStyle', 'city'];

    fields.forEach((field) => {
      const message = validateField(field, form[field]);
      if (message) {
        nextErrors[field] = message;
      }
    });

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) {
      setError('Please correct the highlighted fields before saving.');
      setSuccess('');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      await api.post('/me/bio', form);
      setSuccess('BIO_SYNC_COMPLETE. Redirecting to dashboard...');
      setTimeout(() => navigate('/dashboard'), 800);
    } catch (err: any) {
      if (err?.response?.status === 401 || err?.response?.status === 403) {
        localStorage.removeItem('token');
        navigate('/login');
        return;
      }

      const backendMessage = typeof err?.response?.data === 'string'
        ? err.response.data
        : err?.response?.data?.message;

      setError(backendMessage || 'Failed to save bio');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-cyan-400">BOOTSTRAPPING_BIO_MODULE...</div>;
  }

  return (
    <div className="p-8 max-w-3xl mx-auto mt-10">
      <div className="flex justify-between items-center mb-8 border-b border-fuchsia-500 pb-4">
        <h1 className="text-3xl text-cyan-400 drop-shadow-[0_0_8px_rgba(0,255,204,0.8)]">SETUP_BIO_PROTOCOL</h1>
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className="text-cyan-400 border border-cyan-500 px-4 py-2 hover:bg-cyan-500 hover:text-black transition-colors"
        >
          BACK_TO_DASH
        </button>
      </div>

      <div className="cyber-panel p-5 mb-6 flex items-center gap-4">
        <div className="relative" aria-label={`Bio completion ${completion}%`}>
          <svg width={ringSize} height={ringSize} className="-rotate-90">
            <circle
              cx={ringSize / 2}
              cy={ringSize / 2}
              r={radius}
              stroke="rgba(255,255,255,0.15)"
              strokeWidth={stroke}
              fill="transparent"
            />
            <circle
              cx={ringSize / 2}
              cy={ringSize / 2}
              r={radius}
              stroke="#00ffcc"
              strokeWidth={stroke}
              strokeLinecap="round"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              style={{ transition: 'stroke-dashoffset 0.35s ease' }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center text-cyan-300 font-bold text-lg">
            {completion}%
          </div>
        </div>
        <div>
          <h2 className="text-xl text-fuchsia-400">BIO_COMPLETION</h2>
          <p className="text-sm text-cyan-200">Complete all fields to unlock better recommendations.</p>
          <p className="text-xs text-cyan-500 mt-1">Tip: Use Ctrl/Cmd + click to select multiple options.</p>
        </div>
      </div>

      <div className="cyber-panel p-6">
        {error && <div className="text-red-500 mb-4">[{error}]</div>}
        {success && <div className="text-green-400 mb-4">{success}</div>}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm mb-1 text-cyan-500">PRIMARY_LANGUAGE</label>
            <select
              className={`cyber-input h-32 ${errors.primaryLanguage ? 'border-red-500' : ''}`}
              multiple
              value={splitCsv(form.primaryLanguage)}
              onChange={(e) => onMultiSelectChange('primaryLanguage', e.target.options)}
            >
              {primaryLanguageOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
            {errors.primaryLanguage && <p className="text-red-400 text-xs mt-1">{errors.primaryLanguage}</p>}
          </div>

          <div>
            <label className="block text-sm mb-1 text-cyan-500">EXPERIENCE_LEVEL</label>
            <select
              className={`cyber-input ${errors.experienceLevel ? 'border-red-500' : ''}`}
              value={form.experienceLevel}
              onChange={(e) => onChange('experienceLevel', e.target.value)}
            >
              <option value="">Select level...</option>
              {experienceLevelOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
            {errors.experienceLevel && <p className="text-red-400 text-xs mt-1">{errors.experienceLevel}</p>}
          </div>

          <div>
            <label className="block text-sm mb-1 text-cyan-500">LOOKING_FOR</label>
            <select
              className={`cyber-input h-32 ${errors.lookFor ? 'border-red-500' : ''}`}
              multiple
              value={splitCsv(form.lookFor)}
              onChange={(e) => onMultiSelectChange('lookFor', e.target.options)}
            >
              {lookForOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
            {errors.lookFor && <p className="text-red-400 text-xs mt-1">{errors.lookFor}</p>}
          </div>

          <div>
            <label className="block text-sm mb-1 text-cyan-500">PREFERRED_OS</label>
            <select
              className={`cyber-input h-32 ${errors.preferredOs ? 'border-red-500' : ''}`}
              multiple
              value={splitCsv(form.preferredOs)}
              onChange={(e) => onMultiSelectChange('preferredOs', e.target.options)}
            >
              {preferredOsOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
            {errors.preferredOs && <p className="text-red-400 text-xs mt-1">{errors.preferredOs}</p>}
          </div>

          <div>
            <label className="block text-sm mb-1 text-cyan-500">CODING_STYLE</label>
            <select
              className={`cyber-input h-32 ${errors.codingStyle ? 'border-red-500' : ''}`}
              multiple
              value={splitCsv(form.codingStyle)}
              onChange={(e) => onMultiSelectChange('codingStyle', e.target.options)}
            >
              {codingStyleOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
            {errors.codingStyle && <p className="text-red-400 text-xs mt-1">{errors.codingStyle}</p>}
          </div>

          <div>
            <label className="block text-sm mb-1 text-cyan-500">CITY</label>
            <input
              className={`cyber-input ${errors.city ? 'border-red-500' : ''}`}
              value={form.city}
              onChange={(e) => onChange('city', e.target.value)}
              placeholder="Tallinn / Remote"
              maxLength={40}
            />
            {errors.city && <p className="text-red-400 text-xs mt-1">{errors.city}</p>}
          </div>

          <div className="md:col-span-2 pt-2">
            <button
              type="submit"
              className="cyber-button w-full py-3 font-bold tracking-widest hover:text-white disabled:opacity-60"
              disabled={saving}
            >
              {saving ? 'SAVING_BIO...' : 'SAVE_BIO'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SetupBio;
