# Quick Vercel Deployment

## ⚠️ Important Notice

**Vercel deployment has limitations:**
- ❌ MCP server cannot run (requires long-running process)
- ❌ No actual customer creation via API
- ❌ No conversation history
- ✅ Beautiful UI works perfectly  
- ✅ OpenAI conversations work

**For full functionality, use Railway, Render, or VPS deployment.** See [DEPLOYMENT.md](./DEPLOYMENT.md)

---

## Deploy to Vercel (Demo Mode)

### Step 1: Push to GitHub
```bash
git push origin main
```

### Step 2: Import to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click **"Add New Project"**
3. Import your GitHub repository: `rodrigoai/mcpNova`
4. Vercel will auto-detect the configuration

### Step 3: Configure Environment Variables

Add these in Vercel dashboard → Settings → Environment Variables:

**Required:**
```
OPENAI_API_KEY=sk-proj-...
```

**Optional:**
```
AGENT_TONE=Professional, helpful, and efficient
```

### Step 4: Deploy

- Click **"Deploy"**
- Wait for build to complete (~2-3 minutes)
- Visit your deployment URL: `https://mcp-nova-xxx.vercel.app`

---

## What Works on Vercel

✅ **Beautiful responsive UI**
✅ **Chat interface**  
✅ **OpenAI conversations**
✅ **Data collection**
✅ **Auto-deploy on push**

❌ **Customer creation** (MCP not available)
❌ **Conversation persistence**

---

## Testing Your Deployment

Open your Vercel URL and try:

```
User: Hello!
Bot: [Responds with greeting]

User: I want to register a customer
Bot: [Collects information but cannot create customer]
```

The bot will collect data but display a message about serverless limitations.

---

## Viewing Logs

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# View logs
vercel logs
```

---

## For Full Functionality

Deploy to platforms that support long-running processes:

### Option 1: Railway (Recommended - Easiest)
1. Go to [railway.app](https://railway.app)
2. Connect GitHub repo
3. Add environment variables (including CUSTOMER_API_*)
4. Deploy automatically
5. Get full MCP integration ✅

### Option 2: Render.com
1. Go to [render.com](https://render.com)
2. New Web Service → Connect repo
3. Build: `yarn build`
4. Start: `yarn chatbot:start`
5. Add all environment variables
6. Deploy ✅

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.

---

## Environment Variables for Full Deployment

```env
# Required
OPENAI_API_KEY=sk-...
CUSTOMER_API_HOST=https://your-api.com
CUSTOMER_API_TOKEN=your-bearer-token

# Optional  
AGENT_TONE=Professional, helpful, and efficient
CHATBOT_PORT=3000
NODE_ENV=production
```

---

## Cost Comparison

| Platform | Free Tier | Full MCP | Auto-Scale | Ease |
|----------|-----------|----------|------------|------|
| Vercel | ✅ Yes | ❌ No | ✅ Yes | ⭐⭐⭐⭐⭐ |
| Railway | ✅ Limited | ✅ Yes | ✅ Yes | ⭐⭐⭐⭐⭐ |
| Render | ✅ Yes | ✅ Yes | ✅ Yes | ⭐⭐⭐⭐ |
| AWS EC2 | ❌ No | ✅ Yes | ⚠️ Manual | ⭐⭐ |

---

## Troubleshooting

### Build fails on Vercel
- Check `package.json` has correct dependencies
- Ensure TypeScript compiles: `yarn build`
- Check Vercel build logs

### Chat doesn't work
- Verify `OPENAI_API_KEY` is set in Vercel
- Check browser console for errors
- Test API: `curl https://your-url.vercel.app/api/chat`

### Want customer creation to work?
- Deploy to Railway/Render instead
- See [DEPLOYMENT.md](./DEPLOYMENT.md)

---

## Next Steps

1. ✅ Deploy to Vercel for UI demo
2. ✅ Test the interface
3. 📝 Deploy to Railway for full functionality
4. 🎉 Use in production

---

## Support

- Full deployment guide: [DEPLOYMENT.md](./DEPLOYMENT.md)
- UI documentation: [UI_GUIDE.md](./UI_GUIDE.md)
- Quick start: [CHATBOT_QUICKSTART.md](./CHATBOT_QUICKSTART.md)
