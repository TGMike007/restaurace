import { Outlet, NavLink, useNavigate } from 'react-router-dom';

const MainLayout: React.FC = () => {
  const token = localStorage.getItem('access_token');
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    navigate('/');
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `hover:text-gray-300 transition-colors px-3 py-1 rounded ${isActive ? 'bg-gray-600 text-white' : 'text-gray-300'}`;

  return (
    <div className="flex flex-col min-h-screen bg-gray-900">
      <nav className="bg-gray-800 text-white p-4 shadow-md">
        <ul className="flex space-x-2 container mx-auto items-center">
          <li><NavLink to="/" end className={navLinkClass}>Domů</NavLink></li>
          {token && (
            <li><NavLink to="/dashboard" className={navLinkClass}>Dashboard</NavLink></li>
          )}
          <li className="ml-auto">
            {token ? (
              <button onClick={handleLogout} className="bg-red-600 px-3 py-1 rounded hover:bg-red-700 transition-colors">
                Odhlásit se
              </button>
            ) : (
              <NavLink to="/login" className={navLinkClass}>
                Přihlásit se
              </NavLink>
            )}
          </li>
        </ul>
      </nav>

      <main className="flex-grow p-6 container mx-auto">
        <Outlet />
      </main>

      <footer className="text-center p-4 text-gray-500 text-sm">
        © {new Date().getFullYear()} IS Šablona
      </footer>
    </div>
  );
};

export default MainLayout;