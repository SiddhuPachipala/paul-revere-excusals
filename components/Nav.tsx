import Link from 'next/link'
import { logout } from '@/app/auth/actions'

export function Nav({
  staff = false,
  admin = false,
}: {
  staff?: boolean
  admin?: boolean
}) {
  return (
    <nav className="nav">
      <div className="navin">
        <Link
          href={staff ? '/staff' : '/cadet'}
          className="brand"
        >
          <span className="brand-seal" aria-hidden="true"><span>PR</span></span>
          <span className="brand-copy"><strong>Paul Revere Battalion</strong><small>Excusal Ledger</small></span>
        </Link>

        <div className="navlinks">
          {staff ? (
            <>
              <Link href="/staff">Dashboard</Link>
              <Link href="/staff/events/new">Create Event</Link>

              {admin && (
                <Link href="/staff/users">
                  Manage Users
                </Link>
              )}
            </>
          ) : (
            <>
              <Link href="/cadet">Events</Link>
              <Link href="/cadet/requests">
                My Requests
              </Link>
            </>
          )}

          <form action={logout}>
            <button
              className="btn secondary"
              type="submit"
            >
              Sign out
            </button>
          </form>
        </div>
      </div>
    </nav>
  )
}
