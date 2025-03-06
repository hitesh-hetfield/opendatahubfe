"use client"
import { Disclosure, DisclosureButton } from '@headlessui/react'
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { ShoppingCart, Upload, User } from 'lucide-react'
import { useAccount } from 'wagmi'


function classNames(...classes) {
    return classes.filter(Boolean).join(' ')
}

export default function Navbar() {
    const { address } = useAccount();
    const pathname = usePathname();

    const navigation = address ?
        [
            { name: 'Buy CSV', href: '/buy', current: false, icon: <ShoppingCart /> },
            { name: 'Upload CSV', href: '/upload', current: true, icon: <Upload /> },
            { name: 'Account', href: '/account', current: false, icon: <User /> },
        ] :
        [
            { name: 'Buy CSV', href: '/buy', current: false, icon: <ShoppingCart /> },
            { name: 'Upload CSV', href: '/upload', current: true, icon: <Upload /> }
        ]
    return (
        <>
            {/* Desktop Sidebar */}
            <div className="hidden sm:flex sm:flex-col bg-accent/30  py-1 sm:w-64 h-[90%] rounded-md">
                <div className="flex flex-col flex-1 pt-5 pb-4">
                    <div className="flex items-center justify-center flex-shrink-0 px-4">
                        <h1 className="text-2xl w-full flex justify-start items-center font-bold">OpenDataHub</h1>
                    </div>
                    <div className="mt-5 h-full px-1 flex flex-col">
                        {navigation.map((item) => (
                            <Link
                                key={item.name}
                                href={item.href}
                                aria-current={item.current ? 'page' : undefined}
                                className={classNames(
                                    (item.href === pathname)
                                        ?
                                        'bg-primary font-bold'
                                        :
                                        'hover:bg-black/80', 'rounded-md transition-colors delay-75 p-3 flex items-center gap-2 my-1 text-sm font-bold min-w-fit')}>
                                {item.icon} {item.name}
                            </Link>
                        ))}
                    </div>
                    <div className="flex justify-center items-center w-full">
                        <ConnectButton
                            showBalance={false}
                            accountStatus={'address'}
                            chainStatus={'icon'} />
                    </div>
                </div>
            </div>

            {/* Mobile Navbar with Sheet */}
            <Disclosure as="nav" className="bg-gray-800 sm:hidden">
                <div className="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8">
                    <div className="relative flex h-16 items-center justify-between">
                        <div className="absolute inset-y-0 left-0 flex items-center sm:hidden">
                            <Sheet>
                                <SheetTrigger asChild>
                                    <DisclosureButton className="group relative inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-700 hover:text-white focus:ring-2 focus:ring-white focus:outline-hidden focus:ring-inset">
                                        <span className="absolute -inset-0.5" />
                                        <span className="sr-only">Open main menu</span>
                                        <Bars3Icon aria-hidden="true" className="block size-6 group-data-open:hidden" />
                                        <XMarkIcon aria-hidden="true" className="hidden size-6 group-data-open:block" />
                                    </DisclosureButton>
                                </SheetTrigger>
                                <SheetContent side="left" className="bg-gray-800">
                                    <div className="space-y-1 px-2 pt-2 pb-3">
                                        {navigation.map((item) => (
                                            <Link
                                                key={item.name}
                                                as="a"
                                                href={item.href}
                                                aria-current={item.current ? 'page' : undefined}
                                                className={classNames(
                                                    item.current ? 'bg-gray-900 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white',
                                                    'block rounded-md px-3 py-2 text-base font-medium',
                                                )}
                                            >
                                                {item.name}
                                            </Link>
                                        ))}
                                    </div>
                                    <div className="px-4">
                                        <ConnectButton accountStatus={'address'} chainStatus={'name'} />
                                    </div>
                                </SheetContent>
                            </Sheet>
                        </div>
                    </div>
                </div>
            </Disclosure>
        </>
    )
}