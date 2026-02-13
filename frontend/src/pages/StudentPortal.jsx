import React from 'react';

const StudentPortal = () => {
    return (
        <div className="space-y-6">
            <div className="md:flex md:items-center md:justify-between">
                <div className="min-w-0 flex-1">
                    <h2 className="text-2xl font-bold leading-7 text-gray-900 dark:text-white sm:truncate sm:text-3xl sm:tracking-tight">
                        Student Portal
                    </h2>
                </div>
            </div>
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 transition-colors duration-200">
                <p className="text-gray-500 dark:text-gray-400">Student personal attendance records and stats will appear here.</p>
            </div>
        </div>
    );
};

export default StudentPortal;
