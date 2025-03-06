"use client"

import React from 'react'
import '@rainbow-me/rainbowkit/styles.css';
import {
    darkTheme,
    getDefaultConfig,
    RainbowKitProvider,
} from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import {
    QueryClientProvider,
    QueryClient,
} from "@tanstack/react-query";
import { ThemeProvider } from './theme-provider';
import { Toaster } from '@/components/ui/toaster';
import Navbar from '@/components/Navbar';
import NextTopLoader from 'nextjs-toploader';


export default function Provider({ children }) {
    const queryClient = new QueryClient();
    const config = getDefaultConfig({
        appName: 'Open Data Hub',
        projectId: "53b84ce689dd6fc6ceb9f7b7439439b5",
        chains: [
            {
                id: 997995,
                name: '5ire QA',
                nativeCurrency: { name: '5', symbol: '5', decimals: 18 },
                rpcUrls: {
                    default: {
                        http: ['https://rpc.qa.5ire.network'],
                    },
                },
            }],
        ssr: true,
    });
    return (
        <WagmiProvider config={config}>
            <QueryClientProvider client={queryClient}>
                <RainbowKitProvider modalSize='compact' theme={darkTheme()}>
                    <ThemeProvider attribute="class"
                        defaultTheme="system"
                        enableSystem
                        disableTransitionOnChange>
                        <Toaster />
                        <NextTopLoader color='#6D28D9' showSpinner={false} />
                        <div className='h-screen w-screen flex items-center px-2 flex-row'>
                            <Navbar />
                            <div className='w-full overflow-auto h-[90%] rounded-lg bg-accent/30 m-3'>
                                {children}
                            </div>
                        </div>
                    </ThemeProvider>
                </RainbowKitProvider>
            </QueryClientProvider>
        </WagmiProvider>
    )
}
