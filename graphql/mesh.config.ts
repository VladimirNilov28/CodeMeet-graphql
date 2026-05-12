import {createRenameTransform, defineConfig} from '@graphql-mesh/compose-cli'
import { loadOpenAPISubgraph } from '@omnigraph/openapi'
import * as dotenv from 'dotenv'

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
      }),
      transforms: [
        createRenameTransform({
          fieldRenamer({ typeName, fieldName }) {
            if (typeName !== 'Query') return ''
            const map: Record<string, string> = {
              getCurrentUser: 'me',
              getMyProfile: 'myProfile',
              getMyBio: 'myBio',
              getUserById: 'user',
              getUserProfileById: 'profile',
              getUserBioById: 'bio',
              getRecommendations: 'recommendations',
              getConnections: 'connections'
            }
            return map[fieldName] ?? ''
          }
        })
      ]
    }
  ]
})
