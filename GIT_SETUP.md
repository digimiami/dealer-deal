# Git Repository Setup Guide

Quick guide to push your code to https://github.com/digimiami/dealer-deal.git

## Initial Setup

### 1. Initialize Git (if not already done)

```bash
git init
```

### 2. Add All Files

```bash
git add .
```

### 3. Create Initial Commit

```bash
git commit -m "Initial commit: Complete dealer lead generation system with AI chatbot, vehicle finder, and test drive booking"
```

### 4. Add Remote Repository

```bash
git remote add origin https://github.com/digimiami/dealer-deal.git
```

### 5. Push to GitHub

```bash
# Push to main branch
git branch -M main
git push -u origin main
```

## If Repository Already Exists

If the repository already has content, you may need to pull first:

```bash
git pull origin main --allow-unrelated-histories
# Resolve any conflicts if needed
git push -u origin main
```

## Future Updates

After making changes:

```bash
git add .
git commit -m "Description of changes"
git push origin main
```

## Branch Strategy (Optional)

For production deployments, consider using branches:

```bash
# Create and switch to development branch
git checkout -b development

# Make changes, commit
git add .
git commit -m "New feature"

# Push development branch
git push origin development

# Merge to main when ready
git checkout main
git merge development
git push origin main
```

## GitHub Actions

The repository includes GitHub Actions workflow (`.github/workflows/deploy.yml`) that will:
- Automatically build on push to main
- Deploy to Vercel (if configured)
- Or deploy to your VPS (if configured)

### Setup GitHub Secrets (for auto-deployment):

1. Go to: https://github.com/digimiami/dealer-deal/settings/secrets/actions
2. Add secrets:
   - `VERCEL_TOKEN` (if using Vercel)
   - `VERCEL_ORG_ID`
   - `VERCEL_PROJECT_ID`
   - Or VPS credentials if deploying to your server

## Troubleshooting

### Authentication Issues

If you get authentication errors:

```bash
# Use GitHub CLI (recommended)
gh auth login

# Or use personal access token
git remote set-url origin https://YOUR_TOKEN@github.com/digimiami/dealer-deal.git
```

### Large Files

If you have large files, consider using Git LFS:

```bash
git lfs install
git lfs track "*.sql"
git add .gitattributes
```

### Ignore Files

Make sure `.gitignore` is properly configured (already included).

## Next Steps After Push

1. **Set up Vercel deployment:**
   - Go to vercel.com
   - Import repository
   - Add environment variables
   - Deploy

2. **Or set up VPS deployment:**
   - See DEPLOYMENT.md
   - Configure server
   - Set up CI/CD

3. **Configure GitHub Actions:**
   - Add secrets
   - Enable workflows
   - Test deployment
