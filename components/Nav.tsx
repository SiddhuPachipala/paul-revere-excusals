import Link from 'next/link'
import { logout } from '@/app/auth/actions'

export function Nav({ staff = false }: { staff?: boolean }) {
  return <nav className="nav"><div className="navin">
    <Link href={staff ? '/staff' : '/cadet'} className="brand">PAUL REVERE BATTALION · EXCUSALS</Link>
    <div className="navlinks">
      {staff ? <><Link href="/staff">Dashboard</Link><Link href="/staff/events/new">Create Event</Link></> : <><Link href="/cadet">Events</Link><Link href="/cadet/requests">My Requests</Link></>}
      <form action={logout}><button className="btn secondary" type="submit">Sign out</button></form>
    </div>
  </div></nav>
}
