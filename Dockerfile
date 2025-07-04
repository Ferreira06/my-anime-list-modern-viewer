# Stage 1: Build the application
# Use the official Node.js 20 image as a base
FROM node:20-alpine AS builder

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json to leverage Docker cache
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the Next.js application for production
RUN npm run build

# Stage 2: Create the production image
# Use a smaller, more secure base image for the final container
FROM node:20-alpine

# Set the working directory
WORKDIR /app

# Copy the built application from the 'builder' stage
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/public ./public

# Expose the port the app will run on
EXPOSE 3000

# Set the command to start the application
CMD ["npm", "start"]
