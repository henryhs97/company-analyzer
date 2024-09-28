## instructions

# Build the Docker image
#docker build -t my-react-app .

# Run the Docker container
#docker run -p 3000:3000 my-react-app

## source code:

# Use an official node image as a parent image
FROM node:16-alpine

# Set the working directory in the container
WORKDIR /app

# Copy the package.json and install dependencies
COPY package.json ./
RUN npm install

# Copy the rest of the application
COPY . ./

# Build the app for production
RUN npm run build

# Serve the app on port 3000
EXPOSE 3000
CMD ["npx", "serve", "-s", "build", "-l", "3000"]
