import { redirect } from 'next/navigation'
import Link from 'next/link'

import { Nav } from '@/components/Nav'
import { createClient } from '@/lib/supabase/server'
import { changeUserRole } from './actions'

export default async function UserManagementPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: currentProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (currentProfile?.role !== 'admin') {
    redirect('/staff')
  }

  const { data: users, error } = await supabase
    .from('profiles')
    .select(`
      id,
      first_name,
      last_name,
      email,
      company,
      ms_level,
      position,
      role
    `)
    .order('last_name', { ascending: true })

  return (
    <>
      <Nav staff />

      <main className="shell">
        <section className="hero">
          <div className="eyebrow">Administration</div>
          <h1 className="h1">User management</h1>

          <p className="sub">
            Manage staff access for Paul Revere Battalion users.
          </p>
        </section>

        <div className="card tablewrap">
          <div
            className="row"
            style={{
              marginBottom: 16,
              alignItems: 'center',
            }}
          >
            <div>
              <h2 style={{ margin: 0 }}>All users</h2>
              <div className="small muted">
                {users?.length || 0} registered users
              </div>
            </div>

            <Link className="btn secondary" href="/staff">
              Back to dashboard
            </Link>
          </div>

          {error && (
            <div className="notice">
              Error loading users: {error.message}
            </div>
          )}

          {!users || users.length === 0 ? (
            <p className="muted">No users found.</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Company</th>
                  <th>MS Level</th>
                  <th>Position</th>
                  <th>Role</th>
                  <th>Access</th>
                </tr>
              </thead>

              <tbody>
                {users.map((profile) => {
                  const isCurrentUser = profile.id === user.id

                  return (
                    <tr key={profile.id}>
                      <td>
                        <b>
                          {profile.first_name || ''}{' '}
                          {profile.last_name || ''}
                        </b>

                        {isCurrentUser && (
                          <div className="small muted">
                            You
                          </div>
                        )}
                      </td>

                      <td>{profile.email || '—'}</td>

                      <td>{profile.company || '—'}</td>

                      <td>{profile.ms_level || '—'}</td>

                      <td>{profile.position || '—'}</td>

                      <td>
                        <span className={`tag ${profile.role}`}>
                          {profile.role}
                        </span>
                      </td>

                      <td>
                        {profile.role === 'admin' ? (
                          <span className="small muted">
                            Administrator
                          </span>
                        ) : profile.role === 'staff' ? (
                          <form action={changeUserRole}>
                            <input
                              type="hidden"
                              name="user_id"
                              value={profile.id}
                            />

                            <input
                              type="hidden"
                              name="role"
                              value="cadet"
                            />

                            <button
                              className="btn secondary"
                              type="submit"
                            >
                              Remove staff
                            </button>
                          </form>
                        ) : (
                          <form action={changeUserRole}>
                            <input
                              type="hidden"
                              name="user_id"
                              value={profile.id}
                            />

                            <input
                              type="hidden"
                              name="role"
                              value="staff"
                            />

                            <button
                              className="btn"
                              type="submit"
                            >
                              Grant staff
                            </button>
                          </form>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </>
  )
}
