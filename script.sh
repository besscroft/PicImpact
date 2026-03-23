#!/bin/sh

npx prisma@6.19.2 migrate deploy
npx prisma@6.19.2 db seed

HOSTNAME="0.0.0.0" node server.js
