import { defineConfig } from '@graphql-mesh/compose-cli'
import { loadOpenAPISubgraph } from '@omnigraph/openapi'
import dotenv from 'dotenv'

dotenv.config({ path: '../.env' })

export const composeConfig = defineConfig({
  subgraphs: [
    {
      sourceHandler: loadOpenAPISubgraph('REST_API', {
        source: 'http://localhost:8080/v3/api-docs',
        schemaHeaders: {
          'X-Api-Key': process.env.API_KEY ?? ''
        },
        operationHeaders: {
          'X-Api-Key': process.env.API_KEY ?? '',
          'Authorization': '{context.headers.authorization}'
        }
      })
    }
  ]
})
