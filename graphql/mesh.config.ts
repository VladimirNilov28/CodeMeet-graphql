import { defineConfig, loadGraphQLHTTPSubgraph } from '@graphql-mesh/compose-cli'

export const composeConfig = defineConfig({
    subgraphs: [
        {
            sourceHandler: loadGraphQLHTTPSubgraph('Countries', {
                endpoint: 'https://countries.trevorblades.com'
            })
        }
    ]
});


//TODO go throw https://the-guild.dev/graphql/mesh/v1/getting-started tutorial