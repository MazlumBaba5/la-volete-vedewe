import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import AdminDashboard from './AdminDashboard'
import { ADMIN_SESSION_COOKIE, verifyAdminSession } from '@/lib/admin-auth'

export default async function AdminPage() {
  const cookieStore = await cookies()
  const session = verifyAdminSession(cookieStore.get(ADMIN_SESSION_COOKIE)?.value)

  if (!session) {
    redirect('/admin/login')
  }

  return <AdminDashboard />
}
