'use client';

/**
 * Patient card component for displaying patient summary
 */
export function PatientCard({ patient, onClick }) {
  const statusColors = {
    stable: 'bg-green-500',
    monitoring: 'bg-yellow-500',
    critical: 'bg-red-500'
  };

  const calculateHospitalDay = (admissionDate) => {
    if (!admissionDate) return '?';
    const diff = Date.now() - new Date(admissionDate).getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const getInitials = (name) => {
    if (!name) return 'P';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return parts[0][0] + parts[parts.length - 1][0];
    }
    return name[0];
  };

  return (
    <button
      onClick={() => onClick && onClick(patient)}
      className="w-full bg-white dark:bg-slate-800 rounded-xl p-4 shadow-card hover:shadow-card-hover border border-slate-200 dark:border-slate-700 active:bg-slate-50 dark:active:bg-slate-700 transition-all text-left"
    >
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 ring-2 ring-primary/20">
          <span className="text-lg font-bold text-primary">
            {getInitials(patient.name)}
          </span>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-slate-900 dark:text-white truncate">
              {patient.name || `Patient ${patient.mrn}`}
            </h3>
            <span className={`w-2 h-2 rounded-full ${statusColors[patient.status] || statusColors.stable}`} />
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {patient.age}yo {patient.gender?.charAt(0).toUpperCase()} • MRN: {patient.mrn}
          </p>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 truncate">
            CC: {patient.chiefComplaint || 'Not specified'}
          </p>
        </div>

        {/* Arrow */}
        <span className="text-slate-400 text-xl self-center">→</span>
      </div>

      {/* Quick stats */}
      <div className="flex gap-4 mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
        <div className="flex-1">
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">Reports</p>
          <p className="font-semibold text-slate-900 dark:text-white">{patient.reportCount || 0}</p>
        </div>
        <div className="flex-1">
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">Hospital Day</p>
          <p className="font-semibold text-slate-900 dark:text-white">
            HD#{calculateHospitalDay(patient.admissionDate)}
          </p>
        </div>
        <div className="flex-1">
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">Status</p>
          <p className="font-semibold text-slate-900 dark:text-white capitalize">{patient.status || 'Stable'}</p>
        </div>
      </div>
    </button>
  );
}

export default PatientCard;
