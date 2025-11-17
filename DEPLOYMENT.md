# Deployment Guide

This project is designed to run as a long-running Node.js process with full MCP integration.

## Deployment Requirements

For platforms that support long-running Node.js processes (AWS EC2, DigitalOcean, Railway, Render, etc.)

### Requirements
- Node.js 18+
- Ability to run long-running processes
- Support for stdio communication

### Environment Variables
```env
OPENAI_API_KEY=sk-your-key
CUSTOMER_API_HOST=https://your-api.com
CUSTOMER_API_TOKEN=your-token
AGENT_TONE=Professional, helpful, and efficient
CHATBOT_PORT=3000
NODE_ENV=production
```

### Deployment Steps

```bash
# 1. Build the project
yarn install
yarn build

# 2. Start the chatbot server
yarn chatbot:start

# Or with PM2
pm2 start build/chatbotServer.js --name chatbot

# Or with systemd
sudo systemctl start chatbot
```

### Features Available
- ✅ Full MCP integration
- ✅ Real customer creation via API
- ✅ Conversation history
- ✅ All chatbot features

---

## Recommended Deployment Options

### Option A: Railway.app (Easy + Full Features)
1. Push code to GitHub
2. Connect Railway to your repo
3. Add environment variables
4. Deploy - Railway will run `yarn chatbot:start`
5. Get a public URL automatically

**Pros:** Full MCP support, easy setup, automatic HTTPS
**Cons:** Paid service (free tier available)

### Option B: DigitalOcean App Platform
1. Connect your GitHub repo
2. Set build command: `yarn build`
3. Set run command: `yarn chatbot:start`
4. Add environment variables
5. Deploy

**Pros:** Full features, reliable, good pricing
**Cons:** Requires payment

### Option C: AWS EC2 + PM2
1. Launch EC2 instance
2. Install Node.js and PM2
3. Clone repo and build
4. Run with PM2: `pm2 start build/chatbotServer.js`
5. Configure nginx as reverse proxy

**Pros:** Full control, scalable, production-ready
**Cons:** More setup required, manual SSL configuration

### Option D: Render.com
1. Connect GitHub repo
2. Choose "Web Service"
3. Build: `yarn build`
4. Start: `yarn chatbot:start`
5. Add environment variables

**Pros:** Easy setup, free tier, full MCP support
**Cons:** Free tier sleeps after inactivity

---

## Environment Variables Reference

### Required for All Deployments
```env
OPENAI_API_KEY=sk-...              # OpenAI API key for GPT-4o-mini
```

### Required for Full Mode (MCP)
```env
CUSTOMER_API_HOST=https://...      # Your customer API endpoint
CUSTOMER_API_TOKEN=...             # Bearer token for API
```

### Optional
```env
AGENT_TONE=...                     # Chatbot personality (default: Professional, helpful, and efficient)
CHATBOT_PORT=3000                  # Server port (default: 3000)
NODE_ENV=production                # Environment mode
```

---

## Testing Your Deployment

### Health Check
```bash
curl https://your-domain.com/health
```

### Chat Test
```bash
curl -X POST https://your-domain.com/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello!"}'
```

---

## Performance Considerations

### Full Mode (VPS)
- Single instance can handle 100-500 concurrent users
- MCP process adds ~50MB memory overhead
- Consider horizontal scaling for > 1000 users


---

## Troubleshooting

### "MCP request timeout"
- Check MCP server is running: `ps aux | grep chatbotServer`
- Verify environment variables are set
- Check logs: `tail -f /var/log/chatbot.log`

### "OpenAI API error"
- Verify `OPENAI_API_KEY` is correct
- Check API credits/quota
- Ensure `gpt-4o-mini` access

### "Customer API error"
- Verify `CUSTOMER_API_HOST` and `CUSTOMER_API_TOKEN`
- Test API directly with curl
- Check API is reachable from deployment

---

## Monitoring

### Logs
```bash
# PM2
pm2 logs chatbot

# systemd
journalctl -u chatbot -f
```

### Metrics
- Response times
- Error rates
- OpenAI API usage
- Memory/CPU usage

---

## Security Checklist

- [ ] Environment variables not committed to git
- [ ] HTTPS enabled
- [ ] API keys rotated regularly
- [ ] CORS configured properly
- [ ] Rate limiting enabled (production)
- [ ] Error messages don't expose secrets
- [ ] Dependencies updated

---

## Cost Estimates

### OpenAI Usage (GPT-4o-mini)
- ~$0.00015 per request (average)
- 1000 requests = ~$0.15

### Hosting
- **Railway**: $5-20/month
- **Render**: Free tier available, $7+/month
- **DigitalOcean**: $6-12/month
- **AWS EC2**: $5-30/month

---

## Support

For deployment issues:
1. Check logs first
2. Verify environment variables
3. Test locally first
4. Check platform-specific documentation

---

## License

MIT
