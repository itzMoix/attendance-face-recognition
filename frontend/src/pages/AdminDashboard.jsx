import React from 'react';
import StudentManagement from '../components/admin/StudentManagement';
import { Users, GraduationCap, Video, Activity } from 'lucide-react';
import { mockStats } from '../services/mockData';

const StatCard = ({ title, value, icon: Icon, color, trend }) => (
    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm rounded-xl border border-gray-100 dark:border-gray-700 transition-colors duration-200">
        <div className="p-5">
            <div className="flex items-center">
                <div className={`flex-shrink-0 rounded-md p-3 ${color}`}>
                    <Icon className="h-6 w-6 text-white" aria-hidden="true" />
                </div>
                <div className="ml-5 w-0 flex-1">
                    <dl>
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">{title}</dt>
                        <dd>
                            <div className="text-lg font-bold text-gray-900 dark:text-white">{value}</div>
                        </dd>
                    </dl>
                </div>
            </div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-700/50 px-5 py-3 transition-colors duration-200">
            <div className="text-xs font-medium text-emerald-700 dark:text-emerald-400 truncate">
                {trend}
            </div>
        </div>
    </div>
);

const AdminDashboard = () => {
    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Panel de Administración</h1>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Bienvenido de nuevo, Administrador</p>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Total Estudiantes"
                    value={mockStats.totalStudents}
                    icon={Users}
                    color="bg-indigo-600"
                    trend="+12 nuevos esta semana"
                />
                <StatCard
                    title="Asistencia Hoy"
                    value={mockStats.todayAttendance}
                    icon={Activity}
                    color="bg-emerald-500"
                    trend="En promedio normal"
                />
                <StatCard
                    title="Cámaras Activas"
                    value={mockStats.activeCameras}
                    icon={Video}
                    color="bg-blue-500"
                    trend="Todos los sistemas operativos"
                />
                <StatCard
                    title="Alertas Pendientes"
                    value={mockStats.pendingAlerts}
                    icon={GraduationCap}
                    color="bg-amber-500"
                    trend="Requiere atención"
                />
            </div>

            <div>
                <StudentManagement />
            </div>
        </div>
    );
};

export default AdminDashboard;
