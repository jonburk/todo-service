const fs = require('fs')

const config = {
    App: {
        db: {
            connectionString: process.env.TASK_LIST_MONGO_CONNECTION_STRING
        },
        security: {
            oauth2: {
                clientId: process.env.TASK_LIST_OAUTH_CLIENT_ID,
                clientSecret: process.env.TASK_LIST_OAUTH_CLIENT_SECRET,
                callback: process.env.TASK_LIST_URI + "/auth/google/callback"
            }
        },
        server: {
            session: {
                secret: process.env.TASK_LIST_SESSION_SECRET,
                collection: "sessions"
            },
            port: process.env.TASK_LIST_INTERNAL_PORT
        }
    }
}

try {
    fs.writeFileSync(process.argv[2], JSON.stringify(config))
} catch (err) {
    console.error(err)
    process.exit(1)
}