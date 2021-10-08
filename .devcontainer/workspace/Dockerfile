FROM node:14-alpine

#apt packages
RUN apk update && \
  apk add --no-cache \
  git \
  ca-certificates

#add ssh secret-key
COPY .dummy .ssh/* /root/.ssh/
