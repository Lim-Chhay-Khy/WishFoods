import React from 'react'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

// Most components use <Link> or useNavigate(), which only work inside a
// router. MemoryRouter is a router that lives in memory (no real URL bar).
export function renderWithRouter(ui, { route = '/' } = {}) {
  return render(<MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }} initialEntries={[route]}>{ui}</MemoryRouter>)
}
