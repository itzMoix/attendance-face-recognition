import React from 'react';

const LiveAttendance = () => {
    return (
        <div className="max-w-4xl mx-auto">
            <div className="bg-black aspect-video rounded-lg shadow-xl flex items-center justify-center relative overflow-hidden">
                <div className="text-white text-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto mb-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 10l4.553-2.276A1 1 0 0121 8.818v6.364a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <p className="text-xl font-medium">Camera Feed Placeholder</p>
                    <p className="text-sm text-gray-400 mt-2">Live face detection will be implemented here</p>
                </div>
            </div>

            <div className="mt-6 bg-white dark:bg-gray-800 shadow rounded-lg p-6 transition-colors duration-200">
                <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">Session Info</h3>
                <dl className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-3">
                    <div className="px-4 py-5 bg-gray-50 dark:bg-gray-700 shadow rounded-lg overflow-hidden sm:p-6 transition-colors duration-200">
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Laboratory</dt>
                        <dd className="mt-1 text-3xl font-semibold text-gray-900 dark:text-white">Lab A</dd>
                    </div>
                    <div className="px-4 py-5 bg-gray-50 dark:bg-gray-700 shadow rounded-lg overflow-hidden sm:p-6 transition-colors duration-200">
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Subject</dt>
                        <dd className="mt-1 text-3xl font-semibold text-gray-900 dark:text-white">Physics 101</dd>
                    </div>
                    <div className="px-4 py-5 bg-gray-50 dark:bg-gray-700 shadow rounded-lg overflow-hidden sm:p-6 transition-colors duration-200">
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Attended</dt>
                        <dd className="mt-1 text-3xl font-semibold text-gray-900 dark:text-white">12/25</dd>
                    </div>
                </dl>
            </div>
        </div>
    );
};

export default LiveAttendance;
