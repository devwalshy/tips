# 🚀 Deploy TipJar to Fly.io

## What is Fly.io?

Fly.io is a platform that runs your full-stack application (React + Express + Database) globally. Unlike GitHub Pages, it supports:
- ✅ Node.js backend
- ✅ PostgreSQL database
- ✅ Environment variables
- ✅ Server-side processing
- ✅ All your app features

**Free tier includes:**
- 3 shared-cpu VMs
- 3GB persistent storage
- 160GB outbound data transfer

## 📋 Prerequisites

1. **Fly.io Account** (free)
   - Sign up at: https://fly.io/app/sign-up

2. **Fly.io CLI** (flyctl)
   - Install on Windows:
     ```powershell
     powershell -Command "iwr https://fly.io/install.ps1 -useb | iex"
     ```
   - Verify installation:
     ```powershell
     flyctl version
     ```

## 🚀 Quick Deploy (5 Minutes)

### Option 1: Automated Script (Recommended)

Simply run:
```powershell
.\deploy-flyio.ps1
```

This script will:
1. Check if flyctl is installed
2. Authenticate with Fly.io
3. Create the app
4. Set your Azure credentials
5. Deploy the application

### Option 2: Manual Deployment

1. **Login to Fly.io:**
   ```powershell
   flyctl auth login
   ```

2. **Create the app:**
   ```powershell
   flyctl apps create tipjar-sbux
   ```

3. **Set environment secrets:**
   ```powershell
   flyctl secrets set `
     SESSION_SECRET="your-random-secret-here" `
     AZURE_DI_KEY="2HcPcsSwlImCm4YQkKsCu1bghizqG6KBdaskDT5qoLFBDIdGbnr9JQQJ99BJACHYHv6XJ3w3AAALACOGLORC" `
     AZURE_DI_ENDPOINT="https://sbux-tips.cognitiveservices.azure.com" `
     --app tipjar-sbux
   ```

4. **Deploy:**
   ```powershell
   flyctl deploy --app tipjar-sbux
   ```

## 🌐 Your App URL

After deployment, your app will be live at:
```
https://tipjar-sbux.fly.dev
```

## 🔧 Configuration

### Environment Variables Set

Your Azure Document Intelligence credentials are automatically configured:
- ✅ `AZURE_DI_KEY` - Your Azure API key
- ✅ `AZURE_DI_ENDPOINT` - Your Azure endpoint
- ✅ `SESSION_SECRET` - Auto-generated secure secret
- ✅ `OCR_ENGINE` - Set to "auto" (tries Azure first, falls back to Tesseract)

### App Configuration (fly.toml)

```toml
app = 'tipjar-sbux'
primary_region = 'ord'  # Chicago (closest to you)

[http_service]
  internal_port = 8080
  force_https = true
  auto_stop_machines = true    # Saves money
  auto_start_machines = true   # Wakes up on request
  min_machines_running = 0     # Free tier friendly

[[vm]]
  memory = '1gb'
  cpu_kind = 'shared'
  cpus = 1
```

## 📊 What You Get

### Full Features (Unlike GitHub Pages)
- ✅ Complete React app
- ✅ Express backend
- ✅ Azure Document Intelligence OCR
- ✅ Partner management
- ✅ Distribution history
- ✅ Database storage
- ✅ All features from `run-local.ps1`

### Performance
- ⚡ Auto-scales based on traffic
- ⚡ Sleeps when not in use (free tier)
- ⚡ Wakes up in ~1 second
- ⚡ Global CDN

## 🛠️ Useful Commands

### View Logs
```powershell
flyctl logs --app tipjar-sbux
```

### Check Status
```powershell
flyctl status --app tipjar-sbux
```

### Open in Browser
```powershell
flyctl open --app tipjar-sbux
```

### View Secrets
```powershell
flyctl secrets list --app tipjar-sbux
```

### Update Secrets
```powershell
flyctl secrets set KEY=value --app tipjar-sbux
```

### SSH into Machine
```powershell
flyctl ssh console --app tipjar-sbux
```

### Scale Resources
```powershell
# Add more memory
flyctl scale memory 2048 --app tipjar-sbux

# Add more VMs
flyctl scale count 2 --app tipjar-sbux
```

## 🔄 Updating Your App

After making code changes:

1. **Commit changes:**
   ```powershell
   git add .
   git commit -m "Update app"
   ```

2. **Deploy:**
   ```powershell
   flyctl deploy --app tipjar-sbux
   ```

That's it! Fly.io will build and deploy automatically.

## 💾 Add Database (Optional)

If you want to persist data:

1. **Create PostgreSQL database:**
   ```powershell
   flyctl postgres create --name tipjar-db --app tipjar-sbux
   ```

2. **Attach to app:**
   ```powershell
   flyctl postgres attach tipjar-db --app tipjar-sbux
   ```

This automatically sets `DATABASE_URL` environment variable.

## 💰 Cost Estimate

**Free Tier:**
- ✅ 3 shared VMs (you're using 1)
- ✅ 3GB storage
- ✅ 160GB bandwidth/month
- ✅ Perfect for your use case

**If you exceed free tier:**
- Shared CPU: ~$2/month per VM
- Memory: ~$0.0000022/MB/second
- Bandwidth: ~$0.02/GB

**Estimated cost for your app:** $0-5/month

## 🐛 Troubleshooting

### App won't start?
```powershell
flyctl logs --app tipjar-sbux
```

### Need to reset secrets?
```powershell
flyctl secrets unset KEY --app tipjar-sbux
flyctl secrets set KEY=newvalue --app tipjar-sbux
```

### Want to destroy and start over?
```powershell
flyctl apps destroy tipjar-sbux
```

Then run `deploy-flyio.ps1` again.

## 📝 Files Created

- `fly.toml` - Fly.io configuration
- `Dockerfile` - Container build instructions
- `.dockerignore` - Files to exclude from build
- `deploy-flyio.ps1` - Automated deployment script

## ✅ Verification

After deployment, test these features:

1. **Visit app:** https://tipjar-sbux.fly.dev
2. **Upload image** - Test OCR with Azure
3. **Calculate tips** - Test backend calculations
4. **Check partners page** - Test database
5. **View history** - Test data persistence

## 🎯 Next Steps

1. **Run the deployment:**
   ```powershell
   .\deploy-flyio.ps1
   ```

2. **Wait 2-3 minutes** for build and deployment

3. **Visit your app:**
   ```
   https://tipjar-sbux.fly.dev
   ```

4. **Test all features** to ensure everything works

## 🆘 Need Help?

- **Fly.io Docs:** https://fly.io/docs/
- **Community Forum:** https://community.fly.io/
- **Status Page:** https://status.fly.io/

---

**Ready to deploy?** Run `.\deploy-flyio.ps1` now! 🚀
