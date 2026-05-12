import express from 'express';
import bodyParser from 'body-parser';

import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';

const typeDefs = `#graphql
  type User {
    id: ID!
    name: String!
  }

  type Query {
    me: User
  }
`;

const resolvers = {
  Query: {
    me: () => ({
      id: '1',
      name: 'John Doe',
    }),
  },
};

async function startServer() {
  const app = express();

  // Проверяем запущен ли сервер с флагом -d
  const isDev = process.argv.includes('-d');

  const server = new ApolloServer({
    typeDefs,
    resolvers,
  });

  await server.start();

  // GraphQL API всегда доступен
  app.use(
    '/graphql',
    bodyParser.json(),
    expressMiddleware(server),
  );

  // Playground доступен только в dev режиме
  if (isDev) {
    app.get('/playground', (_req, res) => {
      res.send(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8" />
            <title>GraphQL Playground</title>

            <link
              rel="stylesheet"
              href="https://unpkg.com/graphiql/graphiql.min.css"
            />
          </head>

          <body style="margin:0;">
            <div id="graphiql" style="height:100vh;"></div>

            <script
              crossorigin
              src="https://unpkg.com/react/umd/react.development.js"
            ></script>

            <script
              crossorigin
              src="https://unpkg.com/react-dom/umd/react-dom.development.js"
            ></script>

            <script
              src="https://unpkg.com/graphiql/graphiql.min.js"
            ></script>

            <script>
              const fetcher = async (graphQLParams) => {
                const response = await fetch('/graphql', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify(graphQLParams),
                });

                return response.json();
              };

              ReactDOM.render(
                React.createElement(GraphiQL, {
                  fetcher,
                }),
                document.getElementById('graphiql')
              );
            </script>
          </body>
        </html>
      `);
    });
  }

  const PORT = 4000;

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);

    console.log(`GraphQL API: http://localhost:${PORT}/graphql`);

    if (isDev) {
      console.log(
        `Playground: http://localhost:${PORT}/playground`
      );
    }
  });
}

startServer();
