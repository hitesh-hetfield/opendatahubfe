"use client"

import React from 'react'
import '@rainbow-me/rainbowkit/styles.css';
import {
    ConnectButton,
    darkTheme,
    getDefaultConfig,
    RainbowKitProvider,
} from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import {
    mainnet,
    polygon,
    optimism,
    arbitrum,
    base,
    polygonAmoy,
} from 'wagmi/chains';
import {
    QueryClientProvider,
    QueryClient,
} from "@tanstack/react-query";
import { ThemeProvider } from './theme-provider';
import { Toaster } from '@/components/ui/toaster';
import Navbar from '@/components/Navbar';


export default function Provider({ children }) {
    const queryClient = new QueryClient();
    const config = getDefaultConfig({
        appName: 'Open Data Hub',
        projectId: "53b84ce689dd6fc6ceb9f7b7439439b5",
        chains: [
            polygonAmoy,
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
                        <Navbar />
                        {children}
                    </ThemeProvider>
                </RainbowKitProvider>
            </QueryClientProvider>
        </WagmiProvider>
    )
}
