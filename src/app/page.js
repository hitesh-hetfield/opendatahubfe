"use client"
import { Loader2 } from 'lucide-react'
import { redirect } from 'next/navigation'
import React, { useEffect } from 'react'

export default function page() {

  useEffect(() => {
    redirect('/buy');
  }, [])

  return (
    <div className='w-screen flex items-center justify-center h-full mt-[15%]'>
      <div className="spinner">
        <Loader2 className="mr-2 h-10 w-10 animate-spin" />
      </div>
    </div>
  )
}
