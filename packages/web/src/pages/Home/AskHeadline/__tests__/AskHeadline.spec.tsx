import React from 'react'
import renderer from 'react-test-renderer'
import { env } from '@yotta/web/src/relay/createQueryRendererModern'

// @ts-ignore
import { RelayEnvironmentProvider } from '@entria/relay-experimental'

import Ask from '../index'

const Providers: React.FC = ({ children }) => (
  <RelayEnvironmentProvider environment={env}>
    <React.Suspense fallback={<div>Loading...</div>}>{children}</React.Suspense>
  </RelayEnvironmentProvider>
)

test('Loading state', () => {
  const component = renderer.create(
    <Providers>
      <Ask />
    </Providers>
  )

  expect(component).toMatchSnapshot()
})