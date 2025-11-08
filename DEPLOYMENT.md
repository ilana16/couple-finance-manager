# Deployment Guide

This document provides instructions for deploying the Couple Finance Manager application to various platforms.

## GitHub Pages (Recommended for Static Demo)

The repository is configured to automatically deploy to GitHub Pages when you push to the main branch.

### Setup Steps

1. **Enable GitHub Pages**:
   - Go to your repository on GitHub
   - Navigate to Settings → Pages
   - Under "Build and deployment", select "GitHub Actions" as the source
   - The workflow will automatically build and deploy your site

2. **Configure Secrets** (if needed):
   - Go to Settings → Secrets and variables → Actions
   - Add the following secrets:
     - `VITE_API_URL`: Your API endpoint URL
     - `VITE_OAUTH_CLIENT_ID`: Your OAuth client ID
     - Add any other required environment variables

3. **Access Your Site**:
   - After the workflow completes, your site will be available at:
   - `https://YOUR_USERNAME.github.io/couple-finance-manager/`

### Manual Deployment

If you prefer to deploy manually:

```bash
# Build the project
npm run build

# The dist/ folder contains your built site
# You can deploy this folder to any static hosting service
```

## Vercel Deployment

Vercel provides excellent support for Vite applications with zero configuration.

### Steps:

1. **Install Vercel CLI**:
```bash
npm install -g vercel
```

2. **Deploy**:
```bash
vercel
```

3. **Configure Environment Variables**:
   - Go to your project dashboard on Vercel
   - Navigate to Settings → Environment Variables
   - Add all required variables from `.env.example`

4. **Production Deployment**:
```bash
vercel --prod
```

### Vercel Configuration

Create a `vercel.json` file in the root directory:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

## Netlify Deployment

Netlify is another excellent option for deploying static sites.

### Steps:

1. **Install Netlify CLI**:
```bash
npm install -g netlify-cli
```

2. **Deploy**:
```bash
netlify deploy
```

3. **Production Deployment**:
```bash
netlify deploy --prod
```

### Netlify Configuration

Create a `netlify.toml` file in the root directory:

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[build.environment]
  NODE_VERSION = "20"
```

## AWS S3 + CloudFront

For enterprise deployments, AWS provides scalable hosting with CDN capabilities.

### Steps:

1. **Build the project**:
```bash
npm run build
```

2. **Create S3 Bucket**:
```bash
aws s3 mb s3://your-bucket-name
```

3. **Configure bucket for static website hosting**:
```bash
aws s3 website s3://your-bucket-name --index-document index.html --error-document index.html
```

4. **Upload files**:
```bash
aws s3 sync dist/ s3://your-bucket-name --delete
```

5. **Set up CloudFront** (optional but recommended):
   - Create a CloudFront distribution
   - Point it to your S3 bucket
   - Configure SSL certificate
   - Set up custom domain

## Docker Deployment

For containerized deployments, you can use Docker.

### Dockerfile

Create a `Dockerfile` in the root directory:

```dockerfile
# Build stage
FROM node:20-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### nginx.conf

```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### Build and Run

```bash
# Build the Docker image
docker build -t couple-finance-manager .

# Run the container
docker run -p 8080:80 couple-finance-manager
```

## Environment Variables

Regardless of the deployment platform, ensure you configure these environment variables:

### Required Variables
- `VITE_API_URL`: Backend API endpoint
- `VITE_OAUTH_CLIENT_ID`: OAuth client ID for authentication

### Optional Variables
- `VITE_S3_BUCKET`: S3 bucket for file uploads
- `VITE_S3_REGION`: AWS region for S3
- `VITE_YAHOO_FINANCE_API_KEY`: For investment tracking
- `VITE_EXCHANGE_RATE_API_KEY`: For currency conversion
- `VITE_ENABLE_AI_INSIGHTS`: Enable/disable AI features
- `VITE_ENABLE_MULTI_CURRENCY`: Enable/disable multi-currency support

## Post-Deployment Checklist

- [ ] Verify all pages load correctly
- [ ] Test authentication flow
- [ ] Check API connectivity
- [ ] Verify file upload functionality
- [ ] Test responsive design on mobile devices
- [ ] Check browser console for errors
- [ ] Verify SSL certificate (if using custom domain)
- [ ] Test all major features (transactions, budgets, reports)
- [ ] Monitor performance and loading times
- [ ] Set up error tracking (e.g., Sentry)
- [ ] Configure analytics (e.g., Google Analytics)

## Troubleshooting

### Build Failures
- Ensure Node.js version 18+ is installed
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Check for TypeScript errors: `npm run lint`

### Routing Issues
- Ensure your hosting platform is configured for SPA routing
- All routes should redirect to `index.html`

### API Connection Issues
- Verify environment variables are set correctly
- Check CORS configuration on your API server
- Ensure API endpoints are accessible from your deployment domain

### Performance Issues
- Enable gzip compression on your server
- Configure CDN for static assets
- Optimize images and assets
- Enable browser caching

## Monitoring and Maintenance

### Recommended Tools
- **Error Tracking**: Sentry, Rollbar
- **Analytics**: Google Analytics, Plausible
- **Performance**: Lighthouse, WebPageTest
- **Uptime Monitoring**: UptimeRobot, Pingdom

### Regular Maintenance
- Update dependencies regularly: `npm update`
- Monitor security vulnerabilities: `npm audit`
- Review and optimize bundle size
- Update documentation as features change

## Support

For deployment issues or questions:
- Check the [README.md](README.md) for general information
- Review the [IMPLEMENTATION_PLAN.md](docs/IMPLEMENTATION_PLAN.md) for feature details
- Open an issue on GitHub for specific problems

---

**Note**: This application requires a backend API to function fully. Ensure your backend is deployed and accessible before deploying the frontend.
