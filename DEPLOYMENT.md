# Deploy MyTaskMate on Render

The repository is configured as one Render web service. Express serves both the API and the built React app, so no frontend API URL is needed in production.

1. Rotate every credential currently stored in `Backend/.env` before publishing the repository. Keep the replacement values local; `.env` files are ignored.
2. Push this project to a GitHub repository.
3. In Render, choose **New > Blueprint**, connect the repository, and apply `render.yaml`.
4. Enter the secret environment variables Render requests. Use a MongoDB URI that includes a database name.
5. After Render assigns the service URL, set `GOOGLE_CALLBACK_URL` to:

   `https://YOUR-SERVICE.onrender.com/api/auth/google/callback`

6. Add that exact URL to **Authorized redirect URIs** in the Google Cloud OAuth client. Add the Render origin (without a trailing slash) to **Authorized JavaScript origins**.
7. Redeploy after saving the Google settings.

Render checks `/api/health`. The app itself is available at the service root, and client-side routes such as `/dashboard` support direct navigation.

## Local development

Copy each `.env.example` to `.env`, add local credentials, then run `npm run dev` inside both `Backend` and `Frontend` in separate terminals.
