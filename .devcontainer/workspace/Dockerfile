FROM node:14-buster

#apt packages
RUN apt-get update -y && \
  apt-get install -y --no-install-recommends \
  git \
  ssh \
  ca-certificates \
  curl

#add ssh secret-key
COPY .ssh /root/.ssh/

#add .bashrc
COPY .bashrc /root/
RUN curl -o "/root/git-prompt.sh" https://raw.githubusercontent.com/git/git/master/contrib/completion/git-prompt.sh
