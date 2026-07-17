/**
 * LoginPage - composes AuthLayout with LoginForm + AuthArtPanel.
 *
 * Author: Kim Eduard Saludes
 * Last touched: 2026-07-07
 */

import { AuthLayout } from '../components/AuthLayout'
import { LoginForm } from '../components/LoginForm'
import { AuthArtPanel } from '../components/AuthArtPanel'

export function LoginPage() {
  return (
    <AuthLayout
      form={<LoginForm />}
      art={<AuthArtPanel />}
    />
  )
}
