import React from 'react';
import { Link } from 'react-router-dom';

export const StatCard = ({ title, value, colorClass = "text-yellow-500", icon, to }) => {
    const content = (
        <>
            <div>
                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">{title}</p>
                <p className={`text-3xl font-black ${colorClass}`}>{value}</p>
            </div>
            {icon && <div className={`text-4xl ${colorClass} opacity-50`}>{icon}</div>}
        </>
    );

    if (to) {
        return (
            <Link to={to} className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-xl flex items-center justify-between hover:border-yellow-500/50 hover:bg-gray-800/50 transition-all duration-200 cursor-pointer group">
                {content}
            </Link>
        );
    }

    return (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-xl flex items-center justify-between">
            {content}
        </div>
    );
};

export const ChartCard = ({ title, children }) => (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-xl w-full">
        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-6 border-b border-gray-800 pb-2">{title}</h3>
        <div className="w-full h-[300px] flex items-center justify-center">
            {children}
        </div>
    </div>
);

export const DataTable = ({ columns, data, keyExtractor, renderRow, emptyMessage = "No data available." }) => (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-x-auto shadow-xl">
        <table className="w-full text-left text-sm text-gray-300">
            <thead className="bg-gray-950 text-gray-400 uppercase text-xs font-bold">
                <tr>
                    {columns.map((col, i) => (
                        <th key={i} className="px-6 py-4">{col}</th>
                    ))}
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
                {data.length === 0 ? (
                    <tr>
                        <td colSpan={columns.length} className="text-center py-8 text-gray-500">
                            {emptyMessage}
                        </td>
                    </tr>
                ) : (
                    data.map((item, i) => (
                        <tr key={keyExtractor(item, i)} className="hover:bg-gray-800/50 transition">
                            {renderRow(item, i)}
                        </tr>
                    ))
                )}
            </tbody>
        </table>
    </div>
);

export const StatusBadge = ({ status }) => {
    let colorClass = 'bg-gray-800 text-gray-400 border-gray-700';
    const s = status ? status.toUpperCase() : '';
    
    if (['VERIFIED', 'CONFIRMED', 'PUBLISHED'].includes(s)) {
        colorClass = 'bg-green-500/10 text-green-500 border-green-500/30';
    } else if (['REJECTED', 'PAYMENT_REJECTED', 'CLOSED'].includes(s)) {
        colorClass = 'bg-red-500/10 text-red-500 border-red-500/30';
    } else if (['PENDING', 'DRAFT'].includes(s)) {
        colorClass = 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30';
    }
    
    return (
        <span className={`px-2 py-1 rounded text-xs font-bold border ${colorClass}`}>
            {status || 'UNKNOWN'}
        </span>
    );
};

export const LoadingState = ({ message = "Loading dashboard data..." }) => (
    <div className="flex flex-col items-center justify-center py-20">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-yellow-500 mb-4"></div>
        <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">{message}</p>
    </div>
);

export const ErrorState = ({ message, onRetry }) => (
    <div className="bg-red-500/10 border border-red-500/50 rounded-2xl p-8 text-center max-w-lg mx-auto mt-12">
        <h3 className="text-2xl font-black text-red-500 uppercase mb-2">Error</h3>
        <p className="text-gray-400 mb-6">{message}</p>
        {onRetry && (
            <button onClick={onRetry} className="bg-red-500 text-white font-bold py-2 px-6 rounded hover:bg-red-600 transition">
                Retry
            </button>
        )}
    </div>
);

export const EmptyState = ({ title, message, actionLabel, actionLink }) => (
    <div className="text-center py-16 px-4 bg-gray-900 border border-gray-800 rounded-2xl shadow-xl">
        <h3 className="text-xl font-bold text-white uppercase tracking-wider mb-2">{title}</h3>
        <p className="text-gray-500 mb-6">{message}</p>
        {actionLink && actionLabel && (
            <Link to={actionLink} className="inline-block bg-yellow-500 hover:bg-yellow-400 text-gray-950 font-bold py-2 px-6 rounded uppercase transition shadow-lg">
                {actionLabel}
            </Link>
        )}
    </div>
);
