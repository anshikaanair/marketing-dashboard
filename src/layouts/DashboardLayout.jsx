import React from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';

const DashboardLayout = ({ children }) => {
    return (
        <div className="flex bg-slate-50 min-h-screen">
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0">
                <Header />
                <main className="flex-1 overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;
