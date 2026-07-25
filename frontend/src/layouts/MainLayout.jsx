import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Footer from '../components/Footer';
import { LogOut, LayoutDashboard, User } from 'lucide-react';

export default function MainLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <Link to="/" className="flex-shrink-0 flex items-center">
                <span className="font-bold text-xl text-blue-600">Digital Heroes</span>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-slate-500 flex items-center gap-2">
                <User size={16} />
                {user?.name} ({user?.role})
              </span>
              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-2 px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none transition-colors"
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex">
        <aside className="w-64 hidden sm:block pr-8">
          <nav className="space-y-1">
            <Link
              to="/"
              className="bg-blue-50 border-blue-500 text-blue-700 border-l-4 group flex items-center px-3 py-2 text-sm font-medium"
            >
              <LayoutDashboard className="text-blue-500 mr-3 flex-shrink-0 h-5 w-5" />
              Dashboard
            </Link>
          </nav>
        </aside>

        <main className="flex-1 bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <Outlet />
        </main>
      </div>
      <Footer />
    </div>
  );
}
