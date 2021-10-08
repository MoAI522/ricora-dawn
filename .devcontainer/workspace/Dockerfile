FROM node:14-alpine

#apt packages
RUN apk update && \
  apk add --no-cache \
  git \
  openssh \
  ca-certificates

#add ssh secret-key
COPY .ssh /root/.ssh/
