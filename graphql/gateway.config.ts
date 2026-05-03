import { createInlineSigningKeyProvider, defineConfig, extractFromHeader } from '@graphql-hive/gateway'
import dotenv from 'dotenv'

dotenv.config({ path: '../.env' })

export const gatewayConfig = defineConfig({
  jwt: {
    tokenLookupLocations: [
      extractFromHeader({ name: 'authorization', prefix: 'Bearer' })
    ],
    signingKeyProviders: [
      createInlineSigningKeyProvider(process.env.JWT_SECRET ?? '')
    ],
    tokenVerification: {
      algorithms: ['HS512']
    },
    reject: {
      missingToken: false,
      invalidToken: false
    }
  }
})
