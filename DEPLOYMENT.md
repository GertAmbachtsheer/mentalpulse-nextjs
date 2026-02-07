# Deploying MentalPulse to Dokploy

This guide will help you deploy the MentalPulse Next.js application to your Dokploy server using Docker.

## Prerequisites

- Dokploy server set up and running
- GitHub repository access
- Convex account with deployment configured
- Clerk account with authentication configured

## Deployment Steps

### 1. Push Code to GitHub

Ensure all Docker configuration files are committed and pushed:

```bash
git add .
git commit -m "Add Docker configuration for Dokploy deployment"
git push
```

### 2. Configure Dokploy

1. **Create New Application** in Dokploy dashboard
2. **Connect Repository**: Link your GitHub repository
3. **Select Branch**: Choose `main` or your deployment branch
4. **Set Build Method**: Docker Compose

### 3. Configure Environment Variables

In Dokploy's environment variable settings, add the following:

```env
CONVEX_DEPLOYMENT=dev:quixotic-iguana-323
NEXT_PUBLIC_CONVEX_URL=https://quixotic-iguana-323.convex.cloud
NEXT_PUBLIC_CONVEX_SITE_URL=https://quixotic-iguana-323.convex.site
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_dml0YWwtd2lsZGNhdC01OC5jbGVyay5hY2NvdW50cy5kZXYk
CLERK_SECRET_KEY=sk_test_yCYLDQoqSHaV8l2FGl1hVt0LmMfkz2gVhnHMFQc4sy
CLERK_JWT_ISSUER_DOMAIN=https://vital-wildcat-58.clerk.accounts.dev
NODE_ENV=production
```

> **Note**: Use your actual production credentials for production deployments.

### 4. Deploy

1. Click **Deploy** in Dokploy dashboard
2. Monitor build logs for any errors
3. Once deployed, access your application at the provided URL

### 5. Configure Clerk Redirect URLs

After deployment, update your Clerk dashboard:

1. Go to Clerk Dashboard → Your Application → Settings
2. Add your Dokploy URL to:
   - **Authorized redirect URLs**
   - **Authorized origins**

Example:
```
https://your-app.dokploy.com
```

### 6. Verify Deployment

Test the following:
- [ ] Application loads correctly
- [ ] User authentication works (sign up/sign in)
- [ ] Mood tracking functionality
- [ ] Location services (if enabled)
- [ ] Profile page displays correctly

## Local Testing with Docker

Before deploying to Dokploy, you can test locally:

```bash
# Build the Docker image
docker-compose build

# Run the container
docker-compose up

# Access at http://localhost:3000
```

## Troubleshooting

### Build Fails

- Check that all environment variables are set correctly
- Verify `package.json` dependencies are up to date
- Review Dokploy build logs for specific errors

### Application Won't Start

- Ensure port 3000 is not blocked
- Check environment variables are loaded
- Review container logs in Dokploy dashboard

### Authentication Issues

- Verify Clerk redirect URLs include your Dokploy domain
- Check that `CLERK_SECRET_KEY` is set correctly
- Ensure `CLERK_JWT_ISSUER_DOMAIN` matches your Clerk setup

### Convex Connection Issues

- Verify `NEXT_PUBLIC_CONVEX_URL` is correct
- Check Convex deployment is active
- Ensure CORS settings in Convex allow your domain

## Updating the Application

To deploy updates:

1. Push changes to GitHub
2. Dokploy will automatically rebuild (if auto-deploy is enabled)
3. Or manually trigger deployment in Dokploy dashboard

## Health Checks

The application includes a health check endpoint. You can verify it's running:

```bash
curl https://your-app.dokploy.com/api/health
```

## Support

For issues specific to:
- **Dokploy**: Check Dokploy documentation
- **Next.js**: See Next.js deployment docs
- **Convex**: Visit Convex documentation
- **Clerk**: Check Clerk authentication guides
