import './globals.css'
import './login.css'
import './portal.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Paul Revere Battalion Excusal Portal',
  description: 'Cadet excusal request and staff approval portal',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>
}
