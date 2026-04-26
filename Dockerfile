# ============================================
#  Stage 1 – Prepare & Validate (build stage)
# ============================================
FROM node:22-alpine AS build

WORKDIR /app

# Copy all static source files
COPY index.html style.css app.js ./

# Lightweight validation – ensure critical files exist
RUN test -f index.html && test -f style.css && test -f app.js \
    && echo "✔  All source files present"

# ============================================
#  Stage 2 – Production (Nginx)
# ============================================
FROM nginx:1.27-alpine AS production

# Remove default Nginx static content
RUN rm -rf /usr/share/nginx/html/*

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy validated static assets from build stage
COPY --from=build /app/index.html /usr/share/nginx/html/
COPY --from=build /app/style.css  /usr/share/nginx/html/
COPY --from=build /app/app.js     /usr/share/nginx/html/

# Expose port 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost/ || exit 1

# Start Nginx in the foreground
CMD ["nginx", "-g", "daemon off;"]
