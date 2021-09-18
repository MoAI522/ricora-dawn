FROM node:14-buster-slim

#apt packages
RUN apt-get update && \
  apt-get install -y --no-install-recommends \
  git \
  ca-certificates \
  && \
  apt-get -y clean

#add ssh secret-key
COPY .ssh/ /root/.ssh/
