'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import type { Role } from '@/types';
import {
  BarChart3,
  Home,
  Phone,
  LogOut,
  Settings,
  Menu,
  X,
  Workflow,
  Megaphone,
  Building2,
  ChevronDown,
} from 'lucide-react';

import {
  Popover, PopoverTrigger, PopoverContent
} from '@/components/ui/popover';

import type { User } from '@/types';

interface SidebarProps {
  user: User | null;
  onLogout: () => void;
}

interface NavigationItem {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  hasSubmenu?: boolean;
  submenuItems?: { name: string; href: string }[];
  /** If omitted, item is visible to all roles */
  allowedRoles?: Role[];
}

const navigationItems: NavigationItem[] = [
  {
    id: 'home',
    name: 'Home',
    icon: Home,
    href: '/home',
    allowedRoles: ['BUSINESS_ADMIN']
  },
  {
    id: 'marketing-sources',
    name: 'Marketing Sources',
    icon: Megaphone,
    href: '/marketing-sources',
    allowedRoles: ['BUSINESS_ADMIN']
  },
  {
    id: 'call-flows',
    name: 'Call Flows',
    icon: Workflow,
    href: '/call-flows',
    allowedRoles: ['BUSINESS_ADMIN']
  },
  {
    id: 'calls',
    name: 'Call Logs',
    icon: Phone,
    href: '/call-logs',
    allowedRoles: ['BUSINESS_ADMIN']
  },
  {
    id: 'businesses',
    name: 'Businesses',
    icon: Building2,
    href: '/businesses',
    allowedRoles: ['SUPER_ADMIN']
  }
];

export default function Sidebar({ user, onLogout }: SidebarProps) {

  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isUserAccountMenuOpen, setIsUserAccountMenuOpen] = useState<boolean>(false);
  const [activeItem, setActiveItem] = useState<string>('');
  const [openSubmenus, setOpenSubmenus] = useState<string[]>([]);


  const router = useRouter();
  const pathname = usePathname() || '/';

  const visibleItems = useMemo(() => {
    const role = user?.role as Role | undefined | null;

    return navigationItems.filter((item) => {
      if (!item.allowedRoles) return true; // no restriction
      if (!role) return false; // no role -> no restricted items
      return item.allowedRoles.includes(role);
    });
  }, [user?.role]);

  // Auto-open sidebar on desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsOpen(true);
      } else {
        setIsOpen(false);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Sync activeItem with URL on load & whenever URL changes
  useEffect(() => {
    if (!pathname) return;

    // Find top-level item
    const matchedItem = navigationItems.find((item) =>
      pathname === item.href || pathname.startsWith(item.href + '/')
    );

    if (matchedItem) {
      setActiveItem(matchedItem.id);

      // If submenu matches, open submenu automatically
      if (matchedItem.hasSubmenu && matchedItem.submenuItems) {
        const matchedSub = matchedItem.submenuItems.find((sub) =>
          pathname === sub.href || pathname.startsWith(sub.href + '/')
        );
        if (matchedSub) {
          setActiveItem(`${matchedItem.id}-${matchedSub.name.toLowerCase().replace(/\s+/g, '-')}`);
          setOpenSubmenus((prev) =>
            prev.includes(matchedItem.id) ? prev : [...prev, matchedItem.id]
          );
        }
      }
    }
  }, [pathname]);

  // Active-URL helpers
  // const isPathActive = (target: string) => {
  //   // Mark active if current path is exactly the target OR starts with it (for nested pages)
  //   if (target === '/') return pathname === '/';
  //   return pathname === target || pathname.startsWith(`${target}/`);
  // };

  // const isItemActive = (item: NavigationItem) => {
  //   if (isPathActive(item.href)) return true;
  //   if (item.submenuItems?.some((s) => isPathActive(s.href))) return true;
  //   return false;
  // };

  const toggleSidebar = () => setIsOpen(!isOpen);

  const toggleSubmenu = (itemId: string) => {
    setOpenSubmenus(prev =>
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleItemClick = (itemId: string, href: string, hasSubmenu?: boolean) => {
    if (hasSubmenu) {
      toggleSubmenu(itemId);
    } else {
      setActiveItem(itemId);
      router.push(href);
      // Close mobile sidebar when item is clicked
      if (window.innerWidth < 1024) {
        setIsOpen(false);
      }
    }
  };

  const handleLogOut = () => {
    setIsUserAccountMenuOpen(false);
    onLogout?.();
  };

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        onClick={toggleSidebar}
        className="fixed top-4 left-4 z-50 p-3 rounded-lg bg-purple-800 text-white shadow-lg lg:hidden hover:bg-purple-700 transition-colors"
        aria-label="Toggle sidebar"
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden transition-opacity"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      {/*  from-slate-800 via-slate-700 to-slate-800 
          border-r border-slate-600 z-40 transition-transform duration-300 ease-in-out*/}
      <div
        className={`
          fixed top-0 left-0 h-screen w-64 bg-gradient-to-b from-purple-900 via-purple-800 to-purple-900
          border-r border-slate-600 z-40 transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:static lg:z-auto
          flex flex-col shadow-2xl
        `}
      >
        {/* Header with logo */}
        <div className="p-6 border-b !border-purple-600 bg-purple-800/50">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-400 to-purple-500 rounded-lg flex items-center justify-center shadow-lg">
              <BarChart3 className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-white font-bold text-lg">Call Tracking</h1>
              {/* <p className="text-slate-300 text-xs">by CallBox</p> */}
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-4 overflow-y-auto">
          <ul className="space-y-1">
            {visibleItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeItem === item.id;
              // const isActive = isItemActive(item);
              const hasOpenSubmenu = openSubmenus.includes(item.id);

              return (
                <li key={item.id}>
                  <button
                    onClick={() => handleItemClick(item.id, item.href, item.hasSubmenu)}
                    className={`
                      cursor-pointer w-full flex items-center px-3 py-3 rounded-lg text-left transition-all duration-200 group
                      ${isActive && !item.hasSubmenu
                        ? 'bg-purple-600 text-white shadow-md'
                        : 'text-purple-200 hover:bg-purple-700/50 hover:text-white'
                      }
                    `}
                  >
                    <Icon className={`h-5 w-5 mr-3 ${isActive && !item.hasSubmenu ? 'text-white' : 'text-purple-300'}`} />
                    <span className="flex-1 font-medium text-sm">{item.name}</span>
                    {item.hasSubmenu && (
                      <ChevronDown
                        className={`h-4 w-4 transition-transform duration-200 ${hasOpenSubmenu ? 'rotate-180' : ''
                          }`}
                      />
                    )}
                  </button>

                  {/* Submenu */}
                  {item.hasSubmenu && hasOpenSubmenu && item.submenuItems && (
                    <ul className="ml-8 mt-2 space-y-1">
                      {item.submenuItems.map((subItem) => (
                        <li key={subItem.href}>
                          <button
                            onClick={() => {
                              setActiveItem(`${item.id}-${subItem.name.toLowerCase().replace(/\s+/g, '-')}`);
                              if (window.innerWidth < 1024) setIsOpen(false);
                            }}
                            className="w-full text-left px-3 py-2 text-sm text-purple-300 hover:text-white hover:bg-purple-700/30 rounded-md transition-colors"
                          >
                            {subItem.name}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User profile section */}
        <Popover open={isUserAccountMenuOpen} onOpenChange={setIsUserAccountMenuOpen}>
          <PopoverTrigger asChild>
            <div className={`p-3 border-t cursor-pointer border-purple-600 bg-purple-800/30`}> {/**border-purple-600 bg-purple-800/30 */}
              {user && (
                <div className="mb-2">
                  <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-purple-600/50 bg-purple-700/50"> {/**bg-purple-700/50 */}
                    <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center shadow-md">
                      <span className="text-white font-semibold text-sm">
                        {user.name?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'U'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium text-sm truncate mb-1">{user.name}</p>
                      <p className="text-slate-300 text-xs truncate">{user.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Business Admin'}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </PopoverTrigger>
          <PopoverContent
            onOpenAutoFocus={(e) => e.preventDefault()}   // keep focus on the trigger
            onCloseAutoFocus={(e) => e.preventDefault()}  // don't force focus back to trigger
            side='top'
            className='w-64 bg-transparent border-0 py-0 px-1.5 translate-y-3'
          >
            <div className='w-full bg-purple-800 rounded-md border-0 px-1 py-2'>
              <button
                className={`cursor-pointer w-full flex items-center px-3 py-3 rounded-lg text-left transition-all 
                  duration-200 text-purple-300 hover:text-white hover:bg-purple-700/50 
                  outline-none focus-visible:outline-1 focus-visible:ring-1`}
              >
                <Settings className="h-5 w-5 mr-3" />
                <span className="font-medium text-sm">Settings</span>
              </button>
              <button
                onClick={() => { handleLogOut(); }}
                className={`cursor-pointer w-full flex items-center px-3 py-3 rounded-lg text-left transition-all 
                  duration-200 text-red-400 hover:bg-red-900/40 hover:text-red-300
                  outline-none focus-visible:outline-1 focus-visible:ring-1`}
              >
                <LogOut className="h-5 w-5 mr-3" />
                <span className="font-medium text-sm">Logout</span>
              </button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </>
  );
}


// const navigationItems: NavigationItem[] = [
//   {
//     id: 'go-to-service',
//     name: 'Go To Call Tracking Service',
//     icon: BarChart3,
//     href: '/service'
//   },
//   {
//     id: 'dashboard',
//     name: 'Dashboard',
//     icon: LayoutDashboard,
//     href: '/dashboard'
//   },
//   {
//     id: 'pursue-box',
//     name: 'Pursue Box',
//     icon: MessageSquare,
//     href: '/pursue-box'
//   },
//   {
//     id: 'reports',
//     name: 'Call Tracking Reports',
//     icon: FileText,
//     href: '/reports',
//     hasSubmenu: true,
//     submenuItems: [
//       { name: 'Call Volume', href: '/reports/volume' },
//       { name: 'Marketing Sources', href: '/reports/sources' },
//       { name: 'Call Recordings', href: '/reports/recordings' },
//       { name: 'Transcripts', href: '/reports/transcripts' }
//     ]
//   },
//   {
//     id: 'resources',
//     name: 'Resources',
//     icon: FileText,
//     href: '/resources',
//     hasSubmenu: true,
//     submenuItems: [
//       { name: 'Documentation', href: '/resources/docs' },
//       { name: 'API Reference', href: '/resources/api' },
//       { name: 'Webhooks', href: '/resources/webhooks' }
//     ]
//   },
//   {
//     id: 'configuration',
//     name: 'Configuration',
//     icon: Settings,
//     href: '/configuration',
//     hasSubmenu: true,
//     submenuItems: [
//       { name: 'Marketing Sources', href: '/configuration/sources' },
//       { name: 'Phone Numbers', href: '/configuration/numbers' },
//       { name: 'Call Forwarding', href: '/configuration/forwarding' },
//       { name: 'Integration Settings', href: '/configuration/integration' }
//     ]
//   },
//   {
//     id: 'search',
//     name: 'Search For A Call',
//     icon: Search,
//     href: '/search'
//   },
//   {
//     id: 'dialer',
//     name: 'Dialer',
//     icon: Phone,
//     href: '/dialer'
//   },
//   {
//     id: 'support',
//     name: 'Support',
//     icon: HelpCircle,
//     href: '/support'
//   }
// ];