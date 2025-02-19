"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"

export function ThemeProvider({ children }) {
    return <NextThemesProvider> {children}</NextThemesProvider >
}
