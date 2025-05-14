'use client';
import { Home, LogOut, PanelLeft, Users2 } from 'lucide-react';

import { MdOutlinePayment } from 'react-icons/md';

import { BiMessageAdd } from 'react-icons/bi';
import { LiaVialSolid } from 'react-icons/lia';
import { TbSettingsDollar } from 'react-icons/tb';

import { useState } from 'react';
import { IoSettingsOutline, IoTicketOutline } from 'react-icons/io5';

import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip';
import { Analytics } from '@vercel/analytics/react';
import { signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { FaCube } from 'react-icons/fa';
import { RiUserSettingsFill } from 'react-icons/ri';
import { NavItem } from './nav-item';
import Providers from './providers';

export default function DashboardLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push('/login');
  };

  return (
    <Providers>
      <main className="flex min-h-screen w-full flex-col bg-muted/40">
        <DesktopNav onLogout={handleLogout} />
        <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14">
          <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
            <MobileNav onLogout={handleLogout} />
          </header>
          <main className="grid flex-1 items-start gap-2 p-4 sm:px-6 sm:py-0 md:gap-4 bg-muted/40">
            {children}
          </main>
        </div>
        <Analytics />
      </main>
    </Providers>
  );
}

function DesktopNav({ onLogout }: { onLogout: () => void }) {
  return (
    <aside className="fixed inset-y-0 left-0 z-10 hidden w-14 flex-col border-r bg-background sm:flex">
      <nav className="flex flex-col items-center gap-4 px-2 sm:py-5">
        {/* <NavItem href="/" label="Dashboard">
          <Home className="h-5 w-5" />
        </NavItem> */}

        <NavItem href="/users" label="Пользователи">
          <Users2 className="h-5 w-5" />
        </NavItem>

        <NavItem href="/workers" label="Работники">
          <RiUserSettingsFill className="h-5 w-5" />
        </NavItem>

        <NavItem href="/send-message" label="Рассылка">
          <BiMessageAdd className="h-5 w-5" />
        </NavItem>

        <NavItem href="/discount" label="Настройка скидки">
          <TbSettingsDollar className="h-5 w-5" />
        </NavItem>

        <NavItem href="/retouchSettings" label="Настройка ретуши">
          <IoSettingsOutline className="h-5 w-5" />
        </NavItem>

        <NavItem href="/payments" label="Платежи">
          <MdOutlinePayment className="h-5 w-5" />
        </NavItem>

        <NavItem href="/promocodes" label="PromoCodes">
          <IoTicketOutline className="h-5 w-5" />
        </NavItem>

        <NavItem href="/products" label="Продукты">
          <FaCube className="h-5 w-5" />
        </NavItem>

        <NavItem href="/vials" label="Флаконы">
          <LiaVialSolid className="h-5 w-5" />
        </NavItem>
      </nav>
      <nav className="mt-auto flex flex-col items-center gap-4 px-2 sm:py-5">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={onLogout}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">Выход</TooltipContent>
        </Tooltip>
      </nav>
    </aside>
  );
}

function MobileNav({ onLogout }: { onLogout: () => void }) {
  const [isOpen, setIsOpen] = useState(false);

  const handleToggle = () => setIsOpen(!isOpen);
  const handleClose = () => setIsOpen(false);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button size="icon" variant="outline" className="sm:hidden">
          <PanelLeft className="h-5 w-5" />
          <span className="sr-only">Toggle Menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="sm:max-w-xs p-4">
        <nav className="grid gap-4 text-lg font-medium">
          {/* <Link
            href="/"
            className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
            onClick={handleClose}
          >
            <Home className="h-5 w-5" />
            Dashboard
          </Link> */}

          <Link
            href="/users"
            className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
            onClick={handleClose}
          >
            <Users2 className="h-5 w-5" />
            Пользователи
          </Link>

          <Link
            href="/workers"
            className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
            onClick={handleClose}
          >
            <RiUserSettingsFill className="h-5 w-5" />
            Работники
          </Link>

          <Link
            href="/send-message"
            className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
            onClick={handleClose}
          >
            <BiMessageAdd className="h-5 w-5" />
            Рассылка
          </Link>

          <Link
            href="/discount"
            className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
            onClick={handleClose}
          >
            <TbSettingsDollar className="h-5 w-5" />
            Настройка скидки
          </Link>

          <Link
            href="/retouchSettings"
            className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
            onClick={handleClose}
          >
            <IoSettingsOutline className="h-5 w-5" />
            Настройка ретуши
          </Link>

          <Link
            href="/payments"
            className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
            onClick={handleClose}
          >
            <MdOutlinePayment className="h-5 w-5" />
            Платежи{' '}
          </Link>

          <Link
            href="/promocodes"
            className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
            onClick={handleClose}
          >
            <IoTicketOutline className="h-5 w-5" />
            PromoCodes
          </Link>

          <Link
            href="/products"
            className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
            onClick={handleClose}
          >
            <FaCube className="h-5 w-5" />
            Продукты
          </Link>

          <Link
            href="/vials"
            className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
            onClick={handleClose}
          >
            <LiaVialSolid className="h-5 w-5" />
            Флаконы
          </Link>

          <button
            onClick={() => {
              onLogout();
              handleClose();
            }}
            className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
          >
            <LogOut className="h-5 w-5" />
            Logout
          </button>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
